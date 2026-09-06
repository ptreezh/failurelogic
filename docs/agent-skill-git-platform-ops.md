# Agent Skill: Git Platform Operations (GitHub + Gitee)

> Portable reference for any AI assistant (Doubao, ChatGPT, local LLMs, etc.) that wants to perform authenticated GitHub or Gitee operations on the user's behalf — **without ever seeing or transmitting real tokens.**

## What this skill does

Routes all authenticated git operations through a single PowerShell wrapper (`scripts/git-platform-ops.ps1`) that:

1. Loads tokens from `.git-token` (a gitignored file the human controls)
2. Auto-detects GitHub vs Gitee from the git remote URL
3. Dispatches to `gh` CLI (GitHub) or REST API (Gitee) using those tokens internally
4. Returns only public-facing results (URLs, PR numbers) — never the token

## How to invoke (paste this verbatim to the AI)

```
You MUST follow these rules when performing git operations that need auth:

1. Never read, echo, or paste the contents of `.git-token`, `.env`, or any credentials file.
2. Never suggest commands that embed tokens directly (e.g., git push https://x-access-token:$TOKEN@...).
3. Always wrap auth operations with scripts/git-platform-ops.ps1 from the project root.
4. Only suggest commands; do NOT execute them yourself unless explicitly asked.

Available subcommands (Windows PowerShell, run from repo root):
  .\scripts\git-platform-ops.ps1 -Action info
  .\scripts\git-platform-ops.ps1 -Action auth-status
  .\scripts\git-platform-ops.ps1 -Action push [-Branch <name>]
  .\scripts\git-platform-ops.ps1 -Action pr-create -Title "..." -Body "..." [-Base main]
  .\scripts\git-platform-ops.ps1 -Action pr-list [-Limit 20]
  .\scripts\git-platform-ops.ps1 -Action issue-create -Title "..." -Body "..."
  .\scripts\git-platform-ops.ps1 -Action issue-list [-Limit 20]

Bash equivalent (if user is on Mac/Linux or using Git Bash):
  ./scripts/git-platform-ops.sh info
  (the bash version is planned — for now, run powershell -ExecutionPolicy Bypass -File scripts/git-platform-ops.ps1 ...)

If the user asks for an operation not in this list, propose a new subcommand or suggest adding `gh` CLI / Gitee REST API call to the wrapper.
```

## Threat model (so you understand WHY this matters)

| Risk | Mitigation |
|---|---|
| Token leaks into AI chat log | AI never sees the token — it sees only the wrapper command |
| Token leaks into commit message | AI doesn't write commits containing tokens |
| Token leaks into shell history | Wrapper reads from file, not env vars you paste into chat |
| Token leaks via screenshot | Wrapper URL embeds are temporary, never displayed |

## What you MUST NOT do

- `cat .git-token`, `Read .git-token`, or any read of credential files
- `echo $GH_TOKEN`, `print(GH_TOKEN)`, or any token disclosure
- Suggest `git push https://x-access-token:$TOKEN@github.com/...` even with `$TOKEN` as placeholder
- Suggest manual `git config credential.helper` with hardcoded values
- Write code that persists tokens to disk (e.g., `Set-Content token.txt`)

## What you MAY do freely

- Read `.git-token.example` (it's the template, no real secrets)
- Run read-only git commands (`status`, `diff`, `log`, `branch`)
- Suggest the exact wrapper command for the user to run
- Read and edit `scripts/git-platform-ops.ps1` itself
- Propose new subcommands by reading the existing pattern

## Self-check before suggesting any command

```
[ ] Does this command involve a token in plain text?     -> REJECT, use wrapper
[ ] Does this command read .git-token or .env?           -> REJECT, no reads allowed
[ ] Does this only call scripts/git-platform-ops.ps1?    -> OK, suggest it
[ ] Does this only do read-only git operations?          -> OK
[ ] Does this read/edit non-secret source files?         -> OK
```

## File locations

| File | Purpose | Read/Write |
|---|---|---|
| `scripts/git-platform-ops.ps1` | The wrapper itself | Read freely, edit with care |
| `.git-token.example` | Template (tracked) | Read, suggest `cp` to user |
| `.git-token` | Real tokens (gitignored) | **NEVER read** |
| `.gitignore` | Excludes `.git-token` | Read to confirm |
| `docs/agent-skill-git-platform-ops.md` | This document | Read for context |

## Quick reference: typical multi-step workflow

User says: "commit and push my changes and open a PR"

You suggest:

```powershell
git add -A
git commit -m "<commit message>"
.\scripts\git-platform-ops.ps1 -Action push
.\scripts\git-platform-ops.ps1 -Action pr-create -Title "<title>" -Body "<body>" -Base main
```

You do NOT execute these. The user runs them. Token flows: `.git-token` → wrapper process env → `gh`/API → gone after process exits.
