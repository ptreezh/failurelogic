/**
 * 修复Failure Logic平台的交互问题
 * 解决导航和交互元素无法点击的问题
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Applying fixes for Failure Logic platform...');

  // 1. 确保页面完全加载后再执行修复
  setTimeout(() => {
    // 修复导航按钮
    const navButtons = document.querySelectorAll('.nav-item[data-page]');
    console.log(`Found ${navButtons.length} navigation buttons`);
    
    navButtons.forEach(button => {
      // 移除可能存在的重复事件监听器
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // 重新绑定点击事件
      newButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const targetPage = this.dataset.page;
        console.log('Navigation button clicked:', targetPage);
        
        if (window.NavigationManager && typeof window.NavigationManager.navigateTo === 'function') {
          try {
            window.NavigationManager.navigateTo(targetPage);
          } catch (err) {
            console.error('Navigation error:', err);
            // Fallback navigation
            window.location.hash = `#${targetPage}`;
          }
        } else {
          console.error('NavigationManager not available');
        }
      });
    });

    // 修复难度选择器
    const difficultySelector = document.getElementById('difficulty-level');
    if (difficultySelector) {
      console.log('Difficulty selector found');
      
      // 确保初始值设置正确
      if (window.AppState && window.AppState.userPreferences) {
        difficultySelector.value = window.AppState.userPreferences.difficulty || 'beginner';
      }
      
      // 绑定难度更改事件
      difficultySelector.addEventListener('change', function(e) {
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
      });
    }

    // 修复场景卡片点击事件
    const scenarioCards = document.querySelectorAll('.scenario-card');
    console.log(`Found ${scenarioCards.length} scenario cards`);
    
    scenarioCards.forEach(card => {
      // 移除可能存在的事件监听器并重新绑定
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);
      
      // 为卡片上的按钮绑定事件
      const cardButton = newCard.querySelector('button');
      if (cardButton) {
        cardButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // 从onclick属性中提取场景ID
          const onclickAttr = this.getAttribute('onclick');
          if (onclickAttr && onclickAttr.includes('GameManager.startScenario')) {
            const scenarioIdMatch = onclickAttr.match(/'([^']+)'/);
            if (scenarioIdMatch && scenarioIdMatch[1]) {
              const scenarioId = scenarioIdMatch[1];
              console.log('Starting scenario:', scenarioId);
              
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
        });
      }
      
      // 同时为卡片本身绑定事件（如果按钮不可用）
      newCard.addEventListener('click', function(e) {
        // 如果点击的是按钮，则不触发卡片事件
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        // 从按钮的onclick属性中提取场景ID
        const button = this.querySelector('button');
        if (button) {
          const onclickAttr = button.getAttribute('onclick');
          if (onclickAttr && onclickAttr.includes('GameManager.startScenario')) {
            const scenarioIdMatch = onclickAttr.match(/'([^']+)'/);
            if (scenarioIdMatch && scenarioIdMatch[1]) {
              const scenarioId = scenarioIdMatch[1];
              console.log('Starting scenario from card click:', scenarioId);
              
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
      });
    });

    // 确保页面元素可交互
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (!el.style.pointerEvents || el.style.pointerEvents === 'none') {
        el.style.pointerEvents = 'auto';
      }
    });

    console.log('All fixes applied successfully');
  }, 100); // 稍微延迟以确保页面完全加载
});

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
  
  // 如果关键对象未定义，尝试从app.js重新加载
  if (typeof window.NavigationManager === 'undefined' ||
      typeof window.GameManager === 'undefined' ||
      typeof window.AppState === 'undefined') {
    console.log('Some required objects are missing, reloading scripts...');
  }
});