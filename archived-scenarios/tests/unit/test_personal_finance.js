/**
 * TDD Test Suite: Personal Finance Decision Simulation
 *
 * Phase 1: RED - Write failing test cases
 * Testing the Personal Finance Decision Engine
 */

describe('PersonalFinancePageRouter', () => {
  let router;

  beforeEach(() => {
    const initialState = {
      satisfaction: 50,
      resources: 150000, // Total savings/investments
      income: 100000,    // Annual income
      debt: 0,           // Debt level
      financial_knowledge: 30, // Financial literacy score
      risk_tolerance: 50, // Risk tolerance level
      turn_number: 1,
      decision_history: [],
      delayed_effects: []
    };
    router = new PersonalFinancePageRouter(initialState);
  });

  describe('Constructor', () => {
    test('should initialize with proper game state', () => {
      expect(router.gameState).toBeDefined();
      expect(router.gameState.income).toBe(100000);
      expect(router.gameState.resources).toBe(150000);
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
      router.makeDecision('finance_choice_1', 'buy_car');
      expect(router.tempDecisions['finance_choice_1']).toBe('buy_car');
    });

    test('should select options', () => {
      router.selectOption(0);
      expect(router.tempOptions).toContain(0);
    });
  });

  describe('State Management', () => {
    test('should reset game to initial state', () => {
      router.makeDecision('finance_choice_1', 'buy_car');
      router.resetGame();
      expect(router.tempDecisions).toEqual({});
      expect(router.gameState.income).toBe(100000);
    });
  });

  describe('Page Rendering', () => {
    test('should render start page', () => {
      router.currentPage = 'START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('个人理财决策模拟');
      expect(pageContent).toContain('刚毕业');
    });

    test('should render turn pages', () => {
      router.currentPage = 'TURN_1_START';
      const pageContent = router.renderPage();
      expect(pageContent).toContain('第1回合决策');
    });
  });
});

/**
 * TDD Test Suite: Personal Finance Decision Engine
 */
