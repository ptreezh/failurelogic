/**
 * Investment Information Processing Scenario - Enhanced Version
 * Extends BasePageRouter for shared render/saveState/loadState
 */

class InvestmentInformationProcessingPageRouter extends BasePageRouter {
  constructor(gameState = null) {
    super('InvestmentInfo', 'investmentInfoProcessingState');
    this.tempDecisions = [];
    this.tempSources = [];
    this.currentTurn = 1;
    // Initialize game state with enhanced properties
    this.gameState = gameState || {
      portfolio: 10000,
      knowledge: 0,
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      selected_sources: [],
      source_quality: {},
      bias_risk: 0,
      achievements: [],
      information_diversity: 0,
      market_volatility: 0.1,
      confidence_level: 50
    };

    // Enhanced page flow state
    this.currentPage = 'START';
    this.currentTurn = 1;
    this.currentDecisionIndex = 0;
    this.tempDecisions = {};
    this.tempSources = [];
    this.informationSources = [
      { 
        id: 'news', 
        icon: '📰', 
        name: '财经新闻', 
        bias: 0.7, 
        reliability: 0.6,
        description: '实时财经新闻，信息量大但可能存在倾向性'
      },
      { 
        id: 'research', 
        icon: '📊', 
        name: '专业研报', 
        bias: 0.4, 
        reliability: 0.8,
        description: '专业机构研究报告，深度分析但可能滞后'
      },
      { 
        id: 'social_media', 
        icon: '📱', 
        name: '社交媒体', 
        bias: 0.8, 
        reliability: 0.3,
        description: '大众观点汇集，反映市场情绪但缺乏专业性'
      },
      { 
        id: 'expert_opinion', 
        icon: '👨‍💼', 
        name: '专家观点', 
        bias: 0.3, 
        reliability: 0.7,
        description: '行业专家见解，专业性强但可能有利益关联'
      },
      { 
        id: 'ai_analysis', 
        icon: '🤖', 
        name: 'AI分析', 
        bias: 0.2, 
        reliability: 0.9,
        description: '算法驱动分析，客观但可能缺乏情境理解'
      }
    ];
  }

  // ========== Enhanced State Management ==========

  getCurrentPage() {
    return this.currentPage;
  }

  getCurrentTurn() {
    return this.currentTurn;
  }

  startGame() {
    this.currentPage = 'TURN_1_INFORMATION_SELECTION';
  }

  resetGame() {
    this.currentPage = 'START';
    this.currentTurn = 1;
    this.tempDecisions = {};
    this.tempSources = {};
    this.gameState = {
      portfolio: 10000,
      knowledge: 0,
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      selected_sources: [],
      source_quality: {},
      bias_risk: 0,
      achievements: [],
      information_diversity: 0,
      market_volatility: 0.1,
      confidence_level: 50
    };
  }

  // ========== Enhanced Information Source Selection ==========

  toggleSource(sourceId) {
    if (this.tempSources[sourceId]) {
      delete this.tempSources[sourceId];
    } else {
      this.tempSources[sourceId] = true;
    }
  }

  // ========== Enhanced Decision Flow ==========

  makeDecision(key, value) {
    this.tempDecisions[key] = value;

    // Enhanced page flow logic
    if (this.currentPage === 'TURN_1_INFORMATION_SELECTION') {
      this.currentPage = 'TURN_1_INVESTMENT_DECISION';
    } else if (this.currentPage === 'TURN_1_INVESTMENT_DECISION') {
      this.currentPage = 'TURN_1_FEEDBACK';
    } else if (this.currentPage === 'TURN_2_INFORMATION_SELECTION') {
      this.currentPage = 'TURN_2_INVESTMENT_DECISION';
    } else if (this.currentPage === 'TURN_2_INVESTMENT_DECISION') {
      this.currentPage = 'TURN_2_FEEDBACK';
    } else if (this.currentPage === 'TURN_3_INFORMATION_SELECTION') {
      this.currentPage = 'TURN_3_INVESTMENT_DECISION';
    } else if (this.currentPage === 'TURN_3_INVESTMENT_DECISION') {
      this.currentPage = 'TURN_3_FEEDBACK';
    } else if (this.currentPage === 'TURN_4_INFORMATION_SELECTION') {
      this.currentPage = 'TURN_4_INVESTMENT_DECISION';
    } else if (this.currentPage === 'TURN_4_INVESTMENT_DECISION') {
      this.currentPage = 'TURN_4_FEEDBACK';
    }
  }

