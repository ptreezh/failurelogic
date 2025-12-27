/**
 * API Integration Tests
 * TDD tests for API connectivity and data handling
 */

import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API monitoring
    await page.goto('/');
  });

  test('should successfully connect to API endpoints', async ({ page }) => {
    // Monitor API calls
    const apiResponses = [];
    page.on('response', response => {
      if (response.url().includes('/scenarios/') || response.url().includes('/api/')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        });
      }
    });

    // Navigate to scenarios to trigger API calls
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible' });

    // Verify API responses
    expect(apiResponses.length).toBeGreaterThan(0);

    // Check that at least one API call was successful
    const successfulCalls = apiResponses.filter(response => response.ok);
    expect(successfulCalls.length).toBeGreaterThan(0);
  });

  test('should handle API response caching', async ({ page }) => {
    // Clear any existing cache
    await page.evaluate(() => {
      if (window.ApiService && window.ApiService.clearCache) {
        window.ApiService.clearCache();
      }
    });

    // Navigate to scenarios twice
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible' });

    // Navigate away and back
    await page.click('[data-page="home"]');
    await page.waitForSelector('#home-page', { state: 'visible' });

    const secondNavStart = Date.now();
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible' });
    const secondNavTime = Date.now() - secondNavStart;

    // Second navigation should be faster due to caching
    expect(secondNavTime).toBeLessThan(2000); // Should be very fast
  });

  test('should implement API failover correctly', async ({ page }) => {
    // Monitor API calls and responses
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/scenarios/') || request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });

    // Mock API failure for primary endpoint
    await page.route('**/turbo-rotary-phone-pq4jq7pvr7f6jxx-8000.app.github.dev/**', route => {
      route.abort();
    });

    // Navigate to scenarios
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible' });

    // Should eventually succeed with fallback API or mock data
    expect(await page.locator('.scenario-card').count()).toBeGreaterThan(0);
  });

  test('should track API performance metrics', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible' });

    // Get API metrics
    const metrics = await page.evaluate(() => {
      if (window.ApiService && window.ApiService.getMetrics) {
        return window.ApiService.getMetrics();
      }
      return null;
    });

    expect(metrics).toBeTruthy();
    expect(metrics.totalRequests).toBeGreaterThan(0);
    expect(metrics.averageResponseTime).toBeGreaterThan(0);
    expect(metrics.errorRate).toBeDefined();
  });

  test('should handle game session API calls', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible' });

    // Monitor API requests
    const apiRequests = [];
    page.on('request', request => {
      if (request.url().includes('create_game_session')) {
        apiRequests.push(request);
      }
    });

    // Start a game session
    const firstScenario = page.locator('.scenario-card').first();
    await firstScenario.click();

    await expect(page.locator('#game-modal')).toHaveClass(/active/);

    // Verify game session creation API call
    expect(apiRequests.length).toBeGreaterThan(0);

    const sessionRequest = apiRequests[0];
    expect(sessionRequest.url()).toContain('create_game_session');
    expect(sessionRequest.method()).toBe('POST');
  });

  test('should handle game decision API calls', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible' });

    // Start a game
    const firstScenario = page.locator('.scenario-card').first();
    await firstScenario.click();

    await expect(page.locator('#game-modal')).toHaveClass(/active/);
    await page.waitForSelector('#game-container');

    // Monitor API requests
    const decisionRequests = [];
    page.on('request', request => {
      if (request.url().includes('/turn')) {
        decisionRequests.push(request);
      }
    });

    // Submit a decision
    const submitButton = page.locator('button:has-text("提交决策")');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Verify decision API call
      expect(decisionRequests.length).toBeGreaterThan(0);
      expect(decisionRequests[0].method()).toBe('POST');
    }
  });

  test('should handle API timeouts gracefully', async ({ page }) => {
    // Mock slow API response
    await page.route('**/scenarios/', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
      route.continue();
    });

    // Navigate to scenarios
    await page.click('[data-page="scenarios"]');

    // Should not hang indefinitely
    await page.waitForTimeout(8000); // Wait for timeout to occur

    // Should show fallback content or error
    const hasContent = await page.locator('.scenario-card').count() > 0 ||
                      await page.locator('text=离线模式').isVisible() ||
                      await page.locator('text=加载失败').isVisible();

    expect(hasContent).toBeTruthy();
  });

  test('should implement proper error handling', async ({ page }) => {
    // Mock API error responses
    await page.route('**/scenarios/', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.click('[data-page="scenarios"]');

    // Should handle error gracefully
    await expect(page.locator('#scenarios-page')).toBeVisible();

    // Should not show loading state indefinitely
    await page.waitForTimeout(3000);
    const isLoading = await page.locator('.loading').isVisible();
    expect(isLoading).toBeFalsy();
  });

  test('should validate API response data structure', async ({ page }) => {
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible' });

    // Get API response data
    const scenariosData = await page.evaluate(async () => {
      try {
        const response = await fetch('/scenarios/');
        const data = await response.json();
        return data;
      } catch (error) {
        return null;
      }
    });

    // Validate data structure
    expect(scenariosData).toBeTruthy();

    if (scenariosData.scenarios) {
      expect(Array.isArray(scenariosData.scenarios)).toBeTruthy();

      if (scenariosData.scenarios.length > 0) {
        const firstScenario = scenariosData.scenarios[0];
        expect(firstScenario.id).toBeTruthy();
        expect(firstScenario.name).toBeTruthy();
        expect(firstScenario.description).toBeTruthy();
        expect(firstScenario.difficulty).toBeTruthy();
      }
    }
  });

  test('should handle concurrent API requests', async ({ page }) => {
    // Navigate to multiple pages quickly
    await Promise.all([
      page.click('[data-page="scenarios"]'),
      page.click('[data-page="progress"]'),
      page.click('[data-page="scenarios"]')
    ]);

    // Should not crash or hang
    await page.waitForTimeout(2000);
    await expect(page.locator('#scenarios-page')).toBeVisible();
  });

  test('should implement proper request retries', async ({ page }) => {
    let requestCount = 0;

    // Mock initial failures followed by success
    await page.route('**/scenarios/', route => {
      requestCount++;
      if (requestCount <= 2) {
        route.abort();
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            scenarios: [
              {
                id: 'test-scenario',
                name: 'Test Scenario',
                description: 'Test Description',
                difficulty: 'beginner'
              }
            ]
          })
        });
      }
    });

    await page.click('[data-page="scenarios"]');

    // Should eventually succeed after retries
    await page.waitForSelector('.scenario-card', { state: 'visible' });
    expect(requestCount).toBeGreaterThan(2);
  });
});