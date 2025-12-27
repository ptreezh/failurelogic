/**
 * 历史决策重现测试组件
 */
class HistoricalScenariosComponent {
  constructor(apiUrl = 'http://localhost:8000') {
    this.apiUrl = apiUrl;
    this.scenarios = [];
    this.currentScenarioIndex = 0;
  }

  async initialize() {
    try {
      const response = await fetch(`${this.apiUrl}/api/historical/scenarios`);
      const data = await response.json();
      this.scenarios = data.scenarios;
      this.render();
    } catch (error) {
      console.error('Failed to load historical scenarios:', error);
      this.renderError();
    }
  }

  render() {
    const appContainer = document.getElementById('app') || document.createElement('div');
    appContainer.className = 'historical-test-container';
    
    appContainer.innerHTML = `
      <div class="test-header">
        <h1>历史决策重现专项测试</h1>
        <p>通过重现历史上的重大决策失误，体验系统性认知偏差</p>
      </div>
      
      <main class="test-main">
        <div class="test-intro">
          <h2>为什么需要学习历史决策失误？</h2>
          <p>历史上的重大决策失误往往源于系统性的认知偏差。通过重现这些决策过程，我们可以更好地理解自己的思维局限，避免在未来重蹈覆辙。</p>
          <p>本测试将通过挑战者号航天飞机灾难、泰坦尼克号事件等经典案例，让您体验决策中的系统性错误。</p>
        </div>
        
        <div class="test-scenarios">
          <h2>历史决策案例</h2>
          
          ${this.renderScenario(this.scenarios[this.currentScenarioIndex])}
          
          <div class="navigation-controls">
            <button id="prev-scenario" ${this.currentScenarioIndex <= 0 ? 'disabled' : ''}>上一个案例</button>
            <button id="next-scenario" ${this.currentScenarioIndex >= this.scenarios.length - 1 ? 'disabled' : ''}>下一个案例</button>
          </div>
        </div>
      </main>
    `;

    this.attachEventListeners();
  }

