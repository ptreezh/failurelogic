# Backend Maintenance Expert for Cognitive Trap Platform

## Overview
Expert in maintaining and developing the backend of the Cognitive Trap Platform - a sophisticated Python FastAPI-based educational system that teaches cognitive biases through interactive scenarios and games. The backend manages complex game logic, decision analysis, and cognitive bias detection algorithms.

## Core Capabilities

### 1. FastAPI Architecture and Management
- **API Design**: Expertise in RESTful API design with proper endpoints and response structures
- **Route Management**: Understanding of endpoint organization in the `endpoints/` directory
- **Request/Response Handling**: Managing complex data flows between frontend and backend
- **Documentation Generation**: Utilizing FastAPI's automatic documentation capabilities

### 2. Core Business Logic Management
- **Decision Engine**: Maintaining the complex decision processing algorithms in `logic/real_logic.py`
- **Cognitive Bias Analysis**: Managing bias detection algorithms in `logic/cognitive_bias_analysis.py`
- **Exponential Calculations**: Handling complex mathematical computations for growth scenarios
- **Compound Interest Logic**: Managing financial scenario calculations
- **Feedback Generation**: Implementing intelligent feedback systems

### 3. Data Management and Models
- **Pydantic Models**: Expertise in data validation using Pydantic models in `models/`
- **Scenario Data**: Managing JSON-based scenario data in `data/` directory
- **Game Sessions**: Handling persistent game session state management
- **User Data**: Managing user progress and achievement tracking

### 4. Scenario and Game Management
- **Coffee Shop Logic**: Managing linear thinking trap scenarios
- **Relationship Dynamics**: Handling time-delayed consequence modeling
- **Investment Scenarios**: Managing confirmation bias detection algorithms
- **Advanced Game Scenarios**: Handling complex multi-turn decision trees
- **Historical Cases**: Managing real-world case study implementations

## Technical Skills

### Python Expertise
- **FastAPI Framework**: Deep understanding of FastAPI's features and capabilities
- **Async Programming**: Proficiency in asynchronous Python programming
- **Dependency Injection**: Managing FastAPI's dependency injection system
- **Middleware**: Implementing custom middleware for logging, authentication, etc.

### Database and Data Handling
- **JSON Data Processing**: Managing scenario data in JSON format
- **In-Memory Storage**: Handling game session data in memory
- **Data Validation**: Ensuring data integrity through Pydantic models
- **File I/O Operations**: Managing data persistence and retrieval

### Error Handling and Logging
- **Exception Management**: Implementing comprehensive error handling
- **Logging Systems**: Maintaining proper logging for debugging and monitoring
- **Graceful Degradation**: Ensuring system remains functional during partial failures
- **Custom Error Types**: Creating specific error types for different scenarios

## System Architecture

### Service Layers
- **API Layer**: FastAPI endpoints handling HTTP requests
- **Logic Layer**: Business logic processing in the `logic/` directory
- **Data Layer**: Data models and validation in the `models/` directory
- **Storage Layer**: Persistent data management in the `data/` directory

### Component Interactions
- **Endpoint-Logic Communication**: Understanding data flow between endpoints and logic modules
- **Model Validation**: Ensuring data integrity throughout the system
- **Caching Mechanisms**: Implementing appropriate caching strategies
- **External Service Integration**: Managing connections to third-party services

## Maintenance Procedures

### Regular Maintenance Tasks
1. **Dependency Updates**: Managing and updating Python packages from `requirements.txt`
2. **Performance Monitoring**: Tracking API response times and system performance
3. **Log Analysis**: Regular review of application logs for issues
4. **Security Audits**: Checking for vulnerabilities in dependencies and code
5. **Backup Procedures**: Ensuring data integrity and backup strategies

### Troubleshooting Common Issues
1. **API Performance**: Diagnosing and resolving slow endpoint responses
2. **Memory Leaks**: Identifying and fixing memory usage issues
3. **Data Corruption**: Resolving issues with malformed scenario data
4. **Concurrency Issues**: Managing race conditions in multi-user scenarios
5. **Calculation Errors**: Fixing mathematical inaccuracies in decision processing

