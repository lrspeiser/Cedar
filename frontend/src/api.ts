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
      
      await invoke('set_api_key', { request: { api_key: apiKey } })
      
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
      const response = await invoke('start_research', { request })
      return response as ResearchResponse
    } catch (error) {
      console.error('Error starting research:', error)
      throw error
    }
  }

  async executeCode(request: ExecuteCodeRequest): Promise<ExecuteCodeResponse> {
    try {
      const response = await invoke('execute_code', { request })
      return response as ExecuteCodeResponse
    } catch (error) {
      console.error('Error executing code:', error)
      throw error
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
}

export const apiService = new ApiService()
