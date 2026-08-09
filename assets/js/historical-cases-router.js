/**
 * Historical Cases Scenario Router
 * 历史案例场景路由器
 * 处理所有历史决策失败案例 (hist-001 ~ hist-021)
 */

(function(global) {
  'use strict';

  const SCENARIO_DATA_URL = '/api/historical/scenarios';

  class HistoricalCasesRouter {
    constructor(container, apiClient) {
      this.container = container;
      this.apiClient = apiClient;
      this.scenarioData = null;
      this.currentCase = null;
      this.currentStep = 0;
      this.decisions = [];
      this.startTime = Date.now();
    }

    async initialize(scenarioId) {
      try {
        this.scenarioData = await this.loadScenarioData();
        this.currentCase = this.scenarioData.find(c => c.scenarioId === scenarioId) || this.scenarioData[0];
        this.currentStep = 0;
        this.decisions = [];
        this.renderIntro();
      } catch (error) {
        Logger?.error('HistoricalCasesRouter', 'Initialization failed:', error);
        this.showError('历史案例加载失败，请刷新页面重试');
      }
    }

    async loadScenarioData() {
      if (this.apiClient) {
        try {
          const data = await this.apiClient.getHistoricalScenarios();
          if (data && data.length > 0) return data;
        } catch (e) {
          Logger?.warn('HistoricalCasesRouter', 'API加载失败，使用本地数据');
        }
      }

      return this.getDefaultScenarioData();
    }

    getDefaultScenarioData() {
      return [
        {
          scenarioId: 'hist-001',
          title: '挑战者号航天飞机灾难',
          description: '1986年挑战者号航天飞机发射决策过程分析',
          decisionPoints: [
            {
              step: 1,
              situation: '气温预报显示发射日将异常寒冷（华氏31度，摄氏-0.5度）',
              options: ['推迟发射以评估低温风险', '按计划发射']
            },
            {
              step: 2,
              situation: '工程师提出O型环在低温下可能失效的担忧',
              options: ['要求提供更多低温测试数据', '要求制造商出具书面保证', '忽略担忧，按计划发射']
            }
          ],
          actualOutcomes: ['管理层决定按计划发射', '发射过程中右固体火箭助推器的O型环失效', '导致燃料泄漏并引发爆炸', '七名宇航员全部遇难'],
          alternativeOptions: ['推迟发射以进行低温环境试验', '更换更适合低温环境的O型环材料', '建立更严格的低温发射标准'],
          lessons: ['选择性信息处理让管理层忽视了工程警告', '一致性压力压制了反对声音', '时间压力影响了风险评估', '专家意见被非技术管理层否决'],
          pyramidAnalysis: {
            coreConclusion: '系统性决策模式导致了灾难性结果',
            supportingArguments: ['选择性信息处理让管理层倾向于寻找支持按时发射的信息', '一致性压力压制了异议声音，形成虚假共识', '时间压力和预算限制影响了客观风险评估'],
            examples: ['类似决策模式在其他组织决策中反复出现，如哥伦比亚号航天飞机事故', '项目延期压力常常导致风险被低估'],
            actionableAdvice: ['建立多元化决策机制，鼓励质疑声音', '设立独立的安全审查委员会', '在决策中充分考虑技术专家意见']
          }
        }
      ];
    }

    renderIntro() {
      if (!this.currentCase) return;

      const html = `
        <div class="scenario-intro historical-intro">
          <h1>${this.currentCase.title}</h1>
          <p class="description">${this.currentCase.description}</p>
          <div class="case-meta">
            <span class="case-type">📚 历史案例分析</span>
            <span class="case-steps">📋 ${this.currentCase.decisionPoints.length} 个决策点</span>
          </div>
          <div class="instructions">
            <h3>场景说明</h3>
            <p>您将扮演当时的决策者，面临与历史真实情况相同的选择。您的决策将揭示认知偏差如何影响重大决策。</p>
            <p class="warning">请注意：这不是一个简单的"选对答案"游戏。每个选择都有其合理性，重要的是理解决策背后的认知模式。</p>
          </div>
          <button class="start-btn" onclick="window.historicalCasesRouter.startScenario()">
            开始分析
          </button>
        </div>
      `;

      HTMLSanitizer?.setInnerHTML(this.container, html);
    }

    startScenario() {
      this.currentStep = 0;
      this.decisions = [];
      this.renderCurrentStep();
    }

    renderCurrentStep() {
      if (!this.currentCase) return;

      if (this.currentStep >= this.currentCase.decisionPoints.length) {
        this.renderConclusion();
        return;
      }

      const step = this.currentCase.decisionPoints[this.currentStep];
      const html = `
        <div class="scenario-round historical-round">
          <div class="round-header">
            <span class="step-indicator">决策点 ${this.currentStep + 1} / ${this.currentCase.decisionPoints.length}</span>
            <h2>${step.situation}</h2>
          </div>
          <div class="decision-panel">
            <h3>您的决策：</h3>
            <div class="options-list">
              ${step.options.map((opt, idx) => `
                <button class="option-btn historical-option" 
                        onclick="window.historicalCasesRouter.makeDecision(${idx})">
                  ${opt}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      HTMLSanitizer?.setInnerHTML(this.container, html);
    }

    makeDecision(optionIndex) {
      const step = this.currentCase.decisionPoints[this.currentStep];
      this.decisions.push({
        step: this.currentStep + 1,
        situation: step.situation,
        selectedOption: step.options[optionIndex],
        optionIndex: optionIndex
      });

      this.currentStep++;
      this.renderCurrentStep();
    }

    renderConclusion() {
      if (!this.currentCase) return;

      const html = `
        <div class="scenario-conclusion historical-conclusion">
          <h1>案例分析：${this.currentCase.title}</h1>
          
          <div class="actual-outcome-section">
            <h2>📜 历史真实结果</h2>
            <div class="outcome-timeline">
              ${this.currentCase.actualOutcomes.map(outcome => `
                <div class="outcome-item">
                  <span class="outcome-icon">➤</span>
                  <span class="outcome-text">${outcome}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="your-decisions-section">
            <h2>🎯 您的决策路径</h2>
            <div class="decisions-list">
              ${this.decisions.map(d => `
                <div class="decision-item">
                  <span class="decision-step">决策点 ${d.step}</span>
                  <span class="decision-text">${d.selectedOption}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="alternative-section">
            <h2>💡 更优选择</h2>
            <ul>
              ${this.currentCase.alternativeOptions.map(opt => `<li>${opt}</li>`).join('')}
            </ul>
          </div>

          <div class="lessons-section">
            <h2>📚 经验教训</h2>
            <ul>
              ${this.currentCase.lessons.map(lesson => `<li>${lesson}</li>`).join('')}
            </ul>
          </div>

          <div class="pyramid-analysis-section">
            <h2>🏛️ 金字塔分析</h2>
            <div class="pyramid-content">
              <div class="pyramid-conclusion">
                <h4>核心结论</h4>
                <p>${this.currentCase.pyramidAnalysis.coreConclusion}</p>
              </div>
              <div class="pyramid-arguments">
                <h4>支撑论据</h4>
                <ul>
                  ${this.currentCase.pyramidAnalysis.supportingArguments.map(arg => `<li>${arg}</li>`).join('')}
                </ul>
              </div>
              <div class="pyramid-examples">
                <h4>历史对照</h4>
                <ul>
                  ${this.currentCase.pyramidAnalysis.examples.map(ex => `<li>${ex}</li>`).join('')}
                </ul>
              </div>
              <div class="pyramid-advice">
                <h4> actionable advice </h4>
                <ul>
                  ${this.currentCase.pyramidAnalysis.actionableAdvice.map(adv => `<li>${adv}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button onclick="window.historicalCasesRouter.restart()">重新分析</button>
            <button onclick="window.historicalCasesRouter.loadNextCase()">下一个案例</button>
            <button onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
          </div>
        </div>
      `;

      HTMLSanitizer?.setInnerHTML(this.container, html);
    }

    async loadNextCase() {
      if (!this.scenarioData || this.scenarioData.length === 0) return;

      const currentIndex = this.scenarioData.findIndex(c => c.scenarioId === this.currentCase?.scenarioId);
      const nextIndex = (currentIndex + 1) % this.scenarioData.length;
      this.currentCase = this.scenarioData[nextIndex];
      this.currentStep = 0;
      this.decisions = [];
      this.renderIntro();
    }

    restart() {
      this.currentStep = 0;
      this.decisions = [];
      this.startScenario();
    }

    showError(message) {
      HTMLSanitizer?.setInnerHTML(this.container, `
        <div class="error-message">
          <p>${message}</p>
          <button onclick="window.location.reload()">刷新页面</button>
        </div>
      `);
    }
  }

  global.HistoricalCasesRouter = HistoricalCasesRouter;
  global.historicalCasesRouter = null;

  global.initHistoricalCases = function(containerId, apiClient) {
    const container = document.getElementById(containerId);
    if (!container) {
      Logger?.error('Container not found:', containerId);
      return null;
    }

    global.historicalCasesRouter = new HistoricalCasesRouter(container, apiClient);
    return global.historicalCasesRouter;
  };

})(typeof window !== 'undefined' ? window : this);
