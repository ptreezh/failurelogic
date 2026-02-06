---
name: context-injection-hooks
version: "1.0.0"
description: "Automatically injects relevant context based on conversation content"
activation: "automatic"
priority: "high"
---

# Context Injection Hooks for Qwen

## Overview

These hooks automatically monitor conversations and inject relevant context to enhance the AI's responses. The hooks operate transparently in the background, improving the quality of interactions without requiring explicit commands.

## Hook Definitions

### Planning Context Hook

```yaml
hook:
  name: "planning-context-injector"
  trigger:
    type: "keyword-match"
    keywords: ["task", "project", "implement", "create", "develop", "build", "plan"]
    sensitivity: "medium"
  action:
    type: "context-injection"
    content: |
      ## Planning Context
      
      When working on complex tasks, consider using structured planning:
      
      1. Create a task plan with clear phases
      2. Track progress regularly
      3. Document findings and decisions
      4. Update plans based on new information
      
      Relevant skill: advanced-planning
```

### Code Analysis Hook

```yaml
hook:
  name: "code-analysis-context-injector"
  trigger:
    type: "keyword-match"
    keywords: ["code", "function", "class", "module", "library", "framework", "debug", "error"]
    sensitivity: "high"
  action:
    type: "context-injection"
    content: |
      ## Code Analysis Context
      
      When analyzing code:
      
      1. Identify the main components and their relationships
      2. Understand the data flow through the system
      3. Look for patterns and anti-patterns
      4. Consider potential edge cases and error conditions
      
      Relevant skill: code-analysis
```

### System Automation Hook

```yaml
hook:
  name: "system-automation-context-injector"
  trigger:
    type: "keyword-match"
    keywords: ["server", "configuration", "deployment", "infrastructure", "system", "admin", "install", "update"]
    sensitivity: "medium"
  action:
    type: "context-injection"
    content: |
      ## System Automation Context
      
      When performing system operations:
      
      1. Assess the current system state
      2. Plan changes incrementally
      3. Verify changes after implementation
      4. Document all modifications
      
      Relevant skill: system-automation
```

### Research Assistant Hook

```yaml
hook:
  name: "research-context-injector"
  trigger:
    type: "keyword-match"
    keywords: ["research", "investigate", "analyze", "study", "examine", "compare", "evaluate"]
    sensitivity: "medium"
  action:
    type: "context-injection"
    content: |
      ## Research Context
      
      When conducting research:
      
      1. Define clear research objectives
      2. Identify credible sources
      3. Organize findings systematically
      4. Synthesize information into actionable insights
      
      Relevant skill: research-assistant
```

### Task Transition Hook

```yaml
hook:
  name: "task-transition-detector"
  trigger:
    type: "pattern-match"
    patterns: 
      - "now I need to|next step|moving on to|switching to"
    sensitivity: "high"
  action:
    type: "context-injection"
    content: |
      ## Task Transition Detected
      
      When transitioning between tasks, consider:
      
      1. Summarizing progress on the previous task
      2. Connecting previous work to the new task
      3. Adjusting approach based on lessons learned
      4. Setting clear objectives for the new task
```

## Implementation Notes

These hooks are designed to work with the Qwen system by:

1. Monitoring incoming user messages for trigger conditions
2. When triggers are detected, automatically appending relevant context
3. Ensuring the injected context enhances rather than overrides the conversation
4. Maintaining conversation flow and coherence

## Configuration

To use these hooks in your Qwen environment, they would typically be placed in the system's hooks directory and loaded at startup. The exact implementation depends on the Qwen system architecture.