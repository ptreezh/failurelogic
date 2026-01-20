/**
 * TDD Test Suite: Global Climate Change Policy Making Game
 *
 * Phase 1: RED - Write failing test cases
 * Testing the Climate Policy Decision Engine
 */

describe('ClimateChangePageRouter', () => {
  let router;

  beforeEach(() => {
    const initialState = {
      satisfaction: 50,
      resources: 100000, // International climate fund
      reputation: 50,    // International standing
      emission_reduction: 10, // Current reduction percentage
      international_cooperation: 30, // Cooperation level
      technological_advancement: 25, // Tech development level
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      climate_risk: 70 // Current climate risk level
    };
    router = new ClimateChangePageRouter(initialState);
  });

  describe('Constructor', () => {
    test('should initialize with proper game state', () => {
      expect(router.gameState).toBeDefined();
      expect(router.gameState.resources).toBe(100000);
      expect(router.gameState.emission_reduction).toBe(10);
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
      router.makeDecision('climate_choice_1', 'unified_targets');
      expect(router.tempDecisions['climate_choice_1']).toBe('unified_targets');
    });

    test('should select options', () => {
      router.selectOption(0);
      expect(router.tempOptions).toContain(0);
    });
  });

  describe('State Management', () => {
    test('should reset game to initial state', () => {
      router.makeDecision('climate_choice_1', 'unified_targets');
      router.resetGame();
      expect(router.tempDecisions).toEqual({});
      expect(router.gameState.resources).toBe(100000);
    });
  });

  describe('Page Rendering', () => {
    test('should render start page', () => {
      router.currentPage = 'START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('全球气候变化政策制定博弈');
      expect(pageContent).toContain('政策顾问');
    });

    test('should render turn pages', () => {
      router.currentPage = 'TURN_1_START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('第1回合决策');
    });
  });
});

/**
 * TDD Test Suite: Climate Change Policy Decision Engine
 */
