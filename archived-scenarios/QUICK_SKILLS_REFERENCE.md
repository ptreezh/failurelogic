# Quick Skills Reference

## Top-Level Skills (Most Important)

### Superpowers Suite
- **using-superpowers** - Always check this first for any task
- **brainstorming** - Use before any creative work
- **writing-plans** - Use before implementing multi-step tasks
- **executing-plans** - Use to execute written plans
- **test-driven-development** - Use for all implementation work

### Specialized Skills
- **skill-from-masters** - Use before creating new skills to research expert methodologies
- **planning-with-files** - Use for complex tasks requiring persistent planning files
- **field-expert** - Use for advanced analytical work based on Bourdieu field theory

## How to Find Skills in the Future

### Directory Locations
1. `C:\Users\Zhang\.stigmergy\skills\` (Primary user skills)
2. `D:\AIDevelop\failureLogic\` (Project-specific skills)
3. Each skill is in its own directory with a `SKILL.md` file

### Quick Search Commands
```bash
# Find all skills in current project
find . -name "SKILL.md" -type f

# List all skill directories
ls -d */ | grep -i skill

# Search for specific skill by name
find . -path "*/skills/*" -name "*" | grep -i [skill-name]
```

## When to Use Which Skill

### Before Any Task
1. Check: `using-superpowers`
2. For creative work: `brainstorming`
3. For implementation: `writing-plans` then `executing-plans`

### For Complex Tasks
1. `planning-with-files` - For tasks requiring persistent tracking
2. `skill-from-masters` - For tasks requiring expert methodologies
3. `test-driven-development` - For coding tasks

### For Analysis
1. `field-expert` - For advanced analytical work
2. `digital-transformation` - For business/tech transformation analysis
3. `ecosystem-analysis` - For ecosystem-level analysis

This quick reference should help you find and use the right skill without extensive searching.