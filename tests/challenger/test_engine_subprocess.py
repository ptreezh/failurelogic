"""Subprocess-based smoke test for the Challenger engine.

Runs a fresh Python process to invoke escape_justification, which proves
the engine module loads cleanly without __pycache__ pollution. This
catches the 'I trust engineers' bug class (stale pyc serving pre-fix
code) without the flakiness of in-process FastAPI TestClient tests
(moduled loading via importlib is brittle across platforms).

Add this file to the test path. pytest will pick up test_* functions.
"""

import subprocess
import sys


def _run_python(script: str) -> str:
    """Run script in a fresh Python subprocess. Returns stdout."""
    result = subprocess.run(
        [sys.executable, "-c", script],
        capture_output=True,
        text=True,
        timeout=10,
        cwd=".",
    )
    if result.returncode != 0:
        raise RuntimeError(f"subprocess failed: rc={result.returncode}\nstderr={result.stderr}")
    return result.stdout.strip()


def test_subprocess_imports_challenger_module_cleanly():
    """Verify the engine module imports without errors."""
    output = _run_python(
        """
import sys
sys.path.insert(0, 'api-server')
from logic.challenger_scenario import escape_justification, apply_turn
print('OK')
"""
    )
    assert output == "OK", f"Unexpected output: {output}"


def test_subprocess_escape_justification_xss():
    """Verify XSS escaping in a fresh process (rules out stale pyc)."""
    output = _run_python(
        """
import sys
sys.path.insert(0, 'api-server')
from logic.challenger_scenario import escape_justification
result = escape_justification('<img src=x onerror=alert(1)>')
print(result)
"""
    )
    # After escape, '<' becomes '<' and '>' becomes '>'
    assert chr(60) not in output, f"Raw '<' still in output: {output}"
    assert chr(62) not in output, f"Raw '>' still in output: {output}"
    assert chr(38) + "lt;" in output, f"Expected '<' escape in: {output}"


def test_subprocess_escape_justification_length_cap():
    output = _run_python(
        """
import sys
sys.path.insert(0, 'api-server')
from logic.challenger_scenario import escape_justification
result = escape_justification('x' * 1000, max_length=200)
print(len(result))
"""
    )
    assert output == "200", f"length cap failed: {output}"


def test_subprocess_escape_justification_empty_dropped():
    output = _run_python(
        """
import sys
sys.path.insert(0, 'api-server')
from logic.challenger_scenario import escape_justification
print('None' if escape_justification('') is None else 'present')
print('None' if escape_justification('   ') is None else 'present')
"""
    )
    lines = output.strip().split("\n")
    assert lines == ["None", "None"], f"empty/whitespace not dropped: {output}"
