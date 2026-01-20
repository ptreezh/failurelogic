/**
 * Complex Financial Markets Crisis Response Simulation - Page Router
 * Implements the same pattern as other scenarios
 */
class FinancialCrisisPageRouter {
  constructor(gameState = null) {
    // Initialize game state
    this.gameState = gameState || {
      satisfaction: 50,
      resources: 100000, // Central bank reserves
      reputation: 50,    // Market confidence in central bank
      systemic_risk_level: 60, // Current systemic risk
      market_stability: 40, // Market stability index
      liquidity_index: 45, // Liquidity condition
      regulatory_compliance: 55, // Compliance level
      international_coordination: 35, // International cooperation level
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
      systemic_risk_level: 60,
      market_stability: 40,
      liquidity_index: 45,
      regulatory_compliance: 55,
      international_coordination: 35,
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
    const summary = DecisionEngine.calculateFinancialCrisisTurn(
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
        <h2>🏦 复杂金融市场危机应对模拟</h2>
        <div class="scenario-intro">
          <p>作为央行副行长，你发现复杂的金融衍生品市场中存在隐性关联和风险集中现象，但市场参与者信心仍然很高。你面临是否采取预防性措施的决策。这个场景将帮助你理解复杂金融系统中的风险识别、政策工具运用，以及常见危机管理思维陷阱。</p>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">💰 央行储备</span>
              <span class="stat-value">¥${this.gameState.resources.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🌐 市场信心</span>
              <span class="stat-value">${this.gameState.reputation}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⚠️ 系统风险</span>
              <span class="stat-value">${this.gameState.systemic_risk_level}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⚖️ 市场稳定</span>
              <span class="stat-value">${this.gameState.market_stability}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">💧 流动性</span>
              <span class="stat-value">${this.gameState.liquidity_index}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📋 监管合规</span>
              <span class="stat-value">${this.gameState.regulatory_compliance}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🤝 国际协调</span>
              <span class="stat-value">${this.gameState.international_coordination}</span>
            </div>
          </div>
          <div class="cognitive-bias-hint">
            <p><strong>💭 可能的思维陷阱：</strong></p>
            <ul>
              <li>"群体思维" - 随大流而不独立思考</li>
              <li>"确认偏误" - 只选择支持自己观点的信息</li>
              <li>"时间压力偏见" - 在压力下做出草率决策</li>
              <li>"过度自信" - 高估自己预测市场的能力</li>
              <li>"可得性偏差" - 过度关注最近发生的事件</li>
              <li>"损失厌恶" - 过度规避风险而错失机会</li>
            </ul>
          </div>
          <p class="game-goal"><strong>🎯 目标：</strong>在复杂金融系统中识别系统性风险，平衡稳定与创新</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="window.financialCrisisRouter.startGame(); window.financialCrisisRouter.render();">开始危机管理</button>
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
          id: "tighten_derivatives",
          label: "立即加强金融衍生品监管",
          description: "针对复杂的衍生品市场加强监管",
          expected_risk_reduction: 20,
          expected_market_reaction: -10,
          risk: "low",
          thinking: '"衍生品是风险的主要来源，必须立即加强监管"'
        },
        {
          id: "capital_requirements",
          label: "提高银行资本充足率要求",
          description: "增强银行体系的抗风险能力",
          expected_stability: 15,
          expected_compliance: 20,
          risk: "medium", 
          thinking: '"提高资本要求是增强银行稳定性的重要手段"'
        },
        {
          id: "stress_testing",
          label: "进行秘密的系统性风险压力测试",
          description: "评估金融体系的脆弱性",
          expected_insight: 25,
          expected_cost: 5000,
          risk: "very_low",
          thinking: '"秘密测试可以真实评估风险，不扰乱市场"'
        },
        {
          id: "monitor_only",
          label: "加强市场监控，但不采取实质性措施",
          description: "密切观察市场动态",
          expected_knowledge: 10,
          expected_cost: 2000,
          risk: "low",
          thinking: '"目前市场信心较高，不应轻易扰动，只需加强监控"'
        }
      ];
    } else if (turn === 2) {
      options = [
        {
          id: "massive_liquidity",
          label: "立即提供大规模流动性支持",
          description: "向市场注入大量流动性",
          expected_stability: 30,
          expected_moral_hazard: -20,
          risk: "high",
          thinking: '"市场动荡需要立即稳定，流动性是关键"'
        },
        {
          id: "targeted_support",
          label: "提供有限的定向支持",
          description: "精准支持有问题的机构",
          expected_stability: 15,
          expected_moral_hazard: -5,
          risk: "medium",
          thinking: '"精确支持可以稳定市场，同时避免道德风险"'
        },
        {
          id: "market_driven",
          label: "要求机构通过市场融资解决",
          description: "让市场机制发挥作用",
          expected_market_reaction: -15,
          expected_discipline: 25,
          risk: "high",
          thinking: '"市场纪律是长期稳定的根本"'
        },
        {
          id: "coordinated_intervention",
          label: "协调其他央行进行联合干预",
          description: "与国际央行协作应对",
          expected_stability: 25,
          expected_coordination: 20,
          risk: "medium",
          thinking: '"全球市场需要国际合作来稳定"'
        }
      ];
    } else if (turn === 3) {
      options = [
        {
          id: "aggressive_easing",
          label: "大幅降息以稳定市场信心",
          description: "通过降息刺激市场",
          expected_confidence: 30,
          expected_inflation: -10,
          risk: "high",
          thinking: '"降息是恢复市场信心的有力工具"'
        },
        {
          id: "maintain_rates",
          label: "保持利率不变，避免制造道德风险",
          description: "维持现有利率水平",
          expected_discipline: 20,
          expected_short_term_pain: -15,
          risk: "medium",
          thinking: '"保持利率稳定可以维护市场纪律"'
        },
        {
          id: "quantitative_easing",
          label: "实施量化宽松政策",
          description: "通过资产购买向市场注入流动性",
          expected_liquidity: 35,
          expected_asset_bubbles: -15,
          risk: "high",
          thinking: '"QE可以直接向市场注入流动性"'
        },
        {
          id: "fiscal_coordination",
          label: "协调财政政策共同应对",
          description: "与财政政策配合使用",
          expected_impact: 25,
          expected_coordination: 20,
          risk: "medium",
          thinking: '"货币政策与财政政策配合效果更佳"'
        }
      ];
    } else if (turn === 4) {
      options = [
        {
          id: "lead_coordination",
          label: "主导国际合作，制定统一应对方案",
          description: "在国际合作中发挥领导作用",
          expected_leadership: 30,
          expected_coordination: 25,
          risk: "medium",
          thinking: '"领导国际合作可以最大化影响力"'
        },
        {
          id: "follow_main",
          label: "跟随主要央行的政策",
          description: "跟随美联储等主要央行的步伐",
          expected_alignment: 20,
          expected_independence: -10,
          risk: "low",
          thinking: '"跟随主要央行可以避免政策冲突"'
        },
        {
          id: "independent_policy",
          label: "制定符合本国利益的独立政策",
          description: "优先考虑本国经济状况",
          expected_sovereignty: 25,
          expected_coordination: -15,
          risk: "high",
          thinking: '"本国利益应优先于国际合作"'
        },
        {
          id: "temporary_coordination",
          label: "建立临时性多边协调机制",
          description: "危机期间的临时协调安排",
          expected_coordination: 20,
          expected_commitment: 15,
          risk: "low",
          thinking: '"临时协调可以在保持独立性的同时获得合作益处"'
        }
      ];
    }

    return `
      <div class="game-page turn-${turn}-page">
        <div class="page-header">
          <h2>📊 第${turn}轮金融危机应对</h2>
          <div class="progress">第 ${this.currentTurn} 轮</div>
        </div>
        
        <div class="state-display">
          <h3>📈 当前金融系统状况</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="stat-label">💰 央行储备</span>
              <span class="state-value">¥${Math.round(this.gameState.resources).toLocaleString()}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">🌐 市场信心</span>
              <span class="state-value">${Math.round(this.gameState.reputation)}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">⚠️ 系统风险</span>
              <span class="state-value">${Math.round(this.gameState.systemic_risk_level)}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">⚖️ 市场稳定</span>
              <span class="state-value">${Math.round(this.gameState.market_stability)}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">💧 流动性</span>
              <span class="state-value">${Math.round(this.gameState.liquidity_index)}</span>
            </div>
            <div class="state-item">
              <span class="stat-label">📋 监管合规</span>
              <span class="state-value">${Math.round(this.gameState.regulatory_compliance)}</span>
            </div>
          </div>
        </div>
        
        <div class="situation-context">
          <h3>📝 情况描述</h3>
          <p>${
            turn === 1 
              ? "作为央行副行长，你发现复杂的金融衍生品市场中存在隐性关联和风险集中现象，但市场参与者信心仍然很高。你面临是否采取预防性措施的决策。" 
              : turn === 2
                ? "市场出现小规模动荡，一些大型机构面临流动性压力。你面临是否提供紧急流动性支持的决策。"
                : turn === 3
                  ? "危机开始蔓延，多个市场出现连锁反应。你面临是否改变货币政策立场的决策。"
                  : "危机影响到国际金融市场，需要与其他国家协调应对。你面临如何参与国际合作的决策。"
          }</p>
        </div>
        
        <div class="decision-options">
          <h3>🤔 可供选择的应对策略</h3>
          <div class="options-grid">
            ${options.map((option, index) => `
              <div class="option-card" onclick="window.financialCrisisRouter.selectOption(${index});">
                <h4>${option.label}</h4>
                <p>${option.description}</p>
                ${option.thinking ? `<div class="thinking-pattern">💡 你的想法: ${option.thinking}</div>` : ''}
                ${option.expected_risk_reduction !== undefined ? `
                <div class="expected-outcome">
                  <div>预期风险降低: <span class="value">-${option.expected_risk_reduction}</span></div>
                </div>` : ''}
                ${option.expected_stability !== undefined ? `
                <div class="expected-outcome">
                  <div>预期稳定提升: <span class="value">+${option.expected_stability}</span></div>
                </div>` : ''}
                ${option.expected_confidence !== undefined ? `
                <div class="expected-outcome">
                  <div>预期信心提升: <span class="value">+${option.expected_confidence}</span></div>
                </div>` : ''}
                <button class="choice-btn" onclick="window.financialCrisisRouter.makeDecision('crisis_choice_${turn}', '${option.id}'); window.financialCrisisRouter.render();">
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
    const decisionKey = `crisis_choice_${turn}`;
    const decisionId = this.tempDecisions[decisionKey] || 'unknown';
    
    return `
      <div class="game-page feedback-page">
        <h2>✅ 决策已确认</h2>
        
        <div class="feedback-content">
          <p><strong>你的选择：</strong> ${this.getDecisionLabel(decisionId)}</p>
          
          <div class="expectation-display">
            <h3>💭 你的线性期望</h3>
            <p>你期望通过这个金融政策决策获得直接的、可预测的稳定效果...</p>
            <p>实际市场反应将在多个层面产生复杂连锁影响，且存在时间延迟</p>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.financialCrisisRouter.confirmFeedback(); window.financialCrisisRouter.render();">继续</button>
        </div>
      </div>
    `;
  }
  
