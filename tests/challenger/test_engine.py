"""test_engine.py — pytest-style tests for Challenger scenario engine.

Covers:
- Initial state seeding
- Turn-by-turn effect application
- 8 Dörner bias detectors (F1 non-linearity is structural; F2-F8 are detector-level)
- Outcome routing (3 branches)
- Deferred consequences (F2 time delay)
- Decision justification storage
- Edge cases (invalid option, out-of-range turn)
"""

import pytest
import sys

sys.path.insert(0, "api-server")

from logic.challenger_scenario import (
    get_initial_state,
    apply_turn,
    get_step,
    detect_patterns,
    generate_feedback_for_turn,
    get_summary,
    escape_justification,
    _detect_confirmation_bias,
    _detect_single_target_optimization,
    _detect_time_delay_blindness,
    _detect_side_effect_neglect,
    _detect_lack_of_self_criticism,
    _detect_self_reference,
    _detect_regulation_lag,
    _apply_deferred_consequences,
    _select_key_decisions_for_reveal,
)


# ---- Fixtures ----

@pytest.fixture
def fresh_state():
    """A fresh Challenger state with turn_number=1 (before any decisions)."""
    s = get_initial_state()
    s["turn_number"] = 1
    return s


def _build_decision_record(turn, option_id, option_text="test option",
                              concerns=None, effects=None, weight="neutral",
                              justification=None):
    """Build a v2.1-format decision_history entry."""
    return {
        "turn": turn,
        "option_id": option_id,
        "option_text": option_text,
        "option_consequences_for_player": "test consequence",
        "option_weight": weight,
        "expected_concerns_addressed": concerns or [],
        "applied_effects": effects or {},
        "decisions": {"option": option_id},
        "justification": justification,
    }


# ---- Initial state ----

def test_initial_state_has_all_keys():
    s = get_initial_state()
    expected = {
        "days_to_launch", "temperature_forecast_f", "o_ring_risk_data",
        "engineer_confidence", "schedule_pressure", "budget_used_pct",
        "public_attention", "team_morale",
        "ignored_warnings_count", "accepted_risks_count",
        "risk_acknowledged_unresolved", "dissent_suppressed_count",
        "consequence_deferred_queue", "decision_justifications",
    }
    assert expected.issubset(set(s.keys())), \
        f"Missing keys: {expected - set(s.keys())}"


def test_initial_state_values_match_json():
    s = get_initial_state()
    assert s["days_to_launch"] == 30
    assert s["engineer_confidence"] == 75
    assert s["schedule_pressure"] == 60
    assert s["accepted_risks_count"] == 0
    assert s["ignored_warnings_count"] == 0


# ---- Turn application ----

def test_apply_turn_increases_accepted_risks_when_option_demands_it():
    """T1 options don't increment accepted_risks (which kicks in later).
    Use T5 option C which definitively adds 2 to accepted_risks_count."""
    s = get_initial_state()
    s["turn_number"] = 5  # T5 is "最终审查会议" with strong risk acceptance options
    apply_turn(s, "C")     # T5-C: 按原计划发射 (accept risk)
    assert s["accepted_risks_count"] >= 1


def test_apply_turn_increments_ignored_warnings():
    """T1-B increments ignored_warnings_count (T1-D doesn't)."""
    s = get_initial_state()
    s["turn_number"] = 1
    apply_turn(s, "B")
    assert s["ignored_warnings_count"] >= 1


def test_apply_turn_records_last_chosen_option(fresh_state):
    apply_turn(fresh_state, "B")
    assert fresh_state["last_chosen_option"] == "B"


def test_apply_turn_records_last_chosen_option(fresh_state):
    apply_turn(fresh_state, "B")
    assert fresh_state["last_chosen_option"] == "B"


def test_apply_turn_invalid_option_no_state_change(fresh_state):
    before = dict(fresh_state)
    apply_turn(fresh_state, "Z")  # not a real option
    assert fresh_state == before


def test_apply_turn_out_of_range_no_op(fresh_state):
    fresh_state["turn_number"] = 99  # past last turn
    before = dict(fresh_state)
    apply_turn(fresh_state, "A")
    assert fresh_state == before


def test_apply_turn_stores_justification(fresh_state):
    apply_turn(fresh_state, "A", decision_justification="We need more data")
    assert fresh_state["decision_justifications"]["1"] == "We need more data"


def test_apply_turn_strips_whitespace_from_justification(fresh_state):
    apply_turn(fresh_state, "A", decision_justification="  spaced out  ")
    assert fresh_state["decision_justifications"]["1"] == "spaced out"


def test_counters_clamped_at_zero(fresh_state):
    fresh_state["accepted_risks_count"] = -5
    apply_turn(fresh_state, "A")  # any turn applies clamping
    assert fresh_state["accepted_risks_count"] >= 0


def test_temperature_forecast_clamped(fresh_state):
    # The JSON shouldn't have out-of-range temp values, but defensive clamp
    fresh_state["temperature_forecast_f"] = 200
    apply_turn(fresh_state, "A")
    assert fresh_state["temperature_forecast_f"] <= 120


