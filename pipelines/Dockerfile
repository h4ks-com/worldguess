FROM python:3.12.2-slim-bullseye as base
RUN apt-get update && apt-get install -y \
    curl gcc g++ python3-dev \
    libgdal-dev libproj-dev libgeos-dev \
    libblosc-dev libhdf5-dev libnetcdf-dev \
    gdal-bin postgis \
    && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_CACHE_DIR=/tmp/uv_cache

WORKDIR /pipelines
COPY ./pipelines/pyproject.toml ./pipelines/uv.lock ./
RUN touch README.md
RUN uv sync --frozen --no-dev --no-install-project

FROM base as dev
WORKDIR /pipelines
COPY ./pipelines /pipelines
RUN rm -rf /pipelines/backend
COPY ./backend /pipelines/backend
RUN uv sync --frozen

CMD ["./start.sh"]
