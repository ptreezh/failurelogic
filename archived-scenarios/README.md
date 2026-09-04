# archived-scenarios/

⚠️ **This directory is FROZEN historical content.**

## What it is

In **August 2026** the project underwent a major strategic pivot:
- **Before**: 9 cognitive-bias scenarios (coffee-shop, relationship,
  investment, business strategy, public policy, personal finance,
  climate change, AI governance, financial crisis)
- **After**: 1 deep benchmark scenario (coffee-shop-deep) + 9-round
  Dörner alignment iteration

The 8 retired scenarios, along with their diagnostic scripts, test
reports, and ad-hoc validation utilities, were moved into this
directory to preserve git history and document past decisions.

## Why it stays in git

- **Historical reference**: prior implementation approaches are
  useful when planning future work
- **Knowledge extraction**: many insights in
  `ACTIONABLE_KNOWLEDGE_EXTRACTION.md` came from this code
- **Audit trail**: reviewers can see what was tried and why it
  was retired

## Status

- **Not shipped**: `scripts/prepare-pages.sh` excludes this entire
  directory from GitHub Pages artifact (R2.5)
- **Not built**: `Dockerfile` and `nixpacks.toml` only install
  `api-server/`, not this directory
- **Not tested**: pytest targets `api-server/logic/` only; no test
  in this directory runs
- **Not referenced**: no active code in `api-server/`, `assets/`,
  `index.html`, or `.github/workflows/` imports from this path

## How to add new content here (rarely needed)

If you need to preserve new historical code:
1. Add it under a clear subdirectory with a README explaining
   what it is and why it's retired
2. Do NOT add it to `tests/` or anywhere pytest scans
3. Do NOT reference it from active code

## How to retrieve archived code

Code here is in git history but currently active. To use it:
1. Find the file: `git log --all -- "archived-scenarios/path/to/file"`
2. Copy out: `cp archived-scenarios/path/to/file.py api-server/logic/`
3. Add tests before integrating

## Last updated

2026-09-04 (R6.2 cleanup pass — added this README)
