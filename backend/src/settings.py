from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


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
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


@lru_cache()
def get_settings() -> Settings:
    """Settings cache helper."""
    return Settings()
