/**
 * Social Media Echo Chamber Scenario Router
 * 社交媒体信息茧房场景路由器
 * 基于EventBus和Logger构建
 */

import { EventBus } from './event-bus.js';
import Logger from './logger.js';

class SocialMediaEchoChamberRouter {
  constructor() {
    this.gameState = {
      informationDiversity: 50,
      confirmationBiasLevel: 30,
      algorithmicFiltering: 40,
      userAwareness: 25,
      polarizationLevel: 20,
      turn: 1,
      totalTurns: 6,
      decisionHistory: [],
      delayedEffects: []
    };

    this.currentPage = 'START';
    this._registerEvents();
    Logger.info('SocialMediaEchoChamberRouter', 'Initialized');
  }

  // 注册事件处理器
  _registerEvents() {
    EventBus.on('socialMediaStart', () => this.startGame());
    EventBus.on('socialMediaNextTurn', () => this.nextTurn());
    EventBus.on('socialMediaBack', () => this.back());
    EventBus.on('socialMediaMakeDecision', (data) => this.makeDecision(data));
    EventBus.on('socialMediaConfirmDecision', () => this.confirmDecision());
    EventBus.on('socialMediaReset', () => this.resetGame());
  }

  // 开始游戏
  startGame() {
    Logger.debug('SocialMediaEchoChamberRouter', 'Starting game');
    this.currentPage = 'TURN_1_INTRO';
    this.render();
  }

  // 下一步
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

  // 上一步
  back() {
    if (this.gameState.turn > 1) {
      this.gameState.turn--;
      this.currentPage = `TURN_${this.gameState.turn}_INTRO`;
      Logger.debug('SocialMediaEchoChamberRouter', `Back to turn: ${this.gameState.turn}`);
      this.render();
    }
  }

  // 做决策
  makeDecision(data) {
    const decision = this.gameState.decisionOptions[data.optionIndex];
    if (!decision) {
      Logger.error('SocialMediaEchoChamberRouter', 'Invalid decision option', data);
      return;
    }

    this.gameState.decisionHistory.push({
      turn: this.gameState.turn,
      decision: decision.id,
      timestamp: Date.now()
    });

    // 应用决策效果
    this._applyDecisionEffects(decision);

    // 检查觉醒时刻
    this._checkAwakeningMoments();

    this.currentPage = `TURN_${this.gameState.turn}_FEEDBACK`;
    Logger.debug('SocialMediaEchoChamberRouter', 'Decision made', decision.id);
    this.render();
  }

  // 应用决策效果
  _applyDecisionEffects(decision) {
    const effects = decision.effects;
    for (const [key, value] of Object.entries(effects)) {
      if (this.gameState[key] !== undefined) {
        this.gameState[key] = Math.max(0, Math.min(100, this.gameState[key] + value));
      }
    }

    // 添加延迟效果
    if (decision.delayedEffects) {
      this.gameState.delayedEffects.push({
        turn: this.gameState.turn + 2,
        effects: decision.delayedEffects
      });
    }

    // 处理延迟效果
    this._processDelayedEffects();
  }

  // 处理延迟效果
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

  // 检查觉醒时刻
  _checkAwakeningMoments() {
    const state = this.gameState;

    // 信息茧房效应显现
    if (state.informationDiversity < 30 && state.confirmationBiasLevel > 60) {
      Logger.warn('SocialMediaEchoChamberRouter', 'Awakening: Echo chamber effect revealed');
      this._showAwakeningMoment('echo_chamber_reveal');
    }

    // 群体极化显现
    if (state.polarizationLevel > 70) {
      Logger.warn('SocialMediaEchoChamberRouter', 'Awakening: Group polarization revealed');
      this._showAwakeningMoment('polarization_reveal');
    }

    // 算法偏见显现
    if (state.algorithmicFiltering > 60 && state.userAwareness < 40) {
      Logger.warn('SocialMediaEchoChamberRouter', 'Awakening: Algorithmic bias revealed');
      this._showAwakeningMoment('algorithmic_bias_reveal');
    }
  }

  // 显示觉醒时刻
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

  // 确认决策
  confirmDecision() {
    this.nextTurn();
  }

