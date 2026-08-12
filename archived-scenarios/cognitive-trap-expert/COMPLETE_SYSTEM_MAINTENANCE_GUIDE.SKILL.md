# Cognitive Trap Platform - Complete System Maintenance Expert Guide

## Overview
This guide provides a comprehensive overview of all expert skills needed to maintain the Cognitive Trap Platform, an educational system designed to teach cognitive biases through interactive scenarios and games. The platform consists of a Python FastAPI backend with a vanilla JavaScript frontend.

## System Architecture

### Backend Components
- **Framework**: FastAPI-based REST API
- **Language**: Python 3.12+
- **Data Models**: Pydantic models for validation
- **Business Logic**: Complex decision engines and cognitive bias analysis
- **Data Storage**: JSON-based scenario data with in-memory session management

### Frontend Components
- **Framework**: Vanilla JavaScript (UMD/CommonJS modules)
- **Styling**: Modular CSS architecture
- **Architecture**: Turn-based scenario system with specialized routers
- **API Integration**: Robust connection management with fallbacks

## Expert Skill Categories

### 1. Frontend Maintenance Expert
**File**: `FRONTEND_MAINTENANCE_EXPERT.SKILL.md`

#### Key Responsibilities:
- Maintain JavaScript application architecture
- Manage scenario-specific frontend modules
- Handle UI/UX components and styling
- Implement game state management systems
- Manage API integration and error handling

#### Critical Skills:
- Vanilla JavaScript expertise
- Turn-based game architecture
- Responsive design and accessibility
- Performance optimization
- Cross-browser compatibility

---

### 2. Backend Maintenance Expert
**File**: `BACKEND_MAINTENANCE_EXPERT.SKILL.md`

#### Key Responsibilities:
- Maintain FastAPI architecture and management
- Manage core business logic and decision engines
- Handle data management and models
- Oversee scenario and game management systems

#### Critical Skills:
- FastAPI framework expertise
- Complex algorithm implementation
- Data validation and security
- Performance optimization
- Error handling and logging

---

### 3. Module-Specific Experts
**File**: `MODULE_MAINTENANCE_EXPERTS.SKILL.md`

#### Specialized Areas:
1. **Decision Engine Module Expert**
   - Maintains decision processing logic
   - Optimizes cognitive bias detection algorithms
   - Handles complex mathematical calculations

2. **Cognitive Bias Analysis Expert**
   - Updates bias detection algorithms based on research
   - Improves feedback mechanisms
   - Enhances pyramid principle explanations

3. **Scenario Management Expert**
   - Manages scenario data and content
   - Updates difficulty levels
   - Ensures educational effectiveness

4. **Game Session Management Expert**
   - Handles game state persistence
   - Manages multi-turn game logic
   - Maintains decision history tracking

5. **API Endpoint Management Expert**
   - Maintains API endpoints
   - Ensures performance and security
   - Manages versioning and compatibility

6. **User Experience Module Expert**
   - Optimizes learning pathways
   - Manages engagement systems
   - Maintains feedback mechanisms

7. **Data Models and Validation Expert**
   - Maintains Pydantic models
   - Ensures data integrity
   - Manages schema evolution

8. **Performance and Monitoring Expert**
   - Monitors system performance
   - Implements optimization solutions
   - Manages scaling requirements

9. **Frontend Integration Expert**
   - Manages API contracts
   - Ensures compatibility
   - Optimizes data exchange

10. **Educational Content Expert**
    - Maintains educational effectiveness
    - Updates content based on research
    - Validates learning outcomes

## System Integration Points

### API Endpoints
- `GET /api/v1/scenarios` - Retrieve all cognitive trap scenarios
- `GET /api/v1/scenarios/{scenario_id}` - Get specific scenario details
- `POST /api/v1/scenarios/create_game_session` - Create game sessions
- `POST /api/v1/scenarios/{game_id}/turn` - Execute game turns
- `GET /api/v1/scenarios/{game_id}/analysis` - Get game analysis
- `GET /api/v1/users/stats` - Retrieve user statistics
- `GET /api/v1/users/leaderboard` - Access leaderboard

