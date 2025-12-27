---

description: "Task list for cognitive trap tests feature implementation"
---

# Tasks: 认知陷阱测试扩展

**Input**: Design documents from `/specs/001-cognitive-trap-tests/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create project structure per implementation plan in api-server/models/
- [x] T002 [P] Initialize Python project with FastAPI dependencies in api-server/
- [x] T003 [P] Configure linting and formatting tools for backend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [x] T004 [P] Setup API routing and middleware structure in api-server/
- [x] T005 [P] Implement cognitive test data models in api-server/models/cognitive_tests.py
- [x] T006 [P] Setup user response models in api-server/models/user_responses.py
- [x] T007 [P] Create result summary models in api-server/models/test_results.py
- [x] T008 [P] Configure error handling and logging infrastructure
- [x] T009 [P] Setup API configuration for Codespaces deployment

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 数字迷宫挑战 (Priority: P1) 🎯 MVP

**Goal**: Allow users to complete exponential growth misconception challenges with detailed pyramid-style feedback after completion.

**Independent Test**: System can run a complete exponential growth scenario (e.g., 2^200 granary space challenge), user can make decisions and receive feedback based on real logic, fully experiencing the exponential growth misconception.

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [US1] Contract test for exponential test endpoint in tests/contract/test_exponential.py
- [x] T011 [P] [US1] Unit test for exponential calculation logic in tests/unit/test_exponential_logic.py

### Implementation for User Story 1

- [x] T012 [P] [US1] Create ExponentialCalculation logic in api-server/logic/exponential_calculations.py
- [x] T013 [P] [US1] Create CognitiveTestQuestion model in api-server/models/cognitive_tests.py
- [x] T014 [US1] Implement exponential test endpoints in api-server/endpoints/cognitive_tests.py
- [x] T015 [US1] Add exponential questions data in api-server/data/exponential_questions.json
- [x] T016 [US1] Create frontend challenge component in web-app/components/exponential-test.js
- [x] T017 [US1] Implement pyramid-style result explanation logic in api-server/logic/pyramid_explanations.py

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 金融智慧挑战 (Priority: P2)

**Goal**: Provide compound interest trap tests with comparison to bank loan interests, revealing compound vs linear growth differences.

**Independent Test**: System displays compound interest comparison questions and calculates actual compound interest values with pyramid-style explanations.

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [x] T018 [P] [US2] Contract test for compound interest endpoint in tests/contract/test_compound.py
- [x] T019 [P] [US2] Unit test for compound interest calculation in tests/unit/test_compound_interest.py

### Implementation for User Story 2

- [x] T020 [P] [US2] Create CompoundInterestCalculation logic in api-server/logic/compound_interest.py
- [x] T021 [US2] Implement compound interest test endpoints in api-server/endpoints/cognitive_tests.py
- [x] T022 [US2] Add compound questions data in api-server/data/compound_questions.json
- [x] T023 [US2] Create frontend compound test component in web-app/components/compound-test.js
- [x] T024 [US2] Integrate compound test with frontend navigation

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 历史决策重现 (Priority: P3)

**Goal**: Reproduce historical decision-making failures like Challenger disaster, letting users experience systematic decision errors.

**Independent Test**: System presents historical decision scenarios and analyzes cognitive biases involved with pyramid-style feedback.

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [x] T025 [P] [US3] Contract test for historical case endpoint in tests/contract/test_historical.py
- [x] T026 [P] [US3] Integration test for historical scenario processing in tests/integration/test_historical.py

### Implementation for User Story 3

- [x] T027 [P] [US3] Create HistoricalScenario model in api-server/models/cognitive_tests.py
- [x] T028 [US3] Implement historical case endpoints in api-server/endpoints/cognitive_tests.py
- [x] T029 [US3] Add historical cases data in api-server/data/historical_cases.json
- [x] T030 [US3] Create frontend historical case component in web-app/components/historical-cases.js

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - 推理游戏 (Priority: P4)

**Goal**: Provide interactive reasoning games to expose thinking limitations through gameplay.

**Independent Test**: User participates in an inference game and system records decision process with pyramid-style feedback.

### Tests for User Story 4 (OPTIONAL - only if tests requested) ⚠️

- [x] T031 [P] [US4] Contract test for interactive game endpoint in tests/contract/test_game.py
- [x] T032 [P] [US4] Unit test for game scenario processing in tests/unit/test_game_logic.py

### Implementation for User Story 4

- [x] T033 [P] [US4] Create GameScenario model in api-server/models/cognitive_tests.py
- [x] T034 [US4] Implement game endpoints in api-server/endpoints/cognitive_tests.py
- [x] T035 [US4] Add game scenarios data in api-server/data/game_scenarios.json
- [x] T036 [US4] Create frontend game component in web-app/components/interactive-game.js

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] TXXX [P] Documentation updates in docs/
- [x] TXXX [P] Refactor common logic to reduce duplication
- [x] TXXX [P] Performance optimization across all stories
- [x] TXXX [P] Additional unit tests in tests/unit/
- [x] TXXX [P] Security hardening
- [x] TXXX [P] MCP Playwright tests using Edge browser (no headless) in tests/e2e/
- [x] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 �?P2 �?P3 �?P4)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - May integrate with other stories but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for exponential test endpoint in tests/contract/test_exponential.py"
Task: "Unit test for exponential calculation logic in tests/unit/test_exponential_logic.py"

# Launch all models for User Story 1 together:
Task: "Create ExponentialCalculation logic in api-server/logic/exponential_calculations.py"
Task: "Create CognitiveTestQuestion model in api-server/models/cognitive_tests.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational �?Foundation ready
2. Add User Story 1 �?Test independently �?Deploy/Demo (MVP!)
3. Add User Story 2 �?Test independently �?Deploy/Demo
4. Add User Story 3 �?Test independently �?Deploy/Demo
5. Add User Story 4 �?Test independently �?Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
   - Developer D: User Story 4
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
