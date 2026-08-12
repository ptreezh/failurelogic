/**
 * TDD Test Suite: Leaderboard
 *
 * Phase 4: Testing Leaderboard Module
 */

const { TestRunner, expect } = require('./test-runner.js');

const fs = require('fs');
const path = require('path');
const leaderboardPath = path.join(__dirname, '../../assets/js/leaderboard.js');
const leaderboardContent = fs.readFileSync(leaderboardPath, 'utf8');

eval(leaderboardContent);

const runner = new TestRunner();

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem(key) {
        return this.store[key] !== undefined ? this.store[key] : null;
    },
    setItem(key, value) {
        this.store[key] = value;
    },
    removeItem(key) {
        delete this.store[key];
    },
    clear() {
        this.store = {};
    }
};

global.localStorage = localStorageMock;

// Helper to clear localStorage before each test
runner.beforeEach(() => {
    localStorageMock.clear();
});

// ============================================================================
// 测试套件1: RealtimeLeaderboard 初始化
// ============================================================================

runner.describe('RealtimeLeaderboard Initialization', () => {
    runner.test('should initialize with empty rankings', () => {
        const lb = new RealtimeLeaderboard();
        expect(lb.rankings.length).toBe(0);
    });

    runner.test('should initialize with empty previous rankings', () => {
        const lb = new RealtimeLeaderboard();
        expect(lb.previousRankings.length).toBe(0);
    });

    runner.test('should initialize without user entry', () => {
        const lb = new RealtimeLeaderboard();
        expect(lb.userEntry).toBeNull();
    });
});

// ============================================================================
// 测试套件2: RealtimeLeaderboard update
// ============================================================================

runner.describe('RealtimeLeaderboard Update', () => {
    runner.test('should update rankings with entries', () => {
        const lb = new RealtimeLeaderboard();
        const entries = [
            { name: 'A', score: 100, isUser: false },
            { name: 'B', score: 80, isUser: false }
        ];

        const result = lb.update(entries);

        expect(result.length).toBe(2);
        expect(result[0].rank).toBe(1);
        expect(result[1].rank).toBe(2);
    });

    runner.test('should sort by score descending', () => {
        const lb = new RealtimeLeaderboard();
        const entries = [
            { name: 'A', score: 50, isUser: false },
            { name: 'B', score: 100, isUser: false },
            { name: 'C', score: 75, isUser: false }
        ];

        const result = lb.update(entries);

        expect(result[0].score).toBe(100);
        expect(result[1].score).toBe(75);
        expect(result[2].score).toBe(50);
    });

    runner.test('should assign color classes', () => {
        const lb = new RealtimeLeaderboard();
        const entries = [
            { name: 'A', score: 100, isUser: false },
            { name: 'B', score: 90, isUser: false },
            { name: 'C', score: 80, isUser: false },
            { name: 'D', score: 70, isUser: false },
            { name: 'User', score: 60, isUser: true }
        ];

        const result = lb.update(entries);

        expect(result[0].colorClass).toBe('rank-top');
        expect(result[1].colorClass).toBe('rank-top');
        expect(result[2].colorClass).toBe('rank-middle');
        expect(result[3].colorClass).toBe('rank-bottom');
        expect(result[4].colorClass).toBe('rank-user');
    });

    runner.test('should preserve previous rankings for trend', () => {
        const lb = new RealtimeLeaderboard();
        lb.update([
            { name: 'A', score: 100, isUser: false },
            { name: 'B', score: 80, isUser: false },
            { name: 'User', score: 50, isUser: true }
        ]);
        const result = lb.update([
            { name: 'A', score: 100, isUser: false },
            { name: 'User', score: 90, isUser: true },
            { name: 'B', score: 80, isUser: false }
        ]);

        const userEntry = result.find(e => e.isUser);
        expect(userEntry.trend).toBe(TREND_ARROWS.up);
    });
});

// ============================================================================
// 测试套件3: RealtimeLeaderboard 趋势计算
// ============================================================================

