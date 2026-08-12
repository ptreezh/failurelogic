/**
 * TDD Test Suite: AICompetitor
 *
 * Phase 2: Testing AI Competitor Module
 */

const { TestRunner, expect } = require('./test-runner.js');

const fs = require('fs');
const path = require('path');
const aiCompetitorPath = path.join(__dirname, '../../assets/js/ai-competitor.js');
const aiCompetitorContent = fs.readFileSync(aiCompetitorPath, 'utf8');

eval(aiCompetitorContent);

const runner = new TestRunner();

// ============================================================================
// 测试套件1: AICompetitor 初始化
// ============================================================================

runner.describe('AICompetitor Initialization', () => {
    runner.test('should create aggressive competitor with correct name', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        expect(competitor.name).toBe('张经理');
        expect(competitor.shopName).toBe('街角咖啡');
    });

    runner.test('should create quality competitor with correct name', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.QUALITY);
        expect(competitor.name).toBe('李老板');
        expect(competitor.shopName).toBe('大学咖啡');
    });

    runner.test('should create efficient competitor with correct name', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.EFFICIENT);
        expect(competitor.name).toBe('王店长');
        expect(competitor.shopName).toBe('写字楼咖啡');
    });

    runner.test('should create risky competitor with correct name', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.RISKY);
        expect(competitor.name).toBe('赵总');
        expect(competitor.shopName).toBe('新进入者');
    });

    runner.test('should initialize with correct initial staff', () => {
        const aggressive = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        expect(aggressive.hiddenState.staff_count).toBe(3);

        const efficient = new AICompetitor(PERSONALITY_TYPES.EFFICIENT);
        expect(efficient.hiddenState.staff_count).toBe(4);

        const risky = new AICompetitor(PERSONALITY_TYPES.RISKY);
        expect(risky.hiddenState.staff_count).toBe(5);
    });

    runner.test('should have initial funds of 1500', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        expect(competitor.hiddenState.funds).toBe(1500);
    });
});

// ============================================================================
// 测试套件2: 隐藏状态计算
// ============================================================================

runner.describe('HiddenState Calculations', () => {
    runner.test('staff efficiency should be 100 for 3 or fewer staff', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        expect(competitor.hiddenState.staff_efficiency).toBe(100);
    });

    runner.test('staff efficiency should decrease non-linearly after 3 staff', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.staff_count = 5;
        const efficiency = competitor.hiddenState.calculateStaffEfficiency();
        expect(efficiency).toBeLessThan(100);
        expect(efficiency).toBeGreaterThan(50);
    });

    runner.test('coordination cost should be 0 for 3 or fewer staff', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        expect(competitor.hiddenState.coordination_cost).toBe(0);
    });

    runner.test('coordination cost should increase non-linearly after 3 staff', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.staff_count = 6;
        const cost = competitor.hiddenState.calculateCoordinationCost();
        expect(cost).toBeGreaterThan(0);
    });

    runner.test('quality index should decrease with coordination cost', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.staff_count = 8;
        const quality = competitor.hiddenState.calculateQualityIndex();
        expect(quality).toBeLessThan(80);
    });

    runner.test('customer lifetime value should decrease with low satisfaction', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        expect(competitor.hiddenState.calculateCustomerLifetimeValue(90)).toBe(100);
        expect(competitor.hiddenState.calculateCustomerLifetimeValue(50)).toBe(40);
        expect(competitor.hiddenState.calculateCustomerLifetimeValue(20)).toBe(15);
    });
});

// ============================================================================
// 测试套件3: 决策逻辑
// ============================================================================

runner.describe('Decision Logic', () => {
    runner.test('aggressive competitor should expand when funds > 800 and staff < 10', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.funds = 1000;
        competitor.hiddenState.staff_count = 3;

        const decision = competitor.makeDecision({});
        expect(decision).toBe('expand');
    });

    runner.test('aggressive competitor should hire when funds > 400 and staff < 8', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.funds = 500;
        competitor.hiddenState.staff_count = 3;

        const decision = competitor.makeDecision({});
        expect(decision).toBe('hire');
    });

    runner.test('quality competitor should optimize when quality < 70', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.QUALITY);
        competitor.hiddenState.quality_index = 60;
        competitor.hiddenState.funds = 300;

        const decision = competitor.makeDecision({});
        expect(decision).toBe('optimize');
    });

    runner.test('quality competitor should not expand easily', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.QUALITY);
        competitor.hiddenState.funds = 1000;
        competitor.hiddenState.staff_count = 3;

        const decision = competitor.makeDecision({});
        expect(decision).not.toBe('expand');
    });

    runner.test('efficient competitor should optimize when efficiency < 60', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.EFFICIENT);
        competitor.hiddenState.staff_efficiency = 50;
        competitor.hiddenState.funds = 300;

        const decision = competitor.makeDecision({});
        expect(decision).toBe('optimize');
    });

    runner.test('risky competitor should expand aggressively', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.RISKY);
        competitor.hiddenState.funds = 800;
        competitor.hiddenState.staff_count = 5;

        const decision = competitor.makeDecision({});
        expect(decision).toBe('expand');
    });

    runner.test('bankrupt competitor should always wait', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.isBankrupt = true;

        const decision = competitor.makeDecision({});
        expect(decision).toBe('wait');
    });
});

// ============================================================================
// 测试套件4: 状态更新
// ============================================================================

