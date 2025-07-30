// API service for communicating with the Tauri backend

import { invoke } from '@tauri-apps/api/tauri'

export interface ResearchRequest {
  goal: string
  sessionId?: string
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
  sessionId: string
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
      await invoke('set_api_key', { request: { apiKey } })
    } catch (error) {
      console.error('Error setting API key:', error)
      throw error
    }
  }

  async getApiKeyStatus(): Promise<boolean> {
    try {
      const response = await invoke('get_api_key_status')
      return response as boolean
    } catch (error) {
      console.error('Error getting API key status:', error)
      throw error
    }
  }

  async startResearch(request: ResearchRequest): Promise<ResearchResponse> {
    try {
      const response = await invoke('start_research', { request })
      return response as ResearchResponse
    } catch (error) {
      console.error('Error starting research:', error)
      // Fallback to mock data if Tauri command fails
      return this.getMockResearchResponse(request.goal)
    }
  }

  async executeCode(request: ExecuteCodeRequest): Promise<ExecuteCodeResponse> {
    try {
      const response = await invoke('execute_code', { request })
      return response as ExecuteCodeResponse
    } catch (error) {
      console.error('Error executing code:', error)
      // Fallback to mock data if Tauri command fails
      return this.getMockExecuteResponse(request.code)
    }
  }

  async saveSession(sessionId: string, data: any): Promise<void> {
    try {
      await invoke('save_session', { sessionId, data })
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
        }
      ]
    }
  }

  private getMockExecuteResponse(code: string): ExecuteCodeResponse {
    return {
      output: `Mock output for: ${code}`,
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