runner.describe('RealtimeLeaderboard Trend Calculation', () => {
    runner.test('should show up trend when rank improves', () => {
        const lb = new RealtimeLeaderboard();
        lb.update([
            { name: 'A', score: 100, isUser: false },
            { name: 'B', score: 80, isUser: false },
            { name: 'User', score: 50, isUser: true }
        ]);
        const result = lb.update([
            { name: 'User', score: 120, isUser: true },
            { name: 'A', score: 100, isUser: false },
            { name: 'B', score: 80, isUser: false }
        ]);

        const userEntry = result.find(e => e.isUser);
        expect(userEntry.trend).toBe(TREND_ARROWS.up);
    });

    runner.test('should show down trend when rank drops', () => {
        const lb = new RealtimeLeaderboard();
        lb.update([
            { name: 'User', score: 120, isUser: true },
            { name: 'A', score: 100, isUser: false },
            { name: 'B', score: 80, isUser: false }
        ]);
        const result = lb.update([
            { name: 'A', score: 100, isUser: false },
            { name: 'User', score: 90, isUser: true },
            { name: 'B', score: 80, isUser: false }
        ]);

        const userEntry = result.find(e => e.isUser);
        expect(userEntry.trend).toBe(TREND_ARROWS.down);
    });

    runner.test('should show same trend when rank unchanged', () => {
        const lb = new RealtimeLeaderboard();
        lb.update([
            { name: 'A', score: 100, isUser: false },
            { name: 'User', score: 80, isUser: true },
            { name: 'B', score: 50, isUser: false }
        ]);
        const result = lb.update([
            { name: 'A', score: 100, isUser: false },
            { name: 'User', score: 90, isUser: true },
            { name: 'B', score: 50, isUser: false }
        ]);

        const userEntry = result.find(e => e.isUser);
        expect(userEntry.trend).toBe(TREND_ARROWS.same);
    });

    runner.test('should show same trend on first update', () => {
        const lb = new RealtimeLeaderboard();
        lb.update([
            { name: 'A', score: 100, isUser: false },
            { name: 'User', score: 50, isUser: true }
        ]);

        const result = lb.getRankingTable();
        const userEntry = result.find(e => e.isUser);
        expect(userEntry.trend).toBe(TREND_ARROWS.same);
    });
});

// ============================================================================
// 测试套件4: RealtimeLeaderboard 用户信息
// ============================================================================

runner.describe('RealtimeLeaderboard User Info', () => {
    runner.test('should return user rank', () => {
        const lb = new RealtimeLeaderboard();
        lb.update([
            { name: 'A', score: 100, isUser: false },
            { name: 'User', score: 80, isUser: true },
            { name: 'B', score: 50, isUser: false }
        ]);

        expect(lb.getUserRank()).toBe(2);
    });

    runner.test('should return null user rank when no user', () => {
        const lb = new RealtimeLeaderboard();
        lb.update([
            { name: 'A', score: 100, isUser: false },
            { name: 'B', score: 50, isUser: false }
        ]);

        expect(lb.getUserRank()).toBeNull();
    });

    runner.test('should return top competitors', () => {
        const lb = new RealtimeLeaderboard();
        lb.update([
            { name: 'A', score: 100, isUser: false },
            { name: 'B', score: 90, isUser: false },
            { name: 'User', score: 80, isUser: true },
            { name: 'C', score: 70, isUser: false }
        ]);

        const top = lb.getTopCompetitors(2);
        expect(top.length).toBe(2);
        expect(top[0].name).toBe('A');
        expect(top[1].name).toBe('B');
    });
});

// ============================================================================
// 测试套件5: RealtimeLeaderboard 表格输出
// ============================================================================

