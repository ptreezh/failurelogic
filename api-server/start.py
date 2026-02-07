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
import sys
import os
# 添加当前目录到Python路径，以便正确导入utils模块
sys.path.append(os.path.join(os.path.dirname(__file__)))
from utils.error_handlers import global_exception_handler, CustomException

# ===== 增强系统：决策模式追踪器 =====
class DecisionPatternTracker:
    """追踪用户的决策模式，识别决策倾向"""

    def __init__(self):
        self.patterns = {
            "risk_preference": [],      # 风险偏好: 保守/中性/激进
            "pace_preference": [],      # 节奏偏好: 立即/谨慎/延迟
            "information_style": [],    # 信息风格: 选择性/全面
            "decision_consistency": [], # 决策一致性
            "overconfidence_signals": [] # 自信度过高信号
        }

    def track_decision(self, scenario_id: str, decision: Dict, context: Dict):
        """记录单次决策并更新模式"""
        # 追踪风险偏好
        option = decision.get("option", "")
        action = decision.get("action", "")
        decision_type = decision.get("decision", "")

        # 根据不同场景类型分析风险偏好
        if option in ["1", "2", "3", "4"]:
            # game-001, game-002等: 1=激进/立即, 2=稳健/完善, 3=中等/收购, 4=保守/合作
            if option == "1":
                self.patterns["risk_preference"].append("激进")
                self.patterns["pace_preference"].append("立即")
            elif option == "2":
                self.patterns["risk_preference"].append("稳健")
                self.patterns["pace_preference"].append("谨慎")
            elif option == "3":
                self.patterns["risk_preference"].append("中等")
                self.patterns["pace_preference"].append("平衡")
            else:
                self.patterns["risk_preference"].append("保守")
                self.patterns["pace_preference"].append("合作")

        # 追踪决策一致性
        if len(self.patterns["risk_preference"]) > 0:
            current_risk = self.patterns["risk_preference"][-1]
            if len(self.patterns["risk_preference"]) >= 3:
                last_3 = self.patterns["risk_preference"][-3:]
                if len(set(last_3)) == 1:  # 连续3次相同
                    self.patterns["decision_consistency"].append("高度一致")
                elif len(set(last_3)) == 2:
                    self.patterns["decision_consistency"].append("中度一致")
                else:
                    self.patterns["decision_consistency"].append("多样化")

    def generate_personalized_insight(self) -> str:
        """生成个性化洞察反馈"""
        if not self.patterns["risk_preference"]:
            return ""

        insights = []

        # 分析风险偏好
        if len(self.patterns["risk_preference"]) >= 3:
            recent_risks = self.patterns["risk_preference"][-3:]
            aggressive_count = sum(1 for r in recent_risks if r == "激进")
            conservative_count = sum(1 for r in recent_risks if r == "保守")

            if aggressive_count >= 2:
                insights.append("📊 你的决策模式分析：\n你最近倾向于选择高风险选项。这显示了你的风险偏好。")
            elif conservative_count >= 2:
                insights.append("📊 你的决策模式分析：\n你最近倾向于选择保守选项。这显示了你的风险偏好。")

        # 分析决策一致性
        if len(self.patterns["decision_consistency"]) >= 2:
            recent_consistency = self.patterns["decision_consistency"][-1]
            if recent_consistency == "高度一致":
                insights.append("⚠️ 你连续多次选择了相似的策略，可能陷入了思维定势。")

        return "\n\n".join(insights) if insights else ""

