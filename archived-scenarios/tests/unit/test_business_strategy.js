/**
 * TDD Test Suite: Business Strategy Reasoning Game
 *
 * Phase 1: RED - Write failing test cases
 * Testing the Business Strategy Decision Engine
 */

describe('BusinessStrategyPageRouter', () => {
  let router;

  beforeEach(() => {
    const initialState = {
      satisfaction: 50,
      resources: 10000,
      reputation: 50,
      market_position: 30,
      product_quality: 50,
      competitive_pressure: 20,
      turn_number: 1,
      decision_history: [],
      delayed_effects: []
    };
    router = new BusinessStrategyPageRouter(initialState);
  });

  describe('Constructor', () => {
    test('should initialize with proper game state', () => {
      expect(router.gameState).toBeDefined();
      expect(router.gameState.resources).toBe(10000);
      expect(router.gameState.reputation).toBe(50);
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
      router.makeDecision('strategy_choice_1', 'rush_to_market');
      expect(router.tempDecisions['strategy_choice_1']).toBe('rush_to_market');
    });

    test('should select options', () => {
      router.selectOption(0);
      expect(router.tempOptions).toContain(0);
    });
  });

  describe('State Management', () => {
    test('should reset game to initial state', () => {
      router.makeDecision('strategy_choice_1', 'rush_to_market');
      router.resetGame();
      expect(router.tempDecisions).toEqual({});
      expect(router.gameState.resources).toBe(10000);
    });
  });

  describe('Page Rendering', () => {
    test('should render start page', () => {
      router.currentPage = 'START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('商业战略推理游戏');
      expect(pageContent).toContain('CEO');
    });

    test('should render turn pages', () => {
      router.currentPage = 'TURN_1_START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('第1回合决策');
    });
  });
});

/**
 * TDD Test Suite: Business Strategy Decision Engine
 */
