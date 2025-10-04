import uuid

from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_session
from ..schemas import DifficultyLevel, GameConfig, PopulationResult, RandomGameResponse
from ..settings import get_settings

router = APIRouter(tags=["game"], prefix="/game")

DIFFICULTY_RANGES = {
    DifficultyLevel.REGIONAL: (1.0, 10.0),
    DifficultyLevel.COUNTRY: (10.0, 100.0),
    DifficultyLevel.CONTINENTAL: (100.0, 2000.0),
}


def _calculate_population_in_circle(session: Session, latitude: float, longitude: float, radius_km: float) -> int:
    """Calculate total population within a circle defined by center point and
    radius."""
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
        SELECT COALESCE(SUM((ST_SummaryStats(rast)).sum), 0)::bigint AS total_population
        FROM clipped_rasters
        WHERE rast IS NOT NULL
    """)

    result = session.execute(query, {"lat": latitude, "lon": longitude, "radius_m": radius_km * 1000}).fetchone()

    return int(result[0]) if result else 0


def _get_random_land_point(session: Session) -> tuple[float, float]:
    """Get a random point on land surface (excludes oceans)."""
    query = text("""
        WITH random_part AS (
            SELECT (ST_Dump(geom)).geom AS geom
            FROM land_areas
            ORDER BY RANDOM()
            LIMIT 1
        )
        SELECT
            ST_Y(ST_PointOnSurface(geom)) AS latitude,
            ST_X(ST_PointOnSurface(geom)) AS longitude
        FROM random_part
    """)

    result = session.execute(query).fetchone()
    if not result or result[0] is None:
        raise HTTPException(status_code=500, detail="Failed to generate random land point")

    return float(result[0]), float(result[1])


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
        radius_km = float(
            session.execute(
                text("SELECT :min + random() * (:max - :min)"),
                {"min": min_radius, "max": max_radius},
            ).scalar()
        )

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


@router.get("/validate-land")
async def validate_land_point(lat: float, lon: float) -> dict[str, bool]:
    """Check if a point is on land surface (not ocean)."""
    session = get_session()
    try:
        query = text("""
            SELECT EXISTS(
                SELECT 1
                FROM land_areas
                WHERE ST_Intersects(geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))
            ) AS is_land
        """)

        result = session.execute(query, {"lat": lat, "lon": lon}).scalar()
        return {"is_land": bool(result)}
    finally:
        session.close()
