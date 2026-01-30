# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Failure Logic is a cognitive bias education interactive game platform based on Dietrich Dörner's "The Logic of Failure" theory. The platform provides a safe environment for users to experience and learn about cognitive biases through interactive decision-making scenarios.

**Tech Stack:**
- **Frontend**: Vanilla JavaScript (ES6+), PWA with Service Worker
- **Backend**: Python FastAPI (port 8000/8082)
- **Testing**: Playwright E2E tests
- **Deployment**: GitHub Pages (frontend), GitHub Codespaces (backend)

## Common Development Commands

### Backend API Server

```bash
# Start API server on default port 8000
python api-server/start.py

# Start on custom port
python api-server/start.py 8082

# Start with health check (recommended)
python api-server/launch_server.py

# Run backend tests
cd api-server
pytest
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

1. **Development**: `http://localhost:8000` (or 8082)
2. **Production** (in priority order):
   - Primary: `https://psychic-meme-rvq4v7pqwx3xxrr-8000.app.github.dev` (Codespaces)
   - Backup: `https://turbo-rotary-phone-pq4jq7pvr7f6jxx-8000.app.github.dev`
   - Fallback: Vercel deployments

**Key Files:**
- `assets/js/api-config-manager.js` - API source management with health checks and automatic failover
- `assets/js/app.js` - Main frontend application logic

### Backend Structure

```
api-server/
├── start.py              # Main FastAPI application entry point
├── launch_server.py      # Server launcher with health monitoring
├── endpoints/            # API route handlers
│   ├── cognitive_tests.py      # Cognitive bias test endpoints
│   ├── scenarios.py            # Game scenario endpoints
│   └── test_results.py         # Test result endpoints
├── logic/                # Core business logic
│   ├── cognitive_bias_analysis.py      # Bias detection algorithms
│   ├── exponential_calculations.py     # Exponential growth calculations
│   ├── enhanced_cognitive_bias_detection.py  # Advanced bias detection
│   └── feedback_system.py       # Feedback generation logic
├── models/               # Pydantic data models
├── data/                 # Static scenario/test data (JSON)
│   ├── game_scenarios.json
│   ├── historical_cases.json
│   └── exponential_questions.json
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

### Backend (Codespaces/Vercel)

- Primary: GitHub Codespaces at `https://psychic-meme-rvq4v7pqwx3xxrr-8000.app.github.dev`
- Backup: Vercel deployment

The frontend automatically routes API requests based on hostname via `api-config-manager.js`.

## Important Notes

- **API Port Configuration**: The API uses port 8000 by default, but 8082 is also supported. Check `launch_server.py` for the active port.
- **PWA Support**: The app is installable as a PWA. Ensure `manifest.json` and service worker registration remain functional when modifying frontend.
- **Cross-Origin Issues**: The backend has CORS enabled for all origins during development. Adjust for production.
- **Difficulty Levels**: When creating game sessions, always pass the `difficulty` parameter to ensure proper scenario scaling.
- **Decision Pattern Tracking**: Each game session maintains its own `DecisionPatternTracker` instance for personalized feedback.
