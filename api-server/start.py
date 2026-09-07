#!/usr/bin/env python3
"""
认知陷阱平台API服务器
基于FastAPI的后端服务，提供真实的逻辑实现而非模拟数据
增强版：包含决策模式追踪、困惑时刻设计、跨场景学习
"""

import os
import sys
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any, List
import uvicorn
import json
import random
from datetime import datetime
from pydantic import BaseModel
from collections import defaultdict

# 导入错误处理模块
from utils.error_handlers import global_exception_handler, CustomException
# 导入决策模式追踪器（R2.1 拆分：从内联类提取到 logic/pattern_tracker.py）
from logic.pattern_tracker import DecisionPatternTracker, CrossScenarioAnalyzer

# 全局实例（用于跨场景模式聚合）
pattern_tracker = DecisionPatternTracker()
cross_scenario_analyzer = CrossScenarioAnalyzer()


from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

# 静态资源挂载（R6.3: 从 feedback_real.py 移回 start.py）
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(
    title="认知陷阱平台API",
    description="提供决策思维训练场景、游戏会话和分析服务，使用真实的逻辑实现（增强版）",
    version="2.0.0",
)

# 配置 CORS 中间件（从 ALLOWED_ORIGINS 环境变量读取，逗号分隔）
# 默认允许 GitHub Pages（生产）和 localhost（开发）
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "https://ptreezh.github.io,http://localhost:3000,http://localhost:8000")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    allow_origin_regex=None,  # 严格白名单
)

# 挂载静态资源目录（R6.3 从 inline feedback 移出）
app.mount("/assets", StaticFiles(directory=os.path.join(_project_root, "assets")), name="assets")
if os.path.exists(os.path.join(_project_root, "web-app")):
    app.mount("/web-app", StaticFiles(directory=os.path.join(_project_root, "web-app")), name="web_app")

# 注册全局异常处理器
app.add_exception_handler(Exception, global_exception_handler)

# 场景数据 - 统一的场景结构，支持多难度级别
import os
import json

