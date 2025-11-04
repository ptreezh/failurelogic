/**
 * Dynamic Worlds - Main Application JavaScript
 * 认知陷阱教育平台前端应用
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
  syncStatus: 'idle',
  gameSession: null,
};

// DOM Elements Cache
const DOM = {
  loadingScreen: null,
  app: null,
  navItems: null,
  pages: null,
  syncButton: null,
  gameModal: null,
  toastContainer: null,
};

// Utility Functions
const Utils = {
  /**
   * Format date to readable string
   */
  formatDate(date) {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  },

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Local storage helpers
   */
  storage: {
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    },

    get(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return null;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    },
  },

  /**
   * Check if device is mobile
   */
  isMobile() {
    return window.innerWidth <= 768;
  },

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  },
};

// Mock Data for GitHub Pages
const MockData = {
  '/api/v1/scenarios': {
    scenarios: [
      {
        id: 'coffee-shop-linear-thinking',
        title: '咖啡店经营陷阱',
        description: '体验线性思维在复杂系统中的局限',
        difficulty: 'beginner',
        duration: '15-20分钟',
        cognitiveBias: '线性思维',
        category: '商业决策',
        thumbnail: '/assets/images/coffee-shop.jpg'
      },
      {
        id: 'investment-confirmation-bias',
        title: '投资确认偏误',
        description: '认识确认偏误对投资决策的影响',
        difficulty: 'intermediate',
        duration: '20-25分钟',
        cognitiveBias: '确认偏误',
        category: '金融决策',
        thumbnail: '/assets/images/investment.jpg'
      },
      {
        id: 'relationship-time-delay',
        title: '关系时间延迟',
        description: '理解时间延迟对人际关系的影响',
        difficulty: 'advanced',
        duration: '25-30分钟',
        cognitiveBias: '时间延迟',
        category: '人际关系',
        thumbnail: '/assets/images/relationship.jpg'
      }
    ]
  },

  '/api/v1/games': {
    message: '游戏会话管理已就绪',
    sessionId: 'demo-session-' + Date.now()
  },

  '/api/v1/analysis': {
    message: '认知分析服务可用',
    features: ['bias-detection', 'pattern-analysis', 'decision-tracking']
  }
};

// API Service
const ApiService = {
  /**
   * Make HTTP request with fallback to mock data
   */
  async request(endpoint, options = {}) {
    // Smart API failover logic
    const apiSources = [
      'https://turbo-rotary-phone-pq4jq7pvr7f6jxx-8003.app.github.dev',
      'https://turbo-rotary-phone-pq4jq7pvr7f6jxx-8000.app.github.dev',
      'https://turbo-rotary-phone-pq4jq7pvr7f6jxx-5906.app.github.dev',
      'https://turbo-rotary-phone-pq4jq7pvr7f6jxx-8002.app.github.dev',
      'https://failurelogic-api.vercel.app',
      'https://failurelogic.vercel.app'
    ];

    // Add auth token if available
    const token = Utils.storage.get('authToken');

    for (let i = 0; i < apiSources.length; i++) {
      const apiBaseUrl = apiSources[i];
      const url = `${apiBaseUrl}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      try {
        console.log(`尝试API源 ${i + 1}/${apiSources.length}:`, apiBaseUrl);
        const response = await fetch(url, {
          ...config,
          signal: AbortSignal.timeout(5000) // 5秒超时
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ API源 ${i + 1} 成功:`, apiBaseUrl);

        // 如果成功，更新默认API基URL为成功的源
        if (i > 0) {
          APP_CONFIG.apiBaseUrl = apiBaseUrl;
          console.log('切换API源到:', apiBaseUrl);
        }

        return data;
      } catch (error) {
        console.warn(`❌ API源 ${i + 1} 失败:`, apiBaseUrl, error.message);
        if (i === apiSources.length - 1) {
          // 所有API源都失败，使用mock数据
          console.warn('所有API源都失败，使用mock数据:', error.message);
          const mockData = MockData[endpoint];
          if (mockData) {
            console.log('Using mock data for:', endpoint);
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return mockData;
          }
          throw error;
        }
        // 继续尝试下一个API源
      }
    }
  },

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint);
  },

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  },

  // API Endpoints
  scenarios: {
    getAll: () => ApiService.get('/scenarios/'),
    getById: (id) => ApiService.get(`/scenarios/${id}`),
    create: (data) => ApiService.post('/scenarios/', data),
    createGameSession: (scenarioId) => ApiService.post(`/scenarios/create_game_session/${scenarioId}`),
  },

  games: {
    executeTurn: (gameId, decisions) =>
      ApiService.post(`/scenarios/${gameId}/turn`, { user_id: 1, decisions }),
  },

  users: {
    getProfile: () => ApiService.get('/users/profile'),
    updateProfile: (data) => ApiService.put('/users/profile', data),
    getStats: () => ApiService.get('/users/stats'),
    getAchievements: () => ApiService.get('/users/achievements'),
    getLeaderboard: () => ApiService.get('/users/leaderboard'),
  },

  auth: {
    login: (credentials) => ApiService.post('/auth/login', credentials),
    register: (data) => ApiService.post('/auth/register', data),
    demoLogin: () => ApiService.post('/auth/demo-login'),
    logout: () => ApiService.post('/auth/logout'),
    refreshToken: () => ApiService.post('/auth/refresh'),
  },

  sync: {
    upload: (data) => ApiService.post('/sync/upload', data),
    download: (lastSync) => ApiService.get('/sync/download', { lastSync }),
  },
};

