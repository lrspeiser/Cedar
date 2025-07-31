import React from 'react'
import { X, ExternalLink, FileText } from 'lucide-react'
interface Cell {
  id: string
  type: 'intent' | 'plan' | 'code' | 'output' | 'reference' | 'validation'
  content: string
  metadata?: any
  timestamp: Date
}

interface ReferencePanelProps {
  references: Cell[]
  onClose: () => void
}

const ReferencePanel: React.FC<ReferencePanelProps> = ({ references, onClose }) => {
  const parseReference = (content: string) => {
    try {
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">References</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* References List */}
      <div className="flex-1 overflow-y-auto p-4">
        {references.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No references yet</p>
            <p className="text-xs">References will appear here as your research progresses</p>
          </div>
        ) : (
          <div className="space-y-4">
            {references.map((reference) => {
              const refData = parseReference(reference.content)
              if (!refData) return null

              return (
                <div key={reference.id} className="reference-card">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight">
                      {refData.title}
                    </h4>
                    {refData.url && (
                      <a
                        href={refData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cedar-600 hover:text-cedar-700 p-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {refData.authors && (
                    <p className="text-xs text-gray-600 mb-1">
                      {Array.isArray(refData.authors) ? refData.authors.join(', ') : refData.authors}
                    </p>
                  )}

                  {refData.journal && (
                    <p className="text-xs text-gray-600 mb-1">
                      {refData.journal}
                      {refData.year && `, ${refData.year}`}
                    </p>
                  )}

                  {refData.relevance && (
                    <p className="text-xs text-gray-700 mt-2">
                      <strong>Relevance:</strong> {refData.relevance}
                    </p>
                  )}

                  <div className="mt-2 text-xs text-gray-400">
                    {new Date(reference.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReferencePanel 