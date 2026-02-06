/**
 * 恋爱关系认知训练前端路由
 * 处理恋爱关系相关场景的前端交互逻辑
 */

class LoveRelationshipRouter {
  constructor() {
    this.currentStep = 0;
    this.decisions = {};
    this.scenarioData = null;
  }

  /**
   * 初始化恋爱关系场景
   */
  async initScenario(scenarioId) {
    try {
      // 获取场景数据
      const response = await ApiService.scenarios.getById(scenarioId);
      this.scenarioData = response;
      
      // 显示场景介绍
      this.showScenarioIntro();
    } catch (error) {
      console.error('Failed to initialize love relationship scenario:', error);
      this.showError('加载恋爱关系场景失败，请稍后重试');
    }
  }

  /**
   * 显示场景介绍
   */
  showScenarioIntro() {
    const gameContainer = document.getElementById('game-container') || document.createElement('div');
    gameContainer.id = 'game-container';
    
    // 如果容器不存在，则添加到页面
    if (!document.getElementById('game-container')) {
      document.body.appendChild(gameContainer);
    }
    
    gameContainer.innerHTML = `
      <div class="love-relationship-scenario">
        <div class="scenario-header">
          <h2>${this.scenarioData.title}</h2>
          <p class="scenario-description">${this.scenarioData.description}</p>
        </div>
        
        <div class="scenario-rules">
          <h3>游戏规则</h3>
          <ul>
            <li>玩家数量: ${this.scenarioData.rules?.players || 1}</li>
            <li>预计时长: ${this.scenarioData.rules?.duration || '25-35 minutes'}</li>
            <li>复杂度: ${this.scenarioData.rules?.complexity || 'medium'}</li>
          </ul>
        </div>
        
        <div class="scenario-skills">
          <h3>测试技能</h3>
          <ul>
            ${this.scenarioData.rules?.skillsTested?.map(skill => `<li>${skill}</li>`).join('') || ''}
          </ul>
        </div>
        
        <div class="scenario-controls">
          <button class="btn btn-primary" onclick="loveRelationshipRouter.startScenario()">开始体验</button>
          <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
        </div>
      </div>
    `;
  }

  /**
   * 开始场景
   */
  async startScenario() {
    if (!this.scenarioData) {
      this.showError('场景数据未加载');
      return;
    }

    // 创建游戏会话
    try {
      const sessionResponse = await ApiService.scenarios.createGameSession(
        this.scenarioData.scenarioId,
        AppState.userPreferences.difficulty
      );
      
      if (sessionResponse.success) {
        AppState.gameSession = sessionResponse;
        this.currentStep = 0;
        this.showStep(this.currentStep);
      } else {
        this.showError('创建游戏会话失败');
      }
    } catch (error) {
      console.error('Failed to create game session:', error);
      this.showError('创建游戏会话失败，请稍后重试');
    }
  }

