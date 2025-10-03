import logging

from backend.worldguess.orm.tables import DataVersion

from .base import Job, JobStatus, RunStatusType


class SetDataVersion(Job):
    def __init__(self, name: str, dependencies: list[Job], version_hash: str) -> None:
        super().__init__(name, dependencies)
        self.version_hash = version_hash

    def run(self) -> RunStatusType:
        with self.with_pg_session() as database_session:
            data_version = DataVersion(version_hash=self.version_hash)
            database_session.add(data_version)
            database_session.commit()
            logging.info(f"Data version {self.version_hash} set")
            return JobStatus.SUCCESS
