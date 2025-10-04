import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routes import main_router
from .settings import get_settings


@asynccontextmanager
async def lifespan(api: FastAPI) -> AsyncGenerator[None, None]:
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

# Add CORS middleware
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api.include_router(main_router)

static_dir = settings.STATIC_DIR
if not os.path.exists(static_dir):
    print(f"Static directory {static_dir} does not exist, make sure to build the frontend first with `npm run build`")
    exit(1)

api.mount("", StaticFiles(directory=static_dir, html=True), name="static")

logging.getLogger("uvicorn.error").setLevel(logging.WARNING)

__all__ = ["api"]

if __name__ == "__main__":
    if settings.DEBUG:
        logging.basicConfig(level=logging.DEBUG)

    uvicorn.run(
        "worldguess.api:api",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
    )
