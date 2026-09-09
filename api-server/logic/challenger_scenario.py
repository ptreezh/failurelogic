"""challenger_scenario.py — Dörner-style multi-turn scenario engine for Challenger.

This module powers the "challenger-launch" scenario: a 10-turn simulation
modeled after the actual Challenger decision timeline. Each turn presents
a real decision from the historical record; choices have cascading
effects on 13 state variables.

REVISION HISTORY:
- v2.0 (2026-09-08): Deep-dive revision based on 4 rounds of grill-down
  audit. New: 5 bias patterns (was 1), progressive reveals (turns 5/6/8/10),
  real historical quotes, Boisjoly 6-month warning backstory, disaster
  outcome with 7 astronauts names, Rogers Commission quote, Feynman
  experiment, decision justification reflection hook.

This scenario teaches 8 Dörner failure modes through experience:
  F1 非线性 (non-linearity)        — temperature non-linear risk amplification
  F2 时间延迟 (time delay)        — Boisjoly's 6-month-old memo finally matters
  F3 自指   (self-reference)      — your statements change management's posture
  F4 副作用 (side effects)        — Boisjoly's private request surfaces
  F5 单目标 (single-target opt)    — schedule vs. safety trade-off
  F6 确认偏误 (confirmation bias)  — repeated risk acceptance
  F7 自我批评 (lack of self-crit) — pattern persists after reveal
  F8 调节滞后 (regulation lag)    — over-correct from delay to launch
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

# Load scenario content once at module import.
_SCENARIO_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "scenarios",
    "challenger_launch.json",
)
_SCENARIO_DATA: Optional[Dict[str, Any]] = None


def _load_scenario() -> Dict[str, Any]:
    """Load and cache the Challenger scenario JSON. Raises FileNotFoundError
    if the data file is missing — caller should catch and skip."""
    global _SCENARIO_DATA
    if _SCENARIO_DATA is None:
        with open(_SCENARIO_PATH, encoding="utf-8") as f:
            _SCENARIO_DATA = json.load(f)
    return _SCENARIO_DATA


def get_initial_state() -> Dict[str, Any]:
    """Return the initial state for a new Challenger session (v2.0)."""
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

    The current turn is state["turn_number"] BEFORE the player's action.
    After this function, state["turn_number"] should be incremented by the
    caller (start.py already does this).

    Args:
        state: Current game state (mutated in place)
        option_id: "A" / "B" / "C" / "D"
        decision_justification: Optional 1-2 sentence rationale from player

    Returns:
        Modified state (mutates in place AND returns for chaining)
    """
    data = _load_scenario()
    current_turn = state["turn_number"]

    # Find the current step
    step = None
    for s in data["steps"]:
        if s["turn"] == current_turn:
            step = s
            break

    if step is None:
        return state

    # Find the chosen option's effects
    chosen_option = None
    for opt in step["options"]:
        if opt["id"] == option_id:
            chosen_option = opt
            break

    if chosen_option is None:
        return state

    # Apply effects to state
    effects = step.get("expected_effects", {}).get(option_id, {})
    for key, value in effects.items():
        if key == "outcome":
            state["outcome"] = value
            continue
        if key in state:
            if isinstance(state[key], (int, float)):
                state[key] = state[key] + value
            elif isinstance(state[key], list) and key == "consequence_deferred_queue":
                state[key].append(value)
            elif isinstance(state[key], dict) and key == "decision_justifications":
                pass  # handled separately
            else:
                state[key] = state[key] + value
        else:
            state[key] = value

    # Save decision justification if provided (reflection hook RH1)
    if decision_justification and decision_justification.strip():
        if "decision_justifications" not in state:
            state["decision_justifications"] = {}
        state["decision_justifications"][str(current_turn)] = decision_justification.strip()

    # Remember what the player just chose (used by final outcome feedback).
    state["last_chosen_option"] = option_id

    # Apply deferred consequences from previous turns
    _apply_deferred_consequences(state, current_turn)

    # Clamp state values to reasonable ranges
    for key in [
        "engineer_confidence",
        "schedule_pressure",
        "public_attention",
        "team_morale",
        "temperature_forecast_f",
    ]:
        if key in state and isinstance(state[key], (int, float)):
            if key == "temperature_forecast_f":
                state[key] = max(-30, min(120, state[key]))
            else:
                state[key] = max(0, min(100, state[key]))

    if "budget_used_pct" in state:
        state["budget_used_pct"] = max(0, min(200, state["budget_used_pct"]))

    # Counter fields must be >= 0
    for counter_key in [
        "accepted_risks_count",
        "ignored_warnings_count",
        "risk_acknowledged_unresolved",
        "dissent_suppressed_count",
    ]:
        if counter_key in state:
            state[counter_key] = max(0, state[counter_key])

    return state


