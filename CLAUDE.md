# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Failure Logic is a cognitive bias education interactive game platform based on Dietrich Dörner's "The Logic of Failure" theory. The platform provides a safe environment for users to experience and learn about cognitive biases through interactive decision-making scenarios.

**Tech Stack:**
- **Frontend**: Vanilla JavaScript (ES6+), PWA with Service Worker
- **Backend**: Python FastAPI (port 8000/8082)
- **Testing**: Playwright E2E tests
- **Deployment**: GitHub Pages (frontend), Render.com (backend)

## Common Development Commands

### Backend API Server

```bash
# Start API server on default port 8000
python api-server/start.py

# Start on custom port
PORT=9000 python api-server/start.py

# Start with health check (recommended)
python api-server/launch_server.py

# Install test deps
pip install -r api-server/requirements-test.txt

# Run backend tests (from repo root)
pytest
pytest -v  # verbose
pytest api-server/logic/test_pattern_tracker.py  # specific
pytest -v  # verbose output
pytest logic/test_cognitive_bias_analysis.py  # specific test file
```

### Frontend Development

```bash
# Serve frontend at port 3000 (from tests/ directory)
cd tests
npx serve -l 3000 ..

# The frontend is a static SPA - just open index.html directly in browser
# Or use any static file server: python -m http.server 3000
```

### E2E Testing

```bash
cd tests

# Install dependencies (first time only)
npm install
npx playwright install

# Run all tests
npm test
# or: npx playwright test

# Run specific test suites
npm run test:api      # API integration tests
npm run test:scenarios # Scenario interaction tests
npm run test:load     # App loading tests

# Run tests in UI mode
npm run test:ui
# or: npx playwright test --ui

# Run tests in debug mode
npm run test:debug
# or: npx playwright test --debug

# Run tests headed (see browser)
npm run test:headed

# View test reports
npm run test:report
# or: npx playwright show-report
```

### Python Backend Tests

```bash
cd api-server/logic
pytest test_cognitive_bias_analysis.py -v
pytest test_exponential_calculations.py -v
```

## Architecture

### Frontend-Backend Communication

The application uses a **multi-source API fallback system** for reliability:

1. **Development**: `http://localhost:8000`
2. **Production** (in priority order):
   - Primary: `https://failure-logic-api.onrender.com` (Render)
   - Backup: Railway (token expired) → Codespaces (legacy)

**Key Files:**
- `assets/js/api-config-manager.js` - API source management with health checks and automatic failover
- `assets/js/app.js` - Main frontend application logic

### Backend Structure

```
api-server/
├── start.py              # Main FastAPI application entry point (~1640 lines, 2026-09-03)
├── launch_server.py      # Server launcher with health monitoring
├── server_runner.py      # Direct uvicorn launcher
├── debug_server.py       # Debug-mode launcher (full tracebacks)
├── endpoints/            # API route handlers
│   ├── cognitive_tests.py      # Cognitive bias test endpoints
│   ├── interactive.py          # LLM-driven interactive endpoints
│   └── test_results.py         # Test result endpoints (mock data)
├── logic/                # Core business logic
│   ├── cognitive_bias_analysis.py       # Bias detection
│   ├── enhanced_cognitive_bias_detection.py  # Advanced bias detection
│   ├── exponential_calculations.py      # Exponential/compound calcs (R2.3 restored)
│   ├── compound_interest.py             # Compound interest (R2.3 restored)
│   ├── pattern_tracker.py               # Decision pattern tracker (R2.1 extracted)
│   └── feedback_system.py               # Feedback generation
├── models/               # Pydantic data models
├── data/                 # Static scenario/test data (JSON)
│   └── scenarios.py             # BASE_SCENARIOS list (R2.3 restored)
├── loaders/              # Scenario data loading mechanisms (R2.3 restored)
│   └── scenario_loader.py
└── utils/                # Error handlers and utilities
```

### Game Flow Architecture

1. **Scenario Selection** (`/scenarios/`) - Lists available cognitive training scenarios
2. **Session Creation** (`POST /scenarios/create_game_session`) - Creates game session with difficulty level
3. **Turn Execution** (`POST /scenarios/{game_id}/turn`) - Processes user decisions
4. **Feedback Generation** - Real-time cognitive bias detection and personalized feedback

### Cognitive Bias Detection System

The platform implements a **multi-stage feedback system**:

- **Turns 1-2**: Create confusion (show results without revealing biases)
- **Turn 3**: Reveal cognitive biases with evidence
- **Turns 4+**: Advanced personalized insights with pattern tracking

**Key Classes:**
- `DecisionPatternTracker` - Tracks user decision patterns across turns
- `CrossScenarioAnalyzer` - Analyzes biases across multiple scenarios
- `EnhancedCognitiveBiasAnalyzer` - Advanced bias detection with confidence scoring

### Scenario Data Model

Each scenario supports **three difficulty levels**:
- `beginner` - Basic cognitive traps
- `intermediate` - Adds exponential growth and time value concepts
- `advanced` - Complex systems with network effects and cascading failures

