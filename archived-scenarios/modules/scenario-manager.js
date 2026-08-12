// 场景管理模块 - 实现场景的完整体验功能
const ScenarioManager = {
  // 当前激活的场景
  currentScenario: null,
  
  // 场景数据
  scenarios: [
    {
      id: "coffee-shop",
      name: "咖啡店经营",
      description: "体验线性思维在商业决策中的局限性",
      difficulty: "beginner",
      fullDescription: "在这个场景中，您将管理一家咖啡店，体验线性思维在复杂商业环境中的局限性。线性思维是指我们倾向于认为原因和结果之间存在直接的、成比例的关系。但在复杂的系统中，这种思维方式往往会导致错误的决策。",
      steps: [
        {
          id: 1,
          title: "初始状态",
          content: "您的咖啡店目前有1000元启动资金，客户满意度50%，声誉50%。",
          decisions: [
            { id: "ad-advertising", text: "投入广告", effect: { satisfaction: 10, resources: -200 } },
            { id: "quality-improvement", text: "提升品质", effect: { satisfaction: 15, resources: -300 } },
            { id: "price-cut", text: "降价促销", effect: { satisfaction: 5, resources: -100 } }
          ]
        },
        {
          id: 2,
          title: "第一轮结果",
          content: "您做出了选择，现在看看结果如何...",
          decisions: [
            { id: "hire-staff", text: "雇佣员工", effect: { satisfaction: 10, resources: -400 } },
            { id: "expand-space", text: "扩大店面", effect: { satisfaction: 15, resources: -600 } },
            { id: "buy-equipment", text: "购买设备", effect: { satisfaction: 5, resources: -250 } }
          ]
        },
        {
          id: 3,
          title: "最终结果",
          content: "恭喜您完成了咖啡店经营挑战！您已经体验了线性思维在复杂商业环境中的局限性。",
          decisions: [
            { id: "restart", text: "重新开始", effect: {} },
            { id: "next-scenario", text: "下一个场景", effect: {} }
          ]
        }
      ],
      initialState: {
        satisfaction: 50,
        resources: 1000,
        reputation: 50,
        turn: 1
      }
    },
    {
      id: "relationship",
      name: "恋爱关系",
      description: "理解时间延迟对决策的影响",
      difficulty: "intermediate",
      fullDescription: "在恋爱关系中体验时间延迟对决策的影响。每个决策的效果会在几回合后显现。时间延迟偏差是指我们倾向于期望立即看到行动的结果，而忽视了在复杂系统中结果往往需要时间才能显现。",
      steps: [
        {
          id: 1,
          title: "关系初期",
          content: "您和伴侣刚刚开始交往，信任度50%，满意度50%。",
          decisions: [
            { id: "spend-time", text: "花更多时间相处", effect: { satisfaction: 10, trust: 5 } },
            { id: "give-gift", text: "送礼物", effect: { satisfaction: 15, resources: -50 } },
            { id: "be-independent", text: "保持独立空间", effect: { trust: 10, satisfaction: -5 } }
          ]
        },
        {
          id: 2,
          title: "关系发展",
          content: "关系进入稳定期，之前的决定开始显现效果...",
          decisions: [
            { id: "meet-family", text: "介绍给家人", effect: { satisfaction: 10, trust: 10 } },
            { id: "travel-together", text: "一起旅行", effect: { satisfaction: 15, trust: 15, resources: -200 } },
            { id: "discuss-future", text: "讨论未来", effect: { trust: 20, satisfaction: 5 } }
          ]
        },
        {
          id: 3,
          title: "关系成熟",
          content: "恭喜您完成了恋爱关系挑战！您已经体验了时间延迟对决策的影响。",
          decisions: [
            { id: "restart", text: "重新开始", effect: {} },
            { id: "next-scenario", text: "下一个场景", effect: {} }
          ]
        }
      ],
      initialState: {
        satisfaction: 50,
        trust: 50,
        resources: 500,
        turn: 1
      }
    },
    {
      id: "investment",
      name: "投资决策",
      description: "认识确认偏误如何影响风险判断",
      difficulty: "advanced",
      fullDescription: "在投资决策中体验确认偏误如何影响我们的风险判断。确认偏误是指我们倾向于寻找、解释和记住那些证实我们已有信念或假设的信息，而忽视与之相矛盾的信息。",
      steps: [
        {
          id: 1,
          title: "初始投资",
          content: "您有10000元可用于投资，知识水平0。",
          decisions: [
            { id: "stocks", text: "投资股票", effect: { portfolio: 2000, knowledge: 10 } },
            { id: "bonds", text: "投资债券", effect: { portfolio: 500, knowledge: 5 } },
            { id: "education", text: "学习投资知识", effect: { knowledge: 20, resources: -1000 } }
          ]
        },
        {
          id: 2,
          title: "市场波动",
          content: "市场出现波动，需要根据您的知识做出明智决策...",
          decisions: [
            { id: "diversify", text: "分散投资", effect: { portfolio: 1000, risk: -10 } },
            { id: "hold", text: "继续持有", effect: { portfolio: 0, risk: 5 } },
            { id: "sell", text: "卖出投资", effect: { portfolio: -500, risk: -20 } }
          ]
        },
        {
          id: 3,
          title: "长期结果",
          content: "恭喜您完成了投资决策挑战！您已经体验了确认偏误对风险判断的影响。",
          decisions: [
            { id: "restart", text: "重新开始", effect: {} },
            { id: "next-scenario", text: "下一个场景", effect: {} }
          ]
        }
      ],
      initialState: {
        portfolio: 10000,
        knowledge: 0,
        risk: 10,
        turn: 1
      }
    }
  ],

  // 启动场景
  startScenario(scenarioId) {
    const scenario = this.scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      UIManager.showToast('场景未找到', 'error');
      return;
    }

    this.currentScenario = {...scenario};
    this.currentScenario.state = {...scenario.initialState};
    this.currentScenario.currentStep = 0;
    
    this.renderScenario();
  },

  // 渲染场景界面
  renderScenario() {
    const container = document.createElement('div');
    container.className = 'scenario-container';
    
    // 场景头部信息
    container.innerHTML = `
      <div class="scenario-header">
        <h2>${this.currentScenario.name}</h2>
        <p>${this.currentScenario.fullDescription}</p>
      </div>
      
      <div class="scenario-state">
        <div class="state-item">
          <span>满意度: <strong>${this.currentScenario.state.satisfaction || 0}</strong></span>
        </div>
        <div class="state-item">
          <span>资源: <strong>${this.currentScenario.state.resources || 0}</strong></span>
        </div>
        <div class="state-item">
          <span>信任度: <strong>${this.currentScenario.state.trust || 0}</strong></span>
        </div>
        <div class="state-item">
          <span>回合: <strong>${this.currentScenario.state.turn || 1}</strong></span>
        </div>
      </div>
      
      <div class="scenario-content">
        <!-- 步骤内容将动态插入 -->
      </div>
    `;
    
    // 渲染当前步骤
    this.renderCurrentStep(container.querySelector('.scenario-content'));
    
    // 替换主内容区域
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    mainContent.appendChild(container);
    
    // 添加返回按钮
    const backButton = document.createElement('button');
    backButton.className = 'btn btn-outline';
    backButton.textContent = '返回场景列表';
    backButton.style.marginTop = '1rem';
    backButton.addEventListener('click', () => {
      Router.navigateTo('scenarios');
    });
    
    mainContent.appendChild(backButton);
  },

  // 渲染当前步骤
  renderCurrentStep(contentContainer) {
    const step = this.currentScenario.steps[this.currentScenario.currentStep];
    if (!step) {
      UIManager.showToast('场景结束', 'success');
      return;
    }
    
    contentContainer.innerHTML = `
      <div class="step-card">
        <h3>${step.title}</h3>
        <p>${step.content}</p>
        
        <div class="decisions-container">
          <h4>请选择您的行动:</h4>
          <div class="decisions-grid">
            ${step.decisions.map(decision => `
              <button class="decision-btn btn" data-decision="${decision.id}">
                ${decision.text}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    // 为决策按钮添加事件
    contentContainer.querySelectorAll('.decision-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const decisionId = e.target.getAttribute('data-decision');
        this.executeDecision(decisionId);
      });
    });
  },

  // 执行决策
  executeDecision(decisionId) {
    const step = this.currentScenario.steps[this.currentScenario.currentStep];
    const decision = step.decisions.find(d => d.id === decisionId);
    
    if (!decision) return;
    
    // 应用决策效果
    Object.keys(decision.effect).forEach(key => {
      if (this.currentScenario.state.hasOwnProperty(key)) {
        this.currentScenario.state[key] += decision.effect[key];
        // 确保数值不会变成负数（除非特别指定）
        if (this.currentScenario.state[key] < 0 && key !== 'resources' && key !== 'portfolio') {
          this.currentScenario.state[key] = 0;
        }
      } else {
        this.currentScenario.state[key] = decision.effect[key];
      }
    });
    
    // 增加回合数
    this.currentScenario.state.turn += 1;
    
    // 移动到下一步
    this.currentScenario.currentStep += 1;
    
    // 检查是否完成场景
    if (this.currentScenario.currentStep >= this.currentScenario.steps.length) {
      this.completeScenario();
    } else {
      // 重新渲染当前步骤
      const contentContainer = document.querySelector('.scenario-content');
      this.renderCurrentStep(contentContainer);
      
      // 更新状态显示
      this.updateStateDisplay();
    }
  },

  // 更新状态显示
  updateStateDisplay() {
    const stateElements = document.querySelectorAll('.state-item span strong');
    const state = this.currentScenario.state;
    
    // 更新满意度
    const satisfactionEl = Array.from(stateElements).find(el => 
      el.parentElement.textContent.includes('满意度')
    );
    if (satisfactionEl) satisfactionEl.textContent = state.satisfaction || 0;
    
    // 更新资源
    const resourcesEl = Array.from(stateElements).find(el => 
      el.parentElement.textContent.includes('资源')
    );
    if (resourcesEl) resourcesEl.textContent = state.resources || 0;
    
    // 更新信任度
    const trustEl = Array.from(stateElements).find(el => 
      el.parentElement.textContent.includes('信任度')
    );
    if (trustEl) trustEl.textContent = state.trust || 0;
    
    // 更新回合
    const turnEl = Array.from(stateElements).find(el => 
      el.parentElement.textContent.includes('回合')
    );
    if (turnEl) turnEl.textContent = state.turn || 1;
  },

  // 完成场景
  completeScenario() {
    UIManager.showToast('恭喜！您已完成此场景', 'success');
    
    // 显示完成界面
    const contentContainer = document.querySelector('.scenario-content');
    contentContainer.innerHTML = `
      <div class="completion-card">
        <h3>场景完成！</h3>
        <p>您已成功完成 "${this.currentScenario.name}" 场景。</p>
        <p>在这一过程中，您体验了${this.extractLearningPoint(this.currentScenario.id)}。</p>
        <div class="completion-actions">
          <button id="complete-restart" class="btn">重新开始</button>
          <button id="complete-next" class="btn btn-outline">下一个场景</button>
        </div>
      </div>
    `;
    
    // 添加完成后的操作事件
    document.getElementById('complete-restart').addEventListener('click', () => {
      this.restartScenario();
    });
    
    document.getElementById('complete-next').addEventListener('click', () => {
      Router.navigateTo('scenarios');
    });
  },

  // 重新开始场景
  restartScenario() {
    this.currentScenario.state = {...this.currentScenario.initialState};
    this.currentScenario.currentStep = 0;
    this.renderScenario();
  },

  // 提取学习要点
  extractLearningPoint(scenarioId) {
    switch(scenarioId) {
      case 'coffee-shop':
        return '线性思维在复杂商业环境中的局限性';
      case 'relationship':
        return '时间延迟对决策的影响';
      case 'investment':
        return '确认偏误如何影响风险判断';
      default:
        return '相关的认知陷阱和思维局限';
    }
  }
};