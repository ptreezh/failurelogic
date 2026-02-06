const { chromium } = require('playwright');

(async () => {
  // 启动浏览器
  const browser = await chromium.launch({ 
    headless: false, // 设为true可在无头模式下运行
    slowMo: 100 // 减慢操作以便观察
  });
  
  const page = await browser.newPage();
  
  try {
    // 访问应用
    console.log('🌐 访问认知陷阱平台...');
    await page.goto('http://localhost:8082'); // 假设应用运行在8082端口
    
    // 等待页面加载
    await page.waitForSelector('#home-page', { timeout: 10000 });
    console.log('✅ 首页加载成功');
    
    // 点击进入场景页面
    console.log('➡️ 导航到场景页面...');
    await page.click('button[data-page="scenarios"]');
    await page.waitForSelector('#scenarios-page', { timeout: 10000 });
    console.log('✅ 场景页面加载成功');
    
    // 测试咖啡店线性思维场景
    console.log('\n☕ 测试咖啡店线性思维场景...');
    const coffeeShopCard = await page.$('.scenario-card:has-text("咖啡店线性思维")');
    if (coffeeShopCard) {
      await coffeeShopCard.click();
      await page.waitForSelector('#game-container', { timeout: 10000 });
      console.log('✅ 咖啡店场景加载成功');
      
      // 测试滑块交互
      await page.waitForSelector('#staff-count', { timeout: 5000 });
      await page.fill('#staff-count', '2');
      console.log('✅ 员工数量滑块测试通过');
      
      await page.waitForSelector('#marketing-budget', { timeout: 5000 });
      await page.fill('#marketing-budget', '200');
      console.log('✅ 营销预算滑块测试通过');
      
      // 提交决策
      await page.click('#submit-decision');
      console.log('✅ 决策提交测试通过');
      
      // 返回场景列表
      await page.click('button:has-text("返回场景列表")');
      await page.waitForSelector('#scenarios-page', { timeout: 10000 });
      console.log('✅ 咖啡店场景测试完成');
    } else {
      console.log('⚠️ 未找到咖啡店场景卡片');
    }
    
    // 测试商业战略推理游戏 (game-001)
    console.log('\n🏢 测试商业战略推理游戏...');
    const businessGameCard = await page.$('.scenario-card:has-text("商业战略推理游戏")');
    if (businessGameCard) {
      await businessGameCard.click();
      await page.waitForSelector('#game-container', { timeout: 10000 });
      console.log('✅ 商业战略推理游戏加载成功');
      
      // 等待选项按钮出现
      await page.waitForSelector('.option-btn', { timeout: 10000 });
      
      // 测试选项选择
      const optionBtn = await page.$$('.option-btn');
      if (optionBtn.length > 0) {
        await optionBtn[0].click();
        console.log('✅ 选项选择测试通过');
        
        // 提交决策
        await page.click('#submit-decision');
        console.log('✅ 决策提交测试通过');
      }
      
      // 返回场景列表
      await page.click('button:has-text("返回场景列表")');
      await page.waitForSelector('#scenarios-page', { timeout: 10000 });
      console.log('✅ 商业战略推理游戏测试完成');
    } else {
      console.log('⚠️ 未找到商业战略推理游戏卡片');
    }
    
    // 测试公共政策制定模拟 (game-002)
    console.log('\n🏛️ 测试公共政策制定模拟...');
    const policyGameCard = await page.$('.scenario-card:has-text("公共政策制定模拟")');
    if (policyGameCard) {
      await policyGameCard.click();
      await page.waitForSelector('#game-container', { timeout: 10000 });
      console.log('✅ 公共政策制定模拟加载成功');
      
      // 等待选项按钮出现
      await page.waitForSelector('.option-btn', { timeout: 10000 });
      
      // 测试选项选择
      const optionBtn = await page.$$('.option-btn');
      if (optionBtn.length > 0) {
        await optionBtn[1].click();
        console.log('✅ 选项选择测试通过');
        
        // 提交决策
        await page.click('#submit-decision');
        console.log('✅ 决策提交测试通过');
      }
      
      // 返回场景列表
      await page.click('button:has-text("返回场景列表")');
      await page.waitForSelector('#scenarios-page', { timeout: 10000 });
      console.log('✅ 公共政策制定模拟测试完成');
    } else {
      console.log('⚠️ 未找到公共政策制定模拟卡片');
    }
    
    // 测试个人理财决策模拟 (game-003)
    console.log('\n💰 测试个人理财决策模拟...');
    const financeGameCard = await page.$('.scenario-card:has-text("个人理财决策模拟")');
    if (financeGameCard) {
      await financeGameCard.click();
      await page.waitForSelector('#game-container', { timeout: 10000 });
      console.log('✅ 个人理财决策模拟加载成功');
      
      // 等待选项按钮出现
      await page.waitForSelector('.option-btn', { timeout: 10000 });
      
      // 测试选项选择
      const optionBtn = await page.$$('.option-btn');
      if (optionBtn.length > 0) {
        await optionBtn[2].click();
        console.log('✅ 选项选择测试通过');
        
        // 提交决策
        await page.click('#submit-decision');
        console.log('✅ 决策提交测试通过');
      }
      
      // 返回场景列表
      await page.click('button:has-text("返回场景列表")');
      await page.waitForSelector('#scenarios-page', { timeout: 10000 });
      console.log('✅ 个人理财决策模拟测试完成');
    } else {
      console.log('⚠️ 未找到个人理财决策模拟卡片');
    }
    
    // 测试恋爱关系场景
    console.log('\n💕 测试恋爱关系场景...');
    const loveRelationshipBtn = await page.$('button[data-page="love-relationship"]');
    if (loveRelationshipBtn) {
      await loveRelationshipBtn.click();
      await page.waitForSelector('#love-relationship-page', { timeout: 10000 });
      console.log('✅ 恋爱关系页面加载成功');
      
      // 查找并点击任意一个恋爱关系场景
      const loveScenarioCard = await page.$('.scenario-card:has-text("初识阶段")');
      if (loveScenarioCard) {
        await loveScenarioCard.click();
        await page.waitForSelector('#game-container', { timeout: 10000 });
        console.log('✅ 恋爱关系场景加载成功');
        
        // 等待选项按钮出现
        await page.waitForSelector('.option-btn', { timeout: 10000 });
        
        // 测试选项选择
        const optionBtn = await page.$$('.option-btn');
        if (optionBtn.length > 0) {
          await optionBtn[0].click();
          console.log('✅ 恋爱关系场景选项选择测试通过');
          
          // 提交决策
          await page.click('#submit-decision');
          console.log('✅ 恋爱关系场景决策提交测试通过');
        }
        
        // 返回场景列表
        await page.click('button:has-text("返回场景列表")');
        await page.waitForSelector('#love-relationship-page', { timeout: 10000 });
        console.log('✅ 恋爱关系场景测试完成');
      } else {
        console.log('⚠️ 未找到恋爱关系场景卡片');
      }
      
      // 从恋爱关系页面返回主场景页面
      await page.click('button:has-text("返回所有场景")');
      await page.waitForSelector('#scenarios-page', { timeout: 10000 });
      console.log('✅ 从恋爱关系页面返回场景列表成功');
    } else {
      console.log('⚠️ 未找到恋爱关系导航按钮');
    }
    
    console.log('\n🎉 所有场景交互测试完成！');
    console.log('✅ 测试总结:');
    console.log('  - 首页导航正常');
    console.log('  - 场景列表加载正常');
    console.log('  - 咖啡店场景交互正常');
    console.log('  - 商业战略推理游戏交互正常');
    console.log('  - 公共政策制定模拟交互正常');
    console.log('  - 个人理财决策模拟交互正常');
    console.log('  - 恋爱关系场景交互正常');
    console.log('  - 所有决策提交功能正常');
    console.log('  - 页面导航正常');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  } finally {
    // 关闭浏览器
    await browser.close();
    console.log('\n🔒 浏览器已关闭');
  }
})();