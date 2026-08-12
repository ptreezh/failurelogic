"""
复利计算逻辑模块
实现复利相关的计算功能
"""

from typing import Dict, Any
import math


def calculate_compound_interest(
    principal: float,
    annual_rate: float,
    time_years: int,
    compounding_frequency: int = 1,
) -> Dict[str, Any]:
    """
    计算复利结果
    """
    # 年利率转换为小数
    rate_decimal = annual_rate / 100

    # 计算复利金额
    compound_amount = principal * (1 + rate_decimal / compounding_frequency) ** (
        compounding_frequency * time_years
    )

    # 计算利息
    interest_earned = compound_amount - principal

    # 计算相同条件下的简单利息
    simple_interest = principal * rate_decimal * time_years
    simple_amount = principal + simple_interest

    return {
        "principal": principal,
        "annual_rate": annual_rate,
        "time_years": time_years,
        "compound_amount": compound_amount,
        "linear_amount": simple_amount,
        "interest_earned": interest_earned,
        "simple_interest": simple_interest,
        "compound_vs_simple_difference": compound_amount - simple_amount,
        "explanation": f"本金{principal:,.2f}元，年利率{annual_rate}%，{time_years}年后的复利结果为{compound_amount:,.2f}元，比简单利息多出{compound_amount - simple_amount:,.2f}元。",
    }


def calculate_loan_payments(
    principal: float, annual_rate: float, loan_term_years: int
) -> Dict[str, Any]:
    """
    计算贷款月供和总支付额
    """
    # 年利率转换为月利率
    monthly_rate = (annual_rate / 100) / 12
    # 总月数
    total_months = loan_term_years * 12

    # 计算月供（使用等额本息公式）
    if monthly_rate == 0:
        monthly_payment = principal / total_months
    else:
        monthly_payment = (
            principal
            * (monthly_rate * (1 + monthly_rate) ** total_months)
            / ((1 + monthly_rate) ** total_months - 1)
        )

    # 计算总支付额
    total_payment = monthly_payment * total_months

    # 计算总利息
    total_interest = total_payment - principal

    return {
        "principal": principal,
        "annual_rate_percent": annual_rate,
        "loan_term_years": loan_term_years,
        "monthly_rate_percent": monthly_rate * 100,
        "monthly_payment": monthly_payment,
        "total_months": total_months,
        "total_payment": total_payment,
        "total_interest": total_interest,
        "explanation": f"本金{principal:,.2f}元，年利率{annual_rate}%，期限{loan_term_years}年，月供{monthly_payment:,.2f}元，总支付额{total_payment:,.2f}元，其中利息{total_interest:,.2f}元。",
    }


def calculate_time_to_double(principal: float, annual_rate: float) -> Dict[str, Any]:
    """
    计算翻倍时间（使用72法则和精确对数计算）
    """
    # 72法则估算
    if annual_rate == 0:
        estimated_time_rule_of_72 = float("inf")
    else:
        estimated_time_rule_of_72 = 72 / annual_rate

    # 精确对数计算
    if annual_rate == 0:
        actual_time_log_calc = float("inf")
    else:
        actual_time_log_calc = math.log(2) / math.log(1 + annual_rate / 100)

    # 预估翻倍金额
    if annual_rate == 0:
        doubled_amount = principal
    else:
        doubled_amount = principal * 2

    return {
        "principal": principal,
        "annual_rate_percent": annual_rate,
        "doubled_amount": doubled_amount,
        "estimated_time_rule_of_72": estimated_time_rule_of_72,
        "actual_time_log_calc": actual_time_log_calc,
        "rule_of_72_accuracy": abs(estimated_time_rule_of_72 - actual_time_log_calc)
        / actual_time_log_calc
        if actual_time_log_calc != 0
        else 0,
        "explanation": f"本金{principal:,.2f}元，年利率{annual_rate}%，根据72法则约需{estimated_time_rule_of_72:.2f}年翻倍，精确计算需{actual_time_log_calc:.2f}年。",
    }


