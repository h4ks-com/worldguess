from sqlalchemy import exists, select
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from backend.worldguess.orm.tables import Base, DataVersion

from .base import Job


def has_data_version(database_session: Session, version_hash: str) -> bool:
    try:
        result = database_session.scalar(select(exists().where(DataVersion.version_hash == version_hash)))
        return bool(result)
    except ProgrammingError:
        # Table doesn't exist yet
        return False


def should_skip_pipeline(job: Job, version_hash: str) -> bool:
    with job.with_pg_session() as database_session:
        # Ensure tables exist
        database_engine = database_session.bind
        Base.metadata.create_all(bind=database_engine)

        return has_data_version(database_session, version_hash)
