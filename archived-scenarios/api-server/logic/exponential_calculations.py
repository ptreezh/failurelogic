"""
指数增长计算逻辑模块
实现指数增长相关的计算功能
"""
from typing import Dict, Any, List
import math
from utils.error_handlers import handle_calculation_errors, validate_input_range, safe_numeric_operation


@handle_calculation_errors
def calculate_exponential(base: float, exponent: int) -> float:
    """
    计算指数增长
    """
    # 输入验证 - 限制更严格的范围以避免溢出
    validate_input_range(base, min_val=-100, max_val=100, param_name="base")
    validate_input_range(exponent, min_val=-100, max_val=100, param_name="exponent")

    def operation():
        return base ** exponent

    return safe_numeric_operation(operation)


@handle_calculation_errors
def calculate_exponential_granary_problem(grains_per_unit: int = 1,
                                        units: int = 2**200,
                                        rice_weight_per_grain_g: float = 0.02) -> Dict[str, Any]:
    """
    计算米粒问题 - 指数增长的实际规模
    """
    # 输入验证
    validate_input_range(float(grains_per_unit), min_val=0, max_val=1e10, param_name="grains_per_unit")
    validate_input_range(rice_weight_per_grain_g, min_val=0, max_val=1, param_name="rice_weight_per_grain_g")

    def operation():
        total_grains = grains_per_unit * units
        # 每粒米重约0.02克
        total_weight_g = total_grains * rice_weight_per_grain_g
        total_weight_kg = total_weight_g / 1000
        total_weight_tonnes = total_weight_kg / 1000

        # 估算体积，1kg大米约1.2升
        volume_liters = total_weight_kg * 1.2
        volume_cubic_meters = volume_liters / 1000

        # 一个足球场约7140平方米，假设仓库高度10米
        football_fields_needed = volume_cubic_meters / (7140 * 10)

        return {
            'total_grains': total_grains,
            'weight_kg': total_weight_kg,
            'weight_tonnes': total_weight_tonnes,
            'volume_cubic_meters': volume_cubic_meters,
            'football_fields_needed': football_fields_needed,
            'explanation': f"2^200粒米的数量远超宇宙中的原子总数，这是一个天文数字，约等于{'%.2e' % total_grains}粒。"
        }

    return safe_numeric_operation(operation)


@handle_calculation_errors
def calculate_rabbit_growth_simulation(starting_rabbits: int = 10,
                                      years: int = 11,
                                      growth_multiplier: int = 5) -> Dict[str, Any]:
    """
    模拟兔子增长 - 从10只兔子，每年翻5倍，11年后会有多少只
    """
    # 输入验证
    validate_input_range(float(starting_rabbits), min_val=0, max_val=1e10, param_name="starting_rabbits")
    validate_input_range(float(years), min_val=0, max_val=100, param_name="years")
    validate_input_range(float(growth_multiplier), min_val=0, max_val=100, param_name="growth_multiplier")

    def operation():
        population_history = []
        current_population = starting_rabbits

        for year in range(years + 1):
            population_history.append({
                'year': year,
                'population': current_population
            })

            if year < years:  # 不计算最后一年后的增长
                current_population *= growth_multiplier

        total_growth_factor = growth_multiplier ** years
        final_population = starting_rabbits * total_growth_factor

        return {
            'starting_population': starting_rabbits,
            'growth_multiplier': growth_multiplier,
            'total_years': years,
            'final_population': final_population,
            'population_history': population_history,
            'total_growth_factor': total_growth_factor,
            'explanation': f"从{starting_rabbits}只兔子开始，每年增长{growth_multiplier}倍，{years}年后将达到惊人的{final_population:.2e}只。",
            'exponential_impact': True
        }

    return safe_numeric_operation(operation)


