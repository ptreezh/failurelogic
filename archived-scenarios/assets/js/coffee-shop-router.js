/**
 * Coffee Shop Linear Thinking Router - Deep Redesign
 * 咖啡店经营挑战 - 深度重构版
 * 
 * Core failure logic: Linear thinking trap + Coordination cost explosion + Time delay blindness
 */

(function(global) {
  'use strict';

  // 依赖注入
  const NonlinearEngine = global.NonlinearEffectsEngine;
  const AwakeningSystem = global.AwakeningMomentSystem;
  const BiasDetector = global.CognitiveBiasDetector;

  class CoffeeShopRouter {
    constructor(container) {
      this.container = container;
      
      // 游戏状态
      this.state = {
        // 显示给用户的指标
        satisfaction: 50,
        resources: 1000,
        reputation: 50,
        
        // 隐藏的系统变量
        staff_count: 3,
        marketing_investment: 0,
        staff_efficiency: 100,
        coordination_cost: 0,
        quality_index: 80,
        customer_lifetime_value: 100,
        
        // 游戏进度
        turn: 1,
        max_turns: 6,
        phase: 'decision', // decision | feedback | summary | ending
        
        // 历史记录
        decision_history: [],
        delayed_effects: [],
        awakening_triggered: false,
        
        // 偏差检测
        detected_biases: []
      };
      
      // 临时决策
      this.tempDecisions = {};
      
      // 觉醒时刻
      this.awakening = null;
    }

    // ========== 初始化 ==========
    
    initialize() {
      this.renderStartPage();
    }

    // ========== 页面渲染 ==========
    
    renderStartPage() {
      const html = `
        <div class="game-page start-page compact-start-page">
          <h2>☕ 咖啡店经营挑战</h2>
          
          <div class="scenario-intro compact-situation">
            <p>你刚刚接手了一家社区咖啡店。目前有3名员工，日均营收¥500，客户满意度75分。</p>
            <p>你的目标是：在6个回合内，将咖啡店发展成一家盈利、有口碑的社区名店。</p>
            <p><strong>但记住：在复杂系统中，投入和产出从来不是简单的线性关系。</strong></p>
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
              <span class="stat-label">👥 员工数</span>
              <span class="stat-value">${this.state.staff_count}人</span>
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
              </ul>
            </div>
          </div>
          
          <div class="compact-game-goal">
            <strong>🎯 目标：</strong>6回合内实现可持续盈利，满意度≥80，口碑≥70
          </div>
          
          <div class="compact-actions">
            <button class="btn btn-primary" onclick="window.coffeeShopRouter.startGame(); window.coffeeShopRouter.render();">
              开始经营
            </button>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    renderTurnPage() {
      const turn = this.state.turn;
      
      // 根据回合数调整选项
      const options = this.generateTurnOptions(turn);
      
      const html = `
        <div class="game-page turn-page compact-page-header">
          <div class="round-header compact-stats-grid">
            <span class="step-indicator">回合 ${turn} / ${this.state.max_turns}</span>
          </div>
          
          <div class="situation-box compact-situation">
            <h3>第${turn}回合 - ${this.getTurnScenario(turn)}</h3>
            <p>${this.getTurnDescription(turn)}</p>
          </div>
          
          <div class="live-metrics compact-stats-grid">
            <div class="metric-item">
              <span class="metric-label">😊 满意度</span>
              <span class="metric-value">${this.state.satisfaction}</span>
              <div class="metric-bar">
                <div class="metric-fill" style="width: ${this.state.satisfaction}%"></div>
              </div>
            </div>
            <div class="metric-item">
              <span class="metric-label">💰 资金</span>
              <span class="metric-value">¥${this.state.resources}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">👥 员工</span>
              <span class="metric-value">${this.state.staff_count}人</span>
              <span class="metric-detail">效率${this.state.staff_efficiency}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">⚡ 协调成本</span>
              <span class="metric-value">${Math.round(this.state.coordination_cost)}%</span>
            </div>
          </div>
          
          <div class="decision-panel compact-actions">
            <h3>你的决策：</h3>
            <div class="options-list compact-options-grid">
              ${options.map((opt, idx) => `
                <button class="option-btn compact-option-card" 
                        onclick="window.coffeeShopRouter.makeDecision(${idx})">
                  <strong>${opt.label}</strong>
                  <span class="option-desc">${opt.description}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    renderFeedbackPage() {
      const turn = this.state.turn;
      const lastDecision = this.state.decision_history[this.state.decision_history.length - 1];
      
      // 应用延迟效果
      const appliedEffects = NonlinearEngine.applyDelayedEffects(
        this.state, 
        this.state.delayed_effects
      );
      
      // 检测觉醒时刻
      this.awakening = AwakeningSystem.checkAwakening(
        'coffee-shop', 
        turn, 
        this.state, 
        this.state.decision_history
      );
      
      const html = `
        <div class="game-page feedback-page compact-start-page">
          <h2>📊 第${turn}回合反馈</h2>
          
          <div class="immediate-feedback compact-situation">
            <h3>即时结果</h3>
            <div class="changes-list">
              ${this.generateChangeList(lastDecision)}
            </div>
          </div>
          
          <div class="live-metrics compact-stats-grid">
            <div class="metric-item">
              <span class="metric-label">😊 满意度</span>
              <span class="metric-value">${this.state.satisfaction}</span>
              <div class="metric-bar">
                <div class="metric-fill" style="width: ${this.state.satisfaction}%"></div>
              </div>
            </div>
            <div class="metric-item">
              <span class="metric-label">💰 资金</span>
              <span class="metric-value">¥${this.state.resources}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">👥 员工</span>
              <span class="metric-value">${this.state.staff_count}人</span>
            </div>
          </div>
          
          ${appliedEffects.applied.length > 0 ? `
            <div class="delayed-effects compact-bias-hint">
              <h3>⏰ 延迟效果显现</h3>
              ${appliedEffects.applied.map(e => `
                <p>${e.description}: ${Object.entries(e.changes || {}).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`).join(', ')}</p>
              `).join('')}
            </div>
          ` : ''}
          
          ${this.awakening ? `
            <div class="awakening-moment">
              <h2>${this.awakening.title}</h2>
              <p>${this.awakening.message}</p>
              <p><strong>💡 ${this.awakening.learningPoint}</strong></p>
            </div>
          ` : ''}
          
          <div class="compact-actions">
            <button class="btn btn-primary" onclick="window.coffeeShopRouter.nextTurn(); window.coffeeShopRouter.render();">
              ${turn < this.state.max_turns ? '下一回合' : '查看结果'}
            </button>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    renderEndingPage() {
      const performance = this.evaluatePerformance();
      const biases = BiasDetector.analyzeAll(this.state.decision_history, null);
      
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
              <span class="stat-label">🌟 最终口碑</span>
              <span class="stat-value">${this.state.reputation}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📈 表现评级</span>
              <span class="stat-value">${performance.grade}</span>
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
          
          <div class="decision-timeline compact-situation">
            <h3>📜 决策路径</h3>
            ${this.state.decision_history.map((d, i) => `
              <div class="timeline-item">
                <span class="timeline-turn">回合${d.turn}</span>
                <span class="timeline-action">${this.describeDecision(d.decisions)}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="action-buttons compact-actions">
            <button class="btn btn-primary" onclick="window.coffeeShopRouter.restart();">
              重新挑战
            </button>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
    }

    // ========== 游戏逻辑 ==========
    
    startGame() {
      this.state.phase = 'decision';
      this.state.turn = 1;
      this.state.decision_history = [];
      this.state.delayed_effects = [];
      this.state.awakening_triggered = false;
      this.state.detected_biases = [];
    }

    makeDecision(optionIndex) {
      const options = this.generateTurnOptions(this.state.turn);
      const decision = options[optionIndex];
      
      // 记录决策
      this.tempDecisions = {
        staff_count: decision.staff_count || this.state.staff_count,
        marketing_investment: decision.marketing_investment || 0,
        type: decision.type
      };
      
      // 计算效果
      this.calculateTurnEffects();
      
      // 检测偏差
      const biases = BiasDetector.analyzeAll(this.state.decision_history, null);
      this.state.detected_biases.push(...biases);
      
      // 进入反馈阶段
      this.state.phase = 'feedback';
      this.render();
    }

    calculateTurnEffects() {
      const decisions = this.tempDecisions;
      const state = this.state;
      
      // 更新员工数
      if (decisions.staff_count !== undefined) {
        state.staff_count = decisions.staff_count;
      }
      
      // 计算非线性效果
      state.staff_efficiency = NonlinearEffectsEngine.calculateStaffEfficiency(state.staff_count);
      state.coordination_cost = NonlinearEffectsEngine.calculateCoordinationCost(state.staff_count);
      
      // 计算服务质量
      state.quality_index = 80 * (state.staff_efficiency / 100) * (1 - state.coordination_cost / 200);
      
      // 计算满意度
      const marketingBoost = decisions.marketing_investment ? decisions.marketing_investment * 0.0005 : 0;
      state.satisfaction = Math.round(state.quality_index * (1 + marketingBoost));
      state.satisfaction = Math.max(0, Math.min(100, state.satisfaction));
      
      // 计算客户终身价值
      state.customer_lifetime_value = NonlinearEffectsEngine.calculateCustomerLifetimeValue(state.satisfaction);
      
      // 计算收入
      const baseRevenue = 300;
      const staffRevenue = state.staff_count * 80 * (state.staff_efficiency / 100);
      const marketingRevenue = decisions.marketing_investment ? decisions.marketing_investment * 0.05 : 0;
      const totalRevenue = baseRevenue + staffRevenue + marketingRevenue;
      
      // 计算成本
      const staffCost = state.staff_count * 100;
      const marketingCost = decisions.marketing_investment || 0;
      
      // 更新资金
      state.resources += totalRevenue - staffCost - marketingCost;
      
      // 更新口碑
      if (state.satisfaction > 70) {
        state.reputation += 2;
      } else if (state.satisfaction < 50) {
        state.reputation -= 3;
      }
      state.reputation = Math.max(0, Math.min(100, state.reputation));
      
      // 生成延迟效果
      if (decisions.marketing_investment > 0) {
        const totalBonus = Math.round(decisions.marketing_investment * 0.05);
        const immediate = Math.round(totalBonus * 0.3);
        
        for (let i = 1; i <= 3; i++) {
          state.delayed_effects.push({
            type: 'marketing',
            turnsRemaining: i,
            changes: {
              reputation: Math.round((totalBonus - immediate) / 3),
              satisfaction: Math.round((totalBonus - immediate) / 3 * 0.3)
            },
            description: `营销投入在第${i}回合后继续生效`
          });
        }
      }
      
      // 记录决策历史
      state.decision_history.push({
        turn: state.turn,
        decisions: { ...decisions },
        state_before: {
          satisfaction: state.satisfaction,
          resources: state.resources,
          reputation: state.reputation
        },
        state_after: {
          satisfaction: state.satisfaction,
          resources: state.resources,
          reputation: state.reputation
        }
      });
      
      // 检查失败条件
      if (state.resources < 0) {
        this.state.phase = 'ending';
      }
    }

    nextTurn() {
      // 应用延迟效果
      const applied = NonlinearEngine.applyDelayedEffects(
        this.state, 
        this.state.delayed_effects
      );
      
      // 进入下一回合
      this.state.turn++;
      this.tempDecisions = {};
      
      if (this.state.turn > this.state.max_turns || this.state.resources < 0) {
        this.state.phase = 'ending';
      } else {
        this.state.phase = 'decision';
      }
    }

    restart() {
      this.state = {
        satisfaction: 50,
        resources: 1000,
        reputation: 50,
        staff_count: 3,
        marketing_investment: 0,
        staff_efficiency: 100,
        coordination_cost: 0,
        quality_index: 80,
        customer_lifetime_value: 100,
        turn: 1,
        max_turns: 6,
        phase: 'decision',
        decision_history: [],
        delayed_effects: [],
        awakening_triggered: false,
        detected_biases: []
      };
      this.render();
    }

    render() {
      switch (this.state.phase) {
        case 'decision':
          this.renderTurnPage();
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
    
    generateTurnOptions(turn) {
      const baseOptions = [
        {
          label: '维持现状',
          description: '保持当前运营状态，不做大的调整',
          type: 'maintain',
          staff_count: this.state.staff_count,
          marketing_investment: 0
        },
        {
          label: '增加员工',
          description: '雇佣更多员工提升服务能力',
          type: 'hire',
          staff_count: this.state.staff_count + 2,
          marketing_investment: 0
        },
        {
          label: '加大营销',
          description: '投入资金进行营销推广',
          type: 'marketing',
          staff_count: this.state.staff_count,
          marketing_investment: 200
        },
        {
          label: '提升质量',
          description: '投资培训和服务质量改进',
          type: 'quality',
          staff_count: this.state.staff_count,
          marketing_investment: 100
        }
      ];
      
      // 回合3开始增加高风险选项
      if (turn >= 3) {
        baseOptions.push({
          label: '激进扩张',
          description: '大量增加员工和营销投入（高风险）',
          type: 'aggressive',
          staff_count: this.state.staff_count + 4,
          marketing_investment: 400
        });
      }
      
      return baseOptions;
    }

    getTurnScenario(turn) {
      const scenarios = {
        1: '开业初期',
        2: '稳定运营',
        3: '增长压力',
        4: '竞争加剧',
        5: '关键抉择',
        6: '最终冲刺'
      };
      return scenarios[turn] || '经营中';
    }

    getTurnDescription(turn) {
      const descriptions = {
        1: '开业第一个月，你注意到客流稳步增长，但员工开始显得忙乱。客户反馈服务速度有待提升。',
        2: '运营趋于稳定，但附近新开了一家竞争对手的咖啡店。你需要考虑如何应对。',
        3: '客流增长放缓，你感到增长压力。是继续投入扩大规模，还是优化现有运营？',
        4: '竞争对手推出了优惠活动，部分客户开始流失。你需要在服务和价格之间找到平衡。',
        5: '经营进入关键阶段。你的决策将决定咖啡店的未来走向。',
        6: '最后一个回合。你的所有积累和决策将在这里体现最终结果。'
      };
      return descriptions[turn] || '继续经营你的咖啡店。';
    }

    generateChangeList(decision) {
      if (!decision) return '<p>本回合无变化</p>';
      
      const changes = [];
      const stateBefore = decision.state_before || {};
      const stateAfter = decision.state_after || {};
      
      if (stateBefore.satisfaction !== undefined && stateAfter.satisfaction !== undefined) {
        const diff = stateAfter.satisfaction - stateBefore.satisfaction;
        changes.push(`<span class="change ${diff >= 0 ? 'positive' : 'negative'}">满意度: ${diff >= 0 ? '+' : ''}${diff}</span>`);
      }
      
      if (stateBefore.resources !== undefined && stateAfter.resources !== undefined) {
        const diff = stateAfter.resources - stateBefore.resources;
        changes.push(`<span class="change ${diff >= 0 ? 'positive' : 'negative'}">资金: ${diff >= 0 ? '+' : ''}${diff}</span>`);
      }
      
      if (stateBefore.reputation !== undefined && stateAfter.reputation !== undefined) {
        const diff = stateAfter.reputation - stateBefore.reputation;
        changes.push(`<span class="change ${diff >= 0 ? 'positive' : 'negative'}">口碑: ${diff >= 0 ? '+' : ''}${diff}</span>`);
      }
      
      return changes.join('');
    }

    describeDecision(decisions) {
      if (!decisions) return '无决策';
      
      const parts = [];
      if (decisions.staff_count) parts.push(`雇佣${decisions.staff_count}名员工`);
      if (decisions.marketing_investment) parts.push(`投入¥${decisions.marketing_investment}营销`);
      if (decisions.type) parts.push(`策略: ${decisions.type}`);
      
      return parts.join('，') || '维持现状';
    }

    evaluatePerformance() {
      const { satisfaction, resources, reputation } = this.state;
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
        message = '表现优秀！你理解了非线性效应，找到了平衡点。';
        return { grade: 'A', score, message };
      } else if (score >= 4) {
        message = '表现良好，但仍有改进空间。';
        return { grade: 'B', score, message };
      } else if (score >= 2) {
        message = '表现不佳。你陷入了线性思维陷阱。';
        return { grade: 'C', score, message };
      } else {
        message = '咖啡店已破产。线性思维导致资源耗尽。';
        return { grade: 'F', score, message };
      }
    }
  }

  // 导出
  global.CoffeeShopRouter = CoffeeShopRouter;
  global.coffeeShopRouter = null;

  global.initCoffeeShop = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return null;
    }
    global.coffeeShopRouter = new CoffeeShopRouter(container);
    global.coffeeShopRouter.initialize();
    return global.coffeeShopRouter;
  };

})(typeof window !== 'undefined' ? window : global);
