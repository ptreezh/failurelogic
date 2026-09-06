---
name: git-platform-ops
description: Perform authenticated GitHub/Gitee operations (push, PR, issue) without exposing tokens. Use when the user asks to push code, open a PR, list/create issues, or any git operation requiring authentication.
---

# git-platform-ops skill

When the user asks for git operations that need authentication, **always** route through `scripts/git-platform-ops.ps1`. Never use raw `git push https://token@...`, never run `gh` or `curl` with a token from `.git-token` directly.

## Why

AI tools (Claude Code, Doubao, etc.) must never see or paste real tokens. This skill enforces a one-way flow: user runs the wrapper, the wrapper loads `.git-token` (gitignored) and dispatches to the right backend.

## Available subcommands

PowerShell (Windows default):
```powershell
.\scripts\git-platform-ops.ps1 -Action info                       # Show current repo + platform
.\scripts\git-platform-ops.ps1 -Action auth-status                # Show loaded tokens (masked)
.\scripts\git-platform-ops.ps1 -Action push                       # git push current branch
.\scripts\git-platform-ops.ps1 -Action push -Branch feature-x
.\scripts\git-platform-ops.ps1 -Action pr-create -Title "..." -Body "..." -Base main
.\scripts\git-platform-ops.ps1 -Action pr-list -Limit 20
.\scripts\git-platform-ops.ps1 -Action issue-create -Title "..." -Body "..."
.\scripts\git-platform-ops.ps1 -Action issue-list -Limit 20
```

Bash (macOS / Linux / Git Bash on Windows):
```bash
./scripts/git-platform-ops.sh info
./scripts/git-platform-ops.sh auth-status
./scripts/git-platform-ops.sh push
./scripts/git-platform-ops.sh push --branch feature-x
./scripts/git-platform-ops.sh pr-create --title "..." --body "..." --base main
./scripts/git-platform-ops.sh pr-list --limit 20
./scripts/git-platform-ops.sh issue-create --title "..." --body "..."
./scripts/git-platform-ops.sh issue-list --limit 20
```

The script auto-detects GitHub vs Gitee from `git remote get-url origin`. For GitHub it prefers `gh` CLI if available, otherwise falls back to REST API. Gitee always uses REST API. Bash version uses `python3` for JSON construction (no `jq` dependency).

## Behavior rules

1. **Never** read, echo, or paste `.git-token` contents. If you need to verify it exists, just check `Test-Path .git-token` — do not print contents.
2. **Never** suggest `git push https://x-access-token:$GH_TOKEN@...` to the user — use the wrapper instead.
3. **Suggest the exact `git-platform-ops.ps1` command** the user should run. Do not run it yourself unless the user explicitly asks.
4. **If a subcommand fails** (e.g., 401 unauthorized), tell the user their token may be expired and to rotate it. Do not attempt to debug token contents.
5. **For multi-step workflows** (commit, push, open PR), suggest a single chained command:
   ```powershell
   git add -A; git commit -m "..."; .\scripts\git-platform-ops.ps1 -Action push; .\scripts\git-platform-ops.ps1 -Action pr-create -Title "..." -Body "..."
   ```

## What you may do freely

- Run `git status`, `git diff`, `git log`, `git branch` (read-only)
- Run the wrapper subcommands `info` and `auth-status` (they don't need auth)
- Read and edit non-secret files (`.git-token.example`, `scripts/git-platform-ops.ps1`, etc.)

## What you must NOT do

- `Read` or `cat` `.git-token`, `.env`, or any `*credentials*` file
- Include real-looking token strings (`ghp_*`, `gho_*`, etc.) in chat or commit messages
- Suggest manual token pasting into URLs
- Bypass the wrapper "for convenience" — the security boundary depends on every operation going through it

## First-time setup helper

If the user says they haven't set up tokens yet, guide them:

1. Generate tokens (see `.git-token.example` for guidance):
   - GitHub: https://github.com/settings/personal-access-tokens/new (Fine-grained, 7 days)
   - Gitee: https://gitee.com/personal_access_tokens (7 days)
2. `cp .git-token.example .git-token`
3. Edit `.git-token` and fill in the values
4. Verify: `.\scripts\git-platform-ops.ps1 -Action auth-status`

## Reference

- `.git-token.example` — token template
- `scripts/with-token.ps1` — generic token loader (for ad-hoc commands)
- `scripts/git-platform-ops.ps1` — the wrapper this skill wraps
- `CLAUDE.md` Security Practices section — repo-wide AI rules