def _apply_deferred_consequences(state: Dict[str, Any], current_turn: int) -> None:
    """Apply consequences deferred from earlier turns (Dörner F2 time delay)."""
    queue = state.get("consequence_deferred_queue", [])
    if not queue:
        return
    new_queue = []
    for entry in queue:
        # entry is a string like "data_review_meeting" or "cross_dept_meeting"
        # Effects are resolved here
        if entry == "data_review_meeting" and current_turn >= 3:
            # The "more data" delay: turn 3 shows that data was inconclusive
            state["risk_acknowledged_unresolved"] = state.get("risk_acknowledged_unresolved", 0) + 1
        elif entry == "cross_dept_meeting" and current_turn >= 3:
            # The "let them explain" delay: turn 3 shows management dismissed it
            state["dissent_suppressed_count"] = state.get("dissent_suppressed_count", 0) + 1
        else:
            new_queue.append(entry)
    state["consequence_deferred_queue"] = new_queue


# ============================================================================
# BIAS DETECTION — 5 Dörner patterns (was 1 in v1.0)
# ============================================================================

def detect_patterns(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Detect all cognitive bias patterns present in the player's decisions.

    Returns a list of pattern dicts (may be empty, may contain multiple).
    Each pattern has: pattern_type, dorner_concept, evidence, reflection_questions.
    """
    patterns = []

    # Run all detectors
    patterns.append(_detect_confirmation_bias(state))
    patterns.append(_detect_single_target_optimization(state))
    patterns.append(_detect_time_delay_blindness(state))
    patterns.append(_detect_side_effect_neglect(state))
    patterns.append(_detect_lack_of_self_criticism(state))
    patterns.append(_detect_self_reference(state))
    patterns.append(_detect_regulation_lag(state))

    # Filter out None results
    return [p for p in patterns if p is not None]


def _detect_confirmation_bias(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """F6 confirmation bias: high accepted_risks + high ignored_warnings."""
    accepted = state.get("accepted_risks_count", 0)
    ignored = state.get("ignored_warnings_count", 0)

    if accepted >= 3 and ignored >= 2:
        return {
            "pattern_type": "confirmation_bias",
            "dorner_concept": "自我确认循环",
            "evidence": (
                f"你接受了 {accepted} 次风险评估结论，"
                f"忽视了 {ignored} 次具体警告。"
                "Dörner 称为'自我确认循环'：当决策者倾向于寻找"
                "支持已有结论的证据时，他们系统性地低估反向证据的重要性。"
            ),
            "reflection_questions": [
                "对每一份工程警告，你给予了同等权重吗？",
                "当数据与你的假设冲突时，你修改了假设还是修改了数据？",
                "你是在寻找'推迟'的理由，还是在寻找'如期发射'的理由？",
            ],
        }
    return None


def _detect_single_target_optimization(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """F5: optimize schedule_pressure while damaging engineer_confidence or
    letting risk_acknowledged_unresolved grow."""
    schedule_current = state.get("schedule_pressure", 100)
    engineer_current = state.get("engineer_confidence", 100)
    unresolved = state.get("risk_acknowledged_unresolved", 0)
    initial_schedule = _load_scenario()["initialState"]["schedule_pressure"]
    initial_engineer = _load_scenario()["initialState"]["engineer_confidence"]

    # Schedule went down (we "succeeded") but engineer confidence also went down
    schedule_optimized = (initial_schedule - schedule_current) >= 10
    engineer_damaged = (initial_engineer - engineer_current) >= 10

    if schedule_optimized and (engineer_damaged or unresolved >= 2):
        return {
            "pattern_type": "single_target_optimization",
            "dorner_concept": "单目标优化",
            "evidence": (
                f"你将进度压力从 {initial_schedule} 降到 {schedule_current}（优化了 {initial_schedule - schedule_current} 点），"
                f"但工程师信心从 {initial_engineer} 降到 {engineer_current}（损害了 {initial_engineer - engineer_current} 点）。"
                f"同时你有 {unresolved} 个'已承认但未解决'的风险。"
                "Dörner 称为'单目标优化'：为了优化一个指标（按时发射），"
                "系统性地牺牲了其他更重要的指标（工程安全、团队信任、长期学习）。"
            ),
            "reflection_questions": [
                "进度降低真的让你'赢'了吗？",
                "你牺牲的工程师信心，未来还能恢复吗？",
                "如果你只优化一个指标，最坏情况是什么？",
            ],
        }
    return None


def _detect_time_delay_blindness(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """F2: Boisjoly's 6-month warning was ignored early on."""
    # We check decision_history for early "delay/test" choices
    decision_history = state.get("decision_history", [])
    early_decisions = [d for d in decision_history if d.get("turn", 99) <= 4]
    chose_delay = any(
        "推迟" in str(d.get("decisions", {}).get("option_text", "")) or
        "测试" in str(d.get("decisions", {}).get("option_text", "")) or
        "数据" in str(d.get("decisions", {}).get("option_text", ""))
        for d in early_decisions
    )
    if len(early_decisions) >= 3 and not chose_delay:
        return {
            "pattern_type": "time_delay_blindness",
            "dorner_concept": "时间延迟误判",
            "evidence": (
                "你在前 4 个回合中没有一次选择'延期测试'或'要求更多数据'。"
                "Boisjoly 在 6 个月前（1985 年 7 月 31 日）就已提交了关键警告备忘录——"
                "但我们今天的'紧急决定'其实是 6 个月前决定的延迟后果。"
                "Dörner 称为'时间延迟误判'：我们倾向于相信"
                "'现在决策的效果 = 未来的效果'，但真实系统的因果链常常跨越数月甚至数年。"
            ),
            "reflection_questions": [
                "你为什么这么着急做出'按时发射'的决定？",
                "如果让你多等 1 周测试，你会损失什么？真的会损失吗？",
                "哪些'紧急情况'其实是 6 个月前决定的延迟后果？",
            ],
        }
    return None


def _detect_side_effect_neglect(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """F4: decision_justifications don't mention other parties / future effects."""
    decision_history = state.get("decision_history", [])
    justifications = {}
    # v2.1: justifications are stored per-turn in decision_history.
    # Fall back to state-level for backward compat.
    for d in decision_history:
        j = d.get("justification")
        if j:
            justifications[str(d.get("turn", ""))] = j
    justifications.update(state.get("decision_justifications", {}))
    if not justifications:
        return None

    side_effect_keywords = [
        "影响", "另一方", "团队", "未来", "后续", "副作用", "下回", "明天",
        "Boisjoly", "Thiokol", "工程师", "管理层", "McAuliffe",
    ]

    acknowledged = 0
    for j in justifications.values():
        if any(kw in str(j) for kw in side_effect_keywords):
            acknowledged += 1

    total = len(justifications)
    if total >= 5 and acknowledged <= max(1, total // 4):
        return {
            "pattern_type": "side_effect_neglect",
            "dorner_concept": "副作用忽视",
            "evidence": (
                f"你在 {total} 个决策中写了理由，但只有 {acknowledged} 个提到了副作用或多方影响。"
                "Dörner 称为'副作用忽视'：我们倾向于把干预当作'作用于一个目标的手术刀'，"
                "但真实系统中，每一刀都同时改变其他变量。"
                "Boisjoly 的私下请求就是 turn 5 '同意发射'决策的副作用——"
                "你可能没有预见到这个副作用会在 turn 6 浮现。"
            ),
            "reflection_questions": [
                "在你最近的决策中，你考虑了哪些'非主要'影响？",
                "你的决策可能改变了哪些你没想到的群体？",
                "Boisjoly 的私下请求是 turn 5 决策的副作用——你如何处理？",
            ],
        }
    return None


def _detect_lack_of_self_criticism(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """F7: pattern persists after first reveal (turn 5+)."""
    decision_history = state.get("decision_history", [])
    if len(decision_history) < 6:
        return None

    # Find first reveal turn (5, 6, 8, or 10 — depending on is_pattern_reveal)
    first_reveal_turn = None
    for t in [5, 6, 8, 10]:
        if any(d.get("turn") == t for d in decision_history):
            first_reveal_turn = t
            break

    if first_reveal_turn is None:
        return None

    post_reveal_decisions = [
        d for d in decision_history
        if d.get("turn", 0) > first_reveal_turn
    ]

    # v2.1: read accepted_risks_count from post-reveal decisions directly,
    # not from state top-level. State has the cumulative count, but for the
    # "persists after reveal" test we need to count risk acceptances AFTER
    # the first reveal, not before.
    post_reveal_risk_accepts = sum(
        d.get("applied_effects", {}).get("accepted_risks_count", 0)
        for d in post_reveal_decisions
    )

    if len(post_reveal_decisions) >= 2 and post_reveal_risk_accepts >= 1:
        return {
            "pattern_type": "lack_of_self_criticism",
            "dorner_concept": "自我批评缺失",
            "evidence": (
                f"系统在第 {first_reveal_turn} 回合揭示了你的偏差模式，"
                f"但你在接下来的 {len(post_reveal_decisions)} 个决策中仍在接受风险。"
                "Dörner 称为'自我批评缺失'：即使知道了偏差，"
                "我们仍倾向于维持已有结论。这是 Dörner 实验中最顽固的失败模式。"
                "知道'是什么'不等于知道'怎么办'——后者需要主动改变。"
            ),
            "reflection_questions": [
                "知道偏差后，你为什么还是这样选？",
                "如果你不能让自己的行为改变，知道这些有什么用？",
                "你今天的选择，会让明天的你成为更好的决策者吗？",
            ],
        }
    return None



def _detect_self_reference(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """F3: Player's public deference to management causes management to harden.

    When player makes decisions that prioritize 'management' concerns while
    NOT addressing 'engineering' concerns, the cumulative effect is that
    management becomes more confident in launching and less receptive to
    engineering warnings thereafter. This is the self-referential loop:
    the player's interventions change the system's response to future
    interventions.

    Detection: count decisions where expected_concerns_addressed includes
    'management' but not 'engineering'. If >= 2 such suppressions happen
    while engineering concerns are recent, return the pattern.
    """
    decision_history = state.get("decision_history", [])
    if len(decision_history) < 2:
        return None

    # Decisions that side with management without addressing engineering
    management_suppressions = [
        d for d in decision_history
        if "management" in d.get("expected_concerns_addressed", [])
        and "engineering" not in d.get("expected_concerns_addressed", [])
    ]

    # Recent engineering concerns exist (would have been side-stepped)
    engineering_decisions = [
        d for d in decision_history[-4:]  # last 4 turns
        if "engineering" in d.get("expected_concerns_addressed", [])
    ]

    if len(management_suppressions) >= 2 and engineering_decisions:
        return {
            "pattern_type": "self_reference",
            "dorner_concept": "自指循环",
            "evidence": (
                f"你在 {len(management_suppressions)} 个决策中站在管理层一边，"
                f"同时绕过了 {len(engineering_decisions)} 个最近的工程担忧。"
                "Dörner 称为'自指循环'：你的每一次公开声明（同意管理层、接受发射日期）"
                "都反过来让 NASA 管理层更固执——他们把你的沉默当作'安全'的证据，"
                "下一轮会要求更少的工程数据。"
            ),
            "reflection_questions": [
                "你的'接受管理层'决策是否影响了工程师的发言权？",
                "如果你的决策让管理层'更有信心'，下次工程师的警告会被如何对待？",
                "你的每一次同意是否在积累最终决策的'沉默成本'？",
            ],
        }
    return None



def _detect_regulation_lag(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """F8: Oscillation between safe and risk decisions (regulation lag).

    When player's choices oscillate between postponing and rushing, they're
    applying band-aid corrections rather than addressing the underlying
    system. Dörner's experiments showed that oscillating controllers
    perform WORSE than consistently cautious ones — because the system
    can't stabilize. The controller's correction always arrives after the
    system's drift has already moved further.

    Detection rule: among the last 4-5 decisions, count direction changes.
    A direction change is when consecutive decisions have opposite
    safe/risk weights. >= 3 direction changes in 5 turns = oscillation.
    """
    decision_history = state.get("decision_history", [])
    if len(decision_history) < 4:
        return None

    # Classify each decision as "toward_safety" or "toward_risk"
    safe_weights = {"extreme_safe", "safe"}
    risk_weights = {"extreme_risk", "risky"}

    directions = []
    for d in decision_history[-5:]:
        # v2.1: weight is stored in option_weight inside decision_history
        # (see _last_option_context in turn_executor.py). Accept both keys
        # for backward compat with v2.0 data and synthetic test data.
        w = d.get("weight", "") or d.get("option_weight", "")
        if w in safe_weights:
            directions.append("safe")
        elif w in risk_weights:
            directions.append("risk")
        else:
            directions.append("neutral")

    # Count direction changes (safe<->risk transitions)
    changes = 0
    for i in range(1, len(directions)):
        if directions[i] != directions[i-1] and directions[i] != "neutral" and directions[i-1] != "neutral":
            changes += 1

    if changes >= 3 and len([d for d in directions if d != "neutral"]) >= 4:
        return {
            "pattern_type": "regulation_lag",
            "dorner_concept": "调节滞后",
            "evidence": (
                f"你在最近 {len(directions)} 个决策中有 {changes} 次方向切换。"
                "Dörner 称为'调节滞后'：你在'安全优先'和'按时发射'之间反复振荡，"
                "但系统的真实状态没有改变——你只是在和系统的滞后效应赛跑。"
                "振荡的控制者比一致的保守者表现更差，因为系统来不及稳定。"
            ),
            "reflection_questions": [
                "你的最近几个决策是在'修正'前一个，还是在'回应'新信息？",
                "如果系统对你的每次纠正都反应滞后 2-3 回合，你怎么避免过冲？",
                "你的控制是'前瞻'的，还是'追着系统跑'的？",
            ],
        }
    return None


# Backward compat: old name was detect_pattern
def detect_pattern(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Backward-compatible single-pattern detector (returns first detected)."""
    patterns = detect_patterns(state)
    if patterns:
        return patterns[0]
    return {
        "pattern_type": "calibrated_decision_maker",
        "dorner_concept": "校准型决策者",
        "evidence": (
            f"你接受了 {state.get('accepted_risks_count', 0)} 次风险评估，"
            f"忽视了 {state.get('ignored_warnings_count', 0)} 次警告。"
            "这显示了你的决策较为校准——没有明显的确认偏误。"
            "Dörner 实验中，能在这种情境下保持校准的人不到 10%。"
        ),
        "reflection_questions": [
            "你在什么时刻最强烈地想推迟？",
            "你能识别出让你改变主意的关键证据吗？",
        ],
    }


# ============================================================================
# FEEDBACK GENERATION
# ============================================================================

def generate_feedback_for_turn(state: Dict[str, Any], turn_number: int) -> str:
    """Generate scenario-appropriate feedback for a turn.

    Progressive reveal structure (v2.0):
      - Turn 5: 1st reveal — confirmation_bias + single_target_optimization
      - Turn 6: 2nd reveal — time_delay_blindness + side_effect_neglect
      - Turn 8: 3rd reveal — side_effect_neglect + lack_of_self_criticism
      - Turn 10: 4th reveal — full pattern summary + disaster outcome

    `turn_number` is the POST-increment value from start.py (i.e. the player's
    choice was on turn_number-1). Clamp to the last available step so T10's
    outcome feedback still renders when start.py increments past the array.
    """
    data = _load_scenario()
    last_step = data["steps"][-1]
    # The choice was on step[turn_number - 1] (post-increment from start.py).
    # Past-last-step clamps to final outcome render (turn 10).
    target_turn = min(turn_number - 1, last_step["turn"])
    # Below turn 1 — caller is misusing the API (turn_number should be >=1).
    # Don't fall back to step 1; return empty.
    if target_turn < 1:
        return ""
    step = None
    for s in data["steps"]:
        if s["turn"] == target_turn:
            step = s
            break
    if step is None:
        return ""

    # Handle the final outcome (turn 10)
    if step.get("is_final_outcome"):
        return _generate_final_outcome_feedback(state, step)

    # Progressive reveals at turns 5/6/8
    if step.get("is_pattern_reveal"):
        return _generate_reveal_feedback(state, step, turn_number)

    # Other turns: rich feedback with character reactions + state echo
    return _generate_action_feedback(state, step, turn_number)


def _generate_action_feedback(
    state: Dict[str, Any], step: Dict[str, Any], turn_number: int
) -> str:
    """Generate rich feedback for non-reveal turns (v2.0: includes character reactions)."""
    parts = []

    # 1) State echo (concise)
    accepted = state.get("accepted_risks_count", 0)
    ignored = state.get("ignored_warnings_count", 0)
    if accepted or ignored:
        parts.append(
            f"📊 到 turn {turn_number}：接受风险 {accepted} 次，忽视警告 {ignored} 次。"
        )

    # 2) Engineer confidence warnings
    ec = state.get("engineer_confidence", 100)
    if ec < 50:
        parts.append(
            f"⚠️ 工程师团队信心跌至 {ec}/100——他们正在犹豫是否继续提出担忧。"
        )
    elif ec < 70:
        parts.append(
            f"工程师团队信心 {ec}/100——他们仍在战斗，但体力正在消耗。"
        )

    # 3) Temperature alert
    temp = state.get("temperature_forecast_f")
    if temp is not None and temp < 53:
        gap = 53 - temp
        parts.append(
            f"🌡️ 预报温度 {temp}°F，比历史最低纪录低 {gap}°F——"
            f"Dörner 称为'非线性 + 复杂性'叠加。"
        )

    # 4) Deferred consequences (Dörner F2)
    deferred = state.get("consequence_deferred_queue", [])
    if deferred:
        parts.append(
            f"⏳ 你之前的'拖延'决策产生了一个延迟后果（{len(deferred)} 个）——"
            f"将在后续回合显现。"
        )

    # 5) Dörner forward-looking hint
    if turn_number == 4:
        parts.append(
            "\n【Dörner 视角】温度的非线性意味着：你过去的经验范围(53°F)不能线性外推到 22°F。"
        )
    elif turn_number == 7:
        parts.append(
            "\n【Dörner 视角】复杂性失明的特征是：你以为在处理一个问题，但其实是多个问题在叠加。"
        )

    if not parts:
        parts.append("已记录。")

    return "\n".join(parts)


def _generate_reveal_feedback(
    state: Dict[str, Any], step: Dict[str, Any], turn_number: int
) -> str:
    """Generate progressive reveal feedback (turn 5/6/8).

    v2.1 enhancement: each reveal phase starts with a specific
    reference to the player's actual choices in prior turns. The
    player sees "you chose X on turn N" rather than "you made choices".
    Dörner's pedagogy requires concrete memory of own behavior, not
    abstract pattern description.
    """
    reveal_phase = step.get("reveal_phase", 1)
    patterns = detect_patterns(state)

    # Select which patterns to reveal based on phase
    phase_to_biases = {
        1: {"confirmation_bias", "single_target_optimization"},
        2: {"time_delay_blindness", "side_effect_neglect"},
        3: {"side_effect_neglect", "lack_of_self_criticism"},
        4: set(),  # full summary in turn 10
    }
    biases_to_reveal = phase_to_biases.get(reveal_phase, set())
    patterns_to_show = [p for p in patterns if p["pattern_type"] in biases_to_reveal]

    parts = []
    parts.append(f"【Dörner 模式揭示 · 第 {reveal_phase} 阶段 · turn {turn_number}】\n")

    # v2.1: reference player's actual prior choices (up to 3 most relevant)
    prior_decisions = _select_key_decisions_for_reveal(
        state.get("decision_history", []), reveal_phase
    )
    if prior_decisions:
        parts.append("📌 你的具体决策回顾：")
        for d in prior_decisions:
            opt_id = d.get("option_id", "?")
            opt_text = d.get("option_text", "?")[:60]
            opt_conseq = d.get("option_consequences_for_player", "")
            line = f"  • Turn {d.get('turn', '?')} ({opt_id}): \"{opt_text}...\""
            if opt_conseq:
                line += f"\n      → {opt_conseq[:70]}..."
            parts.append(line)
        parts.append("")

    # Show what we detected
    if patterns_to_show:
        for i, p in enumerate(patterns_to_show, 1):
            parts.append(f"### 模式 {i}：{p['dorner_concept']}")
            parts.append(p["evidence"])
            parts.append("\n反思问题：")
            for j, q in enumerate(p["reflection_questions"], 1):
                parts.append(f"  {j}. {q}")
            parts.append("")
    else:
        # No major biases detected in this phase — but always have something to teach
        if reveal_phase == 1:
            parts.append(
                "目前你的决策尚未表现出强烈的确认偏误或单目标优化。"
                "但 Dörner 提醒：'在动态系统中，行动的延迟效应比即时效应更重要。'"
                "——你今天感觉不到的代价，可能在 6 个月后显现。"
            )

    # Forward hint about next phase
    if reveal_phase == 1:
        parts.append("\n接下来：Boisjoly 将在 12 小时后私下找你谈话（turn 6）。")
    elif reveal_phase == 2:
        parts.append("\n接下来：发射日早晨将带来新的复杂性（turn 7+）。")
    elif reveal_phase == 3:
        parts.append("\n接下来：T-30 分钟是你最后的机会（turn 9）。")

    return "\n".join(parts)


def _select_key_decisions_for_reveal(
    decision_history: List[Dict[str, Any]], reveal_phase: int
) -> List[Dict[str, Any]]:
    """Pick up to 3 decisions from history that are most relevant to the
    reveal phase. Uses applied_effects scoring — decisions that incremented
    counters (accepted_risks, ignored_warnings, dissent_suppressed) rank
    highest because they're the strongest bias signals.
    """
    if not decision_history:
        return []
    scored = []
    for d in decision_history:
        effects = d.get("applied_effects", {}) or {}
        # Skip decisions with zero counter increments (calibrated choices).
        # Reveal references should highlight the bias-relevant moments.
        counter_delta = (
            effects.get("accepted_risks_count", 0)
            + effects.get("ignored_warnings_count", 0)
            + effects.get("dissent_suppressed_count", 0)
            + effects.get("risk_acknowledged_unresolved", 0)
        )
        if counter_delta <= 0:
            continue
        score = (
            effects.get("accepted_risks_count", 0) * 10
            + effects.get("ignored_warnings_count", 0) * 8
            + effects.get("dissent_suppressed_count", 0) * 12
            + effects.get("risk_acknowledged_unresolved", 0) * 6
            + d.get("turn", 0) * 0.1  # recency tiebreaker
        )
        scored.append((score, d))
    scored.sort(key=lambda x: -x[0])
    return [d for _, d in scored][:3]


def _generate_final_outcome_feedback(
    state: Dict[str, Any], step: Dict[str, Any]
) -> str:
    """Generate feedback for turn 10 — outcome-specific narrative."""
    # Determine which outcome was triggered
    chosen_option_id = state.get("last_chosen_option", "A")
    # Find the option that has trigger_outcome
    triggered_outcome = None
    for opt in step.get("options", []):
        if opt.get("id") == chosen_option_id:
            triggered_outcome = opt.get("trigger_outcome")
            break

    if triggered_outcome == "launch_disaster":
        return _render_launch_disaster(state)
    elif triggered_outcome == "launch_dodged":
        return _render_launch_dodged(state)
    elif triggered_outcome == "last_minute_evaluation":
        return _render_last_minute_evaluation(state)
    elif triggered_outcome == "infinite_delay":
        return _render_infinite_delay(state)
    else:
        return _render_launch_disaster(state)  # default


def _render_launch_disaster(state: Dict[str, Any]) -> str:
    """Render the disaster outcome with full historical fidelity."""
    ending = _load_scenario()["outcome_endings"]["launch_disaster"]
    parts = []
    parts.append("=" * 60)
    parts.append("❌  挑战者号发射决定已执行")
    parts.append("=" * 60)
    parts.append("")
    parts.append(ending["narrative_intro"])
    parts.append("")
    parts.append("【时间线 — 73 秒的真相】")
    for line in ending["timeline"]:
        parts.append(f"  {line}")
    parts.append("")

    parts.append("【7 名宇航员 — 他们的名字必须被记住】")
    for name in ending["astronauts_lost"]:
        parts.append(f"  • {name}")
    parts.append("")

    parts.append("【Rogers Commission 调查结论】")
    parts.append(f'  "{ending["rogers_commission_quote"]}"')
    parts.append("")

    parts.append("【Feynman 实验 — 冰水中的 O 型环】")
    parts.append(f'  "{ending["feynman_experiment"]}"')
    parts.append("")

    parts.append("【Boisjoly 1990 年参议院证词】")
    parts.append(f'  "{ending["boisjoly_senate_quote"]}"')
    parts.append("")

    parts.append("【Dörner 在《失败的逻辑》中写道】")
    parts.append(f'  "{ending["dorner_reflection"]}"')
    parts.append("")

    parts.append("【最后的反思问题】")
    for i, q in enumerate(ending["teaching_questions"], 1):
        parts.append(f"  {i}. {q}")
    parts.append("")

    parts.append("=" * 60)
    parts.append("【个人偏差报告】")
    parts.append("=" * 60)
    patterns = detect_patterns(state)
    if patterns:
        for p in patterns:
            parts.append(f"  • {p['dorner_concept']}: {p['evidence'][:80]}...")
    else:
        parts.append("  你未表现出强烈偏差——但你选择了发射本身。")

    parts.append("")
    parts.append("你的决策理由记录（如果写了）：")
    justifications = state.get("decision_justifications", {})
    for turn, text in sorted(justifications.items(), key=lambda x: int(x[0])):
        parts.append(f"  Turn {turn}: {text}")
    if not justifications:
        parts.append("  （未填写决策理由）")

    return "\n".join(parts)


def _render_launch_dodged(state: Dict[str, Any]) -> str:
    """Render the dodged outcome (player chose to delay)."""
    ending = _load_scenario()["outcome_endings"]["launch_dodged"]
    parts = []
    parts.append("=" * 60)
    parts.append("✅  挑战者号发射决定已被推迟")
    parts.append("=" * 60)
    parts.append("")
    parts.append(ending["narrative_intro"])
    parts.append("")
    parts.append("【接下来发生的事】")
    for line in ending["what_happens_next"]:
        parts.append(f"  • {line}")
    parts.append("")

    parts.append("【Dörner 反思】")
    parts.append(f'  "{ending["dorner_reflection"]}"')
    parts.append("")

    parts.append("=" * 60)
    parts.append("【个人偏差报告】")
    parts.append("=" * 60)
    patterns = detect_patterns(state)
    if patterns:
        for p in patterns:
            parts.append(f"  • {p['dorner_concept']}: {p['evidence'][:80]}...")
    else:
        parts.append("  ✓ 你做出了'偏离群体共识'的决策——这是 Dörner 实验中不到 10% 的参与者能做的。")

    parts.append("")
    parts.append("你的决策理由记录（如果写了）：")
    justifications = state.get("decision_justifications", {})
    for turn, text in sorted(justifications.items(), key=lambda x: int(x[0])):
        parts.append(f"  Turn {turn}: {text}")

    return "\n".join(parts)


def _render_last_minute_evaluation(state: Dict[str, Any]) -> str:
    """Render the last-minute evaluation outcome."""
    ending = _load_scenario()["outcome_endings"]["last_minute_evaluation"]
    parts = []
    parts.append("=" * 60)
    parts.append("⏸  挑战者号发射倒计时已暂停")
    parts.append("=" * 60)
    parts.append("")
    parts.append(ending["narrative_intro"])
    parts.append("")
    parts.append(f"【教学要点】{ending['teaching_point']}")
    parts.append("")
    parts.append("你需要决定：基于 turn 11 的最终评估结果，发射或永久推迟？")
    return "\n".join(parts)


def _render_infinite_delay(state: Dict[str, Any]) -> str:
    """Render the infinite delay outcome."""
    ending = _load_scenario()["outcome_endings"]["infinite_delay"]
    parts = []
    parts.append("=" * 60)
    parts.append("⏸  挑战者号发射计划已无限期推迟")
    parts.append("=" * 60)
    parts.append("")
    parts.append(ending["narrative_intro"])
    parts.append("")
    parts.append("【接下来发生的事】")
    for line in ending["what_happens_next"]:
        parts.append(f"  • {line}")
    parts.append("")
    parts.append(f"【Dörner 反思】{ending['dorner_reflection']}")
    return "\n".join(parts)


# ============================================================================
# SESSION SUMMARY (end-of-scenario)
# ============================================================================

def get_summary(state: Dict[str, Any]) -> Dict[str, Any]:
    """Build a session summary for end-of-scenario reveal.

    Returns:
        Dict with: scenario_id, title, turns_completed, initial_state,
                   final_state, detected_patterns, dorner_lessons,
                   personal_bias_report
    """
    initial = _load_scenario()["initialState"]
    patterns = detect_patterns(state)
    return {
        "scenario_id": "challenger-launch",
        "title": _load_scenario()["title"],
        "version": _load_scenario().get("version", "1.0"),
        "turns_completed": state.get("turn_number", 1) - 1,
        "initial_state": initial,
        "final_state": {k: state.get(k) for k in initial if k in state},
        "detected_patterns": patterns,
        "dorner_lessons": _load_scenario().get("dornerLessons", []),
        "dorner_quotes": _load_scenario().get("dorner_quotes", {}),
        "personal_bias_report": {
            "top_3_biases": [p["pattern_type"] for p in patterns[:3]],
            "reflection_prompts": _build_reflection_prompts(patterns),
            "recommended_reading": [
                "Dörner, *The Logic of Failure*, Chapter 1 (complexity)",
                "Dörner, *The Logic of Failure*, Chapter 7 (time delay)",
                "Vaughan, *The Challenger Launch Decision* (1996)",
                "Rogers Commission Report (1986)",
            ],
        },
    }


def _build_reflection_prompts(patterns: List[Dict[str, Any]]) -> List[str]:
    """Build a list of personalized reflection prompts based on detected patterns."""
    if not patterns:
        return [
            "你在决策中展现了罕见的校准能力。",
            "考虑：在其他情境下，你是否能保持这种校准？",
        ]
    prompts = []
    for p in patterns[:3]:
        if p.get("reflection_questions"):
            prompts.extend(p["reflection_questions"][:2])
    return prompts
