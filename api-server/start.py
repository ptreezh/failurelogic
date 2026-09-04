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
        "result_state": new_state.copy(),
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
            turn_number=turn_number
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


def execute_real_logic(
    scenario_id: str, current_state: Dict, decisions: Dict, difficulty: str = "beginner"
) -> Dict:
    """执行真实的业务逻辑，支持不同难度级别"""
    new_state = current_state.copy()

    # 根据不同场景和难度执行逻辑
    if scenario_id == "coffee-shop-linear-thinking":
        # 咖啡店场景：线性思维陷阱
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)

        if difficulty == "beginner":
            # 基础难度：简单的非线性效应
            if action == "hire_staff":
                # 非线性效应：员工增加不等于满意度线性提升
                cost = amount * 200
                new_state["resources"] -= cost

                # 非线性效果：员工过多反而效率下降
                if amount <= 3:
                    satisfaction_gain = amount * 8  # 每个员工增加8点满意度
                elif amount <= 6:
                    satisfaction_gain = amount * 5  # 效率下降
                else:
                    satisfaction_gain = amount * 2  # 严重效率下降

                new_state["satisfaction"] = min(
                    100, new_state["satisfaction"] + satisfaction_gain
                )
                new_state["reputation"] = min(
                    100, new_state["reputation"] + satisfaction_gain // 2
                )

            elif action == "marketing":
                # 营销投入的递减效应
                new_state["resources"] -= amount

                if amount <= 200:
                    effect = amount // 10  # 1:10的效果
                elif amount <= 500:
                    effect = 20 + (amount - 200) // 20  # 递减效果
                else:
                    effect = 35  # 饱和效应

                new_state["satisfaction"] = min(100, new_state["satisfaction"] + effect)
                new_state["reputation"] = min(
                    100, new_state["reputation"] + effect // 2
                )

        elif difficulty in ["intermediate", "advanced"]:
            # 高级难度：包含指数增长和复杂系统效应
            if action == "hire_staff":
                cost = amount * 200
                new_state["resources"] -= cost

                # 引入更复杂的非线性效应
                base_satisfaction = amount * 8
                # 添加效率衰减因子：更多员工导致效率下降
                efficiency_factor = 1 / (1 + 0.1 * amount)  # 随员工数增加效率下降
                satisfaction_gain = base_satisfaction * efficiency_factor

                new_state["satisfaction"] = min(
                    100, new_state["satisfaction"] + satisfaction_gain
                )

                # 在高级难度中引入复杂系统效应
                if difficulty == "advanced":
                    # 可能引发连锁效应
                    reputation_change = satisfaction_gain // 2
                    new_state["reputation"] = min(
                        100, new_state["reputation"] + reputation_change
                    )

                    # 添加供应商网络复杂性
                    if amount > 4:
                        # 过多员工可能导致内部协调成本增加
                        coordination_cost = min(20, (amount - 4) * 3)
                        new_state["satisfaction"] -= coordination_cost

            elif action == "marketing":
                new_state["resources"] -= amount

                if difficulty == "intermediate":
                    # 中级难度：添加通胀和时间价值的因素
                    effect = amount // 10
                    # 一段时间后营销效果会衰减
                    effect *= (1 + 0.05) ** (
                        new_state["turn_number"] // 5
                    )  # 每5回合增加5%效果
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + effect
                    )
                elif difficulty == "advanced":
                    # 高级难度：复杂网络效应和指数增长
                    effect = amount // 10
                    # 添加社交网络效应，营销效果呈指数增长
                    network_multiplier = min(
                        3, 1 + (new_state["reputation"] / 50)
                    )  # 声誉越好网络效应越强
                    effect *= network_multiplier
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + effect
                    )

            elif action == "supply_chain":
                # 供应链管理 - 高级难度特有的挑战
                if difficulty in ["intermediate", "advanced"]:
                    # 供应链中的指数增长效应
                    supply_investment = amount
                    new_state["resources"] -= supply_investment

                    # 供应商网络的复杂性
                    # 初始效益是线性的，但随着网络扩大，协调成本呈指数增长
                    supply_benefit = min(supply_investment * 0.8, 50)  # 最大50点效益
                    coordination_cost = min(
                        30, (supply_investment / 50) ** 2 * 100
                    )  # 协调成本随投资平方增长

                    net_effect = supply_benefit - coordination_cost
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + max(0, net_effect)
                    )

                    # 在高级难度中，网络效应可能带来指数收益
                    if difficulty == "advanced" and supply_investment > 100:
                        # 巨大投资可能触发网络效应，带来指数增长收益
                        network_effect = (
                            supply_investment / 100
                        ) ** 1.5 * 10  # 1.5次方增长
                        new_state["satisfaction"] = min(
                            100, new_state["satisfaction"] + network_effect
                        )

    elif scenario_id == "relationship-time-delay":
        # 关系场景：时间延迟效应
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)

        if difficulty == "beginner":
            if action == "communication":
                # 沟通的时间成本和延迟效果
                time_cost = amount * 10
                new_state["resources"] -= time_cost

                # 即时效果较小
                immediate_effect = amount * 2
                new_state["satisfaction"] = min(
                    100, new_state["satisfaction"] + immediate_effect
                )

            elif action == "gift":
                new_state["resources"] -= amount

                # 礼物的即时效果和延迟效果
                immediate_effect = amount // 20
                new_state["satisfaction"] = min(
                    100, new_state["satisfaction"] + immediate_effect
                )

        elif difficulty in ["intermediate", "advanced"]:
            if action == "communication":
                time_cost = amount * 10
                new_state["resources"] -= time_cost

                if difficulty == "intermediate":
                    # 中级难度：加入关系投资的复利效应
                    immediate_effect = amount * 1.5  # 立即满意度提升
                    # 为未来回合存储长期收益
                    long_term_value = amount * 0.5  # 关系投资的长期价值
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + immediate_effect
                    )
                    if "relationship_investment" not in new_state:
                        new_state["relationship_investment"] = 0
                    new_state["relationship_investment"] += long_term_value

                elif difficulty == "advanced":
                    # 高级难度：复杂关系网络和级联效应
                    # 通信投资也会在社交网络中产生连锁反应
                    immediate_effect = amount * 1.2
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + immediate_effect
                    )

                    # 长期关系复利效应
                    if "relationship_investment" not in new_state:
                        new_state["relationship_investment"] = 0
                    # 复利效应：之前的投资现在开始产生收益
                    previous_investments_return = (
                        new_state["relationship_investment"] * 0.1
                    )
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + previous_investments_return
                    )

            elif action == "gift":
                new_state["resources"] -= amount

                if difficulty == "intermediate":
                    # 中级难度：礼物的长期复利效应
                    immediate_effect = amount // 25
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + immediate_effect
                    )

                    # 为未来回合存储长期效应
                    if "gift_investment" not in new_state:
                        new_state["gift_investment"] = 0
                    new_state["gift_investment"] += amount * 0.05  # 礼物投资的长期价值

                elif difficulty == "advanced":
                    # 高级难度：复杂关系网络效应
                    immediate_effect = amount // 30
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + immediate_effect
                    )

                    # 网络效应：礼物可能影响更广泛的社交圈
                    network_effect = (amount / 100) ** 1.2  # 网络效应呈指数增长
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + network_effect
                    )

    elif scenario_id == "investment-confirmation-bias":
        # 投资场景：确认偏误
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)

        if difficulty == "beginner":
            if action == "research":
                # 研究投入增加知识但存在确认偏误
                cost = amount * 20
                new_state["resources"] -= cost

                knowledge_gain = amount * 8
                new_state["knowledge"] = min(
                    100, new_state["knowledge"] + knowledge_gain
                )

            elif action == "diversify":
                # 分散投资降低风险
                new_state["resources"] -= amount

                # 分散投资的效果（较低风险，较低回报）
                satisfaction_change = amount // 20
                new_state["satisfaction"] = min(
                    100, new_state["satisfaction"] + satisfaction_change
                )
                new_state["reputation"] = min(
                    100, new_state["reputation"] + satisfaction_change // 2
                )

        elif difficulty in ["intermediate", "advanced"]:
            if action == "research":
                cost = amount * 20
                new_state["resources"] -= cost

                if difficulty == "intermediate":
                    # 中级难度：引入通胀调整
                    knowledge_gain = amount * 8
                    new_state["knowledge"] = min(
                        100, new_state["knowledge"] + knowledge_gain
                    )

                    # 研究投资的长期通胀调整效应
                    inflation_adjustment = 1 - (
                        new_state["turn_number"] * 0.01
                    )  # 每回合通胀率1%
                    real_knowledge = knowledge_gain * inflation_adjustment
                    new_state["knowledge"] = min(
                        100, new_state["knowledge"] + real_knowledge
                    )

                elif difficulty == "advanced":
                    # 高级难度：复杂金融系统和系统性风险
                    knowledge_gain = amount * 8
                    new_state["knowledge"] = min(
                        100, new_state["knowledge"] + knowledge_gain
                    )

                    # 考虑市场波动和系统性风险
                    market_volatility = 0.1  # 市场波动率
                    risk_factor = (
                        amount / 1000
                    ) * market_volatility  # 风险与投资金额相关
                    adjusted_knowledge = knowledge_gain * (1 - risk_factor)
                    new_state["knowledge"] = min(
                        100, new_state["knowledge"] + adjusted_knowledge
                    )

            elif action == "diversify":
                new_state["resources"] -= amount

                if difficulty == "intermediate":
                    # 中级难度：加入复利考虑
                    satisfaction_change = amount // 20
                    # 考虑长期复利效应
                    compound_factor = (1 + 0.05) ** (
                        new_state["turn_number"] // 3
                    )  # 每3回合复利增长
                    real_satisfaction = satisfaction_change * compound_factor
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + real_satisfaction
                    )
                    new_state["reputation"] = min(
                        100, new_state["reputation"] + real_satisfaction // 2
                    )

                elif difficulty == "advanced":
                    # 高级难度：复杂金融系统和相关性误判
                    satisfaction_change = amount // 20

                    # 模拟真实金融中的相关性幻觉
                    # 短期内资产看似不相关，长期内高度相关
                    correlation_factor = 1 - (
                        0.7 * (1 - 1 / (1 + new_state["turn_number"] * 0.1))
                    )  # 随时间增加相关性
                    real_satisfaction = satisfaction_change * correlation_factor
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + real_satisfaction
                    )

                    # 在高级难度中添加通胀考虑
                    inflation_rate = 0.03  # 3%通胀率
                    real_reputation = (amount // 20) / (1 + inflation_rate) ** (
                        new_state["turn_number"] // 5
                    )
                    new_state["reputation"] = min(
                        100, new_state["reputation"] + real_reputation
                    )

    # ===== 新增：为game-001（商业战略推理游戏）添加逻辑 =====
    elif scenario_id == "game-001":
        option = decisions.get("option", "1")

        if option == "1":  # 立即投放市场
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 30)
            new_state["reputation"] = max(0, new_state["reputation"] - 20)

        elif option == "2":  # 完善产品后上市
            new_state["resources"] -= 50
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 50)
            new_state["reputation"] = min(100, new_state["reputation"] + 30)

        elif option == "3":  # 收购竞争对手
            new_state["resources"] -= 100
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 20)
            new_state["reputation"] = max(0, new_state["reputation"] - 10)

        else:  # 合作开发
            new_state["resources"] -= 30
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 40)
            new_state["reputation"] = min(100, new_state["reputation"] + 20)

    # ===== 新增：为game-002（公共政策制定模拟）添加逻辑 =====
    elif scenario_id == "game-002":
        option = decisions.get("option", "1")

        if option == "1":  # 建设地铁
            new_state["resources"] -= 200
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 60)
            new_state["reputation"] = min(100, new_state["reputation"] + 40)

        elif option == "2":  # 扩大公交网络
            new_state["resources"] -= 100
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 40)

        elif option == "3":  # 征收拥堵费
            new_state["satisfaction"] = max(0, new_state["satisfaction"] - 30)
            new_state["resources"] += 50  # 收入

        else:  # 自行车道
            new_state["resources"] -= 50
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 30)

    # ===== 新增：为game-003（个人理财决策模拟）添加逻辑 =====
    elif scenario_id == "game-003":
        option = decisions.get("option", "1")

        if option == "1":  # 买车
            new_state["resources"] -= 50000
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 20)

        elif option == "2":  # 全部存银行
            new_state["resources"] += 50000
            new_state["satisfaction"] = max(0, new_state["satisfaction"] - 10)

        elif option == "3":  # 投资股票
            import random
            new_state["resources"] = int(new_state["resources"] * (1 + random.uniform(-0.3, 0.5)))

        else:  # 指数基金
            new_state["resources"] = int(new_state["resources"] * 1.07)
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 10)

    # ===== 新增：为hist-001（挑战者号）添加逻辑 =====
    elif scenario_id == "hist-001":
        decision = decisions.get("decision", "launch")

        if decision == "delay":  # 推迟发射
            new_state["satisfaction"] = 100
            new_state["reputation"] = min(100, new_state["reputation"] + 50)
        else:  # 按计划发射
            new_state["satisfaction"] = 0
            new_state["reputation"] = max(0, new_state["reputation"] - 80)

    # ===== 新增：为hist-002（泰坦尼克号）添加逻辑 =====
    elif scenario_id == "hist-002":
        decision = decisions.get("decision", "fast_route")

        if decision == "safe_route":  # 安全航线
            new_state["satisfaction"] = 100
            new_state["reputation"] = min(100, new_state["reputation"] + 30)
        else:  # 快速航线
            new_state["satisfaction"] = 0
            new_state["reputation"] = max(0, new_state["reputation"] - 90)

    # ===== 新增：为hist-003（猪湾事件）添加逻辑 =====
    elif scenario_id == "hist-003":
        decision = decisions.get("decision", "covert")

        if decision == "full_support":  # 全面军事支持
            new_state["satisfaction"] = 70
            new_state["reputation"] = max(0, new_state["reputation"] - 20)
        else:  # 秘密行动
            new_state["satisfaction"] = 10
            new_state["reputation"] = max(0, new_state["reputation"] - 60)

    # ===== 新增：为adv-game-001（全球气候变化政策制定博弈）添加逻辑 =====
    elif scenario_id == "adv-game-001":
        option = decisions.get("option", "1")

        if option == "1":  # 统一目标
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 30)
            new_state["reputation"] = max(0, new_state["reputation"] - 10)
        elif option == "2":  # 差异化目标
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 50)
            new_state["reputation"] = min(100, new_state["reputation"] + 20)
        elif option == "3":  # 碳交易市场
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 60)
            new_state["resources"] += 100
        else:  # 技术转移
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 55)
            new_state["resources"] -= 50

    # ===== 新增：为adv-game-002（AI治理与监管决策模拟）添加逻辑 =====
    elif scenario_id == "adv-game-002":
        option = decisions.get("option", "1")

        if option == "1":  # 基于任务能力
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 40)
            new_state["knowledge"] = min(100, new_state["knowledge"] + 30)
        elif option == "2":  # 安全和可控性优先
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 50)
            new_state["reputation"] = min(100, new_state["reputation"] + 40)
        elif option == "3":  # 伦理合规
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 45)
            new_state["reputation"] = min(100, new_state["reputation"] + 50)
        else:  # 综合框架
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 55)
            new_state["knowledge"] = min(100, new_state["knowledge"] + 40)
            new_state["reputation"] = min(100, new_state["reputation"] + 30)

    # ===== 新增：为adv-game-003（复杂金融市场危机应对模拟）添加逻辑 =====
    elif scenario_id == "adv-game-003":
        option = decisions.get("option", "1")

        if option == "1":  # 立即加强监管
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 50)
            new_state["reputation"] = min(100, new_state["reputation"] + 40)
        elif option == "2":  # 提高资本充足率
            new_state["resources"] -= 200
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 45)
            new_state["reputation"] = min(100, new_state["reputation"] + 35)
        elif option == "3":  # 压力测试
            new_state["knowledge"] = min(100, new_state["knowledge"] + 60)
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 40)
        else:  # 加强监控
            new_state["knowledge"] = min(100, new_state["knowledge"] + 20)
            new_state["satisfaction"] = max(0, new_state["satisfaction"] - 10)

    # 确保数值在合理范围内
    new_state["resources"] = max(0, new_state["resources"])
    new_state["satisfaction"] = max(0, min(100, new_state["satisfaction"]))
    new_state["reputation"] = max(0, min(100, new_state["reputation"]))
    new_state["knowledge"] = max(0, min(100, new_state["knowledge"]))

    return new_state


# ===== 增强反馈生成系统 =====

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
