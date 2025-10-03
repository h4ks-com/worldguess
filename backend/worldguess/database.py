from contextlib import contextmanager
from typing import Generator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from .settings import get_settings

_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        settings = get_settings()
        database_url = f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
        _engine = create_engine(
            database_url,
            pool_size=20,  # Number of persistent connections
            max_overflow=40,  # Additional connections when pool is full
            pool_timeout=5,  # Seconds to wait for connection
            pool_recycle=3600,  # Recycle connections after 1 hour
            pool_pre_ping=True,  # Verify connections before using
        )
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _session_factory


@contextmanager
def get_session_context() -> Generator[Session, None, None]:
    session_factory = get_session_factory()
    with session_factory() as session:
        yield session


def get_session() -> Session:
    session_factory = get_session_factory()
    return session_factory()
