"""Rigorous experimental runner for Dörner scenario evaluation.

Usage:
    python tests/experimental/run_experiment.py --scenario challenger-launch --mode blind
    python tests/experimental/run_experiment.py --scenario all --mode full --runs 10
"""

from __future__ import annotations

import argparse
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
from experimental.blind_scorer import BlindScorer
from experimental.info_mask import InfoMask

SCENARIOS = {
    "challenger-launch": {
        "module": "logic.challenger_scenario",
        "label": "挑战者号发射决策",
        "info_mask_file": "challenger-launch.json",
    },
    "climate-change-policy": {
        "module": "logic.climate_scenario",
        "label": "全球气候政策十年",
        "info_mask_file": "climate-change-policy.json",
    },
    "enron-collapse": {
        "module": "logic.enron_scenario",
        "label": "安然帝国崩塌",
        "info_mask_file": "enron-collapse.json",
    },
}


def run_experiment(
    scenario_id: str,
    mode: str = "blind",
    runs: int = 1,
    base_seed: int = 42,
    verbose: bool = True,
) -> Dict[str, Any]:
    """Run rigorous experiment on a scenario.

    Args:
        scenario_id: Scenario ID
        mode: 'blind' (masked + shuffled) or 'full' (no masking)
        runs: Number of repeated runs
        base_seed: Base random seed

    Returns:
        Experiment results dict
    """
    if scenario_id not in SCENARIOS:
        raise ValueError(f"Unknown scenario: {scenario_id}")

    info = SCENARIOS[scenario_id]
    mod = importlib.import_module(info["module"])
    label = info["label"]

    use_mask = mode == "blind"
    info_mask = InfoMask() if use_mask else None
    blind_scorer = BlindScorer(base_seed=base_seed)

    all_runs = []

    for run_idx in range(runs):
        if verbose:
            print(f"\n{'=' * 70}")
            print(f"SCENARIO: {label} [{scenario_id}] — Run {run_idx + 1}/{runs} (mode={mode})")
            print(f"{'=' * 70}")

        run_result = _run_single(
            mod=mod,
            scenario_id=scenario_id,
            info_mask=info_mask,
            blind_scorer=blind_scorer,
            run_idx=run_idx,
            base_seed=base_seed,
            verbose=verbose,
        )
        all_runs.append(run_result)

    # Aggregate results
    outcomes = [r["outcome"] for r in all_runs]
    outcome_counts: Dict[str, int] = {}
    for o in outcomes:
        outcome_counts[o] = outcome_counts.get(o, 0) + 1

    summary = {
        "scenario_id": scenario_id,
        "label": label,
        "mode": mode,
        "runs": runs,
        "base_seed": base_seed,
        "outcome_distribution": outcome_counts,
        "most_common_outcome": max(outcome_counts, key=outcome_counts.get),
        "avoided_disaster_rate": sum(1 for o in outcomes if o != "launch_disaster" and o != "total_collapse") / runs,
        "all_runs": all_runs,
        "blind_mappings": blind_scorer.get_mapping_report(),
    }

    if verbose:
        print(f"\n{'=' * 70}")
        print("EXPERIMENT SUMMARY")
        print(f"{'=' * 70}")
        print(f"  Scenario: {label}")
        print(f"  Mode: {mode}")
        print(f"  Runs: {runs}")
        print(f"  Outcome distribution: {outcome_counts}")
        print(f"  Most common outcome: {summary['most_common_outcome']}")
        print(f"  Avoided disaster rate: {summary['avoided_disaster_rate']:.1%}")

    return summary