runner.describe('RealtimeLeaderboard Table Output', () => {
    runner.test('should return ranking table', () => {
        const lb = new RealtimeLeaderboard();
        lb.update([
            { name: 'A', score: 100, isUser: false },
            { name: 'User', score: 50, isUser: true }
        ]);

        const table = lb.getRankingTable();

        expect(table.length).toBe(2);
        expect(table[0].rank).toBe(1);
        expect(table[1].rank).toBe(2);
    });

    runner.test('should include all required fields in table', () => {
        const lb = new RealtimeLeaderboard();
        lb.update([
            { name: 'A', score: 100, isUser: false, shopName: 'A Shop', surface: { daily_revenue: 100 } },
            { name: 'User', score: 50, isUser: true, shopName: 'User Shop', surface: { daily_revenue: 50 } }
        ]);

        const table = lb.getRankingTable();
        const entry = table[0];

        expect(entry.rank).toBeDefined();
        expect(entry.name).toBeDefined();
        expect(entry.shopName).toBeDefined();
        expect(entry.score).toBeDefined();
        expect(entry.trend).toBeDefined();
        expect(entry.colorClass).toBeDefined();
        expect(entry.isUser).toBeDefined();
        expect(entry.surface).toBeDefined();
    });
});

// ============================================================================
// 测试套件6: HistoricalLeaderboard 初始化
// ============================================================================

runner.describe('HistoricalLeaderboard Initialization', () => {
    runner.test('should initialize with empty history', () => {
        const hl = new HistoricalLeaderboard();
        expect(hl.history.length).toBe(0);
    });

    runner.test('should load from localStorage', () => {
        const mockData = [
            {
                date: '2026-01-01',
                playerName: 'Test',
                turnsSurvived: 5,
                finalFunds: 1000,
                finalRank: 2,
                performanceGrade: 'B',
                keyFailure: 'Test failure',
                hiddenRevelation: 'Test revelation'
            }
        ];

        localStorage.setItem('failurelogic_leaderboard', JSON.stringify(mockData));
        const hl = new HistoricalLeaderboard();

        expect(hl.history.length).toBe(1);
        expect(hl.history[0].playerName).toBe('Test');
    });
});

// ============================================================================
// 测试套件7: HistoricalLeaderboard addEntry
// ============================================================================

runner.describe('HistoricalLeaderboard addEntry', () => {
    runner.test('should add entry to history', () => {
        const hl = new HistoricalLeaderboard();
        hl.addEntry({
            playerName: 'TestPlayer',
            turnsSurvived: 5,
            finalFunds: 1000,
            finalRank: 2,
            performanceGrade: 'B',
            keyFailure: '协调成本爆炸',
            hiddenRevelation: '被张经理误导'
        });

        expect(hl.history.length).toBe(1);
    });

    runner.test('should add date automatically', () => {
        const hl = new HistoricalLeaderboard();
        hl.addEntry({
            turnsSurvived: 5,
            finalFunds: 1000,
            finalRank: 2,
            performanceGrade: 'B'
        });

        expect(hl.history[0].date).toBeDefined();
    });

    runner.test('should default player name to Anonymous', () => {
        const hl = new HistoricalLeaderboard();
        hl.addEntry({
            turnsSurvived: 5,
            finalFunds: 1000,
            finalRank: 2,
            performanceGrade: 'B'
        });

        expect(hl.history[0].playerName).toBe('Anonymous');
    });

    runner.test('should limit history to MAX_HISTORY entries', () => {
        const hl = new HistoricalLeaderboard();

        for (let i = 0; i < 60; i++) {
            hl.addEntry({
                turnsSurvived: i,
                finalFunds: 1000 - i * 100,
                finalRank: i % 5 + 1,
                performanceGrade: 'B'
            });
        }

        expect(hl.history.length).toBeLessThanOrEqual(50);
    });

    runner.test('should save to localStorage', () => {
        const hl = new HistoricalLeaderboard();
        hl.addEntry({
            playerName: 'TestPlayer',
            turnsSurvived: 5,
            finalFunds: 1000,
            finalRank: 2,
            performanceGrade: 'B'
        });

        const saved = localStorage.getItem('failurelogic_leaderboard');
        expect(saved !== null).toBe(true);
    });
});

// ============================================================================
// 测试套件8: HistoricalLeaderboard 查询
// ============================================================================

