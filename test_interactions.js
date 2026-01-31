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
    await page.waitForTimeout(3000);

    // 检查页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}`);

    // 等待NavigationManager可用
    console.log('等待NavigationManager初始化...');
    await page.waitForFunction(() => window.NavigationManager !== undefined, { timeout: 10000 });
    console.log('NavigationManager已初始化');

    // 点击导航到场景页面
    console.log('点击导航到场景页面...');
    const scenariosNavButton = await page.$('[data-page="scenarios"]');
    if (scenariosNavButton) {
      await scenariosNavButton.click();
      console.log('已点击场景导航按钮');
    } else {
      console.log('未找到场景导航按钮');
    }

    // 等待场景页面加载
    console.log('等待场景页面加载...');
    await page.waitForSelector('#scenarios-page.active', { timeout: 10000 });
    console.log('场景页面已激活');

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
      console.log('难度选择器不可见，可能仍在加载中...');
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
      // 点击第一个场景卡片
      console.log('点击第一个场景卡片...');
      await scenarioCards[0].click();
      console.log('已点击第一个场景卡片');

      // 等待游戏模态框出现
      console.log('等待游戏模态框...');
      await page.waitForSelector('#game-modal.active', { timeout: 10000 });
      console.log('游戏模态框已显示');
    } else {
      console.log('未找到场景卡片');
    }

    // 保持浏览器打开一段时间以便观察
    console.log('保持浏览器打开10秒钟...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    // 关闭浏览器
    console.log('关闭浏览器...');
    await browser.close();
  }
})();