# ===== 增强系统：跨场景决策模式分析器 =====
class CrossScenarioAnalyzer:
    """分析用户在多个场景中的决策模式"""

    def __init__(self):
        self.scenario_patterns = {}  # scenario_id -> detected_pattern
        self.pattern_frequency = defaultdict(list)  # pattern_type -> [scenario_ids]

    def record_pattern(self, scenario_id: str, pattern_type: str):
        """记录场景中检测到的决策模式"""
        self.scenario_patterns[scenario_id] = pattern_type
        self.pattern_frequency[pattern_type].append(scenario_id)

    def generate_cross_scenario_insight(self, user_scenarios: List[str]) -> str:
        """生成跨场景洞察"""
        if not user_scenarios:
            return ""

        # 统计用户在哪些场景中表现出哪些模式
        user_patterns = {}
        for scenario_id in user_scenarios:
            if scenario_id in self.scenario_patterns:
                pattern = self.scenario_patterns[scenario_id]
                if pattern not in user_patterns:
                    user_patterns[pattern] = []
                user_patterns[pattern].append(scenario_id)

        # 检测跨场景模式
        insights = []
        for pattern, scenarios in user_patterns.items():
            if len(scenarios) >= 2:
                scenario_names = [s.split("-")[0].replace("game", "游戏").replace("adv", "高级").replace("hist", "历史") for s in scenarios]
                insights.append(f"""
🔗 跨场景模式发现：
你在{len(scenarios)}个不同场景中都表现出**{pattern}**：
- {", ".join(scenario_names)}

这说明：{pattern}是你决策中的系统性模式，不仅在某一个领域，而是在多个情境中都会出现。

💡 系统性建议：在未来的决策中，刻意问自己："我是否又在采用{pattern}？"
""")

        return "\n".join(insights) if insights else ""


# 全局实例
pattern_tracker = DecisionPatternTracker()
cross_scenario_analyzer = CrossScenarioAnalyzer()


from fastapi.responses import JSONResponse

app = FastAPI(
    title="认知陷阱平台API",
    description="提供决策思维训练场景、游戏会话和分析服务，使用真实的逻辑实现（增强版）",
    version="2.0.0",
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # 添加中文支持
    allow_origin_regex=".*"
)

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

# 导入并注册测试结果端点
try:
    from endpoints.test_results import router as test_results_router

    app.include_router(test_results_router)
except ImportError:
    print("测试结果端点不可用")

# 导入并注册互动式认知测试端点（新增 LLM 集成）
try:
    from endpoints.interactive import router as interactive_router
    app.include_router(interactive_router)
    print("✓ LLM互动式端点已注册")
except ImportError:
    print("✗ LLM互动式端点不可用: No module named 'endpoints.interactive'")

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

def detect_decision_pattern(scenario_id: str, decision_history: List[Dict]) -> Optional[Dict]:
    """检测用户在决策历史中的模式"""
    if len(decision_history) < 2:
        return None

    # 分析决策模式
    options_chosen = [d.get("decisions", {}).get("option", "") for d in decision_history if "decisions" in d]
    actions_chosen = [d.get("decisions", {}).get("action", "") for d in decision_history if "decisions" in d]

    # 检测连续选择相同类型的激进选项
    if len(options_chosen) >= 2:
        aggressive_count = sum(1 for opt in options_chosen if opt == "1")  # option 1 通常是激进/立即
        if aggressive_count >= 2:
            return {
                "pattern_type": "激进/立即决策模式",
                "evidence": f"连续{aggressive_count}次选择激进/立即选项",
                "significance": "高"
            }

    # 检测连续选择保守选项
    if len(options_chosen) >= 2:
        conservative_count = sum(1 for opt in options_chosen if opt in ["2", "4"])  # option 2/4 通常是稳健/合作
        if conservative_count >= 2:
            return {
                "pattern_type": "保守/稳健决策模式",
                "evidence": f"连续{conservative_count}次选择保守选项",
                "significance": "中"
            }

    # 针对特定场景的模式检测
    if "coffee-shop" in scenario_id:
        amounts = [d.get("decisions", {}).get("amount", 0) for d in decision_history if "decisions" in d]
        if amounts and max(amounts) > 6:
            return {
                "pattern_type": "高投入决策模式",
                "evidence": f"投入了{max(amounts)}个单位，远超常规规模",
                "significance": "高"
            }

    return None


