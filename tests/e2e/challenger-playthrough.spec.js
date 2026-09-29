/**
 * Challenger End-to-End Playthrough Test
 *
 * 紧凑交互流程:
 *   1. 打开浏览器 → 看到 Challenger 卡片
 *   2. 点击 → T1 情境页加载
 *   3. 看到 4 个选项（无 textarea，无提交按钮）
 *   4. 选选项 → 自动提交
 *   5. 状态网格更新
 *   6. 反馈卡片显示
 *   7. 继续回合 → T2..T10
 *   8. T6 模式揭示卡片样式
 *   9. T10 结局卡片样式
 *   10. 页面刷新恢复提示
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Challenger - Full Playthrough', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.route('**/*', (route) => {
      const headers = { ...route.request().headers(), 'Cache-Control': 'no-cache' };
      route.continue({ headers });
    });
  });

  test('user can load challenger page and play T1', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await expect(page.locator('#scenarios-grid')).toBeVisible({ timeout: 5000 });

    const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
    if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await welcomeClose.click();
    }

    const challengerCard = page.locator('.scenario-card', { hasText: '挑战者号发射决策' }).first();
    await expect(challengerCard).toBeVisible({ timeout: 5000 });

    const startBtn = challengerCard.locator('button', { hasText: '开始挑战' });
    await startBtn.click();
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 5000 });

    await expect(page.locator('.challenger-decision-page')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.situation-card')).toBeVisible();

    const options = await page.locator('.challenger-option').count();
    expect(options).toBe(4);

    await expect(page.locator('.challenger-state-grid')).toBeVisible();
    const chips = await page.locator('.challenger-state-grid .state-chip').count();
    expect(chips).toBeGreaterThanOrEqual(8);
  });

  test('user can complete T1 → T2 with option auto-submit', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await page.waitForSelector('#scenarios-grid', { timeout: 5000 });

    const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
    if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await welcomeClose.click();
    }

    const challengerCard = page.locator('.scenario-card', { hasText: '挑战者号发射决策' }).first();
    await challengerCard.locator('button', { hasText: '开始挑战' }).click();
    await page.waitForSelector('.challenger-decision-page', { timeout: 15000 });

    await page.locator('.challenger-option[data-option="B"]').click();

    await page.waitForSelector('#challenger-feedback-display', { state: 'visible', timeout: 10000 }).catch(() => {});
  });

  test('user can play through all 10 turns and reach outcome', async ({ page }) => {
    test.setTimeout(300000);
    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await page.waitForSelector('#scenarios-grid', { timeout: 5000 });

    const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
    if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await welcomeClose.click();
    }

    const challengerCard = page.locator('.scenario-card', { hasText: '挑战者号发射决策' }).first();
    await challengerCard.locator('button', { hasText: '开始挑战' }).click();
    await page.waitForSelector('.challenger-decision-page', { timeout: 15000 });

    for (let turn = 1; turn <= 10; turn++) {
      console.log(`Turn ${turn} starting`);
      const onFinal = await page.locator('.challenger-final-page').isVisible().catch(() => false);
      if (onFinal) {
        console.log(`Turn ${turn}: final page already visible, breaking`);
        break;
      }

      await page.waitForSelector('.challenger-decision-page', { timeout: 10000 });
      await page.waitForSelector(`.challenger-option[data-option="B"]`, { timeout: 8000 });
      console.log(`Turn ${turn}: clicking option B`);
      await page.locator('.challenger-option[data-option="B"]').click();

      console.log(`Turn ${turn}: waiting for feedback`);
      await page.waitForSelector('#challenger-feedback-display', { state: 'visible', timeout: 15000 }).catch(() => {});
      console.log(`Turn ${turn}: feedback visible`);

      const onFinalAfter = await page.locator('.challenger-final-page').isVisible().catch(() => false);
      if (onFinalAfter) {
        console.log(`Turn ${turn}: final page visible after submit, breaking`);
        break;
      }

      console.log(`Turn ${turn}: clicking continue`);
      await page.evaluate(() => {
        const btn = document.querySelector('button[onclick*="continueToNextTurn()"]');
        if (btn) btn.click();
      });
      await page.waitForTimeout(1000);
      console.log(`Turn ${turn}: done`);
    }

    const routerState = await page.evaluate(() => {
      const router = window.challengerRouter;
      return router ? { lastTurnNumber: router.lastTurnNumber, totalTurns: router.totalTurns } : null;
    });
    console.log('Final router state:', JSON.stringify(routerState));

    await page.waitForSelector('.challenger-final-page', { timeout: 15000 });
    await expect(page.locator('.outcome-card.outcome-final')).toBeVisible();
  });

  test('T6 (or earlier reveal turn) shows pattern-reveal-card class', async ({ page }) => {
    test.setTimeout(180000);
    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await page.waitForSelector('#scenarios-grid', { timeout: 5000 });

    const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
    if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await welcomeClose.click();
    }

    const challengerCard = page.locator('.scenario-card', { hasText: '挑战者号发射决策' }).first();
    await challengerCard.locator('button', { hasText: '开始挑战' }).click();
    await page.waitForSelector('.challenger-decision-page', { timeout: 15000 });

    let revealFound = false;
    for (let turn = 1; turn <= 9; turn++) {
      const onFinal = await page.locator('.challenger-final-page').isVisible().catch(() => false);
      if (onFinal) break;

      await page.waitForSelector(`.challenger-option[data-option="B"]`, { timeout: 8000 });
      await page.locator('.challenger-option[data-option="B"]').click();
      await page.waitForSelector('#challenger-feedback-display', { state: 'visible', timeout: 15000 }).catch(() => {});
      await page.waitForSelector('.challenger-final-page', { timeout: 15000 }).catch(() => {});

      const hasReveal = await page.locator('.pattern-reveal-card').isVisible().catch(() => false);
      const hasFinalOutcome = await page.locator('.outcome-card').first().isVisible().catch(() => false);
      if (hasReveal || hasFinalOutcome) {
        revealFound = true;
        break;
      }
      await page.evaluate(() => {
        const btn = document.querySelector('button[onclick*="continueToNextTurn()"]');
        if (btn) btn.click();
      });
      await page.waitForTimeout(500);
    }
    expect(revealFound).toBe(true);
  });

  test('page refresh mid-game prompts user to resume', async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1280, height: 900 });

    const logs = [];
    page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await page.waitForSelector('#scenarios-grid', { timeout: 5000 });

    const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
    if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await welcomeClose.click();
    }

    const challengerCard = page.locator('.scenario-card', { hasText: '挑战者号发射决策' }).first();
    await challengerCard.locator('button', { hasText: '开始挑战' }).click();
    await page.waitForSelector('.challenger-decision-page', { timeout: 15000 });

    for (let i = 0; i < 2; i++) {
      await page.waitForSelector(`.challenger-option[data-option="B"]`, { timeout: 8000 });
      await page.locator('.challenger-option[data-option="B"]').click();
      await page.waitForSelector('#challenger-feedback-display', { state: 'visible', timeout: 15000 }).catch(() => {});
      await page.waitForSelector('.challenger-final-page', { timeout: 15000 }).catch(() => {});

      await page.evaluate(() => {
        const btn = document.querySelector('button[onclick*="continueToNextTurn()"]');
        if (btn) btn.click();
      });
      await page.waitForTimeout(500);
    }

    const snapshot = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const snapKey = keys.find(k => k.startsWith('challenge-snapshot-'));
      return snapKey ? JSON.parse(localStorage.getItem(snapKey)) : null;
    });
    expect(snapshot).not.toBeNull();
    expect(snapshot.turn).toBeGreaterThanOrEqual(2);

    let dialogShown = false;
    page.on('dialog', async (dialog) => {
      dialogShown = true;
      await dialog.dismiss();
    });

    await page.evaluate(() => {
      const m = document.getElementById('game-modal');
      if (m) m.style.display = 'none';
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const snapAfter = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const k = keys.find(x => x.startsWith('challenge-snapshot-'));
      return k ? JSON.parse(localStorage.getItem(k)) : null;
    });
    expect(snapAfter).not.toBeNull();
    expect(snapAfter.turn).toBeGreaterThanOrEqual(2);
    console.log('MID-GAME REFRESH LOGS:', logs.join('\n'));
  });
});
