/**
 * Validation script for Real-World Failure Cases Extension
 * Tests all implemented functionality and validates correctness
 */

const fs = require('fs');
const path = require('path');

// Import the modules we created
const { HistoricalScenarioAnalytics } = require('./api-server/logic/historical_scenario_analytics');
const { CrossDomainChallengeGenerator } = require('./assets/js/cross_domain_generator');

class RealWorldExtensionValidator {
  constructor() {
    this.analytics = new HistoricalScenarioAnalytics();
    this.generator = new CrossDomainChallengeGenerator();
    this.validationResults = {
      passed: [],
      failed: [],
      skipped: []
    };
  }

  /**
   * Run comprehensive validation of all features
   */
  async runValidation() {
    console.log('🔍 Starting Real-World Failure Cases Extension Validation...\n');

    // Test data files exist and are valid
    await this.validateDataFiles();
    
    // Test historical scenario functionality
    await this.validateHistoricalScenarios();
    
    // Test cross-domain challenge functionality
    await this.validateCrossDomainChallenges();
    
    // Test analytics and tracking
    await this.validateAnalytics();
    
    // Test UI components integration
    await this.validateUIIntegration();
    
    // Test performance and scalability
    await this.validatePerformance();
    
    // Print results
    this.printValidationResults();
    
    return this.validationResults;
  }

  /**
   * Validate that all required data files exist and are valid
   */
  async validateDataFiles() {
    console.log('📁 Validating data files...');
    
    const dataFiles = [
      '../api-server/data/historical_cases.json',
      '../api-server/data/advanced_historical_cases.json',
      '../api-server/data/user_progress/', // Directory
      '../api-server/logic/historical_case_validator.py',
      '../api-server/models/historical_case_models.py',
      '../api-server/logic/historical_decision_engine.py',
      '../api-server/logic/historical_scenario_router.py',
      '../api-server/logic/historical_case_cache.py',
      '../api-server/logic/historical_case_progress_tracker.py'
    ];
    
    for (const file of dataFiles) {
      const fullPath = path.join(__dirname, file);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        this.validationResults.passed.push(`Data file exists: ${file}`);
        console.log(`  ✅ ${file}`);
      } else {
        this.validationResults.failed.push(`Missing data file: ${file}`);
        console.log(`  ❌ ${file}`);
      }
    }
    
