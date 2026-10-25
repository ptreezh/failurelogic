"""Unified Dörner scenario runner using SemIf for all multi-turn scenarios.

Scenarios:
  - challenger-launch   (challenger_scenario.py)
  - climate-change-policy (climate_scenario.py)
  - enron-collapse       (enron_scenario.py)

Each scenario exposes the same interface:
  get_initial_state(), get_step(turn), apply_turn(state, option_id),
  detect_patterns(state), generate_feedback_for_turn(state, turn_number)

Outcome routing:
  - challenger: trigger_outcome on the last chosen option
  - climate/enron: get_outcome_key(state) → string key
"""

from __future__ import annotations

import importlib
import json
import os
import sys
import time
from typing import Any, Dict, List, Optional

_APISERVER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _APISERVER_DIR not in sys.path:
    sys.path.insert(0, _APISERVER_DIR)

from logic.semif_client import score_decision as semif_score_decision

SCENARIOS = {
    "challenger-launch": {
        "module": "logic.challenger_scenario",
        "label": "挑战者号发射决策",
    },
    "climate-change-policy": {
        "module": "logic.climate_scenario",
        "label": "全球气候政策十年",
    },
    "enron-collapse": {
        "module": "logic.enron_scenario",
        "label": "安然帝国崩塌",
    },
}


def _load_scenario_module(scenario_id: str):
    info = SCENARIOS[scenario_id]
    mod = importlib.import_module(info["module"])
    return mod


def _state_summary(state: Dict[str, Any], turn: int, scenario_id: str) -> str:
    lines = [f"Turn {turn}/10. Scenario: {SCENARIOS[scenario_id]['label']}"]
    if scenario_id == "challenger-launch":
        keys = [
            "days_to_launch", "temperature_forecast_f", "o_ring_risk_data",
            "engineer_confidence", "schedule_pressure", "budget_used_pct",
            "public_attention", "team_morale", "ignored_warnings_count",
            "accepted_risks_count", "risk_acknowledged_unresolved",
            "dissent_suppressed_count",
        ]
    elif scenario_id == "enron-collapse":
        keys = [
            "year", "quarter", "credit_rating", "stock_price",
            "public_trust", "regulatory_scrutiny", "employee_morale",
            "internal_whistleblower_active", "off_balance_sheet_exposure_billions",
            "analyst_confidence", "ethical_choices_count", "extreme_risk_count",
        ]
    elif scenario_id == "climate-change-policy":
        keys = [
            "year", "global_temp_anomaly_c", "co2_ppm",
            "public_support", "international_trust", "economic_growth_pct",
            "renewable_energy_pct", "extreme_weather_events",
            "policy_radical_score",
        ]
    else:
        keys = list(state.keys())

    for key in keys:
        if key in state:
            lines.append(f"  {key}: {state[key]}")
    return "\n".join(lines)


