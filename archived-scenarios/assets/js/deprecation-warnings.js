/**
 * 弃用警告工具
 * 为现有的window暴露添加警告
 * 提醒开发者使用新的EventBus系统
 */

const DeprecationWarnings = {
  // 已弃用的对象列表
  deprecated: new Set(),

  // 添加弃用警告
  warn(objectName, alternative = 'EventBus') {
    if (this.deprecated.has(objectName)) return;

    this.deprecated.add(objectName);

    const originalValue = window[objectName];

    if (originalValue !== undefined) {
      Object.defineProperty(window, objectName, {
        get() {
          if (!this._warned) {
            Logger?.warn(
              `[DEPRECATED] window.${objectName} is deprecated. ` +
              `Please use ${alternative} instead. ` +
              `See .qwen/P0_cleanup_plan.md for migration guide.`
            );
            this._warned = true;
          }
          return originalValue;
        },
        set(value) {
          if (!this._warned) {
            Logger?.warn(
              `[DEPRECATED] window.${objectName} is deprecated. ` +
              `Please use ${alternative} instead. ` +
              `See .qwen/P0_cleanup_plan.md for migration guide.`
            );
            this._warned = true;
          }
          originalValue = value;
        },
        configurable: true
      });
    }
  },

  // 批量添加弃用警告
  warnMultiple(objects) {
    objects.forEach(obj => {
      this.warn(obj.name, obj.alternative);
    });
  }
};

// 为已知的window对象添加弃用警告
document.addEventListener('DOMContentLoaded', () => {
  DeprecationWarnings.warnMultiple([
    { name: 'coffeeShopRouter', alternative: 'EventBus with data-action attributes' },
    { name: 'aiGovernanceRouter', alternative: 'EventBus with data-action attributes' },
    { name: 'AIGovernancePageRouter', alternative: 'Module imports' },
    { name: 'APIConfigManager', alternative: 'Module imports' },
    { name: 'APP_CONFIG', alternative: 'Module imports' },
    { name: 'ApiService', alternative: 'Module imports' },
    { name: 'PerformanceMonitor', alternative: 'Module imports' },
    { name: 'AppState', alternative: 'Module imports' },
    { name: 'NavigationManager', alternative: 'Module imports' },
    { name: 'GameManager', alternative: 'Module imports' },
    { name: 'ToastManager', alternative: 'Module imports' },
    { name: 'PersonalizedLearningEngine', alternative: 'Module imports' }
  ]);
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeprecationWarnings;
}
