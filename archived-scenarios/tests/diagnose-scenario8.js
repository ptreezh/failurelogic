/**
 * 场景8 (AI治理) 渲染诊断脚本
 * 使用Playwright检查场景8的实际渲染状态
 */

const { chromium } = require('@playwright/test');

(async function diagnoseScenario8() {
  console.log('🔍 开始诊断场景8 (AI治理)渲染问题...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. 访问应用
    console.log('📱 步骤1: 访问应用首页...');
    await page.goto('http://localhost:8080', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('✅ 首页加载成功\n');
    
    // 2. 导航到场景页面
    console.log('📱 步骤2: 导航到场景页面...');
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { 
      state: 'visible', 
      timeout: 15000 
    });
    console.log('✅ 场景页面加载成功\n');
    
    // 3. 检查所有场景卡片
    console.log('📊 步骤3: 检查所有场景卡片...');
    const cards = await page.locator('.scenario-card');
    const count = await cards.count();
    console.log(`找到 ${count} 个场景卡片\n`);
    
    // 4. 列出所有场景标题
    console.log('📋 步骤4: 列出所有场景标题...');
    for (let i = 0; i < count; i++) {
      const title = await cards.nth(i).locator('h3').textContent();
      console.log(`  场景${i+1}: ${title.trim()}`);
    }
    console.log('');
    
    // 5. 检查场景8是否存在
    console.log('🔍 步骤5: 检查场景8 (AI治理)...');
    const aiTitle = page.locator('h3:has-text("AI治理")').first();
    const aiExists = await aiTitle.count() > 0;
    console.log(`场景8 (AI治理) 存在: ${aiExists}`);
    
    if (aiExists) {
      const aiVisible = await aiTitle.isVisible();
      console.log(`场景8 (AI治理) 可见: ${aiVisible}`);
      
      // 6. 点击场景8
      console.log('\n📱 步骤6: 点击场景8...');
      await aiTitle.click();
      await page.waitForTimeout(1000);
      
      // 7. 检查模态框
      console.log('🔍 步骤7: 检查模态框...');
      const modal = page.locator('#game-modal');
      const modalActive = await modal.evaluate(el => el.classList.contains('active'));
      console.log(`模态框激活: ${modalActive}`);
      
      // 8. 检查game-container
      console.log('\n🔍 步骤8: 检查game-container...');
      const gameContainer = page.locator('#game-container');
      const containerVisible = await gameContainer.isVisible();
      console.log(`game-container可见: ${containerVisible}`);
      
      const containerHTML = await gameContainer.innerHTML();
      console.log(`game-container HTML长度: ${containerHTML.length}`);
      
      if (containerHTML.length > 0) {
        console.log('\n📝 game-container内容预览:');
        console.log(containerHTML.substring(0, 500));
      }
      
      // 9. 检查开始按钮
      console.log('\n🔍 步骤9: 检查开始按钮...');
      const startButton = page.locator('#game-container button:has-text("开始挑战")').first();
      const startExists = await startButton.count() > 0;
      console.log(`"开始挑战"按钮存在: ${startExists}`);
      
      if (startExists) {
        const startVisible = await startButton.isVisible();
        console.log(`"开始挑战"按钮可见: ${startVisible}`);
      }
      
      // 10. 检查所有按钮
      console.log('\n🔍 步骤10: 列出game-container中所有按钮...');
      const buttons = page.locator('#game-container button');
      const buttonCount = await buttons.count();
      console.log(`按钮数量: ${buttonCount}`);
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const btnText = await buttons.nth(i).textContent();
        console.log(`  按钮${i+1}: ${btnText.trim()}`);
      }
      
    } else {
      console.log('\n❌ 场景8不存在！');
      console.log('\n可能原因:');
      console.log('  1. 场景数据未加载');
      console.log('  2. 场景过滤逻辑问题');
      console.log('  3. 场景ID不匹配');
    }
    
    console.log('\n✅ 诊断完成');
    
  } catch (error) {
    console.error('\n❌ 诊断过程中出错:');
    console.error(error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
})();
