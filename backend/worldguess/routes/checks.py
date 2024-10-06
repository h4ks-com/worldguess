from typing import Annotated, Literal

import memcache
from fastapi import APIRouter, Depends

from worldguess.dependencies import memcached
from worldguess.settings import get_settings

router = APIRouter(tags=["checks"], prefix="/health")


@router.get("")
async def check_health():
    return {"status": "ok"}


@router.get("/ready")
async def check_ready(
    cache: Annotated[memcache.Client, Depends(memcached)],
) -> dict[Literal["status"], Literal["ready", "not ready"]]:
    status = cache.get(get_settings().PIPELINE_READYNESS_KEY)
    if status != "done":
        return {"status": "not ready"}
    return {"status": "ready"}
