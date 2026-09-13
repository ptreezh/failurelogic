"""test_enron_e2e_playthrough.py — enron-collapse scenario backend E2E.

Mirrors test_climate_change_e2e_playthrough.py structure for the
enron-collapse scenario. Verifies:
  - GET /scenarios/enron-collapse/step/{N} for all 10 turns
  - POST /turn with {option, justification} works
  - State evolves across turns (off-balance-sheet exposure grows)
  - T3 pattern reveal fires
  - 3 outcome branches reachable via different option sequences
  - XSS hardening on justification (200-char cap)
"""

import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request

# Enron option weights vary per turn (unlike challenger where A is always
# the honest pick): T1-A is extreme_risk (cover-up), T10-A is extreme_safe.
# Tests pick by weight, not by letter.
sys.path.insert(0, "api-server")
from logic.enron_scenario import get_step as _enron_get_step


def _pick_by_weight(turn_number, preferred_weights):
    """Return option id at a turn whose weight is in preferred_weights.

    Scans ALL options per preference tier so e.g. extreme_risk at position D
    wins over risky at position A (first-match-by-tier, not by-letter).
    """
    step = _enron_get_step(turn_number)
    for tier in preferred_weights:
        for opt in step["options"]:
            if opt["weight"] == tier:
                return opt["id"]
    raise ValueError(f"no option with weight in {preferred_weights} at T{turn_number}")


def _honest_picks():
    """Honest path: extreme_safe preferred, then safe."""
    return [_pick_by_weight(t, ("extreme_safe", "safe")) for t in range(1, 11)]


def _coverup_picks():
    """Cover-up path: extreme_risk preferred, then risky."""
    return [_pick_by_weight(t, ("extreme_risk", "risky")) for t in range(1, 11)]


def _run_server(session_dir):
    port = str(20900 + (os.getpid() % 90))
    env = os.environ.copy()
    env["RENDER_DISK_PATH"] = session_dir
    proc = subprocess.Popen(
        [sys.executable, "-c",
         "import sys; sys.path.insert(0, 'api-server'); "
         "import start; "
         "import uvicorn; uvicorn.run(start.app, host='127.0.0.1', "
         f"port={port}, log_level='warning')"],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    deadline = time.time() + 10
    while time.time() < deadline:
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=1)
            return proc, port
        except Exception:
            time.sleep(0.2)
    proc.terminate()
    raise RuntimeError("server didn't come up")


def _stop(proc):
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except subprocess.TimeoutExpired:
        proc.kill()