  confirmFeedback() {
    const currentPage = this.currentPage;

    if (currentPage.includes('FEEDBACK')) {
      if (this.currentTurn === 1) {
        this.currentPage = 'TURN_1_SUMMARY';
      } else if (this.currentTurn === 2) {
        this.currentPage = 'TURN_2_SUMMARY';
      } else if (this.currentTurn === 3) {
        this.currentPage = 'TURN_3_SUMMARY';
      } else if (this.currentTurn === 4) {
        this.currentPage = 'TURN_4_SUMMARY';
      }
    }
  }

  // ========== Enhanced Turn Management ==========

  nextTurn() {
    // Submit current turn's decisions
    this.submitTurn();

    // Move to next turn
    this.currentTurn++;
    this.currentDecisionIndex = 0;
    this.tempDecisions = {};
    this.tempSources = {};

    // Set next turn's page
    if (this.currentTurn === 2) {
      this.currentPage = 'TURN_2_INFORMATION_SELECTION';
    } else if (this.currentTurn === 3) {
      this.currentPage = 'TURN_3_INFORMATION_SELECTION';
    } else if (this.currentTurn === 4) {
      this.currentPage = 'TURN_4_INFORMATION_SELECTION';
    } else if (this.currentTurn === 5) {
      this.currentPage = 'GAME_ENDING';
    }
  }

  submitTurn() {
    // Calculate turn summary using enhanced decision engine
    const summary = this.calculateEnhancedTurnSummary(
      this.tempDecisions,
      this.tempSources,
      this.gameState
    );

    // Update game state with enhanced metrics
    this.gameState.portfolio = summary.actual_result.portfolio;
    this.gameState.knowledge = summary.actual_result.knowledge;
    this.gameState.information_diversity = summary.information_diversity;
    this.gameState.confidence_level = summary.confidence_level;
    this.gameState.turn_number++;

    // Add enhanced delayed effects
    if (summary.delayed_effects && summary.delayed_effects.length > 0) {
      if (!this.gameState.delayed_effects) {
        this.gameState.delayed_effects = [];
      }
      this.gameState.delayed_effects.push(...summary.delayed_effects);
    }

    // Update information source quality
    this.updateSourceQuality(Object.keys(this.tempSources));

    // Calculate enhanced bias metrics
    const biasResult = this.analyzeEnhancedConfirmationBias(
      this.gameState.decision_history,
      Object.keys(this.tempSources)
    );
    this.gameState.bias_risk = biasResult.biasRisk;

    // Add to decision history with enhanced details
    this.gameState.decision_history.push({
      turn: this.currentTurn,
      decisions: { ...this.tempDecisions },
      sources: Object.keys(this.tempSources),
      linear_expectation: summary.linear_expectation,
      actual_result: summary.actual_result,
      gap: summary.gap,
      bias_metrics: biasResult,
      information_diversity: summary.information_diversity,
      confidence_level: summary.confidence_level
    });

    // Apply delayed effects
    this.applyDelayedEffects();

    // Clear temporary decisions
    this.tempDecisions = {};
    this.tempSources = {};
  }

