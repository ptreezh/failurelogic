/**
 * Historical Cases for Failure Logic
 * 与 Dörner《失败的逻辑》训练目标对齐的历史案例库
 */

(function (global) {
  'use strict';

  // 案例与咖啡店失败模式的映射（按 gap 模式匹配）
  const HISTORICAL_CASES = {
    selection_overload: {
      case_name: '雀巢咖啡 1990s 产品线扩张',
      year: '1990-1998',
      summary: '雀巢在 1990 年代推出超过 100 种咖啡 SKU，远超货架容量和消费者认知能力。',
      decision_made: '管理层认为"产品越多=市场越大"，持续推出新 SKU。',
      actual_outcome: '货架缺货、消费者选择瘫痪、品牌定位模糊。1998 年不得不砍掉 30% SKU，损失数亿美元。',
      dorner_ref: '类似 Dörner 描述的"丰富度幻觉"——决策者高估了选项的边际价值。',
      lesson: '选择过载不仅影响消费者，也拖垮了内部协调成本。'
    },
    overexpansion: {
      case_name: '星巴克 2008 急速扩张后的关店潮',
      year: '2007-2009',
      summary: '星巴克在 Howard Schultz 回归前从 5,886 家门店扩张到 16,680 家。',
      decision_made: '前 CEO Jim McDonald 相信"规模越大=品牌越强"，3 年开 10,000+ 店。',
      actual_outcome: '门店密度过高导致单店客流下降，2008 年关闭 600+ 门店、裁员 12,000 人、股价暴跌 80%。',
      dorner_ref: 'Dörner 在《失败的逻辑》第 6 章明确指出：复杂系统对指数扩张的容忍度是有限的。',
      lesson: '协调成本与扩张速度的平方成正比，超过临界点后每开一店都在吞噬已有门店的收入。'
    },
    marketing_fatigue: {
      case_name: '百事可乐 1990s "无休止促销"',
      year: '1995-2000',
      summary: '百事在商场内每周做 3-5 次不同促销，期望拉动销量。',
      decision_made: '营销总监认为"曝光越多越好"。',
      actual_outcome: '消费者学会"只在促销时购买"、正价销量下滑 15%，品牌溢价能力消失。',
      dorner_ref: 'Dörner: 营销效果的边际递减在复杂系统中尤为明显。',
      lesson: '营销有"耐药性"，过度促销会让消费者把促销价锚定为正常价。'
    },
    linear_thinking: {
      case_name: 'Kodak 数码转型的线性思维陷阱',
      year: '1975-2012',
      summary: 'Kodak 工程师 Steven Sasson 1975 年发明数码相机，但管理层认为胶卷市场仍可线性增长。',
      decision_made: '"胶卷销量年增 5%，数码相机不会取代胶卷"。',
      actual_outcome: '2012 年破产。胶卷销量不是线性而是指数级崩塌——5% 增长掩盖了 90% 的不可逆替代风险。',
      dorner_ref: 'Dörner: 线性外推是复杂系统决策中最常见的错误。',
      lesson: '"目前还在增长"不等于"会继续增长"。指数替代效应一旦启动，从外观崩塌到完全替代只需 3-5 年。'
    }
  };

  // 根据用户的失败模式选择最相关的案例
  function pickRelevantCase(detectedBiases) {
    if (!detectedBiases || detectedBiases.length === 0) return null;

    const biasTypeMap = {
      linear_thinking: 'linear_thinking',
      selection_overload: 'selection_overload',
      time_delay_neglect: 'overexpansion',
      sunk_cost: 'overexpansion',
      overconfidence: 'linear_thinking'
    };

    for (const bias of detectedBiases) {
      const caseKey = biasTypeMap[bias.bias];
      if (caseKey && HISTORICAL_CASES[caseKey]) {
        return HISTORICAL_CASES[caseKey];
      }
    }
    return HISTORICAL_CASES.linear_thinking;
  }

  global.HistoricalCases = HISTORICAL_CASES;
  global.pickRelevantCase = pickRelevantCase;
})(typeof window !== 'undefined' ? window : globalThis);
