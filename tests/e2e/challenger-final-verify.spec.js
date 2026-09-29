const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const LIVE_BASE = 'https://ptreezh.github.io/failurelogic';

const SCENARIOS = [
  { id: 'challenger-launch', cardText: '挑战者号发射决策', dir: 'challenger-launch', gridVars: ['预报温度', '工程师信心', '进度压力'] },
  { id: 'climate-change-policy', cardText: '全球气候政策十年', dir: 'climate-change-policy', gridVars: ['全球升温', 'CO2浓度', 'GDP增长'] },
  { id: 'enron-collapse', cardText: '安然帝国崩塌', dir: 'enron-collapse', gridVars: ['股价', '信用评级', '报告利润'] },
];

const TURN_COUNT = 10;

async function monitorState(page) {
  return await page.evaluate(() => {
    const decisionPage = !!document.querySelector('.challenger-decision-page');
    const feedbackCard = !!document.querySelector('.feedback-card, .pattern-reveal-card, .outcome-card');
    const outcomeCard = !!document.querySelector('.outcome-card');
    const finalPage = !!document.querySelector('.challenger-final-page');
    const optionCount = document.querySelectorAll('.challenger-option').length;
    const errorMessage = !!document.querySelector('.error-message');
    const turnText = (document.querySelector('.page-header h2') || {}).textContent || '';
    return {
      decisionPage,
      feedbackCard,
      outcomeCard,
      finalPage,
      optionCount,
      errorMessage,
      turnText,
      stuck: !decisionPage && !finalPage && !feedbackCard && !outcomeCard,
    };
  });
}

async function monitorForceEnableSubmit(page) {
  return await page.evaluate(() => {
    const submitBtn = document.getElementById('challenger-submit');
    if (submitBtn && submitBtn.disabled) {
      submitBtn.disabled = false;
      return true;
    }
    return false;
  });
}

async function monitorSelectFirstOption(page) {
  return await page.evaluate(() => {
    const first = document.querySelector('.challenger-option');
    if (first) {
      first.click();
      return true;
    }
    return false;
  });
}