def analyze_compound_interest_misunderstanding(
    user_estimation: float, principal: float, rate: float, time: int
) -> Dict[str, Any]:
    """
    分析复利思维误解
    """
    # 计算实际复利结果
    actual_compound_value = principal * (1 + rate / 100) ** time

    # 计算线性增长结果（用户可能的思维）
    linear_value = principal * (1 + (rate / 100) * time)

    # 计算偏差百分比
    if actual_compound_value == 0:
        deviation_percentage = float("inf") if user_estimation != 0 else 0
    else:
        deviation_percentage = (
            abs(user_estimation - actual_compound_value) / actual_compound_value * 100
        )

    return {
        "user_estimation": user_estimation,
        "calculation_details": {
            "principal": principal,
            "annual_rate_percent": rate,
            "time_years": time,
            "actual_compound_amount": actual_compound_value,
            "linear_amount": linear_value,
            "compound_vs_linear_difference": actual_compound_value - linear_value,
            "user_deviation_from_linear": abs(user_estimation - linear_value)
            / linear_value
            * 100
            if linear_value != 0
            else 0,
            "user_deviation_from_compound": deviation_percentage,
        },
        "deviation_percentage": deviation_percentage,
        "bias_assessment": "线性思维"
        if abs(user_estimation - linear_value)
        < abs(user_estimation - actual_compound_value)
        else "其他思维模式",
        "explanation": f"在本金{principal}元、年利率{rate}%、{time}年的复利计算中，您的估算值为{user_estimation:,.2f}，实际复利结果为{actual_compound_value:,.2f}。复利的威力在于'利滚利'，长期效应远超线性增长预测。",
    }


def calculate_compound_interest_old(
    principal: float,
    annual_rate: float,
    time_years: int,
    compounding_frequency: int = 1,
) -> Dict[str, Any]:
    """
    计算复利结果
    """
    # 年利率转换为小数
    rate_decimal = annual_rate / 100

    # 计算复利金额
    compound_amount = principal * (1 + rate_decimal / compounding_frequency) ** (
        compounding_frequency * time_years
    )

    # 计算利息
    interest_earned = compound_amount - principal

    # 计算相同条件下的简单利息
    simple_interest = principal * rate_decimal * time_years
    simple_amount = principal + simple_interest

    return {
        "principal": principal,
        "annual_rate_percent": annual_rate,
        "time_years": time_years,
        "compounding_frequency": compounding_frequency,
        "compound_amount": compound_amount,
        "simple_amount": simple_amount,
        "interest_earned": interest_earned,
        "simple_interest": simple_interest,
        "compound_vs_simple_difference": compound_amount - simple_amount,
        "explanation": f"本金{principal:,.2f}元，年利率{annual_rate}%，{time_years}年后的复利结果为{compound_amount:,.2f}元，比简单利息多出{compound_amount - simple_amount:,.2f}元。",
    }


def calculate_compound_with_contributions(
    initial_amount: float,
    monthly_contribution: float,
    annual_rate: float,
    time_years: int,
) -> Dict[str, Any]:
    """
    计算定期投资复利增长
    """
    monthly_rate = (annual_rate / 100) / 12
    total_months = time_years * 12

    # 使用复利和年金公式
    # FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
    future_value = initial_amount * (1 + monthly_rate) ** total_months
    future_value += monthly_contribution * (
        ((1 + monthly_rate) ** total_months - 1) / monthly_rate
    )

    total_contributions = initial_amount + (monthly_contribution * total_months)
    interest_earned = future_value - total_contributions

    return {
        "initial_amount": initial_amount,
        "monthly_contribution": monthly_contribution,
        "annual_rate": annual_rate,
        "time_years": time_years,
        "total_contributions": total_contributions,
        "future_value": future_value,
        "interest_earned": interest_earned,
        "total_months": total_months,
        "explanation": f"初始{initial_amount:,.2f}元，每月定投{monthly_contribution:,.2f}元，年化收益率{annual_rate}%，{time_years}年后的总价值为{future_value:,.2f}元，其中利息贡献了{interest_earned:,.2f}元。",
    }


