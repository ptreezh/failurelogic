/**
 * API Configuration Manager Tests
 * TDD Tests for unified API configuration management
 */

describe('APIConfigManager', () => {
  let apiConfig;

  beforeEach(() => {
    // Reset environment before each test
    delete process.env.NODE_ENV;
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('API source selection', () => {
    test('should return localhost for development environment', () => {
      // Mock localhost environment
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      });

      apiConfig = new APIConfigManager();
      expect(apiConfig.getBaseUrl()).toBe('http://localhost:8000');
    });

    test('should return production API sources for GitHub Pages', () => {
      // Mock GitHub Pages environment
      Object.defineProperty(window, 'location', {
        value: { hostname: 'jefferson-bennett.github.io' },
        writable: true
      });

      apiConfig = new APIConfigManager();
      const baseUrl = apiConfig.getBaseUrl();

      // Should return one of the production API sources
      const validSources = [
        'https://turbo-rotary-phone-pq4jq7pvr7f6jxx-8000.app.github.dev',
        'https://failurelogic-api.vercel.app',
        'https://failurelogic.vercel.app'
      ];

      expect(validSources).toContain(baseUrl);
    });

    test('should prioritize healthy API sources', async () => {
      apiConfig = new APIConfigManager();

      // Mock health check responses
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500 }) // First source fails
        .mockResolvedValueOnce({ ok: true, status: 200 });   // Second source succeeds

      await apiConfig.selectHealthiestSource();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(apiConfig.getCurrentSourceIndex()).toBe(1);
    });
  });

  describe('Connection pooling', () => {
    test('should reuse HTTP connections for better performance', async () => {
      apiConfig = new APIConfigManager();

      const mockFetch = jest.fn().mockResolvedValue({ ok: true, json: () => ({}) });
      global.fetch = mockFetch;

      // Make multiple requests
      await apiConfig.request('/test');
      await apiConfig.request('/test2');

      // Should reuse connection (same agent)
      expect(mockFetch.mock.calls[0][0]).toContain('keep-alive');
      expect(mockFetch.mock.calls[1][0]).toContain('keep-alive');
    });
  });

  describe('Timeout management', () => {
    test('should timeout requests after configured duration', async () => {
      apiConfig = new APIConfigManager({ timeout: 1000 });

      // Mock slow response
      global.fetch = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 2000))
      );

      await expect(apiConfig.request('/slow')).rejects.toThrow('timeout');
    });
  });

  describe('Performance monitoring', () => {
    test('should track API response times', async () => {
      apiConfig = new APIConfigManager();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      });

      await apiConfig.request('/test');

      const metrics = apiConfig.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    test('should track error rates', async () => {
      apiConfig = new APIConfigManager();

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      await apiConfig.request('/error').catch(() => {});
      await apiConfig.request('/success');

      const metrics = apiConfig.getMetrics();
      expect(metrics.errorRate).toBeCloseTo(0.5, 1);
    });
  });

  describe('Adaptive retry logic', () => {
    test('should implement exponential backoff for failed requests', async () => {
      jest.useFakeTimers();

      apiConfig = new APIConfigManager({ maxRetries: 3 });

      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: () => ({}) });

      const requestPromise = apiConfig.request('/retry-test');

      // Fast-forward through delays
      jest.advanceTimersByTime(1000); // First retry
      jest.advanceTimersByTime(2000); // Second retry

      await requestPromise;

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});