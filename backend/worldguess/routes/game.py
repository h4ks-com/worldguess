import random
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from ..database import get_db
from ..orm.tables import LandAreas
from ..schemas import GameConfig, PopulationResult, RandomGameResponse, SizeClass
from ..settings import get_settings

router = APIRouter(tags=["game"], prefix="/game")

SIZE_CLASS_RANGES: dict[SizeClass, tuple[float, float]] = {
    SizeClass.REGIONAL: (1.0, 10.0),
    SizeClass.COUNTRY: (10.0, 100.0),
    SizeClass.CONTINENTAL: (100.0, 2000.0),
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
    """Generate a random point on land surface.

    Natural Earth 10m data contains one mega-polygon with all major
    landmasses plus small island fragments. We filter out invalid/tiny
    polygons and primarily use the main landmass polygon for diverse
    random point generation. Antarctica and Greenland are blacklisted.
    """
    # Filter out invalid polygons (area < 1000 km²) and get valid land areas
    # ST_Area with second parameter True uses spheroid calculation
    areas_result = session.execute(
        select(LandAreas.id, LandAreas.geom).where(func.ST_Area(LandAreas.geom, True) > 1_000_000_000)  # > 1000 km²
    ).all()

    if not areas_result:
        raise HTTPException(status_code=500, detail="No valid land areas available")

    # Retry until we get a point outside blacklisted regions
    max_region_attempts = 50
    for region_attempt in range(max_region_attempts):
        # For Natural Earth data, prioritize the main landmass polygon (largest area)
        # but occasionally use islands for variety
        if len(areas_result) > 1 and random.random() < 0.9:
            # 90% of time: use the largest polygon (main landmass)
            selected_land = max(
                areas_result, key=lambda row: session.execute(select(func.ST_Area(row.geom, True))).scalar()
            )
        else:
            # 10% of time: random selection from all valid polygons
            selected_land = random.choice(areas_result)

        # Re-query to get properly typed ORM object with geometry
        selected_land_orm = session.get(LandAreas, selected_land.id)
        if not selected_land_orm:
            raise HTTPException(status_code=500, detail="Selected land area not found")

        # Get bounding box of the selected polygon
        bbox = session.execute(
            select(
                func.ST_XMin(selected_land_orm.geom).label("xmin"),
                func.ST_YMin(selected_land_orm.geom).label("ymin"),
                func.ST_XMax(selected_land_orm.geom).label("xmax"),
                func.ST_YMax(selected_land_orm.geom).label("ymax"),
            )
        ).first()

        if not bbox:
            raise HTTPException(status_code=500, detail="Failed to get polygon bounds")

        # Generate random points in bounding box until one is inside the polygon
        # Most land polygons are relatively compact, so this should succeed quickly
        max_point_attempts = 100
        for _ in range(max_point_attempts):
            lon = bbox.xmin + random.random() * (bbox.xmax - bbox.xmin)
            lat = bbox.ymin + random.random() * (bbox.ymax - bbox.ymin)

            # Blacklist: Skip Antarctica (< -60°) and Greenland (59-83°N, -73 to -12°W)
            if lat < -60:  # Antarctica
                continue
            if 59 <= lat <= 83 and -73 <= lon <= -12:  # Greenland
                continue

            # Check if point is inside polygon
            is_inside = session.execute(
                select(func.ST_Contains(selected_land_orm.geom, func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)))
            ).scalar()

            if is_inside:
                return float(lat), float(lon)

        # If we exhausted point attempts, this polygon is likely entirely in a blacklisted region
        # Continue to next region_attempt to select a different polygon

    # Fallback to PointOnSurface if random sampling fails (unlikely)
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
async def calculate_population(
    config: GameConfig,
    session: Session = Depends(get_db),
) -> PopulationResult:
    """Calculate population within a circular area."""
    population = _calculate_population_in_circle(session, config.latitude, config.longitude, config.radius_km)

    return PopulationResult(
        population=population,
        latitude=config.latitude,
        longitude=config.longitude,
        radius_km=config.radius_km,
        size_class=config.size_class,
    )


@router.post("/random")
async def create_random_game(
    size_class: SizeClass,
    session: Session = Depends(get_db),
) -> RandomGameResponse:
    """Generate a random game with specified size class."""
    latitude, longitude = _get_random_land_point(session)

    min_radius, max_radius = SIZE_CLASS_RANGES[size_class]
    radius_km = min_radius + random.random() * (max_radius - min_radius)

    game_id = str(uuid.uuid4())
    settings = get_settings()
    share_url = (
        f"{settings.BASE_URL}?"
        f"lat={latitude:.6f}&lon={longitude:.6f}&"
        f"radius={radius_km:.2f}&size_class={size_class.value}&gameId={game_id}"
    )

    return RandomGameResponse(
        game_id=game_id,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        size_class=size_class,
        share_url=share_url,
    )


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
    if config.size_class:
        share_url += f"&size_class={config.size_class.value}"

    return RandomGameResponse(
        game_id=game_id,
        latitude=config.latitude,
        longitude=config.longitude,
        radius_km=config.radius_km,
        size_class=config.size_class,
        share_url=share_url,
    )