def calculate_real_return_with_inflation(
    principal: float, annual_rate: float, inflation_rate: float, time_years: int
) -> Dict[str, Any]:
    """
    计算考虑通胀的复利增长
    """
    nominal_rate = annual_rate / 100
    inflation_decimal = inflation_rate / 100

    # 名义复利金额（未考虑通胀）
    nominal_amount = principal * (1 + nominal_rate) ** time_years

    # 实际购买力（考虑通胀）
    real_amount = nominal_amount / (1 + inflation_decimal) ** time_years

    # 实际收益率
    real_return_rate = ((real_amount / principal) ** (1 / time_years) - 1) * 100

    return {
        "principal": principal,
        "annual_rate_percent": annual_rate,
        "inflation_rate_percent": inflation_rate,
        "time_years": time_years,
        "nominal_amount": nominal_amount,
        "real_amount": real_amount,
        "real_return_rate": real_return_rate,
        "explanation": f"本金{principal:,.2f}元，年化收益率{annual_rate}%，通胀率{inflation_rate}%，{time_years}年后的名义金额为{nominal_amount:,.2f}元，但实际购买力仅为{real_amount:,.2f}元（相当于现在的{real_return_rate:.2f}%年化收益率）。",
    }


def calculate_tax_affected_compound(
    principal: float,
    annual_rate: float,
    tax_rate: float,
    time_years: int,
    contribution_frequency: str = "annually",  # annually or monthly
) -> Dict[str, Any]:
    """
    计算考虑税收影响的复利增长
    """
    # 计算税后收益率
    after_tax_rate = annual_rate * (1 - tax_rate / 100)

    # 使用税后收益率计算复利
    after_tax_amount = principal * (1 + after_tax_rate / 100) ** time_years

    # 与不考虑税收的复利比较
    before_tax_amount = principal * (1 + annual_rate / 100) ** time_years
    tax_impact = before_tax_amount - after_tax_amount

    return {
        "principal": principal,
        "annual_rate_percent": annual_rate,
        "tax_rate_percent": tax_rate,
        "time_years": time_years,
        "before_tax_amount": before_tax_amount,
        "after_tax_amount": after_tax_amount,
        "tax_impact": tax_impact,
        "explanation": f"本金{principal:,.2f}元，年化收益率{annual_rate}%，税率{tax_rate}%，{time_years}年后不考虑税收的金额为{before_tax_amount:,.2f}元，考虑税收后为{after_tax_amount:,.2f}元，税收减少了{tax_impact:,.2f}元的收益。",
    }


def calculate_compound_with_variable_rates(
    principal: float,
    rates_schedule: list,  # 每年的利率列表
    fees_rate: float = 0.0,  # 每年的费用率
) -> Dict[str, Any]:
    """
    计算不同年份不同利率下的复利增长
    """
    current_amount = principal
    yearly_balance = [principal]

    for year, rate in enumerate(rates_schedule):
        # 计算该年度收益
        gain = current_amount * (rate / 100)

        # 减去费用
        fees = current_amount * (fees_rate / 100)

        # 更新金额
        current_amount = current_amount + gain - fees
        yearly_balance.append(current_amount)

    total_return = current_amount - principal
    total_return_rate = (total_return / principal) * 100

    return {
        "principal": principal,
        "rates_schedule": rates_schedule,
        "fees_rate": fees_rate,
        "final_amount": current_amount,
        "total_return": total_return,
        "total_return_rate": total_return_rate,
        "yearly_balance": yearly_balance,
        "explanation": f"本金{principal:,.2f}元，按不同年份利率计算，期末金额为{current_amount:,.2f}元，总收益{total_return:,.2f}元（{total_return_rate:.2f}%）。",
    }


def calculate_double_compound(
    principal: float, investment_rate: float, loan_rate: float, time_years: int
) -> Dict[str, Any]:
    """
    计算投资复利和贷款复利的双重影响
    """
    # 投资复利计算
    investment_amount = principal * (1 + investment_rate / 100) ** time_years

    # 如果是借贷投资，同时计算贷款复利
    loan_amount = principal * (1 + loan_rate / 100) ** time_years

    net_position = investment_amount - loan_amount

    return {
        "investment_principal": principal,
        "investment_rate": investment_rate,
        "loan_rate": loan_rate,
        "time_years": time_years,
        "investment_value": investment_amount,
        "loan_amount": loan_amount,
        "net_position": net_position,
        "explanation": f"投资{principal:,.2f}元，投资收益率{investment_rate}%，如果贷款利率{loan_rate}%，{time_years}年后投资价值{investment_amount:,.2f}元，但贷款金额增至{loan_amount:,.2f}元，净头寸为{net_position:,.2f}元。",
    }
