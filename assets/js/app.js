/**
 * Enhanced Dynamic Worlds - Main Application JavaScript
 * 认知陷阱教育平台前端应用 - 添加难度选择功能
 */

// Application Configuration
const APP_CONFIG = {
  // 智能API端点选择
  apiBaseUrl: (() => {
    const hostname = window.location.hostname;

    // 本地开发环境
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }

    // GitHub Pages环境 - 只使用已验证工作的API地址
    const apiSources = [
      'https://psychic-meme-rvq4v7pqwx3xxrr-8000.app.github.dev',  // Primary: New working Codespaces (已验证工作)
      'https://turbo-rotary-phone-pq4jq7pvr7f6jxx-8000.app.github.dev',  // Backup: Old Codespaces
      'https://failurelogic-api.vercel.app',      // Vercel部署 (备用)
      'https://failurelogic.vercel.app'          // 备用Vercel
    ];

    // 返回新工作的Codespaces作为首选 (已验证正常工作)
    return apiSources[0];
  })(),

  version: '2.0.0',
  debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  animationDuration: 300,
  toastDuration: 5000,
  syncInterval: 30000, // 30 seconds

  // API健康检查配置
  healthCheck: {
    enabled: true,
    interval: 60000, // 1分钟检查一次
    timeout: 5000,
    retryAttempts: 3
  }
};

// Application State
const AppState = {
  currentUser: null,
  currentScenario: null,
  currentPage: 'home',
  isLoading: false,
  isOnline: navigator.onLine,
  gameSession: null,
  gameModal: null,
  currentGame: null,
  userPreferences: {
    difficulty: 'beginner',  // Default to beginner
    challengeType: 'base'    // Default to base challenges
  }
};