def generate_confusion_feedback(
    scenario_id: str,
    decisions: Dict,
    old_state: Dict,
    new_state: Dict,
    decision_history: List[Dict],
    turn_number: int
) -> str:
    """生成困惑时刻反馈（第1-2回合）- 只展示结果，不揭示偏误"""

    # 计算变化
    satisfaction_change = new_state["satisfaction"] - old_state["satisfaction"]
    resources_change = new_state["resources"] - old_state["resources"]

    # 咖啡店场景的困惑反馈
    if scenario_id == "coffee-shop-nonlinear-effects":
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)

        if action == "hire_staff":
            if turn_number == 1 and amount <= 3:
                return f"""
你雇了{amount}人，满意度从{old_state['satisfaction']}提升到{new_state['satisfaction']}。

投入{amount}人 → +{satisfaction_change}点满意度
效果：每人带来{satisfaction_change // amount}点提升

这个结果符合你的预期吗？
            """
            elif turn_number == 2 and amount > 3:
                expected_gain = amount * 8  # 用户可能预期的增长
                actual_gain = satisfaction_change
                return f"""
你雇了{amount}人，期望满意度大幅提升。
但实际只提升了{actual_gain}点（从{old_state['satisfaction']}到{new_state['satisfaction']}）。

投入{amount}人 → +{actual_gain}点满意度
效果：每人只带来{actual_gain // amount}点提升

🤔 你是否感到意外？
投入翻倍（{amount // 2}→{amount}），但效果没有翻倍。

在复杂系统中，效果往往不是简单的线性关系。
            """

    # game-001的困惑反馈
    elif scenario_id == "game-001":
        option = decisions.get("option", "")
        if option == "1":  # 立即投放市场
            return f"""
你选择了立即投放市场抢占先机。

结果：
- 销量: 超出预期 ✓
- 质量: 出现问题 ✗
- 满意度: {old_state['satisfaction']} → {new_state['satisfaction']} ({satisfaction_change:+d})
- 声誉: {old_state['reputation']} → {new_state['reputation']} ({new_state['reputation'] - old_state['reputation']:+d})

市场反应混合。这个结果符合你的预期吗？
            """

    # 默认困惑反馈
    return f"""
你的决策已执行。

状态变化：
- 满意度: {old_state['satisfaction']} → {new_state['satisfaction']} ({satisfaction_change:+d})
- 资源: {old_state['resources']} → {new_state['resources']} ({resources_change:+d})

继续观察后续效果...
    """


def generate_pattern_analysis_feedback(
    scenario_id: str,
    decisions: Dict,
    old_state: Dict,
    new_state: Dict,
    decision_history: List[Dict],
    pattern_detected: Optional[Dict]
) -> str:
    """生成决策模式分析反馈（第3回合）"""

    if not pattern_detected:
        # 如果没有检测到明显模式，提供一般性反馈
        return generate_real_feedback(scenario_id, decisions, old_state, new_state, "beginner")

    base_feedback = generate_real_feedback(scenario_id, decisions, old_state, new_state, "beginner")

    # 添加模式分析
    pattern_analysis = f"""

🔍 **决策模式分析**

经过{len(decision_history)}回合的观察，系统识别到：

🎯 **识别的决策模式**: {pattern_detected['pattern_type']}

📊 **证据**: {pattern_detected['evidence']}

⚠️ **重要性**: {pattern_detected['significance']}

这是你在当前场景中的决策特点。这种模式不仅在这个场景中出现，
在你的其他决策中也可能存在类似情况。

继续下一个回合，系统将提供更深入的个性化分析。
"""

    return base_feedback + bias_reveal


def generate_advanced_feedback(
    scenario_id: str,
    decisions: Dict,
    old_state: Dict,
    new_state: Dict,
    decision_history: List[Dict],
    pattern_tracker: Optional[DecisionPatternTracker],
    turn_number: int
) -> str:
    """生成高级个性化反馈（第4+回合）"""

    # 基础反馈
    base_feedback = generate_real_feedback(scenario_id, decisions, old_state, new_state, "beginner")

    # 添加模式分析
    additional_insight = ""

    if pattern_tracker:
        pattern_insight = pattern_tracker.generate_personalized_insight()
        if pattern_insight:
            additional_insight += f"\n\n{pattern_insight}"

    # 添加跨场景洞察（如果用户玩过多个场景）
    if turn_number >= 4:
        cross_scenario_insight = cross_scenario_analyzer.generate_cross_scenario_insight(
            [scenario_id]  # 这里应该传入用户玩过的所有场景ID
        )
        if cross_scenario_insight:
            additional_insight += f"\n\n{cross_scenario_insight}"

    # 添加持续性建议
    if additional_insight:
        additional_insight += """

✨ **下一步建议**
继续尝试不同的决策选项，观察结果如何变化。
系统将持续追踪你的决策模式，提供更深入的洞察。
"""

    return base_feedback + additional_insight if additional_insight else base_feedback