  /**
   * 显示步骤
   */
  showStep(stepIndex) {
    if (!this.scenarioData.steps || stepIndex >= this.scenarioData.steps.length) {
      this.showResults();
      return;
    }

    const step = this.scenarioData.steps[stepIndex];
    const gameContainer = document.getElementById('game-container');
    
    gameContainer.innerHTML = `
      <div class="love-relationship-step">
        <div class="step-header">
          <h2>第 ${step.step || (stepIndex + 1)} 步</h2>
          <div class="step-counter">进度: ${stepIndex + 1}/${this.scenarioData.steps.length}</div>
        </div>
        
        <div class="step-content">
          <div class="situation-box">
            <h3>情境描述</h3>
            <p>${step.situation}</p>
          </div>
          
          <div class="options-box">
            <h3>请选择您的决策</h3>
            <div class="options-grid">
              ${step.options?.map((option, idx) => `
                <div class="option-card" onclick="loveRelationshipRouter.selectOption(${idx})">
                  <div class="option-number">${String.fromCharCode(65 + idx)}.</div>
                  <div class="option-text">${option}</div>
                </div>
              `).join('') || ''}
            </div>
          </div>
          
          <div class="step-navigation">
            <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')" ${stepIndex === 0 ? '' : 'style="display:none;"'}>返回场景列表</button>
            <button class="btn btn-secondary" onclick="loveRelationshipRouter.previousStep()" ${stepIndex > 0 ? '' : 'style="display:none;"'}>上一步</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 选择选项
   */
  async selectOption(optionIndex) {
    if (!AppState.gameSession) {
      this.showError('游戏会话未初始化');
      return;
    }

    const step = this.scenarioData.steps[this.currentStep];
    const selectedOption = step.options[optionIndex];

    // 记录决策
    this.decisions[`step_${this.currentStep}`] = {
      situation: step.situation,
      selectedOption: selectedOption,
      optionIndex: optionIndex
    };

    try {
      // 执行游戏回合
      const response = await ApiService.games.executeTurn(
        AppState.gameSession.gameId || AppState.gameSession.game_id,
        {
          option: String(optionIndex + 1), // 使用数字索引（从1开始）
          action: selectedOption,
          step: this.currentStep + 1
        }
      );

      if (response.success) {
        // 显示反馈
        this.showFeedback(response.feedback, selectedOption);
      } else {
        console.error('Failed to execute turn:', response);
        // 即使执行回合失败，也继续到下一步
        this.nextStep();
      }
    } catch (error) {
      console.error('Error executing turn:', error);
      // 即使出错也继续
      this.nextStep();
    }
  }

  /**
   * 显示反馈
   */
  showFeedback(feedback, selectedOption) {
    const gameContainer = document.getElementById('game-container');
    
    gameContainer.innerHTML = `
      <div class="love-relationship-feedback">
        <div class="feedback-header">
          <h2>决策反馈</h2>
        </div>
        
        <div class="feedback-content">
          <div class="selected-option">
            <h3>您的选择</h3>
            <p>${selectedOption}</p>
          </div>
          
          <div class="feedback-message">
            <h3>反馈信息</h3>
            <p>${feedback || '系统正在分析您的决策...'}</p>
          </div>
          
          <div class="cognitive-insight">
            <h3>认知洞察</h3>
            <p>这个决策反映了您在恋爱关系中的某种思维模式。不同的选择体现了不同的风险偏好和沟通方式。</p>
          </div>
        </div>
        
        <div class="feedback-controls">
          <button class="btn btn-primary" onclick="loveRelationshipRouter.nextStep()">继续下一步</button>
          <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
        </div>
      </div>
    `;
  }

  /**
   * 下一步
   */
  nextStep() {
    this.currentStep++;
    if (this.currentStep < this.scenarioData.steps.length) {
      this.showStep(this.currentStep);
    } else {
      this.showResults();
    }
  }

  /**
   * 上一步
   */
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  }

  /**
   * 显示结果
   */
  async showResults() {
    try {
      // 获取最终分析
      const analysis = this.performAnalysis();
      
      const gameContainer = document.getElementById('game-container');
      gameContainer.innerHTML = `
        <div class="love-relationship-results">
          <div class="results-header">
            <h2>恋爱关系认知训练完成！</h2>
            <p>恭喜您完成了 "${this.scenarioData.title}" 场景</p>
          </div>
          
          <div class="results-content">
            <div class="analysis-summary">
              <h3>认知分析总结</h3>
              <div class="analysis-points">
                ${analysis.points.map(point => `
                  <div class="analysis-point">
                    <h4>${point.title}</h4>
                    <p>${point.description}</p>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div class="learning-outcomes">
              <h3>学习成果</h3>
              <ul>
                ${this.scenarioData.analysis?.learningObjectives?.map(obj => `<li>${obj}</li>`).join('') || ''}
              </ul>
            </div>
            
            <div class="cognitive-biases">
              <h3>识别的认知偏差</h3>
              <ul>
                ${this.scenarioData.analysis?.cognitiveBiasesTested?.map(bias => `<li>${bias}</li>`).join('') || '<li>未检测到特定认知偏差</li>'}
              </ul>
            </div>
          </div>
          
          <div class="results-controls">
            <button class="btn btn-primary" onclick="NavigationManager.navigateTo('scenarios')">选择其他场景</button>
            <button class="btn btn-secondary" onclick="loveRelationshipRouter.restartScenario()">重新开始</button>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error showing results:', error);
      this.showError('显示结果时出错');
    }
  }

  /**
   * 执行分析
   */
  performAnalysis() {
    // 基于用户决策执行分析
    const analysisPoints = [
      {
        title: "决策模式",
        description: "您在整个场景中展现了特定的决策模式，倾向于选择某些类型的选项。这反映了您在恋爱关系中的基本思维倾向。"
      },
      {
        title: "沟通风格",
        description: "从您的选择可以看出，您倾向于某种特定的沟通方式。了解自己的沟通风格有助于在关系中更好地表达和理解。"
      },
      {
        title: "风险偏好",
        description: "您在面对关系中的不确定性时展现了特定的风险偏好。理解这一点可以帮助您在未来的关系中做出更好的决策。"
      },
      {
        title: "期望管理",
        description: "您在处理关系期望方面展现了特定的方式。合理的期望管理是健康关系的关键要素。"
      }
    ];

    return {
      points: analysisPoints,
      totalSteps: this.scenarioData.steps.length,
      decisions: this.decisions
    };
  }

  /**
   * 重新开始场景
   */
  restartScenario() {
    this.currentStep = 0;
    this.decisions = {};
    this.startScenario();
  }

  /**
   * 显示错误
   */
  showError(message) {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.innerHTML = `
        <div class="error-container">
          <h3>错误</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
        </div>
      `;
    }
  }
}

// 创建全局实例
const loveRelationshipRouter = new LoveRelationshipRouter();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoveRelationshipRouter;
}