FROM python:3.12.2-slim-bullseye as base
RUN apt-get update && apt-get install -y curl gcc python3-dev
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_CACHE_DIR=/tmp/uv_cache

WORKDIR /backend

COPY ./pyproject.toml ./uv.lock ./
RUN touch README.md
RUN uv sync --frozen --no-dev
RUN rm -rf $UV_CACHE_DIR

FROM base as dev
WORKDIR /backend
COPY . /backend

ENTRYPOINT ["uv", "run", "python3", "-m", "worldguess.api"]
