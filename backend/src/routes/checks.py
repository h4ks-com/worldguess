from fastapi import APIRouter

router = APIRouter(tags=["checks"], prefix="/health")


@router.get("")
async def check_health():
    return {"status": "ok"}
