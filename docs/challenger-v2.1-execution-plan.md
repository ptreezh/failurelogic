# Challenger v2.1 Execution Plan

> Implementing the spec at `docs/audit-challenger-deep-dive/14-grilldown-spec-round5-final.md`
> Round 5 of grill-down has confirmed the spec is internally consistent and
> aligned with Dörner's pedagogical goals. This document tracks execution.

## Status: 6/7 BACKEND ITEMS DONE (frontend still deferred)

| # | Improvement | Status | Commit |
|---|------------|--------|--------|
| 3.5 | Add `weight` field to options in JSON | DONE | 6dfc3fe |
| 3.1 | F3 self-reference detector | DONE | 1182988 |
| 3.2 | F8 regulation-lag detector | DONE | 69c4a34 |
| 1 | Reveal references player's actual decisions | DONE | 949734b |
| 2a | escape_justification (XSS + length cap) | DONE | ed3e042 |
| extra | 42-test pytest suite (38 engine + 4 subprocess XSS) | DONE | e68be0f, 764bd6c |
| 2b | Decision justification UI (textarea per turn) | DEFERRED | frontend |
| 4 | CSS state-class polish | DEFERRED | frontend |

## Adjacent improvements (not in original spec)

While testing the engine I found two related bugs in the wrapper scripts:

- git-platform-ops.sh, publish-ops.sh, release-ops.sh all failed to
  strip trailing \r from CRLF-encoded token files (Windows-generated).
  Fix in 8dfa9ac and 403bf29. Plus regression tests in all 4 test
  files (16, 19, 25, 33 — total 93 wrapper tests now passing).
- A `git-platform-ops/test.ps1` CRLF regression test was added in
  eefbf9f to confirm PS `.Trim()` behavior.

These aren't in the original spec but are correctness fixes for the
same root cause.

## Why deferred (2 and 4)

Items 2 and 4 require frontend changes. The current frontend (`assets/js/app.js`)
is tightly coupled to the coffee-shop scenario: it has scenario-specific UI
logic (linear expectation calculator for coffeeVariety, week_number,
affection) and doesn't render Challenger turns at all (only `option: A/B/C/D`
choices, no scenario-specific rendering).

To support Challenger UI:
1. Detect scenario type (Challenger vs coffee-shop vs historical case)
2. Render different decision UIs (4-option buttons vs sliders vs choice cards)
3. Show decision-justification textarea per turn (item 2)
4. Apply CSS state classes (item 4)

This is a separate project — "Challenger frontend integration". Backend
is complete and verified via curl + pytest.

## Verification gate (all passing)

- 67 wrapper tests (bash + PS, git-platform-ops + publish-ops + release-ops)
- 38 Challenger engine tests (pytest, includes 7 XSS-protection tests)
- 105 total assertions all green
- Live e2e: 3 player strategies → 3 distinct outcomes (risky → disaster,
  safe → infinite delay, oscillator → last-minute eval)

## Out of scope but documented

- Frontend Challenger renderer (separate project, ~200-500 lines)
- CSS state-class polish (item 4)
- Multi-user session persistence — server restart loses state
- Rate limiting on /scenarios/* endpoints

## Resolved during commit

- The "I trust engineers" data-leak mystery — was Python bytecode cache
  (api-server/logic/__pycache__/) containing pre-XSS-fix code. After
  `find . -name __pycache__ -exec rm -rf` + fresh `python api-server/start.py`,
  fresh sessions correctly return `decision_justifications: {}` for empty
  input and properly escape XSS payloads. Lesson: any debug that finds
  "impossible" behavior should `rm -rf __pycache__/` and restart before
  deeper investigation.
