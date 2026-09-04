"""Tests for utils/error_handlers.py (R7.2)."""
import pytest
import math
from utils.error_handlers import (
    CustomException,
    handle_calculation_errors,
    validate_input_range,
    safe_numeric_operation,
)


class TestCustomException:
    def test_default_values(self):
        exc = CustomException("test error")
        assert exc.message == "test error"
        assert exc.error_code == "GENERIC_ERROR"
        assert exc.status_code == 400
        assert str(exc) == "test error"

    def test_custom_code_and_status(self):
        exc = CustomException("oops", error_code="CUSTOM", status_code=500)
        assert exc.error_code == "CUSTOM"
        assert exc.status_code == 500

    def test_inherits_from_exception(self):
        exc = CustomException("msg")
        assert isinstance(exc, Exception)


class TestHandleCalculationErrors:
    def test_passes_through_normal_result(self):
        @handle_calculation_errors
        def add(a, b):
            return a + b
        assert add(2, 3) == 5

    def test_overflow_caught(self):
        @handle_calculation_errors
        def divide():
            return 1.0 / 0.0  # raises ZeroDivisionError first
        # Note: in Python, 1.0/0.0 is ZeroDivisionError, not OverflowError
        with pytest.raises(CustomException) as ei:
            divide()
        assert ei.value.error_code == "DIVISION_BY_ZERO"

    def test_value_error_caught(self):
        @handle_calculation_errors
        def bad():
            raise ValueError("bad input")
        with pytest.raises(CustomException) as ei:
            bad()
        assert ei.value.error_code == "INVALID_INPUT_VALUE"
        assert "bad input" in ei.value.message

    def test_generic_exception_caught(self):
        @handle_calculation_errors
        def crash():
            raise RuntimeError("unexpected")
        with pytest.raises(CustomException) as ei:
            crash()
        assert ei.value.error_code == "CALCULATION_ERROR"
        assert ei.value.status_code == 500

    def test_explicit_overflow_error(self):
        @handle_calculation_errors
        def bad():
            raise OverflowError("too big")
        with pytest.raises(CustomException) as ei:
            bad()
        assert ei.value.error_code == "CALCULATION_OVERFLOW"
        assert ei.value.status_code == 400


class TestValidateInputRange:
    def test_within_range(self):
        assert validate_input_range(5, min_val=0, max_val=10) == 5

    def test_below_minimum_raises(self):
        with pytest.raises(CustomException) as ei:
            validate_input_range(-1, min_val=0, max_val=10, param_name="x")
        assert ei.value.error_code == "INPUT_BELOW_MINIMUM"
        assert "x" in ei.value.message
        assert "0" in ei.value.message

    def test_above_maximum_raises(self):
        with pytest.raises(CustomException) as ei:
            validate_input_range(15, min_val=0, max_val=10, param_name="y")
        assert ei.value.error_code == "INPUT_ABOVE_MAXIMUM"

    def test_only_min_provided(self):
        assert validate_input_range(100, min_val=0) == 100

    def test_only_max_provided(self):
        assert validate_input_range(-50, max_val=0) == -50

    def test_boundary_values(self):
        assert validate_input_range(0, min_val=0, max_val=0) == 0


class TestSafeNumericOperation:
    def test_normal_result(self):
        result = safe_numeric_operation(lambda: 2 + 2)
        assert result == 4

    def test_with_args(self):
        result = safe_numeric_operation(lambda a, b: a * b, 3, 4)
        assert result == 12

    def test_inf_result_caught(self):
        with pytest.raises(CustomException) as ei:
            safe_numeric_operation(lambda: float("inf"))
        assert ei.value.error_code == "CALCULATION_OVERFLOW"

    def test_neg_inf_result_caught(self):
        with pytest.raises(CustomException) as ei:
            safe_numeric_operation(lambda: float("-inf"))
        assert ei.value.error_code == "CALCULATION_OVERFLOW"

    def test_nan_result_caught(self):
        with pytest.raises(CustomException) as ei:
            safe_numeric_operation(lambda: float("nan"))
        assert ei.value.error_code == "NUMERIC_CALCULATION_ERROR"

    def test_value_error_in_op_caught(self):
        with pytest.raises(CustomException) as ei:
            safe_numeric_operation(lambda: int("not a number"))
        assert ei.value.error_code == "NUMERIC_CALCULATION_ERROR"

    def test_zero_division_caught(self):
        # ZeroDivisionError is a subclass of ArithmeticError, not caught
        # by the specific ValueError branch; falls through to generic.
        with pytest.raises(CustomException) as ei:
            safe_numeric_operation(lambda: 1 / 0)
        assert ei.value.error_code == "CALCULATION_ERROR"

    def test_generic_error_caught(self):
        def crash():
            raise RuntimeError("boom")
        with pytest.raises(CustomException) as ei:
            safe_numeric_operation(crash)
        assert ei.value.error_code == "CALCULATION_ERROR"
        assert ei.value.status_code == 500

    def test_returns_non_numeric_unchanged(self):
        result = safe_numeric_operation(lambda: "string")
        assert result == "string"
