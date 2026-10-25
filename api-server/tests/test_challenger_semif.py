"""Automated Challenger scenario runner using SemIf local decision model.

Runs the full 10-turn Challenger scenario with SemIf scoring each turn's
options and choosing the highest-probability action. Records full state
history and reports whether the disaster outcome was avoided.

Usage:
    python tests/test_challenger_semif.py
"""

from __future__ import annotations

import json
import os
import sys
import time
from typing import Any, Dict, List, Optional

# Ensure api-server package is importable
_APISERVER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _APISERVER_DIR not in sys.path:
    sys.path.insert(0, _APISERVER_DIR)

from logic.challenger_scenario import (
    get_initial_state,
    get_step,
    apply_turn,
    detect_patterns,
    generate_feedback_for_turn,
)
from logic.semif_client import score_decision as semif_score_decision


def _state_summary(state: Dict[str, Any], turn: int) -> str:
    """Build a concise state description for the model."""
    lines = [f"Turn {turn}/10. Current situation:"]
    for key in [
        "days_to_launch",
        "temperature_forecast_f",
        "o_ring_risk_data",
        "engineer_confidence",
        "schedule_pressure",
        "budget_used_pct",
        "public_attention",
        "team_morale",
        "ignored_warnings_count",
        "accepted_risks_count",
        "risk_acknowledged_unresolved",
        "dissent_suppressed_count",
    ]:
        if key in state:
            lines.append(f"  {key}: {state[key]}")
    if state.get("decision_history"):
        lines.append("Recent decisions:")
        for d in state["decision_history"][-3:]:
            lines.append(f"  Turn {d.get('turn')}: {d.get('option_text', d.get('decisions', {}).get('option_text', '?'))}")
    return "\n".join(lines)


def run_challenger_with_semif(
    model_override: Optional[str] = None,
    verbose: bool = True,
) -> Dict[str, Any]:
    """Run the full 10-turn Challenger scenario using SemIf to choose each turn."""
    print("=" * 70)
    print("CHALLENGER SCENARIO — SemIf Auto-Play")
    print("=" * 70)

    state = get_initial_state()
    state["turn_number"] = 1
    state["decision_history"] = []
    state["_last_option_context"] = None

    turn_log: List[Dict[str, Any]] = []
    semif_scores_log: List[Dict[str, Any]] = []

    for turn in range(1, 11):
        step = get_step(turn)
        if step is None:
            print(f"[WARN] No step for turn {turn}, stopping.")
            break

        print(f"\n--- Turn {turn}: {step['phase']} ---")
        print(f"Situation (truncated): {step['situation'][:300]}...")

        options = step["options"]
        option_descs = [opt["text"] for opt in options]

        state_desc = _state_summary(state, turn)
        question = (
            f"You are the decision-maker for the Challenger launch scenario (turn {turn}/10).\n"
            "Choose the option that best balances engineering safety, schedule pressure, "
            "and long-term system outcomes. Respond with the single best choice."
        )

        semif_input = {
            "id": f"challenger-t{turn}",
            "state": state_desc,
            "question": question,
            "options": [
                {"id": opt["id"], "description": opt["text"]} for opt in options
            ],
        }

        try:
            semif_result = semif_score_decision(
                decision_id=f"challenger-t{turn}",
                state=state_desc,
                question=question,
                options=[{"id": opt["id"], "description": opt["text"]} for opt in options],
            )
            semif_scores_log.append(semif_result)

            probs = semif_result["probabilities"]
            winner_idx = probs.index(max(probs))
            chosen = options[winner_idx]
            chosen_id = chosen["id"]

            print(f"  SemIf winner: {chosen_id} ({probs[winner_idx]*100:.1f}%)")
            for i, opt in enumerate(options):
                marker = " <<<" if opt["id"] == chosen_id else ""
                print(f"    {opt['id']}: {probs[i]*100:6.2f}% — {opt['text'][:80]}{marker}")

        except Exception as e:
            print(f"  [ERROR] SemIf scoring failed: {e}. Falling back to first safe option.")
            for opt in options:
                if opt.get("weight") in ("extreme_safe", "safe"):
                    chosen = opt
                    chosen_id = opt["id"]
                    break
            else:
                chosen = options[0]
                chosen_id = options[0]["id"]
            print(f"  Fallback choice: {chosen_id}")

        # Stash option context for feedback / bias detection
        state["_last_option_context"] = {
            "option_id": chosen_id,
            "option_text": chosen["text"],
            "option_weight": chosen.get("weight", ""),
            "expected_concerns_addressed": chosen.get("expected_concerns_addressed", []),
            "turn": turn,
        }

        # Apply turn effects
        state = apply_turn(state, chosen_id, decision_justification=None)
        state["turn_number"] = turn + 1

        # Persist decision record
        record = {
            "turn": turn,
            "option_id": chosen_id,
            "option_text": chosen["text"],
            "option_weight": chosen.get("weight", ""),
            "expected_concerns_addressed": chosen.get("expected_concerns_addressed", []),
            "probabilities": (
                [round(p, 6) for p in semif_result.get("probabilities", [])]
                if semif_result else []
            ),
            "winner_probability": (
                round(semif_result.get("winner_probability", 0), 6)
                if semif_result else None
            ),
            "applied_effects": dict(
                (k, state.get(k)) for k in [
                    "engineer_confidence",
                    "schedule_pressure",
                    "budget_used_pct",
                    "public_attention",
                    "team_morale",
                    "temperature_forecast_f",
                    "ignored_warnings_count",
                    "accepted_risks_count",
                    "risk_acknowledged_unresolved",
                    "dissent_suppressed_count",
                ] if k in state
            ),
        }
        state["decision_history"].append(record)
        turn_log.append(record)

        # Print feedback
        feedback = generate_feedback_for_turn(state, turn + 1)
        if feedback:
            print(f"  Feedback: {feedback[:200]}...")

        time.sleep(0.5)

    # Determine final outcome
    last_chosen = state.get("last_chosen_option", "A")
    final_step = get_step(10)
    outcome = "unknown"
    for opt in final_step.get("options", []):
        if opt.get("id") == last_chosen:
            outcome = opt.get("trigger_outcome", "unknown")
            break

    patterns = detect_patterns(state)

    print("\n" + "=" * 70)
    print("FINAL OUTCOME")
    print("=" * 70)
    print(f"  Last choice (turn 10): {last_chosen}")
    print(f"  Outcome: {outcome}")

    if outcome == "launch_disaster":
        print("  ❌  DISASTER — 7 astronauts lost")
    elif outcome == "launch_dodged":
        print("  ✅  DODGED — launch successfully avoided")
    elif outcome == "last_minute_evaluation":
        print("  ⚠️  PAUSED — last-minute evaluation triggered")
    elif outcome == "infinite_delay":
        print("  ⏸  INFINITE DELAY — mission indefinitely postponed")

    print(f"\n  Detected Dörner patterns: {[p['pattern_type'] for p in patterns]}")
    print(f"  Final state keys: {list(state.keys())}")

    return {
        "outcome": outcome,
        "avoided_disaster": outcome != "launch_disaster",
        "last_chosen": last_chosen,
        "turn_log": turn_log,
        "semif_scores": semif_scores_log,
        "final_state": {k: state.get(k) for k in state if not k.startswith("_")},
        "detected_patterns": [
            {"pattern_type": p["pattern_type"], "dorner_concept": p["dorner_concept"]}
            for p in patterns
        ],
    }


if __name__ == "__main__":
    result = run_challenger_with_semif()
    out_path = os.path.join(_APISERVER_DIR, "tests", "challenger_semif_result.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\nResult saved to: {out_path}")
