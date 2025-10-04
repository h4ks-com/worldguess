import logging
import os
import zipfile
from pathlib import Path

import requests
from sqlalchemy import text

from .base import Job, JobStatus, RunStatusType

logging.basicConfig(level=logging.INFO)

# Natural Earth land polygons (1:10m resolution, best quality)
NATURAL_EARTH_LAND_URL = "https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_land.zip"
PIPELINE_READYNESS_KEY = "land_pipeline_ready"


class LoadLandAreas(Job):
    def run(self) -> RunStatusType:
        try:
            shapefile_path = self._download_land_data()
            self._import_to_postgis(shapefile_path)
            self._create_spatial_indexes()

            if self.cache_set(PIPELINE_READYNESS_KEY, "done"):
                return JobStatus.SUCCESS
            return JobStatus.FAILURE
        except Exception as e:
            logging.error(f"Failed to load land areas: {e}")
            return JobStatus.FAILURE

    def _download_land_data(self) -> Path:
        """Download Natural Earth land polygons."""
        download_dir = Path("/tmp/worldguess")
        download_dir.mkdir(exist_ok=True)

        zip_path = download_dir / "ne_10m_land.zip"
        extract_dir = download_dir / "ne_10m_land"

        if extract_dir.exists() and any(extract_dir.glob("*.shp")):
            logging.info("Land data already downloaded")
            return extract_dir

        logging.info(f"Downloading land data from {NATURAL_EARTH_LAND_URL}")
        response = requests.get(NATURAL_EARTH_LAND_URL, stream=True, timeout=300)
        response.raise_for_status()

        with open(zip_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        logging.info("Extracting land data...")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(extract_dir)

        logging.info(f"Land data extracted to: {extract_dir}")
        return extract_dir

    def _import_to_postgis(self, shapefile_dir: Path) -> None:
        """Import land polygons to PostGIS using ogr2ogr."""
        logging.info("Importing land polygons to PostGIS...")

        self.create_engine()
        if self.engine is None:
            raise ValueError("Could not create database engine")

        with self.engine.connect() as connection:
            connection.execute(text("DROP TABLE IF EXISTS land_areas CASCADE"))
            connection.commit()

        shapefile = next(shapefile_dir.glob("*.shp"))
        logging.info(f"Found shapefile: {shapefile}")

        pg_host = os.getenv("POSTGRES_HOST", "localhost")
        pg_port = os.getenv("POSTGRES_PORT", "5432")
        pg_user = os.getenv("POSTGRES_USER", "postgres")
        pg_password = os.getenv("POSTGRES_PASSWORD", "postgres")
        pg_db = os.getenv("POSTGRES_DB", "postgres")

        connection_string = f"PG:host={pg_host} port={pg_port} dbname={pg_db} user={pg_user} password={pg_password}"

        ogr2ogr_cmd = [
            "ogr2ogr",
            "-f",
            "PostgreSQL",
            connection_string,
            str(shapefile),
            "-nln",
            "land_areas",
            "-lco",
            "GEOMETRY_NAME=geom",
            "-lco",
            "FID=id",
            "-nlt",
            "MULTIPOLYGON",
            "-t_srs",
            "EPSG:4326",
            "-overwrite",
        ]

        logging.info(f"Running: {' '.join(ogr2ogr_cmd)}")

        import subprocess

        result = subprocess.run(ogr2ogr_cmd, capture_output=True, text=True, check=False)

        if result.returncode != 0:
            logging.error(f"ogr2ogr failed: {result.stderr}")
            raise RuntimeError(f"Failed to import land areas: {result.stderr}")

        logging.info("Land polygons imported successfully")

    def _create_spatial_indexes(self) -> None:
        """Create spatial indexes for efficient querying."""
        logging.info("Creating spatial indexes...")

        self.create_engine()
        if self.engine is None:
            raise ValueError("Could not create database engine")

        with self.engine.connect() as connection:
            connection.execute(text("CREATE INDEX IF NOT EXISTS land_areas_geom_idx ON land_areas USING GIST (geom)"))
            connection.commit()

        logging.info("Spatial indexes created")
