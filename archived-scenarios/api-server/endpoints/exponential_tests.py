from fastapi import APIRouter
from typing import Dict, Any, List
from datetime import datetime
import math

router = APIRouter(prefix="/exponential", tags=["exponential"])

# 指数增长测试问题
EXPONENTIAL_QUESTIONS = [
    {
        "id": 1,
        "question": "2的200次方大约是多少？",
        "options": [
            "几百万",
            "几十亿", 
            "1.6×10^60（比全宇宙原子总数还多）",
            "无法计算"
        ],
        "correct_answer": 2,  # 索引从0开始，正确答案是C
        "explanation": "2^200 = 1,606,938,044,258,990,275,541,962,092,341,162,602,522,202,993,782,792,835,301,376，这是一个天文数字，约等于1.6×10^60，比物理学家估计的全宇宙原子总数（约10^80）还要大得多。"
    },
    {
        "id": 2,
        "question": "2只兔子每年翻5倍，大约需要多少年才能超过100亿只？",
        "options": [
            "50年",
            "30年", 
            "15年",
            "8年"
        ],
        "correct_answer": 3,  # 正确答案是D: 8年
        "explanation": "计算过程：2 -> 10 -> 50 -> 250 -> 1,250 -> 6,250 -> 31,250 -> 156,250 -> 781,250，在第8年超过100万只，到第10年就超过1900万只。指数增长的力量超乎直觉！"
    },
    {
        "id": 3,
        "question": "如果您投资10万元，年复利8%，30年后大约会变成多少？",
        "options": [
            "34万元（线性增长估算）",
            "100万元", 
            "317万元",
            "500万元"
        ],
        "correct_answer": 2,  # 正确答案是C: 317万元 (100000*(1.08)^30 ≈ 100000*10.06 = 1,006,000)
        "explanation": "复利计算：100,000 × (1.08)^30 = 1,006,266元。这展示了复利的惊人力量，远超线性增长估算。"
    }
]

@router.get("/questions")
async def get_exponential_questions():
    """获取指数增长相关的测试问题"""
    return {
        "questions": EXPONENTIAL_QUESTIONS,
        "total_count": len(EXPONENTIAL_QUESTIONS),
        "title": "指数增长误区专项测试"
    }

@router.post("/calculate/compound")
async def calculate_compound_interest(data: Dict[str, Any]):
    """计算复利"""
    principal = float(data.get("principal", 0))
    rate = float(data.get("rate", 0)) / 100  # 百分比转小数
    time = int(data.get("time", 0))
    
    # 复利计算
    compound_amount = principal * (1 + rate) ** time
    # 线性计算（仅作对比）
    linear_amount = principal * (1 + rate * time)
    
    return {
        "principal": principal,
        "rate": rate * 100,
        "time": time,
        "compound_amount": compound_amount,
        "linear_amount": linear_amount,
        "compound_advantage": compound_amount - linear_amount,
        "explanation": f"复利效应：在{time}年期，{rate*100}%年利率下，复利最终金额是{compound_amount:,.2f}元，而线性增长仅为{linear_amount:,.2f}元。"
    }

@router.post("/calculate/exponential")
async def calculate_exponential_growth(data: Dict[str, Any]):
    """计算指数增长"""
    base = float(data.get("base", 0))
    exponent = int(data.get("exponent", 0))
    
    try:
        result = base ** exponent
        return {
            "base": base,
            "exponent": exponent,
            "result": result,
            "result_scientific": f"{result:.2e}" if result > 1e10 else str(result),
            "comparison": get_comparison_text(result)
        }
    except OverflowError:
        return {
            "base": base,
            "exponent": exponent,
            "result": "数值过大，超出计算范围",
            "error": True
        }

def get_comparison_text(result: float) -> str:
    """获取结果的比较说明"""
    if result < 1000:
        return "这是一个相对较小的数字，日常生活中比较常见。"
    elif result < 1_000_000:
        return "这个数字较大，相当于百万级别。"
    elif result < 1_000_000_000:
        return "这是亿级数字，相当于一个人口大国的总人口。"
    elif result < 1e20:
        return "这是极其巨大的数字，远超地球上所有货币的总价值。"
    else:
        return "这个数字是天文数字，比全宇宙的原子总数（约10^80）还要大，超出了人类的直观理解范围。"

@router.post("/check-answer/{question_id}")
async def check_answer(question_id: int, data: Dict[str, Any]):
    """检查答案"""
    user_answer = data.get("answer", -1)
    
    question = next((q for q in EXPONENTIAL_QUESTIONS if q["id"] == question_id), None)
    if not question:
        return {"error": "问题未找到"}
    
    is_correct = user_answer == question["correct_answer"]
    
    return {
        "question_id": question_id,
        "is_correct": is_correct,
        "correct_answer": question["correct_answer"],
        "explanation": question["explanation"]
    }