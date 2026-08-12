/**
 * 高级博弈场景数学模型
 * Advanced Game Theory Mathematical Model
 * 
 * 包含：纳什均衡计算、支付矩阵、多方博弈、认知偏差博弈
 * 
 * 来源：Soul Auto-Evolution 循环9
 * 创建时间：2026-03-13
 */

(function(global) {
    'use strict';

    // ============================================
    // 支付矩阵类
    // ============================================
    class PayoffMatrix {
        /**
         * 创建支付矩阵
         * @param {Array} players - 玩家列表 ['Player1', 'Player2']
         * @param {Object} strategies - 各玩家的策略 { Player1: ['A', 'B'], Player2: ['C', 'D'] }
         * @param {Object} payoffs - 支付值 { 'A,C': [3, 2], ... }
         */
        constructor(players, strategies, payoffs) {
            this.players = players;
            this.strategies = strategies;
            this.payoffs = payoffs;
            this.matrix = this.buildMatrix();
        }

        buildMatrix() {
            const matrix = {};
            for (const [key, values] of Object.entries(this.payoffs)) {
                matrix[key] = values;
            }
            return matrix;
        }

        /**
         * 获取特定策略组合的支付值
         */
        getPayoff(strategyCombo) {
            return this.payoffs[strategyCombo] || null;
        }

        /**
         * 获取玩家在给定其他玩家策略时的最佳回应
         */
        getBestResponse(player, othersStrategy) {
            const playerIndex = this.players.indexOf(player);
            const playerStrategies = this.strategies[player];
            let bestPayoff = -Infinity;
            let bestStrategy = null;

            for (const strategy of playerStrategies) {
                const combo = this.buildCombo(player, strategy, othersStrategy);
                const payoff = this.getPayoff(combo);
                if (payoff && payoff[playerIndex] > bestPayoff) {
                    bestPayoff = payoff[playerIndex];
                    bestStrategy = strategy;
                }
            }

            return { strategy: bestStrategy, payoff: bestPayoff };
        }

        buildCombo(player, strategy, othersStrategy) {
            const parts = [];
            for (const p of this.players) {
                if (p === player) {
                    parts.push(strategy);
                } else {
                    parts.push(othersStrategy[p] || '?');
                }
            }
            return parts.join(',');
        }
    }

    // ============================================
    // 纳什均衡求解器
    // ============================================
    class NashEquilibriumSolver {
        constructor(payoffMatrix) {
            this.payoffMatrix = payoffMatrix;
        }

        /**
         * 寻找纯策略纳什均衡
         */
        findPureNashEquilibria() {
            const equilibria = [];
            const players = this.payoffMatrix.players;
            const strategies = this.payoffMatrix.strategies;

            // 生成所有策略组合
            const allCombos = this.generateAllCombos(players, strategies);

            for (const combo of allCombos) {
                if (this.isNashEquilibrium(combo)) {
                    equilibria.push({
                        strategies: combo,
                        payoffs: this.payoffMatrix.getPayoff(combo.join(','))
                    });
                }
            }

            return equilibria;
        }

        /**
         * 检查是否为纳什均衡
         */
        isNashEquilibrium(combo) {
            const players = this.payoffMatrix.players;

            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                const currentPayoff = this.payoffMatrix.getPayoff(combo.join(','))[i];

                // 检查玩家是否有动机偏离
                const playerStrategies = this.payoffMatrix.strategies[player];
                for (const altStrategy of playerStrategies) {
                    if (altStrategy === combo[i]) continue;

                    const altCombo = [...combo];
                    altCombo[i] = altStrategy;
                    const altPayoff = this.payoffMatrix.getPayoff(altCombo.join(','));

                    if (altPayoff && altPayoff[i] > currentPayoff) {
                        return false; // 有动机偏离，不是纳什均衡
                    }
                }
            }

            return true;
        }

        /**
         * 生成所有策略组合
         */
        generateAllCombos(players, strategies) {
            if (players.length === 0) return [[]];

            const firstPlayer = players[0];
            const restPlayers = players.slice(1);
            const firstStrategies = strategies[firstPlayer];

            const combos = [];
            for (const strategy of firstStrategies) {
                const restCombos = this.generateAllCombos(restPlayers, strategies);
                for (const restCombo of restCombos) {
                    combos.push([strategy, ...restCombo]);
                }
            }

            return combos;
        }

        /**
         * 寻找混合策略纳什均衡 (2x2博弈)
         */
        findMixedNashEquilibrium() {
            // 简化版本：只处理2x2博弈
            const players = this.payoffMatrix.players;
            if (players.length !== 2) {
                return { error: '混合策略均衡计算仅支持2人博弈' };
            }

            const s1 = this.payoffMatrix.strategies[players[0]];
            const s2 = this.payoffMatrix.strategies[players[1]];

            if (s1.length !== 2 || s2.length !== 2) {
                return { error: '混合策略均衡计算仅支持2x2博弈' };
            }

            // 计算混合策略
            // P1选择策略A的概率：p = (b2 - b1) / (a1 - a2 + b2 - b1)
            // 其中a1, a2是P2选择策略C时P1选择A,B的支付
            // b1, b2是P2选择策略D时P1选择A,B的支付

            const payoff1 = this.payoffMatrix.getPayoff(`${s1[0]},${s2[0]}`);
            const payoff2 = this.payoffMatrix.getPayoff(`${s1[1]},${s2[0]}`);
            const payoff3 = this.payoffMatrix.getPayoff(`${s1[0]},${s2[1]}`);
            const payoff4 = this.payoffMatrix.getPayoff(`${s1[1]},${s2[1]}`);

            if (!payoff1 || !payoff2 || !payoff3 || !payoff4) {
                return { error: '支付矩阵不完整' };
            }

            const a1 = payoff1[0], a2 = payoff2[0];
            const b1 = payoff3[0], b2 = payoff4[0];

            const c1 = payoff1[1], c2 = payoff3[1];
            const d1 = payoff2[1], d2 = payoff4[1];

            // P1选择第一个策略的概率
            const p = (b2 - a2) / (a1 - a2 + b2 - b1);
            // P2选择第一个策略的概率
            const q = (d2 - c2) / (c1 - c2 + d2 - d1);

            if (isNaN(p) || isNaN(q) || p < 0 || p > 1 || q < 0 || q > 1) {
                return { error: '不存在有效的混合策略均衡' };
            }

            return {
                player1: { player: players[0], strategy: s1[0], probability: p },
                player2: { player: players[1], strategy: s2[0], probability: q },
                expectedPayoffs: {
                    player1: p * q * a1 + p * (1 - q) * b1 + (1 - p) * q * a2 + (1 - p) * (1 - q) * b2,
                    player2: p * q * c1 + p * (1 - q) * c2 + (1 - p) * q * d1 + (1 - p) * (1 - q) * d2
                }
            };
        }
    }

    // ============================================
    // 博弈场景模拟器
    // ============================================
    class GameScenarioSimulator {
        constructor() {
            this.games = {};
            this.currentGame = null;
            this.history = [];
        }

        /**
         * 注册博弈场景
         */
        registerGame(id, config) {
            this.games[id] = {
                id,
                config,
                payoffMatrix: new PayoffMatrix(
                    config.players,
                    config.strategies,
                    config.payoffs
                ),
                solver: null
            };
            this.games[id].solver = new NashEquilibriumSolver(this.games[id].payoffMatrix);
        }

        /**
         * 加载博弈场景
         */
        loadGame(id) {
            if (!this.games[id]) {
                throw new Error(`博弈场景 ${id} 不存在`);
            }
            this.currentGame = this.games[id];
            return this.currentGame;
        }

        /**
         * 分析当前博弈
         */
        analyzeCurrentGame() {
            if (!this.currentGame) {
                throw new Error('未加载博弈场景');
            }

            const pureEquilibria = this.currentGame.solver.findPureNashEquilibria();
            const mixedEquilibrium = this.currentGame.solver.findMixedNashEquilibrium();

            return {
                gameId: this.currentGame.id,
                pureNashEquilibria: pureEquilibria,
                mixedNashEquilibrium: mixedEquilibrium,
                insights: this.generateInsights(pureEquilibria, mixedEquilibrium)
            };
        }

        /**
         * 生成博弈洞察
         */
        generateInsights(pureEquilibria, mixedEquilibrium) {
            const insights = [];

            if (pureEquilibria.length === 0) {
                insights.push({
                    type: 'no_pure_equilibrium',
                    message: '此博弈不存在纯策略纳什均衡，玩家需要混合策略'
                });
            } else if (pureEquilibria.length === 1) {
                insights.push({
                    type: 'unique_equilibrium',
                    message: '存在唯一的纳什均衡，结果可预测'
                });
            } else {
                insights.push({
                    type: 'multiple_equilibria',
                    message: '存在多个纳什均衡，需要协调机制'
                });
            }

            if (!mixedEquilibrium.error) {
                insights.push({
                    type: 'mixed_strategy',
                    message: `混合策略均衡：玩家需要随机化选择策略`
                });
            }

            return insights;
        }

        /**
         * 模拟博弈对局
         */
        simulateRound(playerStrategies) {
            if (!this.currentGame) {
                throw new Error('未加载博弈场景');
            }

            const combo = playerStrategies.join(',');
            const payoffs = this.currentGame.payoffMatrix.getPayoff(combo);

            // 检查是否为纳什均衡
            const isEquilibrium = this.currentGame.solver.isNashEquilibrium(playerStrategies);

            const result = {
                strategies: playerStrategies,
                payoffs,
                isNashEquilibrium: isEquilibrium,
                timestamp: Date.now()
            };

            this.history.push(result);
            return result;
        }
    }

    // ============================================
    // 认知偏差博弈场景
    // ============================================
    const CognitiveBiasGames = {
        /**
         * 囚徒困境 - 合作vs背叛
         */
        prisonersDilemma: {
            id: 'prisoners-dilemma',
            name: '囚徒困境',
            description: '经典博弈论场景，测试合作与背叛的决策',
            players: ['Alice', 'Bob'],
            strategies: {
                Alice: ['合作', '背叛'],
                Bob: ['合作', '背叛']
            },
            payoffs: {
                '合作,合作': [3, 3],   // 双方合作：中等收益
                '合作,背叛': [0, 5],   // 被背叛：最低收益
                '背叛,合作': [5, 0],   // 背叛合作者：最高收益
                '背叛,背叛': [1, 1]    // 双方背叛：低收益
            },
            cognitiveBias: {
                type: 'short_term_thinking',
                lesson: '个人理性导致集体非理性',
                awakeningMessage: '如果你选择背叛，虽然短期获益，但破坏了信任基础。多次博弈中，合作才是最优策略。'
            }
        },

        /**
         * 公共物品博弈 - 搭便车问题
         */
        publicGoods: {
            id: 'public-goods',
            name: '公共物品博弈',
            description: '测试搭便车行为与社会困境',
            players: ['Player1', 'Player2', 'Player3'],
            strategies: {
                Player1: ['贡献', '不贡献'],
                Player2: ['贡献', '不贡献'],
                Player3: ['贡献', '不贡献']
            },
            payoffs: {
                // 简化的支付：贡献者付出2，公共池翻倍后平分
                '贡献,贡献,贡献': [4, 4, 4],
                '贡献,贡献,不贡献': [3, 3, 5],
                '贡献,不贡献,贡献': [3, 5, 3],
                '不贡献,贡献,贡献': [5, 3, 3],
                '贡献,不贡献,不贡献': [2, 4, 4],
                '不贡献,贡献,不贡献': [4, 2, 4],
                '不贡献,不贡献,贡献': [4, 4, 2],
                '不贡献,不贡献,不贡献': [0, 0, 0]
            },
            cognitiveBias: {
                type: 'free_rider_problem',
                lesson: '个体理性与集体利益的冲突',
                awakeningMessage: '每个人都想搭便车，结果公共物品无法维持。理解这个困境，才能做出更好的决策。'
            }
        },

        /**
         * 投资竞赛博弈 - 确认偏误版本
         */
        investmentRace: {
            id: 'investment-race',
            name: '投资竞赛',
            description: '测试确认偏误对投资决策的影响',
            players: ['投资者A', '投资者B'],
            strategies: {
                '投资者A': ['买入', '观望', '卖出'],
                '投资者B': ['买入', '观望', '卖出']
            },
            payoffs: {
                // 市场上涨时的支付
                '买入,买入': [3, 3],
                '买入,观望': [5, 0],
                '买入,卖出': [5, -2],
                '观望,买入': [0, 5],
                '观望,观望': [0, 0],
                '观望,卖出': [0, -3],
                '卖出,买入': [-2, 5],
                '卖出,观望': [-3, 0],
                '卖出,卖出': [-5, -5]
            },
            cognitiveBias: {
                type: 'confirmation_bias',
                lesson: '确认偏误导致过度自信',
                awakeningMessage: '你只关注了支持买入的信息，忽视了风险信号。市场不是总是上涨的。'
            }
        },

        /**
         * 猎鹿博弈 - 信任与协调
         */
        stagHunt: {
            id: 'stag-hunt',
            name: '猎鹿博弈',
            description: '测试信任与协调问题',
            players: ['Hunter1', 'Hunter2'],
            strategies: {
                Hunter1: ['猎鹿', '猎兔'],
                Hunter2: ['猎鹿', '猎兔']
            },
            payoffs: {
                '猎鹿,猎鹿': [4, 4],   // 合作猎鹿：高收益
                '猎鹿,猎兔': [0, 3],   // 单独猎鹿：失败
                '猎兔,猎鹿': [3, 0],   // 对方单独猎鹿
                '猎兔,猎兔': [2, 2]    // 都猎兔：中等收益
            },
            cognitiveBias: {
                type: 'coordination_problem',
                lesson: '信任是合作的基础',
                awakeningMessage: '猎鹿需要双方合作，如果缺乏信任，只能选择低收益的猎兔。信任的价值往往被低估。'
            }
        }
    };

    // ============================================
    // 博弈论工具函数
    // ============================================
    const GameTheoryUtils = {
        /**
         * 计算帕累托最优
         */
        findParetoOptimal(payoffs) {
            const paretoOptimal = [];

            for (let i = 0; i < payoffs.length; i++) {
                let isPareto = true;
                for (let j = 0; j < payoffs.length; j++) {
                    if (i === j) continue;

                    // 检查是否存在帕累托改进
                    const dominates = payoffs[j].every((v, k) => v >= payoffs[i][k]) &&
                                     payoffs[j].some((v, k) => v > payoffs[i][k]);

                    if (dominates) {
                        isPareto = false;
                        break;
                    }
                }

                if (isPareto) {
                    paretoOptimal.push(i);
                }
            }

            return paretoOptimal;
        },

        /**
         * 计算社会最优（总支付最大）
         */
        findSocialOptimum(payoffs) {
            let maxSum = -Infinity;
            let optimum = null;

            for (const [combo, values] of Object.entries(payoffs)) {
                const sum = values.reduce((a, b) => a + b, 0);
                if (sum > maxSum) {
                    maxSum = sum;
                    optimum = combo;
                }
            }

            return { combo: optimum, totalPayoff: maxSum };
        },

        /**
         * 计算策略优势
         */
        findDominantStrategies(payoffMatrix) {
            const dominant = {};
            const players = payoffMatrix.players;

            for (const player of players) {
                const strategies = payoffMatrix.strategies[player];
                const playerIndex = players.indexOf(player);

                for (const strategy of strategies) {
                    let isDominant = true;

                    for (const otherStrategy of strategies) {
                        if (strategy === otherStrategy) continue;

                        // 比较两个策略在所有对手策略下的支付
                        // 简化：需要更复杂的实现
                    }

                    if (isDominant) {
                        dominant[player] = strategy;
                        break;
                    }
                }
            }

            return dominant;
        },

        /**
         * 格式化支付矩阵为表格
         */
        formatMatrix(payoffMatrix) {
            const players = payoffMatrix.players;
            const s1 = payoffMatrix.strategies[players[0]];
            const s2 = payoffMatrix.strategies[players[1]];

            let table = `| ${players[0]} \\ ${players[1]} | ${s2.join(' | ')} |\n`;
            table += `|${'-'.repeat(players[0].length + 3)}|${'-'.repeat(s2.length * 8)}|\n`;

            for (const strategy of s1) {
                const row = [strategy];
                for (const opponentStrategy of s2) {
                    const payoff = payoffMatrix.getPayoff(`${strategy},${opponentStrategy}`);
                    row.push(payoff ? `(${payoff[0]},${payoff[1]})` : '-');
                }
                table += `| ${row.join(' | ')} |\n`;
            }

            return table;
        }
    };

    // 导出
    global.GameTheory = {
        PayoffMatrix,
        NashEquilibriumSolver,
        GameScenarioSimulator,
        CognitiveBiasGames,
        Utils: GameTheoryUtils
    };

    // 便捷初始化
    global.createGameSimulator = function() {
        const simulator = new GameScenarioSimulator();

        // 注册所有认知偏差博弈
        for (const [id, config] of Object.entries(CognitiveBiasGames)) {
            simulator.registerGame(id, config);
        }

        return simulator;
    };

})(typeof window !== 'undefined' ? window : global);