// API Service with difficulty support
const ApiService = {
  configManager: new APIConfigManager({
    timeout: 10000,
    maxRetries: 3
  }),

  // Updated endpoints to support difficulty
  scenarios: {
    getAll: () => ApiService.configManager.request('/scenarios/'),
    getById: (id) => ApiService.configManager.request(`/scenarios/${id}`),
    create: (data) => ApiService.configManager.request('/scenarios/', { method: 'POST', body: JSON.stringify(data) }),
    createGameSession: (scenarioId, difficulty = 'beginner') => {
      // Updated to include difficulty parameter
      return ApiService.configManager.request(`/scenarios/create_game_session?scenario_id=${scenarioId}&difficulty=${difficulty}`, {
        method: 'POST'
      });
    },
  },

  games: {
    executeTurn: (gameId, decisions) =>
      ApiService.configManager.request(`/scenarios/${gameId}/turn`, {
        method: 'POST',
        body: JSON.stringify({ user_id: 1, decisions })
      }),
  },

  async healthCheck() {
    try {
      const response = await ApiService.configManager.request('/');
      return { status: 'healthy', message: 'API is responsive', data: response };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }
};

// Navigation Manager
class NavigationManager {
  static routes = {
    '/': 'home',
    '/scenarios': 'scenarios',
    '/dashboard': 'dashboard',
    '/profile': 'profile',
    '/settings': 'settings',
    '/about': 'about',
    '/contact': 'contact'
  };

  static navigateTo(page) {
    AppState.currentPage = page;
    window.history.pushState({ page }, '', `/${page}`);
    this.renderPage(page);
  }

  static async renderPage(page) {
    // Use static page show/hide approach instead of dynamic rendering
    this.showStaticPage(page);

    // Load dynamic content for specific pages
    if (page === 'scenarios') {
      await this.loadScenariosPage();
    }

    this.bindPageEvents(page);
  }

  static showStaticPage(page) {
    // Hide all pages
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(p => p.classList.remove('active'));

    // Show target page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // Update nav button active states
    const allNavButtons = document.querySelectorAll('.nav-item');
    allNavButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.page === page) {
        btn.classList.add('active');
      }
    });
  }

  static async getPageTemplate(page) {
    switch (page) {
      case 'home':
        return this.getHomePage();
      case 'scenarios':
        await this.loadScenariosPage();
        return this.getScenariosPage();
      case 'dashboard':
        return this.getDashboardPage();
      case 'profile':
        return this.getProfilePage();
      case 'settings':
        return this.getSettingsPage();
      case 'about':
        return this.getAboutPage();
      case 'contact':
        return this.getContactPage();
      default:
        return this.getErrorPage();
    }
  }

  static getMockScenarios() {
    return [
      {
        id: "coffee-shop-linear-thinking",
        name: "咖啡店线性思维",
        description: "线性思维陷阱场景",
        fullDescription: "在这个场景中，您将管理一家咖啡店，体验线性思维在复杂商业环境中的局限性。线性思维是指我们倾向于认为原因和结果之间存在直接的、成比例的关系。但在复杂的系统中，这种思维方式往往会导致错误的决策。",
        difficulty: "beginner",
        estimatedDuration: 15,
        targetBiases: ["linear_thinking"],
        cognitiveBias: "线性思维",
        duration: "15-20分钟",
        category: "商业决策",
        thumbnail: "/assets/images/coffee-shop.jpg",
        initialState: {
          satisfaction: 50,
          resources: 1000,
          reputation: 50,
          turn: 1
        },
        advancedChallenges: [
          {
            title: "供应链指数增长",
            description: "处理供应商网络扩展中的指数增长效应",
            difficulty: "intermediate",
            cognitiveBiases: ["exponential_misconception", "linear_thinking"]
          },
          {
            title: "复杂系统管理",
            description: "管理多变量商业生态系统的复杂性",
            difficulty: "advanced",
            cognitiveBiases: ["complex_system_misunderstanding", "cascading_failure_blindness"]
          }
        ]
      },
      {
        id: "relationship-time-delay",
        name: "恋爱关系时间延迟",
        description: "时间延迟偏差场景",
        fullDescription: "在恋爱关系中体验时间延迟对决策的影响。每个决策的效果会在几回合后显现。时间延迟偏差是指我们倾向于期望立即看到行动的结果，而忽视了在复杂系统中结果往往需要时间才能显现。",
        difficulty: "intermediate",
        estimatedDuration: 20,
        targetBiases: ["time_delay_bias"],
        cognitiveBias: "时间延迟",
        duration: "20-25分钟",
        category: "人际关系",
        thumbnail: "/assets/images/relationship.jpg",
        initialState: {
          satisfaction: 50,
          trust: 50,
          turn: 1
        },
        advancedChallenges: [
          {
            title: "长期关系复利效应",
            description: "理解关系投资的长期复利增长模式",
            difficulty: "intermediate",
            cognitiveBiases: ["compound_interest_misunderstanding", "short_term_bias"]
          },
          {
            title: "复杂关系网络",
            description: "处理家庭和社交网络的复杂动态",
            difficulty: "advanced",
            cognitiveBiases: ["complex_system_misunderstanding", "network_effect_blindness"]
          }
        ]
      },
      {
        id: "investment-confirmation-bias",
        name: "投资确认偏误",
        description: "确认偏误场景",
        fullDescription: "在投资决策中体验确认偏误如何影响我们的风险判断。确认偏误是指我们倾向于寻找、解释和记住那些证实我们已有信念或假设的信息，而忽视与之相矛盾的信息。",
        difficulty: "advanced",
        estimatedDuration: 25,
        targetBiases: ["confirmation_bias"],
        cognitiveBias: "确认偏误",
        duration: "25-30分钟",
        category: "金融决策",
        thumbnail: "/assets/images/investment.jpg",
        initialState: {
          portfolio: 10000,
          knowledge: 0,
          turn: 1
        },
        advancedChallenges: [
          {
            title: "通胀调整投资",
            description: "考虑通胀影响的长期投资复利效应",
            difficulty: "intermediate",
            cognitiveBiases: ["inflation_blindness", "compound_interest_misunderstanding"]
          },
          {
            title: "复杂金融系统",
            description: "处理多变量金融市场系统风险",
            difficulty: "advanced",
            cognitiveBiases: ["financial_system_complexity_blindness", "correlation_misunderstanding"]
          }
        ]
      }
    ];
  }

  static async loadScenariosPage() {
    // Show loading state
    const loadingEl = document.getElementById('scenarios-loading');
    if (loadingEl) {
      loadingEl.style.display = 'block';
    }

    // Try to load from API first with timeout, fallback to mock data
    try {
      const response = await Promise.race([
        ApiService.scenarios.getAll(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API timeout after 3 seconds')), 3000)
        )
      ]);

      if (response && Array.isArray(response.scenarios)) {
        // Update global state with API data
        AppState.scenarios = response.scenarios;
        console.log('Loaded scenarios from API:', response.scenarios.length);
      } else {
        // Fallback to mock data
        AppState.scenarios = this.getMockScenarios();
        console.log('Using mock scenarios:', AppState.scenarios.length);
      }
    } catch (error) {
      console.warn('Failed to load scenarios from API, attempting local fallback:', error);
      try {
        const localResp = await Promise.race([
          fetch('assets/data/scenarios.json'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Local file timeout after 2 seconds')), 2000)
          )
        ]);

        if (localResp.ok) {
          const data = await localResp.json();
          AppState.scenarios = data.scenarios || this.getMockScenarios();
        } else {
          AppState.scenarios = this.getMockScenarios();
        }
      } catch (fetchError) {
        console.warn('Local fallback failed, using built-in mock scenarios:', fetchError);
        AppState.scenarios = this.getMockScenarios();
      }
    }

    // Always render scenarios, even if API failed
    // Render scenarios into the static HTML scenarios-grid element
    const container = document.getElementById('scenarios-grid');
    if (container && Array.isArray(AppState.scenarios)) {
      console.log('Rendering scenarios into grid:', AppState.scenarios.length);
      this.renderScenarios(AppState.scenarios, container);

      // Hide loading state
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }

      // Update scenarios count display if present
      const scenariosCountEl = document.querySelector('.stat-number[data-target="12"]');
      if (scenariosCountEl) {
        scenariosCountEl.textContent = String(AppState.scenarios.length);
      }
    } else {
      console.error('scenarios-grid element not found or no scenarios to render');
      // Ensure loading is hidden even on error
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }
    }
  }

  static getScenariosPage() {
    const scenarios = AppState.scenarios || this.getMockScenarios();
    
    let scenariosHtml = '';
    scenarios.forEach(scenario => {
      scenariosHtml += this.createScenarioCard(scenario);
    });

    return `
      <section class="page-section scenarios-page">
        <header class="page-header">
          <h1>认知陷阱挑战</h1>
          <p>选择一个场景开始挑战，从基础到高级，逐步提升认知能力</p>
        </header>
        
        <div class="difficulty-selector">
          <label for="difficulty-level">选择难度级别：</label>
          <select id="difficulty-level" onchange="NavigationManager.updateDifficulty()">
            <option value="beginner">初级 (Beginner)</option>
            <option value="intermediate">中级 (Intermediate)</option>
            <option value="advanced">高级 (Advanced)</option>
          </select>
          <span class="selected-difficulty">当前选择: ${AppState.userPreferences.difficulty}</span>
        </div>
        
        <div id="scenarios-grid" class="scenarios-grid">
          ${scenariosHtml}
        </div>
      </section>
    `;
  }

  static updateDifficulty() {
    const selectElement = document.getElementById('difficulty-level');
    if (selectElement) {
      const selectedDifficulty = selectElement.value;
      AppState.userPreferences.difficulty = selectedDifficulty;
      
      // Update the displayed difficulty
      const diffSpan = document.querySelector('.selected-difficulty');
      if (diffSpan) {
        diffSpan.textContent = `当前选择: ${selectedDifficulty}`;
      }
      
      // Reload scenarios page to reflect difficulty change
      this.renderScenarios(NavigationManager.getMockScenarios(), document.getElementById('scenarios-grid'));
    }
  }

  static createScenarioCard(scenario) {
    // Get the current difficulty preference
    const currentDifficulty = AppState.userPreferences.difficulty;

    // Check if the scenario has advanced challenges
    const hasAdvancedChallenges = scenario.advancedChallenges && scenario.advancedChallenges.length > 0;

    // Build the card based on difficulty
    let cardContent = '';
    if (hasAdvancedChallenges) {
      // Show advanced challenges if they exist
      const advancedChallenge = scenario.advancedChallenges.find(challenge => challenge.difficulty === currentDifficulty);
      if (advancedChallenge && currentDifficulty !== scenario.difficulty) {
        cardContent = `
          <h3 class="card-title">${scenario.name} - ${advancedChallenge.title}</h3>
          <p class="card-subtitle">${advancedChallenge.description}</p>
          <div class="scenario-meta">
            <span class="badge ${currentDifficulty}">${currentDifficulty}</span>
            <span class="scenario-duration">${scenario.estimatedDuration}分钟</span>
          </div>
          <p class="scenario-description">${scenario.fullDescription}</p>
        `;
      } else {
        // Show base scenario
        cardContent = `
          <h3 class="card-title">${scenario.name}</h3>
          <p class="card-subtitle">${scenario.description}</p>
          <div class="scenario-meta">
            <span class="badge ${scenario.difficulty}">${scenario.difficulty}</span>
            <span class="scenario-duration">${scenario.estimatedDuration}分钟</span>
          </div>
          <p class="scenario-description">${scenario.fullDescription}</p>
        `;
      }
    } else {
      // For scenarios without advanced challenges
      cardContent = `
        <h3 class="card-title">${scenario.name}</h3>
        <p class="card-subtitle">${scenario.description}</p>
        <div class="scenario-meta">
          <span class="badge ${scenario.difficulty}">${scenario.difficulty}</span>
          <span class="scenario-duration">${scenario.estimatedDuration}分钟</span>
        </div>
        <p class="scenario-description">${scenario.fullDescription}</p>
      `;
    }

    return `
      <div class="card scenario-card" onclick="GameManager.startScenario('${scenario.id}')" style="cursor: pointer;">
        ${cardContent}
        <button class="btn btn-primary" onclick="event.stopPropagation(); GameManager.startScenario('${scenario.id}')">
          开始挑战 (${currentDifficulty}难度)
        </button>
        ${hasAdvancedChallenges ? `
          <div class="advanced-options">
            <small>高级挑战:</small>
            <ul>
              ${scenario.advancedChallenges.map(challenge =>
                `<li class="${challenge.difficulty}">${challenge.title} (${challenge.difficulty})</li>`
              ).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  static renderScenarios(scenarios, container) {
    if (!container) return;

    // Clear container and add updated content
    container.innerHTML = scenarios.map(scenario => this.createScenarioCard(scenario)).join('');
  }

  static bindPageEvents(page) {
    // Page-specific event bindings
    if (page === 'scenarios') {
      // Bind difficulty selector if it exists
      const diffSelector = document.getElementById('difficulty-level');
      if (diffSelector) {
        diffSelector.value = AppState.userPreferences.difficulty;
      }
    }
  }

  static getHomePage() {
    return `
      <section class="page-section hero-section">
        <div class="hero-content">
          <h1>认知陷阱教育平台</h1>
          <p>通过互动式挑战体验，识别和克服常见的认知偏差</p>
          <div class="cta-buttons">
            <button class="btn btn-primary" onclick="NavigationManager.navigateTo('scenarios')">开始挑战</button>
            <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('about')">了解更多</button>
          </div>
        </div>
        
        <div class="features-grid">
          <div class="feature-card">
            <h3>指数增长误区</h3>
            <p>理解2^200的真实含义，体验指数增长的惊人效果</p>
          </div>
          <div class="feature-card">
            <h3>复利思维陷阱</h3>
            <p>体验复利增长的威力，避免线性思维的局限</p>
          </div>
          <div class="feature-card">
            <h3>复杂系统思维</h3>
            <p>学习在复杂系统中识别级联故障和非线性效应</p>
          </div>
        </div>
      </section>
    `;
  }

  static getDashboardPage() {
    return `
      <section class="page-section dashboard-page">
        <header class="page-header">
          <h1>学习仪表板</h1>
          <p>跟踪您的认知提升进度</p>
        </header>
        
        <div class="dashboard-grid">
          <div class="stat-card">
            <h3>12</h3>
            <p>已完成挑战</p>
          </div>
          <div class="stat-card">
            <h3>85%</h3>
            <p>准确率提升</p>
          </div>
          <div class="stat-card">
            <h3>3</h3>
            <p>认知陷阱识别</p>
          </div>
        </div>
      </section>
    `;
  }

  static getProfilePage() {
    return `<section class="page-section"><h1>用户档案</h1><p>个人资料页面</p></section>`;
  }

  static getSettingsPage() {
    return `<section class="page-section"><h1>设置</h1><p>应用设置页面</p></section>`;
  }

  static getAboutPage() {
    return `<section class="page-section"><h1>关于我们</h1><p>认知陷阱平台介绍</p></section>`;
  }

  static getContactPage() {
    return `<section class="page-section"><h1>联系我们</h1><p>联系方式</p></section>`;
  }

  static getErrorPage() {
    return `<section class="page-section"><h1>页面未找到</h1><p>抱歉，找不到您访问的页面</p></section>`;
  }
}

// Coffee Shop Page Router - Multi-page flow for coffee shop scenario
class CoffeeShopPageRouter {
  constructor(gameState = null) {
    this.gameState = gameState || {
      satisfaction: 50,
      resources: 1000,
      reputation: 50,
      turn_number: 1,
      decision_history: [],
      delayed_effects: []
    };
    this.currentPage = 'START';
    this.currentTurn = 1;
    this.currentDecisionIndex = 0;
    this.tempDecisions = {};
  }

  // ========== Page State Management ==========

  getCurrentPage() {
    return this.currentPage;
  }

  getCurrentTurn() {
    return this.currentTurn;
  }

  getCurrentDecisionIndex() {
    return this.currentDecisionIndex;
  }

  startGame() {
    this.currentPage = 'TURN_1_DECISION_1';
  }

  // ========== Decision Flow ==========

  makeDecision(key, value) {
    this.tempDecisions[key] = value;

    // Update page based on decision
    if (this.currentPage === 'TURN_1_DECISION_1') {
      this.currentPage = 'TURN_1_DECISION_1_FEEDBACK';
    } else if (this.currentPage === 'TURN_1_DECISION_2') {
      this.currentPage = 'TURN_1_DECISION_2_FEEDBACK';
    } else if (this.currentPage === 'TURN_2_DECISION_1') {
      this.currentPage = 'TURN_2_DECISION_1_FEEDBACK';
    } else if (this.currentPage === 'TURN_2_DECISION_2') {
      this.currentPage = 'TURN_2_DECISION_2_FEEDBACK';
    } else if (this.currentPage === 'TURN_3_DECISION_1') {
      this.currentPage = 'TURN_3_DECISION_1_FEEDBACK';
    }
  }

  confirmFeedback() {
    // Move from feedback to next decision or summary
    if (this.currentPage === 'TURN_1_DECISION_1_FEEDBACK') {
      this.currentPage = 'TURN_1_DECISION_2';
      this.currentDecisionIndex = 1;
    } else if (this.currentPage === 'TURN_1_DECISION_2_FEEDBACK') {
      this.currentPage = 'TURN_1_SUMMARY';
    } else if (this.currentPage === 'TURN_2_DECISION_1_FEEDBACK') {
      this.currentPage = 'TURN_2_DECISION_2';
      this.currentDecisionIndex = 1;
    } else if (this.currentPage === 'TURN_2_DECISION_2_FEEDBACK') {
      this.currentPage = 'TURN_2_SUMMARY';
    } else if (this.currentPage === 'TURN_3_DECISION_1_FEEDBACK') {
      this.currentPage = 'TURN_3_SUMMARY';
    }
  }

  getTempDecisions() {
    return this.tempDecisions;
  }

  updateDecision(key, value) {
    this.tempDecisions[key] = value;
  }

  // ========== Linear Expectation Calculator ==========

  calculateExpectation(decision, value, state = null) {
    const currentState = state || this.gameState;

    if (decision === 'coffeeVariety') {
      const newVariety = value - 3;
      const expectedCustomers = newVariety * 10;
      const expectedRevenue = expectedCustomers * 9;
      const cost = newVariety * 15;
      const expectedProfit = expectedRevenue - cost;

      return {
        new_variety: newVariety,
        expected_customers: expectedCustomers,
        expected_revenue: expectedRevenue,
        cost: cost,
        expected_profit: expectedProfit,
        thinking: `新增${newVariety}种咖啡，期望每天新增${expectedCustomers}个顾客`
      };
    }

    if (decision === 'promotionBudget') {
      const investment = value;
      const expectedReturnRate = 3;
      const expectedReturn = investment * expectedReturnRate;
      const expectedProfit = expectedReturn - investment;

      return {
        investment: investment,
        expected_return_rate: expectedReturnRate,
        expected_return: expectedReturn,
        cost: investment,
        expected_profit: expectedProfit,
        thinking: `投入¥${investment}促销，期望回报率${expectedReturnRate}倍`
      };
    }

    if (decision === 'seats') {
      const newSeats = value;
      const expectedCustomers = newSeats * 2;
      const expectedRevenue = expectedCustomers * 9;
      const cost = newSeats * 50;
      const expectedProfit = expectedRevenue - cost;

      return {
        new_seats: newSeats,
        expected_customers: expectedCustomers,
        expected_revenue: expectedRevenue,
        cost: cost,
        expected_profit: expectedProfit,
        thinking: `新增${newSeats}个座位，期望新增${expectedCustomers}个顾客`
      };
    }

    if (decision === 'premiumPrice') {
      const priceIncrease = value - 9;
      const expectedCustomers = 20; // Assume stable base
      const expectedRevenue = expectedCustomers * (9 + priceIncrease);
      const expectedProfit = expectedRevenue - 20;

      return {
        new_price: 9 + priceIncrease,
        expected_customers: expectedCustomers,
        expected_revenue: expectedRevenue,
        cost: 20,
        expected_profit: expectedProfit,
        thinking: `涨价到¥${9 + priceIncrease}，期望保持20个顾客`
      };
    }

    if (decision === 'expansionStrategy') {
      const strategies = {
        1: { name: '保守扩张', expected_customers: 5, cost: 50, thinking: '保守扩张，期望新增5个顾客' },
        2: { name: '适度扩张', expected_customers: 15, cost: 150, thinking: '适度扩张，期望新增15个顾客' },
        3: { name: '激进扩张', expected_customers: 30, cost: 300, thinking: '激进扩张，期望新增30个顾客' }
      };
      const strategy = strategies[value] || strategies[2];
      const expectedRevenue = strategy.expected_customers * 9;
      const expectedProfit = expectedRevenue - strategy.cost;

      return {
        strategy_name: strategy.name,
        expected_customers: strategy.expected_customers,
        expected_revenue: expectedRevenue,
        cost: strategy.cost,
        expected_profit: expectedProfit,
        thinking: strategy.thinking
      };
    }

    return {};
  }

  getCurrentExpectation() {
    // Get expectation for current decision
    const decisions = Object.keys(this.tempDecisions);
    if (decisions.length === 0) {
      return { expected_profit: 0 };
    }

    const lastDecision = decisions[decisions.length - 1];
    const lastValue = this.tempDecisions[lastDecision];

    return this.calculateExpectation(lastDecision, lastValue);
  }

  // ========== Turn Management ==========

  nextTurn() {
    this.currentTurn++;
    this.currentDecisionIndex = 0;
    this.tempDecisions = {};

    // Set page for next turn
    if (this.currentTurn === 2) {
      this.currentPage = 'TURN_2_DECISION_1';
    } else if (this.currentTurn === 3) {
      this.currentPage = 'TURN_3_DECISION_1';
    } else if (this.currentTurn === 4) {
      this.currentPage = 'TURN_4_AWAKENING';
    } else if (this.currentTurn >= 5) {
      this.currentPage = 'TURN_5_ENDING';
    }
  }

  advanceTurn() {
    this.currentTurn++;
  }

  nextDecision() {
    this.currentDecisionIndex++;
  }

  // ========== Feedback System ==========

  getImmediateFeedback() {
    const decisions = Object.keys(this.tempDecisions);
    if (decisions.length === 0) {
      return {};
    }

    const lastDecision = decisions[decisions.length - 1];
    const lastValue = this.tempDecisions[lastDecision];
    const expectation = this.calculateExpectation(lastDecision, lastValue);

    let warning = null;
    if (lastDecision === 'coffeeVariety' && lastValue >= 8) {
      warning = '⚠️ 警告：超过8种可能导致选择过载';
    } else if (lastDecision === 'coffeeVariety' && lastValue < 8) {
      warning = null;
    }

    return {
      decision: lastDecision,
      value: lastValue,
      expectation: expectation,
      warning: warning,
      message: `你的选择：${lastValue}\\n\\n📈 你的期望：${expectation.expected_profit >= 0 ? '+' : ''}¥${expectation.expected_profit}\\n\\n实际结果将在月底揭晓...（受其他决策和系统因素影响）`
    };
  }

  // ========== Turn Summary ==========

  calculateTurnSummary() {
    // Calculate linear expectation for all decisions
    const expectation = this.calculateTurnExpectation();

    // Calculate actual result (will be different!)
    const actual = this.calculateTurnActual();

    // Calculate gap
    const gap = actual.resources - expectation.resources;

    return {
      linear_expectation: expectation,
      actual_result: actual,
      gap: gap,
      gap_percent: Math.abs(gap / expectation.resources * 100),
      narrative: this.generateTurnNarrative(expectation, actual, gap)
    };
  }

  calculateTurnExpectation() {
    let totalExpectedProfit = 0;
    let expectedCustomers = 0;
    let expectedRevenue = 0;
    let totalCost = 0;

    // Calculate expectation for each decision
    if (this.tempDecisions.coffeeVariety) {
      const exp = this.calculateExpectation('coffeeVariety', this.tempDecisions.coffeeVariety);
      totalExpectedProfit += exp.expected_profit;
      expectedCustomers += exp.expected_customers;
      expectedRevenue += exp.expected_revenue;
      totalCost += exp.cost;
    }

    if (this.tempDecisions.promotionBudget) {
      const exp = this.calculateExpectation('promotionBudget', this.tempDecisions.promotionBudget);
      totalExpectedProfit += exp.expected_profit;
      expectedRevenue += exp.expected_return;
      totalCost += exp.cost;
    }

    if (this.tempDecisions.seats) {
      const exp = this.calculateExpectation('seats', this.tempDecisions.seats);
      totalExpectedProfit += exp.expected_profit;
      expectedCustomers += exp.expected_customers;
      expectedRevenue += exp.expected_revenue;
      totalCost += exp.cost;
    }

    if (this.tempDecisions.premiumPrice) {
      const exp = this.calculateExpectation('premiumPrice', this.tempDecisions.premiumPrice);
      totalExpectedProfit += exp.expected_profit;
      expectedRevenue += exp.expected_revenue;
      totalCost += exp.cost;
    }

    if (this.tempDecisions.expansionStrategy) {
      const exp = this.calculateExpectation('expansionStrategy', this.tempDecisions.expansionStrategy);
      totalExpectedProfit += exp.expected_profit;
      expectedCustomers += exp.expected_customers;
      expectedRevenue += exp.expected_revenue;
      totalCost += exp.cost;
    }

    return {
      resources: this.gameState.resources + totalExpectedProfit,
      satisfaction: this.gameState.satisfaction + expectedCustomers / 10,
      reputation: this.gameState.reputation + 5,
      total_expected_profit: totalExpectedProfit
    };
  }

  calculateTurnActual() {
    // Actual result is different from expectation!
    // This is the linear thinking trap
    let actualProfit = 0;
    let actualCustomers = 0;

    if (this.tempDecisions.coffeeVariety) {
      const newVariety = this.tempDecisions.coffeeVariety - 3;
      // Diminishing returns: actual < expected
      actualCustomers += newVariety * 8; // Was 10, now 8
      actualProfit += actualCustomers * 8 - newVariety * 15;
    }

    if (this.tempDecisions.promotionBudget) {
      const promotion = this.tempDecisions.promotionBudget;
      // Lower return rate than expected
      actualProfit += promotion * 2 - promotion; // Was 3x, now 2x
    }

    if (this.tempDecisions.seats) {
      const newSeats = this.tempDecisions.seats;
      actualCustomers += newSeats * 1.5; // Was 2, now 1.5
      actualProfit += newSeats * 1.5 * 7 - newSeats * 50;
    }

    if (this.tempDecisions.premiumPrice) {
      const priceIncrease = this.tempDecisions.premiumPrice - 9;
      // Price sensitivity: customers leave
      actualCustomers += Math.max(0, 20 - priceIncrease * 3);
      actualProfit += actualCustomers * (9 + priceIncrease) - 20;
    }

    if (this.tempDecisions.expansionStrategy) {
      const strategy = this.tempDecisions.expansionStrategy;
      // Diminishing returns on expansion too
      if (strategy === 1) {
        actualCustomers += 3; // Expected 5, actual 3
        actualProfit += 3 * 8 - 50;
      } else if (strategy === 2) {
        actualCustomers += 10; // Expected 15, actual 10
        actualProfit += 10 * 8 - 150;
      } else if (strategy === 3) {
        actualCustomers += 18; // Expected 30, actual 18
        actualProfit += 18 * 7 - 300; // Lower price per customer due to oversaturation
      }
    }

    // Add coordination penalty if too many varieties
    if (this.tempDecisions.coffeeVariety && this.tempDecisions.coffeeVariety >= 8) {
      actualProfit -= 50; // Hidden coordination cost
    }

    return {
      resources: this.gameState.resources + actualProfit,
      satisfaction: this.gameState.satisfaction + actualCustomers / 15 - 5,
      reputation: this.gameState.reputation - 3,
      actual_profit: actualProfit
    };
  }

  generateTurnNarrative(expectation, actual, gap) {
    const profitGap = actual.actual_profit - expectation.total_expected_profit;

    if (profitGap > -50) {
      return `本月经营完成。实际结果${profitGap >= 0 ? '超过' : '略低于'}预期。`;
    } else if (profitGap > -150) {
      return `本月经营完成。实际结果低于预期${Math.abs(profitGap)}元。系统提示：可能存在你未考虑到的因素。`;
    } else {
      return `本月经营困难。实际结果远低于预期，差距达${Math.abs(profitGap)}元！这表明系统比你想象的更复杂。`;
    }
  }

  // ========== Game State Updates ==========

  submitTurn() {
    const summary = this.calculateTurnSummary();

    // Update game state
    this.gameState.resources = summary.actual_result.resources;
    this.gameState.satisfaction = summary.actual_result.satisfaction;
    this.gameState.reputation = summary.actual_result.reputation;
    this.gameState.turn_number++;

    // Add to decision history
    this.gameState.decision_history.push({
      turn: this.currentTurn,
      decisions: { ...this.tempDecisions },
      linear_expectation: summary.linear_expectation,
      actual_result: summary.actual_result,
      gap: summary.gap
    });

    // Clear temp decisions
    this.tempDecisions = {};
  }

  getGameState() {
    return this.gameState;
  }

  getAppliedDelayedEffects() {
    const applied = [];
    const turn = this.currentTurn;

    (this.gameState.delayed_effects || []).forEach(effect => {
      if (effect.turn === turn) {
        applied.push(effect);
      }
    });

    return applied;
  }

  // ========== Rendering ==========

  renderPage() {
    switch (this.currentPage) {
      case 'START':
        return this.renderStartPage();
      case 'TURN_1_DECISION_1':
        return this.renderDecisionPage(1, 1, 'coffeeVariety', {
          min: 3, max: 10, default: 6, unit: '种',
          warning_threshold: 8
        });
      case 'TURN_1_DECISION_2':
        return this.renderDecisionPage(1, 2, 'promotionBudget', {
          min: 0, max: 200, default: 100, unit: '¥'
        });
      case 'TURN_1_DECISION_1_FEEDBACK':
      case 'TURN_1_DECISION_2_FEEDBACK':
      case 'TURN_2_DECISION_1_FEEDBACK':
      case 'TURN_2_DECISION_2_FEEDBACK':
      case 'TURN_3_DECISION_1_FEEDBACK':
        return this.renderFeedbackPage();
      case 'TURN_1_SUMMARY':
      case 'TURN_2_SUMMARY':
      case 'TURN_3_SUMMARY':
        return this.renderTurnSummaryPage();
      case 'TURN_2_DECISION_1':
        return this.renderDecisionPage(2, 1, 'seats', {
          min: 0, max: 10, default: 4, unit: '个'
        });
      case 'TURN_2_DECISION_2':
        return this.renderDecisionPage(2, 2, 'premiumPrice', {
          min: 9, max: 15, default: 11, unit: '¥'
        });
      case 'TURN_3_DECISION_1':
        return this.renderDecisionPage(3, 1, 'expansionStrategy', {
          min: 1, max: 3, default: 2, unit: ''
        });
      case 'TURN_4_AWAKENING':
        return this.renderAwakeningPage();
      case 'TURN_5_ENDING':
        return this.renderEndingPage();
      default:
        return `<div class="game-page">
          <h2>页面开发中</h2>
          <p>当前页面：${this.currentPage}</p>
          <button class="btn btn-primary" onclick="window.coffeeShopRouter.nextTurn(); window.coffeeShopRouter.render();">继续</button>
        </div>`;
    }
  }

  renderStartPage() {
    return `
      <div class="game-page start-page">
        <h2>☕ 咖啡店经营挑战</h2>
        <div class="scenario-intro">
          <p>你刚刚接手一家位于繁华商业区的咖啡店。</p>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">💰 初始资金</span>
              <span class="stat-value">¥${this.gameState.resources}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">☕ 当前提供</span>
              <span class="stat-value">3种基础咖啡</span>
            </div>
          </div>
          <div class="customer-feedback">
            <p><strong>👥 顾客反馈：</strong></p>
            <p class="feedback-quote">"咖啡品质不错，但选择太少。"</p>
          </div>
          <div class="friend-advice">
            <p><strong>👨‍💼 朋友建议：</strong></p>
            <p class="advice-quote">"多进几种咖啡豆，多准备几种选择。"</p>
          </div>
          <div class="linear-thinking-hint">
            <p><strong>💭 你的直觉想法：</strong></p>
            <ul>
              <li>"每多1种咖啡，应该能多吸引10个顾客"</li>
              <li>"选择越多，收入越高"</li>
            </ul>
          </div>
          <p class="game-goal"><strong>🎯 目标：</strong>经营5个月，让咖啡店存活并盈利</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="window.coffeeShopRouter.startGame(); window.coffeeShopRouter.render();">开始经营</button>
        </div>
      </div>
    `;
  }

  renderDecisionPage(turn, decisionNum, decisionId, config) {
    const value = this.tempDecisions[decisionId] || config.default;
    const expectation = this.calculateExpectation(decisionId, value);

    let warningHtml = '';
    if (decisionId === 'coffeeVariety' && value >= config.warning_threshold) {
      warningHtml = `<div class="slider-warning">⚠️ ${config.warning_threshold}种可能导致选择过载</div>`;
    }

    return `
      <div class="game-page decision-page turn-${turn}-decision-${decisionNum}">
        <div class="page-header">
          <h2>☕ 开业第${turn}月 - 决策${decisionNum}/2</h2>
          <div class="progress">回合 ${this.currentTurn}/5</div>
        </div>

        ${this.renderStateDisplay()}

        <div class="situation">
          <h3>📖 本月情况</h3>
          ${this.getSituationText(turn, decisionNum)}
        </div>

        <div class="decision-area">
          <h3>📋 决策：${this.getDecisionLabel(decisionId)}</h3>
          <p>当前：${this.getCurrentValueLabel(decisionId)}</p>

          <div class="slider-container">
            <span class="min-value">${config.min}${config.unit}</span>
            <input type="range"
                   id="${decisionId}"
                   class="game-slider"
                   min="${config.min}"
                   max="${config.max}"
                   value="${value}"
                   ${config.warning_threshold ? `data-warning-threshold="${config.warning_threshold}"` : ''}
                   oninput="window.coffeeShopRouter.updateDecision('${decisionId}', parseInt(this.value)); window.coffeeShopRouter.render();">
            <span class="max-value">${config.max}${config.unit}</span>
          </div>

          <p class="current-selection">当前选择：${value}${config.unit}</p>

          ${warningHtml}
        </div>

        ${this.renderExpectationCalculator(decisionId, value, expectation)}

        <div class="actions">
          <button class="btn btn-primary confirm-btn" onclick="window.coffeeShopRouter.makeDecision('${decisionId}', parseInt(document.getElementById('${decisionId}').value)); window.coffeeShopRouter.render();">
            确认选择
          </button>
        </div>
      </div>
    `;
  }

  getSituationText(turn, decisionNum) {
    const situations = {
      '1-1': `
        <p>你的咖啡店刚刚开业，位置不错但竞争激烈。</p>
        <p>顾客反馈：\"咖啡品质不错，但选择太少。\"</p>
        <p>你的朋友建议：\"多进几种咖啡豆，多准备几种选择。\"</p>
      `,
      '1-2': `
        <p>开业第一个月即将结束。你在考虑是否要做促销。</p>
        <p>市场调研显示：促销通常能带来3倍回报。</p>
        <p>你的直觉：\"投入越多，回报越高。\"</p>
      `,
      '2-1': `
        <p>第一个月过去了，实际结果低于预期。</p>
        <p>现在有顾客抱怨座位不够，经常需要等位。</p>
        <p>你的想法：\"增加座位应该能直接增加收入。\"</p>
      `,
      '2-2': `
        <p>你在考虑是否提高咖啡价格。</p>
        <p>竞争对手的价格：¥9-15/杯</p>
        <p>你的计算：\"每涨价1元，每个顾客多赚1元。\"</p>
      `,
      '3-1': `
        <p>第三个月，需要考虑长期战略。</p>
        <p>你需要选择下一步的发展方向。</p>
        <p>每个选择看起来都有利有弊。</p>
      `
    };
    return situations[`${turn}-${decisionNum}`] || '<p>本月的经营情况...</p>';
  }

  renderStateDisplay() {
    return `
      <div class="state-display">
        <h3>📊 当前状态</h3>
        <div class="state-grid">
          <div class="state-item">
            <span class="state-label">😊 满意度</span>
            <span class="state-value">${Math.round(this.gameState.satisfaction)}/100</span>
          </div>
          <div class="state-item">
            <span class="state-label">💰 资金</span>
            <span class="state-value">¥${Math.round(this.gameState.resources)}</span>
          </div>
          <div class="state-item">
            <span class="state-label">⭐ 声誉</span>
            <span class="state-value">${Math.round(this.gameState.reputation)}/100</span>
          </div>
        </div>
      </div>
    `;
  }

  renderFeedbackPage() {
    const feedback = this.getImmediateFeedback();

    // Safe access to expectation properties
    const thinking = feedback.expectation?.thinking || '决策已记录';
    const expectedProfit = feedback.expectation?.expected_profit ?? 0;
    const decisionLabel = this.getDecisionLabel(feedback.decision);
    const unit = this.getDecisionUnit(feedback.decision);

    return `
      <div class="game-page feedback-page">
        <h2>✅ 决策已确认</h2>

        <div class="feedback-content">
          <p><strong>你的选择：</strong>${decisionLabel} = ${feedback.value}${unit}</p>

          <div class="expectation-display">
            <h3>📈 你的期望</h3>
            <p>${thinking}</p>
            <p>期望净利润：${expectedProfit >= 0 ? '+' : ''}¥${expectedProfit}</p>
          </div>

          ${feedback.warning ? `<p class="warning">${feedback.warning}</p>` : ''}

          <p class="note">实际结果将在月底揭晓...（受其他决策和系统因素影响）</p>
        </div>

        <div class="actions">
          <button class="btn btn-primary" onclick="window.coffeeShopRouter.confirmFeedback(); window.coffeeShopRouter.render();">继续下个决策</button>
        </div>
      </div>
    `;
  }

  getDecisionUnit(decisionId) {
    const units = {
      'coffeeVariety': '种',
      'promotionBudget': '¥',
      'seats': '个',
      'premiumPrice': '¥',
      'expansionStrategy': ''
    };
    return units[decisionId] || '';
  }

  renderTurnSummaryPage() {
    const summary = this.calculateTurnSummary();

    return `
      <div class="game-page turn-summary-page">
        <h2>📊 第${this.currentTurn}月总结</h2>

        <div class="comparison">
          <h3>你的期望 vs 实际结果</h3>
          <div class="comparison-row">
            <span>期望资金：</span>
            <span class="value">¥${Math.round(summary.linear_expectation.resources)}</span>
          </div>
          <div class="comparison-row">
            <span>实际资金：</span>
            <span class="value ${summary.gap >= 0 ? 'positive' : 'negative'}">
              ¥${Math.round(summary.actual_result.resources)}
              (${summary.gap >= 0 ? '+' : ''}¥${Math.round(summary.gap)})
            </span>
          </div>
        </div>

        <div class="narrative">
          <h3>📖 发生了什么</h3>
          <p>${summary.narrative}</p>
          ${summary.gap < -50 ? '<p class="insight"><strong>💡 系统提示：</strong>你的线性期望忽略了系统的复杂性。实际系统中存在边际效益递减、协调成本、竞争反应等因素。</p>' : ''}
        </div>

        <div class="actions">
          <button class="btn btn-primary" onclick="window.coffeeShopRouter.nextTurn(); window.coffeeShopRouter.render();">
            进入第${this.currentTurn + 1}月 →
          </button>
        </div>
      </div>
    `;
  }

  renderExpectationCalculator(decisionId, value, expectation) {
    return `
      <div class="expectation-calculator">
        <h3>💭 你的线性期望</h3>
        <div class="calculation-breakdown">
          ${expectation.thinking}
        </div>
        <div class="total-expectation">
          <span>期望净利润：</span>
          <span class="value ${expectation.expected_profit >= 0 ? 'positive' : 'negative'}">
            ${expectation.expected_profit >= 0 ? '+' : ''}¥${expectation.expected_profit}
          </span>
        </div>
        <p class="thinking-indicator">💡 "这是基于线性思维的简单计算"</p>
      </div>
    `;
  }

  getDecisionLabel(decisionId) {
    const labels = {
      'coffeeVariety': '咖啡种类数量',
      'promotionBudget': '开业促销投入',
      'seats': '座位数量',
      'premiumPrice': '咖啡单价',
      'expansionStrategy': '扩张策略'
    };
    return labels[decisionId] || decisionId;
  }

  renderAwakeningPage() {
    return `
      <div class="game-page awakening-page">
        <h2>💡 觉醒时刻</h2>

        <div class="awakening-content">
          <div class="realization">
            <h3>📊 前三个月经营回顾</h3>
            ${this.renderDecisionHistory()}
          </div>

          <div class="insight">
            <h3>🧠 你发现了一个模式...</h3>
            <p class="insight-text">
              每个月，你的<strong>线性期望</strong>都和<strong>实际结果</strong>存在差距。
            </p>
            <ul class="patterns">
              <li>❌ 咖啡种类增加：期望每多种1个多10个顾客，实际只多8个</li>
              <li>❌ 促销投入：期望3倍回报，实际只有2倍</li>
              <li>❌ 增加座位：期望每个座位多2个顾客，实际只有1.5个</li>
              <li>❌ 提高价格：期望顾客数量不变，实际上每涨1元流失3个顾客</li>
            </ul>
          </div>

          <div class="lesson">
            <h3>📖 《失败的逻辑》教诲</h3>
            <blockquote>
              "在复杂系统中，线性思维是危险的。现实世界存在：<br>
              • <strong>边际效益递减</strong> - 投入越多，效果越弱<br>
              • <strong>协调成本</strong> - 选择过多导致混乱<br>
              • <strong>竞争反应</strong> - 你的行动影响他人，他人也会反应<br>
              • <strong>非线性关系</strong> - 小变化可能产生大效果"
            </blockquote>
          </div>

          <div class="choice">
            <h3>🎯 最后一月：你会如何决策？</h3>
            <p>现在你了解了系统的复杂性，最后一月你会怎样经营？</p>
            <div class="awakening-options">
              <button class="btn btn-option" onclick="window.coffeeShopRouter.makeAwakeningDecision('cautious'); window.coffeeShopRouter.render();">
                📉 保守策略
                <small>减少风险，稳定经营</small>
              </button>
              <button class="btn btn-option" onclick="window.coffeeShopRouter.makeAwakeningDecision('balanced'); window.coffeeShopRouter.render();">
                ⚖️ 平衡策略
                <small>基于真实数据做决策</small>
              </button>
              <button class="btn btn-option" onclick="window.coffeeShopRouter.makeAwakeningDecision('bold'); window.coffeeShopRouter.render();">
                🚀 大胆策略
                <small>利用对系统的理解</small>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderDecisionHistory() {
    if (!this.gameState.decision_history || this.gameState.decision_history.length === 0) {
      return '<p class="no-history">暂无决策记录</p>';
    }

    return this.gameState.decision_history.map(turn => `
      <div class="turn-record">
        <h4>第${turn.turn}月</h4>
        <p>期望利润：¥${Math.round(turn.linear_expectation.total_expected_profit)}</p>
        <p>实际利润：¥${Math.round(turn.actual_result.actual_profit)}</p>
        <p class="gap ${turn.gap >= 0 ? 'positive' : 'negative'}">
          差距：${turn.gap >= 0 ? '+' : ''}¥${Math.round(turn.gap)}
        </p>
      </div>
    `).join('');
  }

  makeAwakeningDecision(strategy) {
    this.tempDecisions = {
      awakeningStrategy: strategy
    };

    // Apply strategy effects
    if (strategy === 'cautious') {
      this.gameState.resources += 50;
      this.gameState.satisfaction += 5;
    } else if (strategy === 'balanced') {
      this.gameState.resources += 100;
      this.gameState.satisfaction += 10;
    } else if (strategy === 'bold') {
      // Risky but potentially rewarding
      const outcome = Math.random() > 0.5;
      if (outcome) {
        this.gameState.resources += 200;
        this.gameState.satisfaction += 15;
      } else {
        this.gameState.resources -= 50;
        this.gameState.satisfaction -= 5;
      }
    }

    this.nextTurn();
  }

  renderEndingPage() {
    const finalResources = Math.round(this.gameState.resources);
    const finalSatisfaction = Math.round(this.gameState.satisfaction);
    const finalReputation = Math.round(this.gameState.reputation);

    let rating = '';
    let message = '';

    if (finalResources >= 1200) {
      rating = '🏆 经营大师';
      message = '你成功克服了线性思维陷阱，理解了复杂系统的运作规律！';
    } else if (finalResources >= 1000) {
      rating = '⭐ 优秀经营者';
      message = '你学会了警惕线性思维，做出了明智的决策。';
    } else if (finalResources >= 800) {
      rating = '👍 合格经营者';
      message = '你经历了失败，获得了宝贵的经验。';
    } else {
      rating = '📚 需要学习';
      message = '线性思维导致了经营困难，建议重新学习《失败的逻辑》。';
    }

    return `
      <div class="game-page ending-page">
        <h2>🎉 经营结束</h2>

        <div class="final-results">
          <div class="rating">
            <h3>${rating}</h3>
            <p class="message">${message}</p>
          </div>

          <div class="final-stats">
            <h3>📊 最终状态</h3>
            <div class="stat-row">
              <span>💰 资金：</span>
              <span class="value ${finalResources >= 1000 ? 'positive' : 'negative'}">¥${finalResources}</span>
            </div>
            <div class="stat-row">
              <span>😊 满意度：</span>
              <span class="value">${finalSatisfaction}/100</span>
            </div>
            <div class="stat-row">
              <span>⭐ 声誉：</span>
              <span class="value">${finalReputation}/100</span>
            </div>
          </div>

          <div class="lessons-learned">
            <h3>🎓 你学到了什么</h3>
            <ul class="lessons">
              <li>✅ 识别了线性思维陷阱</li>
              <li>✅ 理解了复杂系统的非线性特征</li>
              <li>✅ 学会了考虑边际效益递减</li>
              <li>✅ 意识到了协调成本的存在</li>
            </ul>
          </div>

          <div class="next-steps">
            <h3>📚 继续学习</h3>
            <p>深入理解《失败的逻辑》中的更多认知陷阱：</p>
            <ul>
              <li>🕐 时间延迟偏差</li>
              <li>🔍 错误归因陷阱</li>
              <li>✔️ 确认偏误</li>
            </ul>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-primary" onclick="window.coffeeShopRouter = null; document.getElementById('game-modal').style.display='none';">
            返回主页
          </button>
          <button class="btn btn-secondary" onclick="location.reload();">
            重新挑战
          </button>
        </div>
      </div>
    `;
  }

  getCurrentValueLabel(decisionId) {
    const labels = {
      'coffeeVariety': '3种咖啡',
      'promotionBudget': '暂无促销',
      'seats': '8个座位',
      'premiumPrice': '¥9/杯',
      'expansionStrategy': '当前规模'
    };
    return labels[decisionId] || '';
  }

  // ========== Navigation ==========

  getAvailableActions() {
    const actions = [];

    if (this.currentPage.includes('DECISION') && !this.currentPage.includes('FEEDBACK')) {
      actions.push('confirm');
    } else if (this.currentPage.includes('FEEDBACK')) {
      actions.push('continue');
    } else if (this.currentPage.includes('SUMMARY')) {
      actions.push('nextTurn');
    }

    return actions;
  }

  // ========== State Persistence ==========

  saveState() {
    const state = {
      tempDecisions: this.tempDecisions,
      currentTurn: this.currentTurn,
      currentPage: this.currentPage,
      gameState: this.gameState
    };
    sessionStorage.setItem('coffeeShopGameState', JSON.stringify(state));
  }

  loadState() {
    const saved = sessionStorage.getItem('coffeeShopGameState');
    if (saved) {
      const state = JSON.parse(saved);
      this.tempDecisions = state.tempDecisions;
      this.currentTurn = state.currentTurn;
      this.currentPage = state.currentPage;
      this.gameState = state.gameState;
    }
  }

  render() {
    const container = document.getElementById('game-container');
    if (container) {
      container.innerHTML = this.renderPage();
    }
  }
}

// ============================================================================
// Relationship Time Delay Page Router -恋爱关系时间延迟场景
// ============================================================================

class RelationshipTimeDelayPageRouter {
  constructor(gameState = null) {
    // 游戏状态初始化
    this.gameState = gameState || {
      // 玩家状态
      satisfaction: 60,    // 满意度 0-100
      energy: 80,          // 个人能量 0-100

      // 关系状态（小林状态对玩家隐藏）
      affection: 50,       // 小林的好感度 0-100 (HIDDEN)
      stability: 40,       // 关系稳定性 0-100

      // 时间系统
      week_number: 1,      // 当前周 1-12
      turn_number: 1,      // 当前月（回合）1-5

      // 决策和效果
      decision_history: [],
      pending_effects: [],  // 核心机制：延迟效果队列

      // 聊天记录
      chat_messages: []
    };

    this.currentPage = 'START';
    this.currentTurn = 1;
    this.currentDecisionIndex = 0;
    this.tempDecisions = {};

    // 决策配置
    this.decisionConfig = {
      TURN_1: [
        { key: 'communication_style', options: ['low', 'medium', 'high'] },
        { key: 'dating_frequency', options: ['once_monthly', 'once_weekly', 'twice_weekly'] }
      ],
      TURN_2: [
        { key: 'conflict_style', options: ['avoidant', 'collaborative', 'assertive'] }
      ],
      TURN_3: [
        { key: 'gift_investment', options: ['none', 'moderate', 'expensive'] }
      ],
      TURN_4: [
        // 觉醒月 - 无常规决策
      ],
      TURN_5: [
        { key: 'future_planning', options: ['casual', 'committed', 'proposal'] }
      ]
    };
  }

  // ========== Page State Management ==========

  getCurrentPage() {
    return this.currentPage;
  }

  getCurrentTurn() {
    return this.currentTurn;
  }

  startGame() {
    this.currentPage = 'TURN_1_DECISION_1';
    this.gameState.week_number = 1;
  }

  // ========== PendingEffect 核心系统 ==========

  queueDecisionEffect(decisionType, value, sourceWeek) {
    const effect = {
      id: `${decisionType}_${sourceWeek}_${Date.now()}`,
      source_week: sourceWeek,
      decision_type: decisionType,
      value: value,
      is_active: false,
      immediate: this._calculateImmediateEffect(decisionType, value),
      delayed: this._calculateDelayedEffect(decisionType, value),
      expected_week: sourceWeek + this._getDelayWeeks(decisionType, value)
    };

    this.gameState.pending_effects.push(effect);
    return effect;
  }

  activateEffectsForWeek(targetWeek) {
    const activated = [];

    for (const effect of this.gameState.pending_effects) {
      if (!effect.is_active && effect.expected_week === targetWeek) {
        effect.is_active = true;

        // 应用效果到游戏状态 - 应用所有延迟效果
        if (effect.delayed && effect.delayed.length > 0) {
          // 计算所有延迟效果的总和
          for (const delayedEffect of effect.delayed) {
            if (delayedEffect.affection_change) {
              this.gameState.affection += delayedEffect.affection_change;
            }
            if (delayedEffect.stability_change) {
              this.gameState.stability += delayedEffect.stability_change;
            }
          }
        }

        activated.push(effect);
      }
    }

    return activated;
  }

  _calculateImmediateEffect(decisionType, value) {
    // 立即效果（某些决策有立即效果）
    const effects = {
      communication_style: {
        high: { affection_change: -5, message: '小林感到压力' },
        medium: { affection_change: 0 },
        low: { affection_change: -2 }
      },
      dating_frequency: {
        twice_weekly: { affection_change: 0 },
        once_weekly: { affection_change: 0 },
        once_monthly: { affection_change: -3 }
      },
      gift_investment: {
        expensive: { affection_change: 5, energy_change: -20 },
        moderate: { affection_change: 3, energy_change: -10 },
        none: { affection_change: 0 }
      }
    };

    return effects[decisionType]?.[value] || { affection_change: 0 };
  }

  _calculateDelayedEffect(decisionType, value) {
    // 延迟效果（分阶段）
    const delays = {
      communication_style: {
        high: [
          { week_offset: 1, affection_change: -2 },
          { week_offset: 2, affection_change: -3 },
          { week_offset: 3, affection_change: 2 } // 最终有小幅正向
        ],
        medium: [
          { week_offset: 1, affection_change: 2 },
          { week_offset: 2, affection_change: 3 },
          { week_offset: 3, affection_change: 3 }
        ],
        low: [
          { week_offset: 1, affection_change: 0 },
          { week_offset: 2, affection_change: 1 },
          { week_offset: 3, affection_change: 2 }
        ]
      },
      dating_frequency: {
        twice_weekly: [
          { week_offset: 1, affection_change: 3 },
          { week_offset: 2, affection_change: 4 },
          { week_offset: 3, affection_change: -2 } // 过度接触导致压力
        ],
        once_weekly: [
          { week_offset: 1, affection_change: 4 },
          { week_offset: 2, affection_change: 5 },
          { week_offset: 3, affection_change: 3 }
        ],
        once_monthly: [
          { week_offset: 1, affection_change: 1 },
          { week_offset: 2, affection_change: 2 },
          { week_offset: 3, affection_change: 2 }
        ]
      }
    };

    return delays[decisionType]?.[value] || [];
  }

  _getDelayWeeks(decisionType, value) {
    // 返回延迟周数
    const delays = {
      communication_style: { high: 1, medium: 3, low: 4 },
      dating_frequency: { twice_weekly: 2, once_weekly: 2, once_monthly: 3 },
      conflict_style: { collaborative: 2, assertive: 1, avoidant: 4 },
      gift_investment: { expensive: 1, moderate: 2, none: 0 },
      future_planning: { proposal: 0, committed: 1, casual: 2 }
    };

    return delays[decisionType]?.[value] || 3;
  }

  // ========== 小林AI响应系统 ==========

  generateXiaolinResponse(type, message, week) {
    const mood = this.getBaseMood(week);
    const affection = this.gameState.affection;

    let responseTemplates = [];

    if (affection >= 70) {
      responseTemplates = [
        { message: '看到你的消息真开心！', emoji: '😊', delay_hours: 0.5 },
        { message: '好呀，我也在想你了～', emoji: '❤️', delay_hours: 0.3 },
        { message: '什么时候见面？', emoji: '😘', delay_hours: 0.5 }
      ];
    } else if (affection >= 50) {
      responseTemplates = [
        { message: '嗯嗯，好的', emoji: '🙂', delay_hours: 1 },
        { message: '收到～', emoji: '😊', delay_hours: 1.5 },
        { message: '有空聊', emoji: '👌', delay_hours: 2 }
      ];
    } else {
      responseTemplates = [
        { message: '最近有点忙，晚点回你', emoji: '😅', delay_hours: 4 },
        { message: '在开会，稍后说', emoji: '🙂', delay_hours: 5 },
        { message: '有点事，回头聊', emoji: '😐', delay_hours: 6 }
      ];
    }

    // 应用情绪影响 - 确保stressed时延迟>3
    // 对于中等好感度，base delay是1-2小时，stressed时乘以4得到4-8小时
    const baseResponse = responseTemplates[Math.floor(Math.random() * responseTemplates.length)];
    const moodMultiplier = mood === 'stressed' ? 4 : (mood === 'happy' ? 0.5 : 1);

    return {
      message: baseResponse.message,
      emoji: baseResponse.emoji,
      delay_hours: baseResponse.delay_hours * moodMultiplier
    };
  }

  getBaseMood(week) {
    // 情绪周期
    const moodSchedule = {
      1: 'normal',
      2: 'stressed',  // 工作压力大
      3: 'normal',
      4: 'happy',     // 项目完成
      5: 'normal',
      6: 'stressed',  // 季度末
      7: 'normal',
      8: 'happy',     // 生日月
      9: 'normal',
      10: 'stressed', // 年终
      11: 'normal',
      12: 'happy'     // 节日
    };

    return moodSchedule[week] || 'normal';
  }

  // ========== 线性期望计算 ==========

  calculateExpectation(decisionType, value) {
    const expectations = {
      communication_style: {
        high: {
          affection_change: 3,
          thinking: '每天10条消息，期望每周+3好感'
        },
        medium: {
          affection_change: 2,
          thinking: '每天2-3条消息，每周+2好感'
        },
        low: {
          affection_change: 1,
          thinking: '偶尔联系，每周+1好感'
        }
      },
      dating_frequency: {
        twice_weekly: {
          affection_change: 4,
          thinking: '每周约会2次，每周+4好感'
        },
        once_weekly: {
          affection_change: 3,
          thinking: '每周约会1次，每周+3好感'
        },
        once_monthly: {
          affection_change: 1,
          thinking: '每月约会1次，每周+1好感'
        }
      },
      conflict_style: {
        collaborative: {
          stability_change: 5,
          affection_change: 2,
          thinking: '协作解决问题，增加稳定性'
        },
        assertive: {
          stability_change: 3,
          affection_change: 1,
          thinking: '坚持立场，适度提升'
        },
        avoidant: {
          stability_change: -2,
          affection_change: -1,
          thinking: '回避问题，可能降低稳定'
        }
      },
      gift_investment: {
        expensive: {
          affection_change: 15,
          energy_change: -20,
          thinking: '贵重礼物期望+15好感，消耗-20能量'
        },
        moderate: {
          affection_change: 8,
          energy_change: -10,
          thinking: '适度礼物期望+8好感，消耗-10能量'
        },
        none: {
          affection_change: 0,
          energy_change: 0,
          thinking: '无礼物投入'
        }
      }
    };

    return expectations[decisionType]?.[value] || {};
  }

  // ========== 决策流程 ==========

  makeDecision(decisionType, value, turn = null) {
    const currentTurn = turn || this.currentTurn;

    // 存储临时决策
    this.tempDecisions[decisionType] = value;

    // 添加到延迟效果队列
    this.queueDecisionEffect(decisionType, value, this.gameState.week_number);

    // 应用立即效果
    const immediateEffect = this._calculateImmediateEffect(decisionType, value);
    if (immediateEffect.affection_change) {
      this.gameState.affection += immediateEffect.affection_change;
    }
    if (immediateEffect.energy_change) {
      this.gameState.energy += immediateEffect.energy_change;
    }

    // 更新页面
    this.currentPage = `${this._getCurrentPagePrefix()}_FEEDBACK`;
  }

  confirmFeedback() {
    const currentPage = this.currentPage;

    if (currentPage.includes('DECISION_1_FEEDBACK')) {
      // 进入第二个决策
      this.currentPage = currentPage.replace('DECISION_1_FEEDBACK', 'DECISION_2');
      this.currentDecisionIndex = 1;
    } else if (currentPage.includes('DECISION_2_FEEDBACK')) {
      // 完成本月，进入总结
      this.finishMonth();
    } else if (currentPage.includes('SUMMARY')) {
      // 进入下一月
      this.nextTurn();
    } else if (currentPage.includes('AWAKENING')) {
      // 觉醒后进入最后一月
      this.nextTurn();
    }
  }

  updateDecision(key, value) {
    this.tempDecisions[key] = value;
  }

  handleConfirmClick(buttonElement) {
    const decisionKey = buttonElement.getAttribute('data-decision-key');
    const selectedInput = document.querySelector(`input[name="${decisionKey}"]:checked`);

    if (selectedInput && selectedInput.value) {
      this.makeDecision(decisionKey, selectedInput.value);
      this.render();
    } else {
      alert('请先选择一个选项');
    }
  }

  finishMonth() {
    // 模拟周数推进
    this.simulateWeeks(4);

    // 记录决策历史（在递增前记录当前回合）
    const historyRecord = {
      turn: this.gameState.turn_number,
      decisions: { ...this.tempDecisions },
      week_number: this.gameState.week_number,
      affection: this.gameState.affection,
      stability: this.gameState.stability,
      expectation: '期望好感度增长',
      actual: `实际好感度：${this.gameState.affection}`,
      gap: '期望vs实际差距'
    };

    this.gameState.decision_history.push(historyRecord);

    // 清除临时决策
    this.tempDecisions = {};

    // 进入月总结页面（使用当前回合数）
    this.currentPage = `TURN_${this.gameState.turn_number}_SUMMARY`;

    // 递增回合数（为下个月做准备）
    this.gameState.turn_number++;
  }

  simulateWeeks(weeks) {
    for (let i = 0; i < weeks; i++) {
      const currentWeek = this.gameState.week_number;
      this.activateEffectsForWeek(currentWeek);
      this.gameState.week_number++;
    }
  }

  nextTurn() {
    this.gameState.turn_number++;
    this.currentTurn = this.gameState.turn_number;
    this.currentDecisionIndex = 0;

    if (this.gameState.turn_number === 4) {
      this.currentPage = 'TURN_4_AWAKENING';
    } else if (this.gameState.turn_number > 5) {
      this.currentPage = 'TURN_5_ENDING';
    } else {
      this.currentPage = `TURN_${this.gameState.turn_number}_DECISION_1`;
    }
  }

  makeAwakeningDecision(strategy) {
    this.tempDecisions.awakeningStrategy = strategy;

    // 应用策略效果
    if (strategy === 'continue') {
      // 继续现状 - 无变化
    } else if (strategy === 'adjust') {
      // 调整策略 - 小幅提升
      this.gameState.affection += 5;
      this.gameState.stability += 5;
    } else if (strategy === 'deepen') {
      // 深度投入 - 风险高
      this.gameState.affection += 10;
      this.gameState.energy -= 15;
    }

    this.nextTurn();
  }

  resetGame() {
    this.currentPage = 'START';
    this.currentTurn = 1;
    this.currentDecisionIndex = 0;
    this.tempDecisions = {};
    this.gameState = {
      satisfaction: 60,
      energy: 80,
      affection: 50,
      stability: 40,
      week_number: 1,
      turn_number: 1,
      decision_history: [],
      pending_effects: [],
      chat_messages: []
    };
  }

  // ========== 页面渲染 ==========

  renderPage() {
    switch (this.currentPage) {
      case 'START':
        return this.renderStartPage();
      case 'TURN_1_DECISION_1':
      case 'TURN_1_DECISION_2':
      case 'TURN_2_DECISION_1':
      case 'TURN_3_DECISION_1':
      case 'TURN_5_DECISION_1':
        return this.renderDecisionPage();
      case 'TURN_1_DECISION_1_FEEDBACK':
      case 'TURN_1_DECISION_2_FEEDBACK':
      case 'TURN_2_DECISION_1_FEEDBACK':
      case 'TURN_3_DECISION_1_FEEDBACK':
      case 'TURN_5_DECISION_1_FEEDBACK':
        return this.renderFeedbackPage();
      case 'TURN_1_SUMMARY':
      case 'TURN_2_SUMMARY':
      case 'TURN_3_SUMMARY':
        return this.renderTurnSummaryPage();
      case 'TURN_4_AWAKENING':
        return this.renderAwakeningPage();
      case 'TURN_5_ENDING':
        return this.renderEndingPage();
      default:
        return '<div>页面开发中</div>';
    }
  }

  renderStartPage() {
    return `
      <div class="game-page start-page">
        <h1>💕 恋爱关系时间延迟</h1>
        <div class="intro">
          <p>你刚刚开始和小林交往，这是一段充满期待的关系。</p>
          <p>但是，在恋爱关系中，你的投入和反馈之间存在<strong>时间延迟</strong>。</p>
          <p>你现在的付出，可能要几周后才会看到效果。</p>
          <p class="warning">⚠️ 线性思维陷阱：你以为"每天发消息=立即增加好感"，但现实是...</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="window.relationshipTimeDelayRouter.startGame(); window.relationshipTimeDelayRouter.render();">
            开始交往
          </button>
        </div>
      </div>
    `;
  }

  renderDecisionPage() {
    const turn = this.currentTurn;
    const decisionIndex = this.currentDecisionIndex;

    const configs = this.decisionConfig[`TURN_${turn}`] || [];
    const currentConfig = configs[decisionIndex];

    if (!currentConfig) {
      return '<div>决策配置错误</div>';
    }

    const decisionKey = currentConfig.key;
    const decisionOptions = currentConfig.options;

    const optionLabels = {
      communication_style: {
        low: '低频（偶尔联系）',
        medium: '中频（每天2-3条）',
        high: '高频（每天10+条）'
      },
      dating_frequency: {
        once_monthly: '每月1次',
        once_weekly: '每周1次',
        twice_weekly: '每周2次'
      },
      conflict_style: {
        avoidant: '回避冲突',
        collaborative: '协作解决',
        assertive: '坚持立场'
      },
      gift_investment: {
        none: '无礼物',
        moderate: '适度礼物',
        expensive: '贵重礼物'
      },
      future_planning: {
        casual: '随性发展',
        committed: '认真承诺',
        proposal: '求婚'
      }
    };

    return `
      <div class="game-page decision-page">
        <h2>第${turn}月 - 决策${decisionIndex + 1}</h2>
        <p class="week-info">当前：第${this.gameState.week_number}周</p>

        <div class="decision-section">
          <h3>${this._getDecisionTitle(decisionKey)}</h3>
          <p class="decision-desc">${this._getDecisionDesc(decisionKey)}</p>

          <div class="options">
            ${decisionOptions.map(option => `
              <label class="option-card">
                <input type="radio" name="${decisionKey}" value="${option}"
                  onchange="window.relationshipTimeDelayRouter.updateDecision('${decisionKey}', '${option}')"
                  ${this.tempDecisions[decisionKey] === option ? 'checked' : ''}>
                <span>${optionLabels[decisionKey]?.[option] || option}</span>
              </label>
            `).join('')}
          </div>

          <div class="expectation-display">
            <h4>你的期望：</h4>
            <p id="expectation-text">选择一个选项查看期望</p>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-primary"
            data-decision-key="${decisionKey}"
            onclick="window.relationshipTimeDelayRouter.handleConfirmClick(this)">
            确认选择
          </button>
        </div>
      </div>
    `;
  }

  renderFeedbackPage() {
    const decisionKeys = Object.keys(this.tempDecisions);
    const lastDecision = decisionKeys[decisionKeys.length - 1];
    const lastValue = this.tempDecisions[lastDecision];

    if (!lastDecision || !lastValue) {
      return '<div>决策信息缺失</div>';
    }

    const expectation = this.calculateExpectation(lastDecision, lastValue);
    const isHighRisk = lastDecision === 'communication_style' && lastValue === 'high';

    return `
      <div class="game-page feedback-page">
        <h2>你的决策已记录</h2>

        <div class="feedback-content">
          <div class="your-expectation">
            <h3>你的期望</h3>
            <p>${expectation.thinking || '计算中...'}</p>
            ${expectation.affection_change ? `<p>期望每周：+${expectation.affection_change} 好感度</p>` : ''}
            ${expectation.stability_change ? `<p>期望稳定性：+${expectation.stability_change}</p>` : ''}
          </div>

          <div class="delay-warning">
            <h3>⏰ 时间延迟提醒</h3>
            <p>结果将在几周后显现</p>
            <p class="note">你的投入已进入队列，等待生效...</p>
          </div>

          ${isHighRisk ? `
            <div class="risk-warning">
              <h3>⚠️ 注意</h3>
              <p>高频联系可能造成压力</p>
            </div>
          ` : ''}
        </div>

        <div class="actions">
          <button class="btn btn-primary"
            onclick="window.relationshipTimeDelayRouter.confirmFeedback(); window.relationshipTimeDelayRouter.render();">
            继续
          </button>
        </div>
      </div>
    `;
  }

  renderTurnSummaryPage() {
    // Extract turn number from currentPage to avoid using incremented value
    const turnMatch = this.currentPage.match(/TURN_(\d+)_SUMMARY/);
    const turn = turnMatch ? parseInt(turnMatch[1]) : this.gameState.turn_number;

    return `
      <div class="game-page summary-page">
        <h2>第${turn}月总结</h2>

        <div class="summary-content">
          <div class="expectation-section">
            <h3>你的期望</h3>
            <p>本月决策的期望效果...</p>
            <p>实际</p>
          </div>

          <div class="reaction-section">
            <h3>小林的反应</h3>
            ${this.renderChatInterface([
              { type: 'received', text: '这个月过得很快呢', emoji: '😊', time: '20:00' }
            ])}
          </div>

          ${this.renderTimeline()}
        </div>

        <div class="actions">
          <button class="btn btn-primary"
            onclick="window.relationshipTimeDelayRouter.confirmFeedback(); window.relationshipTimeDelayRouter.render();">
            进入下月
          </button>
        </div>
      </div>
    `;
  }

  renderAwakeningPage() {
    return `
      <div class="game-page awakening-page">
        <h2>💡 觉醒时刻</h2>

        <div class="awakening-content">
          <p>你已经和小林交往了3个月，现在回过头来看看...</p>

          <div class="pattern-reveal">
            <h3>你发现的模式：</h3>
            ${this.renderDecisionHistory()}
          </div>

          <div class="theory-lesson">
            <h3>📚 《失败的逻辑》教诲</h3>
            <p>在复杂系统中，<strong>投入和反馈之间存在时间延迟</strong>。</p>
            <p>你以为"每天发消息"能立即增加好感，但实际上：</p>
            <ul>
              <li>🕐 第1周投入 → 第4周才产生效果</li>
              <li>📉 高频联系立即造成压力</li>
              <li>📈 适度投入才有长期回报</li>
            </ul>
          </div>

          <div class="strategy-choice">
            <h3>最后一个月，你的策略是？</h3>
            <div class="strategy-options">
              <button class="btn btn-secondary"
                onclick="window.relationshipTimeDelayRouter.makeAwakeningDecision('continue'); window.relationshipTimeDelayRouter.render();">
                继续现状
              </button>
              <button class="btn btn-secondary"
                onclick="window.relationshipTimeDelayRouter.makeAwakeningDecision('adjust'); window.relationshipTimeDelayRouter.render();">
                调整策略
              </button>
              <button class="btn btn-secondary"
                onclick="window.relationshipTimeDelayRouter.makeAwakeningDecision('deepen'); window.relationshipTimeDelayRouter.render();">
                深度投入
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderDecisionHistory() {
    // Combine decision history with temp decisions for rendering
    const allDecisions = [...this.gameState.decision_history];

    // Add each temp decision as a separate record with incrementing turn numbers
    // This simulates having decisions from multiple months for visualization
    let currentTurn = this.gameState.turn_number;
    Object.keys(this.tempDecisions).forEach((key) => {
      allDecisions.push({
        turn: currentTurn++,
        decisions: { [key]: this.tempDecisions[key] },
        week_number: this.gameState.week_number,
        affection: this.gameState.affection,
        is_temp: true
      });
    });

    if (allDecisions.length === 0) {
      return '<p>暂无决策记录</p>';
    }

    return allDecisions.map(record => `
      <div class="turn-record">
        <h4>第${record.turn}月</h4>
        <p>期望好感度增长</p>
        <p>${record.actual || '实际好感度：' + record.affection}</p>
        <p class="gap">差距</p>
      </div>
    `).join('');
  }

  renderEndingPage() {
    const rating = this.calculateRating(this.gameState);

    return `
      <div class="game-page ending-page">
        <h2>🎉 关系结局</h2>

        <div class="final-results">
          <div class="rating">
            <h3>${rating.level}</h3>
            <p class="message">${rating.message}</p>
          </div>

          <div class="final-stats">
            <h3>📊 最终状态</h3>
            <div class="stat-row">
              <span>💕 好感度：</span>
              <span class="value">${this.gameState.affection}/100</span>
            </div>
            <div class="stat-row">
              <span>😊 满意度：</span>
              <span class="value">${this.gameState.satisfaction}/100</span>
            </div>
            <div class="stat-row">
              <span>⚡ 能量：</span>
              <span class="value">${this.gameState.energy}/100</span>
            </div>
          </div>

          <div class="lessons-learned">
            <h3>🎓 你学到了什么</h3>
            <ul class="lessons">
              <li>✅ 关系中的投入存在时间延迟</li>
              <li>✅ 过度投入可能适得其反</li>
              <li>✅ 适度投入才能维持长期稳定</li>
              <li>✅ 理解了复杂系统的时间特性</li>
            </ul>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-secondary" onclick="window.relationshipTimeDelayRouter.resetGame(); window.relationshipTimeDelayRouter.render();">
            重新挑战
          </button>
        </div>
      </div>
    `;
  }

  calculateRating(state) {
    const affection = state.affection;

    if (affection >= 80) {
      return { level: '💕 幸福美满', message: '你们建立了美好的关系！' };
    } else if (affection >= 60) {
      return { level: '💚 关系稳定', message: '关系发展稳定，前景良好。' };
    } else if (affection >= 40) {
      return { level: '💔 渐行渐远', message: '关系出现裂痕，需要反思。' };
    } else {
      return { level: '📚 需要反思', message: '线性思维导致了关系问题。' };
    }
  }

  // ========== 聊天界面渲染 ==========

  renderChatInterface(messages = [], showTyping = false) {
    return `
      <div class="chat-interface">
        <div class="chat-messages">
          ${messages.map(msg => `
            <div class="message message-${msg.type}">
              <div class="message-content">
                ${msg.text}
                ${msg.emoji ? `<span class="message-emoji">${msg.emoji}</span>` : ''}
              </div>
              <span class="message-time">${msg.time}</span>
            </div>
          `).join('')}
          ${showTyping ? `
            <div class="typing-indicator">
              <span></span><span></span><span></span>
              <p>小林正在输入...</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ========== 时间线可视化 ==========

  renderTimeline() {
    const effects = this.gameState.pending_effects || [];

    return `
      <div class="timeline-section">
        <h3>📅 时间线 - 延迟效果追踪</h3>
        <div class="timeline">
          ${effects.map(effect => `
            <div class="timeline-item ${effect.is_active ? 'active' : 'pending'}">
              <div class="timeline-marker">${effect.is_active ? '✓' : '●'}</div>
              <div class="timeline-content">
                <p>第${effect.source_week}周：${effect.decision_type} = ${effect.value}</p>
                <p class="delay">→ 第${effect.expected_week}周生效 ${effect.is_active ? '（已生效）' : '（等待中）'}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ========== 辅助方法 ==========

  _getCurrentPagePrefix() {
    const match = this.currentPage.match(/TURN_\d+_DECISION_\d+/);
    return match ? match[0] : 'TURN_1_DECISION_1';
  }

  _getDecisionTitle(decisionKey) {
    const titles = {
      communication_style: '联系频率',
      dating_frequency: '约会频率',
      conflict_style: '冲突处理方式',
      gift_investment: '礼物投入',
      future_planning: '未来规划'
    };
    return titles[decisionKey] || decisionKey;
  }

  _getDecisionDesc(decisionKey) {
    const descs = {
      communication_style: '你打算多频繁地联系小林？',
      dating_frequency: '你希望多久见一次面？',
      conflict_style: '当发生分歧时，你会如何处理？',
      gift_investment: '你打算在礼物上投入多少？',
      future_planning: '你对这段关系的期望是什么？'
    };
    return descs[decisionKey] || '';
  }

  render() {
    const container = document.getElementById('game-container');
    if (container) {
      container.innerHTML = this.renderPage();
    }
  }
}

// Decision Engine - Calculates decision consequences and reveals cognitive biases
class DecisionEngine {
  // Calculate effects of user decisions for each scenario
  static calculateDecisionEffects(scenarioId, decisions, currentState) {
    console.log('Calculating effects for scenario:', scenarioId, 'decisions:', decisions, 'current state:', currentState);

    let effects = {
      satisfaction: 0,
      resources: 0,
      reputation: 0,
      trust: 0,
      portfolio: 0,
      knowledge: 0
    };

    let linearExpectation = null; // What user expects (linear thinking)
    let actualResult = null; // What actually happens (complex system)
    let delayedEffects = []; // ✅ Effects that materialize in future turns

    if (scenarioId === 'coffee-shop-linear-thinking') {
      const result = this.calculateCoffeeShopEffects(decisions, currentState);
      effects = result.effects;
      delayedEffects = result.delayedEffects || [];
      linearExpectation = this.getCoffeeShopLinearExpectation(decisions, currentState);
      actualResult = this.getCoffeeShopActualResult(effects, currentState);
    } else if (scenarioId === 'investment-confirmation-bias') {
      const result = this.calculateInvestmentEffects(decisions, currentState);
      effects = result.effects;
      delayedEffects = result.delayedEffects || [];
      linearExpectation = this.getInvestmentLinearExpectation(decisions, currentState);
      actualResult = this.getInvestmentActualResult(effects, currentState);
    } else if (scenarioId === 'relationship-time-delay') {
      const result = this.calculateRelationshipEffects(decisions, currentState);
      effects = result.effects;
      delayedEffects = result.delayedEffects || [];
      linearExpectation = this.getRelationshipLinearExpectation(decisions, currentState);
      actualResult = this.getRelationshipActualResult(effects, currentState);
    }

    return { effects, linearExpectation, actualResult, delayedEffects };
  }

  // ✅ Apply delayed effects from previous turns
  static applyDelayedEffects(delayedEffects, currentTurn) {
    const effectsToApply = {
      satisfaction: 0,
      resources: 0,
      reputation: 0,
      trust: 0,
      portfolio: 0,
      knowledge: 0
    };

    const remainingEffects = [];

    for (const effect of delayedEffects) {
      if (effect.turn_delay <= 0) {
        // This effect should be applied now
        if (effect.reputation) effectsToApply.reputation += effect.reputation;
        if (effect.satisfaction) effectsToApply.satisfaction += effect.satisfaction;
        if (effect.resources) effectsToApply.resources += effect.resources;
        if (effect.trust) effectsToApply.trust += effect.trust;
        if (effect.portfolio) effectsToApply.portfolio += effect.portfolio;
        if (effect.knowledge) effectsToApply.knowledge += effect.knowledge;
        console.log(`Applying delayed effect: ${effect.description || effect.type}`);
      } else {
        // Decrement turn delay and keep for future
        effect.turn_delay -= 1;
        remainingEffects.push(effect);
      }
    }

    return { effectsToApply, remainingEffects };
  }

  // ✅ Check if game should end
  static checkGameOver(scenarioId, gameState, decisionHistory) {
    const MAX_TURNS = 10;

    // 1. Resource depletion (failure)
    if (gameState.resources !== undefined && gameState.resources <= 0) {
      return {
        is_over: true,
        reason: 'bankruptcy',
        result: 'failure',
        message: '💥 你的咖啡店因资金耗尽而倒闭！',
        analysis: this.generateFailureAnalysis(decisionHistory, '资源耗尽')
      };
    }

    // 2. Max turns reached
    if (gameState.turn_number >= MAX_TURNS) {
      const performance = this.evaluateFinalPerformance(gameState);
      return {
        is_over: true,
        reason: 'max_turns',
        result: performance.result,
        message: `📊 ${MAX_TURNS}个经营回合结束。${performance.message}`,
        analysis: this.generateFinalAnalysis(decisionHistory, gameState, performance)
      };
    }

    // 3. Victory conditions (early success)
    if (gameState.satisfaction >= 90 && gameState.reputation >= 80) {
      return {
        is_over: true,
        reason: 'success',
        result: 'victory',
        message: '🎉 恭喜！你的咖啡店经营非常成功！',
        analysis: this.generateSuccessAnalysis(decisionHistory)
      };
    }

    return { is_over: false };
  }

  // Evaluate final performance
  static evaluateFinalPerformance(gameState) {
    let score = 0;
    let message = '';

    if (gameState.satisfaction >= 80) score += 3;
    else if (gameState.satisfaction >= 60) score += 2;
    else if (gameState.satisfaction >= 40) score += 1;

    if (gameState.reputation >= 80) score += 3;
    else if (gameState.reputation >= 60) score += 2;
    else if (gameState.reputation >= 40) score += 1;

    if (gameState.resources >= 1000) score += 2;
    else if (gameState.resources >= 500) score += 1;

    if (score >= 7) {
      message = '表现优秀！你成功避免了线性思维陷阱。';
      return { result: 'success', score, message };
    } else if (score >= 4) {
      message = '表现良好，但仍有改进空间。';
      return { result: 'average', score, message };
    } else {
      message = '表现不佳，你可能陷入了线性思维陷阱。';
      return { result: 'poor', score, message };
    }
  }

  // Generate failure analysis - enhanced for all scenarios
  static generateFailureAnalysis(decisionHistory, failureReason) {
    if (!decisionHistory || decisionHistory.length === 0) {
      return `${failureReason}：你的决策导致了这个结果。`;
    }

    const patterns = this.analyzeDecisionPatterns(decisionHistory);
    let analysis = `⚠️ **失败分析**\n\n`;
    analysis += `${failureReason}导致游戏结束。\n\n`;

    // Coffee shop patterns
    if (patterns.linearThinking) {
      analysis += `🔴 **主要问题：线性思维陷阱**\n`;
      analysis += `你连续${patterns.linearTurns}回合都在增加投入，期望得到线性的回报提升。但复杂系统中，边际收益是递减的。\n\n`;
    }

    if (patterns.lowResources) {
      analysis += `🔴 **主要问题：资源管理不当**\n`;
      analysis += `你的资源在第${patterns.criticalTurn}回合已经接近耗尽，但仍在高额投入。\n\n`;
    }

    // Investment patterns
    if (patterns.overResearch) {
      analysis += `🔴 **主要问题：确认偏误（过度研究）**\n`;
      analysis += `你连续${patterns.researchTurns}回合都在过度研究（超过50小时），期望找到完美信息。但研究的效果有时间延迟，而且过度研究会错过投资机会。\n\n`;
    }

    if (patterns.missedOpportunities) {
      analysis += `🔴 **主要问题：错过机会**\n`;
      analysis += `你在研究中消耗了太多时间，市场机会稍纵即逝。投资中完美信息是不存在的，过度研究反而降低了收益。\n\n`;
    }

    // Relationship patterns
    if (patterns.overInvestment) {
      analysis += `🔴 **主要问题：过度投入（窒息感）**\n`;
      analysis += `你连续${patterns.investmentTurns}回合都在过度投入（超过80分钟+80%沟通）。关系需要空间，过度投入反而会产生窒息感，效果适得其反。\n\n`;
    }

    if (patterns.smothering) {
      analysis += `🔴 **主要问题：忽视时间延迟效应**\n`;
      analysis += `关系的效果需要时间才能显现，你投入太多太快，没有给对方适应的时间。耐心是关系管理的关键。\n\n`;
    }

    // General adaptive behavior praise
    if (patterns.adaptiveBehavior) {
      analysis += `✅ **积极因素**：你在第${patterns.adaptiveTurn}回合调整了策略，这说明你有适应能力，只是调整得还不够早。\n\n`;
    }

    analysis += `**核心建议**：在复杂系统中，要考虑边际效应递减、时间延迟、协同成本等因素。不是越多越好，而是要找到平衡点。`;

    return analysis;
  }

  // Generate final analysis - enhanced for all scenarios
  static generateFinalAnalysis(decisionHistory, gameState, performance) {
    const patterns = this.analyzeDecisionPatterns(decisionHistory);
    let analysis = `📊 **最终分析**\n\n`;

    // Scenario-specific metrics
    if (gameState.satisfaction !== undefined) {
      analysis += `**最终得分**: ${performance.score}/8\n`;
      analysis += `**满意度**: ${gameState.satisfaction}/100\n`;
      if (gameState.reputation !== undefined) {
        analysis += `**声誉**: ${gameState.reputation}/100\n`;
      }
      if (gameState.resources !== undefined) {
        analysis += `**资源**: ${gameState.resources}/1000\n`;
      }
    } else if (gameState.portfolio !== undefined) {
      analysis += `**最终得分**: ${performance.score}/8\n`;
      analysis += `**投资组合**: ${gameState.portfolio}/10000\n`;
      analysis += `**知识水平**: ${gameState.knowledge}/100\n`;
    } else if (gameState.trust !== undefined) {
      analysis += `**最终得分**: ${performance.score}/8\n`;
      analysis += `**满意度**: ${gameState.satisfaction}/100\n`;
      analysis += `**信任度**: ${gameState.trust}/100\n`;
    }

    analysis += `\n`;

    // Pattern recognition for all scenarios
    if (patterns.linearThinking) {
      analysis += `🔴 **识别到的模式：线性思维陷阱**\n`;
      analysis += `你连续${patterns.linearTurns}回合都在增加投入，这就是线性思维陷阱的典型表现。\n\n`;
    }

    if (patterns.overResearch) {
      analysis += `🔴 **识别到的模式：确认偏误**\n`;
      analysis += `你连续${patterns.researchTurns}回合都在过度研究，试图寻找完美信息。这就是确认偏误的典型表现。\n\n`;
    }

    if (patterns.overInvestment) {
      analysis += `🔴 **识别到的模式：过度投入（窒息感）**\n`;
      analysis += `你连续${patterns.investmentTurns}回合都在过度投入，没有给对方空间。这会导致关系窒息。\n\n`;
    }

    if (patterns.adaptiveBehavior) {
      analysis += `✅ **识别到的模式：适应性行为**\n`;
      analysis += `你在第${patterns.adaptiveTurn}回合调整了策略，这很好！说明你有学习和适应能力。\n\n`;
    }

    if (patterns.lowResources) {
      analysis += `⚠️ **资源警告**：你在第${patterns.criticalTurn}回合资源已经很低，但仍在投入。\n\n`;
    }

    if (patterns.missedOpportunities) {
      analysis += `⚠️ **机会成本**：过度研究导致你错过了市场机会。\n\n`;
    }

    if (patterns.smothering) {
      analysis += `⚠️ **关系警告**：过度投入会产生窒息感，关系需要耐心和空间。\n\n`;
    }

    analysis += `**核心教训**: 在复杂系统中，投入和产出往往不是简单的线性关系。要考虑边际效应递减、协同成本、时间延迟等因素。不是越多越好，而是要找到平衡点。`;

    return analysis;
  }

  // Generate success analysis - enhanced for all scenarios
  static generateSuccessAnalysis(decisionHistory) {
    const patterns = this.analyzeDecisionPatterns(decisionHistory);
    let analysis = `🎉 **成功分析**\n\n`;

    analysis += `恭喜！你成功避免了认知偏误陷阱！\n\n`;

    if (patterns.adaptiveBehavior) {
      analysis += `✅ **关键成功因素**：\n`;
      analysis += `你在第${patterns.adaptiveTurn}回合及时调整了策略，避免了过度投入。这显示了你的适应能力和学习潜力。\n\n`;
    }

    if (!patterns.linearThinking && !patterns.overResearch && !patterns.overInvestment) {
      analysis += `✅ **关键成功因素**：\n`;
      analysis += `你始终保持平衡的决策策略，没有陷入过度投入的陷阱。这说明你已经具备了系统思维能力。\n\n`;
    }

    analysis += `你已经初步掌握了系统思维，能够理解复杂系统中的非线性关系、时间延迟效应和边际效应递减。保持这种思维方式！`;

    return analysis;
  }

  // Analyze decision patterns - enhanced for all three scenarios
  static analyzeDecisionPatterns(decisionHistory) {
    if (!decisionHistory || decisionHistory.length < 2) {
      return {
        linearThinking: false,
        adaptiveBehavior: false,
        overResearch: false,
        overInvestment: false,
        lowResources: false
      };
    }

    const patterns = {
      // Coffee shop patterns
      linearThinking: false,
      linearTurns: 0,
      adaptiveBehavior: false,
      adaptiveTurn: 0,
      lowResources: false,
      criticalTurn: 0,

      // Investment patterns
      overResearch: false,
      researchTurns: 0,
      missedOpportunities: false,

      // Relationship patterns
      overInvestment: false,
      investmentTurns: 0,
      smothering: false
    };

    // Detect patterns based on decision type
    for (let i = 1; i < decisionHistory.length; i++) {
      const prevDecision = decisionHistory[i - 1].decision;
      const currDecision = decisionHistory[i].decision;

      // Coffee shop: Check for continuous increase in staff/marketing
      if (currDecision.staff_count !== undefined && prevDecision.staff_count !== undefined) {
        if (currDecision.staff_count > prevDecision.staff_count) {
          patterns.linearTurns++;
          if (patterns.linearTurns >= 3) {
            patterns.linearThinking = true;
          }
        } else if (currDecision.staff_count < prevDecision.staff_count) {
          patterns.adaptiveBehavior = true;
          patterns.adaptiveTurn = decisionHistory[i].turn;
        }

        // Check for low resources warning
        if (decisionHistory[i].state_after?.resources < 300 && !patterns.lowResources) {
          patterns.lowResources = true;
          patterns.criticalTurn = decisionHistory[i].turn;
        }
      }

      // Investment: Check for over-researching (confirmation bias)
      if (currDecision.research_time !== undefined && prevDecision.research_time !== undefined) {
        if (currDecision.research_time > 50) {
          patterns.researchTurns++;
          if (patterns.researchTurns >= 3) {
            patterns.overResearch = true;
            patterns.missedOpportunities = true;
          }
        } else if (currDecision.research_time < prevDecision.research_time) {
          patterns.adaptiveBehavior = true;
          patterns.adaptiveTurn = decisionHistory[i].turn;
        }
      }

      // Relationship: Check for over-investment (smothering)
      if (currDecision.time_investment !== undefined && prevDecision.time_investment !== undefined) {
        if (currDecision.time_investment > 80 && currDecision.communication_effort > 80) {
          patterns.investmentTurns++;
          if (patterns.investmentTurns >= 2) {
            patterns.overInvestment = true;
            patterns.smothering = true;
          }
        } else if (currDecision.time_investment < prevDecision.time_investment) {
          patterns.adaptiveBehavior = true;
          if (!patterns.adaptiveTurn) {
            patterns.adaptiveTurn = decisionHistory[i].turn;
          }
        }
      }
    }

    return patterns;
  }

  // Coffee Shop Scenario: Linear Thinking Trap
  static calculateCoffeeShopEffects(decisions, currentState) {
    const { staff_count = 0, marketing_investment = 0 } = decisions;
    const state = currentState || { satisfaction: 50, resources: 1000, reputation: 50 };

    let effects = {
      satisfaction: 0,
      resources: 0,
      reputation: 0
    };

    // 1. Staff costs (linear cost but diminishing returns)
    const staffCost = staff_count * 100; // Each staff costs 100 (reduced for better game balance)
    effects.resources -= staffCost;

    // 1.1 Base revenue from operations (coffee sales)
    const baseRevenue = 300; // Base coffee shop revenue per turn
    const staffRevenue = staff_count * 80; // Each staff generates revenue through service
    effects.resources += baseRevenue + staffRevenue;

    // 2. Service quality improvement (logarithmic - diminishing returns)
    // More staff helps, but each additional staff adds less value
    const serviceQualityBonus = Math.round(Math.log(staff_count + 1) * 10);
    effects.satisfaction += serviceQualityBonus;

    // 3. Coordination penalty (too many staff creates confusion)
    if (staff_count > 5) {
      const coordinationPenalty = Math.round((staff_count - 5) * 2);
      effects.satisfaction -= coordinationPenalty;
    }

    // 4. Marketing investment (with diminishing returns)
    // ✅ DELAYED EFFECT: Only 30% shows immediately, rest over 3 turns
    const immediateMarketingEffect = Math.round(marketing_investment * 0.05 * 0.3);
    effects.reputation += Math.min(immediateMarketingEffect, 6); // Cap at 6 (30% of 20)

    // 5. Marketing cost (full cost now)
    effects.resources -= marketing_investment;

    // 6. Reputation affects satisfaction (people come because of reputation)
    const reputationEffect = Math.round(immediateMarketingEffect * 0.3);
    effects.satisfaction += reputationEffect;

    // 7. Random events (20% chance)
    if (Math.random() < 0.2) {
      const events = [
        { name: '突发设备故障', cost: 300, satisfaction: -10 },
        { name: '好评传播', resources: 200, reputation: 5 },
        { name: '员工请假', satisfaction: -5, resources: 100 },
        { name: '附近新店开业', reputation: -5 }
      ];
      const event = events[Math.floor(Math.random() * events.length)];
      console.log('Random event:', event);
      if (event.cost) effects.resources -= event.cost;
      if (event.resources) effects.resources += event.resources;
      if (event.satisfaction) effects.satisfaction += event.satisfaction;
      if (event.reputation) effects.reputation += event.reputation;
    }

    // ✅ DELAYED EFFECTS: Marketing takes 3 turns to fully show effects
    const delayedEffects = [];
    if (marketing_investment > 0) {
      const totalMarketingBonus = Math.round(marketing_investment * 0.05);
      const remainingBonus = totalMarketingBonus - immediateMarketingEffect;

      // Split remaining effect over next 3 turns
      for (let i = 1; i <= 3; i++) {
        delayedEffects.push({
          type: 'marketing',
          turn_delay: i,
          reputation: Math.round(remainingBonus * 0.23), // ~70% distributed over 3 turns
          satisfaction: Math.round(remainingBonus * 0.23 * 0.3),
          description: `营销投入在第${i}回合后继续生效`
        });
      }
    }

    return { effects, delayedEffects };
  }

  static getCoffeeShopLinearExpectation(decisions, currentState) {
    const { staff_count = 0, marketing_investment = 0 } = decisions;
    const state = currentState || { satisfaction: 50, resources: 1000, reputation: 50 };

    // What linear thinking expects:
    // - Each staff = +5 satisfaction (simple linear)
    // - Each 100 marketing = +5 reputation (simple linear)
    // ✅ FIXED: Based on current state, not initial values
    const expectedSatisfaction = state.satisfaction + (staff_count * 5);
    const expectedReputation = state.reputation + (marketing_investment / 100 * 5);

    return {
      satisfaction: expectedSatisfaction,
      resources: state.resources - (staff_count * 100) - marketing_investment + 300 + (staff_count * 80),
      reputation: expectedReputation,
      thinking: `从当前满意度${state.satisfaction}，招聘${staff_count}人，期望满意度提升${staff_count * 5}点，达到${expectedSatisfaction}；从当前声誉${state.reputation}，投入${marketing_investment}元营销，期望声誉提升${Math.round(marketing_investment / 100 * 5)}点，达到${Math.round(expectedReputation)}`
    };
  }

  static getCoffeeShopActualResult(effects, currentState) {
    const state = currentState || { satisfaction: 50, resources: 1000, reputation: 50 };

    return {
      satisfaction: state.satisfaction + effects.satisfaction,
      resources: state.resources + effects.resources,
      reputation: state.reputation + effects.reputation,
      changes: effects
    };
  }

  // ========== 5-Turn Coffee Shop Game Logic ==========
  static calculateCoffeeShopTurn(turn, decisions, gameState, decisionHistory, delayedEffects) {
    const { satisfaction = 50, resources = 1000, reputation = 50 } = gameState;

    // Initialize result
    let result = {
      newGameState: { ...gameState },
      linearExpectation: {},
      actualResult: {},
      feedback: '',
      newDelayedEffects: [],
      gameOver: false,
      gameOverReason: null,
      awakeningTriggered: false
    };

    // Calculate linear expectation (what player expects)
    result.linearExpectation = this.calculateTurnLinearExpectation(turn, decisions, gameState);

    // Calculate actual result (complex system reality)
    const actual = this.calculateTurnActualResult(turn, decisions, gameState, decisionHistory);

    // Apply delayed effects from previous turns
    const delayedEffectsResult = this.applyDelayedEffects(turn, delayedEffects);
    result.newGameState = delayedEffectsResult.state;

    // Apply current turn effects
    result.newGameState.satisfaction += actual.effects.satisfaction;
    result.newGameState.resources += actual.effects.resources;
    result.newGameState.reputation += actual.effects.reputation;

    // Ensure values stay within bounds
    result.newGameState.satisfaction = Math.max(0, Math.min(100, result.newGameState.satisfaction));
    result.newGameState.resources = Math.max(0, result.newGameState.resources);
    result.newGameState.reputation = Math.max(0, Math.min(100, result.newGameState.reputation));

    result.actualResult = {
      satisfaction: result.newGameState.satisfaction,
      resources: result.newGameState.resources,
      reputation: result.newGameState.reputation,
      changes: actual.effects
    };

    // Add new delayed effects
    result.newDelayedEffects = actual.delayedEffects || [];

    // Generate feedback
    result.feedback = this.generateTurnFeedback(turn, result.linearExpectation, result.actualResult, actual.narrative);

    // Check game over conditions
    if (result.newGameState.resources < 200) {
      result.gameOver = true;
      result.gameOverReason = 'resources';
    } else if (result.newGameState.satisfaction < 15) {
      result.gameOver = true;
      result.gameOverReason = 'satisfaction';
    } else if (result.newGameState.reputation < 15) {
      result.gameOver = true;
      result.gameOverReason = 'reputation';
    }

    // Check for awakening moment (Turn 4)
    if (turn === 4) {
      result.awakeningTriggered = true;
      if (decisions.awakening === 'A') {
        // Player recognized the trap
        result.awakeningSuccess = true;
        result.feedback += '\n\n✨ **觉醒时刻**：你意识到了线性思维的陷阱！开始系统调整...';
      } else {
        result.awakeningSuccess = false;
        result.feedback += '\n\n⚠️ **固执己见**：你坚持自己的逻辑，但系统的问题越来越严重...';
      }
    }

    return result;
  }

  static calculateTurnLinearExpectation(turn, decisions, gameState) {
    const { satisfaction = 50, resources = 1000, reputation = 50 } = gameState;
    let expected = {
      satisfaction,
      resources,
      reputation,
      thinking: ''
    };

    switch(turn) {
      case 1:
        // Turn 1: Initial expansion
        const newVariety1 = decisions.coffeeVariety - 3;
        const expectedCustomers1 = newVariety1 * 10;
        const expectedRevenue1 = expectedCustomers1 * 9;
        const newVarietyCost1 = newVariety1 * 15;
        const promotionReturn1 = decisions.promotionBudget * 3;
        expected.resources = resources + expectedRevenue1 + promotionReturn1 - newVarietyCost1 - decisions.promotionBudget;
        expected.satisfaction = satisfaction + newVariety1 * 2;
        expected.reputation = reputation + decisions.promotionBudget / 50;
        expected.thinking = `新增${newVariety1}种咖啡，期望每天新增${expectedCustomers1}位顾客，收入${expectedRevenue1}元；营销投入${decisions.promotionBudget}元，期望带来${promotionReturn1}元回报`;
        break;

      case 2:
        // Turn 2: Continued expansion
        const newVariety2 = decisions.coffeeVariety - 6;
        const expectedCustomers2 = newVariety2 * 10 + decisions.seats * 2;
        const expectedRevenue2 = expectedCustomers2 * 9;
        const varietyCost2 = newVariety2 * 15;
        const seatsCost2 = decisions.seats * 50;
        expected.resources = resources + expectedRevenue2 - varietyCost2 - seatsCost2;
        expected.satisfaction = satisfaction + newVariety2 * 2 + decisions.seats;
        expected.thinking = `继续扩展：新增${newVariety2}种咖啡和${decisions.seats}个座位，期望每天新增${expectedCustomers2}位顾客`;
        break;

      case 3:
        // Turn 3: Strategy choice
        if (decisions.strategyChoice === 'A') {
          expected.resources = resources + 800 - 500; // Expansion
          expected.satisfaction = satisfaction + 10;
          expected.thinking = '继续扩张策略：投入500元新开分店，期望月增收800元';
        } else {
          expected.resources = resources + 400; // Stabilize
          expected.satisfaction = satisfaction + 15;
          expected.thinking = '稳定运营策略：优化现有流程，期望月增收400元但提升质量';
        }
        break;

      case 4:
        // Turn 4: Awakening moment
        expected.thinking = '面临关键决策：继续当前策略还是系统调整？';
        break;

      case 5:
        // Turn 5: Final turn
        expected.thinking = '最后一回合：收尾工作';
        break;
    }

    return expected;
  }

  static calculateTurnActualResult(turn, decisions, gameState, decisionHistory) {
    const { satisfaction = 50, resources = 1000, reputation = 50 } = gameState;

    let effects = {
      satisfaction: 0,
      resources: 0,
      reputation: 0
    };

    let narrative = '';
    let delayedEffects = [];

    switch(turn) {
      case 1:
        // Turn 1: Mostly matches expectation (建立信心)
        const actualVariety1 = decisions.coffeeVariety - 3;
        const actualCustomers1 = actualVariety1 * 8; // Slightly less than expected
        const actualRevenue1 = actualCustomers1 * 8; // Lower per-customer revenue
        const varietyCost1 = actualVariety1 * 15;
        const promotionCost1 = decisions.promotionBudget;
        const promotionReturn1 = decisions.promotionBudget * 2; // Less than expected

        effects.resources = actualRevenue1 + promotionReturn1 - varietyCost1 - promotionCost1;
        effects.satisfaction = actualVariety1 * 3;
        effects.reputation = decisions.promotionBudget / 60;

        // Warn about complexity if coffee variety is high
        if (decisions.coffeeVariety >= 8) {
          delayedEffects.push({
            turn: 2,
            effect: { satisfaction: -5 },
            description: '选择过多导致顾客决策困难，满意度下降'
          });
        }

        narrative = `第1月：新增${actualVariety1}种咖啡，实际新增顾客${actualCustomers1}位/天（略低于预期），收入${actualRevenue1}元。营销回报率${Math.round(promotionReturn1/promotionCost1*100)}%`;
        break;

      case 2:
        // Turn 2: Problems emerge (问题显现)
        const actualVariety2 = decisions.coffeeVariety - 6;
        const varietyCoordinationCost = actualVariety2 * 20; // Higher coordination cost
        const seatsCost2 = decisions.seats * 50;

        // Diminishing returns kick in
        const actualCustomers2 = actualVariety2 * 5 + decisions.seats * 1.5;
        const actualRevenue2 = actualCustomers2 * 7; // Lower revenue per customer

        effects.resources = actualRevenue2 - varietyCoordinationCost - seatsCost2;
        effects.satisfaction = actualVariety2 - decisions.seats * 0.5; // Satisfaction drops
        effects.reputation = -3; // Reputation suffers from complexity

        // Delayed effects for future turns
        if (decisions.coffeeVariety >= 12 || decisions.seats >= 15) {
          delayedEffects.push({
            turn: 3,
            effect: { satisfaction: -8, resources: -100 },
            description: '供应链复杂度急剧上升，成本增加，品质下降'
          });
        }

        narrative = `第2月：协调成本上升，实际收入${actualRevenue2}元。顾客开始反映选择困难，满意度下降`;
        break;

      case 3:
        // Turn 3: Warning signs (警告信号)
        if (decisions.strategyChoice === 'A') {
          // Continue expansion
          effects.resources = -150; // Loss from expansion
          effects.satisfaction = -10;
          effects.reputation = -5;

          delayedEffects.push({
            turn: 4,
            effect: { satisfaction: -15, resources: -200 },
            description: '扩张导致服务质量严重下降，客户流失'
          });

          narrative = '第3月：扩张策略失败，新店亏损，总店服务质量下滑，资源紧张';
        } else {
          // Stabilize
          effects.resources = 300;
          effects.satisfaction = 10;
          effects.reputation = 5;

          delayedEffects.push({
            turn: 4,
            effect: { satisfaction: 10, resources: 200 },
            description: '优化措施开始生效，运营逐渐稳定'
          });

          narrative = '第3月：稳定运营策略初见成效，客户满意度回升，现金流改善';
        }
        break;

      case 4:
        // Turn 4: Awakening moment (觉醒时刻)
        if (decisions.awakening === 'A') {
          // Recognized the trap
          effects.resources = 200;
          effects.satisfaction = 15;
          effects.reputation = 10;

          delayedEffects.push({
            turn: 5,
            effect: { satisfaction: 20, resources: 400, reputation: 15 },
            description: '系统调整完成，咖啡店重新聚焦核心产品，质量显著提升'
          });

          narrative = '第4月：你决定精简产品线，专注核心咖啡品质。虽然品种减少，但每种都是精品';
        } else {
          // Continue stubborn
          effects.resources = -200;
          effects.satisfaction = -20;
          effects.reputation = -10;

          delayedEffects.push({
            turn: 5,
            effect: { satisfaction: -25, resources: -300, reputation: -20 },
            description: '问题全面爆发：库存积压、品质失控、客户大量流失'
          });

          narrative = '第4月：你继续坚持"更多选择"的策略，但问题已经无法忽视...';
        }
        break;

      case 5:
        // Turn 5: Final ending
        // Based on previous awakening choice
        const lastAwakening = decisionHistory.find(d => d.turn === 4);
        if (lastAwakening && lastAwakening.decision.awakening === 'A') {
          // Victory path
          effects.resources = 500;
          effects.satisfaction = 25;
          effects.reputation = 20;

          narrative = '第5月：精简策略大获成功！咖啡店以优质咖啡和舒适环境赢得口碑，虽然品种不多，但每款都是精品。顾客满意度飙升，盈利稳定。你成功走出了线性思维的陷阱！';
        } else {
          // Failure path
          effects.resources = -400;
          effects.satisfaction = -30;
          effects.reputation = -25;

          narrative = '第5月：问题全面爆发。过多的咖啡品种导致库存积压、品质下降、员工混乱。顾客抱怨"选择太多但都不好喝"。最终，咖啡店不得不大幅缩减规模，几乎破产。线性思维的"越多越好"让你付出了沉重代价。';
        }
        break;
    }

    return { effects, narrative, delayedEffects };
  }

  static applyDelayedEffects(currentTurn, delayedEffects) {
    let state = {
      satisfaction: 0,
      resources: 0,
      reputation: 0
    };

    if (!delayedEffects || delayedEffects.length === 0) {
      return { state, triggered: [] };
    }

    const triggered = [];

    delayedEffects.forEach(effect => {
      if (effect.turn === currentTurn) {
        if (effect.effect.satisfaction) state.satisfaction += effect.effect.satisfaction;
        if (effect.effect.resources) state.resources += effect.effect.resources;
        if (effect.effect.reputation) state.reputation += effect.effect.reputation;
        triggered.push(effect);
      }
    });

    return { state, triggered };
  }

  static generateTurnFeedback(turn, linearExpectation, actualResult, narrative) {
    let feedback = `📊 **第${turn}回合结果**\n\n`;

    feedback += `📖 **情况描述**：\n${narrative}\n\n`;

    feedback += `🧮 **你的线性预期**：\n${linearExpectation.thinking}\n`;
    feedback += `- 期望资源：${Math.round(linearExpectation.resources)}元\n`;
    feedback += `- 期望满意度：${Math.round(linearExpectation.satisfaction)}\n\n`;

    feedback += `🎯 **实际结果**：\n`;
    feedback += `- 实际资源：${Math.round(actualResult.resources)}元 (${actualResult.resources >= linearExpectation.resources ? '+' : ''}${Math.round(actualResult.resources - linearExpectation.resources)})\n`;
    feedback += `- 实际满意度：${Math.round(actualResult.satisfaction)} (${actualResult.satisfaction >= linearExpectation.satisfaction ? '+' : ''}${Math.round(actualResult.satisfaction - linearExpectation.satisfaction)})\n`;

    if (actualResult.resources < linearExpectation.resources - 50) {
      feedback += `\n⚠️ **偏差分析**：实际结果显著低于预期，说明系统中存在你未考虑到的因素（协调成本、边际效应递减、品质下降等）`;
    }

    return feedback;
  }

  // Investment Scenario: Confirmation Bias
  static calculateInvestmentEffects(decisions, currentState) {
    const { research_time = 0, diversification = 0 } = decisions;
    const state = currentState || { portfolio: 10000, knowledge: 0 };

    let effects = {
      portfolio: 0,
      knowledge: 0
    };

    // ✅ DELAYED EFFECT: Research insights take time to materialize
    // Only 30% of knowledge is immediately available
    const immediateKnowledge = Math.round(research_time * 0.3);
    effects.knowledge += immediateKnowledge;

    // Diversification reduces volatility but may limit gains
    const diversificationBonus = Math.round(diversification * 0.01 * 100); // 1% per point
    effects.portfolio += diversificationBonus;

    // Market volatility (random factor)
    const marketChange = (Math.random() - 0.4) * 500; // Slight upward bias
    effects.portfolio += Math.round(marketChange);

    // Confirmation bias: If you research too much, you might miss opportunities
    if (research_time > 50) {
      const analysisParalysis = Math.round((research_time - 50) * 2);
      effects.portfolio -= analysisParalysis; // Lost opportunities
    }

    // ✅ DELAYED EFFECTS: Research insights emerge over time
    const delayedEffects = [];

    // Research knowledge: 70% distributed over next 3 turns
    if (research_time > 0) {
      const totalKnowledgeBonus = Math.round(Math.log(research_time + 1) * 5);
      const remainingKnowledge = totalKnowledgeBonus - immediateKnowledge;

      for (let i = 1; i <= 3; i++) {
        delayedEffects.push({
          type: 'research_insight',
          turn_delay: i,
          knowledge: Math.round(remainingKnowledge * 0.23),
          description: `研究发现在第${i}回合后产生新洞察`
        });
      }
    }

    // Confirmation bias: Opportunity costs accumulate over time
    if (research_time > 50) {
      delayedEffects.push({
        type: 'missed_opportunity',
        turn_delay: 2,
        portfolio: -200,
        description: '过度研究导致错过市场机会，2回合后显现损失'
      });
    }

    // Diversification benefits also delayed (reduces volatility over time)
    if (diversification > 30) {
      delayedEffects.push({
        type: 'risk_reduction',
        turn_delay: 2,
        portfolio: Math.round(diversification * 0.5),
        description: '多样化投资在2回合后降低风险，稳定收益'
      });
    }

    return { effects, delayedEffects };
  }

  static getInvestmentLinearExpectation(decisions, currentState) {
    const { research_time = 0, diversification = 0 } = decisions;
    const state = currentState || { portfolio: 10000, knowledge: 0 };

    // ✅ FIXED: Based on current state, not initial values
    return {
      portfolio: state.portfolio + (research_time * 10) + (diversification * 20),
      knowledge: state.knowledge + research_time,
      thinking: `从当前投资组合${state.portfolio}元，研究${research_time}小时，期望收益提升${research_time * 10}元；多样化${diversification}%，期望额外收益${diversification * 20}元`
    };
  }

  static getInvestmentActualResult(effects, currentState) {
    const state = currentState || { portfolio: 10000, knowledge: 0 };

    return {
      portfolio: state.portfolio + effects.portfolio,
      knowledge: state.knowledge + effects.knowledge,
      changes: effects
    };
  }

  // Relationship Scenario: Time Delay Bias
  static calculateRelationshipEffects(decisions, currentState) {
    const { time_investment = 0, communication_effort = 0 } = decisions;
    const state = currentState || { satisfaction: 50, trust: 50 };

    let effects = {
      satisfaction: 0,
      trust: 0
    };

    // ✅ DELAYED EFFECT: Relationship investments take significant time to materialize
    // Only 20% of time investment shows immediate effect
    const immediateTimeEffect = Math.round(time_investment * 0.2);
    effects.satisfaction += immediateTimeEffect;

    // Communication effort has immediate but diminishing impact
    effects.trust += Math.round(Math.min(communication_effort * 0.5, 10));

    // Over-investment can backfire (smothering)
    if (time_investment > 80 && communication_effort > 80) {
      const smothering = -10;
      effects.satisfaction += smothering;
      effects.trust += smothering;
    }

    // Random relationship events
    if (Math.random() < 0.15) {
      const events = [
        { satisfaction: 5, trust: 5, reason: '意外惊喜' },
        { satisfaction: -5, trust: -3, reason: '小争执' },
        { satisfaction: 8, trust: 10, reason: '共同经历' }
      ];
      const event = events[Math.floor(Math.random() * events.length)];
      effects.satisfaction += event.satisfaction;
      effects.trust += event.trust;
    }

    // ✅ DELAYED EFFECTS: Relationship building is a long-term process
    const delayedEffects = [];

    // Time investment: 80% distributed over next 5 turns (relationships are slow!)
    if (time_investment > 0) {
      const totalExpectedEffect = Math.round(time_investment * 0.5);
      const immediateEffect = immediateTimeEffect;
      const remainingEffect = totalExpectedEffect - immediateEffect;

      for (let i = 1; i <= 5; i++) {
        delayedEffects.push({
          type: 'relationship_building',
          turn_delay: i,
          satisfaction: Math.round(remainingEffect * 0.16),  // 80% over 5 turns
          description: `关系投入在第${i}回合后逐步显现效果`
        });
      }
    }

    // Communication effort builds trust over time (not instant!)
    if (communication_effort > 30) {
      const trustBonus = Math.round(communication_effort * 0.3);
      delayedEffects.push({
        type: 'trust_building',
        turn_delay: 2,
        trust: trustBonus,
        description: '真诚沟通在2回合后建立深度信任'
      });
    }

    // Over-investment smothering effect is delayed (doesn't show immediately)
    if (time_investment > 80 && communication_effort > 80) {
      delayedEffects.push({
        type: 'smothering',
        turn_delay: 3,
        satisfaction: -15,
        trust: -15,
        description: '过度投入在第3回合后产生窒息感，对方需要空间'
      });
    }

    // Small investments may not show effects until later (threshold effect)
    if (time_investment > 0 && time_investment < 30) {
      delayedEffects.push({
        type: 'small_investment_accumulation',
        turn_delay: 4,
        satisfaction: Math.round(time_investment * 0.3),
        description: '小投入在第4回合后开始累积显现效果'
      });
    }

    return { effects, delayedEffects };
  }

  static getRelationshipLinearExpectation(decisions, currentState) {
    const { time_investment = 0, communication_effort = 0 } = decisions;
    const state = currentState || { satisfaction: 50, trust: 50 };

    // ✅ FIXED: Based on current state, not initial values
    return {
      satisfaction: state.satisfaction + time_investment * 0.5,
      trust: state.trust + communication_effort * 0.5,
      thinking: `从当前满意度${state.satisfaction}，投入${time_investment}分钟，期望满意度提升${Math.round(time_investment * 0.5)}点，达到${Math.round(state.satisfaction + time_investment * 0.5)}；从当前信任${state.trust}，沟通努力${communication_effort}%，期望信任提升${Math.round(communication_effort * 0.5)}点，达到${Math.round(state.trust + communication_effort * 0.5)}`
    };
  }

  static getRelationshipActualResult(effects, currentState) {
    const state = currentState || { satisfaction: 50, trust: 50 };

    return {
      satisfaction: state.satisfaction + effects.satisfaction,
      trust: state.trust + effects.trust,
      changes: effects
    };
  }

  // Generate cognitive bias feedback
  static generateCognitiveFeedback(scenarioId, linearExpectation, actualResult) {
    let detectedBias = '';
    let explanation = '';
    let suggestion = '';

    if (scenarioId === 'coffee-shop-linear-thinking') {
      detectedBias = '线性思维陷阱';
      explanation = this.getCoffeeShopBiasExplanation(linearExpectation, actualResult);
      suggestion = '在复杂系统中，投入和产出往往不是简单的线性关系。考虑：边际效应递减（每增加一份投入，收益递减）、协同成本（人多了反而混乱）、时间延迟（营销效果需要时间显现）。';
    } else if (scenarioId === 'investment-confirmation-bias') {
      detectedBias = '确认偏误';
      explanation = this.getInvestmentBiasExplanation(linearExpectation, actualResult);
      suggestion = '投资中要避免只寻找支持自己观点的信息。过度研究可能导致"分析瘫痪"，错过最佳时机。接受不确定性，适度分散风险。';
    } else if (scenarioId === 'relationship-time-delay') {
      detectedBias = '时间延迟偏差';
      explanation = this.getRelationshipBiasExplanation(linearExpectation, actualResult);
      suggestion = '关系中的投入和回报不是即时的。今天的投入可能在几周后才显现效果。也要避免过度投入造成的窒息感。平衡是关键。';
    }

    return { detectedBias, explanation, suggestion };
  }

  static getCoffeeShopBiasExplanation(linear, actual) {
    const satisfactionGap = linear.satisfaction - actual.satisfaction;
    const resourceGap = linear.resources - actual.resources;

    if (Math.abs(satisfactionGap) > 15) {
      return `你期望满意度达到${linear.satisfaction}，但实际是${actual.satisfaction}。差距${satisfactionGap > 0 ? satisfactionGap : -satisfactionGap}点。这是因为服务质量提升有边际递减效应，且员工过多可能造成协调混乱。`;
    }
    if (Math.abs(resourceGap) > 500) {
      return `你期望剩余资源${linear.resources}，但实际是${actual.resources}。差距${resourceGap > 0 ? resourceGap : -resourceGap}。成本不仅仅是工资，还有协调成本、随机事件等隐性支出。`;
    }
    return `你的线性期望是：${linear.thinking}。但复杂系统中有许多非线性因素在起作用：边际递减、协同成本、随机事件。`;
  }

  static getInvestmentBiasExplanation(linear, actual) {
    const portfolioGap = linear.portfolio - actual.portfolio;

    if (Math.abs(portfolioGap) > 500) {
      return `你期望投资组合价值${linear.portfolio}，但实际是${actual.portfolio}。差距${portfolioGap > 0 ? portfolioGap : -portfolioGap}元。这是因为市场有波动性，过度研究可能让你错过机会，且多样化虽然降低风险但也限制了收益。`;
    }
    return `你的线性期望是：${linear.thinking}。但投资中存在确认偏误：我们倾向于寻找支持自己观点的信息，忽视反面证据。`;
  }

  static getRelationshipBiasExplanation(linear, actual) {
    const satisfactionGap = linear.satisfaction - actual.satisfaction;

    if (Math.abs(satisfactionGap) > 10) {
      return `你期望满意度${linear.satisfaction}，但实际是${actual.satisfaction}。差距${satisfactionGap > 0 ? satisfactionGap : -satisfactionGap}点。这是因为关系投入有时间延迟效应，且过度投入可能适得其反。`;
    }
    return `你的线性期望是：${linear.thinking}。但关系中存在时间延迟：今天的投入可能几周后才见效，且即时沟通不如持续稳定的陪伴重要。`;
  }
}

// Game Manager with difficulty support
class GameManager {
  /**
   * Get the correct initial state for each scenario
   * ✅ FIXED: Each scenario has its own state variables
   */
  static getInitialStateForScenario(scenarioId) {
    const scenarios = {
      'coffee-shop-linear-thinking': {
        satisfaction: 50,
        resources: 1000,
        reputation: 50,
        turn_number: 1
      },
      'investment-confirmation-bias': {
        portfolio: 10000,
        knowledge: 0,
        turn_number: 1
      },
      'relationship-time-delay': {
        satisfaction: 50,
        trust: 50,
        turn_number: 1
      }
    };

    return scenarios[scenarioId] || {
      satisfaction: 50,
      resources: 1000,
      reputation: 50,
      turn_number: 1
    };
  }

  static async startScenario(scenarioId) {
    console.log('Starting scenario:', scenarioId);

    // Check if this is a turn-based scenario
    if (scenarioId === 'coffee-shop-linear-thinking') {
      this.startCoffeeShopGame();
      return;
    }

    // Get the selected difficulty from user preferences
    const difficulty = AppState.userPreferences.difficulty;

    try {
      // Update state with current scenario and difficulty
      AppState.currentScenario = scenarioId;

      // Initialize game session with fallback BEFORE showing modal
      // This ensures tests can access gameSession immediately
      const initialState = this.getInitialStateForScenario(scenarioId);

      AppState.gameSession = {
        gameId: 'pending-' + Date.now(),
        scenarioId: scenarioId,
        difficulty: difficulty,
        status: 'initializing',
        gameState: initialState,  // ✅ Add initial state
        decision_history: [],  // ✅ Track all decisions across turns
        delayed_effects: [],   // ✅ Track time-delayed consequences
        patterns: []           // ✅ Identify decision patterns
      };

      // Show game modal immediately to give feedback to user
      this.showGameModal();

      // Create game session with difficulty parameter (try API first, fallback to static)
      try {
        // Attempt to create game session via API with shorter timeout for tests
        const sessionData = await Promise.race([
          ApiService.scenarios.createGameSession(scenarioId, difficulty),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('API timeout after 5 seconds')), 5000)
          )
        ]);

        // Merge API response with existing gameSession to preserve gameId
        // Handle both snake_case (API) and camelCase (JS) property names
        if (sessionData) {
          AppState.gameSession = {
            gameId: sessionData.gameId || sessionData.game_id || AppState.gameSession.gameId,
            scenarioId: sessionData.scenarioId || sessionData.scenario_id || scenarioId,
            difficulty: sessionData.difficulty || difficulty,
            status: 'active',
            gameState: sessionData.gameState || sessionData.game_state || AppState.gameSession.gameState,
            decision_history: AppState.gameSession.decision_history || [],  // ✅ Preserve history
            delayed_effects: AppState.gameSession.delayed_effects || [],    // ✅ Preserve delayed effects
            patterns: AppState.gameSession.patterns || []                    // ✅ Preserve patterns
          };
        }

        console.log('Created game session via API:', sessionData);
        console.log('Merged gameSession:', AppState.gameSession);
      } catch (apiError) {
        // Fallback to static content if API fails
        console.warn('API call failed, using static content:', apiError);

        // ✅ Set correct initial state based on scenario
        const initialState = this.getInitialStateForScenario(scenarioId);

        AppState.gameSession = {
          gameId: 'static-' + Date.now(),
          scenarioId: scenarioId,
          difficulty: difficulty,
          status: 'static',
          gameState: initialState,
          decision_history: [],  // ✅ Track decisions even in static mode
          delayed_effects: [],   // ✅ Track delayed effects
          patterns: []           // ✅ Track patterns
        };
        this.loadStaticGameContent(scenarioId);
        return;
      }

      // Load dynamic game content
      await this.loadGameContent(scenarioId);
    } catch (error) {
      console.error('Failed to start scenario:', error);
      ToastManager.show('启动挑战失败', 'error', '游戏错误');

      // Ensure gameSession exists even on error
      if (!AppState.gameSession) {
        AppState.gameSession = {
          gameId: 'fallback-' + Date.now(),
          scenarioId: scenarioId,
          difficulty: difficulty,
          status: 'error'
        };
      }

      // Fallback to static content
      this.loadStaticGameContent(scenarioId);
    }
  }

  static async loadStaticGameContent(scenarioId) {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    try {
      // Special handling for turn-based scenarios with PageRouter
      if (scenarioId === 'coffee-shop-linear-thinking') {
        GameManager.startCoffeeShopGame();
        return;
      } else if (scenarioId === 'relationship-time-delay') {
        GameManager.startRelationshipTimeDelayGame();
        return;
      }

      // Try to get scenario data from mock scenarios
      const scenarios = NavigationManager.getMockScenarios();
      const scenario = scenarios.find(s => s.id === scenarioId);

      if (scenario) {
        // Use scenario-specific UI with mock data
        gameContainer.innerHTML = this.generateScenarioUI(scenarioId, scenario);
        this.initializeGameControls(scenarioId);

        // ✅ FIXED: Use scenario-specific initial state
        const initialState = this.getInitialStateForScenario(scenarioId);
        this.updateGameState(initialState);
        this.updateGameStateUI(initialState);
        console.log('Static mode: Initial state set:', initialState);
      } else {
        console.warn('Scenario not found in mock data, using generic fallback:', scenarioId);
        gameContainer.innerHTML = this.getMockGameContent(scenarioId);
      }
    } catch (error) {
      console.error('Failed to load static game content:', error);
      gameContainer.innerHTML = '<div class="error">场景内容加载失败</div>';
    }
  }

  static async loadGameContent(scenarioId) {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    try {
      const scenario = await ApiService.scenarios.getById(scenarioId);
      // Generate scenario-specific UI
      gameContainer.innerHTML = this.generateScenarioUI(scenarioId, scenario);
      this.initializeGameControls(scenarioId);

      // ✅ FIXED: Update UI with initial game state from API
      if (AppState.gameSession && AppState.gameSession.gameState) {
        this.updateGameStateUI(AppState.gameSession.gameState);
        console.log('Initial game state UI updated:', AppState.gameSession.gameState);
      }
    } catch (error) {
      console.warn('API调用失败，使用基于scenarioId的mock内容:', error);
      gameContainer.innerHTML = this.getMockGameContent(scenarioId);
    }
  }

  static generateScenarioUI(scenarioId, scenario) {
    // Generate different UI based on scenario type
    if (scenarioId === 'coffee-shop-linear-thinking') {
      return this.generateCoffeeShopUI(scenario);
    } else if (scenarioId === 'investment-confirmation-bias') {
      return this.generateInvestmentUI(scenario);
    } else if (scenarioId === 'relationship-time-delay') {
      return this.generateRelationshipUI(scenario);
    } else if (scenarioId.startsWith('game-')) {
      return this.generateGameScenarioUI(scenarioId, scenario);
    } else {
      return this.generateGenericScenarioUI(scenario);
    }
  }

  static generateCoffeeShopUI(scenario) {
    return `
      <div class="game-header">
        <h2>${scenario.name}</h2>
        <div class="game-meta">
          <span class="difficulty-badge ${scenario.difficulty}">${scenario.difficulty} 难度</span>
          <span class="scenario-category">${scenario.category}</span>
        </div>
      </div>

      <div class="game-content">
        <div class="scenario-description">
          <p>${scenario.fullDescription}</p>
        </div>

        <div class="game-state" id="game-state-display">
          <h3>当前状态</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="state-label">满意度</span>
              <span class="state-value" id="state-satisfaction">50</span>
            </div>
            <div class="state-item">
              <span class="state-label">资源</span>
              <span class="state-value" id="state-resources">1000</span>
            </div>
            <div class="state-item">
              <span class="state-label">声誉</span>
              <span class="state-value" id="state-reputation">50</span>
            </div>
          </div>
        </div>

        <div class="game-controls">
          <h3>经营决策</h3>

          <div class="control-group">
            <label for="staff-count">
              <strong>员工数量</strong>
              <span class="control-hint">当前: <span id="staff-value">0</span> 人</span>
            </label>
            <input type="range" id="staff-count" class="game-slider" min="0" max="3" value="0">
            <div class="slider-labels">
              <span>0</span>
              <span>2</span>
              <span>3</span>
            </div>
          </div>

          <div class="control-group">
            <label for="marketing-budget">
              <strong>营销投入</strong>
              <span class="control-hint">当前: <span id="marketing-value">0</span> 元</span>
            </label>
            <input type="range" id="marketing-budget" class="game-slider" min="0" max="500" value="0" step="50">
            <div class="slider-labels">
              <span>0</span>
              <span>250</span>
              <span>500</span>
            </div>
          </div>

          <div class="turn-info">
            <span class="turn-number">回合: <span id="current-turn">1</span></span>
          </div>

          <button class="btn btn-primary btn-large" id="submit-decision">
            提交决策
          </button>
        </div>

        <div id="feedback-display" class="feedback-section"></div>
      </div>

      <div class="game-actions">
        <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
        <button class="btn btn-tertiary" onclick="GameManager.hideGameModal()">关闭</button>
      </div>
    `;
  }

  static generateInvestmentUI(scenario) {
    return `
      <div class="game-header">
        <h2>${scenario.name}</h2>
        <div class="game-meta">
          <span class="difficulty-badge ${scenario.difficulty}">${scenario.difficulty} 难度</span>
          <span class="scenario-category">${scenario.category}</span>
        </div>
      </div>

      <div class="game-content">
        <div class="scenario-description">
          <p>${scenario.fullDescription}</p>
        </div>

        <div class="game-state" id="game-state-display">
          <h3>当前状态</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="state-label">投资组合</span>
              <span class="state-value" id="state-portfolio">10000</span>
            </div>
            <div class="state-item">
              <span class="state-label">知识</span>
              <span class="state-value" id="state-knowledge">0</span>
            </div>
          </div>
        </div>

        <div class="game-controls">
          <h3>投资决策</h3>

          <div class="control-group">
            <label for="research-time">
              <strong>研究时间</strong>
              <span class="control-hint">当前: <span id="research-value">0</span> 小时</span>
            </label>
            <input type="range" id="research-time" class="game-slider" min="0" max="100" value="0">
            <div class="slider-labels">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <div class="control-group">
            <label for="investment-diversification">
              <strong>投资多样化</strong>
              <span class="control-hint">当前: <span id="diversification-value">0</span>%</span>
            </label>
            <input type="range" id="investment-diversification" class="game-slider" min="0" max="100" value="0">
            <div class="slider-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div class="turn-info">
            <span class="turn-number">回合: <span id="current-turn">1</span></span>
          </div>

          <button class="btn btn-primary btn-large" id="submit-decision">
            提交决策
          </button>
        </div>

        <div id="feedback-display" class="feedback-section"></div>
      </div>

      <div class="game-actions">
        <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
        <button class="btn btn-tertiary" onclick="GameManager.hideGameModal()">关闭</button>
      </div>
    `;
  }

  static generateRelationshipUI(scenario) {
    // This is now just a placeholder - the actual UI is rendered by RelationshipTimeDelayPageRouter
    // Return a container that will be populated by the page router
    return `
      <div id="game-container-inner" class="relationship-game-container">
        <div class="loading">正在加载恋爱关系时间延迟场景...</div>
      </div>
    `;
  }

  static generateGameScenarioUI(scenarioId, scenario) {
    return `
      <div class="game-header">
        <h2>${scenario.name}</h2>
        <div class="game-meta">
          <span class="difficulty-badge ${scenario.difficulty}">${scenario.difficulty} 难度</span>
          <span class="scenario-category">${scenario.category || '商业决策'}</span>
        </div>
      </div>

      <div class="game-content">
        <div class="scenario-description">
          <p>${scenario.fullDescription}</p>
        </div>

        <div class="game-state" id="game-state-display">
          <h3>当前状态</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="state-label">满意度</span>
              <span class="state-value" id="state-satisfaction">50</span>
            </div>
            <div class="state-item">
              <span class="state-label">资源</span>
              <span class="state-value" id="state-resources">1000</span>
            </div>
            <div class="state-item">
              <span class="state-label">声誉</span>
              <span class="state-value" id="state-reputation">50</span>
            </div>
          </div>
        </div>

        <div class="game-controls">
          <h3>决策选项</h3>
          <div id="decision-options">
            <p>请选择您的决策策略...</p>
          </div>

          <div class="turn-info">
            <span class="turn-number">回合: <span id="current-turn">1</span></span>
          </div>

          <button class="btn btn-primary btn-large" id="submit-decision">
            提交决策
          </button>
        </div>

        <div id="feedback-display" class="feedback-section"></div>
      </div>

      <div class="game-actions">
        <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
        <button class="btn btn-tertiary" onclick="GameManager.hideGameModal()">关闭</button>
      </div>
    `;
  }

  static generateGenericScenarioUI(scenario) {
    return this.generateGameScenarioUI(scenario.id, scenario);
  }

  static initializeGameControls(scenarioId) {
    // Initialize slider value displays
    const sliders = document.querySelectorAll('.game-slider');
    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const valueDisplay = document.getElementById(e.target.id.replace('-', '-value'));
        if (valueDisplay) {
          valueDisplay.textContent = e.target.value;
        }
      });
    });

    // Bind submit button
    const submitBtn = document.getElementById('submit-decision');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitDecision(scenarioId));
    }
  }

  static async submitDecision(scenarioId) {
    console.log('Submitting decision for scenario:', scenarioId);

    // Check if game session exists
    if (!AppState.gameSession) {
      console.error('No active game session');
      this.displayError('游戏会话未创建，请重新开始场景');
      return;
    }

    console.log('Game session:', AppState.gameSession);

    // Read decision values based on scenario type
    let decision = {};

    if (scenarioId === 'coffee-shop-linear-thinking') {
      // Coffee shop scenario controls
      const staffCount = document.getElementById('staff-count');
      const marketingBudget = document.getElementById('marketing-budget');

      decision = {
        action: 'manage_business',
        staff_count: parseInt(staffCount?.value || 0),
        marketing_investment: parseInt(marketingBudget?.value || 0)
      };

    } else if (scenarioId === 'investment-confirmation-bias') {
      // Investment scenario controls
      const researchTime = document.getElementById('research-time');
      const diversification = document.getElementById('investment-diversification');

      decision = {
        action: 'make_investment',
        research_time: parseInt(researchTime?.value || 0),
        diversification: parseInt(diversification?.value || 0)
      };

    } else if (scenarioId === 'relationship-time-delay') {
      // Relationship scenario controls
      const timeInvestment = document.getElementById('time-investment');
      const communicationEffort = document.getElementById('communication-effort');

      decision = {
        action: 'invest_time',
        time_investment: parseInt(timeInvestment?.value || 0),
        communication_effort: parseInt(communicationEffort?.value || 0)
      };

    } else if (scenarioId.startsWith('game-')) {
      // game-XXX scenarios use option selection
      const selectedOption = document.querySelector('.option-btn.selected');
      if (selectedOption) {
        decision = {
          option: selectedOption.dataset.option || '1'
        };
      }
    }

    console.log('Decision data:', decision);

    // Show loading state
    const submitBtn = document.getElementById('submit-decision');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '提交中...';
    }

    // Ensure button is re-enabled even if errors occur
    const reEnableButton = () => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '提交决策';
      }
    };

    try {
      // ✅ Get current game state (no hardcoded fallback)
      const currentState = AppState.gameSession?.gameState;

      if (!currentState) {
        throw new Error('Game session not initialized properly');
      }

      console.log('Current game state:', currentState);

      // ✅ Apply delayed effects from previous turns first
      const existingDelayedEffects = AppState.gameSession?.delayed_effects || [];
      const { effectsToApply: delayedEffectsToApply, remainingEffects } =
        DecisionEngine.applyDelayedEffects(existingDelayedEffects, currentState.turn_number);

      console.log('Delayed effects to apply:', delayedEffectsToApply);
      console.log('Remaining delayed effects:', remainingEffects);

      // Use Decision Engine to calculate real consequences
      const { effects, linearExpectation, actualResult, delayedEffects: newDelayedEffects } =
        DecisionEngine.calculateDecisionEffects(
          scenarioId,
          decision,
          currentState
        );

      console.log('Decision effects calculated:', effects);
      console.log('Linear expectation:', linearExpectation);
      console.log('Actual result:', actualResult);
      console.log('New delayed effects:', newDelayedEffects);

      // Generate cognitive bias feedback
      const cognitiveFeedback = DecisionEngine.generateCognitiveFeedback(
        scenarioId,
        linearExpectation,
        actualResult
      );

      console.log('Cognitive feedback:', cognitiveFeedback);

      // ✅ Merge current effects with delayed effects from previous turns
      const mergedEffects = {
        satisfaction: (effects.satisfaction || 0) + (delayedEffectsToApply.satisfaction || 0),
        resources: (effects.resources || 0) + (delayedEffectsToApply.resources || 0),
        reputation: (effects.reputation || 0) + (delayedEffectsToApply.reputation || 0),
        trust: (effects.trust || 0) + (delayedEffectsToApply.trust || 0),
        portfolio: (effects.portfolio || 0) + (delayedEffectsToApply.portfolio || 0),
        knowledge: (effects.knowledge || 0) + (delayedEffectsToApply.knowledge || 0)
      };

      console.log('Merged effects (current + delayed):', mergedEffects);

      // Calculate new game state with merged effects
      // Only update fields that exist in current state to avoid NaN
      const newGameState = {
        ...currentState,
        turn_number: (currentState.turn_number || 1) + 1
      };

      // Coffee shop variables - only update if they exist in current state
      if (currentState.satisfaction !== undefined) {
        newGameState.satisfaction = currentState.satisfaction + mergedEffects.satisfaction;
      }
      if (currentState.resources !== undefined) {
        newGameState.resources = currentState.resources + mergedEffects.resources;
      }
      if (currentState.reputation !== undefined) {
        newGameState.reputation = currentState.reputation + mergedEffects.reputation;
      }

      // Relationship scenario variable
      if (currentState.trust !== undefined) {
        newGameState.trust = currentState.trust + mergedEffects.trust;
      }

      // Investment scenario variables
      if (currentState.portfolio !== undefined) {
        newGameState.portfolio = currentState.portfolio + mergedEffects.portfolio;
      }
      if (currentState.knowledge !== undefined) {
        newGameState.knowledge = currentState.knowledge + mergedEffects.knowledge;
      }

      // Ensure values don't go below 0
      Object.keys(newGameState).forEach(key => {
        if (typeof newGameState[key] === 'number' && key !== 'turn_number') {
          newGameState[key] = Math.max(0, newGameState[key]);
        }
      });

      console.log('New game state:', newGameState);

      // ✅ Check if game should end
      const gameOverCheck = DecisionEngine.checkGameOver(
        scenarioId,
        newGameState,
        AppState.gameSession?.decision_history || []
      );

      console.log('Game over check:', gameOverCheck);

      // Update session state
      if (AppState.gameSession) {
        // ✅ Record this decision in history before updating state
        const decisionRecord = {
          turn: currentState.turn_number || 1,
          decision: { ...decision },
          state_before: { ...currentState },
          effects: { ...mergedEffects },  // ✅ Record merged effects
          delayed_effects_applied: { ...delayedEffectsToApply },
          state_after: { ...newGameState },
          linear_expectation: { ...linearExpectation },
          actual_result: { ...actualResult },
          cognitive_bias: cognitiveFeedback.detectedBias,
          timestamp: Date.now()
        };

        // Ensure decision_history exists
        if (!AppState.gameSession.decision_history) {
          AppState.gameSession.decision_history = [];
        }

        AppState.gameSession.decision_history.push(decisionRecord);
        console.log('Decision recorded in history:', decisionRecord);

        // ✅ Update delayed effects queue
        AppState.gameSession.delayed_effects = [
          ...remainingEffects,
          ...(newDelayedEffects || [])
        ];
        console.log('Updated delayed effects queue:', AppState.gameSession.delayed_effects);

        AppState.gameSession.gameState = newGameState;
      }

      // Build result object
      const result = {
        feedback: this.buildDecisionFeedback(decision, effects, currentState, newGameState),
        game_state: newGameState,
        cognitive_analysis: cognitiveFeedback,
        linear_expectation: linearExpectation,
        actual_result: actualResult,
        game_over: gameOverCheck.is_over,
        game_over_data: gameOverCheck.is_over ? gameOverCheck : null
      };

      // Display feedback (handles game-over if needed)
      this.displayFeedback(result);

      // If game is over, update UI to show final state
      if (gameOverCheck.is_over) {
        console.log('Game over:', gameOverCheck);
        this.handleGameOver(gameOverCheck);
        return;
      }

      // Update UI state displays
      this.updateGameStateUI(newGameState);

      // Update turn counter
      const turnDisplay = document.getElementById('current-turn');
      if (turnDisplay) {
        turnDisplay.textContent = newGameState.turn_number;
      }

      console.log('Decision submitted successfully with real calculations');

    } catch (error) {
      console.error('Failed to submit decision:', error);

      // Show error feedback
      this.displayError('决策处理失败: ' + error.message);
    } finally {
      // Always re-enable button
      reEnableButton();
    }
  }

  // Build detailed feedback message
  static buildDecisionFeedback(decision, effects, oldState, newState) {
    let feedbackParts = [];

    // Describe what happened
    feedbackParts.push('决策已执行，系统正在响应你的选择...');

    // Show specific changes
    if (effects.satisfaction !== 0) {
      const change = effects.satisfaction > 0 ? '+' : '';
      feedbackParts.push(`满意度: ${oldState.satisfaction} → ${newState.satisfaction} (${change}${effects.satisfaction})`);
    }

    if (effects.resources !== 0 && newState.resources !== undefined) {
      const change = effects.resources > 0 ? '+' : '';
      feedbackParts.push(`资源: ${oldState.resources || 1000} → ${newState.resources} (${change}${effects.resources})`);
    }

    if (effects.reputation !== 0 && newState.reputation !== undefined) {
      const change = effects.reputation > 0 ? '+' : '';
      feedbackParts.push(`声誉: ${oldState.reputation} → ${newState.reputation} (${change}${effects.reputation})`);
    }

    if (effects.trust !== 0 && newState.trust !== undefined) {
      const change = effects.trust > 0 ? '+' : '';
      feedbackParts.push(`信任: ${oldState.trust} → ${newState.trust} (${change}${effects.trust})`);
    }

    if (effects.portfolio !== 0 && newState.portfolio !== undefined) {
      const change = effects.portfolio > 0 ? '+' : '';
      feedbackParts.push(`投资组合: ${oldState.portfolio} → ${newState.portfolio} (${change}${effects.portfolio})`);
    }

    if (effects.knowledge !== 0 && newState.knowledge !== undefined) {
      const change = effects.knowledge > 0 ? '+' : '';
      feedbackParts.push(`知识: ${oldState.knowledge} → ${newState.knowledge} (${change}${effects.knowledge})`);
    }

    return feedbackParts.join('\n');
  }

  // Update UI state displays
  static updateGameStateUI(gameState) {
    // Coffee shop scenario
    if (gameState.satisfaction !== undefined) {
      const satisfactionEl = document.getElementById('state-satisfaction');
      if (satisfactionEl) satisfactionEl.textContent = gameState.satisfaction;
    }

    if (gameState.resources !== undefined) {
      const resourcesEl = document.getElementById('state-resources');
      if (resourcesEl) resourcesEl.textContent = gameState.resources;
    }

    if (gameState.reputation !== undefined) {
      const reputationEl = document.getElementById('state-reputation');
      if (reputationEl) reputationEl.textContent = gameState.reputation;
    }

    // Investment scenario
    if (gameState.portfolio !== undefined) {
      const portfolioEl = document.getElementById('state-portfolio');
      if (portfolioEl) portfolioEl.textContent = gameState.portfolio;
    }

    if (gameState.knowledge !== undefined) {
      const knowledgeEl = document.getElementById('state-knowledge');
      if (knowledgeEl) knowledgeEl.textContent = gameState.knowledge;
    }

    // Relationship scenario
    if (gameState.trust !== undefined) {
      const trustEl = document.getElementById('state-trust');
      if (trustEl) trustEl.textContent = gameState.trust;
    }
  }

  // ✅ Handle game over scenarios
  static handleGameOver(gameOverData) {
    const feedbackDisplay = document.getElementById('feedback-display');
    if (!feedbackDisplay) return;

    // Disable submit button
    const submitBtn = document.getElementById('submit-decision');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '游戏结束';
    }

    // Display game-over message with analysis
    const gameOverHTML = `
      <div class="game-over-feedback ${gameOverData.result}">
        <h3>${gameOverData.message}</h3>
        <div class="final-analysis">
          ${gameOverData.analysis.replace(/\n/g, '<br>')}
        </div>
        <div class="game-over-actions">
          <button class="btn btn-primary" onclick="GameManager.restartScenario()">再来一局</button>
          <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">选择其他场景</button>
        </div>
      </div>
    `;

    feedbackDisplay.innerHTML = gameOverHTML;

    // Scroll to feedback
    feedbackDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Restart the current scenario
  static restartScenario() {
    if (AppState.currentScenario) {
      // Reset game session
      AppState.gameSession = null;
      // Start fresh
      this.startScenario(AppState.currentScenario);
    }
  }

  static displayFeedback(result) {
    const feedbackDisplay = document.getElementById('feedback-display');
    if (!feedbackDisplay) {
      console.warn('Feedback display element not found');
      return;
    }

    const feedback = result.feedback || '决策已提交';
    const gameState = result.game_state || {};
    const cognitiveAnalysis = result.cognitive_analysis;
    const linearExpectation = result.linear_expectation;
    const actualResult = result.actual_result;

    let feedbackHTML = `
      <div class="feedback-content game-feedback">
        <h4>📊 决策反馈</h4>
        <div class="feedback-message">
          ${feedback.replace(/\n/g, '<br>')}
        </div>
    `;

    // Add linear expectation vs actual result comparison
    if (linearExpectation && actualResult) {
      feedbackHTML += `
        <div class="expectation-vs-reality">
          <h5>🎯 期望 vs 现实</h5>
          <div class="comparison">
            <div class="expectation">
              <strong>你的线性思维期待:</strong>
              <p>${linearExpectation.thinking || '简单线性关系'}</p>
            </div>
            <div class="reality">
              <strong>复杂系统的实际结果:</strong>
              <p>系统中还有许多你看不到的因素在起作用...</p>
            </div>
          </div>
        </div>
      `;
    }

    // Add cognitive analysis if available
    if (cognitiveAnalysis) {
      feedbackHTML += `
        <div class="cognitive-analysis">
          <h5>🧠 认知偏误分析</h5>
          <div class="bias-detected">
            <strong>检测到的偏误:</strong>
            <span class="bias-name">${cognitiveAnalysis.detected_bias || '无'}</span>
          </div>
          <div class="bias-explanation">
            <strong>解释:</strong>
            <p>${cognitiveAnalysis.explanation || ''}</p>
          </div>
          <div class="bias-suggestion">
            <strong>💡 建议:</strong>
            <p>${cognitiveAnalysis.suggestion || ''}</p>
          </div>
        </div>
      `;
    }

    feedbackHTML += `</div>`;
    feedbackDisplay.innerHTML = feedbackHTML;
    feedbackDisplay.className = 'feedback-section feedback game-feedback'; // Add classes for tests

    // Make feedback visible with animation
    feedbackDisplay.style.display = 'block';
    feedbackDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    console.log('Feedback displayed with cognitive analysis');
  }

  static displayError(message) {
    const feedbackDisplay = document.getElementById('feedback-display');
    if (!feedbackDisplay) return;

    feedbackDisplay.innerHTML = `
      <div class="feedback-content error game-feedback">
        <h4>错误</h4>
        <p>${message}</p>
      </div>
    `;
    feedbackDisplay.className = 'feedback-section feedback game-feedback error';
    feedbackDisplay.style.display = 'block';
  }

  static showGameModal() {
    const modal = document.getElementById('game-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      console.log('Game modal shown');
    }
  }

  static hideGameModal() {
    const modal = document.getElementById('game-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
      console.log('Game modal hidden');
    }

    AppState.gameSession = null;
  }

  static async executeGameTurn(decisions) {
    if (!AppState.gameSession) {
      throw new Error('No active game session');
    }

    try {
      const result = await ApiService.games.executeTurn(
        AppState.gameSession.gameId,
        decisions
      );

      // Update game state
      this.updateGameState(result);

      return result;
    } catch (error) {
      console.error('Game turn execution failed:', error);
      ToastManager.show('决策执行失败', 'error', '游戏错误');
      throw error;
    }
  }

  static updateGameState(newState) {
    console.log('Updating game state:', newState);

    // Update state with new game state
    if (AppState.currentGame) {
      Object.assign(AppState.currentGame, newState);
    }

    if (AppState.gameSession) {
      AppState.gameSession.gameState = newState;
    }

    // Update scenario-specific state displays
    // Coffee shop scenario
    const satisfactionEl = document.getElementById('state-satisfaction');
    const resourcesEl = document.getElementById('state-resources');
    const reputationEl = document.getElementById('state-reputation');

    if (satisfactionEl && newState.satisfaction !== undefined) {
      satisfactionEl.textContent = newState.satisfaction;
    }
    if (resourcesEl && newState.resources !== undefined) {
      resourcesEl.textContent = newState.resources;
    }
    if (reputationEl && newState.reputation !== undefined) {
      reputationEl.textContent = newState.reputation;
    }

    // Investment scenario
    const portfolioEl = document.getElementById('state-portfolio');
    const knowledgeEl = document.getElementById('state-knowledge');

    if (portfolioEl && newState.portfolio !== undefined) {
      portfolioEl.textContent = newState.portfolio;
    }
    if (knowledgeEl && newState.knowledge !== undefined) {
      knowledgeEl.textContent = newState.knowledge;
    }

    // Relationship scenario
    const trustEl = document.getElementById('state-trust');

    if (trustEl && newState.trust !== undefined) {
      trustEl.textContent = newState.trust;
    }

    // Generic game state display fallback
    const gameStateDisplay = document.getElementById('game-state');
    if (gameStateDisplay) {
      gameStateDisplay.innerHTML = `
        <h3>游戏状态</h3>
        <p>满意度: ${newState.satisfaction || 'N/A'}</p>
        <p>声誉: ${newState.reputation || 'N/A'}</p>
        <p>知识: ${newState.knowledge || 'N/A'}</p>
        <p>资源: ${newState.resources || 'N/A'}</p>
        <p>回合: ${newState.turn || 'N/A'}</p>
      `;
    }
  }

  static renderStaticGameContent(scenario) {
    const content = scenario.content || {
      rounds: [
        {
          title: "第1回合",
          description: "欢迎来到挑战，了解场景背景",
          options: ["了解", "开始决策"]
        }
      ]
    };

    return `
      <div class="game-header">
        <h2>${scenario.name}</h2>
        <div class="game-meta">
          <span class="difficulty-badge ${scenario.difficulty}">${scenario.difficulty} 难度</span>
          <span class="scenario-category">${scenario.category}</span>
        </div>
      </div>
      
      <div class="game-content">
        <div class="scenario-intro">
          <h3>场景介绍</h3>
          <p>${scenario.fullDescription}</p>
          
          <div class="cognitive-bias-info">
            <h4>目标认知偏差:</h4>
            <ul>
              ${(scenario.targetBiases || []).map(bias => `<li>${bias}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div id="game-rounds-container">
          <div class="round-section">
            <h3>当前回合</h3>
            <p>根据您的难度选择，您将面对相应复杂度的挑战</p>
            <div class="decision-controls">
              <label>决策影响因素: </label>
              <div class="slider-container">
                <input type="range" id="decision-slider" min="0" max="100" value="50">
                <span id="slider-value">50</span>
              </div>
              <button class="btn btn-primary" onclick="GameManager.submitStaticDecision()">提交决策</button>
            </div>
          </div>
        </div>
        
        <div id="scenario-conclusion" class="scenario-conclusion" style="display: none;">
          <h3>挑战完成!</h3>
          <p>您已经完成了本次认知挑战，系统将为您提供反馈和分析。</p>
          <div id="feedback-section" class="feedback-section"></div>
        </div>
      </div>
      
      <div class="game-actions">
        <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
        <button class="btn btn-tertiary" onclick="GameManager.hideGameModal()">关闭</button>
      </div>
    `;
  }

  static async submitStaticDecision() {
    const sliderValue = document.getElementById('decision-slider')?.value || 50;
    
    try {
      // Simulate game turn execution
      const decisions = {
        action: "adjust_strategy",
        amount: parseInt(sliderValue),
        difficulty: AppState.userPreferences.difficulty
      };
      
      // For static content, we simulate the response
      const result = {
        success: true,
        turnNumber: 1,
        feedback: this.generateDifficultyBasedFeedback(decisions.difficulty),
        game_state: {
          satisfaction: 50 + Math.min(sliderValue, 50),
          reputation: 40 + Math.floor(sliderValue/2),
          knowledge: 10 + sliderValue
        }
      };
      
      // Update game state
      this.updateGameState(result.game_state);
      
      // Show feedback
      const feedbackSection = document.getElementById('feedback-section');
      if (feedbackSection) {
        feedbackSection.innerHTML = `
          <h4>决策反馈</h4>
          <p>${result.feedback}</p>
        `;
      }
      
      ToastManager.show('决策已提交!', 'success', '成功');
    } catch (error) {
      ToastManager.show('提交决策失败', 'error', '错误');
    }
  }

  static generateDifficultyBasedFeedback(difficulty) {
    const feedbackMap = {
      beginner: "您的决策体现了基础的线性思维模式，这是常见认知偏差的典型表现。",
      intermediate: "您开始理解复杂系统的非线性效应，但还需要考虑更多变量和长期影响。",
      advanced: "您展示了对复杂系统、指数增长和复利效应的深度理解，但仍有改进空间。"
    };
    
    return feedbackMap[difficulty] || "您的决策反映了当前难度级别的典型认知模式。";
  }

  static initializeStaticGame(scenario) {
    AppState.currentGame = {
      scenario: scenario,
      currentRound: 0,
      decisions: [],
      gameStarted: true
    };

    // Bind slider events
    const slider = document.getElementById('decision-slider');
    const valueDisplay = document.getElementById('slider-value');
    
    if (slider && valueDisplay) {
      slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value;
      });
    }
  }

  static renderGameContent(scenario) {
    // Check if this is a turn-based game session
    if (AppState.gameSession && AppState.gameSession.currentTurn) {
      return this.renderTurnBasedGame(scenario);
    }

    return `
      <div class="game-header">
        <h2>${scenario.name}</h2>
        <div class="game-meta">
          <span class="difficulty-badge ${scenario.difficulty}">${scenario.difficulty} 难度</span>
          <span class="scenario-category">${scenario.category}</span>
        </div>
      </div>

      <div class="game-content">
        <div class="scenario-description">
          <p>${scenario.description}</p>
        </div>

        <div class="game-controls">
          <!-- Game controls will be rendered based on scenario -->
          <p>基于API的动态游戏内容将在游戏中呈现...</p>
        </div>
      </div>

      <div class="game-actions">
        <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
        <button class="btn btn-tertiary" onclick="GameManager.hideGameModal()">关闭</button>
      </div>
    `;
  }

  // ========== Turn-Based Game Rendering ==========

  static renderTurnBasedGame(scenario) {
    const turn = AppState.gameSession.currentTurn;
    const gameState = AppState.gameSession.gameState;
    const decisionHistory = AppState.gameSession.decision_history || [];

    // Get turn-specific config
    const turnConfig = this.getCoffeeShopTurnConfig(turn);

    return `
      <div class="turn-based-game">
        <!-- Turn Header -->
        <div class="turn-header">
          <h2>☕ ${turnConfig.title}</h2>
          <div class="turn-number">第 ${turn}/5 回合</div>
        </div>

        <!-- Situation Description -->
        <div class="situation-description">
          <p>${turnConfig.description}</p>
          <div class="current-situation">
            <strong>当前情况：</strong>${turnConfig.situation}
          </div>
        </div>

        <!-- Game State Display -->
        ${this.renderCoffeeShopGameState(gameState)}

        <!-- Decision Controls -->
        ${turnConfig.isAwakeningMoment ?
          this.renderAwakeningMoment(decisionHistory) :
          this.renderCoffeeShopDecisions(turn, turnConfig.decisions)
        }

        <!-- Linear Expectation Calculator -->
        ${!turnConfig.isAwakeningMoment && turn !== 5 ?
          this.renderLinearExpectationCalculator(turn) : ''
        }

        <!-- Delayed Effects Queue -->
        ${this.renderDelayedEffectsQueue(AppState.gameSession.delayed_effects || [])}

        <!-- Action Buttons -->
        <div class="turn-actions">
          ${turn !== 5 ?
            `<button class="btn btn-primary submit-decision-btn" onclick="GameManager.submitTurnDecision()">
              提交决策
            </button>` :
            `<button class="btn btn-secondary" onclick="GameManager.hideGameModal()">返回</button>`
          }
        </div>
      </div>
    `;
  }

  static renderCoffeeShopGameState(gameState) {
    const satisfaction = gameState.satisfaction || 50;
    const resources = gameState.resources || 1000;
    const reputation = gameState.reputation || 50;
    const turn = gameState.turn_number || 1;

    // Get previous state for comparison
    const prevTurn = turn > 1 ? (AppState.gameSession.decision_history?.[turn-2]?.state_before) : null;

    return `
      <div class="game-state-display">
        <h3>📊 当前状态</h3>
        <div class="state-grid">
          <div class="state-item">
            <span class="label">😊 满意度</span>
            <div class="bar-container">
              <div class="bar" style="width: ${satisfaction}%; background: ${this.getStateColor(satisfaction)};"></div>
            </div>
            <span class="value">${satisfaction}</span>
            ${prevTurn ? `<span class="change">${this.getChangeArrow(prevTurn.satisfaction, satisfaction)}</span>` : ''}
          </div>

          <div class="state-item">
            <span class="label">💰 资金</span>
            <span class="value">¥${resources}</span>
            ${prevTurn ? `<span class="change">${this.getChangeArrow(prevTurn.resources, resources, true)}</span>` : ''}
          </div>

          <div class="state-item">
            <span class="label">⭐ 声誉</span>
            <div class="bar-container">
              <div class="bar" style="width: ${reputation}%; background: ${this.getStateColor(reputation)};"></div>
            </div>
            <span class="value">${reputation}</span>
            ${prevTurn ? `<span class="change">${this.getChangeArrow(prevTurn.reputation, reputation)}</span>` : ''}
          </div>
        </div>

        <!-- Warnings -->
        ${resources < 500 ? '<div class="warning-message">⚠️ 资金紧张！请谨慎决策</div>' : ''}
        ${satisfaction < 30 ? '<div class="danger-message">🚨 满意度危险！员工可能辞职</div>' : ''}
        ${reputation < 30 ? '<div class="danger-message">🚨 声誉危险！顾客流失严重</div>' : ''}
      </div>
    `;
  }

  static getStateColor(value) {
    if (value >= 70) return 'linear-gradient(90deg, #26de81, #20bf6b)';
    if (value >= 50) return 'linear-gradient(90deg, #fed330, #f7b731)';
    if (value >= 30) return 'linear-gradient(90deg, #fa8231, #e056fd)';
    return 'linear-gradient(90deg, #eb3b5a, #eb3b5a)';
  }

  static getChangeArrow(prev, current, isMoney = false) {
    const diff = current - prev;
    if (diff > 0) return `<span class="positive">+${diff} ↗️</span>`;
    if (diff < 0) return `<span class="negative">${diff} ↘️</span>`;
    return '<span class="neutral">→</span>';
  }

  static renderCoffeeShopDecisions(turn, decisions) {
    return `
      <div class="decisions-container">
        <h3>📋 本月决策</h3>
        ${decisions.map(decision => this.renderDecisionControl(decision)).join('')}
      </div>
    `;
  }

  static renderDecisionControl(decision) {
    switch(decision.type) {
      case 'slider':
        return this.renderSliderDecision(decision);
      case 'choice':
        return this.renderChoiceDecision(decision);
      default:
        return '<p>Unknown decision type</p>';
    }
  }

  static renderSliderDecision(decision) {
    return `
      <div class="decision-item" data-decision-id="${decision.id}">
        <label class="decision-label">${decision.label}</label>

        <div class="slider-container">
          <span class="min-value">${decision.min}${decision.unit || ''}</span>
          <input
            type="range"
            id="${decision.id}"
            class="game-slider"
            min="${decision.min}"
            max="${decision.max}"
            value="${decision.default}"
            data-unit="${decision.unit || ''}"
            data-warning-threshold="${decision.warning_threshold || decision.max}"
            oninput="GameManager.updateSliderValue('${decision.id}')"
          >
          <span class="max-value">${decision.max}${decision.unit || ''}</span>
        </div>

        <div class="current-selection">
          当前选择: <span id="${decision.id}-value">${decision.default}</span>${decision.unit || ''}
        </div>

        ${decision.warning_message ? `
          <div class="slider-warning" id="${decision.id}-warning" style="display: none;">
            ${decision.warning_message}
          </div>
        ` : ''}

        <div class="player-thinking">
          💡 你的想法: ${decision.thinking || ''}
        </div>
      </div>
    `;
  }

  static renderChoiceDecision(decision) {
    return `
      <div class="decision-item" data-decision-id="${decision.id}">
        <label class="decision-label">${decision.label}</label>

        <div class="choice-options">
          ${decision.options.map(option => `
            <div class="choice-card ${option.risk || ''}" data-choice-id="${option.id}">
              <h4>${option.label}</h4>
              <p>${option.description}</p>
              ${option.expected_profit !== undefined ? `
                <div class="expected-profit">
                  预计净利: <span class="${option.expected_profit >= 0 ? 'positive' : 'negative'}">
                    ${option.expected_profit >= 0 ? '+' : ''}¥${option.expected_profit}
                  </span>
                </div>
              ` : ''}
              <button class="choice-btn" onclick="GameManager.selectChoice('${decision.id}', '${option.id}')">
                ${option.label}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  static renderLinearExpectationCalculator(turn) {
    return `
      <div class="linear-expectation" id="linear-expectation">
        <h3>📊 你的线性期望</h3>
        <div class="expectation-breakdown" id="expectation-breakdown">
          <div class="placeholder">
            调整滑块以查看你的期望...
          </div>
        </div>
        <div class="total-expectation" id="total-expectation">
          <div class="expected">
            <span>期望净利润:</span>
            <span class="value" id="expected-profit">--</span>
          </div>
        </div>
      </div>
    `;
  }

  static renderDelayedEffectsQueue(effects) {
    if (!effects || effects.length === 0) return '';

    const upcomingEffects = effects.filter(e => !e.applied);

    if (upcomingEffects.length === 0) return '';

    return `
      <div class="delayed-effects">
        <h3>⏳ 延迟效应队列</h3>
        <div class="timeline">
          ${upcomingEffects.map(effect => `
            <div class="effect-item ${effect.status || 'upcoming'}">
              <div class="turn-indicator">第${effect.turn}回合生效</div>
              <div class="effect-content">
                <div class="description">${effect.description || ''}</div>
                <div class="impact">
                  ${effect.changes ? Object.entries(effect.changes).map(([key, value]) => {
                    const label = this.getStateLabel(key);
                    return `${label}: <span class="${value >= 0 ? 'positive' : 'negative'}">${value >= 0 ? '+' : ''}${value}</span>`;
                  }).join('<br>') : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="insight">💡 你能看到未来吗？还是只看现在？</div>
      </div>
    `;
  }

  static getStateLabel(key) {
    const labels = {
      satisfaction: '😊 满意度',
      resources: '💰 资金',
      reputation: '⭐ 声誉',
      trust: '🤝 信任'
    };
    return labels[key] || key;
  }

  static renderAwakeningMoment(decisionHistory) {
    return `
      <div class="awakening-moment">
        <div class="crisis-warning">
          <h2>🚨🚨🚨 关键时刻 🚨🚨🚨</h2>
        </div>

        <div class="decision-history-review">
          <h3>💭 你的决策历史</h3>
          <div class="history-timeline">
            ${decisionHistory.map((decision, index) => {
              const actualProfit = decision.actual_result?.actual_profit || 0;
              const status = actualProfit > 0 ? 'success' : (actualProfit < -200 ? 'failure' : 'warning');
              const statusText = actualProfit > 0 ? '✓ 成功' : (actualProfit < -200 ? '💥 失败' : '⚠️ 小问题');

              return `
                <div class="history-item ${status}">
                  <span class="turn">第${decision.turn}月</span>
                  <span class="decision">${Object.keys(decision.decision)[0]}</span>
                  <span class="result">${statusText}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="pattern-analysis">
          <h3>🔍 系统分析</h3>
          <p>你连续${decisionHistory.length}回合都在增加投入...</p>
          <div class="pattern-name">
            <strong>"承诺升级"（Escalation of Commitment）</strong>
          </div>
          <p>已经投入太多，不愿承认失败，相信"再投入一点就会好转"</p>
        </div>

        <div class="awakening-choice-container">
          <div class="choice-card awakening">
            <h4>A. 明白了！我陷入了陷阱</h4>
            <ul>
              <li>承认线性思维是错的</li>
              <li>立即调整策略</li>
              <li>减少种类，优化服务</li>
            </ul>
            <button class="choice-btn awakening" onclick="GameManager.selectAwakeningChoice('A')">
              选择A - 开始觉醒
            </button>
          </div>

          <div class="choice-card stubborn">
            <h4>B. 不，我的逻辑没错！</h4>
            <ul>
              <li>是外部环境的问题</li>
              <li>竞争对手太强</li>
              <li>最后一次大规模投入！</li>
            </ul>
            <button class="choice-btn stubborn" onclick="GameManager.selectAwakeningChoice('B')">
              选择B - 继续固执
            </button>
          </div>
        </div>

        <div class="hint">💡 提示：A和B会导致完全不同的结局...</div>
      </div>
    `;
  }

  // ========== Coffee Shop Turn Configuration ==========

  static getCoffeeShopTurnConfig(turn) {
    const configs = {
      1: {
        title: '开业第1月',
        description: '你的咖啡店刚刚开业，位置不错但竞争激烈。你有¥1,000启动资金。',
        situation: '顾客反馈："咖啡品质不错，但选择太少。" 你的朋友建议："多进几种咖啡豆，多准备几种选择。"',
        decisions: [
          {
            id: 'coffeeVariety',
            type: 'slider',
            label: '☕ 决策1: 咖啡种类数量',
            min: 3,
            max: 10,
            default: 6,
            unit: '种',
            warning_threshold: 8,
            warning_message: '⚠️ 警告：超过8种可能导致选择过载',
            thinking: '"每多1种，应该能多吸引10个顾客"'
          },
          {
            id: 'promotionBudget',
            type: 'slider',
            label: '📢 决策2: 开业促销投入',
            min: 0,
            max: 200,
            default: 100,
            unit: '¥',
            warning_threshold: 150,
            warning_message: '⚠️ 警告：过度促销可能吸引价格敏感型顾客',
            thinking: '"促销能带来3倍的回报"'
          }
        ]
      },
      2: {
        title: '第2月',
        description: '上个月的扩张很成功！顾客增加了30%。但小问题开始出现...',
        situation: '员工反馈："咖啡种类太多，准备时间变长了。" 顾客反馈："选择太多了，我不知道选哪个好。" 你的朋友说："这是因为还不够多，继续扩展！"',
        decisions: [
          {
            id: 'coffeeVariety',
            type: 'slider',
            label: '☕ 决策1: 继续扩展咖啡种类',
            min: 6,
            max: 15,
            default: 10,
            unit: '种',
            warning_threshold: 8,
            warning_message: '⚠️ 员工提到管理困难，但你觉得...',
            thinking: '"问题是因为种类还不够多！到12种就好了"'
          },
          {
            id: 'seats',
            type: 'slider',
            label: '🪑 决策2: 增加座位',
            min: 8,
            max: 20,
            default: 12,
            unit: '个',
            warning_threshold: 14,
            warning_message: '⚠️ 警告：座位增加但服务可能跟不上',
            thinking: '"每增加1个座位=每月多¥50收入"'
          }
        ]
      },
      3: {
        title: '第3月 - 警告信号',
        description: '上个月亏损了！你需要做决定...',
        situation: '资金下降，满意度下降，声誉也下降了。你需要选择应对策略。',
        decisions: [
          {
            id: 'strategyChoice',
            type: 'choice',
            label: '应对策略',
            options: [
              {
                id: 'A',
                label: 'A. 继续扩张（线性思维）',
                description: '相信"再投入一点就好了"，投入¥300做大型促销',
                expected_profit: 450,
                risk: 'high',
                thinking: '"上次亏损是暂时的，促销会带来新顾客"'
              },
              {
                id: 'B',
                label: 'B. 稳定运营（系统思维）',
                description: '减少种类，专注核心产品，不扩张，优化现有服务',
                expected_profit: 80,
                risk: 'low',
                thinking: '"可能投入太多了...先稳定再说"'
              }
            ]
          }
        ]
      },
      4: {
        title: '第4月 - 觉醒时刻 ⭐',
        description: '这是你最后的机会...',
        situation: '你想明白什么了吗？',
        isAwakeningMoment: true
      },
      5: {
        title: '第5月 - 最终结局',
        description: '游戏结束',
        situation: '根据你的选择，决定最终结局...',
        isFinale: true
      }
    };

    return configs[turn] || configs[1];
  }

  // ========== Interactive Functions ==========

  static updateSliderValue(sliderId) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(`${sliderId}-value`);
    const warningDiv = document.getElementById(`${sliderId}-warning`);

    if (slider && valueDisplay) {
      const value = parseInt(slider.value);
      const unit = slider.dataset.unit || '';
      const threshold = parseInt(slider.dataset.warningThreshold);

      valueDisplay.textContent = value;

      // Show warning if exceeds threshold
      if (warningDiv && value >= threshold) {
        warningDiv.style.display = 'block';
      } else if (warningDiv) {
        warningDiv.style.display = 'none';
      }

      // Update linear expectation calculator
      this.updateLinearExpectation();
    }
  }

  static updateLinearExpectation() {
    const turn = AppState.gameSession?.currentTurn;
    if (!turn || turn === 3 || turn === 4 || turn === 5) return;

    const breakdownDiv = document.getElementById('expectation-breakdown');
    const totalProfitSpan = document.getElementById('expected-profit');

    if (!breakdownDiv || !totalProfitSpan) return;

    // Get all slider values
    const sliders = document.querySelectorAll('.game-slider');
    let decisions = {};
    sliders.forEach(slider => {
      decisions[slider.id] = parseInt(slider.value);
    });

    // Calculate linear expectation based on turn
    let expectedProfit = 0;
    let breakdown = '';

    if (turn === 1) {
      const newVariety = decisions.coffeeVariety - 3;
      const expectedCustomers = newVariety * 10;
      const expectedRevenue = expectedCustomers * 9;
      const promotionReturn = decisions.promotionBudget * 3;
      const newVarietyCost = newVariety * 10;

      expectedProfit = expectedRevenue + promotionReturn - newVarietyCost - decisions.promotionBudget;

      breakdown = `
        <div class="item">
          <span class="label">咖啡种类:</span>
          <span class="value">3 → ${decisions.coffeeVariety}种</span>
        </div>
        <div class="item">
          <span class="label">预计新增顾客:</span>
          <span class="value positive">+${expectedCustomers}人</span>
        </div>
        <div class="item">
          <span class="label">预计收入:</span>
          <span class="value positive">+¥${expectedRevenue}</span>
        </div>
        <div class="item">
          <span class="label">新增种类成本:</span>
          <span class="value negative">-¥${newVarietyCost}</span>
        </div>
        <div class="item">
          <span class="label">促销投入:</span>
          <span class="value negative">-¥${decisions.promotionBudget}</span>
        </div>
        <div class="item">
          <span class="label">促销回报 (3x):</span>
          <span class="value positive">+¥${promotionReturn}</span>
        </div>
      `;
    } else if (turn === 2) {
      const newVariety = decisions.coffeeVariety - 6;
      const expectedCustomers = newVariety * 10;
      const expectedRevenue = expectedCustomers * 9;
      const newSeats = decisions.seats - 8;
      const seatRevenue = newSeats * 50;
      const varietyCost = newVariety * 10;
      const seatCost = newSeats * 30;

      expectedProfit = expectedRevenue + seatRevenue - varietyCost - seatCost;

      breakdown = `
        <div class="item">
          <span class="label">咖啡种类:</span>
          <span class="value">6 → ${decisions.coffeeVariety}种</span>
        </div>
        <div class="item">
          <span class="label">预计新增顾客:</span>
          <span class="value positive">+${expectedCustomers}人</span>
        </div>
        <div class="item">
          <span class="label">座位:</span>
          <span class="value">8 → ${decisions.seats}个</span>
        </div>
        <div class="item">
          <span class="label">座位预计收入:</span>
          <span class="value positive">+¥${seatRevenue}</span>
        </div>
        <div class="item">
          <span class="label">总成本:</span>
          <span class="value negative">-¥${varietyCost + seatCost}</span>
        </div>
      `;
    }

    breakdownDiv.innerHTML = breakdown;
    totalProfitSpan.textContent = `${expectedProfit >= 0 ? '+' : ''}¥${expectedProfit}`;
    totalProfitSpan.className = `value ${expectedProfit >= 0 ? 'positive' : 'negative'}`;
  }

  static selectChoice(decisionId, choiceId) {
    // Store the choice
    if (!AppState.gameSession.currentChoices) {
      AppState.gameSession.currentChoices = {};
    }
    AppState.gameSession.currentChoices[decisionId] = choiceId;

    // Highlight selected choice
    document.querySelectorAll(`[data-choice-id="${choiceId}"]`).forEach(el => {
      el.classList.add('selected');
    });
  }

  static selectAwakeningChoice(choice) {
    if (!AppState.gameSession.currentChoices) {
      AppState.gameSession.currentChoices = {};
    }
    AppState.gameSession.currentChoices['awakening'] = choice;

    // Highlight selected choice
    document.querySelectorAll('.choice-card').forEach(el => {
      el.classList.remove('selected');
    });
    event.target.closest('.choice-card').classList.add('selected');

    // Auto-submit for awakening moment
    setTimeout(() => {
      this.submitTurnDecision();
    }, 500);
  }

  static async submitTurnDecision() {
    const turn = AppState.gameSession.currentTurn;
    const gameState = AppState.gameSession.gameState;

    // Collect decisions
    let decisions = {};

    if (turn === 3 || turn === 4) {
      // Choice-based decisions
      decisions = AppState.gameSession.currentChoices || {};
    } else {
      // Slider-based decisions
      const sliders = document.querySelectorAll('.game-slider');
      sliders.forEach(slider => {
        decisions[slider.id] = parseInt(slider.value);
      });
    }

    console.log(`Submitting decision for turn ${turn}:`, decisions);

    // Calculate results using DecisionEngine
    const result = DecisionEngine.calculateCoffeeShopTurn(
      turn,
      decisions,
      gameState,
      AppState.gameSession.decision_history || [],
      AppState.gameSession.delayed_effects || []
    );

    console.log('Turn result:', result);

    // Add new delayed effects to queue
    if (result.newDelayedEffects && result.newDelayedEffects.length > 0) {
      if (!AppState.gameSession.delayed_effects) {
        AppState.gameSession.delayed_effects = [];
      }
      result.newDelayedEffects.forEach(effect => {
        AppState.gameSession.delayed_effects.push(effect);
      });
    }

    // Update game state
    AppState.gameSession.gameState = result.newGameState;

    // Add to decision history
    if (!AppState.gameSession.decision_history) {
      AppState.gameSession.decision_history = [];
    }
    AppState.gameSession.decision_history.push({
      turn: turn,
      decision: decisions,
      state_before: { ...gameState },
      state_after: { ...result.newGameState },
      linear_expectation: result.linearExpectation,
      actual_result: result.actualResult
    });

    // Show result feedback
    this.showTurnFeedback(turn, result);

    // Check for game over
    if (result.gameOver) {
      setTimeout(() => {
        this.showGameOver(result);
      }, 4000);
      return;
    }

    // Move to next turn or end
    if (turn >= 5) {
      setTimeout(() => {
        this.showGameEnding(result);
      }, 4000);
    } else {
      // Small delay then show next turn
      setTimeout(() => {
        AppState.gameSession.currentTurn = turn + 1;
        this.showGameModal();
        this.updateGameStateUI(result.newGameState);
      }, 4000);
    }
  }

  static showTurnFeedback(turn, result) {
    const container = document.getElementById('game-container');
    if (!container) return;

    const resourceChange = result.actualResult.resources - result.linearExpectation.resources;
    const satisfactionChange = result.actualResult.satisfaction - result.linearExpectation.satisfaction;

    const feedbackClass = resourceChange >= 0 ? 'success' : 'warning';

    container.innerHTML = `
      <div class="turn-feedback ${feedbackClass}">
        <h3>📊 第${turn}回合结果</h3>

        <div class="expectation-vs-actual">
          <div class="comparison">
            <div class="expected">
              <span class="label">你的期望:</span>
              <span class="value">${Math.round(result.linearExpectation.resources)}元</span>
            </div>
            <div class="actual">
              <span class="label">实际结果:</span>
              <span class="value ${resourceChange >= 0 ? 'positive' : 'negative'}">
                ${Math.round(result.actualResult.resources)}元
                (${resourceChange >= 0 ? '+' : ''}${Math.round(resourceChange)})
              </span>
            </div>
          </div>

          <div class="comparison">
            <div class="expected">
              <span class="label">期望满意度:</span>
              <span class="value">${Math.round(result.linearExpectation.satisfaction)}</span>
            </div>
            <div class="actual">
              <span class="label">实际满意度:</span>
              <span class="value ${satisfactionChange >= 0 ? 'positive' : 'negative'}">
                ${Math.round(result.actualResult.satisfaction)}
                (${satisfactionChange >= 0 ? '+' : ''}${Math.round(satisfactionChange)})
              </span>
            </div>
          </div>
        </div>

        <div class="narrative-description">
          <p>${result.feedback.replace(/\n\n/g, '</p><p>').replace(/\*\*/g, '').replace(/📊|📖|🧮|🎯|⚠️|✨/g, '')}</p>
        </div>

        ${turn < 5 ? `
        <div class="next-turn-indicator">
          <p>即将进入第${turn + 1}回合...</p>
          <div class="spinner"></div>
        </div>
        ` : `
        <div class="next-turn-indicator">
          <p>游戏即将结束...</p>
          <div class="spinner"></div>
        </div>
        `}
      </div>
    `;
  }

  static showGameOver(result) {
    const container = document.getElementById('game-container');
    if (!container) return;

    const reasonMap = {
      'resources': '你的咖啡店资金耗尽，不得不关门停业。',
      'satisfaction': '顾客满意度太低，没有人再来光顾，咖啡店倒闭了。',
      'reputation': '声誉太差，咖啡店被迫关门。'
    };

    container.innerHTML = `
      <div class="game-ending failure">
        <h2>游戏结束 💔</h2>

        <div class="failure-analysis">
          <h4>失败原因</h4>
          <p>${reasonMap[result.gameOverReason] || '游戏结束'}</p>
        </div>

        <div class="final-state">
          <h3>最终状态</h3>
          <div class="state-item">
            <span class="label">资源:</span>
            <span class="value">${Math.round(result.newGameState.resources)}元</span>
          </div>
          <div class="state-item">
            <span class="label">满意度:</span>
            <span class="value">${Math.round(result.newGameState.satisfaction)}</span>
          </div>
          <div class="state-item">
            <span class="label">声誉:</span>
            <span class="value">${Math.round(result.newGameState.reputation)}</span>
          </div>
        </div>

        <div class="lesson">
          <h4>💡 教训</h4>
          <p>在复杂系统中，简单的线性推理往往失效。"越多越好"的假设忽视了协调成本、边际效应递减和系统复杂性等因素。下次游戏时，试着关注系统中的反馈循环和延迟效应。</p>
        </div>

        <div class="ending-actions">
          <button class="btn btn-primary" onclick="GameManager.closeGameModal()">关闭</button>
          <button class="btn btn-secondary" onclick="GameManager.startCoffeeShopGame()">重新开始</button>
        </div>
      </div>
    `;
  }

  static showGameEnding(result) {
    const container = document.getElementById('game-container');
    if (!container) return;

    // Check if player awakened (chose A in turn 4)
    const decisionHistory = AppState.gameSession.decision_history || [];
    const turn4Decision = decisionHistory.find(d => d.turn === 4);
    const awakened = turn4Decision && turn4Decision.decision.awakening === 'A';

    if (awakened) {
      // Victory ending
      container.innerHTML = `
        <div class="game-ending victory">
          <h2>恭喜你！觉醒成功 🎉</h2>

          <div class="victory-message">
            <p>你成功识破并走出了线性思维的陷阱！</p>
            <p>在第4回合的关键时刻，你意识到了"越多越好"的假设是错误的，并果断进行了系统调整。这个决策拯救了你的咖啡店！</p>
          </div>

          <div class="final-state">
            <h3>最终状态</h3>
            <div class="state-item">
              <span class="label">资源:</span>
              <span class="value">${Math.round(result.newGameState.resources)}元</span>
            </div>
            <div class="state-item">
              <span class="label">满意度:</span>
              <span class="value">${Math.round(result.newGameState.satisfaction)}</span>
            </div>
            <div class="state-item">
              <span class="label">声誉:</span>
              <span class="value">${Math.round(result.newGameState.reputation)}</span>
            </div>
          </div>

          <div class="achievements">
            <h4>🏆 成就解锁</h4>
            <ul>
              <li>✅ 系统思维入门 - 识别线性思维陷阱</li>
              <li>✅ 适应能力 - 及时调整策略</li>
              <li>✅ 复杂系统理解 - 掌握协调成本概念</li>
            </ul>
          </div>

          <div class="lesson">
            <h4>💡 核心教训</h4>
            <p>你学到了在复杂系统中，简单的线性推理（"越多越好"）往往失效。真正有效的决策需要考虑：</p>
            <ul>
              <li><strong>边际效应递减</strong>：每增加一单位的投入，带来的收益会逐渐减少</li>
              <li><strong>协调成本</strong>：系统越复杂，维护成本越高</li>
              <li><strong>系统平衡</strong>：找到最优平衡点比无止境的扩张更重要</li>
            </ul>
          </div>

          <div class="ending-actions">
            <button class="btn btn-primary" onclick="GameManager.closeGameModal()">完成</button>
            <button class="btn btn-secondary" onclick="GameManager.startCoffeeShopGame()">再次挑战</button>
          </div>
        </div>
      `;
    } else {
      // Failure ending
      container.innerHTML = `
        <div class="game-ending failure">
          <h2>陷入线性思维陷阱 💔</h2>

          <div class="failure-analysis">
            <h4>失败分析</h4>
            <p>你在整个游戏过程中始终坚持"越多越好"的线性思维。</p>
            <p>虽然你的逻辑听起来很合理（更多选择 = 更多顾客 = 更多收入），但你忽视了系统中的复杂性：</p>
          </div>

          <div class="trap-analysis">
            <h4>你陷入的陷阱</h4>
            <p><strong>线性思维陷阱</strong>：认为投入和产出之间存在简单的线性关系</p>
            <ul>
              <li>忽视了<strong>协调成本</strong>：品种越多，供应链越复杂，成本越高</li>
              <li>忽视了<strong>选择过载</strong>：太多选择让顾客困惑，反而降低满意度</li>
              <li>忽视了<strong>品质下降</strong>：精力分散导致每种咖啡的质量都下降</li>
              <li>忽视了<strong>边际效应递减</strong>：每增加一个品种，带来的收益越来越少</li>
            </ul>
          </div>

          <div class="final-state">
            <h3>最终状态</h3>
            <div class="state-item">
              <span class="label">资源:</span>
              <span class="value ${result.newGameState.resources < 500 ? 'negative' : ''}">${Math.round(result.newGameState.resources)}元</span>
            </div>
            <div class="state-item">
              <span class="label">满意度:</span>
              <span class="value ${result.newGameState.satisfaction < 40 ? 'negative' : ''}">${Math.round(result.newGameState.satisfaction)}</span>
            </div>
            <div class="state-item">
              <span class="label">声誉:</span>
              <span class="value ${result.newGameState.reputation < 40 ? 'negative' : ''}">${Math.round(result.newGameState.reputation)}</span>
            </div>
          </div>

          <div class="lesson">
            <h4>💡 希望你学到的教训</h4>
            <p>下次游戏时，试着在第3或第4回合选择不同的策略。观察：</p>
            <ul>
              <li>当实际结果持续低于预期时，是否说明假设有问题？</li>
              <li>协调成本和边际效应递减是如何影响结果的？</li>
              <li>找到<strong>平衡点</strong>是否比无止境扩张更有效？</li>
            </ul>
          </div>

          <div class="ending-actions">
            <button class="btn btn-primary" onclick="GameManager.startCoffeeShopGame()">重新挑战</button>
            <button class="btn btn-secondary" onclick="GameManager.closeGameModal()">关闭</button>
          </div>
        </div>
      `;
    }
  }

  static startCoffeeShopGame() {
    // Initialize game state
    const initialState = {
      satisfaction: 50,
      resources: 1000,
      reputation: 50,
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      patterns: []
    };

    // Create page router
    const router = new CoffeeShopPageRouter(initialState);

    // Store router in global scope for page interactions
    window.coffeeShopRouter = router;

    // Store session
    AppState.gameSession = {
      gameId: 'coffee-shop-' + Date.now(),
      scenarioId: 'coffee-shop-linear-thinking',
      difficulty: 'beginner',
      status: 'active',
      gameState: initialState,
      currentTurn: 1,
      decision_history: [],
      delayed_effects: [],
      patterns: []
    };

    this.showGameModal();

    // Render the start page
    const container = document.getElementById('game-container');
    if (container) {
      container.innerHTML = router.renderPage();
    }
  }

  static startRelationshipTimeDelayGame() {
    console.log('🚀 Starting Relationship Time Delay game...');

    // Initialize game state for relationship scenario
    const initialState = {
      satisfaction: 60,
      energy: 80,
      affection: 50,
      stability: 40,
      week_number: 1,
      turn_number: 1,
      decision_history: [],
      pending_effects: [],
      chat_messages: []
    };

    // Create page router
    const router = new RelationshipTimeDelayPageRouter(initialState);

    // Store router in global scope for page interactions
    window.relationshipTimeDelayRouter = router;

    // Store session
    AppState.gameSession = {
      gameId: 'relationship-time-delay-' + Date.now(),
      scenarioId: 'relationship-time-delay',
      difficulty: 'intermediate',
      status: 'active',
      gameState: initialState,
      currentTurn: 1,
      decision_history: [],
      patterns: []
    };

    this.showGameModal();

    // Render the start page
    const container = document.getElementById('game-container');
    if (container) {
      container.innerHTML = router.renderPage();
    }

    console.log('✅ Relationship Time Delay game initialized');
  }

  static getMockGameContent(scenarioId) {
    const scenarioConfigs = {
      'coffee-shop-linear-thinking': {
        title: '咖啡店经营挑战',
        intro: '您是一家咖啡店的经理，需要做出各种经营决策。',
        challenge: '线性思维会让你以为增加投入就会获得线性回报',
        feedback: '记住：在复杂系统中，简单的线性思维往往导致错误的决策'
      },
      'relationship-time-delay': {
        title: '恋爱关系管理',
        intro: '在恋爱关系中，决策的效果往往不会立即显现。',
        challenge: '时间延迟效应让你难以看到行动的长期后果',
        feedback: '重要决策的后果通常需要时间才能显现，请耐心观察'
      },
      'investment-confirmation-bias': {
        title: '投资决策场景', 
        intro: '投资时，我们倾向于寻找证实已有观点的信息。',
        challenge: '确认偏误会让你忽视相反的证据',
        feedback: '主动寻求与你观点相悖的信息，做出更客观的决策'
      }
    };

    const config = scenarioConfigs[scenarioId] || scenarioConfigs['coffee-shop-linear-thinking'];

    return `
      <div class="game-header">
        <h2>${config.title}</h2>
      </div>
      
      <div class="game-content">
        <div class="scenario-intro">
          <h3>场景介绍</h3>
          <p>${config.intro}</p>
          <p><strong>核心挑战:</strong> ${config.challenge}</p>
          <p><strong>提示:</strong> ${config.feedback}</p>
        </div>
        
        <div class="game-controls">
          <div class="decision-controls">
            <label for="mock-decision-input">请输入您的决策（0-100）:</label>
            <input type="range" id="mock-decision-input" min="0" max="100" value="50">
            <span id="mock-decision-value">50</span>
            <button class="btn btn-primary" onclick="GameManager.submitMockTurn('${scenarioId}')">提交决策</button>
          </div>
        </div>
        
        <div id="mock-feedback" class="feedback-section"></div>
      </div>
      
      <div class="game-actions">
        <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">返回场景列表</button>
        <button class="btn btn-tertiary" onclick="GameManager.hideGameModal()">关闭</button>
      </div>
    `;
  }

  static async submitMockTurn(scenarioId) {
    const decisionValue = document.getElementById('mock-decision-input').value;
    const difficulty = AppState.userPreferences.difficulty;
    
    // Generate feedback based on difficulty
    let feedback = '';
    if (difficulty === 'beginner') {
      feedback = '您做出了决策，这是认知提升的第一步。';
    } else if (difficulty === 'intermediate') {
      feedback = '您的决策考虑了更多的复杂性，体现了对概念的进一步理解。';
    } else if (difficulty === 'advanced') {
      feedback = '您的决策展现了对复杂系统和非线性效应的深刻理解。';
    }
    
    document.getElementById('mock-feedback').innerHTML = `
      <h4>决策反馈</h4>
      <p>您选择了数值: ${decisionValue}</p>
      <p>${feedback}</p>
      <p>当前难度: ${difficulty}</p>
    `;

    ToastManager.show('决策已提交！', 'success', '成功');
  }
}

// UI Components
class ToastManager {
  static show(message, type = 'info', title = null) {
    const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
    
    const toast = this.createToast(message, type, title);
    toastContainer.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
      toast.remove();
    }, APP_CONFIG.toastDuration);
  }

  static createToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  static createToast(message, type, title) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
    `;
    
    return toast;
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  console.log('App Initializing...');

  // Expose debugging interfaces to window object
  window.AppState = AppState;
  window.GameManager = GameManager;
  window.NavigationManager = NavigationManager;
  window.ApiService = ApiService;
  console.log('Debug interfaces exposed to window');

  // Hide loading screen
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
    console.log('Loading screen hidden');
  }

  // Bind navigation button click handlers
  const navButtons = document.querySelectorAll('.nav-item[data-page]');
  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const targetPage = button.dataset.page;
      console.log('Nav button clicked:', targetPage);
      if (targetPage) {
        NavigationManager.navigateTo(targetPage);
      }
    });
  });

  // Bind other navigation buttons (start journey, learn more, etc.)
  const startJourneyBtn = document.getElementById('start-journey');
  if (startJourneyBtn) {
    startJourneyBtn.addEventListener('click', () => {
      NavigationManager.navigateTo('scenarios');
    });
  }

  const learnMoreBtn = document.getElementById('learn-more');
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
      NavigationManager.navigateTo('about');
    });
  }

  // Initialize navigation
  NavigationManager.renderPage('home');

  // Set up navigation events
  window.addEventListener('popstate', (event) => {
    const page = event.state?.page || 'home';
    NavigationManager.renderPage(page);
  });

  // Set up global event handlers
  window.NavigationManager = NavigationManager;
  window.GameManager = GameManager;
  window.ToastManager = ToastManager;
  window.ApiService = ApiService;
  window.APP_CONFIG = APP_CONFIG;
  window.AppState = AppState;
  
  // Bind modal close buttons if present
  try {
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => GameManager.hideGameModal());

    const closeInvitationBtn = document.getElementById('close-invitation-modal');
    if (closeInvitationBtn) closeInvitationBtn.addEventListener('click', () => document.getElementById('invitation-modal').style.display = 'none');

    const closeShareSuccess = document.getElementById('close-share-success');
    if (closeShareSuccess) closeShareSuccess.addEventListener('click', () => document.getElementById('share-success-modal').style.display = 'none');
  } catch (e) {
    // ignore if DOM elements not available
    console.debug('Modal bindings skipped:', e);
  }
  
  // Add page exit warning for active games
  window.addEventListener('beforeunload', (e) => {
    if (AppState.gameSession) {
      e.preventDefault();
      e.returnValue = '您有正在进行的游戏，确定要离开吗？';
    }
  });

  console.log('App Initialized Successfully!');
});

// Performance Monitoring
window.addEventListener('load', () => {
  const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
  console.log(`Page loaded in ${loadTime}ms`);
  
  // Log performance metrics
  if (performance.getEntriesByType('navigation').length > 0) {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('Performance:', {
      dns: perfData.domainLookupEnd - perfData.domainLookupStart,
      tcp: perfData.connectEnd - perfData.connectStart,
      request: perfData.responseEnd - perfData.requestStart,
      dom: perfData.domContentLoadedEventEnd - perfData.navigationStart
    });
  }
});