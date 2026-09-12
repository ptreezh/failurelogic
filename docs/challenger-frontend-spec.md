# Challenger Frontend Integration — Spec + Grill-Down

> Goal: Real users can play Challenger end-to-end in browser with excellent UX.
> Scope: Items 2b (decision justification UI) + 4 (CSS state polish) from
> `docs/challenger-v2.1-execution-plan.md`, plus 2b-adjacent work needed to
> actually deliver Challenger turns (router, 4-option picker, dispatcher).
>
> Frontend **can use** existing assets already shipped in app.js:
> - `challenger-state-grid` HTML/CSS at line 9299+ (state visualization done)
> - `challenger` thumbnail + description in scenarios grid (line 599)
> - `ScenarioIllustrations` for scenarios (line 2326)
> - coffee-shop bias diagnosis engines (could be reused conceptually)

## Current State Audit

Read this BEFORE designing. Verified via grep + line inspection on
2026-09-12:

| Component | Status | Evidence |
|-----------|--------|----------|
| `challenger-launch` registered in BASE_SCENARIOS | DONE | start.py:174 |
| `GET /scenarios/` lists challenger | DONE | e2e verified (audit-scenario-depth doc) |
| `POST /scenarios/create_game_session?scenario_id=challenger-launch` | DONE | same |
| `POST /scenarios/{id}/turn` body `{option: "A"|"B"|"C"|"D", justification?: "..."}` | DONE | contract stable |
| Challenger engine (apply_turn, F1-F8 detectors, reveal feedback, outcomes) | DONE | 42 pytest assertions pass |
| `escape_justification()` for XSS | DONE | tests pass |
| **Frontend Challenger router** | **MISSING** | no `challenger-router.js` file |
| **Frontend 4-option picker** | **MISSING** | renderDecisionPage is coffee-shop-specific |
| **Frontend scenario-type dispatcher** | **MISSING** | all paths go through coffeeShopRouter |
| **Frontend justification textarea** | **MISSING** | no UI element exists |
| CSS state visualization for Challenger | PARTIAL | grid exists, but `display:none` is hardcoded |
| **Session persistence (P1-1)** | **MISSING** | in-memory dict only |
| **Session resume UX** (in-memory loss = user sees "session expired") | **MISSING** | |

## What the user actually needs

A user opens browser → clicks Challenger card → reads T1 situation → picks
A/B/C/D → writes 1-2 sentence justification → sees T1 feedback → T2 state
updated (engineer_confidence drops, schedule_pressure rises, etc.) →
T2 situation → T3 pattern reveal → T6 reveal card → ... → T10 outcome
narrative (1985 字 disaster OR 416 字 infinite delay OR 248 字 last-min eval).

This is ~200-400 lines of new frontend code (router + UI) plus
~50 lines of session-persistence backend code.

