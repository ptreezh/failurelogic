// API Fallback Configuration for Failure Logic Platform
// This file provides fallback API endpoints and error handling for when the primary API is unavailable

class APIFallbackManager {
    constructor() {
        this.primaryEndpoint = 'http://localhost:8081'; // Default local development
        this.fallbackEndpoints = [
            'https://turbo-rotary-phone-pq4jq7pvr7f6jxx-8000.app.github.dev', // GitHub Codespaces
            'https://failurelogic-api.vercel.app' // Vercel deployment
        ];
        
        this.currentEndpoint = this.primaryEndpoint;
        this.endpointIndex = 0;
        
        // Initialize with the first available endpoint
        this.initializeEndpoint();
    }
    
    async initializeEndpoint() {
        // Check if primary endpoint is available
        if (await this.isEndpointAvailable(this.primaryEndpoint)) {
            this.currentEndpoint = this.primaryEndpoint;
        } else {
            // Find first available fallback endpoint
            for (const endpoint of this.fallbackEndpoints) {
                if (await this.isEndpointAvailable(endpoint)) {
                    this.currentEndpoint = endpoint;
                    break;
                }
            }
        }
        console.log(`Using API endpoint: ${this.currentEndpoint}`);
    }
    
    async isEndpointAvailable(endpoint) {
        try {
            const response = await fetch(`${endpoint}/health`, {
                method: 'GET',
                mode: 'cors',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.warn(`Endpoint not available: ${endpoint}`, error);
            return false;
        }
    }
    
    async makeRequest(path, options = {}) {
        // Try current endpoint first
        try {
            const response = await fetch(`${this.currentEndpoint}${path}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                mode: 'cors'
            });
            
            if (response.ok) {
                return response;
            } else {
                throw new Error(`API error: ${response.status}`);
            }
        } catch (error) {
            console.warn(`Request failed to ${this.currentEndpoint}:`, error);
            
            // Try fallback endpoints
            for (const endpoint of this.fallbackEndpoints) {
                if (endpoint !== this.currentEndpoint) {
                    try {
                        console.log(`Trying fallback endpoint: ${endpoint}`);
                        const response = await fetch(`${endpoint}${path}`, {
                            ...options,
                            headers: {
                                'Content-Type': 'application/json',
                                ...options.headers
                            },
                            mode: 'cors'
                        });
                        
                        if (response.ok) {
                            this.currentEndpoint = endpoint; // Update current endpoint
                            console.log(`Switched to endpoint: ${endpoint}`);
                            return response;
                        }
                    } catch (fallbackError) {
                        console.warn(`Fallback endpoint failed: ${endpoint}`, fallbackError);
                    }
                }
            }
            
            // If all endpoints fail, return mock data
            console.warn('All API endpoints failed, returning mock data');
            return this.getMockResponse(path, options);
        }
    }
    
    getMockResponse(path, options) {
        // Create a mock response object for development/testing purposes
        const mockData = {
            '/health': {
                message: "认知陷阱平台API服务正常运行 (Mock)",
                status: "healthy",
                timestamp: new Date().toISOString(),
                version: "1.0.0",
            },
            '/scenarios/': {
                scenarios: [
                    {
                        id: "coffee-shop-linear-thinking",
                        name: "咖啡店线性思维",
                        description: "线性思维陷阱场景 (Mock)",
                        fullDescription: "在这个场景中，您将管理一家咖啡店，体验线性思维在复杂商业环境中的局限性。(Mock)",
                        difficulty: "beginner",
                        estimatedDuration: 15,
                        targetBiases: ["linear_thinking"],
                        cognitiveBias: "线性思维",
                        duration: "15-20分钟",
                        category: "商业决策",
                        thumbnail: "/assets/images/coffee-shop.jpg",
                        advancedChallenges: []
                    },
                    {
                        id: "relationship-time-delay",
                        name: "恋爱关系时间延迟",
                        description: "时间延迟偏差场景 (Mock)",
                        fullDescription: "在恋爱关系中体验时间延迟对决策的影响。(Mock)",
                        difficulty: "intermediate",
                        estimatedDuration: 20,
                        targetBiases: ["time_delay_bias"],
                        cognitiveBias: "时间延迟",
                        duration: "20-25分钟",
                        category: "人际关系",
                        thumbnail: "/assets/images/relationship.jpg",
                        advancedChallenges: []
                    }
                ]
            }
        };
        
        const data = mockData[path] || { error: "Mock API endpoint not implemented", path, method: options.method || 'GET' };
        
        return {
            ok: true,
            status: 200,
            json: () => Promise.resolve(data),
            text: () => Promise.resolve(JSON.stringify(data))
        };
    }
    
    getCurrentEndpoint() {
        return this.currentEndpoint;
    }
}

// Export the API manager for use in other modules
window.APIFallbackManager = APIFallbackManager;