import json

from fastapi.openapi.utils import get_openapi

from worldguess.api import api

with open("openapi.json", "w") as output:
    json.dump(
        get_openapi(
            title=api.title,
            version=api.version,
            openapi_version=api.openapi_version,
            description=api.description,
            routes=api.routes,
        ),
        output,
    )
