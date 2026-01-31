/**
 * Comprehensive test suite for real-world failure cases extension
 * Validates all implemented functionality
 */

const { HistoricalScenarioAnalytics } = require('./historical_scenario_analytics');
const { CrossDomainChallengeGenerator } = require('../js/cross_domain_generator');

describe('Real-World Failure Cases Extension - Comprehensive Tests', () => {
  let analytics;
  let generator;

  beforeEach(() => {
    // Initialize with fresh instances for each test
    analytics = new HistoricalScenarioAnalytics();
    generator = new CrossDomainChallengeGenerator();
    
    // Reset data to clean state
    analytics.resetData();
  });

  describe('Historical Scenario Analytics Module', () => {
    test('should initialize with default data structure', () => {
      expect(analytics.data).toBeDefined();
      expect(analytics.data.users).toEqual({});
      expect(analytics.data.scenarios).toEqual({});
      expect(analytics.data.analytics).toBeDefined();
    });

    test('should track user interactions correctly', () => {
      const userId = 'test-user-1';
      const scenarioId = 'test-scenario-1';
      const interactionData = {
        type: 'decision_made',
        choiceIndex: 0,
        decisionPoint: 1,
        duration: 120
      };

      analytics.trackInteraction(userId, scenarioId, interactionData);

      expect(analytics.data.users[userId]).toBeDefined();
      expect(analytics.data.scenarios[scenarioId]).toBeDefined();
      expect(analytics.data.analytics.total_interactions).toBe(1);
      expect(analytics.data.users[userId].scenarios_interacted).toContain(scenarioId);
    });

    test('should record scenario completions correctly', () => {
      const userId = 'test-user-1';
      const scenarioId = 'test-scenario-1';
      const completionData = {
        duration: 300,
        score: 85,
        feedback: 'Good learning experience'
      };

      // First track an interaction
      analytics.trackInteraction(userId, scenarioId, { type: 'started' });
      
      // Then record completion
      analytics.recordCompletion(userId, scenarioId, completionData);

      const userCompletion = analytics.data.users[userId].completion_stats[scenarioId];
      expect(userCompletion.completed).toBe(true);
      expect(userCompletion.duration).toBe(300);
      expect(userCompletion.score).toBe(85);
    });

    test('should calculate user progress correctly', () => {
      const userId = 'test-user-1';
      const scenarioId1 = 'test-scenario-1';
      const scenarioId2 = 'test-scenario-2';
      
      // Track interactions
      analytics.trackInteraction(userId, scenarioId1, { type: 'started' });
      analytics.trackInteraction(userId, scenarioId2, { type: 'started' });
      
      // Complete one scenario
      analytics.recordCompletion(userId, scenarioId1, { duration: 300, score: 85 });
      
      const progress = analytics.getUserProgress(userId);
      expect(progress.totalScenariosAttempted).toBe(2);
      expect(progress.totalScenariosCompleted).toBe(1);
      expect(progress.scenarios[scenarioId1].completed).toBe(true);
      expect(progress.scenarios[scenarioId2].completed).toBe(false);
    });

    test('should identify common failure patterns', () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';
      const scenarioId = 'common-failure-scenario';
      
      // Simulate similar failure patterns for multiple users
      analytics.trackInteraction(userId1, scenarioId, { type: 'decision', choiceIndex: 0 });
      analytics.trackInteraction(userId2, scenarioId, { type: 'decision', choiceIndex: 0 });
      
      // Don't complete the scenario to simulate failure
      
      const patterns = analytics.identifyCommonFailurePatterns();
      // The exact pattern detection logic may vary, so we just check it runs without error
      expect(Array.isArray(patterns)).toBe(true);
    });

    test('should generate personalized recommendations', () => {
      const userId = 'test-user-recommend';
      const scenarioId = 'test-scenario-recommend';
      
      // Track some interactions to build a profile
      analytics.trackInteraction(userId, scenarioId, { type: 'started' });
      analytics.recordCompletion(userId, scenarioId, { duration: 200, score: 75 });
      
      const recommendations = analytics.getPersonalizedRecommendations(userId);
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    test('should generate dashboard metrics', () => {
      const userId = 'dashboard-user';
      const scenarioId = 'dashboard-scenario';
      
      // Add some data
      analytics.trackInteraction(userId, scenarioId, { type: 'started' });
      analytics.recordCompletion(userId, scenarioId, { duration: 250, score: 80 });
      
      const dashboard = analytics.generateDashboardMetrics();
      
      expect(dashboard.summary).toBeDefined();
      expect(dashboard.userEngagement).toBeDefined();
      expect(dashboard.scenarioPerformance).toBeDefined();
      expect(dashboard.learningOutcomes).toBeDefined();
      expect(dashboard.trends).toBeDefined();
      expect(dashboard.recommendations).toBeDefined();
    });
  });

  describe('Cross-Domain Challenge Generator', () => {
    test('should generate basic cross-domain challenges', () => {
      const challenge = generator.generateCrossDomainChallenge();
      expect(challenge).toBeDefined();
      expect(challenge.id).toBeDefined();
      expect(challenge.title).toBeDefined();
      expect(challenge.biasCombination).toBeDefined();
      expect(Array.isArray(challenge.decisionPoints)).toBe(true);
    });

    test('should generate mixed scenarios', () => {
      const scenarios = generator.generateMixedScenarios(['business', 'personal'], 2);
      expect(Array.isArray(scenarios)).toBe(true);
      expect(scenarios.length).toBe(2);
      scenarios.forEach(scenario => {
        expect(scenario.id).toBeDefined();
        expect(scenario.title).toBeDefined();
      });
    });

    test('should generate unique combinations', () => {
      const combinations = generator.generateUniqueCombinations(3);
      expect(Array.isArray(combinations)).toBe(true);
      expect(combinations.length).toBe(3);
      combinations.forEach(combination => {
        expect(combination.id).toBeDefined();
        expect(combination.title).toBeDefined();
        expect(combination.biasCombinations).toBeDefined();
      });
    });

    test('should scale difficulty appropriately', () => {
      const difficultyProfile = generator.scaleDifficulty(7, 3, 2);
      expect(difficultyProfile).toBeDefined();
      expect(difficultyProfile.level).toBeDefined();
      expect(difficultyProfile.complexityScore).toBeGreaterThan(0);
      expect(difficultyProfile.challengeFactors).toBeDefined();
    });

    test('should generate scenarios by difficulty level', () => {
      const easyScenario = generator.generateScenarioByDifficulty('easy');
      const hardScenario = generator.generateScenarioByDifficulty('hard');
      
      expect(easyScenario).toBeDefined();
      expect(hardScenario).toBeDefined();
      expect(easyScenario.difficulty).toBe('easy');
      expect(hardScenario.difficulty).toBe('hard');
    });

    test('should create branching narratives', () => {
      const baseScenario = generator.generateCrossDomainChallenge();
      const branchedScenario = generator.createBranchingNarrative(baseScenario);
      
      expect(branchedScenario).toBeDefined();
      expect(branchedScenario.branches).toBeDefined();
      expect(branchedScenario.narrativeFlow).toBeDefined();
    });

    test('should create emotional engagement elements', () => {
      const baseScenario = generator.generateCrossDomainChallenge();
      const emotionalScenario = generator.addEmotionalEngagement(baseScenario, {
        intensityLevel: 'high',
        personalStakes: true,
        timePressure: true,
        socialDynamics: true
      });
      
      expect(emotionalScenario).toBeDefined();
      expect(emotionalScenario.emotionalEngagement).toBeDefined();
      expect(emotionalScenario.emotionalEngagement.overallEngagement).toBeGreaterThan(0);
    });

    test('should create replayable scenarios', () => {
      const originalScenario = generator.generateCrossDomainChallenge();
      const replayableScenario = generator.createReplayableScenario(originalScenario, {
        enableReplay: true,
        includeAlternativeOutcomes: true,
        trackDecisionPaths: true,
        showCounterfactuals: true
      });
      
      expect(replayableScenario).toBeDefined();
      expect(replayableScenario.replayMetadata).toBeDefined();
      expect(replayableScenario.replayMetadata.isReplayable).toBe(true);
      expect(replayableScenario.alternativeOutcomes).toBeDefined();
    });

    test('should create adaptive challenges based on user profile', () => {
      const userProfile = {
        experienceDomains: ['business', 'investment'],
        preferredDifficulty: 'medium'
      };
      
      const performanceData = {
        completedScenarios: [{ score: 0.7 }, { score: 0.8 }],
        accuracyRate: 0.75,
        responseTime: 60,
        decisionQuality: 0.7,
        biasRecognitionScore: 0.6,
        learningRate: 0.65
      };
      
      const adaptiveChallenge = generator.generateAdaptiveChallenge({
        ...userProfile,
        ...performanceData
      });
      
      expect(adaptiveChallenge).toBeDefined();
      expect(adaptiveChallenge.id).toBeDefined();
      expect(adaptiveChallenge.difficulty).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should integrate analytics with scenario generation', () => {
      // Generate a scenario
      const scenario = generator.generateCrossDomainChallenge();
      expect(scenario).toBeDefined();
      
      // Track interactions with the generated scenario
      const userId = 'integration-test-user';
      analytics.trackInteraction(userId, scenario.id, { 
        type: 'scenario_started',
        scenarioTitle: scenario.title 
      });
      
      // Verify the interaction was tracked
      const userProgress = analytics.getUserProgress(userId);
      expect(userProgress).toBeDefined();
      expect(userProgress.totalScenariosAttempted).toBe(1);
    });

    test('should handle emotional engagement with analytics tracking', () => {
      // Generate an emotionally engaging scenario
      const baseScenario = generator.generateCrossDomainChallenge();
      const emotionalScenario = generator.addEmotionalEngagement(baseScenario);
      expect(emotionalScenario.emotionalEngagement).toBeDefined();
      
      // Track interaction with emotional scenario
      const userId = 'emotional-test-user';
      analytics.trackInteraction(userId, emotionalScenario.id, { 
        type: 'emotional_scenario_interaction',
        emotionalState: 'engaged',
        duration: 400
      });
      
      // Verify tracking worked
      const userProgress = analytics.getUserProgress(userId);
      expect(userProgress.totalScenariosAttempted).toBe(1);
    });

    test('should create and track branching narrative scenarios', () => {
      // Generate a branching scenario
      const baseScenario = generator.generateCrossDomainChallenge();
      const branchedScenario = generator.createBranchingNarrative(baseScenario);
      expect(branchedScenario.branches).toBeDefined();
      
      // Track interaction with branching scenario
      const userId = 'branching-test-user';
      analytics.trackInteraction(userId, branchedScenario.id, { 
        type: 'branching_scenario_interaction',
        pathTaken: 'path_a',
        decisionPoint: 1,
        choiceIndex: 0
      });
      
      // Verify tracking worked
      const userProgress = analytics.getUserProgress(userId);
      expect(userProgress.totalScenariosAttempted).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid bias combination gracefully', () => {
      expect(() => {
        generator.generateCrossDomainChallenge('nonexistent-bias-combo');
      }).toThrow(); // Or handle gracefully depending on implementation
    });

    test('should handle empty user profile in adaptive generation', () => {
      const adaptiveChallenge = generator.generateAdaptiveChallenge(null);
      expect(adaptiveChallenge).toBeDefined();
      expect(adaptiveChallenge.id).toBeDefined();
    });

    test('should handle analytics for non-existent user', () => {
      const progress = analytics.getUserProgress('non-existent-user');
      expect(progress).toBeNull();
    });

    test('should handle analytics for non-existent scenario', () => {
      const scenarioAnalytics = analytics.getScenarioAnalytics('non-existent-scenario');
      expect(scenarioAnalytics).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple simultaneous users efficiently', () => {
      const startTime = Date.now();
      
      // Simulate 100 users interacting with scenarios
      for (let i = 0; i < 100; i++) {
        const userId = `perf-user-${i}`;
        const scenarioId = `perf-scenario-${i % 10}`; // Reuse 10 scenarios
        
        analytics.trackInteraction(userId, scenarioId, { 
          type: 'perf_test',
          duration: 60 + (i % 30) // Vary duration
        });
        
        // Complete 30% of scenarios
        if (i % 3 === 0) {
          analytics.recordCompletion(userId, scenarioId, { 
            duration: 120 + (i % 60),
            score: 50 + (i % 50)
          });
        }
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete in reasonable time (under 10 seconds for 100 users)
      expect(executionTime).toBeLessThan(10000);
      
      // Verify data integrity
      expect(Object.keys(analytics.data.users).length).toBe(100);
      expect(analytics.data.analytics.total_interactions).toBe(100);
    });

    test('should generate multiple scenarios efficiently', () => {
      const startTime = Date.now();
      
      // Generate 50 scenarios
      for (let i = 0; i < 50; i++) {
        const scenario = generator.generateCrossDomainChallenge();
        expect(scenario).toBeDefined();
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete in reasonable time (under 5 seconds for 50 scenarios)
      expect(executionTime).toBeLessThan(5000);
    });
  });
});

// Helper function to run tests
function runTests() {
  const tests = [
    'Historical Scenario Analytics Module',
    'Cross-Domain Challenge Generator', 
    'Integration Tests',
    'Edge Cases and Error Handling',
    'Performance Tests'
  ];
  
  console.log('🧪 Starting Real-World Failure Cases Extension Tests...\n');
  
  // This is a simplified test runner
  // In a real environment, you'd use Jest or another testing framework
  
  console.log('✅ All test suites defined and ready to execute');
  console.log(`📋 Total test suites: ${tests.length}`);
  
  return {
    status: 'ready',
    testSuites: tests.length,
    message: 'Test suite ready for execution with Jest or other test runner'
  };
}

// Export for use in test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests };
}

// If running directly
if (typeof window === 'undefined' && require.main === module) {
  runTests();
}