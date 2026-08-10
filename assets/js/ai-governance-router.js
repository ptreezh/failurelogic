/**
 * AI Governance and Regulation Decision Simulation - Page Router
 * Extends BasePageRouter for shared render/saveState/loadState
 */
class AIGovernancePageRouter extends BasePageRouter {
  constructor(gameState = null) {
    super('AIGovernance', 'aiGovernanceGameState');
    this.tempDecisions = [];
    this.tempOptions = [];
    this.currentTurn = 1;
    this.gameState = gameState || {
      satisfaction: 50,
      resources: 50000, // Regulatory budget
      reputation: 50,    // Public trust in regulation
      ai_capability_assessment: 30, // AI capability evaluation score
      safety_compliance: 25, // Safety compliance level
      ethical_adherence: 40, // Ethical adherence score
      innovation_balance: 35, // Balance between innovation and safety
      stakeholder_pressure: 60, // Pressure from various stakeholders
      turn_number: 1,
      decision_history: [],
      delayed_effects: []
    };
    
    // Page flow state
    this.currentPage = 'START';
    this.currentTurn = 1;
    this.currentDecisionIndex = 0;
    this.tempDecisions = {};
    this.tempOptions = [];
  }

  // ========== Page State Management ==========
  
  getCurrentPage() {
    return this.currentPage;
  }
  
  getCurrentTurn() {
    return this.currentTurn;
  }

  startGame() {
    this.currentPage = 'TURN_1_START';
  }
  
  resetGame() {
    this.currentPage = 'START';
    this.currentTurn = 1;
    this.tempDecisions = {};
    this.tempOptions = [];
    // Reset to initial state
    this.gameState = {
      satisfaction: 50,
      resources: 50000,
      reputation: 50,
      ai_capability_assessment: 30,
      safety_compliance: 25,
      ethical_adherence: 40,
      innovation_balance: 35,
      stakeholder_pressure: 60,
      turn_number: 1,
      decision_history: [],
      delayed_effects: []
    };
  }

  // ========== Decision Selection ==========
  
  selectOption(optionIndex) {
    // Store the selected option
    this.tempOptions.push(optionIndex);
  }

  // ========== Decision Flow ==========
  
  makeDecision(key, value) {
    this.tempDecisions[key] = value;
    
    // Page flow logic based on current page
    if (this.currentPage === 'TURN_1_START') {
      this.currentPage = 'TURN_1_FEEDBACK';
    } else if (this.currentPage === 'TURN_2_START') {
      this.currentPage = 'TURN_2_FEEDBACK';
    } else if (this.currentPage === 'TURN_3_START') {
      this.currentPage = 'TURN_3_FEEDBACK';
    } else if (this.currentPage === 'TURN_4_START') {
      this.currentPage = 'TURN_4_FEEDBACK';
    }
  }

  confirmFeedback() {
    const currentPage = this.currentPage;

    if (currentPage === 'TURN_1_FEEDBACK') {
      this.currentPage = 'TURN_1_SUMMARY';
    } else if (currentPage === 'TURN_2_FEEDBACK') {
      this.currentPage = 'TURN_2_SUMMARY';
    } else if (currentPage === 'TURN_3_FEEDBACK') {
      this.currentPage = 'TURN_3_SUMMARY';
    } else if (currentPage === 'TURN_4_FEEDBACK') {
      this.currentPage = 'TURN_4_SUMMARY';
    }
  }

  // ========== Turn Management ==========
  
  nextTurn() {
    // Submit current turn's decisions
    this.submitTurn();
    
    // Move to next turn
    this.currentTurn++;
    this.currentDecisionIndex = 0;
    this.tempDecisions = {};
    this.tempOptions = [];
    
    // Set next turn's page
    if (this.currentTurn === 2) {
      this.currentPage = 'TURN_2_START';
    } else if (this.currentTurn === 3) {
      this.currentPage = 'TURN_3_START';
    } else if (this.currentTurn === 4) {
      this.currentPage = 'TURN_4_START';
    } else if (this.currentTurn === 5) {
      this.currentPage = 'TURN_5_START';
    } else {
      this.currentPage = 'GAME_ENDING';
    }
  }
  