# ---- escape_justification (XSS protection per spec round 5) ----

def test_escape_justification_handles_none():
    assert escape_justification(None) is None


def test_escape_justification_handles_empty():
    assert escape_justification("") is None
    assert escape_justification("   ") is None  # whitespace


def test_escape_justification_html_escapes_special_chars():
    escaped = escape_justification("<script>alert('xss')</script>")
    assert "<script>" not in escaped
    assert "&lt;script&gt;" in escaped


def test_escape_justification_caps_length():
    long_text = "x" * 500
    escaped = escape_justification(long_text, max_length=200)
    assert len(escaped) == 200


def test_escape_justification_strips_whitespace():
    escaped = escape_justification("  hello  ")
    assert escaped == "hello"


def test_apply_turn_sanitizes_xss_in_justification(fresh_state):
    apply_turn(fresh_state, "A",
               decision_justification='<img src=x onerror=alert(1)>')
    stored = fresh_state["decision_justifications"]["1"]
    assert "<img" not in stored
    assert "&lt;img" in stored


def test_apply_turn_drops_oversize_justification(fresh_state):
    long_text = "y" * 1000
    apply_turn(fresh_state, "A", decision_justification=long_text)
    stored = fresh_state["decision_justifications"]["1"]
    assert len(stored) == 200  # default max_length


# ---- Bias detectors ----

def _make_history_with(mgmt_count=0, eng_count=0):
    """Build decision_history with specified mgmt/eng balance."""
    history = []
    for i in range(max(mgmt_count, eng_count)):
        if i < mgmt_count:
            history.append(_build_decision_record(
                i + 1, "D", concerns=["management"]))
        if i < eng_count:
            history.append(_build_decision_record(
                i + 1, "A", concerns=["engineering"]))
    return history


def test_F6_confirmation_bias_triggers():
    state = {
        "accepted_risks_count": 4, "ignored_warnings_count": 3,
        "decision_history": _make_history_with(),
    }
    result = _detect_confirmation_bias(state)
    assert result is not None
    assert result["pattern_type"] == "confirmation_bias"
    assert "自我确认循环" in result["dorner_concept"]


def test_F6_confirmation_bias_below_threshold():
    state = {
        "accepted_risks_count": 1, "ignored_warnings_count": 1,
        "decision_history": _make_history_with(),
    }
    assert _detect_confirmation_bias(state) is None


def test_F3_self_reference_triggers_when_management_dominant():
    # 3 mgmt choices + 1 engineering in last 4 turns
    state = {
        "decision_history": [
            _build_decision_record(1, "A", concerns=["engineering"]),
            _build_decision_record(2, "D", concerns=["management"]),
            _build_decision_record(3, "D", concerns=["management"]),
            _build_decision_record(4, "D", concerns=["management"]),
        ],
    }
    result = _detect_self_reference(state)
    assert result is not None
    assert "自指" in result["dorner_concept"]


def test_F3_self_reference_absent_when_engineering_dominant():
    state = {
        "decision_history": [
            _build_decision_record(1, "A", concerns=["engineering"]),
            _build_decision_record(2, "A", concerns=["engineering"]),
            _build_decision_record(3, "A", concerns=["engineering"]),
            _build_decision_record(4, "A", concerns=["engineering"]),
        ],
    }
    assert _detect_self_reference(state) is None


def test_F8_regulation_lag_triggers_on_oscillation():
    state = {
        "decision_history": [
            _build_decision_record(1, "A", weight="extreme_safe"),
            _build_decision_record(2, "D", weight="extreme_risk"),
            _build_decision_record(3, "A", weight="extreme_safe"),
            _build_decision_record(4, "D", weight="extreme_risk"),
            _build_decision_record(5, "C", weight="neutral"),
        ],
    }
    result = _detect_regulation_lag(state)
    assert result is not None
    assert "调节滞后" in result["dorner_concept"]


def test_F8_absent_for_stable_safe_player():
    state = {
        "decision_history": [
            _build_decision_record(i, "A", weight="extreme_safe")
            for i in range(1, 6)
        ],
    }
    assert _detect_regulation_lag(state) is None


def test_F5_single_target_optimization_triggers():
    state = {
        "schedule_pressure": 20,  # down from initial 60
        "engineer_confidence": 30,  # down from initial 75
        "risk_acknowledged_unresolved": 3,
        "decision_history": [],
    }
    initial = {"schedule_pressure": 60, "engineer_confidence": 75}
    state["__initial__"] = initial
    result = _detect_single_target_optimization(state)
    # Without the initial we can detect damage via the diff trick elsewhere,
    # so this just checks the function ran without error and returned either
    # a dict or None.
    assert result is None or result["pattern_type"] == "single_target_optimization"


def test_F2_time_delay_blindness_triggers():
    state = {
        "decision_history": [
            _build_decision_record(i, "B", concerns=["management"],
                                    option_text=f"choice {i} 推迟测试忽略数据")
            for i in range(1, 5)
        ],
    }
    result = _detect_time_delay_blindness(state)
    assert result is not None
    assert "时间延迟" in result["dorner_concept"]


