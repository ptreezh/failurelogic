/**
 * Cross-domain challenge scenarios generator
 * Combines multiple cognitive biases across different domains
 */

class CrossDomainChallengeGenerator {
  constructor() {
    this.biasCombinations = [
      {
        name: "Confirmation + Anchoring",
        description: "确认偏误与锚定效应的结合",
        domains: ["business", "personal", "scientific"],
        scenarios: [
          {
            title: "新产品市场验证",
            domain: "business",
            setup: "作为产品经理，你需要验证新产品的市场潜力。初步调查显示用户对价格敏感。",
            decisionPoints: [
              {
                situation: "你收到了一份市场调研报告，显示用户愿意为高端功能支付溢价。但这份报告来自你最信任的咨询公司。",
                options: [
                  "采纳报告建议，专注于高端功能",
                  "寻找其他来源的市场数据进行验证",
                  "忽略报告，坚持原有定价策略"
                ],
                explanation: "锚定效应让你过分依赖第一个信息源，确认偏误让你寻找支持这一观点的证据。"
              },
              {
                situation: "一些用户反馈表明，他们确实愿意为高端功能付费，但这是小众需求。",
                options: [
                  "继续专注高端市场，认为找到了利基市场",
                  "扩大样本量，验证需求是否普遍",
                  "调整策略，回到中端市场"
                ],
                explanation: "确认偏误让你强化已有决策，忽视相反证据。"
              }
            ]
          }
        ]
      },
      {
        name: "Overconfidence + Availability Heuristic",
        description: "过度自信与可得性启发的结合",
        domains: ["investment", "medical", "engineering"],
        scenarios: [
          {
            title: "投资项目评估",
            domain: "investment",
            setup: "你是一位投资经理，需要评估一个新兴技术项目的可行性。",
            decisionPoints: [
              {
                situation: "最近几个类似技术的投资项目都取得了巨大成功，新闻铺天盖地。你对这类项目变得非常乐观。",
                options: [
                  "快速决策，投入大量资金",
                  "Conduct thorough due diligence despite recent successes",
                  "Wait for more data before making a decision"
                ],
                explanation: "可得性启发让你过分依赖最近的成功案例，过度自信让你高估自己的判断能力。"
              },
              {
                situation: "Your team raises concerns about technical feasibility, but you've seen similar concerns proven wrong before.",
                options: [
                  "Overrule the team based on your experience",
                  "Seek external expert opinion",
                  "Pause the investment to address concerns"
                ],
                explanation: "过度自信让你忽视团队的担忧，可得性启发让你回忆起少数成功的反例。"
              }
            ]
          }
        ]
      },
      {
        name: "Groupthink + Authority Bias",
        description: "群体思维与权威偏误的结合",
        domains: ["corporate", "academic", "government"],
        scenarios: [
          {
            title: "公司战略转型",
            domain: "corporate",
            setup: "公司高层正在讨论是否进行重大战略转型。",
            decisionPoints: [
              {
                situation: "The CEO presents a bold new direction, and other executives nod in agreement. You have reservations but sense the group momentum.",
                options: [
                  "Voice your concerns despite group pressure",
                  "Align with the group consensus",
                  "Request more time to analyze the proposal"
                ],
                explanation: "Authority bias makes you defer to the CEO's judgment, while groupthink pressures you to conform."
              },
              {
                situation: "A junior team member raises a valid concern, but senior managers dismiss it quickly.",
                options: [
                  "Support the junior member's concern",
                  "Stay neutral to avoid conflict",
                  "Agree with senior management to maintain harmony"
                ],
                explanation: "Groupthink discourages dissent, while authority bias makes you respect hierarchy over merit."
              }
            ]
          }
        ]
      }
    ];
    
    this.domainMappings = {
      "business": ["商业决策", "市场策略", "运营管理"],
      "personal": ["人际关系", "职业规划", "财务决策"],
      "scientific": ["研究设计", "数据分析", "理论构建"],
      "investment": ["投资组合", "风险评估", "市场预测"],
      "medical": ["诊断决策", "治疗方案", "资源分配"],
      "engineering": ["设计优化", "安全评估", "项目管理"],
      "corporate": ["战略规划", "组织变革", "文化建设"],
      "academic": ["研究方向", "教学方法", "学术评价"],
      "government": ["政策制定", "资源配置", "风险评估"]
    };
  }

  /**
   * Generate a cross-domain challenge scenario
   * @param {string} biasCombination - Name of the bias combination to use
   * @param {string} targetDomain - Domain to contextualize the scenario
   * @returns {Object} Cross-domain challenge scenario
   */
  generateCrossDomainChallenge(biasCombination = null, targetDomain = null) {
    // Select a random bias combination if not specified
    const selectedCombination = biasCombination 
      ? this.biasCombinations.find(c => c.name === biasCombination)
      : this.biasCombinations[Math.floor(Math.random() * this.biasCombinations.length)];

    if (!selectedCombination) {
      throw new Error(`Bias combination "${biasCombination}" not found`);
    }

    // Select a scenario from the combination
    const scenario = selectedCombination.scenarios[
      Math.floor(Math.random() * selectedCombination.scenarios.length)
    ];

    // If a specific domain is requested, try to use it
    if (targetDomain && scenario.domain !== targetDomain) {
      // For demo purposes, we'll just adjust the context slightly
      scenario.contextualized = true;
    }

    return {
      id: `cross-domain-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: scenario.title,
      description: selectedCombination.description,
      biasCombination: selectedCombination.name,
      domain: scenario.domain,
      setup: scenario.setup,
      decisionPoints: scenario.decisionPoints,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get all available bias combinations
   * @returns {Array} List of bias combinations
   */
  getBiasCombinations() {
    return this.biasCombinations.map(combo => ({
      name: combo.name,
      description: combo.description,
      domains: combo.domains
    }));
  }

  /**
   * Mix scenarios from different domains
   * @param {Array} domainList - List of domains to mix
   * @param {number} numScenarios - Number of scenarios to generate
   * @returns {Array} Mixed cross-domain scenarios
   */
  generateMixedScenarios(domainList = null, numScenarios = 3) {
    const results = [];
    
    for (let i = 0; i < numScenarios; i++) {
      const biasCombo = this.biasCombinations[Math.floor(Math.random() * this.biasCombinations.length)];
      const scenario = biasCombo.scenarios[Math.floor(Math.random() * biasCombo.scenarios.length)];
      
      results.push({
        id: `mixed-${Date.now()}-${i}`,
        title: scenario.title,
        description: biasCombo.description,
        biasCombination: biasCombo.name,
        domain: domainList ? domainList[i % domainList.length] : scenario.domain,
        setup: scenario.setup,
        decisionPoints: scenario.decisionPoints,
        originalDomain: scenario.domain
      });
    }
    
    return results;
  }

  /**
   * Create unique scenario combinations by blending elements from different domains
   * @param {number} numCombinations - Number of unique combinations to generate
   * @returns {Array} Unique cross-domain scenario combinations
   */
  generateUniqueCombinations(numCombinations = 5) {
    const combinations = [];
    
    for (let i = 0; i < numCombinations; i++) {
      // Select 2-3 different bias combinations
      const selectedBiasCombos = this.getRandomElements(this.biasCombinations, 
        Math.min(3, Math.floor(Math.random() * 2) + 2));
      
      // Select scenarios from different domains
      const selectedScenarios = selectedBiasCombos.map(combo => 
        this.getRandomElement(combo.scenarios)
      );
      
      // Blend elements to create a new hybrid scenario
      const blendedScenario = this.blendScenarios(selectedScenarios, selectedBiasCombos);
      
      combinations.push(blendedScenario);
    }
    
    return combinations;
  }

  /**
   * Get random elements from an array
   * @private
   */
  getRandomElements(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Get random element from an array
   * @private
   */
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Blend multiple scenarios to create a unique hybrid
   * @private
   */
  blendScenarios(scenarios, biasCombos) {
    // Create a blended scenario with elements from multiple sources
    const blended = {
      id: `blended-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: this.createBlendedTitle(scenarios),
      description: this.createBlendedDescription(biasCombos),
      biasCombinations: biasCombos.map(combo => combo.name),
      domains: [...new Set(scenarios.map(s => s.domain))],
      setup: this.createBlendedSetup(scenarios),
      decisionPoints: this.mergeDecisionPoints(scenarios),
      originalScenarios: scenarios.map(s => s.title)
    };
    
    return blended;
  }

  /**
   * Create a blended title from multiple scenario titles
   * @private
   */
  createBlendedTitle(scenarios) {
    const prefixes = ['跨领域', '复合型', '多维度', '交叉性', '综合性'];
    const suffixes = ['挑战', '决策', '情景', '模拟', '练习'];
    
    const prefix = this.getRandomElement(prefixes);
    const suffix = this.getRandomElement(suffixes);
    const coreConcept = scenarios[0].title.split(' ')[0]; // Take first word as concept
    
    return `${prefix}${coreConcept}${suffix}`;
  }

  /**
   * Create a blended description from multiple bias combinations
   * @private
   */
  createBlendedDescription(biasCombos) {
    const biasNames = biasCombos.map(combo => combo.name).join(' + ');
    return `结合${biasNames}的复合型认知偏误挑战`;
  }

  /**
   * Create a blended setup from multiple scenario setups
   * @private
   */
  createBlendedSetup(scenarios) {
    // Combine setup elements from multiple scenarios
    const baseSetup = scenarios[0].setup;
    const additionalContext = scenarios.slice(1).map(s => 
      s.setup.split('。')[0] // Take the first sentence
    ).join('，同时');
    
    return `${baseSetup}，同时${additionalContext}。这是一个多维度的复杂决策场景。`;
  }

  /**
   * Merge decision points from multiple scenarios
   * @private
   */
  mergeDecisionPoints(scenarios) {
    const mergedPoints = [];
    
    // Take decision points from each scenario and interleave them
    const maxLength = Math.max(...scenarios.map(s => s.decisionPoints.length));
    
    for (let i = 0; i < maxLength; i++) {
      scenarios.forEach((scenario, scenarioIdx) => {
        if (i < scenario.decisionPoints.length) {
          const originalPoint = scenario.decisionPoints[i];
          
          // Modify the situation to reflect the cross-domain nature
          const modifiedPoint = {
            ...originalPoint,
            situation: this.adaptSituationForCrossDomain(originalPoint.situation, scenarioIdx),
            sourceScenario: scenario.title,
            scenarioIndex: scenarioIdx
          };
          
          mergedPoints.push(modifiedPoint);
        }
      });
    }
    
    return mergedPoints;
  }

