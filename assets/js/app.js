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
    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = await this.getPageTemplate(page);
    this.bindPageEvents(page);
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
    // Try to load from API first, fallback to mock data
    try {
      const response = await ApiService.scenarios.getAll();
      if (response && Array.isArray(response.scenarios)) {
        // Update global state with API data
        AppState.scenarios = response.scenarios;
      } else {
        // Fallback to mock data
        AppState.scenarios = this.getMockScenarios();
      }
    } catch (error) {
      console.warn('Failed to load scenarios from API, using mock data:', error);
      AppState.scenarios = this.getMockScenarios();
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
      <div class="card scenario-card">
        ${cardContent}
        <button class="btn btn-primary" onclick="GameManager.startScenario('${scenario.id}')">
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

// Game Manager with difficulty support
class GameManager {
  static async startScenario(scenarioId) {
    console.log('Starting scenario:', scenarioId);
    
    // Get the selected difficulty from user preferences
    const difficulty = AppState.userPreferences.difficulty;
    
    try {
      // Update state with current scenario and difficulty
      AppState.currentScenario = scenarioId;
      
      // Create game session with difficulty parameter (try API first, fallback to static)
      try {
        // Attempt to create game session via API
        const sessionData = await ApiService.scenarios.createGameSession(scenarioId, difficulty);
        AppState.gameSession = sessionData;
        console.log('Created game session via API:', sessionData);
      } catch (apiError) {
        // Fallback to static content if API fails
        console.warn('API call failed, using static content:', apiError);
        AppState.gameSession = {
          gameId: 'static-' + Date.now(),
          scenarioId: scenarioId,
          difficulty: difficulty
        };
        this.loadStaticGameContent(scenarioId);
        return;
      }

      // Load dynamic game content
      await this.loadGameContent(scenarioId);
    } catch (error) {
      console.error('Failed to start scenario:', error);
      ToastManager.show('启动挑战失败', 'error', '游戏错误');
      
      // Fallback to static content
      this.loadStaticGameContent(scenarioId);
    }
  }

  static async loadStaticGameContent(scenarioId) {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    const scenarios = NavigationManager.getMockScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);

    if (scenario && scenario.content) {
      gameContainer.innerHTML = this.renderStaticGameContent(scenario);
      this.initializeStaticGame(scenario);
    } else {
      console.error('Scenario not found:', scenarioId);
      gameContainer.innerHTML = '<div class="error">场景内容未找到</div>';
    }
  }

  static async loadGameContent(scenarioId) {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    try {
      const scenario = await ApiService.scenarios.getById(scenarioId);
      gameContainer.innerHTML = this.renderGameContent(scenario);
    } catch (error) {
      // Fallback to mock game content based on scenarioId
      console.warn('API调用失败，使用基于scenarioId的mock内容:', scenarioId);
      gameContainer.innerHTML = this.getMockGameContent(scenarioId);
    }
  }

  static showGameModal() {
    const modal = document.getElementById('game-modal');
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  static hideGameModal() {
    const modal = document.getElementById('game-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
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
    // Update state with new game state
    if (AppState.currentGame) {
      Object.assign(AppState.currentGame, newState);
    }

    // Update UI with new game state
    const gameStateDisplay = document.getElementById('game-state');
    if (gameStateDisplay) {
      gameStateDisplay.innerHTML = `
        <h3>游戏状态</h3>
        <p>满意度: ${newState.satisfaction || 'N/A'}</p>
        <p>声誉: ${newState.reputation || 'N/A'}</p>
        <p>知识: ${newState.knowledge || 'N/A'}</p>
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