import asyncio
import logging

from flows.base import JobStatus
from flows.load_population import LoadPopulation
from flows.set_status import Begin, End

begin = Begin("begin")
load_population = LoadPopulation("load_population", [begin])
end = End("end", [load_population])

flows = [begin, load_population, end]


logging.basicConfig(level=logging.INFO)


async def main() -> None:
    status = await asyncio.gather(*[flow() for flow in flows])
    if not all(status == JobStatus.SUCCESS for status in status):
        logging.error("Some flows failed")
        for flow, s in zip(flows, status):
            logging.error(f"'{flow.name}' failed with status {s}")
        return

    logging.info("All flows completed successfully")


if __name__ == "__main__":
    asyncio.run(main())