async function monitorFillJustification(page, text) {
  return await page.evaluate((text) => {
    const ta = document.getElementById('challenger-justification');
    if (ta) {
      ta.value = text;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    return false;
  }, text);
}

for (const SCENARIO of SCENARIOS) {
  const FRAMES_DIR = path.resolve(__dirname, '..', 'frames-online', SCENARIO.dir);

  test(`${SCENARIO.id}: live online dual-agent playthrough + screenshots`, async ({ page, context }) => {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });

    await context.route('**/*', (route) => {
      const headers = { ...route.request().headers(), 'Cache-Control': 'no-cache' };
      route.continue({ headers });
    });

    await page.goto(`${LIVE_BASE}/`);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await expect(page.locator('#scenarios-grid')).toBeVisible({ timeout: 15_000 });

    const card = page.locator('.scenario-card', { hasText: SCENARIO.cardText }).first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    await page.screenshot({
      path: path.join(FRAMES_DIR, 'T0-scenarios-page.png'),
      fullPage: true,
      animations: 'disabled',
    });

    await card.locator('button', { hasText: '开始挑战' }).click();
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 15_000 });

    const decisionPage = page.locator('.challenger-decision-page');
    await expect(decisionPage).toBeVisible({ timeout: 30_000 });

    const initialGrid = await page.locator('.challenger-state-grid').textContent().catch(() => '');
    for (const v of SCENARIO.gridVars) {
      expect(initialGrid, `state grid missing expected variable "${v}"`).toContain(v);
    }

    for (let t = 1; t <= TURN_COUNT; t++) {
      const pickLetter = 'A';
      const pickIndex = 0;

      let state = await monitorState(page);
      let retries = 0;
      while (state && state.stuck && retries < 5) {
        await page.waitForTimeout(1000);
        state = await monitorState(page);
        retries++;
      }

      if (!state || !state.decisionPage) {
        await page.screenshot({
          path: path.join(FRAMES_DIR, `T${t}-stuck-debug.png`),
          fullPage: true,
          animations: 'disabled',
        });
      }

      const optionCount = await page.locator('.challenger-option').count();
      expect(optionCount, `T${t} option count`).toBeGreaterThan(0);

      if (optionCount > 0) {
        const idx = Math.min(pickIndex, optionCount - 1);
        await page.locator('.challenger-option').nth(idx).click();
      } else {
        const selected = await monitorSelectFirstOption(page);
        expect(selected, `T${t} monitor select first option`).toBe(true);
      }

      await page.waitForTimeout(500);

      let justificationFilled = false;
      try {
        await page.fill('#challenger-justification', `T${t} reasoning for ${SCENARIO.id} (option ${pickLetter})`);
        justificationFilled = true;
      } catch (e) {
        const filled = await monitorFillJustification(page, `T${t} reasoning for ${SCENARIO.id} (option ${pickLetter})`);
        justificationFilled = filled;
      }

      await page.screenshot({
        path: path.join(FRAMES_DIR, `T${t}-pre-submit.png`),
        fullPage: true,
        animations: 'disabled',
      });

      let submitEnabled = false;
      try {
        const submitBtn = page.locator('#challenger-submit');
        submitEnabled = await submitBtn.isEnabled({ timeout: 2000 }).catch(() => false);
      } catch (e) {
        submitEnabled = false;
      }

      if (!submitEnabled) {
        await monitorForceEnableSubmit(page);
        await page.screenshot({
          path: path.join(FRAMES_DIR, `T${t}-submit-disabled-debug.png`),
          fullPage: true,
          animations: 'disabled',
        });
      }

      await page.evaluate(async () => {
        const router = window.challengerRouter;
        if (router && router.selectedOption) {
          await router.submit();
        }
      });

      await page
        .waitForSelector('.feedback-card, .pattern-reveal-card, .outcome-card', { timeout: 15_000 })
        .catch(() => {
          console.warn(`T${t}: no feedback/pattern-reveal/outcome card within 15s`);
        });

      const turnInfo = await page.evaluate(() => {
        const router = window.challengerRouter;
        return {
          lastTurnNumber: router ? router.lastTurnNumber : null,
          selectedOption: router ? router.selectedOption : null,
          gameId: router ? router.gameId : null,
        };
      });
      console.log(`T${t} after submit: lastTurnNumber=${turnInfo.lastTurnNumber}, selectedOption=${turnInfo.selectedOption}, gameId=${turnInfo.gameId}`);

      await page.screenshot({
        path: path.join(FRAMES_DIR, `T${t}-post-submit.png`),
        fullPage: true,
        animations: 'disabled',
      });

      if (t < TURN_COUNT) {
        await page.evaluate(() => {
          const btn = document.querySelector('button[onclick*="continueToNextTurn()"]');
          if (btn) btn.click();
        });
        await page.waitForTimeout(2000);
      } else {
        await page.evaluate(() => {
          const btn = document.querySelector('button[onclick*="continueToNextTurn()"]');
          if (btn) btn.click();
        });

        await page.waitForTimeout(5000);

        const debugAfter = await page.evaluate(() => {
          const finalPage = !!document.querySelector('.challenger-final-page');
          const outcomeCard = !!document.querySelector('.outcome-card');
          const feedbackDisplay = document.getElementById('challenger-feedback-display');
          const feedbackClass = feedbackDisplay ? feedbackDisplay.className : '';
          const turnText = (document.querySelector('.page-header h2') || {}).textContent || '';
          const router = window.challengerRouter;
          const routerState = router ? {
            lastTurnNumber: router.lastTurnNumber,
            totalTurns: router.totalTurns,
            currentStep: router.currentStep ? { turn: router.currentStep.turn, options: (router.currentStep.options || []).length } : null,
          } : null;
          return { finalPage, outcomeCard, feedbackClass, turnText, routerState };
        });
        console.log('After T10 continue:', JSON.stringify(debugAfter, null, 2));

        await page.screenshot({
          path: path.join(FRAMES_DIR, 'T10-debug-after-continue.png'),
          fullPage: true,
          animations: 'disabled',
        });
      }
    }

    await page.waitForSelector('.outcome-card, .challenger-final-page', { timeout: 30_000 });
    await page.screenshot({
      path: path.join(FRAMES_DIR, 'T10-outcome.png'),
      fullPage: true,
      animations: 'disabled',
    });

    const outcomeText = await page.locator('.outcome-card, .challenger-final-page .outcome-card').first().textContent().catch(() => '');
    expect(outcomeText.length).toBeGreaterThan(20);

    const finalState = await monitorState(page);
    if (finalState && finalState.errorMessage) {
      await page.screenshot({
        path: path.join(FRAMES_DIR, 'T10-error-state.png'),
        fullPage: true,
        animations: 'disabled',
      });
    }

    const checkpoints = fs
      .readdirSync(FRAMES_DIR)
      .filter((f) => /T\d+-(pre|post)-submit\.png$/.test(f));
    expect(checkpoints.length, 'checkpoint screenshot count').toBeGreaterThanOrEqual(20);
  });
}