  renderScenario(scenario) {
    if (!scenario) return '<p>正在加载案例...</p>';

    return `
      <div class="scenario-container">
        <div class="scenario-header">
          <h3>${scenario.title}</h3>
          <p class="scenario-description">${scenario.description}</p>
        </div>
        
        <div class="scenario-content">
          <h4>决策节点</h4>
          ${scenario.decisionPoints.map((point, idx) => `
            <div class="decision-point">
              <h5>决策点 ${idx + 1}: ${point.situation}</h5>
              <div class="options">
                ${point.options.map((option, optIdx) => `
                  <div class="option">
                    <input type="radio" name="decision-${idx}" id="opt-${idx}-${optIdx}" value="${optIdx}">
                    <label for="opt-${idx}-${optIdx}">${String.fromCharCode(65 + optIdx)}. ${option}</label>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
          
          <div class="actual-outcomes">
            <h4>实际结果</h4>
            <ul>
              ${scenario.actualOutcomes.map(outcome => `<li>${outcome}</li>`).join('')}
            </ul>
          </div>
          
          <div class="alternative-options">
            <h4>其他可行选项</h4>
            <ul>
              ${scenario.alternativeOptions.map(option => `<li>${option}</li>`).join('')}
            </ul>
          </div>
          
          <div class="lessons">
            <h4>认知偏差教训</h4>
            <ul>
              ${scenario.lessons.map(lesson => `<li>${lesson}</li>`).join('')}
            </ul>
          </div>
          
          <div class="pyramid-analysis">
            <h4>金字塔原理解释</h4>
            <div class="core-conclusion">
              <strong>核心结论:</strong> ${scenario.pyramidAnalysis.coreConclusion}
            </div>
            <div class="supporting-arguments">
              <strong>支撑论据:</strong>
              <ul>
                ${scenario.pyramidAnalysis.supportingArguments.map(arg => `<li>${arg}</li>`).join('')}
              </ul>
            </div>
            <div class="examples">
              <strong>实例:</strong>
              <ul>
                ${scenario.pyramidAnalysis.examples.map(example => `<li>${example}</li>`).join('')}
              </ul>
            </div>
            <div class="actionable-advice">
              <strong>实用建议:</strong>
              <ul>
                ${scenario.pyramidAnalysis.actionableAdvice.map(advice => `<li>${advice}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
        
        <button class="btn btn-primary submit-scenario-btn" data-scenario-id="${scenario.scenarioId}">
          提交我的决策
        </button>
        
        <div class="scenario-explanation" id="explanation-${scenario.scenarioId}" style="display: none;">
          <!-- 解释内容将在此处显示 -->
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // 上一个案例按钮
    document.getElementById('prev-scenario')?.addEventListener('click', () => {
      if (this.currentScenarioIndex > 0) {
        this.currentScenarioIndex--;
        this.render();
      }
    });

    // 下一个案例按钮
    document.getElementById('next-scenario')?.addEventListener('click', () => {
      if (this.currentScenarioIndex < this.scenarios.length - 1) {
        this.currentScenarioIndex++;
        this.render();
      }
    });

    // 提交决策按钮
    document.querySelectorAll('.submit-scenario-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const scenarioId = e.target.dataset.scenarioId;
        await this.submitScenarioDecision(scenarioId);
      });
    });
  }

  async submitScenarioDecision(scenarioId) {
    // 获取用户选择的决策
    const scenario = this.scenarios.find(s => s.scenarioId === scenarioId);
    const decisionChoices = [];
    
    scenario.decisionPoints.forEach((point, idx) => {
      const selectedOption = document.querySelector(`input[name="decision-${idx}"]:checked`);
      if (selectedOption) {
        decisionChoices.push({
          decisionPoint: idx,
          choice: parseInt(selectedOption.value)
        });
      }
    });

    try {
      const response = await fetch(`${this.apiUrl}/api/historical/submit-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-session-' + Date.now(),
          sessionId: 'session-' + Date.now(),
          scenarioId: scenarioId,
          decisions: decisionChoices,
          responseTime: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const explanationEl = document.getElementById(`explanation-${scenarioId}`);
      
      explanationEl.style.display = 'block';
      explanationEl.innerHTML = `
        <h3>决策分析</h3>
        <p><strong>您选择的决策:</strong> ${data.user_choices?.map(dc => dc.choice).join(', ') || '未选择'}</p>
        <p><strong>历史实际决策:</strong> ${data.historical_outcomes?.map(outcome => outcome).join(', ') || 'N/A'}</p>
        <p><strong>分析:</strong> ${data.analysis || '系统分析中...'}</p>
        
        <div class="pyramid-breakdown">
          <h4>认知偏差分析 (金字塔原理)</h4>
          <div class="core-insight">
            <strong>核心见解:</strong> ${data.pyramid_analysis?.core_conclusion || '暂无'}
          </div>
          <div class="supporting-points">
            <strong>支撑要点:</strong>
            <ul>
              ${data.pyramid_analysis?.supporting_arguments?.map(arg => `<li>${arg}</li>`).join('') || '<li>暂无数据</li>'}
            </ul>
          </div>
          <div class="actionable-insights">
            <strong>行动建议:</strong>
            <ul>
              ${data.pyramid_analysis?.actionable_advice?.map(advice => `<li>${advice}</li>`).join('') || '<li>暂无数据</li>'}
            </ul>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to submit scenario decision:', error);
      alert('提交决策失败，请稍后再试');
    }
  }

  renderError() {
    const appContainer = document.getElementById('app') || document.createElement('div');
    appContainer.className = 'error-container';
    
    appContainer.innerHTML = `
      <div class="error-content">
        <h1>历史决策重现测试加载失败</h1>
        <p>无法连接到后端API服务器，请确保服务器正在运行。</p>
        <p>如果您是开发者，请检查后端服务是否在 ${this.apiUrl} 上运行。</p>
      </div>
    `;
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-scenario');
    const nextBtn = document.getElementById('next-scenario');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentScenarioIndex <= 0;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentScenarioIndex >= this.scenarios.length - 1;
    }
  }
}

// 导出组件以便在其他地方使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HistoricalScenariosComponent;
} else {
  window.HistoricalScenariosComponent = HistoricalScenariosComponent;
}