  calculateEnhancedTurnSummary(decisions, sources, gameState) {
    // Enhanced calculation considering information diversity
    const selectedSourceIds = Object.keys(sources);
    const diversityScore = selectedSourceIds.length / this.informationSources.length;
    
    // Base portfolio calculation
    let portfolioChange = 0;
    let knowledgeGain = 0;
    
    // Calculate based on investment decision
    if (decisions.investment_amount) {
      const amount = decisions.investment_amount;
      const marketImpact = 1 + (Math.random() - 0.5) * gameState.market_volatility;
      
      // Diversity bonus: more diverse sources = better decisions
      const diversityBonus = diversityScore * 0.1;
      
      // Calculate return with diversity factor
      const baseReturn = amount * (0.05 + Math.random() * 0.1); // 5-15% base return
      portfolioChange = baseReturn * (1 + diversityBonus);
      
      // Knowledge gain from processing diverse information
      knowledgeGain = selectedSourceIds.length * 5;
    }
    
    // Enhanced expectation calculation
    const linearExpectation = {
      portfolio: gameState.portfolio + (decisions.investment_amount || 0) * 0.08, // 8% expected
      knowledge: gameState.knowledge + knowledgeGain
    };
    
    // Actual result with randomness and diversity factor
    const actualResult = {
      portfolio: gameState.portfolio + portfolioChange,
      knowledge: gameState.knowledge + knowledgeGain
    };
    
    // Calculate gap between expectation and reality
    const gap = actualResult.portfolio - linearExpectation.portfolio;
    
    // Enhanced narrative
    const narrative = this.generateEnhancedNarrative(selectedSourceIds, diversityScore, gap);
    
    return {
      linear_expectation: linearExpectation,
      actual_result: actualResult,
      gap: gap,
      information_diversity: diversityScore,
      confidence_level: Math.min(100, gameState.confidence_level + (diversityScore * 10)),
      delayed_effects: [],
      narrative: narrative
    };
  }

  generateEnhancedNarrative(selectedSources, diversityScore, gap) {
    let narrative = "";
    
    if (diversityScore > 0.6) {
      narrative += "你选择了多样化的信息源，这有助于形成更全面的投资视角。";
    } else if (diversityScore > 0.3) {
      narrative += "你的信息源选择较为有限，可能会受到特定观点的影响。";
    } else {
      narrative += "你的信息源过于单一，容易陷入确认偏误的陷阱。";
    }
    
    if (gap > 0) {
      narrative += " 多样化的信息帮助你获得了超出预期的收益。";
    } else {
      narrative += " 信息局限性可能导致了决策偏差，影响了投资结果。";
    }
    
    return narrative;
  }

  updateSourceQuality(sourceIds) {
    sourceIds.forEach(sourceId => {
      if (!this.gameState.source_quality[sourceId]) {
        this.gameState.source_quality[sourceId] = {
          used_count: 0,
          accuracy_score: 0.5,
          bias_score: 0.5
        };
      }
      this.gameState.source_quality[sourceId].used_count++;
    });
  }

  applyDelayedEffects() {
    const turn = this.currentTurn;

    (this.gameState.delayed_effects || []).forEach(effect => {
      if (effect.turn_delay === turn) {
        if (effect.knowledge) {
          this.gameState.knowledge += effect.knowledge;
        }
        if (effect.portfolio) {
          this.gameState.portfolio += effect.portfolio;
        }
      }
    });

    // Remove applied effects
    this.gameState.delayed_effects = this.gameState.delayed_effects.filter(
      effect => effect.turn_delay > turn
    );
  }

  // ========== Enhanced Bias Analysis ==========

  analyzeEnhancedConfirmationBias(decisionHistory, currentSources) {
    if (!decisionHistory || decisionHistory.length === 0) {
      return {
        diversity: 0,
        consistency: 0,
        singleSourceRisk: 0,
        biasRisk: 0,
        recommendations: []
      };
    }

    // Enhanced diversity calculation
    const diversity = this.calculateEnhancedSourceDiversity(decisionHistory, currentSources);
    
    // Enhanced consistency calculation
    const consistency = this.calculateEnhancedSourceConsistency(decisionHistory);
    
    // Enhanced single source risk
    const singleSourceRisk = this.calculateEnhancedSingleSourceRisk(decisionHistory);
    
    // Enhanced bias risk calculation
    const biasRisk = this.calculateEnhancedBiasRisk(diversity, consistency, singleSourceRisk);

    // Generate enhanced recommendations
    const recommendations = this.generateEnhancedRecommendations(
      diversity,
      consistency,
      singleSourceRisk
    );

    return {
      diversity,
      consistency,
      singleSourceRisk,
      biasRisk,
      recommendations
    };
  }

  calculateEnhancedSourceDiversity(decisionHistory, currentSources) {
    const allSources = new Set();
    
    // Include current sources
    currentSources.forEach(source => allSources.add(source));
    
    // Include historical sources
    decisionHistory.forEach(record => {
      if (record.sources) {
        record.sources.forEach(source => allSources.add(source));
      }
    });

    return Math.min(allSources.size / this.informationSources.length, 1);
  }