@handle_calculation_errors
def compare_linear_vs_exponential(initial_amount: float,
                                 rate_percent: float,
                                 time_periods: int) -> Dict[str, Any]:
    """
    比较线性增长与指数增长的差异
    """
    # 输入验证
    validate_input_range(initial_amount, min_val=0, max_val=1e15, param_name="initial_amount")
    validate_input_range(rate_percent, min_val=-100, max_val=1000, param_name="rate_percent")
    validate_input_range(float(time_periods), min_val=0, max_val=1000, param_name="time_periods")

    def operation():
        rate_decimal = rate_percent / 100

        # 线性增长: 每期增加固定金额
        linear_result = initial_amount * (1 + rate_decimal * time_periods)

        # 指数增长: 每期按比率复合增长
        try:
            exponential_result = initial_amount * ((1 + rate_decimal) ** time_periods)
        except OverflowError:
            exponential_result = float('inf')

        difference = exponential_result - linear_result if exponential_result != float('inf') else float('inf')

        if linear_result != 0:
            advantage_ratio = exponential_result / linear_result if exponential_result != float('inf') else float('inf')
        else:
            advantage_ratio = float('inf')

        return {
            'initial_amount': initial_amount,
            'rate_percent': rate_percent,
            'time_periods': time_periods,
            'linear_result': linear_result,
            'exponential_result': exponential_result,
            'difference': difference,
            'advantage_ratio': advantage_ratio,
            'explanation': f"经过{time_periods}期，线性增长结果为{linear_result:,.2f}，而指数增长结果为{'%.2e' % exponential_result if isinstance(exponential_result, float) and (exponential_result > 1e10 or exponential_result < 1e-3) else f'{exponential_result:,.2f}'}，显示出复合效应的巨大优势。"
        }

    return safe_numeric_operation(operation)


@handle_calculation_errors
def estimate_exponential_growth_time(initial_amount: float,
                                    target_amount: float,
                                    growth_factor: float) -> float:
    """
    估算指数增长达到目标所需时间
    例如，从10只兔子增长到80亿只，每年翻5倍需要多长时间
    """
    # 输入验证
    validate_input_range(initial_amount, min_val=0, param_name="initial_amount")
    validate_input_range(target_amount, min_val=0, param_name="target_amount")
    validate_input_range(growth_factor, min_val=1.0001, param_name="growth_factor")  # 必须大于1

    def operation():
        if initial_amount <= 0 or target_amount <= 0 or growth_factor <= 1 or initial_amount >= target_amount:
            return 0.0  # 无法达到目标或已超过目标

        # 使用对数公式: t = log(target/initial) / log(growth_factor)
        time_needed = math.log(target_amount / initial_amount) / math.log(growth_factor)
        return time_needed

    return safe_numeric_operation(operation)


@handle_calculation_errors
def get_exponential_impact_examples() -> List[Dict[str, Any]]:
    """
    获取指数增长影响的示例
    """
    def operation():
        examples = [
            {
                'name': '米粒问题',
                'scenario': '棋盘上放米，第1格放1粒，第2格放2粒，第3格放4粒...直到第64格',
                'result': f'总共需要{2**64 - 1:.2e}粒米，远超全球产量',
                'insight': '指数增长在后期呈现爆炸性'
            },
            {
                'name': '纸张对折',
                'scenario': '一张0.1毫米厚的纸对折200次',
                'result': f'厚度约{0.1 * (10**-3) * (2**200):.2e}米，超过可观测宇宙直径',
                'insight': '指数函数增长速度惊人'
            },
            {
                'name': '病毒传播',
                'scenario': '一个感染者每天传染2人，持续30天',
                'result': f'理论上可感染{3**30:.2e}人，远超地球人口',
                'insight': '指数增长在传染病中威力巨大'
            }
        ]

        return examples

    return safe_numeric_operation(operation)


