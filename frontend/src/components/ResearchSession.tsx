/**
 * Research Session Component
 * 
 * Main research interface that handles the complete research workflow:
 * - Goal submission and AI planning
 * - Code execution and monitoring
 * - Progress tracking and visualization
 * - Session persistence and management
 * 
 * RESEARCH WORKFLOW:
 * 1. User submits research goal
 * 2. AI generates research plan and questions
 * 3. User answers clarifying questions (if needed)
 * 4. AI executes research steps with code
 * 5. Results are displayed and validated
 * 6. Visualizations and final report are generated
 * 
 * TESTING:
 * - Unit tests: Test goal submission, code execution, progress monitoring
 * - Integration tests: Test complete research workflow
 * - UI tests: Test component rendering and user interactions
 * - Browser console: Use test-research.js for manual testing
 * 
 * Example usage:
 * ```jsx
 * <ResearchSession
 *   sessionId="session-123"
 *   projectId="project-456"
 *   goal="Analyze customer churn patterns"
 *   onContentGenerated={() => console.log('Research completed')}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { apiService } from '../api';
import CellComponent from './CellComponent';

interface Cell {
  type: 'text' | 'code';
  content: string;
  timestamp: string;
  output?: string;
  validation?: string;
  status?: string;
}

interface ResearchSessionProps {
  sessionId: string;
  projectId: string;
  goal: string;
  answers?: Record<string, string>;
  onContentGenerated?: () => void;
}

const ResearchSession: React.FC<ResearchSessionProps> = ({ 
  sessionId, 
  projectId, 
  goal, 
  answers,
  onContentGenerated 
}) => {
  const [cells, setCells] = useState<Cell[]>([]);
  const [currentGoal, setCurrentGoal] = useState(goal);
  const [isLoading, setIsLoading] = useState(false);
  const [executionProgress, setExecutionProgress] = useState<{
    currentStep: number;
    totalSteps: number;
    isExecuting: boolean;
    stepResults: any[];
    isGeneratingVisualizations: boolean;
    visualizationProgress: number;
    totalVisualizations: number;
    isUpdatingPaper: boolean;
    isGeneratingWriteUp: boolean;
    writeUpGenerated: boolean;
  }>({
    currentStep: 0,
    totalSteps: 0,
    isExecuting: false,
    stepResults: [],
    isGeneratingVisualizations: false,
    visualizationProgress: 0,
    totalVisualizations: 0,
    isUpdatingPaper: false,
    isGeneratingWriteUp: false,
    writeUpGenerated: false
  });

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Manage execution monitoring
  useEffect(() => {
    let monitoringInterval: number | null = null;
    
    // Start monitoring if execution is in progress
    if (executionProgress.isExecuting) {
      monitoringInterval = monitorExecutionProgress();
    }
    
    // Cleanup function
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [executionProgress.isExecuting, sessionId]);

  const loadSession = async () => {
    try {
      const sessionData = await apiService.loadSession(sessionId);
      if (sessionData) {
        const sessionDataAny = sessionData as any;
        
        // Load cells from plan_cells (which now includes executed cells with outputs)
        if (sessionDataAny.plan_cells) {
          const cellsFromSession = sessionDataAny.plan_cells.map((cell: any) => ({
            type: cell.cell_type === 'Code' ? 'code' : 'text',
            content: cell.content,
            timestamp: cell.executed_at || cell.timestamp || new Date().toISOString(),
            output: cell.execution_result,
            status: cell.execution_result ? 'completed' : 'pending'
          }));
          setCells(cellsFromSession);
        }
        
        // Update execution progress if available
        if (sessionDataAny.execution_results) {
          setExecutionProgress(prev => ({
            ...prev,
            stepResults: sessionDataAny.execution_results,
            currentStep: sessionDataAny.execution_results.length,
            totalSteps: sessionDataAny.total_steps || 0,
            isExecuting: sessionDataAny.status === 'executing'
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleSubmitGoal = async () => {
    if (!currentGoal.trim()) return;
    
    setIsLoading(true);
    setExecutionProgress({
      currentStep: 0,
      totalSteps: 0,
      isExecuting: true,
      stepResults: [],
      isGeneratingVisualizations: false,
      visualizationProgress: 0,
      totalVisualizations: 0,
      isUpdatingPaper: false,
      isGeneratingWriteUp: false,
      writeUpGenerated: false
    });

    try {
      const response = await apiService.startResearch({
        projectId,
        sessionId,
        goal: currentGoal.trim(),
        answers
      });

      const responseData = response as any;
      if (responseData.status === 'questions_generated' || responseData.status === 'questions_pending') {
        // Show message to go to Questions tab
        setCells([{
          type: 'text',
          content: `## Research Setup Required\n\n${responseData.message}\n\nPlease go to the **Questions** tab to answer the clarifying questions before research can begin.`,
          timestamp: new Date().toISOString()
        }]);
      } else if (responseData.cells) {
        // Research started and cells were generated
        setCells(responseData.cells);
        
        // Start monitoring execution progress
        setExecutionProgress(prev => ({
          ...prev,
          isExecuting: true,
          totalSteps: responseData.total_steps || 0
        }));
      }
    } catch (error) {
      console.error('Failed to start research:', error);
      setCells([{
        type: 'text',
        content: `## Error Starting Research\n\nFailed to start research: ${error}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const monitorExecutionProgress = () => {
    // Poll for execution updates every 1 second for real-time updates
    const interval = setInterval(async () => {
      try {
        // Check if there are any new step results by looking at the session data
        const sessionData = await apiService.loadSession(sessionId);
        const sessionDataAny = sessionData as any;
        if (sessionData) {
          // Update execution progress
          if (sessionDataAny.execution_results) {
            setExecutionProgress(prev => ({
              ...prev,
              stepResults: sessionDataAny.execution_results,
              currentStep: sessionDataAny.execution_results.length,
              totalSteps: sessionDataAny.total_steps || 0,
              isExecuting: sessionDataAny.status === 'executing'
            }));
          }
          
          // Reload cells to show new executed content
          if (sessionDataAny.plan_cells) {
            const cellsFromSession = sessionDataAny.plan_cells.map((cell: any) => ({
              type: cell.cell_type === 'Code' ? 'code' : 'text',
              content: cell.content,
              timestamp: cell.executed_at || cell.timestamp || new Date().toISOString(),
              output: cell.execution_result,
              status: cell.execution_result ? 'completed' : 'pending'
            }));
            setCells(cellsFromSession);
          }
        }
        
        // Check if execution is complete
        if (sessionData && sessionDataAny.status === 'completed') {
          setExecutionProgress(prev => ({
            ...prev,
            isExecuting: false,
            isGeneratingWriteUp: true
          }));
          
          // Wait a moment for write-up generation, then check again
          setTimeout(async () => {
            try {
              const updatedSessionData = await apiService.loadSession(sessionId);
              const updatedSessionDataAny = updatedSessionData as any;
              
              if (updatedSessionData && updatedSessionDataAny.status === 'completed') {
                setExecutionProgress(prev => ({
                  ...prev,
                  isGeneratingWriteUp: false,
                  writeUpGenerated: true
                }));
                
                clearInterval(interval);
                
                // Refresh the cells to show final results
                await loadSession();
                if (onContentGenerated) {
                  onContentGenerated();
                }
              }
            } catch (error) {
              console.error('Failed to check write-up status:', error);
              setExecutionProgress(prev => ({
                ...prev,
                isGeneratingWriteUp: false
              }));
              clearInterval(interval);
            }
          }, 2000); // Wait 2 seconds for write-up generation
        } else if (sessionData && (sessionDataAny.status === 'completed_with_visualizations' || sessionDataAny.status === 'completed_without_visualizations')) {
          // Research completed, check if visualizations were generated
          if (sessionDataAny.visualizations) {
            setExecutionProgress(prev => ({
              ...prev,
              isExecuting: false,
              isGeneratingVisualizations: false,
              totalVisualizations: sessionDataAny.visualizations.length
            }));
          } else {
            setExecutionProgress(prev => ({
              ...prev,
              isExecuting: false,
              isGeneratingVisualizations: false
            }));
          }
          clearInterval(interval);
          
          // Refresh the cells to show final results
          await loadSession();
          if (onContentGenerated) {
            onContentGenerated();
          }
        } else if (sessionData && (sessionDataAny.status === 'completed_with_paper' || sessionDataAny.status === 'completed_without_paper' || sessionDataAny.status === 'completed_with_paper_no_viz' || sessionDataAny.status === 'completed_without_extras')) {
          // Research completed with paper update
          setExecutionProgress(prev => ({
            ...prev,
            isExecuting: false,
            isGeneratingVisualizations: false,
            isUpdatingPaper: false
          }));
          clearInterval(interval);
          
          // Refresh the cells to show final results
          await loadSession();
          if (onContentGenerated) {
            onContentGenerated();
          }
        } else if (sessionData && sessionDataAny.status === 'generating_visualizations') {
          // Visualization generation in progress
          setExecutionProgress(prev => ({
            ...prev,
            isExecuting: false,
            isGeneratingVisualizations: true,
            visualizationProgress: sessionDataAny.visualization_progress || 0,
            totalVisualizations: sessionDataAny.total_visualizations || 0
          }));
        } else if (sessionData && sessionDataAny.status === 'updating_paper') {
          // Paper update in progress
          setExecutionProgress(prev => ({
            ...prev,
            isExecuting: false,
            isGeneratingVisualizations: false,
            isUpdatingPaper: true
          }));
        }
      } catch (error) {
        console.error('Failed to check execution progress:', error);
      }
    }, 1000); // Poll every 1 second for real-time updates

    // Cleanup interval after 10 minutes (max execution time)
    setTimeout(() => {
      clearInterval(interval);
      setExecutionProgress(prev => ({
        ...prev,
        isExecuting: false
      }));
    }, 600000);
    
    // Return the interval ID for cleanup
    return interval;
  };

  const executeCode = async (code: string) => {
    try {
      const result = await apiService.executeCode({
        code,
        sessionId
      });

      // Add the result as a new cell
      const resultData = result as any;
      const newCell: Cell = {
        type: 'code',
        content: code,
        timestamp: new Date().toISOString(),
        output: resultData.output,
        validation: resultData.validation,
        status: resultData.status
      };

      setCells(prev => [...prev, newCell]);

      // Save session
      await apiService.updateSession(sessionId, [...cells, newCell]);
      
      if (onContentGenerated) {
        onContentGenerated();
      }
    } catch (error) {
      console.error('Error executing code:', error);
      
      // Add error cell
      const errorCell: Cell = {
        type: 'code',
        content: code,
        timestamp: new Date().toISOString(),
        output: `Error: ${error}`,
        status: 'failed'
      };

      setCells(prev => [...prev, errorCell]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Research Goal Input */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Research Session</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            value={currentGoal}
            onChange={(e) => setCurrentGoal(e.target.value)}
            placeholder="Enter your research goal..."
            className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-cedar-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmitGoal}
            disabled={isLoading || !currentGoal.trim()}
            className="px-6 py-3 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Starting Research...' : 'Start Research'}
          </button>
        </div>
      </div>

      {/* Execution Progress */}
      {executionProgress.isExecuting && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-blue-900">Research in Progress</h3>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-blue-700">Executing steps automatically...</span>
            </div>
          </div>
          
          {executionProgress.totalSteps > 0 && (
            <div className="mb-2">
              <div className="flex justify-between text-sm text-blue-700 mb-1">
                <span>Step {executionProgress.currentStep + 1} of {executionProgress.totalSteps}</span>
                <span>{Math.round(((executionProgress.currentStep + 1) / executionProgress.totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((executionProgress.currentStep + 1) / executionProgress.totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {executionProgress.stepResults.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Execution Results:</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {executionProgress.stepResults.map((result, index) => (
                  <div key={index} className={`text-sm rounded p-3 ${
                    result.is_suggested_step 
                      ? 'text-purple-800 bg-purple-100 border-l-4 border-purple-400' 
                      : 'text-blue-800 bg-blue-100'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <strong>Step {result.step_number + 1}:</strong>
                        {result.is_suggested_step && (
                          <span className="px-2 py-1 rounded text-xs bg-purple-200 text-purple-800">
                            🔧 Auto-added
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.status === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {result.status === 'success' ? '✅ Completed' : '❌ Failed'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-blue-700 mb-2">
                      {result.description}
                    </div>
                    
                    {result.execution_time_ms && (
                      <div className="text-xs text-blue-600 mb-2">
                        ⏱️ Execution time: {result.execution_time_ms}ms
                      </div>
                    )}
                    
                    {result.logs && result.logs.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs font-medium text-blue-700 mb-1">📊 Logs ({result.logs.length} entries):</div>
                        <div className="text-xs bg-blue-50 p-2 rounded max-h-20 overflow-y-auto">
                          {result.logs.slice(0, 3).map((log: string, logIndex: number) => (
                            <div key={logIndex} className="text-blue-600">{log}</div>
                          ))}
                          {result.logs.length > 3 && (
                            <div className="text-blue-500 italic">... and {result.logs.length - 3} more logs</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {result.data_summary && (
                      <div className="mb-2">
                        <div className="text-xs font-medium text-blue-700 mb-1">📈 Data Summary:</div>
                        <div className="text-xs bg-blue-50 p-2 rounded">
                          {result.data_summary.substring(0, 150)}{result.data_summary.length > 150 ? '...' : ''}
                        </div>
                      </div>
                    )}
                    
                    {result.output && (
                      <div className="mb-2">
                        <div className="text-xs font-medium text-blue-700 mb-1">📤 Output:</div>
                        <div className="text-xs bg-blue-50 p-2 rounded">
                          {result.output.substring(0, 100)}{result.output.length > 100 ? '...' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Write-up Generation Progress */}
      {executionProgress.isGeneratingWriteUp && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-green-900">Generating Research Write-up</h3>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              <span className="text-sm text-green-700">Creating comprehensive report...</span>
            </div>
          </div>
          
          <div className="text-sm text-green-800">
            <p>📝 Analyzing execution results and generating comprehensive markdown report...</p>
            <p>📊 Including methodology, findings, and technical details...</p>
            <p>💾 Saving to the Paper tab for easy access...</p>
          </div>
        </div>
      )}

      {/* Write-up Generation Complete */}
      {executionProgress.writeUpGenerated && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-green-900">✅ Research Write-up Complete</h3>
            <span className="text-sm text-green-700">Report generated successfully</span>
          </div>
          
          <div className="text-sm text-green-800">
            <p>📄 A comprehensive research report has been generated and saved to the <strong>Paper tab</strong>.</p>
            <p>📊 The report includes methodology, findings, execution details, and technical analysis.</p>
            <p>🔍 You can view and edit the report in the Paper tab.</p>
          </div>
        </div>
      )}

      {/* Visualization Generation Progress */}
      {executionProgress.isGeneratingVisualizations && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-purple-900">Generating Visualizations</h3>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
              <span className="text-sm text-purple-700">Creating charts and tables...</span>
            </div>
          </div>
          
          {executionProgress.totalVisualizations > 0 && (
            <div className="mb-2">
              <div className="flex justify-between text-sm text-purple-700 mb-1">
                <span>Visualization {executionProgress.visualizationProgress + 1} of {executionProgress.totalVisualizations}</span>
                <span>{Math.round(((executionProgress.visualizationProgress + 1) / executionProgress.totalVisualizations) * 100)}%</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((executionProgress.visualizationProgress + 1) / executionProgress.totalVisualizations) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-purple-900 mb-2">Creating:</h4>
            <div className="text-sm text-purple-800 bg-purple-100 rounded p-2">
              <ul className="list-disc list-inside space-y-1">
                <li>Summary statistics tables</li>
                <li>Trend charts and graphs</li>
                <li>Distribution plots</li>
                <li>Correlation visualizations</li>
                <li>Key findings summaries</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Paper Update Progress */}
      {executionProgress.isUpdatingPaper && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-green-900">Updating Research Paper</h3>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              <span className="text-sm text-green-700">Synthesizing findings...</span>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">Creating comprehensive report:</h4>
            <div className="text-sm text-green-800 bg-green-100 rounded p-2">
              <ul className="list-disc list-inside space-y-1">
                <li>Analyzing all research results and data</li>
                <li>Incorporating interview questions and answers</li>
                <li>Integrating visualization findings</li>
                <li>Structuring academic paper with proper sections</li>
                <li>Highlighting key insights and conclusions</li>
                <li>Adding recommendations and implications</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cells Display */}
      <div className="space-y-4">
        {cells.map((cell, index) => (
          <CellComponent
            key={index}
            cell={cell}
            onExecuteCode={executeCode}
          />
        ))}
        
        {cells.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Research</h3>
            <p className="text-gray-600">
              Enter your research goal above to start an automated research session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchSession; 