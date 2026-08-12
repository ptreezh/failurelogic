/**
 * TDD Test Suite: Public Policy Making Simulation
 *
 * Phase 1: RED - Write failing test cases
 * Testing the Public Policy Decision Engine
 */

describe('PublicPolicyPageRouter', () => {
  let router;

  beforeEach(() => {
    const initialState = {
      satisfaction: 50,
      resources: 10000, // Budget allocation
      reputation: 50, // Public trust
      policy_effectiveness: 30, // Effectiveness rating
      public_support: 50, // Public support level
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      stakeholder_pressure: 20 // Pressure from different groups
    };
    router = new PublicPolicyPageRouter(initialState);
  });

  describe('Constructor', () => {
    test('should initialize with proper game state', () => {
      expect(router.gameState).toBeDefined();
      expect(router.gameState.resources).toBe(10000);
      expect(router.gameState.public_support).toBe(50);
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
      router.makeDecision('policy_choice_1', 'new_subway');
      expect(router.tempDecisions['policy_choice_1']).toBe('new_subway');
    });

    test('should select options', () => {
      router.selectOption(0);
      expect(router.tempOptions).toContain(0);
    });
  });

  describe('State Management', () => {
    test('should reset game to initial state', () => {
      router.makeDecision('policy_choice_1', 'new_subway');
      router.resetGame();
      expect(router.tempDecisions).toEqual({});
      expect(router.gameState.resources).toBe(10000);
    });
  });

  describe('Page Rendering', () => {
    test('should render start page', () => {
      router.currentPage = 'START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('公共政策制定模拟');
      expect(pageContent).toContain('城市规划者');
    });

    test('should render turn pages', () => {
      router.currentPage = 'TURN_1_START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('第1回合决策');
    });
  });
});

/**
 * TDD Test Suite: Public Policy Decision Engine
 */
