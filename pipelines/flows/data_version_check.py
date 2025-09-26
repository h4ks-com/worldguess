import logging

from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from backend.worldguess.orm.tables import DataVersion

from .base import Job


def has_data_version(database_session: Session, version_hash: str) -> bool:
    return database_session.scalar(
        select(exists().where(DataVersion.version_hash == version_hash))
    )


def should_skip_pipeline(job: Job, version_hash: str) -> bool:
    with job.with_pg_session() as database_session:
        exists_version = has_data_version(database_session, version_hash)
        if exists_version:
            logging.info(f"Data version {version_hash} already exists, skipping pipeline")
        return exists_version