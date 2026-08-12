/**
 * CompetitionSystem Module
 * 竞争系统模块
 *
 * 包含：竞争协调器、客户转移、市场份额计算、市场情报生成
 */

(function(global) {
    'use strict';

    const TRANSFER_COEFFICIENTS = {
        satisfactionWeight: 0.5,
        reputationWeight: 0.3,
        qualityWeight: 0.2
    };

    const COMPETITOR_IMPACT_WEIGHTS = {
        staffCount: 0.4,
        reputation: 0.35,
        dailyRevenue: 0.25
    };

    class CompetitionSystem {
        constructor(config = {}) {
            this.competitors = config.competitors || [];
            this.marketEnvironment = config.marketEnvironment || null;
            this.userState = config.userState || null;
            this.turn = 0;
            this.competitionHistory = [];
        }

        runCompetitionTurn(userDecision) {
            this.turn++;
            const results = {
                turn: this.turn,
                competitorActions: [],
                marketImpact: {},
                intelligence: {},
                customerTransfer: {}
            };

            const totalCompetitorCustomers = this.competitors.reduce((sum, c) => {
                return sum + c.hiddenState.daily_customers;
            }, 0);

            this.competitors.forEach(competitor => {
                const turnResult = competitor.executeTurn({});
                results.competitorActions.push({
                    name: competitor.name,
                    shopName: competitor.shopName,
                    decision: turnResult.decision,
                    surface: turnResult.surface,
                    hidden: turnResult.hidden,
                    isBankrupt: turnResult.isBankrupt
                });

                if (turnResult.isBankrupt) {
                    this.competitors = this.competitors.filter(c => c !== competitor);
                }
            });

            if (this.userState) {
                results.marketImpact = this.calculateMarketImpact(totalCompetitorCustomers);
                results.customerTransfer = this.calculateCustomerTransfer(userDecision);
                results.intelligence = this.generateIntelligence();
            }

            this.competitionHistory.push(results);
            return results;
        }

        calculateMarketImpact(totalCompetitorCustomers) {
            const marketCapacity = this.marketEnvironment ? this.marketEnvironment.tam : 1000;
            const userCustomers = this.userState.daily_customers || 50;
            const totalCustomers = userCustomers + totalCompetitorCustomers;

            const marketPressure = Math.min(100, Math.max(0,
                (totalCompetitorCustomers / marketCapacity) * 100
            ));

            const saturationEffect = totalCustomers > marketCapacity * 0.8
                ? (totalCustomers - marketCapacity * 0.8) / (marketCapacity * 0.2)
                : 0;

            return {
                totalCompetitorCustomers: totalCompetitorCustomers,
                marketPressure: Math.round(marketPressure),
                saturationEffect: Math.round(saturationEffect * 100),
                userMarketShare: totalCustomers > 0
                    ? Math.round((userCustomers / totalCustomers) * 100)
                    : 0,
                competitorCount: this.competitors.length
            };
        }

        calculateCustomerTransfer(userDecision) {
            const transfer = {
                gained: 0,
                lost: 0,
                netChange: 0,
                reasons: []
            };

            if (!this.userState) return transfer;

            const userSatisfaction = this.userState.satisfaction || 50;
            const userReputation = this.userState.reputation || 50;

            this.competitors.forEach(competitor => {
                const compSurface = competitor.getSurfaceInfo();
                const compHidden = competitor.getHiddenInfo();

                if (compHidden.satisfaction > userSatisfaction + 15) {
                    const loss = Math.round(
                        TRANSFER_COEFFICIENTS.satisfactionWeight *
                        (compHidden.satisfaction - userSatisfaction) / 100 *
                        5
                    );
                    transfer.lost += loss;
                    transfer.reasons.push(
                        `${competitor.name}的满意度(${compHidden.satisfaction})高于你，流失${loss}个客户`
                    );
                }

                if (compHidden.reputation > userReputation + 10) {
                    const loss = Math.round(
                        TRANSFER_COEFFICIENTS.reputationWeight *
                        (compHidden.reputation - userReputation) / 100 *
                        3
                    );
                    transfer.lost += loss;
                    transfer.reasons.push(
                        `${competitor.name}的口碑(${compHidden.reputation})更高，流失${loss}个客户`
                    );
                }

                if (userDecision === 'marketing' && compHidden.quality_index < userSatisfaction) {
                    const gained = Math.round(
                        TRANSFER_COEFFICIENTS.qualityWeight *
                        (userSatisfaction - compHidden.quality_index) / 100 *
                        8
                    );
                    transfer.gained += gained;
                    transfer.reasons.push(
                        `你的服务质量优于${competitor.name}，吸引${gained}个客户`
                    );
                }
            });

            transfer.netChange = transfer.gained - transfer.lost;
            return transfer;
        }

        generateIntelligence() {
            const intelligence = {
                competitorRankings: [],
                marketTrends: [],
                threats: [],
                opportunities: []
            };

            const rankedCompetitors = this.competitors
                .map(c => ({
                    name: c.name,
                    shopName: c.shopName,
                    score: this.calculateCompetitorScore(c),
                    surface: c.getSurfaceInfo()
                }))
                .sort((a, b) => b.score - a.score);

            intelligence.competitorRankings = rankedCompetitors.map((c, index) => ({
                rank: index + 1,
                name: c.name,
                shopName: c.shopName,
                score: c.score,
                surface: c.surface
            }));

            if (this.userState) {
                const userScore = this.calculateUserScore();
                const userRank = intelligence.competitorRankings.filter(
                    c => c.score > userScore
                ).length + 1;

                intelligence.userRank = userRank;
                intelligence.totalCompetitors = intelligence.competitorRankings.length + 1;
                intelligence.userScore = userScore;
            }

            intelligence.marketTrends = this.generateMarketTrends();
            intelligence.threats = this.identifyThreats();
            intelligence.opportunities = this.identifyOpportunities();

            return intelligence;
        }

        calculateCompetitorScore(competitor) {
            const surface = competitor.getSurfaceInfo();
            const hidden = competitor.getHiddenInfo();

            const revenueScore = Math.min(100, surface.daily_revenue / 50);
            const reputationScore = surface.reputation;
            const efficiencyScore = hidden.staff_efficiency;
            const qualityScore = hidden.quality_index;

            return Math.round(
                COMPETITOR_IMPACT_WEIGHTS.staffCount * revenueScore +
                COMPETITOR_IMPACT_WEIGHTS.reputation * reputationScore +
                COMPETITOR_IMPACT_WEIGHTS.dailyRevenue * ((efficiencyScore + qualityScore) / 2)
            );
        }

        calculateUserScore() {
            if (!this.userState) return 0;

            const revenueScore = Math.min(100, (this.userState.daily_revenue || 0) / 50);
            const reputationScore = this.userState.reputation || 0;
            const satisfactionScore = this.userState.satisfaction || 0;

            return Math.round(
                revenueScore * 0.4 +
                reputationScore * 0.3 +
                satisfactionScore * 0.3
            );
        }

        generateMarketTrends() {
            const trends = [];

            if (this.competitionHistory.length >= 2) {
                const lastTurn = this.competitionHistory[this.competitionHistory.length - 1];
                const prevTurn = this.competitionHistory[this.competitionHistory.length - 2];

                const currentPressure = lastTurn.marketImpact.marketPressure || 0;
                const prevPressure = prevTurn.marketImpact.marketPressure || 0;

                if (currentPressure > prevPressure + 10) {
                    trends.push({
                        type: 'warning',
                        message: '市场竞争压力急剧上升，多家店铺正在扩张'
                    });
                } else if (currentPressure > 70) {
                    trends.push({
                        type: 'alert',
                        message: '市场已高度饱和，新进入者面临巨大压力'
                    });
                }
            }

            const aggressiveCount = this.competitors.filter(
                c => c.strategy === 'aggressive' && !c.isBankrupt
            ).length;

            if (aggressiveCount >= 2) {
                trends.push({
                    type: 'trend',
                    message: `${aggressiveCount}家竞争对手正在激进扩张，市场将很快饱和`
                });
            }

            return trends;
        }

        identifyThreats() {
            const threats = [];

            this.competitors.forEach(competitor => {
                const hidden = competitor.getHiddenInfo();

                if (hidden.reputation > (this.userState?.reputation || 0) + 15) {
                    threats.push({
                        competitor: competitor.name,
                        type: 'reputation',
                        message: `${competitor.name}的口碑显著高于你，正在吸引你的客户`
                    });
                }

                if (hidden.quality_index > (this.userState?.satisfaction || 0) + 10) {
                    threats.push({
                        competitor: competitor.name,
                        type: 'quality',
                        message: `${competitor.name}的服务质量更高，你的客户正在流失`
                    });
                }

                if (competitor.hiddenState.daily_customers > (this.userState?.daily_customers || 50) * 1.5) {
                    threats.push({
                        competitor: competitor.name,
                        type: 'scale',
                        message: `${competitor.name}的客流量已超过你的${Math.round(competitor.hiddenState.daily_customers / (this.userState?.daily_customers || 50) * 100)}%`
                    });
                }
            });

            return threats;
        }

        identifyOpportunities() {
            const opportunities = [];

            this.competitors.forEach(competitor => {
                const hidden = competitor.getHiddenInfo();

                if (competitor.isBankrupt) {
                    opportunities.push({
                        type: 'acquisition',
                        message: `${competitor.name}已破产，可收购其客户资源`
                    });
                }

                if (hidden.coordination_cost > 50 && hidden.staff_count > 8) {
                    opportunities.push({
                        type: 'differentiation',
                        message: `${competitor.name}因规模过大导致服务质量下降，你可以主打精品路线`
                    });
                }
            });

            return opportunities;
        }

        getRankingTable() {
            if (!this.userState) return [];

            const userScore = this.calculateUserScore();
            const userEntry = {
                name: '你的咖啡店',
                shopName: '你的咖啡店',
                score: userScore,
                isUser: true,
                surface: {
                    daily_revenue: this.userState.daily_revenue || 0,
                    reputation: this.userState.reputation || 0,
                    staff_count: this.userState.staff_count || 3
                }
            };

            const competitorEntries = this.competitors.map(c => ({
                name: c.name,
                shopName: c.shopName,
                score: this.calculateCompetitorScore(c),
                isUser: false,
                surface: c.getSurfaceInfo()
            }));

            const allEntries = [userEntry, ...competitorEntries];
            allEntries.sort((a, b) => b.score - a.score);

            return allEntries.map((entry, index) => ({
                rank: index + 1,
                name: entry.name,
                shopName: entry.shopName,
                score: entry.score,
                isUser: entry.isUser,
                surface: entry.surface
            }));
        }
    }

    global.CompetitionSystem = CompetitionSystem;
    global.TRANSFER_COEFFICIENTS = TRANSFER_COEFFICIENTS;
    global.COMPETITOR_IMPACT_WEIGHTS = COMPETITOR_IMPACT_WEIGHTS;

})(typeof window !== 'undefined' ? window : global);
