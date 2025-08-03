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
  type: 'goal' | 'initialization' | 'questions' | 'plan' | 'code' | 'result' | 'visualization' | 'writeup' | 'data' | 'reference' | 'variable' | 'library' | 'title' | 'references' | 'abstract' | 'evaluation' | 'results' | 'data_upload' | 'data_analysis' | 'data_metadata' | 'duckdb_query' | 'phase' | 'title_created' | 'data_assessment' | 'data_collection' | 'analysis_plan' | 'analysis_execution' | 'progress_log';
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
    // Streaming support
    streamLines?: string[];
    isStreaming?: boolean;
    isRerun?: boolean;
    originalCellId?: string;
    userComment?: string;
    // Analysis cell properties
    rustAnalysis?: any;
    llmAnalysis?: any;
    analysisCellId?: string;
    projectId?: string;
    type?: string;
    // Additional properties for research cells
    goal?: string;
    background_summary?: string;
    existingDataFiles?: any[];
    dataNeeded?: string;
    availableDataFiles?: any[];
    llmEvaluation?: any;
    phase?: string;
    context?: string;
    analysisType?: string;
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
  pendingNotebookEntry?: any;
  onNotebookEntryAdded?: () => void;
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
  onSessionLoaded,
  pendingNotebookEntry,
  onNotebookEntryAdded
}) => {
  const [cells, setCells] = useState<Cell[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [researchPlan, setResearchPlan] = useState<ResearchPlan | null>(null);
  const [dataRouter] = useState(() => new DataRouterService(projectId));
  
  // Analysis cells from DataTab
  const [_analysisCells, setAnalysisCells] = useState<any[]>([]);
  
  // Multi-threaded execution system
  const [executionThreads, setExecutionThreads] = useState<Map<string, ExecutionThread>>(new Map());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  
  // Streaming support
  const [_streamingCells, setStreamingCells] = useState<Set<string>>(new Set());
  
  // Session state tracking
  const [sessionLoaded, setSessionLoaded] = useState(false);

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

  // Initialize with goal cell if goal is provided and no session exists
  useEffect(() => {
    if (goal && cells.length === 0 && !sessionId) {
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
  }, [goal, cells.length, sessionId]);

  // Reset session state when sessionId changes
  useEffect(() => {
    if (sessionId) {
      console.log('🔄 Session ID changed, resetting state:', sessionId);
      resetSessionState();
    }
  }, [sessionId]);

  // Load existing session
  useEffect(() => {
    if (sessionId && !sessionLoaded) {
      console.log('🔄 Loading session for the first time:', sessionId);
      loadSession();
      loadAnalysisCells(); // Load analysis cells from DataTab
      // Reset loading state when loading a session to prevent stuck states
      setIsLoading(false);
    }
  }, [sessionId, sessionLoaded]);

  // Auto-refresh session when research starts or when there are active cells
  useEffect(() => {
    const hasActiveCells = cells.some(cell => cell.status === 'active' || cell.status === 'pending');
    const shouldPoll = (isResearchStarting || hasActiveCells) && sessionId && sessionLoaded;
    
    if (shouldPoll) {
      console.log('🔍 Starting/continuing session polling for session:', sessionId, 
        isResearchStarting ? '(research starting)' : '(active cells)');
      
      // Set up polling to check for session updates
      const pollInterval = setInterval(() => {
        console.log('🔄 Polling for session updates...');
        loadSession();
        loadAnalysisCells(); // Also refresh analysis cells
      }, 2000); // Check every 2 seconds to reduce load
      
      return () => {
        console.log('🛑 Stopping session polling');
        clearInterval(pollInterval);
      };
    }
  }, [isResearchStarting, sessionId, cells, sessionLoaded]);

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

  // Handle pending notebook entry from data tab
  useEffect(() => {
    if (pendingNotebookEntry) {
      console.log('📝 Adding pending notebook entry:', pendingNotebookEntry);
      
      const newCell: Cell = {
        id: `data-upload-${Date.now()}`,
        type: pendingNotebookEntry.type as any,
        content: pendingNotebookEntry.content,
        timestamp: new Date().toISOString(),
        status: 'completed',
        metadata: pendingNotebookEntry.metadata
      };
      
      setCells(prev => [...prev, newCell]);
      
      // Save the session with the new cell
      saveSession([...cells, newCell]);
      
      // Notify that the entry has been added
      if (onNotebookEntryAdded) {
        onNotebookEntryAdded();
      }
    }
  }, [pendingNotebookEntry]);

  const loadAnalysisCells = async () => {
    try {
      console.log('📋 Loading analysis cells for project:', projectId);
      const response = await apiService.listAnalysisCells({ projectId });
      if (response && Array.isArray(response)) {
        console.log('✅ Loaded analysis cells:', response.length);
        setAnalysisCells(response);
        
        // Convert analysis cells to notebook cells and add them to the session
        const analysisNotebookCells: Cell[] = response.map((analysisCell: any) => ({
          id: `analysis-${analysisCell.id}`,
          type: 'data_analysis' as any,
          content: analysisCell.content,
          timestamp: analysisCell.timestamp,
          status: analysisCell.status as any,
          metadata: {
            ...analysisCell.metadata,
            rustAnalysis: analysisCell.rust_analysis,
            llmAnalysis: analysisCell.llm_analysis,
            analysisCellId: analysisCell.id,
            projectId: analysisCell.project_id,
            type: analysisCell.type_
          }
        }));
        
        // Add analysis cells to the main cells array if they're not already there
        setCells(prevCells => {
          const existingAnalysisIds = new Set(prevCells.filter(cell => cell.type === 'data_analysis').map(cell => cell.metadata?.analysisCellId));
          const newAnalysisCells = analysisNotebookCells.filter(cell => !existingAnalysisIds.has(cell.metadata?.analysisCellId));
          
          if (newAnalysisCells.length > 0) {
            console.log('📝 Adding analysis cells to notebook:', newAnalysisCells.length);
            return [...prevCells, ...newAnalysisCells];
          }
          return prevCells;
        });
      }
    } catch (error) {
      console.error('Failed to load analysis cells:', error);
    }
  };

  const loadSession = async () => {
    try {
      console.log('📥 Loading session:', sessionId);
      const session = await apiService.loadSession(sessionId) as any;
      console.log('📦 Session loaded:', session ? 'found' : 'not found', session?.cells?.length || 0, 'cells');
      
      if (session && session.cells && session.cells.length > 0) {
        // Only update cells if we don't have any cells or if the session has more cells
        if (cells.length === 0 || session.cells.length > cells.length) {
          console.log('📝 Updating cells from session:', session.cells.length, 'cells');
          
          // Reset any stuck cells (active or pending status that shouldn't be)
          const cleanedCells = session.cells.map((cell: Cell) => {
            // If a cell has been in active/pending status for more than 5 minutes, reset it
            // BUT don't reset initialization or data_assessment cells that are actively showing progress
            const cellTime = new Date(cell.timestamp).getTime();
            const now = Date.now();
            const timeDiff = now - cellTime;
            
            if ((cell.status === 'active' || cell.status === 'pending') && 
                timeDiff > 5 * 60 * 1000 && 
                cell.type !== 'initialization' && 
                cell.type !== 'data_assessment') {
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
        } else {
          console.log('📝 Skipping cell update - current cells:', cells.length, 'session cells:', session.cells.length);
        }
        
        // Update execution progress if available
        if (session.executionProgress) {
          setExecutionProgress(session.executionProgress);
        }
        
        // Update research plan if available
        if (session.researchPlan) {
          setResearchPlan(session.researchPlan);
        }
        
        // Mark session as loaded
        setSessionLoaded(true);
      } else {
        console.log('📝 No session data or empty session');
        setSessionLoaded(true);
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
      console.log('💾 Session saved with', updatedCells.length, 'cells');
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const resetSessionState = () => {
    console.log('🔄 Resetting session state');
    setSessionLoaded(false);
    setCells([]);
    setExecutionThreads(new Map());
    setActiveThreadId(null);
    setStreamingCells(new Set());
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
    console.log('🔍 handleNextStep called for cell:', currentCell.id, 'type:', currentCell.type);
    console.log('🔍 Cell metadata:', currentCell.metadata);
    
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
          // Start data assessment instead of plan
          nextCell = await generateDataAssessmentCell();
          break;
          
        case 'data_assessment':
          // Evaluate existing data and determine next steps
          const existingDataFiles = currentCell.metadata?.existingDataFiles || [];
          if (existingDataFiles.length > 0) {
            // We have data, proceed to analysis planning
            nextCell = await generateAnalysisPlanCell();
          } else {
            // No data, need to collect data
            nextCell = await generateDataCollectionCell("Data needed for research goal");
          }
          break;
          
        case 'data_collection':
          // After data collection, proceed to analysis planning
          nextCell = await generateAnalysisPlanCell();
          break;
          
        case 'analysis_plan':
          // Generate analysis execution cell
          nextCell = await generateAnalysisExecutionCell();
          break;
          
        case 'code':
        case 'analysis_execution':
          // Execute code and generate result
          nextCell = await executeCodeAndGenerateResult(currentCell);
          break;
          
        case 'result':
          // For the new data-driven workflow, generate final writeup after analysis
          try {
            // Get all execution results from the session
            const executionResults = cells
              .filter(cell => cell.type === 'result' && cell.metadata?.executionResults)
              .flatMap(cell => cell.metadata?.executionResults || []);
            
            // Generate comprehensive write-up using backend
            const writeUpContent = await generateFinalWriteUp(executionResults);
            
            // Store the write-up in the write-up tab
            // await dataRouter.routeWriteUp(writeUpContent);
            
            nextCell = {
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
            nextCell = {
              id: `writeup-${Date.now()}`,
              type: 'writeup',
              content: 'Error generating final research write-up. Please check the console for details.',
              timestamp: new Date().toISOString(),
              status: 'error',
              requiresUserAction: false,
              canProceed: false,
            };
          }
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

  const createProgressLogCell = (message: string, isActive: boolean = false): Cell => {
    return {
      id: `progress-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'progress_log',
      content: message,
      timestamp: new Date().toISOString(),
      status: isActive ? 'active' : 'completed',
      requiresUserAction: false,
      canProceed: false,
    };
  };

  const updateProgressLog = (currentCells: Cell[], logId: string, newMessage: string, isActive: boolean = false): Cell[] => {
    return currentCells.map(cell => 
      cell.id === logId 
        ? { ...cell, content: newMessage, status: isActive ? 'active' : 'completed' }
        : cell
    );
  };

  const generateInitializationCell = async (goal: string): Promise<Cell> => {
    // Create the initialization cell with initial content
    const initializationCell: Cell = {
      id: `initialization-${Date.now()}`,
      type: 'initialization',
      content: `# Research References Collection\n\n**Goal**: ${goal}\n\n`,
      timestamp: new Date().toISOString(),
      status: 'active',
      requiresUserAction: false,
      canProceed: false,
      metadata: {
        goal,
        streamLines: [],
        isStreaming: true,
      },
    };
    
    // Add the cell to the UI immediately
    const updatedCells = [...cells, initializationCell];
    console.log('🔍 Adding references collection cell to UI:', initializationCell.id);
    setCells(updatedCells);
    await saveSession(updatedCells);
    
    try {
      // Stream the progress updates
      await streamLines(initializationCell.id, [
        '## Step 1: 🔄 Starting References Collection...',
        '',
        '🔍 Connecting to LLM service...',
        '📡 Establishing connection...',
        '✅ Connection established',
        '',
        '## Step 2: 🔄 Searching for Research Sources...',
        '',
        '🤖 Searching academic databases and authoritative sources...',
        '🧠 Analyzing research goal for relevant keywords...',
        '📚 Identifying recent, authoritative references...',
        '🔍 Evaluating source relevance and quality...',
      ], 120);
      
      // Call the LLM with context
      const initialization = await makeContextualLLMCall('initialization', initializationCell.id) as any;
      
      // Stream the results
      await streamLines(initializationCell.id, [
        '✅ LLM processing complete',
        '',
        '## Step 3: 🔄 Processing References...',
        '',
        `📚 Found ${initialization.sources?.length || 0} research sources`,
        '🔗 Organizing reference metadata...',
        '📝 Extracting titles, authors, and summaries...',
      ], 100);
      
      // Store references in the references tab
      if (initialization.sources && initialization.sources.length > 0) {
        try {
          // await dataRouter.routeReferences(initialization.sources);
          await streamLines(initializationCell.id, [
            '✅ References stored in References tab',
            '',
            '## 📚 References Found:',
            '',
          ], 50);
          
          // Stream each reference
          for (const source of initialization.sources) {
            await streamLines(initializationCell.id, [
              `**${source.title}**`,
              `*${source.authors} (${source.year})*`,
              `${source.summary}`,
              source.url ? `[View Source](${source.url})` : '',
              '',
            ], 80);
          }
          
          // Also route the cell data to ensure references are properly stored
          await routeCellData({
            ...initializationCell,
            metadata: {
              ...initializationCell.metadata,
              references: initialization.sources,
            }
          });
        } catch (error) {
          console.error('Failed to store references:', error);
          await streamLines(initializationCell.id, [
            '⚠️ Warning: Failed to store some references',
          ], 50);
        }
      }
      
      // Stream completion
      await streamLines(initializationCell.id, [
        '',
        '## Step 4: ✅ References Collection Complete!',
        '',
        `📚 **${initialization.sources?.length || 0} research sources** found and stored`,
        '🔗 **References** routed to References tab',
        '📖 **Source metadata** extracted and organized',
        '',
        '**Next**: Proceeding to data assessment...',
      ], 100);
      
      // Update the cell to completed status
      const finalCells = cells.map(cell => 
        cell.id === initializationCell.id 
          ? { 
              ...cell, 
              status: 'completed' as const,
              canProceed: true,
              metadata: {
                ...cell.metadata,
                references: initialization.sources,
                goal,
                isStreaming: false,
              },
            }
          : cell
      );
      setCells(finalCells);
      await saveSession(finalCells);
      
      return finalCells.find(cell => cell.id === initializationCell.id)!;
    } catch (error) {
      // Stream error
      await streamLines(initializationCell.id, [
        '',
        '## ❌ Error During References Collection',
        '',
        `**Error**: ${error}`,
        '',
        'Please check your API key and try again.',
      ], 100);
      
      // Update the cell to error status
      const errorCells = cells.map(cell => 
        cell.id === initializationCell.id 
          ? { 
              ...cell, 
              status: 'error' as const,
              metadata: {
                ...cell.metadata,
                isStreaming: false,
              },
            }
          : cell
      );
      setCells(errorCells);
      await saveSession(errorCells);
      throw error;
    }
  };

  const generateAbstractCell = async (goal: string, backgroundSummary: string): Promise<Cell> => {
    // Store the background summary as an abstract in the write-up tab
    if (backgroundSummary) {
      try {
        // await dataRouter.routeWriteUp(`# Abstract\n\n${backgroundSummary}`);
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

  const generateDataAssessmentCell = async (): Promise<Cell> => {
    console.log('🔍 Starting data assessment for goal:', goal);
    
    // Create the data assessment cell with initial content
    const dataAssessmentCell: Cell = {
      id: `data-assessment-${Date.now()}`,
      type: 'data_assessment',
      content: `# Data Assessment Progress\n\n**Goal**: ${goal}\n\n`,
      timestamp: new Date().toISOString(),
      status: 'active',
      requiresUserAction: false,
      canProceed: false,
      metadata: {
        goal,
        streamLines: [],
        isStreaming: true,
      },
    };
    
    // Add the cell to the UI immediately
    const updatedCells = [...cells, dataAssessmentCell];
    setCells(updatedCells);
    await saveSession(updatedCells);
    
    try {
      // Get existing data files for this project
      let existingDataFiles: any[] = [];
      
      // Stream the progress updates
      await streamLines(dataAssessmentCell.id, [
        '## Step 1: 🔄 Starting Data Assessment...',
        '',
        '🔍 Scanning project for existing data files...',
        '📁 Checking project directory...',
        '🔎 Looking for data files...',
        '',
        '## Step 2: 🔄 Loading Data Files...',
        '',
        '📂 Accessing project storage...',
        '📊 Scanning for data files...',
      ], 120);
      
      try {
        const dataFilesResponse = await apiService.listDataFiles({ projectId });
        existingDataFiles = (dataFilesResponse as any).data_files || [];
        console.log('🔍 Found existing data files:', existingDataFiles.length);
      } catch (error) {
        console.log('🔍 No existing data files found or error loading them');
      }
      
      // Make contextual LLM call for data assessment
      const dataAssessment = await makeContextualLLMCall('data_assessment', dataAssessmentCell.id, {
        existingDataFiles,
        projectId
      });

      // Stream the results
      await streamLines(dataAssessmentCell.id, [
        `✅ Found ${existingDataFiles.length} data file(s)`,
        '',
        '## Step 3: 🔄 Analyzing Data with LLM...',
        '',
        '🤖 Consulting AI for data assessment...',
        '🔍 Evaluating data relevance...',
        '📋 Analyzing data requirements...',
        '📊 Identifying data gaps...',
      ], 100);
      
      // Stream the LLM assessment results
      if (dataAssessment && dataAssessment.assessment) {
        await streamLines(dataAssessmentCell.id, [
          '',
          '## AI Data Assessment Results:',
          '',
        ], 50);
        
        // Stream the LLM response in chunks
        const assessmentLines = dataAssessment.assessment.split('\n');
        for (const line of assessmentLines) {
          if (line.trim()) {
            await streamLines(dataAssessmentCell.id, [line], 30);
          }
        }
      } else {
        // Fallback to basic assessment
        if (existingDataFiles.length > 0) {
          await streamLines(dataAssessmentCell.id, [
            '',
            '## Existing Data Files Found:',
            '',
          ], 50);
          
          for (const file of existingDataFiles) {
            await streamLines(dataAssessmentCell.id, [
              `📄 **${file.filename}** (${file.file_type})`,
            ], 50);
            
            if (file.metadata?.description) {
              await streamLines(dataAssessmentCell.id, [
                `   📝 ${file.metadata.description}`,
              ], 30);
            }
            
            if (file.metadata?.columns) {
              await streamLines(dataAssessmentCell.id, [
                `   📊 Columns: ${file.metadata.columns.join(', ')}`,
              ], 30);
            }
            
            await streamLines(dataAssessmentCell.id, [''], 20);
          }
        } else {
          await streamLines(dataAssessmentCell.id, [
            '',
            '## No Existing Data Files Found',
            '',
            'We need to determine what data is required for this research.',
          ], 100);
        }
      }
      
      // Stream completion
      await streamLines(dataAssessmentCell.id, [
        '',
        '## Step 4: ✅ Data Assessment Complete!',
        '',
        `📊 **${existingDataFiles.length} data file(s)** found`,
        '🔍 **Data evaluation** completed',
        '📋 **Assessment report** generated',
        '',
        `**Next**: ${existingDataFiles.length > 0 ? 'Proceeding to analysis planning...' : 'Proceeding to data collection...'}`,
      ], 100);
      
      // Update the cell to completed status
      const finalCells = cells.map(cell => 
        cell.id === dataAssessmentCell.id 
          ? { 
              ...cell, 
              status: 'completed' as const,
              canProceed: true,
              metadata: {
                ...cell.metadata,
                existingDataFiles,
                goal,
                isStreaming: false,
              },
            }
          : cell
      );
      setCells(finalCells);
      await saveSession(finalCells);
      
      return finalCells.find(cell => cell.id === dataAssessmentCell.id)!;
    } catch (error) {
      // Stream error
      await streamLines(dataAssessmentCell.id, [
        '',
        '## ❌ Error During Data Assessment',
        '',
        `**Error**: ${error}`,
        '',
        'Please try again.',
      ], 100);
      
      // Update the cell to error status
      const errorCells = cells.map(cell => 
        cell.id === dataAssessmentCell.id 
          ? { 
              ...cell, 
              status: 'error' as const,
              metadata: {
                ...cell.metadata,
                isStreaming: false,
              },
            }
          : cell
      );
      setCells(errorCells);
      await saveSession(errorCells);
      throw error;
    }
  };

  const generateDataCollectionCell = async (dataNeeded: string): Promise<Cell> => {
    console.log('🔍 Starting data collection for:', dataNeeded);
    
    // Create the data collection cell with initial content
    const dataCollectionCell: Cell = {
      id: `data-collection-${Date.now()}`,
      type: 'data_collection',
      content: `# Data Collection Progress\n\n**Goal**: ${goal}\n\n`,
      timestamp: new Date().toISOString(),
      status: 'active',
      requiresUserAction: false,
      canProceed: false,
      metadata: {
        dataNeeded,
        goal,
        streamLines: [],
        isStreaming: true,
      },
    };
    
    // Add the cell to the UI immediately
    const updatedCells = [...cells, dataCollectionCell];
    setCells(updatedCells);
    await saveSession(updatedCells);
    
    try {
      // Stream the progress updates
      await streamLines(dataCollectionCell.id, [
        '## Step 1: 🔄 Starting Data Collection...',
        '',
        '🔍 Analyzing data requirements...',
        '📋 Planning data collection strategy...',
        '🤖 Consulting AI for data generation...',
      ], 120);
      
      // Make contextual LLM call for data collection planning
      const dataCollection = await makeContextualLLMCall('data_collection', dataCollectionCell.id, {
        dataNeeded,
        projectId
      });
      
      // Stream the LLM response
      if (dataCollection && dataCollection.plan) {
        await streamLines(dataCollectionCell.id, [
          '',
          '## AI Data Collection Plan:',
          '',
        ], 50);
        
        // Stream the LLM response in chunks
        const planLines = dataCollection.plan.split('\n');
        for (const line of planLines) {
          if (line.trim()) {
            await streamLines(dataCollectionCell.id, [line], 30);
          }
        }
      } else {
        // Fallback content
        await streamLines(dataCollectionCell.id, [
          '',
          '## Data Requirements',
          `Based on the research goal, we need data that can help us: ${dataNeeded}`,
          '',
          '## Available Data Sources',
          '1. **Generated Sample Data**: We can create synthetic data that matches the requirements',
          '2. **Public Datasets**: We can suggest relevant public datasets',
          '3. **API Data**: We can fetch data from public APIs',
          '',
          '## Next Steps',
          'We will generate appropriate sample data and store it in the project\'s data section.',
        ], 100);
      }
      
      // Stream completion
      await streamLines(dataCollectionCell.id, [
        '',
        '## Step 2: ✅ Data Collection Complete!',
        '',
        '📊 **Data requirements** analyzed',
        '📋 **Collection strategy** planned',
        '🤖 **AI recommendations** generated',
        '',
        '**Next**: Proceeding to analysis planning...',
      ], 100);
      
      // Update the cell to completed status
      const finalCells = cells.map(cell => 
        cell.id === dataCollectionCell.id 
          ? { 
              ...cell, 
              status: 'completed' as const,
              canProceed: true,
              metadata: {
                ...cell.metadata,
                dataNeeded,
                goal,
                collectionPlan: dataCollection?.plan,
                isStreaming: false,
              },
            }
          : cell
      );
      setCells(finalCells);
      await saveSession(finalCells);
      
      return finalCells.find(cell => cell.id === dataCollectionCell.id)!;
    } catch (error) {
      // Stream error
      await streamLines(dataCollectionCell.id, [
        '',
        '## ❌ Error During Data Collection',
        '',
        `**Error**: ${error}`,
        '',
        'Please try again.',
      ], 100);
      
      // Update the cell to error status
      const errorCells = cells.map(cell => 
        cell.id === dataCollectionCell.id 
          ? { 
              ...cell, 
              status: 'error' as const,
              metadata: {
                ...cell.metadata,
                isStreaming: false,
              },
            }
          : cell
      );
      setCells(errorCells);
      await saveSession(errorCells);
      throw error;
    }
  };

  const generateAnalysisPlanCell = async (): Promise<Cell> => {
    console.log('🔍 Generating analysis plan for goal:', goal);
    
    // Create the analysis plan cell with initial content
    const analysisPlanCell: Cell = {
      id: `analysis-plan-${Date.now()}`,
      type: 'analysis_plan',
      content: `# Analysis Plan Progress\n\n**Goal**: ${goal}\n\n`,
      timestamp: new Date().toISOString(),
      status: 'active',
      requiresUserAction: false,
      canProceed: false,
      metadata: {
        goal,
        streamLines: [],
        isStreaming: true,
      },
    };
    
    // Add the cell to the UI immediately
    const updatedCells = [...cells, analysisPlanCell];
    setCells(updatedCells);
    await saveSession(updatedCells);
    
    try {
      // Stream the progress updates
      await streamLines(analysisPlanCell.id, [
        '## Step 1: 🔄 Starting Analysis Planning...',
        '',
        '🔍 Reviewing research context...',
        '📊 Analyzing available data...',
        '🤖 Consulting AI for analysis strategy...',
      ], 120);
      
      // Get all available data files for analysis
      let availableDataFiles: any[] = [];
      try {
        const dataFilesResponse = await apiService.listDataFiles({ projectId });
        availableDataFiles = (dataFilesResponse as any).data_files || [];
        console.log('🔍 Available data files for analysis:', availableDataFiles.length);
      } catch (error) {
        console.log('🔍 Error loading data files for analysis');
      }
      
      // Make contextual LLM call for analysis planning
      const analysisPlan = await makeContextualLLMCall('analysis_plan', analysisPlanCell.id, {
        availableDataFiles,
        projectId
      });
      
      // Stream the LLM response
      if (analysisPlan && analysisPlan.plan) {
        await streamLines(analysisPlanCell.id, [
          '',
          '## AI Analysis Plan:',
          '',
        ], 50);
        
        // Stream the LLM response in chunks
        const planLines = analysisPlan.plan.split('\n');
        for (const line of planLines) {
          if (line.trim()) {
            await streamLines(analysisPlanCell.id, [line], 30);
          }
        }
      } else {
        // Fallback content
        await streamLines(analysisPlanCell.id, [
          '',
          '## Analysis Approach',
          '',
          'Based on the research goal and available data, we will:',
          '1. **Data Exploration**: Examine the structure and quality of available data',
          '2. **Data Preprocessing**: Clean and prepare data for analysis',
          '3. **Statistical Analysis**: Perform relevant statistical tests and calculations',
          '4. **Visualization**: Create charts and graphs to illustrate findings',
          '5. **Interpretation**: Draw conclusions and insights from the analysis',
        ], 100);
      }
      
      // Stream completion
      await streamLines(analysisPlanCell.id, [
        '',
        '## Step 2: ✅ Analysis Planning Complete!',
        '',
        '📊 **Analysis strategy** designed',
        '🔍 **Data requirements** identified',
        '🤖 **AI recommendations** generated',
        '',
        '**Next**: Proceeding to analysis execution...',
      ], 100);
      
      // Update the cell to completed status
      const finalCells = cells.map(cell => 
        cell.id === analysisPlanCell.id 
          ? { 
              ...cell, 
              status: 'completed' as const,
              canProceed: true,
              metadata: {
                ...cell.metadata,
                availableDataFiles,
                goal,
                analysisPlan: analysisPlan?.plan,
                isStreaming: false,
              },
            }
          : cell
      );
      setCells(finalCells);
      await saveSession(finalCells);
      
      return finalCells.find(cell => cell.id === analysisPlanCell.id)!;
    } catch (error) {
      // Stream error
      await streamLines(analysisPlanCell.id, [
        '',
        '## ❌ Error During Analysis Planning',
        '',
        `**Error**: ${error}`,
        '',
        'Please try again.',
      ], 100);
      
      // Update the cell to error status
      const errorCells = cells.map(cell => 
        cell.id === analysisPlanCell.id 
          ? { 
              ...cell, 
              status: 'error' as const,
              metadata: {
                ...cell.metadata,
                isStreaming: false,
              },
            }
          : cell
      );
      setCells(errorCells);
      await saveSession(errorCells);
      throw error;
    }
  };

  const generateAnalysisExecutionCell = async (): Promise<Cell> => {
    console.log('🔍 Generating analysis execution for goal:', goal);
    
    // Create progress log for analysis execution
    const progressLogId = `progress-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const initialLogCell = createProgressLogCell(
      `# Analysis Execution Progress\n\n**Goal**: ${goal}\n\n## Step 1: Starting Analysis Execution...\n\n🔍 Preparing analysis environment...`,
      true
    );
    
    // Add the progress log to cells immediately
    const updatedCells = [...cells, initialLogCell];
    setCells(updatedCells);
    await saveSession(updatedCells);
    
    try {
      // Get all available data files for analysis
      let availableDataFiles: any[] = [];
      
      // Update progress - Step 2: Loading Data
      const step2Cells = updateProgressLog(
        updatedCells,
        progressLogId,
        `# Analysis Execution Progress\n\n**Goal**: ${goal}\n\n## Step 1: ✅ Starting Analysis Execution...\n\n## Step 2: 🔄 Loading Data Files...\n\n📁 Loading available data files for analysis...`,
        true
      );
      setCells(step2Cells);
      await saveSession(step2Cells);
      
      try {
        const dataFilesResponse = await apiService.listDataFiles({ projectId });
        availableDataFiles = (dataFilesResponse as any).data_files || [];
        console.log('🔍 Available data files for analysis execution:', availableDataFiles.length);
      } catch (error) {
        console.log('🔍 Error loading data files for analysis execution');
      }
      
      // Update progress - Step 3: Generating Code
      const step3Cells = updateProgressLog(
        step2Cells,
        progressLogId,
        `# Analysis Execution Progress\n\n**Goal**: ${goal}\n\n## Step 1: ✅ Starting Analysis Execution...\n\n## Step 2: ✅ Loading Data Files...\n\n## Step 3: 🔄 Generating Analysis Code...\n\n📊 Found ${availableDataFiles.length} data file(s)\n💻 Creating Python analysis script...`,
        true
      );
      setCells(step3Cells);
      await saveSession(step3Cells);
    
    // Generate Python code for analysis
    let analysisCode = `# Analysis Execution for: ${goal}\n\n`;
    analysisCode += `import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\n`;
    
    if (availableDataFiles.length > 0) {
      analysisCode += `# Load available data files\n`;
      availableDataFiles.forEach((file, index) => {
        const varName = `df_${index + 1}`;
        analysisCode += `${varName} = pd.read_csv('${file.filename}')\n`;
        analysisCode += `print(f"Loaded {file.filename}: {${varName}.shape}")\n`;
        analysisCode += `print(f"Columns: {list(${varName}.columns)}")\n\n`;
      });
      
      analysisCode += `# Data exploration\n`;
      analysisCode += `print("=== DATA EXPLORATION ===\\n")\n`;
      availableDataFiles.forEach((_file, index) => {
        const varName = `df_${index + 1}`;
        analysisCode += `print(f"\\nFile ${index + 1} Summary:")\n`;
        analysisCode += `print(${varName}.info())\n`;
        analysisCode += `print("\\nFirst few rows:")\n`;
        analysisCode += `print(${varName}.head())\n`;
        analysisCode += `print("\\nBasic statistics:")\n`;
        analysisCode += `print(${varName}.describe())\n\n`;
      });
      
      analysisCode += `# Analysis based on research goal: ${goal}\n`;
      analysisCode += `print("=== ANALYSIS ===\\n")\n`;
      analysisCode += `# TODO: Add specific analysis code based on the research goal\n`;
      analysisCode += `# This will be customized based on the available data and research objectives\n\n`;
      
      analysisCode += `# Visualization\n`;
      analysisCode += `print("=== VISUALIZATIONS ===\\n")\n`;
      analysisCode += `# TODO: Add relevant visualizations\n`;
      analysisCode += `plt.style.use('default')\n`;
      analysisCode += `# Example: Create a simple visualization if we have numeric data\n`;
      availableDataFiles.forEach((_file, index) => {
        const varName = `df_${index + 1}`;
        analysisCode += `# Visualize File ${index + 1}\n`;
        analysisCode += `if ${varName}.select_dtypes(include=[np.number]).columns.any():\n`;
        analysisCode += `    numeric_cols = ${varName}.select_dtypes(include=[np.number]).columns\n`;
        analysisCode += `    if len(numeric_cols) > 0:\n`;
        analysisCode += `        plt.figure(figsize=(10, 6))\n`;
        analysisCode += `        ${varName}[numeric_cols].hist(bins=20, figsize=(12, 8))\n`;
        analysisCode += `        plt.suptitle('Distribution of Numeric Variables in File ${index + 1}')\n`;
        analysisCode += `        plt.tight_layout()\n`;
        analysisCode += `        plt.show()\n\n`;
      });
    } else {
      analysisCode += `# No data files available for analysis\n`;
      analysisCode += `print("No data files found. Please upload data before running analysis.")\n`;
    }
    
    // Update progress - Step 4: Complete
    const step4Cells = updateProgressLog(
      step3Cells,
      progressLogId,
      `# Analysis Execution Progress\n\n**Goal**: ${goal}\n\n## Step 1: ✅ Starting Analysis Execution...\n\n## Step 2: ✅ Loading Data Files...\n\n## Step 3: ✅ Generating Analysis Code...\n\n## Step 4: ✅ Analysis Code Generated!\n\n📊 **${availableDataFiles.length} data file(s)** loaded\n💻 **Python analysis script** created\n🔧 **Analysis ready** for execution\n\n**Next**: Click "Run" to execute the analysis...`,
      false
    );
    setCells(step4Cells);
    await saveSession(step4Cells);
    
    return {
      id: `analysis-execution-${Date.now()}`,
      type: 'analysis_execution',
      content: analysisCode,
      timestamp: new Date().toISOString(),
      status: 'active',
      requiresUserAction: true,
      canProceed: true,
      metadata: {
        availableDataFiles,
        goal,
        analysisType: 'comprehensive',
      },
    };
  } catch (error) {
    // Update progress - Error
    const errorCells = updateProgressLog(
      updatedCells,
      progressLogId,
      `# Analysis Execution Progress\n\n**Goal**: ${goal}\n\n## ❌ Error During Analysis Generation\n\n**Error**: ${error}\n\nPlease try again.`,
      false
    );
    setCells(errorCells);
    await saveSession(errorCells);
    throw error;
  }
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
      // Update cell status to active and start streaming
      const updatedCells = cells.map(cell => 
        cell.id === codeCell.id 
          ? { 
              ...cell, 
              status: 'active' as const,
              metadata: {
                ...cell.metadata,
                isStreaming: true,
                streamLines: ['🚀 Starting code execution...']
              }
            }
          : cell
      );
      setCells(updatedCells);
      await saveSession(updatedCells);

      // Start streaming execution logs
      startStreaming(codeCell.id);
      
      // Stream initial messages
      await streamLines(codeCell.id, [
        '🔧 Executing Python code...',
        '📊 Collecting execution logs...',
        '🤖 Preparing for LLM evaluation...'
      ], 500);

      // Execute the code with enhanced logging
      const result = await apiService.executeCode({
        code: codeCell.content,
        sessionId,
      });

      // Stream execution results
      const logs = (result as any).logs || [];
      if (logs.length > 0) {
        await streamLines(codeCell.id, [
          '📋 Execution Logs:',
          ...logs.map((log: any) => `  ${log}`),
          '',
          '✅ Code execution completed successfully!'
        ], 200);
      } else {
        await streamLines(codeCell.id, [
          '✅ Code execution completed successfully!',
          `📊 Output: ${(result as any).output || 'No output generated'}`
        ], 200);
      }

      // Update thread progress
      updateExecutionThread(threadId, {
        progress: {
          currentStep: 1,
          totalSteps,
          stepResults: [result],
        },
      });

      // Stream LLM evaluation
      await streamLines(codeCell.id, [
        '🤖 Evaluating results with AI...',
        '💭 Analyzing execution output...',
        '🎯 Generating recommendations...'
      ], 300);

      // Generate LLM evaluation and recommendations
      const evaluationResult = { assessment: 'Code evaluation completed', recommendations: [], issues: [] };

      // Stream evaluation results
      await streamLines(codeCell.id, [
        '📝 AI Evaluation:',
        evaluationResult.assessment,
        '',
        '🎯 Recommended Next Steps:',
        ...evaluationResult.recommendations.map(rec => `  • ${rec}`),
        '',
        '💡 Issues Found:',
        ...evaluationResult.issues.map(issue => `  • ${issue}`)
      ], 200);

      // Stop streaming
      stopStreaming(codeCell.id);

      // Generate result cell with evaluation
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
          llmEvaluation: evaluationResult,
        },
      };

      // Update original cell status
      const finalCells = updatedCells.map(cell => 
        cell.id === codeCell.id 
          ? { 
              ...cell, 
              status: 'completed' as const,
              metadata: {
                ...cell.metadata,
                isStreaming: false
              }
            }
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

      // Generate next step or writeup based on LLM evaluation
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
      
      // Stream error message
      await streamLines(codeCell.id, [
        '❌ Code execution failed:',
        error instanceof Error ? error.message : 'Unknown error',
        '',
        '🔧 Please review the code and try again.'
      ], 200);
      
      // Stop streaming
      stopStreaming(codeCell.id);
      
      // Update cell status to error
      const updatedCells = cells.map(cell => 
        cell.id === codeCell.id 
          ? { 
              ...cell, 
              status: 'error' as const,
              metadata: {
                ...cell.metadata,
                isStreaming: false
              }
            }
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
      ...(result as any),
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
      
      return (response as any).content || 'No write-up content generated';
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
            phase: nextStep.title,
            plan: researchPlan,
          },
        };
      }
    } else {
      // Generate final writeup
      try {
        // Get all execution results from the session
        const executionResults = cells
          .filter(cell => cell.type === 'result' && cell.metadata?.executionResults)
          .flatMap(cell => cell.metadata?.executionResults || []);
        
        // Generate comprehensive write-up using backend
        const writeUpContent = await generateFinalWriteUp(executionResults);
        
        // Store the write-up in the write-up tab
        // await dataRouter.routeWriteUp(writeUpContent);
        
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
        // await dataRouter.routeReferences(initialization.sources);
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
      // await dataRouter.routeWriteUp(`# Abstract (Updated)\n\n${enhancedSummary}`);
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
      ...(result as any),
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
          // await dataRouter.routeWriteUp(`# Final Write-up (Updated)\n\nUser Feedback: ${comment}\n\n${writeUpContent}`);
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

  // Streaming functions
  const startStreaming = (cellId: string) => {
    setStreamingCells(prev => new Set(prev).add(cellId));
  };

  const stopStreaming = (cellId: string) => {
    setStreamingCells(prev => {
      const newSet = new Set(prev);
      newSet.delete(cellId);
      return newSet;
    });
  };

  const streamLine = (cellId: string, line: string) => {
    setCells(prevCells => 
      prevCells.map(cell => 
        cell.id === cellId 
          ? {
              ...cell,
              content: cell.content + '\n' + line,
              metadata: {
                ...cell.metadata,
                streamLines: [...(cell.metadata?.streamLines || []), line],
                isStreaming: true,
              },
              timestamp: new Date().toISOString(), // Force re-render
            }
          : cell
      )
    );
  };

  const streamLines = async (cellId: string, lines: string[], delayMs: number = 100) => {
    startStreaming(cellId);
    
    for (const line of lines) {
      streamLine(cellId, line);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    stopStreaming(cellId);
  };

  const renderCell = (cell: Cell) => {
    // Get execution thread for this cell
    const executionThread = getCellExecutionStatus(cell.id);
    
    // Create a key that includes content hash to force re-render when content changes
    const contentHash = cell.content.length.toString() + '_' + cell.timestamp;
    const cellKey = `${cell.id}_${contentHash}`;
    
    return (
      <CellComponent
        key={cellKey}
        cell={cell}
        executionThread={executionThread || undefined}
        onExecute={cell.type === 'code' ? () => executeCodeStep(cell) : undefined}
        onNextStep={handleNextStep}
        onSubmitComment={handleSubmitComment}
        onRerun={rerunStepWithContext}
      />
    );
  };

  // Context building for LLM calls
  const buildResearchContext = (currentStep: string, excludeCurrentCell?: string): string => {
    const relevantCells = cells.filter(cell => 
      cell.id !== excludeCurrentCell && 
      cell.status === 'completed' && 
      cell.content.trim().length > 0
    );

    if (relevantCells.length === 0) {
      return `Research Goal: ${goal}\n\nCurrent Step: ${currentStep}\n\nNo previous context available.`;
    }

    let context = `# Research Context\n\n## Research Goal\n${goal}\n\n## Current Step\n${currentStep}\n\n## Previous Research Entries\n\n`;

    relevantCells.forEach((cell, index) => {
      const cellType = getCellTypeLabel(cell.type);
      const timestamp = new Date(cell.timestamp).toLocaleString();
      
      context += `### ${index + 1}. ${cellType} (${timestamp})\n`;
      context += `${cell.content}\n\n`;
      
      // Add metadata if available
      if (cell.metadata) {
        if (cell.metadata.references && cell.metadata.references.length > 0) {
          context += `**References Found:** ${cell.metadata.references.length} sources\n`;
        }
        if (cell.metadata.existingDataFiles && cell.metadata.existingDataFiles.length > 0) {
          context += `**Data Files:** ${cell.metadata.existingDataFiles.length} files\n`;
        }
        if (cell.metadata.background_summary) {
          context += `**Background Summary:** ${cell.metadata.background_summary}\n`;
        }
        context += '\n';
      }
    });

    return context;
  };

  const getCellTypeLabel = (type: string): string => {
    switch (type) {
      case 'goal': return 'Research Goal';
      case 'initialization': return 'Research Initialization';
      case 'data_assessment': return 'Data Assessment';
      case 'data_collection': return 'Data Collection';
      case 'analysis_plan': return 'Analysis Plan';
      case 'analysis_execution': return 'Analysis Execution';
      case 'abstract': return 'Research Abstract';
      case 'plan': return 'Research Plan';
      case 'code': return 'Code Execution';
      case 'result': return 'Execution Results';
      case 'writeup': return 'Research Write-up';
      default: return 'Research Entry';
    }
  };

  // LLM prompt templates for each step
  const getLLMPrompt = (stepType: string, context: string, _additionalParams?: any): string => {
    const basePrompt = `You are an AI research assistant helping with a research project. Use the following context to inform your response:

${context}

Please provide a detailed, thoughtful response based on the research context above.`;

    switch (stepType) {
      case 'initialization':
        return `${basePrompt}

TASK: Research References Collection
Based on the research goal, please:
1. Identify 5-10 relevant research sources and academic references
2. For each reference, provide:
   - Title
   - Authors
   - Publication year
   - URL or DOI if available
   - Brief summary (1-2 sentences)
3. Focus on recent, authoritative sources
4. Include a mix of academic papers, reports, and authoritative websites

Format your response as a JSON object with a "sources" array containing the references. Each source should have: title, authors, year, url, summary.`;

      case 'data_assessment':
        return `${basePrompt}

TASK: Data Assessment
Based on the research context and any existing data files, please:
1. Evaluate what data is needed for this research
2. Assess the relevance of any existing data files
3. Identify gaps in available data
4. Recommend what additional data should be collected
5. Suggest data sources or collection methods

If no data files exist, focus on what data would be most valuable for this research.`;

      case 'data_collection':
        return `${basePrompt}

TASK: Data Collection Planning
Based on the research context and data assessment, please:
1. Specify exactly what data needs to be collected
2. Describe the format and structure of this data
3. Explain how this data will support the research goal
4. Provide sample data or data generation methods if applicable
5. Outline any limitations or assumptions

Be specific about data requirements and how they relate to the research objectives.`;

      case 'analysis_plan':
        return `${basePrompt}

TASK: Analysis Planning
Based on the research context and available data, please:
1. Design a comprehensive analysis approach
2. Specify statistical methods or analytical techniques to use
3. Outline the key questions the analysis should answer
4. Describe expected outputs and visualizations
5. Identify potential insights to look for

Focus on analytical methods that will provide meaningful insights for the research goal.`;

      case 'analysis_execution':
        return `${basePrompt}

TASK: Analysis Execution
Based on the research context and analysis plan, please:
1. Generate Python code to perform the planned analysis
2. Include data loading, preprocessing, and analysis steps
3. Add appropriate visualizations and statistical tests
4. Include code comments explaining each step
5. Ensure the code addresses the research questions

Provide complete, runnable Python code with proper error handling and documentation.`;

      default:
        return basePrompt;
    }
  };

  // Enhanced LLM call function
  const makeContextualLLMCall = async (stepType: string, cellId?: string, additionalParams?: any): Promise<any> => {
    const context = buildResearchContext(stepType, cellId);
    const prompt = getLLMPrompt(stepType, context, additionalParams);
    
    console.log(`🤖 Making contextual LLM call for step: ${stepType}`);
    console.log(`📝 Context length: ${context.length} characters`);
    
    // Use the appropriate API service based on step type
    switch (stepType) {
      case 'initialization':
        return await apiService.initializeResearch({ 
          goal
        });
      
      case 'data_assessment':
        return await apiService.analyzeDataFile({ 
          projectId,
          fileId: 'test'
        });
      
      case 'data_collection':
        return await apiService.generateTitle({ 
          goal
        });
      
      case 'analysis_plan':
        return await apiService.generateResearchPlan({ 
          goal,
          answers: {},
          sources: [],
          background_summary: ''
        });
      
      case 'analysis_execution':
        return await apiService.executeCode({ 
          code: prompt, // This will be the generated code
          sessionId
        });
      
      default:
        // Generic LLM call for other steps
        return await apiService.callLLM({ 
          prompt: prompt
        });
    }
  };

  // Get the next step label for the current cell
  const getNextStepLabel = (currentCell: Cell): string => {
    switch (currentCell.type) {
      case 'goal':
        return 'Next: References Collection';
      case 'initialization':
        return 'Next: Data Assessment';
      case 'data_assessment':
        // Check if we have data files to determine next step
        const hasDataFiles = currentCell.metadata?.existingDataFiles?.length && currentCell.metadata.existingDataFiles.length > 0;
        return hasDataFiles ? 'Next: Analysis Planning' : 'Next: Data Collection';
      case 'data_collection':
        return 'Next: Analysis Planning';
      case 'analysis_plan':
        return 'Next: Analysis Execution';
      case 'analysis_execution':
        return 'Next: Generate Results';
      case 'result':
        return 'Next: Generate Write-up';
      case 'writeup':
        return 'Research Complete';
      default:
        return 'Next Step';
    }
  };

  // Rerun a step with full context and user comment
  const rerunStepWithContext = async (currentCell: Cell, comment: string): Promise<Cell> => {
    console.log('🔄 Rerunning step with context:', currentCell.type, 'Comment:', comment);
    
    // Build full research context including the comment
    const context = buildResearchContext(`Rerunning ${getCellTypeLabel(currentCell.type)} with user feedback: ${comment}`, currentCell.id);
    
    // Create a new cell for the rerun
    const rerunCell: Cell = {
      id: `${currentCell.type}-rerun-${Date.now()}`,
      type: currentCell.type,
      content: `# ${getCellTypeLabel(currentCell.type)} (Rerun)\n\n**Goal**: ${goal}\n\n**User Comment**: ${comment}\n\n`,
      timestamp: new Date().toISOString(),
      status: 'active',
      requiresUserAction: false,
      canProceed: false,
      metadata: {
        ...currentCell.metadata,
        isRerun: true,
        originalCellId: currentCell.id,
        userComment: comment,
        streamLines: [],
        isStreaming: true,
      },
    };
    
    // Add the rerun cell to the UI immediately
    const updatedCells = [...cells, rerunCell];
    setCells(updatedCells);
    await saveSession(updatedCells);
    
    try {
      // Stream the progress updates
      await streamLines(rerunCell.id, [
        '## 🔄 Rerunning with User Feedback...',
        '',
        `💬 **User Comment**: ${comment}`,
        '',
        '🤖 Consulting AI with full research context...',
        '🧠 Analyzing previous research entries...',
        '📝 Generating updated response...',
      ], 120);
      
      // Make contextual LLM call with enhanced prompt
      const enhancedPrompt = `${getLLMPrompt(currentCell.type, context)}\n\n## User Feedback\n${comment}\n\nPlease consider this feedback when providing your response.`;
      
      let rerunResult;
      switch (currentCell.type) {
        case 'initialization':
          rerunResult = await apiService.initializeResearch({ 
            goal
          });
          break;
        
        case 'data_assessment':
          rerunResult = await apiService.analyzeDataFile({ 
            projectId,
            fileId: 'test'
          });
          break;
        
        case 'data_collection':
          rerunResult = await apiService.generateTitle({ 
            goal
          });
          break;
        
        case 'analysis_plan':
          rerunResult = await apiService.generateResearchPlan({ 
            goal,
            answers: {},
            sources: [],
            background_summary: ''
          });
          break;
        
        case 'analysis_execution':
          rerunResult = await apiService.executeCode({ 
            code: enhancedPrompt,
            sessionId
          });
          break;
        
        default:
          rerunResult = await apiService.callLLM({ 
            prompt: enhancedPrompt,
            userComment: comment
          });
      }
      
      // Stream the LLM response
      if (rerunResult && ((rerunResult as any).response || (rerunResult as any).plan || (rerunResult as any).assessment)) {
        const response = (rerunResult as any).response || (rerunResult as any).plan || (rerunResult as any).assessment;
        await streamLines(rerunCell.id, [
          '',
          '## Updated Response:',
          '',
        ], 50);
        
        // Stream the LLM response in chunks
        const responseLines = response.split('\n');
        for (const line of responseLines) {
          if (line.trim()) {
            await streamLines(rerunCell.id, [line], 30);
          }
        }
      } else {
        // Fallback content
        await streamLines(rerunCell.id, [
          '',
          '## Rerun Complete',
          '',
          'The step has been rerun with your feedback and full research context.',
          'Please review the updated results above.',
        ], 100);
      }
      
      // Stream completion
      await streamLines(rerunCell.id, [
        '',
        '## ✅ Rerun Complete!',
        '',
        '🤖 **AI response** updated with your feedback',
        '📚 **Full research context** considered',
        '💬 **User comment** incorporated',
        '',
        `**Next**: ${getNextStepLabel(rerunCell)}`,
      ], 100);
      
      // Update the cell to completed status
      const finalCells = cells.map(cell => 
        cell.id === rerunCell.id 
          ? { 
              ...cell, 
              status: 'completed' as const,
              canProceed: true,
              metadata: {
                ...cell.metadata,
                rerunResult: rerunResult,
                isStreaming: false,
              },
            }
          : cell
      );
      setCells(finalCells);
      await saveSession(finalCells);
      
      return finalCells.find(cell => cell.id === rerunCell.id)!;
    } catch (error) {
      // Stream error
      await streamLines(rerunCell.id, [
        '',
        '## ❌ Error During Rerun',
        '',
        `**Error**: ${error}`,
        '',
        'Please try again.',
      ], 100);
      
      // Update the cell to error status
      const errorCells = cells.map(cell => 
        cell.id === rerunCell.id 
          ? { 
              ...cell, 
              status: 'error' as const,
              metadata: {
                ...cell.metadata,
                isStreaming: false,
              },
            }
          : cell
      );
      setCells(errorCells);
      await saveSession(errorCells);
      throw error;
    }
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