Scenarios are loaded from:
- Hardcoded base scenarios in `start.py`
- JSON files: `game_scenarios.json`, `advanced_game_scenarios.json`, `historical_cases.json`

## Key Development Patterns

### Adding a New Scenario

1. Add scenario definition to `api-server/data/game_scenarios.json` or define in `start.py`
2. Implement game logic in `execute_real_logic()` function in `start.py`
3. Add feedback generation in `generate_real_feedback()` function
4. Test scenario in E2E tests in `tests/e2e/scenarios-interaction.spec.js`

### Adding New Cognitive Bias Detection

1. Add bias type to `api-server/logic/enhanced_cognitive_bias_detection.py`
2. Implement detection logic in `analyze_cognitive_bias_patterns()`
3. Add test cases in `logic/test_cognitive_bias_analysis.py`
4. Update feedback generation to reference new bias

### API Error Handling

All API endpoints use the global exception handler from `utils/error_handlers.py`:
- `CustomException` for business logic errors
- `@handle_calculation_errors` decorator for calculation functions
- Safe numeric operations with `safe_numeric_operation()`

## Testing Strategy

### E2E Tests (Playwright)

- **Test Directory**: `tests/e2e/`
- **Configuration**: `tests/playwright.config.js`
- **Coverage**: API integration, app loading, scenario interaction, bias diagnosis

The Playwright config starts both:
- Backend server on port 8000 (`python api-server/start.py 8000`)
- Frontend server on port 3000 (`npx serve -l 3000 ..`)

### Backend Tests (Pytest)

- **Test Directory**: `api-server/logic/test_*.py`
- **Coverage**: Cognitive bias analysis, exponential calculations, enhanced detection

## Deployment

### GitHub Pages (Frontend)

- Static files deployed from repository root
- PWA manifest: `manifest.json`
- Service worker: `sw.js` (for offline support)

### Backend (Render)

- Primary: Render.com at `https://failure-logic-api.onrender.com` (since 2026-08-15)
- Migrated from Railway (token expired) → Render Blueprint

The frontend automatically routes API requests via `assets/js/api-config-manager.js`.

## Important Notes

- **API Port Configuration**: Backend defaults to port 8000 (Dockerfile + unified across all launchers in 2026-09-03). Override with `PORT` env var.
- **PWA Support**: The app is installable as a PWA. Ensure `manifest.json` and service worker registration remain functional when modifying frontend.
- **Cross-Origin Issues**: The backend has CORS enabled for all origins during development. Adjust for production.
- **Difficulty Levels**: When creating game sessions, always pass the `difficulty` parameter to ensure proper scenario scaling.
- **Decision Pattern Tracking**: Each game session maintains its own `DecisionPatternTracker` instance for personalized feedback.

## Security Practices (for AI Tools)

AI assistants (Claude Code, Doubao, etc.) working in this repo must follow these rules. They protect tokens from leaking into chat logs, screenshots, or commits.

- **Never read or quote credentials.** `.env`, `.git-token`, and any `*credentials*` / `*.pem` file contains secrets. Do not `Read`, `cat`, `echo`, or paste their contents into chat.
- **Suggest commands via env var references.** Use `$env:GH_TOKEN` / `$env:GITEE_TOKEN` in suggested commands, never literal token values.
- **Wrap auth commands with `scripts/with-token.ps1`** for ad-hoc work, or **use the `git-platform-ops` skill** (`scripts/git-platform-ops.ps1`) for structured push/PR/issue operations. Both load tokens from `.git-token` (gitignored) into the spawned process without exposing them.
  ```powershell
  .\scripts\with-token.ps1 -Run "git push origin main"           # ad-hoc
  .\scripts\git-platform-ops.ps1 -Action push                    # structured
  .\scripts\git-platform-ops.ps1 -Action pr-create -Title "..."  # structured
  ```
- **Minimum token scopes when generating new ones:**
  - GitHub: Fine-grained PAT, single repo, Contents: Read+Write only, 7-day expiry
  - Gitee: Personal Token, `projects` scope only, 7-day expiry
- **If a token is exposed** (chat log, screenshot, commit, public file): stop work, revoke it at the issuer's settings page, regenerate, and audit access logs.

## Agent Skills Available

- **`git-platform-ops`** (auto-loaded for this repo) — preferred for push, PR, and issue operations. See `.claude/skills/git-platform-ops/SKILL.md`. Both PowerShell (`scripts/git-platform-ops.ps1`) and Bash (`scripts/git-platform-ops.sh`) versions available. Subcommands: `auth-gh`, `auth-status`, `info`, `push`, `pr-create`, `pr-list`, `pr-status`, `pr-wait`, `issue-create`, `issue-list`.
- **`publish-ops`** — Docker build/push and npm publish with token injection from `.git-token`. Wrapper: `scripts/publish-ops.{ps1,sh}`. Subcommands: `docker-build`, `docker-push`, `npm-publish`. Use the same security model as `git-platform-ops`.
- For non-Claude agents (Doubao, etc.), point them at `docs/agent-skill-git-platform-ops.md` before any git auth operation.