  renderTurnSummaryPage(turn) {
    // For now, just simulate a basic summary
    // In a real implementation, this would use DecisionEngine
    
    return `
      <div class="game-page turn-summary-page">
        <h2>📋 第${turn}轮应对总结</h2>
        
        <div class="comparison">
          <h3>📈 期望 vs 实际结果</h3>
          <div class="comparison-row">
            <span>你期望系统风险降低：</span>
            <span class="value">-${Math.round(10)}点</span>
          </div>
          <div class="comparison-row">
            <span>实际系统风险变化：</span>
            <span class="value">${Math.round(this.gameState.systemic_risk_level - 60)}点</span>
          </div>
        </div>
        
        <div class="narrative">
          <h3>📖 发生了什么</h3>
          <p>你的金融危机应对决策产生了连锁反应，不仅影响了直接指标，还影响了市场情绪、金融机构行为和国际投资者信心等间接因素。</p>
          <p>这些复杂系统的效应并非简单的线性关系...</p>
        </div>
        
        <div class="cognitive-insights">
          <h3>🧠 认知洞察</h3>
          <p>金融系统充满了复杂的相互依赖关系、市场心理和政策传导机制。简单的线性思维（如果我实施X政策，就会得到Y结果）往往忽略了市场预期、传导时滞和意想不到的副作用。</p>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.financialCrisisRouter.nextTurn(); window.financialCrisisRouter.render();">
            进入第${this.currentTurn + 1}轮 →
          </button>
        </div>
      </div>
    `;
  }
  
