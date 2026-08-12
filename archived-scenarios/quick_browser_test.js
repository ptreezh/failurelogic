const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 访问认知陷阱平台...');
    await page.goto('http://localhost:8082');
    await page.waitForSelector('header nav', { timeout: 10000 });
    console.log('✅ 首页加载成功');
    
    // 导航到场景页面
    console.log('➡️ 导航到场景页面...');
    await page.click('button[data-page="scenarios"]');
    await page.waitForSelector('#scenarios-page', { timeout: 10000 });
    console.log('✅ 场景页面加载成功');
    
    // 获取所有场景卡片
    await page.waitForFunction(() => document.querySelectorAll('.scenario-card').length > 0);
    const scenarioCards = await page.$$('.scenario-card');
    console.log(`✅ 找到 ${scenarioCards.length} 个场景`);
    
    // 逐一测试每个场景
    for (let i = 0; i < scenarioCards.length && i < 10; i++) { // 限制测试前10个场景
      const card = scenarioCards[i];
      const cardText = await card.textContent();
      console.log(`\n🧪 测试场景 ${i+1}: ${cardText.substring(0, 30)}...`);
      
      // 点击场景卡片
      await card.click();
      console.log(`  ✅ 点击场景卡片`);
      
      // 等待游戏模态框
      await page.waitForSelector('#game-modal.active', { timeout: 10000 });
      console.log(`  ✅ 游戏模态框打开`);
      
      // 等待游戏内容
      await page.waitForSelector('#game-container', { timeout: 10000 });
      console.log(`  ✅ 游戏内容加载`);
      
      // 检查是否有滑块或选项按钮
      const hasSliders = await page.$$('#staff-count, #marketing-budget, #research-time, #investment-diversification').then(elems => elems.length > 0);
      const hasOptionButtons = await page.$$('.option-btn').then(elems => elems.length > 0);
      
      if (hasSliders) {
        console.log(`  🎚️ 检测到滑块控件，进行交互测试`);
        // 测试滑块交互
        const sliders = await page.$$('.game-slider');
        for (const slider of sliders) {
          await slider.focus();
          await slider.press('ArrowRight');
          await page.waitForTimeout(200);
        }
      } else if (hasOptionButtons) {
        console.log(`  📋 检测到选项按钮，进行选择测试`);
        // 测试选项选择
        const buttons = await page.$$('.option-btn');
        if (buttons.length > 0) {
          await buttons[0].click();
          console.log(`  ✅ 选项选择成功`);
          
          // 显示提交按钮
          await page.waitForSelector('#submit-decision:not([style*="display: none"])', { timeout: 5000 });
          console.log(`  ✅ 提交按钮显示`);
        }
      }
      
      // 尝试提交（如果按钮可用）
      const submitBtn = await page.$('#submit-decision:not([disabled])');
      if (submitBtn) {
        await submitBtn.click();
        console.log(`  ✅ 决策提交`);
        await page.waitForTimeout(1000);
      }
      
      // 关闭模态框
      await page.click('button:has-text("关闭")');
      await page.waitForSelector('#game-modal:not(.active)', { timeout: 5000 });
      console.log(`  ✅ 场景 ${i+1} 测试完成`);
      
      // 重新获取场景卡片列表（因为DOM可能已更新）
      await page.waitForTimeout(500);
      scenarioCards = await page.$$('.scenario-card');
    }
    
    console.log('\n🎉 所有场景基本交互测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  } finally {
    await browser.close();
    console.log('🔒 浏览器已关闭');
  }
})();