def _post(port, path, payload):
    req = urllib.request.Request(
        f"http://127.0.0.1:{port}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def _get(port, path):
    with urllib.request.urlopen(f"http://127.0.0.1:{port}{path}", timeout=10) as r:
        return json.loads(r.read())


def test_step_endpoint_shape_for_all_turns():
    """Every turn 1..10 returns a step with 4 options + state fields."""
    with tempfile.TemporaryDirectory(prefix="enron-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            for n in range(1, 11):
                step = _get(port, f"/scenarios/enron-collapse/step/{n}")
                assert step["turn"] == n, f"T{n}: turn mismatch"
                assert len(step["options"]) == 4, f"T{n}: expected 4 options"
                ids = [o["id"] for o in step["options"]]
                assert ids == ["A", "B", "C", "D"], f"T{n}: bad option ids {ids}"
                weights = {o["weight"] for o in step["options"]}
                assert weights <= {"extreme_safe", "safe", "neutral", "risky", "extreme_risk"}, \
                    f"T{n}: bad weights {weights}"
        finally:
            _stop(proc)


def test_T3_reveal_fires():
    """After 3 turns, the T3 reveal feedback contains 'Dörner 模式揭示'."""
    with tempfile.TemporaryDirectory(prefix="enron-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            resp = _post(port,
                "/scenarios/create_game_session?scenario_id=enron-collapse&difficulty=beginner",
                {})
            gid = resp["game_id"]
            for opt in ["B", "B", "A"]:
                resp = _post(port, f"/scenarios/{gid}/turn",
                             {"decisions": {"option": opt,
                                            "justification": "测试"}})
            assert "Dörner 模式揭示" in resp["feedback"], \
                f"T3 reveal missing: {resp['feedback'][:200]}"
            assert "F5" in resp["feedback"] or "单目标" in resp["feedback"], \
                "T3 should mention F5 single-target (earnings obsession)"
        finally:
            _stop(proc)


def test_full_playthrough_honest_path_leads_to_orderly_resolution():
    """Honest picks (extreme_safe/safe) → outcome orderly_resolution."""
    with tempfile.TemporaryDirectory(prefix="enron-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            resp = _post(port,
                "/scenarios/create_game_session?scenario_id=enron-collapse&difficulty=beginner",
                {})
            gid = resp["game_id"]
            for opt in _honest_picks():
                resp = _post(port, f"/scenarios/{gid}/turn",
                             {"decisions": {"option": opt,
                                            "justification": "透明披露"}})
            final_fb = resp["feedback"]
            assert any(k in final_fb for k in ["有序", "整改", "主动披露", "重整"]), \
                f"Honest path should trigger orderly resolution, got: {final_fb[:300]}"
        finally:
            _stop(proc)


def test_full_playthrough_coverup_path_leads_to_total_collapse():
    """Cover-up picks (extreme_risk/risky) → outcome total_collapse."""
    with tempfile.TemporaryDirectory(prefix="enron-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            resp = _post(port,
                "/scenarios/create_game_session?scenario_id=enron-collapse&difficulty=beginner",
                {})
            gid = resp["game_id"]
            for opt in _coverup_picks():
                resp = _post(port, f"/scenarios/{gid}/turn",
                             {"decisions": {"option": opt,
                                            "justification": "掩盖"}})
            final_fb = resp["feedback"]
            assert any(k in final_fb for k in ["破产", "崩塌", "498", "49.8", "退市", "审判"]), \
                f"Cover-up path should trigger total collapse, got first 300: {final_fb[:300]}"
        finally:
            _stop(proc)


def test_mixed_path_leads_to_partial_collapse():
    """B/C mixed path (default) → partial_collapse outcome."""
    with tempfile.TemporaryDirectory(prefix="enron-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            resp = _post(port,
                "/scenarios/create_game_session?scenario_id=enron-collapse&difficulty=beginner",
                {})
            gid = resp["game_id"]
            for opt in ["B", "C", "B", "C", "B", "C", "B", "C", "B", "C"]:
                resp = _post(port, f"/scenarios/{gid}/turn",
                             {"decisions": {"option": opt,
                                            "justification": "维持现状"}})
            final_fb = resp["feedback"]
            assert any(k in final_fb for k in ["部分", "股价", "下市", "缩水", "和解", "司法"]), \
                f"Mixed path should trigger partial collapse, got: {final_fb[:300]}"
        finally:
            _stop(proc)


def test_state_evolution_coverup_grows_exposure():
    """Cover-up picks grow off-balance exposure from initial 7000."""
    with tempfile.TemporaryDirectory(prefix="enron-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            resp = _post(port,
                "/scenarios/create_game_session?scenario_id=enron-collapse&difficulty=beginner",
                {})
            gid = resp["game_id"]
            history = []
            for opt in _coverup_picks()[:3]:
                resp = _post(port, f"/scenarios/{gid}/turn",
                             {"decisions": {"option": opt,
                                            "justification": "test"}})
                history.append({
                    "turn": resp["turnNumber"],
                    "offbalance": resp["game_state"].get("off_balance_sheet_exposure_usd_m"),
                    "silenced": resp["game_state"].get("whistleblower_silenced_count"),
                })
            # Cover-up picks grow exposure above initial 7000
            assert history[-1]["offbalance"] > 7000, \
                f"Cover-up picks should grow exposure: {history}"
        finally:
            _stop(proc)


def test_justification_sanitized_200_chars():
    """Backend caps justification via escape_justification(200)."""
    with tempfile.TemporaryDirectory(prefix="enron-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            resp = _post(port,
                "/scenarios/create_game_session?scenario_id=enron-collapse&difficulty=beginner",
                {})
            gid = resp["game_id"]
            long_text = "y" * 500
            resp = _post(port, f"/scenarios/{gid}/turn",
                         {"decisions": {"option": "A", "justification": long_text}})
            justs = resp["game_state"].get("decision_justifications", {})
            assert justs, "decision_justifications missing"
            stored = next(iter(justs.values()))
            assert len(stored) <= 200, f"justification not capped: {len(stored)}"
        finally:
            _stop(proc)


def test_dorner_patterns_F4_F7_detectable():
    """F4 (side-effects) and F7 (self-criticism) fire after cover-up path."""
    from logic.enron_scenario import (
        apply_turn, detect_patterns, get_initial_state
    )
    s = get_initial_state()
    # Cover-up picks silence whistleblowers → F7; grow exposure → F4
    for n, opt in enumerate(_coverup_picks(), start=1):
        s["turn_number"] = n
        apply_turn(s, opt, f"turn {n}")
    patterns = detect_patterns(s)
    assert len(patterns) > 0, "Should detect at least one Dörner pattern"
    pattern_types = {p["pattern_type"] for p in patterns}
    assert "F7_self_criticism" in pattern_types, \
        f"F7 should fire after whistleblower suppression, got: {pattern_types}"
    assert "F4_side_effects" in pattern_types, \
        f"F4 should fire after exposure growth, got: {pattern_types}"
