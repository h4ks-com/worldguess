import logging
import uuid
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..orm.tables import Challenge, ChallengeGuess
from ..routes.game import _calculate_population_in_circle
from ..schemas import (
    ChallengeDetails,
    CreateChallengeRequest,
    CreateChallengeResponse,
    EndChallengeResponse,
    SubmitGuessRequest,
    SubmitGuessResponse,
)
from ..settings import get_settings
from ..utils.guess_qualification import calculate_guess_qualification

router = APIRouter(tags=["challenge"], prefix="/challenge")


async def _send_webhook(url: str, data: dict[str, Any], token: str | None = None) -> None:
    """Send webhook notification asynchronously with optional Bearer token."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # Map 'channel' to 'target' for IRC bot compatibility
    if "channel" in data and "target" not in data:
        data["target"] = data.pop("channel")

    logging.info(f"Webhook: requesting {url}")
    try:
        async with httpx.AsyncClient() as client:
            await client.post(url, json=data, headers=headers, timeout=10.0)
    except Exception as e:
        logging.error(f"Failed to send webhook to {url}: {e}")


@router.post("/create")
async def create_challenge(
    request: CreateChallengeRequest,
    session: Session = Depends(get_db),
) -> CreateChallengeResponse:
    """Create a new challenge with optional webhook notifications."""
    challenge_id = str(uuid.uuid4())
    game_id = str(uuid.uuid4())

    challenge = Challenge(
        challenge_id=challenge_id,
        game_id=game_id,
        latitude=request.latitude,
        longitude=request.longitude,
        radius_km=request.radius_km,
        size_class=request.size_class.value if request.size_class else None,
        webhook_url=request.webhook_url,
        webhook_token=request.webhook_token,
        webhook_extra_params=request.webhook_extra_params or {},
    )

    session.add(challenge)
    session.commit()

    settings = get_settings()
    challenge_url = f"{settings.BASE_URL}?challengeId={challenge_id}"

    return CreateChallengeResponse(
        challenge_id=challenge_id,
        game_id=game_id,
        challenge_url=challenge_url,
    )


@router.get("/{challenge_id}")
async def get_challenge(
    challenge_id: str,
    session: Session = Depends(get_db),
) -> ChallengeDetails:
    """Get challenge details."""
    challenge = session.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return ChallengeDetails(
        challenge_id=challenge.challenge_id,
        game_id=challenge.game_id,
        latitude=challenge.latitude,
        longitude=challenge.longitude,
        radius_km=challenge.radius_km,
        size_class=challenge.size_class,
    )


@router.get("/{challenge_id}/guess/{username}")
async def get_user_guess(
    challenge_id: str,
    username: str,
    session: Session = Depends(get_db),
) -> dict[str, int | None]:
    """Check if user has already submitted a guess."""
    challenge = session.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    existing_guess = session.execute(
        select(ChallengeGuess).where(
            ChallengeGuess.challenge_id == challenge_id,
            ChallengeGuess.username == username,
        )
    ).scalar_one_or_none()

    if existing_guess:
        return {"guess": existing_guess.guess}
    return {"guess": None}


@router.post("/{challenge_id}/guess")
async def submit_guess(
    challenge_id: str,
    request: SubmitGuessRequest,
    session: Session = Depends(get_db),
) -> SubmitGuessResponse:
    """Submit a guess for a challenge."""
    challenge = session.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Check if username already submitted
    existing_guess = session.execute(
        select(ChallengeGuess).where(
            ChallengeGuess.challenge_id == challenge_id,
            ChallengeGuess.username == request.username,
        )
    ).scalar_one_or_none()

    if existing_guess:
        raise HTTPException(status_code=400, detail="Username has already submitted a guess")

    guess = ChallengeGuess(
        challenge_id=challenge_id,
        username=request.username,
        guess=request.guess,
    )

    session.add(guess)
    session.commit()

    # Send webhook notification if configured
    if challenge.webhook_url:
        webhook_data = {"message": f"{request.username} has made their guess"}
        if challenge.webhook_extra_params:
            webhook_data.update(challenge.webhook_extra_params)
        await _send_webhook(challenge.webhook_url, webhook_data, challenge.webhook_token)

    return SubmitGuessResponse(
        success=True,
        message="Guess submitted successfully",
    )


@router.post("/{challenge_id}/end")
async def end_challenge(
    challenge_id: str,
    session: Session = Depends(get_db),
) -> EndChallengeResponse:
    """End a challenge, calculate rankings, send webhooks, and cleanup."""
    challenge = session.get(Challenge, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Calculate actual population
    actual_population = _calculate_population_in_circle(
        session,
        challenge.latitude,
        challenge.longitude,
        challenge.radius_km,
    )

    # Get all guesses
    guesses = session.execute(select(ChallengeGuess).where(ChallengeGuess.challenge_id == challenge_id)).scalars().all()

    # Calculate rankings
    rankings = []
    for guess in guesses:
        difference = abs(actual_population - guess.guess)
        score = calculate_guess_qualification(actual_population, guess.guess)

        rankings.append(
            {
                "username": guess.username,
                "guess": guess.guess,
                "difference": difference,
                "score": score,
            }
        )

    # Sort by difference (closest guess first)
    rankings.sort(key=lambda x: x["difference"])

    # Cleanup: delete guesses and challenge
    session.execute(select(ChallengeGuess).where(ChallengeGuess.challenge_id == challenge_id))
    for guess in guesses:
        session.delete(guess)
    session.delete(challenge)
    session.commit()

    return EndChallengeResponse(
        success=True,
        message="Challenge ended successfully",
        actual_population=actual_population,
        rankings=rankings,
    )
