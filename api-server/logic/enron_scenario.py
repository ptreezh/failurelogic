"""enron_scenario.py — Dörner-style engine for enron-collapse scenario.

Mirrors climate_scenario.py structure but for the Enron case. Different
state variable set (9 vars), different Dörner pattern triggers, different
outcome routing.

This is the 3rd deep scenario (2026-09-13). F4 (side effects) and F7
(lack of self-criticism) are the educational anchors — Enron's collapse
is a textbook case of how management's self-serving narratives override
internal whistleblowers (Watkins 2001-08 memo).

REVISION HISTORY:
- v1.0 (2026-09-13): Initial release. Dörner F1-F8 full coverage,
  9 state variables, 3 outcome paths (orderly/partial/total collapse),
  4 progressive reveals (T3/T5/T7/T10).
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

_SCENARIO_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "scenarios",
    "enron_collapse.json",
)
_SCENARIO_DATA: Optional[Dict[str, Any]] = None


def _load_scenario() -> Dict[str, Any]:
    global _SCENARIO_DATA
    if _SCENARIO_DATA is None:
        with open(_SCENARIO_PATH, encoding="utf-8") as f:
            _SCENARIO_DATA = json.load(f)
    return _SCENARIO_DATA


def escape_justification(text: Optional[str], max_length: int = 200) -> Optional[str]:
    """Sanitize user-provided decision justification for storage."""
    import html
    if text is None:
        return None
    text = text.strip()[:max_length]
    if not text:
        return None
    return html.escape(text)


def get_initial_state() -> Dict[str, Any]:
    return dict(_load_scenario()["initialState"])


def get_step(turn_number: int) -> Optional[Dict[str, Any]]:
    data = _load_scenario()
    for step in data["steps"]:
        if step["turn"] == turn_number:
            return step
    return None


def apply_turn(
    state: Dict[str, Any],
    option_id: str,
    decision_justification: Optional[str] = None,
) -> Dict[str, Any]:
    data = _load_scenario()
    if "turn_number" not in state or state["turn_number"] is None:
        state["turn_number"] = len(state.get("choices_made", [])) + 1
    current_turn = state["turn_number"]

    step = None
    for s in data["steps"]:
        if s["turn"] == current_turn:
            step = s
            break
    if step is None:
        return state

    chosen_option = None
    for opt in step["options"]:
        if opt["id"] == option_id:
            chosen_option = opt
            break
    if chosen_option is None:
        return state

    effects = step.get("expected_effects", {}).get(option_id, {})
    for key, value in effects.items():
        if key in state:
            if isinstance(state[key], (int, float)):
                state[key] = state[key] + value
            elif key == "credit_rating":
                # credit_rating is string (BBB+); skip arithmetic
                pass
            else:
                state[key] = value
        else:
            state[key] = value

    sanitized = escape_justification(decision_justification)
    if sanitized:
        if "decision_justifications" not in state:
            state["decision_justifications"] = {}
        state["decision_justifications"][str(current_turn)] = sanitized

    last_ctx = state.get("_last_option_context")
    if last_ctx is not None:
        last_ctx["justification"] = sanitized

    state["last_chosen_option"] = option_id

    if "choices_made" not in state:
        state["choices_made"] = []
    state["choices_made"].append({
        "turn": current_turn,
        "option": option_id,
        "weight": chosen_option.get("weight", "neutral"),
        "year": step.get("year", ""),
    })

    _clamp_state(state)
    return state


def _clamp_state(state: Dict[str, Any]) -> None:
    """Clamp Enron state variables to valid ranges."""
    # share_price: $0 - $100
    if "share_price_usd" in state and isinstance(state["share_price_usd"], (int, float)):
        state["share_price_usd"] = max(0, min(100, state["share_price_usd"]))

    # credit_rating is a string like "BBB+", "D"; not clamped here
    # (treat as-is)

    # Indices 0-100
    for idx_key in [
        "analyst_confidence_index",
        "whistleblower_silenced_count",
        "board_oversight_strength",
        "media_skepticism_index",
    ]:
        if idx_key in state and isinstance(state[idx_key], (int, float)):
            state[idx_key] = max(0, min(100, state[idx_key]))

    # USD amounts (negative allowed)
    for usd_key in [
        "reported_earnings_usd_m",
        "actual_cashflow_usd_m",
        "off_balance_sheet_exposure_usd_m",
    ]:
        if usd_key in state and isinstance(state[usd_key], (int, float)):
            state[usd_key] = max(-10000, min(100000, state[usd_key]))


# ============================================================================
# Dörner F1-F8 PATTERN DETECTION (focus on F4 + F7)
# ============================================================================

def detect_patterns(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    patterns = [
        _detect_F1_nonlinear(state),
        _detect_F2_time_delay(state),
        _detect_F3_self_reference(state),
        _detect_F4_side_effects(state),
        _detect_F5_single_target(state),
        _detect_F6_confirmation(state),
        _detect_F7_self_criticism(state),
        _detect_F8_regulation_lag(state),
    ]
    return [p for p in patterns if p is not None]


def _choices(state) -> List[Dict[str, Any]]:
    return state.get("choices_made", [])


def _count_weight(weight: str) -> int:
    return {
        "extreme_safe": 2, "safe": 1, "neutral": 0, "risky": -1, "extreme_risk": -2
    }.get(weight, 0)


def _is_honest(weight: str) -> bool:
    """Honest = safe or extreme_safe (acknowledges problem/transparency)."""
    return weight in ("safe", "extreme_safe")


def _detect_F1_nonlinear(state) -> Optional[Dict[str, Any]]:
    """F1 非线性：股价从 90 跌到 30 是临界点附近的指数加速。"""
    share = state.get("share_price_usd", 90)
    initial = _load_scenario()["initialState"]["share_price_usd"]
    if initial == 0:
        return None
    drop_pct = (initial - share) / initial * 100
    if drop_pct < 50 or len(_choices(state)) < 7:
        return None
    return {
        "pattern_type": "F1_nonlinear",
        "dorner_concept": "非线性崩盘",
        "evidence": (
            f"股价从 ${initial:.0f} 跌到 ${share:.0f}（下跌 {drop_pct:.0f}%）。"
            "临界点附近是指数加速，不是渐进。"
        ),
        "reflection_questions": [
            "你是否曾假设风险是渐进的?",
            "临界点之后,我们还能回头吗?",
            "为什么市场信任崩溃得这么快?"
        ],
    }


def _detect_F2_time_delay(state) -> Optional[Dict[str, Any]]:
    """F2 时间延迟：Watkins 2000-12 警告被压下6 个月。"""
    # Heuristic: count consecutive turns with risky/extreme_risk
    choices = _choices(state)
    if len(choices) < 3:
        return None
    lag_runs = 0
    max_lag = 0
    for c in choices:
        if c.get("weight") in ("risky", "extreme_risk", "neutral"):
            lag_runs += 1
            max_lag = max(max_lag, lag_runs)
        else:
            lag_runs = 0
    if max_lag >= 3:
        return {
            "pattern_type": "F2_time_delay",
            "dorner_concept": "时间延迟偏差",
            "evidence": (
                f"你连续 {max_lag} 个回合选择忽视警告或退缩。"
                "Watkins 2000-12 的警告被压下了 6 个月。"
            ),
            "reflection_questions": [
                "Watkins 当初为何被压下?",
                "你愿意听坏消息吗?",
                "如果回报在 5 年后,你会如何决策?"
            ],
        }
    return None


def _detect_F3_self_reference(state) -> Optional[Dict[str, Any]]:
    """F3 自反性：'创造市场'叙事让审计无法质疑 → 失去外部制衡。"""
    # Heuristic: if whistleblower_silenced increased AND board_oversight dropped
    silenced = state.get("whistleblower_silenced_count", 0)
    board = state.get("board_oversight_strength", 60)
    initial_board = _load_scenario()["initialState"]["board_oversight_strength"]
    if silenced >= 2 and board < initial_board - 10:
        return {
            "pattern_type": "F3_self_reference",
            "dorner_concept": "自反性陷阱",
            "evidence": (
                "你的'创造市场'叙事让 {silenced} 位举报者被压制，"
                "董事会监督强度下降 {delta}%。"
                "今天的解决方案成了明天的问题。"
            ),
            "reflection_questions": [
                "你的策略如何改变对方的行为?",
                "如果所有人都做你做的事,会发生什么?",
                "你是否能识别自己的盲点?"
            ],
        }
    return None


def _detect_F4_side_effects(state) -> Optional[Dict[str, Any]]:
    """F4 副作用忽视：关联交易让员工承担风险（安然 401k 损失$13亿）。"""
    # Heuristic: off_balance_sheet > 5000 OR silenced > 0
    obs = state.get("off_balance_sheet_exposure_usd_m", 7000)
    silenced = state.get("whistleblower_silenced_count", 0)
    if obs >= 8000 or silenced >= 3:
        return {
            "pattern_type": "F4_side_effects",
            "dorner_concept": "副作用忽视",
            "evidence": (
                f"你的决策让 off_balance_sheet 暴露 ${obs}M,"
                f"{silenced} 位举报者被压制。"
                "安然员工 401k 损失约 $13亿——他们承担了管理层的风险。"
            ),
            "reflection_questions": [
                "谁承担了风险?",
                "员工知道真相吗?",
                "代际公平如何衡量?"
            ],
        }
    return None


def _detect_F5_single_target(state) -> Optional[Dict[str, Any]]:
    """F5 单目标优化：聚焦股价 + 报告利润，忽略现金流 + 关联交易。"""
    choices = _choices(state)
    if len(choices) < 3:
        return None
    # Count "report-profit-focused" choices
    profit_focused = 0
    for c in choices:
        step = get_step(c["turn"])
        if not step:
            continue
        for opt in step.get("options", []):
            if opt["id"] == c["option"]:
                if "share_price" in opt.get("consequences_for_player", "").lower() and "+" in opt.get("consequences_for_player", ""):
                    profit_focused += 1
                break
    if profit_focused >= len(choices) * 0.5:
        cf = state.get("actual_cashflow_usd_m", -150)
        if cf < 0:
            return {
                "pattern_type": "F5_single_target",
                "dorner_concept": "单目标优化",
                "evidence": (
                    f"你的 {profit_focused}/{len(choices)} 个决策聚焦股价/利润，"
                    f"但实际现金流 ${cf}M——亏损。"
                ),
                "reflection_questions": [
                    "你是不是只盯着'买入'评级?",
                    "现金流 vs 报告利润——你选哪个?",
                    "哪个数字你最不愿意面对?"
                ],
            }
    return None


def _detect_F6_confirmation(state) -> Optional[Dict[str, Any]]:
    """F6 确认偏误：攻击 Olson 等分析师。"""
    # Heuristic: if analyst_confidence_index drops AND player chose risky/extreme_risk repeatedly
    choices = _choices(state)
    risk_count = sum(1 for c in choices if c.get("weight") in ("risky", "extreme_risk"))
    analyst = state.get("analyst_confidence_index", 85)
    if risk_count >= 3 and analyst < 70:
        return {
            "pattern_type": "F6_confirmation",
            "dorner_concept": "确认偏误",
            "evidence": (
                f"你 {risk_count} 个激进选择 + 分析师信心跌至 {analyst}。"
                "你攻击了 Olson 等分析师，但他们看到了你没看到的。"
            ),
            "reflection_questions": [
                "你愿意听反对意见吗?",
                "如果分析师错了,你能否承认?",
                "你身边有谁告诉你坏消息?"
            ],
        }
    return None


def _detect_F7_self_criticism(state) -> Optional[Dict[str, Any]]:
    """F7 自我批评缺失：Watkins 警告后未重新审视。"""
    silenced = state.get("whistleblower_silenced_count", 0)
    if silenced >= 1 and len(_choices(state)) >= 3:
        # Did player ignore whistleblower feedback?
        # Heuristic: any silent choice after turn 5 (when Watkins memo was rediscovered)
        post_t5_silence = sum(
            1 for c in _choices(state)
            if c.get("turn", 0) >= 5 and c.get("weight") in ("risky", "extreme_risk", "neutral")
        )
        if post_t5_silence >= 2:
            return {
                "pattern_type": "F7_self_criticism",
                "dorner_concept": "自我批评缺失",
                "evidence": (
                    f"你有 {silenced} 位举报者被压制。"
                    "Watkins 警告后你仍选择维持激进路径。"
                ),
                "reflection_questions": [
                    "你愿意承认自己错了吗?",
                    "如果 Watkins 是对的,你能接受吗?",
                    "为什么承认错误这么难?"
                ],
            }
    return None


def _detect_F8_regulation_lag(state) -> Optional[Dict[str, Any]]:
    """F8 调节滞后：警告公开后多回合才响应。"""
    choices = _choices(state)
    if len(choices) < 5:
        return None
    early_score = sum(_count_weight(c.get("weight", "neutral")) for c in choices[:4])
    share = state.get("share_price_usd", 90)
    initial = _load_scenario()["initialState"]["share_price_usd"]
    if early_score <= 1 and share < initial * 0.7:
        return {
            "pattern_type": "F8_regulation_lag",
            "dorner_concept": "调节滞后",
            "evidence": (
                f"前 4 回合你的激进分数 {early_score}/8，但股价跌至 ${share:.0f}。"
                "调节速度跟不上崩塌速度。"
            ),
            "reflection_questions": [
                "你的调节机制有多快?",
                "你是否能预判而非追赶?",
                "如果变化是指数级的,你的响应能跟上吗?"
            ],
        }
    return None


# ============================================================================
# OUTCOME ROUTING — 3 paths based on honesty + early action
# ============================================================================

def _honest_count(state) -> int:
    return sum(1 for c in _choices(state) if _is_honest(c.get("weight", "neutral")))


def _extreme_risk_count(state) -> int:
    return sum(1 for c in _choices(state) if c.get("weight") == "extreme_risk")


def get_outcome_key(state) -> str:
    """Determine which outcome the player triggers.

    Routes (priority order):
      - honest_count >= 5: orderly_resolution (early response + honest)
      - extreme_risk_count >= 4: total_collapse (denial/deflection)
      - default: partial_collapse (mixed)
    """
    honest = _honest_count(state)
    extreme = _extreme_risk_count(state)

    if honest >= 5:
        return "orderly_resolution"
    if extreme >= 4:
        return "total_collapse"
    return "partial_collapse"


# ============================================================================
# FEEDBACK GENERATION — 3 outcomes + 3 progressive reveals
# ============================================================================

def generate_feedback_for_turn(state: Dict[str, Any], turn_number: int) -> str:
    """Generate scenario-appropriate feedback for a turn.

    Progressive reveal structure (v1.0):
      - Turn 3: 1st reveal — F5 单目标优化
      - Turn 5: 2nd reveal — F2 时间延迟 + F7 自我批评缺失
      - Turn 7: 3rd reveal — F1 非线性 + F8 调节滞后
      - Turn 10: 4th reveal — full pattern summary + outcome
    """
    data = _load_scenario()
    last_step = data["steps"][-1]
    target_turn = min(turn_number - 1, last_step["turn"])
    if target_turn < 1:
        return ""

    step = None
    for s in data["steps"]:
        if s["turn"] == target_turn:
            step = s
            break
    if step is None:
        return ""

    if step.get("is_final_outcome"):
        return _generate_final_outcome_feedback(state, step)

    if step.get("is_pattern_reveal"):
        return _generate_reveal_feedback(state, step, turn_number)

    return _generate_action_feedback(state, step, turn_number)


def _generate_action_feedback(state, step, turn_number: int) -> str:
    feedback_parts = [
        f"📅 {step.get('year',',')}",
        "",
        "✅ 你提交了决策,系统正在响应...",
        "",
    ]

    feedback_parts.append("【当前状态】")
    feedback_parts.append(_format_state_grid(state))
    feedback_parts.append("")

    patterns = detect_patterns(state)
    if patterns:
        feedback_parts.append("【认知偏差提示】")
        for p in patterns[:2]:
            feedback_parts.append(f"⚠️  {p['dorner_concept']}:{p['evidence'][:80]}...")
        feedback_parts.append("")

    feedback_parts.append("继续 — 进入下一回合...")
    return "\n".join(feedback_parts)


def _generate_reveal_feedback(state, step, turn_number: int) -> str:
    pattern_reveal = step.get("pattern_reveal_template", {})
    round_num = pattern_reveal.get("round", 1)
    biases = pattern_reveal.get("biases_revealed", [])
    template = pattern_reveal.get("narrative", "")

    quotes = _load_scenario().get("dorner_quotes", [])
    quote = None
    for q in quotes:
        if f"T{round_num * 2 + 1}" in q.get("turn_context", "") or \
           f"T{turn_number}" in q.get("turn_context", ""):
            quote = q
            break
    if not quote and quotes:
        quote = quotes[min(round_num - 1, len(quotes) - 1)]

    feedback_parts = [
        f"============================================================",
        f"【Dörner 模式揭示 · 第 {round_num} 阶段 · 回合 {turn_number}】",
        f"============================================================",
        "",
        template,
        "",
    ]

    patterns = detect_patterns(state)
    relevant = [p for p in patterns if any(b in p["pattern_type"] or b.replace(" ", "_") in p["pattern_type"]
                                           for b in biases)]
    if relevant:
        feedback_parts.append("【本回合检测到的偏差】")
        for p in relevant:
            feedback_parts.append(f"  • {p['dorner_concept']}:{p['evidence']}")
            feedback_parts.append(f"    反思问题:{p['reflection_questions'][0]}")
        feedback_parts.append("")

    if quote:
        feedback_parts.append("【Dörner 提醒】")
        feedback_parts.append(f"  '{quote['quote']}'")
        feedback_parts.append(f"  ——{quote['source']}")
        feedback_parts.append("")

    feedback_parts.append("继续 — 进入下一回合...")
    return "\n".join(feedback_parts)


def _generate_final_outcome_feedback(state, step) -> str:
    outcome_key = get_outcome_key(state)
    data = _load_scenario()
    endings = data.get("outcome_endings", {})
    template = endings.get(outcome_key, {}).get("narrative", "")

    if not template:
        return "结局数据缺失。"

    choices = _choices(state)
    justifications = state.get("decision_justifications", {})
    honest_count = sum(1 for c in choices if _is_honest(c.get("weight", "neutral")))
    passive_count = sum(1 for c in choices if c.get("weight") in ("neutral",))

    filled = template
    filled = filled.replace("{decision_count}", str(len(choices)))
    filled = filled.replace("{honest_count}", str(honest_count))
    filled = filled.replace("{passive_count}", str(passive_count))
    filled = filled.replace("{primary_focus}", _find_primary_focus(state))
    filled = filled.replace("{min_dimension}", _find_most_neglected_dimension(state))
    filled = filled.replace("{time_delay_count}", str(sum(1 for c in choices if c.get("weight") in ("neutral", "risky", "extreme_risk"))))
    filled = filled.replace("{self_criticism_count}", str(state.get("whistleblower_silenced_count", 0)))

    just_text = ""
    for turn_str, just in sorted(justifications.items(), key=lambda x: int(x[0])):
        just_text += f"\n  Turn {turn_str}: {just}"
    filled = filled.replace("{justifications}", just_text or "\n  （未填写决策理由）")

    return filled


def _find_most_neglected_dimension(state) -> str:
    """Find the dimension with biggest negative delta from initial."""
    data = _load_scenario()
    initial = data["initialState"]
    dims = [k for k in initial.keys() if isinstance(initial[k], (int, float))]
    worst = max(dims, key=lambda d: initial[d] - state.get(d, initial[d]))
    return worst


def _find_primary_focus(state) -> str:
    """Heuristic: which dimension did the player focus on most?"""
    sp_change = state.get("share_price_usd", 90) - 90
    obs_change = state.get("off_balance_sheet_exposure_usd_m", 7000) - 7000
    if sp_change < -50:
        return "股价 (短视)"
    if obs_change > 1000:
        return "关联交易 (贪婪)"
    return "维持现状"


def _format_state_grid(state) -> str:
    rows = []
    label_map = {
        "share_price_usd": "💵 股价",
        "credit_rating": "🏦 信用评级",
        "reported_earnings_usd_m": "📊 报告利润",
        "actual_cashflow_usd_m": "💰 实际现金流",
        "off_balance_sheet_exposure_usd_m": "⚠️ 隐性负债",
        "analyst_confidence_index": "📈 分析师信心",
        "whistleblower_silenced_count": "🔇 被压制举报人",
        "board_oversight_strength": "👁️ 董事会监督",
        "media_skepticism_index": "📺 媒体怀疑度",
    }
    for key, label in label_map.items():
        if key in state:
            val = state[key]
            rows.append(f"  {label}: {val}")
    return "\n".join(rows)


def get_summary(state) -> Dict[str, Any]:
    return {
        "scenario_id": "enron-collapse",
        "outcome_key": get_outcome_key(state),
        "honest_count": _honest_count(state),
        "extreme_risk_count": _extreme_risk_count(state),
        "total_choices": len(_choices(state)),
        "patterns_detected": [p["pattern_type"] for p in detect_patterns(state)],
        "final_state": {k: state[k] for k in state if isinstance(state[k], (int, float, str))},
    }