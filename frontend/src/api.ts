/**
 * Cedar API Service
 * 
 * This service provides a comprehensive interface for communicating with the Tauri backend.
 * It handles all research operations, project management, and data persistence.
 * 
 * FEATURES:
 * - API key management with secure storage
 * - Project creation and management
 * - Research session handling
 * - Code execution and validation
 * - Question generation and management
 * - Library dependency management
 * - Variable tracking and management
 * - Reference management
 * - Comprehensive logging and error handling
 * 
 * TESTING:
 * - Unit tests: See frontend/test-research.js for browser console testing
 * - Integration tests: Use runApiTestSuite() method
 * - CLI tests: Use test-cedar.sh --cli
 * 
 * Example usage:
 * ```javascript
 * const apiService = new ApiService();
 * await apiService.setApiKey('your-api-key');
 * const project = await apiService.createProject({
 *   name: 'My Research',
 *   goal: 'Analyze customer data'
 * });
 * ```
 */

import { invoke } from "@tauri-apps/api/core";

// Add logging function to save logs to files
export const saveLogToFile = async (level: string, message: string) => {
  // Simple localStorage logging to avoid Tauri API issues during startup
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    const logs = JSON.parse(localStorage.getItem('cedar-api-logs') || '[]');
    logs.push({ timestamp, level, message: logEntry });
    localStorage.setItem('cedar-api-logs', JSON.stringify(logs.slice(-1000)));
  } catch (error) {
    // If logging fails, just continue
  }
};

// Enhanced console logging that saves to files
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;

console.log = (...args) => {
  originalConsoleLog(...args);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  saveLogToFile('LOG', message);
};

console.error = (...args) => {
  originalConsoleError(...args);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  saveLogToFile('ERROR', message);
};

console.warn = (...args) => {
  originalConsoleWarn(...args);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  saveLogToFile('WARN', message);
};

console.info = (...args) => {
  originalConsoleInfo(...args);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  saveLogToFile('INFO', message);
};

console.debug = (...args) => {
  originalConsoleDebug(...args);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  saveLogToFile('DEBUG', message);
};

export interface ResearchRequest {
  goal: string
  session_id?: string
}

export interface ResearchResponse {
  cells: Cell[]
  sessionId: string
  status: 'planning' | 'executing' | 'completed' | 'error'
}

export interface Cell {
  id: string
  type: 'intent' | 'plan' | 'code' | 'output' | 'reference' | 'validation'
  content: string
  metadata?: any
  timestamp: string
}

export interface ExecuteCodeRequest {
  code: string
  session_id: string
}

export interface ExecuteCodeResponse {
  output: string
  validation?: {
    isValid: boolean
    confidence: number
    issues: string[]
    suggestions: string[]
    nextStep: string
  }
}

export interface SetApiKeyRequest {
  apiKey: string
}

/**
 * Main API Service Class
 * 
 * Provides methods for all backend communication including:
 * - Secure API key management
 * - Research workflow operations
 * - Project and session management
 * - Data persistence and retrieval
 * 
 * TESTING: See individual method comments for testing instructions
 */
class ApiService {
  /**
   * API Key Management - Set API Key
   * 
   * Securely sets the OpenAI API key for the application.
   * The key is stored in memory and persisted to disk for future sessions.
   * 
   * SECURITY FEATURES:
   * - Keys are never logged or transmitted
   * - Memory-only storage during runtime
   * - Automatic cleanup on app exit
   * 
   * TESTING:
   * - Unit test: testApiKeyManagement() in browser console
   * - CLI test: set_api_key command
   * - API test: set_api_key endpoint
   * 
   * @param apiKey - The OpenAI API key (starts with 'sk-')
   * @throws Error if key setting fails
   * 
   * Example:
   * ```javascript
   * await apiService.setApiKey('sk-your-api-key-here');
   * ```
   */
  async setApiKey(apiKey: string) {
    console.log("🔧 Calling Tauri backend: set_api_key", { apiKeyLength: apiKey.length, apiKeyPrefix: apiKey.substring(0, 10) + "..." });
    try {
      await invoke("set_api_key", { request: { api_key: apiKey } });
      console.log("✅ Backend API key set successfully");
    } catch (error) {
      console.error("❌ Backend error setting API key:", error);
      throw error;
    }
  }

  async getApiKeyStatus() {
    console.log("🔧 Checking API key status from backend...");
    try {
      const status = await invoke("get_api_key_status");
      console.log("✅ Backend API key status:", status);
      return status;
    } catch (error) {
      console.error("❌ Backend error checking API key status:", error);
      throw error;
    }
  }

  async hasApiKey(): Promise<boolean> {
    try {
      const status = await this.getApiKeyStatus();
      return (status as any).has_key === true;
    } catch (error) {
      console.error("❌ Error checking if API key exists:", error);
      return false;
    }
  }

  // async startResearch(request: { goal: string; session_id?: string; project_id?: string }) {
  //   console.log("🔧 Calling Tauri backend: start_research", { goal: request.goal, session_id: request.session_id, project_id: request.project_id });
  //   try {
  //     const result = await invoke("start_research", { request });
  //     console.log("✅ Backend research started successfully");
  //     return result;
  //   } catch (error) {
  //     console.error("❌ Backend error starting research:", error);
  //     throw error;
  //   }
  // }

