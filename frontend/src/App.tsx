import React, { useState, useEffect } from 'react'
import { Brain, BookOpen, Code, FileText, Play, Save, Download, Key, Settings } from 'lucide-react'
import ResearchSession from './components/ResearchSession'
import Sidebar from './components/Sidebar'
import { cn } from './lib/utils'
import { apiService } from './api'

export interface Cell {
  id: string
  type: 'intent' | 'plan' | 'code' | 'output' | 'reference' | 'validation'
  content: string
  metadata?: any
  timestamp: Date
}

export interface ResearchSessionType {
  id: string
  title: string
  goal: string
  cells: Cell[]
  status: 'idle' | 'planning' | 'executing' | 'completed' | 'error'
  createdAt: Date
  updatedAt: Date
}

function App() {
  const [sessions, setSessions] = useState<ResearchSessionType[]>([])
  const [currentSession, setCurrentSession] = useState<ResearchSessionType | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [apiKeySet, setApiKeySet] = useState<boolean | null>(null)
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isSettingApiKey, setIsSettingApiKey] = useState(false)

  // Check API key status on app load
  useEffect(() => {
    checkApiKeyStatus()
  }, [])

  const checkApiKeyStatus = async () => {
    try {
      const status = await apiService.getApiKeyStatus()
      setApiKeySet(status)
      if (!status) {
        setShowApiKeySetup(true)
      }
    } catch (error) {
      console.error('Error checking API key status:', error)
      setApiKeySet(false)
      setShowApiKeySetup(true)
    }
  }

  const handleSetApiKey = async () => {
    if (!apiKey.trim()) return
    
    setIsSettingApiKey(true)
    try {
      await apiService.setApiKey(apiKey)
      setApiKeySet(true)
      setShowApiKeySetup(false)
      setApiKey('')
    } catch (error) {
      console.error('Error setting API key:', error)
      alert('Failed to set API key. Please try again.')
    } finally {
      setIsSettingApiKey(false)
    }
  }

  const createNewSession = () => {
    const newSession: ResearchSessionType = {
      id: Date.now().toString(),
      title: 'New Research Session',
      goal: '',
      cells: [],
      status: 'idle',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setSessions(prev => [...prev, newSession])
    setCurrentSession(newSession)
  }

  const updateSession = (sessionId: string, updates: Partial<ResearchSessionType>) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, ...updates, updatedAt: new Date() }
        : session
    ))
    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null)
    }
  }

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId))
    if (currentSession?.id === sessionId) {
      setCurrentSession(null)
    }
  }

  // API Key Setup Screen
  if (showApiKeySetup) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-cedar-blue rounded-full flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Cedar</h1>
            <p className="text-gray-600">Set up your OpenAI API key to get started</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && apiKey.trim() && !isSettingApiKey) {
                    handleSetApiKey()
                  }
                }}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-blue focus:border-transparent"
                autoFocus
              />
            </div>
            
            <button
              onClick={handleSetApiKey}
              disabled={!apiKey.trim() || isSettingApiKey}
              className="w-full bg-cedar-blue text-white py-2 px-4 rounded-md hover:bg-cedar-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSettingApiKey ? 'Setting...' : 'Set API Key'}
            </button>
            
            <div className="text-xs text-gray-500 text-center">
              <p>Your API key is stored locally and never sent to our servers.</p>
              <p>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-cedar-blue hover:underline">OpenAI Platform</a></p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        currentSession={currentSession}
        onSessionSelect={setCurrentSession}
        onCreateSession={createNewSession}
        onDeleteSession={deleteSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-0"
      )}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Brain className="w-6 h-6 text-cedar-blue" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Cedar Research Assistant</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowApiKeySetup(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              
              {apiKeySet && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>API Key Set</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {currentSession ? (
            <ResearchSession
              session={currentSession}
              onUpdate={(updates) => updateSession(currentSession.id, updates)}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-cedar-blue rounded-full flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Cedar</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Your AI-powered research assistant. Create a new session to start exploring data, 
                  running experiments, and generating insights.
                </p>
                <button
                  onClick={createNewSession}
                  className="bg-cedar-blue text-white px-6 py-3 rounded-lg hover:bg-cedar-blue-dark transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Play className="w-5 h-5" />
                  <span>Start New Research Session</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
