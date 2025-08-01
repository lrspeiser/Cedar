import React from 'react'
import { Plus, Trash2, FileText, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react'
// import { ResearchSessionType } from '../App'
import { cn } from '../lib/utils'

interface ResearchSessionType {
  id: string;
  name: string;
  title: string;
  goal: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'executing' | 'planning';
  createdAt: string;
  updatedAt: string;
}

interface SidebarProps {
  sessions: ResearchSessionType[]
  currentSession: ResearchSessionType | null
  onSessionSelect: (session: ResearchSessionType) => void
  onCreateSession: () => void
  onDeleteSession: (sessionId: string) => void
  isOpen: boolean
  onToggle: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSession,
  onSessionSelect,
  onCreateSession,
  onDeleteSession,
  isOpen,
  onToggle
}) => {
  const getStatusIcon = (status: ResearchSessionType['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'executing':
        return <Play className="h-4 w-4 text-cedar-500 animate-pulse" />
      case 'planning':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (!isOpen) {
    return (
      <div className="fixed left-0 top-0 h-full w-16 bg-white border-r border-gray-200 z-10">
        <button
          onClick={onToggle}
          className="w-full h-16 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        >
          <FileText className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-10">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
            <button
              onClick={onToggle}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* New Session Button */}
        <div className="p-4">
          <button
            onClick={onCreateSession}
            className="w-full cedar-gradient text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Session</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sessions yet</p>
              <p className="text-xs">Create your first research session</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-colors",
                    currentSession?.id === session.id
                      ? "bg-cedar-50 border border-cedar-200"
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => onSessionSelect(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusIcon(session.status)}
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {session.title}
                        </h3>
                      </div>
                      {session.goal && (
                        <p className="text-xs text-gray-500 truncate">
                          {session.goal}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(new Date(session.updatedAt))}
                      </p>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSession(session.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sidebar 