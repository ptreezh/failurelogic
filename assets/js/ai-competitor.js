/**
 * AICompetitor Module
 * AI竞争对手模块
 *
 * 包含：4个AI对手、各自隐藏状态、deterministic决策逻辑、表面行为
 */

(function(global) {
    'use strict';

    const PERSONALITY_TYPES = {
        AGGRESSIVE: 'aggressive',
        QUALITY: 'quality',
        EFFICIENT: 'efficient',
        RISKY: 'risky'
    };

    const PERSONALITY_CONFIGS = {
        [PERSONALITY_TYPES.AGGRESSIVE]: {
            name: '张经理',
            shopName: '街角咖啡',
            initialStaff: 3,
            strategy: 'aggressive',
            traits: {
                hireThreshold: 400,
                expandThreshold: 800,
                marketingThreshold: 300,
                optimizeThreshold: 85
            }
        },
        [PERSONALITY_TYPES.QUALITY]: {
            name: '李老板',
            shopName: '大学咖啡',
            initialStaff: 3,
            strategy: 'quality',
            traits: {
                hireThreshold: 500,
                expandThreshold: 1000,
                marketingThreshold: 200,
                optimizeThreshold: 70
            }
        },
        [PERSONALITY_TYPES.EFFICIENT]: {
            name: '王店长',
            shopName: '写字楼咖啡',
            initialStaff: 4,
            strategy: 'efficient',
            traits: {
                hireThreshold: 500,
                expandThreshold: 800,
                marketingThreshold: 300,
                optimizeThreshold: 60
            }
        },
        [PERSONALITY_TYPES.RISKY]: {
            name: '赵总',
            shopName: '新进入者',
            initialStaff: 5,
            strategy: 'risky',
            traits: {
                hireThreshold: 400,
                expandThreshold: 600,
                marketingThreshold: 300,
                optimizeThreshold: 90
            }
        }
    };

    class HiddenState {
        constructor(initialStaff) {
            this.staff_count = initialStaff;
            this.staff_efficiency = 100;
            this.coordination_cost = 0;
            this.quality_index = 80;
            this.customer_lifetime_value = 100;
            this.reputation = 65;
            this.funds = 1500;
            this.satisfaction = 55;
            this.daily_revenue = 600;
            this.daily_customers = 50;
        }

        calculateStaffEfficiency() {
            if (this.staff_count <= 3) return 100;
            return Math.round(100 / (1 + 0.18 * Math.pow(this.staff_count - 3, 1.8)));
        }

        calculateCoordinationCost() {
            if (this.staff_count <= 3) return 0;
            return Math.round(0.35 * Math.pow(this.staff_count - 3, 2.3));
        }

        calculateQualityIndex() {
            const efficiency = this.calculateStaffEfficiency();
            const coordination = this.calculateCoordinationCost();
            return Math.round(80 * (efficiency / 100) * (1 - coordination / 250));
        }

        calculateCustomerLifetimeValue(satisfaction) {
            if (satisfaction >= 80) return 100;
            if (satisfaction >= 60) return 80;
            if (satisfaction >= 40) return 40;
            if (satisfaction >= 20) return 15;
            return 5;
        }

        update(decision) {
            let operatingCost = 0;

            switch (decision) {
                case 'hire':
                    this.staff_count += 1;
                    operatingCost = 300;
                    break;
                case 'expand':
                    this.staff_count += 2;
                    operatingCost = 600;
                    break;
                case 'marketing':
                    operatingCost = 200;
                    this.reputation = Math.min(100, this.reputation + 5);
                    this.daily_customers += 10;
                    break;
                case 'optimize':
                    operatingCost = 150;
                    this.staff_efficiency = Math.min(100, this.staff_efficiency + 5);
                    this.quality_index = Math.min(100, this.quality_index + 3);
                    break;
                case 'wait':
                    operatingCost = 0;
                    break;
            }

            this.funds -= operatingCost;
            this.coordination_cost = this.calculateCoordinationCost();
            this.staff_efficiency = this.calculateStaffEfficiency();
            this.quality_index = this.calculateQualityIndex();
            this.customer_lifetime_value = this.calculateCustomerLifetimeValue(this.satisfaction);
            this.daily_revenue = Math.round(this.daily_customers * (this.quality_index / 100) * 25);
            this.funds += this.daily_revenue;
        }
    }

    class AICompetitor {
        constructor(personalityType) {
            const config = PERSONALITY_CONFIGS[personalityType];
            this.personality = personalityType;
            this.name = config.name;
            this.shopName = config.shopName;
            this.strategy = config.strategy;
            this.traits = config.traits;

            this.hiddenState = new HiddenState(config.initialStaff);
            this.decisionHistory = [];
            this.isBankrupt = false;
            this.turn = 0;
        }

        makeDecision(marketConditions) {
            if (this.isBankrupt) return 'wait';

            const state = this.hiddenState;
            const traits = this.traits;
            let decision = 'wait';

            switch (this.strategy) {
                case 'aggressive':
                    decision = this.aggressiveStrategy(state, traits);
                    break;
                case 'quality':
                    decision = this.qualityStrategy(state, traits);
                    break;
                case 'efficient':
                    decision = this.efficientStrategy(state, traits);
                    break;
                case 'risky':
                    decision = this.riskyStrategy(state, traits);
                    break;
            }

            this.turn++;
            this.decisionHistory.push({
                turn: this.turn,
                decision: decision,
                funds: state.funds,
                staff_count: state.staff_count,
                efficiency: state.staff_efficiency,
                quality: state.quality_index
            });

            return decision;
        }

        aggressiveStrategy(state, traits) {
            if (state.funds > traits.expandThreshold && state.staff_count < 10) {
                return 'expand';
            }
            if (state.funds > traits.hireThreshold && state.staff_count < 8) {
                return 'hire';
            }
            if (state.funds > traits.marketingThreshold) {
                return 'marketing';
            }
            return 'wait';
        }

        qualityStrategy(state, traits) {
            if (state.quality_index < traits.optimizeThreshold && state.funds > 200) {
                return 'optimize';
            }
            if (state.staff_count < 5 && state.funds > traits.hireThreshold) {
                return 'hire';
            }
            if (state.funds > traits.marketingThreshold) {
                return 'marketing';
            }
            return 'wait';
        }

        efficientStrategy(state, traits) {
            if (state.staff_efficiency < traits.optimizeThreshold && state.funds > 200) {
                return 'optimize';
            }
            if (state.staff_count < 7 && state.funds > traits.hireThreshold) {
                return 'hire';
            }
            if (state.funds > traits.marketingThreshold) {
                return 'marketing';
            }
            return 'wait';
        }

        riskyStrategy(state, traits) {
            if (state.funds > traits.expandThreshold && state.staff_count < 12) {
                return 'expand';
            }
            if (state.funds > traits.hireThreshold && state.staff_count < 10) {
                return 'hire';
            }
            if (state.funds > traits.marketingThreshold) {
                return 'marketing';
            }
            return 'wait';
        }

        getSurfaceInfo() {
            return {
                name: this.name,
                shopName: this.shopName,
                staff_count: this.hiddenState.staff_count,
                daily_revenue: this.hiddenState.daily_revenue,
                reputation: this.hiddenState.reputation,
                lastDecision: this.decisionHistory.length > 0
                    ? this.decisionHistory[this.decisionHistory.length - 1].decision
                    : 'wait'
            };
        }

        getHiddenInfo() {
            return {
                staff_efficiency: this.hiddenState.staff_efficiency,
                coordination_cost: this.hiddenState.coordination_cost,
                quality_index: this.hiddenState.quality_index,
                customer_lifetime_value: this.hiddenState.customer_lifetime_value,
                satisfaction: this.hiddenState.satisfaction,
                funds: this.hiddenState.funds
            };
        }

        executeTurn(marketConditions) {
            const decision = this.makeDecision(marketConditions);
            this.hiddenState.update(decision);

            if (this.hiddenState.funds < -500) {
                this.isBankrupt = true;
            }

            return {
                decision: decision,
                surface: this.getSurfaceInfo(),
                hidden: this.getHiddenInfo(),
                isBankrupt: this.isBankrupt
            };
        }
    }

    global.AICompetitor = AICompetitor;
    global.PERSONALITY_TYPES = PERSONALITY_TYPES;
    global.PERSONALITY_CONFIGS = PERSONALITY_CONFIGS;

})(typeof window !== 'undefined' ? window : global);