  calculateEnhancedSourceConsistency(decisionHistory) {
    if (decisionHistory.length <= 1) return 0;

    let consistencyCount = 0;

    for (let i = 1; i < decisionHistory.length; i++) {
      const current = decisionHistory[i].sources ? [...decisionHistory[i].sources].sort().join(',') : '';
      const previous = decisionHistory[i-1].sources ? [...decisionHistory[i-1].sources].sort().join(',') : '';

      if (current === previous && current !== '') {
        consistencyCount++;
      }
    }

    return consistencyCount / (decisionHistory.length - 1);
  }

  calculateEnhancedSingleSourceRisk(decisionHistory) {
    const singleSourceCount = decisionHistory.filter(
      record => record.sources && record.sources.length === 1
    ).length;

    return singleSourceCount / decisionHistory.length;
  }

  calculateEnhancedBiasRisk(diversity, consistency, singleSourceRisk) {
    // Enhanced algorithm with more nuanced weighting
    const diversityFactor = (1 - diversity) * 40;  // Higher weight for low diversity
    const consistencyFactor = consistency * 30;    // Moderate weight for high consistency
    const singleSourceFactor = singleSourceRisk * 30; // Moderate weight for single source risk
    
    return Math.min(diversityFactor + consistencyFactor + singleSourceFactor, 100);
  }

  generateEnhancedRecommendations(diversity, consistency, singleSourceRisk) {
    const recommendations = [];

    if (diversity < 0.5) {
      recommendations.push("尝试使用更多样化的信息源，避免信息茧房");
    }

    if (consistency > 0.7) {
      recommendations.push("注意不要过度依赖相同的信息源组合");
    }

    if (singleSourceRisk > 0.5) {
      recommendations.push("避免仅依赖单一信息源做决策");
    }

    if (recommendations.length === 0) {
      recommendations.push("你的信息处理策略较为均衡");
    }

    return recommendations;
  }

  // ========== Enhanced Page Rendering ==========

  renderPage() {
    switch (this.currentPage) {
      case 'START':
        return this.renderStartPage();
      case 'TURN_1_INFORMATION_SELECTION':
      case 'TURN_2_INFORMATION_SELECTION':
      case 'TURN_3_INFORMATION_SELECTION':
      case 'TURN_4_INFORMATION_SELECTION':
        return this.renderInformationSelectionPage();
      case 'TURN_1_INVESTMENT_DECISION':
      case 'TURN_2_INVESTMENT_DECISION':
      case 'TURN_3_INVESTMENT_DECISION':
      case 'TURN_4_INVESTMENT_DECISION':
        return this.renderInvestmentDecisionPage();
      case 'TURN_1_FEEDBACK':
      case 'TURN_2_FEEDBACK':
      case 'TURN_3_FEEDBACK':
      case 'TURN_4_FEEDBACK':
        return this.renderFeedbackPage();
      case 'TURN_1_SUMMARY':
      case 'TURN_2_SUMMARY':
      case 'TURN_3_SUMMARY':
      case 'TURN_4_SUMMARY':
        return this.renderTurnSummaryPage();
      case 'GAME_ENDING':
        return this.renderEndingPage();
      default:
        return this.renderGenericPage();
    }
  }

  renderStartPage() {
    return `
      <div class="game-page start-page investment-information-processing">
        <h2>🔍 投资信息处理挑战</h2>
        <div class="scenario-intro">
          <p>你是一位投资者，面对海量信息需要做出投资决策。关键是如何筛选和整合信息源，避免确认偏误。</p>
          <div class="stats-grid state-display-panel">
            <div class="state-item">
              <span class="state-label">💰 初始资金</span>
              <span class="state-value">¥${this.gameState.portfolio.toLocaleString()}</span>
            </div>
            <div class="state-item">
              <span class="state-label">📚 初始知识</span>
              <span class="state-value">${this.gameState.knowledge}</span>
            </div>
            <div class="state-item">
              <span class="state-label">⚖️ 信心水平</span>
              <span class="state-value">${this.gameState.confidence_level}%</span>
            </div>
          </div>
          <div class="cognitive-bias-hint">
            <p><strong>💭 认知陷阱提示：</strong></p>
            <ul>
              <li>确认偏误：倾向于寻找支持既有观点的信息</li>
              <li>信息茧房：局限于相似信息源形成的封闭环境</li>
              <li>过度自信：高估自己信息处理能力</li>
            </ul>
          </div>
          <p class="game-goal"><strong>🎯 目标：</strong>通过4轮投资决策，学会有效处理和整合多元信息源</p>
        </div>
        <div class="actions">
          <button class="btn btn-enhanced btn-enhanced-primary btn-enhanced-large" 
                  onclick="window.investmentInfoRouter.startGame(); window.investmentInfoRouter.render();">
            开始信息处理挑战
          </button>
        </div>
      </div>
    `;
  }

