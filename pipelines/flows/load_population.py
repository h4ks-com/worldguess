from backend.worldguess.constants import PIPELINE_READYNESS_KEY

from .base import Job, JobStatus, RunStatusType

WORLDPOP_POPULATION_DENSITY = (
    "https://data.worldpop.org/GIS/Population/Global_2000_2020/2020/0_Mosaicked/ppp_2020_1km_Aggregated.tif"
)


class LoadPopulation(Job):
    """Sets done status in the cache."""

    def run(self) -> RunStatusType:
        if self.cache_set(PIPELINE_READYNESS_KEY, "done"):
            return JobStatus.SUCCESS
        return JobStatus.FAILURE
