/**
 * 测试修复后的导航和交互功能
 */
async function testNavigationAndInteraction() {
  console.log('Testing navigation and interaction fixes...');
  
  // 等待页面完全加载
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试1: 检查导航功能
  console.log('Testing navigation...');
  if (typeof NavigationManager !== 'undefined') {
    console.log('✅ NavigationManager is available');
    
    // 尝试导航到场景页面
    try {
      NavigationManager.navigateTo('scenarios');
      console.log('✅ Successfully navigated to scenarios page');
    } catch (e) {
      console.error('❌ Failed to navigate to scenarios page:', e);
    }
  } else {
    console.error('❌ NavigationManager is not available');
  }
  
  // 测试2: 检查难度选择器
  console.log('Testing difficulty selector...');
  const difficultySelector = document.getElementById('difficulty-level');
  if (difficultySelector) {
    console.log('✅ Difficulty selector found');
    
    // 测试更改难度
    try {
      difficultySelector.value = 'intermediate';
      difficultySelector.dispatchEvent(new Event('change'));
      console.log('✅ Difficulty selector change event fired');
    } catch (e) {
      console.error('❌ Error with difficulty selector:', e);
    }
  } else {
    console.error('❌ Difficulty selector not found');
  }
  
  // 测试3: 检查场景卡片
  console.log('Testing scenario cards...');
  const scenarioCards = document.querySelectorAll('.scenario-card');
  if (scenarioCards.length > 0) {
    console.log(`✅ Found ${scenarioCards.length} scenario cards`);
    
    // 检查第一个卡片是否有点击事件
    try {
      scenarioCards[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      console.log('✅ Click event dispatched to first scenario card');
    } catch (e) {
      console.error('❌ Error clicking scenario card:', e);
    }
  } else {
    console.error('❌ No scenario cards found');
  }
  
  // 测试4: 检查API连接
  console.log('Testing API connection...');
  if (typeof ApiService !== 'undefined') {
    try {
      const health = await ApiService.healthCheck();
      console.log('✅ API health check:', health.status);
    } catch (e) {
      console.error('❌ API health check failed:', e);
    }
  } else {
    console.error('❌ ApiService is not available');
  }
  
  console.log('Navigation and interaction test completed');
}

// 运行测试
testNavigationAndInteraction();