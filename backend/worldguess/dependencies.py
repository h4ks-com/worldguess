import pymemcache

from .settings import get_settings


def memcached() -> pymemcache.Client:
    return pymemcache.Client(get_settings().MEMCACHE_SERVER)