  // 重置游戏
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
      delayedEffects: []
    };
    this.currentPage = 'START';
    Logger.info('SocialMediaEchoChamberRouter', 'Game reset');
    this.render();
  }

  // 显示结束页面
  showEndGame() {
    this.currentPage = 'END_GAME';
    this._generateFinalReport();
    this.render();
  }

  // 生成最终报告
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

  // 识别认知偏差
  _identifyCognitiveBiases() {
    const biases = [];
    const state = this.gameState;

    if (state.confirmationBiasLevel > 60) {
      biases.push({
        type: 'confirmation_bias',
        severity: state.confirmationBiasLevel,
        description: '您表现出明显的确认偏误，倾向于寻找和相信符合既有观点的信息。'
      });
    }

    if (state.informationDiversity < 40) {
      biases.push({
        type: 'echo_chamber',
        severity: 100 - state.informationDiversity,
        description: '您被困在信息茧房中，接触的信息来源过于单一。'
      });
    }

    if (state.polarizationLevel > 60) {
      biases.push({
        type: 'group_polarization',
        severity: state.polarizationLevel,
        description: '您经历了群体极化，观点变得越来越极端。'
      });
    }

    return biases;
  }

  // 生成学习成果
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

  // 渲染页面
  render() {
    const container = document.getElementById('game-container');
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

    HTMLSanitizer?.setInnerHTML(container, html);

    // 重新绑定事件
    if (window.bindActionEvents) {
      window.bindActionEvents();
    }
  }

  // 渲染开始页面
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

  // 渲染回合介绍
  _renderTurnIntro() {
    const turn = this.gameState.turn;
    const state = this.gameState;

    return `
      <div class="game-page turn-page">
        <h3>🔄 第${turn}回合</h3>
        <div class="state-grid">
          <div class="state-item">
            <span class="state-label">📚 信息多样性</span>
            <span class="state-value">${state.informationDiversity.toFixed(0)}%</span>
          </div>
          <div class="state-item">
            <span class="state-label">🎯 确认偏误</span>
            <span class="state-value">${state.confirmationBiasLevel.toFixed(0)}%</span>
          </div>
          <div class="state-item">
            <span class="state-label">🤖 算法过滤</span>
            <span class="state-value">${state.algorithmicFiltering.toFixed(0)}%</span>
          </div>
          <div class="state-item">
            <span class="state-label">💡 用户意识</span>
            <span class="state-value">${state.userAwareness.toFixed(0)}%</span>
          </div>
          <div class="state-item">
            <span class="state-label">⚡ 极化程度</span>
            <span class="state-value">${state.polarizationLevel.toFixed(0)}%</span>
          </div>
        </div>
        <div class="scenario-description">
          <p>作为内容审核员，您需要决定如何平台上的信息。您的决策将影响信息多样性和用户认知。</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" data-action="socialMediaMakeDecision" data-param-turn="${turn}">开始决策</button>
        </div>
      </div>
    `;
  }

  // 渲染决策反馈
  _renderTurnFeedback() {
    const turn = this.gameState.turn;
    const state = this.gameState;
    const lastDecision = state.decisionHistory[state.decisionHistory.length - 1];

    return `
      <div class="game-page feedback-page">
        <h3>📊 第${turn}回合反馈</h3>
        <div class="feedback-content">
          <p>您的决策已生效。观察各项指标的变化，体验信息茧房效应。</p>
          <div class="state-changes">
            <h4>当前状态</h4>
            <div class="state-grid">
              <div class="state-item">
                <span class="state-label">📚 信息多样性</span>
                <span class="state-value">${state.informationDiversity.toFixed(0)}%</span>
              </div>
              <div class="state-item">
                <span class="state-label">🎯 确认偏误</span>
                <span class="state-value">${state.confirmationBiasLevel.toFixed(0)}%</span>
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

  // 渲染结束页面
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
        </div>
        <div class="actions">
          <button class="btn btn-primary" data-action="socialMediaReset">重新体验</button>
          <button class="btn btn-secondary" data-action="returnToScenarios">返回场景列表</button>
        </div>
      </div>
    `;
  }
}

// 导出（不暴露到window）
export default SocialMediaEchoChamberRouter;
