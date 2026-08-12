/**
 * Leaderboard Module
 * 排行榜模块
 *
 * 包含：实时排行榜、历史最佳成绩、localStorage持久化
 */

(function(global) {
    'use strict';

    const STORAGE_KEY = 'failurelogic_leaderboard';
    const MAX_HISTORY = 50;

    const RANK_COLORS = {
        top: 'rank-top',
        middle: 'rank-middle',
        bottom: 'rank-bottom',
        user: 'rank-user'
    };

    const TREND_ARROWS = {
        up: '↑',
        down: '↓',
        same: '→'
    };

    class RealtimeLeaderboard {
        constructor() {
            this.rankings = [];
            this.previousRankings = [];
            this.userEntry = null;
        }

        update(entries) {
            this.previousRankings = [...this.rankings];
            const sortedEntries = [...entries].sort((a, b) => b.score - a.score);
            this.rankings = sortedEntries.map((entry, index) => ({
                ...entry,
                rank: index + 1,
                trend: this.calculateTrend(entry.name, index + 1),
                colorClass: this.getColorClass(index, sortedEntries.length, entry.isUser)
            }));
            return this.rankings;
        }

        calculateTrend(name, newRank) {
            if (!this.previousRankings.length) return TREND_ARROWS.same;

            const previousEntry = this.previousRankings.find(e => e.name === name);
            if (!previousEntry) return TREND_ARROWS.same;

            if (newRank < previousEntry.rank) return TREND_ARROWS.up;
            if (newRank > previousEntry.rank) return TREND_ARROWS.down;
            return TREND_ARROWS.same;
        }

        getColorClass(index, total, isUser) {
            if (isUser) return RANK_COLORS.user;

            if (total <= 2) return RANK_COLORS.top;
            if (index < 2) return RANK_COLORS.top;
            if (index >= total - 2) return RANK_COLORS.bottom;
            return RANK_COLORS.middle;
        }

        getUserRank() {
            const user = this.rankings.find(e => e.isUser);
            return user ? user.rank : null;
        }

        getUserTrend() {
            const user = this.rankings.find(e => e.isUser);
            return user ? user.trend : TREND_ARROWS.same;
        }

        getTopCompetitors(count = 3) {
            return this.rankings
                .filter(e => !e.isUser)
                .slice(0, count);
        }

        getRankingTable() {
            return this.rankings.map(entry => ({
                rank: entry.rank,
                name: entry.name,
                shopName: entry.shopName,
                score: entry.score,
                trend: entry.trend,
                colorClass: entry.colorClass,
                isUser: entry.isUser,
                surface: entry.surface
            }));
        }
    }

    class HistoricalLeaderboard {
        constructor() {
            this.history = this.load();
        }

        load() {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                return data ? JSON.parse(data) : [];
            } catch (e) {
                return [];
            }
        }

        save() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
            } catch (e) {
            }
        }

        addEntry(entry) {
            const record = {
                date: new Date().toISOString(),
                playerName: entry.playerName || 'Anonymous',
                turnsSurvived: entry.turnsSurvived || 0,
                finalFunds: entry.finalFunds || 0,
                finalRank: entry.finalRank || 0,
                performanceGrade: entry.performanceGrade || 'N/A',
                keyFailure: entry.keyFailure || 'Unknown',
                hiddenRevelation: entry.hiddenRevelation || ''
            };

            this.history.unshift(record);

            if (this.history.length > MAX_HISTORY) {
                this.history = this.history.slice(0, MAX_HISTORY);
            }

            this.save();
            return record;
        }

        getTopEntries(count = 10) {
            return this.history.slice(0, count);
        }

        getEntriesByGrade(grade) {
            return this.history.filter(entry => entry.performanceGrade === grade);
        }

        getAverageRank() {
            if (this.history.length === 0) return 0;
            const sum = this.history.reduce((acc, entry) => acc + entry.finalRank, 0);
            return Math.round(sum / this.history.length);
        }

        getBestEntry() {
            if (this.history.length === 0) return null;
            return this.history.reduce((best, entry) => {
                if (!best) return entry;
                if (entry.finalRank < best.finalRank) return entry;
                if (entry.finalRank === best.finalRank && entry.finalFunds > best.finalFunds) return entry;
                return best;
            }, null);
        }

        clear() {
            this.history = [];
            this.save();
        }
    }

    class Leaderboard {
        constructor() {
            this.realtime = new RealtimeLeaderboard();
            this.historical = new HistoricalLeaderboard();
        }

        updateRealtime(entries) {
            return this.realtime.update(entries);
        }

        getRealtimeTable() {
            return this.realtime.getRankingTable();
        }

        getUserRank() {
            return this.realtime.getUserRank();
        }

        getUserTrend() {
            return this.realtime.getUserTrend();
        }

        getTopCompetitors(count = 3) {
            return this.realtime.getTopCompetitors(count);
        }

        recordGameResult(result) {
            return this.historical.addEntry(result);
        }

        getHistory(count = 10) {
            return this.historical.getTopEntries(count);
        }

        getBestEntry() {
            return this.historical.getBestEntry();
        }

        getAverageRank() {
            return this.historical.getAverageRank();
        }

        clearHistory() {
            this.historical.clear();
        }
    }

    global.Leaderboard = Leaderboard;
    global.RealtimeLeaderboard = RealtimeLeaderboard;
    global.HistoricalLeaderboard = HistoricalLeaderboard;
    global.RANK_COLORS = RANK_COLORS;
    global.TREND_ARROWS = TREND_ARROWS;

})(typeof window !== 'undefined' ? window : global);
