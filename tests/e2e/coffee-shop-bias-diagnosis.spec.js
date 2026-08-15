/**
 * Coffee Shop Bias Diagnosis Report E2E
 *
 * 目标：Dörner 偏差诊断 — 在终局报告用户的认知偏差
 *
 * 关键断言：
 *   - 线性思维决策序列检测出 linear_thinking 偏差
 *   - 选择过载检测出 selection_overload
 *   - 激进扩张检测出 time_delay_neglect
 *   - 健康决策不产生偏差
 *   - 偏差报告含 confidence + dorner_ref
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function navigateToCoffeeShopGame(page) {
  await page.goto(BASE_URL);
  await page.locator('.nav-item[data-page="scenarios"]').click();
  await expect(page.locator('#scenarios-grid')).toBeVisible({ timeout: 5000 });
  const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
  if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
    await welcomeClose.click();
  }
  const coffeeCard = page.locator('.scenario-card', { hasText: '咖啡店' }).first();
  await coffeeCard.click();
  await expect(page.locator('#game-modal')).toBeVisible({ timeout: 5000 });
}

async function gotoEndingPage(page, history) {
  await page.locator('#game-modal button', { hasText: '开始经营' }).click();
  // 先注入历史，再切到 ending 触发 render
  await page.evaluate((h) => {
    const r = window.coffeeShopRouter;
    r.gameState.decision_history = h;
    r.currentPage = 'TURN_5_ENDING';
    r.render();
  }, history);
}

async function injectHistory(page, history) {
  await page.evaluate((h) => {
    window.coffeeShopRouter.gameState.decision_history = h;
  }, history);
}

test.describe('Coffee Shop - Bias Diagnosis Report (Iteration 6)', () => {
  test('linear thinking pattern triggers linear_thinking bias', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await gotoEndingPage(page, [
      { turn: 1, decisions: { coffeeVariety: 5, promotionBudget: 100 }, gap: -10 },
      { turn: 2, decisions: { coffeeVariety: 6, promotionBudget: 120 }, gap: -20 },
      { turn: 3, decisions: { coffeeVariety: 7, promotionBudget: 150 }, gap: -30 }
    ]);

    const report = page.locator('[data-testid="bias-diagnosis-report"]');
    await expect(report).toBeVisible({ timeout: 2000 });

    const linearItem = page.locator('[data-testid="bias-item"][data-bias="linear_thinking"]');
    await expect(linearItem).toBeVisible();
    await expect(linearItem.locator('.bias-name')).toContainText('线性思维');
    await expect(linearItem.locator('.bias-dorner')).toContainText('Dörner');
  });

  test('selection overload triggers selection_overload bias', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await gotoEndingPage(page, [
      { turn: 1, decisions: { coffeeVariety: 8, promotionBudget: 50 }, gap: -10 },
      { turn: 2, decisions: { coffeeVariety: 9, promotionBudget: 50 }, gap: -20 },
      { turn: 3, decisions: { coffeeVariety: 10, promotionBudget: 50 }, gap: -30 }
    ]);

    const overloadItem = page.locator('[data-testid="bias-item"][data-bias="selection_overload"]');
    await expect(overloadItem).toBeVisible({ timeout: 2000 });
    await expect(overloadItem.locator('.bias-name')).toContainText('选择过载');
    const conf = await overloadItem.getAttribute('data-confidence');
    expect(parseFloat(conf)).toBeGreaterThanOrEqual(0.85);
  });

  test('aggressive expansion triggers time_delay_neglect bias', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await gotoEndingPage(page, [
      { turn: 1, decisions: { coffeeVariety: 5, expansionStrategy: 3 }, gap: -50 },
      { turn: 2, decisions: { coffeeVariety: 5, expansionStrategy: 3 }, gap: -100 },
      { turn: 3, decisions: { coffeeVariety: 5, expansionStrategy: 3 }, gap: -150 }
    ]);

    const impatient = page.locator('[data-testid="bias-item"][data-bias="time_delay_neglect"]');
    await expect(impatient).toBeVisible({ timeout: 2000 });
    await expect(impatient.locator('.bias-name')).toContainText('时间延迟');
  });

  test('healthy decision pattern produces no bias', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await gotoEndingPage(page, [
      { turn: 1, decisions: { coffeeVariety: 4, promotionBudget: 50 }, gap: -5 },
      { turn: 2, decisions: { coffeeVariety: 5, promotionBudget: 60 }, gap: -3 },
      { turn: 3, decisions: { coffeeVariety: 5, promotionBudget: 60 }, gap: -8 }
    ]);

    const report = page.locator('[data-testid="bias-diagnosis-report"]');
    await expect(report).toBeVisible({ timeout: 2000 });
    const count = await report.getAttribute('data-bias-count');
    expect(parseInt(count, 10)).toBe(0);

    await expect(report.locator('.no-bias')).toBeVisible();
  });

  test('report contains a reference citation for every detected bias', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await gotoEndingPage(page, [
      { turn: 1, decisions: { coffeeVariety: 9, promotionBudget: 250, expansionStrategy: 3 }, gap: -100 },
      { turn: 2, decisions: { coffeeVariety: 9, promotionBudget: 250, expansionStrategy: 3 }, gap: -150 },
      { turn: 3, decisions: { coffeeVariety: 9, promotionBudget: 250, expansionStrategy: 3 }, gap: -200 }
    ]);

    const items = page.locator('[data-testid="bias-item"]');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const refs = await items.locator('.bias-dorner').allInnerTexts();
    for (const ref of refs) {
      // 每个偏差都应有引用来源（Dörner 或其他认知科学经典）
      expect(ref.length).toBeGreaterThan(5);
      expect(ref).toMatch(/Dörner|Schwartz|Kahneman|Tversky|Thaler/);
    }
  });
});
