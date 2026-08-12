/**
 * TDD Test Suite: CompetitionSystem
 *
 * Phase 3: Testing Competition System Module
 */

const { TestRunner, expect } = require('./test-runner.js');

const fs = require('fs');
const path = require('path');

const marketEnvPath = path.join(__dirname, '../../assets/js/market-environment.js');
const aiCompetitorPath = path.join(__dirname, '../../assets/js/ai-competitor.js');
const competitionSystemPath = path.join(__dirname, '../../assets/js/competition-system.js');

const marketEnvContent = fs.readFileSync(marketEnvPath, 'utf8');
const aiCompetitorContent = fs.readFileSync(aiCompetitorPath, 'utf8');
const competitionSystemContent = fs.readFileSync(competitionSystemPath, 'utf8');

eval(marketEnvContent);
eval(aiCompetitorContent);
eval(competitionSystemContent);

const runner = new TestRunner();

// ============================================================================
// 测试套件1: CompetitionSystem 初始化
// ============================================================================

runner.describe('CompetitionSystem Initialization', () => {
    runner.test('should initialize with competitors', () => {
        const competitors = [
            new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
            new AICompetitor(PERSONALITY_TYPES.QUALITY)
        ];
        const system = new CompetitionSystem({ competitors });
        expect(system.competitors.length).toBe(2);
    });

    runner.test('should initialize with market environment', () => {
        const market = new MarketEnvironment();
        const system = new CompetitionSystem({ marketEnvironment: market });
        expect(system.marketEnvironment !== null).toBe(true);
    });

    runner.test('should initialize with user state', () => {
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ userState });
        expect(system.userState).toEqual(userState);
    });

    runner.test('should start at turn 0', () => {
        const system = new CompetitionSystem({});
        expect(system.turn).toBe(0);
    });
});

// ============================================================================
// 测试套件2: runCompetitionTurn
// ============================================================================

runner.describe('runCompetitionTurn', () => {
    runner.test('should increment turn counter', () => {
        const competitors = [new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE)];
        const system = new CompetitionSystem({ competitors });

        system.runCompetitionTurn('hire');
        expect(system.turn).toBe(1);

        system.runCompetitionTurn('expand');
        expect(system.turn).toBe(2);
    });

    runner.test('should execute all competitors', () => {
        const competitors = [
            new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
            new AICompetitor(PERSONALITY_TYPES.QUALITY),
            new AICompetitor(PERSONALITY_TYPES.EFFICIENT),
            new AICompetitor(PERSONALITY_TYPES.RISKY)
        ];
        const system = new CompetitionSystem({ competitors });

        const result = system.runCompetitionTurn('hire');

        expect(result.competitorActions.length).toBe(4);
    });

    runner.test('should record competitor actions', () => {
        const competitors = [new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE)];
        const system = new CompetitionSystem({ competitors });

        const result = system.runCompetitionTurn('expand');

        expect(result.competitorActions[0].name).toBe('张经理');
        expect(result.competitorActions[0].decision).toBeDefined();
        expect(result.competitorActions[0].surface).toBeDefined();
    });

    runner.test('should remove bankrupt competitors', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.funds = -2000;
        competitor.hiddenState.daily_customers = 0;
        competitor.hiddenState.quality_index = 0;

        const system = new CompetitionSystem({ competitors: [competitor] });
        const result = system.runCompetitionTurn('wait');

        expect(system.competitors.length).toBe(0);
    });

    runner.test('should calculate market impact when user state provided', () => {
        const competitors = [new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE)];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors, userState });

        const result = system.runCompetitionTurn('hire');

        expect(result.marketImpact).toBeDefined();
        expect(result.marketImpact.totalCompetitorCustomers).toBeGreaterThan(0);
    });

    runner.test('should generate intelligence when user state provided', () => {
        const competitors = [new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE)];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors, userState });

        const result = system.runCompetitionTurn('hire');

        expect(result.intelligence).toBeDefined();
        expect(result.intelligence.competitorRankings).toBeDefined();
    });
});

// ============================================================================
// 测试套件3: calculateMarketImpact
// ============================================================================

runner.describe('calculateMarketImpact', () => {
    runner.test('should calculate market pressure based on competitor customers', () => {
        const competitors = [new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE)];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const market = new MarketEnvironment({ totalAddressableMarket: 1000 });
        const system = new CompetitionSystem({
            competitors,
            userState,
            marketEnvironment: market
        });

        const result = system.runCompetitionTurn('hire');

        expect(result.marketImpact.marketPressure).toBeGreaterThanOrEqual(0);
        expect(result.marketImpact.marketPressure).toBeLessThanOrEqual(100);
    });

    runner.test('should calculate user market share', () => {
        const competitors = [new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE)];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const market = new MarketEnvironment({ totalAddressableMarket: 1000 });
        const system = new CompetitionSystem({
            competitors,
            userState,
            marketEnvironment: market
        });

        const result = system.runCompetitionTurn('hire');

        expect(result.marketImpact.userMarketShare).toBeGreaterThanOrEqual(0);
        expect(result.marketImpact.userMarketShare).toBeLessThanOrEqual(100);
    });

    runner.test('should count active competitors', () => {
        const competitors = [
            new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
            new AICompetitor(PERSONALITY_TYPES.QUALITY)
        ];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors, userState });

        const result = system.runCompetitionTurn('hire');

        expect(result.marketImpact.competitorCount).toBe(2);
    });
});

