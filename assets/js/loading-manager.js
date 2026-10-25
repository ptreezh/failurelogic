/**
 * LoadingManager - 加载状态管理
 * 统一管理所有加载状态，提升用户体验
 */

const LoadingManager = {
  // 加载状态存储
  loadingStates: new Map(),

  /**
   * 显示加载状态
   * @param {string} targetId - 目标元素ID
   * @param {Object} options - 配置选项
   */
  show(targetId, options = {}) {
    const {
      message = '加载中...',
      type = 'spinner', // spinner, skeleton, progress
      progress = 0
    } = options;

    const target = document.getElementById(targetId);
    if (!target) {
      Logger?.warn(`LoadingManager: Target element "${targetId}" not found`);
      return;
    }

    // 记录加载状态
    this.loadingStates.set(targetId, { startTime: Date.now(), ...options });

    // 添加加载状态类
    target.classList.add('loading');
    target.setAttribute('aria-busy', 'true');
    target.setAttribute('aria-label', message);

    // 根据类型显示不同的加载状态
    switch (type) {
      case 'spinner':
        this._showSpinner(target, message);
        break;
      case 'skeleton':
        this._showSkeleton(target, message);
        break;
      case 'progress':
        this._showProgress(target, message, progress);
        break;
    }

    Logger?.debug(`LoadingManager: Show loading for "${targetId}"`);
  },

  /**
   * 隐藏加载状态
   * @param {string} targetId - 目标元素ID
   */
  hide(targetId) {
    const target = document.getElementById(targetId);
    if (!target) {
      Logger?.warn(`LoadingManager: Target element "${targetId}" not found`);
      return;
    }

    // 移除加载状态
    target.classList.remove('loading');
    target.removeAttribute('aria-busy');
    target.removeAttribute('aria-label');

    // 移除加载状态元素
    const loadingEl = target.querySelector('.loading-overlay, .skeleton-loader, .progress-bar');
    if (loadingEl) {
      loadingEl.remove();
    }

    // 记录加载时长
    const state = this.loadingStates.get(targetId);
    if (state) {
      const duration = Date.now() - state.startTime;
      Logger?.debug(`LoadingManager: Hide loading for "${targetId}" (${duration}ms)`);
      this.loadingStates.delete(targetId);
    }
  },

  /**
   * 更新进度
   * @param {string} targetId - 目标元素ID
   * @param {number} progress - 进度（0-100）
   */
  updateProgress(targetId, progress) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const progressBar = target.querySelector('.progress-bar-fill');
    const progressText = target.querySelector('.progress-text');

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    if (progressText) {
      progressText.textContent = `${Math.round(progress)}%`;
    }

    // 更新状态
    const state = this.loadingStates.get(targetId);
    if (state) {
      state.progress = progress;
    }
  },

  /**
   * 显示旋转加载指示器
   * @private
   */
  _showSpinner(target, message) {
    // 移除已存在的加载元素
    const existing = target.querySelector('.loading-overlay');
    if (existing) existing.remove();

    // 创建加载覆盖层
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    HTMLSanitizer?.setInnerHTML(overlay, `)
      <div class="loading-spinner"></div>
      <p class="loading-message">${message}</p>
    `;
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      z-index: 100;
    `;

    target.style.position = 'relative';
    target.appendChild(overlay);
  },

  /**
   * 显示骨架屏
   * @private
   */
  _showSkeleton(target, message) {
    // 移除已存在的加载元素
    const existing = target.querySelector('.skeleton-loader');
    if (existing) existing.remove();

    // 创建骨架屏
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-loader';
    HTMLSanitizer?.setInnerHTML(skeleton, `)
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line skeleton-short"></div>
    `;
    skeleton.style.cssText = `
      padding: 20px;
    `;

    target.style.opacity = '0.5';
    target.insertBefore(skeleton, target.firstChild);
  },

  /**
   * 显示进度条
   * @private
   */
  _showProgress(target, message, progress) {
    // 移除已存在的加载元素
    const existing = target.querySelector('.progress-bar-container');
    if (existing) existing.remove();

    // 创建进度条
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-bar-container';
    HTMLSanitizer?.setInnerHTML(progressContainer, `)
      <p class="loading-message">${message}</p>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width: ${progress}%"></div>
      </div>
      <p class="progress-text">${Math.round(progress)}%</p>
    `;
    progressContainer.style.cssText = `
      padding: 20px;
      text-align: center;
    `;

    target.style.position = 'relative';
    target.insertBefore(progressContainer, target.firstChild);
  },

  /**
   * 获取加载状态
   * @param {string} targetId - 目标元素ID
   * @returns {Object|null} 加载状态
   */
  getState(targetId) {
    return this.loadingStates.get(targetId) || null;
  },

  /**
   * 检查是否正在加载
   * @param {string} targetId - 目标元素ID
   * @returns {boolean} 是否正在加载
   */
  isLoading(targetId) {
    return this.loadingStates.has(targetId);
  },

  /**
   * 清除所有加载状态
   */
  clearAll() {
    for (const targetId of this.loadingStates.keys()) {
      this.hide(targetId);
    }
    this.loadingStates.clear();
    Logger?.debug('LoadingManager: All loading states cleared');
  },

  /**
   * 获取加载统计
   * @returns {Object} 加载统计
   */
  getStats() {
    const stats = {
      active: this.loadingStates.size,
      total: 0,
      avgDuration: 0
    };

    // 这里可以添加更详细的统计
    return stats;
  }
};

// 自动清理页面卸载时的加载状态
window.addEventListener('beforeunload', () => {
  LoadingManager.clearAll();
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingManager;
}
