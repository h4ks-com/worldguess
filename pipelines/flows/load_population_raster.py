import logging
import os
import subprocess
import tempfile
from pathlib import Path

import requests
from sqlalchemy import create_engine, text

from .base import Job, JobStatus, RunStatusType

WORLDPOP_POPULATION_DENSITY = (
    "https://data.worldpop.org/GIS/Population/Global_2000_2020/2020/0_Mosaicked/ppp_2020_1km_Aggregated.tif"
)

PIPELINE_READYNESS_KEY = "pipeline_ready"


def format_bytes(num_bytes: int) -> str:
    size = float(num_bytes)
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size = size / 1024
    return f"{size:.1f} PB"


class LoadPopulationRaster(Job):
    def run(self) -> RunStatusType:
        try:
            tiff_path = self._download_worldpop_data()
            self._import_raster_to_postgis(tiff_path)
            self._create_spatial_indexes()

            if self.cache_set(PIPELINE_READYNESS_KEY, "done"):
                return JobStatus.SUCCESS
            return JobStatus.FAILURE

        except (OSError, requests.RequestException, RuntimeError, subprocess.CalledProcessError) as e:
            logging.error(f"LoadPopulationRaster failed: {e}")
            return JobStatus.FAILURE

    def _download_worldpop_data(self) -> Path:
        cache_dir = Path(tempfile.gettempdir()) / "worldguess_cache"
        cache_dir.mkdir(exist_ok=True)
        tiff_path = cache_dir / "worldpop_2020_1km.tif"

        if tiff_path.exists():
            logging.info(f"Using cached WorldPop data: {tiff_path}")
            return tiff_path

        logging.info("Downloading WorldPop population density data...")

        headers: dict[str, str] = {}
        if tiff_path.exists():
            headers["Range"] = f"bytes={tiff_path.stat().st_size}-"

        response = requests.get(WORLDPOP_POPULATION_DENSITY, headers=headers, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get("content-length", 0))

        downloaded_bytes = 0
        log_interval = max(1, total_size // 10)  # Log every 10%

        with open(tiff_path, "ab" if "Range" in headers else "wb") as file_handle:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    file_handle.write(chunk)
                    downloaded_bytes += len(chunk)

                    if downloaded_bytes % log_interval < len(chunk):
                        progress_percent = (downloaded_bytes / total_size) * 100
                        downloaded_formatted = format_bytes(downloaded_bytes)
                        total_formatted = format_bytes(total_size)
                        logging.info(
                            f"Download progress: {progress_percent:.1f}% ({downloaded_formatted}/{total_formatted})"
                        )

        logging.info(f"Downloaded WorldPop data to: {tiff_path}")
        return tiff_path

    def _import_raster_to_postgis(self, tiff_path: Path) -> None:
        logging.info("Importing raster data to PostGIS...")
        self._clean_existing_data()

        raster2pgsql_cmd = [
            "raster2pgsql",
            "-I",
            "-C",
            "-s",
            "4326",
            "-t",
            "256x256",
            str(tiff_path),
            "population_raster",
        ]

        logging.info(f"Running: {' '.join(raster2pgsql_cmd)}")

        raster2pgsql_process = subprocess.Popen(
            raster2pgsql_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )

        pg_host = os.getenv("POSTGRES_HOST", "localhost")
        pg_port = os.getenv("POSTGRES_PORT", "5432")
        pg_user = os.getenv("POSTGRES_USER", "postgres")
        pg_db = os.getenv("POSTGRES_DB", "postgres")

        psql_cmd = [
            "psql",
            "-h",
            pg_host,
            "-p",
            pg_port,
            "-U",
            pg_user,
            "-d",
            pg_db,
            "-q",
        ]

        env = os.environ.copy()
        env["PGPASSWORD"] = os.getenv("POSTGRES_PASSWORD", "postgres")

        logging.info(f"Piping to: {' '.join(psql_cmd)}")

        psql_process = subprocess.Popen(
            psql_cmd,
            stdin=raster2pgsql_process.stdout,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
        )

        # Close raster2pgsql stdout to allow psql to receive EOF
        if raster2pgsql_process.stdout:
            raster2pgsql_process.stdout.close()

        # Wait for both processes to complete
        psql_stdout, psql_stderr = psql_process.communicate()
        raster2pgsql_process.wait()  # Ensure raster2pgsql process is complete
        raster2pgsql_stderr = raster2pgsql_process.stderr.read() if raster2pgsql_process.stderr else ""

        # Log detailed error information for debugging
        logging.info(f"raster2pgsql return code: {raster2pgsql_process.returncode}")
        logging.info(f"psql return code: {psql_process.returncode}")

        if raster2pgsql_stderr:
            logging.error(f"raster2pgsql stderr: {raster2pgsql_stderr}")
        if psql_stderr:
            logging.error(f"psql stderr: {psql_stderr}")
        if psql_stdout:
            logging.info(f"psql stdout: {psql_stdout}")

        # Check for errors
        if raster2pgsql_process.returncode is not None and raster2pgsql_process.returncode != 0:
            raise subprocess.CalledProcessError(
                raster2pgsql_process.returncode, raster2pgsql_cmd, stderr=raster2pgsql_stderr
            )

        if psql_process.returncode is not None and psql_process.returncode != 0:
            raise subprocess.CalledProcessError(psql_process.returncode, psql_cmd, stderr=psql_stderr)

        logging.info("Successfully imported raster data to PostGIS")

    def _get_database_url(self) -> str:
        """Get database URL for connections."""
        pg_host = os.getenv("POSTGRES_HOST", "localhost")
        pg_port = os.getenv("POSTGRES_PORT", "5432")
        pg_user = os.getenv("POSTGRES_USER", "postgres")
        pg_password = os.getenv("POSTGRES_PASSWORD", "postgres")
        pg_db = os.getenv("POSTGRES_DB", "postgres")
        return f"postgresql+psycopg2://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_db}"

    def _clean_existing_data(self) -> None:
        """Drop existing raster table for consistent reruns."""
        with self.with_pg_connection() as database_connection:
            try:
                database_connection.execute(text("DROP TABLE IF EXISTS population_raster CASCADE"))
                database_connection.commit()
                logging.info("Dropped existing population_raster table")
            except Exception as e:
                logging.warning(f"Could not clean existing data: {e}")

    def _create_spatial_indexes(self) -> None:
        """Create additional spatial indexes on raster table."""
        logging.info("Creating additional spatial indexes...")

        try:
            # The raster2pgsql -I flag already creates the main spatial index
            # VACUUM ANALYZE needs to run outside transaction context
            database_url = self._get_database_url()
            engine = create_engine(database_url)

            with engine.connect() as connection:
                connection.execute(text("VACUUM ANALYZE population_raster"))

            logging.info("Completed spatial indexing and table optimization")
        except Exception as e:
            logging.warning(f"Could not create additional indexes: {e}")
