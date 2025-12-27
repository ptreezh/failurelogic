# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## What this repo is
A static frontend (plain HTML/CSS/JS) served from the repo root, plus a FastAPI backend under `api-server/` that also mounts the static assets for local/dev use.

Key deploy entrypoints:
- **Vercel**: `vercel.json` routes all traffic to `api/index.py`, which imports the FastAPI app from `api-server/start.py`.
- **Procfile**: `uvicorn api-server.start:app ...` (useful for PaaS-style process launch).
- **GitHub Pages / Codespaces notes**: `DEPLOYMENT.md`.

## Common dev commands (Windows / PowerShell)

### Backend (FastAPI)
Install deps:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r api-server\requirements.txt
```

Run the API server (default port 8000):
```powershell
python api-server\start.py
```

Run the API server on a specific port:
```powershell
python api-server\start.py 8000
```

Alternative (matches `Procfile` style):
```powershell
python -m uvicorn api-server.start:app --host 0.0.0.0 --port 8000
```

API docs:
- `http://localhost:8000/docs`

Note on ports:
- `api-server/start.py` defaults to **8000**.
- The frontend’s JS config (`assets/js/app.js` and `assets/js/api-config-manager.js`) uses **localhost:8003** for “localhost” environments. If the UI can’t reach the backend locally, align these.

### Frontend (static)
There is no build step; the app lives in `index.html` + `assets/`.

Options to run it locally:
- Open `index.html` directly in a browser.
- Or serve the repo with a static server (useful for Playwright):

```powershell
npx serve -l 3000
```

### E2E tests (Playwright, Node)
Playwright test harness lives in `tests/` (separate `tests/package.json`).

Install:
```powershell
cd tests
npm install
npm run test:install
```

Run all Playwright tests:
```powershell
cd tests
npm test
```

Run a subset via provided scripts:
```powershell
cd tests
npm run test:api
npm run test:scenarios
npm run test:load
```

Run a single spec file:
```powershell
cd tests
npx playwright test e2e\app-load.spec.js
```

Run a single test by name:
```powershell
cd tests
npx playwright test e2e\app-load.spec.js -g "should load the main page successfully"
```

Notes:
- `tests/playwright.config.js` defines `webServer` commands that start the backend (`cd api-server && python start.py 8000`) and a static server (`npx serve -l 3000`).
- `baseURL` defaults to `http://localhost:8000` but can be overridden with `BASE_URL`.

### Python tests
There are Python test files under `tests/unit/` and some Python-based Playwright tests under `tests/e2e/`.

If `pytest` is available in your environment, typical runs are:
```powershell
python -m pytest tests\unit
python -m pytest tests\unit\test_exponential_logic.py
python -m pytest tests\unit -k "exponential"
```

## High-level architecture

### Frontend structure (static)
- `index.html`: primary UI shell, navigation, and DOM structure.
- `assets/js/app.js`: main client-side app state + navigation + API calls.
  - Uses `/scenarios/*` endpoints for scenario/game flows.
  - Maintains a user-selected difficulty and passes it to `create_game_session`.
- `assets/js/api-config-manager.js`: `APIConfigManager` that selects a base API URL, does retries/backoff, and periodically health-checks sources.
- `assets/css/*`: styling.
- `web-app/components/*`: standalone JS components for specific activities (e.g. `exponential-test.js`, `compound-test.js`, `interactive-game.js`). These call `/api/*` endpoints (see below).

### Backend structure (`api-server/`)
- `api-server/start.py`: **FastAPI app** and primary composition root.
  - Adds CORS.
  - Defines some scenario/game endpoints inline (notably `/scenarios/*`).
  - Includes routers from `api-server/endpoints/` (currently `cognitive_tests` and `test_results`).
  - Mounts static directories:
    - `app.mount("/assets", StaticFiles(directory="../assets"), ...)`
    - `app.mount("/web-app", StaticFiles(directory="../web-app"), ...)`
    - Also attempts to serve `../index.html` from `/`.
- `api-server/endpoints/`: API route modules.
  - `cognitive_tests.py`: `/api/*` endpoints for question lists, calculators, answer checks, and explanations.
  - `test_results.py`: `/api/test-results/*` endpoints (currently returns mocked/placeholder aggregates/exports).
  - Other endpoint modules exist (e.g. `scenarios.py`, `exponential_tests.py`) but `start.py` is the authority for what is actually registered.
- `api-server/logic/`: pure logic/calculation modules.
  - Examples: `exponential_calculations.py`, `compound_interest.py`, `cognitive_bias_analysis.py`.
- `api-server/models/`: Pydantic models for request/response shapes.
- `api-server/data/`: content/data sources.
  - JSON question banks: `exponential_questions.json`, `compound_questions.json`, `historical_cases.json`, `game_scenarios.json`.
  - Advanced variants: `advanced_*.json`.
  - `scenarios.py`: scenario metadata used by some routers.

### API surface (most used by the frontend)
- Scenario/game flow (used by `assets/js/app.js`):
  - `GET /scenarios/`
  - `GET /scenarios/{scenario_id}`
  - `POST /scenarios/create_game_session?scenario_id=...&difficulty=...`
  - `POST /scenarios/{game_id}/turn`
- Cognitive test APIs (used by `web-app/components/*`):
  - `GET /api/exponential/questions` (+ `include_advanced`)
  - `GET /api/compound/questions` (+ `include_advanced`)
  - `GET /api/historical/scenarios` (+ `include_advanced`)
  - `GET /api/game/scenarios` (+ `include_advanced`)
  - `POST /api/exponential/check-answer/{question_id}`
  - `POST /api/results/submit`
  - `GET /api/explanations/{bias_type}`

## Where to look first when changing behavior
- UI behavior / API calls / difficulty wiring: `assets/js/app.js` and `assets/js/api-config-manager.js`.
- Scenario/game mechanics: `api-server/start.py` (inline game logic + session state) and/or `api-server/logic/*`.
- Question banks and scenario content: `api-server/data/*.json`.
- Route definitions for cognitive tests: `api-server/endpoints/cognitive_tests.py` and `api-server/logic/*`.
