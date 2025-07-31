// API service for communicating with the Tauri backend

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

class ApiService {
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

  async startResearch(request: { projectId: string; sessionId: string; goal: string }) {
    console.log('🔧 Calling Tauri backend: start_research', request);
    try {
      const result = await invoke('start_research', request);
      console.log('✅ Backend research started successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error starting research:', error);
      throw error;
    }
  }

  async executeCode(request: { code: string; sessionId: string }) {
    console.log('🔧 Calling Tauri backend: execute_code', request);
    try {
      const result = await invoke('execute_code', request);
      console.log('✅ Backend code executed successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error executing code:', error);
      throw error;
    }
  }

  async generateQuestions(request: { projectId: string; goal: string }) {
    console.log('🔧 Calling Tauri backend: generate_questions', request);
    try {
      const result = await invoke('generate_questions', request);
      console.log('✅ Backend questions generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Backend error generating questions:', error);
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
  // }

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
}

export const apiService = new ApiService();
