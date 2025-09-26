import asyncio
import logging

from flows.base import JobStatus
from flows.data_version_check import should_skip_pipeline
from flows.load_population import LoadPopulation
from flows.set_data_version import SetDataVersion
from flows.set_status import Begin, End

DATA_VERSION = "1"

begin = Begin("begin")
load_population = LoadPopulation("load_population", [begin])
set_data_version = SetDataVersion("set_data_version", [load_population], DATA_VERSION)
end = End("end", [set_data_version])

flows = [begin, load_population, set_data_version, end]


logging.basicConfig(level=logging.INFO)


async def main() -> None:
    if should_skip_pipeline(begin, DATA_VERSION):
        return

    logging.info(f"Starting pipeline with data version {DATA_VERSION}")
    status = await asyncio.gather(*[flow() for flow in flows])
    if not all(status == JobStatus.SUCCESS for status in status):
        logging.error("Some flows failed")
        for flow, s in zip(flows, status):
            logging.error(f"'{flow.name}' failed with status {s}")
        return

    logging.info("All flows completed successfully")


if __name__ == "__main__":
    asyncio.run(main())
