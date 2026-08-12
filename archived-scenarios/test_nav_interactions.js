const { chromium } = require('playwright');

(async () => {
  // 启动Microsoft Edge浏览器
  const browser = await chromium.launch({
    headless: false,  // 非无头模式，以便能看到交互
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  // 创建新页面
  const page = await browser.newPage();

  try {
    // 设置视口大小
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 访问网站
    console.log('正在访问 http://localhost:8081');
    await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded' });

    // 等待页面完全加载
    console.log('等待页面加载...');
    await page.waitForTimeout(5000);

    // 检查页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}`);

    // 检查是否存在导航按钮
    console.log('检查导航按钮...');
    const navButtons = await page.$$('.nav-item[data-page]');
    console.log(`找到 ${navButtons.length} 个导航按钮`);

    // 查找并点击场景导航按钮
    console.log('查找场景导航按钮...');
    const scenariosButton = await page.$('[data-page="scenarios"]');
    
    if (scenariosButton) {
      console.log('场景导航按钮已找到，等待其可点击...');
      
      // 等待按钮可点击
      await page.waitForSelector('[data-page="scenarios"]', { state: 'visible' });
      await page.waitForTimeout(1000);
      
      // 点击场景导航按钮
      console.log('点击场景导航按钮...');
      await scenariosButton.click();
      console.log('已点击场景导航按钮');
      
      // 等待页面切换
      console.log('等待页面切换...');
      await page.waitForTimeout(3000);
      
      // 检查场景页面是否激活
      const isScenariosActive = await page.$eval('#scenarios-page', el => el.classList.contains('active'));
      console.log(`场景页面是否激活: ${isScenariosActive}`);
      
      if (isScenariosActive) {
        console.log('场景页面已成功激活');
        
        // 等待难度选择器出现
        console.log('等待难度选择器...');
        await page.waitForSelector('#difficulty-level', { timeout: 10000 });
        console.log('难度选择器已找到');
        
        // 检查难度选择器是否可见
        const difficultySelectorVisible = await page.isVisible('#difficulty-level');
        console.log(`难度选择器是否可见: ${difficultySelectorVisible}`);
        
        if (difficultySelectorVisible) {
          // 选择一个难度
          console.log('选择中级难度...');
          await page.selectOption('#difficulty-level', 'intermediate');
          console.log('已选择中级难度');
        } else {
          console.log('难度选择器不可见');
        }
        
        // 等待场景卡片加载
        console.log('等待场景卡片加载...');
        await page.waitForFunction(() => {
          const cards = document.querySelectorAll('#scenarios-grid .scenario-card');
          return cards.length > 0;
        }, { timeout: 10000 });
        
        // 获取场景卡片
        const scenarioCards = await page.$$('.scenario-card');
        console.log(`找到 ${scenarioCards.length} 个场景卡片`);
        
        if (scenarioCards.length > 0) {
          console.log('点击第一个场景卡片...');
          await page.waitForTimeout(1000); // 等待确保元素稳定
          await scenarioCards[0].click();
          console.log('已点击第一个场景卡片');
          
          // 等待游戏模态框出现
          console.log('等待游戏模态框...');
          await page.waitForSelector('#game-modal', { timeout: 10000, state: 'visible' });
          console.log('游戏模态框已显示');
        } else {
          console.log('未找到场景卡片');
        }
      } else {
        console.log('场景页面未激活');
      }
    } else {
      console.log('未找到场景导航按钮');
    }

    // 保持浏览器打开一段时间以便观察
    console.log('保持浏览器打开15秒钟...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    // 关闭浏览器
    console.log('关闭浏览器...');
    await browser.close();
  }
})();