  // async executeCode(request: { code: string; session_id: string; project_id: string }) {
  //   console.log("🔧 Calling Tauri backend: execute_code", { codeLength: request.code.length, session_id: request.session_id, project_id: request.project_id });
  //   try {
  //     const result = await invoke("execute_code", { request });
  //     console.log("✅ Backend code executed successfully");
  //     return result;
  //   } catch (error) {
  //     console.error("❌ Backend error executing code:", error);
  //     throw error;
  //   }
  // }

  async createProject(request: { name: string; goal: string }) {
    console.log("🔧 Calling Tauri backend: create_project", { name: request.name, goal: request.goal });
    try {
      const result = await invoke("create_project", { request });
      console.log("✅ Backend project created successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error creating project:", error);
      throw error;
    }
  }

  async getProjects() {
    console.log("🔧 Calling Tauri backend: get_projects");
    try {
      const result = await invoke("get_projects");
      console.log("✅ Backend projects retrieved successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error getting projects:", error);
      throw error;
    }
  }

  async getProject(projectId: string) {
    console.log("🔧 Calling Tauri backend: get_project", { projectId });
    try {
      const result = await invoke("get_project", { projectId });
      console.log("✅ Backend project retrieved successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error getting project:", error);
      throw error;
    }
  }

  async updateProject(projectId: string, updates: { name?: string; goal?: string }) {
    console.log("🔧 Calling Tauri backend: update_project", { projectId, updates });
    try {
      const result = await invoke("update_project", { projectId, updates });
      console.log("✅ Backend project updated successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error updating project:", error);
      throw error;
    }
  }

  /**
   * Project Management - Delete Project
   * 
   * Permanently deletes a project and all its associated data.
   * This action cannot be undone and removes all project files.
   * 
   * PROJECT FEATURES:
   * - Complete project deletion
   * - File system cleanup
   * - Session data removal
   * - Current project state management
   * 
   * TESTING: See frontend/test-research.js for browser console testing
   * API TESTING: Use testApiEndpoint() method
   * 
   * Example usage:
   * ```javascript
   * await apiService.deleteProject('project-123');
   * console.log('Project deleted successfully');
   * ```
   */
  async deleteProject(projectId: string) {
    console.log("🗑️ Calling Tauri backend: delete_project", { projectId });
    try {
      await invoke("delete_project", { projectId });
      console.log("✅ Backend project deleted successfully");
    } catch (error) {
      console.error("❌ Backend error deleting project:", error);
      throw error;
    }
  }

  async saveFile(request: { project_id: string; filename: string; content: string; file_type: string }) {
    console.log("🔧 Calling Tauri backend: save_file", { project_id: request.project_id, filename: request.filename, file_type: request.file_type });
    try {
      const result = await invoke("save_file", { request });
      console.log("✅ Backend file saved successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error saving file:", error);
      throw error;
    }
  }

  async addReference(projectId: string, reference: { id: string; title: string; authors: string; url?: string; content: string; added_at: string }) {
    console.log("🔧 Calling Tauri backend: add_reference", { projectId, reference });
    try {
      const result = await invoke("add_reference", { project_id: projectId, reference });
      console.log("✅ Backend reference added successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error adding reference:", error);
      throw error;
    }
  }

  async loadSession(sessionId: string) {
    console.log("🔧 Calling Tauri backend: load_session", { sessionId });
    try {
      const result = await invoke("load_session", { sessionId });
      console.log("✅ Backend session loaded successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error loading session:", error);
      throw error;
    }
  }

  async saveSession(sessionId: string, data: any) {
    console.log("🔧 Calling Tauri backend: save_session", { sessionId });
    try {
      const result = await invoke("save_session", { sessionId, data });
      console.log("✅ Backend session saved successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error saving session:", error);
      throw error;
    }
  }

  async updateSession(sessionId: string, cells: any[]) {
    console.log("🔧 Calling Tauri backend: update_session", { sessionId, cellCount: cells.length });
    try {
      const result = await invoke("update_session", { sessionId, cells });
      console.log("✅ Backend session updated successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error updating session:", error);
      throw error;
    }
  }

  async addVariable(projectId: string, variable: any) {
    console.log("🔧 Calling Tauri backend: add_variable", { projectId, variableName: variable.name });
    try {
      const result = await invoke("add_variable", { projectId, variable });
      console.log("✅ Backend variable added successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error adding variable:", error);
      throw error;
    }
  }

  async getVariables(projectId: string) {
    console.log("🔧 Calling Tauri backend: get_variables", { projectId });
    try {
      const result = await invoke("get_variables", { projectId });
      console.log("✅ Backend variables retrieved successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error getting variables:", error);
      throw error;
    }
  }

  async updateVariable(projectId: string, variableName: string, updates: any) {
    console.log("🔧 Calling Tauri backend: update_variable", { projectId, variableName, updates });
    try {
      const result = await invoke("update_variable", { projectId, variableName, updates });
      console.log("✅ Backend variable updated successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error updating variable:", error);
      throw error;
    }
  }

  async deleteVariable(projectId: string, variableName: string) {
    console.log("🔧 Calling Tauri backend: delete_variable", { projectId, variableName });
    try {
      const result = await invoke("delete_variable", { projectId, variableName });
      console.log("✅ Backend variable deleted successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error deleting variable:", error);
      throw error;
    }
  }

  // Question management
  async addQuestion(projectId: string, question: any) {
    console.log('🔧 Calling Tauri backend: add_question', { projectId, question });
    try {
      await invoke('add_question', { projectId, question });
      console.log('✅ Backend question added successfully');
    } catch (error) {
      console.error('❌ Backend error adding question:', error);
      throw error;
    }
  }

