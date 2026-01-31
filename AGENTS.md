# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

Cognitive Trap Platform: Hybrid Python FastAPI backend + vanilla JavaScript frontend. TDD-driven with E2E (Playwright), integration, and unit (pytest) tests.

## Architecture Overview

The Cognitive Trap Platform is an educational platform designed to teach users about cognitive biases through interactive scenarios and games. The architecture consists of:

- **Backend**: Python FastAPI server with multiple scenario types and dynamic difficulty levels
- **Frontend**: Vanilla JavaScript application with turn-based scenario implementations
- **Data**: JSON-based scenarios with supporting data files

## Key Components

### Backend (api-server/)
- **Endpoints** (`endpoints/`): FastAPI route handlers for scenarios, cognitive tests, and results
- **Logic** (`logic/`): Core business logic including LLM integration in `llm/` subfolder
- **Models** (`models/`): Pydantic models for data validation
- **Loaders** (`loaders/`): Scenario data loading mechanisms
- **Data** (`data/`): JSON data files for scenarios, historical cases, and game configurations

### Frontend (assets/)
- **JavaScript** (`js/`): Main application logic in `app.js`, including scenario routers and decision engines
- **CSS** (`css/`): Styling for various scenarios and components
- **Data** (`data/`): Frontend JSON data files

### Scenarios & Games
The platform implements multiple cognitive bias learning scenarios:
- **Coffee Shop Linear Thinking**: Teaches about linear thinking traps in complex systems
- **Relationship Time Delay**: Demonstrates time delay effects in relationship investments
- **Investment Confirmation Bias**: Illustrates confirmation bias in investment decisions
- **Advanced Game Scenarios**: More complex strategic decision-making games

## Technology Stack

- **Backend**: Python 3.12+, FastAPI, Pydantic, uvicorn
- **Frontend**: Vanilla JavaScript (UMD/CommonJS modules), HTML/CSS
- **Testing**: Playwright (E2E), pytest (unit), multiple integration test types
- **Package Management**: npm for frontend dependencies

## Key Patterns & Features

### Dynamic Difficulty System
- Multiple difficulty levels (beginner, intermediate, advanced)
- Adaptive challenge scaling based on user preferences
- Advanced challenges with increased complexity

### Decision Engine Framework
- Real-time calculation of decision consequences
- Linear expectation vs. actual complex system results
- Delayed effect simulation and tracking
- Cognitive bias detection and feedback

### Scenario Router Architecture
- Turn-based scenario progression
- State management for complex decision trees
- Feedback systems with awakening moments
- Pattern recognition for cognitive biases

## Development Commands

### Backend
```bash
python api-server/start.py [port]          # Start API server (default 8000)
python -m pytest tests/unit/               # Run Python unit tests
python -m pytest -k "test_name"            # Run specific test
```

### Frontend
```bash
cd tests                                    # All tests run from tests/
npm test                                    # Run all E2E tests
npm run test:api                            # API integration tests
npm run test:scenarios                      # Scenario interaction tests
npm test -- api-integration.spec.js         # Run specific test
npm run test:report                         # View test reports
```

### Testing Commands
```bash
npx playwright test                        # Run Playwright E2E tests
npx playwright test --ui                    # Run tests in UI mode
npx playwright show-report                 # Show test report
python -m pytest tests/unit/ -v            # Verbose unit tests
npm run test:scenarios                     # Specific scenario tests
```

## Anti-Patterns (FORBIDDEN)
1. `TODO`/`FIXME` comments in production code
2. `XXX` placeholder patterns in naming
3. `console.log`/`console.warn`/`console.error` in production
4. `innerHTML` usage without sanitization (XSS risk)
5. Generic `except Exception as e:` blocks
6. Global window object pollution (`window.coffeeShopRouter`, etc.)
7. Inline event handlers in HTML (`onclick="..."`)
8. Debug mode flags in production builds
9. Empty/mixed language test files

## Deployment Notes
- **CI**: Custom 7-stage Spec-Kit pipeline in `.github/workflows/`
- **Pre-commit**: Black, isort, flake8, Prettier hooks configured
- **Vercel**: Configured but has issues (points to non-existent `api/index.py`, uses Python 3.9 vs project's 3.12)
- **GitHub Pages**: Used with Codespaces as primary hosting solution

## Key Files and Directories
- `api-server/start.py`: Main API server entry point with comprehensive decision tracking
- `assets/js/app.js`: Frontend application with multiple scenario routers and decision engines
- `assets/js/api-config-manager.js`: API configuration with intelligent failover
- `tests/e2e/scenarios-interaction.spec.js`: End-to-end tests for scenario interactions
- `api-server/data/`: Scenario data files in JSON format
- `api-server/logic/llm/`: LLM integration for enhanced interactivity
- `COMPREHENSIVE_SKILLS_CATALOG.md`: Complete catalog of all available skills
- `QUICK_SKILLS_REFERENCE.md`: Quick reference for commonly used skills
- `SKILLS_USAGE_GUIDE.md`: Practical guide for using skills effectively
- `SKILLS_INITIALIZATION_SYSTEM.md`: System for auto-loading skills on session start
- `C:\Users\Zhang\.stigmergy\skills\USER_SKILLS_DOCUMENTATION.md`: User-level comprehensive skills documentation
- `C:\Users\Zhang\.stigmergy\skills\SKILLS_QUICK_REFERENCE_CARD.md`: User-level quick reference card
- `cognitive-trap-expert\SKILL.md`: Expert skill for cognitive trap platform development
- `C:\Users\Zhang\.stigmergy\skills\cognitive-trap-expert\SKILL.md`: User-level cognitive trap expert skill

## Testing Structure
- **E2E Tests** (`tests/e2e/`): Playwright tests for UI interactions
- **Unit Tests** (`tests/unit/`): Pytest tests for backend logic
- **Integration Tests** (`tests/integration/`): API and data integration tests
- **Specialized Tests**: Scenario-specific and cognitive bias validation tests

## Conventions
### Python
- Functions/variables: `snake_case`
- Classes: `PascalCase`
- Type hints: **Required** for all function signatures
- Tests: Classes prefixed with `Test`, methods prefixed with `test_`
- Comments: English or Chinese

### JavaScript
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`, Classes: `PascalCase`
- App files: UMD/CommonJS (for compatibility)
- Test files: ES6 modules only
- Test descriptions: lowercase with spaces

### Testing
- TDD First: Write tests before implementing features
- Structure: Given-When-Then for all tests
- Failover: Always provide fallback to mock data if API fails

## Important Notes
- `api-server/` is active; `api_server/` is legacy (ignore)
- Root test sprawl: `test_*.py`, `validate*.py`, `verify*.py` at root should be in tests/
- Playwright CI runs with `headless: false` (non-standard)
- No build process: Vanilla JS with no bundler, direct script tags in HTML
- The application supports multiple concurrent API endpoints with automatic failover