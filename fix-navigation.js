/**
 * 修复场景页面导航和交互元素问题的补丁脚本
 */

// 等待DOM完全加载
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, applying fixes...');
  
  // 1. 确保导航按钮事件正确绑定
  const navButtons = document.querySelectorAll('.nav-item[data-page]');
  console.log(`Found ${navButtons.length} navigation buttons`);
  
  navButtons.forEach(button => {
    // 移除可能存在的重复事件监听器
    button.replaceWith(button.cloneNode(true));
    const newButton = button.cloneNode(true);
    
    // 重新绑定事件
    newButton.addEventListener('click', function(e) {
      const targetPage = this.dataset.page;
      console.log('Navigation button clicked:', targetPage);
      
      if (window.NavigationManager && typeof window.NavigationManager.navigateTo === 'function') {
        window.NavigationManager.navigateTo(targetPage);
      } else {
        console.error('NavigationManager not available');
      }
    });
    
    // 替换原始按钮
    button.parentNode.replaceChild(newButton, button);
  });
  
  // 2. 确保难度选择器功能正常
  const difficultySelector = document.getElementById('difficulty-level');
  if (difficultySelector) {
    console.log('Difficulty selector found, initializing...');
    
    // 设置默认值
    if (window.AppState && window.AppState.userPreferences) {
      difficultySelector.value = window.AppState.userPreferences.difficulty || 'beginner';
    }
    
    // 绑定事件
    difficultySelector.removeEventListener('change', updateDifficultyDisplay);
    difficultySelector.addEventListener('change', function(e) {
      const selectedValue = this.value;
      console.log('Difficulty changed to:', selectedValue);
      
      if (window.AppState && window.AppState.userPreferences) {
        window.AppState.userPreferences.difficulty = selectedValue;
      }
      
      // 更新显示
      const display = document.getElementById('current-difficulty') || document.querySelector('.current-difficulty');
      if (display) {
        display.textContent = `当前: ${selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)}`;
      }
      
      // 如果在场景页面，重新加载场景
      if (window.NavigationManager && window.NavigationManager.currentPage === 'scenarios') {
        window.NavigationManager.loadScenariosPage();
      }
    });
  } else {
    console.warn('Difficulty selector not found');
  }
  
  // 3. 确保场景卡片点击事件正常工作
  const scenarioCards = document.querySelectorAll('.scenario-card');
  console.log(`Found ${scenarioCards.length} scenario cards`);
  
  scenarioCards.forEach(card => {
    // 移除可能存在的重复事件监听器
    card.onclick = null;
    
    // 重新绑定点击事件
    card.addEventListener('click', function() {
      const scenarioId = this.getAttribute('data-scenario-id');
      console.log('Scenario card clicked:', scenarioId);
      
      if (window.GameManager && typeof window.GameManager.startScenario === 'function') {
        // 提取场景ID（从按钮的onclick属性中）
        const onclickAttr = this.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes('GameManager.startScenario')) {
          const scenarioIdMatch = onclickAttr.match(/'([^']+)'/);
          if (scenarioIdMatch && scenarioIdMatch[1]) {
            window.GameManager.startScenario(scenarioIdMatch[1]);
          }
        }
      }
    });
  });
  
  console.log('Fixes applied successfully');
});

// 4. 确保全局对象可用
window.addEventListener('load', function() {
  console.log('Page fully loaded');
  
  // 确保关键对象已定义
  if (typeof window.NavigationManager === 'undefined') {
    console.error('NavigationManager is not defined');
  }
  
  if (typeof window.GameManager === 'undefined') {
    console.error('GameManager is not defined');
  }
  
  if (typeof window.AppState === 'undefined') {
    console.error('AppState is not defined');
  }
});