### Data Flow Architecture
1. **Frontend Request**: User interactions trigger API calls
2. **Backend Processing**: FastAPI routes handle requests
3. **Logic Layer**: Business logic processes decisions
4. **Cognitive Analysis**: Bias detection algorithms analyze decisions
5. **Response Generation**: Formatted responses sent to frontend
6. **UI Update**: Frontend updates game state and displays feedback

## Maintenance Procedures

### Daily Tasks
- Monitor system performance and uptime
- Review application logs for errors
- Validate API endpoint functionality
- Check scenario data integrity
- Monitor user session activity

### Weekly Tasks
- Perform system backups
- Review user feedback and analytics
- Update scenario content if needed
- Test new features and fixes
- Audit security configurations

### Monthly Tasks
- Conduct comprehensive system testing
- Review and update dependencies
- Assess performance optimization opportunities
- Evaluate educational effectiveness metrics
- Plan for scaling requirements

## Emergency Procedures

### Critical Issues
1. **API Outages**: Activate monitoring and initiate troubleshooting
2. **Data Corruption**: Restore from backups and implement fixes
3. **Security Breaches**: Follow incident response protocols
4. **Performance Degradation**: Implement temporary scaling solutions

### Rollback Procedures
- Maintain previous stable versions
- Use feature flags to disable problematic functionality
- Document all changes for quick reversal
- Communicate with stakeholders during incidents

## Quality Assurance

### Testing Strategy
- Unit tests for all business logic
- Integration tests for API endpoints
- End-to-end tests for user scenarios
- Performance tests for scalability
- Security tests for vulnerability assessment

### Code Quality Standards
- Type hints throughout the codebase
- Comprehensive documentation
- Consistent naming conventions
- Proper error handling
- Security best practices

## Documentation Standards

### Code Documentation
- Detailed docstrings for all functions
- Inline comments for complex logic
- Architecture diagrams for system components
- API documentation for all endpoints
- Configuration guides for deployment

### Process Documentation
- Onboarding guides for new maintainers
- Troubleshooting procedures
- Deployment instructions
- Backup and recovery procedures
- Performance tuning guides

## Team Coordination

### Role Distribution
- Assign experts to specific modules based on strengths
- Establish clear escalation paths for issues
- Schedule regular knowledge sharing sessions
- Maintain updated contact information for team members
- Establish on-call rotations for critical issues

### Communication Protocols
- Use issue tracking systems for all work items
- Maintain detailed change logs
- Schedule regular system reviews
- Document all architectural decisions
- Share performance and usage metrics

## Success Metrics

### System Health
- API response times under 500ms
- System uptime above 99.5%
- Error rates below 0.1%
- Memory usage under 80% capacity
- Concurrent user support up to defined limits

### Educational Effectiveness
- User completion rates for scenarios
- Feedback scores for educational value
- Retention rates for return users
- Cognitive bias recognition improvements
- User engagement metrics

## Future Considerations

### Scaling Requirements
- Plan for increased user load
- Consider database migration from in-memory storage
- Implement advanced caching strategies
- Prepare for multi-instance deployment
- Evaluate microservice architecture options

### Feature Enhancements
- Advanced analytics and reporting
- Machine learning for personalized learning paths
- Multiplayer or collaborative scenarios
- Mobile app development
- Integration with educational platforms

## Conclusion

The Cognitive Trap Platform requires specialized expertise across multiple domains to maintain its effectiveness as an educational tool. By leveraging these expert skills, the platform can continue to provide valuable insights into cognitive biases while maintaining high performance and reliability. Each expert role contributes to the overall success of the platform, ensuring that users receive the best possible learning experience.