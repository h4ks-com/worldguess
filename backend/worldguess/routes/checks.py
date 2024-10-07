from typing import Annotated, Literal

import pymemcache
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from worldguess.dependencies import memcached
from worldguess.settings import get_settings

router = APIRouter(tags=["checks"], prefix="/health")


@router.get("")
async def check_health():
    return {"status": "ok"}


class Status(BaseModel):
    status: Literal["ready", "not ready"]
    pipeline_status: str | None = None


@router.get("/ready", response_model=Status)
async def check_ready(
    cache: Annotated[pymemcache.Client, Depends(memcached)],
) -> Status:
    status = cache.get(get_settings().PIPELINE_READYNESS_KEY).decode()
    if status != "done":
        return Status(
            status="not ready",
            pipeline_status=status,
        )
    return Status(status="ready", pipeline_status=status)