@handle_calculation_errors
def calculate_complex_system_failure(
    initial_failure: int = 1,
    cascade_multiplier: float = 2.0,
    time_periods: int = 20,
    recovery_rate: float = 0.1
) -> Dict[str, Any]:
    """
    计算复杂系统中的级联故障
    """
    # 输入验证
    validate_input_range(float(initial_failure), min_val=0, max_val=1e10, param_name="initial_failure")
    validate_input_range(cascade_multiplier, min_val=0, max_val=100, param_name="cascade_multiplier")
    validate_input_range(float(time_periods), min_val=0, max_val=100, param_name="time_periods")
    validate_input_range(recovery_rate, min_val=0, max_val=1, param_name="recovery_rate")

    def operation():
        failures_over_time = []
        current_failures = initial_failure

        for period in range(time_periods):
            # 计算新故障数量（级联效应）
            new_failures = current_failures * cascade_multiplier

            # 计算恢复数量
            recovered = new_failures * recovery_rate

            # 更新当前故障数量
            current_failures = new_failures - recovered

            failures_over_time.append({
                "time_period": period + 1,
                "new_failures": new_failures,
                "recovered": recovered,
                "total_failures": current_failures
            })

        final_failures = current_failures

        return {
            "initial_failures": initial_failure,
            "cascade_multiplier": cascade_multiplier,
            "time_periods": time_periods,
            "recovery_rate": recovery_rate,
            "final_failures": final_failures,
            "failures_over_time": failures_over_time,
            "explanation": f"初始故障{initial_failure}个，经过{time_periods}个周期的级联效应，最终故障数量达到{final_failures:.2e}个"
        }

    return safe_numeric_operation(operation)


@handle_calculation_errors
def calculate_nano_replication(
    initial_units: int = 1,
    replication_cycles: int = 60,
    unit_volume_m3: float = 1e-27  # 1纳米^3 = 10^-27立方米
) -> Dict[str, Any]:
    """
    计算自我复制纳米机器人的体积增长
    """
    # 输入验证
    validate_input_range(float(initial_units), min_val=0, max_val=1e10, param_name="initial_units")
    validate_input_range(float(replication_cycles), min_val=0, max_val=1000, param_name="replication_cycles")
    validate_input_range(unit_volume_m3, min_val=0, max_val=1, param_name="unit_volume_m3")

    def operation():
        # 计算最终单位数量
        final_count = initial_units * (2 ** replication_cycles)

        # 计算总体积
        total_volume = final_count * unit_volume_m3

        # 与参考体积比较
        observable_universe_m3 = 3.58e80  # 可观测宇宙体积（立方米）

        return {
            "initial_units": initial_units,
            "replication_cycles": replication_cycles,
            "final_count": final_count,
            "unit_volume_m3": unit_volume_m3,
            "total_volume_m3": total_volume,
            "universe_volume_ratio": total_volume / observable_universe_m3 if total_volume != float('inf') else float('inf'),
            "explanation": f"经过{replication_cycles}次复制周期，纳米机器人总数达到{final_count:.2e}个，总体积为{total_volume:.2e}立方米"
        }

    return safe_numeric_operation(operation)


@handle_calculation_errors
def calculate_social_network_growth(
    initial_users: int = 10,
    invite_rate: float = 2.0,
    retention_rate: float = 0.8,
    time_periods: int = 30
) -> Dict[str, Any]:
    """
    计算社交网络增长 - 考虑邀请和留存率
    """
    # 输入验证
    validate_input_range(float(initial_users), min_val=0, max_val=1e10, param_name="initial_users")
    validate_input_range(invite_rate, min_val=0, max_val=100, param_name="invite_rate")
    validate_input_range(retention_rate, min_val=0, max_val=1, param_name="retention_rate")
    validate_input_range(float(time_periods), min_val=0, max_val=1000, param_name="time_periods")

    def operation():
        users_over_time = []
        current_users = initial_users

        for period in range(time_periods):
            # 每个用户邀请新用户
            new_invites = current_users * invite_rate

            # 添加新用户
            before_retention = current_users + new_invites

            # 应用留存率
            current_users = before_retention * retention_rate

            users_over_time.append({
                "time_period": period + 1,
                "new_invites": new_invites,
                "total_users_before_retention": before_retention,
                "total_users_after_retention": current_users
            })

        return {
            "initial_users": initial_users,
            "invite_rate": invite_rate,
            "retention_rate": retention_rate,
            "time_periods": time_periods,
            "final_users": current_users,
            "users_over_time": users_over_time,
            "explanation": f"从{initial_users}个初始用户开始，经过{time_periods}个周期，考虑邀请率和留存率，最终用户数达到{current_users:.2e}个"
        }

    return safe_numeric_operation(operation)