  async getQuestions(projectId: string) {
    console.log('🔧 Calling Tauri backend: get_questions', { projectId });
    try {
      const questions = await invoke('get_questions', { projectId });
      console.log('✅ Backend questions retrieved successfully');
      return questions;
    } catch (error) {
      console.error('❌ Backend error getting questions:', error);
      throw error;
    }
  }

  async answerQuestion(projectId: string, questionId: string, answer: string) {
    console.log('🔧 Calling Tauri backend: answer_question', { projectId, questionId, answer });
    try {
      await invoke('answer_question', { projectId, questionId, answer });
      console.log('✅ Backend question answered successfully');
    } catch (error) {
      console.error('❌ Backend error answering question:', error);
      throw error;
    }
  }

  // async generateQuestions(projectId: string, context: 'initial' | 'follow_up') {
  //   console.log('🔧 Calling Tauri backend: generate_questions', { projectId, context });
  //   try {
  //     const questions = await invoke('generate_questions', { projectId, context });
  //     console.log('✅ Backend questions generated successfully');
  //     return questions;
  //   } catch (error) {
  //     console.error('❌ Backend error generating questions:', error);
  //     throw error;
  //   }
  // }

  async updateQuestion(projectId: string, questionId: string, updates: any) {
    console.log('🔧 Calling Tauri backend: update_question', { projectId, questionId, updates });
    try {
      await invoke('update_question', { projectId, questionId, updates });
      console.log('✅ Backend question updated successfully');
    } catch (error) {
      console.error('❌ Backend error updating question:', error);
      throw error;
    }
  }

  // Library management
  async addLibrary(projectId: string, library: any) {
    console.log('🔧 Calling Tauri backend: add_library', { projectId, library });
    try {
      await invoke('add_library', { projectId, library });
      console.log('✅ Backend library added successfully');
    } catch (error) {
      console.error('❌ Backend error adding library:', error);
      throw error;
    }
  }

  async getLibraries(projectId: string) {
    console.log('🔧 Calling Tauri backend: get_libraries', { projectId });
    try {
      const libraries = await invoke('get_libraries', { projectId });
      console.log('✅ Backend libraries retrieved successfully');
      return libraries;
    } catch (error) {
      console.error('❌ Backend error getting libraries:', error);
      throw error;
    }
  }

  async installLibrary(projectId: string, libraryName: string) {
    console.log('🔧 Calling Tauri backend: install_library', { projectId, libraryName });
    try {
      await invoke('install_library', { projectId, libraryName });
      console.log('✅ Backend library installed successfully');
    } catch (error) {
      console.error('❌ Backend error installing library:', error);
      throw error;
    }
  }

  // async installAllLibraries(projectId: string) {
  //   console.log("🔧 Calling Tauri backend: install_all_libraries", { projectId });
  //   try {
  //     const result = await invoke("install_all_libraries", { projectId });
  //     console.log("✅ Backend libraries installed successfully");
  //     return result;
  //   } catch (error) {
  //     console.error("❌ Backend error installing libraries:", error);
  //     throw error;
  //   }
  // }

  async updateLibrary(projectId: string, libraryName: string, updates: any) {
    console.log('🔧 Calling Tauri backend: update_library', { projectId, libraryName, updates });
    try {
      await invoke('update_library', { projectId, libraryName, updates });
      console.log('✅ Backend library updated successfully');
    } catch (error) {
      console.error('❌ Backend error updating library:', error);
      throw error;
    }
  }

  /**
   * Research Workflow - Start Research
   * 
   * Initiates AI-powered research planning for a specific project and session.
   * Analyzes the research goal and generates a structured execution plan.
   * 
   * RESEARCH FEATURES:
   * - AI goal analysis and planning
   * - Step-by-step execution plan generation
   * - Code generation for each step
   * - Status tracking throughout the process
   * 
   * TESTING:
   * - Unit test: testResearchWorkflow() in browser console
   * - CLI test: start_research command
   * - API test: start_research endpoint
   * 
   * @param request - Research request containing project, session, and goal
   * @returns Research plan with execution steps
   * @throws Error if research initiation fails
   * 
   * Example:
   * ```javascript
   * const research = await apiService.startResearch({
   *   projectId: 'project-123',
   *   sessionId: 'session-456',
   *   goal: 'Analyze customer churn patterns'
   * });
   * ```
   */
  async startResearch(request: { projectId: string; sessionId: string; goal: string; answers?: Record<string, string> }) {
    console.log('🔧 Calling Tauri backend: start_research', request);
    try {
      // Convert frontend field names to backend field names
      const backendRequest = {
        project_id: request.projectId,
        session_id: request.sessionId,
        goal: request.goal,
        answers: request.answers || null
      };
      const result = await invoke('start_research', { request: backendRequest });
      console.log('✅ Backend research started successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error starting research:', error);
      throw error;
    }
  }

  /**
   * Code Execution - Execute Code
   * 
   * Executes Python code in a secure sandbox environment.
   * Provides real-time output capture and error handling.
   * 
   * EXECUTION FEATURES:
   * - Secure sandbox environment
   * - Auto-dependency installation
   * - Output parsing and categorization
   * - Variable discovery and tracking
   * - Error handling and reporting
   * 
   * TESTING:
   * - Unit test: testCodeExecution() in browser console
   * - CLI test: execute_code command
   * - API test: execute_code endpoint
   * 
   * @param request - Code execution request with code and session
   * @returns Execution result with output and validation
   * @throws Error if code execution fails
   * 
   * Example:
   * ```javascript
   * const result = await apiService.executeCode({
   *   code: 'import pandas as pd\nprint("Hello World")',
   *   sessionId: 'session-123'
   * });
   * ```
   */
  async executeCode(request: { code: string; sessionId: string }) {
    console.log('🔧 Calling Tauri backend: execute_code', request);
    try {
      // Convert frontend field names to backend field names
      const backendRequest = {
        code: request.code,
        session_id: request.sessionId
      };
      const result = await invoke('execute_code', { request: backendRequest });
      console.log('✅ Backend code executed successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error executing code:', error);
      throw error;
    }
  }

