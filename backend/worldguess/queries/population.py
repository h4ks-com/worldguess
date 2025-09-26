from typing import NamedTuple

from geoalchemy2 import func
from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from ..orm.tables import PopulationCell

METERS_PER_DEGREE_LATITUDE = 111320.0


class PopulationStatistics(NamedTuple):
    total_cells: int
    total_population: float
    avg_density: float
    max_density: float
    min_density: float


def get_population_in_circle(
    database_session: Session, center_latitude: float, center_longitude: float, radius_meters: float
) -> float:
    circle_geometry = func.ST_Buffer(
        func.ST_SetSRID(func.ST_MakePoint(center_longitude, center_latitude), 4326),
        radius_meters / METERS_PER_DEGREE_LATITUDE,
    )

    query_result = (
        database_session.query(
            sql_func.sum(
                PopulationCell.population_density
                * func.ST_Area(func.ST_Intersection(PopulationCell.geometry, circle_geometry))
                / func.ST_Area(PopulationCell.geometry)
            )
        )
        .filter(func.ST_Intersects(PopulationCell.geometry, circle_geometry))
        .scalar()
    )

    return float(query_result or 0.0)


def get_population_statistics(database_session: Session) -> PopulationStatistics:
    statistics_result = (
        database_session.query(
            sql_func.count(PopulationCell.id).label("total_cells"),
            sql_func.sum(PopulationCell.population_density * PopulationCell.area_sqkm).label("total_population"),
            sql_func.avg(PopulationCell.population_density).label("avg_density"),
            sql_func.max(PopulationCell.population_density).label("max_density"),
            sql_func.min(PopulationCell.population_density).label("min_density"),
        )
        .filter(PopulationCell.population_density > 0)
        .first()
    )

    return PopulationStatistics(
        total_cells=int(statistics_result.total_cells) if statistics_result and statistics_result.total_cells else 0,
        total_population=float(statistics_result.total_population)
        if statistics_result and statistics_result.total_population
        else 0.0,
        avg_density=float(statistics_result.avg_density)
        if statistics_result and statistics_result.avg_density
        else 0.0,
        max_density=float(statistics_result.max_density)
        if statistics_result and statistics_result.max_density
        else 0.0,
        min_density=float(statistics_result.min_density)
        if statistics_result and statistics_result.min_density
        else 0.0,
    )
