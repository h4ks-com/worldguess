from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

router = APIRouter(tags=["app"], prefix="")


@router.get("/")
async def redirect_to_app(request: Request) -> RedirectResponse:
    # Preserve query parameters when redirecting
    query_params = str(request.url.query)
    redirect_url = f"{router.prefix}/index.html"
    if query_params:
        redirect_url += f"?{query_params}"
    return RedirectResponse(url=redirect_url)