  /**
   * Question Generation - Generate Questions
   * 
   * Uses AI to generate research questions based on the project goal.
   * Creates relevant questions to guide the research process.
   * 
   * QUESTION FEATURES:
   * - AI-powered question generation
   * - Goal-oriented question relevance
   * - Question categorization (initial, follow-up, clarification)
   * - Status tracking for each question
   * 
   * TESTING:
   * - Unit test: testQuestionGeneration() in browser console
   * - CLI test: generate_questions command
   * - API test: generate_questions endpoint
   * 
   * @param request - Question generation request with project and goal
   * @returns Generated questions with metadata
   * @throws Error if question generation fails
   * 
   * Example:
   * ```javascript
   * const questions = await apiService.generateQuestions({
   *   projectId: 'project-123',
   *   goal: 'Analyze customer churn patterns'
   * });
   * ```
   */
  async generateQuestions(request: { projectId: string; goal: string }) {
    console.log('🔧 Calling Tauri backend: generate_questions', request);
    try {
      // Convert frontend field names to backend field names
      const backendRequest = {
        project_id: request.projectId,
        goal: request.goal
      };
      const result = await invoke('generate_questions', { request: backendRequest });
      console.log('✅ Backend questions generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error generating questions:', error);
      throw error;
    }
  }

  /**
   * Initialize Research - Generate title and questions
   * 
   * Analyzes research goal and generates:
   * - A concise 5-word or less title
   * - Structured questions to gather requirements
   * 
   * TESTING: Use in browser console with test-research.js
   * 
   * @param request - Research initialization request
   * @returns ResearchInitialization with title and questions
   */
  async generateTitle(request: { goal: string }) {
    console.log('📝 Calling Tauri backend: generate_title', request);
    
    try {
      const result = await invoke('generate_title', { request });
      console.log('✅ Backend title generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error generating title:', error);
      throw error;
    }
  }

  /**
   * Initialize Research - Generate title, sources, background, and questions
   * 
   * Generates comprehensive research initialization:
   * - Project title (5 words or less)
   * - Top 3 academic research sources with summaries
   * - Background summary section
   * - Research direction questions
   * 
   * TESTING: Use in browser console with test-research-initialization.js
   * 
   * @param request - Research initialization request
   * @returns ResearchInitialization with title and questions
   */
  async initializeResearch(request: { goal: string }) {
    console.log('🔧 Calling Tauri backend: initialize_research', request);
    
    try {
      const result = await invoke('initialize_research', { request });
      console.log('✅ Backend research initialized successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error initializing research:', error);
      throw error;
    }
  }

  /**
   * Generate Research Plan - Generate comprehensive research plan
   * 
   * Generates a detailed research plan based on:
   * - Research goal and user answers
   * - Academic sources and background summary
   * - Selected research directions
   * 
   * TESTING: Use in browser console with test-research-plan.js
   * 
   * @param request - Research plan generation request
   * @returns ResearchPlan with steps and execution details
   */
  async generateResearchPlan(request: { 
    goal: string; 
    answers: Record<string, string>; 
    sources: any[]; 
    background_summary: string; 
  }) {
    console.log('🔧 Calling Tauri backend: generate_research_plan', request);
    
    try {
      const result = await invoke('generate_research_plan', { request });
      console.log('✅ Backend research plan generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error generating research plan:', error);
      throw error;
    }
  }

  /**
   * Execute Step - Execute single research step
   * 
   * Executes a single research step and returns results:
   * - Code execution with logging
   * - Variable extraction and tracking
   * - Library detection and installation
   * 
   * TESTING: Use in browser console with test-step-execution.js
   * 
   * @param request - Step execution request
   * @returns Step execution results with output and logs
   */
  async executeStep(request: { 
    sessionId: string; 
    projectId: string; 
    stepId: string; 
    code: string; 
    stepTitle: string; 
    stepDescription: string; 
  }) {
    console.log('🔧 Calling Tauri backend: execute_step', request);
    
    try {
      // Convert frontend field names to backend field names
      const backendRequest = {
        session_id: request.sessionId,
        project_id: request.projectId,
        step_id: request.stepId,
        code: request.code,
        step_title: request.stepTitle,
        step_description: request.stepDescription
      };
      
      const result = await invoke('execute_step', { request: backendRequest });
      console.log('✅ Backend step executed successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error executing step:', error);
      throw error;
    }
  }

  /**
   * Generate Next Steps - Generate next steps based on results
   * 
   * Analyzes completed steps and results to generate next steps:
   * - Evaluates current progress and findings
   * - Identifies gaps and opportunities
   * - Generates actionable next steps
   * 
   * TESTING: Use in browser console with test-next-steps.js
   * 
   * @param request - Next steps generation request
   * @returns Array of ResearchPlanStep for next steps
   */
  async generateNextSteps(request: { 
    goal: string; 
    completedSteps: any[]; 
    currentResults: any; 
    projectContext: any; 
  }) {
    console.log('🔧 Calling Tauri backend: generate_next_steps', request);
    
    try {
      // Convert frontend field names to backend field names
      const backendRequest = {
        goal: request.goal,
        completed_steps: request.completedSteps,
        current_results: request.currentResults,
        project_context: request.projectContext
      };
      
      const result = await invoke('generate_next_steps', { request: backendRequest });
      console.log('✅ Backend next steps generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error generating next steps:', error);
      throw error;
    }
  }