def generate_real_feedback(
    scenario_id: str,
    decisions: Dict,
    old_state: Dict,
    new_state: Dict,
    difficulty: str = "beginner",
) -> str:
    """生成基于真实逻辑的反馈，支持不同难度级别"""
    action = decisions.get("action", "default")
    amount = decisions.get("amount", 0)

    # 计算变化值
    satisfaction_change = new_state["satisfaction"] - old_state["satisfaction"]
    resources_change = new_state["resources"] - old_state["resources"]
    knowledge_change = new_state["knowledge"] - old_state["knowledge"]

    if scenario_id == "coffee-shop-nonlinear-effects":
        if action == "hire_staff":
            if difficulty == "beginner":
                if amount > 6:
                    return "您雇佣了过多员工，导致效率下降。在复杂系统中，增加投入并不总是带来同比例回报。"
                elif amount > 3:
                    return "您增加了员工数量，但要注意边际效应递减的规律。"
                else:
                    return "合理的员工配置提升了客户满意度。"
            else:  # intermediate/advanced
                if amount > 6:
                    basic_feedback = "您雇佣了过多员工，导致效率下降。"
                    if difficulty == "intermediate":
                        additional_feedback = (
                            "在商业管理中，人员配置需要考虑非线性效应。"
                        )
                    else:  # advanced
                        additional_feedback = "复杂系统中，过多人力资源可能引发协调成本指数增长，这是连锁故障的常见原因。"
                    return basic_feedback + " " + additional_feedback
                elif amount > 3:
                    return "您增加了员工数量，但要注意边际效应递减的规律。在高级管理中，协调成本会随人员增加而快速上升。"
                else:
                    return "合理的员工配置提升了客户满意度。在复杂系统中，适度的人力配置能带来最优效果。"
        elif action == "marketing":
            if difficulty == "beginner":
                if amount > 500:
                    return "大量营销投入带来了饱和效应，收益递减明显。"
                else:
                    return "适度的营销投入有效提升了客户满意度。"
            else:  # intermediate/advanced
                if amount > 500:
                    basic_feedback = "大量营销投入带来了饱和效应，收益递减明显。"
                    if difficulty == "intermediate":
                        additional_feedback = (
                            "此外，营销投资需要考虑通胀调整后的实际价值。"
                        )
                    else:  # advanced
                        additional_feedback = "在网络效应下，营销影响力可能呈指数增长，但过度营销可能导致品牌稀释。"
                    return basic_feedback + " " + additional_feedback
                else:
                    return "适度的营销投入有效提升了客户满意度。在高难度下，营销效果可能因网络效应而放大。"
        elif action == "supply_chain" and difficulty in ["intermediate", "advanced"]:
            # 供应链管理的反馈
            supply_investment = amount
            if supply_investment > 100 and difficulty == "advanced":
                return "庞大的供应链投资可能触发网络效应，带来指数级收益，但也增加系统性风险。复杂系统中的网络效应体现了指数增长思维。"
            else:
                return "供应链管理体现了复杂系统思维。在中级难度下，协调成本随网络规模平方增长；在高级难度下，可能存在网络效应的指数收益。"

    elif scenario_id == "relationship-time-delay":
        if action == "communication":
            if difficulty == "beginner":
                return "沟通是关系维护的基础，但要注意效果的延迟性。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "沟通是关系维护的基础，但要注意效果的延迟性。长期关系投资具有复利效应，早期投入会在后期产生更大回报。"
                else:  # advanced
                    return "沟通不仅影响直接关系，还会在网络中产生级联效应。复杂关系网络中的投资具有复利和网络双重效应。"
        elif action == "gift":
            if difficulty == "beginner":
                return "礼物能带来即时的好感，但长期关系需要更多投入。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "礼物能带来即时的好感，但长期关系需要更多投入。关系投资具有复利效应，今天的投入会影响未来的回报。"
                else:  # advanced
                    return "礼物不仅影响直接关系，还会在社交网络中产生涟漪效应。复杂关系网络中，初始投入可能引发指数级的网络效应。"

    elif scenario_id == "investment-confirmation-bias":
        if action == "research":
            if difficulty == "beginner":
                return "研究增加了您的知识储备，但需要注意信息的全面性。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "研究增加了您的知识储备，但需要注意信息的全面性。同时，投资的实际价值需要考虑通胀调整。"
                else:  # advanced
                    return "研究增加了您的知识储备，但需要注意信息的全面性。金融系统具有复杂性，市场波动和系统性风险需要特别关注。"
        elif action == "diversify":
            if difficulty == "beginner":
                return "分散投资降低了风险，但也限制了潜在收益。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "分散投资降低了风险，但也限制了潜在收益。长期投资要考虑复利的时间价值。"
                else:  # advanced
                    return "分散投资降低了风险，但需警惕相关性幻觉。在系统性风险下，看似无关的资产可能高度相关。这是投资中的系统性风险。"

    # ===== 新增：为game-001（商业战略推理游戏）添加反馈 =====
    elif scenario_id == "game-001":
        option = decisions.get("option", "1")
        if option == "1":
            return "你选择了立即投放市场抢占先机。销量超出预期，但出现了少量质量问题报告。\n\n结果：快速上市带来了早期收益，但也暴露了产品质量问题。在商业决策中，'快'与'好'往往需要平衡，过度追求速度可能影响长期声誉。"
        elif option == "2":
            return "你选择完善产品后再上市。虽然延迟了上市时间，但产品质量更有保证。\n\n结果：产品质量得到了保障，但错失了早期市场机会。这是一种平衡质量与速度的策略。"
        elif option == "3":
            return "你选择收购竞争对手减少竞争。虽然减少了竞争压力，但成本大幅增加。\n\n结果：市场竞争减少，但高额成本可能影响盈利能力。收购整合的复杂性也需要考虑。"
        else:
            return "你选择与其他公司合作开发。虽然需要分享利润，但风险共担。\n\n结果：通过合作分散了风险并获得了互补资源，但利润需要分享。这是一种风险分担的策略。"

    # ===== 新增：为game-002（公共政策制定模拟）添加反馈 =====
    elif scenario_id == "game-002":
        option = decisions.get("option", "1")
        if option == "1":
            return "你选择了建设新地铁线路。虽然成本高，但长期效益显著。\n\n结果：基础设施投资需要平衡短期成本与长期收益。施工期间可能面临公众对扰民的不满，需要做好沟通工作。"
        elif option == "2":
            return "你选择扩大公交网络。成本适中，覆盖面广。\n\n结果：渐进式改进可能更适合当前预算和需求，通过多次小步骤优化系统。"
        elif option == "3":
            return "你选择征收拥堵费。虽然增加了收入，但引起了公众强烈不满。\n\n结果：政策制定需要平衡经济效益与公众接受度，忽视民众情绪可能影响政策实施效果。"
        else:
            return "你选择提供自行车道项目。低成本，环保健康。\n\n结果：低成本方案容易实施，但可能只能解决部分交通问题，需要与其他措施配合。"

    # ===== 新增：为game-003（个人理财决策模拟）添加反馈 =====
    elif scenario_id == "game-003":
        option = decisions.get("option", "1")
        if option == "1":
            return "你选择立即购买新车提升形象。\n\n结果：即时消费满足了当前需求，但消耗了应急资金，可能让你在意外情况下处于不利地位。"
        elif option == "2":
            return "你选择把钱全部存入银行。\n\n结果：资金安全性高，但可能面临通胀侵蚀购买力的风险。保守策略有其优势，但也可能错失增值机会。"
        elif option == "3":
            return f"你选择投入股票市场寻求高回报。当前资源：{new_state['resources']}。\n\n结果：高风险高回报，市场波动可能带来较大收益或损失。投资需要考虑风险承受能力。"
        else:
            return f"你选择投资低成本指数基金并保留应急资金。当前资源：{new_state['resources']}。\n\n结果：平衡了风险与收益，既保留了应急资金，又参与了市场增值。这是一种稳健的投资策略。"

    # ===== 新增：为hist-001（挑战者号）添加反馈 =====
    elif scenario_id == "hist-001":
        decision = decisions.get("decision", "launch")
        if decision == "delay":
            return "你选择推迟发射以评估低温风险。\n\n✅ 成功避免灾难！你的决策拯救了7名宇航员的生命。\n\n历史教训：在面对工程警告时，选择谨慎而非进度压力，可以避免悲剧。"
        else:
            return "你选择按计划发射。\n\n❌ 灾难发生了！O型环在低温下失效，航天飞机爆炸，7名宇航员遇难。\n\n历史复盘：工程师们警告了O型环在低温下的问题，但管理层选择了忽视警告，坚持发射。"

    # ===== 新增：为hist-002（泰坦尼克号）添加反馈 =====
    elif scenario_id == "hist-002":
        decision = decisions.get("decision", "fast_route")
        if decision == "safe_route":
            return "你选择传统安全航线，避开冰山区域。\n\n✅ 航行更慢但安全到达，无事故发生。\n\n历史教训：商业考量与安全考量之间的平衡至关重要。"
        else:
            return "你选择更快的航线追求速度记录。\n\n❌ 撞上冰山，船只沉没，1500多人丧生。\n\n历史复盘：'永不沉没'的称号让人们对风险估计不足，成功记录可能让人低估失败概率。"

    # ===== 新增：为hist-003（猪湾事件）添加反馈 =====
    elif scenario_id == "hist-003":
        decision = decisions.get("decision", "covert")
        if decision == "full_support":
            return "你选择提供全面军事支持和空中掩护。\n\n⚠️ 行动成功了，但美国的直接参与暴露无遗，造成外交尴尬。\n\n这是一个两难境地：要么失败（有限支持），要么尴尬（暴露参与）。在复杂决策中，有时候没有完美选项，只有不同类型的代价。"
        else:
            return "你选择秘密行动，避免显示美国直接参与。\n\n❌ 行动迅速失败，因为大幅减少了军事支持。\n\n历史复盘：政治考量可能压倒了军事判断，决策过程中可能存在不同意见但未被充分考虑。"

    # ===== 新增：为adv-game-001（全球气候变化政策制定博弈）添加反馈 =====
    elif scenario_id == "adv-game-001":
        option = decisions.get("option", "1")
        if option == "1":
            return "你制定统一的减排目标对所有国家一视同仁。\n\n结果：发展中国家强烈反对，认为这不公平。在复杂的多方博弈中，看似'公平'的统一标准可能因为各国实际情况不同而变得不公平。"
        elif option == "2":
            return "你根据历史累计排放量制定差异化目标。\n\n结果：更符合'共同但有区别的责任'原则。但执行和监督难度大，需要考虑各国实际情况。"
        elif option == "3":
            return "你建立碳排放交易市场，允许排放权买卖。\n\n结果：市场化手段提高了效率，但可能成为富国'购买排放权'的工具。需要平衡效率与公平。"
        else:
            return "你设定技术转移机制，发达国家支持发展中国家减排。\n\n结果：促进了技术扩散和全球合作，但技术转移的速度和质量需要有效保障。"

    # ===== 新增：为adv-game-002（AI治理与监管决策模拟）添加反馈 =====
    elif scenario_id == "adv-game-002":
        option = decisions.get("option", "1")
        if option == "1":
            return "你基于任务能力制定AI分级标准。\n\n结果：实用性强，易于理解和执行。但可能忽视安全和可控性维度。需要平衡效率与安全。"
        elif option == "2":
            return "你引入安全和可控性作为核心评估维度。\n\n结果：更注重风险防控。但可能抑制创新速度。监管的力度与创新的速度之间存在张力。"
        elif option == "3":
            return "你将伦理合规性作为核心评估维度。\n\n结果：符合人类价值观。但'伦理'标准难以统一和量化。不同文化对'伦理'的理解不同，需要考虑多样性。"
        else:
            return "你建立AI能力与风险的综合评估框架。\n\n结果：平衡了多个维度。但复杂度高，执行难度大。需要在理论完整性与实践可行性之间找到平衡。"

    # ===== 新增：为adv-game-003（复杂金融市场危机应对模拟）添加反馈 =====
    elif scenario_id == "adv-game-003":
        option = decisions.get("option", "1")
        if option == "1":
            return "你立即加强金融衍生品监管。\n\n结果：预防性措施，可能在危机前遏制风险。但市场信心可能受影响，需要平衡监管与市场活力。"
        elif option == "2":
            return "你提高银行资本充足率要求。\n\n结果：增强银行抗风险能力。但可能限制信贷，影响经济活力。更高的资本要求意味着银行放贷能力下降。"
        elif option == "3":
            return "你进行秘密的系统性风险压力测试。\n\n结果：了解真实风险暴露情况。但测试结果可能引发市场恐慌。需要平衡透明度与市场稳定性。"
        else:
            return "你加强市场监控，但不采取实质措施。\n\n结果：被动等待，可能错失最佳干预时机。在危机管理中，需要在及时行动与充分信息之间找到平衡。"

    # 默认反馈
    if satisfaction_change > 10:
        base_feedback = "您的决策取得了显著成效！"
    elif satisfaction_change > 0:
        base_feedback = "您的决策产生了积极影响。"
    elif satisfaction_change < -10:
        base_feedback = "这个决策可能需要重新考虑。"
    else:
        base_feedback = "决策已执行，正在观察效果。"

    # 根据难度添加深度反馈
    if difficulty == "intermediate":
        depth_feedback = " 在中级挑战中，您开始接触时间价值和复利思维的概念。"
    elif difficulty == "advanced":
        depth_feedback = (
            " 在高级挑战中，您面临复杂系统、网络效应和指数增长等高级认知偏差。"
        )
    else:
        depth_feedback = ""

    return base_feedback + depth_feedback