describe('DecisionEngine.calculateClimateChangeTurn', () => {
  let engine;

  beforeEach(() => {
    engine = new DecisionEngine();
  });

  describe('calculateClimateChangeLinearExpectation', () => {
    test('should calculate linear expectation for unified targets', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        emission_reduction: 10,
        international_cooperation: 30
      };
      const decisions = { 'climate_choice_1': 'unified_targets' };
      
      const expectation = DecisionEngine.calculateClimateChangeLinearExpectation(1, decisions, gameState);
      
      expect(expectation.emission_reduction).toBeGreaterThan(10);
      expect(expectation.thinking).toContain('统一');
    });

    test('should calculate linear expectation for carbon trading', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        emission_reduction: 10,
        international_cooperation: 30
      };
      const decisions = { 'climate_choice_1': 'carbon_trading' };
      
      const expectation = DecisionEngine.calculateClimateChangeLinearExpectation(1, decisions, gameState);
      
      expect(expectation.thinking).toContain('交易');
    });

    test('should handle technology transfer expectations', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        emission_reduction: 10,
        international_cooperation: 30
      };
      const decisions = { 'climate_choice_1': 'tech_transfer' };
      const history = [];
      
      const expectation = DecisionEngine.calculateClimateChangeLinearExpectation(1, decisions, gameState);
      
      expect(expectation.thinking).toContain('技术');
    });
  });

  describe('calculateClimateChangeActualResult', () => {
    test('should calculate actual result with complex dynamics for unified targets', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        emission_reduction: 10,
        international_cooperation: 30,
        technological_advancement: 25,
        climate_risk: 70
      };
      const decisions = { 'climate_choice_1': 'unified_targets' };
      const history = [];
      
      const result = DecisionEngine.calculateClimateChangeActualResult(1, decisions, gameState, history);
      
      expect(result.effects).toBeDefined();
      expect(result.narrative).toBeDefined();
      expect(result.delayedEffects).toBeDefined();
      
      expect(typeof result.narrative).toBe('string');
      expect(Array.isArray(result.delayedEffects)).toBe(true);
    });

    test('should calculate actual result for carbon trading system', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        emission_reduction: 10,
        international_cooperation: 30,
        technological_advancement: 25,
        climate_risk: 70
      };
      const decisions = { 'climate_choice_1': 'carbon_trading' };
      const history = [];
      
      const result = DecisionEngine.calculateClimateChangeActualResult(1, decisions, gameState, history);
      
      expect(result.effects.emission_reduction).toBeDefined();
      expect(result.effects.international_cooperation).toBeDefined();
    });

    test('should calculate actual result for technology transfer', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        emission_reduction: 10,
        international_cooperation: 30,
        technological_advancement: 25,
        climate_risk: 70
      };
      const decisions = { 'climate_choice_1': 'tech_transfer' };
      const history = [{turn: 1, decisions: {'climate_choice_1': 'unified_targets'}}];
      
      const result = DecisionEngine.calculateClimateChangeActualResult(2, decisions, gameState, history);
      
      expect(result.effects.technological_advancement).toBeGreaterThan(0);
      expect(result.effects.reputation).toBeDefined();
    });
  });

  describe('applyClimateChangeDelayedEffects', () => {
    test('should apply delayed effects at correct turn', () => {
      const currentState = {
        resources: 100000,
        reputation: 50,
        emission_reduction: 10
      };
      const delayedEffects = [
        {
          turn: 2,
          effect: { emission_reduction: 15, technological_advancement: 10 },
          description: 'Technology transfer impact'
        }
      ];
      
      const result = DecisionEngine.applyClimateChangeDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.emission_reduction).toBe(25);
      expect(result.state.technological_advancement).toBe(35); // assuming starting value of 25
      expect(result.remainingEffects).toEqual([]);
    });

    test('should not apply delayed effects for future turns', () => {
      const currentState = {
        resources: 100000,
        reputation: 50,
        emission_reduction: 10
      };
      const delayedEffects = [
        {
          turn: 3,
          effect: { resources: 5000, reputation: 10 },
          description: 'Future cooperation benefit'
        }
      ];
      
      const result = DecisionEngine.applyClimateChangeDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.resources).toBe(100000);
      expect(result.state.reputation).toBe(50);
      expect(result.remainingEffects).toEqual(delayedEffects);
    });
  });

  describe('generateClimateChangeFeedback', () => {
    test('should generate meaningful feedback for turn results', () => {
      const linearExpectation = {
        emission_reduction: 25,
        international_cooperation: 50,
        thinking: 'Unified targets will ensure equal commitment from all countries'
      };
      const actualResult = {
        emission_reduction: 18,
        international_cooperation: 35,
        changes: { emission_reduction: 8, international_cooperation: 5 }
      };
      const narrative = 'Unified targets faced resistance from developing nations concerned about economic impacts';

      const feedback = DecisionEngine.generateClimateChangeFeedback(1, linearExpectation, actualResult, narrative);

      expect(feedback).toContain('第1回合结果');
      expect(feedback).toContain('实际结果');
      expect(feedback).toContain('偏差分析');
    });
  });

  describe('calculateClimateChangeTurn', () => {
    test('should calculate complete turn with expectations and results', () => {
      const gameState = {
        resources: 100000,
        reputation: 50,
        emission_reduction: 10,
        international_cooperation: 30,
        technological_advancement: 25,
        climate_risk: 70,
        turn_number: 1
      };
      const decisions = { 'climate_choice_1': 'unified_targets' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculateClimateChangeTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
      expect(result.newGameState).toBeDefined();
      expect(result.linearExpectation).toBeDefined();
      expect(result.actualResult).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.newDelayedEffects).toBeDefined();
      expect(result.gameOver).toBe(false);
      
      // Verify that the new game state has updated values
      expect(result.newGameState.emission_reduction).toBeGreaterThanOrEqual(0);
      expect(typeof result.feedback).toBe('string');
    });

    test('should detect game over conditions', () => {
      const gameState = {
        resources: 5000,  // Very low resources
        reputation: 10,   // Very low international standing
        emission_reduction: 5, // Very low reduction
        international_cooperation: 5, // Very low cooperation
        technological_advancement: 10,
        climate_risk: 95, // Very high risk
        turn_number: 1
      };
      const decisions = { 'climate_choice_1': 'unified_targets' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculateClimateChangeTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
      // Should trigger game over due to high climate risk
      expect(result.gameOver).toBe(true);
      expect(result.gameOverReason).toBe('climate_risk');
    });
  });
});