def _run_single(
    mod: Any,
    scenario_id: str,
    info_mask: Optional[InfoMask],
    blind_scorer: BlindScorer,
    run_idx: int,
    base_seed: int,
    verbose: bool,
) -> Dict[str, Any]:
    """Run a single experiment."""
    state = mod.get_initial_state()
    state["turn_number"] = 1
    state["decision_history"] = []
    state["_last_option_context"] = None

    turn_log = []

    for turn in range(1, 11):
        step = mod.get_step(turn)
        if step is None:
            break

        # Apply info mask
        if info_mask is not None:
            step = info_mask.apply(step, turn, scenario_id)

        # Prepare blind options
        blind_step, blind_to_orig = blind_scorer.prepare_turn(step, turn)

        options = blind_step["options"]
        option_descs = [opt.get("text", opt.get("description", "")) for opt in options]

        # Build state summary (without hindsight info)
        state_desc = _build_state_summary(state, turn, scenario_id, info_mask)

        question = (
            f"You are the decision-maker for '{SCENARIOS[scenario_id]['label']}' (turn {turn}/10).\n"
            "Choose the option that best serves long-term system health, "
            "ethical responsibility, and sustainable outcomes."
        )

        semif_input_options = [
            {"id": opt["id"], "description": opt.get("text", opt.get("description", ""))}
            for opt in options
        ]

        try:
            semif_result = semif_score_decision(
                decision_id=f"{scenario_id}-r{run_idx}-t{turn}",
                state=state_desc,
                question=question,
                options=semif_input_options,
            )

            probs = semif_result["probabilities"]
            winner_idx = probs.index(max(probs))
            blind_winner = options[winner_idx]["id"]
            orig_winner = blind_scorer.map_winner(blind_winner, turn)
            chosen_opt = next(o for o in step["options"] if o["id"] == orig_winner)

            if verbose:
                print(f"\n  Turn {turn}: SemIf → {orig_winner} ({probs[winner_idx] * 100:.1f}%)")
                for i, opt in enumerate(options):
                    orig_id = blind_to_orig.get(opt["id"], opt["id"])
                    marker = " <<<" if orig_id == orig_winner else ""
                    print(f"    {orig_id}: {probs[i] * 100:6.2f}% — {opt.get('text', '')[:60]}{marker}")

        except Exception as e:
            if verbose:
                print(f"\n  Turn {turn}: SemIf FAILED ({e}), using fallback")
            safe_opts = [o for o in step["options"] if o.get("weight") in ("extreme_safe", "safe")]
            chosen_opt = safe_opts[0] if safe_opts else step["options"][0]
            orig_winner = chosen_opt["id"]

        state["_last_option_context"] = {
            "option_id": orig_winner,
            "option_text": chosen_opt.get("text", chosen_opt.get("description", "")),
            "option_weight": chosen_opt.get("weight", ""),
            "expected_concerns_addressed": chosen_opt.get("expected_concerns_addressed", []),
            "turn": turn,
        }

        state = mod.apply_turn(state, orig_winner, decision_justification=None)
        state["turn_number"] = turn + 1

        record = {
            "turn": turn,
            "option_id": orig_winner,
            "option_text": chosen_opt.get("text", chosen_opt.get("description", "")),
            "option_weight": chosen_opt.get("weight", ""),
            "applied_effects": {k: state.get(k) for k in list(state.keys()) if not k.startswith("_") and k not in ("decision_history", "turn_number")},
        }
        state["decision_history"].append(record)
        turn_log.append(record)

        time.sleep(0.2)

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

    return {
        "run": run_idx,
        "outcome": outcome,
        "last_chosen": last_chosen,
        "turn_log": turn_log,
        "detected_patterns": [p["pattern_type"] for p in patterns],
        "final_state_keys": sorted([k for k in state if not k.startswith("_")]),
    }


def _build_state_summary(
    state: Dict[str, Any],
    turn: int,
    scenario_id: str,
    info_mask: Optional[InfoMask],
) -> str:
    """Build state summary for model input."""
    lines = [f"Turn {turn}/10. Scenario: {SCENARIOS[scenario_id]['label']}"]
    lines.append("Current state:")
    for key, val in state.items():
        if key.startswith("_") or key in ("decision_history", "turn_number"):
            continue
        if isinstance(val, (list, dict)) and len(str(val)) > 100:
            continue
        lines.append(f"  {key}: {val}")
    return "\n".join(lines)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Rigorous Dörner experiment runner")
    parser.add_argument("--scenario", choices=list(SCENARIOS.keys()) + ["all"], default="challenger-launch")
    parser.add_argument("--mode", choices=["blind", "full"], default="blind")
    parser.add_argument("--runs", type=int, default=1)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    scenarios_to_run = list(SCENARIOS.keys()) if args.scenario == "all" else [args.scenario]

    all_results = {}
    for sid in scenarios_to_run:
        result = run_experiment(
            scenario_id=sid,
            mode=args.mode,
            runs=args.runs,
            base_seed=args.seed,
            verbose=True,
        )
        all_results[sid] = result

    if args.output:
        os.makedirs(os.path.dirname(args.output), exist_ok=True)
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2)
        print(f"\nResults saved to: {args.output}")