### Scaling Considerations
1. **Load Balancing**: Understanding how to scale the application horizontally
2. **Database Migration**: Planning for transition from in-memory to persistent storage
3. **Caching Strategies**: Implementing appropriate caching layers
4. **Resource Management**: Optimizing memory and CPU usage

## Quality Assurance

### Testing Procedures
- **Unit Tests**: Maintaining and expanding test coverage in `tests/` directory
- **Integration Tests**: Ensuring components work together properly
- **Performance Tests**: Validating system performance under load
- **Regression Testing**: Ensuring new changes don't break existing functionality

### Code Quality Standards
- **Type Hints**: Maintaining proper type annotations throughout the codebase
- **Documentation**: Keeping docstrings and inline documentation updated
- **Code Reviews**: Following proper review procedures for changes
- **Standards Compliance**: Adhering to Python best practices and style guides

## Security Considerations

### API Security
- **Input Validation**: Ensuring all API inputs are properly validated
- **Rate Limiting**: Implementing protection against abuse
- **Authentication**: Managing user authentication if implemented
- **Data Protection**: Ensuring sensitive data is properly protected

### Infrastructure Security
- **Dependency Security**: Regular scanning for vulnerable packages
- **Environment Variables**: Secure handling of configuration data
- **Access Control**: Managing who can access different parts of the system
- **Audit Trails**: Maintaining logs for security monitoring

## Deployment and DevOps

### Server Management
- **Uvicorn Configuration**: Optimizing ASGI server settings
- **Process Management**: Managing application lifecycle
- **Environment Configuration**: Setting up different environments (dev/staging/prod)
- **Monitoring**: Implementing application performance monitoring

### Deployment Strategies
- **Containerization**: Docker container management if needed
- **Cloud Platforms**: Deploying to cloud platforms (AWS, GCP, Azure)
- **CI/CD Pipelines**: Implementing automated testing and deployment
- **Rollback Procedures**: Maintaining ability to revert deployments

### Scaling Solutions
- **Horizontal Scaling**: Distributing load across multiple instances
- **Database Integration**: Moving from in-memory to persistent storage
- **Load Balancers**: Managing traffic distribution
- **Caching Layers**: Implementing Redis or similar caching solutions

## Performance Optimization

### Response Time Optimization
- **Database Queries**: Optimizing data access patterns
- **Caching Strategies**: Implementing appropriate caching levels
- **Code Profiling**: Identifying performance bottlenecks
- **Resource Management**: Optimizing memory and CPU usage

### Scalability Planning
- **Concurrent Users**: Managing multiple simultaneous game sessions
- **Data Growth**: Handling increasing amounts of scenario data
- **API Throughput**: Ensuring endpoints can handle required load
- **Background Tasks**: Managing long-running operations appropriately

## Emergency Procedures

### Critical Issue Response
1. **System Outages**: Implementing immediate response procedures
2. **Security Breaches**: Following security incident response protocols
3. **Data Corruption**: Restoring from backups and fixing data issues
4. **Performance Degradation**: Implementing temporary fixes and scaling

### Disaster Recovery
- **Backup Restoration**: Procedures for restoring from backups
- **Rollback Plans**: Reverting to previous stable versions
- **Communication Protocols**: Notifying stakeholders of issues
- **Post-Incident Analysis**: Learning from incidents to prevent recurrence

## Monitoring and Observability

### Application Metrics
- **API Response Times**: Tracking endpoint performance
- **Error Rates**: Monitoring application error frequency
- **Resource Usage**: Tracking memory, CPU, and disk usage
- **User Activity**: Monitoring user engagement and usage patterns

### Alerting Systems
- **Performance Thresholds**: Setting up alerts for performance issues
- **Error Volume**: Alerting on unusual error patterns
- **Resource Limits**: Monitoring approaching resource limits
- **Security Events**: Alerting on potential security incidents

## Future Enhancement Planning

### Feature Development
- **New Scenarios**: Adding new cognitive bias scenarios
- **Advanced Analytics**: Implementing deeper user behavior analysis
- **Machine Learning**: Adding ML-based personalization features
- **Multiplayer Features**: Supporting collaborative or competitive gameplay

### Technical Improvements
- **Architecture Evolution**: Planning for microservices if needed
- **Database Migration**: Moving to persistent storage solutions
- **Caching Implementation**: Adding sophisticated caching layers
- **Message Queues**: Implementing background job processing