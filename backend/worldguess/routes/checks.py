from typing import Annotated, Literal

import pymemcache
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from worldguess.dependencies import memcached
from worldguess.settings import get_settings

router = APIRouter(tags=["checks"], prefix="/health")


@router.get("")
async def check_health() -> dict[str, str]:
    return {"status": "ok"}


class Status(BaseModel):
    status: Literal["ready", "not ready"]
    pipeline_status: str | None = None


@router.get("/ready", response_model=Status)
async def check_ready(
    cache: Annotated[pymemcache.Client, Depends(memcached)],
) -> Status:
    cached_status = cache.get(get_settings().PIPELINE_READYNESS_KEY)
    if cached_status is None:
        return Status(
            status="not ready",
            pipeline_status="pipeline not started",
        )

    status = cached_status.decode()
    if status != "done":
        return Status(
            status="not ready",
            pipeline_status=status,
        )
    return Status(status="ready", pipeline_status=status)