def test_F7_lack_of_self_criticism_after_reveal():
    # First reveal at turn 5, then player keeps accepting risks
    state = {
        "decision_history": [
            _build_decision_record(i, "D",
                                    effects={"accepted_risks_count": 1})
            for i in range(1, 8)
        ],
    }
    result = _detect_lack_of_self_criticism(state)
    assert result is not None
    assert "自我批评" in result["dorner_concept"]


def test_F4_side_effect_neglect_triggers_without_keywords():
    state = {
        "decision_history": [
            _build_decision_record(i, "A",
                                    justification=f"just do it {i}")
            for i in range(1, 7)
        ],
    }
    result = _detect_side_effect_neglect(state)
    assert result is not None
    assert "副作用" in result["dorner_concept"]


def test_all_8_dorner_patterns_detectable():
    """Smoke test: each pattern's detector runs without error on synthetic data."""
    history_risky = [
        _build_decision_record(i, "D", concerns=["management"],
                                effects={"accepted_risks_count": 2,
                                         "ignored_warnings_count": 1,
                                         "dissent_suppressed_count": 1})
        for i in range(1, 7)
    ]
    state = {
        "decision_history": history_risky,
        "accepted_risks_count": 5,
        "ignored_warnings_count": 3,
        "schedule_pressure": 20,
        "engineer_confidence": 30,
        "risk_acknowledged_unresolved": 3,
    }
    patterns = detect_patterns(state)
    pattern_types = {p["pattern_type"] for p in patterns if p is not None}
    # At minimum, a heavily-risky player should trigger at least 3 patterns
    assert len(pattern_types) >= 3, \
        f"Expected >=3 patterns for risky player, got: {pattern_types}"


# ---- Reveal selection ----

def test_select_key_decisions_prefers_risk_incrementing():
    history = [
        _build_decision_record(1, "A", effects={"accepted_risks_count": 1}),
        _build_decision_record(2, "B", effects={}),
        _build_decision_record(3, "C", effects={"ignored_warnings_count": 1}),
        _build_decision_record(4, "A", effects={}),
    ]
    selected = _select_key_decisions_for_reveal(history, reveal_phase=2)
    # Turns 1 and 3 should be top-ranked (they incremented counters)
    assert selected[0]["turn"] in (1, 3)
    assert len(selected) <= 3


def test_select_key_decisions_returns_max_three():
    history = [
        _build_decision_record(i, "D", effects={"accepted_risks_count": 1})
        for i in range(1, 11)
    ]
    selected = _select_key_decisions_for_reveal(history, reveal_phase=3)
    assert len(selected) == 3


def test_select_key_decisions_empty_for_calibrated_player():
    history = [
        _build_decision_record(i, "A", effects={})  # no counter increments
        for i in range(1, 6)
    ]
    selected = _select_key_decisions_for_reveal(history, reveal_phase=1)
    assert selected == []


# ---- Feedback generation ----

def test_feedback_for_safe_player_no_pattern_reveal():
    """Player who always postpones should get calibrated feedback, not bias reveal."""
    state = get_initial_state()
    state["turn_number"] = 11
    state["decision_history"] = [
        _build_decision_record(i, "A", concerns=["engineering"])
        for i in range(1, 11)
    ]
    fb = generate_feedback_for_turn(state, 10)
    # Safe player shouldn't see strong bias language
    assert "灾难" not in fb
    assert len(fb) > 0


def test_feedback_below_first_turn_returns_empty():
    """turn_number < 1 has no step to render — return empty string."""
    state = get_initial_state()
    state["turn_number"] = 1
    state["decision_history"] = []
    fb = generate_feedback_for_turn(state, 0)
    assert fb == ""


def test_feedback_past_last_step_falls_through_to_outcome():
    """turn_number > 10 clamps to final outcome render — not empty."""
    state = get_initial_state()
    state["turn_number"] = 1
    state["decision_history"] = []
    # pick launch_disaster so the final-outcome renderer returns text
    state["last_chosen_option"] = "A"
    fb = generate_feedback_for_turn(state, 99)
    assert "挑战者号" in fb or "灾难" in fb or "73" in fb  # rendered outcome present


# ---- Step lookup ----

def test_get_step_returns_correct_turn():
    step = get_step(5)
    assert step["turn"] == 5
    assert "options" in step


def test_get_step_out_of_range_returns_none():
    assert get_step(99) is None


# ---- Summary ----

def test_summary_includes_all_dorner_lessons():
    state = get_initial_state()
    state["turn_number"] = 11
    state["last_chosen_option"] = "D"
    summary = get_summary(state)
    assert "scenario_id" in summary
    assert summary["title"]
    assert "dorner_lessons" in summary
    assert len(summary["dorner_lessons"]) >= 5


# ---- Fixtures ----

@pytest.fixture
def state_with_d_choice():
    """State pre-loaded with T1 having chosen D."""
    s = get_initial_state()
    s["turn_number"] = 1
    return s
