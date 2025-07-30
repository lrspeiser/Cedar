import React, { useState } from 'react'
import { Brain, BookOpen, Code, FileText, Play, Save, Download } from 'lucide-react'
import ResearchSession from './components/ResearchSession'
import Sidebar from './components/Sidebar'
import { cn } from './lib/utils'

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
            <div className="flex items-center space-x-3">
              <div className="cedar-gradient p-2 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Cedar</h1>
                <p className="text-sm text-gray-500">AI Research Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BookOpen className="h-5 w-5" />
              </button>
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
                <div className="cedar-gradient p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome to Cedar
                </h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Start a new research session to begin exploring data with AI assistance.
                </p>
                <button
                  onClick={createNewSession}
                  className="cedar-gradient text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center space-x-2 mx-auto"
                >
                  <Play className="h-4 w-4" />
                  <span>Start New Session</span>
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
