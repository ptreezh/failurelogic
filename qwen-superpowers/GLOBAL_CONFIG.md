# Qwen Superpowers Global Configuration

## Overview

This document describes how to globally configure the Qwen Superpowers skills in your Qwen environment. These skills enhance the AI's capabilities by providing structured approaches to complex tasks.

## Skills Included

The Qwen Superpowers package includes the following skills:

1. **Advanced Planning** - For managing complex multi-step tasks
2. **Code Analysis** - For understanding and working with codebases
3. **System Automation** - For safe system administration and automation
4. **Research Assistant** - For systematic research and analysis

## Additional Features

The Qwen Superpowers package also includes:

5. **Context Injection Hooks** - Automatically injects relevant context based on conversation content

## Installation Instructions

### Step 1: Prepare Your Qwen Environment

Before installing the skills, ensure your Qwen environment is properly set up:

1. Locate your Qwen configuration directory (typically `~/.qwen/` or similar)
2. Ensure you have write permissions to this directory

### Step 2: Install Skills Globally

To install the skills globally for all projects:

1. Navigate to your Qwen configuration directory:
   ```
   cd ~/.qwen/
   ```

2. Create a skills directory if it doesn't exist:
   ```
   mkdir -p skills
   ```

3. Copy each skill directory from this package to the global skills directory:
   ```
   cp -r /path/to/qwen-superpowers/skills/* ~/.qwen/skills/
   ```

Alternatively, you can create symbolic links to keep the skills updated with the source:
   ```
   ln -s /path/to/qwen-superpowers/skills/advanced-planning ~/.qwen/skills/advanced-planning
   ln -s /path/to/qwen-superpowers/skills/code-analysis ~/.qwen/skills/code-analysis
   ln -s /path/to/qwen-superpowers/skills/system-automation ~/.qwen/skills/system-automation
   ln -s /path/to/qwen-superpowers/skills/research-assistant ~/.qwen/skills/research-assistant
   ```

### Step 3: Configure Skill Activation

The skills are designed to be contextually activated. Qwen will automatically recognize when to use these skills based on:

- Keywords in your prompts
- Context of the conversation
- Current task complexity

However, you can explicitly activate a skill by referencing it in your prompt, for example:
- "Use advanced-planning to organize this task"
- "Apply code-analysis techniques to understand this codebase"

### Step 4: Verify Installation

To verify that the skills are properly installed:

1. Restart your Qwen environment
2. Ask Qwen to list available skills (if such a command exists in your environment)
3. Test one of the skills by prompting Qwen with a relevant task

## Using the Skills

### Advanced Planning
Use when starting complex multi-step tasks. The skill will help you break down the task into manageable phases with clear progress tracking.

### Code Analysis
Use when working with unfamiliar codebases. The skill provides systematic approaches to understanding code structure, dependencies, and functionality.

### System Automation
Use when performing system administration tasks. The skill emphasizes safety, verification, and documentation to prevent errors.

### Research Assistant
Use when conducting research or analysis. The skill provides structured approaches to gathering, validating, and synthesizing information.

## Customization

You can customize these skills for your specific needs:

1. Copy the skill directory to your project's local skills directory (e.g., `./.qwen/skills/`)
2. Modify the SKILL.md file to better suit your needs
3. Local project skills take precedence over global skills

## Updating Skills

To update the skills to a newer version:

1. Download the latest version of Qwen Superpowers
2. Replace the skill directories in your global skills folder
3. Restart your Qwen environment

## Troubleshooting

If skills are not working as expected:

1. Verify that the skill directories are in the correct location
2. Check that the SKILL.md files have the correct format
3. Ensure your Qwen environment supports custom skills
4. Look for any error messages in the Qwen logs

## Uninstallation

To remove the skills:

1. Remove the skill directories from your global skills folder:
   ```
   rm -rf ~/.qwen/skills/advanced-planning
   rm -rf ~/.qwen/skills/code-analysis
   rm -rf ~/.qwen/skills/system-automation
   rm -rf ~/.qwen/skills/research-assistant
   ```

2. Restart your Qwen environment

## Best Practices

1. Start with the global installation to familiarize yourself with the skills
2. Customize skills locally for project-specific needs
3. Regularly update skills to get the latest improvements
4. Combine multiple skills for complex tasks
5. Provide feedback on skill effectiveness to improve them over time