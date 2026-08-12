#!/bin/bash
# 初始化规划文件的脚本 - Linux/macOS版

echo "Creating task_plan.md..."
if [ ! -f task_plan.md ]; then
  cat > task_plan.md << 'EOF'
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
EOF
  echo ""
else
  echo "task_plan.md already exists"
fi

echo "Creating findings.md..."
if [ ! -f findings.md ]; then
  cat > findings.md << 'EOF'
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
EOF
  echo ""
else
  echo "findings.md already exists"
fi

echo "Creating progress.md..."
if [ ! -f progress.md ]; then
  cat > progress.md << 'EOF'
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
EOF
  echo ""
else
  echo "progress.md already exists"
fi

echo "Planning files initialized!"