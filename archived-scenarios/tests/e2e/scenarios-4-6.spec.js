/**
 * Scenarios 4-6 E2E Tests
 * Tests for Business Strategy, Public Policy, and Personal Finance scenarios
 */

import { test, expect } from '@playwright/test';

test.describe('Scenario 4: Business Strategy Reasoning Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should load business strategy scenario card', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    // Find business strategy scenario
    const businessStrategyCard = page.locator('.scenario-card:has-text("商业战略推理游戏")').first();
    await expect(businessStrategyCard).toBeVisible();
    
    // Verify scenario details
    await expect(businessStrategyCard).toContainText('intermediate');
    await expect(businessStrategyCard).toContainText('30');
  });

  test('should start business strategy game successfully', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    // Find and click business strategy scenario
    const businessStrategyCard = page.locator('.scenario-card:has-text("商业战略推理游戏")').first();
    await businessStrategyCard.click();

    // Wait for game modal to be visible (check visibility instead of class)
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });
    
    // Wait for game content to load
    await page.waitForSelector('#game-container', { state: 'attached', timeout: 10000 });
    await page.waitForFunction(() => {
      const container = document.getElementById('game-container');
      return container && container.innerHTML.length > 100;
    }, { timeout: 10000 });

    // Verify game start page
    await expect(page.locator('#game-container')).toContainText('商业战略推理游戏');
    await expect(page.locator('#game-container')).toContainText('CEO');
  });

  test('should complete business strategy turn 1', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    const businessStrategyCard = page.locator('.scenario-card:has-text("商业战略推理游戏")').first();
    await businessStrategyCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click start button - scroll into view first
    const startButton = page.locator('#game-container button:has-text("开始决策")').first();
    await expect(startButton).toBeVisible({ timeout: 5000 });
    await startButton.scrollIntoViewIfNeeded();
    await startButton.click();

    await page.waitForTimeout(1000);

    // Verify turn 1 page loaded
    await expect(page.locator('#game-container')).toContainText('第1回合决策');

    // Check for decision options
    const optionCards = page.locator('#game-container .option-card');
    await expect(optionCards.first()).toBeVisible();

    // Count should be at least 3 options
    const count = await optionCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should make decision and see feedback in business strategy', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    const businessStrategyCard = page.locator('.scenario-card:has-text("商业战略推理游戏")').first();
    await businessStrategyCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Start game
    await page.locator('#game-container button:has-text("开始决策")').first().click();
    await page.waitForTimeout(1000);

    // Select first option
    const firstOption = page.locator('#game-container .option-card').first();
    await firstOption.click();
    
    // Click choice button
    const choiceButton = page.locator('#game-container .choice-btn').first();
    await choiceButton.click();

    await page.waitForTimeout(1000);

    // Should show feedback page
    await expect(page.locator('#game-container')).toContainText('决策已确认');
  });

  test('should display game state metrics in business strategy', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    const businessStrategyCard = page.locator('.scenario-card:has-text("商业战略推理游戏")').first();
    await businessStrategyCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Start game
    await page.locator('#game-container button:has-text("开始决策")').first().click();
    await page.waitForTimeout(1000);

    // Check for state metrics display
    await expect(page.locator('#game-container')).toContainText('资金');
    await expect(page.locator('#game-container')).toContainText('声誉');
    await expect(page.locator('#game-container')).toContainText('市场地位');
  });
});

test.describe('Scenario 5: Public Policy Making Simulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should load public policy scenario card', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    // Find public policy scenario
    const publicPolicyCard = page.locator('.scenario-card:has-text("公共政策制定模拟")').first();
    await expect(publicPolicyCard).toBeVisible();
    
    // Verify scenario details
    await expect(publicPolicyCard).toContainText('intermediate');
    await expect(publicPolicyCard).toContainText('35');
  });

  test('should start public policy game successfully', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    // Find and click public policy scenario
    const publicPolicyCard = page.locator('.scenario-card:has-text("公共政策制定模拟")').first();
    await publicPolicyCard.click();

    // Wait for game modal to be visible
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });
    
    // Wait for game content to load
    await page.waitForSelector('#game-container', { state: 'attached', timeout: 10000 });
    await page.waitForFunction(() => {
      const container = document.getElementById('game-container');
      return container && container.innerHTML.length > 100;
    }, { timeout: 10000 });

    // Verify game start page
    await expect(page.locator('#game-container')).toContainText('公共政策制定模拟');
    await expect(page.locator('#game-container')).toContainText('城市规划者');
  });

  test('should complete public policy turn 1', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    const publicPolicyCard = page.locator('.scenario-card:has-text("公共政策制定模拟")').first();
    await publicPolicyCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click start button
    const startButton = page.locator('#game-container button:has-text("开始决策")').first();
    await expect(startButton).toBeVisible({ timeout: 5000 });
    await startButton.click();

    await page.waitForTimeout(1000);

    // Verify turn 1 page loaded
    await expect(page.locator('#game-container')).toContainText('第1回合决策');
    
    // Check for decision options
    const optionCards = page.locator('#game-container .option-card');
    await expect(optionCards.first()).toBeVisible();
    
    // Count should be at least 3 options
    const count = await optionCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should make decision and see feedback in public policy', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    const publicPolicyCard = page.locator('.scenario-card:has-text("公共政策制定模拟")').first();
    await publicPolicyCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Start game
    await page.locator('#game-container button:has-text("开始决策")').first().click();
    await page.waitForTimeout(1000);

    // Select first option
    const firstOption = page.locator('#game-container .option-card').first();
    await firstOption.click();
    
    // Click choice button
    const choiceButton = page.locator('#game-container .choice-btn').first();
    await choiceButton.click();

    await page.waitForTimeout(1000);

    // Should show feedback page
    await expect(page.locator('#game-container')).toContainText('决策已确认');
  });

  test('should display game state metrics in public policy', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    const publicPolicyCard = page.locator('.scenario-card:has-text("公共政策制定模拟")').first();
    await publicPolicyCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Start game
    await page.locator('#game-container button:has-text("开始决策")').first().click();
    await page.waitForTimeout(1000);

    // Check for state metrics display
    await expect(page.locator('#game-container')).toContainText('预算');
    await expect(page.locator('#game-container')).toContainText('信任');
    await expect(page.locator('#game-container')).toContainText('政策效果');
    await expect(page.locator('#game-container')).toContainText('民众支持');
  });
});

