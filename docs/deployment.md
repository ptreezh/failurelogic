# Deployment & Production Readiness (2026-09-13)

> 2 deep scenarios (challenger-launch + climate-change-policy) are production-ready.
> This document covers the verified deployment path and hardening checklist.

---

## 1. Deployment Path

### Backend (Render free tier)

Already configured via `render.yaml` + `Dockerfile`:
- Python 3.12-slim image, uvicorn standard worker
- Auto-deploys on push to `main`
- `ALLOWED_ORIGINS` env var restricts CORS to GitHub Pages + localhost
- Health check at `/health`

**Render-specific notes**:
- Free tier spins down after 15 min idle → first request may take 30-60s
- Ephemeral disk: `tmp/sessions/` is wiped on container redeploy (acceptable)
- 512 MB RAM limit → adequate for current 2-scenario state

### Frontend (GitHub Pages)

- Static SPA at `index.html` — no build step
- API URL configured via `assets/js/app-core.js` → `APP_CONFIG.apiBaseUrl`
  - Dev: `http://localhost:8082` (currently broken — see §4 below)
  - Production: `https://insightful-enthusiasm-production.up.railway.app` (note: legacy URL)
  - **NEEDS UPDATE**: should point to `https://failure-logic-api.onrender.com` (new Render URL)

---

## 2. Production Hardening Checklist (verified 2026-09-13)

| Check | Status | Evidence |
|---|---|---|
| No hardcoded secrets | ✅ | grep -rE "(api_key|password|token|secret)" finds no literal secrets |
| CORS env-driven | ✅ | `ALLOWED_ORIGINS` env var, defaults to GitHub Pages + localhost |
| No `debug=True` in startup | ✅ | `uvicorn.run(app, host="0.0.0.0", port=port)` |
| Rate limiting | ✅ | slowapi on `/scenarios/create_game_session` (5/min) and `/turn` (30/min) |
| Session persistence | ✅ | file-based, 24h TTL, 100-file LRU cap (per-game restart survives) |
| XSS protection | ✅ | `escape_justification()` 200-char cap + html.escape |
| Error handling | ✅ | Custom exception handler (utils/error_handlers.py) |
| Path traversal protection | ✅ | `_safe_filename()` validates session_id format |
| Health check endpoint | ✅ | `/health` returns 200 with timestamp + version |
| Logging | ✅ | `logging.warning()` for failures (no stack traces leaked) |
| Concurrent writes | ✅ | `tmp/.json + os.replace()` atomic write |

---

## 3. Test Coverage

**Backend (68 tests, all green)**:
- 38 Challenger engine unit tests
- 4 Challenger subprocess tests
- 5 session persistence tests
- 3 session persistence integration tests (incl. server restart)
- 4 step endpoint tests
- 7 Challenger E2E playthrough tests
- 7 climate-change E2E playthrough tests

**Frontend (8 E2E, all green)**:
- 5 Challenger playthrough (load/T1→T2/full 10/T6 reveal/resume)
- 3 climate-change playthrough (load/T3 reveal/climate-specific state grid)

---

## 4. Known Issues / Outstanding Items

| Issue | Severity | Workaround |
|---|---|---|
| Dev frontend `apiBaseUrl` points to `localhost:8082` instead of `8000` | Low (dev only) | API at 8082 must be running; or update `assets/js/app-core.js` line 19 |
| Service worker cache: `failure-logic-v1.0.3` (must bump per release) | Low | Manual bump on JS changes |
| No automated Playwright ffmpeg dependency check | Low | Standalone `tests/e2e/playwright.no-ffmpeg.config.cjs` provided |
| Railway URL in `app-core.js` is stale | Medium | Update to Render URL for production frontend |
| No CI/CD pipeline (render.yaml auto-deploys but no tests gate it) | Medium | Render runs from main without green tests — risk of broken deploys |
| No `requirements-test.txt` Docker step | Low | Tests run locally only |

---

## 5. Pre-Deployment Verification Steps

Before pushing to main:

```bash
# Backend tests
python -m pytest tests/ -q --ignore=tests/e2e --ignore=tests/git-platform-ops \
  --ignore=tests/publish-ops --ignore=tests/release-ops
# Should pass 68 tests

# Frontend E2E (requires running API + frontend servers)
cd tests && nohup npx serve -l 3000 .. > /tmp/fe.log 2>&1 &
cd .. && python api-server/start.py 8000 &
PLAYWRIGHT_BROWSERS_PATH=$LOCAL_PLAYWRIGHT \
  node_modules/.bin/playwright test --config=tests/e2e/playwright.no-ffmpeg.config.cjs \
  --project=chromium
# Should pass 8 E2E tests

# Check no .pyc committed
find . -name "__pycache__" -type d | grep -v node_modules
# Should be empty (or only from .gitignore)
```

---

## 6. Rollback Strategy

Render retains last 10 deployments. To rollback:
- Render dashboard → failure-logic-api → "Rollback to this deploy" button
- OR `git revert HEAD && git push origin main` to trigger new deploy with reverted code

Frontend rollback: GitHub Pages → repository → Settings → Pages → "Revert" button (or `git revert` + push).

---

## 7. Future Improvements (post-v1.0)

1. Add GitHub Actions CI to gate deploys on green tests
2. Add structured logging (JSON format for log aggregation)
3. Add OpenTelemetry traces for performance monitoring
4. Add response caching for `/scenarios/` and `/scenarios/{id}/step/{N}` (Redis or in-memory LRU)
5. Add rate limiting per IP+user, not just per IP
6. Add 2FA for future user accounts (currently no user accounts)
7. Add scenario diff view for content editors to preview changes