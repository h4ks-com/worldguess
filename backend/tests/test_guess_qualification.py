from worldguess.utils.guess_qualification import calculate_guess_qualification


class TestGuessQualification:
    def test_exact_match(self) -> None:
        assert calculate_guess_qualification(100, 100) == "good"
        assert calculate_guess_qualification(0, 0) == "good"
        assert calculate_guess_qualification(1000000, 1000000) == "good"

    def test_zero_actual_value(self) -> None:
        assert calculate_guess_qualification(0, 5) == "good"
        assert calculate_guess_qualification(0, 50) == "meh"
        assert calculate_guess_qualification(0, 500) == "bad"

    def test_zero_guess(self) -> None:
        assert calculate_guess_qualification(5, 0) == "good"
        assert calculate_guess_qualification(50, 0) == "meh"
        assert calculate_guess_qualification(500, 0) == "bad"

    def test_small_numbers_tolerance(self) -> None:
        # For small numbers (1-10), tolerance is ~100%
        assert calculate_guess_qualification(5, 10) == "good"
        assert calculate_guess_qualification(10, 5) == "good"
        assert calculate_guess_qualification(5, 15) == "meh"

    def test_medium_numbers_tolerance(self) -> None:
        # For medium numbers (100-1000), tolerance ~66%
        assert calculate_guess_qualification(300, 200) == "good"  # 33% error
        assert calculate_guess_qualification(300, 450) == "good"  # 50% error
        assert calculate_guess_qualification(300, 600) == "meh"  # 100% error
        assert calculate_guess_qualification(300, 900) == "bad"  # 200% error

    def test_large_numbers_tolerance(self) -> None:
        # For large numbers (10000+), tolerance ~40%
        assert calculate_guess_qualification(12000, 16000) == "good"  # 33% error
        assert calculate_guess_qualification(12000, 19000) == "meh"  # 58% error
        assert calculate_guess_qualification(12000, 40000) == "bad"  # 233% error

    def test_very_large_numbers(self) -> None:
        # For very large numbers (millions), strict tolerance
        assert calculate_guess_qualification(1000000, 1200000) == "good"
        assert calculate_guess_qualification(1000000, 1500000) == "meh"
        assert calculate_guess_qualification(1000000, 3000000) == "bad"

    def test_order_of_magnitude_consistency(self) -> None:
        # Same relative error should have similar qualification across magnitudes
        # 58% error should be "meh" for large numbers
        assert calculate_guess_qualification(12000, 19000) == "meh"  # 58% error

        # For very large numbers, same relative error should still be "meh" or "bad"
        qual_large = calculate_guess_qualification(12000000, 19000000)  # 58% error
        assert qual_large in ["meh", "bad"]

    def test_symmetric_differences(self) -> None:
        # Over and under guessing should be treated the same
        assert calculate_guess_qualification(100, 150) == calculate_guess_qualification(100, 50)
        assert calculate_guess_qualification(1000, 1500) == calculate_guess_qualification(1000, 500)
