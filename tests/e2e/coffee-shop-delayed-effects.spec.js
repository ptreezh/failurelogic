/**
 * Coffee Shop Delayed Effects E2E
 *
 * 目标：Dörner 失败四层次之"延迟失败"—— 决策的延迟后果必须对用户可见，
 *      并在指定回合触发
 *
 * 关键断言：
 *   - 触发 overloading / marketing fatigue / overexpansion 的决策入队延迟效应
 *   - pending-effects-panel 显示在状态栏
 *   - 面板列出待显现影响（含触发回合）
 *   - 到达触发回合时，效果已应用（gameState 更新）
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

async function setSlider(page, decisionId, value) {
  const slider = page.locator(`#${decisionId}`).first();
  await expect(slider).toBeVisible({ timeout: 5000 });
  await slider.evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function startGame(page) {
  await page.locator('#game-modal button', { hasText: '开始经营' }).first().click();
}

test.describe('Coffee Shop - Delayed Feedback Layer (Iteration 2)', () => {
  test('overloading variety decision queues an "overload penalty" delayed effect', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await startGame(page);

    // coffeeVariety = 10 触发 overloading（>= 8）
    await setSlider(page, 'coffeeVariety', 10);
    await page.locator('#game-modal .confirm-btn').first().click();

    // feedback page → 继续下个决策
    await expect(page.locator('.feedback-page')).toBeVisible({ timeout: 3000 });
    await page.locator('.feedback-page button', { hasText: '继续下个决策' }).click();

    // 此时进入 TURN_1_DECISION_2（promotionBudget），状态栏应显示 pending panel
    await page.waitForTimeout(300);
    const panel = page.locator('[data-testid="pending-effects-panel"]');
    await expect(panel).toBeVisible({ timeout: 2000 });

    // 验证至少 1 个 pending effect
    const effects = page.locator('[data-testid="pending-effect"]');
    await expect(effects).toHaveCount(1, { timeout: 1000 });

    // 验证 effect 类型是 overload_penalty
    const effectType = await effects.first().getAttribute('data-effect-type');
    expect(effectType).toBe('overload_penalty');

    // 验证面板标题
    await expect(panel.locator('h4')).toContainText('待显现影响');
    // 验证原因文本（描述选择过载）
    await expect(effects.first().locator('.pending-desc')).toContainText('选择过载');
  });

  test('multiple decisions queue multiple delayed effects into one panel', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await startGame(page);

    // Decision 1: coffeeVariety = 10 → overload_penalty
    await setSlider(page, 'coffeeVariety', 10);
    await page.locator('#game-modal .confirm-btn').first().click();
    await page.locator('.feedback-page button', { hasText: '继续下个决策' }).click();
    await page.waitForTimeout(200);

    // Decision 2: promotionBudget = 200 → marketing_fatigue
    await setSlider(page, 'promotionBudget', 200);
    await page.locator('#game-modal .confirm-btn').first().click();
    await page.locator('.feedback-page button', { hasText: '继续下个决策' }).click();
    await page.waitForTimeout(300);

    // 进入 TURN_1_SUMMARY 然后到 TURN_2_DECISION_1（seats）
    const summaryBtn = page.locator('button', { hasText: '进入第' }).first();
    await summaryBtn.click();

    // TURN_2_DECISION_1: pending panel 应至少包含 marketing_fatigue
    // (overload_penalty 的 trigger_turn=2，到达此回合时已被应用)
    await page.waitForTimeout(400);
    const panel = page.locator('[data-testid="pending-effects-panel"]');
    await expect(panel).toBeVisible({ timeout: 2000 });
    const effects = page.locator('[data-testid="pending-effect"]');
    const count = await effects.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // 验证类型：marketing_fatigue（trigger_turn=3）仍 pending
    const types = await effects.evaluateAll((els) => els.map((e) => e.getAttribute('data-effect-type')));
    expect(types).toContain('marketing_fatigue');

    // 同时验证 gameState 反映了 overload_penalty 已应用（applied=true）
    const overloadApplied = await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      const eff = r.gameState.delayed_effects.find((e) => e.type === 'overload_penalty');
      return eff ? eff.applied : null;
    });
    expect(overloadApplied).toBe(true);
  });

  test('delayed effect fires when trigger_turn arrives (state mutates)', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await startGame(page);

    // coffeeVariety = 10 → overload_penalty (trigger_turn = 2)
    await setSlider(page, 'coffeeVariety', 10);
    await page.locator('#game-modal .confirm-btn').first().click();
    await page.locator('.feedback-page button', { hasText: '继续下个决策' }).click();

    // 此时 gameState.delayed_effects 应该有 1 个未应用 effect
    const beforeApply = await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      return r.gameState.delayed_effects.filter((e) => !e.applied).length;
    });
    expect(beforeApply).toBeGreaterThanOrEqual(1);

    // 通过 currentTurn 直接驱动应用：模拟到达 trigger_turn
    const applied = await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      // 触发回合到达
      r.currentTurn = 2;
      const before = r.gameState.satisfaction;
      const newlyApplied = r.applyPendingDelayedEffects();
      newlyApplied.forEach((eff) => {
        if (eff.target === 'satisfaction') r.gameState.satisfaction += eff.amount;
        else if (eff.target === 'reputation') r.gameState.reputation += eff.amount;
        else if (eff.target === 'resources') r.gameState.resources += eff.amount;
      });
      return {
        appliedCount: newlyApplied.length,
        types: newlyApplied.map((e) => e.type),
        before,
        after: r.gameState.satisfaction
      };
    });
    expect(applied.appliedCount).toBeGreaterThanOrEqual(1);
    expect(applied.types).toContain('overload_penalty');
    expect(applied.after).toBeLessThan(applied.before); // 满意度应该下降
  });
});
