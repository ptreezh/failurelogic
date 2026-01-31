// UI组件和交互管理
const UIManager = {
  // 显示加载状态
  showLoading() {
    AppState.isLoading = true;
    // 这里可以添加加载指示器
    console.log('显示加载状态');
  },

  // 隐藏加载状态
  hideLoading() {
    AppState.isLoading = false;
    // 这里可以移除加载指示器
    console.log('隐藏加载状态');
  },

  // 显示通知
  showToast(message, type = 'info') {
    // 创建简单的通知元素
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background-color: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
      color: white;
      border-radius: 4px;
      z-index: 1000;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    `;
    
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  },

  // 创建模态框
  showModal(title, content) {
    // 创建模态框背景
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    
    // 创建模态框内容
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    modal.innerHTML = `
      <h3 style="margin-top: 0; margin-bottom: 16px;">${title}</h3>
      <div>${content}</div>
      <div style="margin-top: 16px; text-align: right;">
        <button id="close-modal" class="btn">关闭</button>
      </div>
    `;
    
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    // 关闭事件
    modal.querySelector('#close-modal').addEventListener('click', () => {
      document.body.removeChild(backdrop);
    });
    
    return backdrop;
  }
};