runner.describe('HistoricalLeaderboard Queries', () => {
    runner.test('should return top entries', () => {
        const hl = new HistoricalLeaderboard();

        for (let i = 0; i < 10; i++) {
            hl.addEntry({
                playerName: `Player${i}`,
                turnsSurvived: i,
                finalFunds: 1000 - i * 100,
                finalRank: i % 5 + 1,
                performanceGrade: 'B'
            });
        }

        const top = hl.getTopEntries(5);
        expect(top.length).toBe(5);
    });

    runner.test('should return best entry', () => {
        const hl = new HistoricalLeaderboard();
        hl.addEntry({
            playerName: 'Good',
            turnsSurvived: 6,
            finalFunds: 2000,
            finalRank: 1,
            performanceGrade: 'A'
        });
        hl.addEntry({
            playerName: 'Bad',
            turnsSurvived: 3,
            finalFunds: -500,
            finalRank: 5,
            performanceGrade: 'F'
        });

        const best = hl.getBestEntry();
        expect(best.playerName).toBe('Good');
    });

    runner.test('should return average rank', () => {
        const hl = new HistoricalLeaderboard();
        hl.addEntry({
            turnsSurvived: 5,
            finalFunds: 1000,
            finalRank: 2,
            performanceGrade: 'B'
        });
        hl.addEntry({
            turnsSurvived: 4,
            finalFunds: 500,
            finalRank: 3,
            performanceGrade: 'C'
        });

        const avg = hl.getAverageRank();
        expect(avg).toBeGreaterThanOrEqual(2);
        expect(avg).toBeLessThanOrEqual(3);
    });

    runner.test('should filter by grade', () => {
        const hl = new HistoricalLeaderboard();
        hl.addEntry({
            turnsSurvived: 5,
            finalFunds: 1000,
            finalRank: 2,
            performanceGrade: 'A'
        });
        hl.addEntry({
            turnsSurvived: 4,
            finalFunds: 500,
            finalRank: 3,
            performanceGrade: 'B'
        });

        const aGrades = hl.getEntriesByGrade('A');
        expect(aGrades.length).toBe(1);
        expect(aGrades[0].performanceGrade).toBe('A');
    });
});

// ============================================================================
// 测试套件9: HistoricalLeaderboard clear
// ============================================================================

runner.describe('HistoricalLeaderboard Clear', () => {
    runner.test('should clear all history', () => {
        const hl = new HistoricalLeaderboard();
        hl.addEntry({
            turnsSurvived: 5,
            finalFunds: 1000,
            finalRank: 2,
            performanceGrade: 'B'
        });

        hl.clear();

        expect(hl.history.length).toBe(0);
    });

    runner.test('should clear localStorage', () => {
        const hl = new HistoricalLeaderboard();
        hl.addEntry({
            turnsSurvived: 5,
            finalFunds: 1000,
            finalRank: 2,
            performanceGrade: 'B'
        });

        hl.clear();

        const saved = localStorage.getItem('failurelogic_leaderboard');
        expect(saved).toBe('[]');
    });
});

// ============================================================================
// 测试套件10: Leaderboard 集成
// ============================================================================

runner.describe('Leaderboard Integration', () => {
    runner.test('should combine realtime and historical', () => {
        const lb = new Leaderboard();
        lb.updateRealtime([
            { name: 'A', score: 100, isUser: false },
            { name: 'User', score: 50, isUser: true }
        ]);
        lb.recordGameResult({
            playerName: 'Test',
            turnsSurvived: 5,
            finalFunds: 1000,
            finalRank: 2,
            performanceGrade: 'B',
            keyFailure: 'Test',
            hiddenRevelation: 'Test'
        });

        expect(lb.getUserRank()).toBe(2);
        expect(lb.getHistory().length).toBe(1);
    });

    runner.test('should provide complete ranking table', () => {
        const lb = new Leaderboard();
        lb.updateRealtime([
            { name: 'A', score: 100, isUser: false },
            { name: 'User', score: 50, isUser: true }
        ]);

        const table = lb.getRealtimeTable();
        expect(table.length).toBe(2);
        expect(table[0].rank).toBe(1);
    });
});

// Run all tests
runner.run();
