"""Unit tests for logic/compound_interest.py (R2.6)."""
import math
import pytest
from logic.compound_interest import calculate_compound_interest
from utils.error_handlers import CustomException


class TestCalculateCompoundInterest:
    def test_basic_yearly_compounding(self):
        result = calculate_compound_interest(principal=1000, annual_rate=5, time_years=10)
        assert result["final_amount"] == pytest.approx(1628.89, rel=1e-3)
        assert result["total_interest"] == pytest.approx(628.89, rel=1e-3)

    def test_monthly_compounding_more_interest(self):
        annual = calculate_compound_interest(1000, 5, 10, compounding_frequency=1)["final_amount"]
        monthly = calculate_compound_interest(1000, 5, 10, compounding_frequency=12)["final_amount"]
        assert monthly > annual

    def test_zero_principal(self):
        result = calculate_compound_interest(0, 5, 10)
        assert result["final_amount"] == 0

    def test_zero_years(self):
        result = calculate_compound_interest(1000, 5, 0)
        assert result["final_amount"] == 1000
        assert result["total_interest"] == 0

    def test_negative_principal_raises(self):
        with pytest.raises(CustomException):
            calculate_compound_interest(-100, 5, 10)

    def test_negative_years_raises(self):
        with pytest.raises(CustomException):
            calculate_compound_interest(100, 5, -1)

    def test_zero_frequency_raises(self):
        with pytest.raises(CustomException):
            calculate_compound_interest(100, 5, 10, compounding_frequency=0)

    def test_effective_annual_rate_with_yearly_compounding(self):
        result = calculate_compound_interest(1000, 5, 10, compounding_frequency=1)
        assert result["effective_annual_rate"] == pytest.approx(5.0, rel=1e-3)
