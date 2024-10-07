from backend.worldguess.constants import PIPELINE_READYNESS_KEY

from .base import Job, JobStatus, RunStatusType


class Begin(Job):
    """Sets pending status in the cache."""

    def run(self) -> RunStatusType:
        if self.cache_set(PIPELINE_READYNESS_KEY, "pending"):
            return JobStatus.SUCCESS
        return JobStatus.FAILURE


class End(Job):
    """Sets done status in the cache."""

    def run(self) -> RunStatusType:
        if self.cache_set(PIPELINE_READYNESS_KEY, "done"):
            return JobStatus.SUCCESS
        return JobStatus.FAILURE
