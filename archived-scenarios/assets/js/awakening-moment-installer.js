/**
 * 觉醒时刻安装脚本
 * Awakening Moment Installer
 * 
 * 用于快速为场景路由器安装觉醒时刻功能
 * 
 * 使用方法:
 * 1. 在浏览器控制台中运行此脚本
 * 2. 传入路由器实例
 * 3. 自动添加觉醒时刻功能
 */

function installAwakeningMoments(routerInstance, config = {}) {
  const defaultConfig = {
    triggerTurn: 5,
    awakeningTurn: 6,
    awakeningType: 'general_awakening',
    awakeningMessage: '你发现了决策中的认知陷阱！简单的线性思维往往忽略了复杂系统中的隐藏变量、延迟效应和系统反馈。'
  };

  const finalConfig = { ...defaultConfig, ...config };

  // 添加觉醒时刻配置
  routerInstance.awakeningConfig = finalConfig;

  // 添加觉醒时刻检查方法
  routerInstance._checkAwakeningMoment = function() {
    const turn = this.currentTurn;
    if (turn === this.awakeningConfig.triggerTurn) {
      this._showAwakeningMoment(this.awakeningConfig.awakeningType);
    }
  };

  // 添加觉醒时刻显示方法
  routerInstance._showAwakeningMoment = function(type) {
    this.gameState.awakeningMoments = this.gameState.awakeningMoments || [];
    this.gameState.awakeningMoments.push({
      type,
      message: this.awakeningConfig.awakeningMessage,
      turn: this.currentTurn
    });
  };

  // 添加觉醒时刻页面渲染方法
  routerInstance.renderAwakeningPage = function() {
    const awakening = this.gameState.awakeningMoments?.[this.gameState.awakeningMoments.length - 1];
    const routerName = this.constructor.name.replace('PageRouter', '').toLowerCase();

    // Get illustration for awakening moment
    let illustrationHtml = '';
    try {
      const scenarioId = this.currentScenario?.id || 'default';
      const svg = ScenarioIllustrations?.generate(scenarioId, 'awakening', 'light');
      if (svg) {
        illustrationHtml = `<div class="awakening-illustration">${svg}</div>`;
      }
    } catch (e) {
      illustrationHtml = '';
    }

    return `
      <div class="game-page awakening-page">
        <h2>💡 觉醒时刻</h2>

        ${illustrationHtml}

        <div class="awakening-content">
          <div class="awakening-message">
            <p>${awakening?.message || '你发现了决策中的认知陷阱！'}</p>
          </div>
          <div class="awakening-options">
            <button class="btn btn-option" onclick="window.${routerName}Router.makeAwakeningDecision('continue'); window.${routerName}Router.render();">继续游戏</button>
            <button class="btn btn-option" onclick="window.${routerName}Router.makeAwakeningDecision('reflect'); window.${routerName}Router.render();">反思决策</button>
            <button class="btn btn-option" onclick="window.${routerName}Router.makeAwakeningDecision('learn'); window.${routerName}Router.render();">学习更多</button>
          </div>
        </div>
      </div>
    `;
  };

  // 添加觉醒时刻决策方法
  routerInstance.makeAwakeningDecision = function(strategy) {
    this.gameState.awakeningStrategy = strategy;
    this.currentPage = 'GAME_ENDING';
  };

  // 添加觉醒时刻内容获取方法
  routerInstance.getAwakeningContentHTML = function() {
    if (!this.gameState.awakeningMoments?.length) return '';
    const awakening = this.gameState.awakeningMoments[this.gameState.awakeningMoments.length - 1];
    return `<div class="awakening-summary"><h3>💡 觉醒时刻</h3><p>${awakening.message}</p></div>`;
  };

  Logger?.debug(`觉醒时刻已安装到 ${routerInstance.constructor.name}`);
  return routerInstance;
}

// 使用示例:
// const financeRouter = new PersonalFinancePageRouter();
// installAwakeningMoments(financeRouter, {
//   awakeningType: 'finance_complexity',
//   awakeningMessage: '个人财务决策中的复杂性显现！...'
// });

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { installAwakeningMoments };
}
