"""climate_scenario.py — Dörner-style engine for climate-change-policy scenario.

Mirrors the structure of challenger_scenario.py but for the climate scenario.
This is a SEPARATE engine (not a refactor of challenger) because:

1. Different state variable set (9 vars for climate vs 13 for challenger)
2. Different Dörner pattern triggers (F1-F8 full coverage vs F2-F8)
3. Different outcome routing (4 paths based on cumulative choices)
4. No deferred consequence queue needed (climate change is more
   synchronous than Challenger's pre-launch deliberation)

The two engines share `escape_justification` semantics but otherwise are
independent. Per docs/challenger-retrospective.md §3.3, frontend
reuses ChallengerRouter with just SCENARIO_ID swap.

REVISION HISTORY:
- v1.0 (2026-09-13): Initial release. Dörner F1-F8 full coverage,
  9 state variables, 4 outcome paths, 5 progressive reveals.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

_SCENARIO_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "scenarios",
    "climate_change.json",
)
_SCENARIO_DATA: Optional[Dict[str, Any]] = None


def _load_scenario() -> Dict[str, Any]:
    """Load and cache the climate-change scenario JSON."""
    global _SCENARIO_DATA
    if _SCENARIO_DATA is None:
        with open(_SCENARIO_PATH, encoding="utf-8") as f:
            _SCENARIO_DATA = json.load(f)
    return _SCENARIO_DATA


def escape_justification(text: Optional[str], max_length: int = 200) -> Optional[str]:
    """Sanitize user-provided decision justification for storage.

    Mirrors the helper in challenger_scenario.py (XSS + 200-char cap).
    """
    import html
    if text is None:
        return None
    text = text.strip()[:max_length]
    if not text:
        return None
    return html.escape(text)


def get_initial_state() -> Dict[str, Any]:
    """Return the initial state for a new climate-change session."""
    return dict(_load_scenario()["initialState"])


def get_step(turn_number: int) -> Optional[Dict[str, Any]]:
    """Return the step dict for a given turn (1-indexed), or None if past end."""
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
    """Apply the effects of the player's chosen option for the CURRENT turn.

    Mutates state in place AND returns it for chaining.

    Args:
        state: Current game state (mutated in place)
        option_id: "A" / "B" / "C" / "D"
        decision_justification: Optional 1-2 sentence rationale from player
    """
    data = _load_scenario()
    # If turn_number not set yet, derive from choice count
    if "turn_number" not in state or state["turn_number"] is None:
        state["turn_number"] = len(state.get("choices_made", [])) + 1
    current_turn = state["turn_number"]

    # Find the current step
    step = None
    for s in data["steps"]:
        if s["turn"] == current_turn:
            step = s
            break
    if step is None:
        return state

    # Find the chosen option
    chosen_option = None
    for opt in step["options"]:
        if opt["id"] == option_id:
            chosen_option = opt
            break
    if chosen_option is None:
        return state

    # Apply effects
    effects = step.get("expected_effects", {}).get(option_id, {})
    for key, value in effects.items():
        if key in state:
            if isinstance(state[key], (int, float)):
                state[key] = state[key] + value
            else:
                state[key] = value
        else:
            state[key] = value

    # Save decision justification
    sanitized = escape_justification(decision_justification)
    if sanitized:
        if "decision_justifications" not in state:
            state["decision_justifications"] = {}
        state["decision_justifications"][str(current_turn)] = sanitized

    last_ctx = state.get("_last_option_context")
    if last_ctx is not None:
        last_ctx["justification"] = sanitized

    state["last_chosen_option"] = option_id

    # Track choices for outcome routing
    if "choices_made" not in state:
        state["choices_made"] = []
    state["choices_made"].append({
        "turn": current_turn,
        "option": option_id,
        "weight": chosen_option.get("weight", "neutral"),
        "year": step.get("year", ""),
    })

    # Clamp state values
    _clamp_state(state)

    return state


def _clamp_state(state: Dict[str, Any]) -> None:
    """Clamp climate-change state variables to their valid ranges."""
    # Temperature: 1.0°C - 4.0°C
    if "global_avg_temp_c" in state and isinstance(state["global_avg_temp_c"], (int, float)):
        state["global_avg_temp_c"] = max(1.0, min(4.0, state["global_avg_temp_c"]))

    # CO2: 420 - 600 ppm
    if "co2_ppm" in state and isinstance(state["co2_ppm"], (int, float)):
        state["co2_ppm"] = max(420, min(600, state["co2_ppm"]))

    # Percentage fields: 0-100
    for pct_key in [
        "gdp_growth_pct",  # can be negative but bounded
        "renewable_share_pct",
        "climate_justice_index",
        "public_support_pct",
        "international_trust",
        "tipping_point_proximity",
    ]:
        if pct_key in state and isinstance(state[pct_key], (int, float)):
            if pct_key == "gdp_growth_pct":
                state[pct_key] = max(-10, min(10, state[pct_key]))
            else:
                state[pct_key] = max(0, min(100, state[pct_key]))

    # Counter fields: >= 0
    for counter_key in ["whistleblower_silenced_count"]:
        if counter_key in state and isinstance(state[counter_key], (int, float)):
            state[counter_key] = max(0, state[counter_key])


# ============================================================================
# Dörner F1-F8 PATTERN DETECTION (8 patterns, full coverage)
# ============================================================================

def detect_patterns(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Detect all cognitive bias patterns present in the player's decisions.

    Returns list of pattern dicts (may be empty, may contain multiple).
    Each pattern: {pattern_type, dorner_concept, evidence, reflection_questions}.
    """
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
    """Map weight to radical-score: extreme_safe=2, safe=1, neutral=0, risky=-1, extreme_risk=-2."""
    return {
        "extreme_safe": 2, "safe": 1, "neutral": 0, "risky": -1, "extreme_risk": -2
    }.get(weight, 0)


