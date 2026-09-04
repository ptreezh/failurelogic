# Failure Logic — Remaining Work Roadmap

> Updated: 2026-09-04 (after R8)
> Status: 8 rounds complete, 30 commits, 169 tests passing, 66% coverage

---

## Current State (post-R8)

### Wins
- 0 real API keys in git history (R1)
- 0 eval / 0 fetch monkey-patch (R1)
- PWA offline functional (R1)
- CORS whitelist tightened (R4)
- 5 → 12 bias types implemented (R6)
- start.py: 1759 → 686 lines (-61%)
- 17 → 169 tests (+893%)
- 0 → 66% backend coverage
- CI gates in place (pytest + coverage + E2E)

### Pending Manual Tasks
- [ ] Rotate OpenRouter API key (https://openrouter.ai/keys)
- [ ] Rotate NVIDIA API key (https://org.ngc.nvidia.com/)
- [ ] Push main to GitHub: `git push origin main --force-with-lease`

---

## R9+ Backlog (in priority order)

### P0: Critical (do before any feature work)
1. **Decouple feedback_real from global state**
   - 3 tests skipped because functions use module-level `cross_scenario_analyzer`
   - Fix: pass analyzer as parameter or use dependency injection
   - Impact: enables unit testing, removes hidden coupling

2. **Refactor turn_executor.py (493 lines)**
   - Extract per-scenario_id helpers into separate functions
   - Add dispatcher pattern
   - Currently 12 inline branches; split into 12 functions + 1 dispatch
   - Estimated: 5 unit tests + 200 lines reduction

3. **Fix `api-server/endpoints/test_results.py` import error**
   - Pre-existing relative import issue
   - Either fix or formally exclude from test collection
   - Currently workarounded via pytest.ini testpaths

### P1: Quality (do incrementally)
4. **App.js split (15182 lines)**
   - Module per router (9 routers currently in single file)
   - Requires test coverage of app.js logic first
   - Risk: very high; do after extensive testing

5. **Generate_real_feedback per-scenario split**
   - 322 lines, 11 scenario_id branches
   - Pattern: extract `_feedback_for_coffee_shop(s, d, o, n)`, etc.
   - Similar to turn_executor refactor

6. **App.js inline onclick → addEventListener (87 sites)**
   - Lower risk than full app.js split
   - Use event delegation on container instead of per-element

7. **App.js innerHTML → SafeRender (55+ sites)**
   - Same pattern as R1.7 + R5.1
   - Critical for XSS prevention

### P2: Polish
8. **.gitignore comprehensive cleanup**
   - 39 assets/js/* entries still listed but exist on disk
   - Decide: track or delete

9. **App.js state management module split**
   - GameManager / NavigationManager / AppState split into modules
   - Currently 7000+ lines in app.js

10. **Replace `console.log` (23 remaining in production)**
    - With `Logger.info`/`debug`
    - Most in performance-monitoring.js (legitimate)

11. **Reduce `except Exception` (43 sites)**
    - Specifically: start.py feedback paths
    - Replace with specific exceptions

12. **window.* pollution reduction (223 sites)**
    - Most are intentional singletons
    - Hard to remove without breaking API

### P3: v4.0 Features
13. **Train 4-stage persistence**
    - Already in app.js (training-stage-tracker.js)
    - Needs integration with execute_turn flow
    - Frontend-heavy

14. **Database migration (in-memory → SQLite/Postgres)**
    - `game_sessions = {}` is in-memory
    - All state lost on restart
    - Consider SQLAlchemy + SQLite for simplicity

15. **OpenRouter prompt engineering**
    - Currently uses `openchat/openchat-7b`
    - Could use better model (claude-3-haiku)
    - Test other models for Chinese-language quality

16. **CI: add mypy + ruff**
    - Type checking on Python
    - Linting on Python

17. **CI: add frontend lint**
    - ESLint on assets/js
    - Currently no JS linting

---

## Effort Estimates

| Priority | Total Tasks | Estimated Days |
|----------|-------------|----------------|
| P0 | 3 | 2-3 |
| P1 | 4 | 5-8 |
| P2 | 5 | 3-5 |
| P3 | 5 | 10-15 |

**Total remaining work**: ~3-6 weeks of focused effort.

---

## Recommended Next Round (R9)

**Focus**: P0 #1 + #2 (decouple feedback + refactor turn_executor)

Estimated 2-3 hours:
1. Add `cross_scenario_analyzer` parameter to `generate_advanced_feedback` (and others)
2. Update start.py execute_turn to pass the global
3. Un-skip the 4 tests
4. Extract 12 turn_executor branches into separate functions
5. Add unit tests for each branch

After R9:
- Test count: 169 → ~210
- start.py: 686 → ~650
- turn_executor.py: 505 → ~250
- Coverage: 66% → ~75%

---

## Open Questions for Product Owner

1. **Database**: Should game sessions persist across restarts?
   - Current: in-memory `game_sessions = {}` (lost on restart)
   - Effort to add SQLite: ~2 days

2. **Train 4-stage depth**: Priority?
   - Currently advertised in Dörner alignment docs
   - Implementation is frontend-only (training-stage-tracker.js)
   - Needs product decision: integrate or deprecate?

3. **Other 8 archived scenarios**: Restore or keep frozen?
   - archived-scenarios/ has 674 tracked files
   - Restore: ~3-4 weeks
   - Keep frozen: 0 weeks (already done)

4. **CI cost**: Currently using ~3min per push (pytest + E2E)
   - Codecov adds cost if upgrading
   - E2E with --workers=1 adds time

5. **v3.5 → v4.0 release**: When?
   - Currently 8 rounds in, planning R9-R13
   - v4.0 scope: P0+P1 complete + at least 1 P3 feature
