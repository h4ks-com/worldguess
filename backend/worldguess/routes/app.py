from fastapi import APIRouter
from fastapi.responses import RedirectResponse

router = APIRouter(tags=["app"], prefix="")


@router.get("/")
async def redirect_to_app() -> RedirectResponse:
    return RedirectResponse(url=f"{router.prefix}/index.html")
