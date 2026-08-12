/**
 * TDD Test Suite: AI Governance and Regulation Decision Simulation
 *
 * Phase 1: RED - Write failing test cases
 * Testing the AI Governance Decision Engine
 */

describe('AIGovernancePageRouter', () => {
  let router;

  beforeEach(() => {
    const initialState = {
      satisfaction: 50,
      resources: 50000, // Regulatory budget
      reputation: 50,    // Public trust in regulation
      ai_capability_assessment: 30, // AI capability evaluation score
      safety_compliance: 25, // Safety compliance level
      ethical_adherence: 40, // Ethical adherence score
      innovation_balance: 35, // Balance between innovation and safety
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],
      stakeholder_pressure: 60 // Pressure from various stakeholders
    };
    router = new AIGovernancePageRouter(initialState);
  });

  describe('Constructor', () => {
    test('should initialize with proper game state', () => {
      expect(router.gameState).toBeDefined();
      expect(router.gameState.resources).toBe(50000);
      expect(router.gameState.ai_capability_assessment).toBe(30);
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
      router.makeDecision('ai_gov_choice_1', 'task_based_standards');
      expect(router.tempDecisions['ai_gov_choice_1']).toBe('task_based_standards');
    });

    test('should select options', () => {
      router.selectOption(0);
      expect(router.tempOptions).toContain(0);
    });
  });

  describe('State Management', () => {
    test('should reset game to initial state', () => {
      router.makeDecision('ai_gov_choice_1', 'task_based_standards');
      router.resetGame();
      expect(router.tempDecisions).toEqual({});
      expect(router.gameState.resources).toBe(50000);
    });
  });

  describe('Page Rendering', () => {
    test('should render start page', () => {
      router.currentPage = 'START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('AI治理与监管决策模拟');
      expect(pageContent).toContain('AI发展委员会');
    });

    test('should render turn pages', () => {
      router.currentPage = 'TURN_1_START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('第1回合决策');
    });
  });
});

/**
 * TDD Test Suite: AI Governance Decision Engine
 */
