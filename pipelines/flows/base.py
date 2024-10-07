import abc
import asyncio
import logging
import os
import time
from contextlib import contextmanager
from enum import StrEnum, auto
from multiprocessing import Process, Queue
from typing import Generator, Literal

import pymemcache
from dotenv import load_dotenv
from sqlalchemy import Connection, Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()

TIMEOUT = int(os.getenv("JOB_TIMEOUT", 60))


class JobStatus(StrEnum):
    PENDING = auto()
    RUNNING = auto()
    SUCCESS = auto()
    FAILURE = auto()
    CANCELLED = auto()
    TIMEOUT = auto()


class Job(abc.ABC):
    """Job that can depend on other jobs and produce a result."""

    def __init__(self, name: str, dependencies: list["Job"] | None = None):
        self.dependencies = dependencies or []
        self.name = name
        self.status = JobStatus.PENDING
        self.cache = pymemcache.Client(os.getenv("MEMCACHE_SERVER", "localhost"))
        self.engine: Engine | None = None

    def can_run(self) -> bool:
        """Check if all dependencies have run successfully."""
        return all(job.status == JobStatus.SUCCESS for job in self.dependencies)

    def dependency_failed(self) -> bool:
        """Set the status of the job to failure if a dependency failed."""
        return any(
            job.status in [JobStatus.FAILURE, JobStatus.CANCELLED, JobStatus.TIMEOUT] for job in self.dependencies
        )

    @abc.abstractmethod
    def run(self) -> Literal[JobStatus.SUCCESS, JobStatus.FAILURE]:
        """Actual implementation."""

    def _wrap_run(self, queue: Queue) -> None:
        result = self.run()
        queue.put(result)

    async def __call__(self) -> JobStatus:
        """Waits for dependencies to be ready and run the job in a separate
        process."""
        while not self.can_run():
            await asyncio.sleep(2)
            if self.dependency_failed():
                self.status = JobStatus.CANCELLED
                break
        else:
            logging.info(f"Running '{self.name}'")
            queue: Queue = Queue()
            process = Process(target=self._wrap_run, args=(queue,))
            process.start()
            start = time.time()
            while process.is_alive() and time.time() - start < TIMEOUT:
                await asyncio.sleep(1)

            if process.is_alive():
                process.terminate()
                self.status = JobStatus.TIMEOUT
            else:
                self.status = queue.get()

        logging.info(f"'{self.name}' finished with status {self.status}")
        return self.status

    def cache_set(self, key: str, value: any) -> bool | None:
        """Set a key in the cache."""
        return self.cache.set(key, value.encode())

    def cache_get(self, key: str) -> any:
        """Get a key from the cache."""
        return self.cache.get(key).decode()

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
