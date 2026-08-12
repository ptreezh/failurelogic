/**
 * Integration Test: Competition System + Coffee Shop Deep Router
 *
 * Phase 5: Testing the integrated competition system
 */

const { TestRunner, expect } = require('./test-runner.js');

const fs = require('fs');
const path = require('path');

const marketEnvPath = path.join(__dirname, '../../assets/js/market-environment.js');
const aiCompetitorPath = path.join(__dirname, '../../assets/js/ai-competitor.js');
const competitionSystemPath = path.join(__dirname, '../../assets/js/competition-system.js');
const leaderboardPath = path.join(__dirname, '../../assets/js/leaderboard.js');
const routerPath = path.join(__dirname, '../../assets/js/coffee-shop-deep-router.js');

const marketEnvContent = fs.readFileSync(marketEnvPath, 'utf8');
const aiCompetitorContent = fs.readFileSync(aiCompetitorPath, 'utf8');
const competitionSystemContent = fs.readFileSync(competitionSystemPath, 'utf8');
const leaderboardContent = fs.readFileSync(leaderboardPath, 'utf8');
const routerContent = fs.readFileSync(routerPath, 'utf8');

eval(marketEnvContent);
eval(aiCompetitorContent);
eval(competitionSystemContent);
eval(leaderboardContent);
eval(routerContent);

const runner = new TestRunner();

// ============================================================================
// 测试套件1: 模块加载验证
// ============================================================================

runner.describe('Module Loading', () => {
    runner.test('MarketEnvironment should be defined', () => {
        expect(typeof MarketEnvironment).toBe('function');
    });

    runner.test('AICompetitor should be defined', () => {
        expect(typeof AICompetitor).toBe('function');
    });

    runner.test('CompetitionSystem should be defined', () => {
        expect(typeof CompetitionSystem).toBe('function');
    });

    runner.test('Leaderboard should be defined', () => {
        expect(typeof Leaderboard).toBe('function');
    });

    runner.test('CoffeeShopDeepRouter should be defined', () => {
        expect(typeof CoffeeShopDeepRouter).toBe('function');
    });
});

// ============================================================================
// 测试套件2: 行为回归基准（Phase 5 专项验证）
// ============================================================================

runner.describe('Behavior Regression Baseline', () => {
    runner.test('original router should work without competition modules', () => {
        const container = { innerHTML: '' };
        const router = new CoffeeShopDeepRouter(container);

        expect(router.state.satisfaction).toBe(50);
        expect(router.state.resources).toBe(1000);
        expect(router.state.reputation).toBe(50);
        expect(router.state.daily_customers).toBe(50);
    });

    runner.test('original router should generate contextual options', () => {
        const container = { innerHTML: '' };
        const router = new CoffeeShopDeepRouter(container);
        router.state.turn = 1;

        const options = router.generateContextualOptions();

        expect(options.length).toBeGreaterThan(0);
        expect(options[0].label).toBeDefined();
    });

    runner.test('original router hidden system should calculate correctly', () => {
        const container = { innerHTML: '' };
        const router = new CoffeeShopDeepRouter(container);

        expect(router.hiddenSystem.staff_count).toBe(3);
        expect(router.hiddenSystem.staff_efficiency).toBe(100);
        expect(router.hiddenSystem.coordination_cost).toBe(0);
    });

    runner.test('original router social pressure should work', () => {
        const container = { innerHTML: '' };
        const router = new CoffeeShopDeepRouter(container);

        const proof = router.socialPressure.getSocialProofText(1);

        expect(proof.market_hype).toBeDefined();
        expect(proof.peer_stories).toBeDefined();
    });
});

// ============================================================================
// 测试套件3: 集成系统初始化
// ============================================================================

