---
name: advanced-planning
description: Use when starting complex multi-step tasks, research projects, or any task requiring organization and progress tracking.
---

# Advanced Planning

## Overview

The Advanced Planning skill implements a sophisticated task management system that helps organize complex projects into manageable phases with clear progress tracking.

## When to Use

Use this skill when:
- Starting complex multi-step tasks (3+ steps)
- Working on research projects
- Building/creating projects
- Tasks spanning many operations
- Any task requiring organization and progress tracking

## Core Components

### 1. Task Planning
Create a comprehensive task plan that breaks down the main objective into smaller, manageable phases.

### 2. Progress Tracking
Monitor the status of each phase and task to ensure steady progress toward the goal.

### 3. Resource Management
Keep track of resources used, findings discovered, and decisions made during the process.

## Implementation

### Step 1: Create Task Plan
When starting a complex task, create a `task_plan.md` file with the following structure:

```markdown
# Task Plan

## Goal
[Describe the main goal of this task]

## Phases
### Phase 1: [Phase Name]
- [ ] Task 1
- [ ] Task 2
- **Status:** pending
- **Estimated Time:** [Time estimate]

### Phase 2: [Phase Name]
- [ ] Task 1
- [ ] Task 2
- **Status:** pending
- **Estimated Time:** [Time estimate]

## Dependencies
[List any dependencies between phases or external factors]

## Success Criteria
[Define what constitutes successful completion]

## Risks & Mitigation
[Risks that might affect completion and mitigation strategies]
```

### Step 2: Track Progress
As you work, update the `task_plan.md` file to reflect the current status:

- Change `[ ]` to `[x]` for completed tasks
- Update status from `pending` to `in_progress` to `complete`
- Add notes about challenges or discoveries in each phase

### Step 3: Document Findings
Create a `findings.md` file to store research, discoveries, and decisions:

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

## Lessons Learned
[Notes about what worked well and what didn't]
```

### Step 4: Log Activities
Maintain a `progress.md` file to record activities and outcomes:

```markdown
# Progress Log

## Phase 1: [Name]
### Actions Taken
| Date | Action | Result | Files Modified |
|------|--------|--------|----------------|
| YYYY-MM-DD | [Description] | [Outcome] | [File paths] |

### Test Results
| Test | Command | Result | Date |
|------|---------|--------|------|
| [Test name] | [Command] | [Result] | YYYY-MM-DD |

### Error Log
| Date | Error | Action Taken | Resolution |
|------|-------|--------------|------------|
| YYYY-MM-DD | [Error description] | [What you did] | [How it was resolved] |
```

## Best Practices

1. **Update Regularly**: Update planning files after every 2-3 significant operations
2. **Be Specific**: Use specific, measurable terms in your goals and tasks
3. **Review Frequently**: Periodically review your plan to ensure it still aligns with your goals
4. **Document Decisions**: Record why you made certain technical decisions
5. **Track Time**: Estimate and record actual time spent on each phase

## Verification

Before considering a task complete, verify:
- All phases in `task_plan.md` are marked as complete
- All tasks within each phase are checked off
- `findings.md` captures all important discoveries
- `progress.md` records all significant activities