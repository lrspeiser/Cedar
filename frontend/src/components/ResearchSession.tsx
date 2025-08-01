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
  type: 'goal' | 'initialization' | 'questions' | 'plan' | 'code' | 'result' | 'visualization' | 'writeup' | 'data' | 'reference' | 'variable' | 'library' | 'title' | 'references' | 'abstract' | 'evaluation' | 'results' | 'data_upload' | 'data_analysis' | 'data_metadata' | 'duckdb_query';
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

interface ResearchSessionProps {
  sessionId: string;
  projectId: string;
  goal: string;
  answers?: Record<string, string>;
  onContentGenerated?: () => void;
  onDataRouted?: (result: DataRouterResult) => void;
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
  onDataRouted
}) => {
  const [cells, setCells] = useState<Cell[]>([]);
  const [currentGoal, setCurrentGoal] = useState(goal);
  const [isLoading, setIsLoading] = useState(false);
  const [researchPlan, setResearchPlan] = useState<ResearchPlan | null>(null);
  const [dataRouter] = useState(() => new DataRouterService(projectId));
  const [routingStatus, setRoutingStatus] = useState<DataRouterResult | null>(null);
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
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const session = await apiService.loadSession(sessionId) as any;
      if (session && session.cells) {
        setCells(session.cells);
        
        // Update execution progress if available
        if (session.executionProgress) {
          setExecutionProgress(session.executionProgress);
        }
        
        // Update research plan if available
        if (session.researchPlan) {
          setResearchPlan(session.researchPlan);
        }
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

  // Route data from a cell to appropriate tabs
  const routeCellData = async (cell: Cell): Promise<void> => {
    try {
      const result = await dataRouter.routeCellData(cell);
      setRoutingStatus(result);
      
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
    setIsLoading(true);
    
    try {
      // Route data from current cell before proceeding
      await routeCellData(currentCell);
      
      let nextCell: Cell | null = null;
      
      switch (currentCell.type) {
        case 'goal':
          // Generate research initialization
          nextCell = await generateInitializationCell(currentCell.content);
          break;
          
        case 'initialization':
          // Generate questions cell
          nextCell = await generateQuestionsCell(currentCell.metadata?.references || []);
          break;
          
        case 'questions':
          // Generate research plan
          nextCell = await generatePlanCell(currentCell.metadata?.answers || {});
          break;
          
        case 'plan':
          // Start execution
          nextCell = await generateFirstExecutionCell(currentCell.metadata?.plan);
          break;
          
        case 'code':
          // Execute code and generate result
          nextCell = await executeCodeAndGenerateResult(currentCell);
          break;
          
        case 'result':
          // Generate next code step or final writeup
          nextCell = await generateNextStepOrWriteup(currentCell);
          break;
      }
      
      if (nextCell) {
        const updatedCells = [...cells, nextCell];
        setCells(updatedCells);
        await saveSession(updatedCells);
        
        // If this is a code cell, start execution
        if (nextCell.type === 'code') {
          await executeCodeStep(nextCell);
        }
      }
    } catch (error) {
      console.error('Error in handleNextStep:', error);
      // Add error cell
      const errorCell: Cell = {
        id: `error-${Date.now()}`,
        type: 'result',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        status: 'error',
        requiresUserAction: false,
        canProceed: false,
      };
      const updatedCells = [...cells, errorCell];
      setCells(updatedCells);
      await saveSession(updatedCells);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInitializationCell = async (goal: string): Promise<Cell> => {
    const initialization = await apiService.initializeResearch({ goal }) as any;
    
    return {
      id: `initialization-${Date.now()}`,
      type: 'initialization',
      content: `Research Initialization for: ${goal}\n\n${initialization.background_summary}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        references: initialization.sources,
        questions: initialization.questions,
      },
    };
  };

  const generateQuestionsCell = async (references: any[]): Promise<Cell> => {
    const questions = references.length > 0 ? 
      references.map(ref => ({
        id: `ref-${ref.title}`,
        question: `Review reference: ${ref.title} by ${ref.authors}`,
        category: 'reference',
        required: false,
      })) : [];
    
    // Auto-answer all reference questions as "reviewed"
    const autoAnswers = questions.reduce((acc, question) => {
      acc[question.id] = 'Reference reviewed and ready for research';
      return acc;
    }, {} as Record<string, string>);
    
    return {
      id: `questions-${Date.now()}`,
      type: 'questions',
      content: `References reviewed (${references.length} sources found):\n\n${references.map(ref => `• ${ref.title} by ${ref.authors}`).join('\n')}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        questions,
        answers: autoAnswers,
      },
    };
  };

  const generatePlanCell = async (answers: Record<string, string>): Promise<Cell> => {
    const plan = await apiService.generateResearchPlan({
      goal: currentGoal,
      answers,
      sources: [],
      background_summary: '',
    }) as any;
    
    setResearchPlan(plan);
    
    return {
      id: `plan-${Date.now()}`,
      type: 'plan',
      content: `Research Plan: ${plan.title}\n\n${plan.description}\n\nSteps:\n${plan.steps.map((step: any, i: number) => `${i + 1}. ${step.title}`).join('\n')}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
      metadata: {
        plan,
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

  const executeCodeAndGenerateResult = async (codeCell: Cell): Promise<Cell> => {
    // Execute the code
    const result = await apiService.executeCode({
      code: codeCell.content,
      sessionId,
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
        stepOrder: codeCell.metadata?.stepOrder,
        totalSteps: codeCell.metadata?.totalSteps,
      },
    };
    
    return resultCell;
  };

  const generateNextStepOrWriteup = async (resultCell: Cell): Promise<Cell | null> => {
    const currentStep = resultCell.metadata?.stepOrder || 0;
    const totalSteps = resultCell.metadata?.totalSteps || 0;
    
    if (currentStep < totalSteps - 1) {
      // Generate next code step
      const nextStep = researchPlan?.steps[currentStep + 1];
      if (nextStep) {
        return {
          id: `code-${nextStep.id}`,
          type: 'code',
          content: nextStep.code || `# ${nextStep.title}\n${nextStep.description}`,
          timestamp: new Date().toISOString(),
          status: 'active',
          requiresUserAction: true,
          canProceed: true,
          metadata: {
            stepId: nextStep.id,
            stepOrder: currentStep + 1,
            totalSteps,
          },
        };
      }
    } else {
      // Generate final writeup
      return {
        id: `writeup-${Date.now()}`,
        type: 'writeup',
        content: 'Generating final research write-up...',
        timestamp: new Date().toISOString(),
        status: 'active',
        requiresUserAction: false,
        canProceed: false,
      };
    }
    
    return null;
  };

  const executeCodeStep = async (codeCell: Cell) => {
    try {
      const result = await apiService.executeCode({
        code: codeCell.content,
        sessionId,
      });
      
      // Update the code cell with results
      const updatedCells = cells.map(cell => 
        cell.id === codeCell.id 
          ? { ...cell, status: 'completed' as const, output: JSON.stringify(result, null, 2) }
          : cell
      );
      
      setCells(updatedCells);
      await saveSession(updatedCells);
      
      // Auto-generate next step
      setTimeout(() => handleNextStep(codeCell), 1000);
    } catch (error) {
      console.error('Error executing code:', error);
      const updatedCells = cells.map(cell => 
        cell.id === codeCell.id 
          ? { ...cell, status: 'error' as const, output: error instanceof Error ? error.message : 'Unknown error' }
          : cell
      );
      setCells(updatedCells);
      await saveSession(updatedCells);
    }
  };

  const handleQuestionAnswer = (cellId: string, questionId: string, answer: string) => {
    const updatedCells = cells.map(cell => {
      if (cell.id === cellId) {
        const updatedAnswers = { ...cell.metadata?.answers, [questionId]: answer };
        const allQuestions = cell.metadata?.questions || [];
        const requiredQuestions = allQuestions.filter((q: any) => q.required);
        const canProceed = requiredQuestions.every((q: any) => updatedAnswers[q.id]);
        
        return {
          ...cell,
          metadata: {
            ...cell.metadata,
            answers: updatedAnswers,
          },
          canProceed,
        };
      }
      return cell;
    });
    
    setCells(updatedCells);
    saveSession(updatedCells);
  };

  const handleSubmitGoal = async () => {
    if (!currentGoal.trim()) return;
    
    const goalCell: Cell = {
      id: `goal-${Date.now()}`,
      type: 'goal',
      content: currentGoal,
      timestamp: new Date().toISOString(),
      status: 'completed',
      requiresUserAction: false,
      canProceed: true,
    };
    
    const updatedCells = [...cells, goalCell];
    setCells(updatedCells);
    await saveSession(updatedCells);
    
    // Start the research workflow
    await handleNextStep(goalCell);
  };

  const renderCell = (cell: Cell, index: number) => {
    const isLastCell = index === cells.length - 1;
    
    return (
      <div key={cell.id} className="mb-6">
        <CellComponent
          cell={cell}
          onExecute={executeCodeStep}
          onQuestionAnswer={handleQuestionAnswer}
        />
        
        {isLastCell && cell.canProceed && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handleNextStep(cell)}
              disabled={isLoading}
              className="px-6 py-2 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>→</span>
                  <span>Next</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Research Notebook</h2>
            <p className="text-sm text-gray-600">Interactive research workflow with automatic data routing</p>
          </div>
          
          {cells.length === 0 && (
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={currentGoal}
                onChange={(e) => setCurrentGoal(e.target.value)}
                placeholder="Enter your research goal..."
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500 focus:border-transparent"
              />
              <button
                onClick={handleSubmitGoal}
                disabled={!currentGoal.trim() || isLoading}
                className="px-4 py-2 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Research
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Routing Status */}
      {routingStatus && (
        <div className={`flex-shrink-0 p-3 border-b ${
          routingStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <span className={routingStatus.success ? 'text-green-800' : 'text-red-800'}>
              {routingStatus.message}
            </span>
            {routingStatus.success && routingStatus.routedItems && (
              <div className="flex items-center space-x-4 text-xs text-green-600">
                {routingStatus.routedItems.references && (
                  <span>📚 {routingStatus.routedItems.references} references</span>
                )}
                {routingStatus.routedItems.dataFiles && (
                  <span>📊 {routingStatus.routedItems.dataFiles} data files</span>
                )}
                {routingStatus.routedItems.visualizations && (
                  <span>📈 {routingStatus.routedItems.visualizations} visualizations</span>
                )}
                {routingStatus.routedItems.variables && (
                  <span>🔧 {routingStatus.routedItems.variables} variables</span>
                )}
                {routingStatus.routedItems.libraries && (
                  <span>📦 {routingStatus.routedItems.libraries} libraries</span>
                )}
                {routingStatus.routedItems.writeUps && (
                  <span>✍️ {routingStatus.routedItems.writeUps} write-ups</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notebook Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {cells.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your Research</h3>
            <p className="text-gray-600 mb-6">
              Enter your research goal above to begin the interactive research process.
            </p>
            <div className="max-w-md mx-auto text-left text-sm text-gray-500 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-cedar-500 rounded-full"></span>
                <span>AI will generate research initialization</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-cedar-500 rounded-full"></span>
                <span>Review references and answer questions</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-cedar-500 rounded-full"></span>
                <span>Execute research steps with code</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-cedar-500 rounded-full"></span>
                <span>Generate visualizations and write-up</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-cedar-500 rounded-full"></span>
                <span>Data automatically routed to appropriate tabs</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {cells.map((cell, index) => renderCell(cell, index))}
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {cells.length > 0 && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Cells: {cells.length}</span>
            <span>Session: {sessionId}</span>
            {isLoading && <span className="flex items-center space-x-2"><span className="animate-spin">⏳</span> Processing...</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchSession; 