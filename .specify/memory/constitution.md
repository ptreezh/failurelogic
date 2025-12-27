<!-- 
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0 
- Modified principles: N/A
- Added sections: GitHub Deployment Architecture, MCP Playwright Testing Protocol
- Removed sections: N/A
- Templates requiring updates: ✅ .specify/templates/plan-template.md updated
- Follow-up TODOs: None
-->
# failureLogic Constitution

## Core Principles

### Naming Consistency
File name, variable name, class name, folder name, package name - all naming must follow unified conventions.
### TDD-Driven Implementation
All task implementation must be based on TDD (Test-Driven Development) approach.
### SOLID-Based Task Decomposition
All task decomposition must follow SOLID principles for maintainability.
### Contextual Preparation
All task execution must comprehensively prepare context and verify context clarity without ambiguity.
### Failure Logic Decision Testing
This is a decision testing framework based on 'The Logic of Failure' concept, designed to expose user thinking defects as target.

## GitHub Deployment Architecture
Frontend services deployed on GitHub Pages; Backend services deployed on GitHub Codespaces; Architecture must support seamless integration between frontend and backend components through API endpoints.

## MCP Playwright Testing Protocol
Deployment and interaction testing MUST utilize MCP Playwright; Edge browser MUST be invoked for all UI testing (no headless browser usage allowed); All tests MUST verify cross-environment functionality between GitHub Pages and Codespaces.

## Decision Testing Requirements
Focus on exposing thinking defects through systematic failure analysis and decision-making under uncertainty.

## Development Workflow
All development must follow TDD cycle: Write test → Verify failure → Implement solution → Verify success → Refactor.

## Governance
Constitution compliance verified at each PR review; All changes must include tests; Breaking changes require migration plan.

**Version**: 1.1.0 | **Ratified**: 2025-11-09 | **Last Amended**: 2025-11-09
