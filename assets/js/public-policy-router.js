/**
 * Public Policy Making Simulation - Page Router
 * Implements the same pattern as other scenarios
 */
class PublicPolicyPageRouter {
  constructor(gameState = null) {
    // Initialize game state
    this.gameState = gameState || {
      satisfaction: 50,
      resources: 10000,  // Budget allocation
      reputation: 50,    // Public trust
      policy_effectiveness: 30, // Effectiveness rating
      public_support: 50, // Public support level
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      stakeholder_pressure: 20 // Pressure from different groups
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
      policy_effectiveness: 30,
      public_support: 50,
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      stakeholder_pressure: 20
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
      this.currentPage = 'TURN_3_START';
    } else {
      this.currentPage = 'GAME_ENDING';
    }
  }
  
  submitTurn() {
    // Calculate turn summary using DecisionEngine
    const summary = DecisionEngine.calculatePublicPolicyTurn(
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
        <h2>🏛️ 公共政策制定模拟</h2>
        <div class="scenario-intro">
          <p>作为城市规划者，你负责改善城市的交通拥堵问题。预算有限，但市民抱怨严重。有四个方案可供选择。</p>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">💰 预算</span>
              <span class="stat-value">¥${this.gameState.resources}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⭐ 公众信任</span>
              <span class="stat-value">${this.gameState.reputation}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📊 政策效果</span>
              <span class="stat-value">${this.gameState.policy_effectiveness}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">👥 民众支持</span>
              <span class="stat-value">${this.gameState.public_support}</span>
            </div>
          </div>
          <div class="cognitive-bias-hint">
            <p><strong>💭 可能的思维陷阱：</strong></p>
            <ul>
              <li>"复杂问题有简单解决方案" (过度简化)</li>
              <li>"我能准确预测公众反应" (过度自信)</li>
              <li>"选择最显眼的方案最有效" (可用性偏误)</li>
              <li>"维持现状是最好的" (现状偏见)</li>
            </ul>
          </div>
          <p class="game-goal"><strong>🎯 目标：</strong>在预算约束和多重利益冲突下制定有效的交通政策</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="window.publicPolicyRouter.startGame(); window.publicPolicyRouter.render();">开始决策</button>
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
          id: "new_subway",
          label: "建设新的地铁线路",
          description: "大规模基础设施投资，长期效果显著",
          expected_cost: 6000,
          expected_benefit: 25,
          risk: "high",
          thinking: '"地铁是最现代化的解决方案，一次投资，永久受益"'
        },
        {
          id: "bus_expansion",
          label: "扩大公交网络",
          description: "灵活的公共交通扩展，成本相对较低",
          expected_cost: 3000,
          expected_benefit: 15,
          risk: "medium", 
          thinking: '"公交系统更容易实施，覆盖面广"'
        },
        {
          id: "congestion_fee",
          label: "征收拥堵费以抑制私家车使用",
          description: "经济手段调节交通，但可能引起民怨",
          expected_cost: 500,
          expected_benefit: 20,
          risk: "high",
          thinking: '"经济激励是最有效的行为调节手段"'
        },
        {
          id: "bike_lanes",
          label: "提供自行车道和共享自行车项目",
          description: "环保型交通方案，鼓励绿色出行",
          expected_cost: 1500,
          expected_benefit: 10,
          risk: "low",
          thinking: '"绿色出行是未来的趋势，应该优先发展"'
        }
      ];
    } else if (turn === 2) {
      options = [
        {
          id: "stick_to_plan",
          label: "坚持原计划，认为长期效益更重要",
          description: "继续推进既定政策，不因短期反馈改变",
          expected_cost: 0,
          expected_benefit: 10,
          risk: "medium",
          thinking: '"政策需要时间显现效果，不能因暂时反对而放弃"'
        },
        {
          id: "collect_feedback",
          label: "收集更多反馈，调整方案细节",
          description: "暂停部分措施，听取各方意见",
          expected_cost: 800,
          expected_benefit: 15,
          risk: "low",
          thinking: '"听取民意是民主决策的基础"'
        },
        {
          id: "restart_consultation",
          label: "启动新的协商流程，重新评估各方案",
          description: "全面重新评估，可能延误项目进度",
          expected_cost: 2000,
          expected_benefit: 20,
          risk: "high",
          thinking: '"我们需要更广泛的共识才能成功"'
        },
        {
          id: "delegate_responsibility",
          label: "转移责任给其他部门",
          description: "将争议决策转交给其他机构处理",
          expected_cost: 0,
          expected_benefit: 5,
          risk: "high",
          thinking: '"分权可以减少我的政治风险"'
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
              <span class="state-label">💰 预算</span>
              <span class="state-value">¥${Math.round(this.gameState.resources)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">⭐ 信任</span>
              <span class="state-value">${Math.round(this.gameState.reputation)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">📊 政策效果</span>
              <span class="state-value">${Math.round(this.gameState.policy_effectiveness)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">👥 民众支持</span>
              <span class="state-value">${Math.round(this.gameState.public_support)}</span>
            </div>
          </div>
        </div>
        
        <div class="situation-context">
          <h3>📝 情况描述</h3>
          <p>${
            turn === 1 
              ? "作为城市规划者，你负责改善城市的交通拥堵问题。预算有限，但市民抱怨严重。有四个方案可供选择。" 
              : "方案实施后，收到了来自各方的不同反馈，部分居民抱怨成本增加，环保组织批评方案不够绿色，企业抱怨商业活动受到影响。"
          }</p>
        </div>
        
        <div class="decision-options">
          <h3>🤔 可供选择的政策</h3>
          <div class="options-grid">
            ${options.map((option, index) => `
              <div class="option-card" onclick="window.publicPolicyRouter.selectOption(${index});">
                <h4>${option.label}</h4>
                <p>${option.description}</p>
                ${option.thinking ? `<div class="thinking-pattern">💡 你的想法: ${option.thinking}</div>` : ''}
                ${option.expected_cost !== undefined ? `
                <div class="expected-outcome">
                  <div>预估成本: <span class="negative">¥${option.expected_cost}</span></div>
                  <div>预估收益: <span class="positive">+${option.expected_benefit} 效果</span></div>
                </div>` : ''}
                <button class="choice-btn" onclick="window.publicPolicyRouter.makeDecision('policy_choice_${turn}', '${option.id}'); window.publicPolicyRouter.render();">
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
    const decisionKey = `policy_choice_${turn}`;
    const decisionId = this.tempDecisions[decisionKey] || 'unknown';
    
    return `
      <div class="game-page feedback-page">
        <h2>✅ 决策已确认</h2>
        
        <div class="feedback-content">
          <p><strong>你的选择：</strong> ${this.getDecisionLabel(decisionId)}</p>
          
          <div class="expectation-display">
            <h3>💭 你的线性期望</h3>
            <p>你期望通过这个政策获得直接的、可预测的交通改善...</p>
            <p>实际效果将在社会、经济、环境等多个层面产生复杂影响，且存在时间延迟</p>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.publicPolicyRouter.confirmFeedback(); window.publicPolicyRouter.render();">继续</button>
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
            <span>你期望政策效果：</span>
            <span class="value">${Math.round(this.gameState.policy_effectiveness + 10)}%</span>
          </div>
          <div class="comparison-row">
            <span>实际政策效果：</span>
            <span class="value">${Math.round(this.gameState.policy_effectiveness)}%</span>
          </div>
        </div>
        
        <div class="narrative">
          <h3>📖 发生了什么</h3>
          <p>你的政策决策产生了多层面的复杂影响，不仅改变了交通状况，还影响了经济活力、环境质量、社会公平等多个维度。</p>
          <p>政策效果的显现存在时间延迟，且受到民众接受度、执行效率、外部环境等多种因素影响...</p>
        </div>
        
        <div class="cognitive-insights">
          <h3>🧠 认知洞察</h3>
          <p>公共政策环境中充满了复杂的社会经济关系。简单的线性思维（如果我实施X政策，就会得到Y结果）往往忽略了利益相关者的多样性、政策执行的复杂性、时间延迟效应和意想不到的副作用。</p>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.publicPolicyRouter.nextTurn(); window.publicPolicyRouter.render();">
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
    const finalPolicyEffectiveness = Math.round(this.gameState.policy_effectiveness);
    const finalPublicSupport = Math.round(this.gameState.public_support);
    
    // Determine outcome based on performance
    let outcome = '';
    let message = '';
    
    if (finalPolicyEffectiveness >= 70 && finalPublicSupport >= 70) {
      outcome = '🏆 杰出政策制定者';
      message = '你成功地在复杂的政治环境中制定并实施了有效政策，平衡了各方利益。';
    } else if (finalPolicyEffectiveness >= 50 || finalPublicSupport >= 60) {
      outcome = '⭐ 合格政策制定者';
      message = '你在某些方面表现出色，学到了政策制定的复杂性。';
    } else {
      outcome = '📚 需要学习';
      message = '你经历了政策制定中的挑战，这是一个宝贵的学习机会。';
    }
    
    return `
      <div class="game-page ending-page">
        <h2>🎉 公共政策制定游戏结束</h2>
        
        <div class="final-results">
          <div class="rating">
            <h3>${outcome}</h3>
            <p class="message">${message}</p>
          </div>
          
          <div class="final-stats">
            <h3>📊 最终状态</h3>
            <div class="stat-row">
              <span>💰 预算：</span>
              <span class="value ${finalResources >= 5000 ? 'positive' : 'negative'}">¥${finalResources}</span>
            </div>
            <div class="stat-row">
              <span>⭐ 信任：</span>
              <span class="value">${finalReputation}</span>
            </div>
            <div class="stat-row">
              <span>📊 政策效果：</span>
              <span class="value">${finalPolicyEffectiveness}</span>
            </div>
            <div class="stat-row">
              <span>👥 民众支持：</span>
              <span class="value">${finalPublicSupport}</span>
            </div>
          </div>
          
          <div class="lessons-learned">
            <h3>🎓 你学到了什么</h3>
            <ul>
              <li>政策制定中的非线性效应</li>
              <li>多利益相关者协调的复杂性</li>
              <li>短期利益与长期效益的平衡</li>
              <li>民意与专业判断的权衡</li>
            </ul>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.publicPolicyRouter.resetGame(); window.publicPolicyRouter.render();">重新挑战</button>
          <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">选择其他场景</button>
        </div>
      </div>
    `;
  }

  // ========== Helper Methods ==========
  
  getDecisionLabel(decisionId) {
    const labels = {
      'new_subway': '建设地铁',
      'bus_expansion': '扩展公交',
      'congestion_fee': '征收拥堵费',
      'bike_lanes': '自行车道',
      'stick_to_plan': '坚持原计划',
      'collect_feedback': '收集反馈',
      'restart_consultation': '重新协商',
      'delegate_responsibility': '转移责任'
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
    sessionStorage.setItem('publicPolicyGameState', JSON.stringify(state));
  }
  
  loadState() {
    const saved = sessionStorage.getItem('publicPolicyGameState');
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
  window.PublicPolicyPageRouter = PublicPolicyPageRouter;
}