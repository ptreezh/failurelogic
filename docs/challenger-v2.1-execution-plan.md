# Challenger v2.1 Execution Plan

> Implementing the spec at `docs/audit-challenger-deep-dive/14-grilldown-spec-round5-final.md`
> Round 5 of grill-down has confirmed the spec is internally consistent and
> aligned with Dörner's pedagogical goals. This document tracks execution.

## Status: STARTING

| # | Improvement | Status | Commit |
|---|------------|--------|--------|
| 3.5 | Add `weight` field to options in JSON | TODO | — |
| 3.1 | F3 self-reference detector | TODO | — |
| 3.2 | F8 regulation-lag detector | TODO | — |
| 1 | Reveal references player's actual decisions | TODO | — |
| 2 | Decision justification UI (backend + frontend) | TODO | — |
| 4 | CSS state-class polish | TODO | — |

## Execution order (per spec round 5)

1. Add `weight` field to all options in challenger_launch.json (data change,
   no logic impact — but F3/F8 detectors depend on it)
2. F3 detector (uses `expected_concerns_addressed`.includes('management') while
   'engineering' warnings are recent — i.e., dissent suppression)
3. F8 detector (uses weight field — alternating safe/risk = oscillation)
4. Reveal references player's choices (uses decision_history with new
   option_text/option_consequences fields stored by turn_executor update)
5. Decision justification UI: backend stores `justification` from POST
   body, frontend renders textarea per turn
6. CSS polish: replace inline color logic with .state-safe/.state-warning/
   .state-critical classes

## Per-step discipline (TDD)

- RED: write failing test
- GREEN: minimal impl to pass
- IMPROVE: refactor
- COMMIT: atomic

## Verification gate

After each improvement:
- All 134 wrapper tests still pass
- New behavior verified via curl against running backend
- Challenger 10-turn scenario produces expected feedback

## Risk register (per spec)

- Bug in detector thresholds → mitigated via conservative defaults
- Frontend breaks existing scenarios → run npm test:wrappers before commit
- Backend regression → restart + curl all 4 endpoints

## Open question: worktree?

Spec recommends worktree at `../failureLogic-v2.1`. Given that the
existing modified files (challenger_scenario.py, turn_executor.py,
start.py, app.js) are already on main, doing v2.1 in a worktree adds
friction. Direct commit on main is acceptable since each commit is
atomic and tested.