  renderEndingPage() {
    // Calculate final performance
    const finalSystemicRisk = Math.round(this.gameState.systemic_risk_level);
    const finalMarketStability = Math.round(this.gameState.market_stability);
    const finalReputation = Math.round(this.gameState.reputation);
    const finalLiquidity = Math.round(this.gameState.liquidity_index);
    const finalRegulatoryCompliance = Math.round(this.gameState.regulatory_compliance);
    
    // Determine outcome based on performance
    let outcome = '';
    let message = '';
    
    if (finalSystemicRisk <= 30 && finalMarketStability >= 70) {
      outcome = '🏦 危秀央行家';
      message = '你成功地应对了金融系统中的风险，保持了市场稳定。';
    } else if (finalSystemicRisk <= 40 || finalMarketStability >= 60) {
      outcome = '✅ 合格央行家';
      message = '你在风险管理和市场稳定方面表现良好。';
    } else if (finalReputation >= 60) {
      outcome = '📊 政策专家';
      message = '你虽然面临市场动荡，但保持了较高的政策可信度。';
    } else {
      outcome = '📚 需要学习';
      message = '你经历了金融危机应对中的挑战，这是一个宝贵的学习机会。';
    }
    
    return `
      <div class="game-page ending-page">
        <h2>🎉 金融危机应对游戏结束</h2>
        
        <div class="final-results">
          <div class="rating">
            <h3>${outcome}</h3>
            <p class="message">${message}</p>
          </div>
          
          <div class="final-stats">
            <h3>📊 最终金融系统状况</h3>
            <div class="stat-row">
              <span>⚠️ 系统风险：</span>
              <span class="value ${finalSystemicRisk <= 50 ? 'positive' : 'negative'}">${finalSystemicRisk}</span>
            </div>
            <div class="stat-row">
              <span>⚖️ 市场稳定：</span>
              <span class="value ${finalMarketStability >= 50 ? 'positive' : 'negative'}">${finalMarketStability}</span>
            </div>
            <div class="stat-row">
              <span>🌐 市场信心：</span>
              <span class="value ${finalReputation >= 50 ? 'positive' : 'negative'}">${finalReputation}</span>
            </div>
            <div class="stat-row">
              <span>💧 流动性：</span>
              <span class="value ${finalLiquidity >= 50 ? 'positive' : 'negative'}">${finalLiquidity}</span>
            </div>
            <div class="stat-row">
              <span>📋 监管合规：</span>
              <span class="value ${finalRegulatoryCompliance >= 50 ? 'positive' : 'negative'}">${finalRegulatoryCompliance}</span>
            </div>
          </div>
          
          <div class="lessons-learned">
            <h3>🎓 你学到了什么</h3>
            <ul>
              <li>复杂金融系统中的风险识别</li>
              <li>货币政策工具的复杂传导机制</li>
              <li>短期稳定与长期稳健的平衡</li>
              <li>国际协调与国内政策的权衡</li>
            </ul>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.financialCrisisRouter.resetGame(); window.financialCrisisRouter.render();">重新挑战</button>
          <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">选择其他场景</button>
        </div>
      </div>
    `;
  }

