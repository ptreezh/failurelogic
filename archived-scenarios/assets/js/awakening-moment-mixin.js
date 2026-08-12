/**
 * 觉醒时刻混入对象
 * Awakening Moment Mixin
 * 
 * 用于快速为场景路由器添加觉醒时刻功能
 * 
 * 使用方法:
 * 1. 在路由器类中引入此混入
 * 2. 在submitTurn方法末尾调用 this._checkAwakeningMoment()
 * 3. 在nextTurn方法中添加 AWAKENING 页面判断
 * 4. 在renderPage方法中添加 'AWAKENING' case
 * 5. 在renderEndingPage方法中添加觉醒时刻显示
 */

const AwakeningMomentMixin = {
  // 觉醒时刻配置
  awakeningConfig: {
    triggerTurn: 5,  // 在第几回合触发觉醒时刻
    awakeningTurn: 6 // 在第几回合显示觉醒时刻页面
  },

  // 检查觉醒时刻
  _checkAwakeningMoment() {
    const turn = this.currentTurn;
    const config = this.awakeningConfig || AwakeningMomentMixin.awakeningConfig;

    if (turn === config.triggerTurn) {
      const awakeningType = this._getAwakeningType();
      this._showAwakeningMoment(awakeningType);
    }
  },

  // 获取觉醒时刻类型
  _getAwakeningType() {
    // 根据场景名称返回对应的觉醒时刻类型
    const sceneName = this.constructor.name;
    
    const awakeningTypes = {
      'PersonalFinancePageRouter': 'finance_complexity',
      'ClimateChangePageRouter': 'climate_urgency',
      'AIGovernancePageRouter': 'ai_ethics',
      'FinancialCrisisPageRouter': 'systemic_risk'
    };

    return awakeningTypes[sceneName] || 'general_awakening';
  },

  // 显示觉醒时刻
  _showAwakeningMoment(type) {
    const awakeningMessages = {
      finance_complexity: '个人财务决策中的复杂性显现！你发现简单的线性思维（如果我做X，就会得到Y结果）往往忽略了市场波动、通货膨胀、风险与回报的复杂关系。在个人理财中，短期消费与长期投资、风险与收益相互影响，产生意想不到的结果。',
      climate_urgency: '气候变化政策中的紧迫性显现！你发现简单的线性思维（如果我做X，就会得到Y结果）往往忽略了国际政治博弈、经济发展与环境保护的复杂关系。在气候政策中，短期利益与长期生存、不同国家的需求相互冲突，产生意想不到的结果。',
      ai_ethics: 'AI治理中的伦理困境显现！你发现简单的线性思维（如果我做X，就会得到Y结果）往往忽略了技术创新、安全风险、伦理考量的复杂关系。在AI治理中，创新发展与社会安全、效率与公平相互影响，产生意想不到的结果。',
      systemic_risk: '金融危机中的系统性风险显现！你发现简单的线性思维（如果我做X，就会得到Y结果）往往忽略了金融机构互联性、市场心理、政策传导的复杂关系。在金融危机中，个体理性与集体非理性、短期稳定与长期风险相互影响，产生意想不到的结果。',
      general_awakening: '你发现了决策中的认知陷阱！简单的线性思维往往忽略了复杂系统中的隐藏变量、延迟效应和系统反馈。'
    };

    this.gameState.awakeningMoments = this.gameState.awakeningMoments || [];
    this.gameState.awakeningMoments.push({
      type,
      message: awakeningMessages[type] || awakeningMessages.general_awakening,
      turn: this.currentTurn
    });
  },

  // 渲染觉醒时刻页面
  renderAwakeningPage() {
    const awakening = this.gameState.awakeningMoments?.[this.gameState.awakeningMoments.length - 1];
    const routerName = this.constructor.name.replace('PageRouter', '');

    return `
      <div class="game-page awakening-page">
        <h2>💡 觉醒时刻</h2>

        <div class="awakening-content">
          <div class="awakening-message">
            <p>${awakening?.message || '你发现了决策中的认知陷阱！'}</p>
          </div>

          <div class="awakening-options">
            <button class="btn btn-option" onclick="window.${routerName.toLowerCase()}Router.makeAwakeningDecision('continue'); window.${routerName.toLowerCase()}Router.render();">
              继续游戏
            </button>
            <button class="btn btn-option" onclick="window.${routerName.toLowerCase()}Router.makeAwakeningDecision('reflect'); window.${routerName.toLowerCase()}Router.render();">
              反思决策
            </button>
            <button class="btn btn-option" onclick="window.${routerName.toLowerCase()}Router.makeAwakeningDecision('learn'); window.${routerName.toLowerCase()}Router.render();">
              学习更多
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // 处理觉醒时刻决策
  makeAwakeningDecision(strategy) {
    this.gameState.awakeningStrategy = strategy;
    this.currentPage = 'GAME_ENDING';
  },

  // 获取觉醒时刻内容HTML（用于renderEndingPage）
  getAwakeningContentHTML() {
    if (!this.gameState.awakeningMoments?.length) {
      return '';
    }

    const awakening = this.gameState.awakeningMoments[this.gameState.awakeningMoments.length - 1];
    return `
      <div class="awakening-summary">
        <h3>💡 觉醒时刻</h3>
        <p>${awakening.message}</p>
      </div>
    `;
  }
};

// 导出混入对象
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AwakeningMomentMixin;
}
