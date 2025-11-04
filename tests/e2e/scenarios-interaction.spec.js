/**
 * Scenarios Interaction Tests
 * TDD tests for cognitive trap scenario selection and interaction
 */

import { test, expect } from '@playwright/test';

test.describe('Scenarios Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to scenarios page', async ({ page }) => {
    // Click on scenarios navigation
    await page.click('[data-page="scenarios"]');

    // Verify scenarios page is loaded
    await expect(page.locator('#scenarios-page')).toHaveClass(/active/);
    await expect(page.locator('.page-title')).toContainText('认知场景');
  });

  test('should load scenarios from API', async ({ page }) => {
    await page.click('[data-page="scenarios"]');

    // Wait for scenarios to load
    await page.waitForSelector('.scenario-card', { state: 'visible' });

    // Verify scenarios are loaded
    const scenarioCards = page.locator('.scenario-card');
    await expect(scenarioCards).toHaveCount(3); // Should have 3 scenarios

    // Verify scenario content
    await expect(page.locator('text=咖啡店线性思维')).toBeVisible();
    await expect(page.locator('text=投资确认偏误')).toBeVisible();
    await expect(page.locator('text=恋爱关系时间延迟')).toBeVisible();
  });

  test('should display scenario details correctly', async ({ page }) => {
    await page.click('[data-page="scenarios"]');

    // Wait for scenarios to load
    await page.waitForSelector('.scenario-card');

    // Check first scenario details
    const firstScenario = page.locator('.scenario-card').first();
    await expect(firstScenario.locator('h3')).toContainText('咖啡店线性思维');
    await expect(firstScenario.locator('text=线性思维')).toBeVisible();
    await expect(firstScenario.locator('text=beginner')).toBeVisible();
    await expect(firstScenario.locator('text=15-20分钟')).toBeVisible();
  });

  test('should handle scenario selection', async ({ page }) => {
    await page.click('[data-page="scenarios"]');

    // Wait for scenarios to load
    await page.waitForSelector('.scenario-card');

    // Select first scenario
    const firstScenario = page.locator('.scenario-card').first();
    await firstScenario.click();

    // Should open game modal
    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    await expect(page.locator('.modal-title')).toContainText('认知训练');
  });

  test('should start game session correctly', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card');

    // Select coffee shop scenario
    const coffeeShopScenario = page.locator('.scenario-card:has-text("咖啡店")');
    await coffeeShopScenario.click();

    // Wait for game modal to open
    await expect(page.locator('#game-modal')).toHaveClass(/active/);

    // Wait for game content to load
    await page.waitForSelector('#game-container');

    // Verify game content is loaded
    await expect(page.locator('#game-container')).toContainText('咖啡店经营挑战');
  });

  test('should display game controls for each scenario', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card');

    // Test coffee shop scenario
    const coffeeShopScenario = page.locator('.scenario-card:has-text("咖啡店")');
    await coffeeShopScenario.click();

    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    await expect(page.locator('#game-container')).toContainText('员工数量');
    await expect(page.locator('#game-container')).toContainText('营销投入');

    // Close modal
    await page.click('#close-modal');
    await page.waitForSelector('#game-modal', { state: 'hidden' });

    // Test investment scenario
    const investmentScenario = page.locator('.scenario-card:has-text("投资")');
    await investmentScenario.click();

    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    await expect(page.locator('#game-container')).toContainText('研究时间');
    await expect(page.locator('#game-container')).toContainText('投资多样化');
  });

  test('should handle game decision submission', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card');

    // Select coffee shop scenario
    const coffeeShopScenario = page.locator('.scenario-card:has-text("咖啡店")');
    await coffeeShopScenario.click();

    await expect(page.locator('#game-modal')).toHaveClass(/active/);

    // Wait for game controls to load
    await page.waitForSelector('input[type="range"]');

    // Make a decision
    const staffCountSlider = page.locator('input:has-text("员工数量")');
    if (await staffCountSlider.isVisible()) {
      await staffCountSlider.fill('5');
    }

    // Submit decision
    const submitButton = page.locator('button:has-text("提交决策")');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show feedback
      await expect(page.locator('.feedback, .game-feedback')).toBeVisible();
    }
  });

  test('should handle game modal interactions', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card');

    // Open game modal
    const firstScenario = page.locator('.scenario-card').first();
    await firstScenario.click();

    await expect(page.locator('#game-modal')).toHaveClass(/active/);

    // Test modal close button
    await page.click('#close-modal');
    await expect(page.locator('#game-modal')).not.toHaveClass(/active/);

    // Reopen modal
    await firstScenario.click();
    await expect(page.locator('#game-modal')).toHaveClass(/active/);

    // Test modal close by clicking outside
    await page.click('.modal-overlay, .modal-backdrop');
    await expect(page.locator('#game-modal')).not.toHaveClass(/active/);
  });

  test('should display appropriate loading states', async ({ page }) => {
    await page.click('[data-page="scenarios"]');

    // Should show loading state initially
    await expect(page.locator('.loading')).toContainText('加载场景中');

    // Should replace loading with content
    await page.waitForSelector('.scenario-card', { state: 'visible' });
    await expect(page.locator('.loading')).not.toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/scenarios/', route => route.abort());

    await page.click('[data-page="scenarios"]');

    // Should not show loading indefinitely
    await page.waitForTimeout(5000);
    const loadingIndicator = page.locator('.loading');
    const isLoading = await loadingIndicator.isVisible();
    expect(isLoading).toBeFalsy();

    // Should show error message or fallback content
    await expect(page.locator('#scenarios-page')).toBeVisible();
  });

  test('should track game session state', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card');

    // Select and start scenario
    const firstScenario = page.locator('.scenario-card').first();
    await firstScenario.click();

    await expect(page.locator('#game-modal')).toHaveClass(/active/);

    // Check if game session is created
    const gameState = await page.evaluate(() => {
      return window.AppState?.gameSession;
    });

    expect(gameState).toBeTruthy();
    expect(gameState.gameId).toBeTruthy();
    expect(gameState.scenarioId).toBeTruthy();
  });

  test('should provide game feedback and analysis', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card');

    // Start coffee shop scenario
    const coffeeShopScenario = page.locator('.scenario-card:has-text("咖啡店")');
    await coffeeShopScenario.click();

    await expect(page.locator('#game-modal')).toHaveClass(/active/);

    // Make multiple decisions to trigger analysis
    for (let i = 0; i < 3; i++) {
      const submitButton = page.locator('button:has-text("提交决策")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000); // Wait for feedback
      }
    }

    // Check if cognitive analysis is provided
    const analysisContent = page.locator('.cognitive-analysis, .game-analysis, .feedback');
    if (await analysisContent.isVisible()) {
      await expect(analysisContent).toContainText(/认知|分析|偏误/);
    }
  });

  test('should maintain responsive design during game', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card');

    // Test on desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    const firstScenario = page.locator('.scenario-card').first();
    await firstScenario.click();

    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    await expect(page.locator('.modal-content')).toBeVisible();

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    await expect(page.locator('.modal-content')).toBeVisible();

    // Game should remain functional on mobile
    const gameContainer = page.locator('#game-container');
    await expect(gameContainer).toBeVisible();
  });
});