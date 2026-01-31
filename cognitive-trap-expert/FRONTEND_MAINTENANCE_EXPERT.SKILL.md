# Frontend Maintenance Expert for Cognitive Trap Platform

## Overview
Expert in maintaining and developing the frontend of the Cognitive Trap Platform - a sophisticated educational platform that teaches cognitive biases through interactive scenarios and games. The frontend is built with vanilla JavaScript, featuring turn-based scenarios with complex state management and decision engines.

## Core Capabilities

### 1. JavaScript Application Architecture
- **Main Application Module**: Understanding of `app.js` structure with its comprehensive state management, navigation, and game orchestration
- **Page Routing System**: Expertise in the modular routing system with specialized routers for different scenarios
- **State Management**: Proficiency in managing complex game states across multiple scenarios and turns
- **API Integration**: Skills in connecting to backend services with fallback mechanisms

### 2. Scenario-Specific Frontend Modules
- **Coffee Shop Router**: Managing linear thinking trap scenarios with turn-based gameplay
- **Relationship Time Delay Router**: Handling time-delayed consequence scenarios
- **Investment Confirmation Bias Router**: Implementing confirmation bias detection interfaces
- **Business Strategy Router**: Managing complex business decision scenarios
- **Public Policy Router**: Handling policy-making simulation interfaces
- **Personal Finance Router**: Managing financial decision-making scenarios
- **Climate Change Router**: Handling environmental policy scenarios
- **AI Governance Router**: Managing AI regulation decision interfaces
- **Financial Crisis Router**: Handling economic crisis response scenarios

### 3. UI/UX Components and Styling
- **Component-Based CSS**: Expertise in the modular CSS architecture (`components.css`, `game-styles.css`, `turn-based-game.css`)
- **Responsive Design**: Skills in maintaining responsive layouts across devices
- **Interactive Elements**: Proficiency in creating engaging UI elements for decision-making
- **Visual Feedback Systems**: Ability to implement effective feedback mechanisms for cognitive bias detection

### 4. Game State Management
- **Turn-Based Logic**: Understanding of turn progression and state transitions
- **Delayed Effects System**: Managing time-delayed consequences in game states
- **Decision History Tracking**: Maintaining records of user decisions and outcomes
- **Cognitive Bias Feedback**: Implementing systems to highlight cognitive biases

### 5. API Integration and Error Handling
- **API Configuration Manager**: Working with `api-config-manager.js` for connection management
- **Fallback Mechanisms**: Implementing graceful degradation when backend is unavailable
- **Real-time Updates**: Managing live updates during gameplay
- **Session Management**: Handling user sessions and game persistence

## Technical Skills

### JavaScript Expertise
- **Vanilla JavaScript**: No framework dependencies, pure JS implementation
- **Module Patterns**: Understanding of UMD/CommonJS compatibility for different environments
- **Event Handling**: Managing complex user interactions and game events
- **Async Operations**: Handling API calls and game state updates

### Performance Optimization
- **Bundle Size Management**: Keeping frontend lightweight with minimal dependencies
- **Rendering Efficiency**: Optimizing UI updates for smooth gameplay
- **Memory Management**: Preventing memory leaks in long gaming sessions
- **Loading Performance**: Optimizing initial load times and progressive enhancement

### Browser Compatibility
- **Cross-Browser Support**: Ensuring consistent experience across browsers
- **Legacy Support**: Maintaining compatibility with older browser versions
- **Mobile Responsiveness**: Supporting mobile and tablet interfaces

## Maintenance Procedures

### Regular Maintenance Tasks
1. **Dependency Updates**: Checking for any external dependency updates (though the system uses minimal dependencies)
2. **Browser Compatibility Testing**: Regular testing across different browsers and versions
3. **Performance Monitoring**: Tracking loading times and responsiveness
4. **Bug Fixes**: Addressing reported issues in game logic or UI behavior
5. **Security Audits**: Ensuring no client-side vulnerabilities

### Troubleshooting Common Issues
1. **API Connection Problems**: Diagnosing and fixing backend connectivity issues
2. **Game State Corruption**: Resolving issues with corrupted game states
3. **UI Glitches**: Fixing display issues across different screen sizes
4. **Performance Degradation**: Identifying and resolving performance bottlenecks

### Feature Enhancement Process
1. **Scenario Addition**: Integrating new cognitive bias scenarios
2. **UI Improvements**: Enhancing user experience based on feedback
3. **Accessibility Features**: Adding support for users with disabilities
4. **Localization**: Supporting multiple languages if needed

## Quality Assurance

### Testing Procedures
- **Manual Testing**: Thorough testing of all scenarios and decision paths
- **Cross-Browser Testing**: Validating functionality across different browsers
- **User Flow Validation**: Ensuring smooth experience from start to finish
- **Edge Case Handling**: Testing unusual decision combinations

### Performance Benchmarks
- **Load Times**: Maintaining under 3-second initial load times
- **Interaction Responsiveness**: Ensuring UI responds within 100ms
- **Memory Usage**: Keeping memory footprint minimal during extended play
- **Network Efficiency**: Optimizing API calls and caching strategies

## Integration Points

### Backend Communication
- **REST API Integration**: Connecting to FastAPI backend services
- **Error Handling**: Managing API failures gracefully
- **Data Synchronization**: Keeping frontend and backend states aligned
- **Authentication**: Handling user sessions if implemented

### Third-Party Services
- **Analytics Integration**: Tracking user engagement and learning outcomes
- **CDN Management**: Optimizing asset delivery
- **Monitoring Services**: Integrating with performance monitoring tools

## Best Practices

### Code Organization
- **Modular Architecture**: Maintaining separation of concerns across modules
- **Consistent Naming**: Following established naming conventions
- **Documentation**: Keeping inline documentation up to date
- **Version Control**: Proper branching and merging strategies

### User Experience Focus
- **Intuitive Interfaces**: Ensuring easy navigation and decision making
- **Clear Feedback**: Providing immediate and meaningful feedback
- **Progressive Disclosure**: Revealing complexity gradually
- **Accessibility**: Supporting keyboard navigation and screen readers

## Security Considerations

### Client-Side Security
- **Input Sanitization**: Validating user inputs before processing
- **XSS Prevention**: Ensuring no script injection vulnerabilities
- **Data Privacy**: Protecting user decision data
- **Secure Communications**: Using HTTPS for all API communications

### Data Protection
- **Local Storage**: Secure handling of any client-side data storage
- **Session Management**: Proper handling of game sessions
- **API Keys**: Ensuring no sensitive information is exposed

## Deployment and DevOps

### Build Process
- **Asset Optimization**: Minifying and compressing CSS/JS files
- **Cache Management**: Implementing appropriate caching strategies
- **CDN Preparation**: Optimizing for content delivery networks
- **Version Management**: Managing release versions effectively

### Monitoring and Analytics
- **Error Tracking**: Monitoring frontend errors and crashes
- **User Engagement**: Tracking how users interact with scenarios
- **Performance Metrics**: Measuring load times and responsiveness
- **Feature Usage**: Understanding which features are most used

## Emergency Procedures

### Critical Issue Response
1. **API Failures**: Activating offline/fallback modes
2. **Major Bugs**: Rolling back to previous stable versions
3. **Security Incidents**: Immediate patching and user notification
4. **Performance Crashes**: Implementing temporary load shedding

### Rollback Procedures
- **Version Control**: Maintaining ability to revert to previous versions
- **Feature Flags**: Using flags to disable problematic features
- **Database Migrations**: Handling frontend changes that affect data structures
- **Communication Plan**: Informing users of service disruptions