/**
 * TDD Test Suite: MarketEnvironment
 *
 * Phase 1: RED - Write failing test cases
 * Testing Market Environment Module
 */

const { TestRunner, expect } = require('./test-runner.js');

// 导入模块
const fs = require('fs');
const path = require('path');
const marketEnvPath = path.join(__dirname, '../../assets/js/market-environment.js');
const marketEnvContent = fs.readFileSync(marketEnvPath, 'utf8');

// 提取整个模块内容
eval(`
    ${marketEnvContent}
`);

const runner = new TestRunner();

// ============================================================================
// 测试套件1: TotalAddressableMarket (TAM)
// ============================================================================

runner.describe('TotalAddressableMarket', () => {
    let market;

    runner.beforeEach(() => {
        market = new MarketEnvironment({
            totalAddressableMarket: 1000,
            quarterlyGrowthRate: 0.05
        });
    });

    runner.test('should initialize with default TAM of 1000', () => {
        expect(market.tam).toBe(1000);
        expect(market.maxTAM).toBeGreaterThan(1000);
        expect(market.currentCustomers).toBe(500);
    });

    runner.test('should apply market growth each quarter', () => {
        const initialTAM = market.tam;
        market.simulateQuarter();
        expect(market.tam).toBeGreaterThan(initialTAM);
    });

    runner.test('should apply saturation slowdown when approaching max', () => {
        market.tam = 950;
        market.maxTAM = 1000;
        market.simulateQuarter();
        const growth = market.tam - 950;
        expect(growth).toBeLessThan(50);
    });

    runner.test('should not exceed maxTAM', () => {
        market.tam = 990;
        market.maxTAM = 1000;
        for (let i = 0; i < 100; i++) {
            market.simulateQuarter();
        }
        expect(market.tam).toBeLessThanOrEqual(1000);
    });
});

// ============================================================================
// 测试套件2: CustomerSegment
// ============================================================================

runner.describe('CustomerSegment', () => {
    runner.test('should create three default segments', () => {
        const market = new MarketEnvironment();
        expect(market.segments.length).toBeGreaterThanOrEqual(3);
    });

    runner.test('should have correct segment types', () => {
        const market = new MarketEnvironment();
        const types = market.segments.map(s => s.type);
        expect(types).toContain('price_sensitive');
        expect(types).toContain('quality_sensitive');
        expect(types).toContain('convenience_sensitive');
    });

    runner.test('each segment should have required properties', () => {
        const market = new MarketEnvironment();
        market.segments.forEach(segment => {
            expect(segment.size).toBeDefined();
            expect(segment.preferenceWeights).toBeDefined();
            expect(segment.satisfactionThreshold).toBeDefined();
            expect(segment.loyaltyDecay).toBeDefined();
        });
    });

    runner.test('total segment size should not exceed TAM', () => {
        const market = new MarketEnvironment();
        const totalSize = market.segments.reduce((sum, s) => sum + s.size, 0);
        expect(totalSize).toBeLessThanOrEqual(market.tam);
    });
});

// ============================================================================
// 测试套件3: CustomerTransferModel
// ============================================================================

runner.describe('CustomerTransferModel', () => {
    let market;

    runner.beforeEach(() => {
        market = new MarketEnvironment();
    });

    runner.test('should calculate transfer probability based on satisfaction', () => {
        const highSat = market.calculateTransferProbability({
            satisfaction: 90,
            competitorSatisfaction: 60
        });
        const lowSat = market.calculateTransferProbability({
            satisfaction: 30,
            competitorSatisfaction: 60
        });
        expect(lowSat).toBeGreaterThan(highSat);
    });

    runner.test('should calculate transfer probability based on price', () => {
        const highPrice = market.calculateTransferProbability({
            satisfaction: 70,
            price: 100,
            competitorPrice: 80
        });
        const lowPrice = market.calculateTransferProbability({
            satisfaction: 70,
            price: 80,
            competitorPrice: 100
        });
        expect(highPrice).toBeGreaterThan(lowPrice);
    });

    runner.test('should calculate transfer probability based on word of mouth', () => {
        const goodWOM = market.calculateTransferProbability({
            satisfaction: 80,
            wordOfMouth: 0.8
        });
        const badWOM = market.calculateTransferProbability({
            satisfaction: 80,
            wordOfMouth: 0.2
        });
        expect(badWOM).toBeGreaterThan(goodWOM);
    });

    runner.test('should have measurable coefficients', () => {
        expect(market.transferCoefficients).toBeDefined();
        expect(market.transferCoefficients.satisfactionWeight).toBeDefined();
        expect(market.transferCoefficients.priceWeight).toBeDefined();
        expect(market.transferCoefficients.wordOfMouthWeight).toBeDefined();
    });

    runner.test('transfer should have delay (not immediate)', () => {
        const result = market.simulateTransfer({
            satisfaction: 30,
            competitorSatisfaction: 80
        });
        expect(result.immediateTransfer).toBe(0);
        expect(result.delayedTransfer).toBeGreaterThan(0);
    });
});

// ============================================================================
// 测试套件4: WordOfMouth
// ============================================================================

