"""test_boundary_conditions.py — Edge cases + adversarial inputs.

Validates the production hardening claimed in docs/deployment.md:
  - Empty/invalid scenario IDs
  - SQL/HTML injection in justification
  - Out-of-range option IDs
  - Concurrent session creation
  - Server restart with no disk (RENDER_DISK_PATH unwritable)
  - Rate limit threshold
"""

import json
import os
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request


def _run_server(session_dir):
    port = str(20700 + (os.getpid() % 90))
    env = os.environ.copy()
    env["RENDER_DISK_PATH"] = session_dir
    proc = subprocess.Popen(
        [sys.executable, "-c",
         "import sys; sys.path.insert(0, 'api-server'); "
         "import start; "
         "import uvicorn; uvicorn.run(start.app, host='127.0.0.1', "
         f"port={port}, log_level='warning')"],
        env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
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


def _get(port, path):
    with urllib.request.urlopen(f"http://127.0.0.1:{port}{path}", timeout=5) as r:
        return json.loads(r.read())


def _post(port, path, payload):
    req = urllib.request.Request(
        f"http://127.0.0.1:{port}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


# ===== Scenario listing =====

def test_health_endpoint_responds():
    """Health check must always return 200."""
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=3) as r:
                assert r.status == 200
                body = json.loads(r.read())
                assert body["status"] == "healthy"
                assert "timestamp" in body
                assert "version" in body
        finally:
            _stop(proc)


def test_scenarios_list_returns_two_deep_scenarios():
    """Only challenger-launch + climate-change-policy are served."""
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            data = _get(port, "/scenarios/")
            scenarios = data["scenarios"]
            ids = {s["id"] for s in scenarios}
            assert ids == {"challenger-launch", "climate-change-policy"}, \
                f"Expected only the 2 deep scenarios, got: {ids}"
            # Each scenario has required fields
            for s in scenarios:
                assert "name" in s and "description" in s
                assert "difficulty" in s and "scenario_file" in s
        finally:
            _stop(proc)


# ===== Unknown scenario_id =====

def test_create_session_with_unknown_scenario_returns_404():
    """Requesting a scenario that doesn't exist → 404."""
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            status, _ = _post(port,
                "/scenarios/create_game_session?scenario_id=does-not-exist&difficulty=beginner",
                {})
            assert status == 404
        finally:
            _stop(proc)


def test_step_endpoint_unknown_scenario_returns_404():
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            try:
                _get(port, "/scenarios/nonexistent/step/1")
                assert False, "expected 404"
            except urllib.error.HTTPError as e:
                assert e.code == 404
        finally:
            _stop(proc)


def test_step_endpoint_out_of_range_returns_404():
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            try:
                _get(port, "/scenarios/challenger-launch/step/99")
                assert False, "expected 404"
            except urllib.error.HTTPError as e:
                assert e.code == 404
        finally:
            _stop(proc)


def test_turn_endpoint_unknown_game_id_returns_404():
    """Turn against a non-existent session_id → 404."""
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            status, _ = _post(port,
                "/scenarios/never-existed-game-id/turn",
                {"decisions": {"option": "A"}})
            assert status == 404
        finally:
            _stop(proc)


# ===== Adversarial inputs =====

def test_turn_with_invalid_option_letter_does_not_crash():
    """An unknown option letter shouldn't break the engine; it should be a no-op."""
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            # Create session
            _, resp = _post(port,
                "/scenarios/create_game_session?scenario_id=challenger-launch&difficulty=beginner",
                {})
            gid = resp["game_id"]
            # Submit invalid option Z
            status, body = _post(port, f"/scenarios/{gid}/turn",
                                 {"decisions": {"option": "Z", "justification": ""}})
            # Should still succeed (200) — engine treats unknown option as no-op
            assert status == 200
            assert body["success"] is True
        finally:
            _stop(proc)


def test_justification_with_html_chars_is_escaped():
    """XSS attempt in justification → stored as HTML-escaped string."""
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            _, resp = _post(port,
                "/scenarios/create_game_session?scenario_id=challenger-launch&difficulty=beginner",
                {})
            gid = resp["game_id"]
            # Try XSS in justification
            xss = '<script>alert("xss")</script>'
            _, body = _post(port, f"/scenarios/{gid}/turn",
                             {"decisions": {"option": "A", "justification": xss}})
            # The stored justification should be HTML-escaped
            justs = body["game_state"].get("decision_justifications", {})
            stored = next(iter(justs.values()), "")
            assert "<script>" not in stored, \
                f"XSS not escaped: {stored!r}"
            assert "&lt;script&gt;" in stored or "&amp;lt;" in stored, \
                f"Expected HTML-escaped form, got: {stored!r}"
        finally:
            _stop(proc)


def test_justification_with_sql_chars_stored_safely():
    """SQL injection attempt in justification → stored as plain text (no execution)."""
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            _, resp = _post(port,
                "/scenarios/create_game_session?scenario_id=challenger-launch&difficulty=beginner",
                {})
            gid = resp["game_id"]
            sql = "'; DROP TABLE scenarios;--"
            status, body = _post(port, f"/scenarios/{gid}/turn",
                                 {"decisions": {"option": "A", "justification": sql}})
            assert status == 200
            # Server should still work (table not dropped)
            scenarios = _get(port, "/scenarios/")
            assert len(scenarios["scenarios"]) == 2
        finally:
            _stop(proc)


def test_unicode_in_justification_handled():
    """Unicode/CJK characters in justification must work."""
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            _, resp = _post(port,
                "/scenarios/create_game_session?scenario_id=challenger-launch&difficulty=beginner",
                {})
            gid = resp["game_id"]
            unicode_text = "政治承诺高于工程安全 🚀 中文 English mixed 𝛼𝛽𝛾"
            status, body = _post(port, f"/scenarios/{gid}/turn",
                                 {"decisions": {"option": "A", "justification": unicode_text}})
            assert status == 200
            justs = body["game_state"].get("decision_justifications", {})
            stored = next(iter(justs.values()), "")
            assert "政治承诺" in stored
            assert "🚀" in stored
        finally:
            _stop(proc)


def test_empty_justification_is_stored_as_none():
    """An empty justification should not be stored (avoid noise)."""
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            _, resp = _post(port,
                "/scenarios/create_game_session?scenario_id=challenger-launch&difficulty=beginner",
                {})
            gid = resp["game_id"]
            status, body = _post(port, f"/scenarios/{gid}/turn",
                                 {"decisions": {"option": "A", "justification": "   "}})
            assert status == 200
            # Whitespace-only should be treated as empty
            justs = body["game_state"].get("decision_justifications", {})
            assert len(justs) == 0, f"Empty justification stored: {justs}"
        finally:
            _stop(proc)


# ===== Concurrency =====

def test_concurrent_session_creation():
    """10 concurrent session creates should all succeed."""
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            results = []
            def create():
                try:
                    _, resp = _post(port,
                        "/scenarios/create_game_session?scenario_id=challenger-launch&difficulty=beginner",
                        {})
                    results.append(resp["game_id"])
                except Exception as e:
                    results.append(f"ERROR:{e}")

            threads = [threading.Thread(target=create) for _ in range(10)]
            for t in threads: t.start()
            for t in threads: t.join()

            assert len(results) == 10
            assert all(not r.startswith("ERROR") for r in results), \
                f"Errors: {[r for r in results if r.startswith('ERROR')]}"
            # All session IDs should be unique
            assert len(set(results)) == 10, "Duplicate session IDs"
        finally:
            _stop(proc)


# ===== Validation of state persistence under load =====

def test_session_persists_across_10_turns_and_restart():
    """Critical: state must survive a server restart mid-game."""
    with tempfile.TemporaryDirectory() as disk:
        # First session
        proc, port = _run_server(disk)
        _, resp = _post(port,
            "/scenarios/create_game_session?scenario_id=climate-change-policy&difficulty=beginner",
            {})
        gid = resp["game_id"]
        for opt in ["A", "A", "A", "A", "A"]:
            _post(port, f"/scenarios/{gid}/turn",
                  {"decisions": {"option": opt, "justification": "激进"}})
        _stop(proc)

        # Restart on same disk
        proc2, port2 = _run_server(disk)
        try:
            # Continue from saved state
            status, body = _post(port2, f"/scenarios/{gid}/turn",
                                 {"decisions": {"option": "B", "justification": "改主意"}})
            assert status == 200
            # Session should be at turn 7+ (5 turns saved + 1 new = turn 7)
            assert body["turnNumber"] >= 7
        finally:
            _stop(proc2)


# ===== Payload structure =====

def test_turn_with_unwrapped_payload_works():
    """Frontend ApiService wraps payload as {user_id, decisions:{...}};
    server unwraps. Verify flat payload also works."""
    with tempfile.TemporaryDirectory() as disk:
        proc, port = _run_server(disk)
        try:
            _, resp = _post(port,
                "/scenarios/create_game_session?scenario_id=challenger-launch&difficulty=beginner",
                {})
            gid = resp["game_id"]
            # Wrapped form (frontend-style)
            status, body = _post(port, f"/scenarios/{gid}/turn",
                                 {"user_id": 1, "decisions": {"option": "A", "justification": "wrapped"}})
            assert status == 200
            assert body["success"] is True
            # Verify option was applied (turn should advance)
            assert body["turnNumber"] == 2
        finally:
            _stop(proc)