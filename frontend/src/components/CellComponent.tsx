import React from 'react';
import { Play, CheckCircle, AlertCircle } from 'lucide-react';

interface Cell {
  type: 'text' | 'code';
  content: string;
  timestamp: string;
  output?: string;
  validation?: string;
  status?: string;
}

interface CellComponentProps {
  cell: Cell;
  onExecuteCode?: (code: string) => void;
}

const CellComponent: React.FC<CellComponentProps> = ({ cell, onExecuteCode }) => {
  const isCodeCell = cell.type === 'code';
  const hasOutput = cell.output !== undefined;
  const isExecuted = hasOutput || cell.status === 'failed';

  const handleExecute = () => {
    if (onExecuteCode && isCodeCell) {
      onExecuteCode(cell.content);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Cell Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">
            {isCodeCell ? 'Code' : 'Text'}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimestamp(cell.timestamp)}
          </span>
        </div>
        
        {isCodeCell && (
          <div className="flex items-center space-x-2">
            {isExecuted && (
              <div className="flex items-center space-x-1">
                {cell.status === 'failed' ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="text-xs text-gray-600">
                  {cell.status === 'failed' ? 'Failed' : 'Executed'}
                </span>
              </div>
            )}
            
            {!isExecuted && onExecuteCode && (
              <button
                onClick={handleExecute}
                className="flex items-center space-x-1 px-3 py-1 bg-cedar-500 text-white text-sm rounded-md hover:bg-cedar-600 transition-colors"
              >
                <Play className="h-3 w-3" />
                <span>Run</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cell Content */}
      <div className="p-4">
        {isCodeCell ? (
          <div className="space-y-4">
            {/* Code */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Code:</h4>
              <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                <code>{cell.content}</code>
              </pre>
            </div>

            {/* Output */}
            {hasOutput && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Output:</h4>
                <div className={`p-3 rounded-md text-sm ${
                  cell.status === 'failed' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
                }`}>
                  <pre className="whitespace-pre-wrap">{cell.output}</pre>
                </div>
              </div>
            )}

            {/* Validation */}
            {cell.validation && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Validation:</h4>
                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                  <pre className="whitespace-pre-wrap">{cell.validation}</pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Text Content */
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: cell.content.replace(/\n/g, '<br/>') }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CellComponent; 