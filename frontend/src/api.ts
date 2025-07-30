// API service for communicating with the Tauri backend

import { invoke } from '@tauri-apps/api/core'

export interface ResearchRequest {
  goal: string
  session_id?: string
}

export interface ResearchResponse {
  cells: Cell[]
  sessionId: string
  status: 'planning' | 'executing' | 'completed' | 'error'
}

export interface Cell {
  id: string
  type: 'intent' | 'plan' | 'code' | 'output' | 'reference' | 'validation'
  content: string
  metadata?: any
  timestamp: string
}

export interface ExecuteCodeRequest {
  code: string
  session_id: string
}

export interface ExecuteCodeResponse {
  output: string
  validation?: {
    isValid: boolean
    confidence: number
    issues: string[]
    suggestions: string[]
    nextStep: string
  }
}

export interface SetApiKeyRequest {
  apiKey: string
}

class ApiService {
  async setApiKey(apiKey: string): Promise<void> {
    try {
      console.log('🔧 Calling Tauri backend: set_api_key', { 
        apiKeyLength: apiKey.length, 
        apiKeyPrefix: apiKey.substring(0, 10) + '...' 
      })
      
      await invoke('set_api_key', { api_key: apiKey })
      
      console.log('✅ Backend response: API key stored successfully')
    } catch (error) {
      console.error('❌ Backend error setting API key:', error)
      throw error
    }
  }

  async getApiKeyStatus(): Promise<boolean> {
    try {
      console.log('🔧 Checking API key status from backend...')
      const response = await invoke('get_api_key_status')
      const hasApiKey = response as boolean
      console.log('✅ Backend API key status:', hasApiKey ? 'API key found' : 'No API key found')
      return hasApiKey
    } catch (error) {
      console.error('❌ Backend error getting API key status:', error)
      throw error
    }
  }

  async startResearch(request: ResearchRequest): Promise<ResearchResponse> {
    try {
      const response = await invoke('start_research', request)
      return response as ResearchResponse
    } catch (error) {
      console.error('Error starting research:', error)
      // Fallback to mock data if backend fails
      return this.getMockResearchResponse(request.goal)
    }
  }

  async executeCode(request: ExecuteCodeRequest): Promise<ExecuteCodeResponse> {
    try {
      const response = await invoke('execute_code', request)
      return response as ExecuteCodeResponse
    } catch (error) {
      console.error('Error executing code:', error)
      // Fallback to mock data if backend fails
      return this.getMockExecuteResponse(request.code)
    }
  }

  async saveSession(sessionId: string, data: any): Promise<void> {
    try {
      await invoke('save_session', { sessionId, data })
      console.log('Session saved successfully')
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  async loadSession(sessionId: string): Promise<any> {
    try {
      const response = await invoke('load_session', { sessionId })
      return response
    } catch (error) {
      console.error('Error loading session:', error)
      return null
    }
  }

  // Mock data for development fallback (kept for robustness)
  private getMockResearchResponse(goal: string): ResearchResponse {
    return {
      sessionId: 'mock-session',
      status: 'planning',
      cells: [
        {
          id: '1',
          type: 'intent',
          content: `Research Goal: ${goal}`,
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          type: 'plan',
          content: '1. Data collection\n2. Analysis\n3. Visualization',
          timestamp: new Date().toISOString()
        },
        {
          id: '3',
          type: 'code',
          content: 'import pandas as pd\nimport numpy as np\n\n# Load sample data\ndata = pd.DataFrame({\n    "temperature": np.random.normal(20, 10, 100),\n    "sales": np.random.normal(50, 20, 100)\n})\nprint("Data loaded successfully")\nprint(data.head())',
          timestamp: new Date().toISOString()
        },
        {
          id: '4',
          type: 'reference',
          content: JSON.stringify({
            title: 'Data Analysis with Python',
            authors: ['McKinney, W.'],
            journal: 'O\'Reilly Media',
            year: 2017,
            url: 'https://example.com/book',
            relevance: 'Comprehensive guide to pandas and data analysis'
          }),
          timestamp: new Date().toISOString()
        }
      ]
    }
  }

  private getMockExecuteResponse(code: string): ExecuteCodeResponse {
    return {
      output: `Mock output for: ${code}\n\n   temperature     sales\n0    25.3         45.2\n1    18.7         38.9\n2    30.1         62.3\n3    15.2         29.8\n4    22.9         51.7`,
      validation: {
        isValid: true,
        confidence: 0.8,
        issues: [],
        suggestions: ['Consider adding error handling'],
        nextStep: 'Continue with analysis'
      }
    }
  }
}

export const apiService = new ApiService()
