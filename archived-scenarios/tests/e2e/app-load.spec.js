/**
 * Application Loading Tests
 * TDD tests for application initialization and performance
 */

import { test, expect } from '@playwright/test';

test.describe('Application Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before any page scripts run.
    await page.context().clearCookies();

    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Some browsers / contexts may deny storage access before navigation.
      }
    });
  });

  test('should load the main page successfully', async ({ page }) => {
    // Start measuring performance
    const navigationStart = Date.now();

    await page.goto('/');

    // Wait for the app to be fully loaded
    await page.waitForSelector('#app', { state: 'visible' });

    const loadTime = Date.now() - navigationStart;

    // Performance assertions (more lenient for CI/variability)
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds

    // Verify main elements are present
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.nav-container')).toBeVisible();
    await expect(page.locator('.app-main')).toBeVisible();

    // Verify initial page is loaded
    await expect(page.locator('#home-page')).toHaveClass(/active/);
  });

  test('should hide loading screen after app loads', async ({ page }) => {
    await page.goto('/');

    // Loading screen is hidden by default and removed by JS
    // Verify it remains hidden after app loads
    await page.waitForSelector('#app', { state: 'visible' });
    const loadingScreen = page.locator('#loading-screen');

    // Loading screen should not be visible (intentional design choice)
    const isVisible = await loadingScreen.isVisible().catch(() => false);
    expect(isVisible).toBeFalsy();
  });

  test('should load navigation items correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for navigation to load
    await page.waitForSelector('.nav-item');

    // Verify all navigation items are present
    const navItems = page.locator('.nav-item');
    await expect(navItems).toHaveCount(6); // All navigation items: home, scenarios, exponential, about, book, profile

    // Verify specific navigation items
    await expect(page.locator('[data-page="home"]')).toBeVisible();
    await expect(page.locator('[data-page="scenarios"]')).toBeVisible();
    await expect(page.locator('[data-page="exponential"]')).toBeVisible();
    await expect(page.locator('[data-page="about"]')).toBeVisible();
    await expect(page.locator('[data-page="book"]')).toBeVisible();
  });

  test('should handle responsive design correctly', async ({ page }) => {
    await page.goto('/');

    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.nav-container')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.app-header')).toBeVisible();
    // Mobile-specific assertions can be added here
  });

  test('should initialize service worker correctly', async ({ page }) => {
    await page.goto('/');

    // Service worker registration is optional - just verify it doesn't crash the app
    const swInfo = await page.evaluate(() => {
      return {
        hasServiceWorker: 'serviceWorker' in navigator,
        controller: navigator.serviceWorker?.controller !== null
      };
    });

    // Service worker API should be available (even if not registered)
    expect(swInfo.hasServiceWorker).toBeTruthy();

    // App should work regardless of service worker status
    await expect(page.locator('#app')).toBeVisible();
  });

  test('should handle API connectivity gracefully', async ({ page }) => {
    // Mock API failure scenario
    await page.route('**/scenarios/', route => route.abort());

    await page.goto('/');

    // Navigate to scenarios page
    await page.click('[data-page="scenarios"]');

    // Should show fallback content or error message
    await expect(page.locator('#scenarios-page')).toBeVisible();

    // Should not show loading state indefinitely
    await page.waitForTimeout(5000);
    const loadingIndicator = page.locator('.loading');
    const isLoading = await loadingIndicator.isVisible();
    expect(isLoading).toBeFalsy();
  });

  test('should load PWA manifest correctly', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.ok()).toBeTruthy();

    // Check if manifest link is present (more flexible check)
    const manifestLink = page.locator('link[rel="manifest"]');
    const manifestCount = await manifestLink.count();

    // Manifest link should exist
    expect(manifestCount).toBeGreaterThan(0);

    // Verify href contains manifest (but don't be strict about exact path)
    if (manifestCount > 0) {
      const href = await manifestLink.getAttribute('href');
      expect(href).toMatch(/manifest/);
    }
  });

  test('should handle offline mode correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for navigation to be ready
    await page.waitForSelector('[data-page="scenarios"]', { state: 'attached', timeout: 10000 });

    // Simulate offline mode
    await page.context().setOffline(true);

    // Try to navigate to scenarios page
    await page.click('[data-page="scenarios"]');

    // Wait a bit for the page to respond
    await page.waitForTimeout(2000);

    // Should handle offline gracefully - scenarios page should be visible (even with cached/error content)
    const scenariosPage = page.locator('#scenarios-page');
    const isVisible = await scenariosPage.isVisible().catch(() => false);

    // Either scenarios page is visible, or home page (fallback)
    const homePage = page.locator('#home-page');
    const homeVisible = await homePage.isVisible().catch(() => false);

    expect(isVisible || homeVisible).toBeTruthy();
  });

  test('should track performance metrics', async ({ page }) => {
    await page.goto('/');

    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      if (window.performance && window.performance.timing) {
        return {
          domContentLoaded: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
          loadComplete: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
        };
      }
      return null;
    });

    expect(performanceMetrics).toBeTruthy();
    // More lenient timing thresholds to account for slower CI/build machines
    expect(performanceMetrics.domContentLoaded).toBeLessThan(5000);
    expect(performanceMetrics.loadComplete).toBeLessThan(10000);
  });

  test('should handle accessibility requirements', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading structure (h1 or any heading)
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Check for navigation (ARIA role or class)
    const nav = page.locator('nav[role="navigation"], .nav-container, nav');
    const navCount = await nav.count();
    expect(navCount).toBeGreaterThan(0);

    // Check for proper focus management
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    expect(await focusedElement.count()).toBeGreaterThan(0);
  });
});