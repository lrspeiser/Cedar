// API service for communicating with the Tauri backend

import { invoke } from "@tauri-apps/api/core";

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

  async startResearch(request: { goal: string; session_id?: string; project_id?: string }) {
    console.log("🔧 Calling Tauri backend: start_research", { goal: request.goal, session_id: request.session_id, project_id: request.project_id });
    try {
      const result = await invoke("start_research", { request });
      console.log("✅ Backend research started successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error starting research:", error);
      throw error;
    }
  }

  async executeCode(request: { code: string; session_id: string; project_id: string }) {
    console.log("🔧 Calling Tauri backend: execute_code", { codeLength: request.code.length, session_id: request.session_id, project_id: request.project_id });
    try {
      const result = await invoke("execute_code", { request });
      console.log("✅ Backend code executed successfully");
      return result;
    } catch (error) {
      console.error("❌ Backend error executing code:", error);
      throw error;
    }
  }

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
}

export const apiService = new ApiService();
