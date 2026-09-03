"""Unit tests for logic/exponential_calculations.py (R2.6)."""
import math
import pytest
from logic.exponential_calculations import (
    calculate_exponential,
    calculate_exponential_granary_problem,
    calculate_rabbit_growth_simulation,
    calculate_complex_system_failure,
    calculate_nano_replication,
    calculate_social_network_growth,
    compare_linear_vs_exponential,
)
from utils.error_handlers import CustomException


class TestCalculateExponential:
    def test_basic(self):
        assert calculate_exponential(2, 10) == 1024.0

    def test_zero_exponent(self):
        assert calculate_exponential(5, 0) == 1.0

    def test_fractional_base(self):
        assert abs(calculate_exponential(1.5, 2) - 2.25) < 1e-9


class TestGranaryProblem:
    def test_30_days_one_grain(self):
        result = calculate_exponential_granary_problem(1, 30)
        assert result["total_grains"] == 2 ** 30
        assert "1.074e+09" in result["scientific_notation"]

    def test_invalid_negative_periods(self):
        with pytest.raises(CustomException):
            calculate_exponential_granary_problem(1, -1)


class TestRabbitGrowth:
    def test_zero_months(self):
        result = calculate_rabbit_growth_simulation(1, 0)
        assert result["pairs"] == 1

    def test_growth_progression(self):
        r0 = calculate_rabbit_growth_simulation(1, 0)["pairs"]
        r6 = calculate_rabbit_growth_simulation(1, 6)["pairs"]
        assert r6 > r0


class TestComplexSystemFailure:
    def test_zero_failure_rate(self):
        result = calculate_complex_system_failure(1.0, 100, failure_rate_per_interaction=0.0)
        assert result["probability_all_ok"] == 1.0
        assert result["probability_any_failure"] == 0.0

    def test_high_failure_rate(self):
        result = calculate_complex_system_failure(1.0, 100, failure_rate_per_interaction=0.5)
        assert result["probability_all_ok"] < 1e-30

    def test_invalid_rate_raises(self):
        with pytest.raises(CustomException):
            calculate_complex_system_failure(1.0, 100, failure_rate_per_interaction=1.5)


class TestNanoReplication:
    def test_50_doublings_huge(self):
        result = calculate_nano_replication(1e-9, 50)
        # 50 doublings: 1e-9 * 2^50 ≈ 1.1e6 kg (~ 1 million kg)
        assert result["final_mass_kg"] > 1e6
        assert result["warning"] is False  # not yet 1e12

    def test_60_doublings_warning(self):
        # 60 doublings of 1e-9 kg: ~1e9 kg, still under 1e12
        result = calculate_nano_replication(1e-9, 60)
        assert result["warning"] is False

    def test_70_doublings_warning_triggers(self):
        # 70 doublings of 1e-9 kg: ~1e12, triggers warning
        result = calculate_nano_replication(1e-9, 70)
        assert result["warning"] is True

    def test_10_doublings_normal(self):
        result = calculate_nano_replication(1, 10)
        assert result["final_mass_kg"] == 1024.0
        assert result["warning"] is False


class TestSocialNetworkGrowth:
    def test_zero_days_no_growth(self):
        result = calculate_social_network_growth(100, 0)
        assert result["users"] == 100

    def test_growth_with_saturation(self):
        result = calculate_social_network_growth(100, 365, saturation_limit=10_000)
        assert result["users"] <= 10_000


class TestCompareLinearVsExponential:
    def test_basic_comparison(self):
        result = compare_linear_vs_exponential(linear_rate=10, exponential_rate=0.1, periods=20)
        assert result["linear_value"] == 200
        # (1.1)^20 ≈ 6.73
        assert result["exponential_value"] > 6 and result["exponential_value"] < 7
        # exponential_value/linear_value ≈ 0.034 (exponential is BEHIND at first!)
        # This is actually the key insight: linear can overtake initially.
        assert result["ratio"] < 1.0  # linear outpaces early exponential

    def test_high_periods_exponential_wins(self):
        # After many periods, exponential always wins
        result = compare_linear_vs_exponential(linear_rate=10, exponential_rate=0.1, periods=100)
        assert result["ratio"] > 1.0

    def test_zero_periods(self):
        result = compare_linear_vs_exponential(linear_rate=10, exponential_rate=0.1, periods=0)
        assert result["linear_value"] == 0
        assert result["exponential_value"] == 1.0
