# Superpowers Skills Overview

## 1. using-superpowers
- **Description**: Use when starting any conversation - establishes how to find and use skills
- **Core Principle**: If there's even a 1% chance a skill might apply, you MUST invoke the skill
- **Key Rule**: Invoke relevant skills BEFORE any response or action

## 2. writing-skills
- **Description**: Use when creating new skills, editing existing skills, or verifying skills work before deployment
- **Core Principle**: Writing skills IS Test-Driven Development applied to process documentation
- **Workflow**: RED-GREEN-REFACTOR cycle for skill development

## 3. writing-plans
- **Description**: Use when you have a spec or requirements for a multi-step task, before touching code
- **Core Principle**: Write comprehensive implementation plans assuming the engineer has zero context
- **Structure**: Bite-sized tasks (2-5 minutes each) with exact commands and expected outcomes

## 4. executing-plans
- **Description**: Use when you have a written implementation plan to execute in a separate session with review checkpoints
- **Core Principle**: Batch execution with checkpoints for architect review
- **Workflow**: Load plan → Execute batch → Report → Continue until complete

## 5. using-git-worktrees
- **Description**: Use when starting feature work that needs isolation from current workspace
- **Core Principle**: Systematic directory selection + safety verification = reliable isolation
- **Process**: Directory selection → Safety verification → Worktree creation → Setup → Baseline verification

## 6. brainstorming
- **Description**: Use before any creative work - creating features, building components, adding functionality
- **Core Principle**: Turn ideas into fully formed designs through natural collaborative dialogue
- **Process**: Understand → Explore approaches → Present design in sections

## Key Superpowers Principles

1. **Discipline First**: Always check for applicable skills before acting
2. **Test-Driven Documentation**: Apply TDD principles to skill development
3. **Bite-Sized Tasks**: Break work into 2-5 minute chunks
4. **Isolation**: Use git worktrees for safe experimentation
5. **Verification**: Check before proceeding, especially with safety concerns