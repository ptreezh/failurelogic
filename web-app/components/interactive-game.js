/**
 * 互动推理游戏组件
 */
class InteractiveGameComponent {
  constructor(apiUrl = 'http://localhost:8000') {
    this.apiUrl = apiUrl;
    this.games = [];
    this.currentGameIndex = 0;
    this.gameState = {
      currentStep: 0,
      decisions: [],
      score: 0
    };
  }

  async initialize() {
    try {
      const response = await fetch(`${this.apiUrl}/api/game/scenarios`);
      const data = await response.json();
      this.games = data.scenarios;
      this.render();
    } catch (error) {
      console.error('Failed to load game scenarios:', error);
      this.renderError();
    }
  }

  render() {
    const appContainer = document.getElementById('app') || document.createElement('div');
    appContainer.className = 'interactive-game-container';
    
    appContainer.innerHTML = `
      <div class="game-header">
        <h1>互动推理游戏</h1>
        <p>通过互动游戏体验和暴露思维局限</p>
      </div>
      
      <main class="game-main">
        <div class="game-intro">
          <h2>游戏说明</h2>
          <p>在这个互动推理游戏中，您将面临一系列决策点。每个决策都会影响后续情境和最终结果。游戏旨在揭示您在推理过程中的潜在认知偏差。</p>
          <p>请注意：游戏中的许多情况反映了现实生活中的复杂决策，没有绝对正确的答案，但有不同的思维模式会影响结果。</p>
        </div>
        
        <div class="game-scenarios">
          <h2>推理游戏场景</h2>
          
          ${this.renderGame(this.games[this.currentGameIndex])}
          
          <div class="navigation-controls">
            <button id="prev-game" ${this.currentGameIndex <= 0 ? 'disabled' : ''}>上一个游戏</button>
            <button id="next-game" ${this.currentGameIndex >= this.games.length - 1 ? 'disabled' : ''}>下一个游戏</button>
          </div>
        </div>
      </main>
    `;

    this.attachEventListeners();
  }

