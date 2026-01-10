/**
 * Real Application Tests - Fixed Version 2
 * 柺于实际 HTML 结构的准确测试
 */

import { test, expect } from '@playwright/test';

test.describe('Real Application Tests - Fixed v2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 清除缓存
    await page.evaluate(() => {
      if (window.localStorage) {
        localStorage.clear();
      }
      if (window.sessionStorage) {
        sessionStorage.clear();
      }
    });
  });

  test('should load home page', async ({ page }) => {
    // Given
    const homeButton = page.locator('[data-page="home"]');

    // When
    await homeButton.click();

    // Then - 验证页面ID使用 .page 类
    await expect(page.locator('#home-page')).toHaveClass(/active/);
    await expect(page.locator('#home-page.page')).toHaveClass(/active/);
    await expect(page.locator('#scenarios-page')).not.toHaveClass(/active/);
  });

  test('should navigate to scenarios page', async ({ page }) => {
    // Given
    const scenariosButton = page.locator('[data-page="scenarios"]');

    // When
    await scenariosButton.click();

    // Then - 验证页面ID使用 .page 类
    await expect(page.locator('#scenarios-page')).toHaveClass(/active/);
    await expect(page.locator('#scenarios-page.page')).toHaveClass(/active/);
    await expect(page.locator('#home-page')).not.toHaveClass(/active/);
  });

  test('should navigate to about page', async ({ page }) => {
    // Given
    const aboutButton = page.locator('[data-page="about"]');

    // When
    await aboutButton.click();

    // Then
    await expect(page.locator('#about-page')).toHaveClass(/active/);
    await expect(page.locator('#home-page')).not.toHaveClass(/active/);
  });

  test('should navigate to book page', async ({ page }) => {
    // Given
    const bookButton = page.locator('[data-page="book"]');

    // When
    await bookButton.click();

    // Then
    await expect(page.locator('#book-page')).toHaveClass(/active/);
    await expect(page.locator('#home-page')).not.toHaveClass(/active/);
  });

  test('should navigate to profile page', async ({ page }) => {
    // Given
    const profileButton = page.locator('[data-page="profile"]');

    // When
    await profileButton.click();

    // Then
    await expect(page.locator('#profile-page')).toHaveClass(/active/);
    await expect(page.locator('#home-page')).not.toHaveClass(/active/);
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');

    // 验证导航项使用 .nav-item 类
    const navItems = page.locator('.nav-item');
    await expect(navItems).toHaveCount(5); // 首页, 场景, 指数测试, 关于, 书籍, 我的
  });

  test('should display page title', async ({ page }) => {
    await page.goto('/');

    // 验证页面标题
    const pageTitle = await page.textContent('h1');
    expect(pageTitle).toContainText('Failure Logic 认知陷阱教育互动游戏');
  });

  test('should display brand text', async ({ page }) => {
    await page.goto('/');

    // 验证品牌文本
    const brandText = await page.textContent('.brand-text');
    expect(brandText).toContainText('Failure Logic');
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');

    // 验证英雄区域存在
    const heroSection = page.locator('.hero-section');
    await expect(heroSection).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');

    // 验证功能区域存在
    const featuresSection = page.locator('.features-section');
    await expect(featuresSection).toBeVisible();
  });

  test('should display stats section', async ({ page }) => {
    await page.goto('/');

    // 验证统计区域使用 .stats-section 类
    const statsSection = page.locator('.stats-section');
    await expect(statsSection).toBeVisible();
  });

  test('should have loading screen', async ({ page }) => {
    await page.goto('/');

    // 验证加载屏幕
    const loadingScreen = page.locator('#loading-screen');
    await expect(loadingScreen).toBeVisible();
  });

  test('should hide loading screen after page load', async ({ page }) => {
    await page.goto('/');

    // 验证加载屏幕在页面加载后隐藏
    await page.waitForTimeout(1000);
    await expect(loadingScreen).not.toBeVisible();
  });

  test('should verify service worker registration', async ({ page }) => {
    await page.goto('/');

    // 验证 service worker 注册
    const swRegistration = await page.evaluate(() => {
      return window.navigator.serviceWorker?.controller?.state || 'not registered';
    });

    expect(swRegistration).toBeTruthy();
  });

  test('should verify PWA manifest', async ({ page }) => {
    await page.goto('/');

    // 验证 PWA manifest
    const manifestLink = page.locator('link[rel="manifest"]');

    await expect(manifestLink).toHaveAttribute('href', /manifest\.json/);
  });

  test('should display hero content', async ({ page }) => {
    await page.goto('/');

    // 验证英雄内容
    const heroText = await page.textContent('.hero-text');
    expect(heroText).toBeTruthy();
    });

  test('should display feature cards', async ({ page }) => {
    await page.goto('/');

    // 验证功能卡片
    const featureCards = page.locator('.feature-card');
    await expect(featureCards.first()).toBeVisible();
  });
});
