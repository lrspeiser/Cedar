import React from 'react'
import { Play, CheckCircle, AlertCircle, FileText, Code, Target, Lightbulb } from 'lucide-react'
import { Cell } from '../App'
import { cn } from '../lib/utils'

interface CellComponentProps {
  cell: Cell
  onExecute: () => void
  isExecuting: boolean
}

const CellComponent: React.FC<CellComponentProps> = ({ cell, onExecute, isExecuting }) => {
  const getCellIcon = (type: Cell['type']) => {
    switch (type) {
      case 'intent':
        return <Target className="h-4 w-4 text-cedar-600" />
      case 'plan':
        return <Lightbulb className="h-4 w-4 text-yellow-600" />
      case 'code':
        return <Code className="h-4 w-4 text-blue-600" />
      case 'output':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'reference':
        return <FileText className="h-4 w-4 text-purple-600" />
      case 'validation':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getCellTitle = (type: Cell['type']) => {
    switch (type) {
      case 'intent':
        return 'Research Goal'
      case 'plan':
        return 'Plan Step'
      case 'code':
        return 'Code'
      case 'output':
        return 'Output'
      case 'reference':
        return 'Reference'
      case 'validation':
        return 'Validation'
      default:
        return 'Cell'
    }
  }

  const getCellStyles = (type: Cell['type']) => {
    switch (type) {
      case 'intent':
        return 'border-l-4 border-cedar-500 bg-cedar-50'
      case 'plan':
        return 'border-l-4 border-yellow-500 bg-yellow-50'
      case 'code':
        return 'border-l-4 border-blue-500 bg-blue-50'
      case 'output':
        return 'border-l-4 border-green-500 bg-green-50'
      case 'reference':
        return 'border-l-4 border-purple-500 bg-purple-50'
      case 'validation':
        return 'border-l-4 border-orange-500 bg-orange-50'
      default:
        return 'border-l-4 border-gray-500 bg-gray-50'
    }
  }

  const renderCellContent = () => {
    switch (cell.type) {
      case 'code':
        return (
          <div className="space-y-3">
            <div className="code-block">
              <pre className="whitespace-pre-wrap">{cell.content}</pre>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {new Date(cell.timestamp).toLocaleTimeString()}
              </span>
              <button
                onClick={onExecute}
                disabled={isExecuting}
                className="flex items-center space-x-2 px-3 py-1 bg-cedar-600 text-white rounded text-sm hover:bg-cedar-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="h-3 w-3" />
                <span>Run</span>
              </button>
            </div>
          </div>
        )

      case 'output':
        return (
          <div className="output-block">
            <pre className="whitespace-pre-wrap font-mono text-sm">{cell.content}</pre>
            <div className="mt-2 text-xs text-gray-500">
              {new Date(cell.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )

      case 'validation':
        try {
          const validation = JSON.parse(cell.content)
          return (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "flex items-center space-x-2 px-2 py-1 rounded text-sm",
                  validation.isValid 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                )}>
                  {validation.isValid ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  <span>Confidence: {Math.round(validation.confidence * 100)}%</span>
                </div>
              </div>
              
              {validation.issues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Issues Found:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validation.issues.map((issue: string, index: number) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validation.suggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Suggestions:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {validation.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                <strong>Next Step:</strong> {validation.nextStep}
              </div>
              
              <div className="text-xs text-gray-500">
                {new Date(cell.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )
        } catch {
          return (
            <div className="text-sm text-gray-700">
              {cell.content}
            </div>
          )
        }

      case 'reference':
        try {
          const reference = JSON.parse(cell.content)
          return (
            <div className="reference-card">
              <h4 className="font-medium text-gray-900 mb-2">{reference.title}</h4>
              {reference.authors && (
                <p className="text-sm text-gray-600 mb-1">
                  {Array.isArray(reference.authors) ? reference.authors.join(', ') : reference.authors}
                </p>
              )}
              {reference.journal && (
                <p className="text-sm text-gray-600 mb-1">{reference.journal}</p>
              )}
              {reference.year && (
                <p className="text-sm text-gray-600 mb-2">{reference.year}</p>
              )}
              {reference.relevance && (
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Relevance:</strong> {reference.relevance}
                </p>
              )}
              {reference.url && (
                <a 
                  href={reference.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-cedar-600 hover:text-cedar-700 underline"
                >
                  View Source
                </a>
              )}
              <div className="mt-2 text-xs text-gray-500">
                {new Date(cell.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )
        } catch {
          return (
            <div className="text-sm text-gray-700">
              {cell.content}
            </div>
          )
        }

      default:
        return (
          <div className="text-sm text-gray-700">
            {cell.content}
            <div className="mt-2 text-xs text-gray-500">
              {new Date(cell.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )
    }
  }

  return (
    <div className={cn("cell-shadow rounded-lg overflow-hidden", getCellStyles(cell.type))}>
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          {getCellIcon(cell.type)}
          <h3 className="text-sm font-medium text-gray-900">
            {getCellTitle(cell.type)}
          </h3>
        </div>
        {renderCellContent()}
      </div>
    </div>
  )
}

export default CellComponent 