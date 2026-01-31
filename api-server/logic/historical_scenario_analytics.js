/**
 * Database Integration and Analytics Module
 * Handles user progress tracking and analytics for historical scenarios
 */

class HistoricalScenarioAnalytics {
  constructor() {
    // Initialize with localStorage as fallback for demo purposes
    // In a real implementation, this would connect to a proper database
    this.storageKey = 'historical-scenario-analytics';
    this.data = this.loadFromStorage();
  }

  /**
   * Load data from storage
   * @returns {Object} Loaded data
   */
  loadFromStorage() {
    try {
      // Check if we're in a browser environment
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : this.getDefaultDataStructure();
      } else {
        // For Node.js environment, use in-memory storage
        if (!this._memoryStorage) {
          this._memoryStorage = this.getDefaultDataStructure();
        }
        return this._memoryStorage;
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      return this.getDefaultDataStructure();
    }
  }

  /**
   * Save data to storage
   */
  saveToStorage() {
    try {
      // Check if we're in a browser environment
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      } else {
        // For Node.js environment, update in-memory storage
        this._memoryStorage = this.data;
      }
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }

  /**
   * Get default data structure
   * @returns {Object} Default data structure
   */
  getDefaultDataStructure() {
    return {
      users: {},
      scenarios: {},
      interactions: [],
      analytics: {
        total_users: 0,
        total_scenarios: 0,
        total_interactions: 0,
        completion_rates: {},
        engagement_metrics: {},
        learning_outcomes: {}
      },
      timestamps: {
        created: new Date().toISOString(),
        last_updated: new Date().toISOString()
      }
    };
  }

  /**
   * Track a user's interaction with a historical scenario
   * @param {string} userId - User identifier
   * @param {string} scenarioId - Scenario identifier
   * @param {Object} interactionData - Interaction details
   */
  trackInteraction(userId, scenarioId, interactionData) {
    // Ensure user exists in data
    if (!this.data.users[userId]) {
      this.data.users[userId] = {
        id: userId,
        first_interaction: new Date().toISOString(),
        last_interaction: new Date().toISOString(),
        scenarios_interacted: [],
        total_interactions: 0,
        completion_stats: {},
        preferences: {},
        learning_profile: {}
      };
      this.data.analytics.total_users++;
    }

    // Ensure scenario exists in data
    if (!this.data.scenarios[scenarioId]) {
      this.data.scenarios[scenarioId] = {
        id: scenarioId,
        first_interaction: new Date().toISOString(),
        total_interactions: 0,
        unique_users: new Set(),
        completion_stats: {
          attempts: 0,
          completions: 0,
          average_completion_time: 0,
          drop_off_points: {}
        },
        engagement_metrics: {
          average_rating: 0,
          total_ratings: 0,
          feedback_count: 0
        }
      };
      this.data.analytics.total_scenarios++;
    }

    // Add interaction to user's record
    if (!this.data.users[userId].scenarios_interacted.includes(scenarioId)) {
      this.data.users[userId].scenarios_interacted.push(scenarioId);
    }

    // Update scenario's unique users
    this.data.scenarios[scenarioId].unique_users.add(userId);

    // Create interaction record
    const interaction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      scenarioId,
      timestamp: new Date().toISOString(),
      type: interactionData.type || 'interaction',
      details: interactionData,
      session_duration: interactionData.duration || 0
    };

    // Add to interactions array
    this.data.interactions.push(interaction);

    // Update user stats
    this.data.users[userId].total_interactions++;
    this.data.users[userId].last_interaction = new Date().toISOString();

    // Update scenario stats
    this.data.scenarios[scenarioId].total_interactions++;
    this.data.scenarios[scenarioId].last_interaction = new Date().toISOString();

    // Update global analytics
    this.data.analytics.total_interactions++;

