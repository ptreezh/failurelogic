/**
 * UX集成脚本 - 整合LoadingManager和ErrorToast到现有系统
 */

// 等待DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  Logger?.debug('UX集成: 开始初始化...');
  
  // 1. 为所有场景卡片添加加载状态
  integrateLoadingStates();
  
  // 2. 为所有API调用添加错误处理
  integrateErrorHandling();
  
  // 3. 为所有模态框添加进度指示
  integrateProgressIndicators();
  
  Logger?.debug('UX集成: 初始化完成');
});

/**
 * 集成加载状态到场景卡片
 */
function integrateLoadingStates() {
  // 监听场景卡片点击
  document.addEventListener('click', (e) => {
    const scenarioCard = e.target.closest('.scenario-card');
    if (scenarioCard) {
      const scenarioId = scenarioCard.dataset.scenarioId || 'unknown';
      Logger?.debug(`UX集成: 场景卡片点击 - ${scenarioId}`);
      
      // 显示加载状态
      if (typeof LoadingManager !== 'undefined') {
        LoadingManager.show('game-container', {
          message: '加载场景中...',
          type: 'spinner'
        });
      }
    }
  });
  
  // 监听场景加载完成
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.id === 'game-container' && mutation.addedNodes.length > 0) {
        // 场景加载完成，隐藏加载状态
        if (typeof LoadingManager !== 'undefined') {
          LoadingManager.hide('game-container');
        }
      }
    });
  });
  
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    observer.observe(gameContainer, { childList: true });
  }
}

/**
 * 集成错误处理到API调用
 */
function integrateErrorHandling() {
  // 包装fetch API添加错误处理
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(this, args);
      
      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        showError(
          errorData.message || `请求失败: ${response.status}`,
          'error'
        );
      }
      
      return response;
    } catch (error) {
      // 网络错误
      showError(
        '网络连接失败，请检查网络设置',
        'error',
        {
          label: '重试',
          callback: () => window.fetch.apply(this, args)
        }
      );
      throw error;
    }
  };
  
  // 包装XMLHttpRequest添加错误处理
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    return originalXHROpen.call(this, method, url, ...rest);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('error', () => {
      showError(
        `请求失败: ${this._url}`,
        'error'
      );
    });
    return originalXHRSend.apply(this, args);
  };
}

/**
 * 集成进度指示器到模态框
 */
function integrateProgressIndicators() {
  // 监听模态框打开
  const modalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const modal = mutation.target;
        if (modal.classList.contains('active')) {
          // 模态框打开，添加进度指示器
          addProgressIndicator(modal);
        }
      }
    });
  });
  
  const gameModal = document.getElementById('game-modal');
  if (gameModal) {
    modalObserver.observe(gameModal, { attributes: true });
  }
}

/**
 * 添加进度指示器到模态框
 */
function addProgressIndicator(modal) {
  // 检查是否已有进度指示器
  if (modal.querySelector('.modal-progress')) return;
  
  // 创建进度指示器
  const progress = document.createElement('div');
  progress.className = 'modal-progress';
  progress.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #e5e7eb;
    overflow: hidden;
    z-index: 1000;
  `;
  
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    height: 100%;
    background: #2563eb;
    width: 0%;
    transition: width 0.3s ease;
  `;
  
  progress.appendChild(progressBar);
  
  // 确保模态框有relative定位
  if (getComputedStyle(modal).position === 'static') {
    modal.style.position = 'relative';
  }
  
  modal.insertBefore(progress, modal.firstChild);
  
  // 模拟进度（实际应由游戏逻辑控制）
  let width = 0;
  const interval = setInterval(() => {
    width += 10;
    if (width >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        progress.style.display = 'none';
      }, 500);
    } else {
      progressBar.style.width = width + '%';
    }
  }, 100);
}

/**
 * 显示错误提示
 */
function showError(message, type = 'error', action = null) {
  if (typeof ErrorToast !== 'undefined') {
    ErrorToast.show(message, { type, action });
  } else {
    // 降级到console.error
    Logger?.error(`[错误] ${message}`);
    if (action) {
      Logger?.debug(`[操作] ${action.label}`);
    }
  }
}

// 导出到全局
window.UXIntegration = {
  integrateLoadingStates,
  integrateErrorHandling,
  integrateProgressIndicators,
  showError
};

Logger?.debug('UX集成: 脚本已加载');