  submitTurn() {
    // Calculate turn summary using DecisionEngine
    const summary = DecisionEngine.calculateAIGovernanceTurn(
      this.currentTurn,
      this.tempDecisions,
      this.gameState,
      this.gameState.decision_history,
      this.gameState.delayed_effects
    );
    
    // Update game state
    this.gameState = { ...this.gameState, ...summary.newGameState };
    this.gameState.turn_number = this.currentTurn + 1;
    
    // Add to decision history
    this.gameState.decision_history.push({
      turn: this.currentTurn,
      decisions: { ...this.tempDecisions },
      state_before: { ...this.gameState },
      state_after: { ...summary.newGameState },
      linear_expectation: summary.linearExpectation,
      actual_result: summary.actualResult
    });
    
    // Apply delayed effects
    this.applyDelayedEffects();
    
    // Clear temporary decisions
    this.tempDecisions = {};
    this.tempOptions = [];
  }

  applyDelayedEffects() {
    const turn = this.currentTurn;
    
    if (!this.gameState.delayed_effects) return;
    
    this.gameState.delayed_effects.forEach(effect => {
      if (effect.turn === turn) {
        if (effect.changes) {
          Object.keys(effect.changes).forEach(key => {
            if (this.gameState.hasOwnProperty(key)) {
              this.gameState[key] += effect.changes[key];
            }
          });
        }
      }
    });
    
    // Remove applied effects
    this.gameState.delayed_effects = this.gameState.delayed_effects.filter(
      effect => effect.turn > turn
    );
  }

  // ========== Page Rendering ==========
  
  renderPage() {
    switch (this.currentPage) {
      case 'START':
        return this.renderStartPage();
      case 'TURN_1_START':
        return this.renderTurnPage(1);
      case 'TURN_1_FEEDBACK':
        return this.renderFeedbackPage(1);
      case 'TURN_1_SUMMARY':
        return this.renderTurnSummaryPage(1);
      case 'TURN_2_START':
        return this.renderTurnPage(2);
      case 'TURN_2_FEEDBACK':
        return this.renderFeedbackPage(2);
      case 'TURN_2_SUMMARY':
        return this.renderTurnSummaryPage(2);
      case 'TURN_3_START':
        return this.renderTurnPage(3);
      case 'TURN_3_FEEDBACK':
        return this.renderFeedbackPage(3);
      case 'TURN_3_SUMMARY':
        return this.renderTurnSummaryPage(3);
      case 'TURN_4_START':
        return this.renderTurnPage(4);
      case 'TURN_4_FEEDBACK':
        return this.renderFeedbackPage(4);
      case 'TURN_4_SUMMARY':
        return this.renderTurnSummaryPage(4);
      case 'TURN_5_START':
        return this.renderTurnPage(5);
      case 'GAME_ENDING':
        return this.renderEndingPage();
      default:
        return '<div>页面开发中...</div>';
    }
  }
  
  renderStartPage() {
    return `
      <div class="game-page start-page">
        <h2>🤖 AI治理与监管决策模拟</h2>
        <div class="scenario-intro">
          <p>作为国家AI发展委员会成员，你面对AI能力快速提升的现实：AI系统已在多个领域达到或超越人类水平。你需要制定AI能力评估和分级标准。这个场景将帮助你理解AI治理的复杂性、创新与安全的平衡，以及常见治理思维陷阱。</p>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">💰 监管预算</span>
              <span class="stat-value">¥${this.gameState.resources.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🌐 公众信任</span>
              <span class="stat-value">${this.gameState.reputation}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🤖 AI能力评估</span>
              <span class="stat-value">${this.gameState.ai_capability_assessment}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🛡️ 安全合规</span>
              <span class="stat-value">${this.gameState.safety_compliance}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⚖️ 伦理遵守</span>
              <span class="stat-value">${this.gameState.ethical_adherence}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⚡ 创新平衡</span>
              <span class="stat-value">${this.gameState.innovation_balance}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🤝 利益压力</span>
              <span class="stat-value">${this.gameState.stakeholder_pressure}</span>
            </div>
          </div>
          <div class="cognitive-bias-hint">
            <p><strong>💭 可能的思维陷阱：</strong></p>
            <ul>
              <li>"技术解决方案偏见" - 过度相信技术能解决治理问题</li>
              <li>"风险忽视偏见" - 低估AI系统的潜在风险</li>
              <li>"确认偏误" - 只关注支持自己观点的证据</li>
              <li>"过度自信" - 高估自己预测AI发展的能力</li>
              <li>"时间压力偏见" - 在压力下做出草率决策</li>
              <li>"专家权威偏见" - 盲目相信专家意见</li>
            </ul>
          </div>
          <p class="game-goal"><strong>🎯 目标：</strong>在AI快速发展背景下制定有效的治理框架，平衡创新与安全</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="window.aiGovernanceRouter.startGame(); window.aiGovernanceRouter.render();">开始AI治理</button>
        </div>
      </div>
    `;
  }
  
