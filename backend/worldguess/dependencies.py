import logging

import pymemcache

from .settings import get_settings

logger = logging.getLogger(__name__)


class DummyMemcachedClient:
    """Fallback client when memcached is unavailable."""

    def get(self, key: str) -> None:
        return None

    def set(self, key: str, value: str, expire: int = 0) -> bool:
        return True

    def version(self) -> bytes:
        return b"1.0.0"


def memcached() -> pymemcache.Client | DummyMemcachedClient:
    """Get memcached client or fallback dummy client if unavailable."""
    try:
        client = pymemcache.Client(
            get_settings().MEMCACHE_SERVER,
            timeout=1.0,
            connect_timeout=1.0,
        )
        client.get("test")
        return client
    except (ConnectionRefusedError, TimeoutError, OSError) as e:
        logger.warning(f"Memcached unavailable, using dummy client: {e}")
        return DummyMemcachedClient()
