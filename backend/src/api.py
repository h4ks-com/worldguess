import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .routes import main_router
from .settings import get_settings


@asynccontextmanager
async def lifespan(api: FastAPI):
    try:
        yield
    finally:
        pass


settings = get_settings()

api = FastAPI(
    title="Worldguess API",
    description="Simple API for fetching geojson and map tiles",
    version="0.0.1",
    lifespan=lifespan,
)

api.include_router(main_router)

if settings.DEBUG:
    static_dir = "../frontend/build/"
    if not os.path.exists(static_dir):
        print(
            f"Static directory {static_dir} does not exist, make sure to build the frontend first with `npm run build`"
        )
        exit(1)
else:
    static_dir = "/static"

api.mount("", StaticFiles(directory=static_dir), name="static")

logging.getLogger("uvicorn.error").setLevel(logging.WARNING)

__all__ = ["api"]

if __name__ == "__main__":
    if settings.DEBUG:
        logging.basicConfig(level=logging.DEBUG)

    uvicorn.run(
        "src.api:api",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
    )