  renderTurnPage(turn) {
    // Define options based on turn
    let options = [];
    if (turn === 1) {
      options = [
        {
          id: "task_based_standards",
          label: "基于任务能力制定AI分级标准",
          description: "根据不同任务领域制定专门的评估标准",
          expected_assessment: 20,
          expected_compliance: 10,
          risk: "medium",
          thinking: '"不同任务领域需要专门的评估标准，通用标准不适用"'
        },
        {
          id: "safety_constraints",
          label: "引入安全和可控性作为分级标准",
          description: "优先考虑AI系统的安全性评估",
          expected_safety: 25,
          expected_innovation: -5,
          risk: "low", 
          thinking: '"安全是AI发展的首要前提，必须优先考虑"'
        },
        {
          id: "ethical_framework",
          label: "将伦理合规性作为核心评估维度",
          description: "重点评估AI系统的伦理表现",
          expected_ethics: 30,
          expected_assessment: 15,
          risk: "medium",
          thinking: '"伦理问题是AI治理的核心，必须建立严格的伦理标准"'
        },
        {
          id: "comprehensive_framework",
          label: "建立AI能力与风险的综合评估框架",
          description: "多维度评估AI系统的能力和风险",
          expected_assessment: 15,
          expected_compliance: 20,
          risk: "low",
          thinking: '"全面的评估框架能更好地管理AI风险"'
        }
      ];
    } else if (turn === 2) {
      options = [
        {
          id: "ban_self_improvement",
          label: "全面禁止AI的自我改进能力",
          description: "防止AI系统自主升级带来的风险",
          expected_safety: 35,
          expected_innovation: -25,
          risk: "low",
          thinking: '"禁止自我改进是防止超级智能出现的必要措施"'
        },
        {
          id: "limited_self_improvement",
          label: "限制在特定安全关键领域禁止自我改进",
          description: "允许有限的自我改进，但有严格限制",
          expected_safety: 20,
          expected_innovation: 10,
          risk: "medium",
          thinking: '"有控制的自我改进可以在安全范围内促进发展"'
        },
        {
          id: "supervised_improvement",
          label: "允许有限的自我改进，但需人工监督",
          description: "在人工监督下允许AI自我改进",
          expected_innovation: 25,
          expected_safety: 15,
          risk: "medium",
          thinking: '"Human oversight can ensure safe self-improvement"'
        },
        {
          id: "approval_mechanism",
          label: "建立AI能力提升的逐步审批机制",
          description: "对AI能力提升进行分阶段审批",
          expected_safety: 30,
          expected_compliance: 20,
          risk: "low",
          thinking: '"Structured approval process balances safety and innovation"'
        }
      ];
    } else if (turn === 3) {
      options = [
        {
          id: "international_union",
          label: "推动建立国际AI监管联盟",
          description: "与多国合作建立统一监管标准",
          expected_compliance: 35,
          expected_complexity: 20,
          risk: "medium",
          thinking: '"Global cooperation is essential for effective AI governance"'
        },
        {
          id: "minimum_standards",
          label: "制定最低安全标准的国际协议",
          description: "建立基础安全标准的国际框架",
          expected_compliance: 25,
          expected_adoption: 30,
          risk: "low",
          thinking: '"Minimum standards can achieve broader adoption"'
        },
        {
          id: "unilateral_approach",
          label: "保持单边政策，避免被限制",
          description: "坚持自主政策，不受国际约束",
          expected_independence: 40,
          expected_collaboration: -20,
          risk: "high",
          thinking: '"Maintaining independence is more important than collaboration"'
        },
        {
          id: "multilateral_coordination",
          label: "建立AI治理的多边协调机制",
          description: "在保持自主性的同时进行国际合作",
          expected_compliance: 30,
          expected_collaboration: 25,
          risk: "medium",
          thinking: '"Balanced approach to international cooperation"'
        }
      ];
    } else if (turn === 4) {
      options = [
        {
          id: "explainability_requirement",
          label: "要求所有AI系统必须可解释后才能使用",
          description: "强制要求AI系统具备可解释性",
          expected_safety: 30,
          expected_innovation: -15,
          risk: "low",
          thinking: '"Explainability is crucial for AI safety and trust"'
        },
        {
          id: "conditional_use",
          label: "允许在监督下使用，同时要求可解释性研究",
          description: "有条件使用并推进可解释性研究",
          expected_safety: 20,
          expected_innovation: 10,
          risk: "medium",
          thinking: '"Balanced approach to explainability and usability"'
        },
        {
          id: "patient_benefit_priority",
          label: "批准使用，优先考虑患者利益",
          description: "在医疗领域优先考虑患者利益",
          expected_benefit: 40,
          expected_risk: 20,
          risk: "high",
          thinking: '"Patient benefit outweighs explainability concerns"'
        },
        {
          id: "responsibility_mechanism",
          label: "建立AI决策责任分配机制",
          description: "明确AI决策的责任归属",
          expected_compliance: 25,
          expected_clarity: 35,
          risk: "low",
          thinking: '"Clear responsibility allocation is key to AI governance"'
        }
      ];
    }

    return `
      <div class="game-page turn-${turn}-page">
        <div class="page-header">
          <h2>📊 第${turn}轮AI治理决策</h2>
          <div class="progress">第 ${this.currentTurn} 轮</div>
        </div>
        
        <div class="state-display">
          <h3>📈 当前AI治理状况</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="stat-label">💰 监管预算</span>
              <span class="state-value">¥${Math.round(this.gameState.resources).toLocaleString()}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">🌐 公众信任</span>
              <span class="state-value">${Math.round(this.gameState.reputation)}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">🤖 AI能力评估</span>
              <span class="state-value">${Math.round(this.gameState.ai_capability_assessment)}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">🛡️ 安全合规</span>
              <span class="state-value">${Math.round(this.gameState.safety_compliance)}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">⚖️ 伦理遵守</span>
              <span class="state-value">${Math.round(this.gameState.ethical_adherence)}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">⚡ 创新平衡</span>
              <span class="state-value">${Math.round(this.gameState.innovation_balance)}</span>
            </div>
          </div>
        </div>
        
        <div class="situation-context">
          <h3>📝 情况描述</h3>
          <p>${
            turn === 1 
              ? "作为国家AI发展委员会成员，你面对AI能力快速提升的现实：AI系统已在多个领域达到或超越人类水平。你需要制定AI能力评估和分级标准。" 
              : turn === 2
                ? "一项高级AI系统在测试中表现出了自我改进的能力，引发了关于'AI安全'的担忧。你面临是否限制AI自我改进能力的决策。"
                : turn === 3
                  ? "国际上关于AI治理出现了分裂：一些国家主张严格监管，另一些国家则主张自由发展。你面临如何制定国际协调策略的决策。"
                  : "一个AI系统在医疗诊断领域表现优于人类专家，但无法解释其诊断逻辑。你面临是否批准其在临床使用的决策。"
          }</p>
        </div>
        
        <div class="decision-options">
          <h3>🤔 可供选择的治理策略</h3>
          <div class="options-grid">
            ${options.map((option, index) => `
              <div class="option-card" onclick="window.aiGovernanceRouter.selectOption(${index});">
                <h4>${option.label}</h4>
                <p>${option.description}</p>
                ${option.thinking ? `<div class="thinking-pattern">💡 你的想法: ${option.thinking}</div>` : ''}
                ${option.expected_assessment !== undefined ? `
                <div class="expected-outcome">
                  <div>预期评估提升: <span class="value">+${option.expected_assessment}</span></div>
                </div>` : ''}
                ${option.expected_safety !== undefined ? `
                <div class="expected-outcome">
                  <div>预期安全提升: <span class="value">+${option.expected_safety}</span></div>
                </div>` : ''}
                ${option.expected_ethics !== undefined ? `
                <div class="expected-outcome">
                  <div>预期伦理提升: <span class="value">+${option.expected_ethics}</span></div>
                </div>` : ''}
                <button class="choice-btn" onclick="window.aiGovernanceRouter.makeDecision('ai_gov_choice_${turn}', '${option.id}'); window.aiGovernanceRouter.render();">
                  选择此策略
                </button>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
        </div>
      </div>
    `;
  }
  
  renderFeedbackPage(turn) {
    const decisionKey = `ai_gov_choice_${turn}`;
    const decisionId = this.tempDecisions[decisionKey] || 'unknown';
    
    return `
      <div class="game-page feedback-page">
        <h2>✅ 决策已确认</h2>
        
        <div class="feedback-content">
          <p><strong>你的选择：</strong> ${this.getDecisionLabel(decisionId)}</p>
          
          <div class="expectation-display">
            <h3>💭 你的线性期望</h3>
            <p>你期望通过这个AI治理决策获得直接的、可预测的安全提升...</p>
            <p>实际治理效果将在技术发展、社会接受度、国际关系等多个层面产生复杂影响，且存在时间延迟</p>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.aiGovernanceRouter.confirmFeedback(); window.aiGovernanceRouter.render();">继续</button>
        </div>
      </div>
    `;
  }
  
  renderTurnSummaryPage(turn) {
    // For now, just simulate a basic summary
    // In a real implementation, this would use DecisionEngine
    
    return `
      <div class="game-page turn-summary-page">
        <h2>📋 第${turn}轮治理总结</h2>
        
        <div class="comparison">
          <h3>📈 期望 vs 实际结果</h3>
          <div class="comparison-row">
            <span>你期望AI能力评估提升：</span>
            <span class="value">+${Math.round(10)}分</span>
          </div>
          <div class="comparison-row">
            <span>实际AI能力评估变化：</span>
            <span class="value">${Math.round(this.gameState.ai_capability_assessment - 30)}分</span>
          </div>
        </div>
        
        <div class="narrative">
          <h3>📖 发生了什么</h3>
          <p>你的AI治理决策产生了多层面的复杂影响，不仅改变了监管框架，还影响了技术发展、产业创新和社会接受度。</p>
          <p>治理效果的显现存在时间延迟，且受到技术演进、国际协调、产业适应等多种因素影响...</p>
        </div>
        
        <div class="cognitive-insights">
          <h3>🧠 认知洞察</h3>
          <p>AI治理充满了技术创新、安全需求、伦理考量和社会接受度等多重复杂因素。简单的线性思维（如果我实施X监管，就能实现Y安全）往往忽略了技术发展的动态性、国际合作的复杂性、时间延迟效应和意想不到的副作用。</p>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.aiGovernanceRouter.nextTurn(); window.aiGovernanceRouter.render();">
            进入第${this.currentTurn + 1}轮 →
          </button>
        </div>
      </div>
    `;
  }
  
  renderEndingPage() {
    // Calculate final performance
    const finalCapabilityAssessment = Math.round(this.gameState.ai_capability_assessment);
    const finalSafetyCompliance = Math.round(this.gameState.safety_compliance);
    const finalEthicalAdherence = Math.round(this.gameState.ethical_adherence);
    const finalInnovationBalance = Math.round(this.gameState.innovation_balance);
    const finalReputation = Math.round(this.gameState.reputation);
    
    // Determine outcome based on performance
    let outcome = '';
    let message = '';
    
    if (finalSafetyCompliance >= 70 && finalEthicalAdherence >= 70 && finalInnovationBalance >= 60) {
      outcome = '🤖 卓越治理者';
      message = '你成功地在AI治理中平衡了安全、伦理和创新，建立了有效的治理框架。';
    } else if (finalSafetyCompliance >= 60 || finalEthicalAdherence >= 60) {
      outcome = '✅ 合格治理者';
      message = '你在安全或伦理方面表现良好，为AI治理做出了贡献。';
    } else if (finalInnovationBalance >= 70) {
      outcome = '⚡ 创新促进者';
      message = '你优先考虑了创新，但可能在安全方面有所欠缺。';
    } else {
      outcome = '📚 需要学习';
      message = '你经历了AI治理中的挑战，这是一个宝贵的学习机会。';
    }
    
    return `
      <div class="game-page ending-page">
        <h2>🎉 AI治理与监管决策游戏结束</h2>
        
        <div class="final-results">
          <div class="rating">
            <h3>${outcome}</h3>
            <p class="message">${message}</p>
          </div>
          
          <div class="final-stats">
            <h3>📊 最终AI治理状况</h3>
            <div class="stat-row">
              <span>🤖 能力评估：</span>
              <span class="value ${finalCapabilityAssessment >= 50 ? 'positive' : 'negative'}">${finalCapabilityAssessment}</span>
            </div>
            <div class="stat-row">
              <span>🛡️ 安全合规：</span>
              <span class="value ${finalSafetyCompliance >= 50 ? 'positive' : 'negative'}">${finalSafetyCompliance}</span>
            </div>
            <div class="stat-row">
              <span>⚖️ 伦理遵守：</span>
              <span class="value ${finalEthicalAdherence >= 50 ? 'positive' : 'negative'}">${finalEthicalAdherence}</span>
            </div>
            <div class="stat-row">
              <span>⚡ 创新平衡：</span>
              <span class="value ${finalInnovationBalance >= 50 ? 'positive' : 'negative'}">${finalInnovationBalance}</span>
            </div>
            <div class="stat-row">
              <span>🌐 公众信任：</span>
              <span class="value ${finalReputation >= 50 ? 'positive' : 'negative'}">${finalReputation}</span>
            </div>
          </div>
          
          <div class="lessons-learned">
            <h3>🎓 你学到了什么</h3>
            <ul>
              <li>AI治理的复杂性与多维度性</li>
              <li>安全与创新的平衡艺术</li>
              <li>伦理考量在技术发展中的重要性</li>
              <li>国际合作与自主发展的权衡</li>
            </ul>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.aiGovernanceRouter.resetGame(); window.aiGovernanceRouter.render();">重新挑战</button>
          <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">选择其他场景</button>
        </div>
      </div>
    `;
  }

  // ========== Helper Methods ==========
  
  getDecisionLabel(decisionId) {
    const labels = {
      'task_based_standards': '任务基准标准',
      'safety_constraints': '安全约束标准',
      'ethical_framework': '伦理框架',
      'comprehensive_framework': '综合评估框架',
      'ban_self_improvement': '禁止自我改进',
      'limited_self_improvement': '限制性自我改进',
      'supervised_improvement': '监督式改进',
      'approval_mechanism': '审批机制',
      'international_union': '国际联盟',
      'minimum_standards': '最低标准',
      'unilateral_approach': '单边策略',
      'multilateral_coordination': '多边协调',
      'explainability_requirement': '可解释性要求',
      'conditional_use': '条件使用',
      'patient_benefit_priority': '患者利益优先',
      'responsibility_mechanism': '责任机制'
    };
    return labels[decisionId] || decisionId;
  }
  
  // ========== State Persistence (extends base with extra fields) ==========

  saveState() {
    super.saveState();
    sessionStorage.setItem(this.storageKey, JSON.stringify({
      ...JSON.parse(sessionStorage.getItem(this.storageKey) || '{}'),
      tempDecisions: this.tempDecisions,
      tempOptions: this.tempOptions,
      currentTurn: this.currentTurn
    }));
  }

  loadState() {
    super.loadState();
    const saved = sessionStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.tempDecisions = state.tempDecisions || [];
        this.tempOptions = state.tempOptions || [];
        this.currentTurn = state.currentTurn || 1;
      } catch {
        // ignore
      }
    }
  }
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.AIGovernancePageRouter = AIGovernancePageRouter;
}