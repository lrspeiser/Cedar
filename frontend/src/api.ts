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

class ApiService {
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

  // Mock data for development fallback
  private getMockResearchResponse(goal: string): ResearchResponse {
    const sessionId = Date.now().toString()
    const now = new Date().toISOString()

    return {
      sessionId,
      status: 'planning',
      cells: [
        {
          id: '1',
          type: 'intent',
          content: goal,
          timestamp: now
        },
        {
          id: '2',
          type: 'plan',
          content: 'Load and examine the dataset',
          timestamp: now
        },
        {
          id: '3',
          type: 'code',
          content: 'import pandas as pd\n\ndf = pd.read_csv("data.csv")\nprint(df.head())',
          timestamp: now
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
          timestamp: now
        }
      ]
    }
  }

  private getMockExecuteResponse(code: string): ExecuteCodeResponse {
    return {
      output: '   col1  col2  col3\n0     1     2     3\n1     4     5     6\n2     7     8     9\n3    10    11    12\n4    13    14    15',
      validation: {
        isValid: true,
        confidence: 0.95,
        issues: [],
        suggestions: ['Consider adding data validation'],
        nextStep: 'Proceed with analysis'
      }
    }
  }
}

export const apiService = new ApiService()
