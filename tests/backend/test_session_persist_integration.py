"""test_session_persist_integration.py — Spec B3.

Verifies _persist_session() is hooked into both endpoints:
  - POST /scenarios/create_game_session → session file written
  - POST /scenarios/{id}/turn → session file updated with new state

Runs a real server subprocess with SESSION persistence directed at a
temp dir (so the test never touches real tmp/sessions).
"""

import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request


def _run_server(session_dir):
    port = str(19700 + (os.getpid() % 90))
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


def _stop_server(proc):
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


def _create_session(port, scenario_id="challenger-launch", difficulty="beginner"):
    path = (f"/scenarios/create_game_session"
            f"?scenario_id={scenario_id}&difficulty={difficulty}")
    return _post(port, path, {})


def _turn(port, game_id, option, justification=""):
    return _post(port, f"/scenarios/{game_id}/turn",
                 {"decisions": {"option": option, "justification": justification}})


def test_create_session_persists_file():
    with tempfile.TemporaryDirectory(prefix="b3-test-") as disk_root:
        proc, port = _run_server(disk_root)
        try:
            resp = _create_session(port)
            game_id = resp["game_id"]

            target = os.path.join(disk_root, "tmp", "sessions", f"{game_id}.json")
            assert os.path.exists(target), f"session file missing: {target}"
            with open(target, "r", encoding="utf-8") as f:
                saved = json.load(f)
            assert saved["session_id"] == game_id
            assert saved["scenario_id"] == "challenger-launch"
            assert saved["turn"] == 1
        finally:
            _stop_server(proc)


def test_turn_updates_persisted_file():
    with tempfile.TemporaryDirectory(prefix="b3-test-") as disk_root:
        proc, port = _run_server(disk_root)
        try:
            resp = _create_session(port)
            game_id = resp["game_id"]
            target = os.path.join(disk_root, "tmp", "sessions", f"{game_id}.json")
            with open(target, "r", encoding="utf-8") as f:
                before = json.load(f)
            assert before["turn"] == 1

            _turn(port, game_id, "A", "test turn")
            with open(target, "r", encoding="utf-8") as f:
                after = json.load(f)

            assert after["turn"] == 2
            assert after["game_state"] != before["game_state"]
        finally:
            _stop_server(proc)


def test_session_survives_server_restart():
    """The whole point of B2/B3: restart the process, session is restored."""
    with tempfile.TemporaryDirectory(prefix="b3-test-") as disk_root:
        proc, port = _run_server(disk_root)
        resp = _create_session(port)
        game_id = resp["game_id"]
        _turn(port, game_id, "A", "before restart")
        _stop_server(proc)

        # Restart on same disk root
        proc2, port2 = _run_server(disk_root)
        try:
            turn_resp = _turn(port2, game_id, "B", "after restart")
            # Session restored at turn 2 → this turn succeeds (no 404) and advances
            assert turn_resp["success"] is True
            assert turn_resp["turnNumber"] >= 3
        finally:
            _stop_server(proc2)