# 基础场景定义
# - 3 shallow stubs from earlier (kept for backward compat — see audit)
# - 1 deep scenario: Challenger launch decision (Dörner-style, 10 turns)
BASE_SCENARIOS = [
    {
        "id": "coffee-shop-nonlinear-effects",
        "name": "咖啡店非线性效应",
        "description": "非线性效应体验场景",
        "fullDescription": "在这个场景中，您将管理一家咖啡店，体验非线性效应在复杂商业环境中的影响。在复杂的系统中，原因和结果之间往往不是简单的线性关系，而是存在非线性效应，这需要我们采用更复杂的思维模式来理解和应对。",
        "difficulty": "beginner",
        "estimatedDuration": 15,
        "targetPatterns": ["nonlinear_effects"],
        "decisionPattern": "非线性效应",
        "duration": "15-20分钟",
        "category": "商业决策",
        "thumbnail": "/assets/images/coffee-shop.jpg",
        "advancedChallenges": [
            {
                "title": "供应链网络效应",
                "description": "处理供应商网络扩展中的复杂效应",
                "difficulty": "intermediate",
                "decisionPatterns": ["exponential_misconception", "nonlinear_effects"],
            },
            {
                "title": "复杂系统管理",
                "description": "管理多变量商业生态系统的复杂性",
                "difficulty": "advanced",
                "decisionPatterns": [
                    "complex_system_misunderstanding",
                    "cascading_effect_blindness",
                ],
            },
        ],
    },
    {
        "id": "relationship-time-delay",
        "name": "恋爱关系时间延迟",
        "description": "时间延迟效应场景",
        "fullDescription": "在恋爱关系中体验时间延迟对决策的影响。每个决策的效果会在几回合后显现。在复杂关系中，行动和结果之间往往存在时间差，这需要我们有耐心和长远视角。",
        "difficulty": "intermediate",
        "estimatedDuration": 20,
        "targetPatterns": ["time_delay_pattern"],
        "decisionPattern": "时间延迟",
        "duration": "20-25分钟",
        "category": "人际关系",
        "thumbnail": "/assets/images/relationship.jpg",
        "advancedChallenges": [
            {
                "title": "长期关系复利效应",
                "description": "理解关系投资的长期复利增长模式",
                "difficulty": "intermediate",
                "decisionPatterns": [
                    "compound_interest_misunderstanding",
                    "short_term_bias",
                ],
            },
            {
                "title": "复杂关系网络",
                "description": "处理家庭和社交网络的复杂动态",
                "difficulty": "advanced",
                "decisionPatterns": [
                    "complex_system_misunderstanding",
                    "network_effect_blindness",
                ],
            },
        ],
    },
    {
        "id": "investment-information-processing",
        "name": "投资信息处理",
        "description": "信息处理模式场景",
        "fullDescription": "在投资决策中体验如何处理不同类型的信息，以及信息处理方式如何影响我们的风险判断。在复杂决策中，我们需要学会平衡不同来源的信息，避免只关注支持我们预设观点的信息。",
        "difficulty": "advanced",
        "estimatedDuration": 25,
        "targetPatterns": ["information_processing"],
        "decisionPattern": "信息处理模式",
        "duration": "25-30分钟",
        "category": "金融决策",
        "thumbnail": "/assets/images/investment.jpg",
        "advancedChallenges": [
            {
                "title": "通胀调整投资",
                "description": "考虑通胀影响的长期投资复利效应",
                "difficulty": "intermediate",
                "decisionPatterns": [
                    "inflation_adjustment",
                    "compound_interest_understanding",
                ],
            },
            {
                "title": "复杂金融系统",
                "description": "处理多变量金融市场系统风险",
                "difficulty": "advanced",
                "decisionPatterns": [
                    "financial_system_complexity",
                    "correlation_analysis",
                ],
            },
        ],
    },
    {
        "id": "challenger-launch",
        "name": "挑战者号发射决策",
        "description": "1986年1月，挑战者号航天飞机计划发射。工程师们对低温下O型密封圈的性能提出严重担忧，但发射日期面临巨大压力：在10回合内平衡工程安全、预算、媒体关注和政治承诺。",
        "fullDescription": "10回合多状态模拟。每个决定都影响后续的信息流、信任度和风险敞口。第6回合会基于你的决策模式揭示认知偏差。",
        "difficulty": "advanced",
        "estimatedDuration": 45,
        "targetPatterns": ["time_delay", "confirmation_bias", "single_target_optimization", "side_effects", "lack_of_self_criticism"],
        "decisionPattern": "压力下的多变量风险决策",
        "duration": "30-45分钟",
        "category": "重大工程决策",
        "thumbnail": "/assets/images/challenger.jpg",
        "advancedChallenges": [],
        "scenario_file": "scenarios/challenger_launch.json"
    },
]

