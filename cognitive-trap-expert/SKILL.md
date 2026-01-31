# Cognitive Trap Expert Skill

## Overview
Expert skill for the Cognitive Trap Platform - an educational platform designed to teach users about cognitive biases through interactive scenarios and games. The platform focuses on revealing how human intuition often fails when dealing with complex systems, linear vs. exponential thinking, and time-delayed consequences.

## Core Capabilities

### 1. Cognitive Bias Detection and Analysis
- **Linear Thinking Trap**: Identifies when users apply linear reasoning to non-linear problems
- **Confirmation Bias**: Detects tendency to seek information that confirms existing beliefs
- **Time Delay Bias**: Recognizes failure to account for delayed consequences
- **Exponential Growth Misconception**: Identifies misunderstanding of compound effects
- **Complex System Misunderstanding**: Reveals oversimplification of interconnected systems

### 2. Scenario-Based Learning
- **Coffee Shop Linear Thinking**: Teaches about linear thinking traps in complex systems
- **Relationship Time Delay**: Demonstrates time delay effects in relationship investments
- **Investment Confirmation Bias**: Illustrates confirmation bias in investment decisions
- **Advanced Game Scenarios**: Complex strategic decision-making games

### 3. Decision Engine Framework
- Real-time calculation of decision consequences
- Linear expectation vs. actual complex system results
- Delayed effect simulation and tracking
- Cognitive bias detection and feedback

### 4. Adaptive Difficulty System
- Multiple difficulty levels (beginner, intermediate, advanced)
- Dynamic challenge scaling based on user preferences
- Advanced challenges with increased complexity

## Technical Architecture

### Backend (Python FastAPI)
- **Endpoints**: FastAPI route handlers for scenarios, cognitive tests, and results
- **Logic**: Core business logic including LLM integration
- **Models**: Pydantic models for data validation
- **Loaders**: Scenario data loading mechanisms
- **Data**: JSON-based scenarios with supporting data files

### Frontend (Vanilla JavaScript)
- **Main Application**: `app.js` with scenario routers and decision engines
- **API Configuration**: Intelligent failover capabilities
- **Turn-Based Scenarios**: State management for complex decision trees
- **Feedback Systems**: Awakening moments and pattern recognition

## Key Features

### 1. Decision Pattern Tracking
- Tracks user decision patterns across sessions
- Identifies consistent cognitive biases
- Generates personalized insights based on decision history

### 2. Cross-Scenario Analysis
- Analyzes user behavior across multiple scenarios
- Identifies recurring cognitive bias patterns
- Provides system-wide recommendations

### 3. Real-Time Feedback Generation
- Confusion moments for early learning
- Bias revelation in mid-session
- Advanced personalized feedback for experienced users

### 4. Delayed Effect Simulation
- Models time-delayed consequences of decisions
- Simulates cascading effects in complex systems
- Demonstrates non-obvious cause-and-effect relationships

## Usage Guidelines

### For Developers
- Follow TDD-first approach for all new features
- Maintain dual-naming compatibility (snake_case and camelCase)
- Implement proper error handling with graceful degradation
- Use pyramid principle for cognitive bias explanations

### For Educators
- Start with beginner scenarios to establish baseline understanding
- Progress to advanced scenarios that combine multiple biases
- Use awakening moments to create "aha!" experiences
- Encourage reflection on decision patterns

### For Learners
- Approach scenarios with open mind, expect surprises
- Pay attention to delayed consequences
- Compare linear expectations with actual results
- Reflect on decision patterns across different scenarios

## Best Practices

### Scenario Design
- Include both immediate and delayed consequences
- Create scenarios with non-obvious cause-effect relationships
- Balance challenge level with learning objectives
- Incorporate real-world examples and historical cases

### Feedback Mechanisms
- Use confusion moments to challenge assumptions
- Reveal biases gradually, not immediately
- Provide actionable advice for improvement
- Connect insights to broader life applications

### Assessment Techniques
- Track decision consistency over time
- Monitor for pattern recognition improvement
- Assess understanding of complex system dynamics
- Evaluate transfer of learning to new contexts

## Integration Points

### API Endpoints
- `/scenarios/` - Access all cognitive trap scenarios
- `/scenarios/{scenario_id}` - Get specific scenario details
- `/scenarios/create_game_session` - Start new game sessions
- `/scenarios/{game_id}/turn` - Execute game turns

### Data Models
- Scenario definitions with cognitive bias targets
- Game session state management
- Decision history tracking
- User pattern analysis

## Common Pitfalls to Address

1. **Overconfidence Bias**: Users believing they're immune to cognitive biases
2. **Hindsight Bias**: After learning, believing they would have made better decisions
3. **Fundamental Attribution Error**: Blaming character rather than situational factors
4. **Availability Heuristic**: Relying on readily available examples rather than systematic analysis

## Learning Outcomes

Upon successful engagement with the Cognitive Trap Platform, users will:

1. Recognize common cognitive biases in their own thinking
2. Apply systems thinking to complex problems
3. Consider delayed consequences in decision-making
4. Distinguish between linear and exponential growth patterns
5. Develop metacognitive awareness of their thinking processes