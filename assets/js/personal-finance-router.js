/**
 * Personal Finance Decision Simulation - Page Router
 * Implements the same pattern as other scenarios
 */
class PersonalFinancePageRouter {
  constructor(gameState = null) {
    // Initialize game state
    this.gameState = gameState || {
      satisfaction: 50,
      resources: 150000,  // Total savings/investments
      income: 100000,     // Annual income
      debt: 0,            // Debt level
      financial_knowledge: 30, // Financial literacy score
      risk_tolerance: 50, // Risk tolerance level
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
      resources: 150000,
      income: 100000,
      debt: 0,
      financial_knowledge: 30,
      risk_tolerance: 50,
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
    }
  }

  confirmFeedback() {
    const currentPage = this.currentPage;

    if (currentPage === 'TURN_1_FEEDBACK') {
      this.currentPage = 'TURN_1_SUMMARY';
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
    } else {
      this.currentPage = 'GAME_ENDING';
    }
  }
  
  submitTurn() {
    // Calculate turn summary using DecisionEngine
    const summary = DecisionEngine.calculatePersonalFinanceTurn(
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
      case 'GAME_ENDING':
        return this.renderEndingPage();
      default:
        return '<div>页面开发中...</div>';
    }
  }
  
  renderStartPage() {
    return `
      <div class="game-page start-page">
        <h2>💰 个人理财决策模拟</h2>
        <div class="scenario-intro">
          <p>你刚毕业，获得一份年薪10万的工作，有5万积蓄，需要决定如何理财。这个场景将帮助你理解复利的力量、风险与回报的平衡，以及常见理财思维陷阱。</p>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">💰 总资产</span>
              <span class="stat-value">¥${this.gameState.resources.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">💼 年收入</span>
              <span class="stat-value">¥${this.gameState.income.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📊 理财知识</span>
              <span class="stat-value">${this.gameState.financial_knowledge}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⚖️ 风险承受</span>
              <span class="stat-value">${this.gameState.risk_tolerance}</span>
            </div>
          </div>
          <div class="cognitive-bias-hint">
            <p><strong>💭 可能的思维陷阱：</strong></p>
            <ul>
              <li>"立即满足偏好" - 优先当前消费而非长期投资</li>
              <li>"线性增长偏见" - 低估复利效应</li>
              <li>"过度自信" - 高估自己预测市场的能力</li>
              <li>"损失厌恶" - 过度规避风险而错失机会</li>
            </ul>
          </div>
          <p class="game-goal"><strong>🎯 目标：</strong>在人生早期建立良好的理财习惯，理解复利和风险评估</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="window.personalFinanceRouter.startGame(); window.personalFinanceRouter.render();">开始理财规划</button>
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
          id: "buy_car",
          label: "立即购买一辆新车提升形象",
          description: "花费大额资金购买汽车，满足当前需求",
          expected_cost: 30000,
          expected_value_loss: 8000, // Depreciation
          risk: "medium",
          thinking: '"拥有一辆好车有助于职业发展和社交形象"'
        },
        {
          id: "save_bank",
          label: "全部存入银行储蓄账户",
          description: "保守理财，保证本金安全",
          expected_return: 0.02, // 2% annual
          expected_cost: 0,
          risk: "very_low", 
          thinking: '"银行存款最安全，不会有损失"'
        },
        {
          id: "stock_market",
          label: "投入股票市场寻求高回报",
          description: "高风险高回报的投资策略",
          expected_return: 0.10, // 10% average
          expected_cost: 0,
          risk: "high",
          thinking: '"股市长期回报最高，我可以通过选股获得超额收益"'
        },
        {
          id: "index_fund",
          label: "投资低成本指数基金，并保留应急资金",
          description: "平衡风险与回报的稳健策略",
          expected_return: 0.07, // 7% average
          expected_cost: 5000, // Emergency fund kept aside
          risk: "medium",
          thinking: '"指数基金费用低，分散风险，符合长期投资理念"'
        }
      ];
    } else if (turn === 2) {
      // Second turn could involve career advancement, investment adjustments, etc.
      options = [
        {
          id: "increase_savings_rate",
          label: "提高储蓄率，减少非必要开支",
          description: "将更多收入用于储蓄和投资",
          expected_return: 0.07, // Assuming index fund allocation
          expected_cost: personal_finance_impact,
          risk: "low",
          thinking: '"The earlier I save and invest, the more I benefit from compound growth"'
        },
        {
          id: "risky_investment",
          label: "尝试更高风险的投资机会",
          description: "追求更高回报，承担更大风险",
          expected_return: 0.15, // High but uncertain
          expected_cost: 0,
          risk: "very_high",
          thinking: '"I can predict market movements and time the market correctly"'
        },
        {
          id: "get_loan_invest",
          label: "借贷投资以放大收益",
          description: "使用杠杆增加投资规模",
          expected_return: 0.14, // Amplified returns
          expected_cost: loan_interest,
          risk: "extreme",
          thinking: '"Low interest rates make borrowing attractive for investment"'
        },
        {
          id: "diversify_portfolio",
          label: "进一步分散投资组合",
          description: "降低整体风险",
          expected_return: 0.06, // Slightly lower due to diversification
          expected_cost: 0,
          risk: "low",
          thinking: '"Diversification is the only free lunch in finance"'
        }
      ];
    }

    return `
      <div class="game-page turn-${turn}-page">
        <div class="page-header">
          <h2>📊 第${turn}年财务决策</h2>
          <div class="progress">第 ${this.currentTurn} 年</div>
        </div>
        
        <div class="state-display">
          <h3>📈 当前财务状况</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="state-label">💰 资产总额</span>
              <span class="state-value">¥${Math.round(this.gameState.resources).toLocaleString()}</span>
            </div>
            <div class="state-item">
              <span class="state-label">💼 年收入</span>
              <span class="state-value">¥${Math.round(this.gameState.income).toLocaleString()}</span>
            </div>
            <div class="state-item">
              <span class="state-label">📊 理财知识</span>
              <span class="state-value">${Math.round(this.gameState.financial_knowledge)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">⚖️ 风险承受</span>
              <span class="state-value">${Math.round(this.gameState.risk_tolerance)}</span>
            </div>
          </div>
        </div>
        
        <div class="situation-context">
          <h3>📝 情况描述</h3>
          <p>${
            turn === 1 
              ? "你刚毕业，获得一份年薪10万的工作，有5万积蓄，需要决定如何理财。" 
              : "经过一年的理财实践，你的财务状况有所变化，现在需要考虑调整投资策略。"
          }</p>
        </div>
        
        <div class="decision-options">
          <h3>🤔 可供选择的理财策略</h3>
          <div class="options-grid">
            ${options.map((option, index) => `
              <div class="option-card" onclick="window.personalFinanceRouter.selectOption(${index});">
                <h4>${option.label}</h4>
                <p>${option.description}</p>
                ${option.thinking ? `<div class="thinking-pattern">💡 你的想法: ${option.thinking}</div>` : ''}
                ${option.expected_return !== undefined ? `
                <div class="expected-outcome">
                  <div>预期年化收益率: <span class="value">${(option.expected_return * 100).toFixed(1)}%</span></div>
                  ${option.expected_cost > 0 ? `<div>预计支出: <span class="negative">¥${option.expected_cost.toLocaleString()}</span></div>` : ''}
                </div>` : ''}
                <button class="choice-btn" onclick="window.personalFinanceRouter.makeDecision('finance_choice_${turn}', '${option.id}'); window.personalFinanceRouter.render();">
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
    const decisionKey = `finance_choice_${turn}`;
    const decisionId = this.tempDecisions[decisionKey] || 'unknown';
    
    return `
      <div class="game-page feedback-page">
        <h2>✅ 决策已确认</h2>
        
        <div class="feedback-content">
          <p><strong>你的选择：</strong> ${this.getDecisionLabel(decisionId)}</p>
          
          <div class="expectation-display">
            <h3>💭 你的线性期望</h3>
            <p>你期望通过这个财务决策获得直接的、可预测的收益...</p>
            <p>实际财务结果将受到市场波动、复利效应、通胀和时间因素的复杂影响</p>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.personalFinanceRouter.confirmFeedback(); window.personalFinanceRouter.render();">继续</button>
        </div>
      </div>
    `;
  }
  
  renderTurnSummaryPage(turn) {
    // For now, just simulate a basic summary
    // In a real implementation, this would use DecisionEngine
    
    return `
      <div class="game-page turn-summary-page">
        <h2>📋 第${turn}年理财总结</h2>
        
        <div class="comparison">
          <h3>📈 期望 vs 实际结果</h3>
          <div class="comparison-row">
            <span>你期望资产增长：</span>
            <span class="value">+${(this.gameState.resources * 0.07).toLocaleString()}元</span>
          </div>
          <div class="comparison-row">
            <span>实际资产变化：</span>
            <span class="value">${this.gameState.resources > 150000 ? '+' : ''}${(this.gameState.resources - 150000).toLocaleString()}元</span>
          </div>
        </div>
        
        <div class="narrative">
          <h3>📖 发生了什么</h3>
          <p>你的财务决策产生了复合效应，不仅影响了当前的资产配置，还将通过复利机制对未来产生持续影响。</p>
          <p>金融市场的复杂性意味着简单的线性思维（如果我投资X，就会得到Y回报）往往忽略了波动性、通胀和时间价值等因素...</p>
        </div>
        
        <div class="cognitive-insights">
          <h3>🧠 理财洞察</h3>
          <p>个人理财环境中充满了复利效应、风险与回报的权衡、以及市场不确定性。简单的线性思维往往低估了时间的力量和市场的复杂性。早期的理财决策对长期财富积累具有重大影响。</p>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.personalFinanceRouter.nextTurn(); window.personalFinanceRouter.render();">
            进入第${this.currentTurn + 1}年 →
          </button>
        </div>
      </div>
    `;
  }
  
  renderEndingPage() {
    // Calculate final performance
    const finalResources = Math.round(this.gameState.resources);
    const finalIncome = Math.round(this.gameState.income);
    const finalKnowledge = Math.round(this.gameState.financial_knowledge);
    const finalRiskTolerance = Math.round(this.gameState.risk_tolerance);
    
    // Determine outcome based on performance
    let outcome = '';
    let message = '';
    
    // Calculate wealth growth compared to initial state
    const growthRate = (finalResources - 150000) / 150000;
    
    if (growthRate > 0.5) { // 50%+ growth
      outcome = '🏆 理财高手';
      message = '你在早期就掌握了理财的核心原则，充分利用了复利的力量。';
    } else if (growthRate > 0.2) { // 20%+ growth
      outcome = '⭐ 稳健投资者';
      message = '你做出了明智的理财决策，建立了良好的财务基础。';
    } else if (growthRate > 0) {
      outcome = '✅ 理财新手';
      message = '你学到了基本的理财知识，未来还有很大成长空间。';
    } else {
      outcome = '📚 需要学习';
      message = '你经历了理财决策中的挑战，这是宝贵的学习机会。';
    }
    
    return `
      <div class="game-page ending-page">
        <h2>🎉 个人理财游戏结束</h2>
        
        <div class="final-results">
          <div class="rating">
            <h3>${outcome}</h3>
            <p class="message">${message}</p>
          </div>
          
          <div class="final-stats">
            <h3>📊 最终财务状况</h3>
            <div class="stat-row">
              <span>💰 资产总额：</span>
              <span class="value ${finalResources >= 150000 ? 'positive' : 'negative'}">¥${finalResources.toLocaleString()}</span>
            </div>
            <div class="stat-row">
              <span>💼 年收入：</span>
              <span class="value">¥${finalIncome.toLocaleString()}</span>
            </div>
            <div class="stat-row">
              <span>📊 理财知识：</span>
              <span class="value">${finalKnowledge}</span>
            </div>
            <div class="stat-row">
              <span>⚖️ 风险认知：</span>
              <span class="value">${finalRiskTolerance}</span>
            </div>
          </div>
          
          <div class="lessons-learned">
            <h3>🎓 你学到了什么</h3>
            <ul>
              <li>复利的力量和时间的价值</li>
              <li>风险与回报的平衡</li>
              <li>避免常见的理财思维陷阱</li>
              <li>长期财务规划的重要性</li>
            </ul>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.personalFinanceRouter.resetGame(); window.personalFinanceRouter.render();">重新挑战</button>
          <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">选择其他场景</button>
        </div>
      </div>
    `;
  }

  // ========== Helper Methods ==========
  
  getDecisionLabel(decisionId) {
    const labels = {
      'buy_car': '购买汽车',
      'save_bank': '银行储蓄',
      'stock_market': '股票投资',
      'index_fund': '指数基金',
      'increase_savings_rate': '提高储蓄率',
      'risky_investment': '高风险投资',
      'get_loan_invest': '借贷投资',
      'diversify_portfolio': '分散投资'
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
    sessionStorage.setItem('personalFinanceGameState', JSON.stringify(state));
  }
  
  loadState() {
    const saved = sessionStorage.getItem('personalFinanceGameState');
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
  window.PersonalFinancePageRouter = PersonalFinancePageRouter;
}