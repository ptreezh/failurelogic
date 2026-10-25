"""Information masking layer for Dörner scenario experiments.

Each scenario turn has an info_mask that defines:
- inject: facts the decision-maker actually knew at that time
- suppress: facts that are only known with hindsight
- uncertain: facts that were known but disputed/unclear

The mask ensures the model only sees what a human decision-maker
would have known at that historical moment.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional


class InfoMask:
    """Applies information masking to scenario steps."""

    def __init__(self, mask_dir: Optional[str] = None):
        if mask_dir is None:
            mask_dir = os.path.join(
                os.path.dirname(__file__),
                "info_masks",
            )
        self.mask_dir = mask_dir
        self._cache: Dict[str, List[Dict]] = {}

    def _load_masks(self, scenario_id: str) -> List[Dict[str, Any]]:
        if scenario_id not in self._cache:
            path = os.path.join(self.mask_dir, f"{scenario_id}.json")
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    self._cache[scenario_id] = json.load(f)
            else:
                self._cache[scenario_id] = []
        return self._cache[scenario_id]

    def apply(
        self,
        step: Dict[str, Any],
        turn: int,
        scenario_id: str,
    ) -> Dict[str, Any]:
        """Apply info mask to a step.

        Returns a modified step with suppressed facts removed and
        uncertain facts flagged.
        """
        masks = self._load_masks(scenario_id)
        mask = next((m for m in masks if m.get("turn") == turn), None)

        if mask is None:
            return step

        masked_step = dict(step)
        situation = masked_step.get("situation", "")

        # Remove suppressed facts
        for suppressed in mask.get("suppress", []):
            placeholder = mask.get("suppress_placeholder", "[REDACTED]")
            # Try exact match first, then partial
            if suppressed in situation:
                situation = situation.replace(suppressed, placeholder)
            else:
                # Try to find and replace partial matches
                for sent in suppressed.split("."):
                    sent = sent.strip()
                    if sent and sent in situation:
                        situation = situation.replace(sent, placeholder)

        # Flag uncertain facts
        for uncertain in mask.get("uncertain", []):
            marker = mask.get("uncertain_marker", "[UNCERTAIN]")
            if uncertain in situation:
                situation = situation.replace(uncertain, f"{marker}({uncertain})")

        masked_step["situation"] = situation
        masked_step["_info_mask_applied"] = True
        masked_step["_suppressed_count"] = len(mask.get("suppress", []))
        masked_step["_uncertain_count"] = len(mask.get("uncertain", []))

        return masked_step

    def get_mask_report(self, scenario_id: str, turn: int) -> Dict[str, Any]:
        """Return mask details for audit."""
        masks = self._load_masks(scenario_id)
        mask = next((m for m in masks if m.get("turn") == turn), None)
        if mask is None:
            return {"turn": turn, "masked": False}
        return {
            "turn": turn,
            "masked": True,
            "injected": len(mask.get("inject", [])),
            "suppressed": len(mask.get("suppress", [])),
            "uncertain": len(mask.get("uncertain", [])),
            "suppressed_examples": mask.get("suppress", [])[:3],
        }
