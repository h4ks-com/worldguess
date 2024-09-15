from fastapi.routing import APIRouter

from .app import router as app_router
from .checks import router as checks_router

v1_router = APIRouter(prefix="/v1")
main_router = APIRouter()

v1_router.include_router(checks_router)
main_router.include_router(app_router)

__all__ = ["main_router"]
