"""Climate-Change deep scenario — full coverage pytest.

Drives the Python engine directly (no HTTP). Verifies:
  - All 8 Dörner F-mode detectors are reachable (F1/F5 currently unreachable —
    see KNOWN_GAPS)
  - All 4 outcome endings are reachable
  - get_summary() returns the canonical keys
  - get_initial_state() / get_step() return the canonical shapes

Pattern B: flat module-level functions, sys.path inserted explicitly so the
test file works from any cwd. Mirrors tests/challenger/test_engine.py.

Run:
    cd D:/AIDevelop/failureLogic
    pytest tests/climate-change/test_engine.py -v
"""

import sys
from typing import Any, Dict, List, Set

import pytest

sys.path.insert(0, "api-server")

from logic.climate_scenario import (  # noqa: E402
    apply_turn,
    detect_patterns,
    escape_justification,
    get_initial_state,
    get_outcome_key,
    get_step,
    get_summary,
)
from logic.dorner_taxonomy import (  # noqa: E402
    ALL_FNUMBERS,
    PATTERN_TO_FNUMBER,
    patterns_to_fnumbers,
)


# ============================================================================
# Fixtures & helpers
# ============================================================================


@pytest.fixture
def fresh_state() -> Dict[str, Any]:
    """Brand-new climate scenario state, turn_number=1."""
    s = get_initial_state()
    s["turn_number"] = 1
    return s


def play_through(state: Dict[str, Any], choices: List[str]) -> None:
    """Drive the engine with a fixed list of option ids. Mutates state in place."""
    for c in choices:
        apply_turn(state, c)
        state["turn_number"] += 1


def fired_fnumbers(state: Dict[str, Any]) -> Set[int]:
    return patterns_to_fnumbers(detect_patterns(state))


# Empirical sequences (validated by probing — thresholds F1/F5 lowered to 40
# in api-server/logic/climate_scenario.py to match F8 — see commit log)
SEQ_F1_NONLINEAR = ["C"] * 10  # tipping=42 (T7C +15), threshold ≥ 40
SEQ_F2_TIME_DELAY = ["D"] * 10  # neutral weight chain → F2
SEQ_F3_SELF_REFERENCE = ["B", "A", "C", "D", "B", "C", "D", "B", "C", "D"]  # trust drop
SEQ_F4_SIDE_EFFECTS = ["C"] * 10  # cj drops to 20
SEQ_F5_SINGLE_TARGET = ["B", "A", "B", "A", "B", "A", "C", "B", "A", "B"]  # 6/10 GDP-focused + tipping=42
SEQ_F6_CONFIRMATION = ["A"] * 10  # streak of 10
SEQ_F7_SELF_CRITICISM = ["A"] * 10  # silenced → 3
SEQ_F8_REGULATION_LAG = ["B", "A", "C", "D", "B", "A", "C", "D", "B", "A"]  # tipping=42 + low first 3

# Outcomes
SEQ_OUTCOME_ONE_POINT_FIVE = ["A"] * 10  # radical_score >= 5
SEQ_OUTCOME_TWO_DEGREES = ["B"] * 10  # default fallback
SEQ_OUTCOME_THREE_DEGREES = ["A", "C", "C", "C", "B", "C", "A", "C", "B", "C"]  # economic_priority >= 4
SEQ_OUTCOME_COORDINATION_COLLAPSE = ["A", "A", "A", "D", "A", "A", "C", "A", "A", "D"]  # delay_or_exit >= 3


# ============================================================================
# Engine surface — sanity
# ============================================================================


def test_get_initial_state_returns_canonical_keys() -> None:
    s = get_initial_state()
    expected = {
        "co2_ppm",
        "global_avg_temp_c",
        "gdp_growth_pct",
        "international_trust",
        "public_support_pct",
        "renewable_share_pct",
        "tipping_point_proximity",
        "climate_justice_index",
        "whistleblower_silenced_count",
    }
    assert expected <= set(s.keys()), f"missing keys: {expected - set(s.keys())}"


def test_get_step_returns_four_options_per_turn() -> None:
    for t in range(1, 11):
        step = get_step(t)
        assert step is not None, f"step T{t} returned None"
        assert len(step["options"]) == 4, f"T{t} has {len(step['options'])} options, expected 4"


def test_escape_justification_handles_html_and_length() -> None:
    assert escape_justification(None) is None
    assert escape_justification("") is None
    assert escape_justification("<script>x</script>") == "&lt;script&gt;x&lt;/script&gt;"
    long_text = "a" * 500
    out = escape_justification(long_text, max_length=200)
    assert out is not None and len(out) == 200


# ============================================================================
# Detector coverage — one parametrized test per F-number
# ============================================================================


