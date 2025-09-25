FROM python:3.12.2-slim-bullseye as base
RUN apt-get update && apt-get install -y curl gcc python3-dev
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_CACHE_DIR=/tmp/uv_cache

WORKDIR /pipelines
COPY ./pipelines/pyproject.toml ./pipelines/uv.lock ./
RUN touch README.md
RUN uv sync --frozen --no-dev
RUN rm -rf $UV_CACHE_DIR

FROM base as dev
WORKDIR /pipelines
COPY ./pipelines /pipelines
RUN rm -rf /pipelines/backend
COPY ./backend /pipelines/backend

CMD ["./start.sh"]
