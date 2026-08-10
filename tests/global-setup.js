/**
 * Global test setup for Playwright
 * Prepare test environment and start necessary services
 */

async function globalSetup(config) {
  console.log('🚀 Setting up test environment...');

  const startTime = Date.now();

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'e2e';

  // Wait for services to be ready
  console.log('⏳ Waiting for services to start...');
  await waitForServices();

  const setupTime = Date.now() - startTime;
  console.log(`✅ Test environment ready (${setupTime}ms)`);
}

async function waitForServices() {
  const maxWaitTime = 120000; // 2 minutes
  const checkInterval = 2000; // 2 seconds
  let startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Check frontend server (required)
      const frontendResponse = await fetch('http://localhost:3000/');
      if (frontendResponse.ok) {
        console.log('✅ Frontend server is ready');

        // Check API server (optional - may not be available in all environments)
        try {
          const apiResponse = await fetch('http://localhost:8000/');
          if (apiResponse.ok) {
            console.log('✅ API server is ready');
          } else {
            console.log('⚠️  API server not available, continuing with frontend-only tests');
          }
        } catch (apiError) {
          console.log('⚠️  API server not available, continuing with frontend-only tests');
        }

        return;
      }
    } catch (error) {
      // Services not ready yet, continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, checkInterval));
    console.log('⏳ Still waiting for services...');
  }

  throw new Error('❌ Frontend server failed to start within timeout period');
}

export default globalSetup;