runner.describe('Integrated System Initialization', () => {
    runner.test('should create competition system with 4 competitors', () => {
        const marketEnv = new MarketEnvironment({ totalAddressableMarket: 1000, currentCustomers: 500 });
        const competitors = [
            new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
            new AICompetitor(PERSONALITY_TYPES.QUALITY),
            new AICompetitor(PERSONALITY_TYPES.EFFICIENT),
            new AICompetitor(PERSONALITY_TYPES.RISKY)
        ];
        const userState = {
            satisfaction: 50,
            reputation: 50,
            daily_revenue: 500,
            daily_customers: 50,
            staff_count: 3
        };

        const system = new CompetitionSystem({
            marketEnvironment: marketEnv,
            userState: userState,
            competitors: competitors
        });

        expect(system.competitors.length).toBe(4);
    });

    runner.test('should create leaderboard', () => {
        const lb = new Leaderboard();

        expect(lb.realtime).toBeDefined();
        expect(lb.historical).toBeDefined();
    });

    runner.test('should initialize router with competition system', () => {
        const container = { innerHTML: '' };
        const router = new CoffeeShopDeepRouter(container);

        expect(router.hiddenSystem).toBeDefined();
        expect(router.socialPressure).toBeDefined();
        expect(router.delayedEngine).toBeDefined();
    });
});

// ============================================================================
// 测试套件4: 完整游戏流程
// ============================================================================

runner.describe('Complete Game Flow', () => {
    runner.test('should run 6 turns without errors', () => {
        const container = { innerHTML: '' };
        const router = new CoffeeShopDeepRouter(container);
        router.state.phase = 'decision';
        router.state.turn = 1;

        for (let i = 0; i < 6; i++) {
            const options = router.generateContextualOptions();
            if (options.length > 0) {
                router.makeDecision(0);
            }

            if (router.state.phase === 'ending') {
                break;
            }

            router.advanceTurn();
        }

        expect(router.state.turn).toBeGreaterThan(0);
    });

    runner.test('should maintain original state properties after integration', () => {
        const container = { innerHTML: '' };
        const router = new CoffeeShopDeepRouter(container);

        expect(router.state.satisfaction).toBeDefined();
        expect(router.state.resources).toBeDefined();
        expect(router.state.reputation).toBeDefined();
        expect(router.state.daily_customers).toBeDefined();
        expect(router.state.turn).toBeDefined();
        expect(router.state.max_turns).toBeDefined();
        expect(router.state.phase).toBeDefined();
        expect(router.state.game_over).toBeDefined();
        expect(router.state.decision_history).toBeDefined();
    });

    runner.test('should preserve hidden system after decision', () => {
        const container = { innerHTML: '' };
        const router = new CoffeeShopDeepRouter(container);
        router.state.phase = 'decision';

        const options = router.generateContextualOptions();
        if (options.length > 0) {
            router.makeDecision(0);
        }

        expect(router.hiddenSystem).toBeDefined();
        expect(router.hiddenSystem.staff_count).toBeDefined();
        expect(router.hiddenSystem.staff_efficiency).toBeDefined();
    });
});

// ============================================================================
// 测试套件5: 竞争系统集成验证
// ============================================================================

runner.describe('Competition Integration Validation', () => {
    runner.test('competition system should affect customer flow', () => {
        const marketEnv = new MarketEnvironment({ totalAddressableMarket: 1000, currentCustomers: 500 });
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.satisfaction = 90;

        const userState = {
            satisfaction: 60,
            reputation: 50,
            daily_revenue: 800,
            daily_customers: 40,
            staff_count: 5
        };

        const system = new CompetitionSystem({
            marketEnvironment: marketEnv,
            userState: userState,
            competitors: [competitor]
        });

        const result = system.runCompetitionTurn('hire');

        expect(result.customerTransfer).toBeDefined();
        expect(result.customerTransfer.lost).toBeGreaterThan(0);
    });

    runner.test('leaderboard should update with competition results', () => {
        const lb = new Leaderboard();
        const entries = [
            { name: 'A', score: 100, isUser: false, shopName: 'A Shop', surface: { daily_revenue: 100, reputation: 80, staff_count: 5 } },
            { name: 'User', score: 50, isUser: true, shopName: 'User Shop', surface: { daily_revenue: 50, reputation: 50, staff_count: 3 } }
        ];

        lb.updateRealtime(entries);
        const table = lb.getRealtimeTable();

        expect(table.length).toBe(2);
        expect(table[0].rank).toBe(1);
    });

    runner.test('historical leaderboard should persist results', () => {
        const lb = new Leaderboard();
        lb.recordGameResult({
            playerName: 'TestPlayer',
            turnsSurvived: 5,
            finalFunds: 1000,
            finalRank: 2,
            performanceGrade: 'B',
            keyFailure: '协调成本爆炸',
            hiddenRevelation: '被张经理误导'
        });

        const history = lb.getHistory(1);
        expect(history.length).toBe(1);
        expect(history[0].playerName).toBe('TestPlayer');
    });
});