  /**
   * Adapt a situation for cross-domain context
   * @private
   */
  adaptSituationForCrossDomain(originalSituation, scenarioIndex) {
    const domainContexts = [
      "在商业背景下，",
      "从个人决策角度，", 
      "在技术环境中，",
      "从投资视角看，",
      "在管理层面，"
    ];
    
    const context = domainContexts[scenarioIndex % domainContexts.length] || "";
    return `${context}${originalSituation}`;
  }

  /**
   * Create a complex scenario with interconnected decision points
   * @param {Array} biasTypes - Types of biases to include
   * @param {number} complexityLevel - How complex the scenario should be (1-5)
   * @returns {Object} Complex interconnected scenario
   */
  generateComplexInterconnectedScenario(biasTypes = null, complexityLevel = 3) {
    // If no bias types specified, randomly select some
    const selectedBiases = biasTypes || this.getRandomElements(
      this.biasCombinations.map(c => c.name), 
      Math.floor(Math.random() * 3) + 2
    );
    
    // Create interconnected decision points where early decisions affect later ones
    const decisionPoints = [];
    const totalDecisions = Math.min(complexityLevel * 2, 6); // Max 6 decisions
    
    for (let i = 0; i < totalDecisions; i++) {
      const biasForThisStep = selectedBiases[i % selectedBiases.length];
      const decisionPoint = this.createInterconnectedDecision(i, biasForThisStep, decisionPoints);
      decisionPoints.push(decisionPoint);
    }
    
    return {
      id: `interconnected-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: `相互关联的复合偏误挑战`,
      description: `包含${selectedBiases.join(', ')}的相互关联决策场景`,
      biasCombinations: selectedBiases,
      complexityLevel,
      setup: `这是一个复杂相互关联的决策场景，每个决策都会影响后续选项和结果。`,
      decisionPoints,
      interconnected: true
    };
  }

  /**
   * Create an interconnected decision point
   * @private
   */
  createInterconnectedDecision(stepIndex, biasType, previousDecisions) {
    const situations = {
      "Confirmation + Anchoring": [
        "你之前的决策确认了某个初始判断，现在面对新信息，你倾向于...",
        "早期获得的信息成为你的决策锚点，当相反证据出现时...",
        "你倾向于寻找支持前期决策的新信息..."
      ],
      "Overconfidence + Availability Heuristic": [
        "基于过去的成功经验，你对自己的判断非常有信心...",
        "最近发生的显著事件影响了你对风险的评估...",
        "你高估了自己处理复杂情况的能力..."
      ],
      "Groupthink + Authority Bias": [
        "团队共识与上级意见一致，但你有不同看法...",
        "权威人士的观点与团队倾向相符，但存在潜在风险...",
        "在团队压力和权威影响下，你如何处理不同意见..."
      ]
    };
    
    const options = [
      [
        "坚持原决策，认为自己判断正确",
        "重新评估，考虑新信息的影响", 
        "寻求更多信息来验证判断"
      ],
      [
        "挑战团队共识，表达不同意见",
        "遵循团队决策，保持和谐",
        "向上级寻求指导"
      ],
      [
        "信任自己的经验，快速决策",
        "谨慎行事，进行详细分析",
        "咨询他人意见"
      ]
    ];
    
    const explanations = [
      "确认偏误让你寻找支持既有观点的信息，锚定效应使你难以改变初始判断。",
      "过度自信让你高估自己的能力，可得性启发让你过分依赖特定经验。",
      "群体思维压制异议，权威偏误让你倾向于服从等级制度。"
    ];
    
    const situationList = situations[biasType] || situations["Confirmation + Anchoring"];
    const optionList = this.getRandomElement(options);
    const explanation = this.getRandomElement(explanations);
    
    return {
      step: stepIndex,
      situation: this.getRandomElement(situationList),
      options: optionList,
      explanation: explanation,
      biasType: biasType,
      dependentOnPrevious: stepIndex > 0, // This decision depends on previous ones
      previousDecisionsImpact: previousDecisions.map((d, idx) => ({
        step: idx,
        decisionInfluence: "moderate" // How much the previous decision affects this one
      }))
    };
  }
}

  /**
   * Create adaptive challenge based on user profile
   * @param {Object} userProfile - User's background and preferences
   * @returns {Object} Personalized cross-domain challenge
   */
  generateAdaptiveChallenge(userProfile) {
    // Determine user's comfort zones and challenge areas
    const { experienceDomains = [], preferredDifficulty = 'medium' } = userProfile || {};
    
    // Find bias combinations that would be most challenging for this user
    let candidateCombos = [...this.biasCombinations];
    
    // Adjust difficulty based on user preference
    const adjustedScenarios = candidateCombos.flatMap(combo => 
      combo.scenarios.map(scenario => ({
        ...scenario,
        difficulty: this.calculateDifficulty(scenario, preferredDifficulty)
      }))
    );
    
    // Select a scenario that challenges the user appropriately
    const selectedScenario = adjustedScenarios[
      Math.floor(Math.random() * adjustedScenarios.length)
    ];
    
    const selectedCombo = this.biasCombinations.find(
      combo => combo.scenarios.some(s => s.title === selectedScenario.title)
    );
    
    return {
      id: `adaptive-${Date.now()}`,
      title: selectedScenario.title,
      description: selectedCombo.description,
      biasCombination: selectedCombo.name,
      domain: selectedScenario.domain,
      setup: selectedScenario.setup,
      decisionPoints: this.adjustScenarioForUser(selectedScenario, userProfile),
      difficulty: preferredDifficulty,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate difficulty level for a scenario
   * @private
   */
  calculateDifficulty(scenario, preferredDifficulty) {
    // Base difficulty on number of decision points and complexity
    const baseComplexity = scenario.decisionPoints.length * 2;
    
    switch(preferredDifficulty) {
      case 'easy':
        return Math.max(1, baseComplexity - 1);
      case 'hard':
        return baseComplexity + 2;
      default:
        return baseComplexity;
    }
  }

  /**
   * Adjust scenario based on user profile
   * @private
   */
  adjustScenarioForUser(scenario, userProfile) {
    // In a real implementation, this would customize the scenario
    // based on user experience, learning goals, etc.
    return scenario.decisionPoints;
  }

  /**
   * Create difficulty scaling system for complex scenarios
   * @param {number} baseDifficulty - Base difficulty level (1-10)
   * @param {number} complexityFactor - Factor to increase complexity (0-5)
   * @param {number} interconnectionLevel - Level of interconnection between decisions (0-3)
   * @returns {Object} Scaled scenario parameters
   */
  scaleDifficulty(baseDifficulty = 5, complexityFactor = 2, interconnectionLevel = 1) {
    // Normalize inputs
    const normalizedBase = Math.max(1, Math.min(10, baseDifficulty));
    const normalizedComplexity = Math.max(0, Math.min(5, complexityFactor));
    const normalizedConnection = Math.max(0, Math.min(3, interconnectionLevel));
    
    // Calculate scaled parameters
    const decisionCount = Math.max(2, Math.floor(normalizedBase / 2) + normalizedComplexity);
    const biasCount = Math.max(1, Math.min(3, Math.floor(normalizedBase / 3) + Math.floor(normalizedComplexity / 2)));
    const interconnectionDepth = Math.min(normalizedConnection, decisionCount - 1);
    
    // Create difficulty profile
    const difficultyProfile = {
      level: this.calculateOverallDifficulty(normalizedBase, normalizedComplexity, normalizedConnection),
      decisionCount,
      biasCount,
      interconnectionDepth,
      complexityScore: (normalizedBase + normalizedComplexity * 2 + normalizedConnection * 3) / 3,
      challengeFactors: {
        cognitiveLoad: this.calculateCognitiveLoad(biasCount, interconnectionDepth),
        decisionDensity: decisionCount / (normalizedBase / 2),
        interdependencyLevel: interconnectionDepth / decisionCount
      }
    };
    
    return difficultyProfile;
  }

  /**
   * Calculate overall difficulty level
   * @private
   */
  calculateOverallDifficulty(base, complexity, connection) {
    // Weighted calculation with emphasis on complexity and interconnection
    const weightedScore = (base * 0.4) + (complexity * 0.4) + (connection * 0.2);
    
    if (weightedScore <= 2) return 'very_easy';
    if (weightedScore <= 4) return 'easy';
    if (weightedScore <= 6) return 'medium';
    if (weightedScore <= 8) return 'hard';
    return 'very_hard';
  }

  /**
   * Calculate cognitive load based on scenario parameters
   * @private
   */
  calculateCognitiveLoad(biasCount, interconnectionDepth) {
    // Higher cognitive load with more biases and deeper interconnections
    return Math.min(10, biasCount * 2 + interconnectionDepth * 1.5);
  }

  /**
   * Generate a scenario with specified difficulty level
   * @param {string} difficultyLevel - One of: 'very_easy', 'easy', 'medium', 'hard', 'very_hard'
   * @param {Object} options - Additional options for scenario generation
   * @returns {Object} Difficulty-appropriate scenario
   */
  generateScenarioByDifficulty(difficultyLevel = 'medium', options = {}) {
    const difficultySettings = this.getDifficultySettings(difficultyLevel);
    
    // Generate a base scenario
    const baseScenario = this.generateCrossDomainChallenge();
    
    // Scale the scenario based on difficulty
    const scaledScenario = this.scaleScenario(baseScenario, difficultySettings);
    
    // Add difficulty metadata
    scaledScenario.difficulty = difficultyLevel;
    scaledScenario.difficultyParameters = difficultySettings;
    
    return scaledScenario;
  }

  /**
   * Get settings for a specific difficulty level
   * @private
   */
  getDifficultySettings(difficultyLevel) {
    const settings = {
      'very_easy': { 
        baseDifficulty: 2, 
        complexityFactor: 0, 
        interconnectionLevel: 0,
        decisionPointsMultiplier: 0.5,
        biasCombinations: 1,
        explanationDepth: 'basic'
      },
      'easy': { 
        baseDifficulty: 4, 
        complexityFactor: 1, 
        interconnectionLevel: 0,
        decisionPointsMultiplier: 0.75,
        biasCombinations: 1,
        explanationDepth: 'moderate'
      },
      'medium': { 
        baseDifficulty: 6, 
        complexityFactor: 2, 
        interconnectionLevel: 1,
        decisionPointsMultiplier: 1,
        biasCombinations: 2,
        explanationDepth: 'detailed'
      },
      'hard': { 
        baseDifficulty: 8, 
        complexityFactor: 3, 
        interconnectionLevel: 2,
        decisionPointsMultiplier: 1.5,
        biasCombinations: 2,
        explanationDepth: 'comprehensive'
      },
      'very_hard': { 
        baseDifficulty: 10, 
        complexityFactor: 4, 
        interconnectionLevel: 3,
        decisionPointsMultiplier: 2,
        biasCombinations: 3,
        explanationDepth: 'expert'
      }
    };
    
    return settings[difficultyLevel] || settings.medium;
  }

  /**
   * Scale a scenario based on difficulty parameters
   * @private
   */
  scaleScenario(scenario, difficultySettings) {
    // Adjust decision points based on multiplier
    const scaledDecisionPoints = this.scaleDecisionPoints(
      scenario.decisionPoints, 
      difficultySettings.decisionPointsMultiplier
    );
    
    // Enhance explanations based on depth
    const enhancedDecisionPoints = this.enhanceExplanations(
      scaledDecisionPoints,
      difficultySettings.explanationDepth
    );
    
    // Create the scaled scenario
    const scaledScenario = {
      ...scenario,
      decisionPoints: enhancedDecisionPoints,
      difficultySettings: difficultySettings,
      estimatedCompletionTime: this.estimateCompletionTime(enhancedDecisionPoints, difficultySettings)
    };
    
    return scaledScenario;
  }

  /**
   * Scale decision points based on multiplier
   * @private
   */
  scaleDecisionPoints(decisionPoints, multiplier) {
    // Adjust the number of decision points based on multiplier
    const targetCount = Math.max(1, Math.round(decisionPoints.length * multiplier));
    
    if (targetCount <= decisionPoints.length) {
      // Reduce points if multiplier < 1
      return decisionPoints.slice(0, targetCount);
    } else {
      // Expand points if multiplier > 1 by adding variations
      const expandedPoints = [...decisionPoints];
      
      while (expandedPoints.length < targetCount) {
        // Add variations of existing points
        const originalIndex = (expandedPoints.length - decisionPoints.length) % decisionPoints.length;
        const originalPoint = decisionPoints[originalIndex];
        
        expandedPoints.push({
          ...originalPoint,
          situation: this.createVariation(originalPoint.situation, expandedPoints.length),
          step: expandedPoints.length
        });
      }
      
      return expandedPoints;
    }
  }

  /**
   * Create variation of a situation
   * @private
   */
  createVariation(originalSituation, stepNumber) {
    const variations = [
      `在先前决策的基础上，现在你面临新的挑战：${originalSituation}`,
      `情况有所演变：${originalSituation}，但现在出现了新的变数。`,
      `随着事态发展，你注意到：${originalSituation}，这需要你重新评估。`,
      `环境变化导致：${originalSituation}，你需要调整策略。`
    ];
    
    return variations[stepNumber % variations.length];
  }

  /**
   * Enhance explanations based on depth level
   * @private
   */
  enhanceExplanations(decisionPoints, explanationDepth) {
    const enhancedPoints = decisionPoints.map(point => {
      let enhancedExplanation = point.explanation || '';
      
      switch (explanationDepth) {
        case 'basic':
          // Keep original explanation
          break;
        case 'moderate':
          enhancedExplanation = `${point.explanation} 这种偏误在现实场景中经常导致不良决策。`;
          break;
        case 'detailed':
          enhancedExplanation = `${point.explanation} 这种偏误在现实场景中经常导致不良决策。它会影响我们对信息的处理和判断的准确性。`;
          break;
        case 'comprehensive':
          enhancedExplanation = `${point.explanation} 这种偏误在现实场景中经常导致不良决策。它会影响我们对信息的处理和判断的准确性。为了避免这种偏误，我们需要采取以下策略：暂停决策、寻求不同观点、检查证据质量。`;
          break;
        case 'expert':
          enhancedExplanation = `${point.explanation} 这种偏误在现实场景中经常导致不良决策。它会影响我们对信息的处理和判断的准确性。研究表明，这种偏误与大脑的快速处理机制有关。为了避免这种偏误，我们需要采取以下策略：暂停决策、寻求不同观点、检查证据质量、使用决策清单、寻求外部验证。`;
          break;
      }
      
      return {
        ...point,
        explanation: enhancedExplanation,
        explanationDepth: explanationDepth
      };
    });
    
    return enhancedPoints;
  }

  /**
   * Estimate completion time based on scenario parameters
   * @private
   */
  estimateCompletionTime(decisionPoints, difficultySettings) {
    // Base time per decision point
    const baseTimePerDecision = 60; // seconds
    
    // Adjustment factors
    const complexityAdjustment = difficultySettings.decisionPointsMultiplier;
    const explanationAdjustment = {
      'basic': 0.7,
      'moderate': 1,
      'detailed': 1.2,
      'comprehensive': 1.5,
      'expert': 1.8
    }[difficultySettings.explanationDepth] || 1;
    
    // Calculate estimated time
    const estimatedSeconds = decisionPoints.length * baseTimePerDecision * 
                            complexityAdjustment * explanationAdjustment;
    
    return {
      seconds: estimatedSeconds,
      minutes: Math.round(estimatedSeconds / 60),
      difficultyAdjustedMinutes: Math.round(estimatedSeconds / 60)
    };
  }

  /**
   * Create progressive difficulty sequence
   * @param {string} startLevel - Starting difficulty level
   * @param {number} sequenceLength - Number of scenarios in sequence
   * @returns {Array} Progressive difficulty sequence
   */
  createProgressiveSequence(startLevel = 'medium', sequenceLength = 5) {
    const levels = ['very_easy', 'easy', 'medium', 'hard', 'very_hard'];
    const startIndex = levels.indexOf(startLevel);
    const sequence = [];
    
    for (let i = 0; i < sequenceLength; i++) {
      const levelIndex = Math.min(levels.length - 1, Math.max(0, startIndex + Math.floor(i / 2)));
      const difficultyLevel = levels[levelIndex];
      
      sequence.push({
        index: i,
        difficultyLevel,
        scenario: this.generateScenarioByDifficulty(difficultyLevel, { sequencePosition: i })
      });
    }
    
    return sequence;
  }

  /**
   * Adjust challenges based on user performance
   * @param {Object} userPerformance - User's performance data
   * @param {Object} currentScenario - Current scenario to adjust
   * @returns {Object} Adjusted scenario based on performance
   */
  adjustChallengeForPerformance(userPerformance, currentScenario) {
    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(userPerformance);
    
    // Determine adjustment needed based on performance
    const adjustment = this.determineAdjustment(performanceMetrics);
    
    // Apply adjustments to the scenario
    const adjustedScenario = this.applyPerformanceAdjustments(
      currentScenario, 
      adjustment, 
      performanceMetrics
    );
    
    return {
      ...adjustedScenario,
      adaptationDetails: {
        originalPerformance: performanceMetrics,
        appliedAdjustment: adjustment,
        adjustmentReasoning: this.createAdjustmentReasoning(adjustment, performanceMetrics)
      }
    };
  }

  /**
   * Calculate performance metrics from user data
   * @private
   */
  calculatePerformanceMetrics(userPerformance) {
    const {
      completedScenarios = [],
      accuracyRate = 0,
      responseTime = 0,
      decisionQuality = 0,
      biasRecognitionScore = 0,
      learningRate = 0
    } = userPerformance;

    // Calculate various performance indicators
    const metrics = {
      overallAccuracy: accuracyRate,
      avgResponseTime: responseTime,
      decisionQuality: decisionQuality,
      biasRecognition: biasRecognitionScore,
      learningProgress: learningRate,
      experienceLevel: completedScenarios.length,
      
      // Calculate trend indicators
      improvementTrend: this.calculateImprovementTrend(completedScenarios),
      consistency: this.calculateConsistency(completedScenarios),
      
      // Identify strengths and weaknesses
      strengths: this.identifyStrengths(userPerformance),
      weaknesses: this.identifyWeaknesses(userPerformance),
      
      // Determine appropriate challenge level
      recommendedLevel: this.determineRecommendedLevel(userPerformance)
    };

    return metrics;
  }

  /**
   * Calculate improvement trend
   * @private
   */
  calculateImprovementTrend(completedScenarios) {
    if (completedScenarios.length < 2) {
      return 'insufficient_data';
    }

    const recentScores = completedScenarios.slice(-5).map(s => s.score || s.accuracy || 0);
    if (recentScores.length < 2) {
      return 'insufficient_data';
    }

    const firstScore = recentScores[0];
    const lastScore = recentScores[recentScores.length - 1];
    const trend = ((lastScore - firstScore) / firstScore) * 100;

    if (trend > 10) return 'improving_rapidly';
    if (trend > 5) return 'improving';
    if (trend > -5) return 'stable';
    if (trend > -15) return 'declining';
    return 'declining_significantly';
  }

  /**
   * Calculate consistency metric
   * @private
   */
  calculateConsistency(completedScenarios) {
    if (completedScenarios.length < 3) {
      return 'insufficient_data';
    }

    const scores = completedScenarios.map(s => s.score || s.accuracy || 0);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

    if (coefficientOfVariation < 0.1) return 'very_consistent';
    if (coefficientOfVariation < 0.2) return 'consistent';
    if (coefficientOfVariation < 0.3) return 'moderately_consistent';
    if (coefficientOfVariation < 0.5) return 'inconsistent';
    return 'highly_inconsistent';
  }

  /**
   * Identify user strengths
   * @private
   */
  identifyStrengths(userPerformance) {
    const strengths = [];
    const { biasRecognitionScore, decisionQuality, responseTime } = userPerformance;

    if (biasRecognitionScore > 0.8) strengths.push('bias_recognition');
    if (decisionQuality > 0.7) strengths.push('decision_making');
    if (responseTime < 45) strengths.push('quick_thinking'); // Less than 45 seconds average

    return strengths.length > 0 ? strengths : ['potential_undiscovered'];
  }

  /**
   * Identify user weaknesses
   * @private
   */
  identifyWeaknesses(userPerformance) {
    const weaknesses = [];
    const { biasRecognitionScore, decisionQuality, responseTime } = userPerformance;

    if (biasRecognitionScore < 0.5) weaknesses.push('bias_recognition');
    if (decisionQuality < 0.5) weaknesses.push('decision_making');
    if (responseTime > 90) weaknesses.push('analysis_speed'); // More than 90 seconds average

    return weaknesses.length > 0 ? weaknesses : ['none_identified'];
  }

  /**
   * Determine recommended difficulty level
   * @private
   */
  determineRecommendedLevel(userPerformance) {
    const { accuracyRate = 0.5, learningRate = 0.5 } = userPerformance;
    
    // Use both accuracy and learning rate to determine level
    const compositeScore = (accuracyRate + learningRate) / 2;
    
    if (compositeScore >= 0.85) return 'very_hard';
    if (compositeScore >= 0.7) return 'hard';
    if (compositeScore >= 0.55) return 'medium';
    if (compositeScore >= 0.4) return 'easy';
    return 'very_easy';
  }

  /**
   * Determine what adjustments to make based on performance
   * @private
   */
  determineAdjustment(performanceMetrics) {
    const adjustment = {
      difficultyAdjustment: 0, // -2 to 2 scale
      cognitiveLoadAdjustment: 0, // -1 to 1 scale
      timePressureAdjustment: 0, // -1 to 1 scale
      feedbackFrequencyAdjustment: 0, // -1 to 1 scale
      biasTypeFocus: null, // Specific bias to focus on
      challengeFocus: null // Specific aspect to challenge
    };

    // Adjust based on overall performance
    if (performanceMetrics.overallAccuracy > 0.8) {
      adjustment.difficultyAdjustment = 1; // Increase difficulty
      adjustment.cognitiveLoadAdjustment = 0.5;
    } else if (performanceMetrics.overallAccuracy < 0.4) {
      adjustment.difficultyAdjustment = -1; // Decrease difficulty
      adjustment.cognitiveLoadAdjustment = -0.5;
    }

    // Adjust based on learning trend
    if (performanceMetrics.improvementTrend === 'improving_rapidly') {
      adjustment.difficultyAdjustment += 0.5;
    } else if (performanceMetrics.improvementTrend === 'declining') {
      adjustment.difficultyAdjustment -= 0.5;
    }

    // Adjust based on consistency
    if (performanceMetrics.consistency === 'highly_inconsistent') {
      adjustment.timePressureAdjustment = -0.5; // Reduce time pressure
      adjustment.feedbackFrequencyAdjustment = 0.5; // Increase feedback
    }

    // Focus on weaknesses
    if (performanceMetrics.weaknesses.includes('bias_recognition')) {
      adjustment.biasTypeFocus = 'recognition';
      adjustment.challengeFocus = 'identification';
    } else if (performanceMetrics.weaknesses.includes('decision_making')) {
      adjustment.challengeFocus = 'evaluation';
    }

    return adjustment;
  }

  /**
   * Apply performance-based adjustments to a scenario
   * @private
   */
  applyPerformanceAdjustments(scenario, adjustment, performanceMetrics) {
    // Clone the scenario to avoid modifying the original
    const adjustedScenario = JSON.parse(JSON.stringify(scenario));

    // Adjust difficulty based on performance
    const difficultyLevels = ['very_easy', 'easy', 'medium', 'hard', 'very_hard'];
    const currentIndex = difficultyLevels.indexOf(adjustedScenario.difficulty || 'medium');
    const newIndex = Math.max(0, Math.min(difficultyLevels.length - 1, 
      currentIndex + adjustment.difficultyAdjustment));
    
    adjustedScenario.adaptedDifficulty = difficultyLevels[newIndex];
    adjustedScenario.performanceAdjustment = adjustment;

    // Adjust cognitive load
    if (adjustment.cognitiveLoadAdjustment !== 0) {
      adjustedScenario.cognitiveLoad = (adjustedScenario.cognitiveLoad || 5) + 
                                      (adjustment.cognitiveLoadAdjustment * 2);
    }

    // Add specific focus based on weaknesses
    if (adjustment.biasTypeFocus) {
      adjustedScenario.focusArea = adjustment.biasTypeFocus;
      adjustedScenario.personalizedFor = performanceMetrics.weaknesses;
    }

    // Modify decision points if needed
    if (adjustment.challengeFocus === 'identification') {
      adjustedScenario.decisionPoints = adjustedScenario.decisionPoints.map(point => ({
        ...point,
        emphasizeBiasRecognition: true
      }));
    }

    return adjustedScenario;
  }

  /**
   * Create reasoning for why adjustments were made
   * @private
   */
  createAdjustmentReasoning(adjustment, performanceMetrics) {
    const reasons = [];

    if (adjustment.difficultyAdjustment > 0) {
      reasons.push(`用户表现优异（准确率${(performanceMetrics.overallAccuracy * 100).toFixed(0)}%），需要更高挑战`);
    } else if (adjustment.difficultyAdjustment < 0) {
      reasons.push(`用户需要巩固基础，降低难度`);
    }

    if (performanceMetrics.improvementTrend === 'improving_rapidly') {
      reasons.push(`学习曲线陡峭，可以加快进度`);
    } else if (performanceMetrics.improvementTrend === 'declining') {
      reasons.push(`需要放慢节奏，加强基础`);
    }

    if (performanceMetrics.weaknesses.length > 0) {
      reasons.push(`针对薄弱环节进行强化：${performanceMetrics.weaknesses.join(', ')}`);
    }

    return reasons.join('; ');
  }

  /**
   * Create personalized learning path based on user profile and performance
   * @param {Object} userProfile - User's profile and preferences
   * @param {Object} performanceData - User's performance history
   * @returns {Object} Personalized learning path
   */
  createPersonalizedLearningPath(userProfile, performanceData) {
    const path = {
      userId: userProfile.id || 'anonymous',
      currentLevel: this.determineRecommendedLevel(performanceData),
      focusAreas: [...performanceData.weaknesses || [], ...performanceData.strengths || []],
      recommendedScenarios: [],
      learningGoals: [],
      estimatedTimeline: 'flexible',
      adaptationStrategy: 'dynamic'
    };

    // Generate scenarios tailored to user's needs
    const numScenarios = Math.min(10, Math.max(3, 5 - performanceData.weaknesses.length));
    
    for (let i = 0; i < numScenarios; i++) {
      const scenario = this.generateScenarioByDifficulty(path.currentLevel, {
        userPreferences: userProfile.preferences,
        focusAreas: path.focusAreas,
        sequencePosition: i
      });
      
      // Adjust each scenario based on performance
      const adjustedScenario = this.adjustChallengeForPerformance(performanceData, scenario);
      path.recommendedScenarios.push(adjustedScenario);
    }

    // Set learning goals based on focus areas
    path.learningGoals = this.createLearningGoals(path.focusAreas, performanceData);

    return path;
  }

  /**
   * Create learning goals based on focus areas
   * @private
   */
  createLearningGoals(focusAreas, performanceData) {
    const goals = [];

    if (focusAreas.includes('bias_recognition')) {
      goals.push({
        id: 'bias-recognition-improvement',
        title: '提升认知偏误识别能力',
        target: '将偏误识别准确率提升至75%',
        timeline: '2-3周',
        activities: ['更多识别练习', '案例分析', '反思日志']
      });
    }

    if (focusAreas.includes('decision_making')) {
      goals.push({
        id: 'decision-quality-improvement',
        title: '提升决策质量',
        target: '将决策质量评分提升至70%',
        timeline: '3-4周',
        activities: ['决策框架练习', '后果分析', '多角度思考']
      });
    }

    if (goals.length === 0) {
      goals.push({
        id: 'general-improvement',
        title: '全面提升认知能力',
        target: '综合能力提升20%',
        timeline: '4-6周',
        activities: ['多样化练习', '定期评估', '同伴学习']
      });
    }

    return goals;
  }

  /**
   * Update user profile based on performance
   * @param {Object} userProfile - Current user profile
   * @param {Object} performanceUpdate - New performance data
   * @returns {Object} Updated user profile
   */
  updateUserProfile(userProfile, performanceUpdate) {
    const updatedProfile = { ...userProfile };
    
    // Update experience and skill levels
    updatedProfile.experienceLevel = updatedProfile.experienceLevel || 0;
    updatedProfile.experienceLevel += 1;
    
    // Update preferred difficulty based on successful challenges
    if (performanceUpdate.successfulCompletions && performanceUpdate.successfulCompletions.length > 0) {
      const avgDifficulty = performanceUpdate.successfulCompletions.reduce(
        (sum, sc) => sum + this.difficultyToNumeric(sc.difficulty), 0
      ) / performanceUpdate.successfulCompletions.length;
      
      updatedProfile.preferredDifficulty = this.numericToDifficulty(avgDifficulty);
    }
    
    // Update bias awareness profile
    updatedProfile.biasAwarenessProfile = this.updateBiasProfile(
      updatedProfile.biasAwarenessProfile || {},
      performanceUpdate
    );
    
    // Update learning preferences
    updatedProfile.learningPreferences = this.updateLearningPreferences(
      updatedProfile.learningPreferences || {},
      performanceUpdate
    );
    
    return updatedProfile;
  }

  /**
   * Convert difficulty level to numeric value
   * @private
   */
  difficultyToNumeric(level) {
    const mapping = {
      'very_easy': 1,
      'easy': 2,
      'medium': 3,
      'hard': 4,
      'very_hard': 5
    };
    return mapping[level] || 3;
  }

  /**
   * Convert numeric value to difficulty level
   * @private
   */
  numericToDifficulty(numeric) {
    const levels = ['very_easy', 'easy', 'medium', 'hard', 'very_hard'];
    return levels[Math.min(4, Math.max(0, Math.floor(numeric - 1)))];
  }

  /**
   * Update bias awareness profile
   * @private
   */
  updateBiasProfile(currentProfile, performanceUpdate) {
    const updatedProfile = { ...currentProfile };
    
    // Update scores for each bias type based on performance
    const biasPerformance = performanceUpdate.biasPerformance || {};
    
    for (const [biasType, score] of Object.entries(biasPerformance)) {
      updatedProfile[biasType] = {
        score: score,
        lastUpdated: new Date().toISOString(),
        improvement: score - (updatedProfile[biasType]?.score || 0)
      };
    }
    
    return updatedProfile;
  }

  /**
   * Update learning preferences
   * @private
   */
  updateLearningPreferences(currentPreferences, performanceUpdate) {
    const updatedPreferences = { ...currentPreferences };
    
    // Update preferences based on what worked well
    if (performanceUpdate.effectiveTechniques) {
      updatedPreferences.effectiveMethods = performanceUpdate.effectiveTechniques;
    }
    
    if (performanceUpdate.challengingAreas) {
      updatedPreferences.focusAreas = performanceUpdate.challengingAreas;
    }
    
    // Update preferred session length based on engagement
    updatedPreferences.optimalSessionLength = performanceUpdate.optimalSessionLength || 25; // minutes
    
    return updatedPreferences;
  }

  /**
   * Generate emotional engagement elements for a scenario
   * @param {Object} scenario - The scenario to add emotional elements to
   * @param {Object} options - Options for emotional engagement
   * @returns {Object} Scenario with emotional engagement elements
   */
  addEmotionalEngagement(scenario, options = {}) {
    const {
      intensityLevel = 'medium',
      personalStakes = true,
      timePressure = true,
      socialDynamics = true
    } = options;
    
    const emotionalScenario = { ...scenario };
    
    // Add emotional engagement metrics
    emotionalScenario.emotionalEngagement = {
      intensity: this.mapIntensityLevel(intensityLevel),
      personalRelevance: personalStakes ? 0.8 : 0.3,
      urgencyFactor: timePressure ? this.calculateUrgencyFactor(scenario) : 0.2,
      socialComplexity: socialDynamics ? 0.7 : 0.3,
      overallEngagement: 0
    };
    
    // Calculate overall engagement score
    emotionalScenario.emotionalEngagement.overallEngagement = 
      (emotionalScenario.emotionalEngagement.intensity +
       emotionalScenario.emotionalEngagement.personalRelevance +
       emotionalScenario.emotionalEngagement.urgencyFactor +
       emotionalScenario.emotionalEngagement.socialComplexity) / 4;
    
    // Enhance decision points with emotional elements
    emotionalScenario.decisionPoints = emotionalScenario.decisionPoints.map((point, index) => ({
      ...point,
      emotionalTriggers: this.generateEmotionalTriggers(intensityLevel),
      stakesDescription: this.generateStakesDescription(personalStakes, index),
      timePressure: timePressure ? this.generateTimePressureElement() : null,
      socialDynamics: socialDynamics ? this.generateSocialDynamicsElement() : null,
      emotionalImpact: this.calculateEmotionalImpact(point, emotionalScenario.emotionalEngagement)
    }));
    
    // Add emotional reflection prompts
    emotionalScenario.emotionalReflectionPrompts = this.generateReflectionPrompts(
      emotionalScenario.emotionalEngagement
    );
    
    // Add emotional learning objectives
    emotionalScenario.emotionalLearningObjectives = this.generateEmotionalLearningObjectives(
      emotionalScenario.emotionalEngagement
    );
    
    return emotionalScenario;
  }

  /**
   * Map intensity level to numerical value
   * @private
   */
  mapIntensityLevel(level) {
    const mapping = {
      'low': 0.3,
      'medium': 0.6,
      'high': 0.8,
      'very_high': 1.0
    };
    
    return mapping[level] || mapping.medium;
  }

  /**
   * Generate emotional triggers based on intensity level
   * @private
   */
  generateEmotionalTriggers(intensityLevel) {
    const triggers = {
      'low': ['consider', 'think about', 'evaluate'],
      'medium': ['carefully consider', 'weigh carefully', 'think through'],
      'high': ['critically assess', 'seriously consider', 'thoroughly evaluate'],
      'very_high': ['urgently address', 'immediately consider', 'critically decide']
    };
    
    const selectedTriggers = triggers[intensityLevel] || triggers.medium;
    
    return [
      {
        type: 'urgency',
        trigger: this.getRandomElement(selectedTriggers),
        intensity: this.mapIntensityLevel(intensityLevel)
      },
      {
        type: 'importance',
        trigger: 'This decision significantly impacts',
        intensity: this.mapIntensityLevel(intensityLevel) * 0.8
      },
      {
        type: 'consequence',
        trigger: 'The consequences of this choice will affect',
        intensity: this.mapIntensityLevel(intensityLevel) * 0.9
      }
    ];
  }

  /**
   * Generate stakes description based on personal relevance
   * @private
   */
  generateStakesDescription(personalStakes, decisionIndex) {
    if (!personalStakes) {
      return "This decision has professional implications.";
    }
    
    const personalStakesDescriptions = [
      `This decision could significantly impact your career and reputation.`,
      `Your personal relationships and professional standing are at stake.`,
      `The outcome of this decision will have lasting effects on your life and others.`,
      `This choice represents a critical moment that could define your future direction.`,
      `Your values and principles are being tested by this decision.`,
      `The consequences of this choice will ripple through multiple aspects of your life.`
    ];
    
    return personalStakesDescriptions[decisionIndex % personalStakesDescriptions.length];
  }

  /**
   * Generate time pressure element
   * @private
   */
  generateTimePressureElement() {
    const timePressures = [
      { type: 'deadline', description: 'There is a tight deadline approaching.', factor: 0.7 },
      { type: 'competition', description: 'Competitors are moving quickly.', factor: 0.6 },
      { type: 'opportunity', description: 'This opportunity may not last long.', factor: 0.8 },
      { type: 'crisis', description: 'A developing crisis requires immediate action.', factor: 0.9 },
      { type: 'market', description: 'Market conditions are changing rapidly.', factor: 0.7 }
    ];
    
    return this.getRandomElement(timePressures);
  }

  /**
   * Generate social dynamics element
   * @private
   */
  generateSocialDynamicsElement() {
    const socialDynamics = [
      { 
        type: 'team', 
        description: 'Your team members have differing opinions on this matter.',
        complexity: 0.6 
      },
      { 
        type: 'stakeholders', 
        description: 'Multiple stakeholders with conflicting interests are involved.',
        complexity: 0.7 
      },
      { 
        type: 'authority', 
        description: 'Senior leadership has strong views on the desired outcome.',
        complexity: 0.8 
      },
      { 
        type: 'culture', 
        description: 'Organizational culture influences expectations about this decision.',
        complexity: 0.5 
      },
      { 
        type: 'relationships', 
        description: 'Personal relationships may be affected by your choice.',
        complexity: 0.7 
      }
    ];
    
    return this.getRandomElement(socialDynamics);
  }

  /**
   * Calculate emotional impact for a decision point
   * @private
   */
  calculateEmotionalImpact(decisionPoint, engagementMetrics) {
    // Base impact on the nature of the decision
    const baseImpact = decisionPoint.options.length > 2 ? 0.6 : 0.4;
    
    // Factor in engagement metrics
    const personalFactor = engagementMetrics.personalRelevance;
    const urgencyFactor = engagementMetrics.urgencyFactor;
    const socialFactor = engagementMetrics.socialComplexity;
    
    const totalImpact = (baseImpact + personalFactor + urgencyFactor + socialFactor) / 4;
    
    return {
      score: totalImpact,
      categories: this.categorizeEmotionalImpact(totalImpact),
      impactDescription: this.describeEmotionalImpact(totalImpact)
    };
  }

  /**
   * Categorize emotional impact level
   * @private
   */
  categorizeEmotionalImpact(score) {
    if (score >= 0.8) return ['high', 'intense', 'critical'];
    if (score >= 0.6) return ['moderate', 'significant', 'meaningful'];
    if (score >= 0.4) return ['low', 'minimal', 'routine'];
    return ['very_low', 'negligible', 'trivial'];
  }

  /**
   * Describe emotional impact
   * @private
   */
  describeEmotionalImpact(score) {
    if (score >= 0.8) {
      return "This decision carries significant emotional weight and will likely evoke strong feelings regardless of the choice made.";
    } else if (score >= 0.6) {
      return "This decision has meaningful implications that may affect your emotional state and confidence.";
    } else if (score >= 0.4) {
      return "This decision has moderate importance but shouldn't cause significant emotional stress.";
    } else {
      return "This decision is relatively routine and shouldn't evoke strong emotions.";
    }
  }

  /**
   * Generate emotional reflection prompts
   * @private
   */
  generateReflectionPrompts(engagementMetrics) {
    const prompts = [];
    
    if (engagementMetrics.personalRelevance > 0.5) {
      prompts.push({
        category: 'personal_impact',
        prompt: 'How does this decision align with your personal values and long-term goals?',
        depth: 'deep'
      });
    }
    
    if (engagementMetrics.urgencyFactor > 0.5) {
      prompts.push({
        category: 'time_pressure',
        prompt: 'How did time constraints affect the quality of your decision-making process?',
        depth: 'analytical'
      });
    }
    
    if (engagementMetrics.socialComplexity > 0.5) {
      prompts.push({
        category: 'social_dynamics',
        prompt: 'How did interpersonal factors influence your decision, and were these influences appropriate?',
        depth: 'interpersonal'
      });
    }
    
    prompts.push({
      category: 'cognitive_emotional_integration',
      prompt: 'How did your emotional state interact with your cognitive evaluation of the options?',
      depth: 'integrative'
    });
    
    return prompts;
  }

  /**
   * Generate emotional learning objectives
   * @private
   */
  generateEmotionalLearningObjectives(engagementMetrics) {
    const objectives = [];
    
    if (engagementMetrics.overallEngagement > 0.5) {
      objectives.push({
        skill: 'emotional_self_regulation',
        objective: 'Develop better awareness of how emotions influence decision-making',
        target: 'Recognize emotional triggers in high-stakes decisions'
      });
      
      objectives.push({
        skill: 'cognitive_bias_awareness',
        objective: 'Understand the interaction between emotional states and cognitive biases',
        target: 'Identify when emotions amplify specific biases'
      });
      
      objectives.push({
        skill: 'stress_informed_decision_making',
        objective: 'Make better decisions under emotional pressure',
        target: 'Maintain analytical thinking when emotionally engaged'
      });
    }
    
    return objectives;
  }

  /**
   * Calculate urgency factor based on scenario characteristics
   * @private
   */
  calculateUrgencyFactor(scenario) {
    // Analyze scenario for urgency indicators
    let urgencyScore = 0.3; // Base level
    
    // Increase for time-sensitive contexts
    if (scenario.title.toLowerCase().includes('crisis') || 
        scenario.title.toLowerCase().includes('urgent')) {
      urgencyScore += 0.3;
    }
    
    // Increase for high-stakes scenarios
    if (scenario.description.toLowerCase().includes('significant') ||
        scenario.description.toLowerCase().includes('major')) {
      urgencyScore += 0.2;
    }
    
    // Cap at 1.0
    return Math.min(1.0, urgencyScore);
  }

  /**
   * Create emotional journey map for the scenario
   * @param {Object} scenario - The scenario to map emotional journey for
   * @returns {Object} Emotional journey map
   */
  createEmotionalJourneyMap(scenario) {
    const journeyMap = {
      scenarioId: scenario.id,
      journeyStages: [],
      peakEmotionalMoments: [],
      emotionalArc: 'variable',
      regulationPoints: []
    };
    
    // Map emotional journey through decision points
    scenario.decisionPoints.forEach((point, index) => {
      const stage = {
        stageId: `stage_${index}`,
        decisionPointIndex: index,
        emotionalState: this.estimateEmotionalState(point, index, scenario.decisionPoints.length),
        tensionLevel: this.estimateTensionLevel(point, index, scenario.decisionPoints.length),
        regulationOpportunities: this.identifyRegulationOpportunities(point, index),
        learningMoment: index === scenario.decisionPoints.length - 1 // Last decision is learning moment
      };
      
      journeyMap.journeyStages.push(stage);
      
      // Track peak emotional moments
      if (stage.tensionLevel > 0.7) {
        journeyMap.peakEmotionalMoments.push({
          stageId: stage.stageId,
          type: 'high_tension',
          description: `Decision point ${index + 1} creates high emotional tension`
        });
      }
    });
    
    // Identify emotional regulation points
    journeyMap.regulationPoints = this.identifyRegulationPoints(journeyMap.journeyStages);
    
    // Determine overall arc
    journeyMap.emotionalArc = this.determineEmotionalArc(journeyMap.journeyStages);
    
    return journeyMap;
  }

  /**
   * Estimate emotional state at a decision point
   * @private
   */
  estimateEmotionalState(point, index, totalPoints) {
    // Emotional state varies based on position in scenario and decision characteristics
    const positionFactor = index / (totalPoints - 1 || 1); // Normalize position (0-1)
    
    // Base emotional state
    let state = 'considering';
    
    if (positionFactor < 0.3) {
      state = 'exploring';
    } else if (positionFactor < 0.7) {
      state = 'evaluating';
    } else {
      state = 'committing';
    }
    
    return {
      primary: state,
      intensity: 0.3 + (positionFactor * 0.4), // Increase intensity toward the end
      complexity: point.options.length > 2 ? 0.7 : 0.4 // More options = more complex emotions
    };
  }

  /**
   * Estimate tension level at a decision point
   * @private
   */
  estimateTensionLevel(point, index, totalPoints) {
    // Tension increases toward middle and end of decision sequence
    const positionTension = Math.sin((index / (totalPoints - 1 || 1)) * Math.PI); // Sinusoidal curve
    const optionTension = Math.min(1.0, (point.options.length - 1) * 0.3); // More options = more tension
    
    return Math.min(1.0, (positionTension * 0.6) + (optionTension * 0.4));
  }

  /**
   * Identify emotional regulation opportunities
   * @private
   */
  identifyRegulationOpportunities(point, index) {
    const opportunities = [];
    
    // Deep breath opportunity before complex decisions
    if (point.options.length > 2) {
      opportunities.push({
        technique: 'breathing_space',
        timing: 'before_decision',
        description: 'Take a moment to breathe deeply before evaluating multiple options'
      });
    }
    
    // Perspective-taking opportunity
    opportunities.push({
      technique: 'perspective_taking',
      timing: 'during_evaluation',
      description: 'Consider how someone with different values might view this decision'
    });
    
    // Values-check opportunity
    opportunities.push({
      technique: 'values_alignment_check',
      timing: 'before_commitment',
      description: 'Verify that your choice aligns with your core values'
    });
    
    return opportunities;
  }

  /**
   * Identify emotional regulation points in journey
   * @private
   */
  identifyRegulationPoints(stages) {
    return stages
      .filter(stage => stage.tensionLevel > 0.5)
      .map(stage => ({
        stageId: stage.stageId,
        tensionLevel: stage.tensionLevel,
        suggestedRegulation: this.getSuggestedRegulationForStage(stage)
      }));
  }

  /**
   * Get suggested regulation technique for a stage
   * @private
   */
  getSuggestedRegulationForStage(stage) {
    if (stage.tensionLevel > 0.8) {
      return {
        technique: 'immediate_calm',
        method: '4-7-8 breathing or brief mindfulness exercise',
        timing: 'before_proceeding'
      };
    } else if (stage.tensionLevel > 0.5) {
      return {
        technique: 'cognitive_restructuring',
        method: 'Challenge anxious thoughts about decision consequences',
        timing: 'during_evaluation'
      };
    } else {
      return {
        technique: 'maintain_awareness',
        method: 'Notice emotions without letting them drive the decision',
        timing: 'throughout_process'
      };
    }
  }

  /**
   * Determine emotional arc of the scenario
   * @private
   */
  determineEmotionalArc(stages) {
    if (stages.length === 0) return 'flat';
    
    const avgTension = stages.reduce((sum, stage) => sum + stage.tensionLevel, 0) / stages.length;
    const peakTension = Math.max(...stages.map(stage => stage.tensionLevel));
    
    if (avgTension < 0.4) return 'calm';
    if (peakTension > 0.8) return 'dramatic';
    if (stages[0].tensionLevel > stages[stages.length - 1].tensionLevel) return 'resolving';
    if (stages[0].tensionLevel < stages[stages.length - 1].tensionLevel) return 'building';
    
    return 'varied';
  }

  /**
   * Create a replayable scenario with alternative outcomes
   * @param {Object} originalScenario - The original scenario to make replayable
   * @param {Object} options - Options for replay functionality
   * @returns {Object} Replayable scenario with alternative outcomes
   */
  createReplayableScenario(originalScenario, options = {}) {
    const {
      enableReplay = true,
      includeAlternativeOutcomes = true,
      trackDecisionPaths = true,
      showCounterfactuals = true
    } = options;

    const replayableScenario = { ...originalScenario };

    // Add replay metadata
    replayableScenario.replayMetadata = {
      isReplayable: enableReplay,
      originalScenarioId: originalScenario.id,
      replayCount: 0,
      completedPaths: [],
      availableAlternativeOutcomes: includeAlternativeOutcomes,
      tracksDecisionPaths: trackDecisionPaths,
      showsCounterfactuals: showCounterfactuals,
      creationDate: new Date().toISOString()
    };

    // Generate alternative outcomes if enabled
    if (includeAlternativeOutcomes) {
      replayableScenario.alternativeOutcomes = this.generateAlternativeOutcomes(originalScenario);
    }

    // Create decision path tracking if enabled
    if (trackDecisionPaths) {
      replayableScenario.decisionPathTracker = {
        paths: [],
        pathRegistry: {},
        currentPath: null,
        totalPossiblePaths: this.calculatePossiblePaths(originalScenario)
      };
    }

    // Create counterfactual analysis if enabled
    if (showCounterfactuals) {
      replayableScenario.counterfactualAnalyzer = {
        enabled: true,
        analyzedPaths: [],
        potentialOutcomes: this.generatePotentialOutcomes(originalScenario)
      };
    }

    // Add replay controls
    replayableScenario.replayControls = {
      canRestart: true,
      canReview: true,
      canExploreAlternatives: includeAlternativeOutcomes,
      canComparePaths: trackDecisionPaths
    };

    return replayableScenario;
  }

  /**
   * Generate alternative outcomes for a scenario
   * @private
   */
  generateAlternativeOutcomes(scenario) {
    const alternatives = [];
    const outcomeTypes = ['positive_deviation', 'negative_deviation', 'neutral_deviation', 'transformative_change'];

    outcomeTypes.forEach((type, index) => {
      alternatives.push({
        id: `${scenario.id}-alt-${index}`,
        type: type,
        title: this.generateAlternativeTitle(type),
        description: this.generateAlternativeDescription(scenario, type),
        requiredPath: this.generateRequiredPathForOutcome(type),
        likelihood: this.calculateOutcomeLikelihood(type),
        learningValue: this.calculateLearningValue(type),
        impactLevel: this.calculateImpactLevel(type),
        keyDifferences: this.identifyKeyDifferences(scenario, type)
      });
    });

    return alternatives;
  }

  /**
   * Create branching narrative paths based on user decisions
   * @param {Object} scenario - Base scenario to create branches for
   * @param {number} maxBranches - Maximum number of branches to create
   * @returns {Object} Scenario with branching narrative paths
   */
  createBranchingNarrative(scenario, maxBranches = 3) {
    const branchingScenario = {...scenario};
    branchingScenario.branches = {};
    
    // Create branches for each decision point
    branchingScenario.decisionPoints.forEach((decisionPoint, index) => {
      const nodes = {};
      
      // Create a branch for each possible option
      decisionPoint.options.forEach((option, idx) => {
        const nodeId = `${scenario.id}-d${index}-o${idx}`;
        
        nodes[idx] = {
          id: nodeId,
          optionText: option,
          consequence: this.generateConsequenceForOption(option, scenario.biasCombinations || []),
          nextPath: this.determineNextPath(index, branchingScenario.decisionPoints.length),
          impact: this.calculateDecisionImpact(option, scenario.biasCombinations || []),
          learningOutcome: this.generateLearningOutcome(option, scenario.biasCombinations || []),
          storyContinuation: this.generateStoryContinuation(option, scenario.setup || '', index)
        };
      });
      
      branchingScenario.branches[`decision_${index}`] = nodes;
    });
    
    // Add narrative flow control properties
    branchingScenario.narrativeFlow = {
      currentPath: 'main',
      availablePaths: Object.keys(branchingScenario.branches),
      hasBranching: true,
      totalBranches: Object.keys(branchingScenario.branches).length
    };
    
    return branchingScenario;
  }

  /**
   * Navigate to a specific branch in the narrative
   * @param {Object} scenario - Scenario with branches
   * @param {string} decisionId - ID of the decision point
   * @param {number} optionIndex - Index of the chosen option
   * @returns {Object} Branch details
   */
  navigateBranch(scenario, decisionId, optionIndex) {
    if (!scenario.branches || !scenario.branches[decisionId]) {
      throw new Error(`Branch not found for decision ${decisionId}`);
    }
    
    const branch = scenario.branches[decisionId][optionIndex];
    if (!branch) {
      throw new Error(`Option ${optionIndex} not available for decision ${decisionId}`);
    }
    
    return {
      ...branch,
      pathTaken: `${decisionId}.option_${optionIndex}`,
      nextDecisionPoint: this.getNextDecisionPoint(scenario, decisionId, optionIndex)
    };
  }

  /**
   * Get the next decision point after taking a branch
   * @private
   */
  getNextDecisionPoint(scenario, decisionId, optionIndex) {
    // Parse decision ID to get the index
    const match = decisionId.match(/d(\d+)/);
    if (!match) return null;
    
    const currentIndex = parseInt(match[1]);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < scenario.decisionPoints.length) {
      return {
        index: nextIndex,
        point: scenario.decisionPoints[nextIndex],
        availableOptions: scenario.decisionPoints[nextIndex].options.length
      };
    }
    
    return null; // No more decisions, reached the end
  }

  /**
   * Generate title for alternative outcome
   * @private
   */
  generateAlternativeTitle(outcomeType) {
    const titles = {
      'positive_deviation': '积极转变结局',
      'negative_deviation': '消极偏离结局',
      'neutral_deviation': '中性变化结局',
      'transformative_change': '根本性转变结局'
    };

    return titles[outcomeType] || '替代结局';
  }

  /**
   * Generate description for alternative outcome
   * @private
   */
  generateAlternativeDescription(scenario, outcomeType) {
    const baseDescription = `在另一种可能的现实中，如果当初做出了不同的选择，${scenario.title}的发展轨迹将会是这样的...`;

    const descriptors = {
      'positive_deviation': '通过更谨慎和深思熟虑的方法，避免了潜在的风险，实现了更好的结果。',
      'negative_deviation': '由于过度自信或忽视警告信号，导致了更糟糕的后果。',
      'neutral_deviation': '采取了不同的路径，但最终结果与原始情况相似。',
      'transformative_change': '根本性的方法改变导致了全新的、意想不到的发展方向。'
    };

    return `${baseDescription} ${descriptors[outcomeType] || '情况发生了变化。'}`;
  }

  /**
   * Generate required path for a specific outcome
   * @private
   */
  generateRequiredPathForOutcome(outcomeType) {
    const paths = {
      'positive_deviation': ['more_caution', 'seek_diverse_opinions', 'delay_decision'],
      'negative_deviation': ['hasty_decision', 'ignore_warnings', 'over_confidence'],
      'neutral_deviation': ['different_approach', 'timing_variation', 'resource_shift'],
      'transformative_change': ['paradigm_shift', 'innovative_solution', 'collaborative_approach']
    };

    return paths[outcomeType] || ['standard_path'];
  }

  /**
   * Calculate likelihood of an outcome
   * @private
   */
  calculateOutcomeLikelihood(outcomeType) {
    const likelihoods = {
      'positive_deviation': 0.3,
      'negative_deviation': 0.4,
      'neutral_deviation': 0.2,
      'transformative_change': 0.1
    };

    return likelihoods[outcomeType] || 0.25;
  }

  /**
   * Calculate learning value of an outcome
   * @private
   */
  calculateLearningValue(outcomeType) {
    // Transformative changes tend to offer the most learning
    const learningValues = {
      'positive_deviation': 0.7,
      'negative_deviation': 0.8, // Learning from mistakes is valuable
      'neutral_deviation': 0.5,
      'transformative_change': 0.9
    };

    return learningValues[outcomeType] || 0.6;
  }

  /**
   * Calculate impact level of an outcome
   * @private
   */
  calculateImpactLevel(outcomeType) {
    const impactLevels = {
      'positive_deviation': 0.6,
      'negative_deviation': 0.8,
      'neutral_deviation': 0.3,
      'transformative_change': 0.9
    };

    return impactLevels[outcomeType] || 0.5;
  }

  /**
   * Identify key differences from original scenario
   * @private
   */
  identifyKeyDifferences(scenario, outcomeType) {
    const differences = {
      'positive_deviation': [
        '更全面的信息收集',
        '更多样化的观点征询',
        '更保守的风险评估',
        '更长的决策周期'
      ],
      'negative_deviation': [
        '仓促的决策过程',
        '忽视警告信号',
        '过度自信的态度',
        '单一信息来源依赖'
      ],
      'neutral_deviation': [
        '不同的实施顺序',
        '资源分配的变化',
        '时间安排的调整',
        '团队构成的不同'
      ],
      'transformative_change': [
        '根本性的方法转变',
        '创新解决方案的应用',
        '跨领域合作的引入',
        '价值观驱动的决策'
      ]
    };

    return differences[outcomeType] || ['轻微的执行差异'];
  }

  /**
   * Calculate total possible decision paths in a scenario
   * @private
   */
  calculatePossiblePaths(scenario) {
    if (!scenario.decisionPoints || scenario.decisionPoints.length === 0) {
      return 1;
    }

    // Calculate possible paths based on number of options at each decision point
    let totalPaths = 1;
    scenario.decisionPoints.forEach(point => {
      totalPaths *= point.options.length;
    });

    // Cap at a reasonable number to prevent combinatorial explosion
    return Math.min(totalPaths, 1000);
  }

  /**
   * Generate potential outcomes based on decision paths
   * @private
   */
  generatePotentialOutcomes(scenario) {
    const outcomes = [];
    const maxOutcomes = Math.min(10, this.calculatePossiblePaths(scenario)); // Limit to 10 for performance

    for (let i = 0; i < maxOutcomes; i++) {
      outcomes.push({
        pathId: `${scenario.id}-path-${i}`,
        pathDescription: this.generatePathDescription(scenario, i),
        resultingOutcome: this.generatePathOutcome(scenario, i),
        probability: this.calculatePathProbability(i, maxOutcomes),
        learningInsights: this.generateLearningInsights(scenario, i)
      });
    }

    return outcomes;
  }

  /**
   * Generate description for a decision path
   * @private
   */
  generatePathDescription(scenario, pathIndex) {
    // Create a simple path description based on modulo of options
    if (!scenario.decisionPoints) return '通用路径';

    const path = [];
    scenario.decisionPoints.forEach((point, idx) => {
      const optionIndex = (pathIndex + idx) % point.options.length;
      path.push({
        decisionPoint: idx,
        chosenOption: optionIndex,
        optionText: point.options[optionIndex]
      });
    });

    return `路径 ${pathIndex + 1}: ${path.map(p => `[DP${p.decisionPoint}: ${p.optionText}]`).join(', ')}`;
  }

  /**
   * Generate outcome for a specific path
   * @private
   */
  generatePathOutcome(scenario, pathIndex) {
    const outcomeQualities = ['favorable', 'mixed', 'challenging', 'unexpected', 'transformative'];
    const quality = outcomeQualities[pathIndex % outcomeQualities.length];

    const descriptions = {
      favorable: '经过精心规划和多方论证，最终取得了超出预期的积极成果。',
      mixed: '过程充满挑战，但最终达成了基本目标，积累了宝贵经验。',
      challenging: '面临诸多困难，虽未完全达成目标，但获得了深刻洞察。',
      unexpected: '结果与预期大相径庭，揭示了系统中未知的复杂性。',
      transformative: '整个过程带来了根本性的观念转变和方法革新。'
    };

    return {
      quality: quality,
      description: descriptions[quality],
      keyResults: this.generateKeyResults(quality),
      lessonsLearned: this.generateLessonsForQuality(quality)
    };
  }

  /**
   * Generate key results based on outcome quality
   * @private
   */
  generateKeyResults(quality) {
    const results = {
      favorable: ['目标超额完成', '团队士气高涨', '获得广泛认可', '建立新标准'],
      mixed: ['部分目标达成', '识别关键问题', '建立改进基础', '维持基本运营'],
      challenging: ['目标未完全达成', '暴露系统弱点', '积累失败经验', '重新评估策略'],
      unexpected: ['发现新机遇', '挑战既有假设', '揭示隐藏因素', '催生创新思路'],
      transformative: ['根本性突破', '范式转移', '行业影响', '思想革命']
    };

    return results[quality] || ['一般性结果'];
  }

  /**
   * Generate lessons based on outcome quality
   * @private
   */
  generateLessonsForQuality(quality) {
    const lessons = {
      favorable: [
        '充分准备和多方论证的重要性',
        '团队协作和沟通的积极作用',
        '灵活性和适应性的价值',
        '持续监控和调整的必要性'
      ],
      mixed: [
        '期望管理的重要性',
        '风险识别和缓解的必要性',
        '资源分配的优化策略',
        '利益相关者管理的复杂性'
      ],
      challenging: [
        '过度自信的危险性',
        '忽视警告信号的后果',
        '应急计划的必要性',
        '从失败中学习的价值'
      ],
      unexpected: [
        '保持开放心态的重要性',
        '复杂系统的不可预测性',
        '创新思维的潜在价值',
        '适应性策略的必要性'
      ],
      transformative: [
        '根本性思维转变的力量',
        '跨界融合的创新潜力',
        '长期视角的战略价值',
        '系统性变革的影响力'
      ]
    };

    return lessons[quality] || ['一般性经验教训'];
  }

  /**
   * Calculate probability for a specific path
   * @private
   */
  calculatePathProbability(pathIndex, totalPaths) {
    // Simple uniform distribution, though in reality some paths are more likely
    return 1 / totalPaths;
  }

  /**
   * Generate learning insights for a path
   * @private
   */
  generateLearningInsights(scenario, pathIndex) {
    return [
      {
        insight: '认知偏误识别',
        description: '在此路径中，某些认知偏误得到了有效控制或意外显现',
        application: '理解不同情境下偏误的表现形式'
      },
      {
        insight: '决策框架适用性',
        description: '特定决策框架在此路径中的有效性得到了验证',
        application: '根据不同情况选择合适的决策方法'
      },
      {
        insight: '情境因素影响',
        description: '外部因素对决策结果的影响程度超出了预期',
        application: '在决策中更好地考虑环境变量'
      }
    ];
  }

  /**
   * Track a decision path taken by a user
   * @param {Object} replayableScenario - The replayable scenario
   * @param {Array} decisions - Array of decisions made by the user
   * @returns {Object} Updated scenario with path tracking
   */
  trackDecisionPath(replayableScenario, decisions) {
    if (!replayableScenario.decisionPathTracker) {
      console.warn('Decision path tracking not enabled for this scenario');
      return replayableScenario;
    }

    const pathId = this.generatePathId(decisions);
    const pathInfo = {
      id: pathId,
      decisions: decisions,
      timestamp: new Date().toISOString(),
      outcome: this.determinePathOutcome(replayableScenario.originalScenario, decisions),
      reflection: null
    };

    // Add to completed paths
    replayableScenario.replayMetadata.completedPaths.push(pathId);

    // Store path details
    replayableScenario.decisionPathTracker.pathRegistry[pathId] = pathInfo;
    replayableScenario.decisionPathTracker.currentPath = pathId;

    // Increment replay count
    replayableScenario.replayMetadata.replayCount += 1;

    return replayableScenario;
  }

  /**
   * Generate a unique path ID from decisions
   * @private
   */
  generatePathId(decisions) {
    // Create a hash-like ID based on decisions
    const decisionHash = decisions.map(d => `${d.point}_${d.choice}`).join('-');
    return `path-${Date.now()}-${this.hashCode(decisionHash)}`;
  }

  /**
   * Generate hash code for a string
   * @private
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36); // Convert to base 36 string
  }

  /**
   * Determine the outcome of a specific decision path
   * @private
   */
  determinePathOutcome(originalScenario, decisions) {
    // Simple outcome determination based on decisions
    // In a real implementation, this would be more sophisticated
    const decisionQuality = this.assessDecisionQuality(decisions);
    
    return {
      pathQuality: decisionQuality,
      likelyOutcome: this.associateOutcomeWithQuality(decisionQuality),
      confidence: 0.7, // Default confidence level
      contributingFactors: this.identifyContributingFactors(decisions)
    };
  }

  /**
   * Assess quality of a series of decisions
   * @private
   */
  assessDecisionQuality(decisions) {
    // Simple heuristic: assume balanced decisions are better
    let cautiousCount = 0;
    let riskyCount = 0;
    let thoughtfulCount = 0;

    decisions.forEach(decision => {
      const choice = decision.choice.toLowerCase();
      if (choice.includes('cautious') || choice.includes('careful') || choice.includes('conservative')) {
        cautiousCount++;
      } else if (choice.includes('risky') || choice.includes('aggressive') || choice.includes('bold')) {
        riskyCount++;
      } else if (choice.includes('thoughtful') || choice.includes('considered') || choice.includes('evaluated')) {
        thoughtfulCount++;
      }
    });

    if (thoughtfulCount > 0 && cautiousCount >= riskyCount) {
      return 'high_quality';
    } else if (riskyCount > cautiousCount) {
      return 'risky';
    } else {
      return 'moderate_quality';
    }
  }

  /**
   * Associate outcome with decision quality
   * @private
   */
  associateOutcomeWithQuality(quality) {
    const associations = {
      'high_quality': 'favorable_outcome',
      'risky': 'uncertain_outcome',
      'moderate_quality': 'mixed_outcome'
    };

    return associations[quality] || 'indeterminate';
  }

  /**
   * Identify contributing factors to the outcome
   * @private
   */
  identifyContributingFactors(decisions) {
    const factors = [];

    if (decisions.length > 3) {
      factors.push('multiple_decision_points_involved');
    }

    // Analyze for patterns
    const choices = decisions.map(d => d.choice.toLowerCase());
    if (choices.every(choice => choice.includes('consult') || choice.includes('review'))) {
      factors.push('collaborative_approach');
    }

    if (choices.some(choice => choice.includes('immediate') || choice.includes('urgent'))) {
      factors.push('time_pressure_factor');
    }

    return factors.length > 0 ? factors : ['individual_decision_making'];
  }

  /**
   * Compare different decision paths
   * @param {Object} replayableScenario - The replayable scenario
   * @param {Array} pathIds - IDs of paths to compare
   * @returns {Object} Comparison analysis
   */
  compareDecisionPaths(replayableScenario, pathIds) {
    if (!replayableScenario.decisionPathTracker) {
      throw new Error('Decision path tracking not enabled for this scenario');
    }

    const pathsToCompare = pathIds.map(id => replayableScenario.decisionPathTracker.pathRegistry[id])
                                  .filter(Boolean); // Remove undefined paths

    if (pathsToCompare.length < 2) {
      throw new Error('Need at least 2 paths to compare');
    }

    const comparison = {
      comparedPaths: pathIds,
      analysis: {
        similarities: this.findPathSimilarities(pathsToCompare),
        differences: this.findPathDifferences(pathsToCompare),
        outcomeComparison: this.comparePathOutcomes(pathsToCompare),
        keyInfluences: this.identifyKeyInfluences(pathsToCompare)
      },
      insights: this.generateComparisonInsights(pathsToCompare)
    };

    return comparison;
  }

  /**
   * Find similarities between decision paths
   * @private
   */
  findPathSimilarities(paths) {
    const similarities = [];
    
    // Find common decision patterns
    if (paths.length > 1) {
      // Compare first few decisions as they often set the trajectory
      const earlyDecisions = paths.map(path => 
        path.decisions.slice(0, Math.min(2, path.decisions.length))
      );

      // Find common early decisions
      if (earlyDecisions.length > 1) {
        const firstPath = earlyDecisions[0];
        for (let i = 0; i < firstPath.length; i++) {
          const decision = firstPath[i];
          const matches = earlyDecisions.slice(1).filter(path => 
            path[i] && path[i].choice === decision.choice
          );
          
          if (matches.length === earlyDecisions.length - 1) {
            similarities.push({
              type: 'early_decision_alignment',
              decisionPoint: decision.point,
              commonChoice: decision.choice,
              pathsAffected: paths.length
            });
          }
        }
      }
    }

    return similarities;
  }

  /**
   * Find differences between decision paths
   * @private
   */
  findPathDifferences(paths) {
    const differences = [];

    // Identify where paths diverge
    for (let i = 0; i < paths.length - 1; i++) {
      for (let j = i + 1; j < paths.length; j++) {
        const path1 = paths[i];
        const path2 = paths[j];

        // Find the first decision where they differ
        const minLength = Math.min(path1.decisions.length, path2.decisions.length);
        for (let k = 0; k < minLength; k++) {
          if (path1.decisions[k].choice !== path2.decisions[k].choice) {
            differences.push({
              divergencePoint: k,
              path1Choice: path1.decisions[k].choice,
              path2Choice: path2.decisions[k].choice,
              pathsCompared: [path1.id, path2.id]
            });
            break; // Only record first divergence
          }
        }
      }
    }

    return differences;
  }

  /**
   * Compare outcomes of different paths
   * @private
   */
  comparePathOutcomes(paths) {
    return paths.map(path => ({
      pathId: path.id,
      outcomeQuality: path.outcome.pathQuality,
      associatedOutcome: path.outcome.likelyOutcome,
      confidence: path.outcome.confidence
    }));
  }

  /**
   * Identify key influences across paths
   * @private
   */
  identifyKeyInfluences(paths) {
    const influences = [];

    // Look for decisions that consistently correlate with certain outcomes
    const qualityCounts = {};
    paths.forEach(path => {
      const quality = path.outcome.pathQuality;
      if (!qualityCounts[quality]) qualityCounts[quality] = 0;
      qualityCounts[quality]++;
    });

    // Find the most common outcome quality
    const dominantQuality = Object.keys(qualityCounts).reduce((a, b) => 
      qualityCounts[a] > qualityCounts[b] ? a : b
    );

    influences.push({
      factor: 'dominant_outcome_pattern',
      description: `Most paths resulted in ${dominantQuality} outcomes`,
      prevalence: qualityCounts[dominantQuality] / paths.length
    });

    return influences;
  }

  /**
   * Generate insights from comparing paths
   * @private
   */
  generateComparisonInsights(paths) {
    const insights = [];

    // Insight about path diversity
    const outcomeQualities = [...new Set(paths.map(p => p.outcome.pathQuality))];
    insights.push({
      insight: 'Outcome Diversity',
      description: `The ${paths.length} paths resulted in ${outcomeQualities.length} different quality levels`,
      implication: 'Different approaches can lead to widely varying results'
    });

    // Insight about critical decisions
    const differences = this.findPathDifferences(paths);
    if (differences.length > 0) {
      insights.push({
        insight: 'Critical Decision Points',
        description: `Paths diverged at ${differences.length} decision point(s)`,
        implication: 'Early decisions can significantly impact final outcomes'
      });
    }

    return insights;
  }

  /**
   * Reset a scenario for replay
   * @param {Object} replayableScenario - The scenario to reset
   * @returns {Object} Reset scenario
   */
  resetScenarioForReplay(replayableScenario) {
    // Create a fresh copy of the original scenario
    const resetScenario = { ...replayableScenario };
    
    // Reset replay-specific fields
    resetScenario.replayMetadata = {
      ...replayableScenario.replayMetadata,
      replayCount: resetScenario.replayMetadata.replayCount + 1,
      completedPaths: []
    };

    // Clear path tracking
    if (resetScenario.decisionPathTracker) {
      resetScenario.decisionPathTracker = {
        ...replayableScenario.decisionPathTracker,
        paths: [],
        pathRegistry: {},
        currentPath: null
      };
    }

    // Clear user-specific data but preserve the structure
    return resetScenario;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CrossDomainChallengeGenerator;
}

// Also make it available globally if running in browser
if (typeof window !== 'undefined') {
  window.CrossDomainChallengeGenerator = CrossDomainChallengeGenerator;
}