test.describe('Scenario 6: Personal Finance Decision Simulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should load personal finance scenario card', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    // Find personal finance scenario
    const personalFinanceCard = page.locator('.scenario-card:has-text("个人财务决策模拟")').first();
    await expect(personalFinanceCard).toBeVisible();
    
    // Verify scenario details
    await expect(personalFinanceCard).toContainText('beginner');
    await expect(personalFinanceCard).toContainText('25');
  });

  test('should start personal finance game successfully', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    // Find and click personal finance scenario
    const personalFinanceCard = page.locator('.scenario-card:has-text("个人财务决策模拟")').first();
    await personalFinanceCard.click();

    // Wait for game modal to be visible
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });

    // Wait for game content to load
    await page.waitForSelector('#game-container', { state: 'attached', timeout: 10000 });
    await page.waitForFunction(() => {
      const container = document.getElementById('game-container');
      return container && container.innerHTML.length > 100;
    }, { timeout: 10000 });

    // Verify game start page - use actual content
    await expect(page.locator('#game-container')).toContainText('个人财务决策模拟');
  });

  test('should complete personal finance turn 1', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    const personalFinanceCard = page.locator('.scenario-card:has-text("个人财务决策模拟")').first();
    await personalFinanceCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click start button
    const startButton = page.locator('#game-container button:has-text("开始挑战")').first();
    await expect(startButton).toBeVisible({ timeout: 5000 });
    await startButton.click();

    await page.waitForTimeout(1000);

    // Verify turn 1 page loaded
    await expect(page.locator('#game-container')).toContainText('第1回合');

    // Click decision start button
    const decisionStartButton = page.locator('#game-container button:has-text("开始决策")').first();
    if (await decisionStartButton.count() > 0) {
      await decisionStartButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify decision page loaded with decision options
    await expect(page.locator('#game-container')).toContainText('决策选项');

    // Check for decision inputs (sliders)
    const sliders = page.locator('#game-container input[type="range"]');
    await expect(sliders.first()).toBeVisible();
  });

  test('should make decision and see feedback in personal finance', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    const personalFinanceCard = page.locator('.scenario-card:has-text("个人财务决策模拟")').first();
    await personalFinanceCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Start game
    await page.locator('#game-container button:has-text("开始挑战")').first().click();
    await page.waitForTimeout(1000);

    // Click decision start button
    const decisionStartButton = page.locator('#game-container button:has-text("开始决策")').first();
    if (await decisionStartButton.count() > 0) {
      await decisionStartButton.click();
      await page.waitForTimeout(1000);
    }

    // Fill in decision form - adjust first slider
    const firstSlider = page.locator('#game-container input[type="range"]').first();
    if (await firstSlider.count() > 0) {
      await firstSlider.fill('20');
      await firstSlider.dispatchEvent('input');
      await page.waitForTimeout(500);
    }

    // Submit decision
    const submitButton = page.locator('#game-container button:has-text("提交决策")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Should show feedback page
    await expect(page.locator('#game-container')).toContainText('回合结果');
  });

  test('should display game state metrics in personal finance', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });

    const personalFinanceCard = page.locator('.scenario-card:has-text("个人财务决策模拟")').first();
    await personalFinanceCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Start game
    await page.locator('#game-container button:has-text("开始挑战")').first().click();
    await page.waitForTimeout(1000);

    // Click decision start button
    const decisionStartButton = page.locator('#game-container button:has-text("开始决策")').first();
    if (await decisionStartButton.count() > 0) {
      await decisionStartButton.click();
      await page.waitForTimeout(1000);
    }

    // Check for state metrics display
    await expect(page.locator('#game-container')).toContainText('可用资源');
    await expect(page.locator('#game-container')).toContainText('月收入');
    await expect(page.locator('#game-container')).toContainText('决策选项');
  });
});
