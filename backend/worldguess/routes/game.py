from fastapi import APIRouter

from ..database import get_session
from ..queries.population_raster import PopulationStatistics, get_population_in_circle, get_population_statistics
from ..schemas import PopulationGuessRequest, PopulationGuessResponse, PopulationStatisticsResponse

router = APIRouter(tags=["game"], prefix="/game")


@router.post("/guess")
async def make_population_guess(guess_request: PopulationGuessRequest) -> PopulationGuessResponse:
    database_session = get_session()
    try:
        actual_population = get_population_in_circle(
            database_session,
            guess_request.center_latitude,
            guess_request.center_longitude,
            guess_request.radius_meters,
        )

        accuracy_percentage = (
            100.0 - (abs(actual_population - guess_request.user_guess) / max(actual_population, 1.0)) * 100.0
        )
        accuracy_percentage = max(0.0, min(100.0, accuracy_percentage))

        is_correct = accuracy_percentage >= 75.0

        return PopulationGuessResponse(
            actual_population=actual_population,
            user_guess=guess_request.user_guess,
            accuracy_percentage=accuracy_percentage,
            is_correct=is_correct,
        )
    finally:
        database_session.close()


@router.get("/statistics")
async def get_statistics() -> PopulationStatisticsResponse:
    database_session = get_session()
    try:
        stats: PopulationStatistics = get_population_statistics(database_session)
        return PopulationStatisticsResponse(
            total_cells=stats.total_tiles,
            total_population=stats.total_population,
            avg_density=stats.avg_density,
            max_density=stats.max_density,
            min_density=stats.min_density,
        )
    finally:
        database_session.close()
