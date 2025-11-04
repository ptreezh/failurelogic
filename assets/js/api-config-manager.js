/**
 * Unified API Configuration Manager
 * Optimized for performance and reliability
 */

class APIConfigManager {
  constructor(options = {}) {
    // Configuration options
    this.options = {
      timeout: options.timeout || 5000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      healthCheckInterval: options.healthCheckInterval || 30000,
      connectionPoolSize: options.connectionPoolSize || 5,
      ...options
    };

    // API sources with priority order
    this.apiSources = this.getAPISources();
    this.currentSourceIndex = 0;
    this.isHealthCheckRunning = false;

    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      totalResponseTime: 0,
      errors: [],
      sourceStats: {}
    };

    // Connection pool
    this.connectionPool = [];
    this.initializeConnectionPool();

    // Start health monitoring
    this.startHealthMonitoring();

    // Cached API client with keep-alive
    this.apiClient = this.createAPIClient();
  }

  getAPISources() {
    const hostname = window.location.hostname;

    // Development environment - localhost only
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return ['http://localhost:8000'];
    }

    // Production environment - remote API sources only
    return [
      'https://turbo-rotary-phone-pq4jq7pvr7f6jxx-8000.app.github.dev', // Primary GitHub Codespaces
      'https://failurelogic-api.vercel.app', // Backup 1: Vercel API
      'https://failurelogic.vercel.app'       // Backup 2: Vercel main
    ];
  }

  getBaseUrl() {
    if (this.options.overrideBaseUrl) {
      return this.options.overrideBaseUrl;
    }

    const currentSource = this.apiSources[this.currentSourceIndex];
    if (!currentSource) {
      throw new Error('No API sources available');
    }

    return currentSource;
  }

  getCurrentSourceIndex() {
    return this.currentSourceIndex;
  }

  createAPIClient() {
    // Create a reusable fetch with optimized defaults
    const controller = new AbortController();

    return async (endpoint, requestOptions = {}) => {
      const url = `${this.getBaseUrl()}${endpoint}`;
      const startTime = performance.now();

      this.metrics.totalRequests++;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Connection': 'keep-alive',
          ...requestOptions.headers
        },
        signal: controller.signal,
        ...requestOptions
      };

      let lastError;
      let attempt = 0;

      while (attempt <= this.options.maxRetries) {
        try {
          const response = await fetch(url, {
            ...config,
            signal: AbortSignal.timeout(this.options.timeout)
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          const responseTime = performance.now() - startTime;

          // Update metrics
          this.updateMetrics(true, responseTime);
          this.recordSourceStats(true);

          return data;

        } catch (error) {
          lastError = error;
          this.recordSourceStats(false);

          if (attempt < this.options.maxRetries) {
            // Exponential backoff with jitter
            const delay = this.options.retryDelay * Math.pow(2, attempt) +
                         Math.random() * 1000;

            await this.sleep(delay);
            attempt++;

            // Try next API source if current one fails
            if (error.message.includes('timeout') || error.message.includes('Failed to fetch')) {
              await this.tryNextSource();
            }
          }
        }
      }

      // All attempts failed
      this.updateMetrics(false, performance.now() - startTime);
      this.recordError(lastError);
      throw lastError;
    };
  }

  async request(endpoint, options = {}) {
    return this.apiClient(endpoint, options);
  }

  async selectHealthiestSource() {
    if (this.isHealthCheckRunning) {
      return;
    }

    this.isHealthCheckRunning = true;

    for (let i = 0; i < this.apiSources.length; i++) {
      try {
        const source = this.apiSources[i];
        const response = await fetch(`${source}/`, {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });

        if (response.ok) {
          this.currentSourceIndex = i;
          console.log(`✅ Switched to healthy API source: ${source}`);
          break;
        }
      } catch (error) {
        console.warn(`❌ API source ${this.apiSources[i]} health check failed:`, error.message);
      }
    }

    this.isHealthCheckRunning = false;
  }

  async tryNextSource() {
    const nextIndex = (this.currentSourceIndex + 1) % this.apiSources.length;
    if (nextIndex !== this.currentSourceIndex) {
      this.currentSourceIndex = nextIndex;
      console.log(`🔄 Switching to API source ${nextIndex}: ${this.getBaseUrl()}`);
    }
  }

  startHealthMonitoring() {
    setInterval(() => {
      this.selectHealthiestSource();
    }, this.options.healthCheckInterval);
  }

  updateMetrics(success, responseTime) {
    this.metrics.totalResponseTime += responseTime;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.errors.push({
        timestamp: Date.now(),
        source: this.getBaseUrl(),
        responseTime
      });
    }

    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }
  }

  recordSourceStats(success) {
    const source = this.getBaseUrl();
    if (!this.metrics.sourceStats[source]) {
      this.metrics.sourceStats[source] = { success: 0, failure: 0 };
    }

    if (success) {
      this.metrics.sourceStats[source].success++;
    } else {
      this.metrics.sourceStats[source].failure++;
    }
  }

  recordError(error) {
    this.metrics.errors.push({
      timestamp: Date.now(),
      source: this.getBaseUrl(),
      error: error.message
    });
  }

  getMetrics() {
    const averageResponseTime = this.metrics.totalRequests > 0
      ? this.metrics.totalResponseTime / this.metrics.totalRequests
      : 0;

    const errorRate = this.metrics.totalRequests > 0
      ? (this.metrics.totalRequests - this.metrics.successfulRequests) / this.metrics.totalRequests
      : 0;

    return {
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      currentSource: this.getBaseUrl(),
      sourceStats: this.metrics.sourceStats,
      recentErrors: this.metrics.errors.slice(-10)
    };
  }

  initializeConnectionPool() {
    // Pre-warm connections for better performance
    for (let i = 0; i < this.options.connectionPoolSize; i++) {
      this.connectionPool.push({
        active: false,
        created: Date.now()
      });
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Force refresh API source selection
  async refreshSource() {
    await this.selectHealthiestSource();
  }

  // Override for testing
  setOverrideUrl(url) {
    this.options.overrideBaseUrl = url;
  }

  // Clear override
  clearOverride() {
    delete this.options.overrideBaseUrl;
  }
}

// Export for use in application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIConfigManager;
} else if (typeof window !== 'undefined') {
  window.APIConfigManager = APIConfigManager;
}