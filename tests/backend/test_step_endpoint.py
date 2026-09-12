"""test_step_endpoint.py — RED tests for GET /scenarios/{id}/step/{turn}.

Spec B1: New endpoint returns step data (turn, phase, situation, options)
for frontend prefetching. Each step from data/scenarios/*.json has
options with id, text, weight, expected_concerns_addressed.
"""

import subprocess
import sys
import os
import time
import json


def _run_server(env_overrides=None):
    """Start the FastAPI server on a free port and return (process, port, base_url)."""
    # Use a non-default port to avoid clashing with dev server
    port = str(18765 + (os.getpid() % 100))
    env = os.environ.copy()
    if env_overrides:
        env.update(env_overrides)
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
    # Wait for ready
    import urllib.request
    deadline = time.time() + 10
    while time.time() < deadline:
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=1)
            return proc, port
        except Exception:
            time.sleep(0.2)
    proc.terminate()
    raise RuntimeError("server didn't come up")


def _stop_server(proc):
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except subprocess.TimeoutExpired:
        proc.kill()


def _get(port, path):
    import urllib.request
    with urllib.request.urlopen(f"http://127.0.0.1:{port}{path}", timeout=5) as r:
        return json.loads(r.read())


def test_step_endpoint_returns_challenger_t1():
    """GET /scenarios/challenger-launch/step/1 returns the T1 step with options."""
    proc, port = _run_server()
    try:
        data = _get(port, "/scenarios/challenger-launch/step/1")
        assert data["turn"] == 1
        assert "situation" in data
        assert len(data["situation"]) > 50  # not empty
        assert isinstance(data["options"], list)
        assert len(data["options"]) == 4
        # Options are A/B/C/D
        ids = [o["id"] for o in data["options"]]
        assert ids == ["A", "B", "C", "D"]
        # Each option has weight
        weights = [o["weight"] for o in data["options"]]
        assert all(w in {"extreme_safe", "safe", "neutral", "risky", "extreme_risk"} for w in weights)
        # T1 phase present
        assert "phase" in data
    finally:
        _stop_server(proc)


def test_step_endpoint_returns_challenger_t6_reveal():
    """GET step for T6 (is_pattern_reveal=true) returns pattern reveal step."""
    proc, port = _run_server()
    try:
        data = _get(port, "/scenarios/challenger-launch/step/6")
        assert data["turn"] == 6
        assert data.get("is_pattern_reveal") is True
    finally:
        _stop_server(proc)


def test_step_endpoint_returns_404_for_out_of_range():
    """GET step for turn > 10 returns 404."""
    import urllib.error
    proc, port = _run_server()
    try:
        try:
            _get(port, "/scenarios/challenger-launch/step/99")
            assert False, "expected 404"
        except urllib.error.HTTPError as e:
            assert e.code == 404
    finally:
        _stop_server(proc)


def test_step_endpoint_returns_404_for_unknown_scenario():
    """GET step for non-existent scenario returns 404."""
    import urllib.error
    proc, port = _run_server()
    try:
        try:
            _get(port, "/scenarios/nonexistent/step/1")
            assert False, "expected 404"
        except urllib.error.HTTPError as e:
            assert e.code == 404
    finally:
        _stop_server(proc)
