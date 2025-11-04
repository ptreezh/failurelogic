/**
 * Dynamic Worlds - Optimized Main Application JavaScript
 * 认知陷阱教育平台前端应用 - 性能优化版本
 */

// Include API Configuration Manager
// Ensure APIConfigManager is loaded first

// Application Configuration - Optimized
const APP_CONFIG = {
  // API Configuration handled by APIConfigManager
  version: '2.1.0',
  debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  animationDuration: 300,
  toastDuration: 5000,
  syncInterval: 30000,

  // Performance optimization settings
  performance: {
    enableCaching: true,
    enablePreloading: true,
    enableServiceWorker: true,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    imageOptimization: true
  },

  // UI/UX improvements
  ui: {
    enableAnimations: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    enableDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    mobileBreakpoint: 768
  }
};

// Application State - Enhanced
const AppState = {
  currentUser: null,
  currentScenario: null,
  currentPage: 'home',
  isLoading: false,
  isOnline: navigator.onLine,
  syncStatus: 'idle',
  gameSession: null,

  // Performance state
  performanceMetrics: {
    pageLoadTime: 0,
    apiResponseTime: 0,
    errorCount: 0,
    lastSyncTime: null
  },

  // Cache state
  cacheState: {
    scenarios: null,
    scenariosTimestamp: 0,
    userProfile: null,
    userProfileTimestamp: 0
  }
};

// DOM Elements Cache - Enhanced
const DOM = {
  loadingScreen: null,
  app: null,
  navItems: null,
  pages: null,
  syncButton: null,
  gameModal: null,
  toastContainer: null,
  performanceIndicator: null
};

// Utility Functions - Enhanced
const Utils = {
  formatDate(date) {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  },

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

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

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

  isMobile() {
    return window.innerWidth <= APP_CONFIG.ui.mobileBreakpoint;
  },

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  },

  // Performance utilities
  measurePerformance(name, fn) {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();

    if (APP_CONFIG.debug) {
      console.log(`Performance: ${name} took ${endTime - startTime} milliseconds`);
    }

    AppState.performanceMetrics[`${name}Time`] = endTime - startTime;
    return result;
  },

  // Network utilities
  async preloadCriticalResources() {
    const criticalResources = [
      '/scenarios/',
      '/users/profile'
    ];

    const preloadPromises = criticalResources.map(async (endpoint) => {
      try {
        await ApiService.get(endpoint);
      } catch (error) {
        // Silent fail for preloading
      }
    });

    await Promise.allSettled(preloadPromises);
  }
};

// Mock Data - Simplified and cleaned
const MockData = {
  '/scenarios/': {
    scenarios: [
      {
        id: 'coffee-shop-linear-thinking',
        name: '咖啡店经营陷阱',
        description: '体验线性思维在复杂系统中的局限',
        difficulty: 'beginner',
        duration: '15-20分钟',
        cognitiveBias: '线性思维',
        category: '商业决策'
      },
      {
        id: 'investment-confirmation-bias',
        name: '投资确认偏误',
        description: '认识确认偏误对投资决策的影响',
        difficulty: 'intermediate',
        duration: '20-25分钟',
        cognitiveBias: '确认偏误',
        category: '金融决策'
      },
      {
        id: 'relationship-time-delay',
        name: '恋爱关系时间延迟',
        description: '理解时间延迟对人际关系的影响',
        difficulty: 'advanced',
        duration: '25-30分钟',
        cognitiveBias: '时间延迟',
        category: '人际关系'
      }
    ]
  }
};

// Initialize API Configuration Manager
const apiConfig = new APIConfigManager({
  timeout: 5000,
  maxRetries: 3,
  healthCheckInterval: 30000
});

// Enhanced API Service with intelligent caching and performance optimization
const ApiService = {
  cache: new Map(),
  cacheTimeout: 5 * 60 * 1000, // 5 minutes cache
  cacheMaxSize: 100, // Maximum cache entries

  async request(endpoint, options = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const method = options.method || 'GET';

    // Check cache for GET requests
    if (method === 'GET' && APP_CONFIG.performance.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        if (APP_CONFIG.debug) {
          console.log(`📦 Cache hit for: ${endpoint}`);
        }
        return cached.data;
      }
    }

    // Add auth token if available
    const token = Utils.storage.get('authToken');
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
      };
    }

    const startTime = performance.now();

    try {
      const data = await apiConfig.request(endpoint, options);

      // Update performance metrics
      const responseTime = performance.now() - startTime;
      AppState.performanceMetrics.apiResponseTime = responseTime;

      // Cache successful GET responses
      if (method === 'GET' && APP_CONFIG.performance.enableCaching) {
        this.setCache(cacheKey, data);
      }

      if (APP_CONFIG.debug) {
        console.log(`✅ API success: ${endpoint} (${Math.round(responseTime)}ms)`);
      }

      return data;
    } catch (error) {
      // Update error metrics
      AppState.performanceMetrics.errorCount++;
      console.error(`❌ API failed: ${endpoint} - ${error.message}`);

      // Fallback to mock data in debug mode or offline
      const mockData = MockData[endpoint];
      if (mockData && (APP_CONFIG.debug || !AppState.isOnline)) {
        console.warn(`🔄 Using mock data for: ${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
        return mockData;
      }

      throw error;
    }
  },

  setCache(key, data) {
    // Manage cache size
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  },

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  },

  clearCache(endpoint = null) {
    if (endpoint) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(endpoint)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  },

  getMetrics() {
    return {
      ...apiConfig.getMetrics(),
      cacheSize: this.cache.size,
      cacheMaxSize: this.cacheMaxSize,
      appMetrics: AppState.performanceMetrics
    };
  },

  // API Endpoints - Updated with correct paths
  scenarios: {
    getAll: () => ApiService.get('/scenarios/'),
    getById: (id) => ApiService.get(`/scenarios/${id}`),
    create: (data) => ApiService.post('/scenarios/', data),
    createGameSession: (scenarioId) => ApiService.post(`/scenarios/create_game_session?scenario_id=${scenarioId}`),
  },

  games: {
    executeTurn: (gameId, decisions) =>
      ApiService.post(`/scenarios/${gameId}/turn`, { user_id: 1, decisions }),
    getAnalysis: (gameId) => ApiService.get(`/scenarios/${gameId}/analysis`),
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

// Performance Monitor
const PerformanceMonitor = {
  init() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      AppState.performanceMetrics.pageLoadTime = loadTime;

      if (APP_CONFIG.debug) {
        console.log(`Page load time: ${loadTime}ms`);
      }
    });

    // Monitor API performance
    setInterval(() => {
      const metrics = ApiService.getMetrics();
      if (APP_CONFIG.debug) {
        console.log('API Performance Metrics:', metrics);
      }
    }, 30000);
  },

  getMetrics() {
    return {
      ...AppState.performanceMetrics,
      memoryUsage: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null,
      connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    };
  }
};

// Export for global scope (for development/debugging)
if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
  window.ApiService = ApiService;
  window.PerformanceMonitor = PerformanceMonitor;
  window.AppState = AppState;
}

// Initialize performance monitoring
PerformanceMonitor.init();