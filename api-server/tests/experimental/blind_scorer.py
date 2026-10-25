"""Blind scoring engine for Dörner scenario experiments.

Eliminates cheating clues:
1. Option label randomization (A/B/C/D → shuffled)
2. weight field removed from model input
3. Text neutralization (optional, via neutralizer module)
4. Fixed random seed for reproducibility
"""

from __future__ import annotations

import json
import os
import random
from typing import Any, Dict, List, Optional, Tuple


def blind_options(
    step_options: List[Dict[str, Any]],
    seed: int = 42,
) -> Tuple[List[Dict[str, Any]], Dict[str, str], Dict[str, str]]:
    """Shuffle options and return mapping.

    Args:
        step_options: Original options from scenario JSON
        seed: Random seed for reproducibility

    Returns:
        (blind_options, blind_to_orig, orig_to_blind)
    """
    rng = random.Random(seed)
    orig_ids = [opt["id"] for opt in step_options]
    shuffled = orig_ids.copy()
    rng.shuffle(shuffled)

    blind_to_orig = {blind: orig for blind, orig in zip(shuffled, orig_ids)}
    orig_to_blind = {orig: blind for blind, orig in zip(shuffled, orig_ids)}

    blind_opts = []
    for blind_id in shuffled:
        orig_opt = next(o for o in step_options if o["id"] == blind_to_orig[blind_id])
        blind_opt = {
            **orig_opt,
            "id": blind_id,
            "text": orig_opt.get("text", orig_opt.get("description", "")),
        }
        blind_opts.append(blind_opt)

    return blind_opts, blind_to_orig, orig_to_blind


def map_winner_back(blind_winner_id: str, orig_to_blind: Dict[str, str]) -> str:
    """Convert blind winner ID back to original option ID."""
    reverse = {v: k for k, v in orig_to_blind.items()}
    return reverse.get(blind_winner_id, blind_winner_id)


def strip_weights(step_options: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove weight fields from options to prevent clue leakage."""
    return [
        {k: v for k, v in opt.items() if k != "weight"}
        for opt in step_options
    ]


def prepare_blind_step(
    step: Dict[str, Any],
    seed: int = 42,
    neutralizer: Optional[Any] = None,
) -> Tuple[Dict[str, Any], Dict[str, str], Dict[str, str]]:
    """Prepare a step for blind scoring.

    Args:
        step: Scenario step dict
        seed: Random seed
        neutralizer: Optional text neutralizer

    Returns:
        (blind_step, blind_to_orig, orig_to_blind)
    """
    options = step.get("options", []).copy()
    options = strip_weights(options)
    if neutralizer is not None:
        options = [neutralizer.neutralize(opt) for opt in options]
    blind_opts, blind_to_orig, orig_to_blind = blind_options(options, seed=seed)
    blind_step = {**step, "options": blind_opts}
    return blind_step, blind_to_orig, orig_to_blind


class BlindScorer:
    """Manages blind scoring across multiple turns with consistent seed."""

    def __init__(self, base_seed: int = 42, neutralizer: Optional[Any] = None):
        self.base_seed = base_seed
        self.neutralizer = neutralizer
        self.mappings: Dict[int, Dict[str, str]] = {}  # turn -> orig_to_blind

    def prepare_turn(self, step: Dict[str, Any], turn: int) -> Tuple[Dict[str, Any], str]:
        """Prepare a step for blind scoring, return mapping key."""
        seed = self.base_seed + turn
        blind_step, blind_to_orig, orig_to_blind = prepare_blind_step(
            step, seed=seed, neutralizer=self.neutralizer
        )
        self.mappings[turn] = orig_to_blind
        return blind_step, blind_to_orig

    def map_winner(self, blind_winner_id: str, turn: int) -> str:
        """Map blind winner back to original option ID."""
        orig_to_blind = self.mappings.get(turn, {})
        return map_winner_back(blind_winner_id, orig_to_blind)

    def get_mapping_report(self) -> Dict[int, Dict[str, str]]:
        """Return all turn mappings for audit."""
        return dict(self.mappings)
