/**
 * Coffee Shop Foundation E2E
 *
 * 目标：验证浏览器中咖啡店场景的最基本可达性
 *   - 首页加载
 *   - 场景页可见
 *   - 咖啡店卡片可点击并打开游戏模态框
 *   - 模态框中能渲染"开始经营"按钮
 *
 * 这只是基础设施层测试。每轮迭代会在此基础上扩展：
 *   轮1：6 回合即时反馈断言
 *   轮2：延迟效果触发断言
 *   轮3：阈值预警 + 级联链断言
 *   轮4：觉醒时刻 overlay + learningPoint 断言
 *   轮8：全链路回归 + 韧性
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Coffee Shop - Foundation', () => {
  test.beforeEach(async ({ page, context }) => {
    // 禁用缓存确保加载最新 JS
    await context.route('**/*', (route) => {
      const headers = { ...route.request().headers(), 'Cache-Control': 'no-cache' };
      route.continue({ headers });
    });
  });

  test('home page loads with brand', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('.brand-text')).toContainText('Failure Logic');
  });

  test('scenarios page lists coffee-shop card', async ({ page }) => {
    await page.goto(BASE_URL);

    // 导航到场景页
    await page.locator('.nav-item[data-page="scenarios"]').click();

    // 等场景网格渲染
    await expect(page.locator('#scenarios-grid')).toBeVisible({ timeout: 5000 });

    // 咖啡店卡片可见（使用 partial match，因为 title 是 "咖啡店线性思维"）
    const coffeeCard = page.locator('.scenario-card', { hasText: '咖啡店' }).first();
    await expect(coffeeCard).toBeVisible({ timeout: 5000 });
  });

  test('clicking coffee-shop card opens game modal with start button', async ({ page }) => {
    await page.goto(BASE_URL);

    // 导航到场景页
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await expect(page.locator('#scenarios-grid')).toBeVisible({ timeout: 5000 });

    // 关闭引导模态（如果存在）
    const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
    if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await welcomeClose.click();
    }

    // 点击咖啡店卡片
    const coffeeCard = page.locator('.scenario-card', { hasText: '咖啡店' }).first();
    await coffeeCard.click();

    // 游戏模态框出现
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 5000 });

    // 模态框内含"开始经营"按钮（路由的起始页）
    const startButton = page.locator('#game-modal button', { hasText: '开始经营' });
    await expect(startButton).toBeVisible({ timeout: 5000 });

    // 全局 router 已实例化
    const hasRouter = await page.evaluate(() => typeof window.coffeeShopRouter !== 'undefined' && window.coffeeShopRouter !== null);
    expect(hasRouter).toBeTruthy();
  });

  test('script tags do not reference empty router files', async ({ page }) => {
    // 这一断言保证我们不会重新引入空的 router 文件引用
    await page.goto(BASE_URL);
    const scriptSrcs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[src]')).map((s) => s.getAttribute('src'))
    );
    // 不应再引用 3 个空 router
    const bannedScripts = [
      'assets/js/ai-governance-router.js',
      'assets/js/investment-confirmation-bias-router.js',
      'assets/js/social-media-echo-chamber-router.js'
    ];
    for (const banned of bannedScripts) {
      expect(scriptSrcs.some((s) => s && s.includes(banned))).toBeFalsy();
    }
  });
});
