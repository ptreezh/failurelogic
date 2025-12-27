# Implementation Plan: 认知陷阱测试扩展

**Branch**: `001-cognitive-trap-tests` | **Date**: 2025-11-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-cognitive-trap-tests/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

扩展认知陷阱平台，增加指数增长误区、复利思维陷阱、历史决策失败案例重现和互动式思维陷阱游戏等功能。通过选择题和互动游戏的形式，让用户体验和学习各种认知偏差，特别是线性思维在面对指数增长和复利效应时的局限性。重点实现2^200规模、兔子繁殖问题（10只兔子约11年达到80亿只）等具体化选择题挑战，使用金字塔原理解释思维局限。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Python 3.8+ (backend), JavaScript/ES6+ (frontend)  
**Primary Dependencies**: FastAPI (backend), HTML/CSS/JS (frontend), no additional frontend framework (pure JS)
**Storage**: In-memory storage for user sessions, JSON files for static test data  
**Testing**: Unit tests for logic, integration tests for API, E2E tests for user flows  
**Target Platform**: Web browser (GitHub Pages frontend, GitHub Codespaces backend)
**Project Type**: Web application (separates frontend and backend)  
**Performance Goals**: Fast response to user interactions, smooth game experience, accurate calculations  
**Constraints**: Cross-platform compatibility, responsive design, accessible interface, MCP Playwright with Edge browser testing (no headless browsers)  
**Scale/Scope**: Individual user learning platform with potential for multiplayer features

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution compliance requires:
- Naming consistency: File name, variable name, class name, folder name, package name - all naming must follow unified conventions
- TDD-Driven Implementation: All task implementation must be based on TDD (Test-Driven Development) approach
- SOLID-Based Task Decomposition: All task decomposition must follow SOLID principles for maintainability
- Contextual Preparation: All task execution must comprehensively prepare context and verify context clarity without ambiguity
- Failure Logic Decision Testing: Framework based on 'The Logic of Failure' concept, designed to expose user thinking defects as target
- GitHub Deployment Architecture: Frontend on GitHub Pages, Backend on GitHub Codespaces with seamless API integration
- MCP Playwright Testing Protocol: Use MCP Playwright with Edge browser for all UI testing (no headless browsers)

### Compliance Status Post-Design
- ✅ Naming consistency: All components follow unified naming conventions (e.g., cognitive_tests.py, exponential_calculations.py)
- ✅ TDD-Driven Implementation: All functionality will be implemented using TDD approach with unit and integration tests
- ✅ SOLID-Based Task Decomposition: Tasks decomposed into models, logic, endpoints, and data layers following SOLID principles
- ✅ Contextual Preparation: All necessary context prepared in research.md and data-model.md
- ✅ Failure Logic Decision Testing: Framework implemented to expose user thinking defects through exponential growth, compound interest, and historical decision scenarios
- ✅ GitHub Deployment Architecture: Designed for deployment on GitHub Pages (frontend) and GitHub Codespaces (backend)
- ✅ MCP Playwright Testing Protocol: Testing strategy includes Playwright tests using Edge browser (no headless mode)

## Project Structure

### Documentation (this feature)

```text
specs/001-cognitive-trap-tests/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
api-server/
├── start.py             # Main FastAPI application
├── models/              # Data models (Pydantic)
│   ├── cognitive_tests.py
│   ├── user_responses.py
│   └── test_results.py
├── endpoints/           # API endpoints
│   ├── cognitive_tests.py
│   └── test_results.py
├── logic/               # Business logic
│   ├── exponential_calculations.py
│   ├── compound_interest.py
│   └── cognitive_bias_analysis.py
└── data/                # Static data
    ├── exponential_questions.json
    ├── compound_questions.json
    ├── historical_cases.json
    └── game_scenarios.json

web-app/
├── components/          # Frontend components
│   ├── exponential-test.js
│   ├── compound-test.js
│   ├── historical-cases.js
│   └── interactive-game.js
├── pages/               # Application pages
│   ├── cognitive-tests.html
│   └── test-results.html
└── css/                 # Styles
    ├── cognitive-tests.css
    └── interactive-game.css

assets/
├── js/                  # JavaScript files
│   └── cognitive-traps.js
└── css/                 # CSS files
    └── cognitive-traps.css

tests/
├── unit/
│   ├── test_exponential_logic.py
│   ├── test_compound_interest.py
│   └── test_cognitive_bias.py
├── integration/
│   ├── test_api_endpoints.py
│   └── test_user_flows.py
└── e2e/
    └── test_cognitive_tests.js
```

**Structure Decision**: Backend API extends existing FastAPI application with new cognitive test endpoints, frontend adds new components for the test scenarios, maintaining separation of concerns and modularity.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none at this time) | | |