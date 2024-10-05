FROM python:3.12.2-slim-bullseye as base
RUN apt-get update && apt-get install -y curl gcc python3-dev
RUN pip install --no-cache-dir poetry==1.8.3
RUN poetry --version

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /pipeline
COPY ./pyproject.toml /poetry.lock ./
RUN touch README.md 
RUN poetry install --without dev --no-root
RUN rm -rf $POETRY_CACHE_DIR

FROM base as dev
WORKDIR /pipeline
COPY . /pipeline

CMD ["./start.sh"]