runner.describe('WordOfMouth', () => {
    let market;

    runner.beforeEach(() => {
        market = new MarketEnvironment();
    });

    runner.test('should bring new customers when satisfaction > 80', () => {
        market.averageSatisfaction = 85;
        const effect = market.calculateWordOfMouthEffect();
        expect(effect.newCustomers).toBeGreaterThan(0);
    });

    runner.test('should lose customers when satisfaction < 50', () => {
        market.averageSatisfaction = 40;
        const effect = market.calculateWordOfMouthEffect();
        expect(effect.lostCustomers).toBeGreaterThan(0);
    });

    runner.test('should have neutral effect at 50-80 satisfaction', () => {
        market.averageSatisfaction = 65;
        const effect = market.calculateWordOfMouthEffect();
        expect(Math.abs(effect.netEffect)).toBeLessThan(0.5);
    });

    runner.test('should apply network effect multiplier', () => {
        market.averageSatisfaction = 85;
        market.marketShare = 0.3;
        const effect1 = market.calculateWordOfMouthEffect();
        market.marketShare = 0.7;
        const effect2 = market.calculateWordOfMouthEffect();
        expect(effect2.newCustomers).toBeGreaterThan(effect1.newCustomers);
    });
});

// ============================================================================
// 测试套件5: MarketSaturation
// ============================================================================

runner.describe('MarketSaturation', () => {
    let market;

    runner.beforeEach(() => {
        market = new MarketEnvironment({
            totalAddressableMarket: 1000,
            currentCustomers: 500
        });
    });

    runner.test('should have normal growth below 70% market share', () => {
        market.currentCustomers = 500;
        market.marketShare = 0.5;
        const growth = market.calculateGrowthPotential();
        expect(growth).toBeGreaterThan(0);
    });

    runner.test('should have doubled cost above 70% market share', () => {
        market.currentCustomers = 720;
        market.marketShare = 0.72;
        const growth1 = market.calculateGrowthPotential();

        market.currentCustomers = 750;
        market.marketShare = 0.75;
        const growth2 = market.calculateGrowthPotential();

        expect(growth2).toBeLessThan(growth1);
    });

    runner.test('should have marginal decay effect', () => {
        market.currentCustomers = 800;
        market.marketShare = 0.8;
        const growth = market.calculateGrowthPotential();
        expect(growth).toBeLessThan(50);
    });
});

// ============================================================================
// 测试套件6: 100回合稳定性测试
// ============================================================================

runner.describe('Stability Simulation', () => {
    runner.test('should keep customer pool stable after 100 rounds', () => {
        const market = new MarketEnvironment({
            totalAddressableMarket: 1000,
            quarterlyGrowthRate: 0.02
        });

        market.currentCustomers = 500;
        for (let i = 0; i < 100; i++) {
            market.simulateQuarter();
        }

        expect(market.currentCustomers).toBeGreaterThanOrEqual(900);
        expect(market.currentCustomers).toBeLessThanOrEqual(1100);
    });

    runner.test('should be deterministic', () => {
        const market1 = new MarketEnvironment({
            totalAddressableMarket: 1000,
            currentCustomers: 500
        });

        const market2 = new MarketEnvironment({
            totalAddressableMarket: 1000,
            currentCustomers: 500
        });

        for (let i = 0; i < 50; i++) {
            market1.simulateQuarter();
            market2.simulateQuarter();
        }

        expect(market1.currentCustomers).toBe(market2.currentCustomers);
        expect(market1.tam).toBe(market2.tam);
    });

    runner.test('satisfaction drop should cause customer loss', () => {
        const market = new MarketEnvironment({
            totalAddressableMarket: 1000,
            currentCustomers: 500
        });

        market.averageSatisfaction = 0;
        const initialCustomers = market.currentCustomers;
        market.simulateQuarter();

        expect(market.currentCustomers).toBeLessThan(initialCustomers);
    });

    runner.test('satisfaction increase should cause customer gain', () => {
        const market = new MarketEnvironment({
            totalAddressableMarket: 1000,
            currentCustomers: 500
        });

        market.averageSatisfaction = 90;
        const initialCustomers = market.currentCustomers;
        market.simulateQuarter();

        expect(market.currentCustomers).toBeGreaterThan(initialCustomers);
    });
});

// ============================================================================
// 测试套件7: 完整季度模拟
// ============================================================================

runner.describe('Quarterly Simulation', () => {
    runner.test('should return simulation results', () => {
        const market = new MarketEnvironment();
        const result = market.simulateQuarter();
        expect(result).toBeDefined();
        expect(result.customers).toBeDefined();
        expect(result.tam).toBeDefined();
        expect(result.satisfaction).toBeDefined();
    });

    runner.test('should update all segments proportionally', () => {
        const market = new MarketEnvironment();
        const totalBefore = market.segments.reduce((sum, s) => sum + s.size, 0);
        market.simulateQuarter();
        const totalAfter = market.segments.reduce((sum, s) => sum + s.size, 0);
        expect(Math.abs(totalAfter - totalBefore)).toBeLessThan(100);
    });
});

// 运行测试
console.log('🧪 MarketEnvironment Unit Tests');
console.log('==============================');

(async () => {
    await runner.run();
})();
