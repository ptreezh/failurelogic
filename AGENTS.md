# AGENTS.md

This guide provides coding standards and development guidelines for the Cognitive Trap Platform (认知陷阱平台).

## Project Overview

Hybrid architecture with Python FastAPI backend and vanilla JavaScript frontend. Follows TDD (Test-Driven Development) principles with comprehensive E2E, integration, and unit testing.

## Build, Test, and Development Commands

### Backend (Python)
```bash
# Start API server
python api-server/start.py [port]  # Default: 8000

# Run Python unit tests
python -m pytest tests/unit/
python -m pytest api-server/logic/test_exponential_calculations.py

# Run specific test file
python tests/unit/test_cognitive_bias_analysis.py
```

### Frontend (JavaScript)
```bash
# Run all E2E tests
cd tests && npm test

# Run specific test suites
npm run test:api              # API integration tests
npm run test:scenarios        # Scenario interaction tests
npm run test:load             # App load tests

# Run in headed mode
npm run test:headed

# Debug mode
npm run test:debug

# View test reports
npm run test:report

# Install Playwright browsers
npm run test:install
```

## Code Style Guidelines

### JavaScript/TypeScript

#### Naming Conventions
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `APP_CONFIG`, `CACHE_NAME`)
- **Classes**: `PascalCase` (e.g., `APIConfigManager`, `GameManager`)
- **Methods/Functions**: `camelCase` (e.g., `initialize()`, `loadScenarios()`)
- **Variables**: `camelCase` (e.g., `gameSession`, `currentGameIndex`)
- **Test descriptions**: `should do something` (lowercase with spaces)

#### Import/Export Patterns
```javascript
// Application files (UMD/CommonJS for compatibility)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIConfigManager;
} else if (typeof window !== 'undefined') {
  window.APIConfigManager = APIConfigManager;
}

// Test files only (ES6 modules)
import { test, expect } from '@playwright/test';
```

#### Class Patterns
```javascript
// Static classes for managers (NavigationManager, GameManager, ToastManager)
class NavigationManager {
  static routes = { ... };
  static async navigateTo(page) { ... }
}

// Instance classes for components
class APIConfigManager {
  constructor(options = {}) {
    this.options = { ... };
  }
  async request(endpoint) { ... }
}
```

#### Error Handling
```javascript
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Operation failed:', error);
  // Fallback to mock data or show error message
}
```

#### Async/Await
Always use `async/await` instead of promise chains:
```javascript
async initialize() {
  try {
    const response = await fetch(`${this.apiUrl}/api/scenarios`);
    const data = await response.json();
    this.games = data.scenarios;
  } catch (error) {
    console.error('Failed to load:', error);
  }
}
```

#### API Configuration
```javascript
// Use IIFE for environment-based URL selection
const APP_CONFIG = {
  apiBaseUrl: (() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return 'https://production-api-url';
  })()
};
```

### Python (FastAPI)

#### Naming Conventions
- **Functions/Variables**: `snake_case` (e.g., `create_game_session`, `get_scenarios`)
- **Classes**: `PascalCase` (e.g., `GameSession`, `Scenario`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `SCENARIOS`)
- **Private methods**: `_leading_underscore` (e.g., `_internal_helper`)

#### Type Hints
Always use type hints for function signatures:
```python
from typing import Dict, Any, List, Optional

async def create_game_session(
    scenario_id: str = Query(..., alias="scenario_id"),
    difficulty: str = Query("auto")
) -> Dict[str, Any]:
    """Create game session with specified difficulty."""
    ...
```

#### Error Handling
```python
from fastapi import HTTPException

scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
if not scenario:
    raise HTTPException(status_code=404, detail="场景未找到")
```

#### Pydantic Models
Use Pydantic for data validation:
```python
from pydantic import BaseModel

class GameState(BaseModel):
    resources: int
    satisfaction: int
    turn_number: int
```

## Testing Guidelines

### Test Structure (Given-When-Then)
```javascript
test('should calculate exponential growth correctly', () => {
  // Given
  const base = 2;
  const exponent = 10;

  // When
  const result = calculateExponential(base, exponent);

  // Then
  expect(result).toBe(1024);
});
```

### Playwright E2E Tests
```javascript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await expect(page.locator('.scenario-card')).toBeVisible();
  });
});
```

### Python pytest Tests
```python
def test_calculate_exponential_basic():
    """Test basic exponential calculation"""
    # Given
    base = 2
    exponent = 10

    # When
    result = calculate_exponential(base, exponent)

    # Then
    assert result == 1024
```

## File Organization

```
tests/
├── e2e/              # Playwright E2E tests (*.spec.js)
├── frontend/          # Jest unit tests (*.test.js)
├── unit/              # Python pytest tests (*.py)
└── playwright.config.js

api-server/
├── endpoints/         # API route handlers
├── logic/            # Business logic
├── models/           # Pydantic models
└── start.py          # Application entry point
```

## API Integration

### Frontend API Calls
```javascript
const response = await fetch(`${this.apiUrl}/api/scenarios/`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Backend Endpoints
```python
from fastapi import APIRouter

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

@router.get("/")
async def get_scenarios():
    """获取所有认知陷阱场景"""
    return {"scenarios": SCENARIOS}
```

## Key Principles

1. **TDD First**: Write tests before implementing features
2. **Failover**: Always provide fallback to mock data if API fails
3. **Type Safety**: Use type hints in Python, consider TypeScript for new features
4. **Error Boundaries**: Wrap all async operations in try-catch
5. **Performance**: Use connection pooling, caching, and debounce where appropriate
6. **Bilingual**: Comments can be in English or Chinese; prefer English for technical documentation
7. **TDD Philosophy**: Evident in test file comments like "根据TDD原则，先编写测试然后实现功能"

## Running a Single Test

### Playwright Test
```bash
npm test -- api-integration.spec.js
# Or with grep filter
npm test -- --grep "should successfully connect to API"
```

### Python Test
```bash
python -m pytest tests/unit/test_exponential_logic.py::TestExponentialCalculations::test_calculate_exponential_basic
python -m pytest -k "test_calculate_exponential_basic"
```