runner.describe('State Updates', () => {
    runner.test('hire should increase staff by 1', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const initialStaff = competitor.hiddenState.staff_count;

        competitor.hiddenState.update('hire');

        expect(competitor.hiddenState.staff_count).toBe(initialStaff + 1);
    });

    runner.test('expand should increase staff by 2', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const initialStaff = competitor.hiddenState.staff_count;

        competitor.hiddenState.update('expand');

        expect(competitor.hiddenState.staff_count).toBe(initialStaff + 2);
    });

    runner.test('marketing should increase reputation by 5 and customers by 10', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const initialReputation = competitor.hiddenState.reputation;
        const initialCustomers = competitor.hiddenState.daily_customers;

        competitor.hiddenState.update('marketing');

        expect(competitor.hiddenState.reputation).toBe(initialReputation + 5);
        expect(competitor.hiddenState.daily_customers).toBe(initialCustomers + 10);
    });

    runner.test('optimize should improve efficiency and quality when not at max', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.staff_efficiency = 90;
        competitor.hiddenState.quality_index = 70;

        competitor.hiddenState.update('optimize');

        expect(competitor.hiddenState.staff_efficiency).toBeGreaterThan(90);
        expect(competitor.hiddenState.quality_index).toBeGreaterThan(70);
    });

    runner.test('daily revenue should be calculated based on quality', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.quality_index = 80;
        competitor.hiddenState.daily_customers = 50;
        competitor.hiddenState.update('wait');

        expect(competitor.hiddenState.daily_revenue).toBeGreaterThan(0);
    });
});

// ============================================================================
// 测试套件5: 表面/隐藏信息隔离
// ============================================================================

runner.describe('Information Isolation', () => {
    runner.test('surface info should not include hidden metrics', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const surface = competitor.getSurfaceInfo();
        const keys = Object.keys(surface);

        expect(keys).not.toContain('staff_efficiency');
        expect(keys).not.toContain('coordination_cost');
        expect(keys).not.toContain('quality_index');
        expect(keys).not.toContain('customer_lifetime_value');
        expect(keys).not.toContain('satisfaction');
    });

    runner.test('surface info should include visible metrics', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const surface = competitor.getSurfaceInfo();

        expect(surface.name).toBeDefined();
        expect(surface.shopName).toBeDefined();
        expect(surface.staff_count).toBeDefined();
        expect(surface.daily_revenue).toBeDefined();
        expect(surface.reputation).toBeDefined();
        expect(surface.lastDecision).toBeDefined();
    });

    runner.test('hidden info should include all hidden metrics', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const hidden = competitor.getHiddenInfo();

        expect(hidden.staff_efficiency).toBeDefined();
        expect(hidden.coordination_cost).toBeDefined();
        expect(hidden.quality_index).toBeDefined();
        expect(hidden.customer_lifetime_value).toBeDefined();
        expect(hidden.satisfaction).toBeDefined();
        expect(hidden.funds).toBeDefined();
    });
});

// ============================================================================
// 测试套件6: 破产检测
// ============================================================================

runner.describe('Bankruptcy Detection', () => {
    runner.test('should mark as bankrupt when funds < -500', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.funds = -2000;
        competitor.hiddenState.daily_customers = 0;
        competitor.hiddenState.quality_index = 0;

        const result = competitor.executeTurn({});

        expect(competitor.isBankrupt).toBe(true);
    });

    runner.test('should not be bankrupt with positive funds', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.funds = 100;

        const result = competitor.executeTurn({});

        expect(competitor.isBankrupt).toBe(false);
    });
});

// ============================================================================
// 测试套件7: 多回合行为验证
// ============================================================================

runner.describe('Multi-Turn Behavior Validation', () => {
    runner.test('aggressive competitor should have coordination cost > 20 by turn 8', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const marketConditions = {};

        for (let i = 0; i < 8; i++) {
            competitor.executeTurn(marketConditions);
        }

        expect(competitor.hiddenState.coordination_cost).toBeGreaterThan(20);
    });

    runner.test('quality competitor should maintain efficiency > 80', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.QUALITY);
        const marketConditions = {};

        for (let i = 0; i < 10; i++) {
            competitor.executeTurn(marketConditions);
        }

        expect(competitor.hiddenState.staff_efficiency).toBeGreaterThan(80);
    });

    runner.test('efficient competitor should have positive profit after 10 turns', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.EFFICIENT);
        const marketConditions = {};

        for (let i = 0; i < 10; i++) {
            competitor.executeTurn(marketConditions);
        }

        expect(competitor.hiddenState.funds).toBeGreaterThan(1500);
    });

    runner.test('risky competitor should expand to large staff size', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.RISKY);
        const marketConditions = {};

        for (let i = 0; i < 10; i++) {
            competitor.executeTurn(marketConditions);
        }

        expect(competitor.hiddenState.staff_count).toBeGreaterThan(8);
    });
});

// ============================================================================
// 测试套件8: Deterministic 验证
// ============================================================================

runner.describe('Deterministic Behavior', () => {
    runner.test('same state should produce same decisions', () => {
        const competitor1 = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const competitor2 = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);

        competitor1.hiddenState.funds = 1000;
        competitor1.hiddenState.staff_count = 3;

        competitor2.hiddenState.funds = 1000;
        competitor2.hiddenState.staff_count = 3;

        const decision1 = competitor1.makeDecision({});
        const decision2 = competitor2.makeDecision({});

        expect(decision1).toBe(decision2);
    });

    runner.test('different turns should potentially produce different decisions', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.funds = 1000;
        competitor.hiddenState.staff_count = 3;

        const decision1 = competitor.makeDecision({});
        const decision2 = competitor.makeDecision({});

        expect(typeof decision1).toBe('string');
        expect(typeof decision2).toBe('string');
    });
});

// Run all tests
runner.run();
