import asyncio
import logging

from flows.base import JobStatus
from flows.data_version_check import should_skip_pipeline
from flows.load_population_raster import LoadPopulationRaster
from flows.set_data_version import SetDataVersion
from flows.set_status import Begin, End

DATA_VERSION = "1"

begin = Begin("begin")
load_population = LoadPopulationRaster("load_population", [begin])
set_data_version = SetDataVersion("set_data_version", [load_population], DATA_VERSION)
end = End("end", [set_data_version])

flows = [begin, load_population, set_data_version, end]


logging.basicConfig(level=logging.INFO)


async def main() -> None:
    data_exists = should_skip_pipeline(begin, DATA_VERSION)

    if data_exists:
        logging.info(f"Data version {DATA_VERSION} already exists, setting ready status")
        # Create simple jobs without dependencies for cache status update
        simple_begin = Begin("status_begin")
        simple_end = End("status_end")
        flows_to_run = [simple_begin, simple_end]
    else:
        logging.info(f"Starting pipeline with data version {DATA_VERSION}")
        flows_to_run = flows

    status = await asyncio.gather(*[flow() for flow in flows_to_run])
    if not all(status == JobStatus.SUCCESS for status in status):
        logging.error("Some flows failed")
        for flow, s in zip(flows_to_run, status):
            logging.error(f"'{flow.name}' failed with status {s}")
        return

    logging.info("All flows completed successfully")


if __name__ == "__main__":
    asyncio.run(main())
