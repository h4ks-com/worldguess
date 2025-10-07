import math


def calculate_guess_qualification(actual: int, guess: int) -> str:
    """Calculate guess qualification based on order of magnitude tolerance.

    Small numbers are more forgiving, large numbers have stricter
    tolerance. Uses logarithmic scaling to determine acceptable error
    ranges.
    """
    if actual == 0:
        return "good" if guess <= 10 else "meh" if guess <= 100 else "bad"

    if guess == 0:
        return "good" if actual <= 10 else "meh" if actual <= 100 else "bad"

    difference = abs(actual - guess)

    if difference == 0:
        return "good"

    # Calculate order of magnitude of the actual value
    magnitude = math.log10(max(actual, 1))

    # Base tolerance decreases logarithmically with magnitude
    # magnitude 0 (1-10): 200% tolerance (2.0)
    # magnitude 1 (10-100): 100% tolerance (1.0)
    # magnitude 2 (100-1000): 66% tolerance (0.66)
    # magnitude 3 (1000-10000): 50% tolerance (0.5)
    # magnitude 4+ (10000+): 40% tolerance (0.4)
    base_tolerance = max(0.4, 2.0 / (1 + magnitude))

    error_ratio = difference / actual

    # Good: within base tolerance
    if error_ratio <= base_tolerance:
        return "good"

    # Meh: within 2x base tolerance
    if error_ratio <= base_tolerance * 2:
        return "meh"

    # Bad: beyond 2x base tolerance
    return "bad"
