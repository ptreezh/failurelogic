// Complete mock scenarios data for GitHub Pages deployment
// This file contains all scenarios that would normally be loaded from the API

const allMockScenarios = [
  // Original 3 scenarios
  {
    id: "coffee-shop-linear-thinking",
    name: "咖啡店线性思维",
    description: "线性思维陷阱场景",
    fullDescription: "在这个场景中，您将管理一家咖啡店，体验线性思维在复杂商业环境中的局限性。线性思维是指我们倾向于认为原因和结果之间存在直接的、成比例的关系。但在复杂的系统中，这种思维方式往往会导致错误的决策。",
    difficulty: "beginner",
    estimatedDuration: 15,
    targetBiases: ["linear_thinking"],
    cognitiveBias: "线性思维",
    duration: "15-20分钟",
    category: "商业决策",
    thumbnail: "/assets/images/coffee-shop.jpg",
    initialState: {
      satisfaction: 50,
      resources: 1000,
      reputation: 50,
      turn: 1
    },
    advancedChallenges: [
      {
        title: "供应链指数增长",
        description: "处理供应商网络扩展中的指数增长效应",
        difficulty: "intermediate",
        cognitiveBiases: ["exponential_misconception", "linear_thinking"]
      },
      {
        title: "复杂系统管理",
        description: "管理多变量商业生态系统的复杂性",
        difficulty: "advanced",
        cognitiveBiases: ["complex_system_misunderstanding", "cascading_failure_blindness"]
      }
    ]
  },
  {
    id: "relationship-time-delay",
    name: "恋爱关系时间延迟",
    description: "时间延迟偏差场景",
    fullDescription: "在恋爱关系中体验时间延迟对决策的影响。每个决策的效果会在几回合后显现。时间延迟偏差是指我们倾向于期望立即看到行动的结果，而忽视了在复杂系统中结果往往需要时间才能显现。",
    difficulty: "intermediate",
    estimatedDuration: 20,
    targetBiases: ["time_delay_bias"],
    cognitiveBias: "时间延迟",
    duration: "20-25分钟",
    category: "人际关系",
    thumbnail: "/assets/images/relationship.jpg",
    initialState: {
      satisfaction: 50,
      trust: 50,
      turn: 1
    },
    advancedChallenges: [
      {
        title: "长期关系复利效应",
        description: "理解关系投资的长期复利增长模式",
        difficulty: "intermediate",
        cognitiveBiases: ["compound_interest_misunderstanding", "short_term_bias"]
      },
      {
        title: "复杂关系网络",
        description: "处理家庭和社交网络的复杂动态",
        difficulty: "advanced",
        cognitiveBiases: ["complex_system_misunderstanding", "network_effect_blindness"]
      }
    ]
  },
  {
    id: "investment-confirmation-bias",
    name: "投资确认偏误",
    description: "确认偏误场景",
    fullDescription: "在投资决策中体验确认偏误如何影响我们的风险判断。确认偏误是指我们倾向于寻找、解释和记住那些证实我们已有信念或假设的信息，而忽视与之相矛盾的信息。",
    difficulty: "advanced",
    estimatedDuration: 25,
    targetBiases: ["confirmation_bias"],
    cognitiveBias: "确认偏误",
    duration: "25-30分钟",
    category: "金融决策",
    thumbnail: "/assets/images/investment.jpg",
    initialState: {
      portfolio: 10000,
      knowledge: 0,
      turn: 1
    },
    advancedChallenges: [
      {
        title: "通胀调整投资",
        description: "考虑通胀影响的长期投资复利效应",
        difficulty: "intermediate",
        cognitiveBiases: ["inflation_blindness", "compound_interest_misunderstanding"]
      },
      {
        title: "复杂金融系统",
        description: "处理多变量金融市场系统风险",
        difficulty: "advanced",
        cognitiveBiases: ["financial_system_complexity_blindness", "correlation_misunderstanding"]
      }
    ]
  },

  // Business Strategy Reasoning Game (game-001)
  {
    id: "game-001",
    name: "商业战略推理游戏",
    description: "模拟商业决策推理过程，测试用户在复杂商业环境中的决策思维",
    fullDescription: "在这个商业战略推理游戏中，您将面对复杂的商业决策场景，体验多种认知陷阱，包括线性思维、确认偏误和复杂系统误解。游戏涉及市场分析、资源配置、竞争策略等多个维度。",
    difficulty: "intermediate",
    estimatedDuration: 30,
    targetBiases: ["linear_thinking", "confirmation_bias", "complex_system_misunderstanding"],
    cognitiveBias: "商业决策认知陷阱",
    duration: "30-45分钟",
    category: "商业战略",
    thumbnail: "/assets/images/business-strategy.jpg",
    initialState: {
      marketShare: 25,
      cashFlow: 50000,
      teamMorale: 70,
      turn: 1
    },
    advancedChallenges: [
      {
        title: "市场动态响应",
        description: "处理快速变化的市场需求和竞争对手反应",
        difficulty: "intermediate",
        cognitiveBiases: ["linear_thinking", "confirmation_bias"]
      },
      {
        title: "复杂商业生态系统",
        description: "管理多方利益相关者和复杂供应链关系",
        difficulty: "advanced",
        cognitiveBiases: ["complex_system_misunderstanding", "cascade_failure_blindness"]
      }
    ]
  },

  // Public Policy Making Simulation (game-002)
  {
    id: "game-002",
    name: "公共政策制定模拟",
    description: "模拟公共政策制定过程，平衡多方利益相关者需求",
    fullDescription: "在这个公共政策制定模拟中，您将扮演政策制定者，需要平衡选民、利益集团、专家意见等多方需求，体验时间延迟、确认偏误、复杂系统等认知陷阱对政策制定的影响。",
    difficulty: "intermediate",
    estimatedDuration: 35,
    targetBiases: ["time_delay_bias", "confirmation_bias", "stakeholder_complexity"],
    cognitiveBias: "政策制定认知陷阱",
    duration: "35-50分钟",
    category: "公共政策",
    thumbnail: "/assets/images/public-policy.jpg",
    initialState: {
      publicSupport: 60,
      budget: 1000000,
      stakeholderPressure: 50,
      turn: 1
    },
    advancedChallenges: [
      {
        title: "多方利益平衡",
        description: "协调不同利益集团间的复杂关系",
        difficulty: "intermediate",
        cognitiveBiases: ["stakeholder_complexity", "short_term_bias"]
      },
      {
        title: "政策连锁反应",
        description: "处理政策决定引发的复杂连锁反应",
        difficulty: "advanced",
        cognitiveBiases: ["complex_system_misunderstanding", "unintended_consequence_blindness"]
      }
    ]
  },

  // Personal Finance Decision Simulation (game-003)
  {
    id: "game-003",
    name: "个人财务决策模拟",
    description: "模拟个人长期财务规划决策，体验复利和时间价值概念",
    fullDescription: "在这个个人财务决策模拟中，您将制定长期财务规划，体验复利增长、时间价值、风险评估等概念，理解短视偏误和线性思维对财务决策的影响。",
    difficulty: "beginner",
    estimatedDuration: 25,
    targetBiases: ["compound_interest_misunderstanding", "short_term_bias", "risk_misjudgment"],
    cognitiveBias: "财务决策认知陷阱",
    duration: "25-40分钟",
    category: "个人理财",
    thumbnail: "/assets/images/personal-finance.jpg",
    initialState: {
      savings: 50000,
      income: 5000,
      debt: 10000,
      investmentKnowledge: 30,
      turn: 1
    },
    advancedChallenges: [
      {
        title: "复合增长效应",
        description: "理解长期投资的复合增长模式",
        difficulty: "intermediate",
        cognitiveBiases: ["compound_interest_misunderstanding", "exponential_growth_blindness"]
      },
      {
        title: "风险管理",
        description: "平衡风险与回报的复杂关系",
        difficulty: "advanced",
        cognitiveBiases: ["risk_misjudgment", "correlation_misunderstanding"]
      }
    ]
  },

  // Global Climate Change Policy Making Game (adv-game-001)
  {
    id: "adv-game-001",
    name: "全球气候变化政策制定博弈",
    description: "模拟多国在气候变化政策制定中的博弈与权衡",
    fullDescription: "在这个高级政策制定博弈中，您将代表一个国家参与国际气候谈判，平衡经济发展、环境保护、国际合作等多重目标，体验复杂系统思维、长期规划、跨文化沟通等挑战。",
    difficulty: "advanced",
    estimatedDuration: 60,
    targetBiases: ["complex_system_misunderstanding", "long_term_blindness", "multilateral_negotiation_complexity"],
    cognitiveBias: "气候变化政策认知陷阱",
    duration: "60-90分钟",
    category: "环境政策",
    thumbnail: "/assets/images/climate-change.jpg",
    initialState: {
      carbonEmissions: 80,
      economicGrowth: 3.5,
      internationalStanding: 60,
      turn: 1
    },
    advancedChallenges: [
      {
        title: "国际合作博弈",
        description: "处理多边合作中的信任建立与利益平衡",
        difficulty: "intermediate",
        cognitiveBiases: ["cooperation_complexity", "trust_misjudgment"]
      },
      {
        title: "复杂环境系统",
        description: "理解气候系统的复杂反馈机制",
        difficulty: "advanced",
        cognitiveBiases: ["complex_system_misunderstanding", "delayed_effect_blindness"]
      }
    ]
  },

  // AI Governance and Regulation Decision Simulation (adv-game-002)
  {
    id: "adv-game-002",
    name: "AI治理与监管决策模拟",
    description: "模拟AI治理政策制定，平衡创新、安全、伦理等多方面考量",
    fullDescription: "在这个AI治理决策模拟中，您将面对新兴技术治理的复杂挑战，平衡技术创新、安全保障、伦理标准、国际合作等多重目标，体验技术政策制定中的认知陷阱。",
    difficulty: "advanced",
    estimatedDuration: 70,
    targetBiases: ["technology_complexity_misunderstanding", "regulatory_complexity", "innovation_vs_safety_tradeoff"],
    cognitiveBias: "AI治理认知陷阱",
    duration: "70-100分钟",
    category: "科技政策",
    thumbnail: "/assets/images/ai-governance.jpg",
    initialState: {
      innovationRate: 60,
      safetyStandards: 40,
      publicTrust: 55,
      internationalCooperation: 50,
      turn: 1
    },
    advancedChallenges: [
      {
        title: "创新安全平衡",
        description: "平衡技术创新与安全保障的复杂关系",
        difficulty: "intermediate",
        cognitiveBiases: ["innovation_vs_safety_misunderstanding", "risk_assessment_bias"]
      },
      {
        title: "技术复杂性",
        description: "理解AI技术发展的复杂性和不确定性",
        difficulty: "advanced",
        cognitiveBiases: ["technology_complexity_misunderstanding", "emergent_behavior_blindness"]
      }
    ]
  },

  // Complex Financial Markets Crisis Response Simulation (adv-game-003)
  {
    id: "adv-game-003",
    name: "复杂金融市场危机应对模拟",
    description: "模拟金融危机应对决策，处理复杂金融系统风险",
    fullDescription: "在这个金融危机应对模拟中，您将作为决策者处理复杂的金融系统风险，平衡市场稳定、机构救助、道德风险等多重考量，体验系统性风险、连锁反应、政策传导等复杂概念。",
    difficulty: "advanced",
    estimatedDuration: 75,
    targetBiases: ["systematic_risk_misunderstanding", "market_complexity", "policy_transmission_mechanism"],
    cognitiveBias: "金融危机应对认知陷阱",
    duration: "75-110分钟",
    category: "金融监管",
    thumbnail: "/assets/images/financial-crisis.jpg",
    initialState: {
      marketStability: 70,
      bankSolventcy: 65,
      investorConfidence: 55,
      systemicRiskLevel: 40,
      turn: 1
    },
    advancedChallenges: [
      {
        title: "系统性风险识别",
        description: "识别和应对金融系统中的系统性风险",
        difficulty: "intermediate",
        cognitiveBiases: ["systematic_risk_misunderstanding", "correlation_blindness"]
      },
      {
        title: "政策传导机制",
        description: "理解政策措施在复杂系统中的传导机制",
        difficulty: "advanced",
        cognitiveBiases: ["policy_transmission_misunderstanding", "complex_system_misunderstanding"]
      }
    ]
  }
];

// Export the function to get all mock scenarios
function getMockScenarios() {
  return allMockScenarios;
}

// For browser environment
if (typeof window !== 'undefined') {
  window.getMockScenarios = getMockScenarios;
  window.allMockScenarios = allMockScenarios;
}

// For Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getMockScenarios, allMockScenarios };
}