/**
 * Social Media Echo Chamber Scenario Router
 * 社交媒体信息茧房场景路由器
 * 基于EventBus和Logger构建
 */

(function(global) {
  'use strict';

  const TURN_SCENARIOS = [
    {
      turn: 1,
      title: '内容推荐算法设置',
      situation: '你是社交媒体平台的内容审核员。平台要求你设置今日的内容推荐算法参数。',
      context: '算法将决定用户看到什么样的内容。你有权调整信息多样性、过滤强度和个性化程度。',
      options: [
        {
          id: 'high_diversity',
          text: '提高信息多样性，主动推送不同观点',
          effects: { informationDiversity: 15, confirmationBiasLevel: -10, algorithmicFiltering: -5, userAwareness: 10, polarizationLevel: -10 },
          description: '用户将看到更多不同观点，但可能降低短期 engagement'
        },
        {
          id: 'balanced',
          text: '保持平衡，兼顾多样性与用户偏好',
          effects: { informationDiversity: 5, confirmationBiasLevel: 0, algorithmicFiltering: 0, userAwareness: 5, polarizationLevel: -5 },
          description: ' moderate approach，用户接受度较高'
        },
        {
          id: 'high_filtering',
          text: '强化个性化过滤，只推送用户喜欢的内容',
          effects: { informationDiversity: -15, confirmationBiasLevel: 15, algorithmicFiltering: 15, userAwareness: -5, polarizationLevel: 15 },
          description: '用户满意度短期提升，但信息茧房效应加剧'
        }
      ]
    },
    {
      turn: 2,
      title: '争议内容处理',
      situation: '平台上出现了一篇引发激烈讨论的争议性文章，涉及一个敏感社会话题。',
      context: '文章获得了很多点击，但也收到了大量举报。用户群体明显分为支持和反对两派。',
      options: [
        {
          id: 'allow_balanced',
          text: '允许发布，但限制推荐范围并标注争议',
          effects: { informationDiversity: 10, confirmationBiasLevel: -5, algorithmicFiltering: 0, userAwareness: 15, polarizationLevel: -10 },
          description: '保持言论自由，但引导用户理性看待'
        },
        {
          id: 'remove_content',
          text: '删除文章，避免引发更多争议',
          effects: { informationDiversity: -10, confirmationBiasLevel: 5, algorithmicFiltering: 5, userAwareness: -10, polarizationLevel: 5 },
          description: '短期平息争议，但可能引发关于审查的讨论'
        },
        {
          id: 'amplify_trending',
          text: '加大推荐力度，让它成为热门话题',
          effects: { informationDiversity: -20, confirmationBiasLevel: 20, algorithmicFiltering: 10, userAwareness: -15, polarizationLevel: 20 },
          description: '流量大涨，但群体极化明显'
        }
      ]
    },
    {
      turn: 3,
      title: '用户反馈机制设计',
      situation: '你需要设计一个新的用户反馈机制，让用户能够表达对推荐内容的满意度。',
      context: '不同的反馈机制设计会产生不同的用户行为和算法学习效果。',
      options: [
        {
          id: 'simple_feedback',
          text: '简单的喜欢/不喜欢按钮',
          effects: { informationDiversity: 0, confirmationBiasLevel: 5, algorithmicFiltering: 5, userAwareness: 0, polarizationLevel: 5 },
          description: '操作简单，但容易强化过滤'
        },
        {
          id: 'detailed_feedback',
          text: '多维度反馈：信息类型、观点倾向、内容质量',
          effects: { informationDiversity: 10, confirmationBiasLevel: -5, algorithmicFiltering: -5, userAwareness: 15, polarizationLevel: -5 },
          description: '收集更丰富的数据，帮助算法学习多样性'
        },
        {
          id: 'no_feedback',
          text: '不提供反馈机制，完全由算法自动优化',
          effects: { informationDiversity: -10, confirmationBiasLevel: 10, algorithmicFiltering: 10, userAwareness: -10, polarizationLevel: 10 },
          description: '算法黑箱，用户被动接受'
        }
      ]
    },
    {
      turn: 4,
      title: '极端内容应对策略',
      situation: '监测数据显示，某些用户正在被逐步引导向极端观点。你需要决定如何干预。',
      context: '数据显示，过度个性化的推荐确实会导致用户观点逐渐极端化。',
      options: [
        {
          id: 'intervention',
          text: '主动介入，向用户推送多元化内容打破信息茧房',
          effects: { informationDiversity: 20, confirmationBiasLevel: -15, algorithmicFiltering: -10, userAwareness: 20, polarizationLevel: -15 },
          description: '可能引起用户反感，但长期有益'
        },
        {
          id: 'monitor_only',
          text: '仅监测不干预，尊重用户自主选择',
          effects: { informationDiversity: -5, confirmationBiasLevel: 5, algorithmicFiltering: 5, userAwareness: -5, polarizationLevel: 10 },
          description: '不打扰用户，但茧房效应持续'
        },
        {
          id: 'reduce_recommendation',
          text: '降低推荐频率，让用户更多自主浏览',
          effects: { informationDiversity: 5, confirmationBiasLevel: 0, algorithmicFiltering: -15, userAwareness: 10, polarizationLevel: 0 },
          description: '减少算法干预，增加用户自主权'
        }
      ]
    },
    {
      turn: 5,
      title: '广告与内容的平衡',
      situation: '商业团队要求增加个性化广告投放以提高收入，但这可能进一步加剧信息茧房。',
      context: '广告收入占平台总收入的60%。过度个性化广告会让用户只看到符合自己观点的商品和服务。',
      options: [
        {
          id: 'limit_ads',
          text: '限制广告个性化程度，保护用户体验',
          effects: { informationDiversity: 10, confirmationBiasLevel: -5, algorithmicFiltering: -5, userAwareness: 5, polarizationLevel: -5 },
          description: '短期收入下降，但长期用户信任提升'
        },
        {
          id: 'increase_ads',
          text: '全面增强广告个性化，最大化收入',
          effects: { informationDiversity: -15, confirmationBiasLevel: 10, algorithmicFiltering: 15, userAwareness: -10, polarizationLevel: 15 },
          description: '收入大增，但用户体验恶化'
        },
        {
          id: 'mixed_approach',
          text: '区分内容推荐和广告推荐，分别优化',
          effects: { informationDiversity: 5, confirmationBiasLevel: 0, algorithmicFiltering: 5, userAwareness: 5, polarizationLevel: 0 },
          description: '尝试平衡商业和用户体验'
        }
      ]
    },
    {
      turn: 6,
      title: '长期战略决策',
      situation: '作为平台最高决策者，你需要制定未来一年的内容生态战略。',
      context: '各种数据表明，当前的信息茧房效应正在加剧社会分裂。你需要在平台发展和用户福祉之间找到平衡。',
      options: [
        {
          id: 'diversity_first',
          text: '将信息多样性作为首要目标，重构推荐算法',
          effects: { informationDiversity: 25, confirmationBiasLevel: -20, algorithmicFiltering: -15, userAwareness: 25, polarizationLevel: -20 },
          description: '长期投资于健康的信息生态'
        },
        {
          id: 'engagement_first',
          text: '继续以用户 engagement 为首要目标',
          effects: { informationDiversity: -20, confirmationBiasLevel: 20, algorithmicFiltering: 20, userAwareness: -20, polarizationLevel: 20 },
          description: '短期指标好看，但长期社会成本高'
        },
        {
          id: 'adaptive',
          text: '建立自适应的动态平衡机制',
          effects: { informationDiversity: 10, confirmationBiasLevel: -5, algorithmicFiltering: 0, userAwareness: 15, polarizationLevel: -10 },
          description: '根据用户状态动态调整策略'
        }
      ]
    }
  ];

  class SocialMediaEchoChamberRouter {
    constructor(container) {
      this.container = container;
      this.gameState = {
        informationDiversity: 50,
        confirmationBiasLevel: 30,
        algorithmicFiltering: 40,
        userAwareness: 25,
        polarizationLevel: 20,
        turn: 1,
        totalTurns: 6,
        decisionHistory: [],
        delayedEffects: [],
        awakeningMoments: [],
        decisionOptions: TURN_SCENARIOS
      };

      this.currentPage = 'START';
      this._registerEvents();
      Logger.info('SocialMediaEchoChamberRouter', 'Initialized');
    }

    _registerEvents() {
      EventBus.on('socialMediaStart', () => this.startGame());
      EventBus.on('socialMediaNextTurn', () => this.nextTurn());
      EventBus.on('socialMediaBack', () => this.back());
      EventBus.on('socialMediaMakeDecision', (data) => this.makeDecision(data));
      EventBus.on('socialMediaConfirmDecision', () => this.confirmDecision());
      EventBus.on('socialMediaReset', () => this.resetGame());
    }

    startGame() {
      Logger.debug('SocialMediaEchoChamberRouter', 'Starting game');
      this.currentPage = 'TURN_1_INTRO';
      this.render();
    }

    nextTurn() {
      if (this.gameState.turn < this.gameState.totalTurns) {
        this.gameState.turn++;
        this.currentPage = `TURN_${this.gameState.turn}_INTRO`;
        Logger.debug('SocialMediaEchoChamberRouter', `Next turn: ${this.gameState.turn}`);
        this.render();
      } else {
        this.showEndGame();
      }
    }

    back() {
      if (this.gameState.turn > 1) {
        this.gameState.turn--;
        this.currentPage = `TURN_${this.gameState.turn}_INTRO`;
        Logger.debug('SocialMediaEchoChamberRouter', `Back to turn: ${this.gameState.turn}`);
        this.render();
      }
    }

    makeDecision(data) {
      const turnIndex = this.gameState.turn - 1;
      const decision = this.gameState.decisionOptions[turnIndex]?.options[data.optionIndex];
      if (!decision) {
        Logger.error('SocialMediaEchoChamberRouter', 'Invalid decision option', data);
        return;
      }

      this.gameState.decisionHistory.push({
        turn: this.gameState.turn,
        decision: decision.id,
        optionText: decision.text,
        timestamp: Date.now()
      });

      this._applyDecisionEffects(decision);
      this._checkAwakeningMoments();

      this.currentPage = `TURN_${this.gameState.turn}_FEEDBACK`;
      Logger.debug('SocialMediaEchoChamberRouter', 'Decision made', decision.id);
      this.render();
    }

    _applyDecisionEffects(decision) {
      const effects = decision.effects;
      for (const [key, value] of Object.entries(effects)) {
        if (this.gameState[key] !== undefined) {
          this.gameState[key] = Math.max(0, Math.min(100, this.gameState[key] + value));
        }
      }

      if (decision.delayedEffects) {
        this.gameState.delayedEffects.push({
          turn: this.gameState.turn + 2,
          effects: decision.delayedEffects
        });
      }

      this._processDelayedEffects();
    }

    _processDelayedEffects() {
      const currentTurn = this.gameState.turn;
      this.gameState.delayedEffects = this.gameState.delayedEffects.filter(delayed => {
        if (delayed.turn === currentTurn) {
          for (const [key, value] of Object.entries(delayed.effects)) {
            if (this.gameState[key] !== undefined) {
              this.gameState[key] = Math.max(0, Math.min(100, this.gameState[key] + value));
            }
          }
          return false;
        }
        return true;
      });
    }

    _checkAwakeningMoments() {
      const state = this.gameState;

      if (state.informationDiversity < 30 && state.confirmationBiasLevel > 60) {
        Logger.warn('SocialMediaEchoChamberRouter', 'Awakening: Echo chamber effect revealed');
        this._showAwakeningMoment('echo_chamber_reveal');
      }

      if (state.polarizationLevel > 70) {
        Logger.warn('SocialMediaEchoChamberRouter', 'Awakening: Group polarization revealed');
        this._showAwakeningMoment('polarization_reveal');
      }

      if (state.algorithmicFiltering > 60 && state.userAwareness < 40) {
        Logger.warn('SocialMediaEchoChamberRouter', 'Awakening: Algorithmic bias revealed');
        this._showAwakeningMoment('algorithmic_bias_reveal');
      }
    }

    _showAwakeningMoment(type) {
      const awakeningMessages = {
        echo_chamber_reveal: '您发现自己被困在信息茧房中，只看到符合既有观点的内容。算法在不知不觉中限制了您的信息视野。',
        polarization_reveal: '群体极化效应显现：您的观点变得越来越极端，因为算法只推荐与您观点相似的内容。',
        algorithmic_bias_reveal: '算法偏见显现：推荐系统倾向于强化您的既有信念，而不是提供多元化信息。'
      };

      Logger.info('SocialMediaEchoChamberRouter', 'Awakening moment', type);
      this.gameState.awakeningMoments = this.gameState.awakeningMoments || [];
      this.gameState.awakeningMoments.push({
        type,
        message: awakeningMessages[type],
        turn: this.gameState.turn
      });
    }

    confirmDecision() {
      this.nextTurn();
    }

    resetGame() {
      this.gameState = {
        informationDiversity: 50,
        confirmationBiasLevel: 30,
        algorithmicFiltering: 40,
        userAwareness: 25,
        polarizationLevel: 20,
        turn: 1,
        totalTurns: 6,
        decisionHistory: [],
        delayedEffects: [],
        awakeningMoments: [],
        decisionOptions: TURN_SCENARIOS
      };
      this.currentPage = 'START';
      Logger.info('SocialMediaEchoChamberRouter', 'Game reset');
      this.render();
    }

    showEndGame() {
      this.currentPage = 'END_GAME';
      this._generateFinalReport();
      this.render();
    }

    _generateFinalReport() {
      const state = this.gameState;
      const report = {
        finalState: { ...state },
        decisions: state.decisionHistory.length,
        awakeningMoments: state.awakeningMoments?.length || 0,
        cognitiveBiases: this._identifyCognitiveBiases(),
        learningOutcomes: this._generateLearningOutcomes()
      };

      Logger.info('SocialMediaEchoChamberRouter', 'Final report generated', report);
      this.gameState.finalReport = report;
    }

    _identifyCognitiveBiases() {
      const biases = [];
      const state = this.gameState;

      if (state.confirmationBiasLevel > 60) {
        biases.push({
          type: '确认偏误 (confirmation_bias)',
          severity: state.confirmationBiasLevel,
          description: '您表现出明显的确认偏误，倾向于寻找和相信符合既有观点的信息。'
        });
      }

      if (state.informationDiversity < 40) {
        biases.push({
          type: '信息茧房 (echo_chamber)',
          severity: 100 - state.informationDiversity,
          description: '您被困在信息茧房中，接触的信息来源过于单一。'
        });
      }

      if (state.polarizationLevel > 60) {
        biases.push({
          type: '群体极化 (group_polarization)',
          severity: state.polarizationLevel,
          description: '您经历了群体极化，观点变得越来越极端。'
        });
      }

      return biases;
    }

    _generateLearningOutcomes() {
      const outcomes = [];
      const state = this.gameState;

      if (state.userAwareness > 60) {
        outcomes.push('您成功提升了对算法偏见的意识。');
      }

      if (state.informationDiversity > 60) {
        outcomes.push('您学会了主动寻找多元化的信息来源。');
      }

      if (state.confirmationBiasLevel < 40) {
        outcomes.push('您有效减少了确认偏误的影响。');
      }

      return outcomes;
    }

    render() {
      const container = this.container || document.getElementById('game-container');
      if (!container) {
        Logger.error('SocialMediaEchoChamberRouter', 'Container not found');
        return;
      }

      let html = '';

      switch (this.currentPage) {
        case 'START':
          html = this._renderStartPage();
          break;
        case 'TURN_1_INTRO':
        case 'TURN_2_INTRO':
        case 'TURN_3_INTRO':
        case 'TURN_4_INTRO':
        case 'TURN_5_INTRO':
        case 'TURN_6_INTRO':
          html = this._renderTurnIntro();
          break;
        case 'TURN_1_FEEDBACK':
        case 'TURN_2_FEEDBACK':
        case 'TURN_3_FEEDBACK':
        case 'TURN_4_FEEDBACK':
        case 'TURN_5_FEEDBACK':
        case 'TURN_6_FEEDBACK':
          html = this._renderTurnFeedback();
          break;
        case 'END_GAME':
          html = this._renderEndGame();
          break;
        default:
          html = this._renderStartPage();
      }

      if (typeof HTMLSanitizer !== 'undefined') {
        HTMLSanitizer.setInnerHTML(container, html);
      } else {
        container.innerHTML = html;
      }

      if (window.bindActionEvents) {
        window.bindActionEvents();
      }
    }

    _renderStartPage() {
      return `
        <div class="game-page start-page">
          <h2>📱 社交媒体信息茧房</h2>
          <div class="scenario-intro">
            <p>体验算法推荐如何创建信息茧房，强化确认偏误。您将扮演社交媒体平台的内容审核员，面对算法推荐导致的认知陷阱。</p>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">📊 总回合数</span>
                <span class="stat-value">${this.gameState.totalTurns}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">💪 难度</span>
                <span class="stat-value intermediate">中级</span>
              </div>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-primary" data-action="socialMediaStart">开始体验</button>
          </div>
        </div>
      `;
    }

    _renderTurnIntro() {
      const turn = this.gameState.turn;
      const state = this.gameState;
      const turnData = state.decisionOptions[turn - 1];

      return `
        <div class="game-page turn-page">
          <h3>🔄 第${turn}回合：${turnData.title}</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="stat-label">📚 信息多样性</span>
              <span class="stat-value">${state.informationDiversity.toFixed(0)}%</span>
            </div>
            <div class="state-item">
              <span class="stat-label">🎯 确认偏误</span>
              <span class="stat-value">${state.confirmationBiasLevel.toFixed(0)}%</span>
            </div>
            <div class="state-item">
              <span class="stat-label">🤖 算法过滤</span>
              <span class="stat-value">${state.algorithmicFiltering.toFixed(0)}%</span>
            </div>
            <div class="state-item">
              <span class="stat-label">💡 用户意识</span>
              <span class="stat-value">${state.userAwareness.toFixed(0)}%</span>
            </div>
            <div class="state-item">
              <span class="stat-label">⚡ 极化程度</span>
              <span class="stat-value">${state.polarizationLevel.toFixed(0)}%</span>
            </div>
          </div>
          <div class="scenario-description">
            <p><strong>情境：</strong>${turnData.situation}</p>
            <p><em>${turnData.context}</em></p>
          </div>
          <div class="decision-options">
            <h4>请做出您的决策：</h4>
            ${turnData.options.map((opt, idx) => `
              <div class="option-card" data-action="socialMediaMakeDecision" data-param-optionIndex="${idx}">
                <h5>${opt.text}</h5>
                <p class="option-desc">${opt.description}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    _renderTurnFeedback() {
      const turn = this.gameState.turn;
      const state = this.gameState;
      const turnData = state.decisionOptions[turn - 1];
      const lastDecision = state.decisionHistory[state.decisionHistory.length - 1];

      return `
        <div class="game-page feedback-page">
          <h3>📊 第${turn}回合反馈</h3>
          <div class="feedback-content">
            <p>您选择了：<strong>${lastDecision?.optionText || '未知'}</strong></p>
            <div class="state-changes">
              <h4>当前状态</h4>
              <div class="state-grid">
                <div class="state-item">
                  <span class="stat-label">📚 信息多样性</span>
                  <span class="stat-value">${state.informationDiversity.toFixed(0)}%</span>
                </div>
                <div class="state-item">
                  <span class="stat-label">🎯 确认偏误</span>
                  <span class="stat-value">${state.confirmationBiasLevel.toFixed(0)}%</span>
                </div>
                <div class="state-item">
                  <span class="stat-label">🤖 算法过滤</span>
                  <span class="stat-value">${state.algorithmicFiltering.toFixed(0)}%</span>
                </div>
                <div class="state-item">
                  <span class="stat-label">💡 用户意识</span>
                  <span class="stat-value">${state.userAwareness.toFixed(0)}%</span>
                </div>
                <div class="state-item">
                  <span class="stat-label">⚡ 极化程度</span>
                  <span class="stat-value">${state.polarizationLevel.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            ${state.awakeningMoments && state.awakeningMoments.length > 0 ? `
              <div class="awakening-moment">
                <h4>💡 觉醒时刻</h4>
                <p>${state.awakeningMoments[state.awakeningMoments.length - 1].message}</p>
              </div>
            ` : ''}
          </div>
          <div class="actions">
            <button class="btn btn-primary" data-action="socialMediaNextTurn">继续</button>
          </div>
        </div>
      `;
    }

    _renderEndGame() {
      const report = this.gameState.finalReport;
      if (!report) return '<p>报告生成中...</p>';

      return `
        <div class="game-page end-page">
          <h2>🎯 体验完成</h2>
          <div class="final-report">
            <h3>您的信息茧房体验报告</h3>
            <div class="report-section">
              <h4>最终状态</h4>
              <ul>
                <li>信息多样性: ${report.finalState.informationDiversity.toFixed(0)}%</li>
                <li>确认偏误: ${report.finalState.confirmationBiasLevel.toFixed(0)}%</li>
                <li>算法过滤: ${report.finalState.algorithmicFiltering.toFixed(0)}%</li>
                <li>用户意识: ${report.finalState.userAwareness.toFixed(0)}%</li>
                <li>极化程度: ${report.finalState.polarizationLevel.toFixed(0)}%</li>
              </ul>
            </div>
            ${report.cognitiveBiases.length > 0 ? `
              <div class="report-section">
                <h4>识别的认知偏差</h4>
                <ul>
                  ${report.cognitiveBiases.map(bias => `<li><strong>${bias.type}</strong>: ${bias.description}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${report.learningOutcomes.length > 0 ? `
              <div class="report-section">
                <h4>学习成果</h4>
                <ul>
                  ${report.learningOutcomes.map(outcome => `<li>${outcome}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            <div class="report-section">
              <h4>教学要点</h4>
              <ul>
                <li>算法推荐在提升用户体验的同时，可能加剧信息茧房效应</li>
                <li>确认偏误使用户倾向于选择支持自己观点的内容</li>
                <li>群体极化会使观点在信息茧房中不断极端化</li>
                <li>提高用户对算法偏见的意识是打破茧房的第一步</li>
              </ul>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-primary" data-action="socialMediaReset">重新体验</button>
            <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
          </div>
        </div>
      `;
    }
  }

  global.SocialMediaEchoChamberRouter = SocialMediaEchoChamberRouter;
  global.socialMediaEchoChamberRouter = null;

  global.initSocialMediaEchoChamber = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      Logger?.error('Container not found:', containerId);
      return null;
    }

    global.socialMediaEchoChamberRouter = new SocialMediaEchoChamberRouter(container);
    global.socialMediaEchoChamberRouter.startGame();
    
    return global.socialMediaEchoChamberRouter;
  };

})(typeof window !== 'undefined' ? window : this);
