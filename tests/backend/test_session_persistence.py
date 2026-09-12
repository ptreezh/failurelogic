"""test_session_persistence.py — tests for sessions_store.py (spec B2/B3).

Sessions are stored as JSON in a configurable directory (default: tmp/sessions/).
Atomic writes (write to .tmp, os.replace) prevent corruption from
concurrent access (spec G9).

G3 test: sessions older than 24h are evicted on next load.
G9 test: concurrent writes don't corrupt JSON.
"""

import os
import json
import time
import tempfile
import threading

import pytest

# Mirror tests/challenger setup: api-server is added to sys.path so we can
# import logic.X and api-server.start modules directly.
import sys
sys.path.insert(0, "api-server")


def _fresh_dir():
    """Create and return a unique temp directory for this test."""
    return tempfile.mkdtemp(prefix="session-test-")


def test_save_and_load_roundtrip(tmp_path):
    """Saving a session then loading returns equivalent data."""
    from logic.session_store import save_session, load_session

    sess = {
        "session_id": "session_1_abc",
        "scenario_id": "challenger-launch",
        "turn": 5,
        "state": {"engineer_confidence": 65, "schedule_pressure": 80},
        "decision_history": [{"turn": 1, "option": "A"}],
    }
    save_session(sess, tmp_path)
    loaded = load_session("session_1_abc", tmp_path)
    assert loaded["session_id"] == sess["session_id"]
    assert loaded["state"]["engineer_confidence"] == 65
    assert loaded["decision_history"] == [{"turn": 1, "option": "A"}]


def test_load_nonexistent_returns_none(tmp_path):
    """Loading a session_id that was never saved returns None (not error)."""
    from logic.session_store import load_session

    assert load_session("does-not-exist", tmp_path) is None


def test_atomic_write_no_corruption_on_concurrent(tmp_path):
    """G9: concurrent saves to the same session_id produce parseable JSON.

    Without os.replace-based atomicity, two threads writing the same
    file at once can leave truncated JSON. We verify the final state
    parses cleanly. PermissionError on Windows (file locking) is also
    acceptable — os.replace means a single writer wins atomically and
    the file is never half-written.
    """
    from logic.session_store import save_session

    errors = []

    def save_one(i):
        try:
            save_session({
                "session_id": "concurrent",
                "iteration": i,
                "state": {"x": i},
            }, tmp_path)
        except Exception as e:
            # Windows file locking may raise PermissionError on
            # concurrent os.replace; this is acceptable (the writer
            # that wins atomically replaces the file).
            if not isinstance(e, PermissionError):
                errors.append(e)

    threads = [threading.Thread(target=save_one, args=(i,)) for i in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # File exists and is valid JSON (this is the actual guarantee)
    target = os.path.join(tmp_path, "concurrent.json")
    assert os.path.exists(target)
    with open(target, "r", encoding="utf-8") as f:
        data = json.load(f)  # raises if corrupted
    assert data["session_id"] == "concurrent"
    assert errors == []


def test_evict_old_sessions(tmp_path):
    """Sessions older than max_age_seconds are removed on eviction call."""
    from logic.session_store import save_session, evict_old_sessions

    # Save one fresh session and one "old" session (mtime manipulated)
    save_session({"session_id": "fresh", "turn": 1}, tmp_path)
    old_path = os.path.join(tmp_path, "old.json")
    with open(old_path, "w", encoding="utf-8") as f:
        json.dump({"session_id": "old", "turn": 1}, f)
    # Make old file appear 25 hours old
    old_time = time.time() - (25 * 3600)
    os.utime(old_path, (old_time, old_time))

    removed = evict_old_sessions(tmp_path, max_age_seconds=24 * 3600)

    assert "old" in removed
    assert "fresh" not in removed
    assert not os.path.exists(old_path)
    assert os.path.exists(os.path.join(tmp_path, "fresh.json"))


def test_cap_max_files_lru_eviction(tmp_path):
    """G23: at cap, oldest files evicted first (LRU by mtime)."""
    from logic.session_store import save_session

    for i in range(5):
        save_session({"session_id": f"sess_{i}", "turn": i}, tmp_path)
        time.sleep(0.05)  # ensure distinct mtimes

    from logic.session_store import cap_files
    removed = cap_files(tmp_path, max_files=3)

    # Oldest 2 evicted
    assert "sess_0" in removed
    assert "sess_1" in removed
    # Newest 3 retained
    for i in (2, 3, 4):
        assert os.path.exists(os.path.join(tmp_path, f"sess_{i}.json"))