// ============================================================================
// 测试套件4: calculateCustomerTransfer
// ============================================================================

runner.describe('calculateCustomerTransfer', () => {
    runner.test('should calculate customer loss when competitor satisfaction is higher', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.satisfaction = 90;

        const userState = {
            satisfaction: 60,
            reputation: 50,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };

        const system = new CompetitionSystem({
            competitors: [competitor],
            userState
        });

        const result = system.runCompetitionTurn('hire');

        expect(result.customerTransfer.lost).toBeGreaterThan(0);
    });

    runner.test('should calculate customer gain when user quality is higher', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.quality_index = 50;
        competitor.hiddenState.satisfaction = 50;

        const userState = {
            satisfaction: 80,
            reputation: 70,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };

        const system = new CompetitionSystem({
            competitors: [competitor],
            userState
        });

        const result = system.runCompetitionTurn('marketing');

        expect(result.customerTransfer.gained).toBeGreaterThan(0);
    });

    runner.test('should calculate net change correctly', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.satisfaction = 90;

        const userState = {
            satisfaction: 60,
            reputation: 50,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };

        const system = new CompetitionSystem({
            competitors: [competitor],
            userState
        });

        const result = system.runCompetitionTurn('hire');

        expect(result.customerTransfer.netChange).toBe(
            result.customerTransfer.gained - result.customerTransfer.lost
        );
    });

    runner.test('should include transfer reasons', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.satisfaction = 90;

        const userState = {
            satisfaction: 60,
            reputation: 50,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };

        const system = new CompetitionSystem({
            competitors: [competitor],
            userState
        });

        const result = system.runCompetitionTurn('hire');

        expect(result.customerTransfer.reasons.length).toBeGreaterThan(0);
    });
});

// ============================================================================
// 测试套件5: generateIntelligence
// ============================================================================

runner.describe('generateIntelligence', () => {
    runner.test('should generate competitor rankings', () => {
        const competitors = [
            new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
            new AICompetitor(PERSONALITY_TYPES.QUALITY)
        ];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors, userState });

        system.runCompetitionTurn('hire');
        const intelligence = system.generateIntelligence();

        expect(intelligence.competitorRankings.length).toBe(2);
    });

    runner.test('should rank competitors by score', () => {
        const competitors = [
            new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
            new AICompetitor(PERSONALITY_TYPES.QUALITY)
        ];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors, userState });

        system.runCompetitionTurn('hire');
        const intelligence = system.generateIntelligence();

        for (let i = 0; i < intelligence.competitorRankings.length - 1; i++) {
            expect(intelligence.competitorRankings[i].score)
                .toBeGreaterThanOrEqual(intelligence.competitorRankings[i + 1].score);
        }
    });

    runner.test('should include user rank', () => {
        const competitors = [
            new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
            new AICompetitor(PERSONALITY_TYPES.QUALITY)
        ];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors, userState });

        system.runCompetitionTurn('hire');
        const intelligence = system.generateIntelligence();

        expect(intelligence.userRank).toBeDefined();
        expect(intelligence.userRank).toBeGreaterThan(0);
    });

    runner.test('should not include user rank without user state', () => {
        const competitors = [new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE)];
        const system = new CompetitionSystem({ competitors });

        system.runCompetitionTurn('hire');
        const intelligence = system.generateIntelligence();

        expect(intelligence.userRank).toBeUndefined();
    });

    runner.test('should generate market trends', () => {
        const competitors = [new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE)];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors, userState });

        system.runCompetitionTurn('hire');
        const intelligence = system.generateIntelligence();

        expect(intelligence.marketTrends).toBeDefined();
        expect(Array.isArray(intelligence.marketTrends)).toBe(true);
    });
});

// ============================================================================
// 测试套件6: getRankingTable
// ============================================================================

