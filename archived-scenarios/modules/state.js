// 极简应用状态管理
const AppState = {
  currentUser: null,
  currentScenario: null,
  currentPage: 'home',
  isLoading: false,
  userPreferences: {
    difficulty: 'beginner'
  },
  scenarios: []
};

// API服务简化版
const ApiService = {
  configManager: new APIConfigManager({
    timeout: 10000,
    maxRetries: 3
  }),

  async fetchScenarios() {
    try {
      // 尝试从API获取场景，如果失败则使用模拟数据
      const response = await this.configManager.request('/scenarios/');
      if (response && Array.isArray(response.scenarios)) {
        return response.scenarios;
      }
    } catch (error) {
      console.warn('API请求失败，使用模拟数据:', error);
    }
    
    // 模拟数据
    return [
      {
        id: "coffee-shop",
        name: "咖啡店经营",
        description: "体验线性思维在商业决策中的局限性",
        difficulty: "beginner"
      },
      {
        id: "relationship",
        name: "恋爱关系",
        description: "理解时间延迟对决策的影响",
        difficulty: "intermediate"
      },
      {
        id: "investment",
        name: "投资决策",
        description: "认识确认偏误如何影响风险判断",
        difficulty: "advanced"
      }
    ];
  }
};