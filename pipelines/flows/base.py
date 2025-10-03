import abc
import asyncio
import logging
import os
from contextlib import contextmanager
from enum import StrEnum, auto
from multiprocessing import Queue
from typing import Generator, Literal

import pymemcache
from dotenv import load_dotenv
from sqlalchemy import Connection, Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()

TIMEOUT = int(os.getenv("JOB_TIMEOUT", 1800))  # 30 minutes for large raster processing


class JobStatus(StrEnum):
    PENDING = auto()
    RUNNING = auto()
    SUCCESS = auto()
    FAILURE = auto()
    CANCELLED = auto()
    TIMEOUT = auto()


RunStatusType = Literal[JobStatus.SUCCESS, JobStatus.FAILURE]


class Job(abc.ABC):
    """Job that can depend on other jobs and produce a result."""

    def __init__(self, name: str, dependencies: list["Job"] | None = None):
        self.dependencies = dependencies or []
        self.name = name
        self.status = JobStatus.PENDING
        self.engine: Engine | None = None
        self._cache: pymemcache.Client | None = None

    @property
    def cache(self) -> pymemcache.Client:
        """Lazy-initialized memcached client."""
        if self._cache is None:
            self._cache = pymemcache.Client(os.getenv("MEMCACHE_SERVER", "localhost"))
        return self._cache

    def can_run(self) -> bool:
        """Check if all dependencies have run successfully."""
        return all(job.status == JobStatus.SUCCESS for job in self.dependencies)

    def dependency_failed(self) -> bool:
        """Set the status of the job to failure if a dependency failed."""
        return any(
            job.status in [JobStatus.FAILURE, JobStatus.CANCELLED, JobStatus.TIMEOUT] for job in self.dependencies
        )

    @abc.abstractmethod
    def run(self) -> RunStatusType:
        """Actual implementation."""

    def _wrap_run(self, queue: "Queue[JobStatus]") -> None:
        result = self.run()
        queue.put(result)

    async def __call__(self) -> JobStatus:
        """Waits for dependencies to be ready and run the job."""
        while not self.can_run():
            await asyncio.sleep(2)
            if self.dependency_failed():
                self.status = JobStatus.CANCELLED
                break
        else:
            logging.info(f"Running '{self.name}'")
            self.status = self.run()

        logging.info(f"'{self.name}' finished with status {self.status}")
        return self.status

    def cache_set(self, key: str, value: str) -> bool:
        """Set a key in the cache."""
        result = self.cache.set(key, value.encode())
        return result is not None and result

    def cache_get(self, key: str) -> str | None:
        """Get a key from the cache."""
        result = self.cache.get(key)
        if result is None:
            return None
        return result.decode() if isinstance(result, bytes) else result

    def create_engine(self) -> None:
        """Create a database engine."""
        if self.engine is not None:
            return
        pg_host = os.getenv("POSTGRES_HOST", "localhost")
        pg_port = os.getenv("POSTGRES_PORT", "5432")
        pg_user = os.getenv("POSTGRES_USER", "postgres")
        pg_password = os.getenv("POSTGRES_PASSWORD", "postgres")
        pg_db = os.getenv("POSTGRES_DB", "postgres")
        self.engine = create_engine(f"postgresql+psycopg2://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_db}")

    @contextmanager
    def with_pg_connection(self) -> Generator[Connection, None, None]:
        """Provide a transactional scope around a series of operations."""
        if self.engine is None:
            self.create_engine()
        if self.engine is None:
            raise ValueError("Could not create an engine")
        with self.engine.connect() as connection:
            with connection.begin():
                yield connection

    @contextmanager
    def with_pg_session(self) -> Generator[Session, None, None]:
        """Provide a transactional scope around a series of operations."""
        if self.engine is None:
            self.create_engine()
        if self.engine is None:
            raise ValueError("Could not create an engine")

        yield sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=self.engine)()