describe('DecisionEngine.calculatePersonalFinanceTurn', () => {
  let engine;

  beforeEach(() => {
    engine = new DecisionEngine();
  });

  describe('calculatePersonalFinanceLinearExpectation', () => {
    test('should calculate linear expectation for car purchase', () => {
      const gameState = {
        resources: 150000,
        income: 100000,
        debt: 0,
        financial_knowledge: 30
      };
      const decisions = { 'finance_choice_1': 'buy_car' };
      
      const expectation = DecisionEngine.calculatePersonalFinanceLinearExpectation(1, decisions, gameState);
      
      expect(expectation.resources).toBeLessThan(150000);
      expect(expectation.thinking).toContain('车');
    });

    test('should calculate linear expectation for index fund investment', () => {
      const gameState = {
        resources: 150000,
        income: 100000,
        debt: 0,
        financial_knowledge: 30
      };
      const decisions = { 'finance_choice_1': 'index_fund' };
      
      const expectation = DecisionEngine.calculatePersonalFinanceLinearExpectation(1, decisions, gameState);
      
      expect(expectation.resources).toBeGreaterThan(150000);
      expect(expectation.thinking).toContain('基金');
    });

    test('should handle compound growth expectations', () => {
      const gameState = {
        resources: 150000,
        income: 100000,
        debt: 0,
        financial_knowledge: 30
      };
      const decisions = { 'finance_choice_2': 'continue_investment' };
      const history = [{turn: 1, decisions: {'finance_choice_1': 'index_fund'}}];
      
      const expectation = DecisionEngine.calculatePersonalFinanceLinearExpectation(2, decisions, gameState);
      
      expect(expectation.thinking).toContain('复利');
    });
  });

  describe('calculatePersonalFinanceActualResult', () => {
    test('should calculate actual result with compound effects for index fund', () => {
      const gameState = {
        resources: 150000,
        income: 100000,
        debt: 0,
        financial_knowledge: 30,
        risk_tolerance: 50
      };
      const decisions = { 'finance_choice_1': 'index_fund' };
      const history = [];
      
      const result = DecisionEngine.calculatePersonalFinanceActualResult(1, decisions, gameState, history);
      
      expect(result.effects).toBeDefined();
      expect(result.narrative).toBeDefined();
      expect(result.delayedEffects).toBeDefined();
      
      // Index fund should have delayed effects due to compounding
      expect(result.effects.resources).toBeCloseTo(0, -2); // Near zero initially
      expect(Array.isArray(result.delayedEffects)).toBe(true);
      expect(result.delayedEffects.length).toBeGreaterThan(0);
    });

    test('should calculate actual result for car purchase', () => {
      const gameState = {
        resources: 150000,
        income: 100000,
        debt: 0,
        financial_knowledge: 30,
        risk_tolerance: 50
      };
      const decisions = { 'finance_choice_1': 'buy_car' };
      const history = [];
      
      const result = DecisionEngine.calculatePersonalFinanceActualResult(1, decisions, gameState, history);
      
      expect(result.effects.resources).toBeLessThan(0); // Negative due to car purchase
      expect(result.effects.financial_knowledge).toBeDefined();
    });

    test('should calculate actual result for continued investment', () => {
      const gameState = {
        resources: 160000,
        income: 105000,
        debt: 0,
        financial_knowledge: 40,
        risk_tolerance: 55
      };
      const decisions = { 'finance_choice_2': 'continue_investment' };
      const history = [{turn: 1, decisions: {'finance_choice_1': 'index_fund'}}];
      
      const result = DecisionEngine.calculatePersonalFinanceActualResult(2, decisions, gameState, history);
      
      expect(result.effects.resources).toBeDefined();
      expect(result.effects.financial_knowledge).toBeGreaterThan(0); // Should improve with experience
    });
  });

  describe('applyPersonalFinanceDelayedEffects', () => {
    test('should apply delayed effects at correct turn', () => {
      const currentState = {
        resources: 150000,
        income: 100000,
        financial_knowledge: 30
      };
      const delayedEffects = [
        {
          turn: 2,
          effect: { resources: 7500, financial_knowledge: 5 }, // 5% return + learning
          description: 'Index fund growth effect'
        }
      ];
      
      const result = DecisionEngine.applyPersonalFinanceDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.resources).toBe(157500);
      expect(result.state.financial_knowledge).toBe(35);
      expect(result.remainingEffects).toEqual([]);
    });

    test('should not apply delayed effects for future turns', () => {
      const currentState = {
        resources: 150000,
        income: 100000,
        financial_knowledge: 30
      };
      const delayedEffects = [
        {
          turn: 3,
          effect: { resources: 15000, financial_knowledge: 10 },
          description: 'Long-term investment growth'
        }
      ];
      
      const result = DecisionEngine.applyPersonalFinanceDelayedEffects(2, delayedEffects, currentState);
      
      expect(result.state.resources).toBe(150000);
      expect(result.state.financial_knowledge).toBe(30);
      expect(result.remainingEffects).toEqual(delayedEffects);
    });
  });

  describe('generatePersonalFinanceFeedback', () => {
    test('should generate meaningful feedback for turn results', () => {
      const linearExpectation = {
        resources: 155000,
        financial_knowledge: 35,
        thinking: 'Index fund investment will provide steady growth with minimal risk'
      };
      const actualResult = {
        resources: 152000,
        financial_knowledge: 33,
        changes: { resources: 2000, financial_knowledge: 3 }
      };
      const narrative = 'Index fund returned 2% this year, slightly below the expected 3.3%';

      const feedback = DecisionEngine.generatePersonalFinanceFeedback(1, linearExpectation, actualResult, narrative);

      expect(feedback).toContain('第1回合结果');
      expect(feedback).toContain('实际结果');
      expect(feedback).toContain('偏差分析');
    });
  });

  describe('calculatePersonalFinanceTurn', () => {
    test('should calculate complete turn with expectations and results', () => {
      const gameState = {
        resources: 150000,
        income: 100000,
        debt: 0,
        financial_knowledge: 30,
        risk_tolerance: 50,
        turn_number: 1
      };
      const decisions = { 'finance_choice_1': 'index_fund' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculatePersonalFinanceTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
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
        income: 30000,   // Low income
        debt: 150000,    // Very high debt
        financial_knowledge: 10, // Low knowledge
        risk_tolerance: 80, // High risk tolerance
        turn_number: 1
      };
      const decisions = { 'finance_choice_1': 'risky_investment' };
      const decisionHistory = [];
      const delayedEffects = [];
      
      const result = DecisionEngine.calculatePersonalFinanceTurn(1, decisions, gameState, decisionHistory, delayedEffects);
      
      // Should trigger game over due to high debt/resources ratio
      expect(result.gameOver).toBe(true);
      expect(result.gameOverReason).toBe('debt');
    });
  });
});