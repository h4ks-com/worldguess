import memcache

from .settings import get_settings


def memcached() -> memcache.Client:
    return memcache.Client(get_settings().MEMCACHE_SERVER)
