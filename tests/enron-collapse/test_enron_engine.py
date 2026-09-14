"""Enron-Collapse deep scenario — full coverage pytest.

Mirrors tests/climate-change/test_engine.py with Enron-specific state keys,
detector triggers, and outcome routing.

Run:
    cd D:/AIDevelop/failureLogic
    pytest tests/enron-collapse/test_engine.py -v
"""

import sys
from typing import Any, Dict, List, Set

import pytest

sys.path.insert(0, "api-server")

from logic.dorner_taxonomy import (  # noqa: E402
    ALL_FNUMBERS,
    PATTERN_TO_FNUMBER,
    patterns_to_fnumbers,
)
from logic.enron_scenario import (  # noqa: E402
    apply_turn,
    detect_patterns,
    escape_justification,
    get_initial_state,
    get_outcome_key,
    get_step,
    get_summary,
)


# ============================================================================
# Fixtures & helpers
# ============================================================================


@pytest.fixture
def fresh_state() -> Dict[str, Any]:
    s = get_initial_state()
    s["turn_number"] = 1
    return s


def play_through(state: Dict[str, Any], choices: List[str]) -> None:
    for c in choices:
        apply_turn(state, c)
        state["turn_number"] += 1


def fired_fnumbers(state: Dict[str, Any]) -> Set[int]:
    return patterns_to_fnumbers(detect_patterns(state))


# Empirical sequences (validated by probing — see commit message for derivation)
# All-A: extreme_risk dominant, hits F1/F2/F5/F6/F8 (silenced=0 so no F3/F4/F7)
SEQ_F1_NONLINEAR = ["A"] * 10
SEQ_F2_TIME_DELAY = ["B"] * 10  # neutral weight chain
SEQ_F3_SELF_REFERENCE = ["C"] * 10  # silenced=4, board drop > 10
SEQ_F4_SIDE_EFFECTS = ["C"] * 10  # off_balance_sheet >= 8000 + silenced >= 3
SEQ_F5_SINGLE_TARGET = ["A"] * 10  # risky+extreme_risk >= 3, cf<0
SEQ_F6_CONFIRMATION = ["A"] * 10
SEQ_F7_SELF_CRITICISM = ["C"] * 10  # silenced>=1 + post-T5 silence
SEQ_F8_REGULATION_LAG = ["A"] * 10  # early_score=-8, share drops

# Outcomes
SEQ_OUTCOME_ORDERLY_RESOLUTION = ["D"] * 10  # honest_count >= 5
SEQ_OUTCOME_TOTAL_COLLAPSE = ["A", "B", "C", "A", "B", "C", "A", "B", "C", "D"]  # extreme_risk_count >= 4
SEQ_OUTCOME_PARTIAL_COLLAPSE = ["C"] * 10  # default fallback


# ============================================================================
# Engine surface — sanity
# ============================================================================


def test_get_initial_state_returns_canonical_keys() -> None:
    s = get_initial_state()
    expected = {
        "share_price_usd",
        "reported_earnings_usd_m",
        "actual_cashflow_usd_m",
        "off_balance_sheet_exposure_usd_m",
        "credit_rating",
        "analyst_confidence_index",
        "board_oversight_strength",
        "media_skepticism_index",
        "whistleblower_silenced_count",
    }
    assert expected <= set(s.keys()), f"missing keys: {expected - set(s.keys())}"


def test_get_step_returns_four_options_per_turn() -> None:
    for t in range(1, 11):
        step = get_step(t)
        assert step is not None, f"step T{t} returned None"
        assert len(step["options"]) == 4, f"T{t} has {len(step['options'])} options"


def test_escape_justification_handles_html_and_length() -> None:
    assert escape_justification(None) is None
    assert escape_justification("") is None
    assert escape_justification("<b>x</b>") == "&lt;b&gt;x&lt;/b&gt;"
    out = escape_justification("x" * 500, max_length=100)
    assert out is not None and len(out) == 100


# ============================================================================
# Detector coverage — all 8 F-numbers must be reachable
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
        f"F{target_f} not fired. choices={seq} | final_state.share={fresh_state.get('share_price_usd')} "
        f"silenced={fresh_state.get('whistleblower_silenced_count')} obs={fresh_state.get('off_balance_sheet_exposure_usd_m')} "
        f"| fired={sorted(fired)}"
    )


# ============================================================================
# Outcome coverage
# ============================================================================


@pytest.mark.parametrize(
    "seq,expected",
    [
        pytest.param(SEQ_OUTCOME_ORDERLY_RESOLUTION, "orderly_resolution", id="orderly_resolution"),
        pytest.param(SEQ_OUTCOME_TOTAL_COLLAPSE, "total_collapse", id="total_collapse"),
        pytest.param(SEQ_OUTCOME_PARTIAL_COLLAPSE, "partial_collapse", id="partial_collapse"),
    ],
)
def test_outcome_reachable(seq: List[str], expected: str, fresh_state: Dict[str, Any]) -> None:
    play_through(fresh_state, seq)
    assert get_outcome_key(fresh_state) == expected, (
        f"expected={expected} got={get_outcome_key(fresh_state)} "
        f"| share={fresh_state.get('share_price_usd')}"
    )


# ============================================================================
# Summary integrity
# ============================================================================


def test_summary_has_required_keys(fresh_state: Dict[str, Any]) -> None:
    play_through(fresh_state, ["A"] * 10)
    summary = get_summary(fresh_state)
    assert {"scenario_id", "outcome_key", "patterns_detected", "final_state"} <= summary.keys()
    assert summary["outcome_key"] in {"orderly_resolution", "partial_collapse", "total_collapse"}
    assert isinstance(summary["patterns_detected"], list)


def test_summary_patterns_use_F_numbers(fresh_state: Dict[str, Any]) -> None:
    play_through(fresh_state, SEQ_F1_NONLINEAR)
    summary = get_summary(fresh_state)
    assert len(summary["patterns_detected"]) > 0
    for p in summary["patterns_detected"]:
        assert isinstance(p, str)
        assert p in PATTERN_TO_FNUMBER, f"unknown pattern_type={p}"


# ============================================================================
# All-8-F smoke — Enron is the only scenario where all 8 fire
# ============================================================================


def test_all_eight_F_numbers_reachable() -> None:
    """Enron is the only scenario where all 8 F-modes fire (unlike climate where
    F1/F5 are unreachable). This test is a regression on dorner_taxonomy."""
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
    assert not missing, f"Enron should cover all 8 F-modes; missing {sorted(missing)}; fired={sorted(seen)}"