    // Save to storage
    this.data.timestamps.last_updated = new Date().toISOString();
    this.saveToStorage();
  }

  /**
   * Record scenario completion
   * @param {string} userId - User identifier
   * @param {string} scenarioId - Scenario identifier
   * @param {Object} completionData - Completion details
   */
  recordCompletion(userId, scenarioId, completionData = {}) {
    // Update user completion stats
    if (!this.data.users[userId].completion_stats[scenarioId]) {
      this.data.users[userId].completion_stats[scenarioId] = {
        completed: false,
        completion_date: null,
        duration: 0,
        score: 0,
        feedback: null
      };
    }

    this.data.users[userId].completion_stats[scenarioId] = {
      ...this.data.users[userId].completion_stats[scenarioId],
      completed: true,
      completion_date: new Date().toISOString(),
      duration: completionData.duration || 0,
      score: completionData.score || 0,
      feedback: completionData.feedback || null
    };

    // Update scenario completion stats
    this.data.scenarios[scenarioId].completion_stats.attempts++;
    this.data.scenarios[scenarioId].completion_stats.completions++;

    // Update average completion time
    const currentAvg = this.data.scenarios[scenarioId].completion_stats.average_completion_time;
    const newDuration = completionData.duration || 0;
    const totalCompletions = this.data.scenarios[scenarioId].completion_stats.completions;
    this.data.scenarios[scenarioId].completion_stats.average_completion_time = 
      ((currentAvg * (totalCompletions - 1)) + newDuration) / totalCompletions;

    // Update engagement metrics if rating is provided
    if (completionData.rating !== undefined) {
      const currentRatingSum = this.data.scenarios[scenarioId].engagement_metrics.average_rating * 
                               this.data.scenarios[scenarioId].engagement_metrics.total_ratings;
      const newRatingSum = currentRatingSum + completionData.rating;
      const newTotalRatings = this.data.scenarios[scenarioId].engagement_metrics.total_ratings + 1;
      
      this.data.scenarios[scenarioId].engagement_metrics.average_rating = newRatingSum / newTotalRatings;
      this.data.scenarios[scenarioId].engagement_metrics.total_ratings = newTotalRatings;
    }

    // Update global completion rates
    this.updateCompletionRates();

    // Save to storage
    this.data.timestamps.last_updated = new Date().toISOString();
    this.saveToStorage();
  }

  /**
   * Update global completion rates
   */
  updateCompletionRates() {
    for (const [scenarioId, scenario] of Object.entries(this.data.scenarios)) {
      this.data.analytics.completion_rates[scenarioId] = 
        scenario.completion_stats.attempts > 0 
          ? scenario.completion_stats.completions / scenario.completion_stats.attempts 
          : 0;
    }
  }

  /**
   * Record user feedback
   * @param {string} userId - User identifier
   * @param {string} scenarioId - Scenario identifier
   * @param {Object} feedbackData - Feedback details
   */
  recordFeedback(userId, scenarioId, feedbackData) {
    // Add feedback to scenario engagement metrics
    this.data.scenarios[scenarioId].engagement_metrics.feedback_count++;

    // Update user's learning profile based on feedback
    if (!this.data.users[userId].learning_profile.biases_identified) {
      this.data.users[userId].learning_profile.biases_identified = [];
    }

    if (feedbackData.biasRecognized) {
      if (!this.data.users[userId].learning_profile.biases_identified.includes(feedbackData.biasRecognized)) {
        this.data.users[userId].learning_profile.biases_identified.push(feedbackData.biasRecognized);
      }
    }

    // Save to storage
    this.data.timestamps.last_updated = new Date().toISOString();
    this.saveToStorage();
  }

  /**
   * Get user progress
   * @param {string} userId - User identifier
   * @returns {Object} User progress data
   */
  getUserProgress(userId) {
    if (!this.data.users[userId]) {
      return null;
    }

    const user = this.data.users[userId];
    const progress = {
      userId: user.id,
      totalScenariosAttempted: user.scenarios_interacted.length,
      totalScenariosCompleted: Object.keys(user.completion_stats).filter(
        id => user.completion_stats[id].completed
      ).length,
      completionPercentage: 0,
      averageScore: 0,
      timeSpent: 0,
      lastActive: user.last_interaction,
      learningProfile: user.learning_profile,
      scenarios: {}
    };

    // Calculate completion percentage
    if (this.data.analytics.total_scenarios > 0) {
      progress.completionPercentage = 
        (progress.totalScenariosCompleted / this.data.analytics.total_scenarios) * 100;
    }

    // Calculate average score and time spent
    let totalScore = 0;
    let totalTime = 0;
    let completedCount = 0;

    for (const [scenarioId, stats] of Object.entries(user.completion_stats)) {
      if (stats.completed) {
        totalScore += stats.score;
        totalTime += stats.duration;
        completedCount++;
      }

      progress.scenarios[scenarioId] = {
        completed: stats.completed,
        completionDate: stats.completion_date,
        duration: stats.duration,
        score: stats.score,
        feedback: stats.feedback
      };
    }

    progress.averageScore = completedCount > 0 ? totalScore / completedCount : 0;
    progress.timeSpent = totalTime;

    return progress;
  }

  /**
   * Get scenario analytics
   * @param {string} scenarioId - Scenario identifier
   * @returns {Object} Scenario analytics
   */
  getScenarioAnalytics(scenarioId) {
    if (!this.data.scenarios[scenarioId]) {
      return null;
    }

    const scenario = this.data.scenarios[scenarioId];
    const analytics = {
      scenarioId: scenario.id,
      totalAttempts: scenario.completion_stats.attempts,
      totalCompletions: scenario.completion_stats.completions,
      completionRate: scenario.completion_stats.attempts > 0 
        ? scenario.completion_stats.completions / scenario.completion_stats.attempts 
        : 0,
      averageCompletionTime: scenario.completion_stats.average_completion_time,
      averageRating: scenario.engagement_metrics.average_rating,
      totalRatings: scenario.engagement_metrics.total_ratings,
      feedbackCount: scenario.engagement_metrics.feedback_count,
      uniqueUsers: scenario.unique_users.size,
      firstInteraction: scenario.first_interaction,
      lastInteraction: scenario.last_interaction
    };

    return analytics;
  }

  /**
   * Get overall platform analytics
   * @returns {Object} Overall analytics
   */
  getPlatformAnalytics() {
    const analytics = { ...this.data.analytics };

    // Calculate additional metrics
    analytics.total_unique_users = Object.keys(this.data.users).length;
    analytics.avg_interactions_per_user = analytics.total_users > 0 
      ? analytics.total_interactions / analytics.total_users 
      : 0;

    // Calculate average completion rate across all scenarios
    const scenarioIds = Object.keys(this.data.scenarios);
    if (scenarioIds.length > 0) {
      const totalCompletionRate = scenarioIds.reduce((sum, id) => 
        sum + this.data.analytics.completion_rates[id], 0);
      analytics.avg_scenario_completion_rate = totalCompletionRate / scenarioIds.length;
    } else {
      analytics.avg_scenario_completion_rate = 0;
    }

    return analytics;
  }

  /**
   * Get user learning insights
   * @param {string} userId - User identifier
   * @returns {Object} Learning insights
   */
  getUserLearningInsights(userId) {
    if (!this.data.users[userId]) {
      return null;
    }

    const user = this.data.users[userId];
    const insights = {
      userId: user.id,
      identifiedStrengths: [],
      identifiedAreasForImprovement: [],
      biasRecognitionProgress: 0,
      recommendedScenarios: [],
      learningVelocity: this.calculateLearningVelocity(userId),
      engagementPattern: this.analyzeEngagementPattern(userId)
    };

    // Analyze learning profile
    if (user.learning_profile.biases_identified) {
      insights.biasRecognitionProgress = user.learning_profile.biases_identified.length;
      
      // Identify strengths based on frequently recognized biases
      const biasCounts = {};
      user.learning_profile.biases_identified.forEach(bias => {
        biasCounts[bias] = (biasCounts[bias] || 0) + 1;
      });
      
      // Consider biases identified more than once as strengths
      insights.identifiedStrengths = Object.keys(biasCounts).filter(bias => biasCounts[bias] > 1);
    }

    // Identify areas for improvement based on incomplete scenarios
    const incompleteScenarios = user.scenarios_interacted.filter(scenarioId => {
      return !user.completion_stats[scenarioId]?.completed;
    });
    
    insights.identifiedAreasForImprovement = incompleteScenarios;

    // Recommend scenarios based on areas for improvement
    insights.recommendedScenarios = this.getScenarioRecommendations(userId);

    return insights;
  }

  /**
   * Calculate learning velocity for a user
   * @private
   */
  calculateLearningVelocity(userId) {
    const user = this.data.users[userId];
    if (!user || user.scenarios_interacted.length === 0) {
      return 0;
    }

    // Calculate based on time between first and last interaction
    const firstDate = new Date(user.first_interaction);
    const lastDate = new Date(user.last_interaction);
    const timeDiff = lastDate - firstDate; // in milliseconds
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24); // convert to days

    if (daysDiff <= 0) {
      return user.scenarios_interacted.length; // all in one day
    }

    return user.scenarios_interacted.length / daysDiff; // scenarios per day
  }

  /**
   * Analyze engagement pattern for a user
   * @private
   */
  analyzeEngagementPattern(userId) {
    const user = this.data.users[userId];
    if (!user) {
      return 'inactive';
    }

    // Get all interactions for this user
    const userInteractions = this.data.interactions.filter(i => i.userId === userId);
    
    if (userInteractions.length === 0) {
      return 'inactive';
    }

    // Calculate time between interactions to determine pattern
    userInteractions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const timeDiffs = [];
    for (let i = 1; i < userInteractions.length; i++) {
      const diff = new Date(userInteractions[i].timestamp) - new Date(userInteractions[i-1].timestamp);
      timeDiffs.push(diff / (1000 * 60 * 60)); // Convert to hours
    }

    if (timeDiffs.length === 0) {
      return 'single_session';
    }

    const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;

    if (avgTimeDiff < 24) {
      return 'frequent_engager'; // Daily or more frequent
    } else if (avgTimeDiff < 168) {
      return 'regular_user'; // Weekly (168 hours in a week)
    } else {
      return 'sporadic_user'; // Less than weekly
    }
  }

  /**
   * Get scenario recommendations for a user
   * @private
   */
  getScenarioRecommendations(userId) {
    const user = this.data.users[userId];
    if (!user) {
      return [];
    }

    // Get completed and incomplete scenarios
    const completed = Object.keys(user.completion_stats).filter(id => user.completion_stats[id].completed);
    const incomplete = user.scenarios_interacted.filter(id => !user.completion_stats[id]?.completed);

    // For now, recommend scenarios that are incomplete
    // In a real implementation, this would be more sophisticated
    return incomplete.slice(0, 5); // Return up to 5 incomplete scenarios
  }

  /**
   * Identify common failure patterns across users
   * @returns {Array} Common failure patterns
   */
  identifyCommonFailurePatterns() {
    const patterns = [];
    
    // Analyze decision patterns that lead to unsuccessful outcomes
    const allInteractions = this.data.interactions;
    
    // Group interactions by scenario
    const interactionsByScenario = {};
    allInteractions.forEach(interaction => {
      if (!interactionsByScenario[interaction.scenarioId]) {
        interactionsByScenario[interaction.scenarioId] = [];
      }
      interactionsByScenario[interaction.scenarioId].push(interaction);
    });
    
    // Analyze each scenario for common failure patterns
    for (const [scenarioId, interactions] of Object.entries(interactionsByScenario)) {
      const scenarioPatterns = this.analyzeScenarioFailurePatterns(scenarioId, interactions);
      patterns.push(...scenarioPatterns);
    }
    
    return patterns;
  }

  /**
   * Analyze failure patterns for a specific scenario
   * @private
   */
  analyzeScenarioFailurePatterns(scenarioId, interactions) {
    const patterns = [];
    const scenario = this.data.scenarios[scenarioId];
    
    if (!scenario) return patterns;
    
    // Group interactions by user to track individual paths
    const userPaths = {};
    interactions.forEach(interaction => {
      if (!userPaths[interaction.userId]) {
        userPaths[interaction.userId] = [];
      }
      userPaths[interaction.userId].push(interaction);
    });
    
    // Identify common decision sequences that lead to incomplete scenarios
    const incompleteUsers = Object.keys(userPaths).filter(userId => {
      return !this.data.users[userId]?.completion_stats[scenarioId]?.completed;
    });
    
    // Find common decision patterns among incomplete users
    if (incompleteUsers.length > 1) {
      const commonPattern = this.findCommonDecisionPattern(incompleteUsers, userPaths);
      if (commonPattern.sequence.length > 0) {
        patterns.push({
          id: `pattern_${scenarioId}_${Date.now()}`,
          scenarioId,
          type: 'common_failure_path',
          description: `Users who took decision sequence [${commonPattern.sequence.join(', ')}] often failed to complete this scenario`,
          frequency: commonPattern.frequency,
          affectedUsers: commonPattern.users,
          suggestedIntervention: `Provide additional guidance at decision point ${commonPattern.earliestDeviation}`
        });
      }
    }
    
    // Analyze timing patterns (users who spend too little/too much time)
    const timingIssues = this.analyzeTimingPatterns(interactions);
    if (timingIssues.length > 0) {
      patterns.push(...timingIssues);
    }
    
    return patterns;
  }

  /**
   * Find common decision patterns among users
   * @private
   */
  findCommonDecisionPattern(users, userPaths) {
    if (users.length < 2) {
      return { sequence: [], frequency: 0, users: [], earliestDeviation: 0 };
    }
    
    // For simplicity, we'll find the most common initial decisions
    // In a real implementation, this would be more sophisticated
    const decisionSequences = users.map(userId => {
      const path = userPaths[userId];
      // Extract decision choices (simplified)
      return path.map(interaction => interaction.details.choiceIndex || interaction.details.decisionPoint || 'unknown').slice(0, 3);
    });
    
    // Find the most common sequence
    const sequenceCounts = {};
    const sequenceUsers = {};
    
    decisionSequences.forEach((sequence, idx) => {
      const seqStr = sequence.join(',');
      if (!sequenceCounts[seqStr]) {
        sequenceCounts[seqStr] = 0;
        sequenceUsers[seqStr] = [];
      }
      sequenceCounts[seqStr]++;
      sequenceUsers[seqStr].push(users[idx]);
    });
    
    // Find the most frequent sequence
    let maxCount = 0;
    let mostCommonSeq = '';
    
    for (const [seq, count] of Object.entries(sequenceCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonSeq = seq;
      }
    }
    
    if (maxCount > 1) { // Only consider patterns with multiple users
      return {
        sequence: mostCommonSeq.split(','),
        frequency: maxCount / users.length,
        users: sequenceUsers[mostCommonSeq],
        earliestDeviation: 1 // Simplified
      };
    }
    
    return { sequence: [], frequency: 0, users: [], earliestDeviation: 0 };
  }

  /**
   * Analyze timing-related patterns
   * @private
   */
  analyzeTimingPatterns(interactions) {
    const patterns = [];
    
    // Identify users who spend unusually little time (rushing) or too much time (overthinking)
    const timeThresholds = this.calculateTimeThresholds(interactions);
    
    // Find users who spent significantly less time than average
    const rushingUsers = this.identifyRushingUsers(interactions, timeThresholds.quickThreshold);
    if (rushingUsers.length > 0) {
      patterns.push({
        id: `timing_rush_${Date.now()}`,
        type: 'rushing_behavior',
        description: 'Users who rush through decisions without adequate consideration',
        frequency: rushingUsers.length / interactions.length,
        affectedUsers: rushingUsers,
        suggestedIntervention: 'Add mandatory reflection time or decision confirmation steps'
      });
    }
    
    // Find users who spend significantly more time than average (overthinking)
    const overthinkingUsers = this.identifyOverthinkingUsers(interactions, timeThresholds.slowThreshold);
    if (overthinkingUsers.length > 0) {
      patterns.push({
        id: `timing_overthink_${Date.now()}`,
        type: 'overthinking_behavior',
        description: 'Users who spend excessive time on decisions, possibly indicating paralysis',
        frequency: overthinkingUsers.length / interactions.length,
        affectedUsers: overthinkingUsers,
        suggestedIntervention: 'Provide decision frameworks or time limits'
      });
    }
    
    return patterns;
  }

  /**
   * Calculate time thresholds for pattern analysis
   * @private
   */
  calculateTimeThresholds(interactions) {
    if (interactions.length === 0) {
      return { quickThreshold: 30, slowThreshold: 300 }; // defaults in seconds
    }
    
    // Calculate average and standard deviation of interaction times
    const durations = interactions
      .filter(interaction => interaction.session_duration)
      .map(interaction => interaction.session_duration);
    
    if (durations.length === 0) {
      return { quickThreshold: 30, slowThreshold: 300 };
    }
    
    const avg = durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
    const squaredDiffs = durations.map(duration => Math.pow(duration - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(avgSquaredDiff);
    
    // Define thresholds as mean ± 1 std dev
    return {
      quickThreshold: Math.max(10, avg - stdDev), // Minimum 10 seconds
      slowThreshold: avg + stdDev
    };
  }

  /**
   * Identify users with rushing behavior
   * @private
   */
  identifyRushingUsers(interactions, threshold) {
    const rushers = new Set();
    
    interactions.forEach(interaction => {
      if (interaction.session_duration && interaction.session_duration < threshold) {
        rushers.add(interaction.userId);
      }
    });
    
    return Array.from(rushers);
  }

  /**
   * Identify users with overthinking behavior
   * @private
   */
  identifyOverthinkingUsers(interactions, threshold) {
    const overthinkers = new Set();
    
    interactions.forEach(interaction => {
      if (interaction.session_duration && interaction.session_duration > threshold) {
        overthinkers.add(interaction.userId);
      }
    });
    
    return Array.from(overthinkers);
  }

  /**
   * Get common failure patterns affecting a specific user
   * @param {string} userId - User identifier
   * @returns {Array} Patterns affecting this user
   */
  getUserRelevantPatterns(userId) {
    const allPatterns = this.identifyCommonFailurePatterns();
    const userPatterns = allPatterns.filter(pattern => 
      pattern.affectedUsers && pattern.affectedUsers.includes(userId)
    );
    
    return userPatterns;
  }

  /**
   * Identify cognitive bias patterns
   * @returns {Array} Cognitive bias patterns
   */
  identifyCognitiveBiasPatterns() {
    const biasPatterns = [];
    
    // Analyze user learning profiles for common bias recognition issues
    for (const [userId, user] of Object.entries(this.data.users)) {
      if (user.learning_profile && user.learning_profile.biases_identified) {
        const biasCounts = {};
        user.learning_profile.biases_identified.forEach(bias => {
          biasCounts[bias] = (biasCounts[bias] || 0) + 1;
        });
        
        // Identify under-recognized biases
        const allKnownBiases = ['confirmation', 'anchoring', 'availability', 'representativeness', 'hindsight', 'overconfidence'];
        const unrecognizedBiases = allKnownBiases.filter(bias => !user.learning_profile.biases_identified.includes(bias));
        
        if (unrecognizedBiases.length > 0) {
          biasPatterns.push({
            id: `bias_pattern_${userId}_${Date.now()}`,
            userId,
            type: 'bias_recognition_gap',
            unrecognizedBiases,
            suggestion: `Focus on learning about: ${unrecognizedBiases.join(', ')}`
          });
        }
      }
    }
    
    return biasPatterns;
  }

  /**
   * Create a recommendation engine for personalized scenario suggestions
   * @param {string} userId - User identifier
   * @returns {Array} Personalized scenario recommendations
   */
  getPersonalizedRecommendations(userId) {
    const user = this.data.users[userId];
    if (!user) {
      return this.getDefaultRecommendations();
    }

    // Calculate user's competency profile
    const profile = this.getUserCompetencyProfile(userId);
    
    // Get recommendations based on profile
    return this.generateRecommendations(userId, profile);
  }

  /**
   * Get user competency profile
   * @private
   */
  getUserCompetencyProfile(userId) {
    const user = this.data.users[userId];
    const profile = {
      strengths: [],
      weaknesses: [],
      learning_velocity: 0,
      bias_recognition_level: 0,
      decision_quality: 0,
      preferred_difficulty: 'medium',
      learning_style: 'exploratory',
      engagement_pattern: 'regular'
    };

    // Calculate strengths and weaknesses based on completed scenarios
    const completedScenarios = Object.keys(user.completion_stats).filter(
      id => user.completion_stats[id].completed
    );

    if (completedScenarios.length > 0) {
      // Calculate average score across completed scenarios
      const totalScore = completedScenarios.reduce((sum, id) => 
        sum + user.completion_stats[id].score, 0);
      profile.decision_quality = totalScore / completedScenarios.length;

      // Identify patterns in completed scenarios
      const scenarioPerformance = {};
      completedScenarios.forEach(id => {
        scenarioPerformance[id] = user.completion_stats[id].score;
      });

      // Identify high and low performing scenario types (simplified)
      const sortedScenarios = Object.entries(scenarioPerformance)
        .sort((a, b) => b[1] - a[1]);

      if (sortedScenarios.length > 0) {
        const topPerformers = sortedScenarios.slice(0, Math.ceil(sortedScenarios.length * 0.3));
        const lowPerformers = sortedScenarios.slice(-Math.ceil(sortedScenarios.length * 0.3));

        profile.strengths = topPerformers.map(([id]) => id);
        profile.weaknesses = lowPerformers.map(([id]) => id);
      }
    }

    // Calculate learning velocity
    profile.learning_velocity = this.calculateLearningVelocity(userId);

    // Assess bias recognition based on learning profile
    if (user.learning_profile && user.learning_profile.biases_identified) {
      profile.bias_recognition_level = user.learning_profile.biases_identified.length / 10; // Normalize to 0-1
    }

    // Determine preferred difficulty based on past performance
    profile.preferred_difficulty = this.determinePreferredDifficulty(userId, completedScenarios);

    // Determine learning style based on interaction patterns
    profile.learning_style = this.determineLearningStyle(userId);

    // Determine engagement pattern
    profile.engagement_pattern = this.analyzeEngagementPattern(userId);

    return profile;
  }

  /**
   * Determine user's preferred difficulty level
   * @private
   */
  determinePreferredDifficulty(userId, completedScenarios) {
    if (completedScenarios.length === 0) {
      return 'medium'; // Default
    }

    // In a real system, this would be based on scenario metadata
    // For now, we'll just return medium as default
    return 'medium';
  }

  /**
   * Determine user's learning style
   * @private
   */
  determineLearningStyle(userId) {
    const user = this.data.users[userId];
    if (!user) return 'mixed';

    // Analyze based on interaction patterns
    const interactions = this.data.interactions.filter(i => i.userId === userId);

    // If user tends to try different approaches, they might be exploratory
    // If they follow a consistent path, they might be systematic
    if (interactions.length > 3) {
      // Simplified logic: if user has multiple interactions with same scenario, they're exploring
      const scenarioCount = {};
      interactions.forEach(interaction => {
        scenarioCount[interaction.scenarioId] = (scenarioCount[interaction.scenarioId] || 0) + 1;
      });

      const repeatedScenarios = Object.values(scenarioCount).filter(count => count > 1);
      if (repeatedScenarios.length > 0) {
        return 'exploratory';
      }
    }

    return 'systematic';
  }

  /**
   * Generate personalized recommendations based on user profile
   * @private
   */
  generateRecommendations(userId, profile) {
    const recommendations = [];
    const allScenarios = Object.keys(this.data.scenarios);
    
    // Get user's completed scenarios
    const user = this.data.users[userId];
    const completedScenarioIds = Object.keys(user.completion_stats).filter(
      id => user.completion_stats[id]?.completed
    );

    // 1. Fill gaps in weak areas
    const weaknessScenarios = this.findScenariosForWeaknesses(profile.weaknesses, allScenarios);
    recommendations.push(...this.rankScenariosByRelevance(weaknessScenarios, profile, 'remedial'));

    // 2. Provide challenge in strong areas
    const strengthScenarios = this.findScenariosForStrengths(profile.strengths, allScenarios);
    recommendations.push(...this.rankScenariosByRelevance(strengthScenarios, profile, 'reinforcement'));

    // 3. Introduce new concepts
    const newScenarios = allScenarios.filter(id => !completedScenarioIds.includes(id));
    recommendations.push(...this.rankScenariosByRelevance(newScenarios, profile, 'exploration'));

    // 4. Address bias recognition gaps
    const biasGapScenarios = this.findScenariosForBiasGaps(userId, profile);
    recommendations.push(...this.rankScenariosByRelevance(biasGapScenarios, profile, 'targeted'));

    // Sort by priority and return top 10
    return recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10);
  }

  /**
   * Find scenarios that address user's weaknesses
   * @private
   */
  findScenariosForWeaknesses(weaknesses, allScenarios) {
    // In a real implementation, this would match weaknesses to scenario content
    // For now, we'll return all scenarios that aren't in strengths
    return allScenarios.filter(id => !weaknesses.includes(id));
  }

  /**
   * Find scenarios that build on user's strengths
   * @private
   */
  findScenariosForStrengths(strengths, allScenarios) {
    // In a real implementation, this would find more advanced scenarios related to strengths
    // For now, we'll return a random sample
    return this.getRandomElements(allScenarios.filter(id => !strengths.includes(id)), 3);
  }

  /**
   * Find scenarios that address bias recognition gaps
   * @private
   */
  findScenariosForBiasGaps(userId, profile) {
    // Identify biases the user struggles with and find relevant scenarios
    const user = this.data.users[userId];
    const scenarios = [];
    
    // In a real implementation, this would map specific biases to scenarios
    // For now, return a few scenarios
    const allScenarios = Object.keys(this.data.scenarios);
    return this.getRandomElements(allScenarios, 3);
  }

  /**
   * Rank scenarios by relevance to user profile
   * @private
   */
  rankScenariosByRelevance(scenarioIds, profile, category) {
    return scenarioIds.map(id => {
      const relevance = this.calculateScenarioRelevance(id, profile, category);
      return {
        scenarioId: id,
        category,
        relevance,
        priority: this.calculatePriority(relevance, category),
        reason: this.generateRecommendationReason(id, profile, category)
      };
    });
  }

  /**
   * Calculate relevance of a scenario to user profile
   * @private
   */
  calculateScenarioRelevance(scenarioId, profile, category) {
    // Base relevance on category
    let relevance = 0.5; // Base relevance
    
    switch (category) {
      case 'remedial':
        // Higher relevance for weaknesses
        relevance = profile.weaknesses.includes(scenarioId) ? 0.9 : 0.3;
        break;
      case 'reinforcement':
        // Medium relevance for strengths
        relevance = profile.strengths.includes(scenarioId) ? 0.7 : 0.4;
        break;
      case 'exploration':
        // Medium relevance for new scenarios
        relevance = 0.6;
        break;
      case 'targeted':
        // High relevance for bias gaps
        relevance = 0.8;
        break;
      default:
        relevance = 0.5;
    }
    
    // Adjust for difficulty preference
    const difficultyMatch = 0.8; // Placeholder for actual difficulty matching
    relevance = relevance * difficultyMatch;
    
    return Math.min(1.0, relevance);
  }

  /**
   * Calculate recommendation priority
   * @private
   */
  calculatePriority(relevance, category) {
    // Priority depends on category and relevance
    const categoryWeights = {
      'remedial': 1.2,    // Urgent - fix weaknesses
      'targeted': 1.1,    // Important - address gaps
      'reinforcement': 0.8, // Good - build on strengths
      'exploration': 0.7   // Nice to have - explore
    };
    
    return relevance * (categoryWeights[category] || 1.0);
  }

  /**
   * Generate reason for recommendation
   * @private
   */
  generateRecommendationReason(scenarioId, profile, category) {
    const reasons = {
      'remedial': `This scenario addresses areas where you could improve based on previous performance`,
      'reinforcement': `This scenario builds on your strengths and helps reinforce good decision-making patterns`,
      'exploration': `This scenario introduces new concepts and challenges to broaden your skills`,
      'targeted': `This scenario targets specific cognitive biases you may benefit from studying`
    };
    
    return reasons[category] || 'This scenario matches your learning profile';
  }

  /**
   * Get default recommendations (fallback)
   * @private
   */
  getDefaultRecommendations() {
    const allScenarios = Object.keys(this.data.scenarios);
    const randomScenarios = this.getRandomElements(allScenarios, 5);
    
    return randomScenarios.map(id => ({
      scenarioId: id,
      category: 'general',
      relevance: 0.5,
      priority: 0.5,
      reason: 'General recommendation for all users'
    }));
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
   * Get all recommendations for all users (for admin dashboards)
   * @returns {Object} Recommendations for all users
   */
  getAllUserRecommendations() {
    const allRecommendations = {};
    
    for (const userId of Object.keys(this.data.users)) {
      allRecommendations[userId] = this.getPersonalizedRecommendations(userId);
    }
    
    return allRecommendations;
  }

  /**
   * Generate comprehensive performance metrics dashboard data
   * @returns {Object} Dashboard metrics
   */
  generateDashboardMetrics() {
    const dashboard = {
      summary: this.getPlatformSummary(),
      userEngagement: this.getUserEngagementMetrics(),
      scenarioPerformance: this.getScenarioPerformanceMetrics(),
      learningOutcomes: this.getLearningOutcomeMetrics(),
      trends: this.getTrendAnalysis(),
      recommendations: this.getSystemRecommendations()
    };

    return dashboard;
  }

  /**
   * Get platform summary metrics
   * @private
   */
  getPlatformSummary() {
    return {
      totalUsers: Object.keys(this.data.users).length,
      totalScenarios: Object.keys(this.data.scenarios).length,
      totalInteractions: this.data.analytics.total_interactions,
      totalCompletions: this.countTotalCompletions(),
      averageCompletionRate: this.calculateAverageCompletionRate(),
      activeUsersToday: this.countActiveUsers(new Date()),
      activeUsersThisWeek: this.countActiveUsers(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      activeUsersThisMonth: this.countActiveUsers(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    };
  }

  /**
   * Count total completions across all users and scenarios
   * @private
   */
  countTotalCompletions() {
    let total = 0;
    for (const user of Object.values(this.data.users)) {
      for (const completion of Object.values(user.completion_stats)) {
        if (completion.completed) total++;
      }
    }
    return total;
  }

  /**
   * Calculate average completion rate
   * @private
   */
  calculateAverageCompletionRate() {
    const totalUsers = Object.keys(this.data.users).length;
    if (totalUsers === 0) return 0;

    let totalCompleted = 0;
    let totalAttempted = 0;

    for (const user of Object.values(this.data.users)) {
      const completed = Object.values(user.completion_stats).filter(c => c.completed).length;
      const attempted = user.scenarios_interacted.length;

      totalCompleted += completed;
      totalAttempted += attempted;
    }

    return totalAttempted > 0 ? totalCompleted / totalAttempted : 0;
  }

  /**
   * Count active users within a timeframe
   * @private
   */
  countActiveUsers(sinceDate) {
    let count = 0;
    const sinceTime = sinceDate.getTime();

    for (const user of Object.values(this.data.users)) {
      const lastInteractionTime = new Date(user.last_interaction).getTime();
      if (lastInteractionTime >= sinceTime) {
        count++;
      }
    }

    return count;
  }

  /**
   * Get user engagement metrics
   * @private
   */
  getUserEngagementMetrics() {
    const users = Object.values(this.data.users);
    if (users.length === 0) {
      return {
        averageInteractionsPerUser: 0,
        activeUsers: 0,
        returningUsers: 0,
        engagementSegments: {},
        timeSpentDistribution: {}
      };
    }

    const interactionsPerUser = users.map(u => u.total_interactions);
    const averageInteractions = interactionsPerUser.reduce((sum, count) => sum + count, 0) / users.length;

    // Calculate returning users (users with more than 1 interaction)
    const returningUsers = users.filter(u => u.total_interactions > 1).length;

    // Segment users by engagement level
    const engagementSegments = {
      highlyEngaged: users.filter(u => u.total_interactions >= 10).length,
      moderatelyEngaged: users.filter(u => u.total_interactions >= 5 && u.total_interactions < 10).length,
      lightlyEngaged: users.filter(u => u.total_interactions >= 1 && u.total_interactions < 5).length,
      inactive: users.filter(u => u.total_interactions === 0).length
    };

    // Calculate distribution of time spent
    const timeSpentDistribution = this.calculateTimeSpentDistribution();

    return {
      averageInteractionsPerUser: averageInteractions,
      activeUsers: users.length,
      returningUsers,
      engagementSegments,
      timeSpentDistribution
    };
  }

  /**
   * Calculate time spent distribution
   * @private
   */
  calculateTimeSpentDistribution() {
    const distribution = {
      lessThan10Min: 0,
      tenTo30Min: 0,
      thirtyToOneHour: 0,
      moreThanOneHour: 0
    };

    for (const user of Object.values(this.data.users)) {
      for (const completion of Object.values(user.completion_stats)) {
        if (completion.duration) {
          if (completion.duration < 600) { // 10 minutes
            distribution.lessThan10Min++;
          } else if (completion.duration < 1800) { // 30 minutes
            distribution.tenTo30Min++;
          } else if (completion.duration < 3600) { // 1 hour
            distribution.thirtyToOneHour++;
          } else {
            distribution.moreThanOneHour++;
          }
        }
      }
    }

    return distribution;
  }

  /**
   * Get scenario performance metrics
   * @private
   */
  getScenarioPerformanceMetrics() {
    const scenarioMetrics = [];

    for (const [scenarioId, scenario] of Object.entries(this.data.scenarios)) {
      const completionStats = scenario.completion_stats;
      const engagementMetrics = scenario.engagement_metrics;

      scenarioMetrics.push({
        scenarioId,
        title: scenarioId, // In a real implementation, this would come from scenario data
        totalAttempts: completionStats.attempts,
        totalCompletions: completionStats.completions,
        completionRate: completionStats.attempts > 0 ? completionStats.completions / completionStats.attempts : 0,
        uniqueUsers: scenario.unique_users ? Array.from(scenario.unique_users).length : 0,
        averageRating: engagementMetrics.average_rating,
        totalRatings: engagementMetrics.total_ratings,
        feedbackCount: engagementMetrics.feedback_count,
        averageCompletionTime: completionStats.average_completion_time
      });
    }

    // Sort by completion rate
    scenarioMetrics.sort((a, b) => b.completionRate - a.completionRate);

    return {
      topPerformingScenarios: scenarioMetrics.slice(0, 5),
      lowestPerformingScenarios: scenarioMetrics.slice(-5),
      allScenarios: scenarioMetrics,
      averageCompletionRate: scenarioMetrics.length > 0 
        ? scenarioMetrics.reduce((sum, s) => sum + s.completionRate, 0) / scenarioMetrics.length 
        : 0
    };
  }

  /**
   * Get learning outcome metrics
   * @private
   */
  getLearningOutcomeMetrics() {
    const allScores = [];
    let totalScore = 0;
    let scoreCount = 0;

    for (const user of Object.values(this.data.users)) {
      for (const completion of Object.values(user.completion_stats)) {
        if (completion.score !== undefined) {
          allScores.push(completion.score);
          totalScore += completion.score;
          scoreCount++;
        }
      }
    }

    if (scoreCount === 0) {
      return {
        averageScore: 0,
        scoreDistribution: {},
        learningImprovementRate: 0,
        biasRecognitionImprovement: 0
      };
    }

    const averageScore = totalScore / scoreCount;

    // Score distribution
    const scoreDistribution = {
      below50: allScores.filter(s => s < 50).length,
      fiftyTo69: allScores.filter(s => s >= 50 && s < 70).length,
      seventyTo84: allScores.filter(s => s >= 70 && s < 85).length,
      eightyFivePlus: allScores.filter(s => s >= 85).length
    };

    // Calculate learning improvement (simplified)
    const learningImprovementRate = this.calculateLearningImprovementRate();

    // Bias recognition improvement (simplified)
    const biasRecognitionImprovement = this.calculateBiasRecognitionImprovement();

    return {
      averageScore,
      scoreDistribution,
      learningImprovementRate,
      biasRecognitionImprovement
    };
  }

  /**
   * Calculate learning improvement rate
   * @private
   */
  calculateLearningImprovementRate() {
    // Calculate improvement by comparing early vs later performance
    let improvementCount = 0;
    let totalUsers = 0;

    for (const user of Object.values(this.data.users)) {
      const completions = Object.values(user.completion_stats)
        .filter(c => c.completed)
        .sort((a, b) => new Date(a.completion_date) - new Date(b.completion_date));

      if (completions.length >= 2) {
        const earlyScore = completions[0].score || 0;
        const laterScore = completions[completions.length - 1].score || 0;
        if (laterScore > earlyScore) {
          improvementCount++;
        }
        totalUsers++;
      }
    }

    return totalUsers > 0 ? improvementCount / totalUsers : 0;
  }

  /**
   * Calculate bias recognition improvement
   * @private
   */
  calculateBiasRecognitionImprovement() {
    // Count users who have shown improvement in bias recognition
    let improvementCount = 0;
    let totalUsers = 0;

    for (const user of Object.values(this.data.users)) {
      if (user.learning_profile && user.learning_profile.biases_identified) {
        // If user has identified more than 3 biases, consider it improvement
        if (user.learning_profile.biases_identified.length >= 3) {
          improvementCount++;
        }
        totalUsers++;
      }
    }

    return totalUsers > 0 ? improvementCount / totalUsers : 0;
  }

  /**
   * Get trend analysis
   * @private
   */
  getTrendAnalysis() {
    // Analyze trends over time
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    // Get data for different periods
    const lastMonth = this.getDataForPeriod(oneMonthAgo, now);
    const monthBefore = this.getDataForPeriod(twoMonthsAgo, oneMonthAgo);

    return {
      userGrowth: this.calculateGrowthRate(monthBefore.userCount, lastMonth.userCount),
      engagementGrowth: this.calculateGrowthRate(monthBefore.engagement, lastMonth.engagement),
      completionRateTrend: this.calculateGrowthRate(monthBefore.completionRate, lastMonth.completionRate),
      recentActivity: lastMonth
    };
  }

  /**
   * Get data for a specific period
   * @private
   */
  getDataForPeriod(startDate, endDate) {
    let userCount = 0;
    let interactionCount = 0;
    let completionCount = 0;
    let engagementScore = 0;

    for (const user of Object.values(this.data.users)) {
      const userStartDate = new Date(user.first_interaction);
      if (userStartDate >= startDate && userStartDate <= endDate) {
        userCount++;
        interactionCount += user.total_interactions;

        // Count completions in this period
        for (const completion of Object.values(user.completion_stats)) {
          if (completion.completed && new Date(completion.completion_date) >= startDate && new Date(completion.completion_date) <= endDate) {
            completionCount++;
          }
        }

        // Calculate engagement score
        engagementScore += user.total_interactions * (user.total_interactions > 5 ? 1 : 0.5);
      }
    }

    const completionRate = interactionCount > 0 ? completionCount / interactionCount : 0;

    return {
      userCount,
      interactionCount,
      completionCount,
      engagement: engagementScore,
      completionRate
    };
  }

  /**
   * Calculate growth rate
   * @private
   */
  calculateGrowthRate(prevValue, currentValue) {
    if (prevValue === 0) {
      return currentValue > 0 ? Infinity : 0;
    }
    return (currentValue - prevValue) / prevValue;
  }

  /**
   * Get system-wide recommendations
   * @private
   */
  getSystemRecommendations() {
    const recommendations = [];

    // Identify most popular scenarios
    const popularScenarios = this.getTopScenariosByMetric('unique_users', 3);
    if (popularScenarios.length > 0) {
      recommendations.push({
        type: 'content_popularity',
        title: 'Popular Scenarios',
        description: 'These scenarios are being completed by many users',
        items: popularScenarios,
        priority: 'high'
      });
    }

    // Identify scenarios with low completion rates
    const strugglingScenarios = this.getLowPerformingScenarios(3);
    if (strugglingScenarios.length > 0) {
      recommendations.push({
        type: 'content_improvement',
        title: 'Scenarios Needing Attention',
        description: 'These scenarios have low completion rates and may need improvements',
        items: strugglingScenarios,
        priority: 'medium'
      });
    }

    // Identify engagement patterns
    const engagementInsights = this.getEngagementInsights();
    if (engagementInsights.length > 0) {
      recommendations.push({
        type: 'engagement_optimization',
        title: 'Engagement Insights',
        description: 'Patterns in user engagement that suggest optimizations',
        items: engagementInsights,
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Get top scenarios by a specific metric
   * @private
   */
  getTopScenariosByMetric(metric, count) {
    const scenarios = Object.entries(this.data.scenarios)
      .map(([id, scenario]) => ({ id, value: this.getScenarioMetricValue(scenario, metric) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, count);

    return scenarios.map(s => ({ id: s.id, value: s.value }));
  }

  /**
   * Get value of a specific metric for a scenario
   * @private
   */
  getScenarioMetricValue(scenario, metric) {
    switch (metric) {
      case 'unique_users':
        return scenario.unique_users ? Array.from(scenario.unique_users).length : 0;
      case 'completion_rate':
        return scenario.completion_stats.attempts > 0 
          ? scenario.completion_stats.completions / scenario.completion_stats.attempts 
          : 0;
      case 'engagement':
        return scenario.engagement_metrics.total_ratings || 0;
      default:
        return 0;
    }
  }

  /**
   * Get low performing scenarios
   * @private
   */
  getLowPerformingScenarios(count) {
    const scenarios = Object.entries(this.data.scenarios)
      .filter(([id, scenario]) => scenario.completion_stats.attempts > 5) // Only consider if enough attempts
      .map(([id, scenario]) => ({ 
        id, 
        completionRate: scenario.completion_stats.attempts > 0 
          ? scenario.completion_stats.completions / scenario.completion_stats.attempts 
          : 0,
        totalAttempts: scenario.completion_stats.attempts
      }))
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, count);

    return scenarios;
  }

  /**
   * Get engagement insights
   * @private
   */
  getEngagementInsights() {
    const insights = [];

    // Identify average session length
    const avgSessionLength = this.calculateAverageSessionLength();
    if (avgSessionLength < 300) { // Less than 5 minutes
      insights.push({
        insight: 'Short sessions',
        description: 'Users have short sessions, suggesting need for more engaging content',
        suggestion: 'Add more interactive elements or break content into smaller chunks'
      });
    }

    // Identify completion patterns
    const completionPatterns = this.identifyCompletionPatterns();
    if (completionPatterns.length > 0) {
      insights.push(...completionPatterns);
    }

    return insights;
  }

  /**
   * Calculate average session length
   * @private
   */
  calculateAverageSessionLength() {
    const durations = [];
    
    for (const user of Object.values(this.data.users)) {
      for (const completion of Object.values(user.completion_stats)) {
        if (completion.duration) {
          durations.push(completion.duration);
        }
      }
    }

    if (durations.length === 0) return 0;
    
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  /**
   * Identify completion patterns
   * @private
   */
  identifyCompletionPatterns() {
    const patterns = [];
    
    // Identify if users tend to drop off at specific points
    const dropOffPatterns = this.identifyDropOffPatterns();
    if (dropOffPatterns.length > 0) {
      patterns.push(...dropOffPatterns);
    }
    
    return patterns;
  }

  /**
   * Identify drop-off patterns
   * @private
   */
  identifyDropOffPatterns() {
    // For now, we'll return an empty array
    // In a real implementation, this would analyze where users tend to stop engaging
    return [];
  }

  /**
   * Get metrics for a specific user
   * @param {string} userId - User identifier
   * @returns {Object} User-specific metrics
   */
  getUserMetrics(userId) {
    const userProgress = this.getUserProgress(userId);
    if (!userProgress) {
      return null;
    }

    const userInsights = this.getUserLearningInsights(userId);
    const userPatterns = this.getUserRelevantPatterns(userId);

    return {
      ...userProgress,
      insights: userInsights,
      relevantPatterns: userPatterns,
      ranking: this.getUserRanking(userId),
      achievements: this.getUserAchievements(userId)
    };
  }

  /**
   * Get user ranking
   * @private
   */
  getUserRanking(userId) {
    const allUsers = Object.entries(this.data.users);
    const currentUser = this.data.users[userId];
    
    if (!currentUser) return null;

    // Rank by number of completions
    allUsers.sort((a, b) => {
      const aCompletions = Object.values(a[1].completion_stats).filter(c => c.completed).length;
      const bCompletions = Object.values(b[1].completion_stats).filter(c => c.completed).length;
      return bCompletions - aCompletions;
    });

    const userIndex = allUsers.findIndex(entry => entry[0] === userId);
    return {
      rank: userIndex + 1,
      totalUsers: allUsers.length,
      percentile: userIndex === -1 ? 0 : (1 - userIndex / allUsers.length) * 100
    };
  }

  /**
   * Get user achievements
   * @private
   */
  getUserAchievements(userId) {
    const user = this.data.users[userId];
    const achievements = [];

    if (!user) return achievements;

    // Completion achievements
    const completedCount = Object.values(user.completion_stats).filter(c => c.completed).length;
    if (completedCount >= 10) {
      achievements.push({ id: 'completion_decagon', name: 'Decagon Completer', description: 'Completed 10 scenarios' });
    } else if (completedCount >= 5) {
      achievements.push({ id: 'completion_pentagon', name: 'Pentagon Completer', description: 'Completed 5 scenarios' });
    } else if (completedCount >= 1) {
      achievements.push({ id: 'first_completion', name: 'First Steps', description: 'Completed first scenario' });
    }

    // Improvement achievements
    if (this.calculateLearningImprovementRate() > 0.8) {
      achievements.push({ id: 'improvement_maestro', name: 'Improvement Maestro', description: 'Showed significant learning improvement' });
    }

    // Bias recognition achievements
    if (user.learning_profile?.biases_identified?.length >= 5) {
      achievements.push({ id: 'bias_detective', name: 'Bias Detective', description: 'Recognized 5+ cognitive biases' });
    }

    return achievements;
  }

  /**
   * Reset analytics data (for testing purposes)
   */
  resetData() {
    this.data = this.getDefaultDataStructure();
    this.saveToStorage();
  }
}

// Create global instance for use throughout the application
const historicalAnalytics = new HistoricalScenarioAnalytics();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HistoricalScenarioAnalytics, historicalAnalytics };
}

// Also make it available globally if running in browser
if (typeof window !== 'undefined') {
  window.HistoricalScenarioAnalytics = HistoricalScenarioAnalytics;
  window.historicalAnalytics = historicalAnalytics;
}