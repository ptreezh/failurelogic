/**
 * TDD Test Suite: Complex Financial Markets Crisis Response Simulation
 *
 * Phase 1: RED - Write failing test cases
 * Testing the Financial Crisis Decision Engine
 */

describe('FinancialCrisisPageRouter', () => {
  let router;

  beforeEach(() => {
    const initialState = {
      satisfaction: 50,
      resources: 100000, // Central bank reserves
      reputation: 50,    // Market confidence in central bank
      systemic_risk_level: 60, // Current systemic risk
      market_stability: 40, // Market stability index
      liquidity_index: 45, // Liquidity condition
      regulatory_compliance: 55, // Compliance level
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      international_coordination: 35 // International cooperation level
    };
    router = new FinancialCrisisPageRouter(initialState);
  });

  describe('Constructor', () => {
    test('should initialize with proper game state', () => {
      expect(router.gameState).toBeDefined();
      expect(router.gameState.resources).toBe(100000);
      expect(router.gameState.systemic_risk_level).toBe(60);
      expect(router.currentPage).toBe('START');
    });
  });

  describe('Game Flow', () => {
    test('should start game and change page state', () => {
      router.startGame();
      expect(router.getCurrentPage()).toBe('TURN_1_START');
    });

    test('should advance to next turn', () => {
      router.startGame();
      router.submitTurn();
      router.nextTurn();
      expect(router.getCurrentTurn()).toBe(2);
    });
  });

  describe('Decision Making', () => {
    test('should store temporary decisions', () => {
      router.makeDecision('crisis_choice_1', 'tighten_derivatives');
      expect(router.tempDecisions['crisis_choice_1']).toBe('tighten_derivatives');
    });

    test('should select options', () => {
      router.selectOption(0);
      expect(router.tempOptions).toContain(0);
    });
  });

  describe('State Management', () => {
    test('should reset game to initial state', () => {
      router.makeDecision('crisis_choice_1', 'tighten_derivatives');
      router.resetGame();
      expect(router.tempDecisions).toEqual({});
      expect(router.gameState.resources).toBe(100000);
    });
  });

  describe('Page Rendering', () => {
    test('should render start page', () => {
      router.currentPage = 'START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('复杂金融市场危机应对模拟');
      expect(pageContent).toContain('央行副行长');
    });

    test('should render turn pages', () => {
      router.currentPage = 'TURN_1_START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('第1回合决策');
    });
  });
});

/**
 * TDD Test Suite: Financial Crisis Decision Engine
 */
