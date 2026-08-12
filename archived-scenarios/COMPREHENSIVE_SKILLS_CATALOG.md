# Comprehensive Skills Catalog

This catalog documents all skills available in the system to avoid lengthy searches in the future.

## Location 1: C:\Users\Zhang\.stigmergy\skills (and mirrored in C:\Users\Zhang\.agent\skills)

### Core Superpowers Skills
- **using-superpowers** - Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
- **writing-skills** - Use when creating new skills, editing existing skills, or verifying skills work before deployment
- **writing-plans** - Use when you have a spec or requirements for a multi-step task, before touching code
- **executing-plans** - Use when you have a written implementation plan to execute in a separate session with review checkpoints
- **using-git-worktrees** - Use when starting feature work that needs isolation from current workspace or before executing implementation plans
- **brainstorming** - Use before any creative work - creating features, building components, adding functionality, or modifying behavior
- **test-driven-development** - Use when implementing any feature or bugfix, before writing implementation code
- **subagent-driven-development** - Use when executing implementation plans with independent tasks in the current session
- **finishing-a-development-branch** - Use when completing development work before merging or shipping
- **verification-before-completion** - Use before completing any task to verify requirements are met
- **systematic-debugging** - Use when debugging complex issues systematically
- **receiving-code-review** - Use when receiving code review feedback
- **requesting-code-review** - Use when requesting code review for your work

### Analysis & Research Skills
- **field-expert** - Bourdieu field theory expert analysis skill that integrates field boundary identification, capital analysis, habitus analysis, and field dynamics analysis functions
- **field-analysis** - Use when conducting field analysis of social structures and dynamics
- **grounded-theory-expert** - Use when conducting grounded theory analysis
- **mathematical-statistics** - Use when applying statistical analysis methods
- **network-computation** - Use when performing network analysis computations
- **ecosystem-analysis** - Use when analyzing business ecosystems
- **business-ecosystem-analysis** - Use when analyzing business ecosystems with integrated approaches
- **digital-transformation** - Digital transformation analysis skill that integrates multiple sub-skills
- **conflict-resolution** - Use when resolving conflicts in research or analysis
- **resumesession** - Cross-CLI session recovery and history management skill

### Domain-Specific Sub-Skills (under digital-transformation)
- **business-innovation-pathway-planning** - Planning specific business innovation implementation paths
- **business-model-reconstruction** - Reconstructing business models through digital transformation expertise
- **business-scene-deconstruction-analysis** - Deconstructing business scenes for analysis
- **digitization-deconstruction-analysis** - Performing expert digitization deconstruction analysis
- **intelligent-transformation-deconstruction-analysis** - Performing expert intelligent transformation deconstruction analysis
- **online-transformation-deconstruction-analysis** - Performing expert online transformation deconstruction analysis
- **innovation-niche-identification** - Identifying innovation niches in transformation

### Testing & Quality Skills
- **test-skill** - Use when creating or evaluating test strategies
- **validity-reliability** - Use when assessing validity and reliability of methods
- **mechanism-test-skill** - Use when testing specific mechanisms

### Other Skills
- **ant** - ANT (Actor-Network Theory) analysis skill
- **dispatching-parallel-agents** - Use when dispatching multiple agents in parallel
- **dispatching-parallel-agents** - Use when dispatching multiple agents in parallel

## Location 2: D:\AIDevelop\failureLogic\skill-from-masters\skill-from-masters\SKILL.md

### skill-from-masters
- **Description**: Help users create high-quality skills by discovering and incorporating proven methodologies from domain experts
- **Core Philosophy**: Create skills that embody the wisdom of domain masters by discovering and incorporating proven methodologies from recognized experts
- **Features**: 5-layer narrowing framework, methodology research, golden examples identification, cross-validation

## Location 3: D:\AIDevelop\failureLogic\planning-with-files\.agent\skills\planning-with-files\SKILL.md

### planning-with-files
- **Description**: Implements Manus-style file-based planning for complex tasks
- **Core Principle**: Context Window = RAM (volatile, limited), Filesystem = Disk (persistent, unlimited)
- **Key Files**: task_plan.md, findings.md, progress.md
- **Use When**: Starting complex multi-step tasks, research projects, or any task requiring >5 tool calls

## Key Finding Patterns

### Search Strategy
1. Check both `.stigmergy\skills` and `.agent\skills` directories - they contain identical content
2. Look for skills in the current project directory for custom skills
3. Skills follow the naming convention: `SKILL.md` files in named directories
4. Some skills have extensive sub-skill ecosystems (like digital-transformation)

### Quick Access Commands
```bash
# Check local skills in user directory
ls "C:\Users\Zhang\.stigmergy\skills"

# Check skills in current project
find . -name "SKILL.md" -path "*/skills/*"

# Search for specific skill
find . -name "*skill-name*" -type d
```

## Usage Guidelines

### When to Use Each Category
- **Superpowers**: Use for any significant task or before starting work
- **Analysis**: Use for research, investigation, or analytical tasks
- **Planning**: Use before complex multi-step tasks
- **Testing**: Use for quality assurance and validation

This catalog should eliminate the need for extensive searching in the future.