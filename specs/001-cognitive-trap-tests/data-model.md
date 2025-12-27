# Data Model: 认知陷阱测试扩展

**Feature**: 001-cognitive-trap-tests  
**Date**: 2025-11-09  
**Status**: Design

## Entity Definitions

### 1. CognitiveTestQuestion (认知测试问题)
- **testId**: String (unique identifier for the test)
- **questionType**: Enum ['exponential', 'compound', 'historical', 'game'] (type of cognitive bias being tested)
- **topic**: String ('exponential-growth', 'compound-interest', 'historical-decision', 'reasoning-game')
- **questionText**: String (the actual question presented to user)
- **options**: Array of String (possible choices for multiple choice questions)
- **correctAnswer**: Int/Float/String (correct answer to the question)
- **explanation**: String (detailed explanation using pyramid principle)
- **difficulty**: Enum ['easy', 'medium', 'hard'] (relative difficulty of the question)
- **relatedConcepts**: Array of String (associated cognitive bias concepts)

### 2. UserResponseRecord (用户响应记录)
- **userId**: String (identifier for the user taking test)
- **sessionId**: String (session identifier for the test session)
- **questionId**: String (reference to the specific question)
- **userChoice**: String/Int/Float (user's selected or entered answer)
- **userEstimation**: Float (user's pre-estimation value before seeing result)
- **actualValue**: Float (the actual correct value)
- **responseTime**: DateTime (when the response was submitted)
- **confidence**: Enum ['low', 'medium', 'high'] (user's confidence in their answer)
- **deviation**: Float (difference between user estimation and actual value)

### 3. ChallengeResultSummary (挑战结果汇总)
- **userId**: String (identifier for the user)
- **sessionId**: String (test session identifier)
- **testType**: Enum ['exponential', 'compound', 'historical', 'game'] (type of challenge)
- **score**: Float (overall score achieved)
- **biasScores**: Object (scores broken down by different cognitive biases)
- **estimationErrors**: Array of Float (differences between user estimations and actual values)
- **improvementAreas**: Array of String (specific areas for improvement)
- **pyramidExplanations**: Array of String (explanations using pyramid principle)
- **completionTime**: DateTime (when the challenge was completed)

### 4. HistoricalScenario (历史场景)
- **scenarioId**: String (unique identifier for historical case)
- **title**: String (title of the historical event)
- **description**: String (background description of the scenario)
- **decisionPoints**: Array of Object (key decision moments in the historical event)
- **actualOutcomes**: Array of String (what actually happened)
- **alternativeOptions**: Array of String (other choices that could have been made)
- **lessons**: Array of String (key lessons about cognitive biases from the scenario)
- **pyramidAnalysis**: Object (analysis using pyramid principle: core conclusion + supporting arguments)

### 5. ExplanationFramework (解释框架)
- **explanationId**: String (unique identifier for explanation)
- **coreConclusion**: String (main takeaway message)
- **supportingArguments**: Array of String (key points supporting the conclusion)
- **examples**: Array of String (real-world examples)
- **actionableAdvice**: Array of String (specific recommendations for user)
- **biasType**: String (the specific cognitive bias being explained)
- **relatedTests**: Array of String (other tests with similar biases)

## Entity Relationships

```
UserResponseRecord -(references)-> CognitiveTestQuestion
ChallengeResultSummary -(contains)-> UserResponseRecord
CognitiveTestQuestion -(has type)-> ['exponential', 'compound', 'historical', 'game']
HistoricalScenario -(used in)-> CognitiveTestQuestion (for historical decision tests)
ExplanationFramework -(used for)-> ChallengeResultSummary (to explain results)
```

## State Transitions

### Test Session States
- **NEW**: Session created, awaiting user start
- **IN_PROGRESS**: User actively answering questions  
- **COMPLETED**: User finished test, results calculated
- **RESULTS_SHOWN**: User has viewed explanations of their results

### Response Validation Rules
- User responses must be within acceptable range for the question type
- Estimation values must be numeric for calculation-based questions
- Confidence ratings required for all answers
- Response times recorded to detect random guessing

## Validation Rules

### CognitiveTestQuestion
- questionText must not be empty
- options array must contain 2+ elements for multiple choice questions
- correctAnswer must correspond to one of the options for multiple choice
- explanation must use pyramid principle structure

### UserResponseRecord
- userId and sessionId must be valid identifiers
- deviation must be calculated as (abs(userEstimation - actualValue) / actualValue) * 100
- responseTime must be within the test session time limits

### ChallengeResultSummary
- score must be between 0 and 100
- biasScores must contain values for all applicable bias types
- pyramidExplanations must follow pyramid principle structure

## API Contract Considerations

### Request/Response Formats
- Requests for test questions will include userId and testType
- Responses will include question content and necessary metadata
- Submission of answers will include response object with all required fields
- Results will be returned in summary format with detailed breakdown

This data model supports the core functionality of the cognitive trap testing feature while maintaining scalability and adherence to SOLID principles.