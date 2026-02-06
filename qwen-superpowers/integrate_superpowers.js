#!/usr/bin/env node
/**
 * Qwen Superpowers Integration Script
 * Integrates all Superpowers components into the Qwen system
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Define paths
const USER_HOME = os.homedir();
const QWEN_CONFIG_DIR = path.join(USER_HOME, '.qwen');
const QWEN_SKILLS_DIR = path.join(QWEN_CONFIG_DIR, 'skills');
const QWEN_HOOKS_DIR = path.join(QWEN_CONFIG_DIR, 'hooks');

class QwenSuperpowersIntegrator {
  constructor() {
    this.integrationInfo = {
      name: 'Qwen Superpowers',
      version: '1.0.0',
      description: 'Enhanced AI capabilities through dynamic context injection and skill activation',
      components: [
        'Advanced Planning',
        'Code Analysis', 
        'System Automation',
        'Research Assistant',
        'Planning with Files',
        'Context Injection Hooks'
      ]
    };
  }

  async integrate() {
    console.log('Starting Qwen Superpowers Integration...');
    console.log('=====================================');

    // Step 1: Verify required directories exist
    await this.createDirectories();
    
    // Step 2: Install skills
    await this.installSkills();
    
    // Step 3: Install hooks
    await this.installHooks();
    
    // Step 4: Update configuration
    await this.updateConfiguration();
    
    // Step 5: Create integration verification
    await this.createVerificationFile();
    
    console.log('\n[SUCCESS] Qwen Superpowers fully integrated!');
    console.log('\nTo activate the integration:');
    console.log('1. Restart your Qwen environment');
    console.log('2. The Superpowers will automatically enhance your interactions');
    console.log('3. Look for context injection when discussing complex topics');
    
    return true;
  }

  async createDirectories() {
    console.log('\nStep 1: Creating required directories...');
    
    const dirsToCreate = [QWEN_SKILLS_DIR, QWEN_HOOKS_DIR];
    
    for (const dir of dirsToCreate) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  [CREATED] ${dir}`);
      } else {
        console.log(`  [EXISTS]  ${dir}`);
      }
    }
  }

  async installSkills() {
    console.log('\nStep 2: Verifying skills installation...');
    
    const skills = [
      'advanced-planning',
      'code-analysis', 
      'system-automation',
      'research-assistant',
      'planning-with-files'
    ];
    
    for (const skill of skills) {
      const skillDir = path.join(QWEN_SKILLS_DIR, skill);
      const skillFile = path.join(skillDir, 'SKILL.md');
      
      if (fs.existsSync(skillFile)) {
        console.log(`  [INSTALLED] ${skill}`);
      } else {
        console.log(`  [MISSING]   ${skill} - Please reinstall this skill`);
      }
    }
  }

  async installHooks() {
    console.log('\nStep 3: Installing hooks...');
    
    // Copy the Superpowers hook
    const sourceHookPath = path.join(__dirname, 'hooks', 'qwen_superpowers_hook.js');
    const targetHookPath = path.join(QWEN_HOOKS_DIR, 'qwen_superpowers_hook.js');
    
    if (fs.existsSync(sourceHookPath)) {
      fs.copyFileSync(sourceHookPath, targetHookPath);
      console.log(`  [INSTALLED] Superpowers hook at ${targetHookPath}`);
    } else {
      console.log(`  [MISSING] Superpowers hook file not found at ${sourceHookPath}`);
    }
  }

  async updateConfiguration() {
    console.log('\nStep 4: Updating configuration...');
    
    // Read existing config
    let existingConfig = {};
    const configPath = path.join(QWEN_CONFIG_DIR, 'config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        existingConfig = JSON.parse(configContent);
      } catch (e) {
        console.log(`  [WARNING] Could not read existing config: ${e.message}`);
      }
    }
    
    // Update config with Superpowers info
    const updatedConfig = {
      ...existingConfig,
      superpowers_integration: {
        enabled: true,
        version: this.integrationInfo.version,
        installation_date: new Date().toISOString(),
        components: this.integrationInfo.components
      }
    };
    
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    console.log(`  [UPDATED] Configuration at ${configPath}`);
    
    // Update hooks configuration
    const hooksConfigPath = path.join(QWEN_CONFIG_DIR, 'hooks.json');
    const hooksConfig = {
      qwen_superpowers: {
        enabled: true,
        priority: 10,
        onPrompt: true,
        onResponse: true,
        context_injection: {
          enabled: true,
          max_context_length: 2000,
          trigger_keywords: [
            "task",
            "project",
            "plan",
            "code",
            "function",
            "debug",
            "server",
            "config",
            "research",
            "analyze",
            "implement",
            "develop",
            "create",
            "build",
            "multi-step"
          ]
        }
      },
      cross_cli_adapter: {
        enabled: true,
        supported_tools: [
          "claude",
          "gemini",
          "qwen",
          "iflow",
          "qodercli",
          "codebuddy",
          "copilot",
          "codex"
        ],
        trigger_patterns: [
          "use\\s+(\\w+)\\s+to\\s+(.+)$",
          "call\\s+(\\w+)\\s+(.+)$",
          "ask\\s+(\\w+)\\s+(.+)$",
          "stigmergy\\s+(\\w+)\\s+(.+)$"
        ]
      }
    };
    
    fs.writeFileSync(hooksConfigPath, JSON.stringify(hooksConfig, null, 2));
    console.log(`  [UPDATED] Hooks configuration at ${hooksConfigPath}`);
  }

  async createVerificationFile() {
    console.log('\nStep 5: Creating verification file...');
    
    const verificationInfo = {
      ...this.integrationInfo,
      timestamp: new Date().toISOString(),
      status: 'fully_integrated',
      activation_instructions: [
        'Restart your Qwen environment',
        'Look for context injection in responses',
        'Try prompts related to planning, coding, system tasks, or research'
      ]
    };
    
    const verificationPath = path.join(QWEN_CONFIG_DIR, 'SUPERPOWERS_INTEGRATION.json');
    fs.writeFileSync(verificationPath, JSON.stringify(verificationInfo, null, 2));
    
    console.log(`  [CREATED] Verification file at ${verificationPath}`);
  }
}

// Run the integration if this script is executed directly
if (require.main === module) {
  const integrator = new QwenSuperpowersIntegrator();
  
  integrator.integrate()
    .then(success => {
      if (success) {
        console.log('\n[COMPLETE] Integration process finished successfully');
      } else {
        console.log('\n[FAILED] Integration process encountered errors');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n[ERROR] Integration failed:', error);
      process.exit(1);
    });
}

module.exports = QwenSuperpowersIntegrator;