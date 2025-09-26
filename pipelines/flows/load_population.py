import logging
import tempfile
from pathlib import Path

import geopandas as gpd
import rasterio
import rasterio.features
import requests
from shapely.geometry import Polygon
from sqlalchemy import text
from tqdm import tqdm

from backend.worldguess.orm.tables import Base

from .base import Job, JobStatus, RunStatusType

WORLDPOP_POPULATION_DENSITY = (
    "https://data.worldpop.org/GIS/Population/Global_2000_2020/2020/0_Mosaicked/ppp_2020_1km_Aggregated.tif"
)

PIPELINE_READYNESS_KEY = "pipeline_ready"
CHUNK_SIZE = 1000
BATCH_SIZE = 10000


class LoadPopulation(Job):
    """Downloads WorldPop GeoTIFF and converts to PostGIS population polygon
    cells."""

    def run(self) -> RunStatusType:
        try:
            tiff_path = self._download_worldpop_data()
            self._process_raster_to_polygons(tiff_path)
            self._create_spatial_indexes()

            if self.cache_set(PIPELINE_READYNESS_KEY, "done"):
                return JobStatus.SUCCESS
            return JobStatus.FAILURE

        except (OSError, requests.RequestException, RuntimeError) as e:
            logging.error(f"LoadPopulation failed: {e}")
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

        with open(tiff_path, "ab" if "Range" in headers else "wb") as file_handle:
            with tqdm(total=total_size, unit="B", unit_scale=True, desc="Downloading") as progress_bar:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        file_handle.write(chunk)
                        progress_bar.update(len(chunk))

        logging.info(f"Downloaded WorldPop data to: {tiff_path}")
        return tiff_path

    def _process_raster_to_polygons(self, tiff_path: Path) -> None:
        logging.info("Processing raster data to polygons...")

        with rasterio.open(tiff_path) as dataset:
            self._create_tables()

            raster_height, raster_width = dataset.height, dataset.width
            raster_transform = dataset.transform

            total_chunks = ((raster_height + CHUNK_SIZE - 1) // CHUNK_SIZE) * (
                (raster_width + CHUNK_SIZE - 1) // CHUNK_SIZE
            )

            with tqdm(total=total_chunks, desc="Processing chunks") as progress_bar:
                polygon_batch: list[dict[str, float | Polygon]] = []

                for row_start in range(0, raster_height, CHUNK_SIZE):
                    for col_start in range(0, raster_width, CHUNK_SIZE):
                        chunk_polygons = self._process_chunk(
                            dataset, row_start, col_start, CHUNK_SIZE, raster_transform
                        )
                        polygon_batch.extend(chunk_polygons)

                        if len(polygon_batch) >= BATCH_SIZE:
                            self._insert_polygon_batch(polygon_batch)
                            polygon_batch = []

                        progress_bar.update(1)

                if polygon_batch:
                    self._insert_polygon_batch(polygon_batch)

    def _process_chunk(
        self,
        dataset: rasterio.DatasetReader,
        row_start: int,
        col_start: int,
        chunk_size: int,
        raster_transform: rasterio.Affine,
    ) -> list[dict[str, float | Polygon]]:
        row_end = min(row_start + chunk_size, dataset.height)
        col_end = min(col_start + chunk_size, dataset.width)

        raster_window = rasterio.windows.Window(col_start, row_start, col_end - col_start, row_end - row_start)
        chunk_data = dataset.read(1, window=raster_window)
        chunk_transform = rasterio.windows.transform(raster_window, raster_transform)

        polygon_features: list[dict[str, float | Polygon]] = []

        for geometry, population_value in rasterio.features.shapes(chunk_data, transform=chunk_transform):
            if population_value > 0:
                polygon = Polygon(geometry["coordinates"][0])
                area_sqkm = self._calculate_area_sqkm(polygon)

                polygon_features.append(
                    {"geometry": polygon, "population_density": float(population_value), "area_sqkm": area_sqkm}
                )

        return polygon_features

    def _calculate_area_sqkm(self, polygon: Polygon) -> float:
        polygon_bounds = polygon.bounds
        longitude_diff = float(polygon_bounds[2] - polygon_bounds[0])
        latitude_diff = float(polygon_bounds[3] - polygon_bounds[1])

        approximate_area = abs(longitude_diff * latitude_diff) * 111.32 * 111.32
        return max(approximate_area, 1.0)

    def _create_tables(self) -> None:
        with self.with_pg_connection() as database_connection:
            Base.metadata.create_all(bind=database_connection)

    def _insert_polygon_batch(self, polygon_data: list[dict[str, float | Polygon]]) -> None:
        if not polygon_data:
            return

        geodataframe = gpd.GeoDataFrame(polygon_data, crs="EPSG:4326")

        with self.with_pg_session() as database_session:
            database_engine = database_session.bind
            geodataframe.to_postgis(
                "population_cells",
                database_engine,
                if_exists="append",
                index=False,
                dtype={"geometry": "geometry"},
            )

    def _create_spatial_indexes(self) -> None:
        with self.with_pg_connection() as database_connection:
            database_connection.execute(
                text(
                    """
                CREATE INDEX IF NOT EXISTS idx_population_cells_geom
                ON population_cells USING GIST (geometry)
            """
                )
            )

            database_connection.execute(
                text(
                    """
                CREATE INDEX IF NOT EXISTS idx_population_cells_density
                ON population_cells (population_density)
            """
                )
            )

            database_connection.execute(text("VACUUM ANALYZE population_cells"))

        logging.info("Created spatial indexes and optimized tables")