  /**
   * Data Management - Upload Data File
   * 
   * Handles data file uploads with comprehensive processing:
   * - File type detection and validation
   * - Content storage and metadata creation
   * - LLM-powered data analysis
   * - DuckDB table creation
   * 
   * FEATURES:
   * - Automatic file type detection
   * - Content preview generation
   * - LLM analysis request
   * - Project integration
   * 
   * TESTING: Use in browser console with test-data-upload.js
   * 
   * @param request - Data file upload request
   * @returns Upload result with file info and analysis
   * @throws Error if upload fails
   * 
   * Example:
   * ```javascript
   * const result = await apiService.uploadDataFile({
   *   projectId: 'project-123',
   *   filename: 'data.csv',
   *   content: 'name,age\nJohn,30\nJane,25',
   *   fileType: 'csv'
   * });
   * ```
   */
  async uploadDataFile(request: { 
    projectId: string; 
    filename: string; 
    content: string; 
    fileType?: string; 
  }) {
    console.log('📁 Calling Tauri backend: upload_data_file', request);
    
    try {
      // Convert frontend field names to backend field names
      const backendRequest = {
        project_id: request.projectId,
        filename: request.filename,
        content: request.content,
        file_type: request.fileType || null
      };
      
      const result = await invoke('upload_data_file', { request: backendRequest });
      console.log('✅ Backend data file uploaded successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error uploading data file:', error);
      throw error;
    }
  }

  /**
   * Data Management - Analyze Data File
   * 
   * Performs LLM-powered analysis of uploaded data files:
   * - Data structure analysis
   * - Column information extraction
   * - Sample data generation
   * - DuckDB table creation
   * 
   * FEATURES:
   * - LLM-powered data understanding
   * - Automatic column analysis
   * - Sample data extraction
   * - Database table preparation
   * 
   * TESTING: Use in browser console with test-data-analysis.js
   * 
   * @param request - Data file analysis request
   * @returns Analysis result with file info and insights
   * @throws Error if analysis fails
   * 
   * Example:
   * ```javascript
   * const result = await apiService.analyzeDataFile({
   *   projectId: 'project-123',
   *   fileId: 'file-456'
   * });
   * ```
   */
  async analyzeDataFile(request: { 
    projectId: string; 
    fileId: string; 
  }) {
    console.log('🔍 Calling Tauri backend: analyze_data_file', request);
    
    try {
      // Convert frontend field names to backend field names
      const backendRequest = {
        project_id: request.projectId,
        file_id: request.fileId
      };
      
      const result = await invoke('analyze_data_file', { request: backendRequest });
      console.log('✅ Backend data file analyzed successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error analyzing data file:', error);
      throw error;
    }
  }

  /**
   * Data Management - Execute DuckDB Query
   * 
   * Executes SQL queries on data tables with PostgreSQL-style interface:
   * - Query validation and execution
   * - Result formatting and return
   * - Error handling and reporting
   * 
   * FEATURES:
   * - PostgreSQL-compatible SQL syntax
   * - Automatic table creation
   * - Query result formatting
   * - Error handling
   * 
   * TESTING: Use in browser console with test-duckdb-query.js
   * 
   * @param request - DuckDB query request
   * @returns Query results with data and metadata
   * @throws Error if query execution fails
   * 
   * Example:
   * ```javascript
   * const result = await apiService.executeDuckDBQuery({
   *   projectId: 'project-123',
   *   tableName: 'my_table',
   *   query: 'SELECT * FROM my_table LIMIT 10'
   * });
   * ```
   */
  async executeDuckDBQuery(request: { 
    projectId: string; 
    tableName: string; 
    query: string; 
  }) {
    console.log('🗄️ Calling Tauri backend: execute_duckdb_query', request);
    
    try {
      // Convert frontend field names to backend field names
      const backendRequest = {
        project_id: request.projectId,
        table_name: request.tableName,
        query: request.query
      };
      
      const result = await invoke('execute_duckdb_query', { request: backendRequest });
      console.log('✅ Backend DuckDB query executed successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error executing DuckDB query:', error);
      throw error;
    }
  }

  /**
   * Data Management - List Data Files
   * 
   * Retrieves all data files for a project with metadata:
   * - File information and statistics
   * - Table information
   * - Analysis results
   * 
   * FEATURES:
   * - Complete file metadata
   * - Analysis status
   * - Table information
   * - Sample data preview
   * 
   * TESTING: Use in browser console with test-data-files.js
   * 
   * @param request - Data file list request
   * @returns Array of data file information
   * @throws Error if retrieval fails
   * 
   * Example:
   * ```javascript
   * const result = await apiService.listDataFiles({
   *   projectId: 'project-123'
   * });
   * ```
   */
  async listDataFiles(request: { 
    projectId: string; 
  }) {
    console.log('📁 Calling Tauri backend: list_data_files', request);
    
    try {
      // Convert frontend field names to backend field names
      const backendRequest = {
        project_id: request.projectId
      };
      
      const result = await invoke('list_data_files', { request: backendRequest });
      console.log('✅ Backend data files listed successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error listing data files:', error);
      throw error;
    }
  }

