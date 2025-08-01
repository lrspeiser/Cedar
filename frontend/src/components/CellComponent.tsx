import React, { useState } from 'react';
import { Play, CheckCircle, AlertCircle, ChevronRight, BookOpen, HelpCircle, FileText, Code, BarChart3, FileEdit, Package } from 'lucide-react';

interface Cell {
  id: string;
  type: 'goal' | 'initialization' | 'questions' | 'plan' | 'code' | 'result' | 'visualization' | 'writeup' | 'data' | 'reference' | 'variable' | 'library';
  content: string;
  timestamp: string;
  output?: string;
  validation?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  metadata?: {
    references?: any[];
    questions?: any[];
    answers?: Record<string, string>;
    plan?: any;
    executionResults?: any[];
    dataFiles?: any[];
    variables?: any[];
    libraries?: any[];
    visualizations?: any[];
  };
  requiresUserAction?: boolean;
  canProceed?: boolean;
}

interface CellComponentProps {
  cell: Cell;
  onExecute?: (cell: Cell) => void;
  onQuestionAnswer?: (cellId: string, questionId: string, answer: string) => void;
}

const CellComponent: React.FC<CellComponentProps> = ({ cell, onExecute, onQuestionAnswer }) => {
  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(cell.metadata?.answers || {});

  const handleExecute = () => {
    if (onExecute) {
      onExecute(cell);
    }
  };

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    if (onQuestionAnswer) {
      onQuestionAnswer(cell.id, questionId, answer);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getCellIcon = () => {
    switch (cell.type) {
      case 'goal':
        return <HelpCircle className="h-4 w-4 text-blue-500" />;
      case 'initialization':
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'questions':
        return <HelpCircle className="h-4 w-4 text-orange-500" />;
      case 'plan':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'code':
        return <Code className="h-4 w-4 text-indigo-500" />;
      case 'result':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'visualization':
        return <BarChart3 className="h-4 w-4 text-pink-500" />;
      case 'writeup':
        return <FileEdit className="h-4 w-4 text-teal-500" />;
      case 'data':
        return <BarChart3 className="h-4 w-4 text-cyan-500" />;
      case 'reference':
        return <BookOpen className="h-4 w-4 text-amber-500" />;
      case 'variable':
        return <Code className="h-4 w-4 text-emerald-500" />;
      case 'library':
        return <Package className="h-4 w-4 text-violet-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCellTypeLabel = () => {
    switch (cell.type) {
      case 'goal':
        return 'Research Goal';
      case 'initialization':
        return 'Research Initialization';
      case 'questions':
        return 'Questions & References';
      case 'plan':
        return 'Research Plan';
      case 'code':
        return 'Code Execution';
      case 'result':
        return 'Execution Result';
      case 'visualization':
        return 'Visualization';
      case 'writeup':
        return 'Research Write-up';
      case 'data':
        return 'Data File';
      case 'reference':
        return 'Reference';
      case 'variable':
        return 'Variable';
      case 'library':
        return 'Library';
      default:
        return 'Cell';
    }
  };

  const renderCellContent = () => {
    switch (cell.type) {
      case 'goal':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-blue-900 mb-2">Research Goal</h4>
              <p className="text-blue-800">{cell.content}</p>
            </div>
          </div>
        );

      case 'initialization':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-green-900 mb-2">Research Initialization</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-green-800">{cell.content}</div>
              </div>
            </div>
            
            {cell.metadata?.references && cell.metadata.references.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">References:</h4>
                <div className="space-y-2">
                  {cell.metadata.references.map((ref, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded p-3">
                      <h5 className="font-medium text-gray-900">{ref.title}</h5>
                      <p className="text-sm text-gray-600">{ref.authors}</p>
                      {ref.url && (
                        <a href={ref.url} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-blue-600 hover:text-blue-800">
                          {ref.url}
                        </a>
                      )}
                      <p className="text-sm text-gray-700 mt-2">{ref.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-orange-900 mb-2">Questions & References</h4>
              <p className="text-orange-800 mb-4">{cell.content}</p>
              
              {cell.metadata?.questions && cell.metadata.questions.length > 0 && (
                <div className="space-y-4">
                  {cell.metadata.questions.map((question: any) => (
                    <div key={question.id} className="bg-white border border-orange-200 rounded p-3">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {question.question}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <textarea
                        value={answers[question.id] || ''}
                        onChange={(e) => handleQuestionAnswer(question.id, e.target.value)}
                        placeholder="Enter your answer..."
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'plan':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-purple-900 mb-2">Research Plan</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-purple-800">{cell.content}</div>
              </div>
            </div>
            
            {cell.metadata?.plan && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Plan Details:</h4>
                <div className="bg-white border border-gray-200 rounded p-3">
                  <h5 className="font-medium text-gray-900">{cell.metadata.plan.title}</h5>
                  <p className="text-sm text-gray-600 mb-3">{cell.metadata.plan.description}</p>
                  
                  <div className="space-y-2">
                    {cell.metadata.plan.steps.map((step: any, index: number) => (
                      <div key={step.id} className="flex items-center space-x-2 text-sm">
                        <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-900">{step.title}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          step.status === 'completed' ? 'bg-green-100 text-green-800' :
                          step.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'code':
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-indigo-900 mb-2">Code Execution</h4>
              
              {/* Code */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Code:</h5>
                <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                  <code>{cell.content}</code>
                </pre>
              </div>

              {/* Output */}
              {cell.output && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Output:</h5>
                  <div className={`p-3 rounded-md text-sm ${
                    cell.status === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
                  }`}>
                    <pre className="whitespace-pre-wrap">{cell.output}</pre>
                  </div>
                </div>
              )}

              {/* Execution Status */}
              <div className="flex items-center space-x-2">
                {cell.status === 'completed' && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Completed</span>
                  </div>
                )}
                {cell.status === 'error' && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Error</span>
                  </div>
                )}
                {cell.status === 'active' && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm">Executing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-green-900 mb-2">Execution Result</h4>
              <p className="text-green-800">{cell.content}</p>
              
              {cell.metadata?.executionResults && cell.metadata.executionResults.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Results:</h5>
                  <div className="space-y-2">
                    {cell.metadata.executionResults.map((result: any, index: number) => (
                      <div key={index} className="bg-white border border-green-200 rounded p-3">
                        <div className="text-sm text-gray-900">
                          <strong>Step {result.step_number + 1}:</strong> {result.description}
                        </div>
                        {result.output && (
                          <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                            <pre className="whitespace-pre-wrap">{result.output}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'visualization':
        return (
          <div className="space-y-4">
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-pink-900 mb-2">Visualization</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-pink-800">{cell.content}</div>
              </div>
            </div>
          </div>
        );

      case 'writeup':
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-teal-900 mb-2">Research Write-up</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-teal-800">{cell.content}</div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-4">
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-cyan-900 mb-2">Data File</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-cyan-800">{cell.content}</div>
              </div>
            </div>
          </div>
        );

      case 'reference':
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-amber-900 mb-2">Reference</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-amber-800">{cell.content}</div>
              </div>
            </div>
          </div>
        );

      case 'variable':
        return (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-emerald-900 mb-2">Variable</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-emerald-800">{cell.content}</div>
              </div>
            </div>
          </div>
        );

      case 'library':
        return (
          <div className="space-y-4">
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-violet-900 mb-2">Library</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-violet-800">{cell.content}</div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Content</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-800">{cell.content}</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
      {/* Cell Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          {getCellIcon()}
          <div>
            <span className="text-sm font-medium text-gray-900">
              {getCellTypeLabel()}
            </span>
            <div className="text-xs text-gray-500">
              {formatTimestamp(cell.timestamp)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Status Indicator */}
          <div className={`px-2 py-1 rounded text-xs ${
            cell.status === 'completed' ? 'bg-green-100 text-green-800' :
            cell.status === 'error' ? 'bg-red-100 text-red-800' :
            cell.status === 'active' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            {cell.status}
          </div>
          
          {/* Execute Button for Code Cells */}
          {cell.type === 'code' && !cell.output && onExecute && (
            <button
              onClick={handleExecute}
              className="flex items-center space-x-1 px-3 py-1 bg-cedar-500 text-white text-sm rounded-md hover:bg-cedar-600 transition-colors"
            >
              <Play className="h-3 w-3" />
              <span>Run</span>
            </button>
          )}
          
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight className={`h-4 w-4 transform transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cell Content */}
      {expanded && (
        <div className="p-4">
          {renderCellContent()}
        </div>
      )}
    </div>
  );
};

export default CellComponent; 