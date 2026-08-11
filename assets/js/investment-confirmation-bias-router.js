/**
 * Investment Confirmation Bias Router - Deep Redesign
 * 投资确认偏误实验 - 深度重构版
 * 
 * Core failure logic: Information cascade + Confirmation spiral + Anchoring effect
 */

(function(global) {
  'use strict';

  const NonlinearEngine = global.NonlinearEffectsEngine;
  const AwakeningSystem = global.AwakeningMomentSystem;
  const BiasDetector = global.CognitiveBiasDetector;

  class InvestmentConfirmationBiasRouter {
    constructor(container) {
      this.container = container;
      
      this.state = {
        portfolio: 10000,
        knowledge: 0,
        turn: 1,
        max_turns: 6,
        phase: 'information', // information | decision | feedback | awakening | ending
        
        // 确认偏误指标
        bias_risk: 0,
        source_diversity: 1.0,
        confirmation_bias_score: 0,
        information_history: [],
        
        // 投资决策历史
        decision_history: [],
        selected_sources: [],
        
        // 觉醒
        awakening_triggered: false,
        
        // 市场状态
        market_trend: 'neutral', // bullish | bearish | neutral
        actual_price: 100,
        predicted_price: 100
      };
      
      this.tempDecisions = {};
      this.availableSources = this.initializeSources();
      this.awakening = null;
    }

    initializeSources() {
      return {
        bullish_analyst: {
          id: 'bullish_analyst',
          name: '看涨分析师',
          bias: 'positive',
          reliability: 0.6,
          social_proof: 85,
          content: [
            '目标价：¥200（当前¥100）',
            '未来三年复合增长35%',
            '行业前景广阔，政策利好',
            '机构持仓持续增加'
          ]
        },
        bearish_analyst: {
          id: 'bearish_analyst',
          name: '看跌分析师',
          bias: 'negative',
          reliability: 0.8,
          social_proof: 12,
          content: [
            '估值严重高估，PE是行业平均的3倍',
            '主营业务增长率连续3季度下滑',
            '大股东质押率超过60%',
            '应收账款占营收比例高达80%'
          ]
        },
        insider_info: {
          id: 'insider_info',
          name: '内部消息',
          bias: 'positive',
          reliability: 0.3,
          social_proof: 45,
          content: [
            '小道消息：即将发布重大利好',
            '据说有大基金在建仓',
            '管理层信心十足'
          ]
        },
        contrarian_report: {
          id: 'contrarian_report',
          name: '逆向研究',
          bias: 'negative',
          reliability: 0.85,
          social_proof: 5,
          content: [
            '财务数据异常，现金流为负',
            '实际盈利能力仅为账面利润的30%',
            '核心技术专利存在侵权风险'
          ]
        },
        social_media: {
          id: 'social_media',
          name: '社交媒体讨论',
          bias: 'positive',
          reliability: 0.2,
          social_proof: 90,
          content: [
            '85%的散户看好这只股票',
            '相关话题热度持续上升',
            'KOL推荐，目标价¥250'
          ]
        },
        regulatory_filing: {
          id: 'regulatory_filing',
          name: '监管公告',
          bias: 'neutral',
          reliability: 0.95,
          social_proof: 50,
          content: [
            '公司收到监管问询函',
            '要求说明业务合规性问题',
            '可能面临行政处罚'
          ]
        }
      };
    }

    initialize() {
      this.renderStartPage();
    }

    renderStartPage() {
      const html = `
        <div class="game-page start-page compact-start-page">
          <h2>📈 投资确认偏误实验</h2>
          
          <div class="scenario-intro compact-situation">
            <p>你是一名业余投资者，拥有¥10,000初始资金。你关注了一只热门股票"未来科技"(FutureTech)，当前价格¥100。</p>
            <p>你的目标是：在6个回合内，通过选择信息源、做出投资决策，实现最大化的投资回报。</p>
            <p><strong>但记住：在信息爆炸的时代，"知道更多"不等于"决策更好"。确认偏误会让你只看到你想看的。</strong></p>
          </div>
          
          <div class="compact-stats-grid">
            <div class="stat-item">
              <span class="stat-label">💰 投资组合</span>
              <span class="stat-value">¥${this.state.portfolio.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📊 知识水平</span>
              <span class="stat-value">${this.state.knowledge}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⚠️ 偏误风险</span>
              <span class="stat-value">${this.state.bias_risk}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📰 信息多样性</span>
              <span class="stat-value">${Math.round(this.state.source_diversity * 100)}%</span>
            </div>
          </div>
          
          <div class="collapsible-header" onclick="this.classList.toggle('collapsed'); this.nextElementSibling.classList.toggle('collapsed');">
            💭 可能的思维陷阱
          </div>
          <div class="collapsible-content">
            <div class="compact-bias-hint">
              <ul>
                <li>"确认偏误" - 只关注支持自己观点的信息</li>
                <li>"可得性启发" - 过度依赖容易获得的信息</li>
                <li>"锚定效应" - 过度依赖初始信息</li>
                <li>"社会证明" - 跟随大众选择</li>
              </ul>
            </div>
          </div>
          
          <div class="compact-game-goal">
            <strong>🎯 目标：</strong>6回合内实现投资回报最大化，同时保持信息选择的多样性
          </div>
          
          <div class="compact-actions">
            <button class="btn btn-primary" onclick="window.investmentRouter.startGame(); window.investmentRouter.render();">
              开始投资
            </button>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    renderInformationPage() {
      const turn = this.state.turn;
      const sources = this.getAvailableSources(turn);
      
      const html = `
        <div class="game-page info-page compact-page-header">
          <div class="round-header compact-stats-grid">
            <span class="step-indicator">回合 ${turn} / ${this.state.max_turns} - 信息收集</span>
          </div>
          
          <div class="situation-box compact-situation">
            <h3>第${turn}回合 - ${this.getMarketScenario(turn)}</h3>
            <p>市场状态：${this.getMarketDescription()}</p>
            <p>请选择你要查看的信息源（可多选）。</p>
          </div>
          
          <div class="live-metrics compact-stats-grid">
            <div class="metric-item">
              <span class="metric-label">💰 投资组合</span>
              <span class="metric-value">¥${this.state.portfolio.toLocaleString()}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">⚠️ 偏误风险</span>
              <span class="metric-value">${this.state.bias_risk}%</span>
              <div class="metric-bar">
                <div class="metric-fill ${this.state.bias_risk > 60 ? 'danger' : ''}" style="width: ${this.state.bias_risk}%"></div>
              </div>
            </div>
            <div class="metric-item">
              <span class="metric-label">📰 信息多样性</span>
              <span class="metric-value">${Math.round(this.state.source_diversity * 100)}%</span>
            </div>
          </div>
          
          <div class="sources-grid compact-options-grid">
            ${sources.map(source => `
              <div class="source-card compact-option-card" onclick="window.investmentRouter.toggleSource('${source.id}')">
                <div class="source-header">
                  <strong>${source.name}</strong>
                  <span class="source-bias bias-${source.bias}">${source.bias === 'positive' ? '看涨' : source.bias === 'negative' ? '看跌' : '中立'}</span>
                </div>
                <div class="source-meta">
                  <span>可信度: ${Math.round(source.reliability * 100)}%</span>
                  <span>社交证明: ${source.social_proof}%</span>
                </div>
                <div class="source-content">
                  ${source.content.map(c => `<p>${c}</p>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="compact-actions">
            <button class="btn btn-primary" onclick="window.investmentRouter.submitInformationSelection();">
              确认选择 (已选: <span id="source-count">0</span>)
            </button>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
      this.updateSourceCount();
    }

    renderDecisionPage() {
      const turn = this.state.turn;
      
      const html = `
        <div class="game-page decision-page compact-page-header">
          <div class="round-header compact-stats-grid">
            <span class="step-indicator">回合 ${turn} / ${this.state.max_turns} - 投资决策</span>
          </div>
          
          <div class="situation-box compact-situation">
            <h3>基于你收集的信息，做出投资决策</h3>
            <p>当前股价: ¥${this.state.actual_price} | 你的资金: ¥${this.state.portfolio.toLocaleString()}</p>
          </div>
          
          <div class="live-metrics compact-stats-grid">
            <div class="metric-item">
              <span class="metric-label">💰 投资组合</span>
              <span class="metric-value">¥${this.state.portfolio.toLocaleString()}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">⚠️ 偏误风险</span>
              <span class="metric-value">${this.state.bias_risk}%</span>
            </div>
          </div>
          
          <div class="decision-panel compact-actions">
            <h3>选择你的投资策略：</h3>
            <div class="options-list compact-options-grid">
              <button class="option-btn compact-option-card" onclick="window.investmentRouter.makeInvestmentDecision('buy')">
                <strong>买入 ¥5,000</strong>
                <span class="option-desc">预期上涨，投入资金</span>
              </button>
              <button class="option-btn compact-option-card" onclick="window.investmentRouter.makeInvestmentDecision('hold')">
                <strong>持有观望</strong>
                <span class="option-desc">信息不足，继续观察</span>
              </button>
              <button class="option-btn compact-option-card" onclick="window.investmentRouter.makeInvestmentDecision('sell')">
                <strong>卖出 ¥5,000</strong>
                <span class="option-desc">预期下跌，减仓避险</span>
              </button>
              <button class="option-btn compact-option-card" onclick="window.investmentRouter.makeInvestmentDecision('diversify')">
                <strong>分散投资</strong>
                <span class="option-desc">投入¥2,000到多只股票</span>
              </button>
            </div>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    renderFeedbackPage() {
      const turn = this.state.turn;
      const lastDecision = this.state.decision_history[this.state.decision_history.length - 1];
      
      // 检测觉醒时刻
      this.awakening = AwakeningSystem.checkAwakening(
        'investment', 
        turn, 
        this.state, 
        this.state.decision_history
      );
      
      const html = `
        <div class="game-page feedback-page compact-start-page">
          <h2>📊 第${turn}回合反馈</h2>
          
          <div class="immediate-feedback compact-situation">
            <h3>投资结果</h3>
            <div class="changes-list">
              ${this.generateInvestmentChanges(lastDecision)}
            </div>
          </div>
          
          <div class="live-metrics compact-stats-grid">
            <div class="metric-item">
              <span class="metric-label">💰 投资组合</span>
              <span class="metric-value">¥${this.state.portfolio.toLocaleString()}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">⚠️ 偏误风险</span>
              <span class="metric-value">${this.state.bias_risk}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">📰 信息多样性</span>
              <span class="metric-value">${Math.round(this.state.source_diversity * 100)}%</span>
            </div>
          </div>
          
          ${this.awakening ? `
            <div class="awakening-moment">
              <h2>${this.awakening.title}</h2>
              <p>${this.awakening.message}</p>
              <p><strong>💡 ${this.awakening.learningPoint}</strong></p>
            </div>
          ` : ''}
          
          <div class="compact-actions">
            <button class="btn btn-primary" onclick="window.investmentRouter.nextTurn(); window.investmentRouter.render();">
              ${turn < this.state.max_turns ? '下一回合' : '查看结果'}
            </button>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    renderEndingPage() {
      const biases = BiasDetector.analyzeAll(this.state.decision_history, this.state.information_history);
      const performance = this.evaluatePerformance();
      
      const html = `
        <div class="game-page ending-page compact-start-page">
          <h2>📊 投资实验结束</h2>
          
          <div class="final-stats compact-stats-grid">
            <div class="stat-item">
              <span class="stat-label">💰 最终资产</span>
              <span class="stat-value">¥${this.state.portfolio.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📈 总收益率</span>
              <span class="stat-value">${((this.state.portfolio - 10000) / 10000 * 100).toFixed(1)}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⚠️ 最终偏误风险</span>
              <span class="stat-value">${this.state.bias_risk}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📰 信息多样性</span>
              <span class="stat-value">${Math.round(this.state.source_diversity * 100)}%</span>
            </div>
          </div>
          
          <div class="performance-message compact-situation">
            <h3>${performance.message}</h3>
          </div>
          
          ${biases.length > 0 ? `
            <div class="bias-analysis compact-bias-hint">
              <h3>🔍 检测到的认知偏差</h3>
              ${biases.map(bias => `
                <div class="bias-item">
                  <strong>${bias.bias}</strong>
                  <p>${bias.evidence}</p>
                  <p><em>${bias.suggestion}</em></p>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="cbs-score compact-stats-grid">
            <div class="stat-item">
              <span class="stat-label">📊 确认偏误分数 (CBS)</span>
              <span class="stat-value">${this.state.confirmation_bias_score.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="action-buttons compact-actions">
            <button class="btn btn-primary" onclick="window.investmentRouter.restart();">
              重新挑战
            </button>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    // ========== 游戏逻辑 ==========
    
    startGame() {
      this.state.phase = 'information';
      this.state.turn = 1;
      this.state.decision_history = [];
      this.state.information_history = [];
      this.state.selected_sources = [];
      this.state.delayed_effects = [];
      this.state.awakening_triggered = false;
      this.state.bias_risk = 0;
      this.state.source_diversity = 1.0;
      this.state.confirmation_bias_score = 0;
      this.state.portfolio = 10000;
      this.state.knowledge = 0;
      this.availableSources = this.initializeSources();
    }

    toggleSource(sourceId) {
      const index = this.state.selected_sources.indexOf(sourceId);
      if (index === -1) {
        this.state.selected_sources.push(sourceId);
      } else {
        this.state.selected_sources.splice(index, 1);
      }
      this.updateSourceCount();
    }

    updateSourceCount() {
      const countEl = document.getElementById('source-count');
      if (countEl) {
        countEl.textContent = this.state.selected_sources.length;
      }
    }

    submitInformationSelection() {
      if (this.state.selected_sources.length === 0) {
        alert('请至少选择一个信息源');
        return;
      }
      
      // 记录信息选择
      const selections = this.state.selected_sources.map(id => {
        const source = this.availableSources[id];
        return {
          source_id: id,
          bias: source.bias,
          reliability: source.reliability,
          turn: this.state.turn
        };
      });
      
      this.state.information_history.push(...selections);
      
      // 更新信息多样性
      this.updateSourceDiversity();
      
      // 更新偏误风险
      this.updateBiasRisk();
      
      // 计算确认偏误分数
      this.calculateCBS();
      
      // 进入决策阶段
      this.state.phase = 'decision';
      this.render();
    }

    makeInvestmentDecision(type) {
      // 记录决策
      const decision = {
        turn: this.state.turn,
        type: type,
        selected_sources: [...this.state.selected_sources],
        market_trend: this.state.market_trend
      };
      
      this.state.decision_history.push(decision);
      
      // 计算投资效果
      this.calculateInvestmentEffect(type);
      
      // 检测偏差
      const biases = BiasDetector.analyzeAll(this.state.decision_history, this.state.information_history);
      this.state.detected_biases.push(...biases);
      
      // 进入反馈阶段
      this.state.phase = 'feedback';
      this.render();
    }

    calculateInvestmentEffect(type) {
      const portfolio = this.state.portfolio;
      const biasRisk = this.state.bias_risk / 100;
      const marketTrend = this.state.market_trend;
      
      let returnRate = 0;
      
      switch (type) {
        case 'buy':
          // 看涨决策
          if (marketTrend === 'bullish') {
            returnRate = 0.15; // +15%
          } else if (marketTrend === 'bearish') {
            returnRate = -0.20; // -20%
          } else {
            returnRate = 0.05; // +5%
          }
          // 偏误惩罚
          returnRate -= biasRisk * 0.3;
          break;
          
        case 'sell':
          // 看跌决策
          if (marketTrend === 'bearish') {
            returnRate = 0.10; // +10%
          } else if (marketTrend === 'bullish') {
            returnRate = -0.15; // -15%
          } else {
            returnRate = -0.03; // -3%
          }
          break;
          
        case 'hold':
          returnRate = 0.02; // +2% 无风险收益
          break;
          
        case 'diversify':
          returnRate = 0.08; // +8% 分散收益
          break;
      }
      
      // 更新投资组合
      this.state.portfolio = Math.round(portfolio * (1 + returnRate));
      
      // 更新知识水平
      this.state.knowledge += 5;
      
      // 市场趋势随机变化
      this.updateMarketTrend();
    }

    updateMarketTrend() {
      const rand = Math.random();
      if (rand < 0.3) {
        this.state.market_trend = 'bullish';
      } else if (rand < 0.6) {
        this.state.market_trend = 'bearish';
      } else {
        this.state.market_trend = 'neutral';
      }
      
      // 更新实际价格
      const change = (Math.random() - 0.5) * 0.2;
      this.state.actual_price = Math.round(this.state.actual_price * (1 + change));
    }

    updateSourceDiversity() {
      const sources = this.state.information_history;
      if (sources.length === 0) return;
      
      const uniqueSources = new Set(sources.map(s => s.source_id));
      const positiveCount = sources.filter(s => s.bias === 'positive').length;
      const negativeCount = sources.filter(s => s.bias === 'negative').length;
      
      // 多样性 = 唯一源数 / 总源数 × 正负平衡
      const diversity = (uniqueSources.size / sources.length) * 
                       (1 - Math.abs(positiveCount - negativeCount) / sources.length);
      
      this.state.source_diversity = Math.max(0, Math.min(1, diversity));
    }

    updateBiasRisk() {
      const sources = this.state.information_history;
      if (sources.length === 0) return;
      
      const positiveCount = sources.filter(s => s.bias === 'positive').length;
      const ratio = positiveCount / sources.length;
      
      // 偏误风险 = 正面信息占比 > 70% 或 < 30%
      if (ratio > 0.7) {
        this.state.bias_risk = Math.min(100, this.state.bias_risk + 15);
      } else if (ratio < 0.3) {
        this.state.bias_risk = Math.min(100, this.state.bias_risk + 10);
      } else {
        this.state.bias_risk = Math.max(0, this.state.bias_risk - 5);
      }
    }

    calculateCBS() {
      const sources = this.state.information_history;
      if (sources.length === 0) return;
      
      const positive = sources.filter(s => s.bias === 'positive').length;
      const negative = sources.filter(s => s.bias === 'negative').length;
      const neutral = sources.filter(s => s.bias === 'neutral').length;
      
      const total = positive + negative + neutral;
      if (total === 0) return;
      
      // CBS = (P_pos - P_neg) / (P_pos + P_neg + P_neu)
      this.state.confirmation_bias_score = (positive - negative) / total;
    }

    nextTurn() {
      this.state.turn++;
      this.state.selected_sources = [];
      this.tempDecisions = {};
      
      if (this.state.turn > this.state.max_turns) {
        this.state.phase = 'ending';
      } else {
        this.state.phase = 'information';
      }
      
      this.render();
    }

    restart() {
      this.state = {
        portfolio: 10000,
        knowledge: 0,
        turn: 1,
        max_turns: 6,
        phase: 'information',
        bias_risk: 0,
        source_diversity: 1.0,
        confirmation_bias_score: 0,
        information_history: [],
        decision_history: [],
        selected_sources: [],
        delayed_effects: [],
        awakening_triggered: false,
        market_trend: 'neutral',
        actual_price: 100,
        predicted_price: 100
      };
      this.availableSources = this.initializeSources();
      this.render();
    }

    render() {
      switch (this.state.phase) {
        case 'information':
          this.renderInformationPage();
          break;
        case 'decision':
          this.renderDecisionPage();
          break;
        case 'feedback':
          this.renderFeedbackPage();
          break;
        case 'ending':
          this.renderEndingPage();
          break;
        default:
          this.renderStartPage();
      }
    }

    // ========== 辅助方法 ==========
    
    getAvailableSources(turn) {
      // 根据回合数解锁更多信息源
      const allSources = Object.values(this.availableSources);
      const available = allSources.slice(0, Math.min(3 + turn, allSources.length));
      return available;
    }

    getMarketScenario(turn) {
      const scenarios = {
        1: '初识股票',
        2: '市场波动',
        3: '信息爆炸',
        4: '谣言四起',
        5: '关键时刻',
        6: '最终决策'
      };
      return scenarios[turn] || '市场观察';
    }

    getMarketDescription() {
      const descriptions = {
        bullish: '市场看涨情绪浓厚，多数分析师推荐买入',
        bearish: '市场看跌情绪蔓延，风险信号增多',
        neutral: '市场方向不明，信息相互矛盾'
      };
      return descriptions[this.state.market_trend] || '市场平稳';
    }

    generateInvestmentChanges(decision) {
      if (!decision) return '<p>本回合无投资操作</p>';
      
      const changes = [];
      const prevPortfolio = decision.state_before?.portfolio || this.state.portfolio;
      const currentPortfolio = this.state.portfolio;
      const diff = currentPortfolio - prevPortfolio;
      
      changes.push(`<span class="change ${diff >= 0 ? 'positive' : 'negative'}">
        投资组合: ${diff >= 0 ? '+' : ''}${diff}
      </span>`);
      
      return changes.join('');
    }

    evaluatePerformance() {
      const { portfolio, bias_risk, source_diversity } = this.state;
      const returnRate = (portfolio - 10000) / 10000;
      
      let score = 0;
      let message = '';
      
      // 收益率评分
      if (returnRate >= 0.3) score += 3;
      else if (returnRate >= 0.1) score += 2;
      else if (returnRate >= 0) score += 1;
      
      // 偏误控制评分
      if (bias_risk < 30) score += 2;
      else if (bias_risk < 50) score += 1;
      
      // 信息多样性评分
      if (source_diversity > 0.7) score += 2;
      else if (source_diversity > 0.5) score += 1;
      
      if (score >= 6) {
        message = '优秀！你保持了信息多样性，做出了理性的投资决策。';
        return { grade: 'A', score, message };
      } else if (score >= 4) {
        message = '良好，但仍有改进空间。注意避免确认偏误。';
        return { grade: 'B', score, message };
      } else if (score >= 2) {
        message = '一般。你似乎陷入了确认偏误的陷阱。';
        return { grade: 'C', score, message };
      } else {
        message = '较差。强烈的确认偏误导致投资失误。';
        return { grade: 'F', score, message };
      }
    }
  }

  // 导出
  global.InvestmentConfirmationBiasRouter = InvestmentConfirmationBiasRouter;
  global.investmentRouter = null;

  global.initInvestmentConfirmationBias = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return null;
    }
    global.investmentRouter = new InvestmentConfirmationBiasRouter(container);
    global.investmentRouter.initialize();
    return global.investmentRouter;
  };

})(typeof window !== 'undefined' ? window : global);
