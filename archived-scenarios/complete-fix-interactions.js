/**
 * 修复Failure Logic平台的交互问题
 * 解决导航和交互元素无法点击的问题
 */

// 确保在DOM完全加载后执行
document.addEventListener('DOMContentLoaded', function() {
  console.log('Applying fixes for Failure Logic platform...');

  // 1. 确保页面完全加载后再执行修复
  setTimeout(() => {
    // 检查NavigationManager是否已存在
    if (typeof window.NavigationManager === 'undefined') {
      console.warn('NavigationManager not found, attempting to initialize...');
      
      // 尝试重新初始化NavigationManager
      if (typeof NavigationManager !== 'undefined') {
        window.NavigationManager = NavigationManager;
        console.log('NavigationManager assigned to window');
      }
    }

    // 修复导航按钮
    const navButtons = document.querySelectorAll('.nav-item[data-page]');
    console.log(`Found ${navButtons.length} navigation buttons`);
    
    navButtons.forEach(button => {
      // 移除可能存在的重复事件监听器
      const page = button.getAttribute('data-page');
      if (page) {
        // 移除所有事件监听器（通过克隆元素）
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // 重新绑定点击事件
        newButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const targetPage = this.getAttribute('data-page');
          console.log('Navigation button clicked:', targetPage);
          
          // 尝试多种方法进行导航
          if (window.NavigationManager && typeof window.NavigationManager.navigateTo === 'function') {
            try {
              window.NavigationManager.navigateTo(targetPage);
            } catch (err) {
              console.error('NavigationManager error:', err);
              // 尝试备选方案
              fallbackNavigate(targetPage);
            }
          } else {
            console.error('NavigationManager not available');
            // 使用备选方案
            fallbackNavigate(targetPage);
          }
        });
      }
    });

    // 修复难度选择器
    const difficultySelector = document.getElementById('difficulty-level');
    if (difficultySelector) {
      console.log('Difficulty selector found');
      
      // 确保初始值设置正确
      if (window.AppState && window.AppState.userPreferences) {
        difficultySelector.value = window.AppState.userPreferences.difficulty || 'beginner';
      }
      
      // 移除现有事件监听器并重新绑定
      const newSelector = difficultySelector.cloneNode(true);
      difficultySelector.parentNode.replaceChild(newSelector, difficultySelector);
      
      // 绑定难度更改事件
      newSelector.addEventListener('change', function(e) {
        e.preventDefault();
        const selectedValue = this.value;
        console.log('Difficulty changed to:', selectedValue);
        
        if (window.AppState && window.AppState.userPreferences) {
          window.AppState.userPreferences.difficulty = selectedValue;
        }
        
        // 更新显示
        const display = document.getElementById('current-difficulty');
        if (display) {
          display.textContent = `当前: ${selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)}`;
        }
        
        // 如果在场景页面，重新加载场景
        if (window.NavigationManager && window.NavigationManager.currentPage === 'scenarios') {
          window.NavigationManager.loadScenariosPage && window.NavigationManager.loadScenariosPage();
        }
      });
    }

    // 修复场景卡片点击事件
    // 使用事件委托，因为卡片可能是动态加载的
    document.addEventListener('click', function(e) {
      // 检查点击的是否是场景卡片或其内部的按钮
      const scenarioCard = e.target.closest('.scenario-card');
      const scenarioButton = e.target.closest('button');
      
      if (scenarioCard && scenarioButton && scenarioButton !== scenarioCard) {
        // 检查按钮是否在场景卡片内
        if (scenarioCard.contains(scenarioButton)) {
          // 从按钮的onclick属性中提取场景ID
          const onclickAttr = scenarioButton.getAttribute('onclick');
          if (onclickAttr && onclickAttr.includes('GameManager.startScenario')) {
            e.preventDefault();
            e.stopPropagation();
            
            const scenarioIdMatch = onclickAttr.match(/'([^']+)'/);
            if (scenarioIdMatch && scenarioIdMatch[1]) {
              const scenarioId = scenarioIdMatch[1];
              console.log('Starting scenario from card button:', scenarioId);
              
              if (window.GameManager && typeof window.GameManager.startScenario === 'function') {
                try {
                  window.GameManager.startScenario(scenarioId);
                } catch (err) {
                  console.error('Error starting scenario:', err);
                }
              } else {
                console.error('GameManager not available');
              }
            }
          }
        }
      }
    });

    // 确保页面元素可交互
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.style.pointerEvents === 'none') {
        el.style.pointerEvents = 'auto';
      }
    });

    console.log('All fixes applied successfully');
  }, 100); // 稍微延迟以确保页面完全加载
});

// 备选导航函数
function fallbackNavigate(page) {
  console.log('Using fallback navigation to:', page);
  
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });
  
  // 显示目标页面
  const targetPage = document.getElementById(`${page}-page`);
  if (targetPage) {
    targetPage.classList.add('active');
    
    // 更新导航按钮状态
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-page') === page) {
        btn.classList.add('active');
      }
    });
  } else {
    console.error('Target page not found:', `${page}-page`);
  }
}

// 确保全局对象可用
window.addEventListener('load', function() {
  console.log('Page fully loaded, checking for required objects...');
  
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