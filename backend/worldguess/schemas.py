from enum import Enum

from pydantic import BaseModel, Field


class DifficultyLevel(str, Enum):
    REGIONAL = "regional"
    COUNTRY = "country"
    CONTINENTAL = "continental"


class GameConfig(BaseModel):
    """Configuration for a population guessing game."""

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(..., gt=0)
    difficulty: DifficultyLevel | None = None


class PopulationResult(BaseModel):
    """Result of population calculation within a circle."""

    population: int
    latitude: float
    longitude: float
    radius_km: float
    difficulty: DifficultyLevel | None = None


class RandomGameResponse(BaseModel):
    """Response for random game generation."""

    game_id: str
    latitude: float
    longitude: float
    radius_km: float
    difficulty: DifficultyLevel | None = None
    share_url: str
