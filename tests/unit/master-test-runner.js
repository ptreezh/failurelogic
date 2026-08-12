/**
 * Master Test Runner - 全自动并发solo执行系统
 * Coffee Shop Deep Experience Comprehensive Test Suite
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const vm = require('vm');

const TEST_DIR = path.join(__dirname);
const PROJECT_ROOT = path.join(TEST_DIR, '..', '..');

class MasterTestRunner {
  constructor() {
    this.results = {
      startTime: Date.now(),
      endTime: null,
      suites: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      }
    };
  }

  async runAll() {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 COFFEE SHOP DEEP EXPERIENCE - COMPREHENSIVE TEST SUITE');
    console.log('='.repeat(70));
    console.log(`\n📁 Project Root: ${PROJECT_ROOT}`);
    console.log(`📁 Test Dir: ${TEST_DIR}`);
    console.log(`⏰ Start Time: ${new Date().toISOString()}\n`);

    // Phase 1: Environment Check
    console.log('━'.repeat(70));
    console.log('📋 Phase 1: Environment Check');
    console.log('━'.repeat(70));
    await this.runPhase1();

    // Phase 2: Unit Tests (Concurrent)
    console.log('\n' + '━'.repeat(70));
    console.log('🧪 Phase 2: Unit Tests (Concurrent)');
    console.log('━'.repeat(70));
    await this.runPhase2();

    // Phase 3: Integration Tests (Concurrent)
    console.log('\n' + '━'.repeat(70));
    console.log('🔗 Phase 3: Integration Tests (Concurrent)');
    console.log('━'.repeat(70));
    await this.runPhase3();

    // Phase 4: Stress Tests (Concurrent)
    console.log('\n' + '━'.repeat(70));
    console.log('💥 Phase 4: Stress Tests (Concurrent)');
    console.log('━'.repeat(70));
    await this.runPhase4();

    // Phase 5: Regression Tests (Concurrent)
    console.log('\n' + '━'.repeat(70));
    console.log('🔄 Phase 5: Regression Tests (Concurrent)');
    console.log('━'.repeat(70));
    await this.runPhase5();

    // Phase 6: E2E Tests (Serial, if Playwright available)
    console.log('\n' + '━'.repeat(70));
    console.log('🌐 Phase 6: E2E Tests (Serial)');
    console.log('━'.repeat(70));
    await this.runPhase6();

    // Phase 7: Report Generation
    console.log('\n' + '━'.repeat(70));
    console.log('📊 Phase 7: Report Generation');
    console.log('━'.repeat(70));
    this.generateReport();

    return this.results;
  }

  async runPhase1() {
    const jsFiles = [
      'assets/js/coffee-shop-deep-router.js',
      'assets/js/coffee-shop-competition-integration.js',
      'assets/js/competition-system.js',
      'assets/js/leaderboard.js',
      'assets/js/market-environment.js',
      'assets/js/ai-competitor.js',
      'assets/js/cognitive-engine.js'
    ];

    const results = await Promise.allSettled(
      jsFiles.map(file => this.checkSyntax(file))
    );

    let passed = 0;
    let failed = 0;
    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.success) {
        console.log(`  ✅ Syntax Check: ${jsFiles[i]}`);
        passed++;
      } else {
        console.log(`  ❌ Syntax Check: ${jsFiles[i]}: ${result.status === 'rejected' ? result.reason : result.value.error}`);
        failed++;
      }
    });

    this.results.suites['phase1-environment'] = { passed, failed, total: jsFiles.length };
    this.results.summary.total += jsFiles.length;
    this.results.summary.passed += passed;
    this.results.summary.failed += failed;
  }

  async runPhase2() {
    const unitTestFiles = [
      'test_competition_integration.js',
      'test_competition_system.js',
      'test_leaderboard.js',
      'test_ai_competitor.js',
      'test_market_environment.js',
      'time-delay-model.test.js'
    ];

    const results = await Promise.allSettled(
      unitTestFiles.map(file => 
        this.runCommand(`Unit: ${file}`, `node "${path.join(TEST_DIR, file)}"`)
      )
    );

    let passed = 0;
    let failed = 0;
    let totalTests = 0;

    results.forEach((result, i) => {
      const file = unitTestFiles[i];
      if (result.status === 'fulfilled' && result.value.success) {
        const match = result.value.output.match(/Tests:\s*(\d+),\s*Passed:\s*(\d+),\s*Failed:\s*(\d+)/);
        if (match) {
          const [, total, pass, fail] = match.map(Number);
          totalTests += total;
          passed += pass;
          failed += fail;
          console.log(`  ✅ ${file}: ${pass}/${total} passed`);
        } else {
          console.log(`  ✅ ${file}: completed`);
          passed++;
        }
      } else {
        console.log(`  ❌ ${file}: ${result.status === 'rejected' ? result.reason : result.value.error}`);
        failed++;
      }
    });

    this.results.suites['phase2-unit'] = { passed, failed, total: totalTests || unitTestFiles.length };
    this.results.summary.total += totalTests || unitTestFiles.length;
    this.results.summary.passed += passed;
    this.results.summary.failed += failed;
  }

  async runPhase3() {
    const integrationTests = [
      {
        name: 'Full 6-Turn Game Flow',
        test: async () => {
          const router = this.createRouter();
          router.startGame();
          
          for (let i = 0; i < 6; i++) {
            const options = router.generateContextualOptions();
            if (options.length > 0) {
              router.makeDecision(0);
            }
            if (router.state.phase === 'ending') break;
            router.advanceTurn();
          }
          
          return router.state.turn > 0 && router.state.decision_history.length > 0;
        }
      },
      {
        name: 'Competition State Sync',
        test: async () => {
          const router = this.createRouter();
          router.startGame();
          
          return router.competitionEnabled === true &&
                 router.leaderboard !== null &&
                 router.competitors.length === 4;
        }
      },
      {
        name: 'State Reset on Restart',
        test: async () => {
          const router = this.createRouter();
          router.startGame();
          
          const options = router.generateContextualOptions();
          if (options.length > 0) {
            router.makeDecision(0);
            router.advanceTurn();
          }
          
          router.restart();
          
          return router.state.turn === 1 &&
                 router.state.resources === 1000 &&
                 router.state.decision_history.length === 0;
        }
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of integrationTests) {
      try {
        const result = await test.test();
        if (result) {
          console.log(`  ✅ ${test.name}`);
          passed++;
        } else {
          console.log(`  ❌ ${test.name}: assertion failed`);
          failed++;
        }
      } catch (error) {
        console.log(`  ❌ ${test.name}: ${error.message}`);
        failed++;
      }
    }

    this.results.suites['phase3-integration'] = { passed, failed, total: integrationTests.length };
    this.results.summary.total += integrationTests.length;
    this.results.summary.passed += passed;
    this.results.summary.failed += failed;
  }

  async runPhase4() {
    const stressTests = [
      {
        name: '100-Turn Stability',
        test: async () => {
          const router = this.createRouter();
          router.state.max_turns = 100;
          router.startGame();
          
          for (let i = 0; i < 100; i++) {
            const options = router.generateContextualOptions();
            if (options.length > 0) {
              const idx = Math.floor(Math.random() * options.length);
              router.makeDecision(idx);
            }
            if (router.state.phase === 'ending') break;
            router.advanceTurn();
          }
          
          return router.state.turn <= 101;
        }
      },
      {
        name: '10 Concurrent Instances',
        test: async () => {
          const instances = [];
          for (let i = 0; i < 10; i++) {
            const router = this.createRouter();
            router.startGame();
            instances.push(router);
          }
          
          const states = instances.map(r => r.state.resources);
          const allIndependent = states.every(s => s === 1000);
          
          return allIndependent;
        }
      },
      {
        name: 'Extreme Staff Count (0)',
        test: async () => {
          const router = this.createRouter();
          router.startGame();
          router.hiddenSystem.staff_count = 0;
          router.updateHiddenSystem({ staff_count: 0, marketing_investment: 0 });
          
          return router.hiddenSystem.staff_count === 0 &&
                 router.hiddenSystem.staff_efficiency === 100;
        }
      },
      {
        name: 'Extreme Staff Count (100)',
        test: async () => {
          const router = this.createRouter();
          router.startGame();
          router.hiddenSystem.staff_count = 100;
          router.updateHiddenSystem({ staff_count: 100, marketing_investment: 0 });
          
          const efficiency = router.hiddenSystem.calculateStaffEfficiency();
          const coordination = router.hiddenSystem.calculateCoordinationCost();
          
          return efficiency < 50 && coordination > 100;
        }
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of stressTests) {
      try {
        const result = await test.test();
        if (result) {
          console.log(`  ✅ ${test.name}`);
          passed++;
        } else {
          console.log(`  ❌ ${test.name}: assertion failed`);
          failed++;
        }
      } catch (error) {
        console.log(`  ❌ ${test.name}: ${error.message}`);
        failed++;
      }
    }

    this.results.suites['phase4-stress'] = { passed, failed, total: stressTests.length };
    this.results.summary.total += stressTests.length;
    this.results.summary.passed += passed;
    this.results.summary.failed += failed;
  }

  async runPhase5() {
    const regressionTests = [
      {
        name: 'Behavior Regression: No Competition Modules',
        test: async () => {
          // Create sandbox with only base router dependencies
          const sandbox = {
            global: {},
            console,
            Math,
            Date,
            JSON,
            module: { exports: {} }
          };
          
          vm.createContext(sandbox);
          
          // Load only the base router (which depends on cognitive-engine internals)
          const baseRouterCode = fs.readFileSync(path.join(PROJECT_ROOT, 'assets/js/coffee-shop-deep-router.js'), 'utf8');
          
          // The base router uses classes from cognitive-engine.js, so we need to load that first
          const cognitiveCode = fs.readFileSync(path.join(PROJECT_ROOT, 'assets/js/cognitive-engine.js'), 'utf8');
          vm.runInContext(cognitiveCode, sandbox);
          vm.runInContext(baseRouterCode, sandbox);
          
          // In this sandbox, MarketEnvironment etc are NOT defined
          // But the base router's initCompetition will be called during construction
          const container = { innerHTML: '' };
          const RouterClass = sandbox.global.CoffeeShopDeepRouter || sandbox.CoffeeShopDeepRouter;
          
          if (!RouterClass) {
            throw new Error('CoffeeShopDeepRouter not found in sandbox');
          }
          
          const router = new RouterClass(container);
          
          return router.competitionEnabled === false &&
                 router.state.satisfaction === 50 &&
                 router.state.resources === 1000;
        }
      },
      {
        name: 'Deterministic: Same Input -> Same Output',
        test: async () => {
          const run1 = this.runDeterministicGame();
          const run2 = this.runDeterministicGame();
          
          return JSON.stringify(run1) === JSON.stringify(run2);
        }
      },
      {
        name: 'Deterministic: Competition Results',
        test: async () => {
          const { AICompetitor, PERSONALITY_TYPES, CompetitionSystem, MarketEnvironment } = 
            this.loadModules();
          
          const marketEnv1 = new MarketEnvironment({ totalAddressableMarket: 1000, currentCustomers: 500 });
          const competitor1 = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
          const system1 = new CompetitionSystem({
            marketEnvironment: marketEnv1,
            userState: { satisfaction: 60, reputation: 50, daily_revenue: 800, daily_customers: 40, staff_count: 5 },
            competitors: [competitor1]
          });
          
          const marketEnv2 = new MarketEnvironment({ totalAddressableMarket: 1000, currentCustomers: 500 });
          const competitor2 = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
          const system2 = new CompetitionSystem({
            marketEnvironment: marketEnv2,
            userState: { satisfaction: 60, reputation: 50, daily_revenue: 800, daily_customers: 40, staff_count: 5 },
            competitors: [competitor2]
          });
          
          const result1 = system1.runCompetitionTurn('hire');
          const result2 = system2.runCompetitionTurn('hire');
          
          return result1.customerTransfer.netChange === result2.customerTransfer.netChange &&
                 result1.marketImpact.totalCompetitorCustomers === result2.marketImpact.totalCompetitorCustomers;
        }
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of regressionTests) {
      try {
        const result = await test.test();
        if (result) {
          console.log(`  ✅ ${test.name}`);
          passed++;
        } else {
          console.log(`  ❌ ${test.name}: assertion failed`);
          failed++;
        }
      } catch (error) {
        console.log(`  ❌ ${test.name}: ${error.message}`);
        failed++;
      }
    }

    this.results.suites['phase5-regression'] = { passed, failed, total: regressionTests.length };
    this.results.summary.total += regressionTests.length;
    this.results.summary.passed += passed;
    this.results.summary.failed += failed;
  }

  async runPhase6() {
    // Check if Playwright is available
    let playwrightAvailable = false;
    try {
      execSync('npx playwright --version', { stdio: 'ignore' });
      playwrightAvailable = true;
    } catch (e) {
      // Playwright not available
    }

    if (!playwrightAvailable) {
      console.log('  ⏭️  Playwright not available, skipping E2E tests');
      this.results.suites['phase6-e2e'] = { passed: 0, failed: 0, total: 0, skipped: true };
      return;
    }

    // Run Playwright tests if available
    try {
      const result = await this.runCommand(
        'Playwright E2E',
        `npx playwright test --config="${path.join(TEST_DIR, '..', 'playwright.config.js')}" tests/e2e --reporter=list`,
        120000
      );
      
      if (result.success) {
        console.log('  ✅ Playwright E2E tests completed');
        this.results.suites['phase6-e2e'] = { passed: 1, failed: 0, total: 1 };
        this.results.summary.total += 1;
        this.results.summary.passed += 1;
      } else {
        console.log(`  ❌ Playwright E2E tests failed: ${result.error}`);
        this.results.suites['phase6-e2e'] = { passed: 0, failed: 1, total: 1 };
        this.results.summary.total += 1;
        this.results.summary.failed += 1;
      }
    } catch (error) {
      console.log(`  ❌ Playwright E2E tests error: ${error.message}`);
      this.results.suites['phase6-e2e'] = { passed: 0, failed: 1, total: 1 };
      this.results.summary.total += 1;
      this.results.summary.failed += 1;
    }
  }

  loadModules() {
    const context = { global, console, module: { exports: {} } };
    const files = [
      'assets/js/cognitive-engine.js',
      'assets/js/market-environment.js',
      'assets/js/ai-competitor.js',
      'assets/js/competition-system.js',
      'assets/js/leaderboard.js',
      'assets/js/coffee-shop-deep-router.js'
    ];
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
      vm.runInThisContext(content);
    });
    
    return {
      CoffeeShopDeepRouter: global.CoffeeShopDeepRouter,
      AICompetitor: global.AICompetitor,
      PERSONALITY_TYPES: global.PERSONALITY_TYPES,
      CompetitionSystem: global.CompetitionSystem,
      MarketEnvironment: global.MarketEnvironment,
      Leaderboard: global.Leaderboard
    };
  }

  createRouter() {
    const { CoffeeShopDeepRouter } = this.loadModules();
    const container = { innerHTML: '' };
    return new CoffeeShopDeepRouter(container);
  }

  runDeterministicGame() {
    const router = this.createRouter();
    router.startGame();
    
    for (let i = 0; i < 3; i++) {
      const options = router.generateContextualOptions();
      if (options.length > 0) {
        router.makeDecision(options.length - 1);
      }
      if (router.state.phase === 'ending') break;
      router.advanceTurn();
    }
    
    return {
      turn: router.state.turn,
      satisfaction: router.state.satisfaction,
      resources: router.state.resources,
      reputation: router.state.reputation,
      daily_customers: router.state.daily_customers,
      decision_count: router.state.decision_history.length
    };
  }

  checkSyntax(file) {
    return new Promise((resolve) => {
      const filePath = path.join(PROJECT_ROOT, file);
      if (!fs.existsSync(filePath)) {
        resolve({ success: false, error: `File not found: ${filePath}` });
        return;
      }
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // For browser files that reference document/window, provide mocks
        if (file.includes('coffee-shop-competition-integration')) {
          const mockContext = {
            global: {},
            console,
            document: { readyState: 'complete', addEventListener: () => {} },
            window: {},
            module: { exports: {} }
          };
          vm.createContext(mockContext);
          vm.runInContext(content, mockContext);
        } else {
          vm.runInThisContext(content);
        }
        resolve({ success: true });
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  runCommand(name, cmd, timeout = 30000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const process = spawn('cmd', ['/c', cmd], { timeout, shell: true });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        const duration = Date.now() - start;
        resolve({
          name,
          success: code === 0,
          exitCode: code,
          output: stdout,
          error: stderr,
          duration
        });
      });
      
      process.on('error', (error) => {
        resolve({
          name,
          success: false,
          exitCode: -1,
          output: '',
          error: error.message,
          duration: Date.now() - start
        });
      });
    });
  }

  generateReport() {
    this.results.endTime = Date.now();
    this.results.summary.duration = this.results.endTime - this.results.startTime;

    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    console.log(`\n  Total Tests:   ${this.results.summary.total}`);
    console.log(`  Passed:        ${this.results.summary.passed} ✅`);
    console.log(`  Failed:        ${this.results.summary.failed} ❌`);
    console.log(`  Skipped:       ${this.results.summary.skipped || 0} ⏭️`);
    console.log(`  Duration:      ${(this.results.summary.duration / 1000).toFixed(2)}s`);
    console.log(`  Pass Rate:     ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
    
    console.log('\n' + '-'.repeat(70));
    console.log('📋 SUITE BREAKDOWN');
    console.log('-'.repeat(70));
    
    for (const [suite, data] of Object.entries(this.results.suites)) {
      const status = data.skipped ? '⏭️ SKIPPED' : (data.failed === 0 ? '✅ PASSED' : '❌ FAILED');
      console.log(`  ${suite}: ${data.passed}/${data.total} passed ${status}`);
    }
    
    console.log('\n' + '='.repeat(70));
    
    if (this.results.summary.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! System is ready for deployment.');
    } else {
      console.log('⚠️  SOME TESTS FAILED. Please review and fix issues before deployment.');
    }
    console.log('='.repeat(70) + '\n');

    // Write report to file
    const reportPath = path.join(TEST_DIR, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run if executed directly
if (require.main === module) {
  const runner = new MasterTestRunner();
  runner.runAll().catch(console.error);
}

module.exports = { MasterTestRunner };
