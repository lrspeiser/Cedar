/**
 * Research Session Component
 * 
 * Enhanced research interface that handles the complete research workflow:
 * - Goal submission and AI planning (integrated into notebook)
 * - Research initialization (references, summary, questions) as notebook cells
 * - Interactive step-by-step execution with "Next" buttons
 * - Code execution and monitoring
 * - Progress tracking and visualization
 * - Session persistence and management
 * - Automatic data routing to appropriate tabs
 * 
 * ENHANCED WORKFLOW:
 * 1. User submits research goal (first notebook cell)
 * 2. AI generates research initialization (references, summary, questions)
 * 3. User answers questions and reviews references (interactive notebook cells)
 * 4. AI generates research plan and executes steps
 * 5. Each step requires user to click "Next" to proceed
 * 6. Results are displayed and validated
 * 7. Visualizations and final report are generated
 * 8. Structured data automatically routed to appropriate tabs
 * 
 * NOTEBOOK CELL TYPES:
 * - 'goal': Initial goal submission
 * - 'initialization': Research initialization with references and summary
 * - 'questions': Interactive questions for user to answer
 * - 'plan': Generated research plan
 * - 'code': Code execution steps
 * - 'result': Execution results and analysis
 * - 'visualization': Generated visualizations
 * - 'writeup': Final research write-up
 * - 'data': Data files and datasets
 * - 'reference': Research references and citations
 * - 'variable': Variable definitions and metadata
 * - 'library': Library dependencies and imports
 * 
 * DATA ROUTING SYSTEM:
 * - Automatically extracts structured data from cells
 * - Routes references to References tab
 * - Routes data files to Data tab
 * - Routes visualizations to Images tab
 * - Routes variables to Variables tab
 * - Routes libraries to Libraries tab
 * - Routes write-ups to Write-Up tab
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
  id: string;
  type: 'goal' | 'initialization' | 'questions' | 'plan' | 'code' | 'result' | 'visualization' | 'writeup' | 'data' | 'reference' | 'variable' | 'library' | 'title' | 'references' | 'abstract' | 'evaluation' | 'results' | 'data_upload' | 'data_analysis' | 'data_metadata' | 'duckdb_query' | 'phase' | 'title_created';
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
    stepId?: string;
    stepOrder?: number;
    totalSteps?: number;
    dataFiles?: any[];
    variables?: any[];
    libraries?: any[];
    visualizations?: any[];
    fileInfo?: any;
    analysisScript?: string;
    metadata?: any;
    queryResults?: any;
    threadId?: string; // Added for multi-threading
  };
  requiresUserAction?: boolean;
  canProceed?: boolean;
}

interface ResearchPlanStep {
  id: string;
  title: string;
  description: string;
  code?: string;
  status: string;
  order: number;
}

interface ResearchPlan {
  id: string;
  title: string;
  description: string;
  steps: ResearchPlanStep[];
  created_at: string;
  status: string;
}

interface DataRouterResult {
  success: boolean;
  message: string;
  routedItems: {
    references?: number;
    dataFiles?: number;
    visualizations?: number;
    variables?: number;
    libraries?: number;
    writeUps?: number;
  };
}

interface ExecutionThread {
  id: string;
  cellId: string;
  status: 'running' | 'completed' | 'error' | 'paused';
  startTime: string;
  endTime?: string;
  progress: {
    currentStep: number;
    totalSteps: number;
    stepResults: any[];
  };
  error?: string;
}

interface ResearchSessionProps {
  sessionId: string;
  projectId: string;
  goal: string;
  answers?: Record<string, string>;
  onContentGenerated?: () => void;
  onDataRouted?: (result: DataRouterResult) => void;
  isResearchStarting?: boolean;
  onSessionLoaded?: () => void;
}

// Data Router Service
class DataRouterService {
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  async routeCellData(cell: Cell): Promise<DataRouterResult> {
    const result: DataRouterResult = {
      success: true,
      message: 'Data routing completed',
      routedItems: {}
    };

    try {
      // Route references
      if (cell.metadata?.references && cell.metadata.references.length > 0) {
        await this.routeReferences(cell.metadata.references);
        result.routedItems.references = cell.metadata.references.length;
      }

      // Route data files
      if (cell.metadata?.dataFiles && cell.metadata.dataFiles.length > 0) {
        await this.routeDataFiles(cell.metadata.dataFiles);
        result.routedItems.dataFiles = cell.metadata.dataFiles.length;
      }

      // Route visualizations
      if (cell.metadata?.visualizations && cell.metadata.visualizations.length > 0) {
        await this.routeVisualizations(cell.metadata.visualizations);
        result.routedItems.visualizations = cell.metadata.visualizations.length;
      }

      // Route variables
      if (cell.metadata?.variables && cell.metadata.variables.length > 0) {
        await this.routeVariables(cell.metadata.variables);
        result.routedItems.variables = cell.metadata.variables.length;
      }

      // Route libraries
      if (cell.metadata?.libraries && cell.metadata.libraries.length > 0) {
        await this.routeLibraries(cell.metadata.libraries);
        result.routedItems.libraries = cell.metadata.libraries.length;
      }

      // Route write-ups
      if (cell.type === 'writeup' && cell.content) {
        await this.routeWriteUp(cell.content);
        result.routedItems.writeUps = 1;
      }

      // Route individual cell types
      if (cell.type === 'reference' && cell.content) {
        await this.routeSingleReference(cell.content);
        result.routedItems.references = 1;
      }

      if (cell.type === 'data' && cell.content) {
        await this.routeSingleDataFile(cell.content);
        result.routedItems.dataFiles = 1;
      }

      if (cell.type === 'variable' && cell.content) {
        await this.routeSingleVariable(cell.content);
        result.routedItems.variables = 1;
      }

      if (cell.type === 'library' && cell.content) {
        await this.routeSingleLibrary(cell.content);
        result.routedItems.libraries = 1;
      }

    } catch (error) {
      result.success = false;
      result.message = `Data routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Data routing error:', error);
    }

    return result;
  }

  private async routeReferences(references: any[]): Promise<void> {
    for (const ref of references) {
      try {
        await apiService.addReference(this.projectId, {
          id: ref.id || `ref-${Date.now()}`,
          title: ref.title,
          authors: ref.authors,
          url: ref.url,
          content: ref.summary || ref.content,
          added_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to route reference:', ref.title, error);
      }
    }
  }

  private async routeDataFiles(dataFiles: any[]): Promise<void> {
    for (const dataFile of dataFiles) {
      try {
        await apiService.saveFile({
          project_id: this.projectId,
          filename: dataFile.filename || `data-${Date.now()}.csv`,
          content: dataFile.content || dataFile.data,
          file_type: dataFile.type || 'data'
        });
      } catch (error) {
        console.error('Failed to route data file:', dataFile.filename, error);
      }
    }
  }

  private async routeVisualizations(visualizations: any[]): Promise<void> {
    for (const viz of visualizations) {
      try {
        await apiService.createVisualization({
          projectId: this.projectId,
          name: viz.name || `viz-${Date.now()}`,
          visualizationType: viz.type || 'vega-lite',
          description: viz.description || 'Generated visualization',
          content: viz.content || viz.spec,
          code: viz.code,
          sessionId: this.projectId
        });
      } catch (error) {
        console.error('Failed to route visualization:', viz.name, error);
      }
    }
  }

  private async routeVariables(variables: any[]): Promise<void> {
    for (const variable of variables) {
      try {
        await apiService.addVariable(this.projectId, {
          name: variable.name,
          type: variable.type || 'unknown',
          description: variable.description,
          value: variable.value,
          metadata: variable.metadata || {}
        });
      } catch (error) {
        console.error('Failed to route variable:', variable.name, error);
      }
    }
  }

  private async routeLibraries(libraries: any[]): Promise<void> {
    for (const lib of libraries) {
      try {
        await apiService.addLibrary(this.projectId, {
          name: lib.name,
          version: lib.version,
          description: lib.description,
          category: lib.category || 'general',
          installed: lib.installed || false
        });
      } catch (error) {
        console.error('Failed to route library:', lib.name, error);
      }
    }
  }

  private async routeWriteUp(content: string): Promise<void> {
    try {
      // Update the project's write-up
      await apiService.saveFile({
        project_id: this.projectId,
        filename: 'research-writeup.md',
        content: content,
        file_type: 'write_up'
      });
    } catch (error) {
      console.error('Failed to route write-up:', error);
    }
  }

  private async routeSingleReference(content: string): Promise<void> {
    try {
      // Parse reference from content (simple format: Title by Author)
      const lines = content.split('\n');
      const title = lines[0] || 'Unknown Reference';
      const authors = lines[1]?.replace('by ', '') || 'Unknown Author';
      
      await apiService.addReference(this.projectId, {
        id: `ref-${Date.now()}`,
        title: title,
        authors: authors,
        content: content,
        added_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to route single reference:', error);
    }
  }

  private async routeSingleDataFile(content: string): Promise<void> {
    try {
      await apiService.saveFile({
        project_id: this.projectId,
        filename: `data-${Date.now()}.csv`,
        content: content,
        file_type: 'data'
      });
    } catch (error) {
      console.error('Failed to route single data file:', error);
    }
  }

  private async routeSingleVariable(content: string): Promise<void> {
    try {
      // Parse variable from content (simple format: name = value)
      const match = content.match(/^(\w+)\s*=\s*(.+)$/);
      if (match) {
        await apiService.addVariable(this.projectId, {
          name: match[1],
          type: 'string',
          description: 'Variable from notebook',
          value: match[2].trim(),
          metadata: {}
        });
      }
    } catch (error) {
      console.error('Failed to route single variable:', error);
    }
  }

  private async routeSingleLibrary(content: string): Promise<void> {
    try {
      // Parse library from content (simple format: library_name)
      const libraryName = content.trim();
      await apiService.addLibrary(this.projectId, {
        name: libraryName,
        version: 'latest',
        description: `Library from notebook: ${libraryName}`,
        category: 'general',
        installed: false
      });
    } catch (error) {
      console.error('Failed to route single library:', error);
    }
  }
}

const ResearchSession: React.FC<ResearchSessionProps> = ({ 
  sessionId, 
  projectId,
  goal,
  onDataRouted,
  isResearchStarting = false,
  onSessionLoaded
}) => {
  const [cells, setCells] = useState<Cell[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [researchPlan, setResearchPlan] = useState<ResearchPlan | null>(null);
  const [dataRouter] = useState(() => new DataRouterService(projectId));
  
  // Multi-threaded execution system
  const [executionThreads, setExecutionThreads] = useState<Map<string, ExecutionThread>>(new Map());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  
  // Legacy execution progress (for backward compatibility)
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
    writeUpGenerated: false,
  });

  // Initialize with goal cell if goal is provided
  useEffect(() => {
    if (goal && cells.length === 0) {
      const goalCell: Cell = {
        id: 'goal-1',
        type: 'goal',
        content: goal,
        timestamp: new Date().toISOString(),
        status: 'completed',
        requiresUserAction: false,
        canProceed: true,
      };
      setCells([goalCell]);
      handleNextStep(goalCell);
    }
  }, [goal, cells.length]);

  // Load existing session
  useEffect(() => {
    if (sessionId) {
      loadSession();
      // Reset loading state when loading a session to prevent stuck states
      setIsLoading(false);
    }
  }, [sessionId]);

  // Auto-refresh session when research starts or when there are active cells
  useEffect(() => {
    const hasActiveCells = cells.some(cell => cell.status === 'active' || cell.status === 'pending');
    const shouldPoll = (isResearchStarting || hasActiveCells) && sessionId;
    
    if (shouldPoll) {
      console.log('🔍 Starting/continuing session polling for session:', sessionId, 
        isResearchStarting ? '(research starting)' : '(active cells)');
      
      // Immediate load attempt
      loadSession();
      
      // Set up polling to check for session updates
      const pollInterval = setInterval(() => {
        console.log('🔄 Polling for session updates...');
        loadSession();
      }, 1500); // Check every 1.5 seconds for faster response
      
      return () => {
        console.log('🛑 Stopping session polling');
        clearInterval(pollInterval);
      };
    }
  }, [isResearchStarting, sessionId, cells]);

  // Stop polling when we have cells and research is no longer starting
  useEffect(() => {
    if (cells.length > 0 && isResearchStarting && onSessionLoaded) {
      console.log('✅ Session loaded with', cells.length, 'cells, stopping research starting state');
      // Session has been loaded, notify parent to stop the research starting state
      onSessionLoaded();
    }
  }, [cells.length, isResearchStarting, onSessionLoaded]);

  // Continue polling while there are active cells
  useEffect(() => {
    const hasActiveCells = cells.some(cell => cell.status === 'active' || cell.status === 'pending');
    
    if (hasActiveCells) {
      console.log('🔄 Found active cells, continuing to poll for updates...');
      // The polling will continue in the main useEffect
    } else if (cells.length > 0) {
      console.log('✅ All cells completed, stopping polling');
      // All cells are done, we can stop polling
    }
  }, [cells]);

  // Persist execution threads when component unmounts or session changes
  useEffect(() => {
    const saveThreads = async () => {
      if (sessionId && executionThreads.size > 0) {
        try {
          const threadsData = Array.from(executionThreads.entries());
          await apiService.saveSession(`${sessionId}_threads`, { threads: threadsData });
        } catch (error) {
          console.error('Failed to save execution threads:', error);
        }
      }
    };

    return () => {
      saveThreads();
    };
  }, [sessionId, executionThreads]);

  const loadSession = async () => {
    try {
      console.log('📥 Loading session:', sessionId);
      const session = await apiService.loadSession(sessionId) as any;
      console.log('📦 Session loaded:', session ? 'found' : 'not found', session?.cells?.length || 0, 'cells');
      
      if (session && session.cells) {
        // Reset any stuck cells (active or pending status that shouldn't be)
        const cleanedCells = session.cells.map((cell: Cell) => {
          // If a cell has been in active/pending status for more than 5 minutes, reset it
          const cellTime = new Date(cell.timestamp).getTime();
          const now = Date.now();
          const timeDiff = now - cellTime;
          
          if ((cell.status === 'active' || cell.status === 'pending') && timeDiff > 5 * 60 * 1000) {
            console.log(`Resetting stuck cell ${cell.id} from ${cell.status} to completed`);
            return {
              ...cell,
              status: 'completed' as const,
              timestamp: new Date().toISOString()
            };
          }
          
          // Ensure goal cells can proceed to next step
          if (cell.type === 'goal' && cell.status === 'completed') {
            return {
              ...cell,
              canProceed: true
            };
          }
          
          return cell;
        });
        
        setCells(cleanedCells);
        
        // Update execution progress if available
        if (session.executionProgress) {
          setExecutionProgress(session.executionProgress);
        }
        
        // Update research plan if available
        if (session.researchPlan) {
          setResearchPlan(session.researchPlan);
        }
      }

      // Load execution threads
      try {
        const threadsSession = await apiService.loadSession(`${sessionId}_threads`) as any;
        if (threadsSession && threadsSession.threads) {
          const threadsMap = new Map<string, ExecutionThread>();
          for (const [threadId, threadData] of threadsSession.threads) {
            threadsMap.set(threadId as string, threadData as ExecutionThread);
          }
          setExecutionThreads(threadsMap);
          
          // Find active thread
          for (const [threadId, thread] of threadsMap) {
            if (thread.status === 'running') {
              setActiveThreadId(threadId);
              break;
            }
          }
        }
      } catch (error) {
        console.log('No existing execution threads found');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const saveSession = async (updatedCells: Cell[]) => {
    try {
      const sessionData = {
        cells: updatedCells,
        executionProgress,
        researchPlan,
        timestamp: new Date().toISOString(),
      };
      await apiService.saveSession(sessionId, sessionData);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  // Create a new execution thread
  const createExecutionThread = (cellId: string, totalSteps: number): string => {
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const thread: ExecutionThread = {
      id: threadId,
      cellId,
      status: 'running',
      startTime: new Date().toISOString(),
      progress: {
        currentStep: 0,
        totalSteps,
        stepResults: [],
      },
    };
    
    setExecutionThreads(prev => new Map(prev).set(threadId, thread));
    setActiveThreadId(threadId);
    return threadId;
  };

  // Update execution thread progress
  const updateExecutionThread = (threadId: string, updates: Partial<ExecutionThread>) => {
    setExecutionThreads(prev => {
      const newMap = new Map(prev);
      const thread = newMap.get(threadId);
      if (thread) {
        newMap.set(threadId, { ...thread, ...updates });
      }
      return newMap;
    });
  };

  // Complete an execution thread
  const completeExecutionThread = (threadId: string, results: any[], error?: string) => {
    setExecutionThreads(prev => {
      const newMap = new Map(prev);
      const thread = newMap.get(threadId);
      if (thread) {
        newMap.set(threadId, {
          ...thread,
          status: error ? 'error' : 'completed',
          endTime: new Date().toISOString(),
          progress: {
            ...thread.progress,
            stepResults: results,
          },
          error,
        });
      }
      return newMap;
    });
    
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
    }
  };

  // Get execution status for a cell
  const getCellExecutionStatus = (cellId: string): ExecutionThread | null => {
    for (const [_, thread] of executionThreads) {
      if (thread.cellId === cellId) {
        return thread;
      }
    }
    return null;
  };

  // Check if any threads are currently running
  const hasRunningThreads = (): boolean => {
    for (const [_, thread] of executionThreads) {
      if (thread.status === 'running') {
        return true;
      }
    }
    return false;
  };

  // Route data from a cell to appropriate tabs
  const routeCellData = async (cell: Cell): Promise<void> => {
    try {
      const result = await dataRouter.routeCellData(cell);
      
      if (onDataRouted) {
        onDataRouted(result);
      }
      
      if (result.success) {
        console.log('✅ Data routed successfully:', result.routedItems);
      } else {
        console.error('❌ Data routing failed:', result.message);
      }
    } catch (error) {
      console.error('Failed to route cell data:', error);
    }
  };

  const handleNextStep = async (currentCell: Cell) => {
    // Prevent multiple simultaneous executions
    if (isLoading) {
      console.log('Already processing, please wait...');
      return;
    }
    
    setIsLoading(true);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Processing timeout - resetting loading state');
      setIsLoading(false);
    }, 30000); // 30 second timeout
    
    try {
      // Route data from current cell before proceeding
      await routeCellData(currentCell);
      
      let nextCell: Cell | null = null;
      
      switch (currentCell.type) {
        case 'goal':
          // Generate research initialization
          nextCell = await generateInitializationCell(currentCell.content);
          break;
          
        case 'title_created':
          // Start research initialization
          nextCell = await generateInitializationCell(currentCell.content);
          break;
          
        case 'initialization':
          // If this is the first initialization cell (from backend), generate the actual research
          if (currentCell.metadata?.goal && !currentCell.metadata?.background_summary) {
            nextCell = await generateInitializationCell(currentCell.metadata.goal);
          } else {
            // Generate abstract cell using the background summary from initialization
            const backgroundSummary = currentCell.metadata?.background_summary;
            if (backgroundSummary) {
              nextCell = await generateAbstractCell(goal, backgroundSummary);
            } else {
              console.error('No background summary found in initialization cell');
            }
          }
          break;
          
        
          
        case 'abstract':
          // Skip questions, go directly to plan
          nextCell = await generatePlanCell({});
          break;
          
        case 'plan':
          // Generate first phase cell
          if (currentCell.metadata?.plan) {
            nextCell = await generatePhaseCell(currentCell.metadata.plan, 0);
          }
          break;
          
        case 'phase':
          // Generate execution cell for this phase
          if (currentCell.metadata?.plan) {
            const phaseIndex = currentCell.metadata.stepOrder || 0;
            const phase = currentCell.metadata.plan.steps[phaseIndex];
            if (phase) {
              nextCell = {
                id: `code-${phase.id}`,
                type: 'code',
                content: phase.code || `# ${phase.title}\n${phase.description}`,
                timestamp: new Date().toISOString(),
                status: 'active',
                requiresUserAction: true,
                canProceed: true,
                metadata: {
                  stepId: phase.id,
                  stepOrder: phaseIndex,
                  totalSteps: currentCell.metadata.plan.steps.length,
                  phase: phase,
                },
              };
            }
          }
          break;
          
        case 'code':
          // Execute code and generate result
          nextCell = await executeCodeAndGenerateResult(currentCell);
          break;
          
        case 'result':
          // Generate next step or writeup
          nextCell = await generateNextStepOrWriteup(currentCell);
          break;
          
        default:
          console.log('Unknown cell type:', currentCell.type);
      }
      
      if (nextCell) {
        const updatedCells = [...cells, nextCell];
        setCells(updatedCells);
        await saveSession(updatedCells);
        
        // If next cell is code, start execution
        if (nextCell.type === 'code') {
          setTimeout(() => executeCodeStep(nextCell), 100);
        }
      }
      
    } catch (error) {
      console.error('Error in handleNextStep:', error);
      // Show error to user
      alert(`Error processing next step: ${error}`);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (currentCell: Cell, comment: string) => {
    // Prevent multiple simultaneous executions
    if (isLoading) {
      console.log('Already processing, please wait...');
      return;
    }
    
    setIsLoading(true);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Processing timeout - resetting loading state');
      setIsLoading(false);
    }, 30000); // 30 second timeout
    
    try {
      console.log(`Rerunning ${currentCell.type} cell with comment: ${comment}`);
      
      let updatedCell: Cell | null = null;
      
      switch (currentCell.type) {
        case 'goal':
          // Regenerate research initialization with comment
          updatedCell = await generateInitializationCellWithComment(currentCell.content, comment);
          break;
          
        case 'initialization':
          // Regenerate initialization with comment
          updatedCell = await generateInitializationCellWithComment(currentCell.content, comment);
          break;
          
        case 'abstract':
          // Regenerate abstract with comment
          updatedCell = await generateAbstractCellWithComment(goal, currentCell.metadata?.background_summary || '', comment);
          break;
          
        case 'plan':
          // Regenerate plan with comment
          updatedCell = await generatePlanCellWithComment({}, comment);
          break;
          
        case 'code':
          // Regenerate code with comment
          updatedCell = await executeCodeWithComment(currentCell, comment);
          break;
          
        case 'result':
          // Regenerate result with comment
          updatedCell = await generateNextStepOrWriteupWithComment(currentCell, comment);
          break;
          
        default:
          console.log('Unknown cell type for comment:', currentCell.type);
          alert('Comment functionality not available for this cell type.');
          return;
      }
      
      if (updatedCell) {
        // Replace the current cell with the updated one
        const cellIndex = cells.findIndex(c => c.id === currentCell.id);
        if (cellIndex !== -1) {
          const updatedCells = [...cells];
          updatedCells[cellIndex] = updatedCell;
          setCells(updatedCells);
          await saveSession(updatedCells);
          
          // If updated cell is code, start execution
          if (updatedCell.type === 'code') {
            setTimeout(() => executeCodeStep(updatedCell), 100);
          }
        }
      }
      
    } catch (error) {
      console.error('Error in handleSubmitComment:', error);
      alert(`Error processing comment: ${error}`);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const generateInitializationCell = async (goal: string): Promise<Cell> => {
    const initialization = await apiService.initializeResearch({ goal }) as any;
    
    // Store references in the references tab
    if (initialization.sources && initialization.sources.length > 0) {
      try {
        await dataRouter.routeReferences(initialization.sources);
        console.log('✅ References stored in references tab');
      } catch (error) {
        console.error('Failed to store references:', error);
      }
    }
    
    return {
      id: `initialization-${Date.now()}`,
      type: 'initialization',
      content: `Research Initialization for: ${goal}\n\nFound ${initialization.sources?.length || 0} relevant research sources.`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        references: initialization.sources,
        questions: initialization.questions,
        background_summary: initialization.background_summary,
      },
    };
  };

  const generateAbstractCell = async (goal: string, backgroundSummary: string): Promise<Cell> => {
    // Store the background summary as an abstract in the write-up tab
    if (backgroundSummary) {
      try {
        await dataRouter.routeWriteUp(`# Abstract\n\n${backgroundSummary}`);
        console.log('✅ Abstract stored in write-up tab');
      } catch (error) {
        console.error('Failed to store abstract:', error);
      }
    }
    
    return {
      id: `abstract-${Date.now()}`,
      type: 'abstract',
      content: `Research Abstract for: ${goal}\n\n${backgroundSummary}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        background_summary: backgroundSummary,
      },
    };
  };

  const generatePlanCell = async (answers: Record<string, string>): Promise<Cell> => {
    const plan = await apiService.generateResearchPlan({
      goal: goal, // Use the current goal from props
      answers,
      sources: [],
      background_summary: '',
    }) as any;
    
    setResearchPlan(plan);
    
    return {
      id: `plan-${Date.now()}`,
      type: 'plan',
      content: `Research Plan: ${plan.title}\n\n${plan.description}\n\nPhases:\n${plan.steps.map((step: any, i: number) => `${i + 1}. ${step.title}`).join('\n')}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        plan,
      },
    };
  };

  const generatePhaseCell = async (plan: any, phaseIndex: number): Promise<Cell> => {
    if (!plan || !plan.steps || plan.steps.length === 0) {
      throw new Error('No research plan available');
    }
    
    if (phaseIndex >= plan.steps.length) {
      throw new Error('Phase index out of bounds');
    }
    
    const phase = plan.steps[phaseIndex];
    
    return {
      id: `phase-${phase.id}`,
      type: 'phase',
      content: `Phase ${phaseIndex + 1}: ${phase.title}\n\n${phase.description}\n\nHere is what we will do:\n- ${phase.description}\n- The data we will need: Based on previous phases and research context\n- Example output we will get: ${phase.description.split('.').slice(0, 2).join('.')}...`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        stepId: phase.id,
        stepOrder: phaseIndex,
        totalSteps: plan.steps.length,
        phase: phase,
      },
    };
  };

  const generateFirstExecutionCell = async (plan: any): Promise<Cell> => {
    if (!plan || !plan.steps || plan.steps.length === 0) {
      throw new Error('No research plan available');
    }
    
    const firstStep = plan.steps[0];
    
    return {
      id: `code-${firstStep.id}`,
      type: 'code',
      content: firstStep.code || `# ${firstStep.title}\n${firstStep.description}`,
      timestamp: new Date().toISOString(),
      status: 'active',
      requiresUserAction: true,
      canProceed: true,
      metadata: {
        stepId: firstStep.id,
        stepOrder: 0,
        totalSteps: plan.steps.length,
      },
    };
  };

  const executeCodeStep = async (codeCell: Cell) => {
    // Check if this cell already has an execution thread
    const existingThread = getCellExecutionStatus(codeCell.id);
    if (existingThread && existingThread.status === 'running') {
      console.log('Execution already running for this cell');
      return;
    }

    // Create new execution thread
    const totalSteps = codeCell.metadata?.totalSteps || 1;
    const threadId = createExecutionThread(codeCell.id, totalSteps);

    try {
      // Update cell status to active
      const updatedCells = cells.map(cell => 
        cell.id === codeCell.id 
          ? { ...cell, status: 'active' as const }
          : cell
      );
      setCells(updatedCells);
      await saveSession(updatedCells);

      // Execute the code
      const result = await apiService.executeCode({
        code: codeCell.content,
        sessionId,
      });

      // Update thread progress
      updateExecutionThread(threadId, {
        progress: {
          currentStep: 1,
          totalSteps,
          stepResults: [result],
        },
      });

      // Generate result cell
      const resultCell: Cell = {
        id: `result-${Date.now()}`,
        type: 'result',
        content: `Execution completed for step ${(codeCell.metadata?.stepOrder || 0) + 1}`,
        timestamp: new Date().toISOString(),
        status: 'completed',
        requiresUserAction: false,
        canProceed: true,
        metadata: {
          executionResults: [result],
          stepOrder: codeCell.metadata?.stepOrder || 0,
          totalSteps: codeCell.metadata?.totalSteps || 0,
          threadId, // Store thread ID for reference
        },
      };

      // Update original cell status
      const finalCells = updatedCells.map(cell => 
        cell.id === codeCell.id 
          ? { ...cell, status: 'completed' as const }
          : cell
      );

      // Add result cell
      const cellsWithResult = [...finalCells, resultCell];
      setCells(cellsWithResult);
      await saveSession(cellsWithResult);

      // Complete the execution thread
      completeExecutionThread(threadId, [result]);

      // Route data from result cell
      await routeCellData(resultCell);

      // Generate next step or writeup
      const nextCell = await generateNextStepOrWriteup(resultCell);
      if (nextCell) {
        const cellsWithNext = [...cellsWithResult, nextCell];
        setCells(cellsWithNext);
        await saveSession(cellsWithNext);

        // If next cell is code, start execution in a new thread
        if (nextCell.type === 'code') {
          // Small delay to allow UI to update
          setTimeout(() => {
            executeCodeStep(nextCell);
          }, 100);
        }
      }

    } catch (error) {
      console.error('Failed to execute code:', error);
      
      // Update cell status to error
      const updatedCells = cells.map(cell => 
        cell.id === codeCell.id 
          ? { ...cell, status: 'error' as const }
          : cell
      );
      setCells(updatedCells);
      await saveSession(updatedCells);

      // Complete thread with error
      completeExecutionThread(threadId, [], error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const executeCodeAndGenerateResult = async (codeCell: Cell): Promise<Cell> => {
    // Create execution thread for this cell
    const totalSteps = codeCell.metadata?.totalSteps || 1;
    const threadId = createExecutionThread(codeCell.id, totalSteps);

    // Execute the code
    const result = await apiService.executeCode({
      code: codeCell.content,
      sessionId,
    });
    
    // Enhance the result with the code that was executed
    const enhancedResult = {
      ...result,
      code: codeCell.content, // Include the code that was executed
      stepNumber: (codeCell.metadata?.stepOrder || 0) + 1,
      stepTitle: codeCell.metadata?.stepId || 'Code Execution',
    };
    
    // Generate result cell
    const stepNumber = (codeCell.metadata?.stepOrder || 0) + 1;
    const resultCell: Cell = {
      id: `result-${Date.now()}`,
      type: 'result',
      content: `Execution completed for step ${stepNumber}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        executionResults: [enhancedResult],
        stepOrder: codeCell.metadata?.stepOrder || 0,
        totalSteps: codeCell.metadata?.totalSteps || 0,
        threadId, // Store thread ID for reference
      },
    };

    // Complete the execution thread
    completeExecutionThread(threadId, [enhancedResult]);
    
    return resultCell;
  };

  const generateFinalWriteUp = async (executionResults: any[]): Promise<string> => {
    try {
      // Call backend to generate comprehensive write-up
      const response = await apiService.generateFinalWriteUp({
        projectId,
        sessionId,
        executionResults,
        goal,
      });
      
      return response.content || 'No write-up content generated';
    } catch (error) {
      console.error('Failed to generate final write-up:', error);
      throw error;
    }
  };

  const generateNextStepOrWriteup = async (resultCell: Cell): Promise<Cell | null> => {
    const currentStep = resultCell.metadata?.stepOrder || 0;
    const totalSteps = resultCell.metadata?.totalSteps || 0;
    
    if (currentStep < totalSteps - 1) {
      // Generate next phase cell
      const nextStep = researchPlan?.steps[currentStep + 1];
      if (nextStep) {
        return {
          id: `phase-${nextStep.id}`,
          type: 'phase',
          content: `Phase ${currentStep + 2}: ${nextStep.title}\n\n${nextStep.description}\n\nHere is what we will do:\n- ${nextStep.description}\n- The data we will need: Based on previous phases and research context\n- Example output we will get: ${nextStep.description.split('.').slice(0, 2).join('.')}...`,
          timestamp: new Date().toISOString(),
          status: 'completed',
          requiresUserAction: false,
          canProceed: true,
          metadata: {
            stepId: nextStep.id,
            stepOrder: currentStep + 1,
            totalSteps,
            phase: nextStep,
          },
        };
      }
    } else {
      // Generate final writeup
      try {
        // Get all execution results from the session
        const executionResults = cells
          .filter(cell => cell.type === 'result' && cell.metadata?.executionResults)
          .flatMap(cell => cell.metadata.executionResults || []);
        
        // Generate comprehensive write-up using backend
        const writeUpContent = await generateFinalWriteUp(executionResults);
        
        // Store the write-up in the write-up tab
        await dataRouter.routeWriteUp(writeUpContent);
        
        return {
          id: `writeup-${Date.now()}`,
          type: 'writeup',
          content: writeUpContent,
          timestamp: new Date().toISOString(),
          status: 'completed',
          requiresUserAction: false,
          canProceed: false,
        };
      } catch (error) {
        console.error('Failed to generate write-up:', error);
        return {
          id: `writeup-${Date.now()}`,
          type: 'writeup',
          content: 'Error generating final research write-up. Please check the console for details.',
          timestamp: new Date().toISOString(),
          status: 'error',
          requiresUserAction: false,
          canProceed: false,
        };
      }
    }
    
    return null;
  };

  // Comment-aware functions
  const generateInitializationCellWithComment = async (goal: string, comment: string): Promise<Cell> => {
    const enhancedGoal = `${goal}\n\nUser Comment: ${comment}\n\nPlease consider this feedback when generating the research initialization.`;
    const initialization = await apiService.initializeResearch({ goal: enhancedGoal }) as any;
    
    // Store references in the references tab
    if (initialization.sources && initialization.sources.length > 0) {
      try {
        await dataRouter.routeReferences(initialization.sources);
        console.log('✅ Updated references stored in references tab');
      } catch (error) {
        console.error('Failed to store updated references:', error);
      }
    }
    
    return {
      id: `initialization-${Date.now()}`,
      type: 'initialization',
      content: `Research Initialization (Updated) for: ${goal}\n\nUser Feedback: ${comment}\n\nFound ${initialization.sources?.length || 0} relevant research sources.`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        references: initialization.sources,
        questions: initialization.questions,
        background_summary: initialization.background_summary,
      },
    };
  };

  const generateAbstractCellWithComment = async (goal: string, backgroundSummary: string, comment: string): Promise<Cell> => {
    // Enhance the background summary with user comment
    const enhancedSummary = `${backgroundSummary}\n\nUser Feedback: ${comment}\n\nPlease consider this feedback when refining the abstract.`;
    
    // Store the enhanced background summary as an abstract in the write-up tab
    try {
      await dataRouter.routeWriteUp(`# Abstract (Updated)\n\n${enhancedSummary}`);
      console.log('✅ Updated abstract stored in write-up tab');
    } catch (error) {
      console.error('Failed to store updated abstract:', error);
    }
    
    return {
      id: `abstract-${Date.now()}`,
      type: 'abstract',
      content: `Research Abstract (Updated) for: ${goal}\n\nUser Feedback: ${comment}\n\n${enhancedSummary}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        background_summary: enhancedSummary,
      },
    };
  };

  const generatePlanCellWithComment = async (answers: Record<string, string>, comment: string): Promise<Cell> => {
    const enhancedGoal = `${goal}\n\nUser Comment: ${comment}\n\nPlease consider this feedback when generating the research plan.`;
    const plan = await apiService.generateResearchPlan({
      goal: enhancedGoal,
      answers,
      sources: [],
      background_summary: '',
    }) as any;
    
    setResearchPlan(plan);
    
    return {
      id: `plan-${Date.now()}`,
      type: 'plan',
      content: `Research Plan (Updated)\n\nUser Feedback: ${comment}\n\n${plan.description}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        plan: plan,
      },
    };
  };

  const executeCodeWithComment = async (codeCell: Cell, comment: string): Promise<Cell> => {
    // Create execution thread for this cell
    const totalSteps = codeCell.metadata?.totalSteps || 1;
    const threadId = createExecutionThread(codeCell.id, totalSteps);

    // Execute the code with comment consideration
    const enhancedCode = `${codeCell.content}\n\n# User Comment: ${comment}\n# Please consider this feedback when executing the code.`;
    const result = await apiService.executeCode({
      code: enhancedCode,
      sessionId,
    });
    
    // Enhance the result with the code that was executed
    const enhancedResult = {
      ...result,
      code: enhancedCode, // Include the enhanced code that was executed
      stepNumber: (codeCell.metadata?.stepOrder || 0) + 1,
      stepTitle: codeCell.metadata?.stepId || 'Code Execution (Updated)',
      userComment: comment,
    };
    
    // Generate result cell
    const stepNumber = (codeCell.metadata?.stepOrder || 0) + 1;
    const resultCell: Cell = {
      id: `result-${Date.now()}`,
      type: 'result',
      content: `Execution completed (Updated) for step ${stepNumber}\n\nUser Feedback: ${comment}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        executionResults: [enhancedResult],
        stepOrder: codeCell.metadata?.stepOrder || 0,
        totalSteps: codeCell.metadata?.totalSteps || 0,
        threadId,
      },
    };

    // Complete the execution thread
    completeExecutionThread(threadId, [enhancedResult]);

    return resultCell;
  };

  const generateNextStepOrWriteupWithComment = async (resultCell: Cell, comment: string): Promise<Cell | null> => {
    // Enhanced version that considers user feedback
    const allResults = cells
      .filter(cell => cell.type === 'result')
      .flatMap(cell => cell.metadata?.executionResults || []);
    
    const totalSteps = resultCell.metadata?.totalSteps || 0;
    const currentStep = resultCell.metadata?.stepOrder || 0;
    
    if (allResults.length >= totalSteps || allResults.length >= 3) {
      // Generate final write-up with comment consideration
      try {
        const enhancedResults = [...allResults, { userFeedback: comment }];
        const writeUpContent = await generateFinalWriteUp(enhancedResults);
        
        // Store the final write-up in the write-up tab
        try {
          await dataRouter.routeWriteUp(`# Final Write-up (Updated)\n\nUser Feedback: ${comment}\n\n${writeUpContent}`);
          console.log('✅ Updated final write-up stored in write-up tab');
        } catch (error) {
          console.error('Failed to store updated final write-up:', error);
        }
        
        const writeUpCell: Cell = {
          id: `writeup-${Date.now()}`,
          type: 'writeup',
          content: `Final Write-up (Updated)\n\nUser Feedback: ${comment}\n\n${writeUpContent}`,
          timestamp: new Date().toISOString(),
          status: 'completed',
          requiresUserAction: false,
          canProceed: false,
        };
        
        return writeUpCell;
      } catch (error) {
        console.error('Failed to generate updated final write-up:', error);
        return {
          id: `writeup-${Date.now()}`,
          type: 'writeup',
          content: `Error generating updated final research write-up. User Feedback: ${comment}`,
          timestamp: new Date().toISOString(),
          status: 'error',
          requiresUserAction: false,
          canProceed: false,
        };
      }
    } else {
      // Generate next execution step with comment consideration
      const nextStepNumber = currentStep + 1;
      const plan = researchPlan;
      
      if (plan && plan.steps && plan.steps[nextStepNumber]) {
        const nextStep = plan.steps[nextStepNumber];
        
        const nextCodeCell: Cell = {
          id: `code-${Date.now()}`,
          type: 'code',
          content: `# Step ${nextStepNumber + 1}: ${nextStep.title} (Updated)\n\nUser Feedback: ${comment}\n\n${nextStep.code || nextStep.description}`,
          timestamp: new Date().toISOString(),
          status: 'pending',
          requiresUserAction: false,
          canProceed: true,
          metadata: {
            stepId: nextStep.id,
            stepOrder: nextStepNumber,
            totalSteps: plan.steps.length,
          },
        };
        
        return nextCodeCell;
      }
    }
    
    return null;
  };

  const renderCell = (cell: Cell) => {
    // Get execution thread for this cell
    const executionThread = getCellExecutionStatus(cell.id);
    
    return (
      <CellComponent
        key={cell.id}
        cell={cell}
        executionThread={executionThread || undefined}
        onExecute={cell.type === 'code' ? () => executeCodeStep(cell) : undefined}
        onNextStep={handleNextStep}
        onSubmitComment={handleSubmitComment}
      />
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with execution status */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Research Notebook</h2>
            <p className="text-sm text-gray-600">Session: {sessionId}</p>
          </div>
          
          {/* Execution Threads Status */}
          <div className="flex items-center space-x-4">
            {hasRunningThreads() && (
              <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm font-medium text-blue-800">
                  {Array.from(executionThreads.values()).filter(t => t.status === 'running').length} thread(s) running
                </span>
              </div>
            )}
            
            {executionThreads.size > 0 && (
              <div className="text-sm text-gray-600">
                Total threads: {executionThreads.size}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notebook Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cells.length === 0 ? (
          <div className="text-center py-8">
            {isResearchStarting ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cedar-500"></div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Starting Research...</h3>
                  <p className="text-gray-600">Initializing research session and generating initial content</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No research session started yet.</p>
            )}
          </div>
        ) : (
          cells.map((cell) => renderCell(cell))
        )}
        
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Processing...</span>
            <button
              onClick={() => {
                console.log('Manual reset of loading state');
                setIsLoading(false);
              }}
              className="ml-4 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchSession; 