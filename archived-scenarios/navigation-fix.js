/**
 * 修复脚本：解决场景页面导航和交互元素问题
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Applying navigation fixes...');
  
  // 修复1: 确保导航按钮事件正确绑定
  const navButtons = document.querySelectorAll('.nav-item[data-page]');
  navButtons.forEach(button => {
    // 移除现有事件监听器并重新绑定
    button.onclick = null;
    button.addEventListener('click', function(e) {
      const targetPage = this.dataset.page;
      console.log('Navigation to:', targetPage);
      if (window.NavigationManager) {
        window.NavigationManager.navigateTo(targetPage);
      }
    });
  });
  
  // 修复2: 确保难度选择器功能正常
  const difficultySelector = document.getElementById('difficulty-level');
  if (difficultySelector) {
    difficultySelector.onchange = function(e) {
      const selectedValue = this.value;
      if (window.AppState && window.AppState.userPreferences) {
        window.AppState.userPreferences.difficulty = selectedValue;
      }
      // 更新显示文本
      const display = document.getElementById('current-difficulty');
      if (display) {
        display.textContent = `当前: ${selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)}`;
      }
    };
  }
  
  // 修复3: 确保场景卡片点击事件正常工作
  const scenarioCards = document.querySelectorAll('.scenario-card');
  scenarioCards.forEach(card => {
    card.onclick = null;
    card.addEventListener('click', function() {
      // 从按钮的onclick属性中提取场景ID
      const button = this.querySelector('button');
      if (button) {
        const onclickStr = button.getAttribute('onclick');
        if (onclickStr && onclickStr.includes("'")) {
          const scenarioId = onclickStr.match(/'([^']+)'/)[1];
          if (window.GameManager && scenarioId) {
            window.GameManager.startScenario(scenarioId);
          }
        }
      }
    });
  });
  
  console.log('Navigation fixes applied');
});