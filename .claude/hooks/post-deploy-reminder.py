#!/usr/bin/env python3
"""PostToolUse hook: remind to verify deployment after git push / vercel / etc.

Reads Claude's PostToolUse JSON from stdin, inspects the bash command,
and emits a stderr reminder if it looks like a deploy action.

Always exits 0 (this is a nudge, not a gate).
"""

import json
import re
import sys

# Patterns that trigger the reminder
DEPLOY_PATTERNS = [
    r"\bgit\s+push\b",
    r"\bnpx\s+vercel\b",
    r"\bvercel\s+(deploy|--prod|build)\b",
    r"\bgcloud\s+app\s+deploy\b",
    r"\baws\s+s3\s+cp\b.*--recursive",
    r"\bkubectl\s+apply\b",
    r"\bdeploy\.sh\b",
    r"\bnpm\s+run\s+deploy\b",
]


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        return 0

    tool_input = payload.get("tool_input", {})
    cmd = tool_input.get("command", "") if isinstance(tool_input, dict) else ""
    if not isinstance(cmd, str) or not cmd:
        return 0

    for pat in DEPLOY_PATTERNS:
        if re.search(pat, cmd, re.IGNORECASE):
            print(
                "[verify-deployment-claims] REMINDER: Deploy-like command detected.\n"
                "  Before claiming 'deployed' or 'live':\n"
                "    1. curl probe the production URL (--max-time 30)\n"
                "    2. Read body — confirm expected content\n"
                "    3. Distinguish config error (3-6s build) from runtime error (30s+)\n"
                "  See .claude/skills/verify-deployment-claims/SKILL.md for full checklist.",
                file=sys.stderr,
            )
            break

    return 0


if __name__ == "__main__":
    sys.exit(main())
