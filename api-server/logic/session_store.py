"""session_store.py — file-based session persistence for /scenarios game sessions.

Spec B2/B3: persist sessions as JSON files in a configurable directory
(default tmp/sessions/). Atomic writes via .tmp + os.replace() prevent
corruption from concurrent access (G9). Eviction on age (24h) and
file count cap (LRU) to stay within Render free tier disk limits (G23).

Usage:
    from logic.session_store import save_session, load_session
    save_session({"session_id": "...", ...}, base_dir)
    sess = load_session("...", base_dir)

All functions accept base_dir explicitly so tests can use temp dirs.
The default base_dir is "tmp/sessions" relative to CWD when not
provided.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional


def _safe_filename(session_id: str) -> str:
    """Convert session_id to a safe filename (no path traversal)."""
    # Reject anything that isn't safe filename chars
    safe = "".join(c for c in session_id if c.isalnum() or c in "._-")
    if not safe or safe != session_id:
        raise ValueError(f"invalid session_id: {session_id!r}")
    return f"{safe}.json"


def save_session(session: Dict[str, Any], base_dir: str) -> str:
    """Atomically save a session dict to <base_dir>/<session_id>.json.

    Atomic via write-to-tmp + os.replace() (G9 fix). Returns the path
    written.
    """
    os.makedirs(base_dir, exist_ok=True)
    filename = _safe_filename(session["session_id"])
    target = os.path.join(base_dir, filename)
    tmp = target + ".tmp"

    payload = json.dumps(session, ensure_ascii=False)
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(payload)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, target)
    return target


def load_session(session_id: str, base_dir: str) -> Optional[Dict[str, Any]]:
    """Load a session from <base_dir>/<session_id>.json, or None if absent."""
    filename = _safe_filename(session_id)
    path = os.path.join(base_dir, filename)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def evict_old_sessions(base_dir: str, max_age_seconds: int = 24 * 3600) -> List[str]:
    """Remove session files older than max_age_seconds.

    Returns list of removed session_ids. Skips files that fail
    stat/parse (treated as orphaned).
    """
    if not os.path.exists(base_dir):
        return []
    cutoff = time.time() - max_age_seconds
    removed = []
    for fname in os.listdir(base_dir):
        if not fname.endswith(".json"):
            continue
        path = os.path.join(base_dir, fname)
        try:
            mtime = os.path.getmtime(path)
        except OSError:
            continue
        if mtime < cutoff:
            try:
                os.remove(path)
                removed.append(fname[:-len(".json")])
            except OSError:
                continue
    return removed


def cap_files(base_dir: str, max_files: int) -> List[str]:
    """G23: cap total session file count via LRU eviction (by mtime).

    Returns list of removed session_ids (the oldest first).
    """
    if not os.path.exists(base_dir):
        return []
    entries = []
    for fname in os.listdir(base_dir):
        if not fname.endswith(".json"):
            continue
        path = os.path.join(base_dir, fname)
        try:
            mtime = os.path.getmtime(path)
            entries.append((mtime, path, fname))
        except OSError:
            continue
    # Oldest first
    entries.sort()
    to_remove = entries[:max(0, len(entries) - max_files)]
    removed = []
    for _, path, fname in to_remove:
        try:
            os.remove(path)
            removed.append(fname[:-len(".json")])
        except OSError:
            continue
    return removed