# 为前端提供静态文件服务（在所有API端点之后定义）
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os


# 挂载静态资源目录 - 使用绝对路径
import os
_current_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_current_dir)
app.mount("/assets", StaticFiles(directory=os.path.join(_project_root, "assets")), name="assets")
if os.path.exists(os.path.join(_project_root, "web-app")):
    app.mount("/web-app", StaticFiles(directory=os.path.join(_project_root, "web-app")), name="web_app")

# 为根路径提供主页（放在静态文件挂载之后，但路由会按定义顺序处理）
@app.get("/")
async def serve_home():
    """专门处理根路径，提供主页"""
    try:
        import os
        # 获取项目根目录 - 相对于start.py文件向上两级
        _current_dir = os.path.dirname(os.path.abspath(__file__))
        _project_root = os.path.dirname(_current_dir)
        index_path = os.path.join(_project_root, "index.html")

        print(f"DEBUG: 尝试从路径加载index.html: {index_path}")
        print(f"DEBUG: 文件是否存在: {os.path.exists(index_path)}")

        # 检查index.html是否存在
        if os.path.exists(index_path):
            with open(index_path, "r", encoding="utf-8") as f:
                content = f.read()
            print(f"DEBUG: 成功读取 {len(content)} 字符的文件")
            return HTMLResponse(content=content)
        else:
            # 如果在上级目录找不到，尝试在当前目录查找
            index_path = os.path.join(_current_dir, "index.html")
            print(f"DEBUG: 尝试从当前目录加载index.html: {index_path}")
            print(f"DEBUG: 文件是否存在: {os.path.exists(index_path)}")

            if os.path.exists(index_path):
                with open(index_path, "r", encoding="utf-8") as f:
                    content = f.read()
                print(f"DEBUG: 成功读取 {len(content)} 字符的文件")
                return HTMLResponse(content=content)
            else:
                # 如果都没找到，返回错误信息
                print(f"DEBUG: 未找到index.html文件")
                return HTMLResponse(content=f"<h1>错误：未找到index.html文件</h1><p>尝试路径：{index_path}</p>")
    except Exception as e:
        print(f"DEBUG: 加载主页时出错: {str(e)}")
        return {"message": f"加载主页时出错: {str(e)}", "status": "error"}