// ============================================================================
// 测试套件6: 尸检竞争分析（Phase 5 专项验证）
// ============================================================================

runner.describe('Competitive Autopsy Analysis', () => {
    runner.test('competition history should be recorded for autopsy', () => {
        const marketEnv = new MarketEnvironment({ totalAddressableMarket: 1000, currentCustomers: 500 });
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const userState = {
            satisfaction: 60,
            reputation: 50,
            daily_revenue: 800,
            daily_customers: 40,
            staff_count: 5
        };

        const system = new CompetitionSystem({
            marketEnvironment: marketEnv,
            userState: userState,
            competitors: [competitor]
        });

        for (let i = 0; i < 6; i++) {
            system.runCompetitionTurn('hire');
        }

        expect(system.competitionHistory.length).toBe(6);
    });

    runner.test('should reveal hidden state of aggressive competitor', () => {
        const marketEnv = new MarketEnvironment({ totalAddressableMarket: 1000, currentCustomers: 500 });
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const userState = {
            satisfaction: 60,
            reputation: 50,
            daily_revenue: 800,
            daily_customers: 40,
            staff_count: 5
        };

        const system = new CompetitionSystem({
            marketEnvironment: marketEnv,
            userState: userState,
            competitors: [competitor]
        });

        for (let i = 0; i < 6; i++) {
            system.runCompetitionTurn('hire');
        }

        const lastTurn = system.competitionHistory[system.competitionHistory.length - 1];
        const aggressiveAction = lastTurn.competitorActions.find(a => a.name === '张经理');

        expect(aggressiveAction).toBeDefined();
        expect(aggressiveAction.hidden.coordination_cost).toBeGreaterThan(0);
    });
});

// ============================================================================
// 测试套件7: 确定性验证
// ============================================================================

runner.describe('Deterministic Behavior', () => {
    runner.test('same inputs should produce same competition results', () => {
        const marketEnv1 = new MarketEnvironment({ totalAddressableMarket: 1000, currentCustomers: 500 });
        const competitor1 = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const userState1 = {
            satisfaction: 60,
            reputation: 50,
            daily_revenue: 800,
            daily_customers: 40,
            staff_count: 5
        };

        const marketEnv2 = new MarketEnvironment({ totalAddressableMarket: 1000, currentCustomers: 500 });
        const competitor2 = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const userState2 = {
            satisfaction: 60,
            reputation: 50,
            daily_revenue: 800,
            daily_customers: 40,
            staff_count: 5
        };

        const system1 = new CompetitionSystem({
            marketEnvironment: marketEnv1,
            userState: userState1,
            competitors: [competitor1]
        });

        const system2 = new CompetitionSystem({
            marketEnvironment: marketEnv2,
            userState: userState2,
            competitors: [competitor2]
        });

        const result1 = system1.runCompetitionTurn('hire');
        const result2 = system2.runCompetitionTurn('hire');

        expect(result1.customerTransfer.netChange).toBe(result2.customerTransfer.netChange);
        expect(result1.marketImpact.totalCompetitorCustomers).toBe(result2.marketImpact.totalCompetitorCustomers);
    });
});

// Run all tests
runner.run();