  renderGame(game) {
    if (!game) return '<p>正在加载游戏场景...</p>';

    const currentStep = this.gameState.currentStep;
    const stepData = game.steps[currentStep];

    return `
      <div class="game-container">
        <div class="game-info">
          <h3>${game.title}</h3>
          <p class="game-description">${game.description}</p>
          <div class="game-status">
            <span>当前步骤: ${currentStep + 1}/${game.steps.length}</span>
            <span>当前得分: ${this.gameState.score}</span>
          </div>
        </div>
        
        <div class="game-step">
          <h4>步骤 ${currentStep + 1}: ${stepData.step ? stepData.step : ''}</h4>
          <p class="step-situation">${stepData.situation}</p>
          
          <div class="options-selection">
            ${stepData.options.map((option, idx) => `
              <div class="option">
                <input type="radio" name="game-option-${game.scenarioId}" id="opt-${game.scenarioId}-${idx}" value="${idx}">
                <label for="opt-${game.scenarioId}-${idx}">${String.fromCharCode(65 + idx)}. ${option}</label>
              </div>
            `).join('')}
          </div>
          
          <div class="step-controls">
            <button id="confirm-decision-btn" class="btn btn-primary" disabled>确认决策</button>
            <button id="skip-step-btn" class="btn btn-outline">跳过此步</button>
          </div>
          
          <div class="result-feedback" id="result-feedback-${game.scenarioId}" style="display: none;">
            <!-- 决策后果将在这里显示 -->
          </div>
          
          <div class="cognitive-analysis" id="cognitive-analysis-${game.scenarioId}" style="display: none;">
            <!-- 认知偏差分析将在这里显示 -->
          </div>
        </div>
        
        <div class="game-navigation">
          <button id="previous-step" ${this.gameState.currentStep <= 0 ? 'disabled' : ''}>上一步</button>
          <button id="next-step" ${this.gameState.currentStep >= game.steps.length - 1 ? 'disabled' : ''}>下一步</button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // 游戏导航事件
    document.getElementById('prev-game')?.addEventListener('click', () => {
      if (this.currentGameIndex > 0) {
        this.currentGameIndex--;
        this.resetGameState(); // 重置游戏状态
        this.render();
      }
    });

    document.getElementById('next-game')?.addEventListener('click', () => {
      if (this.currentGameIndex < this.games.length - 1) {
        this.currentGameIndex++;
        this.resetGameState(); // 重置游戏状态
        this.render();
      }
    });

    // 步骤导航事件
    document.getElementById('previous-step')?.addEventListener('click', () => {
      if (this.gameState.currentStep > 0) {
        this.gameState.currentStep--;
        this.render();
      }
    });

    document.getElementById('next-step')?.addEventListener('click', () => {
      if (this.gameState.currentStep < this.games[this.currentGameIndex].steps.length - 1) {
        // 需要先选择一个选项
        const selectedOption = document.querySelector(`input[name="game-option-${this.games[this.currentGameIndex].scenarioId}"]:checked`);
        if (!selectedOption) {
          alert('请先选择一个选项');
          return;
        }
        
        this.processDecision(selectedOption.value);
        this.gameState.currentStep++;
        this.render();
      } else {
        // 游戏结束，显示总结
        this.showGameResults();
      }
    });

    // 选项选择事件
    document.querySelectorAll('input[name^="game-option-"]').forEach(input => {
      input.addEventListener('change', () => {
        document.getElementById('confirm-decision-btn')?.removeAttribute('disabled');
      });
    });

    // 确认决策事件
    document.getElementById('confirm-decision-btn')?.addEventListener('click', () => {
      const selectedOption = document.querySelector(`input[name="game-option-${this.games[this.currentGameIndex].scenarioId}"]:checked`);
      if (selectedOption) {
        this.processDecision(selectedOption.value);
      }
    });

    // 跳过步骤事件
    document.getElementById('skip-step-btn')?.addEventListener('click', () => {
      this.skipStep();
    });
  }

  async processDecision(choiceIndex) {
    const currentGame = this.games[this.currentGameIndex];
    const currentStep = this.gameState.currentStep;
    const choice = currentGame.steps[currentStep].options[choiceIndex];

    // 记录决策
    this.gameState.decisions.push({
      step: currentStep,
      choice: choice,
      choiceIndex: choiceIndex,
      timestamp: new Date().toISOString()
    });

    // 模拟决策后果（实际应用中这将来自后端）
    const feedback = this.generateStepFeedback(currentGame.scenarioId, currentStep, choiceIndex);
    
    const feedbackEl = document.getElementById(`result-feedback-${currentGame.scenarioId}`);
    if (feedbackEl) {
      feedbackEl.style.display = 'block';
      feedbackEl.innerHTML = `
        <h4>决策后果</h4>
        <p>您的选择是: <strong>${choice}</strong></p>
        <p>${feedback.outcome}</p>
      `;
    }

    // 进行认知偏差分析
    const analysis = await this.analyzeCognitiveBias(currentGame.scenarioId, choiceIndex, currentStep);
    const analysisEl = document.getElementById(`cognitive-analysis-${currentGame.scenarioId}`);
    if (analysisEl) {
      analysisEl.style.display = 'block';
      analysisEl.innerHTML = `
        <h4>认知偏差分析</h4>
        <div class="bias-analysis-content">
          ${analysis.pyramidAnalysis ? this.renderPyramidAnalysis(analysis.pyramidAnalysis) : ''}
          <div class="recommendations">
            <h5>改进建议</h5>
            <ul>
              ${analysis.recommendations?.map(rec => `<li>${rec}</li>`).join('') || '<li>持续关注自己的思维模式，多角度审视决策</li>'}
            </ul>
          </div>
        </div>
      `;
    }

    // 更新得分
    this.gameState.score += feedback.scoreChange || 0;
  }

  generateStepFeedback(gameId, step, choiceIndex) {
    // 根据游戏ID和步骤生成适当的反馈
    const feedbackMap = {
      'game-001': {
        0: [
          { outcome: '您选择了立即投放市场。虽然抢占了先机，但产品初期的问题可能导致客户流失和口碑受损。', scoreChange: -5 },
          { outcome: '您选择继续测试。这可能会错过市场机会，但有助于提高产品质量和客户满意度。', scoreChange: 2 },
          { outcome: '您选择收购竞争对手。这能减少竞争但需要大量资本投入，且可能面临监管审查。', scoreChange: -2 },
          { outcome: '您选择合作开发。这是一种保守策略，可分担风险但也可能限制利润。', scoreChange: 1 }
        ],
        1: [
          { outcome: '您选择召回产品。这会带来短期成本，但能保护品牌声誉和客户信任。', scoreChange: 5 },
          { outcome: '您选择私下处理问题。短期内节省成本，但可能面临更大的法律和声誉风险。', scoreChange: -10 },
          { outcome: '您承认问题并承诺改进。诚实的态度有助于维护客户信任，但需要付出额外努力。', scoreChange: 3 },
          { outcome: '您选择忽略问题。可能导致严重后果，对品牌造成致命打击。', scoreChange: -20 }
        ]
      }
    };

    const gameFeedback = feedbackMap[gameId];
    if (gameFeedback && gameFeedback[step]) {
      return gameFeedback[step][choiceIndex] || { outcome: '这是一个有趣的决策选择。', scoreChange: 0 };
    } else {
      return { outcome: '这是一个有趣的决策选择。', scoreChange: 0 };
    }
  }

  async analyzeCognitiveBias(gameId, choiceIndex, step) {
    try {
      const response = await fetch(`${this.apiUrl}/api/cognitive-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-session-' + Date.now(),
          gameId: gameId,
          step: step,
          choiceIndex: choiceIndex,
          decisions: this.gameState.decisions
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to analyze cognitive bias:', error);
      // 返回默认分析
      return {
        biasDetected: '可能存在的认知偏差',
        pyramidAnalysis: {
          coreConclusion: '在复杂情况下，我们的决策可能受到多种认知偏差的影响',
          supportingArguments: [
            '确认偏误：倾向于寻找支持既有观点的信息',
            '锚定效应：过度依赖最先获得的信息',
            '损失厌恶：对损失的敏感度超过对收益的敏感度'
          ],
          examples: [
            '在快速变化的市场中过度依赖过往经验',
            '面对复杂信息时采取简化策略而导致的误判'
          ],
          actionableAdvice: [
            '主动寻求与自己观点相悖的信息',
            '在做决策前暂停思考，考虑其他可能性',
            '定期反思自己的决策过程'
          ]
        },
        recommendations: [
          '多角度审视问题',
          '定期反思决策过程',
          '寻求他人反馈'
        ]
      };
    }
  }

  renderPyramidAnalysis(pyramidData) {
    return `
      <div class="pyramid-structure">
        <div class="core-conclusion">
          <h5>核心结论</h5>
          <p>${pyramidData.coreConclusion}</p>
        </div>
        <div class="supporting-arguments">
          <h5>支撑论据</h5>
          <ul>
            ${pyramidData.supportingArguments?.map(arg => `<li>${arg}</li>`).join('') || ''}
          </ul>
        </div>
        <div class="examples">
          <h5>实例</h5>
          <ul>
            ${pyramidData.examples?.map(ex => `<li>${ex}</li>`).join('') || ''}
          </ul>
        </div>
        <div class="actionable-advice">
          <h5>行动建议</h5>
          <ul>
            ${pyramidData.actionableAdvice?.map(advice => `<li>${advice}</li>`).join('') || ''}
          </ul>
        </div>
      </div>
    `;
  }

  skipStep() {
    const currentGame = this.games[this.currentGameIndex];
    this.gameState.currentStep++;
    
    if (this.gameState.currentStep >= currentGame.steps.length) {
      this.showGameResults();
    } else {
      this.render();
    }
  }

  showGameResults() {
    const currentGame = this.games[this.currentGameIndex];
    
    const resultsContainer = document.querySelector('.game-step');
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="game-results">
          <h3>游戏完成！</h3>
          <p>您已完成 "${currentGame.title}" 游戏。</p>
          <p>总得分: <strong>${this.gameState.score}</strong></p>
          <p>总共做了 <strong>${this.gameState.decisions.length}</strong> 个决策。</p>
          
          <div class="final-analysis">
            <h4>整体认知偏差分析</h4>
            <p>通过这个游戏，我们分析了您的决策模式。结果显示您可能在某些情况下受到以下认知偏差的影响：</p>
            <ul>
              <li><strong>确认偏误:</strong> 倾向于寻找支持既有观点的信息</li>
              <li><strong>锚定效应:</strong> 过度依赖最先获得的信息</li>
              <li><strong>可得性启发:</strong> 基于容易想起的信息做判断</li>
            </ul>
            <p>了解这些偏差有助于您在未来的决策中更加理性地思考。</p>
          </div>
          
          <div class="next-steps">
            <h4>下一步建议</h4>
            <ul>
              <li>回顾您的决策过程，思考是否有更好的选择</li>
              <li>尝试其他游戏场景，全面了解自己的思维模式</li>
              <li>学习相关认知偏差知识，提升决策质量</li>
            </ul>
          </div>
        </div>
      `;
    }
  }

  resetGameState() {
    this.gameState = {
      currentStep: 0,
      decisions: [],
      score: 0
    };
  }

  renderError() {
    const appContainer = document.getElementById('app') || document.createElement('div');
    appContainer.className = 'error-container';
    
    appContainer.innerHTML = `
      <div class="error-content">
        <h1>互动推理游戏加载失败</h1>
        <p>无法连接到后端API服务器，请确保服务器正在运行。</p>
        <p>如果您是开发者，请检查后端服务是否在 ${this.apiUrl} 上运行。</p>
      </div>
    `;
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-game');
    const nextBtn = document.getElementById('next-game');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentGameIndex <= 0;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentGameIndex >= this.games.length - 1;
    }
    
    const prevStepBtn = document.getElementById('previous-step');
    const nextStepBtn = document.getElementById('next-step');
    
    if (prevStepBtn) {
      prevStepBtn.disabled = this.gameState.currentStep <= 0;
    }
    
    if (nextStepBtn) {
      const currentGame = this.games[this.currentGameIndex];
      nextStepBtn.disabled = this.gameState.currentStep >= (currentGame?.steps?.length || 0) - 1;
    }
  }
}

// 导出组件以便在其他地方使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InteractiveGameComponent;
} else {
  window.InteractiveGameComponent = InteractiveGameComponent;
}