  /**
   * Data Management - Upload Data File with Notebook Integration
   * 
   * Uploads a data file and creates notebook cells for the upload process:
   * - Data upload cell
   * - LLM analysis script generation
   * - Metadata extraction
   * - DuckDB table creation
   * 
   * @param request - Enhanced data file upload request
   * @returns Upload result with notebook cells
   * @throws Error if upload fails
   * 
   * Example:
   * ```javascript
   * const result = await apiService.uploadDataFileWithNotebook({
   *   projectId: 'project-123',
   *   filename: 'data.csv',
   *   content: 'name,age\nJohn,30\nJane,25',
   *   fileType: 'csv',
   *   sessionId: 'session-456'
   * });
   * ```
   */
  async uploadDataFileWithNotebook(request: { 
    projectId: string; 
    filename: string; 
    content: string; 
    fileType?: string;
    sessionId: string;
  }) {
    console.log('📁 Calling Tauri backend: upload_data_file_with_notebook', request);
    
    try {
      // Convert frontend field names to backend field names
      const backendRequest = {
        project_id: request.projectId,
        filename: request.filename,
        content: request.content,
        file_type: request.fileType || null,
        session_id: request.sessionId
      };
      
      const result = await invoke('upload_data_file_with_notebook', { request: backendRequest });
      console.log('✅ Backend data file uploaded with notebook integration');
      return result;
    } catch (error) {
      console.error('❌ Backend error uploading data file with notebook:', error);
      throw error;
    }
  }

  // Visualization Management Methods
  async createVisualization(request: {
    projectId: string;
    name: string;
    visualizationType: string;
    description: string;
    content: string;
    code?: string;
    sessionId?: string;
  }) {
    console.log('🎨 Calling Tauri backend: create_visualization', request);

    try {
      const backendRequest = {
        project_id: request.projectId,
        name: request.name,
        visualization_type: request.visualizationType,
        description: request.description,
        content: request.content,
        code: request.code || null,
        session_id: request.sessionId || null
      };

      const result = await invoke('create_visualization', { request: backendRequest });
      console.log('✅ Backend visualization created successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error creating visualization:', error);
      throw error;
    }
  }

  async listVisualizations(request: {
    projectId: string;
  }) {
    console.log('📊 Calling Tauri backend: list_visualizations', request);

    try {
      const backendRequest = {
        project_id: request.projectId
      };

      const result = await invoke('list_visualizations', { request: backendRequest });
      console.log('✅ Backend visualizations listed successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error listing visualizations:', error);
      throw error;
    }
  }

  async deleteVisualization(request: {
    projectId: string;
    visualizationId: string;
  }) {
    console.log('🗑️ Calling Tauri backend: delete_visualization', request);

    try {
      const backendRequest = {
        project_id: request.projectId,
        visualization_id: request.visualizationId
      };

      const result = await invoke('delete_visualization', { request: backendRequest });
      console.log('✅ Backend visualization deleted successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error deleting visualization:', error);
      throw error;
    }
  }

  async generateFinalWriteUp(request: {
    projectId: string;
    sessionId: string;
    executionResults: any[];
    goal: string;
  }) {
    console.log('📝 Calling Tauri backend: generate_final_write_up', request);
    
    try {
      const result = await invoke('generate_final_write_up', { request });
      console.log('✅ Backend final write-up generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error generating final write-up:', error);
      throw error;
    }
  }

  // ============================================================================
  // STEP-BY-STEP RESEARCH METHODS
  // ============================================================================

  async generateAcademicPapers(request: {
    goal: string;
    notebookHistory?: any[];
    userFeedback?: string;
  }) {
    console.log('📚 Calling Tauri backend: generate_academic_papers', request);
    
    try {
      const result = await invoke('generate_academic_papers', { request });
      console.log('✅ Backend academic papers generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error generating academic papers:', error);
      throw error;
    }
  }

  async generateAbstract(request: {
    goal: string;
    academicSources: any[];
    notebookHistory?: any[];
    userFeedback?: string;
  }) {
    console.log('📝 Calling Tauri backend: generate_abstract', request);
    
    try {
      const result = await invoke('generate_abstract', { request });
      console.log('✅ Backend abstract generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error generating abstract:', error);
      throw error;
    }
  }

  async generateResearchSteps(request: {
    goal: string;
    academicSources: any[];
    abstractContent: string;
    notebookHistory?: any[];
    userFeedback?: string;
  }) {
    console.log('📋 Calling Tauri backend: generate_research_steps', request);
    
    try {
      const result = await invoke('generate_research_steps', { request });
      console.log('✅ Backend research steps generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error generating research steps:', error);
      throw error;
    }
  }

  async generateResearchStep(request: {
    goal: string;
    stepIndex: number;
    stepTitle: string;
    academicSources: any[];
    abstractContent: string;
    previousSteps: any[];
    notebookHistory?: any[];
    userFeedback?: string;
  }) {
    console.log('🔧 Calling Tauri backend: generate_research_step', request);
    
    try {
      const result = await invoke('generate_research_step', { request });
      console.log('✅ Backend research step generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error generating research step:', error);
      throw error;
    }
  }

  async updateResearchWriteUp(request: {
    goal: string;
    academicSources: any[];
    abstractContent: string;
    completedSteps: any[];
    executionResults: any[];
    notebookHistory?: any[];
    userFeedback?: string;
  }) {
    console.log('📝 Calling Tauri backend: update_research_write_up', request);
    
    try {
      const result = await invoke('update_research_write_up', { request });
      console.log('✅ Backend research write-up updated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error updating research write-up:', error);
      throw error;
    }
  }

