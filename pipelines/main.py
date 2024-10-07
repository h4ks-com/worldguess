import asyncio
import logging

from flows.base import JobStatus
from flows.set_status import Begin, End

begin = Begin("begin")
end = End("end", [begin])

flows = [begin, end]


logging.basicConfig(level=logging.INFO)


async def main():
    status = await asyncio.gather(*[flow() for flow in flows])
    if not all(status == JobStatus.SUCCESS for status in status):
        logging.error("Some flows failed")
        for flow, status in zip(flows, status):
            logging.error(f"'{flow.name}' failed with status {status}")
        return

    logging.info("All flows completed successfully")


if __name__ == "__main__":
    asyncio.run(main())
