# api-server/ — Backend Module

> Last updated: 2026-09-04 (R10.2)

Cognitive-trap education platform backend. FastAPI + Python 3.12.

## Layout

```
api-server/
├── start.py                 # FastAPI app entry point (686 lines, post-R9)
├── server_runner.py         # uvicorn launcher (PORT env)
├── launch_server.py         # Server with health monitoring
├── debug_server.py          # Debug-mode launcher (full tracebacks)
├── requirements.txt         # Production deps (fastapi, uvicorn, pydantic)
├── requirements-test.txt    # Test deps (pytest, pytest-cov)
├── data/                    # Static scenario data
│   ├── scenarios.py         # 3 BASE_SCENARIOS (R2.3 restored)
│   └── scenarios/__init__.py (empty; reserved)
├── loaders/                 # Scenario data loaders
│   └── scenario_loader.py   # ScenarioLoader class (R2.3 restored)
├── endpoints/               # API route handlers
│   ├── cognitive_tests.py   # /api/exponential/*, /api/compound/*, /api/results/*
│   ├── interactive.py       # /api/interactive/* (LLM + keyword analysis)
│   └── test_results.py      # /api/test-results/* (mock data only)
├── logic/                   # Core business logic (15 modules)
│   ├── cognitive_bias_analysis.py       # User-side bias analysis
│   ├── enhanced_cognitive_bias_detection.py  # 12-bias-type detector
│   ├── exponential_calculations.py      # 7 exponential helpers (R2.3)
│   ├── compound_interest.py             # Compound interest (R2.3)
│   ├── pattern_tracker.py               # DecisionPatternTracker + CrossScenarioAnalyzer
│   ├── feedback_real.py                 # 3 feedback generators (R6.3)
│   ├── feedback_enhancement.py          # Feedback enhancement
│   ├── feedback_system.py               # Simple feedback wrapper
│   ├── real_logic.py                    # Legacy 3-scenario simplified
│   ├── turn_executor.py                 # execute_real_logic (R7.1)
│   ├── turn_helpers.py                  # 2 small helpers (R5.4)
│   ├── educational_content.py           # Static knowledge base
│   ├── homepage_content.py              # Homepage structured content
│   ├── interaction_response.py          # Button click responses
│   ├── journey_manager.py               # User journey state
│   └── ui_interaction.py                # UI visual feedback
├── models/                  # Pydantic models (R7.3)
│   ├── cognitive_tests.py
│   ├── scenario.py
│   ├── test_results.py
│   └── user_responses.py
└── utils/                   # Error handlers and utilities
    ├── error_handlers.py   # CustomException, decorators
    ├── response_format.py  # APIResponse, CalculationResult
    └── test_error_handlers.py  # 23 tests (R7.2)
```

## Key Modules

### start.py (entry point)

- FastAPI app creation
- CORS middleware (whitelist from `ALLOWED_ORIGINS` env)
- Static file mount (`/assets`, `/web-app`)
- Global exception handler
- 8 routes defined directly:
  - `GET /health`
  - `GET /scenarios/`
  - `GET /scenarios/{id}`
  - `POST /scenarios/create_game_session`
  - `POST /scenarios/{game_id}/turn`
  - `GET /` (status)
  - `POST /analysis/thinking-traps`
  - `GET /test-home` (legacy debug)
  - `GET /{full_path}` (404 catch-all)
- Imports `logic.pattern_tracker`, `logic.turn_executor`, `logic.feedback_real`, `logic.turn_helpers`

### logic/turn_executor.py (493 lines, monolithic)

`execute_real_logic(scenario_id, current_state, decisions, difficulty)` —
12 inline branches for all scenario_ids. R9.2 attempted dispatcher
refactor but reverted due to indentation risk. See ROADMAP for R10+.

### logic/feedback_real.py (3 generators)

- `generate_real_feedback`: per-scenario_id feedback text (322 lines)
- `generate_pattern_analysis_feedback`: turn-3 pattern reveal
- `generate_advanced_feedback`: turn-4+ personalized (uses injected analyzer)

### logic/enhanced_cognitive_bias_detection.py

`EnhancedCognitiveBiasAnalyzer` with 12 `detect_*_bias` methods.
All 12 BiasType entries are now implemented (R6.1).

## Running

### Production

```bash
python api-server/start.py
# or
python api-server/server_runner.py
# or
PORT=9000 python api-server/start.py
```

### Development

```bash
python -m pytest --cov=api-server/logic --cov=api-server/utils --cov=api-server/models
```

### Docker

```bash
docker build -t failure-logic-api .
docker run -p 8000:8000 -e ALLOWED_ORIGINS=https://ptreezh.github.io failure-logic-api
```

## Environment Variables

| Var | Default | Used by |
|-----|---------|---------|
| `PORT` | 8000 | uvicorn binding |
| `LOG_LEVEL` | INFO | server_runner.py |
| `ALLOWED_ORIGINS` | `https://ptreezh.github.io,http://localhost:3000,http://localhost:8000` | start.py CORS |
| `OPENROUTER_API_KEY` | (none) | interactive.py LLM calls |

## Test Coverage (current: 74%)

| Module | Coverage |
|--------|----------|
| logic/feedback_real.py | 67% (4 skipped → 0 after R9.1) |
| logic/turn_executor.py | 1% (no unit tests, just dispatch smoke) |
| logic/enhanced_cognitive_bias_detection.py | 100% |
| logic/cognitive_bias_analysis.py | 65% |
| logic/pattern_tracker.py | 100% |
| logic/exponential_calculations.py | 100% |
| logic/compound_interest.py | 100% |
| utils/error_handlers.py | 83% |
| utils/response_format.py | 86% |
| models/scenario.py | 95% |

## Known Issues (R10.1 audit)

1. `get_bias_explanation` only has 3 of 12 bias explanations hardcoded
2. `submit_user_response` line 736: `analysis_result.get(...)` crashes if no branch matched
3. `check_exponential_answer` always calls analyze with `(2, 200)` regardless of question_id
4. `api-server/data/` is empty (scenarios loaded only via BASE_SCENARIOS in start.py)
5. `endpoints/test_results.py` has pre-existing relative import error (excluded from pytest)

## Development Conventions

- Functions: `snake_case`, classes: `PascalCase`
- Type hints: **required** for all function signatures (AGENTS.md rule)
- Tests: `class TestX: def test_y(self):` (Given-When-Then style)
- Error handling: use `CustomException` from `utils.error_handlers`, not `except Exception:`
- Logging: use `Logger.info/debug/warn/error`, not `print()` in production
- Imports: use `from logic.X import Y`, not `from .X import Y` (circular-safe)
