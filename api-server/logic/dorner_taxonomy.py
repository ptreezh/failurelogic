"""Dörner 8-mode canonical taxonomy.

Maps every detector pattern_type string emitted by the 3 deep-scenario engines
(Challenger, Climate-Change, Enron) to a canonical F-number (1..8).

Used by:
- pytest files under tests/<scenario>/test_engine.py to assert detector coverage
- backend logic that aggregates cross-scenario bias reports (future)

NOTE: Challenger currently has NO F1_nonlinear detector (F1 appears only as
narrative in challenger_launch.json). Tests should treat this as a known gap.
"""

from typing import Dict, Set


PATTERN_TO_FNUMBER: Dict[str, int] = {
    # Challenger descriptive names (api-server/logic/challenger_scenario.py:229-236)
    "time_delay_blindness": 2,
    "self_reference": 3,
    "side_effect_neglect": 4,
    "single_target_optimization": 5,
    "confirmation_bias": 6,
    "lack_of_self_criticism": 7,
    "regulation_lag": 8,
    # F-numbered names (climate_scenario.py / enron_scenario.py)
    "F1_nonlinear": 1,
    "F2_time_delay": 2,
    "F3_self_reference": 3,
    "F4_side_effects": 4,
    "F5_single_target": 5,
    "F6_confirmation": 6,
    "F7_self_criticism": 7,
    "F8_regulation_lag": 8,
}


FNUMBER_TO_MODE: Dict[int, str] = {
    1: "非线性 / 复杂性低估",
    2: "时间延迟",
    3: "自指 / 系统反应",
    4: "副作用",
    5: "单目标优化",
    6: "确认偏差",
    7: "缺乏自批评",
    8: "监管 / 反馈延迟",
}


ALL_FNUMBERS: Set[int] = set(range(1, 9))


SCENARIO_OUTCOMES: Dict[str, Set[str]] = {
    "challenger_launch": {
        "launch_disaster",
        "launch_dodged",
        "last_minute_evaluation",
        "infinite_delay",
    },
    "climate_change": {
        "one_point_five",
        "two_degrees",
        "three_degrees",
        "coordination_collapse",
    },
    "enron_collapse": {
        "orderly_resolution",
        "partial_collapse",
        "total_collapse",
    },
}


def normalize_pattern(pattern_type: str) -> int:
    """Return canonical F-number for a pattern_type string, or -1 if unknown."""
    return PATTERN_TO_FNUMBER.get(pattern_type, -1)


def patterns_to_fnumbers(patterns: list) -> Set[int]:
    """Convert a list of detector dicts (from detect_patterns) into a set of F-numbers."""
    out: Set[int] = set()
    for p in patterns:
        fn = normalize_pattern(p.get("pattern_type", "") if isinstance(p, dict) else str(p))
        if fn > 0:
            out.add(fn)
    return out
