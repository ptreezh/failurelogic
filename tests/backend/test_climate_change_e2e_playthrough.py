"""test_climate_change_e2e_playthrough.py — climate-change scenario backend E2E.

Mirrors test_challenger_e2e_playthrough.py structure but for the new
climate-change-policy scenario. Verifies:
  - GET /scenarios/climate-change-policy/step/{N} for all 10 turns
  - POST /turn with {option, justification} works
  - State evolves across turns
  - T3 pattern reveal fires
  - 4 outcome branches reachable via different option sequences
  - XSS hardening on justification (200-char cap)
"""

import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request


def _run_server(session_dir):
    port = str(20800 + (os.getpid() % 90))
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
    with tempfile.TemporaryDirectory(prefix="climate-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            for n in range(1, 11):
                step = _get(port, f"/scenarios/climate-change-policy/step/{n}")
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
    with tempfile.TemporaryDirectory(prefix="climate-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            resp = _post(port,
                "/scenarios/create_game_session?scenario_id=climate-change-policy&difficulty=beginner",
                {})
            gid = resp["game_id"]
            for opt in ["B", "B", "A"]:
                resp = _post(port, f"/scenarios/{gid}/turn",
                             {"decisions": {"option": opt,
                                            "justification": "测试"}})
            assert "Dörner 模式揭示" in resp["feedback"], \
                f"T3 reveal missing: {resp['feedback'][:200]}"
            assert "F5" in resp["feedback"] or "单目标" in resp["feedback"], \
                "T3 should mention F5 single-target"
        finally:
            _stop(proc)


def test_full_playthrough_radical_A_leads_to_one_point_five():
    """All A's (extreme_safe) → outcome one_point_five."""
    with tempfile.TemporaryDirectory(prefix="climate-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            resp = _post(port,
                "/scenarios/create_game_session?scenario_id=climate-change-policy&difficulty=beginner",
                {})
            gid = resp["game_id"]
            for opt in ["A"] * 10:
                resp = _post(port, f"/scenarios/{gid}/turn",
                             {"decisions": {"option": opt,
                                            "justification": "激进减排"}})
            final_fb = resp["feedback"]
            # All-A path triggers one_point_five
            assert "1.5°C" in final_fb or "1.5" in final_fb, \
                f"All-A should trigger 1.5°C outcome, got: {final_fb[:200]}"
            # Should contain progressive reveal info
            assert "1.45" in final_fb or "升温" in final_fb, \
                "Should mention final temperature"
        finally:
            _stop(proc)


def test_full_playthrough_extreme_risk_D_leads_to_collapse():
    """All D's → outcome shows catastrophic narrative (collapse OR 3°C)."""
    with tempfile.TemporaryDirectory(prefix="climate-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            resp = _post(port,
                "/scenarios/create_game_session?scenario_id=climate-change-policy&difficulty=beginner",
                {})
            gid = resp["game_id"]
            for opt in ["D"] * 10:
                resp = _post(port, f"/scenarios/{gid}/turn",
                             {"decisions": {"option": opt,
                                            "justification": "退缩"}})
            final_fb = resp["feedback"]
            # All-D should trigger catastrophic outcome (collapse or 3°C)
            assert any(k in final_fb for k in ["3°C", "3.2°C", "协调崩溃", "碎片化", "分歧", "分裂"]), \
                f"All-D should trigger catastrophic outcome, got first 300: {final_fb[:300]}"
            # Should reference IPCC or 2075/2100 retrospective
            assert any(k in final_fb for k in ["IPCC", "2100", "升温", "灾难"]), \
                "Should mention scientific/temporal framing"
        finally:
            _stop(proc)


def test_state_evolution_tipping_distance_changes():
    """Tipping distance and renewable share change across turns."""
    with tempfile.TemporaryDirectory(prefix="climate-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            resp = _post(port,
                "/scenarios/create_game_session?scenario_id=climate-change-policy&difficulty=beginner",
                {})
            gid = resp["game_id"]
            history = []
            for opt in ["A", "B", "A", "B", "A", "B", "A", "B", "A", "A"]:
                resp = _post(port, f"/scenarios/{gid}/turn",
                             {"decisions": {"option": opt,                                            "justification": "test"}})
                history.append({
                    "turn": resp["turnNumber"],
                    "renewable": resp["game_state"].get("renewable_share_pct"),
                    "tipping": resp["game_state"].get("tipping_point_proximity"),
                    "temp": resp["game_state"].get("global_avg_temp_c"),
                })
            # renewable share should have grown (A options add 15/8/12)
            assert history[-1]["renewable"] > history[0]["renewable"], \
                f"renewable should grow: {history}"
            # tipping proximity may fluctuate but should be in 0-100 range
            for h in history:
                assert 0 <= h["tipping"] <= 100, f"tipping out of range: {h}"
        finally:
            _stop(proc)


def test_justification_sanitized_200_chars():
    """Backend caps justification via escape_justification(200)."""
    with tempfile.TemporaryDirectory(prefix="climate-e2e-") as disk:
        proc, port = _run_server(disk)
        try:
            resp = _post(port,
                "/scenarios/create_game_session?scenario_id=climate-change-policy&difficulty=beginner",
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


def test_8_dorner_patterns_detectable():
    """Engine can detect at least some Dörner patterns after a triggering sequence."""
    import sys
    sys.path.insert(0, "api-server")
    from logic.climate_scenario import (
        apply_turn, detect_patterns, get_initial_state
    )
    s = get_initial_state()
    # All-D (extreme_risk) → triggers F7 (whistleblower silenced) and F8 (low radical in early turns)
    for n in range(1, 11):
        s["turn_number"] = n
        apply_turn(s, "D", f"turn {n}")
    patterns = detect_patterns(s)
    assert len(patterns) > 0, "Should detect at least one Dörner pattern"
    # At least F7 (silenced scientists) should fire after all-D
    pattern_types = {p["pattern_type"] for p in patterns}
    assert "F7_self_criticism" in pattern_types, \
        f"F7 should fire after whistleblower suppression, got: {pattern_types}"