# 为其他路径提供静态文件服务
@app.get("/{full_path:path}")
async def serve_static(full_path: str):
    """提供静态文件服务"""
    # 对于其他路径，尝试从静态目录提供文件
    raise HTTPException(status_code=404, detail="文件未找到")

# 思维陷阱分析端点
@app.post("/analysis/thinking-traps")
async def analyze_thinking_traps(request_data: Dict[str, Any]):
    """
    分析用户在游戏过程中的思维陷阱
    在游戏结束后提供详细的思维模式分析
    """
    try:
        # 获取游戏历史和决策数据
        game_history = request_data.get("game_history", [])
        scenario_id = request_data.get("scenario_id", "")
        
        if not game_history:
            return {
                "message": "未提供游戏历史数据",
                "analysis": {},
                "status": "error"
            }
        
        # 分析决策模式
        analysis = {
            "total_decisions": len(game_history),
            "scenario_id": scenario_id,
            "identified_patterns": [],
            "thinking_trap_warnings": [],
            "improvement_suggestions": []
        }
        
        # 检测决策模式
        options_chosen = [d.get("decisions", {}).get("option", "") for d in game_history if "decisions" in d]
        actions_taken = [d.get("decisions", {}).get("action", "") for d in game_history if "decisions" in d]
        
        # 检测重复选择相同选项的模式
        if len(options_chosen) >= 3:
            unique_options = set(options_chosen)
            if len(unique_options) == 1:
                # 用户总是选择相同的选项
                repeated_option = options_chosen[0]
                analysis["identified_patterns"].append({
                    "type": "重复性决策模式",
                    "description": f"在{len(options_chosen)}次决策中，您总是选择相同的选项 '{repeated_option}'",
                    "potential_issue": "可能反映出缺乏灵活性或对其他选项的探索不足"
                })
        
        # 检测极端选项选择
        if "1" in options_chosen:
            aggressive_choices = options_chosen.count("1")
            if aggressive_choices >= len(options_chosen) * 0.7:  # 70%以上选择激进选项
                analysis["thinking_trap_warnings"].append({
                    "trap_type": "激进决策倾向",
                    "description": "倾向于选择最激进或最立即的选项",
                    "impact": "可能导致高风险或短期导向的决策"
                })
        
        # 检测保守选项选择
        if "2" in options_chosen or "4" in options_chosen:
            conservative_choices = options_chosen.count("2") + options_chosen.count("4")
            if conservative_choices >= len(options_chosen) * 0.7:  # 70%以上选择保守选项
                analysis["thinking_trap_warnings"].append({
                    "trap_type": "保守决策倾向", 
                    "description": "倾向于选择最保守或最安全的选项",
                    "impact": "可能导致错失机会或过度规避风险"
                })
        
        # 提供改进建议
        if analysis["thinking_trap_warnings"]:
            analysis["improvement_suggestions"].append({
                "suggestion": "在未来的决策中，尝试考虑更多样化的选项，避免过度依赖单一决策模式",
                "rationale": "多样化的决策方法可以帮助识别和克服潜在的思维局限"
            })
        else:
            analysis["improvement_suggestions"].append({
                "suggestion": "您的决策模式显示出一定的灵活性，继续保持开放的思维",
                "rationale": "灵活的决策方法有助于在复杂情况下找到最优解决方案"
            })
        
        # 根据场景类型提供特定分析
        if "coffee-shop" in scenario_id:
            analysis["improvement_suggestions"].append({
                "suggestion": "在资源分配决策中，考虑非线性效应和边际收益递减",
                "rationale": "增加投入并不总是带来线性回报，有时甚至会产生负面效果"
            })
        elif "investment" in scenario_id:
            analysis["improvement_suggestions"].append({
                "suggestion": "在投资决策中，平衡短期收益与长期影响，考虑复利效应",
                "rationale": "长期视角有助于识别短期决策的真正影响"
            })
        elif "relationship" in scenario_id:
            analysis["improvement_suggestions"].append({
                "suggestion": "在关系决策中，注意时间延迟效应，考虑决策的长期后果",
                "rationale": "关系中的决策效果往往需要时间才能显现"
            })
        
        return {
            "message": "思维陷阱分析完成",
            "analysis": analysis,
            "status": "success"
        }
        
    except Exception as e:
        return {
            "message": f"分析过程中出现错误: {str(e)}",
            "analysis": {},
            "status": "error"
        }


# 临时测试路由
@app.get("/test-home")
async def test_home():
    """测试路由，用于验证代码是否被执行"""
    import os
    _current_dir = os.path.dirname(os.path.abspath(__file__))
    _project_root = os.path.dirname(_current_dir)
    index_path = os.path.join(_project_root, "index.html")

    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read(500)  # 读取前500个字符
        return HTMLResponse(content=f"<h1>测试路由</h1><p>文件存在，前500个字符：</p><pre>{content}</pre>")
    else:
        return {"message": "index.html not found in project root", "path_checked": index_path}

if __name__ == "__main__":
    # 优先使用环境变量 PORT（Railway、Render 等云平台）
    # 然后尝试命令行参数，最后使用默认端口 8081
    port = int(os.getenv("PORT", sys.argv[1] if len(sys.argv) > 1 else 8081))
    print(f"🚀 启动认知陷阱平台API服务器 (端口: {port})")
    print(f"📊 API文档: http://localhost:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)
