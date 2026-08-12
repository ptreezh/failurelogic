#!/usr/bin/env node
/**
 * Qwen Superpowers Hook
 * Provides dynamic context injection and skill activation for Qwen
 */

const fs = require('fs');
const path = require('path');

class QwenSuperpowersHook {
  constructor() {
    this.toolName = 'qwen-superpowers';
    this.skillsDir = path.join(process.env.USERPROFILE || process.env.HOME, '.qwen', 'skills');
    this.hooksDir = path.join(process.env.USERPROFILE || process.env.HOME, '.qwen', 'hooks');
  }

  /**
   * Called before a prompt is processed
   * This is where we inject context based on the prompt content
   */
  async onPrompt(prompt) {
    console.log(`[${this.toolName.toUpperCase()}] Processing prompt: ${prompt.substring(0, 100)}...`);

    // Determine which skills might be relevant based on the prompt
    const relevantSkills = this.getRelevantSkills(prompt);
    
    if (relevantSkills.length > 0) {
      console.log(`[${this.toolName.toUpperCase()}] Found relevant skills: ${relevantSkills.join(', ')}`);
      
      // Inject context from relevant skills
      const context = this.buildContextFromSkills(relevantSkills);
      
      // Return the original prompt with additional context
      return {
        handled: true,
        modifiedPrompt: `${context}\n\nOriginal prompt: ${prompt}`,
        extraContext: context
      };
    }

    return { handled: false };
  }

  /**
   * Called after a response is generated
   * This is where we can trigger follow-up actions
   */
  async onResponse(response) {
    console.log(`[${this.toolName.toUpperCase()}] Processing response`);
    return response;
  }

  /**
   * Determines which skills are relevant to the given prompt
   */
  getRelevantSkills(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    const relevantSkills = [];

    // Check for planning-related keywords
    if (lowerPrompt.includes('task') || 
        lowerPrompt.includes('project') || 
        lowerPrompt.includes('plan') || 
        lowerPrompt.includes('organize') ||
        lowerPrompt.includes('multi-step')) {
      relevantSkills.push('advanced-planning');
    }

    // Check for code-related keywords
    if (lowerPrompt.includes('code') || 
        lowerPrompt.includes('function') || 
        lowerPrompt.includes('class') || 
        lowerPrompt.includes('debug') ||
        lowerPrompt.includes('implement')) {
      relevantSkills.push('code-analysis');
    }

    // Check for system-related keywords
    if (lowerPrompt.includes('server') || 
        lowerPrompt.includes('config') || 
        lowerPrompt.includes('deploy') || 
        lowerPrompt.includes('system') ||
        lowerPrompt.includes('install')) {
      relevantSkills.push('system-automation');
    }

    // Check for research-related keywords
    if (lowerPrompt.includes('research') || 
        lowerPrompt.includes('investigate') || 
        lowerPrompt.includes('analyze') || 
        lowerPrompt.includes('study') ||
        lowerPrompt.includes('compare')) {
      relevantSkills.push('research-assistant');
    }

    // Check for file-based planning keywords
    if (lowerPrompt.includes('plan') || 
        lowerPrompt.includes('track') || 
        lowerPrompt.includes('progress') || 
        lowerPrompt.includes('phase')) {
      relevantSkills.push('planning-with-files');
    }

    return relevantSkills;
  }

  /**
   * Builds context from the specified skills
   */
  buildContextFromSkills(skillNames) {
    let context = "## Superpowers Context Injection\n\n";
    
    for (const skillName of skillNames) {
      const skillPath = path.join(this.skillsDir, skillName, 'SKILL.md');
      
      try {
        if (fs.existsSync(skillPath)) {
          const skillContent = fs.readFileSync(skillPath, 'utf8');
          
          // Extract the main content from the skill (skip frontmatter)
          const lines = skillContent.split('\n');
          let contentStart = 0;
          
          // Skip YAML frontmatter if present
          if (lines[0].trim() === '---') {
            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim() === '---') {
                contentStart = i + 1;
                break;
              }
            }
          }
          
          // Get the skill summary (first few sections)
          const contentLines = lines.slice(contentStart);
          let summaryEnd = 0;
          
          // Find end of summary (usually after first few sections)
          for (let i = 0; i < contentLines.length; i++) {
            if (contentLines[i].startsWith('# When to Use') || 
                contentLines[i].startsWith('## When to Use')) {
              summaryEnd = i;
              break;
            }
          }
          
          const summary = summaryEnd > 0 
            ? contentLines.slice(0, summaryEnd).join('\n') 
            : contentLines.slice(0, 20).join('\n'); // First 20 lines if no clear section
            
          context += `### ${skillName} Skill Context:\n${summary}\n\n`;
        } else {
          console.log(`[${this.toolName.toUpperCase()}] Skill file not found: ${skillPath}`);
        }
      } catch (error) {
        console.error(`[${this.toolName.toUpperCase()}] Error reading skill ${skillName}:`, error);
      }
    }
    
    return context;
  }
}

module.exports = QwenSuperpowersHook;