def _detect_F1_nonlinear(state) -> Optional[Dict[str, Any]]:
    """F1 非线性：玩家假设升温是线性过程,即使接近临界点仍按线性思维行动。"""
    tipping = state.get("tipping_point_proximity", 0)
    if tipping < 50:
        return None  # 还没到临界点附近
    # Look at last 3 choices — if any 'risky' or 'extreme_risk' happened after tipping crossed 50
    choices = _choices(state)
    late_choices = [c for c in choices if c.get("weight") in ("risky", "extreme_risk")]
    if len(late_choices) >= 2:
        return {
            "pattern_type": "F1_nonlinear",
            "dorner_concept": "非线性阈值",
            "evidence": (
                f"距临界点 {tipping}%,但你仍有 {len(late_choices)} 个激进选项。"
                "升温在临界点附近是指数加速的,不是线性。"
            ),
            "reflection_questions": [
                "你的决策模型中,'加速'和'渐进'哪个假设更安全?",
                "临界点之后,我们还能回头吗?",
                "为什么科学家警告 1.5°C 与 2°C 是'完全不同的世界'?"
            ],
        }
    return None


def _detect_F2_time_delay(state) -> Optional[Dict[str, Any]]:
    """F2 时间延迟：玩家在警告公开后多回合才响应。"""
    choices = _choices(state)
    # Climate change has implicit warnings at every turn
    # Heuristic: count consecutive turns with no action (weight=0/neutral doesn't count)
    lag_runs = 0
    max_lag = 0
    for c in choices:
        w = _count_weight(c.get("weight", "neutral"))
        if w <= 0:  # neutral or worse
            lag_runs += 1
            max_lag = max(max_lag, lag_runs)
        else:
            lag_runs = 0
    if max_lag >= 3:
        return {
            "pattern_type": "F2_time_delay",
            "dorner_concept": "时间延迟偏差",
            "evidence": (
                f"你连续 {max_lag} 个回合选择观望。"
                "气候系统的时间尺度是世纪级的。"
            ),
            "reflection_questions": [
                "2075年的人会怎么评价你今天的决策?",
                "你愿意等多久才看到行动的结果?",
                "如果回报在50年后,你会如何决策?"
            ],
        }
    return None


