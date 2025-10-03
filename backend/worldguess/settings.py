from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

from .constants import PIPELINE_READYNESS_KEY


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8090
    RELOAD: bool = False
    DEBUG: bool = False
    STATIC_DIR: str = "./static"
    POSTGRES_DB: str = "worldguess"
    POSTGRES_USER: str = "worldguess"
    POSTGRES_PASSWORD: str = "worldguess"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    PIPELINE_READYNESS_KEY: str = PIPELINE_READYNESS_KEY
    MEMCACHE_SERVER: str = "memcached"
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


@lru_cache()
def get_settings() -> Settings:
    """Settings cache helper."""
    return Settings()
