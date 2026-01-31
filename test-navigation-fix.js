/**
 * 验证场景页面导航和交互元素修复的测试脚本
 */

// 测试场景页面导航功能
async function testScenarioNavigation() {
  console.log('Testing scenario page navigation...');
  
  try {
    // 检查导航管理器是否存在
    if (typeof NavigationManager === 'undefined') {
      console.error('❌ NavigationManager not found');
      return false;
    }
    
    console.log('✅ NavigationManager found');
    
    // 检查场景页面元素
    const scenariosPage = document.getElementById('scenarios-page');
    if (!scenariosPage) {
      console.error('❌ Scenarios page element not found');
      return false;
    }
    
    console.log('✅ Scenarios page element found');
    
    // 检查难度选择器
    const difficultySelector = document.getElementById('difficulty-level');
    if (!difficultySelector) {
      console.error('❌ Difficulty selector not found');
      return false;
    }
    
    console.log('✅ Difficulty selector found');
    
    // 检查场景网格
    const scenariosGrid = document.getElementById('scenarios-grid');
    if (!scenariosGrid) {
      console.error('❌ Scenarios grid not found');
      return false;
    }
    
    console.log('✅ Scenarios grid found');
    
    // 检查场景卡片
    const scenarioCards = document.querySelectorAll('.scenario-card');
    if (scenarioCards.length === 0) {
      console.error('❌ No scenario cards found');
      return false;
    }
    
    console.log(`✅ Found ${scenarioCards.length} scenario cards`);
    
    // 尝试导航到场景页面
    console.log('Navigating to scenarios page...');
    NavigationManager.navigateTo('scenarios');
    
    // 等待页面渲染
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 验证页面是否激活
    const isActive = scenariosPage.classList.contains('active');
    if (!isActive) {
      console.error('❌ Scenarios page is not active after navigation');
      return false;
    }
    
    console.log('✅ Successfully navigated to scenarios page');
    
    // 测试难度选择器功能
    console.log('Testing difficulty selector...');
    difficultySelector.value = 'intermediate';
    difficultySelector.dispatchEvent(new Event('change'));
    
    if (AppState.userPreferences.difficulty !== 'intermediate') {
      console.error('❌ Difficulty selector not updating state correctly');
      return false;
    }
    
    console.log('✅ Difficulty selector working correctly');
    
    // 测试场景卡片点击
    if (scenarioCards.length > 0) {
      console.log('Testing scenario card click...');
      const firstCard = scenarioCards[0];
      const scenarioId = firstCard.querySelector('button')?.getAttribute('onclick')
        ?.match(/'([^']+)'/)?.[1];
      
      if (scenarioId) {
        console.log(`Clicking on scenario: ${scenarioId}`);
        GameManager.startScenario(scenarioId);
        console.log('✅ Scenario card click handled');
      } else {
        console.warn('⚠ Could not determine scenario ID from card');
      }
    }
    
    console.log('✅ All navigation tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Error during navigation test:', error);
    return false;
  }
}

// 运行测试
console.log('Starting navigation and interaction tests...');
testScenarioNavigation().then(success => {
  if (success) {
    console.log('🎉 All tests completed successfully!');
  } else {
    console.log('❌ Some tests failed.');
  }
});