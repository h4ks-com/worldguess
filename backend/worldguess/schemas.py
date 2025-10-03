from pydantic import BaseModel


class PopulationGuessRequest(BaseModel):
    center_latitude: float
    center_longitude: float
    radius_meters: float
    user_guess: int


class PopulationGuessResponse(BaseModel):
    actual_population: float
    user_guess: int
    accuracy_percentage: float
    is_correct: bool


class PopulationStatisticsResponse(BaseModel):
    total_cells: int
    total_population: float
    avg_density: float
    max_density: float
    min_density: float
