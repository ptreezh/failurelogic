/**
 * Scenarios 6-7 Interaction Tests
 * TDD tests for Personal Finance and Climate Change scenarios
 */

import { test, expect } from '@playwright/test';

test.describe('Scenario 6: Personal Finance Decision', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });
  });

  test('should load personal finance scenario', async ({ page }) => {
    // Find personal finance scenario card
    const financeCard = page.locator('.scenario-card:has-text("个人财务"), .scenario-card:has-text("个人理财")');
    const count = await financeCard.count();
    
    // Should find at least one finance-related scenario
    expect(count).toBeGreaterThan(0);
  });

  test('should start personal finance game', async ({ page }) => {
    // Find and click finance scenario
    const financeCard = page.locator('.scenario-card:has-text("个人财务"), .scenario-card:has-text("个人理财")').first();
    await financeCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    
    // Wait for game container to have content
    await page.waitForFunction(() => {
      const container = document.getElementById('game-container');
      return container && container.innerHTML.length > 100;
    }, { timeout: 10000 });

    // Verify game container has content
    await expect(page.locator('#game-container')).not.toBeEmpty();
  });

  test('should display personal finance start page', async ({ page }) => {
    // Start finance game
    const financeCard = page.locator('.scenario-card:has-text("个人财务"), .scenario-card:has-text("个人理财")').first();
    await financeCard.click();

    // Wait for game content
    await page.waitForTimeout(2000);

    // Look for start button
    const startButton = page.locator('button:has-text("开始挑战")');
    expect(await startButton.count()).toBeGreaterThan(0);
  });

  test('should complete personal finance game flow', async ({ page }) => {
    // Start finance game
    const financeCard = page.locator('.scenario-card:has-text("个人财务"), .scenario-card:has-text("个人理财")').first();
    await financeCard.click();

    // Wait for game modal and content
    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    await page.waitForTimeout(2000);

    // Click start button inside game container
    const startButton = page.locator('#game-container button:has-text("开始挑战")').first();
    await startButton.click();

    // Wait for turn intro page
    await page.waitForTimeout(1000);
    
    // Click to start decision
    const decisionButton = page.locator('#game-container button:has-text("开始决策")').first();
    if (await decisionButton.count() > 0) {
      await decisionButton.click();
      await page.waitForTimeout(500);

      // Find and adjust sliders
      const sliders = page.locator('#game-container input[type="range"]');
      const sliderCount = await sliders.count();
      
      if (sliderCount > 0) {
        await sliders.first().evaluate(el => {
          el.value = '20';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.waitForTimeout(300);
      }

      // Click submit decision
      const submitButton = page.locator('#game-container button:has-text("提交决策")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Verify feedback page is shown
        const feedbackContent = page.locator('#game-container .feedback-content, #game-container .decision-summary');
        expect(await feedbackContent.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should complete multiple turns in personal finance game', async ({ page }) => {
    // Start finance game
    const financeCard = page.locator('.scenario-card:has-text("个人财务"), .scenario-card:has-text("个人理财")').first();
    await financeCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    await page.waitForTimeout(2000);

    // Click start button inside game container
    const startButton = page.locator('#game-container button:has-text("开始挑战")').first();
    await startButton.click();

    // Complete up to 3 turns
    for (let turn = 1; turn <= 3; turn++) {
      // Click to start decision
      const decisionButton = page.locator('#game-container button:has-text("开始决策")').first();
      if (await decisionButton.count() === 0) {
        break; // Game might be over
      }
      await decisionButton.click();
      await page.waitForTimeout(500);

      // Adjust first slider
      const sliders = page.locator('#game-container input[type="range"]');
      if (await sliders.count() > 0) {
        await sliders.first().evaluate(el => {
          el.value = '15';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
      await page.waitForTimeout(300);

      // Submit decision
      const submitButton = page.locator('#game-container button:has-text("提交决策")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);
      }

      // Go to next turn - try multiple possible button texts
      const nextButton = page.locator('#game-container button:has-text("进入第' + (turn + 1) + '回合"), #game-container button:has-text("进入下一回合"), #game-container button:has-text("开始决策")').first();
      if (await nextButton.count() > 0) {
        // If it's "开始决策" button, we're on intro page, click it to go to decision
        const btnText = await nextButton.textContent();
        if (btnText && btnText.includes('开始决策')) {
          await nextButton.click();
          await page.waitForTimeout(300);
        } else {
          await nextButton.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Verify game is still running or completed
    const modal = page.locator('#game-modal');
    await expect(modal).toHaveClass(/active/);
  });
});

test.describe('Scenario 7: Climate Change Policy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });
  });

  test('should load climate change scenario', async ({ page }) => {
    // Find climate change scenario card
    const climateCard = page.locator('.scenario-card:has-text("气候"), .scenario-card:has-text("Climate")');
    const count = await climateCard.count();
    
    // Should find at least one climate-related scenario
    expect(count).toBeGreaterThan(0);
  });

  test('should start climate change game', async ({ page }) => {
    // Find and click climate scenario
    const climateCard = page.locator('.scenario-card:has-text("气候"), .scenario-card:has-text("Climate")').first();
    await climateCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    
    // Wait for game container to have content
    await page.waitForFunction(() => {
      const container = document.getElementById('game-container');
      return container && container.innerHTML.length > 100;
    }, { timeout: 10000 });

    // Verify game container has content
    await expect(page.locator('#game-container')).not.toBeEmpty();
  });

  test('should display climate change start page', async ({ page }) => {
    // Start climate game
    const climateCard = page.locator('.scenario-card:has-text("气候"), .scenario-card:has-text("Climate")').first();
    await climateCard.click();

    // Wait for game content
    await page.waitForTimeout(2000);

    // Look for start button
    const startButton = page.locator('button:has-text("开始挑战")');
    expect(await startButton.count()).toBeGreaterThan(0);
  });

  test('should complete climate change game flow', async ({ page }) => {
    // Start climate game
    const climateCard = page.locator('.scenario-card:has-text("气候"), .scenario-card:has-text("Climate")').first();
    await climateCard.click();

    // Wait for game modal and content
    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    await page.waitForTimeout(2000);

    // Click start button inside game container
    const startButton = page.locator('#game-container button:has-text("开始挑战")').first();
    await startButton.click();

    // Wait for turn intro page
    await page.waitForTimeout(1000);
    
    // Click to start decision
    const decisionButton = page.locator('#game-container button:has-text("开始决策")').first();
    if (await decisionButton.count() > 0) {
      await decisionButton.click();
      await page.waitForTimeout(500);

      // Find and adjust sliders
      const sliders = page.locator('#game-container input[type="range"]');
      const sliderCount = await sliders.count();
      
      if (sliderCount > 0) {
        await sliders.first().evaluate(el => {
          el.value = '30';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.waitForTimeout(300);
      }

      // Click submit decision
      const submitButton = page.locator('#game-container button:has-text("提交决策")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Verify feedback page is shown
        const feedbackContent = page.locator('#game-container .feedback-content, #game-container .decision-summary');
        expect(await feedbackContent.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should complete multiple turns in climate change game', async ({ page }) => {
    // Start climate game
    const climateCard = page.locator('.scenario-card:has-text("气候"), .scenario-card:has-text("Climate")').first();
    await climateCard.click();

    // Wait for game modal
    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    await page.waitForTimeout(2000);

    // Click start button inside game container
    const startButton = page.locator('#game-container button:has-text("开始挑战")').first();
    await startButton.click();

    // Complete up to 3 turns
    for (let turn = 1; turn <= 3; turn++) {
      // Click to start decision
      const decisionButton = page.locator('#game-container button:has-text("开始决策")').first();
      if (await decisionButton.count() === 0) {
        break; // Game might be over
      }
      await decisionButton.click();
      await page.waitForTimeout(500);

      // Adjust first slider
      const sliders = page.locator('#game-container input[type="range"]');
      if (await sliders.count() > 0) {
        await sliders.first().evaluate(el => {
          el.value = '25';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
      await page.waitForTimeout(300);

      // Submit decision
      const submitButton = page.locator('#game-container button:has-text("提交决策")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);
      }

      // Go to next turn - try multiple possible button texts
      const nextButton = page.locator('#game-container button:has-text("进入第' + (turn + 1) + '回合"), #game-container button:has-text("进入下一回合"), #game-container button:has-text("开始决策")').first();
      if (await nextButton.count() > 0) {
        const btnText = await nextButton.textContent();
        if (btnText && btnText.includes('开始决策')) {
          await nextButton.click();
          await page.waitForTimeout(300);
        } else {
          await nextButton.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Verify game is still running or completed
    const modal = page.locator('#game-modal');
    await expect(modal).toHaveClass(/active/);
  });
});