def _detect_F3_self_reference(state) -> Optional[Dict[str, Any]]:
    """F3 自反性：玩家的'解决方案'触发了反向效应。"""
    # Heuristic: if a carbon-tax-like choice (weight=safe/neutral) was followed by
    # GDP decline AND international_trust decline
    gdp_change = state.get("gdp_growth_pct", 3.2) - 3.2  # negative = decline
    trust_change = state.get("international_trust", 55) - 55
    if gdp_change < -2 and trust_change < -3:
        return {
            "pattern_type": "F3_self_reference",
            "dorner_concept": "自反性陷阱",
            "evidence": (
                f"你的政策让 GDP 变化 {gdp_change:.1f}%,国际信任度 {trust_change:.0f}。"
                "解决方案可能创造了新问题。"
            ),
            "reflection_questions": [
                "你的政策会如何改变对方的行为?",
                "如果所有人都做你做的事,会发生什么?",
                "你是否在无意中制造了新的问题?"
            ],
        }
    return None


def _detect_F4_side_effects(state) -> Optional[Dict[str, Any]]:
    """F4 副作用忽视：减排让气候正义指数下降。"""
    cj = state.get("climate_justice_index", 45)
    if cj < 35:  # below initial 45 - 10
        return {
            "pattern_type": "F4_side_effects",
            "dorner_concept": "副作用忽视",
            "evidence": (
                f"气候正义指数跌至 {cj}。"
                "你的减排成本是否由穷国承担?"
            ),
            "reflection_questions": [
                "谁承担了减排成本?",
                "谁是受益者?",
                "代际公平如何衡量?"
            ],
        }
    return None


def _detect_F5_single_target(state) -> Optional[Dict[str, Any]]:
    """F5 单目标优化：玩家只优化一个变量(如 GDP),而其他变量恶化。"""
    choices = _choices(state)
    if len(choices) < 3:
        return None
    # Count "GDP-focused" choices (anything where consequences_for_player mentions GDP positively)
    gdp_focused = 0
    for c in choices:
        step = get_step(c["turn"])
        if not step:
            continue
        for opt in step.get("options", []):
            if opt["id"] == c["option"]:
                if "gdp" in opt.get("consequences_for_player", "").lower() and "+" in opt.get("consequences_for_player", ""):
                    gdp_focused += 1
                break
    # If GDP-focused >= 50% of choices AND tipping or temp got worse
    if gdp_focused >= len(choices) * 0.5:
        tipping = state.get("tipping_point_proximity", 0)
        if tipping > 50:
            return {
                "pattern_type": "F5_single_target",
                "dorner_concept": "单目标优化",
                "evidence": (
                    f"你的 {gdp_focused}/{len(choices)} 个决策聚焦 GDP 增长,"
                    f"但距临界点已达 {tipping}%。"
                ),
                "reflection_questions": [
                    "你是不是只盯着 GDP?",
                    "你能列出 9 个状态变量的当前值吗?",
                    "哪个维度你最不愿意面对?"
                ],
            }
    return None


def _detect_F6_confirmation(state) -> Optional[Dict[str, Any]]:
    """F6 确认偏误：连续多个回合选类似立场的选项。"""
    choices = _choices(state)
    if len(choices) < 3:
        return None
    # Group by option letter — count consecutive same
    last_option = None
    streak = 0
    max_streak = 0
    for c in choices:
        if c["option"] == last_option:
            streak += 1
            max_streak = max(max_streak, streak)
        else:
            streak = 1
            last_option = c["option"]
    if max_streak >= 3:
        return {
            "pattern_type": "F6_confirmation",
            "dorner_concept": "确认偏误",
            "evidence": (
                f"你连续 {max_streak} 个回合选了相同的选项。"
                "你的信息来源是什么?"
            ),
            "reflection_questions": [
                "你的信息源是不是太单一?",
                "你愿意听反对意见吗?",
                "如果科学家错了,你能否承认?"
            ],
        }
    return None


def _detect_F7_self_criticism(state) -> Optional[Dict[str, Any]]:
    """F7 自我批评缺失：揭示偏差后玩家未改变策略。"""
    # Track if pattern was revealed but player continued similar choices
    # Heuristic: whistleblower_silenced_count high (silencing critics)
    silenced = state.get("whistleblower_silenced_count", 0)
    if silenced >= 3:
        return {
            "pattern_type": "F7_self_criticism",
            "dorner_concept": "自我批评缺失",
            "evidence": (
                f"已有 {silenced} 名气候科学家被打压/解雇。"
                "压制不同意见是 F7 自我批评缺失的典型表现。"
            ),
            "reflection_questions": [
                "知道了偏差后,你有调整吗?",
                "为什么承认错误这么难?",
                "你的继任者会从你这里学到什么?"
            ],
        }
    return None


