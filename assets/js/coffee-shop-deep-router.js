/**
 * Coffee Shop Deep Experience Router
 * 咖啡店经营 - 极致失败逻辑体验
 * 
 * 设计原则：
 * 1. 信息不对称：用户只能看到表面指标，看不到隐藏的系统变量
 * 2. 渐进式承诺陷阱：前期成功强化线性思维，后期陷入沉没成本
 * 3. 社会压力：模拟其他经营者的决策，制造FOMO和从众压力
 * 4. 时间延迟真实感：后果在1-3回合后显现，中间有虚假正反馈
 * 5. 不可逆性：破产后无法重来，只能复盘
 * 6. 失败尸检：精确映射每个决策→隐藏状态变化→最终结果
 */

(function(global) {
  'use strict';

  // ============================================================================
  // 隐藏系统模型（用户永远看不到这些）
  // ============================================================================
  class HiddenSystemModel {
    constructor() {
      this.staff_count = 3;
      this.staff_efficiency = 100;
      this.coordination_cost = 0;
      this.quality_index = 80;
      this.customer_lifetime_value = 100;
      this.customer_loyalty = 70;
      this.base_revenue_per_customer = 35;
    }

    // 员工效率：超过3人后非线性下降
    calculateStaffEfficiency() {
      if (this.staff_count <= 3) return 100;
      return Math.round(100 / (1 + 0.18 * Math.pow(this.staff_count - 3, 1.8)));
    }

    // 协调成本：指数增长
    calculateCoordinationCost() {
      if (this.staff_count <= 3) return 0;
      return Math.round(0.35 * Math.pow(this.staff_count - 3, 2.3));
    }

    // 服务质量 = 基础质量 × 效率 × (1 - 协调成本)
    calculateQualityIndex() {
      const efficiency = this.calculateStaffEfficiency();
      const coordination = this.calculateCoordinationCost();
      return Math.round(80 * (efficiency / 100) * (1 - coordination / 250));
    }

    // 客户满意度 = f(服务质量, 客户期望)
    calculateSatisfaction(quality_index, marketing_boost) {
      const expectation = 75 * (1 + marketing_boost * 0.4);
      const raw = quality_index * (expectation / 100);
      return Math.max(0, Math.min(100, Math.round(raw)));
    }

    // 客户终身价值：满意度低于60时指数下降
    calculateCustomerLifetimeValue(satisfaction) {
      if (satisfaction >= 80) return 100;
      if (satisfaction >= 60) return 80;
      if (satisfaction >= 40) return 40;
      if (satisfaction >= 20) return 15;
      return 5;
    }

    // 口碑传播：满意度>80时正反馈，<50时负反馈
    calculateReputationChange(satisfaction, current_reputation) {
      if (satisfaction >= 85) return 5;
      if (satisfaction >= 70) return 2;
      if (satisfaction >= 50) return 0;
      if (satisfaction >= 30) return -3;
      return -8;
    }

    // 客户流失率
    calculateChurnRate(satisfaction) {
      if (satisfaction >= 80) return 0.02;
      if (satisfaction >= 60) return 0.05;
      if (satisfaction >= 40) return 0.15;
      if (satisfaction >= 20) return 0.35;
      return 0.60;
    }
  }

  // ============================================================================
  // 社会压力模拟器（制造FOMO和从众压力）
  // ============================================================================
  class SocialPressureSimulator {
    constructor() {
      this.peer_decisions = [];
      this.market_hype = 50; // 市场热度 0-100
      this.media_narrative = 'neutral'; // bullish | bearish | neutral
    }

    generatePeerPressure(turn) {
      // 模拟其他经营者的决策
      const peers = [
        { name: '张经理', decision: 'expand', result: 'success', profit: 20 },
        { name: '李老板', decision: 'hire', result: 'success', profit: 15 },
        { name: '王店长', decision: 'marketing', result: 'average', profit: 8 }
      ];

      // 随着回合增加，更多“成功”案例
      const successCount = Math.min(turn, 3);
      return peers.slice(0, successCount);
    }

    generateMarketHype(turn) {
      // 市场热度随时间上升，制造FOMO
      return Math.min(50 + turn * 10, 95);
    }

    generateMediaNarrative(turn) {
      // 前期看涨，后期可能反转
      if (turn <= 2) return 'bullish';
      if (turn <= 4) return 'neutral';
      return Math.random() < 0.3 ? 'bearish' : 'neutral';
    }

    getSocialProofText(turn) {
      const hype = this.generateMarketHype(turn);
      const peers = this.generatePeerPressure(turn);
      
      return {
        market_hype: `${hype}%的市场参与者看好扩张`,
        peer_stories: peers.map(p => 
          `${p.name}选择${p.decision === 'expand' ? '扩张' : p.decision === 'hire' ? '增员' : '营销'}，利润增长${p.profit}%`
        ).join('；'),
        narrative: this.generateMediaNarrative(turn) === 'bullish' 
          ? '📈 行业媒体：咖啡市场持续火爆，现在是扩张的最佳时机！'
          : this.generateMediaNarrative(turn) === 'bearish'
          ? '⚠️ 行业警告：市场即将饱和，过度扩张将面临风险'
          : '📊 行业分析：市场趋于稳定，精细化运营成为关键'
      };
    }
  }

  // ============================================================================
  // 延迟效果引擎
  // ============================================================================
  class DelayedEffectEngine {
    constructor() {
      this.effects = [];
    }

    add(effect) {
      this.effects.push({
        ...effect,
        id: Date.now() + Math.random(),
        turnsRemaining: effect.turnsRemaining || 1,
        applied: false
      });
    }

    tick() {
      const applied = [];
      const remaining = [];

      for (const effect of this.effects) {
        if (effect.turnsRemaining <= 0) {
          applied.push(effect);
        } else {
          effect.turnsRemaining--;
          remaining.push(effect);
        }
      }

      this.effects = remaining;
      return applied;
    }

    peek() {
      return this.effects.filter(e => !e.applied);
    }

    clear() {
      this.effects = [];
    }
  }

  // ============================================================================
  // 失败尸检系统
  // ============================================================================
  class AutopsySystem {
    static generateAutopsy(state) {
      const timeline = state.decision_history.map((d, i) => {
        const hidden = d.hidden_state || {};
        const visible = d.visible_state || {};
        
        return {
          turn: d.turn,
          decision: d.decision,
          hidden_effects: {
            staff_efficiency: hidden.staff_efficiency,
            coordination_cost: hidden.coordination_cost,
            quality_index: hidden.quality_index,
            customer_lifetime_value: hidden.customer_lifetime_value
          },
          visible_effects: {
            satisfaction: visible.satisfaction,
            resources: visible.resources,
            reputation: visible.reputation
          },
          causal_chain: d.causal_chain || []
        };
      });

      const finalState = {
        satisfaction: state.satisfaction,
        resources: state.resources,
        reputation: state.reputation,
        staff_count: state.staff_count
      };

      const rootCause = this.identifyRootCause(timeline, finalState);
      
      return {
        timeline,
        finalState,
        rootCause,
        preventionPoints: this.identifyPreventionPoints(timeline)
      };
    }

    static identifyRootCause(timeline, finalState) {
      const lastDecision = timeline[timeline.length - 1];
      if (!lastDecision) return '未知原因';

      const hidden = lastDecision.hidden_effects;
      
      if (hidden.coordination_cost > 50) {
        return {
          cause: '协调成本爆炸',
          detail: `员工数达到${lastDecision.decision.staff_count}人时，协调成本飙升至${hidden.coordination_cost}%，服务质量崩溃`,
          turn: lastDecision.turn,
          severity: 'critical'
        };
      }
      
      if (finalState.resources < 0) {
        return {
          cause: '资金链断裂',
          detail: `连续${timeline.filter(d => d.visible_effects.resources < 0).length}个回合资金净流出，最终耗尽`,
          turn: lastDecision.turn,
          severity: 'critical'
        };
      }
      
      return {
        cause: '线性思维陷阱',
        detail: '持续增加投入，忽视边际效益递减',
        turn: lastDecision.turn,
        severity: 'high'
      };
    }

    static identifyPreventionPoints(timeline) {
      const points = [];
      
      for (let i = 0; i < timeline.length; i++) {
        const d = timeline[i];
        const hidden = d.hidden_effects;
        
        // 关键预防点：协调成本开始上升时
        if (hidden.coordination_cost > 20 && d.decision.staff_count > 5) {
          points.push({
            turn: d.turn,
            opportunity: '减少员工或优化流程',
            impact: '避免协调成本进一步上升',
            consequence_if_ignored: '服务质量持续下降，客户流失加速'
          });
        }
        
        // 关键预防点：满意度开始下降时
        if (d.visible_effects.satisfaction < 50 && i > 0) {
          points.push({
            turn: d.turn,
            opportunity: '立即停止扩张，专注于服务质量',
            impact: '阻止客户流失',
            consequence_if_ignored: '口碑崩盘，不可逆转'
          });
        }
      }
      
      return points;
    }
  }

  // ============================================================================
  // 主路由器
  // ============================================================================
  class CoffeeShopDeepRouter {
    constructor(container) {
      this.container = container;
      
      // 隐藏系统模型
      this.hiddenSystem = new HiddenSystemModel();
      
      // 社会压力模拟
      this.socialPressure = new SocialPressureSimulator();
      
      // 延迟效果引擎
      this.delayedEngine = new DelayedEffectEngine();
      
      // 竞争系统（可选）
      this.competitionEnabled = false;
      this.competitionSystem = null;
      this.leaderboard = null;
      this.competitors = [];
      this.previousState = null;
      
      // 游戏状态（用户可见的）
      this.state = {
        // 表面指标（用户能看到）
        satisfaction: 50,
        resources: 1000,
        reputation: 50,
        daily_customers: 50,
        turn: 1,
        max_turns: 6,
        phase: 'start', // start | decision | social_feedback | hidden_feedback | awakening | ending
        game_over: false,
        
        // 决策历史
        decision_history: [],
        
        // 觉醒
        awakening_triggered: false,
        awakening_turn: null
      };
      
      // 临时决策
      this.tempDecision = null;
      
      // 初始化竞争系统
      this.initCompetition();
    }

    // ========== 初始化 ==========
    
    initialize() {
      this.renderStartPage();
    }

    initCompetition() {
      try {
        if (typeof MarketEnvironment === 'undefined' ||
            typeof AICompetitor === 'undefined' ||
            typeof CompetitionSystem === 'undefined' ||
            typeof Leaderboard === 'undefined') {
          this.competitionEnabled = false;
          return;
        }

        const marketEnv = new MarketEnvironment({
          totalAddressableMarket: 1000,
          currentCustomers: 500
        });

        this.competitors = [
          new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
          new AICompetitor(PERSONALITY_TYPES.QUALITY),
          new AICompetitor(PERSONALITY_TYPES.EFFICIENT),
          new AICompetitor(PERSONALITY_TYPES.RISKY)
        ];

        this.competitionSystem = new CompetitionSystem({
          marketEnvironment: marketEnv,
          userState: {
            satisfaction: this.state.satisfaction,
            reputation: this.state.reputation,
            daily_revenue: 500,
            daily_customers: this.state.daily_customers,
            staff_count: 3
          },
          competitors: this.competitors
        });

        this.leaderboard = new Leaderboard();
        this.competitionEnabled = true;
      } catch (e) {
        this.competitionEnabled = false;
      }
    }

    // ========== 竞争系统辅助方法 ==========
    
    updateUserStateForCompetition() {
      if (!this.competitionSystem || !this.competitionSystem.userState) return;
      
      this.competitionSystem.userState.satisfaction = this.state.satisfaction;
      this.competitionSystem.userState.reputation = this.state.reputation;
      this.competitionSystem.userState.daily_revenue = this.state.daily_customers * 25;
      this.competitionSystem.userState.daily_customers = this.state.daily_customers;
      this.competitionSystem.userState.staff_count = this.hiddenSystem.staff_count;
    }

    applyCompetitionImpact(result) {
      if (!result.customerTransfer) return;
      
      this.state.daily_customers = Math.max(0,
        this.state.daily_customers + result.customerTransfer.netChange
      );
    }

    getCompetitionHiddenRevelation() {
      if (!this.competitionEnabled || !this.competitionSystem) return '';
      
      const history = this.competitionSystem.competitionHistory;
      if (history.length === 0) return '';
      
      const revelations = [];
      
      history.forEach(turn => {
        turn.competitorActions.forEach(action => {
          if (action.hidden && action.hidden.coordination_cost > 50) {
            revelations.push(
              `${action.name}的"成功"背后：协调成本${action.hidden.coordination_cost}%，效率仅${action.hidden.staff_efficiency}%`
            );
          }
        });
      });
      
      return revelations.length > 0 ? revelations[0] : '市场竞争影响你的客户流向';
    }

    // ========== 页面渲染 ==========
    
    renderStartPage() {
      const html = `
        <div class="game-page start-page compact-start-page">
          <h2>☕ 咖啡店经营挑战</h2>
          
          <div class="scenario-intro compact-situation">
            <p>你刚刚接手了一家社区咖啡店。目前有 <strong>3名员工</strong>，日均营收¥500，客户满意度75分。</p>
            <p>你的目标是：在6个回合内，将咖啡店发展成一家盈利、有口碑的社区名店。</p>
            <p class="warning-text">⚠️ <strong>重要：</strong>在这个模拟中，你<strong>无法看到</strong>员工的协调成本、效率衰减、客户终身价值等隐藏指标。你只能通过表面数据做决策——就像真实世界一样。</p>
          </div>
          
          <div class="compact-stats-grid">
            <div class="stat-item">
              <span class="stat-label">😊 客户满意度</span>
              <span class="stat-value">${this.state.satisfaction}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">💰 资金储备</span>
              <span class="stat-value">¥${this.state.resources}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🌟 口碑</span>
              <span class="stat-value">${this.state.reputation}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">👥 日均客流</span>
              <span class="stat-value">${this.state.daily_customers}人</span>
            </div>
          </div>
          
          <div class="collapsible-header" onclick="this.classList.toggle('collapsed'); this.nextElementSibling.classList.toggle('collapsed');">
            💭 可能的思维陷阱
          </div>
          <div class="collapsible-content">
            <div class="compact-bias-hint">
              <ul>
                <li>"线性思维" - 以为"投入翻倍，产出翻倍"</li>
                <li>"越多越好" - 忽视协调成本和边际效益递减</li>
                <li>"时间延迟忽视" - 今天投入，明天就想见效</li>
                <li>"沉没成本" - 已经投入这么多，不能放弃</li>
              </ul>
            </div>
          </div>
          
          <div class="compact-game-goal">
            <strong>🎯 目标：</strong>6回合内实现可持续盈利，满意度≥80，口碑≥70，资金≥2000
          </div>
          
          <div class="compact-actions">
            <button class="btn btn-primary" onclick="window.coffeeShopDeepRouter.startGame(); window.coffeeShopDeepRouter.render();">
              开始经营
            </button>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    renderDecisionPage() {
      const turn = this.state.turn;
      const socialProof = this.socialPressure.getSocialProofText(turn);
      
      // 根据当前状态生成选项
      const options = this.generateContextualOptions();
      
      let competitionHTML = '';
      
      if (this.competitionEnabled && this.leaderboard) {
        const rankingTable = this.leaderboard.getRealtimeTable();
        const userRank = this.leaderboard.getUserRank();
        const userTrend = this.leaderboard.getUserTrend();
        
        competitionHTML = `
          <div class="competition-panel compact-bias-hint">
            <h4>📊 实时排行榜</h4>
            <div class="ranking-table">
              <table>
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>店铺</th>
                    <th>营收</th>
                    <th>口碑</th>
                    <th>员工</th>
                    <th>趋势</th>
                  </tr>
                </thead>
                <tbody>
                  ${rankingTable.map(entry => `
                    <tr class="${entry.colorClass} ${entry.isUser ? 'user-row' : ''}">
                      <td>${entry.rank}</td>
                      <td>${entry.name}${entry.isUser ? ' (你)' : ''}</td>
                      <td>¥${entry.surface.daily_revenue || 0}</td>
                      <td>${entry.surface.reputation || 0}</td>
                      <td>${entry.surface.staff_count || 0}人</td>
                      <td>${entry.trend}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ${userRank ? `<p class="user-rank">你的排名: 第${userRank}名 ${userTrend}</p>` : ''}
          </div>
        `;
      }
      
      const html = `
        <div class="game-page decision-page compact-page-header">
          <div class="round-header compact-stats-grid">
            <span class="step-indicator">回合 ${turn} / ${this.state.max_turns}</span>
          </div>
          
          <div class="situation-box compact-situation">
            <h3>${this.getTurnNarrative(turn)}</h3>
            <p>${this.getTurnPressure(turn)}</p>
          </div>
          
          <div class="live-metrics compact-stats-grid">
            <div class="metric-item">
              <span class="metric-label">😊 满意度</span>
              <span class="metric-value">${this.state.satisfaction}</span>
              <div class="metric-bar">
                <div class="metric-fill ${this.state.satisfaction < 50 ? 'danger' : ''}" style="width: ${this.state.satisfaction}%"></div>
              </div>
            </div>
            <div class="metric-item">
              <span class="metric-label">💰 资金</span>
              <span class="metric-value">¥${this.state.resources}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">⭐ 口碑</span>
              <span class="metric-value">${this.state.reputation}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">👥 客流</span>
              <span class="metric-value">${this.state.daily_customers}人/日</span>
            </div>
          </div>
          
          ${competitionHTML}
          
          <div class="social-pressure compact-bias-hint">
            <h4>📢 行业动态（来自你的社交圈）</h4>
            <p>${socialProof.market_hype}</p>
            <p>${socialProof.peer_stories}</p>
            <p class="media-narrative">${socialProof.narrative}</p>
            <p class="pressure-tip">💡 <em>其他经营者似乎在扩张，你会？</em></p>
          </div>
          
          <div class="decision-panel compact-actions">
            <h3>你的决策：</h3>
            <div class="options-list compact-options-grid">
              ${options.map((opt, idx) => `
                <button class="option-btn compact-option-card" 
                        onclick="window.coffeeShopDeepRouter.makeDecision(${idx})"
                        data-risk="${opt.risk || 'low'}">
                  <strong>${opt.label}</strong>
                  <span class="option-desc">${opt.description}</span>
                  ${opt.cost ? `<span class="option-cost">成本: ¥${opt.cost}</span>` : ''}
                  ${opt.risk === 'high' ? '<span class="risk-badge">高风险</span>' : ''}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    renderSocialFeedbackPage() {
      const turn = this.state.turn;
      const decision = this.tempDecision;
      
      // 应用延迟效果
      const appliedEffects = this.delayedEngine.tick();
      
      // 生成即时反馈（表面指标变化）
      const visibleChanges = this.calculateVisibleChanges(decision);
      
      // 生成隐藏反馈（用户看不到，但记录在尸检中）
      const hiddenChanges = this.calculateHiddenChanges(decision);
      
      let competitionFeedbackHTML = '';
      
      if (this.competitionEnabled && this.competitionSystem && this.competitionSystem.competitionHistory.length > 0) {
        const lastResult = this.competitionSystem.competitionHistory[this.competitionSystem.competitionHistory.length - 1];
        
        competitionFeedbackHTML = `
          <div class="competition-feedback compact-bias-hint">
            <h4>📊 竞争影响</h4>
            ${lastResult.customerTransfer.lost > 0 ? `<p>⚠️ 客户流失: ${lastResult.customerTransfer.lost}人</p>` : ''}
            ${lastResult.customerTransfer.gained > 0 ? `<p>✅ 客户获取: ${lastResult.customerTransfer.gained}人</p>` : ''}
            <p>净变化: ${lastResult.customerTransfer.netChange > 0 ? '+' : ''}${lastResult.customerTransfer.netChange}人</p>
            ${lastResult.customerTransfer.reasons.map(r => `<p class="transfer-reason">${r}</p>`).join('')}
          </div>
        `;
      }
      
      const html = `
        <div class="game-page feedback-page compact-start-page">
          <h2>📊 第${turn}回合 - 经营报告</h2>
          
          <div class="immediate-feedback compact-situation">
            <h3>📈 表面结果</h3>
            <div class="changes-list">
              ${Object.entries(visibleChanges).map(([key, value]) => {
                const isPositive = value >= 0;
                const icon = key === 'satisfaction' ? '😊' : key === 'resources' ? '💰' : key === 'reputation' ? '⭐' : '👥';
                return `<span class="change ${isPositive ? 'positive' : 'negative'}">
                  ${icon} ${key}: ${isPositive ? '+' : ''}${value}
                </span>`;
              }).join('')}
            </div>
            <p class="feedback-text">${this.generateFeedbackText(decision, visibleChanges)}</p>
          </div>
          
          ${competitionFeedbackHTML}
          
          <div class="live-metrics compact-stats-grid">
            <div class="metric-item">
              <span class="metric-label">😊 满意度</span>
              <span class="metric-value">${this.state.satisfaction}</span>
              <div class="metric-bar">
                <div class="metric-fill ${this.state.satisfaction < 50 ? 'danger' : ''}" style="width: ${this.state.satisfaction}%"></div>
              </div>
            </div>
            <div class="metric-item">
              <span class="metric-label">💰 资金</span>
              <span class="metric-value">¥${this.state.resources}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">⭐ 口碑</span>
              <span class="metric-value">${this.state.reputation}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">👥 客流</span>
              <span class="metric-value">${this.state.daily_customers}人/日</span>
            </div>
          </div>
          
          ${appliedEffects.length > 0 ? `
            <div class="delayed-effects compact-bias-hint">
              <h3>⏰ 延迟效果显现</h3>
              ${appliedEffects.map(e => `
                <p>${e.description}</p>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="hidden-pressure compact-situation">
            <h4>🔍 你注意到了吗？</h4>
            <p>${this.generateSubtleHint(decision, hiddenChanges)}</p>
          </div>
          
          <div class="compact-actions">
            <button class="btn btn-primary" onclick="window.coffeeShopDeepRouter.advanceTurn();">
              继续经营
            </button>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    renderAwakeningPage() {
      const turn = this.state.awakening_turn;
      const autopsy = AutopsySystem.generateAutopsy(this.state);
      
      const html = `
        <div class="game-page awakening-page compact-start-page">
          <h2>⚠️ 觉醒时刻</h2>
          
          <div class="awakening-content compact-situation">
            <h3>你发现了什么？</h3>
            <p>${this.generateAwakeningNarrative()}</p>
          </div>
          
          <div class="cascade-visualization compact-stats-grid">
            <h4>📊 因果链可视化</h4>
            ${this.generateCascadeVisualization()}
          </div>
          
          <div class="compact-actions">
            <button class="btn btn-primary" onclick="window.coffeeShopDeepRouter.continueAfterAwakening();">
              继续经营
            </button>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    renderEndingPage() {
      const performance = this.evaluatePerformance();
      const autopsy = AutopsySystem.generateAutopsy(this.state);
      const biases = this.detectBiases();
      
      let competitionAnalysisHTML = '';
      let userRank = null;
      
      if (this.competitionEnabled && this.competitionSystem && this.competitionSystem.competitionHistory.length > 0) {
        const rankingTable = this.competitionSystem.getRankingTable();
        const userEntry = rankingTable.find(e => e.isUser);
        userRank = userEntry ? userEntry.rank : null;
        
        competitionAnalysisHTML = `
          <div class="competition-analysis compact-situation">
            <h4>📊 竞争分析</h4>
            <p>最终排名: 第${userRank || 'N/A'}名</p>
            <div class="ranking-table-final">
              <table>
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>店铺</th>
                    <th>营收</th>
                    <th>口碑</th>
                    <th>员工</th>
                  </tr>
                </thead>
                <tbody>
                  ${rankingTable.map(entry => `
                    <tr class="${entry.isUser ? 'user-row' : ''}">
                      <td>${entry.rank}</td>
                      <td>${entry.name}${entry.isUser ? ' (你)' : ''}</td>
                      <td>¥${entry.surface.daily_revenue || 0}</td>
                      <td>${entry.surface.reputation || 0}</td>
                      <td>${entry.surface.staff_count || 0}人</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
        
        if (this.leaderboard) {
          const history = this.leaderboard.getHistory(5);
          if (history.length > 0) {
            competitionAnalysisHTML += `
              <div class="history-section compact-situation">
                <h4>🏆 历史最佳成绩</h4>
                ${history.map(entry => `
                  <p>${entry.playerName}: 存活${entry.turnsSurvived}回合, 排名#${entry.finalRank}, 成绩${entry.performanceGrade}</p>
                `).join('')}
              </div>
            `;
          }
        }
      }
      
      const html = `
        <div class="game-page ending-page compact-start-page">
          <h2>📊 经营结束</h2>
          
          <div class="final-stats compact-stats-grid">
            <div class="stat-item">
              <span class="stat-label">😊 最终满意度</span>
              <span class="stat-value">${this.state.satisfaction}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">💰 最终资金</span>
              <span class="stat-value">¥${this.state.resources}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⭐ 最终口碑</span>
              <span class="stat-value">${this.state.reputation}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📈 表现评级</span>
              <span class="stat-value ${performance.grade === 'F' ? 'grade-fail' : ''}">${performance.grade}</span>
            </div>
          </div>
          
          ${competitionAnalysisHTML}
          
          <div class="autopsy-section compact-situation">
            <h3>🔬 失败尸检</h3>
            <p class="autopsy-intro">以下是你的决策如何一步步导致最终结果的精确映射：</p>
            
            <div class="autopsy-timeline">
              ${autopsy.timeline.map((item, i) => `
                <div class="autopsy-item ${item.hidden_effects.coordination_cost > 40 ? 'critical' : ''}">
                  <div class="autopsy-turn">回合 ${item.turn}</div>
                  <div class="autopsy-decision">
                    <strong>决策：</strong>${this.describeDecision(item.decision)}
                  </div>
                  <div class="autopsy-hidden">
                    <strong>隐藏变化：</strong>
                    协调成本 ${item.hidden_effects.coordination_cost}%，
                    员工效率 ${item.hidden_effects.staff_efficiency}%，
                    服务质量 ${item.hidden_effects.quality_index}
                  </div>
                  <div class="autopsy-visible">
                    <strong>表面结果：</strong>
                    满意度 ${item.visible_effects.satisfaction}，
                    资金 ¥${item.visible_effects.resources}
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="root-cause ${autopsy.rootCause.severity === 'critical' ? 'critical' : ''}">
              <h4>🎯 根因分析</h4>
              <p><strong>${autopsy.rootCause.cause}：</strong>${autopsy.rootCause.detail}</p>
            </div>
            
            <div class="prevention-points">
              <h4>💡 关键预防点</h4>
              ${autopsy.preventionPoints.map(point => `
                <div class="prevention-point">
                  <strong>回合 ${point.turn}：</strong>${point.opportunity}
                  <p>${point.consequence_if_ignored}</p>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="action-buttons compact-actions">
            <button class="btn btn-primary" onclick="window.coffeeShopDeepRouter.restart();">
              重新挑战
            </button>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
      
      // 记录游戏结果到排行榜
      if (this.leaderboard) {
        this.leaderboard.recordGameResult({
          playerName: 'Anonymous',
          turnsSurvived: this.state.turn,
          finalFunds: this.state.resources,
          finalRank: userRank || 0,
          performanceGrade: performance.grade,
          keyFailure: autopsy.rootCause.cause || autopsy.rootCause,
          hiddenRevelation: this.getCompetitionHiddenRevelation()
        });
      }
    }

    // ========== 游戏逻辑 ==========
    
    startGame() {
      // 重置隐藏系统
      this.hiddenSystem = new HiddenSystemModel();
      this.delayedEngine = new DelayedEffectEngine();
      this.socialPressure = new SocialPressureSimulator();
      
      // 重置状态
      this.state = {
        satisfaction: 50,
        resources: 1000,
        reputation: 50,
        daily_customers: 50,
        turn: 1,
        max_turns: 6,
        phase: 'decision',
        game_over: false,
        decision_history: [],
        awakening_triggered: false,
        awakening_turn: null
      };
      
      this.tempDecision = null;
      this.previousState = null;
      
      // 重新初始化竞争系统
      this.initCompetition();
    }

    makeDecision(optionIndex) {
      const options = this.generateContextualOptions();
      const decision = options[optionIndex];
      
      this.tempDecision = decision;
      
      // 保存前一状态用于计算可见变化
      this.previousState = {
        satisfaction: this.state.satisfaction,
        resources: this.state.resources,
        reputation: this.state.reputation,
        daily_customers: this.state.daily_customers
      };
      
      // 更新隐藏系统并获取计算结果
      const hiddenChanges = this.updateHiddenSystem(decision);
      
      // 应用隐藏系统的计算结果到状态
      this.applyHiddenSystemChanges(hiddenChanges);
      
      // 计算表面效果（用户看到的）
      const visibleChanges = this.calculateVisibleChanges(decision);
      
      // 计算隐藏效果（记录在尸检中）
      const hiddenEffectsForAutopsy = this.calculateHiddenChanges(decision);
      
      // 运行竞争回合（在状态更新之后，记录在历史之前）
      if (this.competitionEnabled && this.competitionSystem) {
        this.updateUserStateForCompetition();
        const competitionResult = this.competitionSystem.runCompetitionTurn(decision);
        this.applyCompetitionImpact(competitionResult);
      }
      
      // 记录决策历史（包含隐藏状态）
      this.state.decision_history.push({
        turn: this.state.turn,
        decision: decision,
        hidden_state: {
          staff_efficiency: this.hiddenSystem.staff_efficiency,
          coordination_cost: this.hiddenSystem.coordination_cost,
          quality_index: this.hiddenSystem.quality_index,
          customer_lifetime_value: this.hiddenSystem.customer_lifetime_value
        },
        visible_state: {
          satisfaction: this.state.satisfaction,
          resources: this.state.resources,
          reputation: this.state.reputation,
          daily_customers: this.state.daily_customers
        },
        causal_chain: this.generateCausalChain(decision, hiddenEffectsForAutopsy)
      });
      
      // 检查觉醒条件
      this.checkAwakening();
      
      // 检查游戏结束
      if (this.state.resources < 0 || this.state.satisfaction <= 0) {
        this.state.game_over = true;
        this.state.phase = 'ending';
      } else {
        this.state.phase = 'social_feedback';
      }
      
      this.render();
    }

    advanceTurn() {
      // 应用延迟效果
      const applied = this.delayedEngine.tick();
      
      // 应用延迟效果到状态
      for (const effect of applied) {
        if (effect.changes) {
          for (const [key, value] of Object.entries(effect.changes)) {
            if (this.state.hasOwnProperty(key)) {
              this.state[key] += value;
            }
          }
        }
      }
      
      // 运行竞争回合
      if (this.competitionEnabled && this.competitionSystem) {
        this.updateUserStateForCompetition();
        this.competitionSystem.runCompetitionTurn(this.tempDecision || { type: 'wait' });
        if (this.leaderboard) {
          this.leaderboard.updateRealtime(this.competitionSystem.getRankingTable());
        }
      }
      
      // 进入下一回合
      this.state.turn++;
      this.tempDecision = null;
      this.previousState = null;
      
      if (this.state.turn > this.state.max_turns || this.state.game_over) {
        this.state.phase = 'ending';
      } else {
        this.state.phase = 'decision';
      }
      
      this.render();
    }

    continueAfterAwakening() {
      this.state.phase = 'decision';
      this.render();
    }

    restart() {
      this.startGame();
      this.render();
    }

    render() {
      switch (this.state.phase) {
        case 'start':
          this.renderStartPage();
          break;
        case 'decision':
          this.renderDecisionPage();
          break;
        case 'social_feedback':
          this.renderSocialFeedbackPage();
          break;
        case 'awakening':
          this.renderAwakeningPage();
          break;
        case 'ending':
          this.renderEndingPage();
          break;
        default:
          this.renderStartPage();
      }
    }

    // ========== 核心计算 ==========
    
    updateHiddenSystem(decision) {
      // 更新员工数
      if (decision.staff_count) {
        this.hiddenSystem.staff_count = decision.staff_count;
      }
      
      // 重新计算所有隐藏变量
      this.hiddenSystem.staff_efficiency = this.hiddenSystem.calculateStaffEfficiency();
      this.hiddenSystem.coordination_cost = this.hiddenSystem.calculateCoordinationCost();
      this.hiddenSystem.quality_index = this.hiddenSystem.calculateQualityIndex();
      
      // 营销 boost
      const marketing_boost = (decision.marketing_investment || 0) / 1000;
      
      // 计算满意度（使用隐藏的 quality_index）
      const new_satisfaction = this.hiddenSystem.calculateSatisfaction(
        this.hiddenSystem.quality_index,
        marketing_boost
      );
      
      // 计算客户终身价值
      this.hiddenSystem.customer_lifetime_value = this.hiddenSystem.calculateCustomerLifetimeValue(new_satisfaction);
      
      // 计算口碑变化
      const reputation_change = this.hiddenSystem.calculateReputationChange(new_satisfaction, this.state.reputation);
      const new_reputation = Math.max(0, Math.min(100, this.state.reputation + reputation_change));
      
      // 计算客户流失
      const churn_rate = this.hiddenSystem.calculateChurnRate(new_satisfaction);
      const churned_customers = Math.round(this.state.daily_customers * churn_rate);
      const new_daily_customers = Math.max(0, this.state.daily_customers - churned_customers);
      
      // 计算收入
      const base_revenue = new_daily_customers * this.hiddenSystem.base_revenue_per_customer;
      const staff_cost = this.hiddenSystem.staff_count * 100;
      const marketing_cost = decision.marketing_investment || 0;
      const net_revenue = base_revenue - staff_cost - marketing_cost;
      const new_resources = this.state.resources + net_revenue;
      
      // 营销延迟效果
      if (decision.marketing_investment > 0) {
        this.delayedEngine.add({
          type: 'marketing',
          turnsRemaining: 2,
          changes: {
            reputation: Math.round(decision.marketing_investment * 0.02),
            daily_customers: Math.round(decision.marketing_investment * 0.05)
          },
          description: `营销投入开始显现效果，客流增加`
        });
      }
      
      // 人员扩张延迟效果
      if (decision.staff_count > this.hiddenSystem.staff_count) {
        this.delayedEngine.add({
          type: 'coordination_cost',
          turnsRemaining: 1,
          changes: {
            satisfaction: -10
          },
          description: `员工增加导致协调问题开始显现`
        });
      }
      
      // 返回计算后的状态（不直接修改 this.state）
      return {
        satisfaction: new_satisfaction,
        reputation: new_reputation,
        daily_customers: new_daily_customers,
        resources: new_resources
      };
    }

    applyHiddenSystemChanges(changes) {
      this.state.satisfaction = Math.max(0, Math.min(100, changes.satisfaction));
      this.state.reputation = Math.max(0, Math.min(100, changes.reputation));
      this.state.daily_customers = Math.max(0, changes.daily_customers);
      this.state.resources = changes.resources;
    }

    calculateVisibleChanges(decision) {
      const prev = this.previousState || { satisfaction: 50, resources: 1000, reputation: 50, daily_customers: 50 };
      return {
        satisfaction: this.state.satisfaction - prev.satisfaction,
        resources: this.state.resources - prev.resources,
        reputation: this.state.reputation - prev.reputation,
        customers: this.state.daily_customers - prev.daily_customers
      };
    }

    calculateHiddenChanges(decision) {
      return {
        staff_efficiency: this.hiddenSystem.staff_efficiency,
        coordination_cost: this.hiddenSystem.calculateCoordinationCost(),
        quality_index: this.hiddenSystem.quality_index,
        customer_lifetime_value: this.hiddenSystem.customer_lifetime_value
      };
    }

    generateCausalChain(decision, hiddenChanges) {
      const chain = [];
      
      if (decision.staff_count > 5) {
        chain.push({
          action: `雇佣${decision.staff_count}名员工`,
          hidden_effect: `协调成本升至${hiddenChanges.coordination_cost}%，员工效率降至${hiddenChanges.staff_efficiency}%`,
          visible_effect: `服务质量下降，客户满意度降至${this.state.satisfaction}`
        });
      }
      
      if (decision.marketing_investment > 200) {
        chain.push({
          action: `投入¥${decision.marketing_investment}营销`,
          hidden_effect: `客户期望提高，但服务质量跟不上`,
          visible_effect: `客流短期增加，但满意度未同步提升`
        });
      }
      
      return chain;
    }

    checkAwakening() {
      const turn = this.state.turn;
      const history = this.state.decision_history;
      
      // 觉醒条件：回合3，协调成本>40，满意度<40
      if (turn === 3 && !this.state.awakening_triggered) {
        const lastDecision = history[history.length - 1];
        if (lastDecision && lastDecision.hidden_state.coordination_cost > 40) {
          this.state.awakening_triggered = true;
          this.state.awakening_turn = turn;
          this.state.phase = 'awakening';
        }
      }
      
      // 觉醒条件：满意度<30，任何回合
      if (this.state.satisfaction < 30 && !this.state.awakening_triggered) {
        this.state.awakening_triggered = true;
        this.state.awakening_turn = turn;
        this.state.phase = 'awakening';
      }
    }

    // ========== 辅助方法 ==========
    
    generateContextualOptions() {
      const turn = this.state.turn;
      const baseOptions = [
        {
          label: '维持现状',
          description: '保持当前运营状态，观察市场变化',
          type: 'maintain',
          staff_count: this.hiddenSystem.staff_count,
          marketing_investment: 0,
          cost: 0,
          risk: 'low'
        },
        {
          label: '增加2名员工',
          description: '提升服务能力，应对增长客流',
          type: 'hire_small',
          staff_count: this.hiddenSystem.staff_count + 2,
          marketing_investment: 0,
          cost: 200,
          risk: 'medium'
        },
        {
          label: '投入营销¥200',
          description: '扩大品牌知名度，吸引新客户',
          type: 'marketing',
          staff_count: this.hiddenSystem.staff_count,
          marketing_investment: 200,
          cost: 200,
          risk: 'low'
        }
      ];
      
      // 回合2开始提供更多选项
      if (turn >= 2) {
        baseOptions.push({
          label: '增加4名员工',
          description: '大规模扩张，抢占市场份额',
          type: 'hire_large',
          staff_count: this.hiddenSystem.staff_count + 4,
          marketing_investment: 0,
          cost: 400,
          risk: 'high'
        });
      }
      
      // 回合3开始提供激进选项
      if (turn >= 3) {
        baseOptions.push({
          label: '激进扩张',
          description: '大量增员+大力营销，all-in增长',
          type: 'aggressive',
          staff_count: this.hiddenSystem.staff_count + 6,
          marketing_investment: 500,
          cost: 700,
          risk: 'extreme'
        });
      }
      
      return baseOptions;
    }

    getTurnNarrative(turn) {
      const narratives = {
        1: '开业第1个月',
        2: '运营稳定期',
        3: '增长压力增大',
        4: '竞争加剧',
        5: '关键决策期',
        6: '最终冲刺'
      };
      return narratives[turn] || '经营中';
    }

    getTurnPressure(turn) {
      const pressures = this.socialPressure.getSocialProofText(turn);
      return `${pressures.narrative} ${pressures.peer_stories}`;
    }

    generateFeedbackText(decision, changes) {
      if (this.state.satisfaction < 40) {
        return '⚠️ 客户投诉增多，服务质量问题开始显现。';
      }
      if (changes.resources < -300) {
        return '⚠️ 本回合资金流出较大，请注意成本控制。';
      }
      if (this.state.daily_customers > 80) {
        return '✅ 客流增长良好，但要注意服务质量是否能跟上。';
      }
      return '📊 本回合经营平稳，继续观察市场变化。';
    }

    generateSubtleHint(decision, hiddenChanges) {
      if (hiddenChanges.coordination_cost > 30) {
        return '你注意到员工之间似乎有些混乱，服务速度不如以前。也许人太多了？';
      }
      if (hiddenChanges.quality_index < 50) {
        return '客户反馈服务质量有所下降，但具体原因还不清楚。';
      }
      if (hiddenChanges.customer_lifetime_value < 40) {
        return '老客户的回头率似乎降低了，但你还不知道原因。';
      }
      return '一切看起来正常，但有些事情正在发生变化...';
    }

    generateAwakeningNarrative() {
      const lastDecision = this.state.decision_history[this.state.decision_history.length - 1];
      const hidden = lastDecision?.hidden_state || {};
      
      return `你的员工数从3人增加到${this.hiddenSystem.staff_count}人，但你刚刚发现：
      
😱 隐藏的真相：
- 员工效率从100%下降到${hidden.staff_efficiency}%
- 协调成本从0%上升到${hidden.coordination_cost}%
- 服务质量指数从80降到${hidden.quality_index}
- 客户终身价值从100暴跌到${hidden.customer_lifetime_value}

📉 结果：
- 本回合流失了${Math.round(this.state.daily_customers * 0.3)}个客户
- 这些客户永远不会回来
- 你的口碑正在崩盘

这就是"线性思维陷阱"的真相：
你以为"投入翻倍，产出翻倍"，但在复杂系统中，
要素之间存在相互作用，导致边际效益递减。

关键洞察：在复杂系统中，最优解通常不是"越多越好"，
而是找到一个平衡点。你的咖啡店理想员工数可能是4-5人。`;
    }

    generateCascadeVisualization() {
      const history = this.state.decision_history;
      let html = '<div class="cascade-chain">';
      
      history.forEach((d, i) => {
        const hidden = d.hidden_state || {};
        const isCritical = hidden.coordination_cost > 40;
        
        html += `
          <div class="cascade-item ${isCritical ? 'critical' : ''}">
            <div class="cascade-turn">回合${d.turn}</div>
            <div class="cascade-action">${this.describeDecision(d.decision)}</div>
            <div class="cascade-hidden">
              协调成本: ${hidden.coordination_cost}% → 
              效率: ${hidden.staff_efficiency}% → 
              质量: ${hidden.quality_index}
            </div>
            <div class="cascade-visible">
              满意度: ${d.visible_state.satisfaction} → 
              资金: ¥${d.visible_state.resources}
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      return html;
    }

    describeDecision(decision) {
      const parts = [];
      if (decision.staff_count) parts.push(`员工${decision.staff_count}人`);
      if (decision.marketing_investment) parts.push(`营销¥${decision.marketing_investment}`);
      if (decision.type) parts.push(decision.type);
      return parts.join(' + ') || '维持现状';
    }

    detectBiases() {
      const biases = [];
      const history = this.state.decision_history;
      
      // 检测线性思维
      const staffIncreases = history.filter(d => d.decision.staff_count > 5).length;
      if (staffIncreases >= 2) {
        biases.push({
          name: '线性思维陷阱',
          evidence: `你连续${staffIncreases}次大幅增加员工，但满意度反而下降`,
          suggestion: '在复杂系统中，投入和产出不是线性关系。考虑找到最优平衡点。'
        });
      }
      
      // 检测沉没成本
      if (this.state.resources < 500 && this.state.turn >= 4) {
        biases.push({
          name: '沉没成本陷阱',
          evidence: '你已经投入大量资金，但继续投入只会加剧损失',
          suggestion: '认识到失败并止损，比继续投入更好。'
        });
      }
      
      // 检测社会压力从众
      const aggressiveChoices = history.filter(d => d.decision.type === 'aggressive').length;
      if (aggressiveChoices >= 1) {
        biases.push({
          name: '从众效应',
          evidence: '你在社会压力下选择了激进扩张',
          suggestion: '别人的成功不一定适合你，每个人的系统都不同。'
        });
      }
      
      return biases;
    }

    evaluatePerformance() {
      const { satisfaction, resources, reputation, daily_customers } = this.state;
      let score = 0;
      let message = '';
      
      if (satisfaction >= 80) score += 3;
      else if (satisfaction >= 60) score += 2;
      else if (satisfaction >= 40) score += 1;
      
      if (reputation >= 70) score += 3;
      else if (reputation >= 50) score += 2;
      else if (reputation >= 30) score += 1;
      
      if (resources >= 2000) score += 2;
      else if (resources >= 1000) score += 1;
      
      if (score >= 7) {
        message = '优秀！你理解了非线性效应，找到了平衡点。';
        return { grade: 'A', score, message };
      } else if (score >= 4) {
        message = '良好，但仍有改进空间。';
        return { grade: 'B', score, message };
      } else if (score >= 2) {
        message = '表现不佳。你陷入了线性思维陷阱，忽视了协调成本和边际效益递减。';
        return { grade: 'C', score, message };
      } else {
        message = '咖啡店已破产。线性思维导致资源耗尽，协调成本爆炸。';
        return { grade: 'F', score, message };
      }
    }
  }

  // ============================================================================
  // 导出
  // ============================================================================
  global.CoffeeShopDeepRouter = CoffeeShopDeepRouter;
  global.coffeeShopDeepRouter = null;

  global.initCoffeeShopDeep = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return null;
    }
    global.coffeeShopDeepRouter = new CoffeeShopDeepRouter(container);
    global.coffeeShopDeepRouter.initialize();
    return global.coffeeShopDeepRouter;
  };

})(typeof window !== 'undefined' ? window : global);