  // ========== Helper Methods ==========
  
  getDecisionLabel(decisionId) {
    const labels = {
      'tighten_derivatives': '加强衍生品监管',
      'capital_requirements': '提高资本要求',
      'stress_testing': '压力测试',
      'monitor_only': '加强监控',
      'massive_liquidity': '大规模流动性支持',
      'targeted_support': '定向支持',
      'market_driven': '市场驱动',
      'coordinated_intervention': '协调干预',
      'aggressive_easing': '激进降息',
      'maintain_rates': '维持利率',
      'quantitative_easing': '量化宽松',
      'fiscal_coordination': '财政协调',
      'lead_coordination': '主导协调',
      'follow_main': '跟随主要央行',
      'independent_policy': '独立政策',
      'temporary_coordination': '临时协调'
    };
    return labels[decisionId] || decisionId;
  }
  
  // ========== State Persistence ==========
  
  saveState() {
    const state = {
      tempDecisions: this.tempDecisions,
      tempOptions: this.tempOptions,
      currentTurn: this.currentTurn,
      currentPage: this.currentPage,
      gameState: this.gameState
    };
    sessionStorage.setItem('financialCrisisGameState', JSON.stringify(state));
  }
  
  loadState() {
    const saved = sessionStorage.getItem('financialCrisisGameState');
    if (saved) {
      const state = JSON.parse(saved);
      this.tempDecisions = state.tempDecisions;
      this.tempOptions = state.tempOptions;
      this.currentTurn = state.currentTurn;
      this.currentPage = state.currentPage;
      this.gameState = state.gameState;
    }
  }
  
  render() {
    const container = document.getElementById('game-container');
    if (container) {
      container.innerHTML = this.renderPage();
    }
  }
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.FinancialCrisisPageRouter = FinancialCrisisPageRouter;
}