describe('DecisionEngine.calculateAIGovernanceTurn', () => {
  let engine;

  beforeEach(() => {
    engine = new DecisionEngine();
  });

  describe('calculateAIGovernanceLinearExpectation', () => {
    test('should calculate linear expectation for task-based standards', () => {
      const gameState = {
        resources: 50000,
        reputation: 50,
        ai_capability_assessment: 30,
        safety_compliance: 25
      };
      const decisions = { 'ai_gov_choice_1': 'task_based_standards' };
      
      const expectation = DecisionEngine.calculateAIGovernanceLinearExpectation(1, decisions, gameState);
      
      expect(expectation.ai_capability_assessment).toBeGreaterThan(30);
      expect(expectation.thinking).toContain('基于任务');
    });

    test('should calculate linear expectation for safety constraints', () => {
      const gameState = {
        resources: 50000,
        reputation: 50,
        ai_capability_assessment: 30,
        safety_compliance: 25
      };
      const decisions = { 'ai_gov_choice_1': 'safety_constraints' };
      
      const expectation = DecisionEngine.calculateAIGovernanceLinearExpectation(1, decisions, gameState);
      
      expect(expectation.thinking).toContain('安全');
    });

    test('should handle ethical framework expectations', () => {
      const gameState = {
        resources: 50000,
        reputation: 50,
        ai_capability_assessment: 30,
        safety_compliance: 25
      };
      const decisions = { 'ai_gov_choice_1': 'ethical_framework' };
      const history = [];
      
      const expectation = DecisionEngine.calculateAIGovernanceLinearExpectation(1, decisions, gameState);
      
      expect(expectation.thinking).toContain('伦理');
    });
  });

  describe('calculateAIGovernanceActualResult', () => {
    test('should calculate actual result with complex dynamics for task-based standards', () => {
      const gameState = {
        resources: 50000,
        reputation: 50,
        ai_capability_assessment: 30,
        safety_compliance: 25,
        ethical_adherence: 40,
        innovation_balance: 35,
        stakeholder_pressure: 60
      };
      const decisions = { 'ai_gov_choice_1': 'task_based_standards' };
      const history = [];
      
      const result = DecisionEngine.calculateAIGovernanceActualResult(1, decisions, gameState, history);
      
      expect(result.effects).toBeDefined();
      expect(result.narrative).toBeDefined();
      expect(result.delayedEffects).toBeDefined();
      
      expect(typeof result.narrative).toBe('string');
      expect(Array.isArray(result.delayedEffects)).toBe(true);
    });

    test('should calculate actual result for safety-focused approach', () => {
      const gameState = {
        resources: 50000,
        reputation: 50,
        ai_capability_assessment: 30,
        safety_compliance: 25,
        ethical_adherence: 40,
        innovation_balance: 35,
        stakeholder_pressure: 60
      };
      const decisions = { 'ai_gov_choice_1': 'safety_constraints' };
      const history = [];
      
      const result = DecisionEngine.calculateAIGovernanceActualResult(1, decisions, gameState, history);
      
      expect(result.effects.safety_compliance).toBeGreaterThan(25);
      expect(result.effects.innovation_balance).toBeDefined();
    });

    test('should calculate actual result for ethical framework', () => {
      const gameState = {
        resources: 50000,
        reputation: 50,
        ai_capability_assessment: 30,
        safety_compliance: 25,
        ethical_adherence: 40,
        innovation_balance: 35,
        stakeholder_pressure: 60
      };
      const decisions = { 'ai_gov_choice_1': 'ethical_framework' };
      const history = [{turn: 1, decisions: {'ai_gov_choice_1': 'task_based_standards'}}];
      
      const result = DecisionEngine.calculateAIGovernanceActualResult(2, decisions, gameState, history);
      
      expect(result.effects.ethical_adherence).toBeGreaterThan(40);
      expect(result.effects.reputation).toBeDefined();
    });
  });

  describe('applyAIGovernanceDelayedEffects', () => {
    test('should apply delayed effects at correct turn', () => {
      const currentState = {
        resources: 50000,
        reputation: 50,
        ai_capability_assessment: 30
      };
      const delayedEffects = [
        {
          turn: 2,
          effect: { ai_capability_assessment: 15, ethical_adherence: 10 },
          description: 'Ethical framework impact'
        }
      ];
      
      const result = DecisionEngine.applyAIGovernanceDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.ai_capability_assessment).toBe(45);
      expect(result.state.ethical_adherence).toBe(50); // assuming starting value of 40
      expect(result.remainingEffects).toEqual([]);
    });

    test('should not apply delayed effects for future turns', () => {
      const currentState = {
        resources: 50000,
        reputation: 50,
        ai_capability_assessment: 30
      };
      const delayedEffects = [
        {
          turn: 3,
          effect: { resources: 5000, reputation: 10 },
          description: 'Future regulatory impact'
        }
      ];
      
      const result = DecisionEngine.applyAIGovernanceDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.resources).toBe(50000);
      expect(result.state.reputation).toBe(50);
      expect(result.remainingEffects).toEqual(delayedEffects);
    });
  });

  describe('generateAIGovernanceFeedback', () => {
    test('should generate meaningful feedback for turn results', () => {
      const linearExpectation = {
        ai_capability_assessment: 45,
        safety_compliance: 40,
        thinking: 'Task-based standards will provide clear evaluation criteria'
      };
      const actualResult = {
        ai_capability_assessment: 38,
        safety_compliance: 32,
        changes: { ai_capability_assessment: 8, safety_compliance: 7 }
      };
      const narrative = 'Task-based standards proved difficult to implement due to rapid AI evolution';

      const feedback = DecisionEngine.generateAIGovernanceFeedback(1, linearExpectation, actualResult, narrative);

      expect(feedback).toContain('第1回合结果');
      expect(feedback).toContain('实际结果');
      expect(feedback).toContain('偏差分析');
    });
  });

  describe('calculateAIGovernanceTurn', () => {
    test('should calculate complete turn with expectations and results', () => {
      const gameState = {
        resources: 50000,
        reputation: 50,
        ai_capability_assessment: 30,
        safety_compliance: 25,
        ethical_adherence: 40,
        innovation_balance: 35,
        stakeholder_pressure: 60,
        turn_number: 1
      };
      const decisions = { 'ai_gov_choice_1': 'comprehensive_framework' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculateAIGovernanceTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
      expect(result.newGameState).toBeDefined();
      expect(result.linearExpectation).toBeDefined();
      expect(result.actualResult).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.newDelayedEffects).toBeDefined();
      expect(result.gameOver).toBe(false);
      
      // Verify that the new game state has updated values
      expect(result.newGameState.ai_capability_assessment).toBeGreaterThanOrEqual(0);
      expect(typeof result.feedback).toBe('string');
    });

    test('should detect game over conditions', () => {
      const gameState = {
        resources: 2000,  // Very low resources
        reputation: 10,   // Very low public trust
        ai_capability_assessment: 5, // Very low assessment
        safety_compliance: 8, // Very low compliance
        ethical_adherence: 10,
        innovation_balance: 5,
        stakeholder_pressure: 90, // Very high pressure
        turn_number: 1
      };
      const decisions = { 'ai_gov_choice_1': 'comprehensive_framework' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculateAIGovernanceTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
      // Should trigger game over due to low reputation/resources
      expect(result.gameOver).toBe(true);
      expect(result.gameOverReason).toBe('reputation');
    });
  });
});