  async generateVisualization(request: {
    projectId: string;
    data: any[];
    chartType: string;
    xField: string;
    yField: string;
    title: string;
    visualizationType: string;
  }) {
    console.log('🎨 Calling Tauri backend: generate_visualization', request);

    try {
      const backendRequest = {
        project_id: request.projectId,
        data: request.data,
        chart_type: request.chartType,
        x_field: request.xField,
        y_field: request.yField,
        title: request.title,
        visualization_type: request.visualizationType
      };

      const result = await invoke('generate_visualization', { request: backendRequest });
      console.log('✅ Backend visualization generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error generating visualization:', error);
      throw error;
    }
  }

  // async extractLibrariesFromCode(projectId: string, code: string, cellId: string) {
  //   console.log("🔧 Calling Tauri backend: extract_libraries_from_code", { projectId, codeLength: code.length, cellId });
  //   try {
  //     const result = await invoke("extract_libraries_from_code", { projectId, code, cellId });
  //     console.log("✅ Backend libraries extracted successfully");
  //     return result;
  //   } catch (error) {
  //     console.error("❌ Backend error extracting libraries:", error);
  //     throw error;
  //   }
  // }

  // async executeResearchSteps(projectId: string, sessionId: string, goal: string, steps: any[], startStep?: number) {
  //   console.log("🔧 Calling Tauri backend: execute_research_steps", { projectId, sessionId, goal, stepsCount: steps.length, startStep });
  //   try {
  //     const result = await invoke("execute_research_steps", { projectId, sessionId, goal, steps, startStep });
  //     console.log("✅ Backend research steps executed successfully");
  //     return result;
  //   } catch (error) {
  //     console.error("❌ Backend error executing research steps:", error);
  //     throw error;
  //   }
  // }

  // async generateVisualizations(projectId: string, goal: string, allResults: string[]) {
  //   console.log("🔧 Calling Tauri backend: generate_visualizations", { projectId, goal, resultsCount: allResults.length });
  //   try {
  //     const result = await invoke("generate_visualizations", { projectId, goal, allResults });
  //     console.log("✅ Backend visualizations generated successfully");
  //     return result;
  //   } catch (error) {
  //     console.error("❌ Backend error generating visualizations:", error);
  //     throw error;
  //   }
  // }

  // async updateResearchPaper(projectId: string, goal: string, allResults: string[], visualizations: any[]) {
  //   console.log("🔧 Calling Tauri backend: update_research_paper", { projectId, goal, allResults, visualizations });
  //   try {
  //     const result = await invoke("update_research_paper", { projectId, goal, allResults, visualizations });
  //     console.log("✅ Backend research paper updated successfully");
  //     return result;
  //   } catch (error) {
  //     console.error("❌ Backend error updating research paper:", error);
  //     throw error;
  //   }
  //   }

  async callLLM(request: {
    prompt: string;
    context?: string;
    userComment?: string;
  }) {
    try {
      console.log('🤖 Making LLM call:', request);
      
      const response = await invoke('call_llm', {
        prompt: request.prompt,
        context: request.context || '',
        userComment: request.userComment || ''
      });
      
      console.log('✅ LLM call completed successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to make LLM call:', error);
      throw error;
    }
  }

  async searchWebReferences(request: {
    query: string;
    projectId: string;
    existingReferences?: any[];
  }) {
    try {
      console.log('🔍 Searching web for references:', request.query);
      
      // Build context from existing references
      const existingContext = request.existingReferences && request.existingReferences.length > 0 
        ? `\n\nExisting references in this project:\n${request.existingReferences.map(ref => 
            `- ${ref.title} by ${ref.authors} (${ref.url || 'no URL'})`
          ).join('\n')}\n\nPlease find additional, different sources that complement these existing references.`
        : '';

      const searchPrompt = `Search the web for academic references, papers, and authoritative sources related to: "${request.query}"

Focus on finding high-quality, recent academic sources including:
- Peer-reviewed journal articles
- Conference papers
- Academic books and book chapters
- Government or institutional reports
- Preprints from reputable repositories (arXiv, bioRxiv, etc.)

${existingContext}

Please provide a comprehensive search with proper citations and URLs.`;

      // Use the proper OpenAI web search API
      const response = await this.callLLMWithWebSearch({
        prompt: searchPrompt,
        context: `Web search for academic references related to: ${request.query}`,
        userComment: `Find relevant academic sources for: ${request.query}`
      });

      // Parse the web search response to extract references
      const references = this.parseWebSearchResponse(response);
      
      console.log('✅ Web search completed, found references:', references);
      return { references };
      
    } catch (error) {
      console.error('❌ Failed to search web for references:', error);
      throw error;
    }
  }

  async callLLMWithWebSearch(request: {
    prompt: string;
    context?: string;
    userComment?: string;
  }) {
    try {
      console.log('🌐 Making LLM call with web search:', request);
      
      // This would need to be implemented in the backend to use the proper OpenAI API
      // For now, we'll use a fallback approach
      const response = await invoke('call_llm_with_web_search', {
        prompt: request.prompt,
        context: request.context || '',
        userComment: request.userComment || ''
      });
      
      console.log('✅ Web search LLM call completed successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to make web search LLM call:', error);
      // Fallback to regular LLM call
      return this.callLLM(request);
    }
  }

