# Skills Usage Guide

## Essential Skills Quick Start

### 1. Superpowers Foundation
Before starting any significant work, consider these foundational skills:

**using-superpowers** - The meta-skill that reminds you to check for applicable skills
```
When to use: Before ANY task or response
How to invoke: Skill tool with "using-superpowers"
```

**brainstorming** - Turn ideas into fully formed designs
```
When to use: Before creative work, feature development, or system design
How to invoke: Skill tool with "brainstorming"
Process: Understand idea → Explore approaches → Present design in sections
```

**writing-plans** - Create detailed implementation plans
```
When to use: Before multi-step implementation tasks
How to invoke: Skill tool with "writing-plans"
Result: Creates documented plan with bite-sized tasks
```

### 2. Advanced Skills

**skill-from-masters** - Incorporate expert methodologies
```
When to use: Before creating new skills or tackling complex domain-specific tasks
How to invoke: Skill tool with "skill-from-masters"
Purpose: Research and integrate proven methodologies from domain experts
```

**planning-with-files** - Persistent planning for complex tasks
```
When to use: For complex tasks requiring >5 tool calls or multi-session work
How to invoke: Skill tool with "planning-with-files"
Creates: task_plan.md, findings.md, progress.md
```

**test-driven-development** - Systematic development approach
```
When to use: For all implementation work
How to invoke: Skill tool with "test-driven-development"
Principle: Write tests first, then implementation
```

## Finding Skills Efficiently

### Directories to Check
1. `C:\Users\Zhang\.stigmergy\skills\` - Personal skill collection
2. `D:\AIDevelop\failureLogic\skill-from-masters\` - Expert methodology skills
3. `D:\AIDevelop\failureLogic\planning-with-files\` - File-based planning skills

### Search Shortcuts
- Each skill lives in its own directory with a `SKILL.md` file
- Look for `name:` and `description:` in the YAML frontmatter to understand purpose
- Skills often have multiple sub-skills (like digital-transformation with 7 sub-skills)

## Skill Invocation Pattern

```
1. Identify the type of work you're doing
2. Use the Skill tool to invoke the appropriate skill
3. Follow the skill's guidance exactly as written
4. The skill will guide you through its specific process
```

## Common Skill Combinations

**New Feature Development:**
1. brainstorming → 2. writing-plans → 3. test-driven-development → 4. executing-plans

**Complex Analysis:**
1. skill-from-masters → 2. planning-with-files → 3. field-expert (or other analysis skill)

**Skill Creation:**
1. skill-from-masters → 2. writing-skills

This guide should eliminate the need to hunt for skills in the future.