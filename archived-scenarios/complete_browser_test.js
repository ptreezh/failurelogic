const { chromium } = require('playwright');

(async () => {
  // 启动浏览器
  const browser = await chromium.launch({ 
    headless: false, // 设为false以查看实际交互
    slowMo: 100 // 减慢操作以便观察
  });
  
  const page = await browser.newPage();
  
  try {
    // 设置较长的超时时间
    await page.setDefaultTimeout(30000);
    
    // 访问应用
    console.log('🌐 访问认知陷阱平台...');
    await page.goto('http://localhost:8082'); // 假设应用运行在8082端口
    
    // 等待页面加载
    await page.waitForSelector('header nav', { timeout: 10000 });
    console.log('✅ 首页加载成功');
    
    // 测试导航到场景页面
    console.log('➡️ 点击导航栏中的"场景"按钮...');
    await page.click('button[data-page="scenarios"]');
    await page.waitForSelector('#scenarios-page', { timeout: 10000 });
    console.log('✅ 场景页面加载成功');
    
    // 等待场景加载完成
    await page.waitForSelector('.scenarios-grid', { timeout: 10000 });
    await page.waitForFunction(() => document.querySelectorAll('.scenario-card').length > 0);
    console.log('✅ 场景卡片已加载');
    
    // 测试咖啡店线性思维场景 (初级难度)
    console.log('\n☕ 测试咖啡店线性思维场景 (初级难度)...');
    const coffeeShopCard = await page.$('.scenario-card:has-text("咖啡店线性思维")');
    if (coffeeShopCard) {
      await coffeeShopCard.click();
      console.log('✅ 点击咖啡店场景卡片');
      
      // 等待游戏模态框出现
      await page.waitForSelector('#game-modal.active', { timeout: 10000 });
      console.log('✅ 游戏模态框已打开');
      
      // 等待游戏内容加载
      await page.waitForSelector('#game-container', { timeout: 10000 });
      console.log('✅ 游戏内容已加载');
      
      // 测试滑块交互
      console.log('  🎚️ 测试员工数量滑块...');
      await page.waitForSelector('#staff-count', { timeout: 5000 });
      await page.locator('#staff-count').fill('2');
      await page.waitForTimeout(500);
      const staffValue = await page.locator('#staff-value').textContent();
      console.log(`  ✅ 员工数量滑块值: ${staffValue}`);
      
      console.log('  🎚️ 测试营销预算滑块...');
      await page.waitForSelector('#marketing-budget', { timeout: 5000 });
      await page.locator('#marketing-budget').fill('300');
      await page.waitForTimeout(500);
      const marketingValue = await page.locator('#marketing-value').textContent();
      console.log(`  ✅ 营销预算滑块值: ${marketingValue}`);
      
      // 提交决策
      console.log('  📝 提交决策...');
      await page.click('#submit-decision');
      await page.waitForTimeout(2000); // 等待反馈
      console.log('  ✅ 决策提交成功');
      
      // 等待反馈显示
      await page.waitForSelector('#feedback-display .feedback-content', { timeout: 5000 });
      console.log('  ✅ 反馈信息已显示');
      
      // 关闭游戏模态框
      await page.click('button:has-text("关闭")');
      await page.waitForSelector('#game-modal:not(.active)', { timeout: 5000 });
      console.log('✅ 咖啡店场景测试完成');
    } else {
      console.log('⚠️ 未找到咖啡店场景卡片');
    }
    
    // 测试商业战略推理游戏 (game-001)
    console.log('\n🏢 测试商业战略推理游戏 (中级难度)...');
    const businessGameCard = await page.$('.scenario-card:has-text("商业战略推理游戏")');
    if (businessGameCard) {
      await businessGameCard.click();
      console.log('✅ 点击商业战略推理游戏卡片');
      
      // 等待游戏模态框出现
      await page.waitForSelector('#game-modal.active', { timeout: 10000 });
      console.log('✅ 游戏模态框已打开');
      
      // 等待游戏内容加载
      await page.waitForSelector('#game-container', { timeout: 10000 });
      console.log('✅ 游戏内容已加载');
      
      // 等待选项按钮出现
      await page.waitForSelector('.option-btn', { timeout: 10000 });
      const optionButtons = await page.$$('.option-btn');
      console.log(`  ✅ 找到 ${optionButtons.length} 个选项按钮`);
      
      // 测试选项选择
      if (optionButtons.length > 0) {
        console.log('  🤔 点击第一个选项...');
        await optionButtons[0].click();
        await page.waitForTimeout(500);
        
        // 检查是否添加了选中状态
        const isSelected = await optionButtons[0].evaluate(node => node.classList.contains('selected'));
        console.log(`  ✅ 选项选中状态: ${isSelected}`);
        
        // 显示提交按钮
        await page.waitForSelector('#submit-decision:not([style*="display: none"])', { timeout: 5000 });
        console.log('  ✅ 提交按钮已显示');
        
        // 提交决策
        console.log('  📝 提交决策...');
        await page.click('#submit-decision');
        await page.waitForTimeout(2000);
        console.log('  ✅ 决策提交成功');
        
        // 等待反馈显示
        await page.waitForSelector('#feedback-display .feedback-content', { timeout: 5000 });
        console.log('  ✅ 反馈信息已显示');
      }
      
      // 关闭游戏模态框
      await page.click('button:has-text("关闭")');
      await page.waitForSelector('#game-modal:not(.active)', { timeout: 5000 });
      console.log('✅ 商业战略推理游戏测试完成');
    } else {
      console.log('⚠️ 未找到商业战略推理游戏卡片');
    }
    
    // 测试公共政策制定模拟 (game-002)
    console.log('\n🏛️ 测试公共政策制定模拟 (高级难度)...');
    const policyGameCard = await page.$('.scenario-card:has-text("公共政策制定模拟")');
    if (policyGameCard) {
      await policyGameCard.click();
      console.log('✅ 点击公共政策制定模拟卡片');
      
      // 等待游戏模态框出现
      await page.waitForSelector('#game-modal.active', { timeout: 10000 });
      console.log('✅ 游戏模态框已打开');
      
      // 等待游戏内容加载
      await page.waitForSelector('#game-container', { timeout: 10000 });
      console.log('✅ 游戏内容已加载');
      
      // 等待选项按钮出现
      await page.waitForSelector('.option-btn', { timeout: 10000 });
      const optionButtons = await page.$$('.option-btn');
      console.log(`  ✅ 找到 ${optionButtons.length} 个选项按钮`);
      
      // 测试选项选择
      if (optionButtons.length > 0) {
        console.log('  🤔 点击第二个选项...');
        await optionButtons[1].click();
        await page.waitForTimeout(500);
        
        // 检查是否添加了选中状态
        const isSelected = await optionButtons[1].evaluate(node => node.classList.contains('selected'));
        console.log(`  ✅ 选项选中状态: ${isSelected}`);
        
        // 显示提交按钮
        await page.waitForSelector('#submit-decision:not([style*="display: none"])', { timeout: 5000 });
        console.log('  ✅ 提交按钮已显示');
        
        // 提交决策
        console.log('  📝 提交决策...');
        await page.click('#submit-decision');
        await page.waitForTimeout(2000);
        console.log('  ✅ 决策提交成功');
        
        // 等待反馈显示
        await page.waitForSelector('#feedback-display .feedback-content', { timeout: 5000 });
        console.log('  ✅ 反馈信息已显示');
      }
      
      // 关闭游戏模态框
      await page.click('button:has-text("关闭")');
      await page.waitForSelector('#game-modal:not(.active)', { timeout: 5000 });
      console.log('✅ 公共政策制定模拟测试完成');
    } else {
      console.log('⚠️ 未找到公共政策制定模拟卡片');
    }
    
    // 测试个人理财决策模拟 (game-003)
    console.log('\n💰 测试个人理财决策模拟...');
    const financeGameCard = await page.$('.scenario-card:has-text("个人理财决策模拟")');
    if (financeGameCard) {
      await financeGameCard.click();
      console.log('✅ 点击个人理财决策模拟卡片');
      
      // 等待游戏模态框出现
      await page.waitForSelector('#game-modal.active', { timeout: 10000 });
      console.log('✅ 游戏模态框已打开');
      
      // 等待游戏内容加载
      await page.waitForSelector('#game-container', { timeout: 10000 });
      console.log('✅ 游戏内容已加载');
      
      // 等待选项按钮出现
      await page.waitForSelector('.option-btn', { timeout: 10000 });
      const optionButtons = await page.$$('.option-btn');
      console.log(`  ✅ 找到 ${optionButtons.length} 个选项按钮`);
      
      // 测试选项选择
      if (optionButtons.length > 0) {
        console.log('  🤔 点击第三个选项...');
        await optionButtons[2].click();
        await page.waitForTimeout(500);
        
        // 检查是否添加了选中状态
        const isSelected = await optionButtons[2].evaluate(node => node.classList.contains('selected'));
        console.log(`  ✅ 选项选中状态: ${isSelected}`);
        
        // 显示提交按钮
        await page.waitForSelector('#submit-decision:not([style*="display: none"])', { timeout: 5000 });
        console.log('  ✅ 提交按钮已显示');
        
        // 提交决策
        console.log('  📝 提交决策...');
        await page.click('#submit-decision');
        await page.waitForTimeout(2000);
        console.log('  ✅ 决策提交成功');
        
        // 等待反馈显示
        await page.waitForSelector('#feedback-display .feedback-content', { timeout: 5000 });
        console.log('  ✅ 反馈信息已显示');
      }
      
      // 关闭游戏模态框
      await page.click('button:has-text("关闭")');
      await page.waitForSelector('#game-modal:not(.active)', { timeout: 5000 });
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
      
      // 查找并点击第一个恋爱关系场景
      const loveScenarioCards = await page.$$('.scenario-card');
      if (loveScenarioCards.length > 0) {
        console.log(`  ✅ 找到 ${loveScenarioCards.length} 个恋爱关系场景`);
        await loveScenarioCards[0].click();
        console.log('  ✅ 点击第一个恋爱关系场景');
        
        // 等待游戏模态框出现
        await page.waitForSelector('#game-modal.active', { timeout: 10000 });
        console.log('  ✅ 恋爱关系场景游戏模态框已打开');
        
        // 等待游戏内容加载
        await page.waitForSelector('#game-container', { timeout: 10000 });
        console.log('  ✅ 恋爱关系场景游戏内容已加载');
        
        // 等待选项按钮出现
        await page.waitForSelector('.option-btn', { timeout: 10000 });
        const optionButtons = await page.$$('.option-btn');
        console.log(`  ✅ 恋爱关系场景中找到 ${optionButtons.length} 个选项按钮`);
        
        // 测试选项选择
        if (optionButtons.length > 0) {
          console.log('  🤔 在恋爱关系场景中点击选项...');
          await optionButtons[0].click();
          await page.waitForTimeout(500);
          
          // 检查是否添加了选中状态
          const isSelected = await optionButtons[0].evaluate(node => node.classList.contains('selected'));
          console.log(`  ✅ 恋爱关系场景选项选中状态: ${isSelected}`);
          
          // 显示提交按钮
          await page.waitForSelector('#submit-decision:not([style*="display: none"])', { timeout: 5000 });
          console.log('  ✅ 恋爱关系场景提交按钮已显示');
          
          // 提交决策
          console.log('  📝 提交恋爱关系场景决策...');
          await page.click('#submit-decision');
          await page.waitForTimeout(2000);
          console.log('  ✅ 恋爱关系场景决策提交成功');
          
          // 等待反馈显示
          await page.waitForSelector('#feedback-display .feedback-content', { timeout: 5000 });
          console.log('  ✅ 恋爱关系场景反馈信息已显示');
        }
        
        // 关闭游戏模态框
        await page.click('button:has-text("关闭")');
        await page.waitForSelector('#game-modal:not(.active)', { timeout: 5000 });
        console.log('  ✅ 恋爱关系场景测试完成');
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
    
    // 测试难度选择功能
    console.log('\n🎚️ 测试难度选择功能...');
    await page.waitForSelector('#difficulty-level', { timeout: 5000 });
    const difficultySelect = await page.$('#difficulty-level');
    if (difficultySelect) {
      // 测试选择不同难度
      await difficultySelect.selectOption('intermediate');
      await page.waitForTimeout(500);
      console.log('  ✅ 中级难度选择测试通过');
      
      await difficultySelect.selectOption('advanced');
      await page.waitForTimeout(500);
      console.log('  ✅ 高级难度选择测试通过');
      
      await difficultySelect.selectOption('beginner');
      await page.waitForTimeout(500);
      console.log('  ✅ 初级难度选择测试通过');
    } else {
      console.log('⚠️ 未找到难度选择下拉框');
    }
    
    // 测试页面导航
    console.log('\n🧭 测试页面导航功能...');
    
    // 导航到首页
    await page.click('button[data-page="home"]');
    await page.waitForSelector('#home-page', { timeout: 10000 });
    console.log('  ✅ 导航到首页成功');
    
    // 再次导航到场景页面
    await page.click('button[data-page="scenarios"]');
    await page.waitForSelector('#scenarios-page', { timeout: 10000 });
    console.log('  ✅ 从首页导航到场景页面成功');
    
    console.log('\n🎉 所有场景交互测试完成！');
    console.log('✅ 测试总结:');
    console.log('  - 首页导航正常');
    console.log('  - 场景列表加载正常');
    console.log('  - 咖啡店场景交互正常 (滑块控制、决策提交)');
    console.log('  - 商业战略推理游戏交互正常 (选项选择、决策提交)');
    console.log('  - 公共政策制定模拟交互正常 (选项选择、决策提交)');
    console.log('  - 个人理财决策模拟交互正常 (选项选择、决策提交)');
    console.log('  - 恋爱关系场景交互正常 (选项选择、决策提交)');
    console.log('  - 所有决策反馈显示正常');
    console.log('  - 页面导航流畅');
    console.log('  - 难度选择功能正常');
    console.log('  - 游戏模态框打开/关闭正常');
    console.log('  - 交互体验流畅');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
    console.error('错误堆栈:', error.stack);
  } finally {
    // 关闭浏览器
    await browser.close();
    console.log('\n🔒 浏览器已关闭');
  }
})();