@pytest.mark.parametrize(
    "seq,target_f",
    [
        pytest.param(SEQ_F1_NONLINEAR, 1, id="F1_nonlinear"),
        pytest.param(SEQ_F2_TIME_DELAY, 2, id="F2_time_delay"),
        pytest.param(SEQ_F3_SELF_REFERENCE, 3, id="F3_self_reference"),
        pytest.param(SEQ_F4_SIDE_EFFECTS, 4, id="F4_side_effects"),
        pytest.param(SEQ_F5_SINGLE_TARGET, 5, id="F5_single_target"),
        pytest.param(SEQ_F6_CONFIRMATION, 6, id="F6_confirmation"),
        pytest.param(SEQ_F7_SELF_CRITICISM, 7, id="F7_self_criticism"),
        pytest.param(SEQ_F8_REGULATION_LAG, 8, id="F8_regulation_lag"),
    ],
)
def test_detector_reachable(seq: List[str], target_f: int, fresh_state: Dict[str, Any]) -> None:
    play_through(fresh_state, seq)
    fired = fired_fnumbers(fresh_state)
    assert target_f in fired, (
        f"F{target_f} not fired. choices={seq} | final_state.tipping={fresh_state.get('tipping_point_proximity')} "
        f"cj={fresh_state.get('climate_justice_index')} silenced={fresh_state.get('whistleblower_silenced_count')} "
        f"| fired={sorted(fired)}"
    )


# ============================================================================
# Outcome coverage
# ============================================================================


@pytest.mark.parametrize(
    "seq,expected",
    [
        pytest.param(SEQ_OUTCOME_ONE_POINT_FIVE, "one_point_five", id="one_point_five"),
        pytest.param(SEQ_OUTCOME_TWO_DEGREES, "two_degrees", id="two_degrees"),
        pytest.param(SEQ_OUTCOME_THREE_DEGREES, "three_degrees", id="three_degrees"),
        pytest.param(SEQ_OUTCOME_COORDINATION_COLLAPSE, "coordination_collapse", id="coordination_collapse"),
    ],
)
def test_outcome_reachable(seq: List[str], expected: str, fresh_state: Dict[str, Any]) -> None:
    play_through(fresh_state, seq)
    assert get_outcome_key(fresh_state) == expected, (
        f"expected outcome={expected}, got={get_outcome_key(fresh_state)} "
        f"| tipping={fresh_state.get('tipping_point_proximity')}"
    )


# ============================================================================
# Summary integrity
# ============================================================================


def test_summary_has_required_keys(fresh_state: Dict[str, Any]) -> None:
    play_through(fresh_state, ["A"] * 10)
    summary = get_summary(fresh_state)
    assert {"scenario_id", "outcome_key", "patterns_detected", "final_state"} <= summary.keys()
    assert summary["outcome_key"] in {
        "one_point_five",
        "two_degrees",
        "three_degrees",
        "coordination_collapse",
    }
    assert isinstance(summary["patterns_detected"], list)


def test_summary_patterns_use_F_numbers(fresh_state: Dict[str, Any]) -> None:
    play_through(fresh_state, SEQ_F6_CONFIRMATION)
    summary = get_summary(fresh_state)
    assert len(summary["patterns_detected"]) > 0
    # climate scenario emits patterns_detected as a list of pattern_type strings
    for p in summary["patterns_detected"]:
        assert isinstance(p, str), f"expected str, got {type(p).__name__}: {p}"
        assert p in PATTERN_TO_FNUMBER, f"unknown pattern_type={p}"


# ============================================================================
# All-8-F smoke — ensure every declared F is *at least once* visible across
# the full set of reachable detectors (regression on dorner_taxonomy).
# ============================================================================


def test_all_eight_F_numbers_reachable() -> None:
    """After lowering F1/F5 thresholds to 40 (matching F8), all 8 Dörner
    modes are reachable in climate scenario."""
    seen: Set[int] = set()
    for seq in [
        SEQ_F1_NONLINEAR,
        SEQ_F2_TIME_DELAY,
        SEQ_F3_SELF_REFERENCE,
        SEQ_F4_SIDE_EFFECTS,
        SEQ_F5_SINGLE_TARGET,
        SEQ_F6_CONFIRMATION,
        SEQ_F7_SELF_CRITICISM,
        SEQ_F8_REGULATION_LAG,
    ]:
        s = get_initial_state()
        s["turn_number"] = 1
        play_through(s, seq)
        seen |= fired_fnumbers(s)
    missing = ALL_FNUMBERS - seen
    assert not missing, f"Climate should cover all 8 F-modes; missing {sorted(missing)}; fired={sorted(seen)}"
