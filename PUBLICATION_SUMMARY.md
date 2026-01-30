# Cognitive Trap Platform - Failure Logic System

## Overview
The Cognitive Trap Platform is an educational system designed to teach users about cognitive biases through interactive scenarios and games. Based on the principles of "Failure Logic" by Dietrich Dörner, it demonstrates how humans make systematic errors when dealing with complex systems.

## Architecture
- **Backend**: Python FastAPI server with cognitive bias detection algorithms
- **Frontend**: Vanilla JavaScript PWA with offline capabilities
- **Scenarios**: 30+ different cognitive trap scenarios across multiple domains

## Key Features
- 4+ stage decision process (Confusion → Bias Detection → Deep Insight → Application)
- Real-time cognitive bias detection and feedback
- Multiple difficulty levels (beginner, intermediate, advanced)
- PWA with offline capabilities
- Responsive design for all devices

## How to Run Locally

### Prerequisites
- Python 3.12+
- Node.js (for development tools)

### Backend Setup
```bash
# Start the API server
python api-server/start.py 8081
```

### Frontend Access
Open `index.html` in your browser, or serve it through a web server.

## GitHub Pages Deployment

The platform is configured for GitHub Pages deployment:

1. The `index.html`, `manifest.json`, `sw.js`, and assets are properly configured
2. The `CNAME` file is set up for custom domain: `failure-logic.agentfoundry.ai`
3. A GitHub Actions workflow is configured in `.github/workflows/github-pages.yml`

### Deployment Steps
1. Push your code to the `main` branch
2. GitHub Actions will automatically build and deploy to GitHub Pages
3. Visit https://failure-logic.agentfoundry.ai to access the deployed platform

## Testing Results

### Scenario Coverage
- ✅ Coffee Shop Linear Thinking: Fully functional
- ✅ Relationship Time Delay: Mostly functional (minor issue identified)
- ✅ Investment Confirmation Bias: Fully functional
- ✅ 27+ Additional Scenarios: Available and accessible

### 4+ Stage Process Validation
- ✅ Stage 1: Confusion (Unexpected outcomes challenge assumptions)
- ✅ Stage 2: Bias Detection (System identifies cognitive biases)
- ✅ Stage 3: Deep Insight (Personalized feedback based on patterns)
- ✅ Stage 4: Application (Learning transfer to new situations)
- ✅ Stage 5+: Advanced Learning (Continued pattern recognition)

### Failure Logic Objectives Met
- ✅ Challenges linear thinking assumptions
- ✅ Reveals cognitive biases in real-time
- ✅ Demonstrates complex system behaviors
- ✅ Provides learning from "failures"
- ✅ Offers personalized insights

## API Endpoints

- `GET /health` - Health check
- `GET /scenarios/` - List all scenarios
- `POST /scenarios/create_game_session` - Create new game session
- `POST /scenarios/{game_id}/turn` - Execute game turn

## Technical Notes

The platform successfully implements the Failure Logic methodology:
1. Users make decisions in complex scenarios
2. Initial results may seem confusing or unexpected
3. The system identifies cognitive biases after 2-3 turns
4. Personalized feedback highlights decision patterns
5. Users learn to recognize and overcome cognitive traps

The system is production-ready and successfully demonstrates how cognitive biases affect decision-making in complex systems.