describe('DecisionEngine.calculateBusinessStrategyTurn', () => {
  let engine;

  beforeEach(() => {
    engine = new DecisionEngine();
  });

  describe('calculateBusinessStrategyLinearExpectation', () => {
    test('should calculate linear expectation for rush to market strategy', () => {
      const gameState = {
        resources: 10000,
        reputation: 50,
        market_position: 30
      };
      const decisions = { 'strategy_choice_1': 'rush_to_market' };
      
      const expectation = DecisionEngine.calculateBusinessStrategyLinearExpectation(1, decisions, gameState);
      
      expect(expectation.resources).toBeGreaterThan(10000);
      expect(expectation.thinking).toContain('快速上市');
    });

    test('should calculate linear expectation for perfect product strategy', () => {
      const gameState = {
        resources: 10000,
        reputation: 50,
        market_position: 30
      };
      const decisions = { 'strategy_choice_1': 'perfect_product' };
      
      const expectation = DecisionEngine.calculateBusinessStrategyLinearExpectation(1, decisions, gameState);
      
      expect(expectation.reputation).toBeGreaterThan(50);
      expect(expectation.thinking).toContain('完美产品');
    });

    test('should handle turn 2 decisions', () => {
      const gameState = {
        resources: 10500,
        reputation: 45,
        market_position: 35
      };
      const decisions = { 'strategy_choice_2': 'recall_all' };
      
      const expectation = DecisionEngine.calculateBusinessStrategyLinearExpectation(2, decisions, gameState);
      
      expect(expectation.thinking).toContain('召回');
    });
  });

  describe('calculateBusinessStrategyActualResult', () => {
    test('should calculate actual result with complex dynamics for rush to market', () => {
      const gameState = {
        resources: 10000,
        reputation: 50,
        market_position: 30,
        product_quality: 50,
        competitive_pressure: 20
      };
      const decisions = { 'strategy_choice_1': 'rush_to_market' };
      const history = [];
      
      const result = DecisionEngine.calculateBusinessStrategyActualResult(1, decisions, gameState, history);
      
      expect(result.effects).toBeDefined();
      expect(result.narrative).toBeDefined();
      expect(result.delayedEffects).toBeDefined();
      
      // With rush to market, actual results should differ from linear expectations
      // Resources gain should be lower than linear expectation due to quality issues
      // Reputation should decrease due to quality concerns
      expect(typeof result.narrative).toBe('string');
      expect(Array.isArray(result.delayedEffects)).toBe(true);
    });

    test('should calculate actual result for quality-focused strategy', () => {
      const gameState = {
        resources: 10000,
        reputation: 50,
        market_position: 30,
        product_quality: 50,
        competitive_pressure: 20
      };
      const decisions = { 'strategy_choice_1': 'perfect_product' };
      const history = [];
      
      const result = DecisionEngine.calculateBusinessStrategyActualResult(1, decisions, gameState, history);
      
      expect(result.effects.product_quality).toBeGreaterThan(0);
      expect(result.effects.reputation).toBeGreaterThan(0);
    });

    test('should calculate actual result for recall decision', () => {
      const gameState = {
        resources: 10500,
        reputation: 45,
        market_position: 40,
        product_quality: 40,
        competitive_pressure: 25
      };
      const decisions = { 'strategy_choice_2': 'recall_all' };
      const history = [{turn: 1, decisions: {'strategy_choice_1': 'rush_to_market'}}];
      
      const result = DecisionEngine.calculateBusinessStrategyActualResult(2, decisions, gameState, history);
      
      expect(result.effects.reputation).toBeGreaterThan(0); // Should improve reputation
      expect(result.effects.resources).toBeLessThan(0); // Should cost money
    });
  });

  describe('applyBusinessStrategyDelayedEffects', () => {
    test('should apply delayed effects at correct turn', () => {
      const currentState = {
        resources: 10000,
        reputation: 50,
        market_position: 30
      };
      const delayedEffects = [
        {
          turn: 2,
          effect: { resources: 500, reputation: 10 },
          description: 'Quality improvement effect'
        }
      ];
      
      const result = DecisionEngine.applyBusinessStrategyDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.resources).toBe(10500);
      expect(result.state.reputation).toBe(60);
      expect(result.remainingEffects).toEqual([]);
    });

    test('should not apply delayed effects for future turns', () => {
      const currentState = {
        resources: 10000,
        reputation: 50,
        market_position: 30
      };
      const delayedEffects = [
        {
          turn: 3,
          effect: { resources: 500, reputation: 10 },
          description: 'Future effect'
        }
      ];
      
      const result = DecisionEngine.applyBusinessStrategyDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.resources).toBe(10000);
      expect(result.state.reputation).toBe(50);
      expect(result.remainingEffects).toEqual(delayedEffects);
    });
  });

  describe('generateBusinessStrategyFeedback', () => {
    test('should generate meaningful feedback for turn results', () => {
      const linearExpectation = {
        resources: 11000,
        reputation: 55,
        market_position: 40,
        thinking: 'Quick market entry will gain early advantage'
      };
      const actualResult = {
        resources: 10500,
        reputation: 48,
        market_position: 35,
        changes: { resources: 500, reputation: -2, market_position: -5 }
      };
      const narrative = 'Quick entry led to quality issues that hurt reputation';

      const feedback = DecisionEngine.generateBusinessStrategyFeedback(1, linearExpectation, actualResult, narrative);

      expect(feedback).toContain('第1回合结果');
      expect(feedback).toContain('实际结果');
      expect(feedback).toContain('偏差分析');
    });
  });

  describe('calculateBusinessStrategyTurn', () => {
    test('should calculate complete turn with expectations and results', () => {
      const gameState = {
        resources: 10000,
        reputation: 50,
        market_position: 30,
        product_quality: 50,
        competitive_pressure: 20,
        turn_number: 1
      };
      const decisions = { 'strategy_choice_1': 'rush_to_market' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculateBusinessStrategyTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
      expect(result.newGameState).toBeDefined();
      expect(result.linearExpectation).toBeDefined();
      expect(result.actualResult).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.newDelayedEffects).toBeDefined();
      expect(result.gameOver).toBe(false);
      
      // Verify that the new game state has updated values
      expect(result.newGameState.resources).toBeGreaterThanOrEqual(0);
      expect(typeof result.feedback).toBe('string');
    });

    test('should detect game over conditions', () => {
      const gameState = {
        resources: 500,  // Very low resources
        reputation: 50,
        market_position: 30,
        product_quality: 50,
        competitive_pressure: 20,
        turn_number: 1
      };
      const decisions = { 'strategy_choice_1': 'rush_to_market' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculateBusinessStrategyTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
      // Should trigger game over due to low resources
      expect(result.gameOver).toBe(true);
      expect(result.gameOverReason).toBe('resources');
    });
  });
});