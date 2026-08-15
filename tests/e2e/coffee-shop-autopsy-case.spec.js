/**
 * Coffee Shop Autopsy + Historical Case E2E
 *
 * 目标：Dörner 终局反馈 — 决策时间线 + 真实案例对照
 *
 * 关键断言：
 *   - 尸检时间线显示每个回合的决策 + 期望 vs 实际利润
 *   - 时间线根据 gap 大小显示 critical/negative/positive 标记
 *   - 历史案例对照根据偏差类型选择最相关的案例
 *   - 案例含 dorner_ref
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
  await page.evaluate((h) => {
    const r = window.coffeeShopRouter;
    r.gameState.decision_history = h;
    r.currentPage = 'TURN_5_ENDING';
    r.render();
  }, history);
}

test.describe('Coffee Shop - Autopsy + Case Comparison (Iteration 7)', () => {
  test('autopsy timeline shows all 3 turns with decision + gap markers', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await gotoEndingPage(page, [
      { turn: 1, decisions: { coffeeVariety: 5 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 80 }, gap: -20 },
      { turn: 2, decisions: { coffeeVariety: 7 }, linear_expectation: { total_expected_profit: 150 }, actual_result: { actual_profit: 50 }, gap: -100 },
      { turn: 3, decisions: { coffeeVariety: 5 }, linear_expectation: { total_expected_profit: 80 }, actual_result: { actual_profit: 90 }, gap: 10 }
    ]);

    const timeline = page.locator('[data-testid="autopsy-timeline"]');
    await expect(timeline).toBeVisible({ timeout: 2000 });

    const turns = page.locator('[data-testid="autopsy-turn"]');
    await expect(turns).toHaveCount(3);

    // 第二个回合应该是 critical（gap=-100 < -50）
    const turn2 = turns.nth(1);
    const gapClass2 = await turn2.getAttribute('data-gap-class');
    expect(gapClass2).toBe('critical');

    // 第三个回合应该是 positive（gap=10 ≥ 0）
    const turn3 = turns.nth(2);
    const gapClass3 = await turn3.getAttribute('data-gap-class');
    expect(gapClass3).toBe('positive');
  });

  test('autopsy timeline shows decision summary and stats per turn', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await gotoEndingPage(page, [
      { turn: 1, decisions: { coffeeVariety: 5, promotionBudget: 100 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 80 }, gap: -20 }
    ]);

    const turn = page.locator('[data-testid="autopsy-turn"]').first();
    const decisionsText = await turn.locator('.autopsy-decisions').innerText();
    expect(decisionsText).toContain('咖啡种类');
    expect(decisionsText).toContain('5');

    const statsText = await turn.locator('.autopsy-stats').innerText();
    expect(statsText).toContain('期望利润');
    expect(statsText).toContain('实际利润');
  });

  test('historical case is shown for selection_overload pattern', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await gotoEndingPage(page, [
      { turn: 1, decisions: { coffeeVariety: 8 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 80 }, gap: -20 },
      { turn: 2, decisions: { coffeeVariety: 9 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 60 }, gap: -40 },
      { turn: 3, decisions: { coffeeVariety: 10 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 50 }, gap: -50 }
    ]);

    const caseEl = page.locator('[data-testid="historical-case"]');
    await expect(caseEl).toBeVisible({ timeout: 2000 });

    // 选择过载模式应映射到雀巢案例
    const caseAttr = await caseEl.getAttribute('data-case');
    expect(caseAttr).toContain('雀巢');

    await expect(caseEl.locator('.case-summary')).toBeVisible();
    await expect(caseEl.locator('.case-decision')).toContainText('当时决策');
    await expect(caseEl.locator('.case-outcome')).toContainText('实际结果');
    await expect(caseEl.locator('.case-dorner')).toContainText('Dörner');
    await expect(caseEl.locator('.case-lesson')).toContainText('教训');
  });

  test('historical case is shown for overexpansion pattern', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await gotoEndingPage(page, [
      { turn: 1, decisions: { coffeeVariety: 5, expansionStrategy: 3 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 80 }, gap: -20 },
      { turn: 2, decisions: { coffeeVariety: 5, expansionStrategy: 3 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 0 }, gap: -100 },
      { turn: 3, decisions: { coffeeVariety: 5, expansionStrategy: 3 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: -100 }, gap: -200 }
    ]);

    const caseEl = page.locator('[data-testid="historical-case"]');
    await expect(caseEl).toBeVisible({ timeout: 2000 });
    const caseAttr = await caseEl.getAttribute('data-case');
    expect(caseAttr).toContain('星巴克');
  });

  test('no historical case shown for healthy decisions', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await gotoEndingPage(page, [
      { turn: 1, decisions: { coffeeVariety: 4 }, linear_expectation: { total_expected_profit: 50 }, actual_result: { actual_profit: 45 }, gap: -5 },
      { turn: 2, decisions: { coffeeVariety: 4 }, linear_expectation: { total_expected_profit: 50 }, actual_result: { actual_profit: 50 }, gap: 0 },
      { turn: 3, decisions: { coffeeVariety: 5 }, linear_expectation: { total_expected_profit: 50 }, actual_result: { actual_profit: 55 }, gap: 5 }
    ]);

    // 健康决策应该不触发任何 case
    const caseCount = await page.locator('[data-testid="historical-case"]').count();
    expect(caseCount).toBe(0);
  });

  test('autopsy timeline and historical case together appear on ending page', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await gotoEndingPage(page, [
      { turn: 1, decisions: { coffeeVariety: 9 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 50 }, gap: -50 },
      { turn: 2, decisions: { coffeeVariety: 9 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 30 }, gap: -70 },
      { turn: 3, decisions: { coffeeVariety: 9 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 10 }, gap: -90 }
    ]);

    await expect(page.locator('[data-testid="autopsy-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="historical-case"]')).toBeVisible();
    await expect(page.locator('[data-testid="bias-diagnosis-report"]')).toBeVisible();
  });
});
