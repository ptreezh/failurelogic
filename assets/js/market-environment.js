/**
 * MarketEnvironment Module
 * 市场环境模拟模块
 *
 * 包含：TAM、客户细分、客户转移模型、口碑传播、市场饱和
 */

(function(global) {
    'use strict';

    const DEFAULT_TAM = 1000;
    const DEFAULT_MAX_TAM = 1100;
    const DEFAULT_QUARTERLY_GROWTH = 0.02;
    const SATISFACTION_WOM_POSITIVE_THRESHOLD = 80;
    const SATISFACTION_WOM_NEGATIVE_THRESHOLD = 50;
    const SATURATION_THRESHOLD = 0.7;

    const TRANSFER_COEFFICIENTS = {
        satisfactionWeight: 0.5,
        priceWeight: 0.3,
        wordOfMouthWeight: 0.2
    };

    const SEGMENT_TYPES = [
        {
            type: 'price_sensitive',
            preferenceWeights: { price: 0.8, quality: 0.1, convenience: 0.1 },
            satisfactionThreshold: 60,
            loyaltyDecay: 0.1
        },
        {
            type: 'quality_sensitive',
            preferenceWeights: { price: 0.1, quality: 0.8, convenience: 0.1 },
            satisfactionThreshold: 70,
            loyaltyDecay: 0.05
        },
        {
            type: 'convenience_sensitive',
            preferenceWeights: { price: 0.1, quality: 0.1, convenience: 0.8 },
            satisfactionThreshold: 65,
            loyaltyDecay: 0.08
        }
    ];

    class MarketEnvironment {
        constructor(config = {}) {
            this.tam = config.totalAddressableMarket || DEFAULT_TAM;
            this.maxTAM = config.maxTAM || Math.max(this.tam * 1.1, DEFAULT_MAX_TAM);
            this.currentCustomers = config.currentCustomers || 500;
            this.quarterlyGrowthRate = config.quarterlyGrowthRate || DEFAULT_QUARTERLY_GROWTH;
            this.averageSatisfaction = config.averageSatisfaction || 50;
            this.marketShare = this.tam > 0 ? this.currentCustomers / this.tam : 0;

            this.transferCoefficients = TRANSFER_COEFFICIENTS;
            this.segments = this.createSegments(config);
            this.pendingTransfers = [];
        }

        createSegments(config) {
            const segments = [];
            const tam = this.tam;
            const baseSize = Math.floor(tam / SEGMENT_TYPES.length);
            let totalSize = 0;

            SEGMENT_TYPES.forEach((segmentType, index) => {
                let size = baseSize;
                if (config.segmentSizes && config.segmentSizes[index] !== undefined) {
                    size = config.segmentSizes[index];
                } else if (index === 0) {
                    size = baseSize + (tam - baseSize * SEGMENT_TYPES.length);
                }
                size = Math.max(1, size);
                totalSize += size;

                segments.push({
                    type: segmentType.type,
                    size: size,
                    preferenceWeights: segmentType.preferenceWeights,
                    satisfactionThreshold: segmentType.satisfactionThreshold,
                    loyaltyDecay: segmentType.loyaltyDecay,
                    satisfaction: this.averageSatisfaction
                });
            });

            if (totalSize > tam) {
                const scale = tam / totalSize;
                segments.forEach(s => {
                    s.size = Math.max(1, Math.floor(s.size * scale));
                });
            }

            return segments;
        }

        simulateQuarter() {
            for (let month = 0; month < 3; month++) {
                this.simulateMonth();
            }
            this.marketShare = this.currentCustomers / this.tam;
            return this.getState();
        }

        simulateMonth() {
            this.segments.forEach(s => s.satisfaction = this.averageSatisfaction);
            this.updateTAM();
            const womEffect = this.calculateWordOfMouthEffect();
            const growthPotential = this.calculateGrowthPotential();
            const transferEffect = this.processTransfers();

            const netChange = growthPotential + womEffect.netEffect + transferEffect.netChange;
            this.currentCustomers = Math.max(0, Math.min(this.tam, this.currentCustomers + netChange));

            this.updateSegmentSatisfaction();
        }

        updateTAM() {
            if (this.tam >= this.maxTAM) return;
            const growth = (this.maxTAM - this.tam) * this.quarterlyGrowthRate / 3;
            this.tam = Math.min(this.maxTAM, this.tam + growth);
        }

        calculateGrowthPotential() {
            let growth = this.currentCustomers * this.quarterlyGrowthRate / 3;

            const satisfactionModifier = Math.max(0, this.averageSatisfaction / 100);
            growth *= satisfactionModifier;

            if (this.marketShare > SATURATION_THRESHOLD) {
                const excessShare = this.marketShare - SATURATION_THRESHOLD;
                const decayFactor = Math.pow(0.5, excessShare * 10);
                growth *= decayFactor;
            }

            return growth;
        }

        calculateTransferProbability(params) {
            const satisfactionDiff = params.competitorSatisfaction - params.satisfaction;
            const priceDiff = (params.price || 50) - (params.competitorPrice || 50);
            const normalizedPriceDiff = priceDiff / 100;
            const normalizedWOM = (params.wordOfMouth || 0.5) - 0.5;

            const prob = (
                TRANSFER_COEFFICIENTS.satisfactionWeight * Math.max(0, satisfactionDiff / 100) +
                TRANSFER_COEFFICIENTS.priceWeight * Math.max(0, normalizedPriceDiff) +
                TRANSFER_COEFFICIENTS.wordOfMouthWeight * Math.max(0, normalizedWOM)
            );

            return Math.min(1, Math.max(0, prob));
        }

        simulateTransfer(params) {
            const probability = this.calculateTransferProbability(params);
            const immediateTransfer = 0;
            const delayedTransfer = this.currentCustomers * probability * 0.1;

            this.pendingTransfers.push({
                quarter: this.pendingTransfers.length + 1,
                amount: delayedTransfer,
                executed: false
            });

            return { immediateTransfer, delayedTransfer };
        }

        processTransfers() {
            let totalTransfer = 0;

            this.pendingTransfers = this.pendingTransfers.filter(transfer => {
                if (!transfer.executed && transfer.quarter <= this.pendingTransfers.length) {
                    transfer.executed = true;
                    totalTransfer -= transfer.amount;
                    return false;
                }
                return !transfer.executed;
            });

            return { netChange: totalTransfer };
        }

        calculateWordOfMouthEffect() {
            let newCustomers = 0;
            let lostCustomers = 0;

            if (this.averageSatisfaction > SATISFACTION_WOM_POSITIVE_THRESHOLD) {
                const baseEffect = 0.1;
                const networkMultiplier = 1 + this.marketShare * 2;
                newCustomers = baseEffect * networkMultiplier;
            }

            if (this.averageSatisfaction < SATISFACTION_WOM_NEGATIVE_THRESHOLD) {
                const baseLoss = 0.3;
                const networkMultiplier = 1 + this.marketShare;
                lostCustomers = baseLoss * networkMultiplier;
            }

            return {
                newCustomers: newCustomers,
                lostCustomers: lostCustomers,
                netEffect: newCustomers - lostCustomers
            };
        }

        updateSegmentSatisfaction() {
            const totalSatisfaction = this.segments.reduce((sum, segment) => {
                return sum + segment.satisfaction * segment.size;
            }, 0);
            const totalSize = this.segments.reduce((sum, segment) => sum + segment.size, 0);

            if (totalSize > 0) {
                this.averageSatisfaction = totalSatisfaction / totalSize;
            }
        }

        getState() {
            return {
                customers: this.currentCustomers,
                tam: this.tam,
                satisfaction: this.averageSatisfaction,
                marketShare: this.marketShare,
                segments: this.segments.map(s => ({
                    type: s.type,
                    size: s.size,
                    satisfaction: s.satisfaction
                }))
            };
        }

        reset() {
            this.currentCustomers = 500;
            this.tam = this.maxTAM * 0.9;
            this.averageSatisfaction = 50;
            this.marketShare = this.currentCustomers / this.tam;
            this.pendingTransfers = [];
            this.segments = this.createSegments({});
        }
    }

    global.MarketEnvironment = MarketEnvironment;

    global.createMarketEnvironment = function(config = {}) {
        return new MarketEnvironment(config);
    };

})(typeof window !== 'undefined' ? window : global);