def load_additional_scenarios():
    """加载额外的游戏场景、高级游戏和历史案例"""
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    additional = []

    # 加载游戏场景
    try:
        game_file = os.path.join(data_dir, 'game_scenarios.json')
        if os.path.exists(game_file):
            with open(game_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for scenario in data.get('game_scenarios', []):
                    additional.append({
                        "id": scenario.get("scenarioId"),
                        "name": scenario.get("title"),
                        "description": scenario.get("description"),
                        "fullDescription": scenario.get("description"),
                        "difficulty": "intermediate",
                        "estimatedDuration": 30,
                        "targetPatterns": scenario.get("analysis", {}).get("decisionPatternsTested", []),
                        "decisionPattern": ",".join(scenario.get("analysis", {}).get("decisionPatternsTested", [])),
                        "duration": "30-45分钟",
                        "category": "商业决策",
                        "thumbnail": "",
                        "advancedChallenges": []
                    })
            print(f"✅ 加载了 {len(data.get('game_scenarios', []))} 个游戏场景")
    except Exception as e:
        print(f"❌ 加载游戏场景失败: {e}")

    # 加载高级游戏场景
    try:
        advanced_file = os.path.join(data_dir, 'advanced_game_scenarios.json')
        if os.path.exists(advanced_file):
            with open(advanced_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for scenario in data.get('game_scenarios', []):
                    additional.append({
                        "id": scenario.get("scenarioId"),
                        "name": scenario.get("title"),
                        "description": scenario.get("description"),
                        "fullDescription": scenario.get("description"),
                        "difficulty": "advanced",
                        "estimatedDuration": 60,
                        "targetPatterns": scenario.get("analysis", {}).get("decisionPatternsTested", []),
                        "decisionPattern": ",".join(scenario.get("analysis", {}).get("decisionPatternsTested", [])),
                        "duration": "60-90分钟",
                        "category": "高级决策",
                        "thumbnail": "",
                        "advancedChallenges": []
                    })
            print(f"✅ 加载了 {len(data.get('game_scenarios', []))} 个高级游戏场景")
    except Exception as e:
        print(f"❌ 加载高级游戏场景失败: {e}")

    # 加载历史案例
    try:
        historical_file = os.path.join(data_dir, 'historical_cases.json')
        if os.path.exists(historical_file):
            with open(historical_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for case in data.get('historical_cases', []):
                    additional.append({
                        "id": case.get("scenarioId"),
                        "name": case.get("title"),
                        "description": case.get("description"),
                        "fullDescription": case.get("description"),
                        "difficulty": "historical",
                        "estimatedDuration": 20,
                        "targetBiases": [],
                        "cognitiveBias": "历史案例分析",
                        "duration": "20-30分钟",
                        "category": "历史案例",
                        "thumbnail": "",
                        "advancedChallenges": []
                    })
            print(f"✅ 加载了 {len(data.get('historical_cases', []))} 个历史案例")
    except Exception as e:
        print(f"❌ 加载历史案例失败: {e}")

    print(f"📊 总共加载了 {len(additional)} 个额外场景")
    return additional

# 合并所有场景
SCENARIOS = BASE_SCENARIOS + load_additional_scenarios()
print(f"🎯 场景总数: {len(SCENARIOS)}")

# 游戏会话存储
game_sessions = {}

# 导入并注册认知测试端点
try:
    from endpoints.cognitive_tests import router as cognitive_tests_router

    app.include_router(cognitive_tests_router)
except ImportError:
    print("认知测试端点不可用")

# 场景端点由 start.py 自身定义 (line 449 等) 直接挂载，
# 不再 include endpoints/scenarios.py（其路由与 start.py 冲突导致死代码）。
# R2.2 修复：删除 endpoints/scenarios.py
print("✓ 场景端点已注册（由 start.py 直接定义）")

# 导入并注册测试结果端点
try:
    from endpoints.test_results import router as test_results_router

    app.include_router(test_results_router)
except ImportError:
    print("测试结果端点不可用")

# 导入并注册互动式认知测试端点（新增 LLM 集成）
# 使用动态导入方法以确保在部署环境中正常工作
import sys
import os
import importlib.util

# 获取当前文件的目录
current_dir = os.path.dirname(os.path.abspath(__file__))

# 构建endpoints.interactive模块的完整路径
interactive_path = os.path.join(current_dir, 'endpoints', 'interactive.py')

if os.path.exists(interactive_path):
    try:
        # 动态加载模块
        spec = importlib.util.spec_from_file_location("interactive", interactive_path)
        interactive_module = importlib.util.module_from_spec(spec)
        sys.modules["interactive"] = interactive_module  # 注册到sys.modules
        spec.loader.exec_module(interactive_module)
        
        # 获取并注册路由
        if hasattr(interactive_module, 'router'):
            interactive_router = interactive_module.router
            app.include_router(interactive_router)
            print("✓ LLM互动式端点已注册")
        else:
            print("✗ LLM互动式端点不可用: 模块中没有找到router")
    except Exception as e:
        print(f"✗ LLM互动式端点不可用: {e}")
        print("⚠️  LLM互动功能将不可用，但核心功能正常")
else:
    print("✗ LLM互动式端点不可用: 文件不存在", interactive_path)
    print("⚠️  LLM互动功能将不可用，但核心功能正常")

# 确保所需导入存在
try:
    from pydantic import BaseModel
    from typing import Optional, List, Dict, Any, Union
    import json
    import math
    import random
    from datetime import datetime
    import uvicorn
    from fastapi import FastAPI, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
except ImportError as e:
    print(f"必要的依赖未找到: {e}")
    exit(1)


@app.get("/health")
async def health():
    """Health check endpoint (JSON)"""
    return {
        "message": "认知陷阱平台API服务正常运行",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
    }


@app.get("/scenarios/")
async def get_scenarios():
    """获取所有认知陷阱场景"""
    # 从文件加载场景数据以确保使用最新内容
    try:
        scenarios_file = os.path.join(os.path.dirname(__file__), 'data', 'scenarios.json')
        if os.path.exists(scenarios_file):
            with open(scenarios_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                scenarios = data.get('scenarios', SCENARIOS)
        else:
            scenarios = SCENARIOS
    except Exception as e:
        print(f"加载场景数据文件失败: {e}")
        scenarios = SCENARIOS
    
    return {"scenarios": scenarios}


@app.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str):
    """获取特定场景详情"""
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景未找到")
    return scenario


@app.post("/scenarios/create_game_session")
async def create_game_session(
    scenario_id: str = Query(..., alias="scenario_id"),
    difficulty: str = Query(
        "auto", description="难度级别: beginner, intermediate, advanced, 或 auto"
    ),
):
    """创建游戏会话，支持不同难度级别"""
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景未找到")

    # 根据难度参数调整场景
    selected_scenario = scenario.copy()

    if difficulty != "auto":
        # 如果指定了具体难度，查找对应的高级挑战内容
        if difficulty != scenario["difficulty"]:
            # 在高级挑战中查找匹配难度的挑战
            matching_challenge = None
            if "advancedChallenges" in scenario:
                for challenge in scenario["advancedChallenges"]:
                    if challenge["difficulty"] == difficulty:
                        matching_challenge = challenge
                        break

            if matching_challenge:
                # 用高级挑战的信息更新场景
                selected_scenario["name"] = (
                    f"{scenario['name']} - {matching_challenge['title']}"
                )
                selected_scenario["description"] = matching_challenge["description"]
                selected_scenario["targetPatterns"] = matching_challenge[
                    "decisionPatterns"
                ]
                selected_scenario["decisionPattern"] = ", ".join(
                    matching_challenge["decisionPatterns"]
                )

    # 生成会话ID
    session_id = (
        f"session_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}"
    )

    # 根据难度初始化不同的游戏状态（增强版：包含决策历史）
    initial_state = {
        "resources": 1000,  # 初始资源
        "satisfaction": 50,  # 客户满意度
        "reputation": 50,  # 声誉
        "knowledge": 0,  # 知识水平
        "turn_number": 1,  # 回合数
        "difficulty": difficulty
        if difficulty != "auto"
        else selected_scenario["difficulty"],  # 记录难度
        "challenge_type": "base"
        if difficulty == "auto" or difficulty == scenario["difficulty"]
        else "advanced",  # 挑战类型
        # ===== 增强字段：决策历史和认知偏误追踪 =====
        "decision_history": [],  # 决策历史: [{"turn": 1, "decision": {...}, "result": {...}}]
        "detected_biases": [],  # 检测到的认知偏误: [{"turn": 2, "bias": "过度自信", "evidence": "..."}]
        "user_patterns": {  # 用户决策模式
            "risk_preference": None,
            "pace_preference": None,
            "decision_style": None
        }
    }

    # 存储会话（增强版）
    game_sessions[session_id] = {
        "session_id": session_id,
        "scenario_id": scenario_id,
        "scenario": selected_scenario,  # 使用可能已调整的场景
        "turn": 1,
        "game_state": initial_state,
        "created_at": datetime.now().isoformat(),
        "history": [],
        "difficulty": difficulty
        if difficulty != "auto"
        else selected_scenario["difficulty"],
        # ===== 增强字段 =====
        "pattern_tracker": DecisionPatternTracker(),  # 每个会话独立的追踪器
        "decision_count": 0,
    }

    return {
        "success": True,
        "game_id": session_id,
        "message": f"游戏会话已创建",
        "difficulty": initial_state["difficulty"],
        "challenge_type": initial_state["challenge_type"],
    }


@app.post("/scenarios/{game_id}/turn")
async def execute_turn(game_id: str, decisions: Dict[str, Any]):
    """执行游戏回合（增强版：决策追踪+困惑时刻+个性化反馈）"""
    if game_id not in game_sessions:
        raise HTTPException(status_code=404, detail="游戏会话未找到")

    session = game_sessions[game_id]
    scenario_id = session["scenario_id"]
    current_state = session["game_state"].copy()
    difficulty = session.get("difficulty", "beginner")  # 获取难度级别

    # ===== 增强功能：追踪决策模式 =====
    pattern_tracker = session.get("pattern_tracker")
    if pattern_tracker:
        pattern_tracker.track_decision(scenario_id, decisions, current_state)

    # 根据场景类型和难度执行真实的逻辑处理
    new_state = execute_real_logic(
        scenario_id, current_state, decisions, difficulty=difficulty
    )

    # 更新回合数
    new_state["turn_number"] = current_state["turn_number"] + 1

    # ===== 增强功能：记录决策历史 =====
    decision_record = {
        "turn": current_state["turn_number"],
        "decisions": decisions,
        # NOTE: deliberately NOT embedding new_state here. Previously each
        # decision_record embedded the full new_state (which itself contained
        # the full decision_history), causing O(2^N) response growth.
        # Consumers (feedback_real.py, turn_helpers.py) only need the
        # `decisions` field — the latest state is always available in the
        # response's top-level `game_state`. See docs/audit-2026-09-07.md.
        "difficulty": difficulty,
        "timestamp": datetime.now().isoformat()
    }
    new_state["decision_history"] = current_state.get("decision_history", []) + [decision_record]

    # 更新会话状态
    session["game_state"] = new_state
    session["turn"] += 1
    session["decision_count"] = session.get("decision_count", 0) + 1

    # 记录历史
    session["history"].append(decision_record)

    # ===== 增强功能：生成个性化反馈 =====
    # 第1-2回合：制造困惑（只给结果，不揭示模式）
    # 第3回合：分析决策模式
    # 第4+回合：个性化深入反馈
    turn_number = new_state["turn_number"]

    if turn_number <= 2:
        # 早期回合：制造困惑时刻
        feedback = generate_confusion_feedback(
            scenario_id, decisions, current_state, new_state,
            decision_history=new_state.get("decision_history", []),
            turn_number=turn_number
        )
    elif turn_number == 3:
        # 第3回合：分析决策模式
        pattern_detected = detect_decision_pattern(
            scenario_id, new_state.get("decision_history", [])
        )
        if pattern_detected:
            new_state["detected_patterns"] = current_state.get("detected_patterns", []) + [pattern_detected]
            cross_scenario_analyzer.record_pattern(scenario_id, pattern_detected["pattern_type"])

        feedback = generate_pattern_analysis_feedback(
            scenario_id, decisions, current_state, new_state,
            decision_history=new_state.get("decision_history", []),
            pattern_detected=pattern_detected
        )
    else:
        # 后续回合：个性化深入反馈
        feedback = generate_advanced_feedback(
            scenario_id, decisions, current_state, new_state,
            decision_history=new_state.get("decision_history", []),
            pattern_tracker=pattern_tracker,
            turn_number=turn_number,
            cross_scenario_analyzer=cross_scenario_analyzer,  # R9.1: inject instead of global
        )

    # 立即响应机制，增加用户交互反馈
    immediate_response = {
        "status": "processed",
        "turnNumber": new_state["turn_number"],
        "feedback": feedback,
        "game_state": new_state,
        "immediate_acknowledgment": True,
        "processing_time_ms": 100,
        "user_interaction_response": "您的决策已记录，正在计算结果...",
        "difficulty": difficulty,
        # ===== 增强字段 =====
        "decision_count": session.get("decision_count", 0),
        "has_personalized_insight": turn_number >= 3,
    }

    return {
        "success": True,
        "turnNumber": new_state["turn_number"],
        "feedback": feedback,
        "game_state": new_state,
        "immediate_response": immediate_response,
        "difficulty": difficulty,
    }


from logic.turn_executor import execute_real_logic

from logic.turn_helpers import detect_decision_pattern, generate_confusion_feedback

from logic.feedback_real import generate_real_feedback, generate_pattern_analysis_feedback, generate_advanced_feedback


# ============================================================================
# 根路径 + 静态文件服务（R6.3 拆分：从 feedback_real.py 移回）
# ============================================================================
@app.get("/")
async def serve_api_status():
    """根路径 - 返回 API 状态信息"""
    return {
        "status": "success",
        "message": "认知陷阱平台API服务正常运行",
        "version": "2.0.0",
        "endpoints": {
            "scenarios": "/scenarios/",
            "scenario_detail": "/scenarios/{scenario_id}",
            "create_session": "/scenarios/create_game_session",
            "process_turn": "/scenarios/{game_id}/turn",
            "health": "/health",
        }
    }


@app.post("/analysis/thinking-traps")
async def analyze_thinking_traps(request_data: Dict[str, Any]):
    """分析用户在游戏过程中的思维陷阱（游戏结束后调用）"""
    try:
        game_history = request_data.get("game_history", [])
        scenario_id = request_data.get("scenario_id", "")
        if not game_history:
            return {"message": "未提供游戏历史数据", "analysis": {}, "status": "error"}
        analysis = {
            "total_decisions": len(game_history),
            "scenario_id": scenario_id,
            "identified_patterns": [],
            "thinking_trap_warnings": [],
            "improvement_suggestions": [],
        }
        options_chosen = [d.get("decisions", {}).get("option", "") for d in game_history if "decisions" in d]
        if len(options_chosen) >= 3 and len(set(options_chosen)) == 1:
            analysis["identified_patterns"].append({
                "type": "重复性决策模式",
                "description": f"在{len(options_chosen)}次决策中，您总是选择相同的选项 '{options_chosen[0]}'",
                "potential_issue": "可能反映出缺乏灵活性或对其他选项的探索不足",
            })
        if "1" in options_chosen:
            aggressive_count = options_chosen.count("1")
            if aggressive_count >= len(options_chosen) * 0.7:
                analysis["thinking_trap_warnings"].append({
                    "trap_type": "激进决策倾向",
                    "description": "倾向于选择最激进或最立即的选项",
                    "impact": "可能导致高风险或短期导向的决策",
                })
        if "2" in options_chosen or "4" in options_chosen:
            conservative_count = options_chosen.count("2") + options_chosen.count("4")
            if conservative_count >= len(options_chosen) * 0.7:
                analysis["thinking_trap_warnings"].append({
                    "trap_type": "保守决策倾向",
                    "description": "倾向于选择最保守或最安全的选项",
                    "impact": "可能导致错失机会或过度规避风险",
                })
        if analysis["thinking_trap_warnings"]:
            analysis["improvement_suggestions"].append({
                "suggestion": "尝试更多样化的选项，避免过度依赖单一决策模式",
                "rationale": "多样化决策有助于识别和克服潜在的思维局限",
            })
        else:
            analysis["improvement_suggestions"].append({
                "suggestion": "您的决策模式显示出灵活性，继续保持开放思维",
                "rationale": "灵活的决策方法有助于在复杂情况下找到最优方案",
            })
        if "coffee-shop" in scenario_id:
            analysis["improvement_suggestions"].append({
                "suggestion": "在资源分配决策中，考虑非线性效应和边际收益递减",
                "rationale": "增加投入并不总是带来线性回报",
            })
        elif "investment" in scenario_id:
            analysis["improvement_suggestions"].append({
                "suggestion": "平衡短期收益与长期影响，考虑复利效应",
                "rationale": "长期视角有助于识别短期决策的真正影响",
            })
        elif "relationship" in scenario_id:
            analysis["improvement_suggestions"].append({
                "suggestion": "注意时间延迟效应，考虑决策的长期后果",
                "rationale": "关系中的决策效果往往需要时间才能显现",
            })
        return {"message": "思维陷阱分析完成", "analysis": analysis, "status": "success"}
    except Exception as e:
        return {"message": f"分析过程中出现错误: {str(e)}", "analysis": {}, "status": "error"}


@app.get("/test-home")
async def test_home():
    """临时测试路由（验证 index.html 是否存在）"""
    index_path = os.path.join(_project_root, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read(500)
        return HTMLResponse(content=f"<h1>测试路由</h1><p>文件存在，前500字符：</p><pre>{content}</pre>")
    return {"message": "index.html not found", "path_checked": index_path}


@app.get("/{full_path:path}")
async def serve_not_found(full_path: str):
    """其他路径返回 404"""
    api_paths = ["scenarios", "health", "api", "docs", "openapi.json", "redoc", "interactive", "analysis", "test"]
    for api_path in api_paths:
        if api_path in full_path:
            raise HTTPException(status_code=404, detail=f"API端点未找到: /{full_path}")
    raise HTTPException(status_code=404, detail="页面未找到")


if __name__ == "__main__":
    # 优先使用环境变量 PORT（Railway、Render 等云平台）
    # 然后尝试命令行参数，最后使用默认端口 8081
    port = int(os.getenv("PORT", sys.argv[1] if len(sys.argv) > 1 else 8000))
    print(f"🚀 启动认知陷阱平台API服务器 (端口: {port})")
    print(f"📊 API文档: http://localhost:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)
