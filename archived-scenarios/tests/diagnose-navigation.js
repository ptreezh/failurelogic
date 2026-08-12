/**
 * 诊断导航问题
 */
const { chromium } = require('playwright');

(async function diagnoseNavigation() {
  console.log('🔍 开始诊断导航问题...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 监听控制台消息
  page.on('console', msg => {
    console.log(`[浏览器] ${msg.type()}: ${msg.text()}`);
  });
  
  try {
    // 1. 访问首页
    console.log('📱 步骤1: 访问首页...');
    await page.goto('http://localhost:8080', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('✅ 首页加载成功\n');
    
    // 2. 检查首页状态
    console.log('📊 步骤2: 检查首页状态...');
    const homePageActive = await page.evaluate(() => {
      const homePage = document.getElementById('home-page');
      return homePage ? homePage.classList.contains('active') : false;
    });
    console.log(`首页active: ${homePageActive}\n`);
    
    // 3. 点击场景导航
    console.log('📱 步骤3: 点击场景导航...');
    await page.click('[data-page="scenarios"]');
    await page.waitForTimeout(1000);
    
    // 4. 检查场景页面状态
    console.log('📊 步骤4: 检查场景页面状态...');
    const scenariosPageActive = await page.evaluate(() => {
      const scenariosPage = document.getElementById('scenarios-page');
      return scenariosPage ? scenariosPage.classList.contains('active') : false;
    });
    console.log(`场景页面active: ${scenariosPageActive}\n`);
    
    // 5. 检查所有page的active状态
    console.log('📊 步骤5: 检查所有page的active状态...');
    const allPagesActive = await page.evaluate(() => {
      const pages = document.querySelectorAll('.page');
      const result = {};
      pages.forEach(p => {
        result[p.id] = p.classList.contains('active');
      });
      return result;
    });
    console.log('Pages active状态:', JSON.stringify(allPagesActive, null, 2));
    console.log('');
    
    // 6. 检查场景网格
    console.log('📊 步骤6: 检查场景网格...');
    const gridExists = await page.evaluate(() => {
      return !!document.getElementById('scenarios-grid');
    });
    console.log(`场景网格存在: ${gridExists}`);
    
    if (gridExists) {
      const cardCount = await page.locator('.scenario-card').count();
      console.log(`场景卡片数量: ${cardCount}`);
    }
    
    console.log('\n✅ 诊断完成');
    
  } catch (error) {
    console.error('\n❌ 诊断过程中出错:');
    console.error(error.message);
  } finally {
    await browser.close();
  }
})();
