/**
 * Global Climate Change Policy Making Game - Page Router
 * Extends BasePageRouter for shared render/saveState/loadState
 */
class ClimateChangePageRouter extends BasePageRouter {
  constructor(gameState = null) {
    super('ClimateChange', 'climateChangeGameState');
    this.tempDecisions = [];
    this.tempOptions = [];
    this.currentTurn = 1;
    this.gameState = gameState || {
      satisfaction: 50,
      resources: 100000, // International climate fund
      reputation: 50,    // International standing
      emission_reduction: 10, // Current reduction percentage
      international_cooperation: 30, // Cooperation level
      technological_advancement: 25, // Tech development level
      climate_risk: 70, // Current climate risk level
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
      resources: 100000,
      reputation: 50,
      emission_reduction: 10,
      international_cooperation: 30,
      technological_advancement: 25,
      climate_risk: 70,
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
    } else {
      this.currentPage = 'GAME_ENDING';
    }
  }
  
  submitTurn() {
    // Calculate turn summary using DecisionEngine
    const summary = DecisionEngine.calculateClimateChangeTurn(
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
      case 'GAME_ENDING':
        return this.renderEndingPage();
      default:
        return '<div>页面开发中...</div>';
    }
  }
  
  renderStartPage() {
    return `
      <div class="game-page start-page">
        <h2>🌍 全球气候变化政策制定博弈</h2>
        <div class="scenario-intro">
          <p>作为联合国气候变化框架公约的政策顾问，你掌握科学数据表明全球气温可能在未来30年内上升2.5°C。你面临制定国际减排协议的挑战。各国经济发展水平、碳排放量和减排能力差异巨大。</p>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">💰 气候基金</span>
              <span class="stat-value">¥${this.gameState.resources.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🌐 国际声望</span>
              <span class="stat-value">${this.gameState.reputation}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📉 减排进度</span>
              <span class="stat-value">${this.gameState.emission_reduction}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🤝 国际合作</span>
              <span class="stat-value">${this.gameState.international_cooperation}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🔬 技术进步</span>
              <span class="stat-value">${this.gameState.technological_advancement}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⚠️ 气候风险</span>
              <span class="stat-value">${this.gameState.climate_risk}</span>
            </div>
          </div>
          <div class="cognitive-bias-hint">
            <p><strong>💭 可能的思维陷阱：</strong></p>
            <ul>
              <li>"确认偏误" - 只关注支持自己观点的数据</li>
              <li>"可得性启发" - 过度重视近期事件</li>
              <li>"时间偏好偏差" - 忽视长期后果</li>
              <li>"技术解决方案偏见" - 过度依赖技术解决复杂社会问题</li>
              <li>"公平原则偏见" - 对公平有不同的理解和期望</li>
            </ul>
          </div>
          <p class="game-goal"><strong>🎯 目标：</strong>在多国博弈中制定有效的减排协议，平衡公平与效率</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="window.climateChangeRouter.startGame(); window.climateChangeRouter.render();">开始政策制定</button>
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
          id: "unified_targets",
          label: "制定统一的减排目标，对所有国家一视同仁",
          description: "基于公平原则，所有国家承担相同减排义务",
          expected_equity: 90,
          expected_compliance: 60,
          risk: "high",
          thinking: '"所有国家应承担相同的环境责任，体现公平原则"'
        },
        {
          id: "historical_emissions",
          label: "根据各国历史累计排放量制定差异化目标",
          description: "基于历史责任，要求高排放国家承担更多责任",
          expected_equity: 75,
          expected_compliance: 40,
          risk: "medium", 
          thinking: '"发达国家应为历史排放负责，承担更多减排义务"'
        },
        {
          id: "carbon_trading",
          label: "建立碳排放交易市场，允许排放权买卖",
          description: "基于市场机制，实现成本效益最优的减排",
          expected_efficiency: 85,
          expected_compliance: 70,
          risk: "medium",
          thinking: '"市场机制能以最低成本实现减排目标"'
        },
        {
          id: "tech_transfer",
          label: "设定技术转移机制，让发达国家支持发展中国家减排",
          description: "通过技术援助促进全球减排",
          expected_cooperation: 80,
          expected_compliance: 75,
          risk: "low",
          thinking: '"技术转移是实现全球减排的关键"'
        }
      ];
    } else if (turn === 2) {
      options = [
        {
          id: "sanctions_noncompliance",
          label: "对违约国实施经济制裁",
          description: "强制执行减排承诺",
          expected_compliance: 80,
          expected_cooperation: 30,
          risk: "high",
          thinking: '"制裁是确保协议执行的有效手段"'
        },
        {
          id: "adjust_targets",
          label: "调整减排目标以适应技术变化",
          description: "灵活调整目标，考虑新技术的可能性",
          expected_efficiency: 70,
          expected_compliance: 85,
          risk: "low",
          thinking: '"目标应随技术进步而调整，保持现实性"'
        },
        {
          id: "strengthen_monitoring",
          label: "建立更强的国际监督和执行机制",
          description: "提高透明度和问责制",
          expected_compliance: 75,
          expected_transparency: 90,
          risk: "medium",
          thinking: '"监督是确保执行的关键'"
        },
        {
          id: "green_fund",
          label: "引入更复杂的激励机制，如技术转移和绿色基金",
          description: "通过激励措施促进减排",
          expected_cooperation: 85,
          expected_compliance: 80,
          risk: "medium",
          thinking: '"激励比惩罚更能促进合作"'
        }
      ];
    } else if (turn === 3) {
      options = [
        {
          id: "ban_geoengineering",
          label: "全面禁止地球工程研究以避免风险",
          description: "谨慎对待新兴气候技术",
          expected_safety: 95,
          expected_innovation: 20,
          risk: "very_low",
          thinking: '"预防原则要求禁止高风险实验"'
        },
        {
          id: "limited_research",
          label: "允许有限的实验室研究",
          description: "在严格监管下进行研究",
          expected_safety: 80,
          expected_innovation: 60,
          risk: "low",
          thinking: '"受控研究可以评估潜在益处"'
        },
        {
          id: "pilot_programs",
          label: "支持大规模试点项目",
          description: "实地测试地球工程技术",
          expected_innovation: 90,
          expected_risk: 70,
          risk: "high",
          thinking: '"Real-world testing is necessary to assess viability"'
        },
        {
          id: "governance_framework",
          label: "建立国际地球工程治理框架",
          description: "制定规则指导相关研究和应用",
          expected_regulation: 85,
          expected_cooperation: 70,
          risk: "medium",
          thinking: '"Proper governance can harness benefits while managing risks"'
        }
      ];
    }

    return `
      <div class="game-page turn-${turn}-page">
        <div class="page-header">
          <h2>📊 第${turn}轮气候政策决策</h2>
          <div class="progress">第 ${this.currentTurn} 轮</div>
        </div>
        
        <div class="state-display">
          <h3>📈 当前全球气候状况</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="stat-label">💰 气候基金</span>
              <span class="state-value">¥${Math.round(this.gameState.resources).toLocaleString()}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">🌐 国际声望</span>
              <span class="state-value">${Math.round(this.gameState.reputation)}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">📉 减排进度</span>
              <span class="state-value">${Math.round(this.gameState.emission_reduction)}%</span>
            </div>
            <div class="state-item">
              <span class="stat-label">🤝 国际合作</span>
              <span class="state-value">${Math.round(this.gameState.international_cooperation)}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">🔬 技术进步</span>
              <span class="state-value">${Math.round(this.gameState.technological_advancement)}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">⚠️ 气候风险</span>
              <span class="state-value">${Math.round(this.gameState.climate_risk)}</span>
            </div>
          </div>
        </div>
        
        <div class="situation-context">
          <h3>📝 情况描述</h3>
          <p>${
            turn === 1 
              ? "你面临制定国际减排协议的挑战。各国经济发展水平、碳排放量和减排能力差异巨大。" 
              : turn === 2
                ? "协议达成后，部分国家未能履行承诺，同时新能源技术突破降低了减排成本。你面临如何调整激励机制的决策。"
                : "出现'突破性'地球工程方案，可能快速降低全球气温，但存在未知风险。你面临是否支持研究和试验的决策。"
          }</p>
        </div>
        
        <div class="decision-options">
          <h3>🤔 可供选择的政策</h3>
          <div class="options-grid">
            ${options.map((option, index) => `
              <div class="option-card" onclick="window.climateChangeRouter.selectOption(${index});">
                <h4>${option.label}</h4>
                <p>${option.description}</p>
                ${option.thinking ? `<div class="thinking-pattern">💡 你的想法: ${option.thinking}</div>` : ''}
                ${option.expected_equity !== undefined ? `
                <div class="expected-outcome">
                  <div>预期公平度: <span class="value">${option.expected_equity}%</span></div>
                </div>` : ''}
                ${option.expected_compliance !== undefined ? `
                <div class="expected-outcome">
                  <div>预期履约率: <span class="value">${option.expected_compliance}%</span></div>
                </div>` : ''}
                ${option.expected_efficiency !== undefined ? `
                <div class="expected-outcome">
                  <div>预期效率: <span class="value">${option.expected_efficiency}%</span></div>
                </div>` : ''}
                <button class="choice-btn" onclick="window.climateChangeRouter.makeDecision('climate_choice_${turn}', '${option.id}'); window.climateChangeRouter.render();">
                  选择此政策
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
    const decisionKey = `climate_choice_${turn}`;
    const decisionId = this.tempDecisions[decisionKey] || 'unknown';
    
    return `
      <div class="game-page feedback-page">
        <h2>✅ 决策已确认</h2>
        
        <div class="feedback-content">
          <p><strong>你的选择：</strong> ${this.getDecisionLabel(decisionId)}</p>
          
          <div class="expectation-display">
            <h3>💭 你的线性期望</h3>
            <p>你期望通过这个气候政策获得直接的、可预测的减排效果...</p>
            <p>实际政策效果将在国际关系、技术发展、经济转型等多个层面产生复杂影响，且存在时间延迟</p>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.climateChangeRouter.confirmFeedback(); window.climateChangeRouter.render();">继续</button>
        </div>
      </div>
    `;
  }
  
  renderTurnSummaryPage(turn) {
    // For now, just simulate a basic summary
    // In a real implementation, this would use DecisionEngine
    
    return `
      <div class="game-page turn-summary-page">
        <h2>📋 第${turn}轮政策总结</h2>
        
        <div class="comparison">
          <h3>📈 期望 vs 实际结果</h3>
          <div class="comparison-row">
            <span>你期望减排进度：</span>
            <span class="value">${Math.round(this.gameState.emission_reduction + 5)}%</span>
          </div>
          <div class="comparison-row">
            <span>实际减排进度：</span>
            <span class="value">${Math.round(this.gameState.emission_reduction)}%</span>
          </div>
        </div>
        
        <div class="narrative">
          <h3>📖 发生了什么</h3>
          <p>你的气候政策决策产生了多层面的复杂影响，不仅改变了排放趋势，还影响了国际合作、技术发展和经济结构转型。</p>
          <p>政策效果的显现存在时间延迟，且受到各国执行意愿、技术可行性、经济条件等多种因素影响...</p>
        </div>
        
        <div class="cognitive-insights">
          <h3>🧠 认知洞察</h3>
          <p>全球气候治理充满了复杂的国际关系、经济利益、技术挑战和社会接受度等因素。简单的线性思维（如果我制定X政策，就会实现Y减排）往往忽略了国家间的博弈、执行的复杂性、时间延迟效应和意想不到的副作用。</p>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.climateChangeRouter.nextTurn(); window.climateChangeRouter.render();">
            进入第${this.currentTurn + 1}轮 →
          </button>
        </div>
      </div>
    `;
  }
  
  renderEndingPage() {
    // Calculate final performance
    const finalEmissionReduction = Math.round(this.gameState.emission_reduction);
    const finalCooperation = Math.round(this.gameState.international_cooperation);
    const finalTechAdvancement = Math.round(this.gameState.technological_advancement);
    const finalClimateRisk = Math.round(this.gameState.climate_risk);
    
    // Determine outcome based on performance
    let outcome = '';
    let message = '';
    
    if (finalEmissionReduction >= 40 && finalCooperation >= 70) {
      outcome = '🌍 气候领袖';
      message = '你成功地在全球气候治理中发挥了领导作用，平衡了减排目标与国际合作。';
    } else if (finalEmissionReduction >= 25 || finalCooperation >= 50) {
      outcome = '📊 积极贡献者';
      message = '你在某些方面表现出色，为全球气候治理做出了积极贡献。';
    } else if (finalClimateRisk < 50) {
      outcome = '✅ 风险管控者';
      message = '你有效控制了气候风险，尽管减排成果有限。';
    } else {
      outcome = '📚 需要学习';
      message = '你经历了全球气候治理中的挑战，这是一个宝贵的学习机会。';
    }
    
    return `
      <div class="game-page ending-page">
        <h2>🎉 全球气候变化政策制定游戏结束</h2>
        
        <div class="final-results">
          <div class="rating">
            <h3>${outcome}</h3>
            <p class="message">${message}</p>
          </div>
          
          <div class="final-stats">
            <h3>📊 最终全球气候状况</h3>
            <div class="stat-row">
              <span>📉 减排进度：</span>
              <span class="value ${finalEmissionReduction >= 30 ? 'positive' : 'negative'}">${finalEmissionReduction}%</span>
            </div>
            <div class="stat-row">
              <span>🤝 国际合作：</span>
              <span class="value">${finalCooperation}</span>
            </div>
            <div class="stat-row">
              <span>🔬 技术进步：</span>
              <span class="value">${finalTechAdvancement}</span>
            </div>
            <div class="stat-row">
              <span>⚠️ 气候风险：</span>
              <span class="value ${finalClimateRisk <= 50 ? 'positive' : 'negative'}">${finalClimateRisk}</span>
            </div>
          </div>
          
          <div class="lessons-learned">
            <h3>🎓 你学到了什么</h3>
            <ul>
              <li>全球气候治理的复杂性</li>
              <li>公平与效率的平衡</li>
              <li>国际合作与国家利益的博弈</li>
              <li>长期影响与短期利益的权衡</li>
            </ul>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.climateChangeRouter.resetGame(); window.climateChangeRouter.render();">重新挑战</button>
          <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">选择其他场景</button>
        </div>
      </div>
    `;
  }

  // ========== Helper Methods ==========
  
  getDecisionLabel(decisionId) {
    const labels = {
      'unified_targets': '统一减排目标',
      'historical_emissions': '历史排放责任',
      'carbon_trading': '碳交易市场',
      'tech_transfer': '技术转移机制',
      'sanctions_noncompliance': '经济制裁',
      'adjust_targets': '调整减排目标',
      'strengthen_monitoring': '强化监督',
      'green_fund': '绿色基金',
      'ban_geoengineering': '禁止地球工程',
      'limited_research': '限制性研究',
      'pilot_programs': '试点项目',
      'governance_framework': '治理框架'
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
      }
    }
  }
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.ClimateChangePageRouter = ClimateChangePageRouter;
}