def _detect_F8_regulation_lag(state) -> Optional[Dict[str, Any]]:
    """F8 调节滞后：玩家响应时间明显晚于最优时机。"""
    choices = _choices(state)
    if len(choices) < 5:
        return None
    # Look at the first 3 choices' radical score — if all low, F8 hit
    early_radical_score = sum(_count_weight(c.get("weight", "neutral")) for c in choices[:3])
    tipping = state.get("tipping_point_proximity", 0)
    if early_radical_score <= 1 and tipping > 40:
        return {
            "pattern_type": "F8_regulation_lag",
            "dorner_concept": "调节滞后",
            "evidence": (
                f"前 3 回合你的激进分数 {early_radical_score}/6,但临界点已达 {tipping}%。"
                "调节速度跟不上变化速度。"
            ),
            "reflection_questions": [
                "你的调节机制有多快?",
                "你是否能预判而非追赶?",
                "如果变化是指数级的,你的政策能跟上吗?"
            ],
        }
    return None


# ============================================================================
# OUTCOME ROUTING — 4 paths based on cumulative choice radicality
# ============================================================================

def _radical_score(state) -> int:
    """Total radical-score across all choices. Positive = climate-friendly."""
    return sum(_count_weight(c.get("weight", "neutral")) for c in _choices(state))


def get_outcome_key(state) -> str:
    """Determine which outcome the player will trigger based on accumulated choices.

    Routes (priority order):
      - radical_score >= 5: one_point_five  (mostly radical choices)
      - delay_or_exit_count >= 3: coordination_collapse  (multiple "abandon" picks)
      - economic_priority_count >= 4 OR radical_score <= -3: three_degrees
      - default: two_degrees  (mixed path)
    """
    choices = _choices(state)
    radical = _radical_score(state)
    economic_priority = sum(1 for c in choices if c.get("weight") in ("risky", "extreme_risk"))
    delay_or_exit = sum(1 for c in choices if c.get("weight") == "extreme_risk")

    if radical >= 5:
        return "one_point_five"
    if delay_or_exit >= 3:
        return "coordination_collapse"
    if economic_priority >= 4 or radical <= -3:
        return "three_degrees"
    return "two_degrees"


# ============================================================================
# FEEDBACK GENERATION — 4 outcomes + 3 progressive reveals
# ============================================================================