runner.describe('getRankingTable', () => {
    runner.test('should include user in ranking', () => {
        const competitors = [new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE)];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors, userState });

        const table = system.getRankingTable();

        expect(table.length).toBe(2);
        expect(table.some(entry => entry.isUser)).toBe(true);
    });

    runner.test('should rank by score descending', () => {
        const competitors = [
            new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
            new AICompetitor(PERSONALITY_TYPES.QUALITY)
        ];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors, userState });

        const table = system.getRankingTable();

        for (let i = 0; i < table.length - 1; i++) {
            expect(table[i].score).toBeGreaterThanOrEqual(table[i + 1].score);
        }
    });

    runner.test('should return empty array without user state', () => {
        const competitors = [new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE)];
        const system = new CompetitionSystem({ competitors });

        const table = system.getRankingTable();

        expect(table.length).toBe(0);
    });
});

// ============================================================================
// 测试套件7: 竞争隔离实验（Phase 3 专项验证）
// ============================================================================

runner.describe('Competitive Isolation Experiment', () => {
    runner.test('competition should affect user customer flow', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const userState = {
            satisfaction: 60,
            reputation: 50,
            daily_revenue: 800,
            daily_customers: 40,
            staff_count: 5
        };

        const systemWithComp = new CompetitionSystem({
            competitors: [competitor],
            userState: { ...userState }
        });

        const systemWithoutComp = new CompetitionSystem({
            userState: { ...userState }
        });

        const resultWith = systemWithComp.runCompetitionTurn('hire');
        const resultWithout = systemWithoutComp.runCompetitionTurn('hire');

        expect(resultWith.customerTransfer).toBeDefined();
        expect(resultWithout.customerTransfer).toBeDefined();
        expect(resultWith.customerTransfer.lost + resultWith.customerTransfer.gained)
            .toBeGreaterThanOrEqual(resultWithout.customerTransfer.lost + resultWithout.customerTransfer.gained);
    });

    runner.test('stronger competitors should create more market pressure', () => {
        const weakCompetitor = new AICompetitor(PERSONALITY_TYPES.QUALITY);
        const strongCompetitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);

        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };

        const weakSystem = new CompetitionSystem({
            competitors: [weakCompetitor],
            userState
        });

        const strongSystem = new CompetitionSystem({
            competitors: [strongCompetitor],
            userState
        });

        const weakResult = weakSystem.runCompetitionTurn('hire');
        const strongResult = strongSystem.runCompetitionTurn('hire');

        expect(strongResult.marketImpact.marketPressure)
            .toBeGreaterThanOrEqual(weakResult.marketImpact.marketPressure);
    });
});

// ============================================================================
// 测试套件8: 尸检竞争分析专项测试
// ============================================================================

runner.describe('Competitive Autopsy Analysis', () => {
    runner.test('should record competition history for autopsy', () => {
        const competitors = [new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE)];
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors, userState });

        for (let i = 0; i < 6; i++) {
            system.runCompetitionTurn('hire');
        }

        expect(system.competitionHistory.length).toBe(6);
    });

    runner.test('should track competitor behavior over time', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors: [competitor], userState });

        for (let i = 0; i < 4; i++) {
            system.runCompetitionTurn('hire');
        }

        const lastTurn = system.competitionHistory[system.competitionHistory.length - 1];
        const aggressiveAction = lastTurn.competitorActions.find(a => a.name === '张经理');

        expect(aggressiveAction).toBeDefined();
        expect(aggressiveAction.surface.staff_count).toBeGreaterThan(3);
    });

    runner.test('should reveal hidden state of bankrupt competitors', () => {
        const competitor = new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE);
        competitor.hiddenState.funds = -2000;
        competitor.hiddenState.daily_customers = 0;
        competitor.hiddenState.quality_index = 0;

        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };
        const system = new CompetitionSystem({ competitors: [competitor], userState });

        const result = system.runCompetitionTurn('wait');

        expect(result.competitorActions[0].isBankrupt).toBe(true);
        expect(system.competitors.length).toBe(0);
    });
});

// ============================================================================
// 测试套件9: Deterministic 验证
// ============================================================================

runner.describe('Deterministic Behavior', () => {
    runner.test('same inputs should produce same results', () => {
        const competitors1 = [
            new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
            new AICompetitor(PERSONALITY_TYPES.QUALITY)
        ];
        const competitors2 = [
            new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
            new AICompetitor(PERSONALITY_TYPES.QUALITY)
        ];

        const userState = {
            satisfaction: 70,
            reputation: 60,
            daily_revenue: 1000,
            daily_customers: 50,
            staff_count: 5
        };

        const system1 = new CompetitionSystem({
            competitors: competitors1,
            userState: { ...userState }
        });
        const system2 = new CompetitionSystem({
            competitors: competitors2,
            userState: { ...userState }
        });

        const result1 = system1.runCompetitionTurn('hire');
        const result2 = system2.runCompetitionTurn('hire');

        expect(result1.marketImpact.totalCompetitorCustomers)
            .toBe(result2.marketImpact.totalCompetitorCustomers);
        expect(result1.customerTransfer.netChange)
            .toBe(result2.customerTransfer.netChange);
    });
});

// Run all tests
runner.run();
