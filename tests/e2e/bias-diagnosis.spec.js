/**
 * Bias diagnosis E2E tests (API-level)
 * These tests enforce the project’s core goal: the backend must correctly classify key cognitive traps.
 */

import { test, expect } from '@playwright/test';

test.describe('Cognitive trap diagnosis (API)', () => {
  test('flags exponential misconception', async ({ request }) => {
    const payload = {
      userId: 'e2e-user',
      sessionId: 'e2e-session-exp',
      questionId: 'exp-001',
      questionType: 'exponential',
      userChoice: 0,
      userEstimation: 1_000_000,
      exponentialBase: 2,
      exponentialPower: 200,
    };

    const res = await request.post('/api/results/submit', { data: payload });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.success).toBeTruthy();
    expect(body.analysis).toBeTruthy();
    expect(body.analysis.bias_type).toBe('exponential_misconception');
  });

  test('flags compound interest misunderstanding (linear intuition)', async ({ request }) => {
    const payload = {
      userId: 'e2e-user',
      sessionId: 'e2e-session-comp',
      questionId: 'comp-001',
      questionType: 'compound',
      userChoice: 0,
      userEstimation: 340_000, // typical linear-ish estimate vs 30y compounding
      principal: 100_000,
      annual_rate: 8,
      time_years: 30,
      compounding_frequency: 1,
    };

    const res = await request.post('/api/results/submit', { data: payload });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.success).toBeTruthy();
    expect(body.analysis).toBeTruthy();
    expect(body.analysis.bias_type).toBe('compound_interest_misunderstanding');
    expect(body.analysis.likely_thinking_pattern).toBe('线性思维');
    expect(body.analysis.calculation_details).toBeTruthy();
    expect(body.analysis.calculation_details.compound_amount).toBeDefined();
  });

  test('flags complex system underestimation as complex_system_misunderstanding', async ({ request }) => {
    const payload = {
      userId: 'e2e-user',
      sessionId: 'e2e-session-complex',
      questionId: 'cs-001',
      questionType: 'complex_system',
      userChoice: 0,
      userEstimation: 1000,
      actualValue: 10_000_000_000,
    };

    const res = await request.post('/api/results/submit', { data: payload });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.success).toBeTruthy();
    expect(body.analysis).toBeTruthy();
    expect(body.analysis.bias_type).toBe('complex_system_misunderstanding');
  });
});
