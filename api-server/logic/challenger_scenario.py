"""challenger_scenario.py — Dörner-style multi-turn scenario engine for Challenger.

This module powers the "challenger-launch" scenario: a 10-turn simulation
modeled after the actual Challenger decision timeline. Each turn presents
a real decision from the historical record; choices have cascading
effects on 9 state variables. Turn 6 is the cognitive bias reveal —
based on the player's accepted_risks_count and ignored_warnings_count,
a Dörner-style pattern is named.

The scenario data lives in api-server/data/scenarios/challenger_launch.json
and is loaded once at import time. Effects are applied deterministically
based on the option ID (A/B/C/D) the player picked.

This is the FIRST scenario that takes the "logic" pipeline beyond mechanical
state-mutation. It teaches 5 Dörner lessons through experience:

  1. time_delay — risks manifest over turns, not instantly
  2. confirmation_bias — repeated risk-acceptance despite warnings
  3. single_target_optimization — chasing schedule over safety
  4. side_effects — every choice has multiple downstream effects
  5. lack_of_self_criticism — refusing to update mental model
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
    """Return the initial state for a new Challenger session."""
    return dict(_load_scenario()["initialState"])


def get_step(turn_number: int) -> Optional[Dict[str, Any]]:
    """Return the step dict for a given turn (1-indexed), or None if past end.

    The frontend uses this to render the situation + options for the player.
    """
    data = _load_scenario()
    for step in data["steps"]:
        if step["turn"] == turn_number:
            return step
    return None


def apply_turn(state: Dict[str, Any], option_id: str) -> Dict[str, Any]:
    """Apply the effects of the player's chosen option for the CURRENT turn.

    The current turn is state["turn_number"] BEFORE the player's action.
    After this function, state["turn_number"] should be incremented by the
    caller (start.py already does this).

    `option_id` is expected to be one of "A", "B", "C", "D" matching
    step["options"][i]["id"] for the current turn.

    Returns the modified state (mutates in place AND returns for chaining).
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
        # Past the end of scenario. State stays as-is.
        return state

    # Find the chosen option's effects
    chosen_option = None
    for opt in step["options"]:
        if opt["id"] == option_id:
            chosen_option = opt
            break

    if chosen_option is None:
        # Invalid option — no state change
        return state

    # Apply effects to state. Negative values use bare minus; positive have +.
    effects = step.get("expected_effects", {}).get(option_id, {})
    for key, value in effects.items():
        if key in state:
            state[key] = state[key] + value
        else:
            state[key] = value

    # Track meta-counters used by the bias reveal
    # accepted_risks_count: choices that prioritize schedule over safety
    # ignored_warnings_count: choices where engineers' concerns were overridden
    # (heuristic — explicit fields in expected_effects are used)
    if "accepted_risks_count" in effects:
        pass  # already applied
    if "ignored_warnings_count" in effects:
        pass  # already applied

    # Clamp state values to reasonable ranges
    for key in [
        "engineer_confidence",
        "schedule_pressure",
        "public_attention",
        "morale_boost_per_decision",
    ]:
        if key in state:
            state[key] = max(0, min(100, state[key]))
    if "budget_used_pct" in state:
        state["budget_used_pct"] = max(0, min(200, state["budget_used_pct"]))
    # Counter fields must be >= 0 — "un-accepting" a risk doesn't undo history.
    for counter_key in ["accepted_risks_count", "ignored_warnings_count"]:
        if counter_key in state:
            state[counter_key] = max(0, state[counter_key])

    return state


