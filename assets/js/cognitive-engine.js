/**
 * Core Cognitive Training Engine
 * 提供非线性效果计算、觉醒时刻检测、认知偏差识别
 */
(function(global) {
  'use strict';

  // ============================================================================
  // NonlinearEffectsEngine - 非线性效果引擎
  // ============================================================================
  class NonlinearEffectsEngine {
    // 协调成本：员工数超过3人后指数增长
    static calculateCoordinationCost(staffCount) {
      if (staffCount <= 3) return 0;
      return 0.3 * Math.pow(staffCount - 3, 2.2);
    }

    // 员工效率：超过3人后非线性下降
    static calculateStaffEfficiency(staffCount) {
      if (staffCount <= 3) return 100;
      return Math.round(100 / (1 + 0.15 * Math.pow(staffCount - 3, 1.8)));
    }

    // 边际效益递减
    static calculateDiminishingReturns(input, baseOutput, decayFactor) {
      return baseOutput * Math.exp(-decayFactor * Math.max(0, input - 1));
    }

    // 正反馈循环
    static calculatePositiveFeedback(currentValue, feedbackRate, maxValue) {
      const next = currentValue * (1 + feedbackRate);
      return Math.min(next, maxValue);
    }

    // 客户终身价值：满意度低于60时指数下降
    static calculateCustomerLifetimeValue(satisfaction) {
      if (satisfaction >= 80) return 100;
      if (satisfaction >= 60) return 80;
      if (satisfaction >= 40) return 40;
      if (satisfaction >= 20) return 15;
      return 5;
    }

    // 检查临界点
    static checkTippingPoint(currentValue, threshold, cascadeEffect) {
      if (currentValue >= threshold) {
        return {
          triggered: true,
          cascade: cascadeEffect,
          message: `临界点突破！当前值 ${currentValue} >= 阈值 ${threshold}`
        };
      }
      return { triggered: false };
    }

    // 道德风险累积
    static calculateMoralHazard(interventionCount, totalBailout) {
      const baseRisk = 10;
      const interventionPenalty = interventionCount * 15;
      const bailoutPenalty = Math.log10(totalBailout + 1) * 5;
      return Math.min(baseRisk + interventionPenalty + bailoutPenalty, 100);
    }

    // 风险传染
    static calculateContagion(exposureMatrix, failedInstitution, institutions) {
      const result = {};
      const exposures = exposureMatrix[failedInstitution] || {};
      
      for (const [institution, exposure] of Object.entries(exposures)) {
        const currentRisk = institutions[institution]?.systemic_risk || 0;
        const newRisk = currentRisk + exposure * 20;
        result[institution] = Math.min(newRisk, 100);
      }
      
      return result;
    }

    // 算法过滤强度
    static calculateAlgorithmicFiltering(baseFilter, engagementFeedback) {
      return Math.min(baseFilter + engagementFeedback * 0.3, 0.95);
    }

    // 观点极化
    static calculatePolarization(basePolarization, confirmationBias, algorithmicFiltering, socialInfluence) {
      return Math.min(
        basePolarization + 
        confirmationBias * 0.4 + 
        algorithmicFiltering * 0.3 + 
        socialInfluence * 0.3,
        100
      );
    }

    // 延迟效果应用
    static applyDelayedEffects(state, delayedEffects) {
      const applied = [];
      const remaining = [];

      for (const effect of delayedEffects) {
        if (effect.turnsRemaining <= 0) {
          applied.push(effect);
          if (effect.changes) {
            for (const [key, value] of Object.entries(effect.changes)) {
              if (state.hasOwnProperty(key)) {
                state[key] += value;
              }
            }
          }
        } else {
          effect.turnsRemaining = (effect.turnsRemaining || 1) - 1;
          remaining.push(effect);
        }
      }

      return { applied, remaining };
    }
  }

  // ============================================================================
  // AwakeningMomentSystem - 觉醒时刻检测系统
  // ============================================================================
  class AwakeningMomentSystem {
    static checkAwakening(scenarioId, turn, state, history) {
      const checks = {
        'coffee-shop': () => this.checkCoffeeShopAwakening(turn, state, history),
        'investment': () => this.checkInvestmentAwakening(turn, state, history),
        'climate-change': () => this.checkClimateAwakening(turn, state),
        'financial-crisis': () => this.checkFinancialAwakening(turn, state),
        'social-media': () => this.checkSocialMediaAwakening(turn, state),
        'historical': () => this.checkHistoricalAwakening(turn, state, history)
      };

      const checker = checks[scenarioId];
      if (checker) {
        return checker();
      }
      return null;
    }

    static checkCoffeeShopAwakening(turn, state, history) {
      if (turn !== 3) return null;
      
      const recentDecisions = history.slice(-2);
      const staffIncreases = recentDecisions.filter(d => d.decisions?.staff_count > 5).length;
      
      if (staffIncreases >= 1 && state.satisfaction < 40) {
        return {
          triggered: true,
          title: '⚠️ 觉醒时刻：你发现了什么？',
          message: this.generateCoffeeShopAwakeningMessage(state, history),
          emotionalImpact: 'surprise',
          learningPoint: '线性思维陷阱：你以为"投入翻倍，产出翻倍"，但复杂系统中有协同成本和边际效益递减'
        };
      }
      
      return null;
    }

    static generateCoffeeShopAwakeningMessage(state, history) {
      const staffCount = history[history.length - 1]?.decisions?.staff_count || 0;
      const efficiency = NonlinearEffectsEngine.calculateStaffEfficiency(staffCount);
      const coordinationCost = NonlinearEffectsEngine.calculateCoordinationCost(staffCount);
      
      return `你的员工数从3人增加到${staffCount}人，但你注意到：
- 员工效率从100%下降到${efficiency}%
- 协调成本从0%上升到${Math.round(coordinationCost)}%
- 每增加1名员工，实际产出反而减少

这正是线性思维陷阱的典型表现：
你以为"投入翻倍，产出翻倍"，但在复杂系统中，
要素之间存在相互作用，导致边际效益递减。

关键洞察：在复杂系统中，最优解通常不是"越多越好"，
而是找到一个平衡点。你的咖啡店理想员工数可能是4-5人。`;
    }

    static checkInvestmentAwakening(turn, state, history) {
      if (turn < 3) return null;
      
      const recentSelections = history.slice(-3);
      const positiveBias = recentSelections.filter(d => 
        d.decisions?.information_bias === 'positive'
      ).length;
      
      if (positiveBias >= 2 && state.bias_risk > 65) {
        return {
          triggered: true,
          title: '🎯 觉醒时刻：你发现了什么？',
          message: this.generateInvestmentAwakeningMessage(state, history),
          emotionalImpact: 'shock',
          learningPoint: '确认偏误：你会本能地寻找支持自己观点的信息，同时忽视挑战你观点的证据'
        };
      }
      
      return null;
    }

    static generateInvestmentAwakeningMessage(state, history) {
      const positiveSelections = history.filter(d => 
        d.decisions?.information_bias === 'positive'
      ).length;
      const negativeSelections = history.filter(d => 
        d.decisions?.information_bias === 'negative'
      ).length;
      
      return `回顾你的信息选择：
- 你选择了"看涨信息" ${positiveSelections} 次
- 你选择了"看跌信息" ${negativeSelections} 次
- 你的信息源多样性只有 ${(positiveSelections / (positiveSelections + negativeSelections || 1)).toFixed(2)}

更令人震惊的是：
你忽略的看跌报告，准确预测了这次下跌。
你选择的所有看涨报告，都高估了15-30%。

这就是确认偏误的力量：
你会本能地寻找支持自己观点的信息，
同时忽视那些挑战你观点的证据。

关键洞察：优秀投资者不是预测最准的人，
而是能够主动寻找反面证据的人。`;
    }

    static checkClimateAwakening(turn, state) {
      if (turn !== 3) return null;
      
      if (state.climate_risk > 70) {
        return {
          triggered: true,
          title: '🌍 觉醒时刻：你发现了什么？',
          message: `你的政策路径：
- 回合1: 温和目标（政治优先）
- 回合2: 推迟行动（等待技术）
- 回合3: 谈判僵局（公平原则）

气候系统的实际状态：
- 当前升温: 1.8°C（接近2°C临界点）
- 北极冰盖: 已减少40%
- 极端天气: 增加300%

关键洞察：气候系统有"惯性"。
你今天排放的CO2，会影响未来30-100年的气候。
你现在做的每一个决策，都在为后代锁定未来的气候状态。

你的"政治优先"策略，实际上是在牺牲后代的安全。
这就是时间偏好偏差：我们过度重视短期利益，
而忽视长期后果。`,
          emotionalImpact: 'fear',
          learningPoint: '时间偏好偏差：我们系统性地低估长期后果，因为它们在当下不可见'
        };
      }
      
      return null;
    }

    static checkFinancialAwakening(turn, state) {
      if (state.systemic_risk_level > 80) {
        return {
          triggered: true,
          title: '💥 觉醒时刻：你发现了什么？',
          message: `你的决策路径：
- 第1次救市：¥500亿 → 道德风险+15%
- 第2次救市：¥800亿 → 道德风险+30%
- 第3次救市请求：¥1500亿

市场现在的状态：
- 道德风险累积: 225%
- 金融机构风险行为增加: 3倍
- 系统性风险: ${state.systemic_risk_level}%

这就是道德风险的经典陷阱：
每一次干预都在降低市场参与者的风险意识，
让他们预期"出了问题有人救"。

结果：风险不是被消除，而是被转移和放大。
最终爆发的危机，比最初的危机大得多。

关键洞察：在复杂金融系统中，
短期稳定可能意味着长期不稳定。`,
          emotionalImpact: 'shock',
          learningPoint: '道德风险：每一次救助都在鼓励更多的冒险行为'
        };
      }
      
      return null;
    }

    static checkSocialMediaAwakening(turn, state) {
      if (state.polarizationLevel > 70) {
        return {
          triggered: true,
          title: '🔍 觉醒时刻：你发现了什么？',
          message: `回顾你过去的内容选择：
- 你点击了"保守派观点" ${state.conservativeClicks || 0} 次
- 你点击了"自由派观点" ${state.liberalClicks || 0} 次
- 你从未点击"中立观点"

你的观点光谱：
3个月前: 50（中间立场）
现在: ${state.politicalSpectrum || 50}（极端${state.politicalSpectrum > 70 ? '保守' : '自由'}）

变化过程：
- 你每次点击确认性内容，算法就推送更极端的内容
- 更极端的内容获得更高engagement
- 算法学习到"极端=高互动"，进一步推送极端内容

这就是回声室效应：
你以为是自己在选择内容，
实际上是算法在塑造你的观点。

更可怕的是：
你现在看到任何中间立场的内容，
都会觉得"太温和了"、"没有说服力"。

这就是群体极化：
温和的观点 → 经过讨论 → 变成极端观点`,
          emotionalImpact: 'surprise',
          learningPoint: '回声室效应：算法优化engagement会自然产生极端化'
        };
      }
      
      return null;
    }

    static checkHistoricalAwakening(turn, state, history) {
      if (turn < 2) return null;
      
      const similarity = state.decisionSimilarity || 0;
      if (similarity > 0.7) {
        return {
          triggered: true,
          title: '📜 觉醒时刻：你发现了什么？',
          message: `你的决策与历史决策者的相似度：${Math.round(similarity * 100)}%

你选择了与${state.historicalDecisionMaker || 'NASA管理层'}相同的路径：
- 忽视工程师警告
- 选择按时发射
- 认为"风险可控"

但你知道结果：${state.actualOutcome || '灾难发生'}

这就是后见之明偏误：
知道结果后，你觉得自己"早就知道"，
但在信息不完整、时间压力、社会压力下，
你会做出同样的选择。

关键洞察：
理解历史不是为了证明"我不会犯同样的错"，
而是为了理解"在那种情境下，为什么会那样决策"。`,
          emotionalImpact: 'reflection',
          learningPoint: '后见之明偏误：知道结果会让我们高估自己的预测能力'
        };
      }
      
      return null;
    }
  }

  // ============================================================================
  // CognitiveBiasDetector - 认知偏差检测器
  // ============================================================================
  class CognitiveBiasDetector {
    static detectLinearThinking(history) {
      const recent = history.slice(-3);
      const allIncrease = recent.every(d => 
        d.decisions && typeof d.decisions === 'object' && 
        Object.values(d.decisions).every(v => typeof v === 'number' && v > 0)
      );
      
      if (allIncrease && recent.length >= 3) {
        return {
          bias: 'linear_thinking',
          confidence: 0.85,
          evidence: `连续${recent.length}回合都在增加同类投入`,
          suggestion: '试试减少投入，或者尝试不同的策略'
        };
      }
      return null;
    }

    static detectConfirmationBias(selections) {
      if (!selections || selections.length === 0) return null;
      
      const positiveCount = selections.filter(s => s.bias === 'positive').length;
      const negativeCount = selections.filter(s => s.bias === 'negative').length;
      const total = selections.length;
      
      const positiveRatio = positiveCount / total;
      const negativeRatio = negativeCount / total;
      
      if (positiveRatio > 0.7) {
        return {
          bias: 'confirmation_bias_positive',
          confidence: 0.9,
          evidence: `你选择了${positiveCount}条正面信息，${negativeCount}条反面信息`,
          suggestion: '尝试主动寻找反面观点'
        };
      }
      
      if (negativeRatio > 0.7) {
        return {
          bias: 'confirmation_bias_negative',
          confidence: 0.9,
          evidence: `你选择了${negativeCount}条反面信息，${positiveCount}条正面信息`,
          suggestion: '尝试主动寻找正面观点'
        };
      }
      
      return null;
    }

    static detectTimeDelayNeglect(decisions) {
      const impatientChoices = decisions.filter(d => 
        d.decisions && d.decisions.impatience_score > 0.7
      ).length;
      
      if (impatientChoices >= 2) {
        return {
          bias: 'time_delay_neglect',
          confidence: 0.8,
          evidence: `你在${impatientChoices}回合中表现出急于求成的倾向`,
          suggestion: '考虑延迟满足，今天的投入可能在更远的未来显现效果'
        };
      }
      return null;
    }

    static detectOverInvestment(decisions, thresholds) {
      const overInvestmentTurns = decisions.filter(d => 
        d.decisions && 
        d.decisions.time_investment > (thresholds?.time || 80) &&
        d.decisions.communication_effort > (thresholds?.communication || 80)
      ).length;
      
      if (overInvestmentTurns >= 2) {
        return {
          bias: 'over_investment',
          confidence: 0.85,
          evidence: `连续${overInvestmentTurns}回合过度投入`,
          suggestion: '过度投入可能产生窒息效果，适度的空间反而更好'
        };
      }
      return null;
    }

    static detectAnchoring(decisions) {
      const firstDecision = decisions[0];
      const recentDecision = decisions[decisions.length - 1];
      
      if (firstDecision && recentDecision && 
          firstDecision.decisions && recentDecision.decisions) {
        const firstValue = Object.values(firstDecision.decisions)[0];
        const recentValue = Object.values(recentDecision.decisions)[0];
        
        if (typeof firstValue === 'number' && typeof recentValue === 'number') {
          const deviation = Math.abs(recentValue - firstValue) / firstValue;
          if (deviation < 0.1 && decisions.length >= 3) {
            return {
              bias: 'anchoring_effect',
              confidence: 0.75,
              evidence: `你的决策始终围绕初始值${firstValue}，变化幅度小于10%`,
              suggestion: '新证据出现时，考虑调整你的初始判断'
            };
          }
        }
      }
      return null;
    }

    static analyzeAll(history, selections) {
      const biases = [];
      
      if (history.length > 0) {
        const linear = this.detectLinearThinking(history);
        if (linear) biases.push(linear);
        
        const timeDelay = this.detectTimeDelayNeglect(history);
        if (timeDelay) biases.push(timeDelay);
        
        const anchoring = this.detectAnchoring(history);
        if (anchoring) biases.push(anchoring);
      }
      
      if (selections && selections.length > 0) {
        const confirmation = this.detectConfirmationBias(selections);
        if (confirmation) biases.push(confirmation);
      }
      
      return biases;
    }
  }

  // ============================================================================
  // DelayedEffectQueue - 延迟效果队列
  // ============================================================================
  class DelayedEffectQueue {
    constructor() {
      this.effects = [];
    }

    add(effect) {
      this.effects.push({
        ...effect,
        id: Date.now() + Math.random(),
        turnsRemaining: effect.turnsRemaining || 1,
        applied: false
      });
    }

    tick() {
      const applied = [];
      const remaining = [];

      for (const effect of this.effects) {
        if (effect.turnsRemaining <= 0) {
          applied.push(effect);
        } else {
          effect.turnsRemaining--;
          remaining.push(effect);
        }
      }

      this.effects = remaining;
      return applied;
    }

    peek() {
      return this.effects.filter(e => !e.applied);
    }

    clear() {
      this.effects = [];
    }
  }

  // ============================================================================
  // Export
  // ============================================================================
  global.NonlinearEffectsEngine = NonlinearEffectsEngine;
  global.AwakeningMomentSystem = AwakeningMomentSystem;
  global.CognitiveBiasDetector = CognitiveBiasDetector;
  global.DelayedEffectQueue = DelayedEffectQueue;

})(typeof window !== 'undefined' ? window : global);
