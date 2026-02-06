---
name: code-analysis
description: Use when analyzing, understanding, or working with codebases. Provides systematic approach to code comprehension and modification.
---

# Code Analysis

## Overview

The Code Analysis skill provides a systematic approach to understanding, analyzing, and working with codebases. It helps break down complex code into understandable components and guides safe modifications.

## When to Use

Use this skill when:
- Starting to work with a new codebase
- Understanding existing code functionality
- Planning code modifications or refactors
- Debugging complex issues
- Performing code reviews
- Learning new frameworks or libraries through code examples

## Core Components

### 1. Code Exploration
Systematic exploration of the codebase to understand its structure and functionality.

### 2. Dependency Mapping
Understanding relationships between different components and modules.

### 3. Safe Modification
Guidelines for making changes without breaking existing functionality.

## Implementation

### Step 1: Initial Codebase Assessment
Begin by exploring the codebase structure:

1. **Identify Entry Points**
   - Look for main application files (e.g., `main.js`, `index.js`, `app.py`)
   - Find configuration files and initialization code
   - Locate routing or controller files

2. **Map Directory Structure**
   - Document the main directories and their purposes
   - Identify patterns in the organization (e.g., MVC, feature-based)
   - Note any special directories (tests, assets, configs)

3. **Identify Technologies**
   - Determine programming languages used
   - Identify frameworks and libraries
   - Note build tools and dependencies

### Step 2: Deep Dive Analysis
Select key components for detailed analysis:

```markdown
## Component Analysis Template

### Component: [Component Name]
- **Purpose**: [What this component does]
- **Dependencies**: [Other components it relies on]
- **Interfaces**: [Inputs and outputs]
- **Key Functions**: [Main functions/methods]
- **State Management**: [How it handles state]
- **External Interactions**: [API calls, database queries, etc.]

### Potential Modification Points
- [List places where changes might be needed]
- [Consider impact of changes on other components]

### Risks
- [Potential risks when modifying this component]
- [Side effects to watch for]
```

### Step 3: Create Understanding Artifacts
Document your understanding in files:

**architecture.md**
```markdown
# System Architecture

## High-Level Overview
[Brief description of the system's purpose and main components]

## Component Relationships
[Diagram or description of how components interact]

## Data Flow
[Description of how data moves through the system]

## Key Patterns
[Architectural or design patterns used in the system]
```

**dependencies.md**
```markdown
# Dependency Map

## Module A
- Depends on: [Module B, Module C]
- Used by: [Module D, Module E]

## Module B
- Depends on: [Module C]
- Used by: [Module A, Module F]
```

### Step 4: Plan Modifications Safely
When planning code changes:

1. **Impact Assessment**
   - Identify all components that might be affected
   - Consider both direct and indirect dependencies
   - Evaluate potential side effects

2. **Testing Strategy**
   - Identify existing tests that cover the code
   - Plan additional tests for new functionality
   - Consider edge cases and error conditions

3. **Implementation Order**
   - Plan changes in small, testable increments
   - Address dependencies before dependent code
   - Consider rollback strategies

## Best Practices

1. **Read Before Writing**: Always understand existing code before modifying
2. **Small Changes**: Make incremental changes and test frequently
3. **Preserve Intent**: Maintain the original purpose of the code
4. **Document Decisions**: Record why you made specific implementation choices
5. **Test Thoroughly**: Verify changes don't break existing functionality
6. **Follow Conventions**: Adhere to existing code style and patterns

## Tools for Analysis

### File Discovery
- Use `glob` to find specific file types: `glob("**/*.js")`
- Use `grep_search` to find specific patterns: `grep_search("function.*validate")`

### Code Understanding
- Create diagrams to visualize relationships
- Trace execution paths for critical functionality
- Identify entry and exit points for key operations

## Verification

Before finalizing code changes, verify:
- All existing tests still pass
- New functionality works as expected
- No unintended side effects were introduced
- Code follows existing patterns and conventions
- Performance hasn't degraded significantly