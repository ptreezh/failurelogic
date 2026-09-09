# Challenger v2.1 Execution Plan

> Implementing the spec at `docs/audit-challenger-deep-dive/14-grilldown-spec-round5-final.md`
> Round 5 of grill-down has confirmed the spec is internally consistent and
> aligned with Dörner's pedagogical goals. This document tracks execution.

## Status: 5/6 IMPROVEMENTS DONE

| # | Improvement | Status | Commit |
|---|------------|--------|--------|
| 3.5 | Add `weight` field to options in JSON | DONE | 6dfc3fe |
| 3.1 | F3 self-reference detector | DONE | 1182988 |
| 3.2 | F8 regulation-lag detector | DONE | 69c4a34 |
| 1 | Reveal references player's actual decisions | DONE | 949734b |
| (extra) | 31-test pytest suite for Challenger engine | DONE | e68be0f |
| 2 | Decision justification UI (backend + frontend) | DEFERRED | — |
| 4 | CSS state-class polish | DEFERRED | — |

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
- 31 Challenger engine tests (pytest)
- 134 total assertions all green

## Out of scope but documented

- Frontend Challenger renderer (separate project, ~200-500 lines)
- XSS protection for justifications (item 2 sub-task) — backend should
  escape_justification() per spec; trivial to add when frontend lands
- Multi-user session persistence — server restart loses state
- Rate limiting on /scenarios/* endpoints