// Navigation Manager
const NavigationManager = {
  /**
   * Initialize navigation
   */
  init() {
    DOM.navItems = document.querySelectorAll('.nav-item');
    DOM.pages = document.querySelectorAll('.page');

    // Add click handlers to navigation items
    DOM.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      const page = e.state?.page || 'home';
      this.navigateTo(page, false);
    });

    // Initialize with current page
    const currentPage = window.location.hash.slice(1) || 'home';
    this.navigateTo(currentPage, false);
  },

  /**
   * Navigate to page
   */
  navigateTo(page, updateHistory = true) {
    if (AppState.currentPage === page) return;

    // Hide current page
    const currentPageElement = document.querySelector(`#${AppState.currentPage}-page`);
    if (currentPageElement) {
      currentPageElement.classList.remove('active');
    }

    // Update navigation active state
    DOM.navItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === page) {
        item.classList.add('active');
      }
    });

    // Show new page
    const newPageElement = document.querySelector(`#${page}-page`);
    if (newPageElement) {
      newPageElement.classList.add('active');
    }

    // Update state
    AppState.currentPage = page;

    // Update browser history
    if (updateHistory) {
      history.pushState({ page }, '', `#${page}`);
    }

    // Load page content
    this.loadPageContent(page);
  },

  /**
   * Load page-specific content
   */
  async loadPageContent(page) {
    try {
      switch (page) {
        case 'home':
          await this.loadHomePage();
          break;
        case 'scenarios':
          await this.loadScenariosPage();
          break;
        case 'progress':
          await this.loadProgressPage();
          break;
        case 'profile':
          await this.loadProfilePage();
          break;
        case 'achievements':
          await this.loadAchievementsPage();
          break;
        case 'leaderboard':
          await this.loadLeaderboardPage();
          break;
        case 'book':
          await this.loadBookPage();
          break;
        case 'about':
          await this.loadAboutPage();
          break;
      }
    } catch (error) {
      console.error(`Failed to load ${page} page:`, error);
      ToastManager.showError(`加载${page}页面失败`);
    }
  },

  /**
   * Load home page content
   */
  async loadHomePage() {
    this.animateStats();
  },

  /**
   * Load scenarios page
   */
  loadScenariosPage() {
    const scenariosGrid = document.getElementById('scenarios-grid');
    if (!scenariosGrid) {
      console.error('Scenarios grid not found');
      return;
    }

    // 直接使用静态场景数据，无需API调用
    console.log('Loading scenarios from static data...');
    const mockScenarios = this.getMockScenarios();
    this.renderScenarios(mockScenarios, scenariosGrid);
  },

  /**
   * Load progress page
   */
  async loadProgressPage() {
    const progressContainer = document.querySelector('#progress-page .page-content');
    if (!progressContainer) return;

    try {
      // 显示加载状态
      progressContainer.innerHTML = '<div class="loading">加载进度数据中...</div>';

      const stats = this.getMockStats(); // 暂时使用模拟数据
      this.renderProgress(stats);
    } catch (error) {
      console.error('Failed to load progress page:', error);
      // Fallback to mock data
      const mockStats = this.getMockStats();
      this.renderProgress(mockStats);
    }
  },

  /**
   * Load profile page
   */
  async loadProfilePage() {
    const profileContainer = document.querySelector('#profile-page .page-content');
    if (!profileContainer) return;

    try {
      // 显示加载状态
      profileContainer.innerHTML = '<div class="loading">加载个人资料中...</div>';

      const profile = this.getMockProfile(); // 暂时使用模拟数据
      this.renderProfile(profile);
    } catch (error) {
      console.error('Failed to load profile page:', error);
      // Fallback to mock data
      const mockProfile = this.getMockProfile();
      this.renderProfile(mockProfile);
    }
  },

  /**
   * Load achievements page
   */
  async loadAchievementsPage() {
    try {
      const achievements = await ApiService.users.getAchievements();
      this.renderAchievements(achievements);
    } catch (error) {
      // Fallback to mock data
      const mockAchievements = this.getMockAchievements();
      this.renderAchievements(mockAchievements);
    }
  },

  /**
   * Load leaderboard page
   */
  async loadLeaderboardPage() {
    try {
      const leaderboard = await ApiService.users.getLeaderboard();
      this.renderLeaderboard(leaderboard);
    } catch (error) {
      // Fallback to mock data
      const mockLeaderboard = this.getMockLeaderboard();
      this.renderLeaderboard(mockLeaderboard);
    }
  },

  /**
   * Load book page
   */
  async loadBookPage() {
    // Book page content is static, no need to load dynamic content
    console.log('Book page loaded successfully');
  },

  /**
   * Load about page
   */
  async loadAboutPage() {
    // About page content is static, no need to load dynamic content
    console.log('About page loaded successfully');
  },

  /**
   * Render scenarios
   */
  renderScenarios(scenarios, container) {
    container.innerHTML = '';

    scenarios.forEach(scenario => {
      const card = this.createScenarioCard(scenario);
      container.appendChild(card);
    });
  },

  /**
   * Create scenario card
   */
  createScenarioCard(scenario) {
    const card = document.createElement('div');
    card.className = 'card scenario-card';
    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${scenario.name}</h3>
        <p class="card-subtitle">${scenario.description}</p>
      </div>
      <div class="card-body">
        <div class="scenario-meta">
          <span class="badge ${scenario.difficulty}">${scenario.difficulty}</span>
          <span class="scenario-duration">${scenario.estimatedDuration}分钟</span>
        </div>
        <p class="scenario-description">${scenario.fullDescription}</p>
      </div>
      <div class="card-footer">
        <button class="btn btn-primary" onclick="GameManager.startScenario('${scenario.id}')">
          开始挑战
        </button>
      </div>
    `;
    return card;
  },

  /**
   * Animate statistics numbers
   */
  animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');

    statNumbers.forEach(stat => {
      const target = parseInt(stat.dataset.target);
      const duration = 2000;
      const increment = target / (duration / 16);
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        stat.textContent = Math.floor(current);
      }, 16);
    });
  },

  /**
   * Mock data methods
   */
  getMockScenarios() {
    return [
      {
        id: 'coffee-shop-linear',
        name: '咖啡店线性思维',
        description: '线性思维陷阱场景',
        fullDescription: '在这个场景中，您将管理一家咖啡店，体验线性思维在复杂商业环境中的局限性。',
        difficulty: 'beginner',
        estimatedDuration: 15,
        targetBiases: ['linear_thinking'],
        content: {
          introduction: '您刚刚接手了一家位于市中心的咖啡店。作为新经理，您面临各种决策，从员工管理到库存控制，再到市场营销。让我们看看线性思维如何影响您的决策。',
          rounds: [
            {
              id: 1,
              title: '员工招聘决策',
              description: '咖啡店生意繁忙，您需要招聘更多员工。目前有2名咖啡师，每天服务100名顾客。您计划将生意扩大到每天200名顾客。',
              question: '您应该招聘多少名新咖啡师？',
              options: [
                { text: '招聘2名新咖啡师（1:1比例）', value: 'linear', impact: { service_quality: 80, cost: 60, employee_satisfaction: 70 } },
                { text: '招聘3名新咖啡师（考虑培训和轮班）', value: 'system', impact: { service_quality: 90, cost: 75, employee_satisfaction: 85 } },
                { text: '招聘1名新咖啡师（最大化效率）', value: 'optimistic', impact: { service_quality: 60, cost: 40, employee_satisfaction: 50 } }
              ],
              correctAnswer: 'system',
              explanation: '线性思维会认为2倍顾客需要2倍员工。但系统思维考虑到培训时间、轮班安排、高峰期需求等因素。'
            },
            {
              id: 2,
              title: '库存管理挑战',
              description: '您的咖啡豆供应商提供了优惠：批量购买100公斤可享受30%折扣。目前您每周使用10公斤。',
              question: '您应该如何采购咖啡豆？',
              options: [
                { text: '立即购买100公斤（享受折扣）', value: 'linear', impact: { cost_savings: 90, storage_cost: 40, freshness: 50 } },
                { text: '购买20公斤（2周用量）', value: 'balanced', impact: { cost_savings: 70, storage_cost: 70, freshness: 80 } },
                { text: '维持现有采购量', value: 'conservative', impact: { cost_savings: 50, storage_cost: 80, freshness: 90 } }
              ],
              correctAnswer: 'balanced',
              explanation: '线性思维只看到折扣优势，但系统思维考虑存储成本、咖啡豆新鲜度、资金占用等因素。'
            }
          ],
          conclusion: '通过这个咖啡店管理场景，您可以看到线性思维往往忽略系统的复杂性。优秀的决策需要考虑多个相互关联的因素。'
        }
      },
      {
        id: 'relationship-time-delay',
        name: '恋爱关系时间延迟',
        description: '时间延迟偏差场景',
        fullDescription: '探索恋爱关系中决策与结果之间的时间延迟如何影响我们的判断。',
        difficulty: 'intermediate',
        estimatedDuration: 20,
        targetBiases: ['time_delay_bias'],
        content: {
          introduction: '恋爱关系中的决策往往需要很长时间才能看到结果。这种时间延迟会影响我们的判断力和决策质量。让我们通过一个虚拟关系来体验这种现象。',
          rounds: [
            {
              id: 1,
              title: '沟通方式的改变',
              description: '您和伴侣最近经常因为小事争吵。您认为改变沟通方式可能改善关系，但效果需要时间才能显现。',
              question: '当您的沟通改变短期内没有明显效果时，您会怎么做？',
              options: [
                { text: '立即放弃，认为改变无效', value: 'immediate', impact: { relationship_quality: 40, personal_growth: 30, communication_skill: 20 } },
                { text: '坚持改变至少3个月', value: 'patient', impact: { relationship_quality: 80, personal_growth: 85, communication_skill: 90 } },
                { text: '尝试另一种沟通方式', value: 'adaptive', impact: { relationship_quality: 65, personal_growth: 70, communication_skill: 75 } }
              ],
              correctAnswer: 'patient',
              explanation: '时间延迟偏差让我们期望立即看到结果。但关系改善需要时间，耐心和坚持是关键。'
            },
            {
              id: 2,
              title: '信任重建过程',
              description: '您的伴侣曾经撒过一个善意的谎言。您决定努力重建信任，但信任的恢复是一个缓慢的过程。',
              question: '在信任重建过程中，什么最重要？',
              options: [
                { text: '要求对方立即证明改变', value: 'urgent', impact: { trust_level: 30, relationship_stress: 90, emotional_wellbeing: 40 } },
                { text: '给予时间和空间，观察持续的行为改变', value: 'patient', impact: { trust_level: 85, relationship_stress: 40, emotional_wellbeing: 80 } },
                { text: '频繁提及过去以提醒对方', value: 'reminder', impact: { trust_level: 50, relationship_stress: 70, emotional_wellbeing: 50 } }
              ],
              correctAnswer: 'patient',
              explanation: '信任重建具有显著的时间延迟。持续的行为改变比言语承诺更有意义。'
            }
          ],
          conclusion: '恋爱关系中的时间延迟教会我们耐心和坚持的价值。真正的改变需要时间，理解和接受这一点是成熟关系的标志。'
        }
      },
      {
        id: 'investment-confirmation',
        name: '投资确认偏误',
        description: '确认偏误场景',
        fullDescription: '在投资决策中体验确认偏误如何影响我们的风险判断。',
        difficulty: 'advanced',
        estimatedDuration: 25,
        targetBiases: ['confirmation_bias'],
        content: {
          introduction: '确认偏误是我们倾向于寻找和解释支持我们既有信念的信息，而忽略相反的证据。在投资决策中，这种偏见可能导致重大损失。',
          rounds: [
            {
              id: 1,
              title: '股票研究偏见',
              description: '您研究了某家科技公司并认为它有很大潜力。现在您需要做最终投资决策。',
              question: '在投资前，您应该如何收集信息？',
              options: [
                { text: '主要寻找支持该股票的正面分析', value: 'confirming', impact: { investment_return: 30, risk_level: 80, learning_value: 20 } },
                { text: '主动寻找反对该股票的负面信息', value: 'challenging', impact: { investment_return: 75, risk_level: 40, learning_value: 90 } },
                { text: '只查看该公司官方发布的信息', value: 'limited', impact: { investment_return: 50, risk_level: 60, learning_value: 40 } }
              ],
              correctAnswer: 'challenging',
              explanation: '确认偏误让我们偏好支持性信息。主动寻找反对意见能提供更平衡的视角。'
            },
            {
              id: 2,
              title: '投资组合调整',
              description: '您的投资组合中某只股票下跌了20%。您需要决定是继续持有还是卖出。',
              question: '面对亏损，您应该如何反应？',
              options: [
                { text: '立即卖出避免进一步损失', value: 'panic', impact: { portfolio_value: 60, emotional_state: 40, decision_quality: 30 } },
                { text: '寻找信息证明自己最初的决策是正确的', value: 'confirming', impact: { portfolio_value: 45, emotional_state: 60, decision_quality: 40 } },
                { text: '客观重新评估该公司基本面和未来前景', value: 'rational', impact: { portfolio_value: 80, emotional_state: 75, decision_quality: 90 } }
              ],
              correctAnswer: 'rational',
              explanation: '确认偏误在亏损时特别危险，因为它让我们寻找证据支持原有决策而非客观评估。'
            }
          ],
          conclusion: '投资中的确认偏误可能导致重大财务损失。学会挑战自己的假设，主动寻找不同观点，是成为理性投资者的关键。'
        }
      }
    ];
  },

  getMockStats() {
    return {
      totalGames: 5,
      completedGames: 3,
      averageScore: 75,
      favoriteBiasType: 'linear_thinking',
      achievements: [
        { id: 1, name: '初学者', unlocked: true },
        { id: 2, name: '思考者', unlocked: true },
        { id: 3, name: '大师', unlocked: false },
      ],
      progress: {
        overall: 60,
        byType: {
          linear_thinking: 80,
          time_delay_bias: 40,
          confirmation_bias: 20,
        },
      },
    };
  },

  getMockProfile() {
    return {
      id: 'user123',
      username: '认知探索者',
      email: 'user@example.com',
      phone: '+86 138 0000 0000',
      avatar: null,
      joinDate: '2024-01-15',
      preferences: {
        theme: 'light',
        language: 'zh-CN',
        notifications: true,
      },
    };
  },

  /**
   * Render progress page
   */
  renderProgress(stats) {
    const container = document.querySelector('#progress-page .page-content');
    if (!container) return;

    container.innerHTML = `
      <div class="progress-overview">
        <div class="progress-stats">
          <div class="stat-card">
            <h3>总游戏数</h3>
            <span class="stat-number">${stats.totalGames}</span>
          </div>
          <div class="stat-card">
            <h3>已完成</h3>
            <span class="stat-number">${stats.completedGames}</span>
          </div>
          <div class="stat-card">
            <h3>平均分数</h3>
            <span class="stat-number">${stats.averageScore}</span>
          </div>
        </div>
      </div>

      <div class="progress-details">
        <h3>认知偏见类型进度</h3>
        <div class="bias-progress">
          ${Object.entries(stats.progress.byType).map(([type, progress]) => `
            <div class="bias-item">
              <span class="bias-name">${this.getBiasName(type)}</span>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <span class="progress-text">${progress}%</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="achievements-preview">
        <h3>最近成就</h3>
        <div class="achievements-list">
          ${stats.achievements.filter(a => a.unlocked).map(achievement => `
            <div class="achievement-item">
              <span class="achievement-icon">${achievement.icon || '🏆'}</span>
              <span class="achievement-name">${achievement.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render profile page
   */
  renderProfile(profile) {
    const container = document.querySelector('#profile-page .page-content');
    if (!container) return;

    container.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">
          <div class="avatar-circle">
            ${profile.avatar ? `<img src="${profile.avatar}" alt="Avatar">` : profile.username.charAt(0)}
          </div>
        </div>
        <div class="profile-info">
          <h2>${profile.username}</h2>
          <p class="user-email">${profile.email}</p>
          <p class="join-date">加入于 ${profile.joinDate}</p>
        </div>
        <button class="btn btn-outline" onclick="NavigationManager.navigateTo('achievements')">
          查看成就
        </button>
      </div>

      <div class="profile-stats">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">完成游戏</span>
            <span class="stat-value">12</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总积分</span>
            <span class="stat-value">1,850</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">全球排名</span>
            <span class="stat-value">#156</span>
          </div>
        </div>
      </div>

      <div class="profile-preferences">
        <h3>偏好设置</h3>
        <div class="preference-list">
          <div class="preference-item">
            <label>主题</label>
            <select class="form-select">
              <option value="light" ${profile.preferences.theme === 'light' ? 'selected' : ''}>浅色</option>
              <option value="dark" ${profile.preferences.theme === 'dark' ? 'selected' : ''}>深色</option>
            </select>
          </div>
          <div class="preference-item">
            <label>语言</label>
            <select class="form-select">
              <option value="zh-CN" ${profile.preferences.language === 'zh-CN' ? 'selected' : ''}>简体中文</option>
              <option value="en" ${profile.preferences.language === 'en' ? 'selected' : ''}>English</option>
            </select>
          </div>
          <div class="preference-item">
            <label>
              <input type="checkbox" ${profile.preferences.notifications ? 'checked' : ''}>
              接收通知
            </label>
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <button class="btn btn-primary">保存设置</button>
        <button class="btn btn-outline">退出登录</button>
      </div>
    `;
  },

  /**
   * Get bias name in Chinese
   */
  getBiasName(type) {
    const names = {
      'linear_thinking': '线性思维',
      'time_delay_bias': '时间延迟偏差',
      'confirmation_bias': '确认偏误',
    };
    return names[type] || type;
  },

  /**
   * Render achievements page
   */
  renderAchievements(achievements) {
    const container = document.querySelector('#achievements-page .page-content');
    if (!container) return;

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;

    container.innerHTML = `
      <div class="achievements-header">
        <div class="achievements-summary">
          <div class="summary-item">
            <span class="summary-number">${unlockedCount}</span>
            <span class="summary-label">已解锁</span>
          </div>
          <div class="summary-item">
            <span class="summary-number">${totalCount}</span>
            <span class="summary-label">总成就</span>
          </div>
          <div class="summary-item">
            <span class="summary-number">${Math.round(unlockedCount / totalCount * 100)}%</span>
            <span class="summary-label">完成度</span>
          </div>
        </div>
      </div>
      <div class="achievements-grid">
        ${achievements.map(achievement => this.createAchievementCard(achievement)).join('')}
      </div>
    `;
  },

  /**
   * Create achievement card
   */
  createAchievementCard(achievement) {
    const card = document.createElement('div');
    card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;

    card.innerHTML = `
      <div class="achievement-icon">
        <div class="icon-wrapper ${achievement.unlocked ? 'unlocked' : 'locked'}">
          ${achievement.unlocked ? achievement.icon : '<span>🔒</span>'}
        </div>
      </div>
      <div class="achievement-info">
        <h3 class="achievement-name">${achievement.name}</h3>
        <p class="achievement-description">${achievement.description}</p>
        <div class="achievement-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${achievement.progress}%"></div>
          </div>
          <span class="progress-text">${achievement.progressText}</span>
        </div>
        ${achievement.unlocked ?
          `<div class="achievement-unlocked">
            <span class="unlocked-date">解锁于 ${achievement.unlockedDate}</span>
          </div>` :
          `<div class="achievement-locked">
            <span class="unlock-hint">${achievement.hint}</span>
          </div>`
        }
      </div>
      <div class="achievement-rewards">
        ${achievement.rewards ?
          `<div class="reward-item">
            <span class="reward-icon">💰</span>
            <span class="reward-value">+${achievement.rewards.coins}</span>
          </div>
          <div class="reward-item">
            <span class="reward-icon">⭐</span>
            <span class="reward-value">+${achievement.rewards.experience}</span>
          </div>` : ''
        }
      </div>
    `;

    return card.outerHTML;
  },

  /**
   * Render leaderboard page
   */
  renderLeaderboard(leaderboard) {
    const container = document.querySelector('#leaderboard-page .page-content');
    if (!container) return;

    const currentUserRank = leaderboard.find(entry => entry.isCurrentUser);
    const topEntries = leaderboard.slice(0, 10);

    container.innerHTML = `
      <div class="leaderboard-header">
        <h2>全球排行榜</h2>
        <div class="leaderboard-filters">
          <button class="filter-btn active" data-period="weekly">本周</button>
          <button class="filter-btn" data-period="monthly">本月</button>
          <button class="filter-btn" data-period="all">总榜</button>
        </div>
      </div>

      ${currentUserRank ? `
        <div class="current-user-rank">
          <div class="rank-card highlight">
            <span class="rank-position">#${currentUserRank.rank}</span>
            <div class="user-info">
              <div class="user-avatar">${currentUserRank.username.charAt(0)}</div>
              <div class="user-details">
                <span class="user-name">${currentUserRank.username}</span>
                <span class="user-score">${currentUserRank.score} 分</span>
              </div>
            </div>
            <div class="rank-change ${currentUserRank.change > 0 ? 'up' : currentUserRank.change < 0 ? 'down' : 'same'}">
              ${currentUserRank.change > 0 ? '↑' : currentUserRank.change < 0 ? '↓' : '→'} ${Math.abs(currentUserRank.change)}
            </div>
          </div>
        </div>
      ` : ''}

      <div class="leaderboard-list">
        ${topEntries.map((entry, index) => this.createLeaderboardEntry(entry, index)).join('')}
      </div>
    `;
  },

  /**
   * Create leaderboard entry
   */
  createLeaderboardEntry(entry, index) {
    const isCurrentUser = entry.isCurrentUser || false;
    const rankMedal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`;

    return `
      <div class="rank-card ${isCurrentUser ? 'highlight' : ''}">
        <span class="rank-position">${rankMedal}</span>
        <div class="user-info">
          <div class="user-avatar ${entry.tier ? entry.tier.toLowerCase() : ''}">${entry.username.charAt(0)}</div>
          <div class="user-details">
            <span class="user-name">${entry.username} ${isCurrentUser ? '(你)' : ''}</span>
            <span class="user-score">${entry.score} 分</span>
          </div>
        </div>
        <div class="rank-stats">
          <div class="stat-item">
            <span class="stat-label">完成</span>
            <span class="stat-value">${entry.completedGames}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">胜率</span>
            <span class="stat-value">${entry.winRate}%</span>
          </div>
        </div>
        <div class="rank-change ${entry.change > 0 ? 'up' : entry.change < 0 ? 'down' : 'same'}">
          ${entry.change > 0 ? '↑' : entry.change < 0 ? '↓' : '→'} ${Math.abs(entry.change)}
        </div>
      </div>
    `;
  },

  /**
   * Get mock achievements data
   */
  getMockAchievements() {
    return [
      {
        id: 'first_game',
        name: '初次体验',
        description: '完成第一个认知训练场景',
        icon: '🎯',
        unlocked: true,
        unlockedDate: '2024-01-15',
        progress: 100,
        progressText: '已完成',
        rewards: { coins: 50, experience: 100 }
      },
      {
        id: 'linear_master',
        name: '线性思维大师',
        description: '在所有线性思维场景中获得优秀评价',
        icon: '📈',
        unlocked: true,
        unlockedDate: '2024-01-18',
        progress: 100,
        progressText: '3/3 场景',
        rewards: { coins: 200, experience: 500 }
      },
      {
        id: 'decision_expert',
        name: '决策专家',
        description: '连续10次做出正确决策',
        icon: '🧠',
        unlocked: false,
        progress: 70,
        progressText: '7/10 次',
        hint: '保持专注，相信你的判断',
        rewards: { coins: 300, experience: 800 }
      },
      {
        id: 'social_butterfly',
        name: '社交达人',
        description: '邀请5位朋友加入平台',
        icon: '🦋',
        unlocked: false,
        progress: 60,
        progressText: '3/5 位朋友',
        hint: '分享邀请链接，邀请朋友一起学习',
        rewards: { coins: 500, experience: 1000 }
      },
      {
        id: 'perfectionist',
        name: '完美主义者',
        description: '在所有场景中都获得满分',
        icon: '💎',
        unlocked: false,
        progress: 30,
        progressText: '3/10 场景',
        hint: '仔细分析每个场景，做出最优决策',
        rewards: { coins: 1000, experience: 2000 }
      }
    ];
  },

  /**
   * Get mock leaderboard data
   */
  getMockLeaderboard() {
    return [
      {
        rank: 1,
        username: '决策大师',
        score: 2850,
        completedGames: 42,
        winRate: 89,
        change: 0,
        tier: 'Diamond',
        isCurrentUser: false
      },
      {
        rank: 2,
        username: '思维高手',
        score: 2720,
        completedGames: 38,
        winRate: 85,
        change: 1,
        tier: 'Diamond',
        isCurrentUser: false
      },
      {
        rank: 3,
        username: '认知先锋',
        score: 2650,
        completedGames: 45,
        winRate: 82,
        change: -1,
        tier: 'Platinum',
        isCurrentUser: false
      },
      {
        rank: 4,
        username: '理性思考者',
        score: 2580,
        completedGames: 35,
        winRate: 88,
        change: 2,
        tier: 'Platinum',
        isCurrentUser: false
      },
      {
        rank: 5,
        username: '系统分析师',
        score: 2420,
        completedGames: 40,
        winRate: 80,
        change: -2,
        tier: 'Gold',
        isCurrentUser: false
      },
      {
        rank: 12,
        username: '认知探索者',
        score: 1850,
        completedGames: 18,
        winRate: 75,
        change: 3,
        tier: 'Silver',
        isCurrentUser: true
      }
    ];
  },
};

// Toast Manager
const ToastManager = {
  /**
   * Show toast notification
   */
  show(message, type = 'info', title = '') {
    const toast = this.createToast(message, type, title);
    DOM.toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto hide
    setTimeout(() => {
      this.hide(toast);
    }, APP_CONFIG.toastDuration);

    return toast;
  },

  /**
   * Show success toast
   */
  showSuccess(message, title = '成功') {
    return this.show(message, 'success', title);
  },

  /**
   * Show error toast
   */
  showError(message, title = '错误') {
    return this.show(message, 'error', title);
  },

  /**
   * Show warning toast
   */
  showWarning(message, title = '警告') {
    return this.show(message, 'warning', title);
  },

  /**
   * Show info toast
   */
  showInfo(message, title = '提示') {
    return this.show(message, 'info', title);
  },

  /**
   * Create toast element
   */
  createToast(message, type, title) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        ${title ? `<h4 class="toast-title">${title}</h4>` : ''}
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close" onclick="ToastManager.hide(this.parentElement)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
        </svg>
      </button>
    `;

    return toast;
  },

  /**
   * Get icon for toast type
   */
  getIcon(type) {
    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>',
    };
    return icons[type] || icons.info;
  },

  /**
   * Hide toast
   */
  hide(toast) {
    if (!toast) return;

    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, APP_CONFIG.animationDuration);
  },
};

// Sync Manager
const SyncManager = {
  /**
   * Initialize sync functionality
   */
  init() {
    DOM.syncButton = document.getElementById('sync-button');

    if (DOM.syncButton) {
      DOM.syncButton.addEventListener('click', () => this.sync());
    }

    // Auto sync every 30 seconds
    setInterval(() => {
      if (AppState.isOnline) {
        this.autoSync();
      }
    }, APP_CONFIG.syncInterval);

    // Listen for online/offline events
    window.addEventListener('online', () => {
      AppState.isOnline = true;
      this.sync();
    });

    window.addEventListener('offline', () => {
      AppState.isOnline = false;
      ToastManager.showWarning('网络连接已断开，将使用离线模式');
    });
  },

  /**
   * Manual sync
   */
  async sync() {
    if (!AppState.isOnline) {
      ToastManager.showWarning('网络连接不可用');
      return;
    }

    if (AppState.syncStatus === 'syncing') {
      return;
    }

    this.setSyncStatus('syncing');

    try {
      await this.uploadLocalData();
      await this.downloadRemoteData();

      this.setSyncStatus('success');
      ToastManager.showSuccess('数据同步完成');
    } catch (error) {
      console.error('Sync failed:', error);
      this.setSyncStatus('error');
      ToastManager.showError('数据同步失败，请稍后重试');
    }
  },

  /**
   * Auto sync (background)
   */
  async autoSync() {
    if (AppState.syncStatus === 'syncing') {
      return;
    }

    try {
      await this.uploadLocalData();
      await this.downloadRemoteData();

      if (this.hasPendingChanges()) {
        this.setSyncStatus('success');
      }
    } catch (error) {
      console.error('Auto sync failed:', error);
      // Don't show error toast for auto sync failures
    }
  },

  /**
   * Upload local data to server
   */
  async uploadLocalData() {
    const localData = this.getLocalData();

    if (Object.keys(localData).length === 0) {
      return;
    }

    await ApiService.sync.upload(localData);

    // Clear local data after successful upload
    this.clearLocalData();
  },

  /**
   * Download remote data from server
   */
  async downloadRemoteData() {
    const lastSync = Utils.storage.get('lastSyncTime');
    const remoteData = await ApiService.sync.download(lastSync);

    if (remoteData && Object.keys(remoteData).length > 0) {
      this.mergeRemoteData(remoteData);
      Utils.storage.set('lastSyncTime', new Date().toISOString());
    }
  },

  /**
   * Get local pending data
   */
  getLocalData() {
    return Utils.storage.get('pendingSync') || {};
  },

  /**
   * Clear local pending data
   */
  clearLocalData() {
    Utils.storage.remove('pendingSync');
  },

  /**
   * Check if there are pending changes
   */
  hasPendingChanges() {
    const pendingData = this.getLocalData();
    return Object.keys(pendingData).length > 0;
  },

  /**
   * Merge remote data with local data
   */
  mergeRemoteData(remoteData) {
    // Implementation depends on data structure
    console.log('Merging remote data:', remoteData);
  },

  /**
   * Set sync status
   */
  setSyncStatus(status) {
    AppState.syncStatus = status;

    if (DOM.syncButton) {
      DOM.syncButton.className = `sync-button ${status}`;

      const icons = {
        idle: '',
        syncing: 'syncing',
        success: 'success',
        error: 'error',
      };

      // Update button appearance based on status
      DOM.syncButton.classList.toggle('syncing', status === 'syncing');
    }
  },

  /**
   * Add data to sync queue
   */
  queueForSync(data) {
    const pendingData = this.getLocalData();
    const updatedData = { ...pendingData, ...data };
    Utils.storage.set('pendingSync', updatedData);

    if (AppState.isOnline) {
      this.sync();
    }
  },
};

// Game Manager
const GameManager = {
  /**
   * Start scenario
   */
  startScenario(scenarioId) {
    try {
      console.log('Starting scenario:', scenarioId);
      ToastManager.showInfo('正在启动游戏...');

      // 直接使用静态数据创建游戏会话
      AppState.gameSession = {
        gameId: 'static-' + Date.now(),
        scenarioId: scenarioId
      };

      // 从静态数据加载游戏内容
      this.loadStaticGameContent(scenarioId);

      // 显示游戏界面
      this.showGameModal();

      ToastManager.showSuccess('游戏启动成功！');

    } catch (error) {
      console.error('Failed to start scenario:', error);
      ToastManager.showError(`启动游戏失败: ${error.message}`);

      // Even on error, try to show the modal with fallback content
      try {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
          gameContainer.innerHTML = this.getMockGameContent();
        }
        this.showGameModal();
        ToastManager.showInfo('游戏启动（离线模式）');
      } catch (modalError) {
        console.error('Failed to show modal:', modalError);
        ToastManager.showError('无法启动游戏');
      }
    } finally {
      AppState.isLoading = false;
    }
  },

  /**
   * Load static game content (no API calls)
   */
  loadStaticGameContent(scenarioId) {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    // 从静态数据获取场景内容
    const scenarios = PageManager.getMockScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);

    if (scenario && scenario.content) {
      gameContainer.innerHTML = this.renderStaticGameContent(scenario);
      // 初始化游戏状态
      this.initializeStaticGame(scenario);
    } else {
      console.error('Scenario not found:', scenarioId);
      gameContainer.innerHTML = '<div class="error">场景内容未找到</div>';
    }
  },

  /**
   * Load game content (legacy)
   */
  async loadGameContent(scenarioId) {
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
  },

  /**
   * Show game modal
   */
  showGameModal() {
    const modal = document.getElementById('game-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  /**
   * Hide game modal
   */
  hideGameModal() {
    const modal = document.getElementById('game-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    AppState.gameSession = null;
  },

  /**
   * Execute game turn
   */
  async executeTurn(decisions) {
    if (!AppState.gameSession) {
      throw new Error('No active game session');
    }

    try {
      console.log('Executing turn:', decisions);
      const result = await ApiService.games.executeTurn(
        AppState.gameSession.gameId,
        decisions
      );

      console.log('Turn result:', result);

      if (!result.success) {
        throw new Error(result.message || '执行决策失败');
      }

      // Update game state
      this.updateGameState(result);

      // Queue for sync
      SyncManager.queueForSync({
        gameTurn: {
          gameId: AppState.gameSession.gameId,
          decisions,
          result,
          timestamp: new Date().toISOString(),
        },
      });

      return result;
    } catch (error) {
      console.error('Failed to execute turn:', error);
      throw error;
    }
  },

  /**
   * Update game state
   */
  updateGameState(result) {
    // Update UI with new game state
    const turnElement = document.getElementById('current-turn');
    const feedbackElement = document.getElementById('turn-feedback');

    if (turnElement) {
      turnElement.textContent = `第 ${result.turnNumber} 回合`;
    }

    if (feedbackElement) {
      feedbackElement.textContent = result.feedback;
    }
  },

  /**
   * Get device info
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      isMobile: Utils.isMobile(),
    };
  },

  /**
   * Render static game content
   */
  renderStaticGameContent(scenario) {
    const content = scenario.content;
    if (!content) return '<div class="error">场景内容未找到</div>';

    return `
      <div class="game-header">
        <h2>${scenario.name}</h2>
        <p>第 <span id="current-round">1</span> / ${content.rounds.length} 回合</p>
      </div>
      <div class="game-content">
        <div class="scenario-intro">
          <h3>场景介绍</h3>
          <p>${content.introduction}</p>
        </div>
        <div id="round-container" class="round-container">
          <!-- 当前回合内容将在这里渲染 -->
        </div>
        <div id="round-feedback" class="round-feedback" style="display: none;">
          <!-- 回合反馈将在这里显示 -->
        </div>
        <div id="scenario-conclusion" class="scenario-conclusion" style="display: none;">
          <h3>场景总结</h3>
          <p>${content.conclusion}</p>
        </div>
      </div>
      <div class="game-actions">
        <button id="submit-decision" class="btn btn-primary" onclick="GameManager.submitDecision()">
          提交决策
        </button>
        <button id="next-round" class="btn btn-outline" onclick="GameManager.nextRound()" style="display: none;">
          下一回合
        </button>
        <button class="btn btn-outline" onclick="GameManager.hideGameModal()">
          退出游戏
        </button>
      </div>
    `;
  },

  /**
   * Initialize static game
   */
  initializeStaticGame(scenario) {
    // 初始化游戏状态
    AppState.currentGame = {
      scenario: scenario,
      currentRound: 0,
      decisions: [],
      scores: {}
    };

    // 显示第一个回合
    this.showRound(0);
  },

  /**
   * Show current round
   */
  showRound(roundIndex) {
    const game = AppState.currentGame;
    const round = game.scenario.content.rounds[roundIndex];

    const roundContainer = document.getElementById('round-container');
    const feedbackContainer = document.getElementById('round-feedback');
    const conclusionContainer = document.getElementById('scenario-conclusion');
    const submitBtn = document.getElementById('submit-decision');
    const nextBtn = document.getElementById('next-round');
    const currentRoundSpan = document.getElementById('current-round');

    if (!round) return;

    // 隐藏反馈和结论
    feedbackContainer.style.display = 'none';
    conclusionContainer.style.display = 'none';

    // 更新回合数
    currentRoundSpan.textContent = roundIndex + 1;

    // 渲染回合内容
    roundContainer.innerHTML = `
      <div class="round-content">
        <h3>回合 ${roundIndex + 1}: ${round.title}</h3>
        <div class="round-description">
          <p>${round.description}</p>
        </div>
        <div class="round-question">
          <h4>${round.question}</h4>
          <div class="options">
            ${round.options.map((option, index) => `
              <div class="option">
                <label>
                  <input type="radio" name="decision" value="${option.value}" data-index="${index}">
                  <span class="option-text">${option.text}</span>
                </label>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // 显示/隐藏按钮
    submitBtn.style.display = 'inline-block';
    nextBtn.style.display = 'none';
  },

  /**
   * Submit decision
   */
  submitDecision() {
    const selectedOption = document.querySelector('input[name="decision"]:checked');
    if (!selectedOption) {
      ToastManager.showWarning('请选择一个选项');
      return;
    }

    const game = AppState.currentGame;
    const round = game.scenario.content.rounds[game.currentRound];
    const optionIndex = parseInt(selectedOption.dataset.index);
    const selectedOptionData = round.options[optionIndex];

    // 保存决策
    game.decisions.push({
      round: game.currentRound + 1,
      decision: selectedOptionData.value,
      impact: selectedOptionData.impact
    });

    // 显示反馈
    this.showFeedback(round, selectedOptionData);
  },

  /**
   * Show feedback
   */
  showFeedback(round, selectedOption) {
    const feedbackContainer = document.getElementById('round-feedback');
    const submitBtn = document.getElementById('submit-decision');
    const nextBtn = document.getElementById('next-round');

    feedbackContainer.innerHTML = `
      <div class="feedback-content">
        <h4>决策反馈</h4>
        <p><strong>您的选择：</strong>${selectedOption.text}</p>
        <p><strong>分析：</strong>${round.explanation}</p>
        <div class="impact-summary">
          <h5>影响评估：</h5>
          <ul>
            ${Object.entries(selectedOption.impact).map(([key, value]) => `
              <li>${this.translateImpactKey(key)}: ${value}/100</li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    feedbackContainer.style.display = 'block';
    submitBtn.style.display = 'none';

    const game = AppState.currentGame;
    if (game.currentRound < game.scenario.content.rounds.length - 1) {
      nextBtn.style.display = 'inline-block';
    } else {
      // 显示结论
      this.showConclusion();
    }
  },

  /**
   * Show conclusion
   */
  showConclusion() {
    const conclusionContainer = document.getElementById('scenario-conclusion');
    const nextBtn = document.getElementById('next-round');

    conclusionContainer.style.display = 'block';
    nextBtn.style.display = 'none';

    // 计算总分
    this.calculateFinalScore();
  },

  /**
   * Next round
   */
  nextRound() {
    const game = AppState.currentGame;
    game.currentRound++;
    this.showRound(game.currentRound);
  },

  /**
   * Calculate final score
   */
  calculateFinalScore() {
    const game = AppState.currentGame;
    const conclusionContainer = document.getElementById('scenario-conclusion');

    let totalScore = 0;
    let roundScores = [];

    game.decisions.forEach((decision, index) => {
      const round = game.scenario.content.rounds[index];
      const isCorrect = decision.decision === round.correctAnswer;
      const score = isCorrect ? 100 : 50;

      totalScore += score;
      roundScores.push(score);
    });

    const averageScore = Math.round(totalScore / roundScores.length);

    // 添加得分显示
    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'final-score';
    scoreDisplay.innerHTML = `
      <h4>最终得分：${averageScore}/100</h4>
      <p>回合得分：${roundScores.map((score, i) => `第${i+1}回合: ${score}`).join(', ')}</p>
    `;

    conclusionContainer.appendChild(scoreDisplay);
    ToastManager.showSuccess(`游戏完成！最终得分：${averageScore}/100`);
  },

  /**
   * Translate impact keys
   */
  translateImpactKey(key) {
    const translations = {
      service_quality: '服务质量',
      cost: '成本控制',
      employee_satisfaction: '员工满意度',
      cost_savings: '成本节约',
      storage_cost: '存储成本',
      freshness: '新鲜度',
      relationship_quality: '关系质量',
      personal_growth: '个人成长',
      communication_skill: '沟通技巧',
      trust_level: '信任水平',
      relationship_stress: '关系压力',
      emotional_wellbeing: '情绪健康',
      investment_return: '投资回报',
      risk_level: '风险水平',
      learning_value: '学习价值',
      portfolio_value: '投资组合价值',
      emotional_state: '情绪状态',
      decision_quality: '决策质量'
    };
    return translations[key] || key;
  },

  /**
   * Render game content (legacy)
   */
  renderGameContent(scenario) {
    return `
      <div class="game-header">
        <h2>${scenario.name}</h2>
        <p>第 <span id="current-turn">1</span> 回合</p>
      </div>
      <div class="game-content">
        <div class="scenario-description">
          <p>${scenario.description}</p>
        </div>
        <div class="game-controls">
          <!-- Game controls will be rendered based on scenario -->
        </div>
        <div id="turn-feedback" class="turn-feedback">
          <!-- Feedback will be shown here -->
        </div>
      </div>
      <div class="game-actions">
        <button class="btn btn-primary" onclick="GameManager.executeTurn({})">
          提交决策
        </button>
        <button class="btn btn-outline" onclick="GameManager.hideGameModal()">
          退出游戏
        </button>
      </div>
    `;
  },

  /**
   * Get mock game content based on scenarioId
   */
  getMockGameContent(scenarioId) {
    const scenarioConfigs = {
      'coffee-shop-linear-thinking': {
        title: '咖啡店经营挑战',
        description: '您经营着一家咖啡店，需要做出决策来提高客户满意度和盈利能力。',
        controls: [
          { id: 'staff-count', label: '员工数量', min: 1, max: 10, value: 3, unit: '人' },
          { id: 'marketing-spend', label: '营销投入', min: 0, max: 500, value: 100, unit: '元' }
        ]
      },
      'relationship-time-delay': {
        title: '恋爱关系时间延迟挑战',
        description: '在恋爱关系中体验时间延迟对决策的影响。每个决策的效果会在几回合后显现。',
        controls: [
          { id: 'communication-time', label: '沟通时间', min: 1, max: 5, value: 2, unit: '小时/天' },
          { id: 'emotional-investment', label: '情感投入', min: 0, max: 10, value: 5, unit: '分值' },
          { id: 'trust-building', label: '信任建设活动', min: 0, max: 3, value: 1, unit: '次/周' }
        ]
      },
      'investment-confirmation-bias': {
        title: '投资确认偏误挑战',
        description: '在投资决策中体验确认偏误如何影响您的判断。您倾向于寻找支持自己观点的信息。',
        controls: [
          { id: 'research-time', label: '研究时间', min: 1, max: 10, value: 3, unit: '小时' },
          { id: 'diversification', label: '投资多样化', min: 0, max: 100, value: 30, unit: '%' },
          { id: 'risk-tolerance', label: '风险承受度', min: 1, max: 10, value: 5, unit: '分值' }
        ]
      }
    };

    const config = scenarioConfigs[scenarioId] || scenarioConfigs['coffee-shop-linear-thinking'];

    const controlsHtml = config.controls.map(control => `
      <div class="form-group">
        <label class="form-label">${control.label}</label>
        <input type="range" class="form-input" min="${control.min}" max="${control.max}" value="${control.value}" id="${control.id}">
        <span>当前: <span id="${control.id.replace('-', '')}-value">${control.value}</span>${control.unit}</span>
      </div>
    `).join('');

    return `
      <div class="game-header">
        <h2>${config.title}</h2>
        <p>第 <span id="current-turn">1</span> 回合</p>
      </div>
      <div class="game-content">
        <div class="scenario-description">
          <p>${config.description}</p>
        </div>
        <div class="game-controls">
          ${controlsHtml}
        </div>
        <div id="turn-feedback" class="turn-feedback">
          <!-- Feedback will be shown here -->
        </div>
      </div>
      <div class="game-actions">
        <button class="btn btn-primary" onclick="GameManager.submitMockTurn('${scenarioId}')">
          提交决策
        </button>
        <button class="btn btn-outline" onclick="GameManager.hideGameModal()">
          退出游戏
        </button>
      </div>
    `;
  },

  /**
   * Submit mock turn (for demonstration)
   */
  async submitMockTurn() {
    const staffCount = document.getElementById('staff-count').value;
    const marketingSpend = document.getElementById('marketing-spend').value;

    const decisions = {
      staff_count: parseInt(staffCount),
      marketing_spend: parseInt(marketingSpend),
    };

    try {
      const result = await this.executeTurn(decisions);

      // Show feedback
      const feedbackElement = document.getElementById('turn-feedback');
      if (feedbackElement) {
        feedbackElement.innerHTML = `
          <div class="feedback-content">
            <h4>回合结果</h4>
            <p>${result.feedback || '决策已提交，系统正在分析结果...'}</p>
          </div>
        `;
      }

      ToastManager.showSuccess('决策提交成功');
    } catch (error) {
      ToastManager.showError('提交失败，请重试');
    }
  },

  /**
   * Show invitation modal
   */
  showInvitationModal() {
    const modal = document.getElementById('invitationModal');
    if (modal) {
      modal.classList.add('active');
      // 更新邀请统计
      this.updateInvitationStats();
      // 生成邀请链接和二维码
      this.generateInvitationLink();
    }
  },

  /**
   * Hide invitation modal
   */
  hideInvitationModal() {
    const modal = document.getElementById('invitationModal');
    if (modal) {
      modal.classList.remove('active');
    }
  },

  /**
   * Show share success modal
   */
  showShareSuccessModal() {
    const modal = document.getElementById('shareSuccessModal');
    if (modal) {
      modal.classList.add('active');
    }
  },

  /**
   * Hide share success modal
   */
  hideShareSuccessModal() {
    const modal = document.getElementById('shareSuccessModal');
    if (modal) {
      modal.classList.remove('active');
    }
  },

  /**
   * Update invitation statistics
   */
  updateInvitationStats() {
    // 模拟邀请统计数据
    const stats = {
      invitedCount: 3,
      joinedCount: 2,
      rewards: {
        coins: 60,
        experience: 150
      }
    };

    const statsElements = {
      invitedCount: document.querySelector('[data-stats="invitedCount"]'),
      joinedCount: document.querySelector('[data-stats="joinedCount"]'),
      rewardCoins: document.querySelector('[data-stats="rewardCoins"]'),
      rewardExp: document.querySelector('[data-stats="rewardExp"]')
    };

    if (statsElements.invitedCount) {
      statsElements.invitedCount.textContent = stats.invitedCount;
    }
    if (statsElements.joinedCount) {
      statsElements.joinedCount.textContent = stats.joinedCount;
    }
    if (statsElements.rewardCoins) {
      statsElements.rewardCoins.textContent = stats.rewards.coins;
    }
    if (statsElements.rewardExp) {
      statsElements.rewardExp.textContent = stats.rewards.experience;
    }
  },

  /**
   * Generate invitation link and QR code
   */
  generateInvitationLink() {
    // 生成邀请链接
    const invitationCode = this.generateInvitationCode();
    const invitationLink = `${window.location.origin}?invite=${invitationCode}`;

    const linkElement = document.getElementById('invitationLink');
    if (linkElement) {
      linkElement.value = invitationLink;
    }

    // 生成二维码（这里使用简单的占位符）
    this.generateQRCode(invitationLink);
  },

  /**
   * Generate invitation code
   */
  generateInvitationCode() {
    // 生成8位邀请码
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /**
   * Generate QR code
   */
  generateQRCode(text) {
    const qrContainer = document.getElementById('qrcode');
    if (!qrContainer) return;

    // 清空现有内容
    qrContainer.innerHTML = '';

    // 简单的二维码占位符（实际项目中应使用真正的二维码库）
    const qrPlaceholder = document.createElement('div');
    qrPlaceholder.className = 'qr-placeholder';
    qrPlaceholder.innerHTML = `
      <div class="qr-icon">📱</div>
      <p>扫码邀请</p>
      <small>${text.substring(0, 20)}...</small>
    `;
    qrContainer.appendChild(qrPlaceholder);
  },

  /**
   * Copy invitation link
   */
  copyInvitationLink() {
    const linkInput = document.getElementById('invitationLink');
    if (linkInput) {
      linkInput.select();
      document.execCommand('copy');
      ToastManager.showSuccess('邀请链接已复制');
    }
  },

  /**
   * Share to WeChat
   */
  shareToWeChat() {
    // 微信分享（实际项目中需要调用微信SDK）
    ToastManager.showInfo('请使用微信扫一扫功能分享');
  },

  /**
   * Share to WeChat Moments
   */
  shareToMoments() {
    // 朋友圈分享（实际项目中需要调用微信SDK）
    ToastManager.showInfo('请使用微信扫一扫功能分享到朋友圈');
  },

  /**
   * Download QR code
   */
  downloadQRCode() {
    // 下载二维码图片（占位符实现）
    ToastManager.showInfo('二维码下载功能开发中');
  },
};

// Application Initialization
const App = {
  /**
   * Initialize application
   */
  async init() {
    try {
      console.log('Initializing Dynamic Worlds v' + APP_CONFIG.version);

      // Cache DOM elements
      this.cacheDOMElements();

      // Hide loading screen
      this.hideLoadingScreen();

      // Initialize managers
      NavigationManager.init();
      SyncManager.init();

      // Setup event listeners
      this.setupEventListeners();

      // Check authentication
      await this.checkAuth();

      console.log('Application initialized successfully');

    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showErrorScreen(error);
    }
  },

  /**
   * Cache DOM elements
   */
  cacheDOMElements() {
    DOM.loadingScreen = document.getElementById('loading-screen');
    DOM.app = document.getElementById('app');
    DOM.toastContainer = document.getElementById('toast-container');
  },

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    if (DOM.loadingScreen) {
      // Reduce loading time for better E2E testing
      setTimeout(() => {
        DOM.loadingScreen.classList.add('hidden');
        setTimeout(() => {
          if (DOM.loadingScreen) {
            DOM.loadingScreen.style.display = 'none';
          }
        }, APP_CONFIG.animationDuration);
      }, 100); // Reduced from 1000ms to 100ms
    }
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Modal close button
    const modalClose = document.getElementById('close-modal');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        GameManager.hideGameModal();
      });
    }

    // Modal backdrop click
    const gameModal = document.getElementById('game-modal');
    if (gameModal) {
      gameModal.addEventListener('click', (e) => {
        if (e.target === gameModal) {
          GameManager.hideGameModal();
        }
      });
    }

    // Start journey button
    const startJourney = document.getElementById('start-journey');
    if (startJourney) {
      startJourney.addEventListener('click', () => {
        NavigationManager.navigateTo('scenarios');
      });
    }

    // Learn more button
    const learnMore = document.getElementById('learn-more');
    if (learnMore) {
      learnMore.addEventListener('click', () => {
        NavigationManager.navigateTo('about');
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        GameManager.hideGameModal();
      }
    });

    // Range input updates (for mock game)
    document.addEventListener('input', (e) => {
      if (e.target.id === 'staff-count') {
        const valueElement = document.getElementById('staff-value');
        if (valueElement) {
          valueElement.textContent = e.target.value;
        }
      }
      if (e.target.id === 'marketing-spend') {
        const valueElement = document.getElementById('marketing-value');
        if (valueElement) {
          valueElement.textContent = e.target.value;
        }
      }
    });

    // Invitation modal events
    const inviteButtons = document.querySelectorAll('[data-action="invite"]');
    inviteButtons.forEach(button => {
      button.addEventListener('click', () => {
        GameManager.showInvitationModal();
      });
    });

    // Close modal events
    const closeButtons = document.querySelectorAll('[data-action="close-modal"]');
    closeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Share button events
    const shareButtons = {
      'copy-link': () => GameManager.copyInvitationLink(),
      'wechat': () => GameManager.shareToWeChat(),
      'moments': () => GameManager.shareToMoments(),
      'download-qr': () => GameManager.downloadQRCode()
    };

    Object.entries(shareButtons).forEach(([action, handler]) => {
      const button = document.querySelector(`[data-share="${action}"]`);
      if (button) {
        button.addEventListener('click', handler);
      }
    });
  },

  /**
   * Check authentication
   */
  async checkAuth() {
    const token = Utils.storage.get('authToken');

    if (token) {
      try {
        // Verify token and get user info
        AppState.currentUser = this.getUserFromToken(token);
        console.log('User authenticated:', AppState.currentUser.username);
      } catch (error) {
        // Token invalid, remove it
        Utils.storage.remove('authToken');
        console.log('Invalid token, user needs to login');
      }
    } else {
      console.log('No authentication token found');
      // 尝试演示登录
      await this.tryDemoLogin();
    }
  },

  /**
   * Try demo login
   */
  async tryDemoLogin() {
    try {
      console.log('Attempting demo login...');
      const response = await ApiService.auth.demoLogin();

      if (response.success) {
        const token = response.access_token;
        Utils.storage.set('authToken', token);
        AppState.currentUser = response.user;
        console.log('Demo login successful:', response.user.username);
        ToastManager.showSuccess('演示登录成功');
      } else {
        console.log('Demo login failed:', response.message);
        ToastManager.showWarning('演示登录失败，请手动登录');
      }
    } catch (error) {
      console.error('Demo login error:', error);
      // 不显示错误，静默失败
    }
  },

  /**
   * Get user info from token
   */
  getUserFromToken(token) {
    // 简单的token解析（仅用于演示）
    if (token.startsWith('demo_token_')) {
      const userId = token.replace('demo_token_', '');
      return {
        id: parseInt(userId),
        username: 'demo_user',
        email: 'demo@example.com',
        is_premium: false,
        free_games_left: 5
      };
    }
    return null;
  },

  /**
   * Show error screen
   */
  showErrorScreen(error) {
    if (DOM.app) {
      DOM.app.innerHTML = `
        <div class="error-screen">
          <div class="error-content">
            <h1>应用启动失败</h1>
            <p>抱歉，应用启动时遇到了问题。</p>
            <details>
              <summary>错误详情</summary>
              <pre>${error.message}</pre>
            </details>
            <button class="btn btn-primary" onclick="window.location.reload()">
              重新加载
            </button>
          </div>
        </div>
      `;
    }
  },
};

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Make global functions available for inline event handlers
window.NavigationManager = NavigationManager;
window.GameManager = GameManager;
window.ToastManager = ToastManager;