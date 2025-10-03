from typing import NamedTuple

from sqlalchemy import text
from sqlalchemy.orm import Session

METERS_PER_DEGREE_LATITUDE = 111320.0


class PopulationStatistics(NamedTuple):
    total_tiles: int
    total_population: float
    avg_density: float
    max_density: float
    min_density: float


def get_population_in_circle(
    database_session: Session, center_latitude: float, center_longitude: float, radius_meters: float
) -> float:
    """Get total population within a circular area using PostGIS raster
    operations."""

    # Convert radius from meters to degrees (approximate)
    radius_degrees = radius_meters / METERS_PER_DEGREE_LATITUDE

    # Create circle geometry and clip raster, then sum population values
    query = text("""
        WITH circle_geom AS (
            SELECT ST_Buffer(
                ST_SetSRID(ST_MakePoint(:center_lng, :center_lat), 4326),
                :radius_degrees
            ) AS geom
        ),
        clipped_raster AS (
            SELECT ST_Clip(pr.rast, cg.geom) AS clipped_rast
            FROM population_raster pr, circle_geom cg
            WHERE ST_Intersects(pr.rast, cg.geom)
        )
        SELECT COALESCE(SUM((ST_SummaryStats(clipped_rast)).sum), 0.0) AS total_population
        FROM clipped_raster
        WHERE clipped_rast IS NOT NULL
    """)

    result = database_session.execute(
        query, {"center_lng": center_longitude, "center_lat": center_latitude, "radius_degrees": radius_degrees}
    ).scalar()

    return float(result or 0.0)


def get_population_statistics(database_session: Session) -> PopulationStatistics:
    """Get overall population statistics from the raster data."""

    query = text("""
        WITH raster_stats AS (
            SELECT
                COUNT(*) as total_tiles,
                ST_SummaryStats(rast) as stats
            FROM population_raster
        )
        SELECT
            total_tiles,
            (stats).sum as total_population,
            (stats).mean as avg_density,
            (stats).max as max_density,
            (stats).min as min_density
        FROM raster_stats
    """)

    result = database_session.execute(query).first()

    if not result:
        return PopulationStatistics(
            total_tiles=0,
            total_population=0.0,
            avg_density=0.0,
            max_density=0.0,
            min_density=0.0,
        )

    return PopulationStatistics(
        total_tiles=int(result.total_tiles) if result.total_tiles else 0,
        total_population=float(result.total_population) if result.total_population else 0.0,
        avg_density=float(result.avg_density) if result.avg_density else 0.0,
        max_density=float(result.max_density) if result.max_density else 0.0,
        min_density=float(result.min_density) if result.min_density else 0.0,
    )