describe('DecisionEngine.calculateFinancialCrisisTurn', () => {
  let engine;

  beforeEach(() => {
    engine = new DecisionEngine();
  });

  describe('calculateFinancialCrisisLinearExpectation', () => {
    test('should calculate linear expectation for derivatives tightening', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        systemic_risk_level: 60,
        market_stability: 40
      };
      const decisions = { 'crisis_choice_1': 'tighten_derivatives' };
      
      const expectation = DecisionEngine.calculateFinancialCrisisLinearExpectation(1, decisions, gameState);
      
      expect(expectation.systemic_risk_level).toBeLessThan(60);
      expect(expectation.thinking).toContain('衍生品');
    });

    test('should calculate linear expectation for liquidity provision', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        systemic_risk_level: 60,
        market_stability: 40
      };
      const decisions = { 'crisis_choice_1': 'provide_liquidity' };
      
      const expectation = DecisionEngine.calculateFinancialCrisisLinearExpectation(1, decisions, gameState);
      
      expect(expectation.thinking).toContain('流动性');
    });

    test('should handle stress testing expectations', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        systemic_risk_level: 60,
        market_stability: 40
      };
      const decisions = { 'crisis_choice_1': 'stress_testing' };
      const history = [];
      
      const expectation = DecisionEngine.calculateFinancialCrisisLinearExpectation(1, decisions, gameState);
      
      expect(expectation.thinking).toContain('压力测试');
    });
  });

  describe('calculateFinancialCrisisActualResult', () => {
    test('should calculate actual result with complex dynamics for derivatives tightening', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        systemic_risk_level: 60,
        market_stability: 40,
        liquidity_index: 45,
        regulatory_compliance: 55,
        international_coordination: 35
      };
      const decisions = { 'crisis_choice_1': 'tighten_derivatives' };
      const history = [];
      
      const result = DecisionEngine.calculateFinancialCrisisActualResult(1, decisions, gameState, history);
      
      expect(result.effects).toBeDefined();
      expect(result.narrative).toBeDefined();
      expect(result.delayedEffects).toBeDefined();
      
      expect(typeof result.narrative).toBe('string');
      expect(Array.isArray(result.delayedEffects)).toBe(true);
    });

    test('should calculate actual result for liquidity provision', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        systemic_risk_level: 60,
        market_stability: 40,
        liquidity_index: 45,
        regulatory_compliance: 55,
        international_coordination: 35
      };
      const decisions = { 'crisis_choice_1': 'provide_liquidity' };
      const history = [];
      
      const result = DecisionEngine.calculateFinancialCrisisActualResult(1, decisions, gameState, history);
      
      expect(result.effects.liquidity_index).toBeGreaterThan(45);
      expect(result.effects.market_stability).toBeDefined();
    });

    test('should calculate actual result for stress testing', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        systemic_risk_level: 60,
        market_stability: 40,
        liquidity_index: 45,
        regulatory_compliance: 55,
        international_coordination: 35
      };
      const decisions = { 'crisis_choice_1': 'stress_testing' };
      const history = [{turn: 1, decisions: {'crisis_choice_1': 'tighten_derivatives'}}];
      
      const result = DecisionEngine.calculateFinancialCrisisActualResult(2, decisions, gameState, history);
      
      expect(result.effects.systemic_risk_level).toBeDefined();
      expect(result.effects.reputation).toBeDefined();
    });
  });

  describe('applyFinancialCrisisDelayedEffects', () => {
    test('should apply delayed effects at correct turn', () => {
      const currentState = {
        resources: 100000,
        reputation: 50,
        systemic_risk_level: 60
      };
      const delayedEffects = [
        {
          turn: 2,
          effect: { systemic_risk_level: -10, market_stability: 15 },
          description: 'Regulatory tightening impact'
        }
      ];
      
      const result = DecisionEngine.applyFinancialCrisisDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.systemic_risk_level).toBe(50);
      expect(result.state.market_stability).toBe(55); // assuming starting value of 40
      expect(result.remainingEffects).toEqual([]);
    });

    test('should not apply delayed effects for future turns', () => {
      const currentState = {
        resources: 100000,
        reputation: 50,
        systemic_risk_level: 60
      };
      const delayedEffects = [
        {
          turn: 3,
          effect: { resources: 5000, reputation: 10 },
          description: 'Future policy impact'
        }
      ];
      
      const result = DecisionEngine.applyFinancialCrisisDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.resources).toBe(100000);
      expect(result.state.reputation).toBe(50);
      expect(result.remainingEffects).toEqual(delayedEffects);
    });
  });

  describe('generateFinancialCrisisFeedback', () => {
    test('should generate meaningful feedback for turn results', () => {
      const linearExpectation = {
        systemic_risk_level: 50,
        market_stability: 55,
        thinking: 'Derivatives tightening will reduce systemic risk without disrupting markets'
      };
      const actualResult = {
        systemic_risk_level: 55,
        market_stability: 48,
        changes: { systemic_risk_level: -5, market_stability: 8 }
      };
      const narrative = 'Derivatives tightening caused unexpected market disruptions';

      const feedback = DecisionEngine.generateFinancialCrisisFeedback(1, linearExpectation, actualResult, narrative);

      expect(feedback).toContain('第1回合结果');
      expect(feedback).toContain('实际结果');
      expect(feedback).toContain('偏差分析');
    });
  });

  describe('calculateFinancialCrisisTurn', () => {
    test('should calculate complete turn with expectations and results', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        systemic_risk_level: 60,
        market_stability: 40,
        liquidity_index: 45,
        regulatory_compliance: 55,
        international_coordination: 35,
        turn_number: 1
      };
      const decisions = { 'crisis_choice_1': 'capital_requirements' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculateFinancialCrisisTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
      expect(result.newGameState).toBeDefined();
      expect(result.linearExpectation).toBeDefined();
      expect(result.actualResult).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.newDelayedEffects).toBeDefined();
      expect(result.gameOver).toBe(false);
      
      // Verify that the new game state has updated values
      expect(result.newGameState.systemic_risk_level).toBeGreaterThanOrEqual(0);
      expect(typeof result.feedback).toBe('string');
    });

    test('should detect game over conditions', () => {
      const gameState = {
        resources: 2000,  // Very low resources
        reputation: 10,   // Very low market confidence
        systemic_risk_level: 95, // Very high systemic risk
        market_stability: 5, // Very low stability
        liquidity_index: 10,
        regulatory_compliance: 20,
        international_coordination: 5, // Very low coordination
        turn_number: 1
      };
      const decisions = { 'crisis_choice_1': 'capital_requirements' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculateFinancialCrisisTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
      // Should trigger game over due to high systemic risk
      expect(result.gameOver).toBe(true);
      expect(result.gameOverReason).toBe('systemic_risk');
    });
  });
});