def detect_pattern(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Detect cognitive bias patterns in player's decision history.

    Triggered at turn 6 (the is_pattern_reveal step) and again at scenario end.
    Returns a structured insight that the feedback layer can present to the user.

    Patterns detected (per Dörner's "Logic of Failure"):
      - confirmation_bias: high accepted_risks + high ignored_warnings
      - single_target_optimization: schedule_pressure always prioritized
      - complexity_blindness: cumulative risk ignored
    """
    accepted = state.get("accepted_risks_count", 0)
    ignored = state.get("ignored_warnings_count", 0)

    if accepted >= 3 and ignored >= 2:
        return {
            "pattern_type": "confirmation_bias",
            "dorner_concept": "自我确认循环",
            "evidence": (
                f"你在前5个回合中接受了 {accepted} 次风险评估结论，"
                f"忽视了 {ignored} 次具体警告。"
                "Dörner将此模式命名为'自我确认循环'："
                "当决策者倾向于寻找支持已有结论的证据时，"
                "会系统性地低估反向证据的重要性。"
            ),
            "reflection_questions": [
                "对每一份工程警告，你给予了同等权重吗？",
                "当数据与你的假设冲突时，你修改了假设还是修改了数据？",
                "你是在寻找'推迟'的理由，还是在寻找'如期发射'的理由？",
            ],
        }

    if state.get("schedule_pressure", 100) <= 30 and accepted >= 2:
        # Player consistently chose low schedule pressure but still accepted
        # at least 2 risks — suggests single-target optimization only weakly
        return {
            "pattern_type": "complexity_blindness",
            "dorner_concept": "复杂性失明",
            "evidence": (
                "你在压力较低时仍然接受了累积风险。"
                "Dörner称为'复杂性失明'：低估系统的内在复杂性，"
                "用简单模型去理解多变量反馈。"
            ),
            "reflection_questions": [
                "你是否把所有不确定性当作可接受的？",
                "你的风险评估是否考虑过'累积效应'？",
            ],
        }

    if accepted <= 1 and ignored <= 1:
        return {
            "pattern_type": "calibrated_decision_maker",
            "dorner_concept": "校准型决策者",
            "evidence": (
                f"你接受了 {accepted} 次风险评估，忽视了 {ignored} 次警告。"
                "这显示了你的决策较为校准——没有明显的确认偏误。"
                "Dörner实验中，能在这种情境下保持校准的人不到 10%。"
            ),
            "reflection_questions": [
                "你在什么时刻最强烈地想推迟？",
                "你能识别出让你改变主意的关键证据吗？",
            ],
        }

    return None


def generate_feedback_for_turn(state: Dict[str, Any], turn_number: int) -> str:
    """Generate scenario-appropriate feedback for a turn.

    For turns 1-5 (before pattern reveal): brief, action-specific feedback
    that hints at consequences without naming them — matches Dörner's
    'create confusion' principle.

    For turn 6 (pattern reveal): structured analysis with detected bias
    and reflection questions.

    For turns 7-10: progressive insight based on accumulated pattern.

    The 'feel' is intentionally restrained — letting the player discover
    consequences rather than lecturing.
    """
    data = _load_scenario()
    step = None
    for s in data["steps"]:
        if s["turn"] == turn_number:
            step = s
            break
    if step is None:
        return ""

    if step.get("is_pattern_reveal"):
        # Turn 6: name the bias pattern explicitly
        pattern = detect_pattern(state)
        if pattern:
            return (
                f"【系统分析·第 {turn_number} 回合】\n\n"
                f"{pattern['evidence']}\n\n"
                f"【Dörner 反思】\n"
                + "\n".join(f"  {i+1}. {q}" for i, q in enumerate(pattern['reflection_questions']))
                + f"\n\n现在请你：{step['situation'].split('\\n\\n')[-1]}"
            )
        return step["situation"]

    # Other turns: brief feedback highlighting the most relevant state change
    feedback_parts = []
    accepted = state.get("accepted_risks_count", 0)
    ignored = state.get("ignored_warnings_count", 0)
    if accepted or ignored:
        feedback_parts.append(
            f"到现在你已接受 {accepted} 次风险评估，忽视 {ignored} 次警告。"
        )
    if state.get("engineer_confidence") is not None:
        ec = state["engineer_confidence"]
        if ec < 50:
            feedback_parts.append(
                "⚠️ 工程师团队的信心已经低于 50%——他们在犹豫是否继续提出担忧。"
            )
    return " ".join(feedback_parts) if feedback_parts else "已记录。"


def get_summary(state: Dict[str, Any]) -> Dict[str, Any]:
    """Build a session summary for end-of-scenario reveal.

    Compares the final state against the initial state and surfaces
    the decision pattern. This is what the user sees at the end.
    """
    initial = _load_scenario()["initialState"]
    pattern = detect_pattern(state)
    return {
        "scenario_id": "challenger-launch",
        "title": _load_scenario()["title"],
        "turns_completed": state["turn_number"] - 1,
        "initial_state": initial,
        "final_state": {k: state[k] for k in initial},
        "decision_pattern": pattern,
        "dorner_lessons": _load_scenario().get("dornerLessons", []),
    }
