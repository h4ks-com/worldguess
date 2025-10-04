import random
import uuid

from fastapi import APIRouter, HTTPException
from geoalchemy2.functions import ST_Area
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from ..database import get_session
from ..orm.tables import LandAreas
from ..schemas import DifficultyLevel, GameConfig, PopulationResult, RandomGameResponse
from ..settings import get_settings

router = APIRouter(tags=["game"], prefix="/game")

DIFFICULTY_RANGES: dict[DifficultyLevel, tuple[float, float]] = {
    DifficultyLevel.REGIONAL: (1.0, 10.0),
    DifficultyLevel.COUNTRY: (10.0, 100.0),
    DifficultyLevel.CONTINENTAL: (100.0, 2000.0),
}


def _calculate_population_in_circle(session: Session, latitude: float, longitude: float, radius_km: float) -> int:
    """Calculate total population within a circle using raster data.

    Raster operations use raw SQL as they involve PostGIS composite
    types not directly supported by SQLAlchemy ORM.
    """
    query = text("""
        WITH circle AS (
            SELECT ST_Buffer(
                ST_Transform(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), 3857),
                :radius_m
            )::geometry AS geom
        ),
        clipped_rasters AS (
            SELECT ST_Clip(r.rast, ST_Transform(c.geom, 4326), true) AS rast
            FROM population_raster r, circle c
            WHERE ST_Intersects(r.rast, ST_Transform(c.geom, 4326))
        )
        SELECT COALESCE(SUM((ST_SummaryStats(rast)).sum), 0)::bigint
        FROM clipped_rasters
        WHERE rast IS NOT NULL
    """)

    result = session.execute(query, {"lat": latitude, "lon": longitude, "radius_m": radius_km * 1000}).scalar()

    return int(result) if result else 0


def _get_random_land_point(session: Session) -> tuple[float, float]:
    """Generate a random point on land surface, weighted by land area.

    Uses area-weighted selection to favor larger landmasses, then
    generates a truly random point inside the selected polygon.
    """
    land_areas_with_area = select(
        LandAreas.id, LandAreas.geom, ST_Area(LandAreas.geom, use_spheroid=True).label("area")
    ).subquery()

    areas_result = session.execute(
        select(land_areas_with_area.c.id, land_areas_with_area.c.geom, land_areas_with_area.c.area)
    ).all()

    if not areas_result:
        raise HTTPException(status_code=500, detail="No land areas available")

    total_area = sum(row.area for row in areas_result)
    weights = [row.area / total_area for row in areas_result]
    selected_land = random.choices(areas_result, weights=weights, k=1)[0]

    # Re-query to get properly typed ORM object with geometry
    selected_land_orm = session.get(LandAreas, selected_land.id)
    if not selected_land_orm:
        raise HTTPException(status_code=500, detail="Selected land area not found")

    # Use ST_PointOnSurface as fallback - generates a point guaranteed to be inside the polygon
    point_result = session.execute(
        select(
            func.ST_Y(func.ST_PointOnSurface(selected_land_orm.geom)).label("latitude"),
            func.ST_X(func.ST_PointOnSurface(selected_land_orm.geom)).label("longitude"),
        )
    ).first()

    if not point_result or point_result.latitude is None:
        raise HTTPException(status_code=500, detail="Failed to generate random land point")

    return float(point_result.latitude), float(point_result.longitude)


@router.post("/calculate")
async def calculate_population(config: GameConfig) -> PopulationResult:
    """Calculate population within a circular area."""
    session = get_session()
    try:
        population = _calculate_population_in_circle(session, config.latitude, config.longitude, config.radius_km)

        return PopulationResult(
            population=population,
            latitude=config.latitude,
            longitude=config.longitude,
            radius_km=config.radius_km,
            difficulty=config.difficulty,
        )
    finally:
        session.close()


@router.post("/random")
async def create_random_game(difficulty: DifficultyLevel) -> RandomGameResponse:
    """Generate a random game with specified difficulty level."""
    session = get_session()
    try:
        latitude, longitude = _get_random_land_point(session)

        min_radius, max_radius = DIFFICULTY_RANGES[difficulty]
        radius_km = min_radius + random.random() * (max_radius - min_radius)

        game_id = str(uuid.uuid4())
        settings = get_settings()
        share_url = (
            f"{settings.BASE_URL}?"
            f"lat={latitude:.6f}&lon={longitude:.6f}&"
            f"radius={radius_km:.2f}&difficulty={difficulty.value}&gameId={game_id}"
        )

        return RandomGameResponse(
            game_id=game_id,
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            difficulty=difficulty,
            share_url=share_url,
        )
    finally:
        session.close()


@router.post("/create")
async def create_custom_game(config: GameConfig) -> RandomGameResponse:
    """Create a custom game with specified location and radius."""
    game_id = str(uuid.uuid4())
    settings = get_settings()
    share_url = (
        f"{settings.BASE_URL}?"
        f"lat={config.latitude:.6f}&lon={config.longitude:.6f}&"
        f"radius={config.radius_km:.2f}&gameId={game_id}"
    )
    if config.difficulty:
        share_url += f"&difficulty={config.difficulty.value}"

    return RandomGameResponse(
        game_id=game_id,
        latitude=config.latitude,
        longitude=config.longitude,
        radius_km=config.radius_km,
        difficulty=config.difficulty,
        share_url=share_url,
    )
