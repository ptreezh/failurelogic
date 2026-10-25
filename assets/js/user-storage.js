/**
 * User Storage Manager
 * 本地用户数据存储管理
 * 无需登录注册，自动管理用户数据
 */

const UserStorage = {
  // 存储键名
  KEYS: {
    USER_PROFILE: 'cognitive_trap_user_profile',
    GAME_PROGRESS: 'cognitive_trap_game_progress',
    LEARNING_PATH: 'cognitive_trap_learning_path',
    SETTINGS: 'cognitive_trap_settings',
    SESSION_ID: 'cognitive_trap_session_id'
  },

  // 初始化
  init() {
    this.ensureUserExists();
    Logger?.info('UserStorage', 'Initialized');
  },

  // 确保用户存在（首次访问自动创建）
  ensureUserExists() {
    if (!this.getUserProfile()) {
      this.createUserProfile();
      Logger?.info('UserStorage', 'New user profile created');
    }
  },

  // 创建用户画像
  createUserProfile() {
    const profile = {
      id: this.generateUserId(),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      totalSessions: 1,
      totalPlayTime: 0,
      cognitiveBiases: {
        identified: [],
        mastered: [],
        struggling: []
      },
      preferences: {
        difficulty: 'auto',
        language: 'zh-CN',
        theme: 'light'
      },
      statistics: {
        scenariosCompleted: 0,
        decisionsMade: 0,
        awakeningMoments: 0,
        averageBiasScore: 0
      }
    };

    localStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(profile));
    return profile;
  },

  // 获取用户画像
  getUserProfile() {
    try {
      const data = localStorage.getItem(this.KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      Logger?.error('UserStorage', 'Failed to get user profile', e);
      return null;
    }
  },

  // 更新用户画像
  updateUserProfile(updates) {
    const profile = this.getUserProfile();
    if (!profile) {
      return this.createUserProfile();
    }

    const updated = { ...profile, ...updates };
    updated.lastActiveAt = new Date().toISOString();
    updated.totalSessions = (profile.totalSessions || 0) + 1;

    localStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(updated));
    return updated;
  },

  // 获取游戏进度
  getGameProgress() {
    try {
      const data = localStorage.getItem(this.KEYS.GAME_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      Logger?.error('UserStorage', 'Failed to get game progress', e);
      return {};
    }
  },

  // 保存游戏进度
  saveGameProgress(progress) {
    try {
      localStorage.setItem(this.KEYS.GAME_PROGRESS, JSON.stringify(progress));
      Logger?.debug('UserStorage', 'Game progress saved');
    } catch (e) {
      Logger?.error('UserStorage', 'Failed to save game progress', e);
    }
  },

  // 获取学习路径
  getLearningPath() {
    try {
      const data = localStorage.getItem(this.KEYS.LEARNING_PATH);
      return data ? JSON.parse(data) : { currentLevel: 1, completedScenarios: [] };
    } catch (e) {
      Logger?.error('UserStorage', 'Failed to get learning path', e);
      return { currentLevel: 1, completedScenarios: [] };
    }
  },

  // 保存学习路径
  saveLearningPath(path) {
    try {
      localStorage.setItem(this.KEYS.LEARNING_PATH, JSON.stringify(path));
      Logger?.debug('UserStorage', 'Learning path saved');
    } catch (e) {
      Logger?.error('UserStorage', 'Failed to save learning path', e);
    }
  },

  // 获取设置
  getSettings() {
    try {
      const data = localStorage.getItem(this.KEYS.SETTINGS);
      return data ? JSON.parse(data) : { difficulty: 'auto', theme: 'light' };
    } catch (e) {
      Logger?.error('UserStorage', 'Failed to get settings', e);
      return { difficulty: 'auto', theme: 'light' };
    }
  },

  // 保存设置
  saveSettings(settings) {
    try {
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      Logger?.error('UserStorage', 'Failed to save settings', e);
    }
  },

  // 生成用户ID
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // 清除所有数据（用户请求时）
  clearAllData() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    Logger?.warn('UserStorage', 'All user data cleared');
  },

  // 导出数据（用户备份）
  exportData() {
    return {
      profile: this.getUserProfile(),
      gameProgress: this.getGameProgress(),
      learningPath: this.getLearningPath(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString()
    };
  },

  // 导入数据（用户恢复）
  importData(data) {
    try {
      if (data.profile) {
        localStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(data.profile));
      }
      if (data.gameProgress) {
        localStorage.setItem(this.KEYS.GAME_PROGRESS, JSON.stringify(data.gameProgress));
      }
      if (data.learningPath) {
        localStorage.setItem(this.KEYS.LEARNING_PATH, JSON.stringify(data.learningPath));
      }
      if (data.settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      Logger?.info('UserStorage', 'Data imported successfully');
      return true;
    } catch (e) {
      Logger?.error('UserStorage', 'Failed to import data', e);
      return false;
    }
  },

  // 记录场景完成
  recordScenarioCompletion(scenarioId, biasScore) {
    const profile = this.getUserProfile();
    if (!profile) return;

    profile.statistics.scenariosCompleted = (profile.statistics.scenariosCompleted || 0) + 1;
    profile.statistics.decisionsMade = (profile.statistics.decisionsMade || 0) + 10; // 假设每场景10个决策

    // 更新平均偏差分数
    const totalScore = (profile.statistics.averageBiasScore * (profile.statistics.scenariosCompleted - 1)) + biasScore;
    profile.statistics.averageBiasScore = totalScore / profile.statistics.scenariosCompleted;

    this.updateUserProfile(profile);
  },

  // 记录觉醒时刻
  recordAwakeningMoment() {
    const profile = this.getUserProfile();
    if (!profile) return;

    profile.statistics.awakeningMoments = (profile.statistics.awakeningMoments || 0) + 1;
    this.updateUserProfile(profile);
  },

  // 添加已识别的认知偏差
  addIdentifiedBias(biasType) {
    const profile = this.getUserProfile();
    if (!profile) return;

    if (!profile.cognitiveBiases.identified.includes(biasType)) {
      profile.cognitiveBiases.identified.push(biasType);
      this.updateUserProfile(profile);
    }
  }
};

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => UserStorage.init());
} else {
  UserStorage.init();
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserStorage;
}
