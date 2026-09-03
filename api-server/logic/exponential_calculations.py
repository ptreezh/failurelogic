"""
指数增长计算逻辑模块
实现指数增长相关的计算功能

重建日期: 2026-09-03 (R2.3 修复)
原始实现因 .pyc-only 状态丢失；以下实现基于调用点反推 + 教学场景意图。
"""

import math
from typing import Dict, Any, List

from utils.error_handlers import handle_calculation_errors, validate_input_range, safe_numeric_operation


@handle_calculation_errors
def calculate_exponential(base: float, exponent: int) -> float:
    """计算 base^exponent（朴素指数）"""
    return safe_numeric_operation(lambda: math.pow(base, exponent))


@handle_calculation_errors
def calculate_exponential_granary_problem(
    initial_grains: int,
    doubling_periods: int,
    grains_per_cubic_meter: float = 1.5e7
) -> Dict[str, Any]:
    """
    谷物指数增长问题（基于经典"棋盘与谷粒"教学案例）
    每期翻倍：1 → 2 → 4 → 8 → ...
    """
    if doubling_periods < 0:
        raise ValueError("doubling_periods must be >= 0")
    total = initial_grains * (2 ** doubling_periods)
    volume_m3 = total / grains_per_cubic_meter
    return {
        "total_grains": int(total),
        "volume_cubic_meters": volume_m3,
        "scientific_notation": f"{total:.3e}",
        "doubling_periods": doubling_periods,
    }


@handle_calculation_errors
def calculate_rabbit_growth_simulation(
    initial_pairs: int,
    months: int,
    breeding_pairs_per_month: float = 1.0
) -> Dict[str, Any]:
    """
    兔子繁殖（Fibonacci 风格）
    F(n) = F(n-1) + breeding * F(n-2)
    """
    if months < 0:
        raise ValueError("months must be >= 0")
    if months == 0:
        return {"pairs": initial_pairs, "individuals": initial_pairs * 2}
    a, b = initial_pairs, initial_pairs
    for _ in range(months):
        a, b = b, a + breeding_pairs_per_month * b
    return {
        "pairs": int(b),
        "individuals": int(b * 2),
        "months": months,
    }


@handle_calculation_errors
def calculate_complex_system_failure(
    initial_stability: float,
    interactions: int,
    failure_rate_per_interaction: float = 0.01
) -> Dict[str, Any]:
    """
    复杂系统故障模拟：每次交互有小概率失败（雪崩效应）
    P(全部成功) = (1 - p)^n
    """
    if not 0 <= failure_rate_per_interaction <= 1:
        raise ValueError("failure_rate_per_interaction must be in [0,1]")
    p_all_ok = (1 - failure_rate_per_interaction) ** interactions
    p_any_failure = 1 - p_all_ok
    return {
        "probability_all_ok": p_all_ok,
        "probability_any_failure": p_any_failure,
        "interactions": interactions,
        "expected_failures": interactions * failure_rate_per_interaction,
    }


@handle_calculation_errors
def calculate_nano_replication(
    initial_mass_kg: float,
    doublings: int
) -> Dict[str, Any]:
    """纳米复制：质量按指数增长"""
    final_mass = initial_mass_kg * (2 ** doublings)
    return {
        "final_mass_kg": final_mass,
        "scientific_notation": f"{final_mass:.3e}",
        "doublings": doublings,
        "warning": final_mass > 1e12,
    }


@handle_calculation_errors
def calculate_social_network_growth(
    initial_users: int,
    days: int,
    growth_rate_per_day: float = 0.1,
    saturation_limit: int = 1_000_000_000
) -> Dict[str, Any]:
    """社交网络增长：logistic 增长（接近饱和）"""
    if days < 0:
        raise ValueError("days must be >= 0")
    result = initial_users
    for _ in range(days):
        result = result + growth_rate_per_day * result * (1 - result / saturation_limit)
        result = min(result, saturation_limit)
    return {
        "users": int(result),
        "saturation_ratio": result / saturation_limit,
        "days": days,
    }


@handle_calculation_errors
def compare_linear_vs_exponential(
    linear_rate: float,
    exponential_rate: float,
    periods: int
) -> Dict[str, Any]:
    """
    对比线性 vs 指数增长
    用于揭示"线性思维陷阱"
    """
    if periods < 0:
        raise ValueError("periods must be >= 0")
    linear_value = linear_rate * periods
    exponential_value = math.pow(1 + exponential_rate, periods)
    return {
        "linear_value": linear_value,
        "exponential_value": exponential_value,
        "ratio": exponential_value / linear_value if linear_value > 0 else float("inf"),
        "periods": periods,
        "crossover_period": int(math.log(linear_rate) / math.log(1 + exponential_rate)) if linear_rate > 0 and 0 < exponential_rate else None,
    }
