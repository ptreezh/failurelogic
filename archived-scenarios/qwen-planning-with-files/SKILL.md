# Planning with Files for Qwen

Work like Manus: Use persistent markdown files as your "working memory on disk."

## Overview

This skill implements Manus-style file-based planning for complex tasks in Qwen. It creates and manages three key files:
- `task_plan.md` - Track phases and progress
- `findings.md` - Store research and discoveries  
- `progress.md` - Session log and test results

Use when starting complex multi-step tasks, research projects, or any task requiring multiple operations.

## Quick Start

Before ANY complex task:

1. **Create `task_plan.md`** - Use the template as reference
2. **Create `findings.md`** - Use the template as reference
3. **Create `progress.md`** - Use the template as reference
4. **Re-read plan before decisions** - Refreshes goals in attention window
5. **Update after each phase** - Mark complete, log errors

> **Note:** Planning files go in your project root, not the skill installation folder.

## Core Pattern

```
Context Window = RAM (volatile, limited)
Filesystem = Disk (persistent, unlimited)

→ Anything important gets written to disk.
```

## File Purposes

| File | Purpose | When to Update |
|------|---------|----------------|
| `task_plan.md` | Phases, progress, decisions | After each phase |
| `findings.md` | Research, discoveries | After ANY discovery |
| `progress.md` | Session log, test results | Throughout session |

## Critical Rules

### 1. Create Plan First
Never start a complex task without `task_plan.md`. Non-negotiable.

### 2. The 2-Action Rule
> "After every 2 view/browser/search operations, IMMEDIATELY save key findings to text files."

This prevents visual/multimodal information from being lost.

### 3. Read Before Decide
Before major decisions, read the plan file. This keeps goals in your attention window.

### 4. Update After Act
After completing any phase:
- Mark phase status: `in_progress` → `complete`
- Log any errors encountered
- Note files created/modified

### 5. Log ALL Errors
Every error goes in the plan file. This builds knowledge and prevents repetition.

### 6. Never Repeat Failures
```
if action_failed:
    next_action != same_action
```
Track what you tried. Mutate the approach.

## Templates

### task_plan.md Template
```markdown
# Task Plan

## Goal
[Describe the main goal of this task]

## Phases
### Phase 1: [Phase Name]
- [ ] Task 1
- [ ] Task 2
- **Status:** pending

### Phase 2: [Phase Name]
- [ ] Task 1
- [ ] Task 2
- **Status:** pending

## Technical Decisions
| Decision | Rationale |
|----------|-----------|

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
```

### findings.md Template
```markdown
# Research Findings

## Sources Consulted
- [List sources here]

## Key Insights
- [List insights here]

## Technical Decisions
| Decision | Rationale |
|----------|-----------|

## Useful Resources
- [List URLs, docs, references here]
```

### progress.md Template
```markdown
# Progress Log

## Phase 1: [Name]
### Actions Taken
| Action | Result | Files Modified |
|--------|--------|----------------|

### Test Results
| Test | Command | Result |
|------|---------|--------|

### Error Log
| Time | Error | Action Taken |
|------|-------|--------------|

## Phase 2: [Name]
### Actions Taken
| Action | Result | Files Modified |
|--------|--------|----------------|
```

## When to Use This Pattern

**Use for:**
- Multi-step tasks (3+ steps)
- Research tasks
- Building/creating projects
- Tasks spanning many operations
- Anything requiring organization

**Skip for:**
- Simple questions
- Single-file edits
- Quick lookups

## Session Recovery

When resuming work after a break or context reset:

1. Check git diff to see what changed: `git diff --stat`
2. Read current planning files: `task_plan.md`, `findings.md`, `progress.md`
3. Update planning files based on what you remember doing
4. Continue with task