describe('DecisionEngine.calculatePublicPolicyTurn', () => {
  let engine;

  beforeEach(() => {
    engine = new DecisionEngine();
  });

  describe('calculatePublicPolicyLinearExpectation', () => {
    test('should calculate linear expectation for subway construction', () => {
      const gameState = {
        resources: 10000,
        reputation: 50,
        public_support: 50,
        policy_effectiveness: 30
      };
      const decisions = { 'policy_choice_1': 'new_subway' };
      
      const expectation = DecisionEngine.calculatePublicPolicyLinearExpectation(1, decisions, gameState);
      
      expect(expectation.resources).toBeLessThan(10000); // Cost
      expect(expectation.policy_effectiveness).toBeGreaterThan(30);
      expect(expectation.thinking).toContain('地铁');
    });

    test('should calculate linear expectation for bus expansion', () => {
      const gameState = {
        resources: 10000,
        reputation: 50,
        public_support: 50,
        policy_effectiveness: 30
      };
      const decisions = { 'policy_choice_1': 'bus_expansion' };
      
      const expectation = DecisionEngine.calculatePublicPolicyLinearExpectation(1, decisions, gameState);
      
      expect(expectation.thinking).toContain('公交');
    });

    test('should handle turn 2 decisions', () => {
      const gameState = {
        resources: 8000,
        reputation: 45,
        public_support: 55,
        policy_effectiveness: 40
      };
      const decisions = { 'policy_choice_2': 'adjust_plan' };
      
      const expectation = DecisionEngine.calculatePublicPolicyLinearExpectation(2, decisions, gameState);
      
      expect(expectation.thinking).toContain('调整');
    });
  });

  describe('calculatePublicPolicyActualResult', () => {
    test('should calculate actual result with complex dynamics for subway', () => {
      const gameState = {
        resources: 10000,
        reputation: 50,
        public_support: 50,
        policy_effectiveness: 30,
        stakeholder_pressure: 20
      };
      const decisions = { 'policy_choice_1': 'new_subway' };
      const history = [];
      
      const result = DecisionEngine.calculatePublicPolicyActualResult(1, decisions, gameState, history);
      
      expect(result.effects).toBeDefined();
      expect(result.narrative).toBeDefined();
      expect(result.delayedEffects).toBeDefined();
      
      expect(typeof result.narrative).toBe('string');
      expect(Array.isArray(result.delayedEffects)).toBe(true);
    });

    test('should calculate actual result for bus expansion', () => {
      const gameState = {
        resources: 10000,
        reputation: 50,
        public_support: 50,
        policy_effectiveness: 30,
        stakeholder_pressure: 20
      };
      const decisions = { 'policy_choice_1': 'bus_expansion' };
      const history = [];
      
      const result = DecisionEngine.calculatePublicPolicyActualResult(1, decisions, gameState, history);
      
      expect(result.effects.policy_effectiveness).toBeGreaterThan(0);
      expect(result.effects.public_support).toBeDefined();
    });

    test('should calculate actual result for feedback response', () => {
      const gameState = {
        resources: 8000,
        reputation: 45,
        public_support: 40,
        policy_effectiveness: 35,
        stakeholder_pressure: 35
      };
      const decisions = { 'policy_choice_2': 'collect_feedback' };
      const history = [{turn: 1, decisions: {'policy_choice_1': 'new_subway'}}];
      
      const result = DecisionEngine.calculatePublicPolicyActualResult(2, decisions, gameState, history);
      
      expect(result.effects.public_support).toBeGreaterThan(0); // Should improve public support
      expect(result.effects.reputation).toBeDefined();
    });
  });

  describe('applyPublicPolicyDelayedEffects', () => {
    test('should apply delayed effects at correct turn', () => {
      const currentState = {
        resources: 10000,
        reputation: 50,
        public_support: 50
      };
      const delayedEffects = [
        {
          turn: 2,
          effect: { public_support: 15, policy_effectiveness: 10 },
          description: 'Policy effectiveness feedback'
        }
      ];
      
      const result = DecisionEngine.applyPublicPolicyDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.public_support).toBe(65);
      expect(result.state.policy_effectiveness).toBe(40);
      expect(result.remainingEffects).toEqual([]);
    });

    test('should not apply delayed effects for future turns', () => {
      const currentState = {
        resources: 10000,
        reputation: 50,
        public_support: 50
      };
      const delayedEffects = [
        {
          turn: 3,
          effect: { resources: -500, reputation: 5 },
          description: 'Future budget impact'
        }
      ];
      
      const result = DecisionEngine.applyPublicPolicyDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.resources).toBe(10000);
      expect(result.state.reputation).toBe(50);
      expect(result.remainingEffects).toEqual(delayedEffects);
    });
  });

  describe('generatePublicPolicyFeedback', () => {
    test('should generate meaningful feedback for turn results', () => {
      const linearExpectation = {
        resources: 8000,
        public_support: 60,
        policy_effectiveness: 50,
        thinking: 'Subway construction will solve traffic problems and gain public support'
      };
      const actualResult = {
        resources: 7500,
        public_support: 45,
        policy_effectiveness: 35,
        changes: { resources: -2500, public_support: -5, policy_effectiveness: -15 }
      };
      const narrative = 'Subway construction caused disruption, cost overruns, and didn\'t immediately solve traffic';

      const feedback = DecisionEngine.generatePublicPolicyFeedback(1, linearExpectation, actualResult, narrative);

      expect(feedback).toContain('第1回合结果');
      expect(feedback).toContain('实际结果');
      expect(feedback).toContain('偏差分析');
    });
  });

  describe('calculatePublicPolicyTurn', () => {
    test('should calculate complete turn with expectations and results', () => {
      const gameState = {
        resources: 10000,
        reputation: 50,
        public_support: 50,
        policy_effectiveness: 30,
        stakeholder_pressure: 20,
        turn_number: 1
      };
      const decisions = { 'policy_choice_1': 'new_subway' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculatePublicPolicyTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
      expect(result.newGameState).toBeDefined();
      expect(result.linearExpectation).toBeDefined();
      expect(result.actualResult).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.newDelayedEffects).toBeDefined();
      expect(result.gameOver).toBe(false);
      
      // Verify that the new game state has updated values
      expect(result.newGameState.resources).toBeLessThan(10000); // Due to subway cost
      expect(typeof result.feedback).toBe('string');
    });

    test('should detect game over conditions', () => {
      const gameState = {
        resources: 500,  // Very low budget
        reputation: 10,  // Very low trust
        public_support: 15, // Very low support
        policy_effectiveness: 5,
        stakeholder_pressure: 80,
        turn_number: 1
      };
      const decisions = { 'policy_choice_1': 'new_subway' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculatePublicPolicyTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
      // Should trigger game over due to low reputation/public support
      expect(result.gameOver).toBe(true);
      expect(result.gameOverReason).toBe('reputation');
    });
  });
});