## Architecture — Render Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (single SPA)                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Scenario Dispatcher  (ScenarioRouter)                     │  │
│  │  ├─ coffee-shop  → CoffeeShopRouter (existing)             │  │
│  │  ├─ challenger   → ChallengerRouter  (NEW)                 │  │
│  │  └─ other       → generic router (existing)                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ChallengerRouter (NEW)                                     │  │
│  │  - Turn N page → 4-option buttons + justification textarea  │  │
│  │  - State grid: toggle display from currentScenario.id     │  │
│  │  - Feedback page → render rich feedback (already in API)    │  │
│  │  - Pattern reveal page (turn 6) → render with bold          │  │
│  │  - Outcome page (turn 10) → render with student names     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↓ HTTP                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  FastAPI Backend (existing, contract stable)                │  │
│  │  - /scenarios/ (GET)         — unchanged                    │  │
│  │  - /scenarios/{id} (GET)     — unchanged                    │  │
│  │  - /scenarios/create_game_session (POST)                   │  │
│  │  - /scenarios/{game_id}/turn (POST) {option, justification}│  │
│  │  + NEW: SessionPersistenceLayer (writes tmp/sessions/*.json)│  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Decision Tree — What Goes in ChallengerRouter?

```
For each turn T (1..10):
  ┌─ Fetch /scenarios/{game_id}/turn POST {option, justification}
  │  (server returns {state, feedback, turnNumber, ...})
  │
  ├─ Render state grid (toggle visible for challenger scenario)
  │   - Update each <span id="state-X"> with state.X from response
  │   - Highlight changes: brief CSS class swap (state-changed flash)
  │
  ├─ Render feedback card with:
  │   - feedback text (already contains pattern reveal at T6, outcome at T10)
  │   - "next turn" button
  │   - If T6 (is_pattern_reveal): bold the bias name + reflection Q's
  │
  ├─ Render decision UI for next turn (T+1):
  │   - situation text from /scenarios/{id}?turn=T+1 (NEW endpoint, OR
  │     client-side from step data already returned with current turn)
  │   - 4 option buttons A/B/C/D
  │   - Justification textarea (1-2 sentences, optional)
  │   - "Submit" button → POST turn with {option: chosen_id, justification}
  │
  └─ State persistence: after every successful POST turn, save snapshot
     to localStorage keyed by session_id (for crash recovery BEFORE the
     backend persists).
```

## Key Design Decisions

### D1: Where does step text (situation + options) come from?

**Option A**: Server returns step data inside turn response.
**Option B**: New `GET /scenarios/{scenario_id}/step/{turn_number}` endpoint.
**Option C**: Frontend gets step data once at session creation.

**Pick: B** (new endpoint). Reasons:
- Single-responsibility: state endpoint for state, step endpoint for steps
- Frontend can prefetch next step during current turn's "thinking time"
- Backend can return current + next step in one turn response (saves a
  roundtrip; lower latency)

**Implementation**:
- New endpoint: `GET /scenarios/{scenario_id}/step/{turn_number}` → returns `{turn, phase, situation, options: [{id, text, weight, expected_concerns_addressed}]}`
- Modify turn response to include `_next_step` field (optional, saves 1 RTT)

### D2: Justification UI

**Requirement**: player can write 1-2 sentences explaining WHY they picked
this option. Optional but encouraged (reveal feedback in later turns
references justifications if present).

**Design**:
- Textarea shown AFTER player clicks an option, BEFORE submitting
- 200-char max (matches backend's `escape_justification(200)` cap)
- Placeholder: "为什么选这个?（可选，提升反思深度）"
- Show char counter `145/200`
- Submit button reads "提交决定" (Submit Decision)
- Skip button (no justification) — show only if textarea is empty

**Privacy**: justification is sent to backend, stored in
`decision_justifications`. Backend sanitizes via `escape_justification`
which already handles XSS. No frontend sanitization needed.

### D3: Visual feedback during state change

After submitting turn, the response state has changes (e.g.,
`engineer_confidence: 75 → 65`). User should SEE the change.

**Design**:
- Each `<span class="state-value" id="state-X">` gets a class swap
- If new value < old value → `.state-decreased` (red flash, 500ms)
- If new value > old value → `.state-increased` (green flash, 500ms)
- Implementation: `applyTurnResponse()` compares prev state to new state,
  applies class on changed spans, removes class after animation ends

### D4: Pattern reveal (T6) and outcome (T10) styling

- T6 feedback contains "Dörner 模式揭示" header + bias name + reflection Q's.
  CSS class `.pattern-reveal-card` for visual emphasis (red accent border,
  larger text, icon ⚠️).
- T10 feedback contains outcome narrative. CSS class `.outcome-card`:
  - launch_disaster → red banner + "73 秒" timeline visualization
  - infinite_delay → green banner + "你改变了 NASA 决策文化" message
  - last_minute_evaluation → amber banner + "turn 11 即将到来" prompt

### D5: Session persistence (P1-1)

**Pick: combination of client-side localStorage + lightweight server
snapshot to tmp/sessions/.** Reasons:

- localStorage is instant, handles "browser refresh mid-session"
- tmp/sessions/ snapshot handles "server restart" (Render redeploy)
- Both together: zero data loss in 99% of scenarios

**Server side**:
- New module: `api-server/sessions_store.py`
- Stores sessions as JSON files in `tmp/sessions/<game_id>.json`
- Lifecycle: write on every turn, evict after 24h idle, load on startup
- Failure mode: if disk write fails, log + continue (in-memory still works)

**Client side**:
- After successful POST turn, write `localStorage["challenge-snapshot-<game_id>"]`
  = `{turn, decisions, state, ts}`
- On page load, check localStorage for any uncommitted snapshots
- If found, prompt user: "恢复未完成的对局?" → POST replay decisions

### D6: Decision option display

For Challenger, options are A/B/C/D with text. CSS to make them
visually scannable:

```css
.challenger-option {
  padding: 12px 16px;
  border: 2px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.challenger-option:hover {
  border-color: var(--primary);
}
.challenger-option.selected {
  border-color: var(--primary);
  background: var(--primary-tint);
}
.challenger-option .weight-risky { color: var(--danger); }
.challenger-option .weight-safe { color: var(--safe); }
.challenger-option .weight-neutral { color: var(--neutral); }
```

Show each option's weight as a small tag (per spec 2.1: extreme_safe /
safe / neutral / risky / extreme_risk) so user can self-pace.

### D7: What feedback does frontend render?

Backend returns:
```json
{
  "success": true,
  "turnNumber": 7,
  "feedback": "🌡️ 预报温度... ⚠️ ...",
  "game_state": {...},
  "immediate_response": {...}
}
```

Frontend renders `feedback` as Markdown-lite (already formatted in backend).
Optional: render the personalized bias report from `immediate_response`.

Backend's feedback is already Dörner-aware (verified by pytest + e2e).
No transformation needed in frontend.

## Implementation Order (TDD-driven)

| Step | Test | Implementation | Commit |
|------|------|----------------|--------|
| 1 | `test_scenario_router_dispatches_challenger` | ScenarioRouter maps `challenger-launch` → ChallengerRouter | step1 |
| 2 | `test_challenger_router_renders_options` | ChallengerRouter renders 4 option buttons + textarea | step2 |
| 3 | `test_challenger_submits_with_option` | Submit handler POSTs to /turn with {option, justification} | step3 |
| 4 | `test_challenger_updates_state_after_turn` | State grid span text updates from response.game_state | step4 |
| 5 | `test_challenger_state_change_animation` | CSS class swap based on value delta | step5 |
| 6 | `test_pattern_reveal_T6_styled` | Detect T6 feedback, apply .pattern-reveal-card class | step6 |
| 7 | `test_outcome_T10_styled` | Detect T10 feedback, apply .outcome-card variant class | step7 |
| 8 | `test_session_save_to_localStorage` | After successful POST turn, save snapshot | step8 |
| 9 | `test_session_resume_prompt` | On page load, find uncommitted snapshots, prompt user | step9 |
| 10 | `test_server_persistence_tmp_sessions` | api-server writes JSON to tmp/sessions/, reads on startup | step10 |

Backend work in same loop:

| Step | Test | Implementation | Commit |
|------|------|----------------|--------|
| B1 | `test_step_endpoint_returns_scenario_step` | New endpoint GET /scenarios/{scenario_id}/step/{turn_number} | b1 |
| B2 | `test_session_persistence_save_and_load` | sessions_store.py saves/loads sessions | b2 |
| B3 | `test_session_eviction_after_idle` | Sessions >24h old are evicted on next startup | b3 |

## Grill-Down — Pre-implementation sanity check

> Adversarial review of the spec above. Catch problems BEFORE writing code.

### G1: What if user closes the tab during T5 (mid-reveal)?
- localStorage is flushed on `beforeunload` event
- Server snapshot already written (every turn persists)
- Next visit: server has session at T5; client restores from localStorage
  showing T5 with feedback ready, prompts "继续?"

### G2: What if the network drops mid-turn submission?
- POST /turn fails → frontend shows error, retains the option selection
  and justification text. User retries without re-entering.
- After rate-limit hit (429), frontend shows "rate limited, wait 30s" and
  re-enables submit button after backoff.

### G3: What about coffee-shop or other scenario — does this change break them?
- ScenarioRouter dispatch is ADDITIVE: new branches for challenger only.
- Existing coffee-shop router unchanged.
- CSS additions scoped to `.challenger-*` classes — won't affect coffee-shop.
- localStorage writes use scenario-namespaced keys (`challenge-snapshot-<game_id>`),
  no conflict with other features.

### G4: Should justification be REQUIRED?
- Backend treats it as optional (currently).
- Some users may want to skip.
- UI: show textarea but make it optional (Submit button enabled with or
  without justification). User can dismiss textarea to hide it.

### G5: How do I test against the real backend?
- Start backend via subprocess (same pattern as subprocess smoke tests)
- Use Python http.client or `urllib.request` to POST real turns
- Assert response shape and state evolution
- This catches contract regressions the pytest unit tests miss

### G6: What about the `challenger-state-grid` already in HTML but `display:none`?
- Currently hidden because no router sets it visible
- New code in `ScenarioRouter.renderDecisionUI()` will:
  ```js
  if (this.currentScenario.id.startsWith('challenger-')) {
    $('#challenger-state-grid').style.display = 'grid';
    $('#legacy-state').style.display = 'none';
  } else {
    // existing coffee-shop behavior
  }
  ```

### G7: What about multi-scenario UX (user has Challenger + coffee-shop
sessions active)?
- Each session_id is unique; localStorage is keyed by session_id
- Scenarios page shows all 30 scenarios independently; clicking one
  creates new session. No cross-session state leaks.

### G8: Why a NEW router file instead of extending page-router-base.js?
- The existing routers are scenario-specific (CoffeeShopRouter,
  HistoricalCasesRouter, etc.) — pattern is to have a router per scenario
- Consistency with existing code
- Smaller commit, easier to review

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|-----------|
| localStorage quota (~5MB) | Low | Session snapshots ~5KB. 1000 sessions fit. |
| Server tmp/sessions/ cleanup | Medium | Cron + 24h TTL eviction |
| Frontend breaks coffee-shop | Medium | Scoped CSS + router pattern (additive) |
| rate-limit + multi-tab | Low | Per-IP limit; user with 2 tabs shares limit |
| Render restart loses tmp/sessions/ on container | Low | tmp/ is ephemeral by design; documented in plan |

## Definition of Done

- [ ] Backend: new endpoint + session store + tests (15+ pytest assertions)
- [ ] Frontend: ChallengerRouter.js (~300 lines) wired into ScenarioRouter
- [ ] E2E: live test confirms a user can play 10 turns in browser
- [ ] CSS: state change animations + pattern/outcome cards styled
- [ ] Session persistence: tab refresh resumes, server restart resumes
- [ ] All 136 existing tests still pass
- [ ] 5+ new tests for the integration
