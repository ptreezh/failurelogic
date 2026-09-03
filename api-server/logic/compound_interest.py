"""
复利计算模块
实现复利相关的计算功能

重建日期: 2026-09-03 (R2.3 修复)
"""

from typing import Dict, Any

from utils.error_handlers import handle_calculation_errors, safe_numeric_operation


@handle_calculation_errors
def calculate_compound_interest(
    principal: float,
    annual_rate: float,
    time_years: int,
    compounding_frequency: int = 1
) -> Dict[str, Any]:
    """
    复利计算：A = P * (1 + r/n)^(n*t)

    Args:
        principal: 本金
        annual_rate: 年利率（百分比，如 5 表示 5%）
        time_years: 年数
        compounding_frequency: 每年复利次数（默认 1 = 年复利）
    """
    if principal < 0:
        raise ValueError("principal must be >= 0")
    if time_years < 0:
        raise ValueError("time_years must be >= 0")
    if compounding_frequency <= 0:
        raise ValueError("compounding_frequency must be > 0")

    rate = annual_rate / 100.0
    amount = principal * (1 + rate / compounding_frequency) ** (compounding_frequency * time_years)
    interest = amount - principal
    return {
        "principal": principal,
        "annual_rate": annual_rate,
        "time_years": time_years,
        "compounding_frequency": compounding_frequency,
        "final_amount": amount,
        "total_interest": interest,
        "effective_annual_rate": ((1 + rate / compounding_frequency) ** compounding_frequency - 1) * 100,
    }
