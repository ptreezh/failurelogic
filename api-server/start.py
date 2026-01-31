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

# ===== 增强系统：决策模式追踪器 =====
class DecisionPatternTracker:
    """追踪用户的决策模式，识别认知偏误倾向"""

    def __init__(self):
        self.patterns = {
            "risk_preference": [],      # 风险偏好: 保守/中性/激进
            "pace_preference": [],      # 节奏偏好: 立即/谨慎/延迟
            "information_style": [],    # 信息风格: 选择性/全面
            "decision_consistency": [], # 决策一致性
            "overconfidence_signals": [] # 过度自信信号
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
                insights.append("📊 你的决策模式分析：\n你最近倾向于选择高风险选项。这可能显示过度自信倾向。")
            elif conservative_count >= 2:
                insights.append("📊 你的决策模式分析：\n你最近倾向于选择保守选项。这可能显示损失厌恶倾向。")

        # 分析决策一致性
        if len(self.patterns["decision_consistency"]) >= 2:
            recent_consistency = self.patterns["decision_consistency"][-1]
            if recent_consistency == "高度一致":
                insights.append("⚠️ 你连续多次选择了相似的策略，可能陷入了思维定势。")

        return "\n\n".join(insights) if insights else ""

# ===== 增强系统：跨场景认知偏误分析器 =====
class CrossScenarioAnalyzer:
    """分析用户在多个场景中的认知偏误模式"""

    def __init__(self):
        self.scenario_biases = {}  # scenario_id -> detected_bias
        self.bias_frequency = defaultdict(list)  # bias_type -> [scenario_ids]

    def record_bias(self, scenario_id: str, bias_type: str):
        """记录场景中检测到的认知偏误"""
        self.scenario_biases[scenario_id] = bias_type
        self.bias_frequency[bias_type].append(scenario_id)

    def generate_cross_scenario_insight(self, user_scenarios: List[str]) -> str:
        """生成跨场景洞察"""
        if not user_scenarios:
            return ""

        # 统计用户在哪些场景中表现出哪些偏误
        user_biases = {}
        for scenario_id in user_scenarios:
            if scenario_id in self.scenario_biases:
                bias = self.scenario_biases[scenario_id]
                if bias not in user_biases:
                    user_biases[bias] = []
                user_biases[bias].append(scenario_id)

        # 检测跨场景模式
        insights = []
        for bias, scenarios in user_biases.items():
            if len(scenarios) >= 2:
                scenario_names = [s.split("-")[0].replace("game", "游戏").replace("adv", "高级").replace("hist", "历史") for s in scenarios]
                insights.append(f"""
🔗 跨场景模式发现：
你在{len(scenarios)}个不同场景中都表现出**{bias}**：
- {", ".join(scenario_names)}

这说明：{bias}是你决策中的系统性偏误，不仅在某一个领域，而是在多个情境中都会出现。

💡 系统性建议：在未来的决策中，刻意问自己："我是否又在犯{bias}？"
""")

        return "\n".join(insights) if insights else ""


# 全局实例
pattern_tracker = DecisionPatternTracker()
cross_scenario_analyzer = CrossScenarioAnalyzer()


app = FastAPI(
    title="认知陷阱平台API",
    description="提供认知陷阱场景、游戏会话和分析服务，使用真实的逻辑实现（增强版）",
    version="2.0.0",
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册全局异常处理器
app.add_exception_handler(Exception, global_exception_handler)

# 场景数据 - 统一的场景结构，支持多难度级别
import os
import json

# 基础场景定义
BASE_SCENARIOS = [
    {
        "id": "coffee-shop-linear-thinking",
        "name": "咖啡店线性思维",
        "description": "线性思维陷阱场景",
        "fullDescription": "在这个场景中，您将管理一家咖啡店，体验线性思维在复杂商业环境中的局限性。线性思维是指我们倾向于认为原因和结果之间存在直接的、成比例的关系。但在复杂的系统中，这种思维方式往往会导致错误的决策。",
        "difficulty": "beginner",
        "estimatedDuration": 15,
        "targetBiases": ["linear_thinking"],
        "cognitiveBias": "线性思维",
        "duration": "15-20分钟",
        "category": "商业决策",
        "thumbnail": "/assets/images/coffee-shop.jpg",
        "advancedChallenges": [
            {
                "title": "供应链指数增长",
                "description": "处理供应商网络扩展中的指数增长效应",
                "difficulty": "intermediate",
                "cognitiveBiases": ["exponential_misconception", "linear_thinking"],
            },
            {
                "title": "复杂系统管理",
                "description": "管理多变量商业生态系统的复杂性",
                "difficulty": "advanced",
                "cognitiveBiases": [
                    "complex_system_misunderstanding",
                    "cascading_failure_blindness",
                ],
            },
        ],
    },
    {
        "id": "relationship-time-delay",
        "name": "恋爱关系时间延迟",
        "description": "时间延迟偏差场景",
        "fullDescription": "在恋爱关系中体验时间延迟对决策的影响。每个决策的效果会在几回合后显现。时间延迟偏差是指我们倾向于期望立即看到行动的结果，而忽视了在复杂系统中结果往往需要时间才能显现。",
        "difficulty": "intermediate",
        "estimatedDuration": 20,
        "targetBiases": ["time_delay_bias"],
        "cognitiveBias": "时间延迟",
        "duration": "20-25分钟",
        "category": "人际关系",
        "thumbnail": "/assets/images/relationship.jpg",
        "advancedChallenges": [
            {
                "title": "长期关系复利效应",
                "description": "理解关系投资的长期复利增长模式",
                "difficulty": "intermediate",
                "cognitiveBiases": [
                    "compound_interest_misunderstanding",
                    "short_term_bias",
                ],
            },
            {
                "title": "复杂关系网络",
                "description": "处理家庭和社交网络的复杂动态",
                "difficulty": "advanced",
                "cognitiveBiases": [
                    "complex_system_misunderstanding",
                    "network_effect_blindness",
                ],
            },
        ],
    },
    {
        "id": "investment-confirmation-bias",
        "name": "投资确认偏误",
        "description": "确认偏误场景",
        "fullDescription": "在投资决策中体验确认偏误如何影响我们的风险判断。确认偏误是指我们倾向于寻找、解释和记住那些证实我们已有信念或假设的信息，而忽视与之相矛盾的信息。",
        "difficulty": "advanced",
        "estimatedDuration": 25,
        "targetBiases": ["confirmation_bias"],
        "cognitiveBias": "确认偏误",
        "duration": "25-30分钟",
        "category": "金融决策",
        "thumbnail": "/assets/images/investment.jpg",
        "advancedChallenges": [
            {
                "title": "通胀调整投资",
                "description": "考虑通胀影响的长期投资复利效应",
                "difficulty": "intermediate",
                "cognitiveBiases": [
                    "inflation_blindness",
                    "compound_interest_misunderstanding",
                ],
            },
            {
                "title": "复杂金融系统",
                "description": "处理多变量金融市场系统风险",
                "difficulty": "advanced",
                "cognitiveBiases": [
                    "financial_system_complexity_blindness",
                    "correlation_misunderstanding",
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
                        "targetBiases": scenario.get("analysis", {}).get("cognitiveBiasesTested", []),
                        "cognitiveBias": ",".join(scenario.get("analysis", {}).get("cognitiveBiasesTested", [])),
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
                        "targetBiases": scenario.get("analysis", {}).get("cognitiveBiasesTested", []),
                        "cognitiveBias": ",".join(scenario.get("analysis", {}).get("cognitiveBiasesTested", [])),
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
except ImportError as e:
    print(f"✗ LLM互动式端点不可用: {e}")

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
    return {"scenarios": SCENARIOS}


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
                selected_scenario["targetBiases"] = matching_challenge[
                    "cognitiveBiases"
                ]
                selected_scenario["cognitiveBias"] = ", ".join(
                    matching_challenge["cognitiveBiases"]
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
    # 第1-2回合：制造困惑（只给结果，不揭示偏误）
    # 第3回合：揭示认知偏误
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
        # 第3回合：揭示认知偏误
        bias_detected = detect_cognitive_bias(
            scenario_id, new_state.get("decision_history", [])
        )
        if bias_detected:
            new_state["detected_biases"] = current_state.get("detected_biases", []) + [bias_detected]
            cross_scenario_analyzer.record_bias(scenario_id, bias_detected["bias_type"])

        feedback = generate_bias_reveal_feedback(
            scenario_id, decisions, current_state, new_state,
            decision_history=new_state.get("decision_history", []),
            bias_detected=bias_detected
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
            # 基础难度：简单的线性思维陷阱
            if action == "hire_staff":
                # 线性思维陷阱：员工增加不等于满意度线性提升
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
                # 添加指数衰减因子：更多员工导致效率指数下降
                efficiency_factor = 1 / (1 + 0.1 * amount)  # 随员工数增加效率下降
                satisfaction_gain = base_satisfaction * efficiency_factor

                new_state["satisfaction"] = min(
                    100, new_state["satisfaction"] + satisfaction_gain
                )

                # 在高级难度中引入复杂系统效应
                if difficulty == "advanced":
                    # 可能引发级联效应
                    reputation_change = satisfaction_gain // 2
                    new_state["reputation"] = min(
                        100, new_state["reputation"] + reputation_change
                    )

                    # 添加供应商网络复杂性
                    if amount > 4:
                        # 过多员工可能导致内部协调成本指数增长
                        coordination_cost = min(20, (amount - 4) * 3)
                        new_state["satisfaction"] -= coordination_cost

            elif action == "marketing":
                new_state["resources"] -= amount

                if difficulty == "intermediate":
                    # 中级难度：添加通胀和时间价值的因素
                    effect = amount // 10
                    # 一段时间后营销效果会衰减（复利思维）
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

def detect_cognitive_bias(scenario_id: str, decision_history: List[Dict]) -> Optional[Dict]:
    """检测用户在决策历史中表现出的认知偏误"""
    if len(decision_history) < 2:
        return None

    # 分析决策模式
    options_chosen = [d.get("decisions", {}).get("option", "") for d in decision_history if "decisions" in d]
    actions_chosen = [d.get("decisions", {}).get("action", "") for d in decision_history if "decisions" in d]

    # 检测线性思维（连续选择相同类型的激进选项）
    if len(options_chosen) >= 2:
        aggressive_count = sum(1 for opt in options_chosen if opt == "1")  # option 1 通常是激进/立即
        if aggressive_count >= 2:
            return {
                "bias_type": "线性思维+过度自信",
                "evidence": f"连续{aggressive_count}次选择激进/立即选项",
                "severity": "高"
            }

    # 检测损失厌恶（连续选择保守选项）
    if len(options_chosen) >= 2:
        conservative_count = sum(1 for opt in options_chosen if opt in ["2", "4"])  # option 2/4 通常是稳健/合作
        if conservative_count >= 2:
            return {
                "bias_type": "损失厌恶+风险规避",
                "evidence": f"连续{conservative_count}次选择保守选项",
                "severity": "中"
            }

    # 针对特定场景的偏误检测
    if "coffee-shop" in scenario_id:
        amounts = [d.get("decisions", {}).get("amount", 0) for d in decision_history if "decisions" in d]
        if amounts and max(amounts) > 6:
            return {
                "bias_type": "线性思维",
                "evidence": f"投入了{max(amounts)}个单位，远超最优规模",
                "severity": "高"
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
    if scenario_id == "coffee-shop-linear-thinking":
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
                expected_gain = amount * 8  # 用户可能预期的线性增长
                actual_gain = satisfaction_change
                return f"""
你雇了{amount}人，期望满意度大幅提升。
但实际只提升了{actual_gain}点（从{old_state['satisfaction']}到{new_state['satisfaction']}）。

投入{amount}人 → +{actual_gain}点满意度
效果：每人只带来{actual_gain // amount}点提升

🤔 你是否感到意外？
投入翻倍（{amount // 2}→{amount}），但效果没有翻倍。

为什么会这样？
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


def generate_bias_reveal_feedback(
    scenario_id: str,
    decisions: Dict,
    old_state: Dict,
    new_state: Dict,
    decision_history: List[Dict],
    bias_detected: Optional[Dict]
) -> str:
    """生成认知偏误揭示反馈（第3回合）"""

    if not bias_detected:
        # 如果没有检测到明显偏误，提供一般性反馈
        return generate_real_feedback(scenario_id, decisions, old_state, new_state, "beginner")

    base_feedback = generate_real_feedback(scenario_id, decisions, old_state, new_state, "beginner")

    # 添加偏误揭示
    bias_reveal = f"""

💡 **决策模式分析**

经过{len(decision_history)}回合的观察，系统检测到：

🎯 **检测到的认知偏误**: {bias_detected['bias_type']}

📊 **证据**: {bias_detected['evidence']}

⚠️ **严重程度**: {bias_detected['severity']}

这就是你决策中的盲点。这个偏误不仅在这个场景中出现，
在你的其他决策中也可能存在。

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

    if scenario_id == "coffee-shop-linear-thinking":
        if action == "hire_staff":
            if difficulty == "beginner":
                if amount > 6:
                    return "您雇佣了过多员工，导致效率下降。在复杂系统中，增加投入并不总是带来线性回报。"
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
                        additional_feedback = "复杂系统中，过多人力资源可能引发协调成本指数增长，这是级联故障的常见原因。"
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
                return "研究增加了您的知识储备，但要注意避免确认偏误。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "研究增加了您的知识储备，但要注意避免确认偏误。同时，投资的实际价值需要考虑通胀调整。"
                else:  # advanced
                    return "研究增加了您的知识储备，但要注意避免确认偏误。金融系统具有复杂性，市场波动和系统性风险需要特别关注。"
        elif action == "diversify":
            if difficulty == "beginner":
                return "分散投资降低了风险，但也限制了潜在收益。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "分散投资降低了风险，但也限制了潜在收益。长期投资要考虑复利的时间价值。"
                else:  # advanced
                    return "分散投资降低了风险，但需警惕相关性幻觉。在系统性风险下，看似无关的资产可能高度相关。这是投资中的'黑天鹅'事件风险。"

    # ===== 新增：为game-001（商业战略推理游戏）添加反馈 =====
    elif scenario_id == "game-001":
        option = decisions.get("option", "1")
        if option == "1":
            return "你选择了立即投放市场抢占先机。销量超出预期，但出现了少量质量问题报告。\n\n⚠️ 线性思维警告：你假设速度越快越好，但没有考虑质量与速度的权衡。在商业决策中，'快'与'好'往往存在非线性关系，过度追求速度可能牺牲长期声誉。"
        elif option == "2":
            return "你选择完善产品后再上市。虽然延迟了上市时间，但产品质量更有保证。\n\n✅ 这避免了线性思维陷阱：不是'快'与'慢'的简单选择，而是考虑了质量-速度-成本的三维权衡。复杂系统中，最优解往往在中间区域，而非极端选项。"
        elif option == "3":
            return "你选择收购竞争对手减少竞争。虽然减少了竞争压力，但成本大幅增加。\n\n⚠️ 过度自信陷阱：你假设收购就能解决问题，但可能陷入'赢家诅咒'。收购后的整合成本往往被低估，这是典型的规划偏误。"
        else:
            return "你选择与其他公司合作开发。虽然需要分享利润，但风险共担。\n\n✅ 系统思维：考虑了多方利益和风险平衡。在不确定环境下，合作策略往往比单打独斗更有效，因为你分散了风险并获得了互补资源。"

    # ===== 新增：为game-002（公共政策制定模拟）添加反馈 =====
    elif scenario_id == "game-002":
        option = decisions.get("option", "1")
        if option == "1":
            return "你选择了建设新地铁线路。虽然成本高，但长期效益显著。\n\n⚠️ 但是，你是否考虑了施工期间的短期影响？公众对施工扰民的不满可能抵消长期收益。这是时间延迟偏误的典型表现：我们过度关注长期收益，忽视了短期痛苦。"
        elif option == "2":
            return "你选择扩大公交网络。成本适中，覆盖面广。\n\n✅ 渐进式改进，避免了'全有或全无'的思维陷阱。复杂系统往往需要多次小步骤的迭代优化，而非一次性的大方案。"
        elif option == "3":
            return "你选择征收拥堵费。虽然增加了收入，但引起了公众强烈不满。\n\n❌ 群体思维的盲点：你假设'好的政策'会自动被接受，忽视了人们的情绪反应。政策制定不仅是技术问题，更是心理和政治问题。"
        else:
            return "你选择提供自行车道项目。低成本，环保健康。\n\n✅ 但这真的能解决根本问题吗？这只是治标不治本的方案。自行车道可能改善部分人的出行，但对整体交通拥堵的影响有限。这是'替代方案谬误'：选择了看起来不错，但实际效果有限的方案。"

    # ===== 新增：为game-003（个人理财决策模拟）添加反馈 =====
    elif scenario_id == "game-003":
        option = decisions.get("option", "1")
        if option == "1":
            return "你选择立即购买新车提升形象。\n\n❌ 即时满足偏误：你选择了当下的享受，而不是未来的安全。5万元的应急资金是财务安全的基石，为了非必需品消耗它，会让自己暴露在意外风险中。"
        elif option == "2":
            return "你选择把钱全部存入银行。\n\n⚠️ 损失厌恶+线性思维：你害怕损失，但没有考虑通货膨胀。如果通胀率是3%，你的钱每年实际损失3%的购买力。过度保守也是一种风险。"
        elif option == "3":
            return f"你选择投入股票市场寻求高回报。当前资源：{new_state['resources']}。\n\n⚠️ 过度自信：你假设自己能跑赢市场，但大多数散户都会亏损。市场是不可预测的复杂系统，即使是专家也无法持续跑赢大盘。"
        else:
            return f"你选择投资低成本指数基金并保留应急资金。当前资源：{new_state['resources']}。\n\n✅ 理性决策：承认自己的局限，选择稳健的长期投资。指数基金能让你获得市场平均收益，长期来看能战胜80%的主动投资者。这是谦逊的智慧。"

    # ===== 新增：为hist-001（挑战者号）添加反馈 =====
    elif scenario_id == "hist-001":
        decision = decisions.get("decision", "launch")
        if decision == "delay":
            return "你选择推迟发射以评估低温风险。\n\n✅ 成功避免灾难！你的决策拯救了7名宇航员的生命。\n\n💡 教训：在面对工程警告时，选择谨慎而非进度压力，可以避免悲剧。群体思维会让人们忽视警示信号，但独立思考能拯救生命。"
        else:
            return "你选择按计划发射。\n\n❌ 灾难发生了！O型环在低温下失效，航天飞机爆炸，7名宇航员遇难。\n\n💡 复盘历史：这就是群体思维+确认偏误+时间压力的致命组合。工程师们警告了O型环问题，但管理层选择了忽视警告，坚持发射。\n\n你能识别出这个决策中的哪些认知偏误吗？"

    # ===== 新增：为hist-002（泰坦尼克号）添加反馈 =====
    elif scenario_id == "hist-002":
        decision = decisions.get("decision", "fast_route")
        if decision == "safe_route":
            return "你选择传统安全航线，避开冰山区域。\n\n✅ 航行更慢但安全到达，无事故发生。\n\n💡 教训：过度自信+商业考量导致了对风险的系统性低估。当人们说'永不沉没'时，他们已经陷入了确认偏误，只看到支持自己信念的证据。"
        else:
            return "你选择更快的航线追求速度记录。\n\n❌ 撞上冰山，船只沉没，1500多人丧生。\n\n💡 复盘历史：号称'永不沉没'的称号让人们对风险视而不见。这是典型的新技术盲目信任+过度自信的组合。当成功成为常态，人们会低估失败的概率。"

    # ===== 新增：为hist-003（猪湾事件）添加反馈 =====
    elif scenario_id == "hist-003":
        decision = decisions.get("decision", "covert")
        if decision == "full_support":
            return "你选择提供全面军事支持和空中掩护。\n\n⚠️ 行动成功了，但美国的直接参与暴露无遗，造成外交尴尬。\n\n这是一个两难境地：要么失败（有限支持），要么尴尬（暴露参与）。在复杂决策中，有时候没有完美选项，只有不同类型的代价。"
        else:
            return "你选择秘密行动，避免显示美国直接参与。\n\n❌ 行动迅速失败，因为大幅减少了军事支持。\n\n💡 复盘历史：群体思维压制了异议声音，政治考量压倒了军事判断。决策小组内部有人反对，但声音被淹没在一致性中。\n\n当你下次发现团队中所有人都同意时，要警惕：是否有人因为害怕成为异见者而保持沉默？"

    # ===== 新增：为adv-game-001（全球气候变化政策制定博弈）添加反馈 =====
    elif scenario_id == "adv-game-001":
        option = decisions.get("option", "1")
        if option == "1":
            return "你制定统一的减排目标对所有国家一视同仁。\n\n⚠️ 发展中国家强烈反对，认为这不公平。\n\n问题：'公平'vs'效率'的权衡，你如何平衡？在复杂的多方博弈中，看似'公平'的统一标准可能因为各国实际情况不同而变得不公平。"
        elif option == "2":
            return "你根据历史累计排放量制定差异化目标。\n\n✅ 更符合'共同但有区别的责任'原则。\n\n但执行和监督难度大。复杂国际谈判中，原则正确性与实际可操作性往往存在张力。"
        elif option == "3":
            return "你建立碳排放交易市场，允许排放权买卖。\n\n✅ 市场化手段，效率高。\n\n⚠️ 但可能成为富国'购买污染权'的工具。市场机制能优化资源配置，但无法解决道德和政治问题。"
        else:
            return "你设定技术转移机制，发达国家支持发展中国家减排。\n\n✅ 促进技术扩散和全球合作。\n\n但技术转移的速度和质量难以保证。国际合作中的承诺常常无法兑现，这是集体行动困境的典型表现。"

    # ===== 新增：为adv-game-002（AI治理与监管决策模拟）添加反馈 =====
    elif scenario_id == "adv-game-002":
        option = decisions.get("option", "1")
        if option == "1":
            return "你基于任务能力制定AI分级标准。\n\n✅ 实用性强，易于理解和执行。\n\n⚠️ 但可能忽视安全和可控性维度。当效率成为唯一标准，安全往往被牺牲。这是技术乐观主义的常见陷阱。"
        elif option == "2":
            return "你引入安全和可控性作为核心评估维度。\n\n✅ 更注重风险防控。\n\n⚠️ 但可能抑制创新速度。监管的力度与创新的速度之间存在永恒的张力。过度谨慎可能让我们错失AI带来的巨大好处。"
        elif option == "3":
            return "你将伦理合规性作为核心评估维度。\n\n✅ 符合人类价值观。\n\n⚠️ 但'伦理'标准难以统一和量化。不同文化对'伦理'的理解不同，这在全球AI治理中造成巨大挑战。"
        else:
            return "你建立AI能力与风险的综合评估框架。\n\n✅ 平衡了多个维度。\n\n⚠️ 但复杂度高，执行难度大。复杂的框架在理论上完美，但在实践中可能因为过于复杂而无法有效执行。"

    # ===== 新增：为adv-game-003（复杂金融市场危机应对模拟）添加反馈 =====
    elif scenario_id == "adv-game-003":
        option = decisions.get("option", "1")
        if option == "1":
            return "你立即加强金融衍生品监管。\n\n✅ 预防性措施，可能在危机前遏制。\n\n⚠️ 但市场信心可能受影响，导致过度反应。监管是必要的，但过度监管可能扼杀金融创新和市场活力。这是监管者面临的永恒难题。"
        elif option == "2":
            return "你提高银行资本充足率要求。\n\n✅ 增强银行抗风险能力。\n\n⚠️ 但可能限制信贷，影响经济活力。更高的资本要求意味着银行放贷能力下降，这可能拖累经济增长。"
        elif option == "3":
            return "你进行秘密的系统性风险压力测试。\n\n✅ 了解真实风险暴露情况。\n\n⚠️ 但测试结果可能引发市场恐慌。透明度与稳定性之间存在矛盾：公开真相可能引发恐慌，隐瞒真相则可能导致更大的灾难。"
        else:
            return "你加强市场监控，但不采取实质措施。\n\n⚠️ 被动等待，可能错失最佳干预时机。\n\n问题：不作为本身也是一种决策，而且可能是错误的决策。在危机管理中，犹豫不决的代价往往比行动过大的代价更大。"

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