  renderInformationSelectionPage() {
    return `
      <div class="game-page information-selection-page">
        <div class="page-header">
          <h2>📋 第${this.currentTurn}轮 - 信息源选择</h2>
          <div class="progress">轮次 ${this.currentTurn}/4</div>
        </div>

        <div class="state-display state-display-panel">
          <div class="state-item">
            <span class="state-label">💰 资金</span>
            <span class="state-value">¥${Math.round(this.gameState.portfolio).toLocaleString()}</span>
          </div>
          <div class="state-item">
            <span class="state-label">📚 知识</span>
            <span class="state-value">${Math.round(this.gameState.knowledge)}</span>
          </div>
          <div class="state-item">
            <span class="state-label">⚖️ 信心</span>
            <span class="state-value">${Math.round(this.gameState.confidence_level)}%</span>
          </div>
          <div class="state-item">
            <span class="state-label">⚠️ 偏误风险</span>
            <span class="state-value ${this.gameState.bias_risk > 60 ? 'warning' : ''}">${Math.round(this.gameState.bias_risk)}%</span>
          </div>
        </div>

        <div class="information-sources">
          <h3>🔍 选择信息来源 (建议选择2-4个)</h3>
          <p class="hint">多样化的信息源有助于避免确认偏误</p>
          <div class="information-source-grid">
            ${this.informationSources.map(source => `
              <div class="source-card ${this.tempSources[source.id] ? 'selected' : ''}"
                   onclick="window.investmentInfoRouter.toggleSource('${source.id}'); window.investmentInfoRouter.render();"
                   tabindex="0"
                   role="button"
                   aria-pressed="${!!this.tempSources[source.id]}"
                   aria-label="${source.name} - ${source.description}">
                <div class="source-icon">${source.icon}</div>
                <div class="source-name">${source.name}</div>
                <div class="source-reliability">可靠性: ${(source.reliability * 100).toFixed(0)}%</div>
                <div class="source-bias">偏误: ${(source.bias * 100).toFixed(0)}%</div>
                <div class="source-description">${source.description}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-enhanced btn-enhanced-primary ${Object.keys(this.tempSources).length === 0 ? 'disabled' : ''}"
                  onclick="window.investmentInfoRouter.makeDecision('information_sources', window.investmentInfoRouter.tempSources); window.investmentInfoRouter.render();">
            确认选择 (${Object.keys(this.tempSources).length}个信息源)
          </button>
        </div>
      </div>
    `;
  }

  renderInvestmentDecisionPage() {
    const investmentAmount = this.tempDecisions.investment_amount || 1000;
    const expectedReturn = investmentAmount * 0.08; // 8% expected return

    return `
      <div class="game-page investment-decision-page">
        <div class="page-header">
          <h2>📈 第${this.currentTurn}轮 - 投资决策</h2>
          <div class="progress">轮次 ${this.currentTurn}/4</div>
        </div>

        <div class="state-display state-display-panel">
          <div class="state-item">
            <span class="state-label">💰 资金</span>
            <span class="state-value">¥${Math.round(this.gameState.portfolio).toLocaleString()}</span>
          </div>
          <div class="state-item">
            <span class="state-label">📊 信息多样性</span>
            <span class="state-value">${(this.gameState.information_diversity * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div class="investment-controls">
          <div class="investment-control-group">
            <label class="control-label">投资金额 (¥)</label>
            <input type="range" 
                   class="range-slider" 
                   id="investment-amount" 
                   min="100" 
                   max="${this.gameState.portfolio}" 
                   value="${investmentAmount}"
                   oninput="window.investmentInfoRouter.tempDecisions.investment_amount = parseInt(this.value); window.investmentInfoRouter.render();">
            <div class="control-value">¥${investmentAmount.toLocaleString()}</div>
            <div class="range-min-max">
              <span>¥100</span>
              <span>¥${Math.round(this.gameState.portfolio).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="expectation-calculator">
          <h3>💭 你的预期</h3>
          <div class="calculation-breakdown">
            <p>基于所选信息源的分析，你预期投资¥${investmentAmount.toLocaleString()}将获得约¥${Math.round(expectedReturn).toLocaleString()}的回报。</p>
            <p>实际结果将取决于市场波动和信息处理的有效性。</p>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-enhanced btn-enhanced-primary"
                  onclick="window.investmentInfoRouter.makeDecision('investment_decision', window.investmentInfoRouter.tempDecisions.investment_amount); window.investmentInfoRouter.render();">
            确认投资决策
          </button>
        </div>
      </div>
    `;
  }

  renderFeedbackPage() {
    const selectedSources = Object.keys(this.tempSources);
    const sourceNames = selectedSources.map(id => {
      const source = this.informationSources.find(s => s.id === id);
      return source ? source.name : id;
    }).join(', ');

    return `
      <div class="game-page feedback-page">
        <h2>✅ 决策已确认</h2>

        <div class="feedback-content">
          <div class="selected-sources">
            <h3>🔍 选择的信息源</h3>
            <p>${sourceNames || '未选择任何信息源'}</p>
          </div>

          <div class="investment-decision">
            <h3>💰 投资决策</h3>
            <p>投资金额: ¥${(this.tempDecisions.investment_amount || 0).toLocaleString()}</p>
          </div>

          <div class="expectation-display">
            <h3>📈 你的线性期望</h3>
            <p>实际结果将在本轮结束后揭晓...（受市场波动和信息处理有效性影响）</p>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-enhanced btn-enhanced-primary" 
                  onclick="window.investmentInfoRouter.confirmFeedback(); window.investmentInfoRouter.render();">
            查看结果
          </button>
        </div>
      </div>
    `;
  }

  renderTurnSummaryPage() {
    const summary = this.calculateEnhancedTurnSummary(
      this.tempDecisions,
      this.tempSources,
      this.gameState
    );
    
    const biasResult = this.analyzeEnhancedConfirmationBias(
      this.gameState.decision_history,
      Object.keys(this.tempSources)
    );

    return `
      <div class="game-page turn-summary-page">
        <h2>📊 第${this.currentTurn}轮总结</h2>

        <div class="comparison">
          <h3>你的期望 vs 实际结果</h3>
          <div class="comparison-row">
            <span>期望资金：</span>
            <span class="value">¥${Math.round(summary.linear_expectation.portfolio).toLocaleString()}</span>
          </div>
          <div class="comparison-row">
            <span>实际资金：</span>
            <span class="value ${summary.gap >= 0 ? 'positive' : 'negative'}">
              ¥${Math.round(summary.actual_result.portfolio).toLocaleString()}
              (${summary.gap >= 0 ? '+' : ''}¥${Math.round(summary.gap).toLocaleString()})
            </span>
          </div>
        </div>

        <div class="information-diversity-analysis">
          <h3>🔍 信息处理分析</h3>
          <div class="metrics-grid state-display-panel">
            <div class="state-item">
              <span class="state-label">信息多样性</span>
              <span class="state-value">${(summary.information_diversity * 100).toFixed(0)}%</span>
            </div>
            <div class="state-item">
              <span class="state-label">信心水平</span>
              <span class="state-value">${Math.round(summary.confidence_level)}%</span>
            </div>
            <div class="state-item">
              <span class="state-label">偏误风险</span>
              <span class="state-value ${biasResult.biasRisk > 60 ? 'warning' : ''}">${Math.round(biasResult.biasRisk)}%</span>
            </div>
          </div>
        </div>

        <div class="narrative">
          <h3>📖 发生了什么</h3>
          <p>${summary.narrative}</p>
        </div>

        <div class="bias-insights">
          <h3>🧠 认知洞察</h3>
          <ul>
            ${biasResult.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>

        <div class="actions">
          <button class="btn btn-enhanced btn-enhanced-primary" 
                  onclick="window.investmentInfoRouter.nextTurn(); window.investmentInfoRouter.render();">
            进入第${this.currentTurn + 1}轮 →
          </button>
        </div>
      </div>
    `;
  }

  renderEndingPage() {
    const finalPortfolio = Math.round(this.gameState.portfolio);
    const finalKnowledge = Math.round(this.gameState.knowledge);
    const finalDiversity = Math.round(this.gameState.information_diversity * 100);
    const biasRisk = Math.round(this.gameState.bias_risk);

    let rating = '';
    let message = '';
    let colorClass = '';

    if (finalPortfolio >= 15000 && finalDiversity >= 60) {
      rating = '🏆 信息处理大师';
      message = '你成功掌握了多元化信息处理的艺术，避免了确认偏误！';
      colorClass = 'success';
    } else if (finalPortfolio >= 12000 || (finalDiversity >= 50 && biasRisk < 50)) {
      rating = '⭐ 优秀投资者';
      message = '你在信息处理方面表现出色，学会了避免常见陷阱。';
      colorClass = 'positive';
    } else if (finalPortfolio >= 10000) {
      rating = '👍 合格投资者';
      message = '你经历了一些挑战，获得了宝贵的经验。';
      colorClass = 'neutral';
    } else {
      rating = '📚 需要学习';
      message = '信息处理偏向影响了投资结果，建议反思决策过程。';
      colorClass = 'negative';
    }

    return `
      <div class="game-page ending-page">
        <h2>🎉 投资信息处理挑战结束</h2>

        <div class="final-results">
          <div class="rating ${colorClass}">
            <h3>${rating}</h3>
            <p class="message">${message}</p>
          </div>

          <div class="final-stats state-display-panel">
            <div class="state-item">
              <span>💰 最终资金：</span>
              <span class="value ${finalPortfolio >= 10000 ? 'positive' : 'negative'}">¥${finalPortfolio.toLocaleString()}</span>
            </div>
            <div class="state-item">
              <span>📚 知识增长：</span>
              <span class="value">${finalKnowledge}</span>
            </div>
            <div class="state-item">
              <span>🔍 信息多样性：</span>
              <span class="value">${finalDiversity}%</span>
            </div>
            <div class="state-item">
              <span>⚠️ 偏误风险：</span>
              <span class="value ${biasRisk < 50 ? 'positive' : 'negative'}">${biasRisk}%</span>
            </div>
          </div>

          <div class="lessons-learned">
            <h3>🎓 你学到了什么</h3>
            <ul>
              <li>如何识别和避免确认偏误</li>
              <li>多元化信息源的重要性</li>
              <li>信息处理策略对投资结果的影响</li>
              <li>如何平衡信息数量与质量</li>
            </ul>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-enhanced btn-enhanced-primary" 
                  onclick="window.investmentInfoRouter.resetGame(); window.investmentInfoRouter.render();">
            重新挑战
          </button>
          <button class="btn btn-enhanced btn-enhanced-secondary" 
                  onclick="NavigationManager.navigateTo('scenarios')">
            选择其他场景
          </button>
        </div>
      </div>
    `;
  }

  renderGenericPage() {
    return `
      <div class="game-page generic-page">
        <h2>页面加载中...</h2>
        <p>正在准备认知挑战内容</p>
        <div class="loading-spinner"></div>
      </div>
    `;
  }

  // ========== Enhanced Helper Methods ==========

  getSelectedSourceNames() {
    return Object.keys(this.tempSources)
      .map(id => {
        const source = this.informationSources.find(s => s.id === id);
        return source ? source.name : id;
      })
      .join(', ');
  }

  // ========== State Persistence (extends base with extra fields) ==========

  saveState() {
    super.saveState();
    sessionStorage.setItem(this.storageKey, JSON.stringify({
      ...JSON.parse(sessionStorage.getItem(this.storageKey) || '{}'),
      tempDecisions: this.tempDecisions,
      tempSources: this.tempSources,
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
        this.tempSources = state.tempSources || [];
        this.currentTurn = state.currentTurn || 1;
      } catch {
        // ignore
      }
    }
  }
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.InvestmentInformationProcessingPageRouter = InvestmentInformationProcessingPageRouter;
  
  Log.debug('Investment Information Processing Page Router loaded');
}