/**
 * Coffee Shop Training Stage Tracking E2E
 *
 * 目标：Dörner 训练四阶段跟踪 — 用户能力阶段从无意识无知演化到无意识能力
 *
 * 关键断言：
 *   - 首次访问：阶段 1（无意识无知）
 *   - 完成 1 局含觉醒的游戏：阶段进入 2（有意识无知）
 *   - localStorage 持久化：刷新后阶段保持
 *   - "我的"页面渲染训练面板（含进度条）
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Coffee Shop - Training Stage Tracking (Iteration 5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.removeItem('failureLogic.trainingProgress'));
    await page.reload();
  });

  test('first visit shows stage 1 (unconscious_incompetence)', async ({ page }) => {
    await page.locator('.nav-item[data-page="profile"]').click();

    const panel = page.locator('[data-testid="training-stage-panel"]');
    await expect(panel).toBeVisible({ timeout: 3000 });

    const stage = await panel.getAttribute('data-stage');
    expect(stage).toBe('unconscious_incompetence');

    const stageName = await panel.locator('.stage-name').innerText();
    expect(stageName).toContain('无意识无知');
  });

  test('completing a game with awakening advances to stage 2', async ({ page }) => {
    // 直接通过 TrainingStageTracker API 模拟完成 1 局含觉醒
    const newProgress = await page.evaluate(() => {
      const t = new TrainingStageTracker();
      return t.recordGameOutcome({
        awakening_count: 1,
        gap_total: 150,
        biases_detected: [{ type: 'selection_overload' }]
      });
    });

    expect(newProgress.games_completed).toBe(1);
    expect(newProgress.last_stage).toBe('conscious_incompetence');

    // 刷新后从 localStorage 读取
    await page.reload();
    await page.locator('.nav-item[data-page="profile"]').click();

    const panel = page.locator('[data-testid="training-stage-panel"]');
    await expect(panel).toBeVisible({ timeout: 3000 });
    const stage = await panel.getAttribute('data-stage');
    expect(stage).toBe('conscious_incompetence');
  });

  test('stage 3 (conscious_competence) requires 3 games with low awakening', async ({ page }) => {
    await page.evaluate(() => {
      const t = new TrainingStageTracker();
      // 3 局，只有 1 次觉醒
      t.recordGameOutcome({ awakening_count: 1, gap_total: 100, biases_detected: [{ type: 'a' }] });
      t.recordGameOutcome({ awakening_count: 0, gap_total: 50, biases_detected: [] });
      t.recordGameOutcome({ awakening_count: 0, gap_total: 60, biases_detected: [] });
      return t.progress.last_stage;
    });

    await page.reload();
    await page.locator('.nav-item[data-page="profile"]').click();
    const panel = page.locator('[data-testid="training-stage-panel"]');
    const stage = await panel.getAttribute('data-stage');
    expect(stage).toBe('conscious_competence');
  });

  test('profile panel shows progress bar and stats', async ({ page }) => {
    await page.locator('.nav-item[data-page="profile"]').click();

    const panel = page.locator('[data-testid="training-stage-panel"]');
    await expect(panel).toBeVisible({ timeout: 3000 });

    await expect(panel.locator('.progress-bar')).toBeVisible();
    await expect(panel.locator('.training-stats .stat')).toHaveCount(3);
    await expect(panel.locator('.next-hint')).toContainText('💡');
  });

  test('progress persists across browser reload (localStorage)', async ({ page }) => {
    await page.evaluate(() => {
      const t = new TrainingStageTracker();
      t.recordGameOutcome({
        awakening_count: 2,
        gap_total: 200,
        biases_detected: [{ type: 'overexpansion' }]
      });
    });

    // 模拟刷新：先读取一次再重新加载
    await page.reload();
    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem('failureLogic.trainingProgress');
      return JSON.parse(raw);
    });

    expect(persisted.games_completed).toBe(1);
    expect(persisted.awakening_count).toBe(2);
    expect(persisted.last_stage).toBe('conscious_incompetence');
  });
});
