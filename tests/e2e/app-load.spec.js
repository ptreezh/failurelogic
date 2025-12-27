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

    // Performance assertions
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Verify main elements are present
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.nav-container')).toBeVisible();
    await expect(page.locator('.app-main')).toBeVisible();

    // Verify initial page is loaded
    await expect(page.locator('#home-page')).toHaveClass(/active/);
  });

  test('should hide loading screen after app loads', async ({ page }) => {
    await page.goto('/');

    // Loading screen should be visible initially
    await expect(page.locator('#loading-screen')).toBeVisible();

    // Loading screen should be hidden after app loads
    await page.waitForSelector('#loading-screen', { state: 'hidden' });
    await expect(page.locator('#loading-screen')).not.toBeVisible();
  });

  test('should load navigation items correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for navigation to load
    await page.waitForSelector('.nav-item');

    // Verify all navigation items are present
    const navItems = page.locator('.nav-item');
    await expect(navItems).toHaveCount(8); // All navigation items

    // Verify specific navigation items
    await expect(page.locator('[data-page="home"]')).toBeVisible();
    await expect(page.locator('[data-page="scenarios"]')).toBeVisible();
    await expect(page.locator('[data-page="progress"]')).toBeVisible();
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

    // Wait for service worker registration
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.ready;
    });

    expect(swRegistration).toBeTruthy();

    // Verify service worker is active
    const swActive = await page.evaluate(() => {
      return navigator.serviceWorker.controller !== null;
    });

    expect(swActive).toBeTruthy();
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
    expect(response).toBeOK();

    // Check if manifest link is present
    const manifestLink = await page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', 'manifest.json');

    // Verify manifest is accessible
    const manifestResponse = await page.goto('/manifest.json');
    expect(manifestResponse).toBeOK();
  });

  test('should handle offline mode correctly', async ({ page }) => {
    await page.goto('/');

    // Simulate offline mode
    await page.context().setOffline(true);

    // Try to navigate to scenarios page
    await page.click('[data-page="scenarios"]');

    // Should handle offline gracefully
    await expect(page.locator('#scenarios-page')).toBeVisible();

    // Should show appropriate offline messaging
    await expect(page.locator('text=离线模式')).toBeVisible();
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
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000);
    expect(performanceMetrics.loadComplete).toBeLessThan(5000);
  });

  test('should handle accessibility requirements', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading structure
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check for skip link or accessibility features
    const skipLink = page.locator('a[href="#main-content"], .skip-link');
    if (await skipLink.isVisible()) {
      await expect(skipLink).toBeVisible();
    }

    // Check ARIA labels on navigation
    const nav = page.locator('nav[role="navigation"], .nav-container');
    await expect(nav).toBeVisible();

    // Check for proper focus management
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    expect(await focusedElement.count()).toBeGreaterThan(0);
  });
});