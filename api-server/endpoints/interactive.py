"""
互动式认知测试端点 - LLM集成
提供基于大语言模型的互动式认知测试和反馈功能
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
import json
import logging
import os
import aiohttp
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
        user_input = request.user_input
        context = request.context or {}
        test_type = request.test_type

        # 使用LLM进行更深入的分析
        llm_response = await call_llm_service(user_input, context, test_type)
        
        if llm_response:
            # 使用LLM响应
            response_text = llm_response.get("response", f"感谢您的输入：'{user_input}'。认知陷阱平台旨在帮助您识别和克服各种认知偏差。")
            analysis_data = llm_response.get("analysis", {})
            suggestions_list = llm_response.get("suggestions", [
                "尝试指数增长测试来理解非线性思维",
                "进行复利计算练习来掌握长期思维",
                "研究历史案例来学习他人经验教训"
            ])
        else:
            # 如果LLM服务不可用，使用本地逻辑
            response_text = f"感谢您的输入：'{user_input}'。认知陷阱平台旨在帮助您识别和克服各种认知偏差。您可以尝试探索指数增长、复利思维或历史案例等模块。"
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
        # 发生错误时，使用本地逻辑提供响应
        response_text = f"感谢您的输入：'{request.user_input}'。认知陷阱平台旨在帮助您识别和克服各种认知偏差。您可以尝试探索指数增长、复利思维或历史案例等模块。"
        suggestions_list = [
            "尝试指数增长测试来理解非线性思维",
            "进行复利计算练习来掌握长期思维",
            "研究历史案例来学习他人经验教训"
        ]
        analysis_data = {
            "platform_purpose": "identify_and_overcome_cognitive_biases",
            "recommended_actions": ["take_tests", "review_feedback", "practice_decision_making"],
            "fallback": "使用本地逻辑响应"
        }
        
        return InteractiveResponse(
            response=response_text,
            analysis=analysis_data,
            suggestions=suggestions_list,
            confidence=0.7
        )


async def call_llm_service(user_input: str, context: Dict[str, Any], test_type: str):
    """
    调用LLM服务进行认知偏差分析
    """
    try:
        # 从环境变量获取API密钥
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            logger.warning("OpenRouter API密钥未设置，使用本地逻辑")
            return None

        # 构建提示词
        prompt = f"""
        你是一个认知科学和决策心理学专家，专门帮助用户识别和理解认知偏差。
        用户输入: "{user_input}"
        测试类型: {test_type}
        上下文: {json.dumps(context, ensure_ascii=False)}
        
        请分析用户输入中可能涉及的认知偏差，并提供以下内容：
        1. 对用户输入的分析和理解
        2. 可能涉及的认知偏差类型
        3. 针对性的建议和改进方法
        4. 相关的认知陷阱和思维模式
        
        请以JSON格式返回，包含以下字段：
        - response: 对用户输入的回复
        - analysis: 详细分析
        - suggestions: 建议列表
        """

        # 调用OpenRouter API
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "openchat/openchat-7b",  # 或其他可用模型
            "messages": [
                {"role": "system", "content": "你是认知陷阱平台的AI助手，专门帮助用户识别和理解认知偏差，提供决策建议。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    content = data['choices'][0]['message']['content']
                    
                    # 尝试解析LLM返回的JSON
                    try:
                        llm_result = json.loads(content)
                        return llm_result
                    except json.JSONDecodeError:
                        # 如果不是JSON格式，创建结构化响应
                        return {
                            "response": content,
                            "analysis": {"raw_response": content},
                            "suggestions": ["根据您的输入，建议进一步探索相关认知陷阱场景"]
                        }
                else:
                    logger.error(f"LLM API调用失败: {response.status}, {await response.text()}")
                    return None

    except Exception as e:
        logger.error(f"调用LLM服务时出错: {str(e)}")
        return None


from logic.semif_client import score_decision as semif_score_decision


class DecisionScoreRequest(BaseModel):
    """决策评分请求模型"""
    id: Optional[str] = None
    state: str
    question: str
    options: List[Dict[str, str]]


class DecisionScoreResponse(BaseModel):
    """决策评分响应模型"""
    id: str
    option_ids: List[str]
    probabilities: List[float]
    option_logits: List[float]
    winner: str
    winner_probability: float
    forward_seconds: float
    total_seconds: float
    model: Optional[Dict[str, Any]] = None
    probability_status: str = "conditional option score; uncalibrated as decision confidence"


@router.post("/interactive/score-decision", response_model=DecisionScoreResponse)
async def score_decision_endpoint(request: DecisionScoreRequest):
    """
     使用本地 SemIf 模型对结构化决策进行评分。

    输入：
    - state: 当前状态描述
    - question: 决策问题
    - options: [{"id": "a", "description": "选项A"}, ...]

    输出：
    - 各选项概率、logits、winner 及置信度
    """
    try:
        decision_id = request.id or f"api-{abs(hash(request.question + request.state)) % 100000}"
        result = semif_score_decision(
            decision_id=decision_id,
            state=request.state,
            question=request.question,
            options=request.options,
        )
        return DecisionScoreResponse(**result)
    except ValueError as ve:
        logger.error("SemIf 输入校验失败: %s", str(ve))
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error("SemIf 评分失败: %s", str(e))
        raise HTTPException(status_code=500, detail=f"SemIf 决策评分失败: {str(e)}")


@router.post("/interactive/analyze-decision", response_model=InteractiveResponse)
async def analyze_decision(
    user_input: str = Query(..., description="用户描述的决策情况"),
    state: Optional[str] = Query(None, description="可选：当前状态"),
    option_a: Optional[str] = Query(None, description="可选：选项A"),
    option_b: Optional[str] = Query(None, description="可选：选项B"),
    option_c: Optional[str] = Query(None, description="可选：选项C"),
):
    """
    分析用户描述的决策情况。
    当提供 option_a/option_b/option_c 时，使用 SemIf 模型评分；
    否则回退到关键词偏差检测。
    """
    try:
        if option_a and option_b:
            options = [
                {"id": "A", "description": option_a},
                {"id": "B", "description": option_b},
            ]
            if option_c:
                options.append({"id": "C", "description": option_c})

            try:
                result = semif_score_decision(
                    decision_id=f"analyze-{abs(hash(user_input)) % 100000}",
                    state=state or user_input[:200],
                    question=user_input[:500],
                    options=options,
                )
                winner_id = result["winner"]
                winner_prob = result["winner_probability"]
                winner_desc = next(o["description"] for o in options if o["id"] == winner_id)

                response_text = (
                    f"基于本地决策模型评分，建议选项 [{winner_id}] {winner_desc} "
                    f"（置信度 {winner_prob*100:.1f}%）。"
                )
                suggestions_list = [
                    "回顾该选项的风险与收益",
                    "考虑是否有未列出的第三选项",
                    "将决策结果记录到决策日志中",
                ]
                analysis_data = {
                    "input_summary": user_input[:100] + ("..." if len(user_input) > 100 else ""),
                    "semif_result": {
                        "option_ids": result["option_ids"],
                        "probabilities": [round(p, 6) for p in result["probabilities"]],
                        "winner": winner_id,
                        "winner_probability": round(winner_prob, 6),
                        "forward_seconds": round(result["forward_seconds"], 3),
                    },
                    "detected_biases": [],
                    "confidence_level": "model_scored",
                    "scoring_backend": "semif-local",
                }
                confidence = winner_prob
            except Exception as sem_err:
                logger.warning("SemIf 评分失败，回退到关键词分析: %s", str(sem_err))
                response_text, suggestions_list, analysis_data, confidence = (
                    _keyword_bias_analysis(user_input)
                )
                analysis_data["semif_error"] = str(sem_err)
        else:
            response_text, suggestions_list, analysis_data, confidence = _keyword_bias_analysis(user_input)

        return InteractiveResponse(
            response=response_text,
            analysis=analysis_data,
            suggestions=suggestions_list,
            confidence=confidence,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in decision analysis: %s", str(e))
        raise HTTPException(status_code=500, detail=f"分析决策时出错: {str(e)}")


def _keyword_bias_analysis(user_input: str):
    lower_input = user_input.lower()
    detected_biases = []

    if any(k in lower_input for k in ["第一个", "一开始", "最初", "first", "initial", "original"]):
        detected_biases.append("anchoring_bias - 锚定效应")
    if any(k in lower_input for k in ["大家都", "所有人", "普遍认为", "everyone", "all", "most believe"]):
        detected_biases.append("social_proof_bias - 社会认同偏差")
    if any(k in lower_input for k in ["过去如此", "以前都是", "一直这样", "past", "before", "always"]):
        detected_biases.append("status_quo_bias - 现状偏差")
    if any(k in lower_input for k in ["专家说", "权威认为", "名人推荐", "expert", "authority", "famous"]):
        detected_biases.append("authority_bias - 权威偏差")

    if detected_biases:
        response_text = f"根据您的描述，可能涉及以下认知偏差：{', '.join(detected_biases)}。建议您从多个角度审视决策，收集不同来源的信息，并考虑反面观点。"
        suggestions_list = [
            "收集更多信息来验证初步判断",
            "寻求与您观点相反的证据",
            "考虑决策的长期后果",
            "咨询不受相关偏误影响的第三方意见",
        ]
    else:
        response_text = f"根据您的描述，暂时未检测到明显的认知偏差模式。您的决策过程似乎较为理性。不过，仍建议您保持反思和自我审查的习惯。"
        suggestions_list = [
            "继续保持批判性思维",
            "定期回顾决策结果",
            "学习新的决策框架和工具",
        ]

    analysis_data = {
        "input_summary": user_input[:100] + ("..." if len(user_input) > 100 else user_input),
        "detected_biases": detected_biases,
        "confidence_level": "medium",
        "scoring_backend": "keyword-fallback",
    }

    return response_text, suggestions_list, analysis_data, 0.75


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