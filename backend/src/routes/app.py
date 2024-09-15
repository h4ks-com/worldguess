from fastapi import APIRouter
from fastapi.responses import RedirectResponse

router = APIRouter(tags=["app"], prefix="")


@router.get("/")
async def redirect_to_app():
    return RedirectResponse(url=f"{router.prefix}/index.html")
