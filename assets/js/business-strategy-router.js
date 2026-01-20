/**
 * Business Strategy Reasoning Game - Page Router
 * Implements the same pattern as CoffeeShopPageRouter and other scenarios
 */
class BusinessStrategyPageRouter {
  constructor(gameState = null) {
    // Initialize game state
    this.gameState = gameState || {
      satisfaction: 50,
      resources: 10000,  // Funding for the tech company
      reputation: 50,
      market_position: 30,  // Market position metric
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      competitive_pressure: 20,  // Competitive pressure metric
      product_quality: 50
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
      resources: 10000,
      reputation: 50,
      market_position: 30,
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      competitive_pressure: 20,
      product_quality: 50
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
    }
  }

  confirmFeedback() {
    const currentPage = this.currentPage;

    if (currentPage === 'TURN_1_FEEDBACK') {
      this.currentPage = 'TURN_1_SUMMARY';
    } else if (currentPage === 'TURN_2_FEEDBACK') {
      this.currentPage = 'TURN_2_SUMMARY';
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
      this.currentPage = 'TURN_3_START'; // Could extend to a 3rd turn
    } else {
      this.currentPage = 'GAME_ENDING';
    }
  }
  
  submitTurn() {
    // Calculate turn summary using DecisionEngine
    const summary = DecisionEngine.calculateBusinessStrategyTurn(
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
        <h2>🏢 商业战略推理游戏</h2>
        <div class="scenario-intro">
          <p>你是一家科技公司的CEO，刚刚开发出一款新型智能手机。市场研究表明消费者对此类产品有很大需求，但同时有几家大型竞争对手也在开发同类产品。</p>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">💰 公司资金</span>
              <span class="stat-value">¥${this.gameState.resources}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⭐ 声誉评分</span>
              <span class="stat-value">${this.gameState.reputation}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📊 市场地位</span>
              <span class="stat-value">${this.gameState.market_position}</span>
            </div>
          </div>
          <div class="cognitive-bias-hint">
            <p><strong>💭 可能的思维陷阱：</strong></p>
            <ul>
              <li>"立即行动总是最好的" (速度偏误)</li>
              <li>"更多功能意味着更好产品" (功能偏误)</li>
              <li>"我可以预测市场反应" (过度自信)</li>
            </ul>
          </div>
          <p class="game-goal"><strong>🎯 目标：</strong>在竞争激烈的市场中取得领先地位，避免常见的商业决策陷阱</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="window.businessStrategyRouter.startGame(); window.businessStrategyRouter.render();">开始决策</button>
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
          id: "rush_to_market",
          label: "立即投放市场，抢占先机",
          description: "快速上市，利用时间优势占领市场份额",
          expected_profit: 1500,
          risk: "high",
          thinking: '"如果我先上市，就能占据市场主导地位，即使产品不完美也没关系"'
        },
        {
          id: "perfect_product",
          label: "进行更多测试，完善产品后上市", 
          description: "投入更多时间确保产品质量，打造完美产品",
          expected_profit: 800,
          risk: "low", 
          thinking: '"只有完美的产品才能赢得市场，质量第一"'
        },
        {
          id: "acquire_competitor",
          label: "收购小型竞争对手以减少竞争压力",
          description: "通过收购消除竞争威胁，扩大市场份额",
          expected_profit: 1200,
          risk: "medium",
          thinking: '"消除竞争对手是最好的策略，强者恒强"'
        },
        {
          id: "partnership",
          label: "与其他公司合作开发",
          description: "通过合作分担风险和技术挑战",
          expected_profit: 1000,
          risk: "medium",
          thinking: '"合作可以实现双赢，资源整合优势"'
        }
      ];
    } else if (turn === 2) {
      options = [
        {
          id: "recall_all",
          label: "召回所有产品进行全面检查",
          description: "解决质量问题，保护品牌声誉",
          expected_profit: -800,
          risk: "low",
          thinking: '"安全第一，召回可以保护我们的声誉"'
        },
        {
          id: "handle_privately", 
          label: "私下处理质量问题，继续推广",
          description: "低调解决问题，不影响销售势头",
          expected_profit: 500,
          risk: "high",
          thinking: '"如果我不声张，消费者不会注意到小问题"'
        },
        {
          id: "acknowledge_improve",
          label: "承认问题并承诺改进，同时加强营销",
          description: "透明沟通，展示改进决心",
          expected_profit: 200,
          risk: "medium", 
          thinking: '"Honesty builds trust, customers will appreciate transparency"'
        },
        {
          id: "ignore_issue",
          label: "忽略问题，专注于打击竞争对手",
          description: "继续推进，希望问题自行消失",
          expected_profit: 700,
          risk: "very_high",
          thinking: '"质量问题会被新产品优势掩盖，专注进攻"'
        }
      ];
    }

    return `
      <div class="game-page turn-${turn}-page">
        <div class="page-header">
          <h2>📊 第${turn}回合决策</h2>
          <div class="progress">回合 ${this.currentTurn}/3</div>
        </div>
        
        <div class="state-display">
          <h3>📈 当前状态</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="state-label">💰 资金</span>
              <span class="state-value">¥${Math.round(this.gameState.resources)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">⭐ 声誉</span>
              <span class="state-value">${Math.round(this.gameState.reputation)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">📊 市场地位</span>
              <span class="state-value">${Math.round(this.gameState.market_position)}</span>
            </div>
          </div>
        </div>
        
        <div class="situation-context">
          <h3>📝 情况描述</h3>
          <p>${
            turn === 1 
              ? "你的科技公司刚刚开发出一款新型智能手机，市场研究表明消费者对此类产品有很大需求，但同时有几家大型竞争对手也在开发同类产品。" 
              : "产品上市后，销量超出预期，但同时出现了少量质量问题的报告。此时，竞争对手开始大规模广告宣传。"
          }</p>
        </div>
        
        <div class="decision-options">
          <h3>🤔 可供选择的策略</h3>
          <div class="options-grid">
            ${options.map((option, index) => `
              <div class="option-card" onclick="window.businessStrategyRouter.selectOption(${index});">
                <h4>${option.label}</h4>
                <p>${option.description}</p>
                ${option.thinking ? `<div class="thinking-pattern">💡 你的想法: ${option.thinking}</div>` : ''}
                ${option.expected_profit !== undefined ? `
                <div class="expected-outcome">
                  预期收益: <span class="${option.expected_profit >= 0 ? 'positive' : 'negative'}">
                    ${option.expected_profit >= 0 ? '+' : ''}¥${option.expected_profit}
                  </span>
                </div>` : ''}
                <button class="choice-btn" onclick="window.businessStrategyRouter.makeDecision('strategy_choice_${turn}', '${option.id}'); window.businessStrategyRouter.render();">
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
    const decisionKey = `strategy_choice_${turn}`;
    const decisionId = this.tempDecisions[decisionKey] || 'unknown';
    
    return `
      <div class="game-page feedback-page">
        <h2>✅ 决策已确认</h2>
        
        <div class="feedback-content">
          <p><strong>你的选择：</strong> ${this.getDecisionLabel(decisionId)}</p>
          
          <div class="expectation-display">
            <h3>💭 你的线性期望</h3>
            <p>你期望通过这个决策获得直接的、可预测的结果...</p>
            <p>实际结果将在本回合结束后揭晓（受市场竞争、消费者反应等复杂因素影响）</p>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.businessStrategyRouter.confirmFeedback(); window.businessStrategyRouter.render();">继续</button>
        </div>
      </div>
    `;
  }
  
  renderTurnSummaryPage(turn) {
    // For now, just simulate a basic summary
    // In a real implementation, this would use DecisionEngine
    
    return `
      <div class="game-page turn-summary-page">
        <h2>📋 第${turn}回合总结</h2>
        
        <div class="comparison">
          <h3>📈 期望 vs 实际结果</h3>
          <div class="comparison-row">
            <span>你期望资金变为：</span>
            <span class="value">¥${Math.round(this.gameState.resources + 500)}</span>
          </div>
          <div class="comparison-row">
            <span>实际资金：</span>
            <span class="value positive">¥${Math.round(this.gameState.resources)}</span>
          </div>
        </div>
        
        <div class="narrative">
          <h3>📖 发生了什么</h3>
          <p>你的决策产生了复杂的连锁反应，不仅影响了直接指标，还影响了市场情绪、竞争对手反应和消费者信任等间接因素。</p>
          <p>这些复杂系统的效应并非简单的线性关系...</p>
        </div>
        
        <div class="cognitive-insights">
          <h3>🧠 认知洞察</h3>
          <p>商业环境中充满了复杂的相互依赖关系。简单的线性思维（如果我做X，就会得到Y结果）往往忽略了隐藏的变量、延迟效应和系统反馈。</p>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.businessStrategyRouter.nextTurn(); window.businessStrategyRouter.render();">
            进入第${this.currentTurn + 1}回合 →
          </button>
        </div>
      </div>
    `;
  }
  
  renderEndingPage() {
    // Calculate final performance
    const finalResources = Math.round(this.gameState.resources);
    const finalReputation = Math.round(this.gameState.reputation);
    const finalMarketPosition = Math.round(this.gameState.market_position);
    
    // Determine outcome based on performance
    let outcome = '';
    let message = '';
    
    if (finalMarketPosition >= 70 && finalReputation >= 70) {
      outcome = '🏆 商业巨头';
      message = '你成功地在复杂市场中导航，平衡了速度、质量和竞争。';
    } else if (finalMarketPosition >= 50 || finalResources >= 12000) {
      outcome = '⭐ 成功企业家';
      message = '你在某些方面表现出色，学到了商业决策的复杂性。';
    } else {
      outcome = '📚 需要学习';
      message = '你经历了商业决策中的陷阱，这是一个宝贵的学习机会。';
    }
    
    return `
      <div class="game-page ending-page">
        <h2>🎉 商业战略游戏结束</h2>
        
        <div class="final-results">
          <div class="rating">
            <h3>${outcome}</h3>
            <p class="message">${message}</p>
          </div>
          
          <div class="final-stats">
            <h3>📊 最终状态</h3>
            <div class="stat-row">
              <span>💰 资金：</span>
              <span class="value ${finalResources >= 10000 ? 'positive' : 'negative'}">¥${finalResources}</span>
            </div>
            <div class="stat-row">
              <span>⭐ 声誉：</span>
              <span class="value">${finalReputation}</span>
            </div>
            <div class="stat-row">
              <span>📊 市场地位：</span>
              <span class="value">${finalMarketPosition}</span>
            </div>
          </div>
          
          <div class="lessons-learned">
            <h3>🎓 你学到了什么</h3>
            <ul>
              <li>商业决策中的非线性效应</li>
              <li>市场复杂性和竞争动态</li>
              <li>质量与速度的平衡</li>
              <li>声誉管理的重要性</li>
            </ul>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.businessStrategyRouter.resetGame(); window.businessStrategyRouter.render();">重新挑战</button>
          <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">选择其他场景</button>
        </div>
      </div>
    `;
  }

  // ========== Helper Methods ==========
  
  getDecisionLabel(decisionId) {
    const labels = {
      'rush_to_market': '立即投放市场',
      'perfect_product': '完善产品后上市',
      'acquire_competitor': '收购竞争对手',
      'partnership': '合作开发',
      'recall_all': '召回产品',
      'handle_privately': '私下处理',
      'acknowledge_improve': '承认并改进',
      'ignore_issue': '忽略问题'
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
    sessionStorage.setItem('businessStrategyGameState', JSON.stringify(state));
  }
  
  loadState() {
    const saved = sessionStorage.getItem('businessStrategyGameState');
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
  window.BusinessStrategyPageRouter = BusinessStrategyPageRouter;
}