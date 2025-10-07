from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class SizeClass(str, Enum):
    REGIONAL = "regional"
    COUNTRY = "country"
    CONTINENTAL = "continental"


class GuessQualification(str, Enum):
    GOOD = "good"
    MEH = "meh"
    BAD = "bad"


class GameConfig(BaseModel):
    """Configuration for a population guessing game."""

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(..., gt=0)
    size_class: SizeClass | None = None
    guess: int | None = Field(None, ge=0)


class PopulationResult(BaseModel):
    """Result of population calculation within a circle."""

    population: int
    latitude: float
    longitude: float
    radius_km: float
    size_class: SizeClass | None = None
    qualification: GuessQualification | None = None


class RandomGameResponse(BaseModel):
    """Response for random game generation."""

    game_id: str
    latitude: float
    longitude: float
    radius_km: float
    size_class: SizeClass | None = None
    share_url: str


class CreateChallengeRequest(BaseModel):
    """Request to create a challenge."""

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(..., gt=0)
    size_class: SizeClass | None = None
    webhook_url: str | None = None
    webhook_token: str | None = None
    webhook_extra_params: dict[str, Any] | None = None


class CreateChallengeResponse(BaseModel):
    """Response for challenge creation."""

    challenge_id: str
    game_id: str
    challenge_url: str


class ChallengeDetails(BaseModel):
    """Details of a challenge."""

    challenge_id: str
    game_id: str
    latitude: float
    longitude: float
    radius_km: float
    size_class: SizeClass | None = None


class SubmitGuessRequest(BaseModel):
    """Request to submit a guess for a challenge."""

    username: str = Field(..., min_length=1, max_length=50)
    guess: int = Field(..., ge=0)


class SubmitGuessResponse(BaseModel):
    """Response for guess submission."""

    success: bool
    message: str


class EndChallengeResponse(BaseModel):
    """Response for ending a challenge."""

    success: bool
    message: str
    actual_population: int
    rankings: list[dict[str, Any]]
