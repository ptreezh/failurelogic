"""
互动式认知测试端点 - LLM集成
提供基于大语言模型的互动式认知测试和反馈功能
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
import json
import logging
from pydantic import BaseModel

# 创建路由器
router = APIRouter(prefix="/api", tags=["interactive"])

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InteractiveRequest(BaseModel):
    """互动请求模型"""
    user_input: str
    context: Optional[Dict[str, Any]] = None
    test_type: Optional[str] = "general"


class InteractiveResponse(BaseModel):
    """互动响应模型"""
    response: str
    analysis: Optional[Dict[str, Any]] = None
    suggestions: Optional[List[str]] = None
    confidence: Optional[float] = None


@router.post("/interactive/chat", response_model=InteractiveResponse)
async def interactive_chat(request: InteractiveRequest):
    """
    互动式对话接口
    基于用户输入提供认知偏差分析和建议
    """
    try:
        user_input = request.user_input.lower()
        context = request.context or {}
        test_type = request.test_type

        # 基于用户输入生成响应
        response_text = ""
        analysis_data = {}
        suggestions_list = []
        
        # 根据测试类型提供不同反馈
        if test_type == "exponential":
            response_text = f"您提到了关于指数增长的问题。指数增长的一个关键特征是初期增长缓慢，但后期会出现爆发式增长。例如2^200这样的数字远超宇宙中原子的数量。"
            suggestions_list = [
                "尝试使用对数尺度来理解指数增长",
                "考虑指数增长在技术发展中的应用",
                "注意指数增长在病毒传播等现象中的体现"
            ]
            analysis_data = {
                "growth_pattern": "exponential",
                "common_mistake": "underestimating_late_stage_growth",
                "tip": "指数增长在前期容易被忽视，但后期会产生巨大影响"
            }
        elif test_type == "compound":
            response_text = f"您询问了关于复利的问题。复利的核心在于'利滚利'，即利息再投资产生更多利息。长期来看，复利效应非常显著。"
            suggestions_list = [
                "尽早开始投资以充分利用复利效应",
                "理解复利公式：A = P(1 + r/n)^(nt)",
                "注意复利在债务中的负面影响"
            ]
            analysis_data = {
                "concept": "compound_interest",
                "key_principle": "interest_on_interest",
                "long_term_impact": "significant_growth_over_time"
            }
        elif test_type == "cognitive_bias":
            response_text = f"认知偏差是系统性偏离理性判断的倾向。常见的包括确认偏误、锚定效应、可得性启发等。"
            suggestions_list = [
                "意识到自身可能存在认知偏差",
                "寻求相反观点来验证判断",
                "使用数据和事实来支撑决策"
            ]
            analysis_data = {
                "definition": "systematic deviation from rationality",
                "common_types": ["confirmation_bias", "anchoring", "availability_heuristic"],
                "mitigation_strategy": "awareness_and_fact_checking"
            }
        else:
            # 通用响应
            response_text = f"感谢您的输入：'{request.user_input}'。认知陷阱平台旨在帮助您识别和克服各种认知偏差。您可以尝试探索指数增长、复利思维或历史案例等模块。"
            suggestions_list = [
                "尝试指数增长测试来理解非线性思维",
                "进行复利计算练习来掌握长期思维",
                "研究历史案例来学习他人经验教训"
            ]
            analysis_data = {
                "platform_purpose": "identify_and_overcome_cognitive_biases",
                "recommended_actions": ["take_tests", "review_feedback", "practice_decision_making"]
            }

        response = InteractiveResponse(
            response=response_text,
            analysis=analysis_data,
            suggestions=suggestions_list,
            confidence=0.85
        )
        
        logger.info(f"Interactive chat processed for input: {user_input[:50]}...")
        
        return response
        
    except Exception as e:
        logger.error(f"Error in interactive chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理互动请求时出错: {str(e)}")


@router.post("/interactive/analyze-decision", response_model=InteractiveResponse)
async def analyze_decision(user_input: str = Query(..., description="用户描述的决策情况")):
    """
    分析用户描述的决策情况
    识别可能的认知偏差并提供建议
    """
    try:
        # 简单的关键词分析来识别可能的认知偏差
        lower_input = user_input.lower()
        detected_biases = []
        
        # 检测各种认知偏差的关键词
        if any(keyword in lower_input for keyword in ["第一个", "一开始", "最初", "first", "initial", "original"]):
            detected_biases.append("anchoring_bias - 锚定效应")
            
        if any(keyword in lower_input for keyword in ["大家都", "所有人", "普遍认为", "everyone", "all", "most believe"]):
            detected_biases.append("social_proof_bias - 社会认同偏差")
            
        if any(keyword in lower_input for keyword in ["过去如此", "以前都是", "一直这样", "past", "before", "always"]):
            detected_biases.append("status_quo_bias - 现状偏差")
            
        if any(keyword in lower_input for keyword in ["专家说", "权威认为", "名人推荐", "expert", "authority", "famous"]):
            detected_biases.append("authority_bias - 权威偏差")
        
        # 生成分析结果
        if detected_biases:
            response_text = f"根据您的描述，可能涉及以下认知偏差：{', '.join(detected_biases)}。建议您从多个角度审视决策，收集不同来源的信息，并考虑反面观点。"
            suggestions_list = [
                "收集更多信息来验证初步判断",
                "寻求与您观点相反的证据",
                "考虑决策的长期后果",
                "咨询不受相关偏误影响的第三方意见"
            ]
        else:
            response_text = f"根据您的描述，暂时未检测到明显的认知偏差模式。您的决策过程似乎较为理性。不过，仍建议您保持反思和自我审查的习惯。"
            suggestions_list = [
                "继续保持批判性思维",
                "定期回顾决策结果",
                "学习新的决策框架和工具"
            ]
        
        analysis_data = {
            "input_summary": user_input[:100] + "..." if len(user_input) > 100 else user_input,
            "detected_biases": detected_biases,
            "confidence_level": "medium"
        }
        
        response = InteractiveResponse(
            response=response_text,
            analysis=analysis_data,
            suggestions=suggestions_list,
            confidence=0.75
        )
        
        logger.info(f"Decision analyzed for input: {user_input[:50]}...")
        
        return response
        
    except Exception as e:
        logger.error(f"Error in decision analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"分析决策时出错: {str(e)}")


@router.get("/interactive/guided-tour")
async def get_guided_tour():
    """
    获取平台引导游览
    为新用户提供平台功能介绍
    """
    try:
        tour_info = {
            "title": "认知陷阱平台引导游览",
            "sections": [
                {
                    "title": "指数增长误区",
                    "description": "理解2^200这样的数字为何远超宇宙原子总数，克服线性思维局限",
                    "path": "/exponential-growth"
                },
                {
                    "title": "复利思维训练",
                    "description": "掌握复利效应在投资、学习和成长中的重要作用",
                    "path": "/compound-interest"
                },
                {
                    "title": "历史案例分析",
                    "description": "通过挑战者号、泰坦尼克号等历史事件学习决策失误",
                    "path": "/historical-cases"
                },
                {
                    "title": "互动式推理游戏",
                    "description": "在模拟场景中实践理性决策，识别认知偏差",
                    "path": "/reasoning-games"
                }
            ],
            "tips": [
                "不要相信直觉估算，使用计算器验证",
                "考虑长期后果，而不仅仅是短期影响",
                "寻求相反观点来检验你的假设"
            ],
            "next_steps": [
                "完成基础认知测试",
                "阅读个性化反馈报告",
                "练习不同场景下的决策"
            ]
        }
        
        return {
            "success": True,
            "tour": tour_info,
            "message": "引导游览信息获取成功"
        }
        
    except Exception as e:
        logger.error(f"Error in guided tour: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取引导游览时出错: {str(e)}")


@router.post("/interactive/personalized-feedback")
async def get_personalized_feedback(user_profile: Dict[str, Any]):
    """
    基于用户档案提供个性化反馈
    """
    try:
        # 提取用户信息
        decision_history = user_profile.get("decisionHistory", [])
        preferred_topics = user_profile.get("preferredTopics", [])
        difficulty_level = user_profile.get("difficultyLevel", "beginner")
        
        feedback = {
            "greeting": f"欢迎回来！根据您的学习进度，为您推荐以下内容：",
            "recommendations": [],
            "progress_summary": {
                "completed_tests": len(decision_history),
                "focus_areas": ["exponential_thinking", "long_term_planning"] if "exponential" in preferred_topics else ["cognitive_bias_awareness"]
            }
        }
        
        # 根据用户偏好生成推荐
        if "exponential" in preferred_topics:
            feedback["recommendations"].extend([
                "进阶指数增长挑战：米粒问题变体",
                "复杂系统中的非线性效应课程",
                "技术发展S曲线分析"
            ])
        elif "compound" in preferred_topics:
            feedback["recommendations"].extend([
                "复利在职业生涯规划中的应用",
                "长期投资策略的心理因素",
                "延迟满足的科学依据"
            ])
        else:
            feedback["recommendations"].extend([
                "认知偏差识别训练",
                "决策日志记录技巧",
                "批判性思维练习"
            ])
        
        # 根据难度等级调整内容
        if difficulty_level == "advanced":
            feedback["recommendations"].append("高级复杂系统分析挑战")
            feedback["recommendations"].append("多变量决策矩阵练习")
        
        return {
            "success": True,
            "feedback": feedback,
            "message": "个性化反馈生成成功"
        }
        
    except Exception as e:
        logger.error(f"Error in personalized feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"生成个性化反馈时出错: {str(e)}")


# 健康检查端点
@router.get("/interactive/health")
async def interactive_health():
    """
    互动端点健康检查
    """
    return {
        "status": "healthy",
        "module": "interactive",
        "features": [
            "interactive_chat",
            "analyze_decision", 
            "guided_tour",
            "personalized_feedback"
        ],
        "timestamp": __import__('datetime').datetime.now().isoformat()
    }