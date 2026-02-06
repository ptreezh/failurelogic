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
  userId: 'user_' + Date.now(), // Generate a default user ID
  userProfile: null,
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
    '/learning-path': 'learning-path',
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
      case 'learning-path':
        return this.getLearningPathPage();
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
      },
      // Business Strategy Reasoning Game (business-strategy-reasoning)
      {
        id: "business-strategy-reasoning",
        name: "商业战略推理游戏",
        description: "模拟商业决策推理过程，测试用户在复杂商业环境中的决策思维",
        fullDescription: "在这个商业战略推理游戏中，您将面对复杂的商业决策场景，体验多种认知陷阱，包括线性思维、确认偏误和复杂系统误解。游戏涉及市场分析、资源配置、竞争策略等多个维度。",
        difficulty: "intermediate",
        estimatedDuration: 30,
        targetBiases: ["linear_thinking", "confirmation_bias", "complex_system_misunderstanding"],
        cognitiveBias: "商业决策认知陷阱",
        duration: "30-45分钟",
        category: "商业战略",
        thumbnail: "/assets/images/business-strategy.jpg",
        initialState: {
          marketShare: 25,
          cashFlow: 50000,
          teamMorale: 70,
          turn: 1
        },
        advancedChallenges: [
          {
            title: "市场动态响应",
            description: "处理快速变化的市场需求和竞争对手反应",
            difficulty: "intermediate",
            cognitiveBiases: ["linear_thinking", "confirmation_bias"]
          },
          {
            title: "复杂商业生态系统",
            description: "管理多方利益相关者和复杂供应链关系",
            difficulty: "advanced",
            cognitiveBiases: ["complex_system_misunderstanding", "cascade_failure_blindness"]
          }
        ]
      },
      // Public Policy Making Simulation (public-policy-making)
      {
        id: "public-policy-making",
        name: "公共政策制定模拟",
        description: "模拟公共政策制定过程，平衡多方利益相关者需求",
        fullDescription: "在这个公共政策制定模拟中，您将扮演政策制定者，需要平衡选民、利益集团、专家意见等多方需求，体验时间延迟、确认偏误、复杂系统等认知陷阱对政策制定的影响。",
        difficulty: "intermediate",
        estimatedDuration: 35,
        targetBiases: ["time_delay_bias", "confirmation_bias", "stakeholder_complexity"],
        cognitiveBias: "政策制定认知陷阱",
        duration: "35-50分钟",
        category: "公共政策",
        thumbnail: "/assets/images/public-policy.jpg",
        initialState: {
          publicSupport: 60,
          budget: 1000000,
          stakeholderPressure: 50,
          turn: 1
        },
        advancedChallenges: [
          {
            title: "多方利益平衡",
            description: "协调不同利益集团间的复杂关系",
            difficulty: "intermediate",
            cognitiveBiases: ["stakeholder_complexity", "short_term_bias"]
          },
          {
            title: "政策连锁反应",
            description: "处理政策决定引发的复杂连锁反应",
            difficulty: "advanced",
            cognitiveBiases: ["complex_system_misunderstanding", "unintended_consequence_blindness"]
          }
        ]
      },
      // Personal Finance Decision Simulation (personal-finance-decision)
      {
        id: "personal-finance-decision",
        name: "个人财务决策模拟",
        description: "模拟个人长期财务规划决策，体验复利和时间价值概念",
        fullDescription: "在这个个人财务决策模拟中，您将制定长期财务规划，体验复利增长、时间价值、风险评估等概念，理解短视偏误和线性思维对财务决策的影响。",
        difficulty: "beginner",
        estimatedDuration: 25,
        targetBiases: ["compound_interest_misunderstanding", "short_term_bias", "risk_misjudgment"],
        cognitiveBias: "财务决策认知陷阱",
        duration: "25-40分钟",
        category: "个人理财",
        thumbnail: "/assets/images/personal-finance.jpg",
        initialState: {
          savings: 50000,
          income: 5000,
          debt: 10000,
          investmentKnowledge: 30,
          turn: 1
        },
        advancedChallenges: [
          {
            title: "复合增长效应",
            description: "理解长期投资的复合增长模式",
            difficulty: "intermediate",
            cognitiveBiases: ["compound_interest_misunderstanding", "exponential_growth_blindness"]
          },
          {
            title: "风险管理",
            description: "平衡风险与回报的复杂关系",
            difficulty: "advanced",
            cognitiveBiases: ["risk_misjudgment", "correlation_misunderstanding"]
          }
        ]
      },
      // Global Climate Change Policy Making Game (climate-change-policy)
      {
        id: "climate-change-policy",
        name: "全球气候变化政策制定博弈",
        description: "模拟多国在气候变化政策制定中的博弈与权衡",
        fullDescription: "在这个高级政策制定博弈中，您将代表一个国家参与国际气候谈判，平衡经济发展、环境保护、国际合作等多重目标，体验复杂系统思维、长期规划、跨文化沟通等挑战。",
        difficulty: "advanced",
        estimatedDuration: 60,
        targetBiases: ["complex_system_misunderstanding", "long_term_blindness", "multilateral_negotiation_complexity"],
        cognitiveBias: "气候变化政策认知陷阱",
        duration: "60-90分钟",
        category: "环境政策",
        thumbnail: "/assets/images/climate-change.jpg",
        initialState: {
          carbonEmissions: 80,
          economicGrowth: 3.5,
          internationalStanding: 60,
          turn: 1
        },
        advancedChallenges: [
          {
            title: "国际合作博弈",
            description: "处理多边合作中的信任建立与利益平衡",
            difficulty: "intermediate",
            cognitiveBiases: ["cooperation_complexity", "trust_misjudgment"]
          },
          {
            title: "复杂环境系统",
            description: "理解气候系统的复杂反馈机制",
            difficulty: "advanced",
            cognitiveBiases: ["complex_system_misunderstanding", "delayed_effect_blindness"]
          }
        ]
      },
      // AI Governance and Regulation Decision Simulation (ai-governance-regulation)
      {
        id: "ai-governance-regulation",
        name: "AI治理与监管决策模拟",
        description: "模拟AI治理政策制定，平衡创新、安全、伦理等多方面考量",
        fullDescription: "在这个AI治理决策模拟中，您将面对新兴技术治理的复杂挑战，平衡技术创新、安全保障、伦理标准、国际合作等多重目标，体验技术政策制定中的认知陷阱。",
        difficulty: "advanced",
        estimatedDuration: 70,
        targetBiases: ["technology_complexity_misunderstanding", "regulatory_complexity", "innovation_vs_safety_tradeoff"],
        cognitiveBias: "AI治理认知陷阱",
        duration: "70-100分钟",
        category: "科技政策",
        thumbnail: "/assets/images/ai-governance.jpg",
        initialState: {
          innovationRate: 60,
          safetyStandards: 40,
          publicTrust: 55,
          internationalCooperation: 50,
          turn: 1
        },
        advancedChallenges: [
          {
            title: "创新安全平衡",
            description: "平衡技术创新与安全保障的复杂关系",
            difficulty: "intermediate",
            cognitiveBiases: ["innovation_vs_safety_misunderstanding", "risk_assessment_bias"]
          },
          {
            title: "技术复杂性",
            description: "理解AI技术发展的复杂性和不确定性",
            difficulty: "advanced",
            cognitiveBiases: ["technology_complexity_misunderstanding", "emergent_behavior_blindness"]
          }
        ]
      },
      // Complex Financial Markets Crisis Response Simulation (financial-crisis-response)
      {
        id: "financial-crisis-response",
        name: "复杂金融市场危机应对模拟",
        description: "模拟金融危机应对决策，处理复杂金融系统风险",
        fullDescription: "在这个金融危机应对模拟中，您将作为决策者处理复杂的金融系统风险，平衡市场稳定、机构救助、道德风险等多重考量，体验系统性风险、连锁反应、政策传导等复杂概念。",
        difficulty: "advanced",
        estimatedDuration: 75,
        targetBiases: ["systematic_risk_misunderstanding", "market_complexity", "policy_transmission_mechanism"],
        cognitiveBias: "金融危机应对认知陷阱",
        duration: "75-110分钟",
        category: "金融监管",
        thumbnail: "/assets/images/financial-crisis.jpg",
        initialState: {
          marketStability: 70,
          bankSolventcy: 65,
          investorConfidence: 55,
          systemicRiskLevel: 40,
          turn: 1
        },
        advancedChallenges: [
          {
            title: "系统性风险识别",
            description: "识别和应对金融系统中的系统性风险",
            difficulty: "intermediate",
            cognitiveBiases: ["systematic_risk_misunderstanding", "correlation_blindness"]
          },
          {
            title: "政策传导机制",
            description: "理解政策措施在复杂系统中的传导机制",
            difficulty: "advanced",
            cognitiveBiases: ["policy_transmission_misunderstanding", "complex_system_misunderstanding"]
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

  static getLearningPathPage() {
    // Generate personalized learning path if learning engine is available
    let learningPathContent = '<p>加载个性化学习路径中...</p>';
    
    if (window.PersonalizedLearningEngine && AppState.userId) {
      const userId = AppState.userId;
      const userPath = window.PersonalizedLearningEngine.generateLearningPath(userId);
      
      if (userPath && userPath.length > 0) {
        learningPathContent = `
          <div class="learning-path-intro">
            <h2>为您定制的学习路径</h2>
            <p>根据您的学习进度和认知特点，我们为您推荐以下学习路径：</p>
          </div>
          
          <div class="learning-path-grid">
            ${userPath.map((item, index) => `
              <div class="learning-path-card">
                <div class="path-priority priority-${item.priority}">
                  ${item.priority.toUpperCase()}
                </div>
                <h3>${this.getScenarioNameById(item.scenarioId)}</h3>
                <p class="path-focus">重点关注: ${item.focus}</p>
                <p class="path-difficulty">难度: ${item.difficulty}</p>
                <button class="btn btn-primary" onclick="GameManager.startScenario('${item.scenarioId}')">
                  开始挑战
                </button>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        learningPathContent = `
          <div class="learning-path-intro">
            <h2>个性化学习路径</h2>
            <p>开始一些挑战来构建您的个性化学习路径！</p>
            <p>系统将根据您的表现推荐最适合您的学习内容。</p>
          </div>
        `;
      }
    }
    
    return `
      <section class="page-section learning-path-page">
        <header class="page-header">
          <h1>个性化学习路径</h1>
          <p>基于您的表现和认知特点的个性化推荐</p>
        </header>
        
        <div class="learning-path-content">
          ${learningPathContent}
        </div>
        
        <div class="learning-insights">
          <h3>学习洞察</h3>
          <div class="insights-grid">
            <div class="insight-card">
              <h4>🧠 认知偏向分析</h4>
              <p>识别您最容易陷入的认知偏向，提供针对性训练</p>
            </div>
            <div class="insight-card">
              <h4>📈 学习进度追踪</h4>
              <p>实时追踪您的学习进度和改进趋势</p>
            </div>
            <div class="insight-card">
              <h4>🎯 个性化反馈</h4>
              <p>根据您的决策模式提供个性化建议</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static getScenarioNameById(scenarioId) {
    const scenarios = this.getMockScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);
    return scenario ? scenario.name : scenarioId;
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
  static calculateBusinessStrategyTurn(turn, decisions, gameState, decisionHistory, delayedEffects) {
    const { satisfaction = 50, resources = 10000, reputation = 50, market_position = 30, product_quality = 50, competitive_pressure = 20 } = gameState;

    // Initialize result
    let result = {
      newGameState: { ...gameState },
      linearExpectation: {},
      actualResult: {},
      feedback: '',
      newDelayedEffects: [],
      gameOver: false,
      gameOverReason: null
    };

    // Calculate linear expectation (what player expects)
    result.linearExpectation = this.calculateBusinessStrategyLinearExpectation(turn, decisions, gameState);

    // Calculate actual result (complex system reality)
    const actual = this.calculateBusinessStrategyActualResult(turn, decisions, gameState, decisionHistory);

    // Apply delayed effects from previous turns
    const delayedEffectsResult = this.applyBusinessStrategyDelayedEffects(turn, delayedEffects, gameState);
    result.newGameState = { ...delayedEffectsResult.state };

    // Apply current turn effects
    result.newGameState.resources += actual.effects.resources;
    result.newGameState.reputation += actual.effects.reputation;
    result.newGameState.market_position += actual.effects.market_position;
    result.newGameState.product_quality += actual.effects.product_quality;
    result.newGameState.competitive_pressure += actual.effects.competitive_pressure;

    // Ensure values stay within bounds
    result.newGameState.satisfaction = Math.max(0, Math.min(100, result.newGameState.satisfaction));
    result.newGameState.resources = Math.max(0, result.newGameState.resources);
    result.newGameState.reputation = Math.max(0, Math.min(100, result.newGameState.reputation));
    result.newGameState.market_position = Math.max(0, Math.min(100, result.newGameState.market_position));
    result.newGameState.product_quality = Math.max(0, Math.min(100, result.newGameState.product_quality));
    result.newGameState.competitive_pressure = Math.max(0, Math.min(100, result.newGameState.competitive_pressure));

    result.actualResult = {
      satisfaction: result.newGameState.satisfaction,
      resources: result.newGameState.resources,
      reputation: result.newGameState.reputation,
      market_position: result.newGameState.market_position,
      product_quality: result.newGameState.product_quality,
      competitive_pressure: result.newGameState.competitive_pressure,
      changes: actual.effects
    };

    // Add new delayed effects
    result.newDelayedEffects = actual.delayedEffects || [];

    // Generate feedback
    result.feedback = this.generateBusinessStrategyFeedback(turn, result.linearExpectation, result.actualResult, actual.narrative);

    // Check game over conditions
    if (result.newGameState.resources < 1000) {
      result.gameOver = true;
      result.gameOverReason = 'resources';
    } else if (result.newGameState.reputation < 10) {
      result.gameOver = true;
      result.gameOverReason = 'reputation';
    } else if (result.newGameState.market_position < 5) {
      result.gameOver = true;
      result.gameOverReason = 'market_position';
    }

    return result;
  }

  static calculateBusinessStrategyLinearExpectation(turn, decisions, gameState) {
    const { resources = 10000, reputation = 50, market_position = 30 } = gameState;
    let expected = {
      resources,
      reputation,
      market_position,
      thinking: ''
    };

    switch(turn) {
      case 1:
        // Turn 1: Initial strategy decision
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'rush_to_market':
            expected.resources = resources + 1500; // Expected quick gains
            expected.market_position = market_position + 20; // Expected market share gain
            expected.reputation = reputation - 5; // Potential quality concerns
            expected.thinking = `快速上市，预期获得¥1500收益和20%市场地位提升，但可能影响声誉`;
            break;
          case 'perfect_product':
            expected.resources = resources + 800; // Moderate gain
            expected.market_position = market_position + 10; // Moderate market share gain
            expected.reputation = reputation + 15; // Quality boost
            expected.thinking = `完美产品策略，预期获得¥800收益，声誉大幅提升`;
            break;
          case 'acquire_competitor':
            expected.resources = resources + 1200; // Gain from acquisition
            expected.market_position = market_position + 25; // Significant market share gain
            expected.reputation = reputation + 5; // Acquisition may be viewed positively
            expected.thinking = `收购策略，预期获得¥1200收益和25%市场地位提升`;
            break;
          case 'partnership':
            expected.resources = resources + 1000; // Partnership benefits
            expected.market_position = market_position + 15; // Moderate gain
            expected.reputation = reputation + 10; // Collaboration viewed favorably
            expected.thinking = `合作策略，预期获得¥1000收益和15%市场地位提升`;
            break;
          default:
            expected.thinking = `选择了策略，预期获得相应收益`;
        }
        break;

      case 2:
        // Turn 2: Response to market developments
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'recall_all':
            expected.resources = resources - 800; // Cost of recall
            expected.reputation = reputation + 20; // Reputation recovery
            expected.thinking = `召回策略，短期损失¥800但恢复声誉`;
            break;
          case 'handle_privately':
            expected.resources = resources + 500; // No recall costs
            expected.reputation = reputation - 10; // Potential reputation damage
            expected.thinking = `私下处理，短期获益但有声誉风险`;
            break;
          case 'acknowledge_improve':
            expected.resources = resources + 200; // Moderate impact
            expected.reputation = reputation + 10; // Transparency helps
            expected.thinking = `承认并改进，平衡短期损失与长期 reputation`;
            break;
          case 'ignore_issue':
            expected.resources = resources + 700; // Short-term benefit
            expected.reputation = reputation - 25; // Severe reputation damage
            expected.thinking = `忽略问题，短期获益但声誉风险极高`;
            break;
        }
        break;

      default:
        expected.thinking = `继续执行当前策略`;
    }

    return expected;
  }

  static calculateBusinessStrategyActualResult(turn, decisions, gameState, decisionHistory) {
    const { resources = 10000, reputation = 50, market_position = 30, product_quality = 50, competitive_pressure = 20 } = gameState;

    let effects = {
      resources: 0,
      reputation: 0,
      market_position: 0,
      product_quality: 0,
      competitive_pressure: 0
    };

    let narrative = '';
    let delayedEffects = [];

    switch(turn) {
      case 1:
        // Turn 1: Initial strategy with complex market dynamics
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'rush_to_market':
            // Reality: Market is saturated, quality issues arise, competitors react
            effects.resources = 500; // Lower than expected gains
            effects.market_position = 10; // Smaller gain due to competition
            effects.reputation = -10; // Quality issues hurt reputation
            effects.product_quality = -15; // Rushed product has quality issues
            effects.competitive_pressure = 20; // Competitors intensify marketing
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                reputation: -5, 
                market_position: -10,
                description: '质量问题的后续影响在第2回合显现'
              }
            });

            narrative = `快速上市策略带来了一些初期收益，但也暴露了质量问题。竞争对手迅速加大营销力度，市场饱和程度超预期。短期内获得¥500收益，市场地位仅增长10%，但声誉受损严重。`;
            break;

          case 'perfect_product':
            // Reality: Some gains, but lose first-mover advantage
            effects.resources = 600; // Lower than expected due to timing
            effects.market_position = 5; // Smaller gain due to late entry
            effects.reputation = 10; // Quality helps reputation
            effects.product_quality = 15; // Product improves
            effects.competitive_pressure = 15; // Competitors gain advantage
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                market_position: 5, 
                reputation: 5,
                description: '高质量产品的长期价值在第2回合开始显现'
              }
            });

            narrative = `完美产品策略提高了产品质量和声誉，但错失了先发优势。竞争对手已抢占部分市场，短期内收益和市场地位增长有限，但为长期发展奠定基础。`;
            break;

          case 'acquire_competitor':
            // Reality: High cost, integration issues, regulatory scrutiny
            effects.resources = -500; // Unexpected costs and integration expenses
            effects.market_position = 15; // Partial market gain
            effects.reputation = -5; // Regulatory and ethical concerns
            effects.product_quality = -5; // Integration disrupts operations
            effects.competitive_pressure = 10; // Remaining competitors consolidate
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                resources: 800, 
                market_position: 10,
                description: '收购整合效益在第2回合开始显现'
              }
            });

            narrative = `收购策略带来意外的整合成本和监管审查。虽然获得了一部分市场份额，但支出超出预期，运营受到干扰。长期来看，整合效益将在未来回合显现。`;
            break;

          case 'partnership':
            // Reality: Moderate gains, shared risks and rewards
            effects.resources = 700; // Shared gains
            effects.market_position = 12; // Collaborative market gain
            effects.reputation = 8; // Partnership viewed positively
            effects.product_quality = 5; // Shared technology improves quality
            effects.competitive_pressure = 5; // Partnership provides some protection
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                resources: 200, 
                market_position: 5,
                description: '合作伙伴关系的协同效应在第2回合显现'
              }
            });

            narrative = `合作策略带来稳健的增长和正面声誉。通过资源共享，获得了稳定的收益和市场地位提升。合作关系提供了竞争优势，但也需要持续维护。`;
            break;

          default:
            effects.resources = 100;
            effects.market_position = 2;
            narrative = `采取了某种策略，产生了中性影响。`;
        }
        break;

      case 2:
        // Turn 2: Response to market developments with complex consequences
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'recall_all':
            // Reality: Costly but reputation-saving
            effects.resources = -600; // Recall costs
            effects.reputation = 25; // Strong reputation recovery
            effects.market_position = -5; // Temporary loss of market share
            effects.competitive_pressure = -10; // Competitors may pause
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                market_position: 15, 
                resources: 400,
                description: '声誉恢复带动市场地位和收益在第3回合回升'
              }
            });

            narrative = `召回决策成本高昂，短期内损失¥600并失去部分市场份额，但成功恢复了声誉。消费者认可公司的负责任态度，为未来增长奠定基础。`;
            break;

          case 'handle_privately':
            // Reality: Short-term gains, long-term risks
            effects.resources = 400; // Reduced recall costs
            effects.reputation = -15; // Discovery of hidden problems causes greater damage
            effects.market_position = -10; // Customer loss due to discovered issues
            effects.competitive_pressure = 20; // Competitors exploit the situation
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                resources: -800, 
                reputation: -30,
                description: '隐瞒问题的后果在第3回合全面显现'
              }
            });

            narrative = `私下处理质量问题在短期内节省了成本，但问题被曝光后造成了更大的声誉损害。消费者感到被欺骗，市场份额下降，竞争对手趁机攻击。`;
            break;

          case 'acknowledge_improve':
            // Reality: Balanced approach with mixed results
            effects.resources = 100; // Moderate cost
            effects.reputation = 15; // Transparency helps
            effects.market_position = 0; // Neutral impact on market position
            effects.product_quality = 10; // Improvements implemented
            effects.competitive_pressure = -5; // Differentiation helps
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                market_position: 10, 
                resources: 300,
                description: 'Transparency and improvement efforts pay off in the long term'
              }
            });

            narrative = `公开承认问题并承诺改进的做法获得了消费者的认可。虽然短期内收益有限，但为长期发展建立了信任基础，产品质量得到提升。`;
            break;

          case 'ignore_issue':
            // Reality: Disastrous consequences
            effects.resources = 200; // Short-term gain before problems surface
            effects.reputation = -35; // Major reputation crisis
            effects.market_position = -25; // Massive customer loss
            effects.competitive_pressure = 30; // Competitors capitalize on weakness
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                resources: -1000, 
                market_position: -40,
                reputation: -40,
                description: 'Ignoring the issue leads to company failure'
              }
            });

            narrative = `忽视质量问题导致了严重的声誉危机。媒体广泛报道，消费者集体抵制，市场份额急剧下降。竞争对手全面进攻，公司陷入困境。`;
            break;
        }
        break;
    }

    return { effects, narrative, delayedEffects };
  }

  static calculatePublicPolicyTurn(turn, decisions, gameState, decisionHistory, delayedEffects) {
    const { resources = 10000, reputation = 50, public_support = 50, policy_effectiveness = 30, stakeholder_pressure = 20 } = gameState;

    // Initialize result
    let result = {
      newGameState: { ...gameState },
      linearExpectation: {},
      actualResult: {},
      feedback: '',
      newDelayedEffects: [],
      gameOver: false,
      gameOverReason: null
    };

    // Calculate linear expectation (what player expects)
    result.linearExpectation = this.calculatePublicPolicyLinearExpectation(turn, decisions, gameState);

    // Calculate actual result (complex system reality)
    const actual = this.calculatePublicPolicyActualResult(turn, decisions, gameState, decisionHistory);

    // Apply delayed effects from previous turns
    const delayedEffectsResult = this.applyPublicPolicyDelayedEffects(turn, delayedEffects, gameState);
    result.newGameState = { ...delayedEffectsResult.state };

    // Apply current turn effects
    result.newGameState.resources += actual.effects.resources;
    result.newGameState.reputation += actual.effects.reputation;
    result.newGameState.public_support += actual.effects.public_support;
    result.newGameState.policy_effectiveness += actual.effects.policy_effectiveness;
    result.newGameState.stakeholder_pressure += actual.effects.stakeholder_pressure;

    // Ensure values stay within bounds
    result.newGameState.resources = Math.max(0, result.newGameState.resources);
    result.newGameState.reputation = Math.max(0, Math.min(100, result.newGameState.reputation));
    result.newGameState.public_support = Math.max(0, Math.min(100, result.newGameState.public_support));
    result.newGameState.policy_effectiveness = Math.max(0, Math.min(100, result.newGameState.policy_effectiveness));
    result.newGameState.stakeholder_pressure = Math.max(0, Math.min(100, result.newGameState.stakeholder_pressure));

    result.actualResult = {
      resources: result.newGameState.resources,
      reputation: result.newGameState.reputation,
      public_support: result.newGameState.public_support,
      policy_effectiveness: result.newGameState.policy_effectiveness,
      stakeholder_pressure: result.newGameState.stakeholder_pressure,
      changes: actual.effects
    };

    // Add new delayed effects
    result.newDelayedEffects = actual.delayedEffects || [];

    // Generate feedback
    result.feedback = this.generatePublicPolicyFeedback(turn, result.linearExpectation, result.actualResult, actual.narrative);

    // Check game over conditions
    if (result.newGameState.reputation < 15) {
      result.gameOver = true;
      result.gameOverReason = 'reputation';
    } else if (result.newGameState.public_support < 10) {
      result.gameOver = true;
      result.gameOverReason = 'public_support';
    } else if (result.newGameState.resources < 1000) {
      result.gameOver = true;
      result.gameOverReason = 'resources';
    }

    return result;
  }

  static calculatePublicPolicyLinearExpectation(turn, decisions, gameState) {
    const { resources = 10000, reputation = 50, public_support = 50, policy_effectiveness = 30 } = gameState;
    let expected = {
      resources,
      reputation,
      public_support,
      policy_effectiveness,
      thinking: ''
    };

    switch(turn) {
      case 1:
        // Turn 1: Initial policy decision
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'new_subway':
            expected.resources = resources - 6000; // High cost
            expected.policy_effectiveness = policy_effectiveness + 25; // High expected effectiveness
            expected.public_support = public_support + 10; // Expected positive reception
            expected.reputation = reputation + 15; // Infrastructure investment viewed positively
            expected.thinking = `地铁建设，预期花费¥6000，政策效果提升25，公众支持提升10`;
            break;
          case 'bus_expansion':
            expected.resources = resources - 3000; // Medium cost
            expected.policy_effectiveness = policy_effectiveness + 15; // Medium effectiveness
            expected.public_support = public_support + 8; // Positive reception
            expected.reputation = reputation + 10; // Good investment
            expected.thinking = `公交扩展，预期花费¥3000，政策效果提升15，公众支持提升8`;
            break;
          case 'congestion_fee':
            expected.resources = resources - 500; // Low cost
            expected.policy_effectiveness = policy_effectiveness + 20; // High effectiveness
            expected.public_support = public_support - 15; // Negative public reaction
            expected.reputation = reputation - 10; // May harm reputation
            expected.thinking = `拥堵费，预期花费¥500，政策效果提升20，但公众支持下降15`;
            break;
          case 'bike_lanes':
            expected.resources = resources - 1500; // Low cost
            expected.policy_effectiveness = policy_effectiveness + 10; // Low effectiveness
            expected.public_support = public_support + 5; // Mixed reception
            expected.reputation = reputation + 5; // Environmental initiative
            expected.thinking = `自行车道，预期花费¥1500，政策效果提升10，公众支持提升5`;
            break;
          default:
            expected.thinking = `选择了政策，预期获得相应效果`;
        }
        break;

      case 2:
        // Turn 2: Response to feedback
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'stick_to_plan':
            expected.resources = resources; // No additional cost
            expected.reputation = reputation + 5; // Consistency valued
            expected.public_support = public_support - 5; // May disappoint some groups
            expected.thinking = `坚持计划，保持政策一致性，但可能失去部分支持`;
            break;
          case 'collect_feedback':
            expected.resources = resources - 800; // Cost of consultation
            expected.reputation = reputation + 10; // Democratic approach
            expected.public_support = public_support + 15; // Participation increases support
            expected.thinking = `收集反馈，花费¥800，提升声誉和公众支持`;
            break;
          case 'restart_consultation':
            expected.resources = resources - 2000; // High cost of restart
            expected.reputation = reputation + 15; // Transparent approach
            expected.public_support = public_support + 20; // Extensive participation
            expected.thinking = `重新协商，花费¥2000，大幅提升声誉和公众支持`;
            break;
          case 'delegate_responsibility':
            expected.resources = resources; // No direct cost
            expected.reputation = reputation - 20; // Avoiding responsibility
            expected.public_support = public_support - 10; // May seem evasive
            expected.thinking = `转移责任，短期避免 blame，但损害声誉`;
            break;
        }
        break;

      default:
        expected.thinking = `继续执行当前政策`;
    }

    return expected;
  }

  static calculatePublicPolicyActualResult(turn, decisions, gameState, decisionHistory) {
    const { resources = 10000, reputation = 50, public_support = 50, policy_effectiveness = 30, stakeholder_pressure = 20 } = gameState;

    let effects = {
      resources: 0,
      reputation: 0,
      public_support: 0,
      policy_effectiveness: 0,
      stakeholder_pressure: 0
    };

    let narrative = '';
    let delayedEffects = [];

    switch(turn) {
      case 1:
        // Turn 1: Initial policy with complex political dynamics
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'new_subway':
            // Reality: Cost overruns, construction disruption, environmental concerns
            effects.resources = -7500; // Higher than expected costs
            effects.policy_effectiveness = 15; // Lower than expected due to delays
            effects.public_support = -5; // Construction disruption causes complaints
            effects.reputation = 5; // Mixed reception
            effects.stakeholder_pressure = 25; // Various interest groups emerge
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                public_support: 15, 
                policy_effectiveness: 10,
                description: '地铁建设的长期效益在第2回合开始显现'
              }
            });

            narrative = `地铁建设项目面临预算超支和施工干扰等问题。虽然长期效益明显，但短期内造成交通混乱和噪音污染，引发部分市民不满。预期的¥6000成本实际增至¥7500，政策效果和公众支持均低于预期。`;
            break;

          case 'bus_expansion':
            // Reality: Implementation challenges, limited reach
            effects.resources = -3500; // Slightly higher cost
            effects.policy_effectiveness = 12; // Moderate effectiveness
            effects.public_support = 5; // Generally positive reception
            effects.reputation = 8; // Solid infrastructure investment
            effects.stakeholder_pressure = 15; // Bus companies and transit advocates
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                policy_effectiveness: 8, 
                public_support: 5,
                description: '公交服务改善效果在第2回合进一步显现'
              }
            });

            narrative = `公交扩展项目按计划实施，成本略有超支。市民对公交服务改善表示满意，但覆盖面仍显不足。政策效果和公众支持略低于预期，但整体反响积极。`;
            break;

          case 'congestion_fee':
            // Reality: Political backlash, evasion tactics, implementation costs
            effects.resources = -1200; // Implementation costs plus administrative overhead
            effects.policy_effectiveness = 12; // Some effectiveness despite resistance
            effects.public_support = -25; // Strong negative reaction
            effects.reputation = -15; // Politically unpopular
            effects.stakeholder_pressure = 35; // Strong opposition from drivers and businesses
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                public_support: 10, 
                policy_effectiveness: 8,
                description: '拥堵费的交通改善效果在第2回合逐渐显现'
              }
            });

            narrative = `拥堵费政策遭遇强烈政治反弹，企业和市民抗议不断。尽管在一定程度上缓解了交通拥堵，但社会成本巨大。公众支持率大幅下降，政治声誉受损严重。`;
            break;

          case 'bike_lanes':
            // Reality: Limited impact, safety concerns, maintenance costs
            effects.resources = -1800; // Higher maintenance costs
            effects.policy_effectiveness = 6; // Lower than expected impact
            effects.public_support = 8; // Positive among environmentalists
            effects.reputation = 3; // Moderate reputation boost
            effects.stakeholder_pressure = 10; // Cycling advocacy vs car owner groups
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                public_support: 12, 
                policy_effectiveness: 4,
                description: '环保效益和健康意识提升在第2回合显现'
              }
            });

            narrative = `自行车道项目成本略高于预期，对整体交通改善影响有限。然而，环保人士和健康倡导者给予积极评价，为长期可持续发展奠定基础。`;
            break;

          default:
            effects.resources = -500;
            effects.policy_effectiveness = 5;
            narrative = `采取了某种政策，产生了中性影响。`;
        }
        break;

      case 2:
        // Turn 2: Response to feedback with complex political consequences
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'stick_to_plan':
            // Reality: Political costs of ignoring feedback
            effects.resources = 0; // No additional cost
            effects.reputation = -10; // Perceived as inflexible
            effects.public_support = -15; // Ignoring public concerns
            effects.stakeholder_pressure = 20; // Pressure from critics
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                policy_effectiveness: 20, 
                public_support: 10,
                description: 'Policy consistency pays off in long-term results'
              }
            });

            narrative = `坚持原有计划的决策被视为缺乏灵活性，公众认为政府无视民意。尽管政策本身可能有效，但政治成本高昂，支持率进一步下降。`;
            break;

          case 'collect_feedback':
            // Reality: Benefits of inclusive decision-making
            effects.resources = -600; // Lower than expected consultation cost
            effects.reputation = 15; // Valued democratic approach
            effects.public_support = 20; // Increased participation builds support
            effects.policy_effectiveness = 5; // Adjustments improve outcomes
            effects.stakeholder_pressure = -5; // Better alignment reduces pressure
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                policy_effectiveness: 15, 
                public_support: 10,
                description: 'Stakeholder buy-in leads to better implementation'
              }
            });

            narrative = `收集反馈的决策受到公众好评，被认为体现了民主参与精神。虽然增加了短期成本，但获得了更广泛的公众支持和更好的政策调整方向。`;
            break;

          case 'restart_consultation':
            // Reality: High cost but builds consensus
            effects.resources = -1800; // More efficient than expected
            effects.reputation = 20; // Transparent governance
            effects.public_support = 25; // Extensive participation
            effects.policy_effectiveness = 8; // Better alignment with needs
            effects.stakeholder_pressure = -10; // Consensus reduces conflict
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                policy_effectiveness: 25, 
                reputation: 10,
                description: 'Broad consensus leads to exceptional outcomes'
              }
            });

            narrative = `重新协商的决策虽然成本较高，但建立了前所未有的共识。各利益相关方积极参与，为政策成功实施奠定了坚实基础。`;
            break;

          case 'delegate_responsibility':
            // Reality: Short-term relief, long-term problems
            effects.resources = 0; // No direct cost
            effects.reputation = -25; // Seen as avoiding accountability
            effects.public_support = -20; // Loses trust
            effects.stakeholder_pressure = 15; // Others face the pressure
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                reputation: -30, 
                policy_effectiveness: -15,
                description: 'Lack of leadership leads to policy failure'
              }
            });

            narrative = `转移责任的决策被公众视为逃避问责，严重损害了政治声誉。虽然短期内减轻了政治压力，但长期来看破坏了政府信誉和政策连贯性。`;
            break;
        }
        break;
    }

    return { effects, narrative, delayedEffects };
  }

  static applyPublicPolicyDelayedEffects(currentTurn, delayedEffects, currentState) {
    let state = { ...currentState };

    if (!delayedEffects || delayedEffects.length === 0) {
      return { state };
    }

    delayedEffects.forEach(effect => {
      if (effect.turn === currentTurn) {
        if (effect.effect) {
          Object.keys(effect.effect).forEach(key => {
            if (key !== 'description' && state.hasOwnProperty(key)) {
              state[key] += effect.effect[key];
            }
          });
        }
      }
    });

    // Filter out applied effects
    const remainingEffects = delayedEffects.filter(effect => effect.turn !== currentTurn);

    return { state, remainingEffects };
  }

  static calculatePersonalFinanceTurn(turn, decisions, gameState, decisionHistory, delayedEffects) {
    const { resources = 150000, income = 100000, debt = 0, financial_knowledge = 30, risk_tolerance = 50 } = gameState;

    // Initialize result
    let result = {
      newGameState: { ...gameState },
      linearExpectation: {},
      actualResult: {},
      feedback: '',
      newDelayedEffects: [],
      gameOver: false,
      gameOverReason: null
    };

    // Calculate linear expectation (what player expects)
    result.linearExpectation = this.calculatePersonalFinanceLinearExpectation(turn, decisions, gameState);

    // Calculate actual result (complex system reality)
    const actual = this.calculatePersonalFinanceActualResult(turn, decisions, gameState, decisionHistory);

    // Apply delayed effects from previous turns
    const delayedEffectsResult = this.applyPersonalFinanceDelayedEffects(turn, delayedEffects, gameState);
    result.newGameState = { ...delayedEffectsResult.state };

    // Apply current turn effects
    result.newGameState.resources += actual.effects.resources;
    result.newGameState.income += actual.effects.income;
    result.newGameState.debt += actual.effects.debt;
    result.newGameState.financial_knowledge += actual.effects.financial_knowledge;
    result.newGameState.risk_tolerance += actual.effects.risk_tolerance;

    // Ensure values stay within bounds
    result.newGameState.resources = Math.max(0, result.newGameState.resources);
    result.newGameState.income = Math.max(0, result.newGameState.income);
    result.newGameState.debt = Math.max(0, result.newGameState.debt);
    result.newGameState.financial_knowledge = Math.max(0, Math.min(100, result.newGameState.financial_knowledge));
    result.newGameState.risk_tolerance = Math.max(0, Math.min(100, result.newGameState.risk_tolerance));

    result.actualResult = {
      resources: result.newGameState.resources,
      income: result.newGameState.income,
      debt: result.newGameState.debt,
      financial_knowledge: result.newGameState.financial_knowledge,
      risk_tolerance: result.newGameState.risk_tolerance,
      changes: actual.effects
    };

    // Add new delayed effects
    result.newDelayedEffects = actual.delayedEffects || [];

    // Generate feedback
    result.feedback = this.generatePersonalFinanceFeedback(turn, result.linearExpectation, result.actualResult, actual.narrative);

    // Check game over conditions
    if ((result.newGameState.debt / (result.newGameState.resources + 1)) > 0.8) { // Debt to asset ratio > 80%
      result.gameOver = true;
      result.gameOverReason = 'debt';
    } else if (result.newGameState.resources < 1000) {
      result.gameOver = true;
      result.gameOverReason = 'resources';
    }

    return result;
  }

  static calculatePersonalFinanceLinearExpectation(turn, decisions, gameState) {
    const { resources = 150000, income = 100000, financial_knowledge = 30 } = gameState;
    let expected = {
      resources,
      income,
      financial_knowledge,
      thinking: ''
    };

    switch(turn) {
      case 1:
        // Turn 1: Initial financial decision
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'buy_car':
            expected.resources = resources - 30000; // Car purchase cost
            expected.income = income; // No change
            expected.financial_knowledge = financial_knowledge + 2; // Minor learning
            expected.thinking = `购车花费¥30000，短期提升生活质量，但减少投资本金`;
            break;
          case 'save_bank':
            expected.resources = resources * 1.02; // 2% bank interest
            expected.income = income;
            expected.financial_knowledge = financial_knowledge + 1; // Basic learning
            expected.thinking = `银行储蓄¥${resources.toFixed(0)}，年收益2%，安全保本`;
            break;
          case 'stock_market':
            expected.resources = resources * 1.10; // 10% expected stock return
            expected.income = income;
            expected.financial_knowledge = financial_knowledge + 5; // Learning about markets
            expected.thinking = `股票投资¥${resources.toFixed(0)}，预期年收益10%，高风险高回报`;
            break;
          case 'index_fund':
            expected.resources = (resources - 5000) * 1.07 + 5000; // 7% index fund return + emergency fund
            expected.income = income;
            expected.financial_knowledge = financial_knowledge + 8; // Learning about diversified investing
            expected.thinking = `指数基金投资¥${(resources-5000).toFixed(0)}，预期年收益7%，风险分散`;
            break;
          default:
            expected.thinking = `选择了理财策略，预期获得相应收益`;
        }
        break;

      case 2:
        // Turn 2: Advanced financial decisions
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'increase_savings_rate':
            expected.resources = resources * 1.07 + income * 0.20; // 7% return + 20% of income saved
            expected.financial_knowledge = financial_knowledge + 10; // Learning about saving strategies
            expected.thinking = `提高储蓄率至20%，投资获得7%收益，同时积累更多本金`;
            break;
          case 'risky_investment':
            expected.resources = resources * 1.15; // 15% expected high-risk return
            expected.financial_knowledge = financial_knowledge + 12; // Learning about high-risk investing
            expected.thinking = `高风险投资，预期年收益15%，但波动性极大`;
            break;
          case 'get_loan_invest':
            expected.resources = (resources + 50000) * 1.14 - 50000 * 1.05; // Leverage with loan at 5%
            expected.debt = 50000 * 1.05; // Loan principal + interest
            expected.thinking = `借贷¥50000投资，放大收益但承担利息成本`;
            break;
          case 'diversify_portfolio':
            expected.resources = resources * 1.06; // 6% more conservative return
            expected.financial_knowledge = financial_knowledge + 15; // Learning about diversification
            expected.thinking = `分散投资降低风险，预期年收益6%，更加稳健`;
            break;
        }
        break;

      default:
        expected.thinking = `继续执行当前财务策略`;
    }

    return expected;
  }

  static calculatePersonalFinanceActualResult(turn, decisions, gameState, decisionHistory) {
    const { resources = 150000, income = 100000, debt = 0, financial_knowledge = 30, risk_tolerance = 50 } = gameState;

    let effects = {
      resources: 0,
      income: 0,
      debt: 0,
      financial_knowledge: 0,
      risk_tolerance: 0
    };

    let narrative = '';
    let delayedEffects = [];

    switch(turn) {
      case 1:
        // Turn 1: Initial financial decision with compound effects
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'buy_car':
            // Reality: Car depreciation, insurance, maintenance costs
            effects.resources = -35000; // Additional costs beyond purchase price
            effects.income = 0; // No change
            effects.financial_knowledge = -2; // Learning from mistake
            effects.risk_tolerance = 5; // Confidence from consumption
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                resources: -2000, // Ongoing maintenance
                financial_knowledge: 3,
                description: '汽车相关费用在第2年继续产生'
              }
            });

            narrative = `购车决策短期内满足了需求，但带来了意料之外的成本：车辆贬值、保险、维修等费用总计¥35000，远超预期。虽然获得了消费的满足感，但减少了可用于投资的资金，错失了复利增长的机会。`;
            break;

          case 'save_bank':
            // Reality: Low returns, inflation risk
            effects.resources = resources * 0.015 - resources; // Only 1.5% actual return after inflation
            effects.income = 0; // No change
            effects.financial_knowledge = 3; // Basic learning about banking
            effects.risk_tolerance = -5; // Becomes more risk-averse
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                resources: resources * 0.015, // Another year of low returns
                financial_knowledge: 2,
                description: 'Low returns continue to compound'
              }
            });

            narrative = `银行储蓄提供了本金安全保障，但实际收益率仅为1.5%（扣除通胀后），错失了更高的投资回报。资金的实际购买力增长缓慢，但获得了财务安全感。`;
            break;

          case 'stock_market':
            // Reality: Volatility, behavioral biases, fees
            const randomReturn = (Math.random() - 0.4) * 0.3 + 0.1; // -20% to +40% range with 10% average
            effects.resources = resources * randomReturn;
            effects.income = 0; // No change
            effects.financial_knowledge = 8; // Significant learning from market experience
            effects.risk_tolerance = randomReturn > 0 ? 10 : -10; // Affected by gains/losses
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                financial_knowledge: 10,
                risk_tolerance: randomReturn > 0 ? 5 : -5,
                description: 'Market experience shapes future risk tolerance'
              }
            });

            narrative = `股票市场投资带来了高波动性体验。本年度收益为${(randomReturn * 100).toFixed(1)}%，可能是正也可能是负。虽然获得了丰富的市场经验，但也体验了市场的残酷波动。`;
            break;

          case 'index_fund':
            // Reality: Moderate returns, low fees, diversification benefits
            effects.resources = (resources - 5000) * 0.065; // 6.5% return after fees
            effects.income = 0; // No change
            effects.financial_knowledge = 12; // Learning about passive investing
            effects.risk_tolerance = 3; // Comfortable with moderate risk
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                resources: (resources - 5000) * 0.065,
                financial_knowledge: 8,
                description: 'Index fund benefits compound over time'
              }
            });

            narrative = `指数基金投资实现了6.5%的稳健回报，费用低廉，风险分散。虽然不如某些个股收益高，但提供了稳定的风险调整后回报。应急资金¥5000提供了财务安全感。`;
            break;

          default:
            effects.resources = -1000;
            effects.financial_knowledge = 2;
            narrative = `采取了某种理财策略，产生了中性影响。`;
        }
        break;

      case 2:
        // Turn 2: Advanced financial decisions with complex consequences
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'increase_savings_rate':
            // Reality: Compounding benefits, lifestyle adjustments
            effects.resources = resources * 0.065 + income * 0.18; // 6.5% return + 18% of income saved
            effects.income = 0; // No direct change
            effects.financial_knowledge = 15; // Learning about savings strategies
            effects.risk_tolerance = -2; // More conservative approach
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                resources: (resources + income * 0.18) * 0.065,
                financial_knowledge: 10,
                description: 'High savings rate accelerates wealth accumulation'
              }
            });

            narrative = `提高储蓄率的决策加速了财富积累。虽然需要在生活方式上做出一些调整，但复利效应开始显现，为长期财务自由奠定了坚实基础。`;
            break;

          case 'risky_investment':
            // Reality: High volatility, potential for significant losses
            const riskyReturn = (Math.random() - 0.5) * 0.5 + 0.15; // -35% to +65% range with 15% average
            effects.resources = resources * riskyReturn;
            effects.income = 0; // No change
            effects.financial_knowledge = riskyReturn > 0 ? 15 : 25; // Learning from gains or significant losses
            effects.risk_tolerance = riskyReturn > 0 ? 20 : -30; // Significantly affected by outcome
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                risk_tolerance: riskyReturn > 0 ? 10 : -20,
                financial_knowledge: 12,
                description: 'Risky investment outcome affects future risk appetite'
              }
            });

            narrative = `高风险投资带来了极端结果，收益为${(riskyReturn * 100).toFixed(1)}%。无论盈亏，都获得了宝贵的市场经验，但可能显著影响了未来的风险偏好。`;
            break;

          case 'get_loan_invest':
            // Reality: Leverage risk, interest costs, potential amplification
            const leverageReturn = (Math.random() - 0.3) * 0.25 + 0.14; // -15% to +43% range with 14% average
            const loanInterest = 0.05; // 5% loan interest
            const borrowedAmount = 50000;
            
            effects.resources = resources * leverageReturn - borrowedAmount * loanInterest;
            effects.debt = borrowedAmount * (1 + loanInterest); // Add loan to debt
            effects.financial_knowledge = 20; // Learning about leverage
            effects.risk_tolerance = leverageReturn > 0.14 ? 15 : -25; // Affected by leverage outcome
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                debt: borrowedAmount * loanInterest * 0.8, // Ongoing interest
                risk_tolerance: leverageReturn > 0.14 ? 8 : -15,
                description: 'Leverage continues to affect financial position'
              }
            });

            narrative = `借贷投资策略放大了收益和风险。本年度投资回报为${(leverageReturn * 100).toFixed(1)}%，但需支付¥${(borrowedAmount * loanInterest).toFixed(0)}的利息。财务杠杆既可能加速财富增长，也可能加剧损失。`;
            break;

          case 'diversify_portfolio':
            // Reality: Lower volatility, modest returns, peace of mind
            effects.resources = resources * 0.055; // Conservative 5.5% return
            effects.income = 0; // No change
            effects.financial_knowledge = 22; // Deep learning about diversification
            effects.risk_tolerance = 8; // Better understanding of risk management
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                financial_knowledge: 15,
                risk_tolerance: 5,
                description: 'Diversification strategy provides stability over time'
              }
            });

            narrative = `分散投资策略提供了稳定的5.5%回报，波动性较低。虽然收益率不如某些集中投资策略，但提供了心理上的安宁和风险控制。`;
            break;
        }
        break;
    }

    return { effects, narrative, delayedEffects };
  }

  static applyPersonalFinanceDelayedEffects(currentTurn, delayedEffects, currentState) {
    let state = { ...currentState };

    if (!delayedEffects || delayedEffects.length === 0) {
      return { state };
    }

    delayedEffects.forEach(effect => {
      if (effect.turn === currentTurn) {
        if (effect.effect) {
          Object.keys(effect.effect).forEach(key => {
            if (key !== 'description' && state.hasOwnProperty(key)) {
              state[key] += effect.effect[key];
            }
          });
        }
      }
    });

    // Filter out applied effects
    const remainingEffects = delayedEffects.filter(effect => effect.turn !== currentTurn);

    return { state, remainingEffects };
  }

  static calculateClimateChangeTurn(turn, decisions, gameState, decisionHistory, delayedEffects) {
    const { resources = 100000, reputation = 50, emission_reduction = 10, international_cooperation = 30, technological_advancement = 25, climate_risk = 70 } = gameState;

    // Initialize result
    let result = {
      newGameState: { ...gameState },
      linearExpectation: {},
      actualResult: {},
      feedback: '',
      newDelayedEffects: [],
      gameOver: false,
      gameOverReason: null
    };

    // Calculate linear expectation (what player expects)
    result.linearExpectation = this.calculateClimateChangeLinearExpectation(turn, decisions, gameState);

    // Calculate actual result (complex system reality)
    const actual = this.calculateClimateChangeActualResult(turn, decisions, gameState, decisionHistory);

    // Apply delayed effects from previous turns
    const delayedEffectsResult = this.applyClimateChangeDelayedEffects(turn, delayedEffects, gameState);
    result.newGameState = { ...delayedEffectsResult.state };

    // Apply current turn effects
    result.newGameState.resources += actual.effects.resources;
    result.newGameState.reputation += actual.effects.reputation;
    result.newGameState.emission_reduction += actual.effects.emission_reduction;
    result.newGameState.international_cooperation += actual.effects.international_cooperation;
    result.newGameState.technological_advancement += actual.effects.technological_advancement;
    result.newGameState.climate_risk += actual.effects.climate_risk;

    // Ensure values stay within bounds
    result.newGameState.resources = Math.max(0, result.newGameState.resources);
    result.newGameState.reputation = Math.max(0, Math.min(100, result.newGameState.reputation));
    result.newGameState.emission_reduction = Math.max(0, Math.min(100, result.newGameState.emission_reduction));
    result.newGameState.international_cooperation = Math.max(0, Math.min(100, result.newGameState.international_cooperation));
    result.newGameState.technological_advancement = Math.max(0, Math.min(100, result.newGameState.technological_advancement));
    result.newGameState.climate_risk = Math.max(0, Math.min(100, result.newGameState.climate_risk));

    result.actualResult = {
      resources: result.newGameState.resources,
      reputation: result.newGameState.reputation,
      emission_reduction: result.newGameState.emission_reduction,
      international_cooperation: result.newGameState.international_cooperation,
      technological_advancement: result.newGameState.technological_advancement,
      climate_risk: result.newGameState.climate_risk,
      changes: actual.effects
    };

    // Add new delayed effects
    result.newDelayedEffects = actual.delayedEffects || [];

    // Generate feedback
    result.feedback = this.generateClimateChangeFeedback(turn, result.linearExpectation, result.actualResult, actual.narrative);

    // Check game over conditions
    if (result.newGameState.climate_risk >= 90) {
      result.gameOver = true;
      result.gameOverReason = 'climate_risk';
    } else if (result.newGameState.international_cooperation < 10) {
      result.gameOver = true;
      result.gameOverReason = 'cooperation';
    } else if (result.newGameState.reputation < 10) {
      result.gameOver = true;
      result.gameOverReason = 'reputation';
    }

    return result;
  }

  static calculateClimateChangeLinearExpectation(turn, decisions, gameState) {
    const { resources = 100000, reputation = 50, emission_reduction = 10, international_cooperation = 30 } = gameState;
    let expected = {
      resources,
      reputation,
      emission_reduction,
      international_cooperation,
      thinking: ''
    };

    switch(turn) {
      case 1:
        // Turn 1: Initial climate policy decision
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'unified_targets':
            expected.emission_reduction = emission_reduction + 25; // High expected reduction
            expected.international_cooperation = international_cooperation + 10; // Expected cooperation
            expected.reputation = reputation + 15; // High reputation for leadership
            expected.thinking = `统一减排目标，预期减排幅度提升25%，国际合作提升10%，声誉提升15`;
            break;
          case 'historical_emissions':
            expected.emission_reduction = emission_reduction + 20; // High expected reduction
            expected.international_cooperation = international_cooperation + 5; // Moderate cooperation
            expected.reputation = reputation + 10; // Good reputation
            expected.thinking = `基于历史排放责任，预期减排幅度提升20%，国际合作提升5%，声誉提升10`;
            break;
          case 'carbon_trading':
            expected.emission_reduction = emission_reduction + 18; // Moderate reduction
            expected.international_cooperation = international_cooperation + 20; // High cooperation
            expected.resources = resources - 5000; // Trading system setup cost
            expected.thinking = `碳交易市场，预期减排幅度提升18%，国际合作提升20%，需投入¥5000建设`;
            break;
          case 'tech_transfer':
            expected.emission_reduction = emission_reduction + 15; // Moderate reduction
            expected.international_cooperation = international_cooperation + 25; // High cooperation
            expected.reputation = reputation + 20; // High reputation
            expected.thinking = `技术转移机制，预期减排幅度提升15%，国际合作提升25%，声誉提升20`;
            break;
          default:
            expected.thinking = `选择了气候政策，预期获得相应效果`;
        }
        break;

      case 2:
        // Turn 2: Response to implementation challenges
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'sanctions_noncompliance':
            expected.emission_reduction = emission_reduction + 10; // Enforcement improves compliance
            expected.international_cooperation = international_cooperation - 20; // Sanctions harm relationships
            expected.reputation = reputation - 10; // Sanctions may seem harsh
            expected.thinking = `制裁违约国，提升减排执行，但损害国际合作`;
            break;
          case 'adjust_targets':
            expected.emission_reduction = emission_reduction + 15; // Adjusted targets remain achievable
            expected.international_cooperation = international_cooperation + 15; // Flexibility helps
            expected.reputation = reputation + 5; // Pragmatic approach
            expected.thinking = `调整减排目标，保持减排动力，增强国际合作`;
            break;
          case 'strengthen_monitoring':
            expected.emission_reduction = emission_reduction + 12; // Better monitoring improves compliance
            expected.international_cooperation = international_cooperation + 10; // Transparency helps
            expected.resources = resources - 8000; // Monitoring system costs
            expected.thinking = `强化监督机制，提升减排效果，需投入¥8000`;
            break;
          case 'green_fund':
            expected.emission_reduction = emission_reduction + 20; // Incentives drive action
            expected.international_cooperation = international_cooperation + 30; // Incentives promote cooperation
            expected.resources = resources - 15000; // Fund requires substantial investment
            expected.thinking = `绿色基金激励，大幅提升减排和合作，需投入¥15000`;
            break;
        }
        break;

      case 3:
        // Turn 3: Earth engineering decisions
        const decisionId3 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId3) {
          case 'ban_geoengineering':
            expected.climate_risk = climate_risk - 5; // Prevents unknown risks
            expected.technological_advancement = technological_advancement - 5; // Limits innovation
            expected.international_cooperation = international_cooperation + 10; // Precaution promotes agreement
            expected.thinking = `禁止地球工程，降低未知风险，但限制技术创新`;
            break;
          case 'limited_research':
            expected.climate_risk = climate_risk - 10; // Controlled research may yield benefits
            expected.technological_advancement = technological_advancement + 15; // Research drives innovation
            expected.resources = resources - 10000; // Research costs
            expected.thinking = `限制性研究，平衡风险与创新，需投入¥10000`;
            break;
          case 'pilot_programs':
            expected.climate_risk = climate_risk - 20; // Potential rapid climate improvement
            expected.technological_advancement = technological_advancement + 30; // Major innovation boost
            expected.international_cooperation = international_cooperation - 15; // Controversial approach
            expected.reputation = reputation - 5; // Risky reputation
            expected.thinking = `试点项目，可能快速改善气候，大幅提升技术，但具争议性`;
            break;
          case 'governance_framework':
            expected.climate_risk = climate_risk - 15; // Framework enables safe development
            expected.technological_advancement = technological_advancement + 20; // Regulated innovation
            expected.international_cooperation = international_cooperation + 20; // Governance promotes collaboration
            expected.resources = resources - 12000; // Framework establishment costs
            expected.thinking = `治理框架，安全推进创新，提升合作，需投入¥12000`;
            break;
        }
        break;

      default:
        expected.thinking = `继续执行当前气候政策`;
    }

    return expected;
  }

  static calculateClimateChangeActualResult(turn, decisions, gameState, decisionHistory) {
    const { resources = 100000, reputation = 50, emission_reduction = 10, international_cooperation = 30, technological_advancement = 25, climate_risk = 70 } = gameState;

    let effects = {
      resources: 0,
      reputation: 0,
      emission_reduction: 0,
      international_cooperation: 0,
      technological_advancement: 0,
      climate_risk: 0
    };

    let narrative = '';
    let delayedEffects = [];

    switch(turn) {
      case 1:
        // Turn 1: Initial climate policy with complex international dynamics
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'unified_targets':
            // Reality: Developing nations resist uniform targets due to economic concerns
            effects.emission_reduction = 12; // Lower than expected due to resistance
            effects.international_cooperation = -5; // Resistance creates tension
            effects.reputation = 8; // Leadership recognition but also criticism
            effects.resources = -2000; // Agreement negotiation costs
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                emission_reduction: 8, 
                international_cooperation: 5,
                description: 'Agreement implementation challenges emerge in round 2'
              }
            });

            narrative = `统一减排目标遭遇发展中国家强烈抵制，它们担心这会阻碍经济发展。虽然在理论上体现了公平原则，但实际上导致了国际合作紧张。减排效果低于预期，仅为12%而非期望的25%。`;
            break;

          case 'historical_emissions':
            // Reality: Developed nations resist accepting greater burden
            effects.emission_reduction = 15; // Moderate achievement
            effects.international_cooperation = 2; // Some cooperation despite tensions
            effects.reputation = 12; // Recognition for addressing historical responsibility
            effects.resources = -1000; // Negotiation costs
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                international_cooperation: 8, 
                emission_reduction: 5,
                description: 'Historical responsibility approach yields gradual benefits'
              }
            });

            narrative = `基于历史排放责任的差异化目标在理论上公平，但发达国家担心承担过重负担。尽管如此，这种方法获得了中等程度的减排效果和逐步增强的国际合作。`;
            break;

          case 'carbon_trading':
            // Reality: Complex implementation, potential for gaming
            effects.emission_reduction = 10; // Lower than expected due to market complexities
            effects.international_cooperation = 15; // Market mechanism encourages participation
            effects.reputation = 5; // Mixed reception
            effects.resources = -8000; // High implementation costs
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                emission_reduction: 12, 
                resources: 5000,
                description: 'Carbon market efficiency improves over time'
              }
            });

            narrative = `碳交易市场机制促进了国际合作，但实施复杂，成本高昂。减排效果初期低于预期，但随着市场机制完善，预计将逐步改善。`;
            break;

          case 'tech_transfer':
            // Reality: Technology sharing faces IP concerns, but builds goodwill
            effects.emission_reduction = 18; // Effective approach
            effects.international_cooperation = 20; // Significant cooperation boost
            effects.reputation = 18; // Strong reputation enhancement
            effects.resources = -12000; // Substantial investment in tech transfer
            effects.technological_advancement = 10; // Technology sharing spurs innovation
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                emission_reduction: 15, 
                technological_advancement: 12,
                description: 'Technology transfer effects compound in round 2'
              }
            });

            narrative = `技术转移机制取得了显著成效，大幅提升了国际合作和减排效果。虽然初期投入较大，但建立了良好的国际声誉，为后续合作奠定基础。`;
            break;

          default:
            effects.emission_reduction = 5;
            effects.international_cooperation = 2;
            narrative = `采取了某种气候政策，产生了中性影响。`;
        }
        break;

      case 2:
        // Turn 2: Response to implementation with complex diplomatic consequences
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'sanctions_noncompliance':
            // Reality: Sanctions may backfire, harming cooperation
            effects.emission_reduction = 5; // Some enforcement effect
            effects.international_cooperation = -25; // Significant cooperation damage
            effects.reputation = -15; // Sanctions viewed negatively
            effects.resources = -3000; // Sanction administration costs
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                international_cooperation: -30, 
                emission_reduction: -5,
                description: 'Sanction effects create long-term diplomatic damage'
              }
            });

            narrative = `对违约国实施经济制裁短期内可能促使部分国家遵守，但严重损害了国际合作氛围。许多国家认为制裁过于严厉，开始质疑整个协议的有效性。`;
            break;

          case 'adjust_targets':
            // Reality: Flexible approach maintains engagement
            effects.emission_reduction = 12; // Pragmatic targets remain achievable
            effects.international_cooperation = 18; // Flexibility enhances cooperation
            effects.reputation = 8; // Pragmatism appreciated
            effects.resources = -2000; // Adjustment process costs
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                emission_reduction: 15, 
                international_cooperation: 10,
                description: 'Flexible approach yields sustained benefits'
              }
            });

            narrative = `调整减排目标的务实做法得到了广泛支持，各国更愿意承诺能够实现的目标。这种灵活性增强了协议的可持续性，为长期减排奠定了坚实基础。`;
            break;

          case 'strengthen_monitoring':
            // Reality: Transparency builds trust but requires resources
            effects.emission_reduction = 8; // Improved compliance through monitoring
            effects.international_cooperation = 12; // Transparency builds trust
            effects.reputation = 10; // Good governance recognized
            effects.resources = -10000; // Significant monitoring system costs
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                emission_reduction: 10, 
                international_cooperation: 8,
                description: 'Monitoring system effectiveness grows over time'
              }
            });

            narrative = `强化监督机制提高了透明度和信任度，减排执行情况有所改善。虽然建设和维护成本高昂，但为协议的长期有效性提供了保障。`;
            break;

          case 'green_fund':
            // Reality: Incentives effective but expensive
            effects.emission_reduction = 18; // Strong incentive effects
            effects.international_cooperation = 25; // Significant cooperation boost
            effects.reputation = 15; // Generosity recognized
            effects.resources = -20000; // Substantial fund investment
            effects.technological_advancement = 8; // Incentives drive innovation
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                emission_reduction: 20, 
                technological_advancement: 12,
                description: 'Green fund investments yield long-term benefits'
              }
            });

            narrative = `绿色基金大幅提升了减排效果和国际合作水平。虽然投资巨大，但通过激励措施激发了各国的积极性，推动了技术创新。`;
            break;
        }
        break;

      case 3:
        // Turn 3: Earth engineering decisions with complex scientific and political implications
        const decisionId3 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId3) {
          case 'ban_geoengineering':
            // Reality: Prevents risks but limits potential solutions
            effects.climate_risk = -2; // Slight improvement through other measures
            effects.technological_advancement = -8; // Innovation limitations
            effects.international_cooperation = 5; // Precaution creates some consensus
            effects.reputation = 5; // Responsible approach
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                climate_risk: 3, 
                technological_advancement: -5,
                description: 'Banning geoengineering limits future options'
              }
            });

            narrative = `全面禁止地球工程研究避免了潜在的未知风险，但也限制了解决气候问题的创新途径。虽然在短期内获得了一些国际支持，但可能错失了快速缓解气候变化的机会。`;
            break;

          case 'limited_research':
            // Reality: Balances caution with innovation
            effects.climate_risk = -8; // Controlled research shows promise
            effects.technological_advancement = 12; // Focused innovation
            effects.international_cooperation = 8; // Managed research cooperation
            effects.resources = -12000; // Research investment
            effects.reputation = 3; // Cautious but progressive approach
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                technological_advancement: 15, 
                climate_risk: -10,
                description: 'Controlled research yields breakthrough solutions'
              }
            });

            narrative = `限制性研究在谨慎和创新之间找到了平衡。虽然投资较大，但取得了初步进展，为未来的气候解决方案奠定了基础。`;
            break;

          case 'pilot_programs':
            // Reality: High potential but high risks
            const success = Math.random() > 0.5; // 50% chance of success
            effects.climate_risk = success ? -25 : 15; // Either dramatic improvement or worsening
            effects.technological_advancement = success ? 25 : -10; // Success drives innovation or sets it back
            effects.international_cooperation = success ? 15 : -30; // Success builds trust or destroys it
            effects.reputation = success ? 20 : -25; // Success brings praise or severe criticism
            effects.resources = -25000; // Large pilot program investment
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                climate_risk: success ? -15 : 20, 
                international_cooperation: success ? 20 : -35,
                description: 'Pilot program results have long-term implications'
              }
            });

            narrative = `试点项目带来了巨大的不确定性。${success ? '项目取得了突破性成功，大幅降低了气候风险并推动了技术进步。' : '项目出现严重问题，加剧了气候风险并引发了国际争端。'}这种高风险高回报的策略结果两极分化。`;
            break;

          case 'governance_framework':
            // Reality: Best of both worlds - managed innovation
            effects.climate_risk = -18; // Well-managed approach shows results
            effects.technological_advancement = 22; // Regulated innovation thrives
            effects.international_cooperation = 25; // Framework enables broad participation
            effects.resources = -15000; // Framework establishment costs
            effects.reputation = 18; // Thoughtful approach recognized
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                climate_risk: -12, 
                technological_advancement: 18,
                description: 'Governance framework enables sustained progress'
              }
            });

            narrative = `治理框架成功平衡了创新与风险管理。通过建立适当的规则和监督机制，各国能够在安全的环境下探索地球工程解决方案，取得了显著的气候改善效果。`;
            break;
        }
        break;
    }

    return { effects, narrative, delayedEffects };
  }

  static applyClimateChangeDelayedEffects(currentTurn, delayedEffects, currentState) {
    let state = { ...currentState };

    if (!delayedEffects || delayedEffects.length === 0) {
      return { state };
    }

    delayedEffects.forEach(effect => {
      if (effect.turn === currentTurn) {
        if (effect.effect) {
          Object.keys(effect.effect).forEach(key => {
            if (key !== 'description' && state.hasOwnProperty(key)) {
              state[key] += effect.effect[key];
            }
          });
        }
      }
    });

    // Filter out applied effects
    const remainingEffects = delayedEffects.filter(effect => effect.turn !== currentTurn);

    return { state, remainingEffects };
  }

  static calculateAIGovernanceTurn(turn, decisions, gameState, decisionHistory, delayedEffects) {
    const { resources = 50000, reputation = 50, ai_capability_assessment = 30, safety_compliance = 25, ethical_adherence = 40, innovation_balance = 35, stakeholder_pressure = 60 } = gameState;

    // Initialize result
    let result = {
      newGameState: { ...gameState },
      linearExpectation: {},
      actualResult: {},
      feedback: '',
      newDelayedEffects: [],
      gameOver: false,
      gameOverReason: null
    };

    // Calculate linear expectation (what player expects)
    result.linearExpectation = this.calculateAIGovernanceLinearExpectation(turn, decisions, gameState);

    // Calculate actual result (complex system reality)
    const actual = this.calculateAIGovernanceActualResult(turn, decisions, gameState, decisionHistory);

    // Apply delayed effects from previous turns
    const delayedEffectsResult = this.applyAIGovernanceDelayedEffects(turn, delayedEffects, gameState);
    result.newGameState = { ...delayedEffectsResult.state };

    // Apply current turn effects
    result.newGameState.resources += actual.effects.resources;
    result.newGameState.reputation += actual.effects.reputation;
    result.newGameState.ai_capability_assessment += actual.effects.ai_capability_assessment;
    result.newGameState.safety_compliance += actual.effects.safety_compliance;
    result.newGameState.ethical_adherence += actual.effects.ethical_adherence;
    result.newGameState.innovation_balance += actual.effects.innovation_balance;
    result.newGameState.stakeholder_pressure += actual.effects.stakeholder_pressure;

    // Ensure values stay within bounds
    result.newGameState.resources = Math.max(0, result.newGameState.resources);
    result.newGameState.reputation = Math.max(0, Math.min(100, result.newGameState.reputation));
    result.newGameState.ai_capability_assessment = Math.max(0, Math.min(100, result.newGameState.ai_capability_assessment));
    result.newGameState.safety_compliance = Math.max(0, Math.min(100, result.newGameState.safety_compliance));
    result.newGameState.ethical_adherence = Math.max(0, Math.min(100, result.newGameState.ethical_adherence));
    result.newGameState.innovation_balance = Math.max(0, Math.min(100, result.newGameState.innovation_balance));
    result.newGameState.stakeholder_pressure = Math.max(0, Math.min(100, result.newGameState.stakeholder_pressure));

    result.actualResult = {
      resources: result.newGameState.resources,
      reputation: result.newGameState.reputation,
      ai_capability_assessment: result.newGameState.ai_capability_assessment,
      safety_compliance: result.newGameState.safety_compliance,
      ethical_adherence: result.newGameState.ethical_adherence,
      innovation_balance: result.newGameState.innovation_balance,
      stakeholder_pressure: result.newGameState.stakeholder_pressure,
      changes: actual.effects
    };

    // Add new delayed effects
    result.newDelayedEffects = actual.delayedEffects || [];

    // Generate feedback
    result.feedback = this.generateAIGovernanceFeedback(turn, result.linearExpectation, result.actualResult, actual.narrative);

    // Check game over conditions
    if (result.newGameState.reputation < 15) {
      result.gameOver = true;
      result.gameOverReason = 'reputation';
    } else if (result.newGameState.stakeholder_pressure > 90) {
      result.gameOver = true;
      result.gameOverReason = 'stakeholder_pressure';
    } else if (result.newGameState.resources < 5000) {
      result.gameOver = true;
      result.gameOverReason = 'resources';
    }

    return result;
  }

  static calculateAIGovernanceLinearExpectation(turn, decisions, gameState) {
    const { resources = 50000, reputation = 50, ai_capability_assessment = 30, safety_compliance = 25 } = gameState;
    let expected = {
      resources,
      reputation,
      ai_capability_assessment,
      safety_compliance,
      thinking: ''
    };

    switch(turn) {
      case 1:
        // Turn 1: Initial AI governance decision
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'task_based_standards':
            expected.ai_capability_assessment = ai_capability_assessment + 20; // High assessment improvement
            expected.safety_compliance = safety_compliance + 10; // Moderate safety improvement
            expected.reputation = reputation + 5; // Moderate reputation boost
            expected.thinking = `基于任务的标准，预期AI能力评估提升20，安全合规提升10，声誉提升5`;
            break;
          case 'safety_constraints':
            expected.ai_capability_assessment = ai_capability_assessment + 10; // Moderate assessment
            expected.safety_compliance = safety_compliance + 25; // High safety improvement
            expected.reputation = reputation + 8; // Good reputation for safety focus
            expected.thinking = `安全约束标准，预期AI能力评估提升10，安全合规提升25，声誉提升8`;
            break;
          case 'ethical_framework':
            expected.ai_capability_assessment = ai_capability_assessment + 15; // Moderate assessment
            expected.safety_compliance = safety_compliance + 15; // Moderate safety improvement
            expected.reputation = reputation + 12; // Strong reputation boost
            expected.thinking = `伦理框架，预期AI能力评估提升15，安全合规提升15，声誉提升12`;
            break;
          case 'comprehensive_framework':
            expected.ai_capability_assessment = ai_capability_assessment + 15; // Moderate assessment
            expected.safety_compliance = safety_compliance + 20; // High safety improvement
            expected.reputation = reputation + 10; // Good reputation
            expected.resources = resources - 5000; // Framework development cost
            expected.thinking = `综合评估框架，预期AI能力评估提升15，安全合规提升20，声誉提升10，需投入¥5000`;
            break;
          default:
            expected.thinking = `选择了AI治理策略，预期获得相应效果`;
        }
        break;

      case 2:
        // Turn 2: Self-improvement decision
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'ban_self_improvement':
            expected.safety_compliance = safety_compliance + 35; // High safety improvement
            expected.ai_capability_assessment = ai_capability_assessment - 5; // Innovation constraint
            expected.reputation = reputation + 15; // Safety focus appreciated
            expected.thinking = `禁止自我改进，安全合规大幅提升35，但限制创新-5`;
            break;
          case 'limited_self_improvement':
            expected.safety_compliance = safety_compliance + 20; // Moderate safety
            expected.ai_capability_assessment = ai_capability_assessment + 5; // Limited innovation
            expected.reputation = reputation + 8; // Balanced approach
            expected.thinking = `限制性自我改进，安全合规提升20，能力评估提升5`;
            break;
          case 'supervised_improvement':
            expected.safety_compliance = safety_compliance + 15; // Moderate safety
            expected.ai_capability_assessment = ai_capability_assessment + 25; // High innovation
            expected.reputation = reputation + 10; // Innovation balance
            expected.thinking = `监督式改进，安全合规提升15，能力评估大幅提升25`;
            break;
          case 'approval_mechanism':
            expected.safety_compliance = safety_compliance + 30; // High safety
            expected.ai_capability_assessment = ai_capability_assessment + 10; // Controlled innovation
            expected.reputation = reputation + 18; // Strong safety focus
            expected.thinking = `审批机制，安全合规提升30，能力评估提升10，声誉大幅提升18`;
            break;
        }
        break;

      case 3:
        // Turn 3: International coordination
        const decisionId3 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId3) {
          case 'international_union':
            expected.safety_compliance = safety_compliance + 35; // High compliance through coordination
            expected.reputation = reputation + 20; // International cooperation
            expected.stakeholder_pressure = stakeholder_pressure - 10; // Shared burden
            expected.thinking = `国际联盟，安全合规大幅提升35，声誉提升20，压力减轻10`;
            break;
          case 'minimum_standards':
            expected.safety_compliance = safety_compliance + 25; // Moderate compliance
            expected.reputation = reputation + 15; // Good cooperation
            expected.stakeholder_pressure = stakeholder_pressure - 5; // Some burden sharing
            expected.thinking = `最低标准，安全合规提升25，声誉提升15`;
            break;
          case 'unilateral_approach':
            expected.safety_compliance = safety_compliance + 10; // Limited coordination benefits
            expected.reputation = reputation - 10; // Criticism for isolation
            expected.stakeholder_pressure = stakeholder_pressure + 15; // Increased domestic pressure
            expected.thinking = `单边策略，安全合规仅提升10，声誉下降10，压力增加15`;
            break;
          case 'multilateral_coordination':
            expected.safety_compliance = safety_compliance + 30; // Good coordination
            expected.reputation = reputation + 25; // Strong cooperation
            expected.stakeholder_pressure = stakeholder_pressure - 8; // Shared approach
            expected.thinking = `多边协调，安全合规提升30，声誉大幅提升25，压力减轻8`;
            break;
        }
        break;

      case 4:
        // Turn 4: Medical AI decision
        const decisionId4 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId4) {
          case 'explainability_requirement':
            expected.safety_compliance = safety_compliance + 30; // High safety focus
            expected.ai_capability_assessment = ai_capability_assessment - 10; // Innovation constraint
            expected.reputation = reputation + 15; // Safety focus appreciated
            expected.thinking = `可解释性要求，安全合规提升30，能力评估下降10，声誉提升15`;
            break;
          case 'conditional_use':
            expected.safety_compliance = safety_compliance + 20; // Moderate safety
            expected.ai_capability_assessment = ai_capability_assessment + 10; // Controlled innovation
            expected.reputation = reputation + 12; // Balanced approach
            expected.thinking = `条件使用，安全合规提升20，能力评估提升10，声誉提升12`;
            break;
          case 'patient_benefit_priority':
            expected.ai_capability_assessment = ai_capability_assessment + 40; // High innovation benefit
            expected.safety_compliance = safety_compliance - 5; // Safety concern
            expected.reputation = reputation + 25; // Patient benefit focus
            expected.thinking = `患者利益优先，能力评估大幅提升40，声誉大幅提升25，安全略降5`;
            break;
          case 'responsibility_mechanism':
            expected.safety_compliance = safety_compliance + 25; // Clear accountability
            expected.reputation = reputation + 20; // Responsibility clarity
            expected.stakeholder_pressure = stakeholder_pressure - 15; // Clear expectations
            expected.thinking = `责任机制，安全合规提升25，声誉提升20，压力减轻15`;
            break;
        }
        break;

      default:
        expected.thinking = `继续执行当前AI治理策略`;
    }

    return expected;
  }

  static calculateAIGovernanceActualResult(turn, decisions, gameState, decisionHistory) {
    const { resources = 50000, reputation = 50, ai_capability_assessment = 30, safety_compliance = 25, ethical_adherence = 40, innovation_balance = 35, stakeholder_pressure = 60 } = gameState;

    let effects = {
      resources: 0,
      reputation: 0,
      ai_capability_assessment: 0,
      safety_compliance: 0,
      ethical_adherence: 0,
      innovation_balance: 0,
      stakeholder_pressure: 0
    };

    let narrative = '';
    let delayedEffects = [];

    switch(turn) {
      case 1:
        // Turn 1: Initial AI governance with complex regulatory dynamics
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'task_based_standards':
            // Reality: Standards difficult to implement due to rapid AI evolution
            effects.ai_capability_assessment = 12; // Lower than expected due to complexity
            effects.safety_compliance = 8; // Moderate improvement
            effects.reputation = 3; // Some appreciation for detailed approach
            effects.resources = -3000; // Standard development costs
            effects.stakeholder_pressure = 10; // Industry pushback on complexity
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                ai_capability_assessment: 5, 
                safety_compliance: 3,
                stakeholder_pressure: 5,
                description: 'Standard implementation challenges emerge in round 2'
              }
            });

            narrative = `基于任务的评估标准在理论上很全面，但由于AI技术快速发展，实际实施起来非常复杂。行业对复杂标准提出质疑，导致实施进度慢于预期，AI能力评估提升仅为12而非预期的20。`;
            break;

          case 'safety_constraints':
            // Reality: Safety focus may hamper innovation
            effects.ai_capability_assessment = 8; // Lower due to innovation constraints
            effects.safety_compliance = 20; // Strong safety improvement
            effects.reputation = 10; // Public appreciates safety focus
            effects.innovation_balance = -8; // Heavy constraint on innovation
            effects.resources = -5000; // Safety system implementation costs
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                ai_capability_assessment: 3, 
                innovation_balance: -5,
                description: 'Safety constraints continue to limit innovation in round 2'
              }
            });

            narrative = `安全约束标准显著提升了安全合规水平，但也限制了AI能力的发展。创新平衡得分下降，反映出过度安全导向对技术进步的负面影响。`;
            break;

          case 'ethical_framework':
            // Reality: Ethics important but hard to measure
            effects.ai_capability_assessment = 10; // Moderate assessment improvement
            effects.safety_compliance = 12; // Ethics contribute to safety
            effects.ethical_adherence = 20; // Significant ethics improvement
            effects.reputation = 15; // Strong public support for ethics focus
            effects.resources = -8000; // Ethics framework development costs
            effects.stakeholder_pressure = -5; // Ethics resonate with public
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                ethical_adherence: 15, 
                reputation: 8,
                description: 'Ethics framework gains momentum in round 2'
              }
            });

            narrative = `伦理框架取得了显著成效，大幅提升了伦理遵守度和公众声誉。虽然对AI能力评估的直接影响较小，但为长期可持续的AI发展奠定了基础。`;
            break;

          case 'comprehensive_framework':
            // Reality: Comprehensive approach effective but resource-intensive
            effects.ai_capability_assessment = 12; // Moderate improvement
            effects.safety_compliance = 18; // Strong safety improvement
            effects.reputation = 12; // Good approach recognition
            effects.resources = -12000; // Substantial framework development costs
            effects.ethical_adherence = 10; // Framework includes ethical components
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                safety_compliance: 15, 
                ai_capability_assessment: 8,
                description: 'Comprehensive framework effects compound in round 2'
              }
            });

            narrative = `综合评估框架取得了平衡的效果，在安全和能力评估方面都有所提升。虽然初期投入较大，但为全面的AI治理提供了坚实基础。`;
            break;

          default:
            effects.ai_capability_assessment = 5;
            effects.safety_compliance = 3;
            narrative = `采取了某种AI治理策略，产生了中性影响。`;
        }
        break;

      case 2:
        // Turn 2: Self-improvement decisions with complex technical and social implications
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'ban_self_improvement':
            // Reality: Ban may drive underground development, innovation suffers
            effects.safety_compliance = 25; // Significant safety improvement
            effects.ai_capability_assessment = -10; // Severe innovation constraint
            effects.reputation = 8; // Safety focus appreciated by some
            effects.innovation_balance = -25; // Major innovation penalty
            effects.stakeholder_pressure = 20; // Industry backlash
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                ai_capability_assessment: -15, 
                innovation_balance: -20,
                description: 'Ban effects severely limit development in round 3'
              }
            });

            narrative = `全面禁止AI自我改进显著提升了安全合规，但也严重限制了AI能力发展和创新。业界对此政策表示强烈反对，认为这将使国家在AI竞赛中落后。`;
            break;

          case 'limited_self_improvement':
            // Reality: Balanced approach works well
            effects.safety_compliance = 18; // Good safety improvement
            effects.ai_capability_assessment = 8; // Controlled innovation
            effects.reputation = 12; // Balanced approach appreciated
            effects.innovation_balance = 5; // Positive but controlled
            effects.resources = -3000; // Monitoring system costs
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                ai_capability_assessment: 10, 
                safety_compliance: 8,
                description: 'Limited improvement approach shows sustainable benefits'
              }
            });

            narrative = `限制性自我改进政策取得了良好的平衡效果，在保障安全的同时允许了适度的创新。公众和业界都对这种务实的方法表示认可。`;
            break;

          case 'supervised_improvement':
            // Reality: Supervision effective but challenging to implement
            effects.safety_compliance = 15; // Moderate safety improvement
            effects.ai_capability_assessment = 20; // Good innovation
            effects.reputation = 10; // Innovation focus appreciated
            effects.resources = -10000; // Intensive supervision costs
            effects.stakeholder_pressure = 15; // Oversight creates tensions
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                ai_capability_assessment: 15, 
                safety_compliance: 5,
                description: 'Supervision approach yields continued innovation'
              }
            });

            narrative = `监督式改进政策促进了AI能力的显著提升，但监督机制的实施成本高昂，且在监管机构和研发机构之间产生了摩擦。`;
            break;

          case 'approval_mechanism':
            // Reality: Structured approach effective
            effects.safety_compliance = 25; // Strong safety improvement
            effects.ai_capability_assessment = 12; // Controlled innovation
            effects.reputation = 18; // Strong safety focus appreciated
            effects.resources = -15000; // Approval system development costs
            effects.innovation_balance = 2; // Minimal constraint
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                safety_compliance: 15, 
                innovation_balance: 8,
                description: 'Approval mechanism provides sustainable balance'
              }
            });

            narrative = `审批机制在安全和创新之间取得了良好的平衡，建立了清晰的升级路径。虽然系统建设成本较高，但为AI能力的有序发展提供了保障。`;
            break;
        }
        break;

      case 3:
        // Turn 3: International coordination with complex diplomatic implications
        const decisionId3 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId3) {
          case 'international_union':
            // Reality: Coordination difficult but beneficial
            effects.safety_compliance = 25; // Lower than expected due to coordination challenges
            effects.reputation = 15; // International cooperation recognized
            effects.stakeholder_pressure = -5; // Shared burden
            effects.resources = -8000; // International coordination costs
            effects.innovation_balance = 5; // Coordination facilitates innovation
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                safety_compliance: 10, 
                reputation: 10,
                description: 'International cooperation yields long-term benefits'
              }
            });

            narrative = `国际AI监管联盟的建立遇到了协调挑战，效果低于预期，但为长期合作奠定了基础。各国在标准制定上存在一定分歧，但总体方向一致。`;
            break;

          case 'minimum_standards':
            // Reality: Minimum standards achieve broad adoption
            effects.safety_compliance = 22; // Good compliance through adoption
            effects.reputation = 18; // Successful cooperation
            effects.stakeholder_pressure = -8; // Reduced individual pressure
            effects.resources = -5000; // Standard setting costs
            effects.ai_capability_assessment = 5; // Standardization aids assessment
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                safety_compliance: 12, 
                ai_capability_assessment: 8,
                description: 'Minimum standards facilitate widespread adoption'
              }
            });

            narrative = `最低安全标准协议取得了广泛的国际支持，因为门槛适中，各国易于接受。这为AI安全治理提供了基础框架。`;
            break;

          case 'unilateral_approach':
            // Reality: Isolation leads to negative consequences
            effects.safety_compliance = 8; // Limited by lack of coordination
            effects.reputation = -15; // Criticized for isolationist approach
            effects.stakeholder_pressure = 25; // Increased domestic pressure
            effects.ai_capability_assessment = -5; // Falling behind internationally
            effects.innovation_balance = -10; // Reduced competitive pressure
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                ai_capability_assessment: -10, 
                reputation: -20,
                description: 'Unilateral approach leads to international isolation'
              }
            });

            narrative = `单边政策导致了国际孤立，其他国家在AI治理上取得合作进展时，我国却在国际舞台上被边缘化，声誉受损。`;
            break;

          case 'multilateral_coordination':
            // Reality: Best of both worlds - coordination with autonomy
            effects.safety_compliance = 28; // Effective coordination
            effects.reputation = 22; // Strong cooperative stance
            effects.stakeholder_pressure = -12; // Significant burden sharing
            effects.resources = -7000; // Coordination costs
            effects.innovation_balance = 8; // Facilitates international innovation
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                safety_compliance: 15, 
                innovation_balance: 12,
                description: 'Multilateral approach enables sustained benefits'
              }
            });

            narrative = `多边协调机制在保持自主性的同时实现了有效的国际合作，取得了最佳的整体效果。`;
            break;
        }
        break;

      case 4:
        // Turn 4: Medical AI decision with complex ethical implications
        const decisionId4 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId4) {
          case 'explainability_requirement':
            // Reality: Explainability important but constrains cutting-edge AI
            effects.safety_compliance = 25; // High safety through explainability
            effects.ai_capability_assessment = -8; // Constraints cutting-edge applications
            effects.reputation = 12; // Safety focus appreciated
            effects.innovation_balance = -15; // Significant constraint on innovation
            effects.resources = -5000; // Explainability system costs
            
            delayedEffects.push({
              turn: 5,
              effect: { 
                ai_capability_assessment: -10, 
                innovation_balance: -12,
                description: 'Explainability constraints continue to limit advanced AI'
              }
            });

            narrative = `可解释性要求显著提升了AI安全性，但也限制了尖端AI系统的应用，特别是在需要复杂决策的医疗领域。`;
            break;

          case 'conditional_use':
            // Reality: Balanced approach works well
            effects.safety_compliance = 18; // Good safety through conditions
            effects.ai_capability_assessment = 12; // Controlled innovation
            effects.reputation = 15; // Balanced approach appreciated
            effects.innovation_balance = 8; // Positive balance
            effects.resources = -3000; // Condition monitoring costs
            
            delayedEffects.push({
              turn: 5,
              effect: { 
                safety_compliance: 10, 
                ai_capability_assessment: 10,
                description: 'Conditional approach enables sustainable medical AI'
              }
            });

            narrative = `条件使用政策在医疗AI的安全性和有效性之间取得了良好平衡，允许了先进系统的应用，同时确保了必要的监督。`;
            break;

          case 'patient_benefit_priority':
            // Reality: Patient benefits significant but risks remain
            effects.ai_capability_assessment = 35; // High innovation benefit
            effects.safety_compliance = -5; // Some safety concerns
            effects.reputation = 20; // Strong patient advocacy support
            effects.innovation_balance = 20; // High innovation score
            effects.ethical_adherence = -10; // Ethical concerns about black-box decisions
            
            delayedEffects.push({
              turn: 5,
              effect: { 
                ai_capability_assessment: 15, 
                reputation: 10,
                description: 'Patient benefit approach continues to deliver results'
              }
            });

            narrative = `患者利益优先政策带来了显著的医疗AI进展和公众支持，但也引发了关于算法透明度和伦理的担忧。`;
            break;

          case 'responsibility_mechanism':
            // Reality: Clear accountability provides stability
            effects.safety_compliance = 22; // Clear accountability improves safety
            effects.reputation = 18; // Responsibility clarity appreciated
            effects.stakeholder_pressure = -15; // Clear expectations reduce pressure
            effects.resources = -10000; // Responsibility system development costs
            effects.ethical_adherence = 15; // Accountability improves ethics
            
            delayedEffects.push({
              turn: 5,
              effect: { 
                safety_compliance: 12, 
                ethical_adherence: 10,
                description: 'Responsibility mechanism creates stable foundation'
              }
            });

            narrative = `责任分配机制建立了清晰的问责制度，显著提升了安全合规和伦理遵守水平，为AI在敏感领域的应用提供了稳定基础。`;
            break;
        }
        break;
    }

    return { effects, narrative, delayedEffects };
  }

  static applyAIGovernanceDelayedEffects(currentTurn, delayedEffects, currentState) {
    let state = { ...currentState };

    if (!delayedEffects || delayedEffects.length === 0) {
      return { state };
    }

    delayedEffects.forEach(effect => {
      if (effect.turn === currentTurn) {
        if (effect.effect) {
          Object.keys(effect.effect).forEach(key => {
            if (key !== 'description' && state.hasOwnProperty(key)) {
              state[key] += effect.effect[key];
            }
          });
        }
      }
    });

    // Filter out applied effects
    const remainingEffects = delayedEffects.filter(effect => effect.turn !== currentTurn);

    return { state, remainingEffects };
  }

  static calculateFinancialCrisisTurn(turn, decisions, gameState, decisionHistory, delayedEffects) {
    const { resources = 100000, reputation = 50, systemic_risk_level = 60, market_stability = 40, liquidity_index = 45, regulatory_compliance = 55, international_coordination = 35 } = gameState;

    // Initialize result
    let result = {
      newGameState: { ...gameState },
      linearExpectation: {},
      actualResult: {},
      feedback: '',
      newDelayedEffects: [],
      gameOver: false,
      gameOverReason: null
    };

    // Calculate linear expectation (what player expects)
    result.linearExpectation = this.calculateFinancialCrisisLinearExpectation(turn, decisions, gameState);

    // Calculate actual result (complex system reality)
    const actual = this.calculateFinancialCrisisActualResult(turn, decisions, gameState, decisionHistory);

    // Apply delayed effects from previous turns
    const delayedEffectsResult = this.applyFinancialCrisisDelayedEffects(turn, delayedEffects, gameState);
    result.newGameState = { ...delayedEffectsResult.state };

    // Apply current turn effects
    result.newGameState.resources += actual.effects.resources;
    result.newGameState.reputation += actual.effects.reputation;
    result.newGameState.systemic_risk_level += actual.effects.systemic_risk_level;
    result.newGameState.market_stability += actual.effects.market_stability;
    result.newGameState.liquidity_index += actual.effects.liquidity_index;
    result.newGameState.regulatory_compliance += actual.effects.regulatory_compliance;
    result.newGameState.international_coordination += actual.effects.international_coordination;

    // Ensure values stay within bounds
    result.newGameState.resources = Math.max(0, result.newGameState.resources);
    result.newGameState.reputation = Math.max(0, Math.min(100, result.newGameState.reputation));
    result.newGameState.systemic_risk_level = Math.max(0, Math.min(100, result.newGameState.systemic_risk_level));
    result.newGameState.market_stability = Math.max(0, Math.min(100, result.newGameState.market_stability));
    result.newGameState.liquidity_index = Math.max(0, Math.min(100, result.newGameState.liquidity_index));
    result.newGameState.regulatory_compliance = Math.max(0, Math.min(100, result.newGameState.regulatory_compliance));
    result.newGameState.international_coordination = Math.max(0, Math.min(100, result.newGameState.international_coordination));

    result.actualResult = {
      resources: result.newGameState.resources,
      reputation: result.newGameState.reputation,
      systemic_risk_level: result.newGameState.systemic_risk_level,
      market_stability: result.newGameState.market_stability,
      liquidity_index: result.newGameState.liquidity_index,
      regulatory_compliance: result.newGameState.regulatory_compliance,
      international_coordination: result.newGameState.international_coordination,
      changes: actual.effects
    };

    // Add new delayed effects
    result.newDelayedEffects = actual.delayedEffects || [];

    // Generate feedback
    result.feedback = this.generateFinancialCrisisFeedback(turn, result.linearExpectation, result.actualResult, actual.narrative);

    // Check game over conditions
    if (result.newGameState.systemic_risk_level > 90) {
      result.gameOver = true;
      result.gameOverReason = 'systemic_risk';
    } else if (result.newGameState.market_stability < 10) {
      result.gameOver = true;
      result.gameOverReason = 'market_stability';
    } else if (result.newGameState.reputation < 10) {
      result.gameOver = true;
      result.gameOverReason = 'reputation';
    } else if (result.newGameState.liquidity_index < 15) {
      result.gameOver = true;
      result.gameOverReason = 'liquidity';
    }

    return result;
  }

  static calculateFinancialCrisisLinearExpectation(turn, decisions, gameState) {
    const { resources = 100000, reputation = 50, systemic_risk_level = 60, market_stability = 40 } = gameState;
    let expected = {
      resources,
      reputation,
      systemic_risk_level,
      market_stability,
      thinking: ''
    };

    switch(turn) {
      case 1:
        // Turn 1: Initial crisis response decision
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'tighten_derivatives':
            expected.systemic_risk_level = systemic_risk_level - 20; // Significant risk reduction
            expected.market_stability = market_stability - 5; // Some market disruption
            expected.reputation = reputation + 5; // Regulatory credibility
            expected.thinking = `加强衍生品监管，预期系统风险降低20，市场稳定小幅下降5，声誉提升5`;
            break;
          case 'capital_requirements':
            expected.systemic_risk_level = systemic_risk_level - 15; // Moderate risk reduction
            expected.market_stability = market_stability + 5; // Long-term stability
            expected.regulatory_compliance = regulatory_compliance + 15; // Compliance improvement
            expected.thinking = `提高资本要求，预期系统风险降低15，市场稳定提升5，监管合规提升15`;
            break;
          case 'stress_testing':
            expected.systemic_risk_level = systemic_risk_level - 10; // Risk awareness
            expected.reputation = reputation + 10; // Proactive approach
            expected.resources = resources - 5000; // Testing costs
            expected.thinking = `压力测试，预期系统风险降低10，声誉提升10，需投入¥5000`;
            break;
          case 'monitor_only':
            expected.systemic_risk_level = systemic_risk_level - 5; // Limited impact
            expected.market_stability = market_stability + 3; // Minimal disruption
            expected.resources = resources - 2000; // Monitoring costs
            expected.thinking = `加强监控，预期系统风险降低5，市场稳定提升3，需投入¥2000`;
            break;
          default:
            expected.thinking = `选择了危机应对策略，预期获得相应效果`;
        }
        break;

      case 2:
        // Turn 2: Liquidity response
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'massive_liquidity':
            expected.market_stability = market_stability + 30; // Massive stability improvement
            expected.systemic_risk_level = systemic_risk_level - 10; // Reduced stress
            expected.reputation = reputation + 8; // Crisis response
            expected.resources = resources - 50000; // Large liquidity injection
            expected.thinking = `大规模流动性支持，市场稳定大幅提升30，需投入¥50000`;
            break;
          case 'targeted_support':
            expected.market_stability = market_stability + 15; // Targeted stability
            expected.systemic_risk_level = systemic_risk_level - 15; // Focused risk reduction
            expected.reputation = reputation + 12; // Effective targeting
            expected.resources = resources - 20000; // Targeted injection
            expected.thinking = `定向支持，市场稳定提升15，系统风险降低15，需投入¥20000`;
            break;
          case 'market_driven':
            expected.market_stability = market_stability - 10; // Market disruption
            expected.systemic_risk_level = systemic_risk_level + 5; // Risk may increase
            expected.reputation = reputation - 5; // Lack of support
            expected.thinking = `市场驱动，市场稳定下降10，声誉下降5`;
            break;
          case 'coordinated_intervention':
            expected.market_stability = market_stability + 25; // Coordinated stability
            expected.systemic_risk_level = systemic_risk_level - 20; // International cooperation
            expected.international_coordination = international_coordination + 20; // Coordination improvement
            expected.resources = resources - 30000; // Coordinated efforts
            expected.thinking = `协调干预，市场稳定提升25，系统风险降低20，国际合作提升20`;
            break;
        }
        break;

      case 3:
        // Turn 3: Monetary policy response
        const decisionId3 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId3) {
          case 'aggressive_easing':
            expected.market_stability = market_stability + 30; // Aggressive stability
            expected.reputation = reputation + 15; // Strong action
            expected.systemic_risk_level = systemic_risk_level - 8; // Reduced funding stress
            expected.resources = resources - 10000; // Interest rate losses
            expected.thinking = `激进降息，市场稳定大幅提升30，声誉提升15，需承担利率损失`;
            break;
          case 'maintain_rates':
            expected.market_stability = market_stability - 5; // Short-term pain
            expected.reputation = reputation + 10; // Disciplined approach
            expected.systemic_risk_level = systemic_risk_level + 5; // Potential stress
            expected.thinking = `维持利率，市场稳定下降5，声誉提升10，系统风险可能上升5`;
            break;
          case 'quantitative_easing':
            expected.market_stability = market_stability + 35; // QE stability boost
            expected.systemic_risk_level = systemic_risk_level - 12; // QE reduces stress
            expected.liquidity_index = liquidity_index + 25; // Significant liquidity
            expected.resources = resources - 40000; // Asset purchases
            expected.thinking = `量化宽松，市场稳定提升35，流动性提升25，需投入¥40000`;
            break;
          case 'fiscal_coordination':
            expected.market_stability = market_stability + 20; // Combined effect
            expected.systemic_risk_level = systemic_risk_level - 15; // Dual approach
            expected.reputation = reputation + 18; // Comprehensive response
            expected.thinking = `财政协调，市场稳定提升20，系统风险降低15，声誉提升18`;
            break;
        }
        break;

      case 4:
        // Turn 4: International coordination
        const decisionId4 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId4) {
          case 'lead_coordination':
            expected.international_coordination = international_coordination + 30; // Leadership boost
            expected.systemic_risk_level = systemic_risk_level - 25; // Global cooperation
            expected.reputation = reputation + 20; // Leadership recognition
            expected.resources = resources - 15000; // Leadership costs
            expected.thinking = `主导协调，国际合作大幅提升30，系统风险降低25，声誉提升20`;
            break;
          case 'follow_main':
            expected.international_coordination = international_coordination + 15; // Alignment
            expected.market_stability = market_stability + 10; // Alignment stability
            expected.reputation = reputation + 5; // Following credibility
            expected.thinking = `跟随主要央行，国际合作提升15，市场稳定提升10，声誉提升5`;
            break;
          case 'independent_policy':
            expected.systemic_risk_level = systemic_risk_level - 10; // Domestic focus
            expected.reputation = reputation - 8; // International criticism
            expected.international_coordination = international_coordination - 15; // Reduced cooperation
            expected.thinking = `独立政策，系统风险降低10，声誉下降8，国际合作下降15`;
            break;
          case 'temporary_coordination':
            expected.international_coordination = international_coordination + 20; // Temporary cooperation
            expected.systemic_risk_level = systemic_risk_level - 18; // Crisis cooperation
            expected.reputation = reputation + 12; // Balanced approach
            expected.thinking = `临时协调，国际合作提升20，系统风险降低18，声誉提升12`;
            break;
        }
        break;

      default:
        expected.thinking = `继续执行当前危机应对策略`;
    }

    return expected;
  }

  static calculateFinancialCrisisActualResult(turn, decisions, gameState, decisionHistory) {
    const { resources = 100000, reputation = 50, systemic_risk_level = 60, market_stability = 40, liquidity_index = 45, regulatory_compliance = 55, international_coordination = 35 } = gameState;

    let effects = {
      resources: 0,
      reputation: 0,
      systemic_risk_level: 0,
      market_stability: 0,
      liquidity_index: 0,
      regulatory_compliance: 0,
      international_coordination: 0
    };

    let narrative = '';
    let delayedEffects = [];

    switch(turn) {
      case 1:
        // Turn 1: Initial crisis response with complex market dynamics
        const decisionId = Object.values(decisions)[0] || 'unknown';
        switch(decisionId) {
          case 'tighten_derivatives':
            // Reality: Tightening may cause market disruption, but reduces risk
            effects.systemic_risk_level = -12; // Risk reduction, but less than expected
            effects.market_stability = -8; // Significant market disruption
            effects.reputation = 3; // Some credibility gain
            effects.regulatory_compliance = 15; // Significant compliance improvement
            effects.resources = -3000; // Implementation costs
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                systemic_risk_level: -5, 
                market_stability: 3,
                regulatory_compliance: 8,
                description: 'Derivatives tightening effects continue in round 2'
              }
            });

            narrative = `加强衍生品监管在降低系统风险方面取得了一定成效，但引发了市场的显著动荡。监管合规度大幅提升，但短期内市场稳定性受到影响。系统风险仅降低了12点，不及预期的20点。`;
            break;

          case 'capital_requirements':
            // Reality: Capital requirements take time to show full effect
            effects.systemic_risk_level = -8; // Moderate risk reduction
            effects.market_stability = 2; // Small positive effect
            effects.regulatory_compliance = 20; // Strong compliance improvement
            effects.resources = -1000; // Implementation costs
            effects.liquidity_index = -5; // Capital requirements may reduce liquidity
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                systemic_risk_level: -7, 
                market_stability: 5,
                description: 'Capital requirement effects strengthen in round 2'
              }
            });

            narrative = `提高资本充足率要求在提升监管合规方面效果显著，但对系统风险的降低作用较为温和。短期内对市场稳定有轻微正面影响，但可能对流动性造成一定压力。`;
            break;

          case 'stress_testing':
            // Reality: Testing reveals additional risks
            effects.systemic_risk_level = -5; // Risk awareness
            effects.reputation = 8; // Proactive approach appreciated
            effects.regulatory_compliance = 10; // Testing improves compliance
            effects.resources = -8000; // Higher testing costs
            effects.market_stability = -3; // Testing may cause some concern
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                systemic_risk_level: -8, 
                regulatory_compliance: 12,
                description: 'Stress testing reveals deeper issues in round 2'
              }
            });

            narrative = `压力测试增强了对系统风险的认识，提升了监管合规水平，但测试过程中发现了更多潜在风险。虽然市场出现小幅波动，但整体展现了央行的前瞻性。`;
            break;

          case 'monitor_only':
            // Reality: Monitoring alone has limited impact
            effects.systemic_risk_level = -2; // Minimal risk reduction
            effects.market_stability = 1; // Small positive effect
            effects.resources = -1000; // Lower monitoring costs
            effects.reputation = 2; // Maintaining vigilance
            
            delayedEffects.push({
              turn: 2,
              effect: { 
                systemic_risk_level: 0, 
                market_stability: -2,
                description: 'Limited intervention leads to risk accumulation in round 2'
              }
            });

            narrative = `仅加强监控的策略对系统风险的降低作用有限，虽然成本较低，但未能有效应对潜在风险。这种被动策略可能导致风险在后续阶段累积。`;
            break;

          default:
            effects.systemic_risk_level = -3;
            effects.market_stability = 0;
            narrative = `采取了某种危机应对策略，产生了中性影响。`;
        }
        break;

      case 2:
        // Turn 2: Liquidity response with complex market reactions
        const decisionId2 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId2) {
          case 'massive_liquidity':
            // Reality: Massive liquidity can cause moral hazard
            effects.market_stability = 20; // Significant improvement, but less than expected
            effects.systemic_risk_level = -5; // Risk reduced but moral hazard concerns
            effects.reputation = 10; // Strong crisis response
            effects.resources = -60000; // Higher than expected costs
            effects.liquidity_index = 30; // Massive liquidity injection
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                systemic_risk_level: 8, 
                market_stability: -5,
                description: 'Moral hazard effects emerge in round 3'
              }
            });

            narrative = `大规模流动性支持显著提升了市场稳定性，但产生了道德风险担忧。虽然短期内市场企稳，但可能鼓励过度冒险行为，为后续风险埋下隐患。`;
            break;

          case 'targeted_support':
            // Reality: Targeted support most effective
            effects.market_stability = 18; // Strong targeted improvement
            effects.systemic_risk_level = -18; // Effective risk reduction
            effects.reputation = 15; // Effective crisis management
            effects.resources = -18000; // Efficient use of resources
            effects.liquidity_index = 15; // Targeted liquidity
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                market_stability: 10, 
                systemic_risk_level: -5,
                description: 'Targeted support effects compound in round 3'
              }
            });

            narrative = `定向支持策略取得了最佳效果，有效稳定了市场并降低了系统风险。资源配置效率高，市场信心得到恢复。`;
            break;

          case 'market_driven':
            // Reality: Market-driven approach may lead to disorderly resolution
            effects.market_stability = -15; // Significant market disruption
            effects.systemic_risk_level = 10; // Risk increases as institutions fail
            effects.reputation = -12; // Lack of support criticized
            effects.liquidity_index = -10; // Liquidity crunch
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                systemic_risk_level: 15, 
                market_stability: -20,
                description: 'Market-driven resolution leads to systemic crisis in round 3'
              }
            });

            narrative = `市场驱动的解决方案导致了显著的市场动荡，多家机构面临困境。缺乏央行支持导致流动性紧缩，系统性风险大幅上升。`;
            break;

          case 'coordinated_intervention':
            // Reality: Coordination challenges but overall effective
            effects.market_stability = 22; // Strong coordination effect
            effects.systemic_risk_level = -22; // International cooperation reduces risk
            effects.international_coordination = 25; // Successful coordination
            effects.reputation = 18; // Leadership in crisis
            effects.resources = -35000; // Coordination costs
            
            delayedEffects.push({
              turn: 3,
              effect: { 
                market_stability: 12, 
                systemic_risk_level: -8,
                international_coordination: 10,
                description: 'International cooperation yields sustained benefits'
              }
            });

            narrative = `协调干预策略通过国际合作有效稳定了市场，显著降低了系统风险。虽然成本较高，但展现了国际协调的强大力量。`;
            break;
        }
        break;

      case 3:
        // Turn 3: Monetary policy response with complex transmission mechanisms
        const decisionId3 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId3) {
          case 'aggressive_easing':
            // Reality: Aggressive easing effective but inflationary risks
            effects.market_stability = 25; // Strong stability effect
            effects.reputation = 12; // Decisive action
            effects.systemic_risk_level = -6; // Reduced funding stress
            effects.resources = -15000; // Interest rate losses
            effects.liquidity_index = 20; // Easy monetary conditions
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                systemic_risk_level: 5, 
                market_stability: -3,
                description: 'Aggressive easing creates inflation concerns in round 4'
              }
            });

            narrative = `激进降息有效提升了市场稳定性，但引发了通胀担忧。虽然短期内提振了信心，但长期通胀风险可能成为新的系统性威胁。`;
            break;

          case 'maintain_rates':
            // Reality: Maintaining rates may cause short-term pain but long-term gain
            effects.market_stability = -8; // Short-term disruption
            effects.reputation = 5; // Disciplined approach
            effects.systemic_risk_level = 3; // Potential stress
            effects.liquidity_index = -5; // Tight monetary conditions
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                market_stability: 15, 
                systemic_risk_level: -10,
                reputation: 8,
                description: 'Disciplined approach pays off in round 4'
              }
            });

            narrative = `维持利率不变的策略短期内导致市场动荡，但展现了政策纪律性。虽然当前市场承压，但为长期稳定奠定了基础。`;
            break;

          case 'quantitative_easing':
            // Reality: QE very effective but resource-intensive
            effects.market_stability = 30; // Strong QE effect
            effects.systemic_risk_level = -10; // QE reduces stress
            effects.liquidity_index = 35; // Massive liquidity
            effects.resources = -50000; // Large asset purchases
            effects.reputation = 20; // Comprehensive action
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                market_stability: 15, 
                liquidity_index: 20,
                description: 'QE effects continue to support markets in round 4'
              }
            });

            narrative = `量化宽松政策显著提升了市场稳定性和流动性。虽然央行资产负债表大幅扩张，但有效缓解了金融压力。`;
            break;

          case 'fiscal_coordination':
            // Reality: Fiscal-monetary coordination most effective
            effects.market_stability = 25; // Combined effect
            effects.systemic_risk_level = -18; // Dual approach
            effects.reputation = 22; // Comprehensive response
            effects.liquidity_index = 15; // Indirect liquidity support
            effects.regulatory_compliance = 5; // Fiscal discipline
            
            delayedEffects.push({
              turn: 4,
              effect: { 
                market_stability: 20, 
                systemic_risk_level: -12,
                reputation: 10,
                description: 'Fiscal coordination provides sustained support'
              }
            });

            narrative = `货币政策与财政政策的协调配合取得了最佳效果，双管齐下有效稳定了市场并降低了系统风险。`;
            break;
        }
        break;

      case 4:
        // Turn 4: International coordination with complex geopolitical implications
        const decisionId4 = Object.values(decisions)[0] || 'unknown';
        switch(decisionId4) {
          case 'lead_coordination':
            // Reality: Leadership effective but costly
            effects.international_coordination = 25; // Strong leadership effect
            effects.systemic_risk_level = -20; // Effective global cooperation
            effects.reputation = 18; // International leadership
            effects.resources = -20000; // Leadership costs
            
            delayedEffects.push({
              turn: 5,
              effect: { 
                systemic_risk_level: -8, 
                international_coordination: 15,
                description: 'Leadership effects continue to stabilize global markets'
              }
            });

            narrative = `主导国际合作的策略在稳定全球市场方面发挥了重要作用，显著降低了系统性风险。虽然承担了较多成本，但确立了国际金融领导地位。`;
            break;

          case 'follow_main':
            // Reality: Following has benefits but limits influence
            effects.international_coordination = 18; // Good alignment
            effects.market_stability = 12; // Alignment benefits
            effects.reputation = 8; // Reliable partner
            effects.resources = -5000; // Limited costs
            
            delayedEffects.push({
              turn: 5,
              effect: { 
                systemic_risk_level: -5, 
                market_stability: 8,
                description: 'Alignment strategy provides stable benefits'
              }
            });

            narrative = `跟随主要央行的策略实现了良好的国际协调，市场稳定性得到提升。虽然缺乏主动权，但风险较低，成本可控。`;
            break;

          case 'independent_policy':
            // Reality: Independence has benefits but creates isolation
            effects.systemic_risk_level = -5; // Domestic focus
            effects.reputation = -10; // International criticism
            effects.international_coordination = -20; // Reduced cooperation
            effects.market_stability = -10; // Isolation effects
            
            delayedEffects.push({
              turn: 5,
              effect: { 
                systemic_risk_level: 5, 
                market_stability: -15,
                description: 'Independent policy leads to market isolation'
              }
            });

            narrative = `独立政策虽然关注国内需求，但导致了国际孤立，市场信心受到影响。缺乏国际合作可能放大了外部冲击的影响。`;
            break;

          case 'temporary_coordination':
            // Reality: Temporary coordination provides balance
            effects.international_coordination = 22; // Effective temporary cooperation
            effects.systemic_risk_level = -15; // Crisis cooperation
            effects.reputation = 15; // Balanced approach
            effects.resources = -10000; // Coordination costs
            
            delayedEffects.push({
              turn: 5,
              effect: { 
                systemic_risk_level: -8, 
                international_coordination: 10,
                description: 'Temporary coordination provides sustainable benefits'
              }
            });

            narrative = `临时性协调机制在危机应对中取得了良好效果，平衡了国际合作与独立性。这种灵活安排既获得了合作益处又保持了政策自主性。`;
            break;
        }
        break;
    }

    return { effects, narrative, delayedEffects };
  }

  static applyFinancialCrisisDelayedEffects(currentTurn, delayedEffects, currentState) {
    let state = { ...currentState };

    if (!delayedEffects || delayedEffects.length === 0) {
      return { state };
    }

    delayedEffects.forEach(effect => {
      if (effect.turn === currentTurn) {
        if (effect.effect) {
          Object.keys(effect.effect).forEach(key => {
            if (key !== 'description' && state.hasOwnProperty(key)) {
              state[key] += effect.effect[key];
            }
          });
        }
      }
    });

    // Filter out applied effects
    const remainingEffects = delayedEffects.filter(effect => effect.turn !== currentTurn);

    return { state, remainingEffects };
  }

  static generateFinancialCrisisFeedback(turn, linearExpectation, actualResult, narrative) {
    let feedback = `📊 **第${turn}轮金融危机应对结果**\n\n`;

    feedback += `📖 **情况描述**：\n${narrative}\n\n`;

    feedback += `🧮 **你的线性预期**：\n${linearExpectation.thinking}\n`;
    feedback += `- 期望系统风险：${Math.round(linearExpectation.systemic_risk_level)}\n`;
    feedback += `- 期望市场稳定：${Math.round(linearExpectation.market_stability)}\n`;
    feedback += `- 期望声誉：${Math.round(linearExpectation.reputation)}\n\n`;

    feedback += `🎯 **实际结果**：\n`;
    feedback += `- 实际系统风险：${Math.round(actualResult.systemic_risk_level)} (${actualResult.systemic_risk_level >= linearExpectation.systemic_risk_level ? '+' : ''}${Math.round(actualResult.systemic_risk_level - linearExpectation.systemic_risk_level)})\n`;
    feedback += `- 实际市场稳定：${Math.round(actualResult.market_stability)} (${actualResult.market_stability >= linearExpectation.market_stability ? '+' : ''}${Math.round(actualResult.market_stability - linearExpectation.market_stability)})\n`;
    feedback += `- 实际声誉：${Math.round(actualResult.reputation)} (${actualResult.reputation >= linearExpectation.reputation ? '+' : ''}${Math.round(actualResult.reputation - linearExpectation.reputation)})\n`;

    const riskDiff = actualResult.systemic_risk_level - linearExpectation.systemic_risk_level;
    const stabilityDiff = actualResult.market_stability - linearExpectation.market_stability;
    const reputationDiff = actualResult.reputation - linearExpectation.reputation;

    if (Math.abs(riskDiff) > 8 || Math.abs(stabilityDiff) > 10 || Math.abs(reputationDiff) > 7) {
      feedback += `\n⚠️ **偏差分析**：实际结果与预期存在显著差异，说明金融系统中存在复杂的市场心理、政策传导机制和国际联动效应，简单的线性思维不足以应对。`;
    }

    return feedback;
  }

  static generateAIGovernanceFeedback(turn, linearExpectation, actualResult, narrative) {
    let feedback = `📊 **第${turn}轮AI治理结果**\n\n`;

    feedback += `📖 **情况描述**：\n${narrative}\n\n`;

    feedback += `🧮 **你的线性预期**：\n${linearExpectation.thinking}\n`;
    feedback += `- 期望AI能力评估：${Math.round(linearExpectation.ai_capability_assessment)}\n`;
    feedback += `- 期望安全合规：${Math.round(linearExpectation.safety_compliance)}\n`;
    feedback += `- 期望声誉：${Math.round(linearExpectation.reputation)}\n\n`;

    feedback += `🎯 **实际结果**：\n`;
    feedback += `- 实际AI能力评估：${Math.round(actualResult.ai_capability_assessment)} (${actualResult.ai_capability_assessment >= linearExpectation.ai_capability_assessment ? '+' : ''}${Math.round(actualResult.ai_capability_assessment - linearExpectation.ai_capability_assessment)})\n`;
    feedback += `- 实际安全合规：${Math.round(actualResult.safety_compliance)} (${actualResult.safety_compliance >= linearExpectation.safety_compliance ? '+' : ''}${Math.round(actualResult.safety_compliance - linearExpectation.safety_compliance)})\n`;
    feedback += `- 实际声誉：${Math.round(actualResult.reputation)} (${actualResult.reputation >= linearExpectation.reputation ? '+' : ''}${Math.round(actualResult.reputation - linearExpectation.reputation)})\n`;

    const capabilityDiff = actualResult.ai_capability_assessment - linearExpectation.ai_capability_assessment;
    const safetyDiff = actualResult.safety_compliance - linearExpectation.safety_compliance;
    const reputationDiff = actualResult.reputation - linearExpectation.reputation;

    if (Math.abs(capabilityDiff) > 5 || Math.abs(safetyDiff) > 8 || Math.abs(reputationDiff) > 7) {
      feedback += `\n⚠️ **偏差分析**：实际结果与预期存在显著差异，说明AI治理环境中存在复杂的技术发展、社会接受度、国际合作等多重因素，简单的线性思维不足以应对。`;
    }

    return feedback;
  }

  static generateClimateChangeFeedback(turn, linearExpectation, actualResult, narrative) {
    let feedback = `📊 **第${turn}轮气候政策结果**\n\n`;

    feedback += `📖 **情况描述**：\n${narrative}\n\n`;

    feedback += `🧮 **你的线性预期**：\n${linearExpectation.thinking}\n`;
    feedback += `- 期望减排幅度：${Math.round(linearExpectation.emission_reduction)}%\n`;
    feedback += `- 期望国际合作：${Math.round(linearExpectation.international_cooperation)}\n`;
    feedback += `- 期望声誉：${Math.round(linearExpectation.reputation)}\n\n`;

    feedback += `🎯 **实际结果**：\n`;
    feedback += `- 实际减排幅度：${Math.round(actualResult.emission_reduction)}% (${actualResult.emission_reduction >= linearExpectation.emission_reduction ? '+' : ''}${Math.round(actualResult.emission_reduction - linearExpectation.emission_reduction)})\n`;
    feedback += `- 实际国际合作：${Math.round(actualResult.international_cooperation)} (${actualResult.international_cooperation >= linearExpectation.international_cooperation ? '+' : ''}${Math.round(actualResult.international_cooperation - linearExpectation.international_cooperation)})\n`;
    feedback += `- 实际声誉：${Math.round(actualResult.reputation)} (${actualResult.reputation >= linearExpectation.reputation ? '+' : ''}${Math.round(actualResult.reputation - linearExpectation.reputation)})\n`;

    const emissionDiff = actualResult.emission_reduction - linearExpectation.emission_reduction;
    const cooperationDiff = actualResult.international_cooperation - linearExpectation.international_cooperation;
    const reputationDiff = actualResult.reputation - linearExpectation.reputation;

    if (Math.abs(emissionDiff) > 8 || Math.abs(cooperationDiff) > 10 || Math.abs(reputationDiff) > 8) {
      feedback += `\n⚠️ **偏差分析**：实际结果与预期存在显著差异，说明全球气候治理环境中存在复杂的国际博弈、政治动态和科学不确定性，简单的线性思维不足以应对。`;
    }

    return feedback;
  }

  static generatePersonalFinanceFeedback(turn, linearExpectation, actualResult, narrative) {
    let feedback = `📊 **第${turn}年财务总结**\n\n`;

    feedback += `📖 **情况描述**：\n${narrative}\n\n`;

    feedback += `🧮 **你的线性预期**：\n${linearExpectation.thinking}\n`;
    feedback += `- 期望总资产：¥${Math.round(linearExpectation.resources).toLocaleString()}\n`;
    feedback += `- 期望理财知识：${Math.round(linearExpectation.financial_knowledge)}\n\n`;

    feedback += `🎯 **实际结果**：\n`;
    feedback += `- 实际总资产：¥${Math.round(actualResult.resources).toLocaleString()} (${actualResult.resources >= linearExpectation.resources ? '+' : ''}${Math.round(actualResult.resources - linearExpectation.resources).toLocaleString()})\n`;
    feedback += `- 实际理财知识：${Math.round(actualResult.financial_knowledge)} (${actualResult.financial_knowledge >= linearExpectation.financial_knowledge ? '+' : ''}${Math.round(actualResult.financial_knowledge - linearExpectation.financial_knowledge)})\n`;

    const resourceDiff = actualResult.resources - linearExpectation.resources;
    const knowledgeDiff = actualResult.financial_knowledge - linearExpectation.financial_knowledge;

    if (Math.abs(resourceDiff) > 10000 || Math.abs(knowledgeDiff) > 5) {
      feedback += `\n⚠️ **偏差分析**：实际结果与预期存在显著差异，说明金融市场存在波动性、复利效应和时间价值等复杂因素，简单的线性思维不足以理解和预测长期财务结果。`;
    }

    return feedback;
  }

  static generatePublicPolicyFeedback(turn, linearExpectation, actualResult, narrative) {
    let feedback = `📊 **第${turn}回合结果**\n\n`;

    feedback += `📖 **情况描述**：\n${narrative}\n\n`;

    feedback += `🧮 **你的线性预期**：\n${linearExpectation.thinking}\n`;
    feedback += `- 期望预算：${Math.round(linearExpectation.resources)}元\n`;
    feedback += `- 期望公众支持：${Math.round(linearExpectation.public_support)}\n`;
    feedback += `- 期望政策效果：${Math.round(linearExpectation.policy_effectiveness)}\n\n`;

    feedback += `🎯 **实际结果**：\n`;
    feedback += `- 实际预算：${Math.round(actualResult.resources)}元 (${actualResult.resources >= linearExpectation.resources ? '+' : ''}${Math.round(actualResult.resources - linearExpectation.resources)})\n`;
    feedback += `- 实际公众支持：${Math.round(actualResult.public_support)} (${actualResult.public_support >= linearExpectation.public_support ? '+' : ''}${Math.round(actualResult.public_support - linearExpectation.public_support)})\n`;
    feedback += `- 实际政策效果：${Math.round(actualResult.policy_effectiveness)} (${actualResult.policy_effectiveness >= linearExpectation.policy_effectiveness ? '+' : ''}${Math.round(actualResult.policy_effectiveness - linearExpectation.policy_effectiveness)})\n`;

    const resourceDiff = actualResult.resources - linearExpectation.resources;
    const supportDiff = actualResult.public_support - linearExpectation.public_support;
    const policyDiff = actualResult.policy_effectiveness - linearExpectation.policy_effectiveness;

    if (Math.abs(resourceDiff) > 1000 || Math.abs(supportDiff) > 10 || Math.abs(policyDiff) > 8) {
      feedback += `\n⚠️ **偏差分析**：实际结果与预期存在显著差异，说明公共政策环境中存在复杂的利益博弈、政治动态和时间延迟效应，简单的线性思维不足以应对。`;
    }

    return feedback;
  }

  static applyBusinessStrategyDelayedEffects(currentTurn, delayedEffects, currentState) {
    let state = { ...currentState };

    if (!delayedEffects || delayedEffects.length === 0) {
      return { state };
    }

    delayedEffects.forEach(effect => {
      if (effect.turn === currentTurn) {
        if (effect.effect) {
          Object.keys(effect.effect).forEach(key => {
            if (key !== 'description' && state.hasOwnProperty(key)) {
              state[key] += effect.effect[key];
            }
          });
        }
      }
    });

    // Filter out applied effects
    const remainingEffects = delayedEffects.filter(effect => effect.turn !== currentTurn);

    return { state, remainingEffects };
  }

  static generateBusinessStrategyFeedback(turn, linearExpectation, actualResult, narrative) {
    let feedback = `📊 **第${turn}回合结果**\n\n`;

    feedback += `📖 **情况描述**：\n${narrative}\n\n`;

    feedback += `🧮 **你的线性预期**：\n${linearExpectation.thinking}\n`;
    feedback += `- 期望资金：${Math.round(linearExpectation.resources)}元\n`;
    feedback += `- 期望声誉：${Math.round(linearExpectation.reputation)}\n`;
    feedback += `- 期望市场地位：${Math.round(linearExpectation.market_position)}\n\n`;

    feedback += `🎯 **实际结果**：\n`;
    feedback += `- 实际资金：${Math.round(actualResult.resources)}元 (${actualResult.resources >= linearExpectation.resources ? '+' : ''}${Math.round(actualResult.resources - linearExpectation.resources)})\n`;
    feedback += `- 实际声誉：${Math.round(actualResult.reputation)} (${actualResult.reputation >= linearExpectation.reputation ? '+' : ''}${Math.round(actualResult.reputation - linearExpectation.reputation)})\n`;
    feedback += `- 实际市场地位：${Math.round(actualResult.market_position)} (${actualResult.market_position >= linearExpectation.market_position ? '+' : ''}${Math.round(actualResult.market_position - linearExpectation.market_position)})\n`;

    const resourceDiff = actualResult.resources - linearExpectation.resources;
    const reputationDiff = actualResult.reputation - linearExpectation.reputation;
    const marketDiff = actualResult.market_position - linearExpectation.market_position;

    if (Math.abs(resourceDiff) > 300 || Math.abs(reputationDiff) > 15 || Math.abs(marketDiff) > 10) {
      feedback += `\n⚠️ **偏差分析**：实际结果与预期存在显著差异，说明商业环境中存在复杂的相互依赖关系、延迟效应和竞争动态，简单的线性思维不足以应对。`;
    }

    return feedback;
  }

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

    // Enhanced feedback for multi-phase scenarios
    feedback += `\n🔍 **多阶段影响**：此决策可能对后续阶段产生连锁反应，特别是在第${turn + 1}-${turn + 3}回合之间。`;
    
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

  // ============================================================================
  // Investment Scenario Instance Methods (TDD GREEN Phase)
  // ============================================================================

  constructor() {
    // 决策规则配置
    this.decisionRules = {
      research_time: {
        min: 0,
        max: 100,
        impact: 0.1, // 每单位研究时间对知识的影响
        linearFactor: 10, // 线性期望系数
        biasPenaltyFactor: 0.02 // 偏误惩罚系数
      },
      diversification: {
        min: 0,
        max: 100,
        impact: 0.05, // 每单位分散度对风险的影响
        linearFactor: 5,
        biasPenaltyFactor: 0.01
      },
      trade_amount: {
        min: 0,
        max: 5000,
        impact: 0.001, // 每单位交易金额对收益的影响
        linearFactor: 0.01,
        biasPenaltyFactor: 0.005
      }
    };
  }

  /**
   * 计算决策的线性期望（用户直觉）
   * @param {string} decisionType - 决策类型 (research_time, diversification, trade_amount)
   * @param {number} value - 决策值
   * @param {object} state - 当前状态
   * @returns {object} 期望结果
   */
  calculateExpectation(decisionType, value, state) {
    const rules = this.decisionRules[decisionType];
    if (!rules) {
      throw new Error(`Unknown decision type: ${decisionType}`);
    }

    const { portfolio = 10000, knowledge = 0 } = state || {};
    let expected_portfolio, expected_profit, expected_knowledge, thinking;

    switch (decisionType) {
      case 'research_time':
        // 线性思维：研究时间越长，收益越高（简单乘法）
        expected_portfolio = portfolio + value * rules.linearFactor * 10;
        expected_knowledge = Math.min(knowledge + value * rules.impact * 100, 100);
        expected_profit = value * rules.linearFactor * 10;
        thinking = `投入${value}小时研究，期望收益${Math.round(expected_profit)}元，期望知识+${Math.round(expected_knowledge - knowledge)}点`;
        break;

      case 'diversification':
        // 线性思维：分散度越高，收益越稳定
        expected_portfolio = portfolio + value * rules.linearFactor * 20;
        expected_profit = value * rules.linearFactor * 20;
        expected_knowledge = knowledge;
        thinking = `分散投资${value}%，期望收益${Math.round(expected_profit)}元，风险降低`;
        break;

      case 'trade_amount':
        // 线性思维：交易金额越大，收益越大
        expected_portfolio = portfolio + value * rules.linearFactor * 2;
        expected_profit = value * rules.linearFactor * 2;
        expected_knowledge = knowledge;
        thinking = `投入${value}元交易，期望收益${Math.round(expected_profit)}元`;
        break;

      default:
        throw new Error(`Unknown decision type: ${decisionType}`);
    }

    return {
      expected_portfolio: Math.round(expected_portfolio),
      expected_profit: Math.round(expected_profit),
      expected_knowledge: Math.round(expected_knowledge),
      thinking: thinking
    };
  }

  /**
   * 计算实际结果（考虑偏误惩罚）
   * @param {string} decisionType - 决策类型
   * @param {number} value - 决策值
   * @param {object} state - 当前状态
   * @param {number} biasRisk - 偏误风险 (0-100)
   * @returns {object} 实际结果
   */
  calculateActualResult(decisionType, value, state, biasRisk) {
    const expectation = this.calculateExpectation(decisionType, value, state);
    const rules = this.decisionRules[decisionType];

    // 计算偏误惩罚：偏误风险越高，实际收益越低
    const biasPenalty = Math.max(0, biasRisk - 50) * rules.biasPenaltyFactor * value;
    const actual_portfolio = expectation.expected_portfolio - biasPenalty;
    const actual_profit = expectation.expected_profit - biasPenalty;

    // 延迟效应：研究时间不足时，效果在后续回合显现
    let delayed_effects = [];
    if (decisionType === 'research_time' && value < 30) {
      delayed_effects.push({
        type: 'research_bonus',
        amount: value * 5,
        description: '研究效果延迟显现',
        turn_delay: 2
      });
    }

    return {
      expected_portfolio: expectation.expected_portfolio,
      actual_portfolio: Math.round(actual_portfolio),
      expected_profit: expectation.expected_profit,
      actual_profit: Math.round(actual_profit),
      bias_penalty: Math.round(biasPenalty),
      delayed_effects: delayed_effects
    };
  }

  /**
   * 计算回合总结
   * @param {object} state - 当前状态
   * @param {array} history - 决策历史
   * @returns {object} 回合总结
   */
  calculateTurnSummary(state, history) {
    const lastDecision = history[history.length - 1];
    const { portfolio, knowledge, turn_number } = state;

    let narrative, performance, metrics;

    if (lastDecision) {
      // 根据偏误风险生成不同的叙述
      const biasRisk = lastDecision.bias_risk || 0;

      if (biasRisk > 70) {
        narrative = '你的投资决策受到严重确认偏误影响。你过度依赖单一信息来源，忽视了重要的风险信号。';
        performance = 'poor';
      } else if (biasRisk > 40) {
        narrative = '你的投资决策有一定偏误迹象。注意不要只寻找支持自己观点的信息。';
        performance = 'average';
      } else {
        narrative = '你的投资决策相对理性，能够综合考虑多种信息来源。';
        performance = 'good';
      }
    }

    metrics = {
      portfolio_change: portfolio - 10000,
      knowledge_gained: knowledge,
      turn: turn_number
    };

    return {
      narrative,
      performance,
      metrics
    };
  }

  /**
   * 生成回合叙述文本
   * @param {object} state - 当前状态
   * @param {object} result - 计算结果
   * @returns {string} 叙述文本
   */
  generateTurnNarrative(state, result) {
    const { actual_portfolio, bias_penalty, delayed_effects } = result;
    const { portfolio } = state;

    let narrative = '';

    if (bias_penalty > 0) {
      narrative += `⚠️ 偏误惩罚：由于你的信息收集存在偏误，实际收益减少了${bias_penalty}元。\n\n`;
    }

    if (delayed_effects && delayed_effects.length > 0) {
      narrative += `⏰ 延迟效果：${delayed_effects[0].description}，将在${delayed_effects[0].turn_delay}回合后显现。\n\n`;
    }

      narrative += `📊 本回合结束，资产净值：${Math.round(portfolio)}元`;

    return narrative;
  }

  /**
   * 计算投资回合总结（静态方法，兼容API调用）
   * @param {object} decisions - 决策数据
   * @param {object} gameState - 游戏状态
   * @returns {object} 回合总结
   */
  static calculateInvestmentTurnSummary(decisions, gameState) {
    const engine = new DecisionEngine();
    const history = gameState.decision_history || [];

    const turnSummary = engine.calculateTurnSummary(gameState, history);
    const narrative = engine.generateTurnNarrative(gameState, {
      actual_portfolio: gameState.portfolio,
      bias_penalty: decisions.bias_penalty || 0,
      delayed_effects: decisions.delayed_effects || []
    });

    return {
      summary: turnSummary,
      narrative: narrative,
      actual_result: {
        portfolio: gameState.portfolio,
        knowledge: gameState.knowledge
      }
    };
  }
}

// ============================================================================
// INVESTMENT CONFIRMATION BIAS SCENARIO - NEW CLASSES (TDD GREEN Phase)
// ============================================================================

/**
 * 投资确认偏误场景 - 页面路由器
 * 基于CoffeeShopPageRouter和RelationshipTimeDelayPageRouter模式
 */
class InvestmentConfirmationBiasPageRouter {
  constructor(gameState = null) {
    // 初始化游戏状态
    this.gameState = gameState || {
      portfolio: 10000,
      knowledge: 0,
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      selected_sources: [],
      source_quality: {},
      bias_risk: 0,
      achievements: []
    };
    
    // 页面流转状态
    this.currentPage = 'START';
    this.currentTurn = 1;
    this.currentDecisionIndex = 0;
    this.tempDecisions = {};
    this.tempSources = [];
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
  }
  
  resetGame() {
    this.currentPage = 'START';
    this.currentTurn = 1;
    this.tempDecisions = {};
    this.tempSources = [];
  }

  // ========== 信息源选择 ==========
  
  selectSource(sourceId) {
    const index = this.tempSources.indexOf(sourceId);
    if (index === -1) {
      this.tempSources.push(sourceId);
    } else {
      this.tempSources.splice(index, 1);
    }
  }

  // ========== 决策流程 ==========
  
  makeDecision(key, value) {
    this.tempDecisions[key] = value;
    
    // 页面流转逻辑
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
    } else if (this.currentPage === 'TURN_4_DECISION_1') {
      this.currentPage = 'TURN_4_DECISION_1_FEEDBACK';
    } else if (this.currentPage === 'TURN_5_DECISION_1') {
      this.currentPage = 'TURN_5_DECISION_1_FEEDBACK';
    }
  }

  confirmFeedback() {
    const currentPage = this.currentPage;

    if (currentPage === 'TURN_1_DECISION_1_FEEDBACK') {
      this.currentPage = 'TURN_1_DECISION_2';
      this.currentDecisionIndex = 1;
    } else if (currentPage === 'TURN_1_DECISION_2_FEEDBACK') {
      this.currentPage = 'TURN_1_SUMMARY';
    } else if (currentPage === 'TURN_2_DECISION_1_FEEDBACK') {
      this.currentPage = 'TURN_2_DECISION_2';
      this.currentDecisionIndex = 1;
    } else if (currentPage === 'TURN_2_DECISION_2_FEEDBACK') {
      this.currentPage = 'TURN_2_SUMMARY';
    } else if (currentPage === 'TURN_3_DECISION_1_FEEDBACK') {
      this.currentPage = 'TURN_3_SUMMARY';
    } else if (currentPage === 'TURN_4_DECISION_1_FEEDBACK') {
      // 觉醒后进入第5回合
      this.nextTurn();
    } else if (currentPage === 'TURN_5_DECISION_1_FEEDBACK') {
      this.currentPage = 'TURN_5_ENDING';
    }
  }

  // ========== 回合管理 ==========
  
  nextTurn() {
    // 提交当前回合的决策
    this.submitTurn();
    
    // 进入下一回合
    this.currentTurn++;
    this.currentDecisionIndex = 0;
    this.tempDecisions = {};
    this.tempSources = [];
    
    // 设置下一回合的页面
    if (this.currentTurn === 2) {
      this.currentPage = 'TURN_2_DECISION_1';
    } else if (this.currentTurn === 3) {
      this.currentPage = 'TURN_3_DECISION_1';
    } else if (this.currentTurn === 4) {
      this.currentPage = 'TURN_4_DECISION_1';
    } else if (this.currentTurn === 5) {
      this.currentPage = 'TURN_5_DECISION_1';
    } else if (this.currentTurn >= 6) {
      this.currentPage = 'TURN_5_ENDING';
    }
  }
  
  submitTurn() {
    // 计算回合总结
    const summary = DecisionEngine.calculateInvestmentTurnSummary(
      this.tempDecisions,
      this.gameState
    );
    
    // 更新游戏状态
    this.gameState.portfolio = summary.actual_result.portfolio;
    this.gameState.knowledge = summary.actual_result.knowledge;
    this.gameState.turn_number++;
    
    // 更新信息源质量
    this.updateSourceQuality(this.tempSources);
    
    // 计算偏误风险
    const biasResult = BiasAnalyzer.analyzeConfirmationBias(
      this.gameState.decision_history
    );
    this.gameState.bias_risk = biasResult.biasRisk;
    
    // 添加到决策历史
    this.gameState.decision_history.push({
      turn: this.currentTurn,
      decisions: { ...this.tempDecisions },
      sources: [...this.tempSources],
      linear_expectation: summary.linear_expectation,
      actual_result: summary.actual_result,
      gap: summary.gap,
      bias_metrics: biasResult
    });
    
    // 应用延迟效果
    this.applyDelayedEffects();
    
    // 清空临时决策
    this.tempDecisions = {};
    this.tempSources = [];
  }

  updateSourceQuality(sources) {
    sources.forEach(sourceId => {
      if (!this.gameState.source_quality[sourceId]) {
        this.gameState.source_quality[sourceId] = {
          used_count: 0,
          bias_score: 0
        };
      }
      this.gameState.source_quality[sourceId].used_count++;
    });
  }

  applyDelayedEffects() {
    const turn = this.currentTurn;
    
    (this.gameState.delayed_effects || []).forEach(effect => {
      if (effect.turn_delay === turn) {
        if (effect.knowledge) {
          this.gameState.knowledge += effect.knowledge;
        }
      }
    });
    
    // 移除已应用的效果
    this.gameState.delayed_effects = this.gameState.delayed_effects.filter(
      effect => effect.turn_delay > turn
    );
  }

  // ========== 觉醒决策 ==========
  
  makeAwakeningDecision(strategy) {
    this.tempDecisions = {
      awakeningStrategy: strategy
    };
    
    // 应用策略效果
    if (strategy === 'diversify' || strategy === 'question') {
      this.gameState.portfolio += 500;
      this.gameState.knowledge += 20;
    } else if (strategy === 'continue') {
      this.gameState.portfolio += 100;
    }
  }

  // ========== 辅助方法 ==========
  
  getTempDecisions() {
    return this.tempDecisions;
  }
  
  updateDecision(key, value) {
    this.tempDecisions[key] = value;
  }

  // ========== 渲染方法 ==========
  
  renderPage() {
    switch (this.currentPage) {
      case 'START':
        return this.renderStartPage();
      case 'TURN_1_DECISION_1':
      case 'TURN_2_DECISION_1':
      case 'TURN_3_DECISION_1':
      case 'TURN_5_DECISION_1':
        return this.renderInformationSourcePage();
      case 'TURN_1_DECISION_2':
        return this.renderDecisionPage(1, 2, 'research_time', {
          min: 0, max: 100, default: 20, unit: '小时'
        });
      case 'TURN_2_DECISION_2':
        return this.renderDecisionPage(2, 2, 'diversification', {
          min: 0, max: 100, default: 50, unit: '%'
        });
      case 'TURN_3_DECISION_2':
        return this.renderDecisionPage(3, 2, 'trade_amount', {
          min: 0, max: 5000, default: 2000, unit: '¥'
        });
      case 'TURN_4_DECISION_1':
        return this.renderAwakeningPage();
      case 'TURN_1_DECISION_1_FEEDBACK':
      case 'TURN_1_DECISION_2_FEEDBACK':
      case 'TURN_2_DECISION_1_FEEDBACK':
      case 'TURN_2_DECISION_2_FEEDBACK':
      case 'TURN_3_DECISION_1_FEEDBACK':
      case 'TURN_4_DECISION_1_FEEDBACK':
      case 'TURN_5_DECISION_1_FEEDBACK':
        return this.renderFeedbackPage();
      case 'TURN_1_SUMMARY':
      case 'TURN_2_SUMMARY':
      case 'TURN_3_SUMMARY':
        return this.renderTurnSummaryPage();
      case 'TURN_5_ENDING':
        return this.renderEndingPage();
      default:
        return '<div>页面开发中...</div>';
    }
  }
  
  renderStartPage() {
    return `
      <div class="game-page start-page">
        <h2>📈 投资决策挑战</h2>
        <div class="scenario-intro">
          <p>你刚获得一笔投资资金，准备进入股票市场。</p>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">💰 初始资金</span>
              <span class="stat-value">¥${this.gameState.portfolio}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📚 初始知识</span>
              <span class="stat-value">0</span>
            </div>
          </div>
          <div class="confirmation-bias-hint">
            <p><strong>💭 你的直觉想法：</strong></p>
            <ul>
              <li>"看好科技股，就多找支持科技股的分析"</li>
              <li>"坚持自己的判断，忽略不同观点"</li>
            </ul>
          </div>
          <p class="game-goal"><strong>🎯 目标：</strong>投资5个季度，实现资金增值并学习多元化投资</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="window.investmentRouter.startGame(); window.investmentRouter.render();">开始投资</button>
        </div>
      </div>
    `;
  }
  
  renderInformationSourcePage() {
    const sources = [
      { id: 'news', icon: '📰', name: '新闻资讯', bias: 0.7, reliability: 0.6 },
      { id: 'research', icon: '📊', name: '研究报告', bias: 0.4, reliability: 0.8 },
      { id: 'friend', icon: '👥', name: '朋友推荐', bias: 0.8, reliability: 0.5 },
      { id: 'ai', icon: '🤖', name: 'AI分析', bias: 0.3, reliability: 0.9 }
    ];
    
    return `
      <div class="game-page information-source-page">
        <h2>📋 第${this.currentTurn}季度 - 信息源选择</h2>
        <div class="progress">季度 ${this.currentTurn}/5</div>
        
        <div class="state-display">
          <h3>📊 当前状态</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="state-label">💰 资金</span>
              <span class="state-value">¥${Math.round(this.gameState.portfolio)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">📚 知识</span>
              <span class="state-value">${Math.round(this.gameState.knowledge)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">⚠️ 偏误风险</span>
              <span class="state-value ${this.gameState.bias_risk > 60 ? 'warning' : ''}">${this.gameState.bias_risk}%</span>
            </div>
          </div>
        </div>
        
        <div class="information-sources">
          <h3>📰 选择信息来源</h3>
          <p class="hint">选择2-4个信息源以获得全面视角</p>
          <div class="sources-grid">
            ${sources.map(source => `
              <div class="source-card ${this.tempSources.includes(source.id) ? 'selected' : ''}"
                   onclick="window.investmentRouter.selectSource('${source.id}'); window.investmentRouter.render();">
                <div class="source-icon">${source.icon}</div>
                <div class="source-name">${source.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary confirm-btn"
                  ${this.tempSources.length === 0 ? 'disabled' : ''}
                  onclick="window.investmentRouter.makeDecision('sources', window.investmentRouter.tempSources); window.investmentRouter.render();">
            确认选择 (${this.tempSources.length}个信息源)
          </button>
        </div>
      </div>
    `;
  }
  
  renderDecisionPage(turn, decisionNum, decisionId, config) {
    const value = this.tempDecisions[decisionId] || config.default;
    const expectation = DecisionEngine.calculateInvestmentExpectation(decisionId, value, this.gameState);
    
    return `
      <div class="game-page decision-page turn-${turn}-decision-${decisionNum}">
        <div class="page-header">
          <h2>📈 第${turn}季度 - 决策${decisionNum}/2</h2>
          <div class="progress">季度 ${this.currentTurn}/5</div>
        </div>
        
        <div class="state-display">
          <h3>📊 当前状态</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="state-label">💰 资金</span>
              <span class="state-value">¥${Math.round(this.gameState.portfolio)}</span>
            </div>
          </div>
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
                   oninput="window.investmentRouter.updateDecision('${decisionId}', parseInt(this.value)); window.investmentRouter.render();">
            <span class="max-value">${config.max}${config.unit}</span>
          </div>
          <p class="current-selection">当前选择：${value}${config.unit}</p>
        </div>
        
        <div class="expectation-calculator">
          <h3>💭 你的线性期望</h3>
          <div class="calculation-breakdown">
            ${expectation.thinking}
          </div>
          <div class="total-expectation">
            <span>期望收益：</span>
            <span class="value ${expectation.expected_profit >= 0 ? 'positive' : 'negative'}">
              ${expectation.expected_profit >= 0 ? '+' : ''}¥${Math.round(expectation.expected_profit)}
            </span>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary confirm-btn"
                  onclick="window.investmentRouter.makeDecision('${decisionId}', window.investmentRouter.tempDecisions['${decisionId}']); window.investmentRouter.render();">
            确认选择
          </button>
        </div>
      </div>
    `;
  }
  
  renderFeedbackPage() {
    return `
      <div class="game-page feedback-page">
        <h2>✅ 决策已确认</h2>
        
        <div class="feedback-content">
          <p><strong>你的选择：</strong> ${this.renderDecisionSummary()}</p>
          
          <div class="expectation-display">
            <h3>📈 你的线性期望</h3>
            <p>实际结果将在季度末揭晓...（受市场波动和偏误影响）</p>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.investmentRouter.confirmFeedback(); window.investmentRouter.render();">继续</button>
        </div>
      </div>
    `;
  }
  
  renderTurnSummaryPage() {
    const summary = DecisionEngine.calculateInvestmentTurnSummary(
      this.tempDecisions,
      this.gameState
    );
    const biasResult = BiasAnalyzer.analyzeConfirmationBias(
      this.gameState.decision_history
    );
    
    return `
      <div class="game-page turn-summary-page">
        <h2>📊 第${this.currentTurn}季度总结</h2>
        
        <div class="comparison">
          <h3>你的期望 vs 实际结果</h3>
          <div class="comparison-row">
            <span>期望资金：</span>
            <span class="value">¥${Math.round(summary.linear_expectation.portfolio)}</span>
          </div>
          <div class="comparison-row">
            <span>实际资金：</span>
            <span class="value ${summary.gap >= 0 ? 'positive' : 'negative'}">
              ¥${Math.round(summary.actual_result.portfolio)}
              (${summary.gap >= 0 ? '+' : ''}¥${Math.round(summary.gap)})
            </span>
          </div>
        </div>
        
        <div class="bias-metrics">
          <h3>⚠️ 确认偏误分析</h3>
          <div class="metrics-grid">
            <div class="metric-item">
              <span class="metric-label">信息多样性</span>
              <span class="metric-value">${(biasResult.diversity * 100).toFixed(0)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">一致性偏好</span>
              <span class="metric-value">${(biasResult.consistency * 100).toFixed(0)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">偏误风险</span>
              <span class="metric-value ${biasResult.biasRisk > 60 ? 'warning' : ''}">${biasResult.biasRisk}%</span>
            </div>
          </div>
        </div>
        
        <div class="narrative">
          <h3>📖 发生了什么</h3>
          <p>${summary.narrative}</p>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.investmentRouter.nextTurn(); window.investmentRouter.render();">
            进入第${this.currentTurn + 1}季度 →
          </button>
        </div>
      </div>
    `;
  }
  
  renderAwakeningPage() {
    const biasResult = BiasAnalyzer.analyzeConfirmationBias(
      this.gameState.decision_history
    );
    
    return `
      <div class="game-page awakening-page">
        <h2>💡 觉醒时刻</h2>
        
        <div class="awakening-content">
          <div class="pattern-reveal">
            <h3>🧠 你发现了一个模式...</h3>
            <p class="insight-text">
              当你<strong>过于依赖单一信息源</strong>或<strong>选择性接收信息</strong>时，
              你的投资决策容易出现偏差。
            </p>
          </div>
          
          <div class="theory-lesson">
            <h3>📖 《失败的逻辑》教诲</h3>
            <blockquote>
              "确认偏误是指我们倾向于寻找、解释和记住那些证实我们已有信念或假设的信息，而忽视与之相矛盾的信息。"
            </blockquote>
          </div>
          
          <div class="choice">
            <h3>🎯 最后一季度：你会如何决策？</h3>
            <div class="awakening-options">
              <button class="btn btn-option" onclick="window.investmentRouter.makeAwakeningDecision('continue'); window.investmentRouter.render();">
                🔄 继续现状
                <small>坚持当前策略</small>
              </button>
              <button class="btn btn-option" onclick="window.investmentRouter.makeAwakeningDecision('diversify'); window.investmentRouter.render();">
                🎯 多元投资
                <small>分散风险，多样化信息源</small>
              </button>
              <button class="btn btn-option" onclick="window.investmentRouter.makeAwakeningDecision('question'); window.investmentRouter.render();">
                ❓ 重新思考
                <small>质疑现有策略，寻求不同观点</small>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  renderEndingPage() {
    const finalPortfolio = Math.round(this.gameState.portfolio);
    const finalKnowledge = Math.round(this.gameState.knowledge);
    const biasRisk = this.gameState.bias_risk;
    
    let rating = '';
    let message = '';
    
    if (finalPortfolio >= 15000 && biasRisk < 40) {
      rating = '🏆 投资大师';
      message = '你成功克服了确认偏误，实现了多元化投资！';
    } else if (finalPortfolio >= 12000 || biasRisk < 50) {
      rating = '⭐ 优秀投资者';
      message = '你学会了警惕确认偏误，做出了更明智的决策。';
    } else if (finalPortfolio >= 10000) {
      rating = '👍 合格投资者';
      message = '你经历了一些挫折，获得了宝贵的经验。';
    } else {
      rating = '📚 需要学习';
      message = '确认偏误导致了投资损失，建议重新学习《失败的逻辑》。';
    }
    
    return `
      <div class="game-page ending-page">
        <h2>🎉 投资结束</h2>
        
        <div class="final-results">
          <div class="rating">
            <h3>${rating}</h3>
            <p class="message">${message}</p>
          </div>
          
          <div class="final-stats">
            <h3>📊 最终状态</h3>
            <div class="stat-row">
              <span>💰 资金：</span>
              <span class="value ${finalPortfolio >= 10000 ? 'positive' : 'negative'}">¥${finalPortfolio}</span>
            </div>
            <div class="stat-row">
              <span>📚 知识：</span>
              <span class="value">${finalKnowledge}</span>
            </div>
            <div class="stat-row">
              <span>⚠️ 偏误风险：</span>
              <span class="value ${biasRisk < 50 ? 'positive' : 'negative'}">${biasRisk}%</span>
            </div>
          </div>
          
          <div class="lessons-learned">
            <h3>🎓 你学到了什么</h3>
            <ul>
              <li>确认偏误如何影响投资决策</li>
              <li>多元化信息源的重要性</li>
              <li>选择性接收信息的危害</li>
              <li>如何识别和克服确认偏误</li>
            </ul>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.investmentRouter.resetGame(); window.investmentRouter.render();">重新挑战</button>
        </div>
      </div>
    `;
  }
  
  // ========== 辅助渲染方法 ==========
  
  getDecisionLabel(decisionId) {
    const labels = {
      'research_time': '研究时间',
      'diversification': '投资多样化',
      'trade_amount': '交易金额',
      'strategy': '投资策略'
    };
    return labels[decisionId] || decisionId;
  }
  
  getCurrentValueLabel(decisionId) {
    const labels = {
      'research_time': '暂无研究',
      'diversification': '未多样化',
      'trade_amount': '暂无交易',
      'strategy': '未选择'
    };
    return labels[decisionId] || '';
  }
  
  renderDecisionSummary() {
    const sources = this.tempSources.map(id => {
      const map = {
        'news': '新闻资讯',
        'research': '研究报告',
        'friend': '朋友推荐',
        'ai': 'AI分析'
      };
      return map[id];
    });
    return `信息源：${sources.join(', ')}`;
  }
  
  // ========== 状态持久化 ==========
  
  saveState() {
    const state = {
      tempDecisions: this.tempDecisions,
      tempSources: this.tempSources,
      currentTurn: this.currentTurn,
      currentPage: this.currentPage,
      gameState: this.gameState
    };
    sessionStorage.setItem('investmentGameState', JSON.stringify(state));
  }
  
  loadState() {
    const saved = sessionStorage.getItem('investmentGameState');
    if (saved) {
      const state = JSON.parse(saved);
      this.tempDecisions = state.tempDecisions;
      this.tempSources = state.tempSources;
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

/**
 * 确认偏误分析器 - 检测和分析确认偏误
 */
class BiasAnalyzer {
  constructor() {
    this.thresholds = {
      low_risk: 40,
      medium_risk: 60,
      high_risk: 80
    };
  }
  
  /**
   * 分析确认偏误
   */
  analyzeConfirmationBias(decisionHistory) {
    if (!decisionHistory || decisionHistory.length === 0) {
      return {
        diversity: 0,
        consistency: 0,
        singleSourceRisk: 0,
        biasRisk: 0,
        recommendations: []
      };
    }
    
    // 计算信息多样性
    const diversity = this.calculateSourceDiversity(decisionHistory);
    
    // 计算信息一致性
    const consistency = this.calculateSourceConsistency(decisionHistory);
    
    // 计算单一信息源风险
    const singleSourceRisk = this.calculateSingleSourceRisk(decisionHistory);
    
    // 计算偏误风险
    const biasRisk = this.calculateBiasRisk(diversity, consistency, singleSourceRisk);
    
    // 生成建议
    const recommendations = this.generateRecommendations(
      diversity,
      consistency,
      singleSourceRisk
    );
    
    return {
      diversity,
      consistency,
      singleSourceRisk,
      biasRisk,
      recommendations
    };
  }
  
  /**
   * 计算信息源多样性
   */
  calculateSourceDiversity(decisionHistory) {
    const sourceTypes = new Set();
    
    decisionHistory.forEach(record => {
      if (record.sources) {
        record.sources.forEach(source => sourceTypes.add(source));
      }
    });
    
    return Math.min(sourceTypes.size / 4, 1);
  }
  
  /**
   * 计算信息源一致性
   */
  calculateSourceConsistency(decisionHistory) {
    if (decisionHistory.length <= 1) return 0;
    
    let consistencyCount = 0;
    
    for (let i = 1; i < decisionHistory.length; i++) {
      const current = decisionHistory[i].sources ? decisionHistory[i].sources.slice().sort().join(',') : '';
      const previous = decisionHistory[i-1].sources ? decisionHistory[i-1].sources.slice().sort().join(',') : '';
      
      if (current === previous && current !== '') {
        consistencyCount++;
      }
    }
    
    return consistencyCount / (decisionHistory.length - 1);
  }
  
  /**
   * 计算单一信息源风险
   */
  calculateSingleSourceRisk(decisionHistory) {
    const singleSourceCount = decisionHistory.filter(
      record => record.sources && record.sources.length === 1
    ).length;
    
    return singleSourceCount / decisionHistory.length;
  }
  
  /**
   * 计算偏误风险
   */
  calculateBiasRisk(diversity, consistency, singleSourceRisk) {
    // 权重：多样性40%，一致性30%，单源风险30%
    const risk = (1 - diversity) * 40 + consistency * 30 + singleSourceRisk * 30;
    return Math.round(Math.min(Math.max(risk, 0), 100));
  }
  
  /**
   * 生成建议
   */
  generateRecommendations(diversity, consistency, singleSourceRisk) {
    const recommendations = [];

    if (diversity < 0.5) {
      recommendations.push('尝试使用更多不同类型的信息源');
    }

    if (consistency > 0.5) {
      recommendations.push('你倾向于重复选择相似的信息，考虑尝试新的来源');
    }

    // Only warn about single source if diversity is low
    if (singleSourceRisk > 0.5 && diversity < 0.5) {
      recommendations.push('避免只依赖单一信息源');
    }

    return recommendations;
  }
  
  /**
   * 识别偏误模式
   */
  identifyBiasPatterns(decisions) {
    const patterns = [];
    
    // 检查确认偏误
    const sourceCounts = {};
    decisions.forEach(d => {
      if (d.source) {
        sourceCounts[d.source] = (sourceCounts[d.source] || 0) + 1;
      }
    });
    
    const maxCount = Math.max(...Object.values(sourceCounts));
    if (maxCount / decisions.length > 0.5) {
      patterns.push('confirmation_bias');
    }
    
    // 检查低多样性
    const uniqueSources = Object.keys(sourceCounts).length;
    if (uniqueSources / decisions.length < 0.5) {
      patterns.push('low_diversity');
    }
    
    return patterns;
  }
  
  /**
   * 获取偏误指标
   */
  getBiasMetrics(decisionHistory) {
    const result = this.analyzeConfirmationBias(decisionHistory);

    let level = 'low';
    if (result.biasRisk > 60) level = 'high';
    else if (result.biasRisk > 40) level = 'medium';

    return {
      ...result,
      level,
      recommendations: result.recommendations
    };
  }

  // ============================================================================
  // Static wrapper methods for backward compatibility
  // ============================================================================

  static analyzeConfirmationBias(decisionHistory) {
    const analyzer = new BiasAnalyzer();
    return analyzer.analyzeConfirmationBias(decisionHistory);
  }

  static calculateBiasRisk(diversity, consistency, singleSourceRisk) {
    const analyzer = new BiasAnalyzer();
    return analyzer.calculateBiasRisk(diversity, consistency, singleSourceRisk);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InvestmentConfirmationBiasPageRouter, BiasAnalyzer };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.InvestmentConfirmationBiasPageRouter = InvestmentConfirmationBiasPageRouter;
  window.BiasAnalyzer = BiasAnalyzer;
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
        turn_number: 1,
        max_turns: 5  // Extended from original
      },
      'investment-confirmation-bias': {
        portfolio: 10000,
        knowledge: 0,
        turn_number: 1,
        max_turns: 8  // Extended to support 8+ rounds
      },
      'relationship-time-delay': {
        satisfaction: 50,
        trust: 50,
        turn_number: 1,
        max_turns: 10  // Extended to support 10 rounds
      },
      'extended-multi-phase': {
        satisfaction: 50,
        resources: 10000,
        reputation: 50,
        turn_number: 1,
        max_turns: 12,  // New extended scenario with 12 rounds
        phase: 1,       // Track current phase
        phase_progress: 0  // Track progress within phase
      }
    };

    return scenarios[scenarioId] || {
      satisfaction: 50,
      resources: 1000,
      reputation: 50,
      turn_number: 1,
      max_turns: 5
    };
  }

  static async startScenario(scenarioId) {
    console.log('Starting scenario:', scenarioId);

    // Check if this is a turn-based scenario
    if (scenarioId === 'coffee-shop-linear-thinking') {
      this.startCoffeeShopGame();
      return;
    } else if (scenarioId === 'business-strategy-reasoning') {
      this.startBusinessStrategyGame();
      return;
    } else if (scenarioId === 'public-policy-making') {
      this.startPublicPolicyGame();
      return;
    } else if (scenarioId === 'personal-finance-decision') {
      this.startPersonalFinanceGame();
      return;
    } else if (scenarioId === 'climate-change-policy') {
      this.startClimateChangeGame();
      return;
    } else if (scenarioId === 'ai-governance-regulation') {
      this.startAIGovernanceGame();
      return;
    } else if (scenarioId === 'financial-crisis-response') {
      this.startFinancialCrisisGame();
      return;
    } else if (scenarioId === 'extended-multi-phase') {
      this.startExtendedMultiPhaseGame();
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
        patterns: [],          // ✅ Identify decision patterns
        checkpoints: {},       // ✅ Add checkpoint system for extended scenarios
        auto_save_enabled: true,  // ✅ Enable auto-save for extended scenarios
        last_saved: Date.now(),   // ✅ Track last save time
        scenario_progress: 0      // ✅ Track overall scenario progress
      };

      // Hide any existing modal before showing new one
      const modal = document.getElementById('game-modal');
      if (modal && modal.classList.contains('active')) {
        console.warn('Modal already active, hiding first');
        this.hideGameModal();
        // Wait for modal to close before opening new one
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
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
            patterns: AppState.gameSession.patterns || [],                    // ✅ Preserve patterns
            checkpoints: AppState.gameSession.checkpoints || {},              // ✅ Preserve checkpoints
            auto_save_enabled: AppState.gameSession.auto_save_enabled,        // ✅ Preserve auto-save setting
            last_saved: AppState.gameSession.last_saved,                      // ✅ Preserve last save time
            scenario_progress: AppState.gameSession.scenario_progress || 0    // ✅ Preserve progress
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
          patterns: [],          // ✅ Track patterns
          checkpoints: {},       // ✅ Add checkpoint system
          auto_save_enabled: true,  // ✅ Enable auto-save
          last_saved: Date.now(),   // ✅ Track last save time
          scenario_progress: 0      // ✅ Track progress
        };
        this.loadStaticGameContent(scenarioId);
        return;
      }

      // Load dynamic game content
      await this.loadGameContent(scenarioId);
      
      // Start auto-save timer for extended scenarios
      if (AppState.gameSession.gameState.max_turns > 5) {
        this.startAutoSaveTimer();
      }
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
    } else if (scenarioId === 'investment-confirmation-bias') {
      GameManager.startInvestmentConfirmationBiasGame();
      return;
    } else if (scenarioId === 'business-strategy-reasoning') {
      GameManager.startBusinessStrategyGame();
      return;
    } else if (scenarioId === 'public-policy-making') {
      GameManager.startPublicPolicyGame();
      return;
    } else if (scenarioId === 'personal-finance-decision') {
      GameManager.startPersonalFinanceGame();
      return;
    } else if (scenarioId === 'climate-change-policy') {
      GameManager.startClimateChangeGame();
      return;
    } else if (scenarioId === 'ai-governance-regulation') {
      GameManager.startAIGovernanceGame();
      return;
    } else if (scenarioId === 'financial-crisis-response') {
      GameManager.startFinancialCrisisGame();
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

      // Update user profile with personalized learning engine
      if (window.PersonalizedLearningEngine) {
        const userId = AppState.userId || 'anonymous';
        window.PersonalizedLearningEngine.updateUserProfile(userId, AppState.gameSession, AppState.gameSession.decision_history);
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

    // Add personalized feedback if learning engine is available
    if (window.PersonalizedLearningEngine && AppState.userId) {
      const personalizedFeedback = window.PersonalizedLearningEngine.generateAdaptiveFeedback(
        AppState.userId,
        gameState,
        result.linear_expectation
      );

      if (personalizedFeedback && (personalizedFeedback.suggestions.length > 0 || personalizedFeedback.warnings.length > 0 || personalizedFeedback.insights.length > 0)) {
        feedbackHTML += `
          <div class="personalized-feedback">
            <h5>🎯 个性化反馈</h5>
            <div class="personalized-content">
              ${personalizedFeedback.encouragement ? `<div class="encouragement"><strong>鼓励:</strong> ${personalizedFeedback.encouragement}</div>` : ''}
              
              ${personalizedFeedback.suggestions.length > 0 ? `
                <div class="suggestions">
                  <strong>建议:</strong>
                  <ul>
                    ${personalizedFeedback.suggestions.map(s => `<li>${s}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${personalizedFeedback.warnings.length > 0 ? `
                <div class="warnings">
                  <strong>提醒:</strong>
                  <ul>
                    ${personalizedFeedback.warnings.map(w => `<li>${w}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${personalizedFeedback.insights.length > 0 ? `
                <div class="insights">
                  <strong>洞察:</strong>
                  <ul>
                    ${personalizedFeedback.insights.map(i => `<li>${i}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }
    }

    feedbackHTML += `</div>`;
    feedbackDisplay.innerHTML = feedbackHTML;
    feedbackDisplay.className = 'feedback-section feedback game-feedback'; // Add classes for tests

    // Make feedback visible with animation
    feedbackDisplay.style.display = 'block';
    feedbackDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    console.log('Feedback displayed with cognitive analysis and personalized feedback');
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
    if (!modal) {
      console.error('Game modal element not found');
      return;
    }
    
    // Check if modal is already active or in transition
    if (modal.classList.contains('active')) {
      console.warn('Game modal is already active, skipping show');
      return;
    }
    
    // Add active class to show modal
    modal.classList.add('active');
    
    // Add modal-open class to prevent body scroll
    document.body.classList.add('modal-open');
    
    console.log('Game modal shown');
  }

  static hideGameModal() {
    const modal = document.getElementById('game-modal');
    if (modal) {
      // Remove active class to start close animation
      modal.classList.remove('active');
      
      // Wait for animation to complete before cleaning up
      setTimeout(() => {
        // Double-check modal is still not active
        if (!modal.classList.contains('active')) {
          // Remove modal-open class and restore body scroll
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.height = '';
          
          // Clear game container content
          const gameContainer = document.getElementById('game-container');
          if (gameContainer) {
            gameContainer.innerHTML = '';
          }
          
          console.log('Game modal hidden and cleaned up');
        }
      }, 300); // Wait for transition to complete
    }

    // Clear game session after a delay to allow cleanup
    setTimeout(() => {
      AppState.gameSession = null;
    }, 350);
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
      
      // Update progress tracking
      if (newState.turn_number && newState.max_turns) {
        const progress = (newState.turn_number / newState.max_turns) * 100;
        AppState.gameSession.scenario_progress = progress;
        
        // Update progress bar if exists
        const progressBar = document.getElementById('scenario-progress-bar');
        if (progressBar) {
          progressBar.style.width = `${progress}%`;
        }
        
        const progressText = document.getElementById('scenario-progress-text');
        if (progressText) {
          progressText.textContent = `${Math.round(progress)}%`;
        }
      }
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
        <p>最大回合: ${newState.max_turns || 'N/A'}</p>
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
    const maxTurns = gameState.max_turns || 5;

    // Get turn-specific config
    const turnConfig = this.getExtendedTurnConfig(turn, maxTurns);

    return `
      <div class="turn-based-game">
        <!-- Turn Header -->
        <div class="turn-header">
          <h2>☕ ${turnConfig.title}</h2>
          <div class="turn-number">第 ${turn}/${maxTurns} 回合</div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar-container">
            <div id="scenario-progress-bar" class="progress-bar" style="width: ${(turn/maxTurns)*100}%"></div>
          </div>
          <div id="scenario-progress-text" class="progress-text">${Math.round((turn/maxTurns)*100)}%</div>
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
        ${!turnConfig.isAwakeningMoment && turn !== maxTurns ?
          this.renderLinearExpectationCalculator(turn) : ''
        }

        <!-- Delayed Effects Queue -->
        ${this.renderDelayedEffectsQueue(AppState.gameSession.delayed_effects || [])}

        <!-- Checkpoint Controls for Extended Scenarios -->
        ${maxTurns > 5 ? this.renderCheckpointControls() : ''}

        <!-- Action Buttons -->
        <div class="turn-actions">
          ${turn !== maxTurns ?
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

  static renderCheckpointControls() {
    return `
      <div class="checkpoint-controls">
        <h3>💾 检查点管理</h3>
        <div class="checkpoint-buttons">
          <button class="btn btn-secondary" onclick="GameManager.saveCheckpoint()">保存检查点</button>
          <button class="btn btn-tertiary" onclick="GameManager.loadCheckpoint()">加载检查点</button>
          <button class="btn btn-info" onclick="GameManager.listCheckpoints()">查看所有检查点</button>
        </div>
      </div>
    `;
  }

  static saveCheckpoint(checkpointName = null) {
    if (!AppState.gameSession) {
      console.error('No active game session');
      return;
    }

    const checkpointNameFinal = checkpointName || `checkpoint_${AppState.gameSession.currentTurn}`;
    const checkpointData = {
      gameState: { ...AppState.gameSession.gameState },
      decisionHistory: [...AppState.gameSession.decision_history],
      delayedEffects: [...AppState.gameSession.delayed_effects],
      timestamp: Date.now(),
      turn: AppState.gameSession.currentTurn
    };

    if (!AppState.gameSession.checkpoints) {
      AppState.gameSession.checkpoints = {};
    }

    AppState.gameSession.checkpoints[checkpointNameFinal] = checkpointData;
    localStorage.setItem(`checkpoint_${AppState.gameSession.gameId}_${checkpointNameFinal}`, JSON.stringify(checkpointData));

    ToastManager.show(`检查点 "${checkpointNameFinal}" 已保存`, 'success', '保存成功');
  }

  static loadCheckpoint(checkpointName = null) {
    if (!AppState.gameSession) {
      console.error('No active game session');
      return;
    }

    const checkpointNameFinal = checkpointName || `checkpoint_${AppState.gameSession.currentTurn}`;
    let checkpointData = AppState.gameSession.checkpoints?.[checkpointNameFinal];

    if (!checkpointData) {
      // Try loading from localStorage
      const stored = localStorage.getItem(`checkpoint_${AppState.gameSession.gameId}_${checkpointNameFinal}`);
      if (stored) {
        checkpointData = JSON.parse(stored);
      }
    }

    if (!checkpointData) {
      ToastManager.show(`检查点 "${checkpointNameFinal}" 不存在`, 'error', '加载失败');
      return;
    }

    // Restore game state
    AppState.gameSession.gameState = checkpointData.gameState;
    AppState.gameSession.decision_history = checkpointData.decisionHistory;
    AppState.gameSession.delayed_effects = checkpointData.delayedEffects;
    AppState.gameSession.currentTurn = checkpointData.turn;

    ToastManager.show(`检查点 "${checkpointNameFinal}" 已加载`, 'success', '加载成功');
    
    // Refresh UI
    if (typeof window.coffeeShopRouter !== 'undefined') {
      window.coffeeShopRouter.gameState = checkpointData.gameState;
      window.coffeeShopRouter.render();
    } else if (typeof window.investmentRouter !== 'undefined') {
      window.investmentRouter.gameState = checkpointData.gameState;
      window.investmentRouter.render();
    } else if (typeof window.relationshipTimeDelayRouter !== 'undefined') {
      window.relationshipTimeDelayRouter.gameState = checkpointData.gameState;
      window.relationshipTimeDelayRouter.render();
    } else {
      this.updateGameStateUI(checkpointData.gameState);
    }
  }

  static listCheckpoints() {
    if (!AppState.gameSession || !AppState.gameSession.checkpoints) {
      ToastManager.show('没有可用的检查点', 'info', '检查点列表');
      return;
    }

    const checkpoints = Object.keys(AppState.gameSession.checkpoints);
    if (checkpoints.length === 0) {
      ToastManager.show('没有可用的检查点', 'info', '检查点列表');
      return;
    }

    let message = '可用检查点：<br>';
    checkpoints.forEach(name => {
      const data = AppState.gameSession.checkpoints[name];
      message += `- ${name}: 第${data.turn}回合 (保存于 ${new Date(data.timestamp).toLocaleTimeString()})<br>`;
    });

    ToastManager.show(message, 'info', '检查点列表');
  }

  static startAutoSaveTimer() {
    if (!AppState.gameSession || !AppState.gameSession.auto_save_enabled) {
      return;
    }

    // Clear any existing autosave timer
    if (AppState.gameSession.autosaveInterval) {
      clearInterval(AppState.gameSession.autosaveInterval);
    }

    // Set up auto-save every 2 minutes for extended scenarios
    AppState.gameSession.autosaveInterval = setInterval(() => {
      if (AppState.gameSession && AppState.gameSession.gameState) {
        const turn = AppState.gameSession.gameState.turn_number || AppState.gameSession.currentTurn || 1;
        this.saveCheckpoint(`autosave_t${turn}`);
        AppState.gameSession.last_saved = Date.now();
        console.log(`Auto-saved checkpoint at turn ${turn}`);
      }
    }, 120000); // Every 2 minutes

    console.log('Auto-save timer started for extended scenario');
  }

  static stopAutoSaveTimer() {
    if (AppState.gameSession && AppState.gameSession.autosaveInterval) {
      clearInterval(AppState.gameSession.autosaveInterval);
      AppState.gameSession.autosaveInterval = null;
      console.log('Auto-save timer stopped');
    }
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
    return this.getExtendedTurnConfig(turn, 5); // Default to 5 turns
  }

  static getExtendedTurnConfig(turn, maxTurns = 5) {
    // Base configuration for the first 5 turns
    const baseConfigs = {
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

    // If we have more than 5 turns, extend the configuration
    if (maxTurns > 5) {
      // For extended scenarios, create additional turn configurations
      const extendedConfigs = { ...baseConfigs };

      // Add more turns if maxTurns > 5
      for (let i = 6; i <= maxTurns; i++) {
        extendedConfigs[i] = this.getExtendedTurn(i, maxTurns);
      }

      return extendedConfigs[turn] || extendedConfigs[1];
    }

    return baseConfigs[turn] || baseConfigs[1];
  }

  static getExtendedTurn(turn, maxTurns) {
    // Define extended turn configurations for scenarios with more than 5 turns
    const phase = Math.ceil((turn / maxTurns) * 4); // Divide into 4 phases
    const progress = (turn / maxTurns) * 100;

    // Phase-based configuration for extended scenarios
    if (phase === 1) {
      // Early phase (turns 6-8 typically)
      return {
        title: `第${turn}月 - 扩张阶段`,
        description: `游戏进行到${Math.round(progress)}%，你现在需要考虑长期战略规划。`,
        situation: '业务开始稳定，但新的挑战和 opportunities 出现。你需要平衡短期利润和长期发展。',
        decisions: [
          {
            id: 'growthStrategy',
            type: 'slider',
            label: '📈 决策1: 增长策略强度',
            min: 0,
            max: 100,
            default: 50,
            unit: '%',
            warning_threshold: 80,
            warning_message: '⚠️ 过度扩张可能导致资源紧张',
            thinking: `"策略强度越高，增长越快"`
          },
          {
            id: 'qualityFocus',
            type: 'slider',
            label: '⚖️ 决策2: 质量关注度',
            min: 0,
            max: 100,
            default: 60,
            unit: '%',
            warning_threshold: 90,
            warning_message: '⚠️ 过度关注质量可能影响扩张速度',
            thinking: `"质量关注度越高，客户满意度越高"`
          }
        ]
      };
    } else if (phase === 2) {
      // Mid phase (turns 9-12 typically)
      return {
        title: `第${turn}月 - 稳定阶段`,
        description: `游戏进行到${Math.round(progress)}%，市场环境发生变化，需要调整策略。`,
        situation: '市场竞争加剧，客户期望提高。你需要在维持现有业务和开拓新市场之间找到平衡。',
        decisions: [
          {
            id: 'marketFocus',
            type: 'slider',
            label: '🎯 决策1: 市场专注度',
            min: 0,
            max: 100,
            default: 70,
            unit: '%',
            warning_threshold: 90,
            warning_message: '⚠️ 过度专注可能错失其他机会',
            thinking: `"专注特定市场可提高竞争力"`
          },
          {
            id: 'innovationInvestment',
            type: 'slider',
            label: '💡 决策2: 创新投入',
            min: 0,
            max: 100,
            default: 40,
            unit: '%',
            warning_threshold: 70,
            warning_message: '⚠️ 过度创新可能导致成本过高',
            thinking: `"创新投入带来长期竞争优势"`
          }
        ]
      };
    } else if (phase === 3) {
      // Late mid phase (turns 13-16 typically)
      return {
        title: `第${turn}月 - 挑战阶段`,
        description: `游戏进行到${Math.round(progress)}%，面临重大挑战和决策点。`,
        situation: '外部环境变化剧烈，内部管理复杂度增加。需要做出关键决策来应对外部挑战。',
        decisions: [
          {
            id: 'adaptationStrategy',
            type: 'choice',
            label: '🔄 适应策略',
            options: [
              {
                id: 'pivot',
                label: 'A. 转型策略',
                description: '改变核心业务模式以适应新环境',
                expected_profit: 200,
                risk: 'medium',
                thinking: '"市场变了，我们也必须改变"'
              },
              {
                id: 'scale',
                label: 'B. 扩大规模',
                description: '通过扩大规模来维持竞争力',
                expected_profit: 150,
                risk: 'low',
                thinking: '"规模经济是我们的优势"'
              },
              {
                id: 'specialize',
                label: 'C. 专业化',
                description: '专注于核心优势领域',
                expected_profit: 180,
                risk: 'low',
                thinking: '"专注才能做得更好"'
              }
            ]
          }
        ]
      };
    } else {
      // Final phase (turns 17+ typically)
      return {
        title: `第${turn}月 - 终局阶段`,
        description: `游戏接近尾声，最终结果取决于你之前的选择。`,
        situation: '大局已定，但最后几步仍可能影响最终结果。',
        decisions: [
          {
            id: 'legacyDecision',
            type: 'choice',
            label: '🏆 遗产决策',
            options: [
              {
                id: 'profitMax',
                label: 'A. 利润最大化',
                description: '追求短期利润最大化',
                expected_profit: 300,
                risk: 'low',
                thinking: '"利润最重要"'
              },
              {
                id: 'sustainability',
                label: 'B. 可持续发展',
                description: '为长期可持续发展奠定基础',
                expected_profit: 250,
                risk: 'low',
                thinking: '"长期价值更重要"'
              },
              {
                id: 'socialImpact',
                label: 'C. 社会影响力',
                description: '注重社会和环境影响',
                expected_profit: 200,
                risk: 'low',
                thinking: '"企业社会责任"'
              }
            ]
          }
        ],
        isFinale: true
      };
    }
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

    // Update user profile with personalized learning engine
    if (window.PersonalizedLearningEngine) {
      window.PersonalizedLearningEngine.updateUserProfile(
        AppState.userId, 
        AppState.gameSession, 
        AppState.gameSession.decision_history
      );
    }

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

    // Update user profile with personalized learning engine
    if (window.PersonalizedLearningEngine) {
      window.PersonalizedLearningEngine.updateUserProfile(
        AppState.userId, 
        AppState.gameSession, 
        AppState.gameSession.decision_history
      );
    }

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

          <div class="personalized-recommendations">
            <h4>🎯 个性化推荐</h4>
            <div class="recommendations-content">
              ${window.PersonalizedLearningEngine ? 
                this.generatePersonalizedRecommendations() : 
                '<p>开始更多挑战来获取个性化推荐！</p>'
              }
            </div>
          </div>

          <div class="ending-actions">
            <button class="btn btn-primary" onclick="GameManager.closeGameModal()">完成</button>
            <button class="btn btn-secondary" onclick="GameManager.startCoffeeShopGame()">再次挑战</button>
            <button class="btn btn-tertiary" onclick="NavigationManager.navigateTo('learning-path')">查看学习路径</button>
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

          <div class="personalized-recommendations">
            <h4>🎯 个性化改进建议</h4>
            <div class="recommendations-content">
              ${window.PersonalizedLearningEngine ? 
                this.generatePersonalizedRecommendations(true) : 
                '<p>开始更多挑战来获取个性化建议！</p>'
              }
            </div>
          </div>

          <div class="ending-actions">
            <button class="btn btn-primary" onclick="GameManager.startCoffeeShopGame()">重新挑战</button>
            <button class="btn btn-secondary" onclick="NavigationManager.navigateTo('scenarios')">选择其他场景</button>
            <button class="btn btn-tertiary" onclick="NavigationManager.navigateTo('learning-path')">查看学习路径</button>
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

  static startAIGovernanceGame() {
    console.log('🤖 Starting AI Governance game...');

    // Initialize game state for AI governance scenario
    const initialState = {
      satisfaction: 50,
      resources: 50000,
      reputation: 50,
      ai_capability_assessment: 30,
      safety_compliance: 25,
      ethical_adherence: 40,
      innovation_balance: 35,
      stakeholder_pressure: 60,
      week_number: 1,
      turn_number: 1,
      decision_history: [],
      pending_effects: []
    };

    // Create page router
    const router = new AIGovernancePageRouter(initialState);

    // Store router in global scope for page interactions
    window.aiGovernanceRouter = router;

    // Store session
    AppState.gameSession = {
      gameId: 'ai-governance-' + Date.now(),
      scenarioId: 'ai-governance-regulation',
      difficulty: 'advanced',
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

    console.log('✅ AI Governance game initialized');
  }

  static startFinancialCrisisGame() {
    console.log('🏦 Starting Financial Crisis game...');

    // Initialize game state for financial crisis scenario
    const initialState = {
      satisfaction: 50,
      resources: 100000, // Central bank reserves
      reputation: 50,    // Market confidence in central bank
      systemic_risk_level: 60, // Current systemic risk
      market_stability: 40, // Market stability index
      liquidity_index: 45, // Liquidity condition
      regulatory_compliance: 55, // Compliance level
      international_coordination: 35, // International cooperation level
      turn_number: 1,
      decision_history: [],
      delayed_effects: []
    };

    // Create page router
    const router = new FinancialCrisisPageRouter(initialState);

    // Store router in global scope for page interactions
    window.financialCrisisRouter = router;

    // Store session
    AppState.gameSession = {
      gameId: 'financial-crisis-' + Date.now(),
      scenarioId: 'financial-crisis-response',
      difficulty: 'advanced',
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

    console.log('✅ Financial Crisis game initialized');
  }

  static startClimateChangeGame() {
    console.log('🌍 Starting Climate Change game...');

    // Initialize game state for climate change scenario
    const initialState = {
      satisfaction: 50,
      resources: 100000,
      reputation: 50,
      emission_reduction: 10,
      international_cooperation: 30,
      technological_advancement: 25,
      climate_risk: 70,
      week_number: 1,
      turn_number: 1,
      decision_history: [],
      pending_effects: []
    };

    // Create page router
    const router = new ClimateChangePageRouter(initialState);

    // Store router in global scope for page interactions
    window.climateChangeRouter = router;

    // Store session
    AppState.gameSession = {
      gameId: 'climate-change-' + Date.now(),
      scenarioId: 'climate-change-policy',
      difficulty: 'advanced',
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

    console.log('✅ Climate Change game initialized');
  }

  static startPersonalFinanceGame() {
    console.log('💰 Starting Personal Finance game...');

    // Initialize game state for personal finance scenario
    const initialState = {
      satisfaction: 50,
      resources: 150000,
      income: 100000,
      debt: 0,
      financial_knowledge: 30,
      risk_tolerance: 50,
      week_number: 1,
      turn_number: 1,
      decision_history: [],
      pending_effects: []
    };

    // Create page router
    const router = new PersonalFinancePageRouter(initialState);

    // Store router in global scope for page interactions
    window.personalFinanceRouter = router;

    // Store session
    AppState.gameSession = {
      gameId: 'personal-finance-' + Date.now(),
      scenarioId: 'personal-finance-decision',
      difficulty: 'beginner',
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

    console.log('✅ Personal Finance game initialized');
  }

  static startPublicPolicyGame() {
    console.log('🏛️ Starting Public Policy game...');

    // Initialize game state for public policy scenario
    const initialState = {
      satisfaction: 50,
      resources: 10000,
      reputation: 50,
      policy_effectiveness: 30,
      public_support: 50,
      stakeholder_pressure: 20,
      week_number: 1,
      turn_number: 1,
      decision_history: [],
      pending_effects: []
    };

    // Create page router
    const router = new PublicPolicyPageRouter(initialState);

    // Store router in global scope for page interactions
    window.publicPolicyRouter = router;

    // Store session
    AppState.gameSession = {
      gameId: 'public-policy-' + Date.now(),
      scenarioId: 'public-policy-making',
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

    console.log('✅ Public Policy game initialized');
  }

  static startBusinessStrategyGame() {
    console.log('🚀 Starting Business Strategy game...');

    // Initialize game state for business strategy scenario
    const initialState = {
      satisfaction: 50,
      resources: 10000,
      reputation: 50,
      market_position: 30,
      product_quality: 50,
      competitive_pressure: 20,
      week_number: 1,
      turn_number: 1,
      decision_history: [],
      pending_effects: []
    };

    // Create page router
    const router = new BusinessStrategyPageRouter(initialState);

    // Store router in global scope for page interactions
    window.businessStrategyRouter = router;

    // Store session
    AppState.gameSession = {
      gameId: 'business-strategy-' + Date.now(),
      scenarioId: 'business-strategy-reasoning',
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

    console.log('✅ Business Strategy game initialized');
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

  static startInvestmentConfirmationBiasGame() {
    console.log('🚀 Starting Investment Confirmation Bias game...');

    // Initialize game state for investment confirmation bias scenario
    const initialState = {
      portfolio: 10000,
      knowledge: 0,
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      selected_sources: [],
      source_quality: {},
      bias_risk: 0,
      achievements: []
    };

    // Create page router
    const router = new InvestmentConfirmationBiasPageRouter(initialState);

    // Store router in global scope for page interactions
    window.investmentRouter = router;

    // Store session
    AppState.gameSession = {
      gameId: 'investment-confirmation-bias-' + Date.now(),
      scenarioId: 'investment-confirmation-bias',
      difficulty: 'advanced',
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

    console.log('✅ Investment Confirmation Bias game initialized');
  }

  static generatePersonalizedRecommendations(isFailure = false) {
    if (!window.PersonalizedLearningEngine) {
      return '<p>个性化推荐引擎未加载</p>';
    }

    const userId = AppState.userId;
    const profile = window.PersonalizedLearningEngine.userProfiles[userId];
    
    if (!profile) {
      return '<p>开始挑战以建立您的个人档案</p>';
    }

    let recommendations = '';

    // Add improvement areas if any
    if (profile.improvementAreas.length > 0) {
      recommendations += '<h5>需要改进的领域:</h5><ul>';
      profile.improvementAreas.forEach(area => {
        switch(area) {
          case 'complex-system-thinking':
            recommendations += '<li><strong>复杂系统思维</strong>: 尝试理解变量之间的非线性关系</li>';
            break;
          case 'long-term-consequence-planning':
            recommendations += '<li><strong>长期后果规划</strong>: 考虑决策的延迟效应</li>';
            break;
          case 'considering-alternatives':
            recommendations += '<li><strong>考虑替代方案</strong>: 主动寻找与您观点相反的信息</li>';
            break;
          case 'resource-allocation':
            recommendations += '<li><strong>资源配置</strong>: 平衡短期和长期的资源分配</li>';
            break;
          case 'relationship-dynamics':
            recommendations += '<li><strong>关系动态</strong>: 理解投资和回报之间的时间延迟</li>';
            break;
          default:
            recommendations += `<li>${area}</li>`;
        }
      });
      recommendations += '</ul>';
    }

    // Add strength areas if any
    if (profile.strengths.length > 0) {
      recommendations += '<h5>您的优势:</h5><ul>';
      profile.strengths.forEach(strength => {
        switch(strength) {
          case 'complex-system-understanding':
            recommendations += '<li><strong>复杂系统理解</strong>: 您很好地理解了系统中的相互依赖关系</li>';
            break;
          case 'long-term-thinking':
            recommendations += '<li><strong>长期思维</strong>: 您善于考虑长期后果</li>';
            break;
          case 'open-mindedness':
            recommendations += '<li><strong>开放心态</strong>: 您愿意考虑不同的观点</li>';
            break;
          case 'effective-decision-making':
            recommendations += '<li><strong>有效决策</strong>: 您的决策通常产生良好的结果</li>';
            break;
          case 'learning-agility':
            recommendations += '<li><strong>学习敏捷性</strong>: 您快速从经验中学习</li>';
            break;
          default:
            recommendations += `<li>${strength}</li>`;
        }
      });
      recommendations += '</ul>';
    }

    // Add specific scenario recommendations
    const learningPath = window.PersonalizedLearningEngine.generateLearningPath(userId);
    if (learningPath && learningPath.length > 0) {
      recommendations += '<h5>为您推荐的下一个挑战:</h5><ul>';
      learningPath.slice(0, 3).forEach(item => {
        recommendations += `<li><strong>${NavigationManager.getScenarioNameById(item.scenarioId)}</strong> - ${item.focus} (难度: ${item.difficulty})</li>`;
      });
      recommendations += '</ul>';
    }

    if (isFailure) {
      recommendations += '<p class="improvement-tip"><strong>💡 改进提示:</strong> 每次失败都是学习的机会。尝试从不同角度审视问题，并考虑复杂系统中的非线性关系。</p>';
    } else {
      recommendations += '<p class="success-tip"><strong>🎉 成功提示:</strong> 继续挑战更高级的场景，巩固您的系统思维能力。</p>';
    }

    return recommendations || '<p>继续挑战以获得更多个性化建议</p>';
  }

  static startExtendedMultiPhaseGame() {
    console.log('🚀 Starting Extended Multi-Phase game...');

    // Initialize game state for extended multi-phase scenario
    const initialState = {
      satisfaction: 50,
      resources: 10000,
      reputation: 50,
      turn_number: 1,
      max_turns: 12,  // Extended to 12 turns
      phase: 1,       // Track current phase
      phase_progress: 0,  // Track progress within phase
      decision_history: [],
      delayed_effects: [],
      patterns: [],
      achievements: []
    };

    // Create page router for extended scenario
    const router = new ExtendedMultiPhasePageRouter(initialState);

    // Store router in global scope for page interactions
    window.extendedMultiPhaseRouter = router;

    // Store session
    AppState.gameSession = {
      gameId: 'extended-multi-phase-' + Date.now(),
      scenarioId: 'extended-multi-phase',
      difficulty: 'advanced',
      status: 'active',
      gameState: initialState,
      currentTurn: 1,
      decision_history: [],
      delayed_effects: [],
      patterns: [],
      checkpoints: {},
      auto_save_enabled: true,
      last_saved: Date.now(),
      scenario_progress: 0
    };

    this.showGameModal();

    // Render the start page
    const container = document.getElementById('game-container');
    if (container) {
      container.innerHTML = router.renderPage();
    }

    // Start auto-save timer for extended scenario
    this.startAutoSaveTimer();

    console.log('✅ Extended Multi-Phase game initialized');
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

// Extended Multi-Phase Page Router for 8+ round scenarios
class ExtendedMultiPhasePageRouter {
  constructor(gameState = null) {
    // Initialize game state
    this.gameState = gameState || {
      satisfaction: 50,
      resources: 10000,
      reputation: 50,
      turn_number: 1,
      max_turns: 12,
      phase: 1,
      phase_progress: 0,
      decision_history: [],
      delayed_effects: [],
      achievements: []
    };
    
    // Page flow state
    this.currentPage = 'START';
    this.currentTurn = this.gameState.turn_number;
    this.currentDecisionIndex = 0;
    this.tempDecisions = {};
    this.tempInputs = {};
    this.feedbackVisible = false;
  }

  // ========== State Management ==========
  
  getCurrentPage() {
    return this.currentPage;
  }
  
  getCurrentTurn() {
    return this.currentTurn;
  }
  
  getGameState() {
    return this.gameState;
  }

  // ========== Navigation Methods ==========
  
  startGame() {
    this.currentPage = 'TURN_1_INTRO';
    this.updatePhase();
  }

  nextTurn() {
    // Submit current turn's decisions
    this.submitTurn();
    
    // Move to next turn
    this.currentTurn++;
    this.gameState.turn_number = this.currentTurn;
    
    // Update phase if needed
    this.updatePhase();
    
    // Reset temporary decisions
    this.tempDecisions = {};
    this.tempInputs = {};
    
    // Set next page
    if (this.currentTurn <= this.gameState.max_turns) {
      this.currentPage = `TURN_${this.currentTurn}_DECISION`;
    } else {
      this.currentPage = 'GAME_END';
    }
    
    this.feedbackVisible = false;
  }

  updatePhase() {
    // Update phase based on turn progress
    const phaseCount = 4; // 4 phases for extended scenarios
    const phaseSize = Math.ceil(this.gameState.max_turns / phaseCount);
    this.gameState.phase = Math.min(Math.floor((this.currentTurn - 1) / phaseSize) + 1, phaseCount);
    this.gameState.phase_progress = ((this.currentTurn - 1) % phaseSize) / phaseSize;
  }

  // ========== Decision Handling ==========
  
  makeDecision(key, value) {
    this.tempDecisions[key] = value;
    
    // Move to feedback page after decision
    this.currentPage = `TURN_${this.currentTurn}_FEEDBACK`;
    this.feedbackVisible = true;
  }

  updateDecision(key, value) {
    this.tempDecisions[key] = value;
  }

  updateInput(key, value) {
    this.tempInputs[key] = value;
  }

  // ========== Turn Processing ==========
  
  submitTurn() {
    // Process the turn with decision engine
    const decision = { ...this.tempDecisions, ...this.tempInputs };
    
    // Calculate turn result using decision engine
    const result = this.calculateTurnResult(decision);
    
    // Update game state with results
    this.gameState.satisfaction = result.newGameState.satisfaction;
    this.gameState.resources = result.newGameState.resources;
    this.gameState.reputation = result.newGameState.reputation;
    
    // Add to decision history
    this.gameState.decision_history.push({
      turn: this.currentTurn,
      decision: { ...decision },
      result: { ...result },
      timestamp: Date.now()
    });
    
    // Apply any delayed effects
    this.applyDelayedEffects();
    
    // Check for achievements
    this.checkAchievements();
  }

  calculateTurnResult(decision) {
    // Default result
    let result = {
      newGameState: { ...this.gameState },
      linearExpectation: {},
      actualResult: {},
      feedback: '',
      newDelayedEffects: [],
      gameOver: false,
      gameOverReason: null
    };
    
    // Apply decision effects based on decision type
    if (decision.growthStrategy !== undefined) {
      // Growth strategy decision
      const growthEffect = decision.growthStrategy * 0.3;
      result.newGameState.resources += growthEffect * 100;
      result.newGameState.satisfaction += decision.qualityFocus * 0.2 - 5;
      result.newGameState.reputation += decision.qualityFocus * 0.15;
    } else if (decision.marketFocus !== undefined) {
      // Market focus decision
      const marketEffect = decision.marketFocus * 0.25;
      result.newGameState.resources += marketEffect * 80;
      result.newGameState.satisfaction += decision.innovationInvestment * 0.1 - 3;
      result.newGameState.reputation += decision.marketFocus * 0.1;
    }
    
    // Ensure values stay within bounds
    result.newGameState.resources = Math.max(0, result.newGameState.resources);
    result.newGameState.satisfaction = Math.max(0, Math.min(100, result.newGameState.satisfaction));
    result.newGameState.reputation = Math.max(0, Math.min(100, result.newGameState.reputation));
    
    // Generate feedback
    result.feedback = this.generateTurnFeedback(decision, result);
    
    return result;
  }

  generateTurnFeedback(decision, result) {
    let feedback = `📊 **第${this.currentTurn}回合结果**\n\n`;
    
    feedback += `📖 **你的决策**：\n`;
    Object.entries(decision).forEach(([key, value]) => {
      feedback += `- ${this.getDecisionLabel(key)}: ${value}\n`;
    });
    
    feedback += `\n🎯 **实际结果**：\n`;
    feedback += `- 资源: ${Math.round(result.newGameState.resources)} (${this.formatChange(result.newGameState.resources - this.gameState.resources)})\n`;
    feedback += `- 满意度: ${Math.round(result.newGameState.satisfaction)} (${this.formatChange(result.newGameState.satisfaction - this.gameState.satisfaction)})\n`;
    feedback += `- 声誉: ${Math.round(result.newGameState.reputation)} (${this.formatChange(result.newGameState.reputation - this.gameState.reputation)})\n`;
    
    return feedback;
  }

  getDecisionLabel(key) {
    const labels = {
      'growthStrategy': '增长策略',
      'qualityFocus': '质量关注',
      'marketFocus': '市场专注',
      'innovationInvestment': '创新投入',
      'adaptationStrategy': '适应策略',
      'legacyDecision': '遗产决策'
    };
    return labels[key] || key;
  }

  formatChange(change) {
    return (change >= 0 ? '+' : '') + Math.round(change);
  }

  applyDelayedEffects() {
    // Apply any delayed effects that are scheduled for this turn
    if (!this.gameState.delayed_effects || this.gameState.delayed_effects.length === 0) {
      return;
    }

    const effectsToApply = this.gameState.delayed_effects.filter(effect => effect.turn === this.currentTurn);
    effectsToApply.forEach(effect => {
      if (effect.changes) {
        Object.entries(effect.changes).forEach(([key, value]) => {
          if (this.gameState[key] !== undefined) {
            this.gameState[key] += value;
          }
        });
      }
    });

    // Remove applied effects
    this.gameState.delayed_effects = this.gameState.delayed_effects.filter(effect => effect.turn !== this.currentTurn);
  }

  checkAchievements() {
    // Check for various achievements based on game state
    const achievements = [];
    
    // Check for resource milestones
    if (this.gameState.resources > 50000 && !this.gameState.achievements.includes('wealthy')) {
      achievements.push('wealthy');
      this.gameState.achievements.push('wealthy');
    }
    
    // Check for satisfaction milestones
    if (this.gameState.satisfaction > 80 && !this.gameState.achievements.includes('satisfaction_master')) {
      achievements.push('satisfaction_master');
      this.gameState.achievements.push('satisfaction_master');
    }
    
    // Check for reputation milestones
    if (this.gameState.reputation > 85 && !this.gameState.achievements.includes('reputation_legend')) {
      achievements.push('reputation_legend');
      this.gameState.achievements.push('reputation_legend');
    }
    
    // Check for balanced gameplay
    if (this.gameState.satisfaction > 70 && this.gameState.reputation > 70 && this.gameState.resources > 25000 && 
        !this.gameState.achievements.includes('balanced_approach')) {
      achievements.push('balanced_approach');
      this.gameState.achievements.push('balanced_approach');
    }
    
    // Award achievements
    if (achievements.length > 0) {
      this.showAchievements(achievements);
    }
  }

  showAchievements(achievements) {
    const achievementNames = {
      'wealthy': '财富积累者',
      'satisfaction_master': '满意度大师',
      'reputation_legend': '声誉传奇',
      'balanced_approach': '均衡之道'
    };
    
    const achievementText = achievements.map(a => achievementNames[a]).join(', ');
    ToastManager.show(`成就解锁: ${achievementText}`, 'success', '新成就！');
  }

  // ========== Page Rendering ==========
  
  renderPage() {
    switch (this.currentPage) {
      case 'START':
        return this.renderStartPage();
      case 'TURN_1_INTRO':
        return this.renderTurnIntroPage(1);
      case 'TURN_2_INTRO':
        return this.renderTurnIntroPage(2);
      case 'TURN_3_INTRO':
        return this.renderTurnIntroPage(3);
      case 'TURN_4_INTRO':
        return this.renderTurnIntroPage(4);
      case 'TURN_5_INTRO':
        return this.renderTurnIntroPage(5);
      case 'TURN_6_INTRO':
        return this.renderTurnIntroPage(6);
      case 'TURN_7_INTRO':
        return this.renderTurnIntroPage(7);
      case 'TURN_8_INTRO':
        return this.renderTurnIntroPage(8);
      case 'TURN_9_INTRO':
        return this.renderTurnIntroPage(9);
      case 'TURN_10_INTRO':
        return this.renderTurnIntroPage(10);
      case 'TURN_11_INTRO':
        return this.renderTurnIntroPage(11);
      case 'TURN_12_INTRO':
        return this.renderTurnIntroPage(12);
      case 'TURN_1_DECISION':
      case 'TURN_2_DECISION':
      case 'TURN_3_DECISION':
      case 'TURN_4_DECISION':
      case 'TURN_5_DECISION':
      case 'TURN_6_DECISION':
      case 'TURN_7_DECISION':
      case 'TURN_8_DECISION':
      case 'TURN_9_DECISION':
      case 'TURN_10_DECISION':
      case 'TURN_11_DECISION':
      case 'TURN_12_DECISION':
        return this.renderDecisionPage(parseInt(this.currentPage.split('_')[1]));
      case 'TURN_1_FEEDBACK':
      case 'TURN_2_FEEDBACK':
      case 'TURN_3_FEEDBACK':
      case 'TURN_4_FEEDBACK':
      case 'TURN_5_FEEDBACK':
      case 'TURN_6_FEEDBACK':
      case 'TURN_7_FEEDBACK':
      case 'TURN_8_FEEDBACK':
      case 'TURN_9_FEEDBACK':
      case 'TURN_10_FEEDBACK':
      case 'TURN_11_FEEDBACK':
      case 'TURN_12_FEEDBACK':
        return this.renderFeedbackPage(parseInt(this.currentPage.split('_')[1]));
      case 'GAME_END':
        return this.renderGameEndPage();
      default:
        return '<div class="game-page">页面开发中...</div>';
    }
  }

  renderStartPage() {
    return `
      <div class="game-page start-page">
        <h2>🚀 扩展多阶段决策挑战</h2>
        <div class="scenario-intro">
          <p>欢迎来到扩展版多阶段决策挑战！</p>
          <p>在这个挑战中，您将经历长达${this.gameState.max_turns}回合的复杂决策过程，每个回合都考验着您的战略思维和长远规划能力。</p>
          
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">📊 总回合数</span>
              <span class="stat-value">${this.gameState.max_turns}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🎯 总阶段数</span>
              <span class="stat-value">4</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">💪 挑战难度</span>
              <span class="stat-value advanced">高级</span>
            </div>
          </div>
          
          <div class="scenario-goals">
            <h3>🎯 挑战目标</h3>
            <ul>
              <li>平衡资源、满意度和声誉三个关键指标</li>
              <li>在长期内实现可持续增长</li>
              <li>应对各阶段的不同挑战</li>
              <li>解锁各种成就</li>
            </ul>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.extendedMultiPhaseRouter.startGame(); window.extendedMultiPhaseRouter.render();">
            开始挑战
          </button>
        </div>
      </div>
    `;
  }

  renderTurnIntroPage(turn) {
    const phaseInfo = this.getPhaseInfo();
    
    return `
      <div class="game-page turn-intro-page">
        <h2>🔄 第${turn}回合 - ${phaseInfo.name}</h2>
        
        <div class="turn-progress">
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${(turn / this.gameState.max_turns) * 100}%"></div>
          </div>
          <div class="progress-text">进度: ${Math.round((turn / this.gameState.max_turns) * 100)}%</div>
        </div>
        
        <div class="phase-info">
          <h3>📋 阶段信息</h3>
          <div class="phase-details">
            <div class="phase-name">第${this.gameState.phase}阶段: ${phaseInfo.name}</div>
            <div class="phase-desc">${phaseInfo.description}</div>
          </div>
        </div>
        
        <div class="current-state">
          <h3>📊 当前状态</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="state-label">💰 资源</span>
              <span class="state-value">${Math.round(this.gameState.resources)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">😊 满意度</span>
              <span class="state-value">${Math.round(this.gameState.satisfaction)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">⭐ 声誉</span>
              <span class="state-value">${Math.round(this.gameState.reputation)}</span>
            </div>
          </div>
        </div>
        
        <div class="turn-context">
          <h3>📖 回合背景</h3>
          <p>${this.getTurnContext(turn)}</p>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.extendedMultiPhaseRouter.currentPage='TURN_${turn}_DECISION'; window.extendedMultiPhaseRouter.render();">
            开始决策
          </button>
        </div>
      </div>
    `;
  }

  getPhaseInfo() {
    const phase = this.gameState.phase;
    const phaseInfo = {
      1: {
        name: "探索与建立",
        description: "在初始阶段，重点是建立基础，探索市场机会，并为长期发展奠定根基。"
      },
      2: {
        name: "增长与扩张",
        description: "在第二阶段，需要加速增长，扩大市场份额，并优化运营效率。"
      },
      3: {
        name: "挑战与适应",
        description: "面临市场变化和竞争压力，需要灵活适应并调整策略。"
      },
      4: {
        name: "巩固与传承",
        description: "在最终阶段，巩固成果，确保可持续性，并为未来打下基础。"
      }
    };
    
    return phaseInfo[phase] || phaseInfo[1];
  }

  getTurnContext(turn) {
    // Provide different context based on the turn number
    const contexts = {
      1: "游戏开始，您拥有基础资源。现在需要做出第一个关键决策，这将为整个游戏设定基调。",
      2: "第一回合的结果已经显现，您需要根据当前状况调整策略，考虑下一步的方向。",
      3: "业务开始发展，但同时也出现了新的挑战。您需要在增长和稳定之间找到平衡。",
      4: "市场竞争加剧，您需要更加精细地管理资源和策略，以保持竞争优势。",
      5: "中期评估时间，回顾前几个回合的决策效果，并为接下来的阶段制定计划。",
      6: "游戏进入下半场，之前的决策开始产生长期影响。您需要更具前瞻性的思考。",
      7: "关键转折点，您的决策将对后期游戏走向产生重大影响。",
      8: "中期到后期过渡，需要在维持现有成果和寻求新突破之间做出选择。",
      9: "后期阶段开始，长期战略变得至关重要，短期波动需要放在更大背景下考量。",
      10: "游戏接近尾声，每一步决策都更加重要，需要为最终结果做准备。",
      11: "倒数第二回合，所有之前的决策都将汇聚于此，影响最终结果。",
      12: "最后一回合，您的最终决策将决定整个游戏的成败。"
    };
    
    return contexts[turn] || contexts[1];
  }

  renderDecisionPage(turn) {
    // Get decision configuration based on turn and phase
    const decisionConfig = this.getDecisionConfig(turn);
    
    return `
      <div class="game-page decision-page">
        <h2>🤔 第${turn}回合 - 决策时间</h2>
        
        <div class="turn-progress">
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${(turn / this.gameState.max_turns) * 100}%"></div>
          </div>
          <div class="progress-text">进度: ${Math.round((turn / this.gameState.max_turns) * 100)}%</div>
        </div>
        
        <div class="current-state">
          <h3>📊 当前状态</h3>
          <div class="state-grid">
            <div class="state-item">
              <span class="state-label">💰 资源</span>
              <span class="state-value">${Math.round(this.gameState.resources)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">😊 满意度</span>
              <span class="state-value">${Math.round(this.gameState.satisfaction)}</span>
            </div>
            <div class="state-item">
              <span class="state-label">⭐ 声誉</span>
              <span class="state-value">${Math.round(this.gameState.reputation)}</span>
            </div>
          </div>
        </div>
        
        <div class="decision-context">
          <h3>📖 决策背景</h3>
          <p>${this.getTurnContext(turn)}</p>
        </div>
        
        <div class="decision-area">
          <h3>📋 决策选项</h3>
          ${decisionConfig.map(config => this.renderDecisionControl(config)).join('')}
        </div>
        
        <div class="actions">
          <button class="btn btn-secondary" onclick="window.extendedMultiPhaseRouter.currentPage='TURN_${turn}_INTRO'; window.extendedMultiPhaseRouter.render();">
            返回
          </button>
        </div>
      </div>
    `;
  }

  getDecisionConfig(turn) {
    // Return different decision configurations based on turn number and phase
    if (turn <= 3) {
      // Early game decisions
      return [
        {
          id: 'growthStrategy',
          type: 'slider',
          label: '📈 增长策略',
          min: 0,
          max: 100,
          default: 50,
          unit: '%',
          description: '决定投入多少资源用于增长'
        },
        {
          id: 'qualityFocus',
          type: 'slider',
          label: '⚖️ 质量关注',
          min: 0,
          max: 100,
          default: 60,
          unit: '%',
          description: '决定投入多少注意力维持质量'
        }
      ];
    } else if (turn <= 6) {
      // Mid game decisions
      return [
        {
          id: 'marketFocus',
          type: 'slider',
          label: '🎯 市场专注',
          min: 0,
          max: 100,
          default: 70,
          unit: '%',
          description: '决定专注特定市场的程度'
        },
        {
          id: 'innovationInvestment',
          type: 'slider',
          label: '💡 创新投入',
          min: 0,
          max: 100,
          default: 40,
          unit: '%',
          description: '决定投入多少资源进行创新'
        }
      ];
    } else if (turn <= 9) {
      // Late mid game decisions
      return [
        {
          id: 'adaptationStrategy',
          type: 'choice',
          label: '🔄 适应策略',
          options: [
            { id: 'pivot', label: '转型策略', description: '改变核心策略以适应新环境' },
            { id: 'scale', label: '扩大规模', description: '通过规模效应保持竞争力' },
            { id: 'specialize', label: '专业深化', description: '专注于核心优势领域' }
          ]
        }
      ];
    } else {
      // End game decisions
      return [
        {
          id: 'legacyDecision',
          type: 'choice',
          label: '🏆 遗产决策',
          options: [
            { id: 'profitMax', label: '利润最大化', description: '追求短期利润最大化' },
            { id: 'sustainability', label: '可持续发展', description: '为长期发展奠定基础' },
            { id: 'socialImpact', label: '社会影响', description: '注重社会和环境责任' }
          ]
        }
      ];
    }
  }

  renderDecisionControl(config) {
    if (config.type === 'slider') {
      const currentValue = this.tempDecisions[config.id] !== undefined ? 
        this.tempDecisions[config.id] : config.default;
      
      return `
        <div class="decision-control slider-control">
          <label for="${config.id}">
            <strong>${config.label}</strong>
            <span class="control-desc">${config.description}</span>
          </label>
          <div class="slider-container">
            <span class="min-value">${config.min}${config.unit}</span>
            <input 
              type="range" 
              id="${config.id}" 
              class="game-slider" 
              min="${config.min}" 
              max="${config.max}" 
              value="${currentValue}"
              oninput="window.extendedMultiPhaseRouter.updateDecision('${config.id}', parseInt(this.value)); window.extendedMultiPhaseRouter.render();">
            <span class="max-value">${config.max}${config.unit}</span>
          </div>
          <div class="current-selection">
            当前选择: <span id="${config.id}-value">${currentValue}</span>${config.unit}
          </div>
        </div>
      `;
    } else if (config.type === 'choice') {
      return `
        <div class="decision-control choice-control">
          <label>
            <strong>${config.label}</strong>
          </label>
          <div class="choice-options">
            ${config.options.map(option => `
              <div class="choice-card" onclick="window.extendedMultiPhaseRouter.makeDecision('${config.id}', '${option.id}');">
                <h4>${option.label}</h4>
                <p>${option.description}</p>
                <button class="btn btn-option">选择</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    return `<div class="decision-control">未知控件类型</div>`;
  }

  renderFeedbackPage(turn) {
    // Calculate results if not already done
    if (Object.keys(this.tempDecisions).length > 0) {
      const decision = { ...this.tempDecisions, ...this.tempInputs };
      const result = this.calculateTurnResult(decision);
      
      return `
        <div class="game-page feedback-page">
          <h2>✅ 第${turn}回合 - 决策反馈</h2>
          
          <div class="turn-progress">
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${(turn / this.gameState.max_turns) * 100}%"></div>
            </div>
            <div class="progress-text">进度: ${Math.round((turn / this.gameState.max_turns) * 100)}%</div>
          </div>
          
          <div class="feedback-content">
            <h3>📋 您的决策</h3>
            <div class="decision-summary">
              ${Object.entries(this.tempDecisions).map(([key, value]) => {
                return `<div class="decision-item"><strong>${this.getDecisionLabel(key)}:</strong> ${value}</div>`;
              }).join('')}
            </div>
            
            <h3>📊 结果反馈</h3>
            <div class="result-display">
              <pre>${result.feedback}</pre>
            </div>
            
            <h3>📈 影响预览</h3>
            <div class="impact-preview">
              <p>这些决策的影响将在接下来的回合中逐步显现，特别是延迟效应将在未来回合中发挥作用。</p>
            </div>
          </div>
          
          <div class="actions">
            <button class="btn btn-primary" onclick="window.extendedMultiPhaseRouter.nextTurn();">
              进入第${turn + 1}回合
            </button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="game-page feedback-page">
          <h2>⏳ 等待决策</h2>
          <p>请先做出决策以查看反馈。</p>
          <div class="actions">
            <button class="btn btn-primary" onclick="window.extendedMultiPhaseRouter.currentPage='TURN_${turn}_DECISION'; window.extendedMultiPhaseRouter.render();">
              返回决策页面
            </button>
          </div>
        </div>
      `;
    }
  }

  renderGameEndPage() {
    // Calculate final scores and achievements
    const finalScore = Math.round(
      (this.gameState.resources / 100) * 0.4 + 
      this.gameState.satisfaction * 0.3 + 
      this.gameState.reputation * 0.3
    );
    
    // Determine rating
    let rating = '';
    let ratingDesc = '';
    if (finalScore >= 80) {
      rating = '🏆 卓越领导者';
      ratingDesc = '您展现了卓越的战略思维和长期规划能力！';
    } else if (finalScore >= 60) {
      rating = '🎖️ 优秀管理者';
      ratingDesc = '您的决策平衡了各方需求，取得了不错的成绩！';
    } else if (finalScore >= 40) {
      rating = '🏅 合格参与者';
      ratingDesc = '您完成了挑战，虽然有起伏，但坚持到了最后！';
    } else {
      rating = '📚 学习者';
      ratingDesc = '挑战虽然艰难，但您获得了宝贵的经验！';
    }
    
    return `
      <div class="game-page end-page">
        <h2>🎉 挑战完成！</h2>
        
        <div class="final-rating">
          <h3>${rating}</h3>
          <p>${ratingDesc}</p>
        </div>
        
        <div class="final-stats">
          <h3>📊 最终状态</h3>
          <div class="stat-grid">
            <div class="stat-item large">
              <span class="stat-label">💰 资源</span>
              <span class="stat-value">${Math.round(this.gameState.resources)}</span>
            </div>
            <div class="stat-item large">
              <span class="stat-label">😊 满意度</span>
              <span class="stat-value">${Math.round(this.gameState.satisfaction)}</span>
            </div>
            <div class="stat-item large">
              <span class="stat-label">⭐ 声誉</span>
              <span class="stat-value">${Math.round(this.gameState.reputation)}</span>
            </div>
            <div class="stat-item large">
              <span class="stat-label">💯 综合评分</span>
              <span class="stat-value">${finalScore}</span>
            </div>
          </div>
        </div>
        
        <div class="achievements-section">
          <h3>🏆 解锁成就</h3>
          <div class="achievements-list">
            ${this.gameState.achievements.length > 0 ? 
              this.gameState.achievements.map(ach => this.getAchievementDisplay(ach)).join('') :
              '<p>暂无成就，再试一次挑战更高分数吧！</p>'
            }
          </div>
        </div>
        
        <div class="learning-outcomes">
          <h3>🎓 学习收获</h3>
          <ul>
            <li>长周期决策的复杂性与挑战</li>
            <li>资源、满意度和声誉之间的平衡艺术</li>
            <li>延迟效应在战略决策中的重要性</li>
            <li>不同阶段需要采用不同的策略重点</li>
          </ul>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" onclick="window.extendedMultiPhaseRouter.resetGame(); window.extendedMultiPhaseRouter.render();">
            再次挑战
          </button>
          <button class="btn btn-secondary" onclick="GameManager.hideGameModal(); NavigationManager.navigateTo('scenarios');">
            选择其他场景
          </button>
        </div>
      </div>
    `;
  }

  getAchievementDisplay(achievement) {
    const achievementDetails = {
      'wealthy': { name: '财富积累者', desc: '资源超过50,000' },
      'satisfaction_master': { name: '满意度大师', desc: '满意度超过80' },
      'reputation_legend': { name: '声誉传奇', desc: '声誉超过85' },
      'balanced_approach': { name: '均衡之道', desc: '各项指标均达到优秀水平' }
    };
    
    const details = achievementDetails[achievement] || { name: achievement, desc: '未知成就' };
    
    return `
      <div class="achievement-item unlocked">
        <span class="achievement-icon">🏆</span>
        <div class="achievement-info">
          <h4>${details.name}</h4>
          <p>${details.desc}</p>
        </div>
      </div>
    `;
  }

  resetGame() {
    // Reset to initial state
    this.gameState = {
      satisfaction: 50,
      resources: 10000,
      reputation: 50,
      turn_number: 1,
      max_turns: 12,
      phase: 1,
      phase_progress: 0,
      decision_history: [],
      delayed_effects: [],
      achievements: []
    };
    
    this.currentPage = 'START';
    this.currentTurn = 1;
    this.tempDecisions = {};
    this.tempInputs = {};
    this.feedbackVisible = false;
  }

  // ========== Persistence ==========
  
  saveState() {
    const state = {
      gameState: this.gameState,
      currentPage: this.currentPage,
      currentTurn: this.currentTurn,
      tempDecisions: this.tempDecisions,
      tempInputs: this.tempInputs,
      feedbackVisible: this.feedbackVisible
    };
    
    sessionStorage.setItem('extendedMultiPhaseGameState', JSON.stringify(state));
  }

  loadState() {
    const saved = sessionStorage.getItem('extendedMultiPhaseGameState');
    if (saved) {
      const state = JSON.parse(saved);
      this.gameState = state.gameState;
      this.currentPage = state.currentPage;
      this.currentTurn = state.currentTurn;
      this.tempDecisions = state.tempDecisions || {};
      this.tempInputs = state.tempInputs || {};
      this.feedbackVisible = state.feedbackVisible || false;
    }
  }

  render() {
    const container = document.getElementById('game-container');
    if (container) {
      container.innerHTML = this.renderPage();
    }
  }
}

// Personalized Learning Engine
class PersonalizedLearningEngine {
  constructor() {
    this.userProfiles = {};
    this.learningPaths = {};
    this.adaptiveFeedback = {};
    this.analytics = {};
  }

  /**
   * Create or update user profile based on game interactions
   * @param {string} userId - Unique identifier for the user
   * @param {object} gameSession - Current game session data
   * @param {object} decisionHistory - History of user decisions
   */
  updateUserProfile(userId, gameSession, decisionHistory) {
    if (!this.userProfiles[userId]) {
      this.userProfiles[userId] = {
        id: userId,
        createdAt: new Date(),
        totalGamesPlayed: 0,
        successRate: 0,
        preferredScenarios: {},
        cognitiveBiasTendencies: {},
        learningSpeed: 'medium', // slow, medium, fast
        difficultyPreference: 'intermediate', // beginner, intermediate, advanced
        engagementLevel: 'moderate', // low, moderate, high
        improvementAreas: [],
        strengths: [],
        lastActive: new Date(),
        totalPlayTime: 0
      };
    }

    const profile = this.userProfiles[userId];
    
    // Update basic stats
    profile.totalGamesPlayed += 1;
    profile.lastActive = new Date();

    // Analyze decision patterns to detect cognitive bias tendencies
    const biasAnalysis = this.analyzeCognitiveBiases(decisionHistory);
    Object.assign(profile.cognitiveBiasTendencies, biasAnalysis);

    // Analyze success patterns
    const successRate = this.calculateSuccessRate(decisionHistory);
    profile.successRate = (profile.successRate + successRate) / 2; // Moving average

    // Update preferred scenarios
    if (gameSession?.scenarioId) {
      profile.preferredScenarios[gameSession.scenarioId] = 
        (profile.preferredScenarios[gameSession.scenarioId] || 0) + 1;
    }

    // Determine learning speed based on how quickly they adapt
    profile.learningSpeed = this.estimateLearningSpeed(decisionHistory);

    // Identify improvement areas and strengths
    profile.improvementAreas = this.identifyImprovementAreas(decisionHistory);
    profile.strengths = this.identifyStrengths(decisionHistory);

    return profile;
  }

  /**
   * Analyze cognitive biases from decision history
   * @param {Array} decisionHistory - Array of user decisions
   * @return {Object} Bias analysis results
   */
  analyzeCognitiveBiases(decisionHistory) {
    const biases = {
      confirmationBias: 0,
      linearThinking: 0,
      timeDelayNeglect: 0,
      overconfidence: 0,
      anchoring: 0,
      availabilityHeuristic: 0
    };

    if (!decisionHistory || decisionHistory.length === 0) {
      return biases;
    }

    // Analyze confirmation bias: tendency to stick with similar decisions despite poor outcomes
    let confirmationScore = 0;
    for (let i = 1; i < decisionHistory.length; i++) {
      const prev = decisionHistory[i - 1];
      const curr = decisionHistory[i];
      
      // Check if user repeated similar decisions despite negative outcomes
      if (this.similarDecisions(prev.decision, curr.decision)) {
        if (curr.actual_result && this.isNegativeOutcome(curr.actual_result)) {
          confirmationScore += 1;
        }
      }
    }
    biases.confirmationBias = Math.min(confirmationScore / decisionHistory.length, 1);

    // Analyze linear thinking: expecting linear outcomes from complex systems
    let linearThinkingScore = 0;
    for (const decision of decisionHistory) {
      if (decision.linear_expectation && decision.actual_result) {
        const gap = this.calculateGap(decision.linear_expectation, decision.actual_result);
        if (gap > 0.5) { // Large gap indicates linear thinking
          linearThinkingScore += 1;
        }
      }
    }
    biases.linearThinking = Math.min(linearThinkingScore / decisionHistory.length, 1);

    // Analyze time delay neglect: ignoring delayed effects
    let timeDelayScore = 0;
    for (const decision of decisionHistory) {
      if (decision.delayed_effects_applied && Object.keys(decision.delayed_effects_applied).length > 0) {
        // If user didn't account for delayed effects, increase score
        timeDelayScore += 0.5; // Arbitrary value, adjust as needed
      }
    }
    biases.timeDelayNeglect = Math.min(timeDelayScore / decisionHistory.length, 1);

    return biases;
  }

  /**
   * Calculate success rate from decision history
   * @param {Array} decisionHistory - Array of user decisions
   * @return {number} Success rate between 0 and 1
   */
  calculateSuccessRate(decisionHistory) {
    if (!decisionHistory || decisionHistory.length === 0) {
      return 0.5; // Neutral starting point
    }

    let successfulDecisions = 0;
    for (const decision of decisionHistory) {
      if (decision.actual_result) {
        // Define success based on positive outcomes in various metrics
        const isSuccessful = this.isPositiveOutcome(decision.actual_result);
        if (isSuccessful) {
          successfulDecisions++;
        }
      }
    }

    return successfulDecisions / decisionHistory.length;
  }

  /**
   * Estimate learning speed based on improvement over time
   * @param {Array} decisionHistory - Array of user decisions
   * @return {string} Learning speed category
   */
  estimateLearningSpeed(decisionHistory) {
    if (decisionHistory.length < 4) {
      return 'medium'; // Not enough data
    }

    // Compare early decisions vs later decisions
    const earlyDecisions = decisionHistory.slice(0, Math.floor(decisionHistory.length / 2));
    const laterDecisions = decisionHistory.slice(Math.floor(decisionHistory.length / 2));

    const earlySuccessRate = this.calculateSuccessRate(earlyDecisions);
    const laterSuccessRate = this.calculateSuccessRate(laterDecisions);

    if (laterSuccessRate > earlySuccessRate + 0.2) {
      return 'fast';
    } else if (laterSuccessRate > earlySuccessRate + 0.05) {
      return 'medium';
    } else {
      return 'slow';
    }
  }

  /**
   * Identify areas where user needs improvement
   * @param {Array} decisionHistory - Array of user decisions
   * @return {Array} Improvement areas
   */
  identifyImprovementAreas(decisionHistory) {
    const areas = [];
    const biasAnalysis = this.analyzeCognitiveBiases(decisionHistory);

    // Add areas based on bias tendencies
    if (biasAnalysis.linearThinking > 0.6) {
      areas.push('complex-system-thinking');
    }
    if (biasAnalysis.timeDelayNeglect > 0.6) {
      areas.push('long-term-consequence-planning');
    }
    if (biasAnalysis.confirmationBias > 0.6) {
      areas.push('considering-alternatives');
    }
    if (biasAnalysis.overconfidence > 0.6) {
      areas.push('realistic-expectation-setting');
    }

    // Add areas based on performance gaps
    const performanceAnalysis = this.analyzePerformanceGaps(decisionHistory);
    if (performanceAnalysis.lowResourceManagement) {
      areas.push('resource-allocation');
    }
    if (performanceAnalysis.lowRelationshipManagement) {
      areas.push('relationship-dynamics');
    }

    return areas;
  }

  /**
   * Identify user's strengths
   * @param {Array} decisionHistory - Array of user decisions
   * @return {Array} Strengths
   */
  identifyStrengths(decisionHistory) {
    const strengths = [];
    const biasAnalysis = this.analyzeCognitiveBiases(decisionHistory);
    const successRate = this.calculateSuccessRate(decisionHistory);

    // Add strengths based on low bias scores
    if (biasAnalysis.linearThinking < 0.3) {
      strengths.push('complex-system-understanding');
    }
    if (biasAnalysis.timeDelayNeglect < 0.3) {
      strengths.push('long-term-thinking');
    }
    if (biasAnalysis.confirmationBias < 0.3) {
      strengths.push('open-mindedness');
    }

    // Add strengths based on high success rates
    if (successRate > 0.7) {
      strengths.push('effective-decision-making');
    }

    // Add strengths based on consistent improvement
    if (this.showsConsistentImprovement(decisionHistory)) {
      strengths.push('learning-agility');
    }

    return strengths;
  }

  /**
   * Generate personalized learning path for user
   * @param {string} userId - User ID
   * @return {Array} Recommended scenarios and activities
   */
  generateLearningPath(userId) {
    const profile = this.userProfiles[userId];
    if (!profile) {
      return this.getDefaultLearningPath();
    }

    const path = [];

    // Prioritize improvement areas
    for (const area of profile.improvementAreas) {
      switch (area) {
        case 'complex-system-thinking':
          path.push({
            scenarioId: 'coffee-shop-linear-thinking',
            difficulty: 'beginner',
            focus: 'understanding-non-linear-relationships',
            priority: 'high'
          });
          break;
        case 'long-term-consequence-planning':
          path.push({
            scenarioId: 'relationship-time-delay',
            difficulty: 'intermediate',
            focus: 'time-delay-effects',
            priority: 'high'
          });
          break;
        case 'considering-alternatives':
          path.push({
            scenarioId: 'investment-confirmation-bias',
            difficulty: 'advanced',
            focus: 'avoiding-confirmation-bias',
            priority: 'high'
          });
          break;
        case 'resource-allocation':
          path.push({
            scenarioId: 'business-strategy-reasoning',
            difficulty: profile.difficultyPreference,
            focus: 'resource-management',
            priority: 'medium'
          });
          break;
        case 'relationship-dynamics':
          path.push({
            scenarioId: 'relationship-time-delay',
            difficulty: profile.difficultyPreference,
            focus: 'relationship-investment',
            priority: 'medium'
          });
          break;
      }
    }

    // Add reinforcement for strengths
    for (const strength of profile.strengths) {
      switch (strength) {
        case 'complex-system-understanding':
          path.push({
            scenarioId: 'extended-multi-phase',
            difficulty: 'advanced',
            focus: 'complex-system-challenges',
            priority: 'medium'
          });
          break;
        case 'long-term-thinking':
          path.push({
            scenarioId: 'climate-change-policy',
            difficulty: 'advanced',
            focus: 'long-term-planning',
            priority: 'medium'
          });
          break;
      }
    }

    // Add general reinforcement
    path.push({
      scenarioId: 'personal-finance-decision',
      difficulty: profile.difficultyPreference,
      focus: 'practical-application',
      priority: 'low'
    });

    return path;
  }

  /**
   * Generate adaptive feedback based on user profile
   * @param {string} userId - User ID
   * @param {object} currentGameState - Current game state
   * @param {object} currentDecision - Current decision being made
   * @return {object} Personalized feedback
   */
  generateAdaptiveFeedback(userId, currentGameState, currentDecision) {
    const profile = this.userProfiles[userId];
    if (!profile) {
      return this.getDefaultFeedback(currentGameState, currentDecision);
    }

    let feedback = {
      encouragement: '',
      suggestions: [],
      warnings: [],
      insights: []
    };

    // Provide encouragement based on learning speed
    if (profile.learningSpeed === 'fast') {
      feedback.encouragement = '您学得很快！继续保持这种积极的学习态度。';
    } else if (profile.learningSpeed === 'slow') {
      feedback.encouragement = '学习是一个渐进的过程，请保持耐心，您正在取得进步。';
    } else {
      feedback.encouragement = '您正以合适的速度学习，保持这种节奏。';
    }

    // Provide suggestions based on improvement areas
    for (const area of profile.improvementAreas) {
      switch (area) {
        case 'complex-system-thinking':
          feedback.suggestions.push('考虑决策的间接影响和系统性后果，而不仅仅是直接影响。');
          break;
        case 'long-term-consequence-planning':
          feedback.suggestions.push('思考这个决策在未来几个回合可能产生的影响。');
          break;
        case 'considering-alternatives':
          feedback.suggestions.push('在做决定之前，尝试从不同角度审视问题。');
          break;
      }
    }

    // Provide warnings based on cognitive biases
    const biasAnalysis = profile.cognitiveBiasTendencies;
    if (biasAnalysis.linearThinking > 0.7) {
      feedback.warnings.push('注意：您可能倾向于线性思维，复杂系统往往有非线性结果。');
    }
    if (biasAnalysis.timeDelayNeglect > 0.7) {
      feedback.warnings.push('提醒：您可能忽视了决策的时间延迟效应。');
    }

    // Provide insights based on strengths
    for (const strength of profile.strengths) {
      switch (strength) {
        case 'complex-system-understanding':
          feedback.insights.push('您对复杂系统有很好的理解，善于看到事物间的关联。');
          break;
        case 'long-term-thinking':
          feedback.insights.push('您擅长考虑长期后果，这是一个重要的战略能力。');
          break;
      }
    }

    return feedback;
  }

  // Helper methods
  similarDecisions(dec1, dec2) {
    // Simple comparison - in practice this could be more sophisticated
    return JSON.stringify(dec1) === JSON.stringify(dec2);
  }

  isNegativeOutcome(result) {
    // Define negative outcome based on various metrics
    if (result.resources && result.resources < 0) return true;
    if (result.satisfaction && result.satisfaction < 30) return true;
    if (result.reputation && result.reputation < 30) return true;
    return false;
  }

  isPositiveOutcome(result) {
    // Define positive outcome based on various metrics
    if (result.resources && result.resources > 0) return true;
    if (result.satisfaction && result.satisfaction > 60) return true;
    if (result.reputation && result.reputation > 60) return true;
    return false;
  }

  calculateGap(expectation, actual) {
    // Calculate normalized gap between expectation and actual result
    let totalGap = 0;
    let count = 0;

    for (const key of ['resources', 'satisfaction', 'reputation']) {
      if (expectation[key] !== undefined && actual[key] !== undefined) {
        const gap = Math.abs(expectation[key] - actual[key]) / Math.max(Math.abs(expectation[key]), 1);
        totalGap += gap;
        count++;
      }
    }

    return count > 0 ? totalGap / count : 0;
  }

  analyzePerformanceGaps(decisionHistory) {
    // Analyze where user performs poorly
    return {
      lowResourceManagement: false, // Placeholder logic
      lowRelationshipManagement: false // Placeholder logic
    };
  }

  showsConsistentImprovement(decisionHistory) {
    // Check if user shows improvement over time
    if (decisionHistory.length < 6) return false;

    const earlyPerformance = this.calculateSuccessRate(decisionHistory.slice(0, 3));
    const latePerformance = this.calculateSuccessRate(decisionHistory.slice(-3));

    return latePerformance > earlyPerformance;
  }

  getDefaultLearningPath() {
    return [
      { scenarioId: 'coffee-shop-linear-thinking', difficulty: 'beginner', focus: 'basic-concepts', priority: 'high' },
      { scenarioId: 'relationship-time-delay', difficulty: 'intermediate', focus: 'time-effects', priority: 'medium' },
      { scenarioId: 'investment-confirmation-bias', difficulty: 'advanced', focus: 'bias-awareness', priority: 'low' }
    ];
  }

  getDefaultFeedback(currentGameState, currentDecision) {
    return {
      encouragement: '欢迎来到认知陷阱平台！',
      suggestions: ['仔细考虑您的决策可能带来的各种后果'],
      warnings: [],
      insights: ['每次决策都是学习的机会']
    };
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

  // Initialize Personalized Learning Engine
  window.PersonalizedLearningEngine = new PersonalizedLearningEngine();
  console.log('Personalized Learning Engine initialized');

  // Expose debugging interfaces to window object
  window.AppState = AppState;
  window.GameManager = GameManager;
  window.NavigationManager = NavigationManager;
  window.ApiService = ApiService;
  console.log('Debug interfaces exposed to window');

    // Hide loading screen with enhanced method to prevent pointer event interception
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // Method 1: Immediate visual removal
    loadingScreen.style.display = 'none';
    loadingScreen.style.visibility = 'hidden';
    loadingScreen.style.opacity = '0';
    loadingScreen.style.zIndex = '-9999';
    
    // Method 2: Remove from DOM completely
    setTimeout(() => {
      if (loadingScreen.parentNode) {
        loadingScreen.parentNode.removeChild(loadingScreen);
      }
    }, 100);
    
    // Method 3: Add CSS override to prevent any interference
    const cssOverride = document.createElement('style');
    cssOverride.textContent = `
      #loading-screen,
      .loading-screen,
      .loading-content,
      .loading-overlay,
      .loading {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        opacity: 0 !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
      }
      
      body {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(cssOverride);

    console.log('Enhanced loading screen hidden with multiple methods');
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
  window.PersonalizedLearningEngine = PersonalizedLearningEngine;
  
  // Bind modal close buttons and events
  const closeModalBtn = document.getElementById('close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      console.log('Close modal button clicked');
      GameManager.hideGameModal();
    });
    console.log('Close modal button bound successfully');
  } else {
    console.warn('Close modal button not found');
  }

  // Add click outside to close modal
  const gameModal = document.getElementById('game-modal');
  if (gameModal) {
    gameModal.addEventListener('click', (e) => {
      if (e.target === gameModal) {
        console.log('Clicked outside modal, closing');
        GameManager.hideGameModal();
      }
    });
    console.log('Modal outside click handler bound');
  }

  // Add ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('game-modal');
      if (modal && modal.classList.contains('active')) {
        console.log('ESC pressed, closing modal');
        GameManager.hideGameModal();
      }
    }
  });
  console.log('ESC key handler bound for modal');

  // Add mouse wheel support for modal scrolling
  if (gameModal) {
    const modalContent = gameModal.querySelector('.modal-content');
    if (modalContent) {
      // Prevent page scroll when mouse is over modal
      modalContent.addEventListener('mouseenter', () => {
        document.body.style.overflow = 'hidden';
        console.log('Modal mouseenter: prevented page scroll');
      });
      
      modalContent.addEventListener('mouseleave', () => {
        document.body.style.overflow = '';
        console.log('Modal mouseleave: restored page scroll');
      });
      
      // Ensure modal content is scrollable
      modalContent.addEventListener('wheel', (e) => {
        const isAtTop = modalContent.scrollTop === 0;
        const isAtBottom = modalContent.scrollTop + modalContent.clientHeight >= modalContent.scrollHeight - 1;
        const isScrollingUp = e.deltaY < 0;
        const isScrollingDown = e.deltaY > 0;
        
        // Prevent page scroll when modal can be scrolled
        if ((!isAtTop && isScrollingUp) || (!isAtBottom && isScrollingDown)) {
          e.stopPropagation();
          console.log('Modal wheel: scrolling content');
        }
      }, { passive: false });
      
      console.log('Modal wheel scroll handler bound');
    }
  }

  const closeInvitationBtn = document.getElementById('close-invitation-modal');
  if (closeInvitationBtn) {
    closeInvitationBtn.addEventListener('click', () => {
      const modal = document.getElementById('invitation-modal');
      if (modal) {
        modal.style.display = 'none';
        console.log('Invitation modal closed');
      }
    });
  }

  const closeShareSuccess = document.getElementById('close-share-success');
  if (closeShareSuccess) {
    closeShareSuccess.addEventListener('click', () => {
      const modal = document.getElementById('share-success-modal');
      if (modal) {
        modal.style.display = 'none';
        console.log('Share success modal closed');
      }
    });
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
            
// === 全局加载屏幕移除函数 ===
// 作为后备方案，确保加载屏幕被移除
function removeLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // 方法1: 立即视觉移除
    loadingScreen.style.display = 'none';
    loadingScreen.style.visibility = 'hidden';
    loadingScreen.style.opacity = '0';
    loadingScreen.style.zIndex = '-9999';
    loadingScreen.style.pointerEvents = 'none';
    
    // 方法2: 短暂延时后从DOM中完全移除
    setTimeout(() => {
      try {
        if (loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      } catch (e) {
        console.warn('Could not remove loading screen from DOM:', e);
      }
    }, 50);
    
    // 方法3: 添加CSS覆盖确保永不干扰
    const cssOverride = document.createElement('style');
    cssOverride.textContent = `
      #loading-screen,
      .loading-screen,
      .loading-content,
      .loading-overlay,
      .loading {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        opacity: 0 !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
      }
      
      body {
        pointer-events: auto !important;
        overflow: auto !important;
      }
    `;
    document.head.appendChild(cssOverride);

    console.log('Global loading screen removal function applied');
  }
  
  // 确保主应用容器可见且可交互
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.style.visibility = 'visible';
    appContainer.style.opacity = '1';
    appContainer.style.pointerEvents = 'auto';
  }
  
  // 确保body元素可交互
  document.body.style.pointerEvents = 'auto';
  document.body.style.overflow = 'auto';
}

// 立即执行加载屏幕移除（作为后备）
removeLoadingScreen();

// 在页面完全加载后再次执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', removeLoadingScreen);
} else {
  // 如果页面已经加载完成，稍后执行
  setTimeout(removeLoadingScreen, 100);
}

// 监听页面加载完成事件
window.addEventListener('load', removeLoadingScreen);

// 将必要的类和对象暴露到全局作用域，以便HTML中的内联JavaScript可以访问
window.NavigationManager = NavigationManager;
window.AppState = AppState;
window.ApiService = ApiService;

// ============================================================================
// Historical Cases Page Class - Real-world failure cases extension
// ============================================================================

class HistoricalCasesPage {
  constructor() {
    this.cases = [];
    this.currentCase = null;
    this.currentStep = 0;
    this.userDecisions = [];
    this.isLoading = false;
  }

  async initialize() {
    try {
      this.isLoading = true;
      await this.loadHistoricalCases();
      this.render();
    } catch (error) {
      console.error('Error initializing historical cases:', error);
      this.showError('加载历史案例时出错');
    } finally {
      this.isLoading = false;
    }
  }

  async loadHistoricalCases() {
    try {
      // Try to load from API with fallback to local data
      const response = await Promise.race([
        fetch(`${APP_CONFIG.apiBaseUrl}/historical/scenarios`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API timeout after 5 seconds')), 5000)
        )
      ]);

      if (response.ok) {
        const data = await response.json();
        this.cases = data.scenarios || [];
      } else {
        // Fallback to local data or mock data
        this.cases = this.getDefaultHistoricalCases();
      }
    } catch (error) {
      console.warn('Failed to load historical cases from API:', error);
      // Use default cases as fallback
      this.cases = this.getDefaultHistoricalCases();
    }
  }

  getDefaultHistoricalCases() {
    // Return default historical cases as fallback
    return [
      {
        scenarioId: "hist-001",
        title: "挑战者号航天飞机灾难",
        description: "1986年挑战者号航天飞机发射决策过程分析",
        decisionPoints: [
          {
            step: 1,
            situation: "气温预报显示发射日将异常寒冷（华氏31度，摄氏-0.5度）",
            options: [
              "推迟发射以评估低温风险", 
              "按计划发射"
            ]
          },
          {
            step: 2,
            situation: "工程师提出O型环在低温下可能失效的担忧",
            options: [
              "要求提供更多低温测试数据", 
              "要求制造商出具书面保证",
              "忽略担忧，按计划发射"
            ]
          }
        ],
        actualOutcomes: [
          "管理层决定按计划发射", 
          "发射过程中右固体火箭助推器的O型环失效", 
          "导致燃料泄漏并引发爆炸", 
          "七名宇航员全部遇难"
        ],
        alternativeOptions: [
          "推迟发射以进行低温环境试验",
          "更换更适合低温环境的O型环材料", 
          "建立更严格的低温发射标准"
        ],
        lessons: [
          "确认偏误让管理层忽视了工程警告",
          "群体思维压制了反对声音",
          "时间压力影响了风险评估",
          "专家意见被非技术管理层否决"
        ],
        pyramidAnalysis: {
          "coreConclusion": "系统性认知偏差导致了灾难性决策",
          "supportingArguments": [
            "确认偏误让管理层倾向于寻找支持按时发射的信息",
            "群体思维压制了异议声音，形成虚假共识", 
            "时间压力和预算限制影响了客观风险评估"
          ],
          "examples": [
            "类似偏误在其他组织决策中反复出现，如哥伦比亚号航天飞机事故",
            "项目延期压力常常导致风险被低估"
          ],
          "actionableAdvice": [
            "建立多元化决策机制，鼓励质疑声音",
            "设立独立的安全审查委员会",
            "在决策中充分考虑技术专家意见"
          ]
        }
      },
      {
        scenarioId: "hist-002",
        title: "泰坦尼克号航线决策",
        description: "1912年泰坦尼克号航行路线选择的过程分析",
        decisionPoints: [
          {
            step: 1,
            situation: "航线选择 - 为了展示速度优势选择更快的航线",
            options: [
              "选择传统安全航线，避开冰山区域",
              "选择更快的航线，追求速度记录",
              "等待冰情预报后再决策"
            ]
          },
          {
            step: 2,
            situation: "收到多条冰山警告电报",
            options: [
              "降低航速并调整航线",
              "加强瞭望，维持航速", 
              "忽略警告，继续高速航行"
            ]
          }
        ],
        actualOutcomes: [
          "决策者选择了更快的航线以追求速度记录",
          "尽管收到冰山警告，仍然维持高速航行",
          "撞上冰山导致船只沉没",
          "超过1500人丧生"
        ],
        alternativeOptions: [
          "选择更安全的传统航线",
          "在冰山区域大幅减速",
          "推迟航行直到天气好转"
        ],
        lessons: [
          "过度自信导致对风险的低估",
          "商业压力掩盖了安全考量", 
          "对新技术的盲目信任（号称'永不沉没'）"
        ],
        pyramidAnalysis: {
          "coreConclusion": "过度自信和商业考量导致了对风险的系统性低估",
          "supportingArguments": [
            "对新技术的过度信任（号称'永不沉没'）导致了轻率的决策",
            "商业压力和追求速度记录的欲望影响了安全判断",
            "对潜在风险的证据被有意无意地忽略了"
          ],
          "examples": [
            "历史上多次出现因过度自信导致的重大事故",
            "商业利益与安全考量的冲突常常导致错误的优先级"
          ],
          "actionableAdvice": [
            "建立独立于商业考量的安全评估机制",
            "在项目规划中充分考虑黑天鹅事件的可能性",
            "培养对不确定性和风险的敬畏心，避免对技术的盲目信任"
          ]
        }
      }
    ];
  }

  render() {
    const container = document.getElementById('historical-cases-container') || document.body;
    container.innerHTML = this.getCasesPageHTML();
    this.bindEvents();
  }

  getCasesPageHTML() {
    if (this.isLoading) {
      return `
        <div class="historical-cases-page">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>加载历史案例中...</p>
          </div>
        </div>
      `;
    }

    if (this.currentCase) {
      return this.getCaseDetailPageHTML();
    }

    return `
      <div class="historical-cases-page">
        <div class="page-header">
          <h1>🏛️ 历史失败案例研究</h1>
          <p>通过真实世界的失败案例学习认知偏差和决策陷阱</p>
        </div>

        <div class="cases-grid">
          ${this.cases.map((historicalCase, index) => this.renderCaseCard(historicalCase, index)).join('')}
        </div>
      </div>
    `;
  }

  renderCaseCard(historicalCase, index) {
    return `
      <div class="case-card" onclick="window.historicalCasesPage.selectCase(${index})">
        <div class="case-header">
          <h3>${historicalCase.title}</h3>
          <span class="case-id">${historicalCase.scenarioId}</span>
        </div>
        <p class="case-description">${historicalCase.description}</p>
        <div class="case-meta">
          <span class="decision-points">决策点: ${historicalCase.decisionPoints.length}</span>
          <span class="lessons-count">教训: ${historicalCase.lessons.length}</span>
        </div>
        <button class="btn btn-outline">开始案例研究</button>
      </div>
    `;
  }

  getCaseDetailPageHTML() {
    const decisionPoint = this.currentCase.decisionPoints[this.currentStep] || {};
    const isLastStep = this.currentStep >= this.currentCase.decisionPoints.length - 1;

    return `
      <div class="historical-case-detail-page">
        <div class="case-header">
          <button class="btn btn-back" onclick="window.historicalCasesPage.goBackToCases()">← 返回案例列表</button>
          <h1>${this.currentCase.title}</h1>
          <p class="case-description">${this.currentCase.description}</p>
        </div>

        <div class="case-content">
          <div class="decision-step">
            <h3>决策步骤 ${this.currentStep + 1}/${this.currentCase.decisionPoints.length}</h3>
            <div class="situation-box">
              <h4>情境描述</h4>
              <p>${decisionPoint.situation}</p>
            </div>

            <div class="options-container">
              <h4>可选决策</h4>
              ${decisionPoint.options?.map((option, idx) => `
                <button class="option-btn" onclick="window.historicalCasesPage.makeDecision(${idx})">
                  ${option}
                </button>
              `).join('')}
            </div>
          </div>

          ${this.userDecisions.length > 0 ? `
            <div class="previous-decisions">
              <h4>您的决策历程</h4>
              <ul>
                ${this.userDecisions.map((decision, idx) => `
                  <li>步骤 ${idx + 1}: ${decision.optionText}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          ${isLastStep ? `
            <div class="case-summary">
              <h4>案例总结</h4>
              <div class="actual-outcomes">
                <h5>实际结果</h5>
                <ul>
                  ${this.currentCase.actualOutcomes?.map(outcome => `<li>${outcome}</li>`).join('')}
                </ul>
              </div>
              
              <div class="lessons-learned">
                <h5>关键教训</h5>
                <ul>
                  ${this.currentCase.lessons?.map(lesson => `<li>${lesson}</li>`).join('')}
                </ul>
              </div>
              
              <div class="pyramid-analysis">
                <h5>金字塔分析</h5>
                <p><strong>核心结论:</strong> ${this.currentCase.pyramidAnalysis?.coreConclusion}</p>
                <p><strong>支撑论据:</strong></p>
                <ul>
                  ${this.currentCase.pyramidAnalysis?.supportingArguments?.map(arg => `<li>${arg}</li>`).join('')}
                </ul>
                <p><strong>实用建议:</strong></p>
                <ul>
                  ${this.currentCase.pyramidAnalysis?.actionableAdvice?.map(advice => `<li>${advice}</li>`).join('')}
                </ul>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  selectCase(index) {
    this.currentCase = this.cases[index];
    this.currentStep = 0;
    this.userDecisions = [];
    this.render();
  }

  makeDecision(optionIndex) {
    if (!this.currentCase || this.currentStep >= this.currentCase.decisionPoints.length) {
      return;
    }

    const decisionPoint = this.currentCase.decisionPoints[this.currentStep];
    const selectedOption = decisionPoint.options[optionIndex];

    this.userDecisions.push({
      step: this.currentStep,
      optionIndex: optionIndex,
      optionText: selectedOption,
      timestamp: new Date().toISOString()
    });

    this.currentStep++;

    // If this was the last decision, show the summary immediately
    if (this.currentStep >= this.currentCase.decisionPoints.length) {
      this.render();
    } else {
      // Move to next decision
      this.render();
    }
  }

  goBackToCases() {
    this.currentCase = null;
    this.currentStep = 0;
    this.userDecisions = [];
    this.render();
  }

  bindEvents() {
    // Additional event binding if needed
  }

  showError(message) {
    const container = document.getElementById('historical-cases-container') || document.body;
    container.innerHTML = `
      <div class="error-message">
        <h3>❌ 错误</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="window.historicalCasesPage.initialize()">重新加载</button>
      </div>
    `;
  }

  // Decision Tree Visualization Methods
  renderDecisionTree() {
    if (!this.currentCase) return '';

    const nodes = this.buildDecisionTreeNodes();
    return `
      <div class="decision-tree-container">
        <h4>决策树可视化</h4>
        <div class="decision-tree">
          ${nodes.map(node => this.renderTreeNode(node)).join('')}
        </div>
      </div>
    `;
  }

  buildDecisionTreeNodes() {
    if (!this.currentCase || !this.currentCase.decisionPoints) return [];

    const nodes = [];
    for (let i = 0; i < this.currentCase.decisionPoints.length; i++) {
      const decisionPoint = this.currentCase.decisionPoints[i];
      const node = {
        id: `step-${i}`,
        step: i,
        situation: decisionPoint.situation,
        options: decisionPoint.options,
        isCompleted: i < this.currentStep,
        isSelected: i === this.currentStep - 1,
        userChoice: this.userDecisions.find(d => d.step === i)?.optionIndex || null
      };
      nodes.push(node);
    }

    return nodes;
  }

  renderTreeNode(node) {
    const statusClass = node.isCompleted ? 'completed' : (node.isSelected ? 'selected' : 'pending');
    const icon = node.isCompleted ? '✅' : (node.isSelected ? '🔄' : '⏳');

    return `
      <div class="tree-node ${statusClass}" id="${node.id}">
        <div class="node-header">
          <span class="node-status">${icon}</span>
          <span class="node-step">步骤 ${node.step + 1}</span>
        </div>
        <div class="node-content">
          <div class="node-situation">${node.situation}</div>
          <div class="node-options">
            ${node.options.map((option, idx) => {
              const isChosen = node.userChoice === idx;
              const optionClass = isChosen ? 'chosen-option' : '';
              return `<div class="option-item ${optionClass}">${option}${isChosen ? ' ← 您的选择' : ''}</div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Timeline Visualization Methods
  renderTimelineVisualization() {
    if (!this.currentCase) return '';

    const events = this.buildTimelineEvents();
    return `
      <div class="timeline-visualization-container">
        <h4>历史事件时间线</h4>
        <div class="timeline">
          ${events.map(event => this.renderTimelineEvent(event)).join('')}
        </div>
      </div>
    `;
  }

  buildTimelineEvents() {
    if (!this.currentCase) return [];

    const events = [];
    
    // Add decision events
    this.currentCase.decisionPoints.forEach((point, index) => {
      events.push({
        type: 'decision',
        title: `决策点 ${index + 1}`,
        description: point.situation.substring(0, 100) + (point.situation.length > 100 ? '...' : ''),
        date: `T+${index + 1}阶段`,
        step: index,
        completed: index < this.currentStep
      });
    });

    // Add outcome events if available
    if (this.currentCase.actualOutcomes) {
      this.currentCase.actualOutcomes.forEach((outcome, index) => {
        events.push({
          type: 'outcome',
          title: `实际结果 ${index + 1}`,
          description: outcome,
          date: `T+${this.currentCase.decisionPoints.length + index + 1}阶段`,
          step: index,
          completed: this.currentStep >= this.currentCase.decisionPoints.length
        });
      });
    }

    return events;
  }

  renderTimelineEvent(event) {
    const statusClass = event.completed ? 'completed' : 'pending';
    const icon = event.type === 'decision' ? '💭' : '📊';

    return `
      <div class="timeline-event ${statusClass}">
        <div class="timeline-marker">${icon}</div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-title">${event.title}</span>
            <span class="timeline-date">${event.date}</span>
          </div>
          <div class="timeline-description">${event.description}</div>
        </div>
      </div>
    `;
  }

  // Interactive Elements for User Engagement
  addInteractiveElements() {
    // Add reflective questions after each decision
    return `
      <div class="interactive-elements">
        <div class="reflection-questions">
          <h4>反思问题</h4>
          <div class="question-item">
            <p>在类似情况下，您会如何避免同样的决策错误？</p>
            <textarea class="reflection-textarea" placeholder="写下您的思考..."></textarea>
          </div>
          <div class="question-item">
            <p>这个历史案例与您当前面临的决策有何相似之处？</p>
            <textarea class="reflection-textarea" placeholder="写下您的思考..."></textarea>
          </div>
          <button class="btn btn-secondary" onclick="window.historicalCasesPage.saveReflection()">保存反思</button>
        </div>
        
        <div class="comparison-section">
          <h4>现代对比</h4>
          <p>思考一下，如果同样的决策情景出现在今天，可能会有什么不同？</p>
          <div class="modern-context-selector">
            <select id="modern-context-select" onchange="window.historicalCasesPage.onModernContextChange(this.value)">
              <option value="">选择现代情境...</option>
              <option value="tech">科技行业</option>
              <option value="finance">金融行业</option>
              <option value="healthcare">医疗行业</option>
              <option value="government">政府决策</option>
              <option value="personal">个人决策</option>
            </select>
          </div>
          <div id="modern-context-output" class="modern-context-output"></div>
        </div>
        
        <div class="bias-identification">
          <h4>认知偏差识别</h4>
          <p>在这个案例中，您认为哪些认知偏差起了重要作用？</p>
          <div class="bias-grid">
            ${this.renderBiasSelection()}
          </div>
        </div>
      </div>
    `;
  }

  renderBiasSelection() {
    const commonBiases = [
      "确认偏误 (Confirmation Bias)",
      "群体思维 (Groupthink)", 
      "过度自信 (Overconfidence)",
      "锚定效应 (Anchoring)",
      "损失厌恶 (Loss Aversion)",
      "时间偏好 (Temporal Discounting)",
      "权威偏见 (Authority Bias)",
      "可得性启发 (Availability Heuristic)"
    ];

    return commonBiases.map(bias => `
      <label class="bias-checkbox">
        <input type="checkbox" value="${bias}" onchange="window.historicalCasesPage.onBiasSelected(this, '${bias}')">
        <span>${bias}</span>
      </label>
    `).join('');
  }

  onBiasSelected(element, biasName) {
    if (!this.selectedBiases) this.selectedBiases = [];
    
    if (element.checked) {
      if (!this.selectedBiases.includes(biasName)) {
        this.selectedBiases.push(biasName);
      }
    } else {
      this.selectedBiases = this.selectedBiases.filter(b => b !== biasName);
    }
    
    console.log('Selected biases:', this.selectedBiases);
  }

  onModernContextChange(context) {
    const outputDiv = document.getElementById('modern-context-output');
    if (!outputDiv) return;

    let comparisonText = '';
    switch(context) {
      case 'tech':
        comparisonText = '在科技行业，快速迭代和A/B测试可能帮助识别类似风险，但技术乐观主义也可能加剧确认偏误。';
        break;
      case 'finance':
        comparisonText = '金融行业有更严格的风控体系，但市场情绪和羊群效应可能导致类似的集体误判。';
        break;
      case 'healthcare':
        comparisonText = '医疗决策通常有更严格的循证要求，但时间压力和责任分散仍可能导致类似错误。';
        break;
      case 'government':
        comparisonText = '政府决策有更多制衡机制，但政治考量和公众压力可能引入新的偏见。';
        break;
      case 'personal':
        comparisonText = '个人决策中，情感因素和短期思维可能比组织决策中的偏见更为突出。';
        break;
      default:
        comparisonText = '';
    }

    outputDiv.innerHTML = comparisonText ? 
      `<div class="modern-context-result"><p>${comparisonText}</p></div>` : '';
  }

  saveReflection() {
    const textareas = document.querySelectorAll('.reflection-textarea');
    const reflections = Array.from(textareas).map(ta => ta.value.trim()).filter(val => val);
    
    if (reflections.length > 0) {
      alert('反思已保存！这些思考将帮助您更好地应用历史教训。');
      
      // In a real implementation, we would save to a backend or localStorage
      console.log('Saved reflections:', reflections);
    } else {
      alert('请填写至少一个反思问题。');
    }
  }

  // Enhanced detail page with interactive elements
  getCaseDetailPageHTML() {
    const decisionPoint = this.currentCase.decisionPoints[this.currentStep] || {};
    const isLastStep = this.currentStep >= this.currentCase.decisionPoints.length - 1;

    return `
      <div class="historical-case-detail-page">
        <div class="case-header">
          <button class="btn btn-back" onclick="window.historicalCasesPage.goBackToCases()">← 返回案例列表</button>
          <h1>${this.currentCase.title}</h1>
          <p class="case-description">${this.currentCase.description}</p>
        </div>

        <div class="case-content">
          <!-- Decision Tree Visualization -->
          ${this.renderDecisionTree()}

          <!-- Timeline Visualization -->
          ${this.renderTimelineVisualization()}

          <div class="decision-step">
            <h3>决策步骤 ${this.currentStep + 1}/${this.currentCase.decisionPoints.length}</h3>
            <div class="situation-box">
              <h4>情境描述</h4>
              <p>${decisionPoint.situation}</p>
            </div>

            <div class="options-container">
              <h4>可选决策</h4>
              ${decisionPoint.options?.map((option, idx) => `
                <button class="option-btn" onclick="window.historicalCasesPage.makeDecision(${idx})">
                  ${option}
                </button>
              `).join('')}
            </div>
          </div>

          ${this.userDecisions.length > 0 ? `
            <div class="previous-decisions">
              <h4>您的决策历程</h4>
              <ul>
                ${this.userDecisions.map((decision, idx) => `
                  <li>步骤 ${idx + 1}: ${decision.optionText}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Interactive Elements -->
          ${this.addInteractiveElements()}

          ${isLastStep ? `
            <div class="case-summary">
              <h4>案例总结</h4>
              <div class="actual-outcomes">
                <h5>实际结果</h5>
                <ul>
                  ${this.currentCase.actualOutcomes?.map(outcome => `<li>${outcome}</li>`).join('')}
                </ul>
              </div>
              
              <div class="lessons-learned">
                <h5>关键教训</h5>
                <ul>
                  ${this.currentCase.lessons?.map(lesson => `<li>${lesson}</li>`).join('')}
                </ul>
              </div>
              
              <div class="pyramid-analysis">
                <h5>金字塔分析</h5>
                <p><strong>核心结论:</strong> ${this.currentCase.pyramidAnalysis?.coreConclusion}</p>
                <p><strong>支撑论据:</strong></p>
                <ul>
                  ${this.currentCase.pyramidAnalysis?.supportingArguments?.map(arg => `<li>${arg}</li>`).join('')}
                </ul>
                <p><strong>实用建议:</strong></p>
                <ul>
                  ${this.currentCase.pyramidAnalysis?.actionableAdvice?.map(advice => `<li>${advice}</li>`).join('')}
                </ul>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}