    console.log();
  }

  /**
   * Validate historical scenario functionality
   */
  async validateHistoricalScenarios() {
    console.log('🏛️ Validating historical scenarios...');
    
    try {
      // Test loading historical cases
      const historicalCasesPath = path.join(__dirname, '../api-server/data/historical_cases.json');
      if (fs.existsSync(historicalCasesPath)) {
        const historicalData = JSON.parse(fs.readFileSync(historicalCasesPath, 'utf8'));
        
        if (historicalData.historical_cases && Array.isArray(historicalData.historical_cases)) {
          this.validationResults.passed.push('Historical cases data structure is valid');
          console.log('  ✅ Historical cases data structure is valid');
          
          if (historicalData.historical_cases.length >= 20) {
            this.validationResults.passed.push('Sufficient historical cases (>20) implemented');
            console.log('  ✅ Sufficient historical cases (>20) implemented');
          } else {
            this.validationResults.failed.push(`Insufficient historical cases: ${historicalData.historical_cases.length}/20`);
            console.log(`  ❌ Insufficient historical cases: ${historicalData.historical_cases.length}/20`);
          }
        } else {
          this.validationResults.failed.push('Historical cases data structure is invalid');
          console.log('  ❌ Historical cases data structure is invalid');
        }
      } else {
        this.validationResults.failed.push('Historical cases file not found');
        console.log('  ❌ Historical cases file not found');
      }

      // Test advanced historical cases
      const advancedCasesPath = path.join(__dirname, '../api-server/data/advanced_historical_cases.json');
      if (fs.existsSync(advancedCasesPath)) {
        const advancedData = JSON.parse(fs.readFileSync(advancedCasesPath, 'utf8'));
        
        if (advancedData.historical_cases && Array.isArray(advancedData.historical_cases)) {
          this.validationResults.passed.push('Advanced historical cases data structure is valid');
          console.log('  ✅ Advanced historical cases data structure is valid');
          
          if (advancedData.historical_cases.length > 0) {
            this.validationResults.passed.push('Advanced historical cases implemented');
            console.log('  ✅ Advanced historical cases implemented');
          }
        } else {
          this.validationResults.failed.push('Advanced historical cases data structure is invalid');
          console.log('  ❌ Advanced historical cases data structure is invalid');
        }
      } else {
        this.validationResults.failed.push('Advanced historical cases file not found');
        console.log('  ❌ Advanced historical cases file not found');
      }
    } catch (error) {
      this.validationResults.failed.push(`Error validating historical scenarios: ${error.message}`);
      console.log(`  ❌ Error validating historical scenarios: ${error.message}`);
    }
    
    console.log();
  }

  /**
   * Validate cross-domain challenge functionality
   */
  async validateCrossDomainChallenges() {
    console.log('🔗 Validating cross-domain challenges...');
    
    try {
      // Test generator functionality
      const challenge = this.generator.generateCrossDomainChallenge();
      
      if (challenge && challenge.id && challenge.title && challenge.biasCombinations) {
        this.validationResults.passed.push('Cross-domain challenge generator works');
        console.log('  ✅ Cross-domain challenge generator works');
      } else {
        this.validationResults.failed.push('Cross-domain challenge generator failed');
        console.log('  ❌ Cross-domain challenge generator failed');
      }

      // Test mixed scenarios
      const mixedScenarios = this.generator.generateMixedScenarios(['business', 'personal'], 2);
      
      if (Array.isArray(mixedScenarios) && mixedScenarios.length === 2) {
        this.validationResults.passed.push('Mixed scenario generation works');
        console.log('  ✅ Mixed scenario generation works');
      } else {
        this.validationResults.failed.push('Mixed scenario generation failed');
        console.log('  ❌ Mixed scenario generation failed');
      }

      // Test unique combinations
      const combinations = this.generator.generateUniqueCombinations(2);
      
      if (Array.isArray(combinations) && combinations.length === 2) {
        this.validationResults.passed.push('Unique combination generation works');
        console.log('  ✅ Unique combination generation works');
      } else {
        this.validationResults.failed.push('Unique combination generation failed');
        console.log('  ❌ Unique combination generation failed');
      }

      // Test difficulty scaling
      const difficultyProfile = this.generator.scaleDifficulty(5, 2, 1);
      
      if (difficultyProfile && typeof difficultyProfile.level === 'string') {
        this.validationResults.passed.push('Difficulty scaling works');
        console.log('  ✅ Difficulty scaling works');
      } else {
        this.validationResults.failed.push('Difficulty scaling failed');
        console.log('  ❌ Difficulty scaling failed');
      }

      // Test adaptive challenges
      const adaptiveChallenge = this.generator.generateAdaptiveChallenge({
        experienceDomains: ['business'],
        preferredDifficulty: 'medium',
        performanceMetrics: {
          accuracyRate: 0.7,
          learningRate: 0.6
        }
      });
      
      if (adaptiveChallenge && adaptiveChallenge.id) {
        this.validationResults.passed.push('Adaptive challenge generation works');
        console.log('  ✅ Adaptive challenge generation works');
      } else {
        this.validationResults.failed.push('Adaptive challenge generation failed');
        console.log('  ❌ Adaptive challenge generation failed');
      }
    } catch (error) {
      this.validationResults.failed.push(`Error validating cross-domain challenges: ${error.message}`);
      console.log(`  ❌ Error validating cross-domain challenges: ${error.message}`);
    }
    
    console.log();
  }

  /**
   * Validate analytics and tracking functionality
   */
  async validateAnalytics() {
    console.log('📊 Validating analytics and tracking...');
    
    try {
      // Test analytics initialization
      if (this.analytics && typeof this.analytics.trackInteraction === 'function') {
        this.validationResults.passed.push('Analytics module initialized');
        console.log('  ✅ Analytics module initialized');
      } else {
        this.validationResults.failed.push('Analytics module not properly initialized');
        console.log('  ❌ Analytics module not properly initialized');
      }

      // Test interaction tracking
      const userId = 'validation-user-' + Date.now();
      const scenarioId = 'validation-scenario-' + Date.now();
      const interactionData = {
        type: 'decision_point',
        choiceIndex: 0,
        decisionPoint: 1,
        duration: 120
      };

      this.analytics.trackInteraction(userId, scenarioId, interactionData);
      
      if (this.analytics.data.users[userId]) {
        this.validationResults.passed.push('User interaction tracking works');
        console.log('  ✅ User interaction tracking works');
      } else {
        this.validationResults.failed.push('User interaction tracking failed');
        console.log('  ❌ User interaction tracking failed');
      }

      // Test completion recording
      this.analytics.recordCompletion(userId, scenarioId, {
        duration: 300,
        score: 85,
        feedback: 'Validated successfully'
      });

      if (this.analytics.data.users[userId].completion_stats[scenarioId]?.completed) {
        this.validationResults.passed.push('Completion recording works');
        console.log('  ✅ Completion recording works');
      } else {
        this.validationResults.failed.push('Completion recording failed');
        console.log('  ❌ Completion recording failed');
      }

      // Test user progress retrieval
      const userProgress = this.analytics.getUserProgress(userId);
      
      if (userProgress && userProgress.userId === userId) {
        this.validationResults.passed.push('User progress tracking works');
        console.log('  ✅ User progress tracking works');
      } else {
        this.validationResults.failed.push('User progress tracking failed');
        console.log('  ❌ User progress tracking failed');
      }

      // Test scenario analytics
      const scenarioAnalytics = this.analytics.getScenarioAnalytics(scenarioId);
      
      if (scenarioAnalytics && scenarioAnalytics.scenarioId === scenarioId) {
        this.validationResults.passed.push('Scenario analytics works');
        console.log('  ✅ Scenario analytics works');
      } else {
        this.validationResults.failed.push('Scenario analytics failed');
        console.log('  ❌ Scenario analytics failed');
      }

      // Test pattern identification
      const patterns = this.analytics.identifyCommonFailurePatterns();
      
      if (Array.isArray(patterns)) {
        this.validationResults.passed.push('Pattern identification works');
        console.log('  ✅ Pattern identification works');
      } else {
        this.validationResults.failed.push('Pattern identification failed');
        console.log('  ❌ Pattern identification failed');
      }

      // Test personalized recommendations
      const recommendations = this.analytics.getPersonalizedRecommendations(userId);
      
      if (Array.isArray(recommendations)) {
        this.validationResults.passed.push('Personalized recommendations work');
        console.log('  ✅ Personalized recommendations work');
      } else {
        this.validationResults.failed.push('Personalized recommendations failed');
        console.log('  ❌ Personalized recommendations failed');
      }

      // Test dashboard metrics
      const dashboardMetrics = this.analytics.generateDashboardMetrics();
      
      if (dashboardMetrics && dashboardMetrics.summary) {
        this.validationResults.passed.push('Dashboard metrics generation works');
        console.log('  ✅ Dashboard metrics generation works');
      } else {
        this.validationResults.failed.push('Dashboard metrics generation failed');
        console.log('  ❌ Dashboard metrics generation failed');
      }
    } catch (error) {
      this.validationResults.failed.push(`Error validating analytics: ${error.message}`);
      console.log(`  ❌ Error validating analytics: ${error.message}`);
    }
    
    console.log();
  }

  /**
   * Validate UI integration
   */
  async validateUIIntegration() {
    console.log('🎨 Validating UI integration...');
    
    try {
      // Check if the HistoricalCasesPage class exists in app.js
      const appJsPath = path.join(__dirname, '../assets/js/app.js');
      
      if (fs.existsSync(appJsPath)) {
        const appJsContent = fs.readFileSync(appJsPath, 'utf8');
        
        if (appJsContent.includes('class HistoricalCasesPage')) {
          this.validationResults.passed.push('HistoricalCasesPage class exists in app.js');
          console.log('  ✅ HistoricalCasesPage class exists in app.js');
        } else {
          this.validationResults.failed.push('HistoricalCasesPage class not found in app.js');
          console.log('  ❌ HistoricalCasesPage class not found in app.js');
        }

        if (appJsContent.includes('renderDecisionTree') && appJsContent.includes('renderTimelineVisualization')) {
          this.validationResults.passed.push('Decision tree and timeline visualizations implemented');
          console.log('  ✅ Decision tree and timeline visualizations implemented');
        } else {
          this.validationResults.failed.push('Decision tree or timeline visualizations missing');
          console.log('  ❌ Decision tree or timeline visualizations missing');
        }

        if (appJsContent.includes('addInteractiveElements')) {
          this.validationResults.passed.push('Interactive elements implemented');
          console.log('  ✅ Interactive elements implemented');
        } else {
          this.validationResults.failed.push('Interactive elements not found');
          console.log('  ❌ Interactive elements not found');
        }
      } else {
        this.validationResults.failed.push('app.js file not found');
        console.log('  ❌ app.js file not found');
      }

      // Check if CSS for historical cases exists
      const cssPath = path.join(__dirname, '../assets/css/main.css');
      
      if (fs.existsSync(cssPath)) {
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        if (cssContent.includes('.historical-cases-page') && cssContent.includes('.historical-case-detail-page')) {
          this.validationResults.passed.push('Historical cases CSS styles implemented');
          console.log('  ✅ Historical cases CSS styles implemented');
        } else {
          this.validationResults.failed.push('Historical cases CSS styles not found');
          console.log('  ❌ Historical cases CSS styles not found');
        }

        if (cssContent.includes('.immersive-experience')) {
          this.validationResults.passed.push('Immersive experience CSS implemented');
          console.log('  ✅ Immersive experience CSS implemented');
        } else {
          this.validationResults.skipped.push('Immersive experience CSS not found (may be optional)');
          console.log('  ⚠️ Immersive experience CSS not found (may be optional)');
        }
      } else {
        this.validationResults.failed.push('main.css file not found');
        console.log('  ❌ main.css file not found');
      }
    } catch (error) {
      this.validationResults.failed.push(`Error validating UI integration: ${error.message}`);
      console.log(`  ❌ Error validating UI integration: ${error.message}`);
    }
    
    console.log();
  }

  /**
   * Validate performance and scalability
   */
  async validatePerformance() {
    console.log('⚡ Validating performance and scalability...');
    
    try {
      // Test analytics performance with multiple users
      const startTime = Date.now();
      
      // Simulate 50 users with interactions
      for (let i = 0; i < 50; i++) {
        const userId = `perf-test-user-${i}`;
        const scenarioId = `perf-test-scenario-${i % 10}`; // 10 different scenarios
        
        this.analytics.trackInteraction(userId, scenarioId, {
          type: 'test_interaction',
          duration: 60 + (i % 60)
        });
        
        // Complete 20% of scenarios
        if (i % 5 === 0) {
          this.analytics.recordCompletion(userId, scenarioId, {
            duration: 120 + (i % 120),
            score: 50 + (i % 50)
          });
        }
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      if (executionTime < 5000) { // Should complete in under 5 seconds
        this.validationResults.passed.push(`Performance test passed (${executionTime}ms for 50 users)`);
        console.log(`  ✅ Performance test passed (${executionTime}ms for 50 users)`);
      } else {
        this.validationResults.failed.push(`Performance test failed (${executionTime}ms for 50 users)`);
        console.log(`  ❌ Performance test failed (${executionTime}ms for 50 users)`);
      }

      // Test generator performance
      const genStartTime = Date.now();
      
      // Generate 25 challenges
      for (let i = 0; i < 25; i++) {
        const challenge = this.generator.generateCrossDomainChallenge();
        if (!challenge) {
          throw new Error(`Failed to generate challenge ${i}`);
        }
      }
      
      const genEndTime = Date.now();
      const genExecutionTime = genEndTime - genStartTime;
      
      if (genExecutionTime < 3000) { // Should generate 25 challenges in under 3 seconds
        this.validationResults.passed.push(`Generator performance test passed (${genExecutionTime}ms for 25 challenges)`);
        console.log(`  ✅ Generator performance test passed (${genExecutionTime}ms for 25 challenges)`);
      } else {
        this.validationResults.failed.push(`Generator performance test failed (${genExecutionTime}ms for 25 challenges)`);
        console.log(`  ❌ Generator performance test failed (${genExecutionTime}ms for 25 challenges)`);
      }
    } catch (error) {
      this.validationResults.failed.push(`Error validating performance: ${error.message}`);
      console.log(`  ❌ Error validating performance: ${error.message}`);
    }
    
    console.log();
  }

  /**
   * Print validation results summary
   */
  printValidationResults() {
    console.log('📋 VALIDATION RESULTS SUMMARY');
    console.log('================================');
    console.log(`✅ Passed: ${this.validationResults.passed.length}`);
    console.log(`❌ Failed: ${this.validationResults.failed.length}`);
    console.log(`⚠️ Skipped: ${this.validationResults.skipped.length}`);
    console.log(`📊 Total: ${this.validationResults.passed.length + this.validationResults.failed.length + this.validationResults.skipped.length}`);
    console.log('');

    if (this.validationResults.failed.length === 0) {
      console.log('🎉 ALL VALIDATIONS PASSED! Real-World Failure Cases Extension is ready for deployment.');
    } else {
      console.log(`⚠️ ${this.validationResults.failed.length} validation(s) failed. Please review the issues above.`);
    }

    // Print detailed results if there are failures
    if (this.validationResults.failed.length > 0) {
      console.log('\n❌ DETAILED FAILURE REPORT:');
      this.validationResults.failed.forEach((failure, index) => {
        console.log(`  ${index + 1}. ${failure}`);
      });
    }
  }
}

// Run the validation when this script is executed directly
if (require.main === module) {
  const validator = new RealWorldExtensionValidator();
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
  
  validator.runValidation()
    .then(results => {
      const failedCount = results.failed.length;
      process.exit(failedCount > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Validation failed with error:', error);
      process.exit(1);
    });
}

module.exports = RealWorldExtensionValidator;