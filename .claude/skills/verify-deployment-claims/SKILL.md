---
name: verify-deployment-claims
description: Verify any deployment claim (live, ready, deployed, fixed, merged) before reporting success to the user. Always probe the URL with curl, distinguish config errors from runtime errors by build duration, and never trust CLAUDE.md over current HTTP state. Use after `git push`, `npx vercel`, `vercel --prod`, or any claim that "deployment is X".
---

# verify-deployment-claims skill

**Default rule:** if you say "deployed", "live", "ready", or "fixed" without an HTTP probe, you are lying. Probe first, claim after.

## When to invoke this skill

- After any `git push` to `main`
- After `npx vercel --prod`, `vercel deploy`, `gcloud app deploy`, `aws deploy`, `kubectl apply`
- After fixing a deploy config (vercel.json, render.yaml, Procfile, etc.)
- After the user reports "deployment shows Ready / Error" from a dashboard
- Before claiming "the deploy is fixed" in any user-facing message

## The 4-step verification protocol

### 1. **HTTP probe the actual URL the user/frontend will hit**

```bash
# Required — every claim
curl -sS -o /tmp/resp.txt -w "%{http_code}|%{size_download}B|%{time_total}s\n" \
  --max-time 30 "<production-url>/health"

curl -sS -o /tmp/resp.txt -w "%{http_code}|%{size_download}B|%{time_total}s\n" \
  --max-time 30 "<production-url>/scenarios/<scenario-id>"

# Body check — first 500 chars
curl -sS --max-time 30 "<production-url>/scenarios/<scenario-id>" | head -c 500
```

**Pass criteria:** HTTP 200 with non-empty body matching expected schema (JSON for APIs, HTML for frontend).
**Fail criteria:** Connection timeout, 404, 500, or empty body.

### 2. **Distinguish config errors from runtime errors**

Build duration is a signal:

| Build duration | Most likely cause |
|---|---|
| < 10s, status Error | Config parsing — entrypoint format, invalid `pyproject.toml`, missing source file, webhook misconfigured |
| 10-30s, status Error | `pip install` failed — wrong package, missing `requirements.txt`, network failure |
| 30s+, status Error | Runtime — import error, syntax error, missing dependency at runtime |
| 30s+, status Ready | Working — full build pipeline ran |

**Most common 3-second failures:** `entrypoint = "path-with-hyphen:attr"` in `pyproject.toml [tool.vercel]` (Python module names cannot contain `-`); invalid JSON in `vercel.json`; missing `builds` field; source file not in `api/` directory and no `builds` override.

### 3. **Verify the integration, not just the config**

"Vercel Settings > Git shows Connected" ≠ GitHub App installed. Two separate checks:

```bash
# Are webhooks actually present?
gh api repos/<owner>/<repo>/hooks | python -c "import json,sys; print(len(json.load(sys.stdin)))"

# Is the GitHub App actually installed for this repo?
gh api /user/installations | python -c "
import json,sys
data = json.load(sys.stdin)
for inst in data.get('installations', []):
    if 'vercel' in inst.get('app', {}).get('slug', '').lower():
        print('VERCEL APP INSTALLED')
        break
else:
    print('VERCEL APP NOT INSTALLED')
"
```

`0 webhooks` after `Connected` in dashboard = OAuth scope, not GitHub App. Pushes won't auto-deploy until App is installed at `https://github.com/settings/installations`.

### 4. **Distinguish dashboard state from service state**

- Dashboard "Ready" ≠ your machine can reach it (regional network, VPN, local proxy)
- Your machine can't reach it ≠ service is down (you may be the only one with the routing issue)
- **Trust dashboard as supplementary evidence; primary evidence is HTTP probe from any reachable network**

If your probe fails:
- Note the exact error: `Connection timed out`, `DNS resolves but no TCP`, `HTTP 403 missing token`
- Don't conclude "service is down" — the user may have a working browser-based path
- Tell the user explicitly: "I can't verify from this machine. Please confirm in your browser at <url>"

## Gotchas table — fixes that took multiple iterations

| Symptom | Root cause | Fix |
|---|---|---|
| Vercel builds fail in 3 seconds | `entrypoint = "api-server.start:app"` in `pyproject.toml [tool.vercel]` — Python module names can't have `-` | Use `vercel.json` with explicit `builds` config: `{ "src": "api-server/start.py", "use": "@vercel/python" }`; remove `[tool.vercel]` from `pyproject.toml` |
| Vercel "Connected Git Repository" but 0 webhooks | OAuth scope, not GitHub App | Install Vercel GitHub App at `https://github.com/settings/installations` → configure repo access |
| `prepare-pages.sh` GitHub Pages deploy fails: `tar: cannot open /tmp/xxx` | `trap 'rm -rf "$TMP"' EXIT` deletes temp dir before workflow reads it | Remove the trap; runner's `/tmp` is wiped between jobs anyway |
| Render service returns `x-render-routing: no-server` | Free tier service suspended | Check dashboard; either revive Render service or migrate to alternative (Vercel) |
| `failure-logic.vercel.app` connects from user browser but not your machine | Regional IP routing (e.g., Vercel edge IPs blocked in some networks) | Ask user to verify; trust their browser evidence over your probe failure |
| `git-platform-ops.ps1 -Action auth-status` errors with "Token file not found" | `.git-token` doesn't exist | User creates file via `cp .git-token.example .git-token` (don't paste token in chat) |
| `pytest` passes locally but `gh run list` shows failure | Path case (uppercase vs lowercase repo names) or `runner/work/` vs `runner/work/<repo>` mismatch | Read failed CI log line; fix path in test setup script |

## Anti-patterns to avoid

1. **Trusting CLAUDE.md over HTTP state.** CLAUDE.md is a historical snapshot. Deployments rot. Probe first.
2. **Reporting "deployed" after `git push`.** Push ≠ deploy. Wait for actual deploy signal.
3. **Running `git push` without first verifying the deploy config.** `git push` is cheap; the cost is debugging a 3-second Error hours later.
4. **Suggesting `--no-verify` or bypassing checks.** Those exist for emergencies; not for routine deploys.
5. **Skipping intermediate verification.** If a fix is "obvious", still probe after.

## Self-test for new deploy configs

Before committing a deploy config change, run this locally:

```bash
# For Vercel
npx vercel build 2>&1 | tail -20

# For Python in particular
python -c "from logic.<module> import <symbol>"  # verify imports work

# Smoke the API
python api-server/start.py 8000 &
sleep 3
curl -sS http://localhost:8000/health
curl -sS http://localhost:8000/scenarios/ | head -c 500
kill %1
```

If local smoke fails, do NOT push. Fix first.

## When the skill is wrong / overcautious

If you've already done these checks in the same session (probes captured in stdout, dashboard state observed), you can reference them rather than re-probe. But never SKIP them — re-use or repeat.