def generate_feedback_for_turn(state: Dict[str, Any], turn_number: int) -> str:
    """Generate scenario-appropriate feedback for a turn.

    Progressive reveal structure (v1.0):
      - Turn 3: 1st reveal — F5 单目标优化
      - Turn 5: 2nd reveal — F2 时间延迟 + F7 自我批评
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

    # Final outcome (turn 10)
    if step.get("is_final_outcome"):
        return _generate_final_outcome_feedback(state, step)

    # Progressive reveals at turns 3/5/7
    if step.get("is_pattern_reveal"):
        return _generate_reveal_feedback(state, step, turn_number)

    # Regular turns: rich feedback with state echo
    return _generate_action_feedback(state, step, turn_number)


def _generate_action_feedback(state, step, turn_number: int) -> str:
    """Generate rich feedback for non-reveal turns."""
    feedback_parts = [
        f"📅 {step.get('year', '')}",
        "",
        "✅ 你提交了决策,系统正在响应...",
        "",
    ]

    # State echo (compact)
    feedback_parts.append("【当前状态】")
    feedback_parts.append(_format_state_grid(state))
    feedback_parts.append("")

    # Pattern hints (if any detector hit)
    patterns = detect_patterns(state)
    if patterns:
        feedback_parts.append("【认知偏差提示】")
        for p in patterns[:2]:  # max 2 to avoid spam
            feedback_parts.append(f"⚠️  {p['dorner_concept']}:{p['evidence'][:80]}...")
        feedback_parts.append("")

    feedback_parts.append("继续 — 进入下一回合...")

    return "\n".join(feedback_parts)


def _generate_reveal_feedback(state, step, turn_number: int) -> str:
    """Generate progressive reveal feedback."""
    pattern_reveal = step.get("pattern_reveal_template", {})
    round_num = pattern_reveal.get("round", 1)
    biases = pattern_reveal.get("biases_revealed", [])
    template = pattern_reveal.get("narrative", "")

    # Choose a Dörner quote for this reveal round
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

    # List detected biases this turn
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
    """Generate the final outcome (turn 10) feedback — routed by get_outcome_key()."""
    outcome_key = get_outcome_key(state)
    data = _load_scenario()
    endings = data.get("outcome_endings", {})
    template = endings.get(outcome_key, {}).get("narrative", "")

    if not template:
        return "结局数据缺失。"

    # Fill in narrative placeholders
    choices = _choices(state)
    justifications = state.get("decision_justifications", {})
    radical_count = sum(1 for c in choices if _count_weight(c.get("weight", "neutral")) > 0)

    filled = template
    filled = filled.replace("{decision_count}", str(len(choices)))
    filled = filled.replace("{radical_count}", str(radical_count))
    filled = filled.replace("{min_dimension}", _find_most_neglected_dimension(state))
    filled = filled.replace("{response_speed}", _calc_response_speed(choices))
    filled = filled.replace("{primary_focus}", _find_primary_focus(state))
    filled = filled.replace("{neglected_dimensions}", _find_neglected_dimensions(state))
    filled = filled.replace("{time_delay_count}", str(sum(1 for c in choices if c.get("weight") in ("neutral", "risky", "extreme_risk"))))
    filled = filled.replace("{self_criticism_count}", str(state.get("whistleblower_silenced_count", 0)))

    # Justifications block
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
    gdp_change = state.get("gdp_growth_pct", 3.2) - 3.2
    renewable_change = state.get("renewable_share_pct", 30) - 30
    if gdp_change > renewable_change / 3:
        return "GDP 增长"
    if renewable_change > 0:
        return "可再生能源"
    return "维持现状"


def _find_neglected_dimensions(state) -> str:
    """List dimensions with biggest negative delta."""
    data = _load_scenario()
    initial = data["initialState"]
    dims = [k for k in initial.keys() if isinstance(initial[k], (int, float))]
    deltas = [(d, initial[d] - state.get(d, initial[d])) for d in dims]
    deltas.sort(key=lambda x: -x[1])  # most-negative first
    return ", ".join(d for d, _ in deltas[:3])


def _calc_response_speed(choices) -> str:
    """Average response time to warnings (placeholder heuristic)."""
    if not choices:
        return "0"
    weights = [_count_weight(c.get("weight", "neutral")) for c in choices]
    return f"{max(0, len([w for w in weights if w <= 0]))}"


def _format_state_grid(state) -> str:
    """Format state variables as a compact grid for feedback."""
    rows = []
    label_map = {
        "global_avg_temp_c": "🌡️ 升温",
        "co2_ppm": "💨 CO2",
        "gdp_growth_pct": "📈 GDP增长",
        "renewable_share_pct": "⚡ 可再生",
        "climate_justice_index": "⚖️ 气候正义",
        "public_support_pct": "👥 公众支持",
        "whistleblower_silenced_count": "🔇 被压制",
        "international_trust": "🤝 国际信任",
        "tipping_point_proximity": "⏰ 临界点距离",
    }
    for key, label in label_map.items():
        if key in state:
            rows.append(f"  {label}: {state[key]:.1f}")
    return "\n".join(rows)


def get_summary(state) -> Dict[str, Any]:
    """Return a final summary dict for analytics/learning engine."""
    return {
        "scenario_id": "climate-change-policy",
        "outcome_key": get_outcome_key(state),
        "radical_score": _radical_score(state),
        "total_choices": len(_choices(state)),
        "patterns_detected": [p["pattern_type"] for p in detect_patterns(state)],
        "final_state": {k: state[k] for k in state if isinstance(state[k], (int, float))},
    }