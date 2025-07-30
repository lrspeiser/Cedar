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
    console.log('🚀 App starting up, checking API key status...')
    checkApiKeyStatus()
  }, [])

  const checkApiKeyStatus = async () => {
    console.log('🔍 Checking API key status on app startup...')
    try {
      const status = await apiService.getApiKeyStatus()
      console.log('✅ API key status check result:', status ? 'API key found' : 'No API key found')
      
      setApiKeySet(status)
      if (!status) {
        console.log('📋 No API key found, showing setup screen')
        setShowApiKeySetup(true)
      } else {
        console.log('✅ API key found, showing main app')
        setShowApiKeySetup(false)
      }
    } catch (error) {
      console.error('❌ Error checking API key status:', error)
      console.log('📋 Error occurred, defaulting to setup screen')
      setApiKeySet(false)
      setShowApiKeySetup(true)
    }
  }

  const handleSetApiKey = async () => {
    if (!apiKey.trim()) {
      console.log('❌ API key is empty, not submitting')
      return
    }

    console.log('🚀 Starting API key submission...', {
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      isSettingApiKey,
      showApiKeySetup,
      apiKeySet
    })

    setIsSettingApiKey(true)
    try {
      console.log('📞 Calling apiService.setApiKey...')
      await apiService.setApiKey(apiKey)
      console.log('✅ API key set successfully in backend')

      // Update local state
      setApiKeySet(true)
      setShowApiKeySetup(false)
      setApiKey('')

      console.log('✅ Screen transition: API key setup hidden, main app visible')
      console.log('✅ Local state updated: apiKeySet=true, showApiKeySetup=false, apiKey=""')
    } catch (error) {
      console.error('❌ Error setting API key:', error)
      console.log('❌ Error details:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: error?.constructor?.name,
        errorStack: error instanceof Error ? error.stack : undefined
      })
      // Keep setup screen visible on error
      setApiKeySet(false)
      setShowApiKeySetup(true)
      console.log('❌ Screen transition: API key setup remains visible due to error')
    } finally {
      setIsSettingApiKey(false)
      console.log('🏁 API key submission process completed')
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
            <div className="mx-auto w-16 h-16 bg-cedar-500 rounded-full flex items-center justify-center mb-4">
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
                    console.log('🔑 Enter key pressed to submit API key')
                    handleSetApiKey()
                  }
                }}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            <button
              onClick={() => {
                console.log('🔘 Button clicked!', { apiKey: apiKey.substring(0, 10) + '...', isSettingApiKey })
                alert(`Button clicked! API key length: ${apiKey.length}, isSettingApiKey: ${isSettingApiKey}`)
                handleSetApiKey()
              }}
              disabled={!apiKey.trim() || isSettingApiKey}
              className="w-full bg-cedar-500 text-white py-3 px-6 rounded-md hover:bg-cedar-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg shadow-sm"
            >
              {isSettingApiKey ? 'Setting...' : 'Submit API Key'}
            </button>
            
            <div className="text-xs text-gray-500 text-center">
              <p>Your API key is stored locally and never sent to our servers.</p>
              <p>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-cedar-500 hover:underline">OpenAI Platform</a></p>
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
                <Brain className="w-6 h-6 text-cedar-500" />
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
                <div className="mx-auto w-16 h-16 bg-cedar-500 rounded-full flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Cedar</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Your AI-powered research assistant. Create a new session to start exploring data, 
                  running experiments, and generating insights.
                </p>
                <button
                  onClick={createNewSession}
                  className="bg-cedar-500 text-white px-6 py-3 rounded-lg hover:bg-cedar-600 transition-colors flex items-center space-x-2 mx-auto"
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
