import React, { useState, useRef, useEffect } from 'react'
import { Send, Play, Save, Download, BookOpen, Code, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { Cell, ResearchSessionType } from '../App'
import CellComponent from './CellComponent'
import ReferencePanel from './ReferencePanel'
import { cn } from '../lib/utils'
import { apiService } from '../api'

interface ResearchSessionProps {
  session: ResearchSessionType
  onUpdate: (updates: Partial<ResearchSessionType>) => void
}

const ResearchSession: React.FC<ResearchSessionProps> = ({ session, onUpdate }) => {
  const [goal, setGoal] = useState(session.goal)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showReferences, setShowReferences] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [session.cells])

  const handleSubmitGoal = async () => {
    if (!goal.trim()) return

    onUpdate({ goal, status: 'planning' })
    
    // Add intent cell
    const intentCell: Cell = {
      id: Date.now().toString(),
      type: 'intent',
      content: goal,
      timestamp: new Date()
    }
    
    onUpdate({
      cells: [...session.cells, intentCell],
      status: 'planning'
    })

    // Call the real API service
    setIsExecuting(true)
    
    try {
      const response = await apiService.startResearch({
        goal: goal,
        sessionId: session.id
      })
      
      // Convert API response cells to our format
      const apiCells: Cell[] = response.cells.map(apiCell => ({
        id: apiCell.id,
        type: apiCell.type as any,
        content: apiCell.content,
        timestamp: new Date(apiCell.timestamp)
      }))
      
      onUpdate({
        cells: [...session.cells, intentCell, ...apiCells],
        status: response.status as any
      })
    } catch (error) {
      console.error('Error starting research:', error)
      // Fallback to mock data if API fails
      const planCells: Cell[] = [
        {
          id: (Date.now() + 1).toString(),
          type: 'plan',
          content: 'Load and examine the dataset',
          timestamp: new Date()
        },
        {
          id: (Date.now() + 2).toString(),
          type: 'code',
          content: 'import pandas as pd\n\ndf = pd.read_csv("data.csv")\nprint(df.head())',
          timestamp: new Date()
        },
        {
          id: (Date.now() + 3).toString(),
          type: 'plan',
          content: 'Analyze the data and identify patterns',
          timestamp: new Date()
        }
      ]
      
      onUpdate({
        cells: [...session.cells, intentCell, ...planCells],
        status: 'executing'
      })
    }
    
    setIsExecuting(false)
  }

  const executeCode = async (cellId: string) => {
    const cell = session.cells.find(c => c.id === cellId)
    if (!cell || cell.type !== 'code') return

    setIsExecuting(true)
    
    try {
      const response = await apiService.executeCode({
        code: cell.content,
        sessionId: session.id
      })
      
      // Add output cell
      const outputCell: Cell = {
        id: Date.now().toString(),
        type: 'output',
        content: response.output,
        timestamp: new Date()
      }
      
      // Add validation cell if validation data exists
      const newCells: Cell[] = [outputCell]
      
      if (response.validation) {
        const validationCell: Cell = {
          id: (Date.now() + 1).toString(),
          type: 'validation',
          content: JSON.stringify(response.validation),
          timestamp: new Date()
        }
        newCells.push(validationCell)
      }
      
      onUpdate({
        cells: [...session.cells, ...newCells]
      })
    } catch (error) {
      console.error('Error executing code:', error)
      // Fallback to mock output
      const outputCell: Cell = {
        id: Date.now().toString(),
        type: 'output',
        content: '   col1  col2  col3\n0     1     2     3\n1     4     5     6\n2     7     8     9\n3    10    11    12\n4    13    14    15',
        timestamp: new Date()
      }
      
      const validationCell: Cell = {
        id: (Date.now() + 1).toString(),
        type: 'validation',
        content: JSON.stringify({
          isValid: true,
          confidence: 0.95,
          issues: [],
          suggestions: ['Consider adding data validation'],
          nextStep: 'Proceed with analysis'
        }),
        timestamp: new Date()
      }
      
      onUpdate({
        cells: [...session.cells, outputCell, validationCell]
      })
    }
    
    setIsExecuting(false)
  }

  const addReference = () => {
    const referenceCell: Cell = {
      id: Date.now().toString(),
      type: 'reference',
      content: JSON.stringify({
        title: 'Sample Research Paper',
        authors: ['Smith, J.', 'Johnson, A.'],
        journal: 'Journal of Data Science',
        year: 2023,
        url: 'https://example.com/paper',
        relevance: 'Provides methodology for data analysis'
      }),
      timestamp: new Date()
    }
    
    onUpdate({
      cells: [...session.cells, referenceCell]
    })
  }

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Goal Input */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-3">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What would you like to research? (e.g., 'Find the top 3 product categories associated with churn')"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cedar-500 focus:border-transparent"
                disabled={isExecuting}
              />
              <button
                onClick={handleSubmitGoal}
                disabled={!goal.trim() || isExecuting}
                className="cedar-gradient text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Start Research</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cells Display */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {session.cells.map((cell) => (
              <CellComponent
                key={cell.id}
                cell={cell}
                onExecute={() => executeCode(cell.id)}
                isExecuting={isExecuting}
              />
            ))}
            
            {isExecuting && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3 text-cedar-600">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cedar-600"></div>
                  <span>AI is working on your research...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowReferences(!showReferences)}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
                  showReferences 
                    ? "bg-cedar-100 text-cedar-700" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <BookOpen className="h-4 w-4" />
                <span>References</span>
              </button>
              
              <button
                onClick={addReference}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Add Reference</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Panel */}
      {showReferences && (
        <ReferencePanel
          references={session.cells.filter(cell => cell.type === 'reference')}
          onClose={() => setShowReferences(false)}
        />
      )}
    </div>
  )
}

export default ResearchSession 