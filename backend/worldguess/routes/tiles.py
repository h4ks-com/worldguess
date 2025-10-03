import io
import logging

import numpy as np
from fastapi import APIRouter, Request
from fastapi.responses import Response
from PIL import Image
from sqlalchemy import text

from ..database import get_engine

logger = logging.getLogger(__name__)

router = APIRouter(tags=["tiles"], prefix="/tiles")


TRANSPARENT_PNG = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"


@router.get("/population/{z}/{x}/{y}.png")
async def get_population_tile_png(z: int, x: int, y: int, request: Request) -> Response:
    """Generate PNG raster tile for population density visualization."""
    if z < 3 or z > 18:
        return Response(
            content=TRANSPARENT_PNG,
            media_type="image/png",
            headers={"Access-Control-Allow-Origin": "*"},
        )

    if await request.is_disconnected():
        logger.debug(f"Tile {z}/{x}/{y}: client disconnected before query")
        return Response(content=b"", status_code=499)

    engine = get_engine()

    # Extract raster values to generate PNG in Python
    query = text("""
        WITH tile_bounds AS (
            SELECT ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326) AS geom
        ),
        clipped_rasters AS (
            SELECT ST_Union(ST_Clip(r.rast, tb.geom, true)) AS rast
            FROM population_raster r, tile_bounds tb
            WHERE ST_Intersects(r.rast, tb.geom)
        )
        SELECT
            ST_Width(rast) as width,
            ST_Height(rast) as height,
            ST_DumpValues(rast, 1) as values
        FROM clipped_rasters
        WHERE rast IS NOT NULL;
    """)

    try:
        with engine.connect() as connection:
            # More aggressive timeout to prevent queue buildup
            connection.execute(text("SET statement_timeout = '2s'"))

            # Check disconnection before query
            if await request.is_disconnected():
                logger.debug(f"Tile {z}/{x}/{y}: client disconnected before execute")
                return Response(content=b"", status_code=499)

            result = connection.execute(query, {"z": z, "x": x, "y": y}).fetchone()

            # Check disconnection after query
            if await request.is_disconnected():
                logger.debug(f"Tile {z}/{x}/{y}: client disconnected after query")
                return Response(content=b"", status_code=499)

            if result is None:
                logger.info(f"Tile {z}/{x}/{y}: no data")
                return Response(
                    content=TRANSPARENT_PNG,
                    media_type="image/png",
                    headers={"Access-Control-Allow-Origin": "*"},
                )

            width, height, values = result

            arr = np.array(values, dtype=np.float32)
            arr_positive = np.maximum(arr, 0.001)
            arr_log = np.log10(arr_positive)

            vmin, vmax = arr_log.min(), arr_log.max()
            if vmax > vmin:
                arr_normalized = ((arr_log - vmin) / (vmax - vmin) * 255).astype(np.uint8)
            else:
                arr_normalized = np.zeros_like(arr_log, dtype=np.uint8)

            img = Image.fromarray(arr_normalized, mode="L")

            buf = io.BytesIO()
            img.save(buf, format="PNG")
            png_bytes = buf.getvalue()

            logger.info(f"Tile {z}/{x}/{y}: generated PNG {len(png_bytes)} bytes ({width}×{height})")

            return Response(
                content=png_bytes,
                media_type="image/png",
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=86400",
                },
            )
    except Exception as e:
        logger.error(f"PNG tile generation error for {z}/{x}/{y}: {e}")
        return Response(
            content=TRANSPARENT_PNG,
            media_type="image/png",
            headers={"Access-Control-Allow-Origin": "*"},
        )


@router.get("/population/{z}/{x}/{y}.mvt")
async def get_population_tile_mvt(z: int, x: int, y: int, request: Request) -> Response:
    if z < 3 or z > 18:
        return Response(content=b"", media_type="application/x-protobuf", headers={"Access-Control-Allow-Origin": "*"})

    if await request.is_disconnected():
        logger.debug(f"Tile {z}/{x}/{y}: client disconnected (MVT)")
        return Response(content=b"", status_code=499)

    engine = get_engine()

    # Extract individual pixels from raster for true 1km resolution
    query = text("""
        SELECT ST_AsMVT(tile_data, 'population', 4096, 'geom') AS mvt
        FROM (
            SELECT
                pix.val as population_density,
                ST_AsMVTGeom(
                    ST_Transform(pix.geom, 3857),
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    0,
                    true
                ) AS geom
            FROM population_raster r,
                 LATERAL ST_PixelAsPolygons(r.rast, 1) AS pix
            WHERE ST_Intersects(r.rast, ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326))
                AND pix.val > 0  -- Only include pixels with population
                AND ST_Intersects(pix.geom, ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326))
        ) AS tile_data
        WHERE geom IS NOT NULL
    """)

    try:
        with engine.connect() as connection:
            connection.execute(text("SET statement_timeout = '3s'"))

            if await request.is_disconnected():
                return Response(content=b"", status_code=499)

            result = connection.execute(query, {"z": z, "x": x, "y": y}).scalar()

            if await request.is_disconnected():
                return Response(content=b"", status_code=499)

            if result is None:
                logger.warning(f"Tile {z}/{x}/{y}: query returned None")
                return Response(
                    content=b"", media_type="application/x-protobuf", headers={"Access-Control-Allow-Origin": "*"}
                )

            if isinstance(result, memoryview):
                mvt_bytes = result.tobytes()
            elif isinstance(result, bytes):
                mvt_bytes = result
            elif hasattr(result, "data"):
                mvt_bytes = result.data
            else:
                mvt_bytes = bytes(result)

            logger.info(f"Tile {z}/{x}/{y}: generated {len(mvt_bytes)} bytes MVT")

            return Response(
                content=mvt_bytes, media_type="application/x-protobuf", headers={"Access-Control-Allow-Origin": "*"}
            )
    except Exception as e:
        logger.error(f"Tile generation error for {z}/{x}/{y}: {e}")
        return Response(content=b"", media_type="application/x-protobuf", headers={"Access-Control-Allow-Origin": "*"})