def run_scenario(
    scenario_id: str,
    verbose: bool = True,
) -> Dict[str, Any]:
    if scenario_id not in SCENARIOS:
        raise ValueError(f"Unknown scenario: {scenario_id}. Choose from: {list(SCENARIOS)}")

    mod = _load_scenario_module(scenario_id)
    label = SCENARIOS[scenario_id]["label"]

    if verbose:
        print("=" * 70)
        print(f"SCENARIO: {label} [{scenario_id}] — SemIf Auto-Play")
        print("=" * 70)

    state = mod.get_initial_state()
    state["turn_number"] = 1
    state["decision_history"] = []
    state["_last_option_context"] = None

    turn_log: List[Dict[str, Any]] = []
    semif_scores_log: List[Dict[str, Any]] = []

    for turn in range(1, 11):
        step = mod.get_step(turn)
        if step is None:
            if verbose:
                print(f"[WARN] No step for turn {turn}, stopping.")
            break

        if verbose:
            print(f"\n--- Turn {turn}: {step.get('phase', step.get('year', ''))} ---")
            print(f"Situation: {step.get('situation', '')[:250]}...")

        options = step["options"]
        state_desc = _state_summary(state, turn, scenario_id)
        question = (
            f"You are the decision-maker for '{label}' (turn {turn}/10).\n"
            "Choose the option that best serves long-term system health, "
            "ethical responsibility, and sustainable outcomes. "
            "Respond with the single best choice."
        )

        try:
            semif_result = semif_score_decision(
                decision_id=f"{scenario_id}-t{turn}",
                state=state_desc,
                question=question,
                options=[{"id": opt["id"], "description": opt.get("text", opt.get("description", ""))} for opt in options],
            )
            semif_scores_log.append(semif_result)

            probs = semif_result["probabilities"]
            winner_idx = probs.index(max(probs))
            chosen = options[winner_idx]
            chosen_id = chosen["id"]

            if verbose:
                print(f"  SemIf winner: {chosen_id} ({probs[winner_idx]*100:.1f}%)")
                for i, opt in enumerate(options):
                    marker = " <<<" if opt["id"] == chosen_id else ""
                    print(f"    {opt['id']}: {probs[i]*100:6.2f}% — {opt.get('text', opt.get('description', ''))[:80]}{marker}")

        except Exception as e:
            if verbose:
                print(f"  [ERROR] SemIf failed: {e}. Falling back to safest option.")
            for opt in options:
                if opt.get("weight") in ("extreme_safe", "safe"):
                    chosen = opt
                    chosen_id = opt["id"]
                    break
            else:
                chosen = options[0]
                chosen_id = options[0]["id"]

        state["_last_option_context"] = {
            "option_id": chosen_id,
            "option_text": chosen.get("text", chosen.get("description", "")),
            "option_weight": chosen.get("weight", ""),
            "expected_concerns_addressed": chosen.get("expected_concerns_addressed", []),
            "turn": turn,
        }

        state = mod.apply_turn(state, chosen_id, decision_justification=None)
        state["turn_number"] = turn + 1

        record = {
            "turn": turn,
            "option_id": chosen_id,
            "option_text": chosen.get("text", chosen.get("description", "")),
            "option_weight": chosen.get("weight", ""),
            "probabilities": (
                [round(p, 6) for p in semif_result.get("probabilities", [])]
                if semif_result else []
            ),
            "winner_probability": (
                round(semif_result.get("winner_probability", 0), 6)
                if semif_result else None
            ),
        }
        state["decision_history"].append(record)
        turn_log.append(record)

        feedback = mod.generate_feedback_for_turn(state, turn + 1)
        if feedback and verbose:
            print(f"  Feedback: {feedback[:200]}...")

        time.sleep(0.3)

    # Determine outcome
    last_chosen = state.get("last_chosen_option", "A")
    if scenario_id == "challenger-launch":
        final_step = mod.get_step(10)
        outcome = "unknown"
        for opt in final_step.get("options", []):
            if opt.get("id") == last_chosen:
                outcome = opt.get("trigger_outcome", "unknown")
                break
    else:
        outcome = mod.get_outcome_key(state)

    patterns = mod.detect_patterns(state)

    if verbose:
        print("\n" + "=" * 70)
        print("FINAL OUTCOME")
        print("=" * 70)
        print(f"  Scenario: {label}")
        print(f"  Last choice (turn 10): {last_chosen}")
        print(f"  Outcome key: {outcome}")
        print(f"  Detected Dörner patterns: {[p['pattern_type'] for p in patterns]}")

    return {
        "scenario_id": scenario_id,
        "label": label,
        "outcome": outcome,
        "last_chosen": last_chosen,
        "turn_log": turn_log,
        "semif_scores": semif_scores_log,
        "detected_patterns": [
            {"pattern_type": p["pattern_type"], "dorner_concept": p["dorner_concept"]}
            for p in patterns
        ],
        "final_state_keys": list(state.keys()),
    }


if __name__ == "__main__":
    all_results: Dict[str, Any] = {}
    for sid in SCENARIOS:
        print(f"\n{'#' * 70}")
        result = run_scenario(sid, verbose=True)
        all_results[sid] = result

    out_path = os.path.join(_APISERVER_DIR, "tests", "all_scenarios_semif_results.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print(f"\n{'#' * 70}")
    print("SUMMARY")
    print(f"{'#' * 70}")
    for sid, r in all_results.items():
        print(f"  {r['label']:30s} → outcome: {r['outcome']}")

    print(f"\nResults saved to: {out_path}")