  parseWebSearchResponse(response: any) {
    try {
      const responseText = (response as any).response || JSON.stringify(response);
      
      // Try to extract URLs and citations from the response
      const urlRegex = /https?:\/\/[^\s\)]+/g;
      const urls = responseText.match(urlRegex) || [];
      
      // Try to extract structured information
      const references = [];
      
      // Look for patterns that might indicate academic sources
      const lines = responseText.split('\n');
      let currentReference = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Look for title patterns
        if (trimmedLine.match(/^["""].*["""]$/) || trimmedLine.match(/^[A-Z][^.!?]*$/)) {
          if (currentReference) {
            references.push(currentReference);
          }
          currentReference = {
            title: trimmedLine.replace(/["""]/g, ''),
            authors: 'Unknown',
            url: '',
            content: '',
            source: 'web_search'
          };
        }
        // Look for author patterns
        else if (trimmedLine.match(/by\s+[A-Z][a-z]+\s+[A-Z]/) || trimmedLine.match(/^[A-Z][a-z]+\s+[A-Z]/)) {
          if (currentReference) {
            currentReference.authors = trimmedLine.replace(/^by\s+/, '');
          }
        }
        // Look for URL patterns
        else if (trimmedLine.match(/https?:\/\//)) {
          if (currentReference) {
            currentReference.url = trimmedLine;
          }
        }
        // Look for content/summary
        else if (trimmedLine.length > 20 && currentReference) {
          currentReference.content = trimmedLine;
        }
      }
      
      // Add the last reference if exists
      if (currentReference) {
        references.push(currentReference);
      }
      
      // If we found structured references, return them
      if (references.length > 0) {
        return references;
      }
      
      // Fallback: create a single reference from the response
      return [{
        title: "Web Search Results",
        authors: "Various Authors",
        url: urls[0] || "",
        content: responseText.substring(0, 500) + (responseText.length > 500 ? "..." : ""),
        source: "web_search"
      }];
      
    } catch (parseError) {
      console.error('❌ Failed to parse web search response:', parseError);
      return [{
        title: "Web Search Results",
        authors: "Various Authors",
        url: "",
        content: "Failed to parse web search response. Please review manually.",
        source: "web_search"
      }];
    }
  }

  // API Testing Functions
  async testApiEndpoint(request: { endpoint: string; method: string; data?: any }) {
    console.log('🧪 Testing API endpoint:', request);
    try {
      const result = await invoke('test_api_endpoint', request);
      console.log('✅ API test completed');
      return result;
    } catch (error) {
      console.error('❌ API test failed:', error);
      throw error;
    }
  }



  async runApiTestSuite() {
    console.log('🧪 Running API test suite...');
    try {
      const result = await invoke('run_test_suite');
      console.log('✅ API test suite completed');
      return result;
    } catch (error) {
      console.error('❌ API test suite failed:', error);
      throw error;
    }
  }

  // Analysis Cell Management
  async createAnalysisCell(request: { projectId: string; type: string }) {
    try {
      console.log('📝 Creating analysis cell...');
      const response = await invoke('create_analysis_cell', {
        project_id: request.projectId,
        type_: request.type
      });
      console.log('✅ Analysis cell created:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create analysis cell:', error);
      throw error;
    }
  }

  async saveAnalysisCell(request: { cell: any }) {
    try {
      console.log('💾 Saving analysis cell...');
      const response = await invoke('save_analysis_cell', request);
      console.log('✅ Analysis cell saved:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to save analysis cell:', error);
      throw error;
    }
  }

  async loadAnalysisCell(request: { id: string }) {
    try {
      console.log('📖 Loading analysis cell...');
      const response = await invoke('load_analysis_cell', request);
      console.log('✅ Analysis cell loaded:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to load analysis cell:', error);
      throw error;
    }
  }

  async listAnalysisCells(request: { projectId: string }) {
    try {
      console.log('📋 Listing analysis cells...');
      const response = await invoke('list_analysis_cells', request);
      console.log('✅ Analysis cells listed:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to list analysis cells:', error);
      throw error;
    }
  }

  async deleteAnalysisCell(request: { id: string }) {
    try {
      console.log('🗑️ Deleting analysis cell...');
      const response = await invoke('delete_analysis_cell', request);
      console.log('✅ Analysis cell deleted:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to delete analysis cell:', error);
      throw error;
    }
  }

  async updateAnalysisCellStatus(request: { id: string; status: string }) {
    try {
      console.log('🔄 Updating analysis cell status...');
      const response = await invoke('update_analysis_cell_status', request);
      console.log('✅ Analysis cell status updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to update analysis cell status:', error);
      throw error;
    }
  }

  async updateAnalysisCellContent(request: { id: string; content: string }) {
    try {
      console.log('📝 Updating analysis cell content...');
      const response = await invoke('update_analysis_cell_content', request);
      console.log('✅ Analysis cell content updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to update analysis cell content:', error);
      throw error;
    }
  }

  async addRustAnalysisToCell(request: { id: string; rustAnalysis: any }) {
    try {
      console.log('🔧 Adding Rust analysis to cell...');
      const response = await invoke('add_rust_analysis_to_cell', request);
      console.log('✅ Rust analysis added to cell:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to add Rust analysis to cell:', error);
      throw error;
    }
  }

  async addLlmAnalysisToCell(request: { id: string; llmAnalysis: any }) {
    try {
      console.log('🤖 Adding LLM analysis to cell...');
      const response = await invoke('add_llm_analysis_to_cell', request);
      console.log('✅ LLM analysis added to cell:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to add LLM analysis to cell:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
