// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::State;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::collections::HashMap;
use cedar::{agent, cell, context, executor, output_parser, deps};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
struct AppState {
  sessions: Mutex<HashMap<String, serde_json::Value>>,
  api_key: Mutex<Option<String>>,
  projects: Mutex<HashMap<String, Project>>,
  current_project: Mutex<Option<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Project {
    id: String,
    name: String,
    goal: String,
    created_at: String,
    updated_at: String,
    data_files: Vec<String>,
    images: Vec<String>,
    references: Vec<Reference>,
    write_up: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Reference {
    id: String,
    title: String,
    authors: String,
    url: Option<String>,
    content: String,
    added_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ResearchRequest {
    goal: String,
    session_id: Option<String>,
    project_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ExecuteCodeRequest {
    code: String,
    session_id: String,
    project_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SetApiKeyRequest {
    api_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CreateProjectRequest {
    name: String,
    goal: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SaveFileRequest {
    project_id: String,
    filename: String,
    content: String,
    file_type: String, // "data", "image", "reference", "write_up"
}

// File storage functions
fn get_app_data_dir() -> PathBuf {
    let mut path = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("Cedar");
    fs::create_dir_all(&path).ok();
    path
}

fn get_project_dir(project_id: &str) -> PathBuf {
    let mut path = get_app_data_dir();
    path.push("projects");
    path.push(project_id);
    fs::create_dir_all(&path).ok();
    path
}

fn get_api_key_path() -> PathBuf {
    let mut path = get_app_data_dir();
    path.push("api_key.txt");
    path
}

fn save_api_key(api_key: &str) -> Result<(), String> {
    let path = get_api_key_path();
    fs::write(path, api_key).map_err(|e| format!("Failed to save API key: {}", e))
}

fn load_api_key() -> Result<Option<String>, String> {
    let path = get_api_key_path();
    if path.exists() {
        fs::read_to_string(path)
            .map(Some)
            .map_err(|e| format!("Failed to load API key: {}", e))
    } else {
        Ok(None)
    }
}

fn save_project(project: &Project) -> Result<(), String> {
    let project_dir = get_project_dir(&project.id);
    let project_file = project_dir.join("project.json");
    
    let json = serde_json::to_string_pretty(project)
        .map_err(|e| format!("Failed to serialize project: {}", e))?;
    
    fs::write(project_file, json)
        .map_err(|e| format!("Failed to save project: {}", e))
}

fn load_projects() -> Result<HashMap<String, Project>, String> {
    let mut projects = HashMap::new();
    let projects_dir = get_app_data_dir().join("projects");
    
    if !projects_dir.exists() {
        return Ok(projects);
    }
    
    for entry in fs::read_dir(projects_dir)
        .map_err(|e| format!("Failed to read projects directory: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read project entry: {}", e))?;
        let project_dir = entry.path();
        
        if project_dir.is_dir() {
            let project_file = project_dir.join("project.json");
            if project_file.exists() {
                let content = fs::read_to_string(&project_file)
                    .map_err(|e| format!("Failed to read project file: {}", e))?;
                let project: Project = serde_json::from_str(&content)
                    .map_err(|e| format!("Failed to parse project: {}", e))?;
                projects.insert(project.id.clone(), project);
            }
        }
    }
    
    Ok(projects)
}

fn get_sessions_dir() -> PathBuf {
    get_app_data_dir().join("sessions")
}

fn save_session_to_disk(session_id: &str, data: &serde_json::Value) -> Result<(), String> {
    let sessions_dir = get_sessions_dir();
    if !sessions_dir.exists() {
        fs::create_dir_all(&sessions_dir)
            .map_err(|e| format!("Failed to create sessions directory: {}", e))?;
    }
    
    let session_file = sessions_dir.join(format!("{}.json", session_id));
    let json = serde_json::to_string_pretty(data)
        .map_err(|e| format!("Failed to serialize session: {}", e))?;
    
    fs::write(session_file, json)
        .map_err(|e| format!("Failed to save session: {}", e))
}

fn load_session_from_disk(session_id: &str) -> Result<Option<serde_json::Value>, String> {
    let sessions_dir = get_sessions_dir();
    let session_file = sessions_dir.join(format!("{}.json", session_id));
    
    if !session_file.exists() {
        return Ok(None);
    }
    
    let content = fs::read_to_string(session_file)
        .map_err(|e| format!("Failed to read session file: {}", e))?;
    
    let session: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse session: {}", e))?;
    
    Ok(Some(session))
}

/// Helper function to save file without being a Tauri command
async fn save_file_helper(
    request: SaveFileRequest,
    state: &State<'_, AppState>,
) -> Result<(), String> {
    println!("💾 Backend: Saving file: {} to project: {}", request.filename, request.project_id);
    
    // Get project from state
    let mut projects_guard = state.projects.lock().unwrap();
    let project = projects_guard.get_mut(&request.project_id)
        .ok_or_else(|| format!("Project not found: {}", request.project_id))?;
    
    // Update project based on file type
    match request.file_type.as_str() {
        "data" => {
            if !project.data_files.contains(&request.filename) {
                project.data_files.push(request.filename.clone());
            }
        },
        "image" => {
            if !project.images.contains(&request.filename) {
                project.images.push(request.filename.clone());
            }
        },
        "write_up" => {
            project.write_up = request.content.clone();
        },
        _ => {}
    }
    
    // Save project to file
    save_project(project)?;
    
    // Save file content to disk
    let project_dir = get_project_dir(&request.project_id);
    let file_path = project_dir.join(&request.filename);
    
    fs::write(file_path, request.content)
        .map_err(|e| format!("Failed to save file: {}", e))?;
    
    println!("✅ Backend: File saved successfully");
    Ok(())
}

/// Helper function to add reference without being a Tauri command
async fn add_reference_helper(
    project_id: String,
    reference: Reference,
    state: &State<'_, AppState>,
) -> Result<(), String> {
    println!("📚 Backend: Adding reference to project: {}", project_id);
    
    // Get project from state
    let mut projects_guard = state.projects.lock().unwrap();
    let project = projects_guard.get_mut(&project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;
    
    // Add reference to project
    project.references.push(reference.clone());
    
    // Save project to file
    save_project(project)?;
    
    println!("✅ Backend: Reference added successfully");
    Ok(())
}

/// Automatically categorize code execution output into project tabs
async fn categorize_code_output(
    code: &str,
    output: &str,
    project_id: &str,
    state: &State<'_, AppState>,
) -> Result<(), String> {
    println!("🔍 Backend: Categorizing code output into project tabs");
    
    // Check if code generates data files
    if code.contains("pd.read_csv") || code.contains("pd.read_excel") || 
       code.contains("save") || code.contains("to_csv") || code.contains("DataFrame") {
        let data_content = format!("Code Output:\n\n```python\n{}\n```\n\nOutput:\n{}\n", code, output);
        save_file_helper(SaveFileRequest {
            project_id: project_id.to_string(),
            filename: format!("data_output_{}.txt", chrono::Utc::now().timestamp()),
            content: data_content,
            file_type: "data".to_string(),
        }, state).await?;
        println!("📊 Backend: Added data output to project");
    }
    
    // Check if code generates images
    if code.contains("plt.savefig") || code.contains("matplotlib") || 
       code.contains("seaborn") || code.contains("plot") || code.contains("figure") {
        let image_content = format!("Image Generation Code:\n\n```python\n{}\n```\n\nOutput:\n{}\n", code, output);
        save_file_helper(SaveFileRequest {
            project_id: project_id.to_string(),
            filename: format!("image_output_{}.txt", chrono::Utc::now().timestamp()),
            content: image_content,
            file_type: "image".to_string(),
        }, state).await?;
        println!("🖼️ Backend: Added image output to project");
    }
    
    // Check if output contains significant findings for write-up
    if output.len() > 100 && (output.contains("mean") || output.contains("result") || 
                              output.contains("analysis") || output.contains("finding")) {
        let write_up_content = format!("Code Execution Results:\n\n```python\n{}\n```\n\nFindings:\n{}\n\n---\n", code, output);
        save_file_helper(SaveFileRequest {
            project_id: project_id.to_string(),
            filename: "code_findings.txt".to_string(),
            content: write_up_content,
            file_type: "write_up".to_string(),
        }, state).await?;
        println!("📝 Backend: Added code findings to write-up");
    }
    
    Ok(())
}

/// Automatically categorize AI-generated content into project tabs
async fn categorize_content_to_tabs(
    cells: &[cell::NotebookCell],
    project_id: &str,
    state: &State<'_, AppState>,
) -> Result<(), String> {
    println!("🔍 Backend: Categorizing content into project tabs");
    
    for cell in cells {
        match cell.cell_type {
            cell::CellType::Reference => {
                // Extract reference data and add to References tab
                if let Ok(reference_data) = serde_json::from_str::<cell::ReferenceData>(&cell.content) {
                    let reference = Reference {
                        id: cell.id.clone(),
                        title: reference_data.title,
                        authors: reference_data.authors.unwrap_or_default().join(", "),
                        url: reference_data.url,
                        content: reference_data.relevance.unwrap_or_default(),
                        added_at: chrono::Utc::now().to_rfc3339(),
                    };
                    
                    add_reference_helper(project_id.to_string(), reference.clone(), state).await?;
                    println!("📚 Backend: Added reference to project: {}", reference.title);
                }
            },
            cell::CellType::Code => {
                // Check if code generates data files or images
                if cell.content.contains("pd.read_csv") || cell.content.contains("pd.read_excel") || 
                   cell.content.contains("save") || cell.content.contains("to_csv") {
                    // This might generate data files
                    let data_content = format!("Code that may generate data:\n\n```python\n{}\n```", cell.content);
                    save_file_helper(SaveFileRequest {
                        project_id: project_id.to_string(),
                        filename: format!("data_from_code_{}.txt", cell.id),
                        content: data_content,
                        file_type: "data".to_string(),
                    }, state).await?;
                    println!("📊 Backend: Added potential data file to project");
                }
                
                if cell.content.contains("plt.savefig") || cell.content.contains("matplotlib") || 
                   cell.content.contains("seaborn") || cell.content.contains("plot") {
                    // This might generate images
                    let image_content = format!("Code that may generate images:\n\n```python\n{}\n```", cell.content);
                    save_file_helper(SaveFileRequest {
                        project_id: project_id.to_string(),
                        filename: format!("image_code_{}.txt", cell.id),
                        content: image_content,
                        file_type: "image".to_string(),
                    }, state).await?;
                    println!("🖼️ Backend: Added potential image code to project");
                }
            },
            cell::CellType::Output => {
                // Check if output contains data or insights for write-up
                if cell.content.len() > 100 {
                    // This might be significant output worth adding to write-up
                    let write_up_content = format!("Research Output:\n\n{}\n\n---\n", cell.content);
                    save_file_helper(SaveFileRequest {
                        project_id: project_id.to_string(),
                        filename: "research_findings.txt".to_string(),
                        content: write_up_content,
                        file_type: "write_up".to_string(),
                    }, state).await?;
                    println!("📝 Backend: Added research output to write-up");
                }
            },
            _ => {}
        }
    }
    
    Ok(())
}

#[tauri::command]
async fn set_api_key(
    request: SetApiKeyRequest,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("🔧 Backend: Setting API key (length: {})", request.api_key.len());
    
    // Save API key to file
    save_api_key(&request.api_key)?;
    
    // Store the API key in memory
    *state.api_key.lock().unwrap() = Some(request.api_key);
    
    println!("✅ Backend: API key stored successfully");
    Ok(())
}

#[tauri::command]
async fn get_api_key_status(
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let has_api_key = state.api_key.lock().unwrap().is_some();
    println!("🔍 Backend: API key status check - Has API key: {}", has_api_key);
    Ok(has_api_key)
}

#[tauri::command]
async fn start_research(
    request: ResearchRequest,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔍 Backend: Starting research for goal: {}", request.goal);
    
    // Check if API key is set and clone it
    let api_key = {
        let api_key_guard = state.api_key.lock().unwrap();
        api_key_guard.clone()
    };
    
    if api_key.is_none() {
        println!("❌ Backend: No API key found");
        return Err("OpenAI API key not set. Please set your API key first.".to_string());
    }
    
    println!("✅ Backend: API key found, setting environment variable");
    
    // Set the API key as environment variable for this session
    std::env::set_var("OPENAI_API_KEY", api_key.as_ref().unwrap());
    
    println!("📝 Backend: Creating notebook context");
    
    // Create a new notebook context
    let mut context = context::NotebookContext::new();
    
    println!("🤖 Backend: Calling agent::generate_plan_from_goal");
    
    // Generate the research plan using your real AI system
    let cells = match agent::generate_plan_from_goal(&request.goal, &mut context).await {
        Ok(cells) => {
            println!("✅ Backend: Successfully generated {} cells", cells.len());
            cells
        },
        Err(e) => {
            println!("❌ Backend: Error generating plan: {}", e);
            return Err(format!("Failed to generate research plan: {}", e));
        }
    };
    
    // If we have a project_id, automatically categorize content into tabs
    if let Some(project_id) = &request.project_id {
        if let Err(e) = categorize_content_to_tabs(&cells, project_id, &state).await {
            println!("⚠️ Backend: Warning - failed to categorize content: {}", e);
            // Don't fail the entire request, just log the warning
        }
    }
    
    println!("🔄 Backend: Converting cells to JSON format");
    
    // Convert cells to JSON format for the frontend
    let cells_json: Vec<serde_json::Value> = cells.iter().map(|cell| {
        serde_json::json!({
            "id": cell.id,
            "type": match cell.cell_type {
                cell::CellType::Intent => "intent",
                cell::CellType::Plan => "plan", 
                cell::CellType::Code => "code",
                cell::CellType::Output => "output",
                cell::CellType::Reference => "reference",
                cell::CellType::Feedback => "validation",
            },
            "content": cell.content,
            "timestamp": chrono::Utc::now().to_rfc3339()
        })
    }).collect();
    
    let session_id = request.session_id.unwrap_or_else(|| format!("session_{}", chrono::Utc::now().timestamp()));
    
    println!("💾 Backend: Creating response with session_id: {}", session_id);
    
    let response = serde_json::json!({
        "sessionId": session_id,
        "status": "planning",
        "cells": cells_json
    });
    
    // Store session in state and save to disk
    state.sessions.lock().unwrap().insert(session_id.clone(), response.clone());
    if let Err(e) = save_session_to_disk(&session_id, &response) {
        println!("⚠️ Backend: Warning - failed to save session to disk: {}", e);
    }
    
    println!("✅ Backend: Research started successfully");
    
    Ok(response)
}

#[tauri::command]
async fn execute_code(
    request: ExecuteCodeRequest,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔧 Backend: Starting code execution for session: {}", request.session_id);
    println!("📝 Backend: Code to execute: {}", request.code);

    // Check if API key is set and clone it
    let api_key = {
        let api_key_guard = state.api_key.lock().unwrap();
        api_key_guard.clone()
    };

    if api_key.is_none() {
        println!("❌ Backend: No API key found for code execution");
        return Err("OpenAI API key not set. Please set your API key first.".to_string());
    }

    println!("✅ Backend: API key found, setting environment variable");

    // Set the API key as environment variable for this session
    std::env::set_var("OPENAI_API_KEY", api_key.as_ref().unwrap());
    
    println!("🐍 Backend: Calling executor::run_python_code");
    
    // Execute the Python code using your real executor
    match executor::run_python_code(&request.code) {
        Ok(output) => {
            println!("✅ Backend: Python code executed successfully");
            println!("📄 Backend: Raw output: {}", output);
            
            // Parse the output
            let (_output_type, formatted_output) = output_parser::parse_output(&output, false);
            println!("📝 Backend: Formatted output: {}", formatted_output);
            
            // Create validation using your AI system
            let validation = agent::validate_step_output(
                "Code execution",
                &request.code,
                &formatted_output,
                "Research goal", // You might want to pass the original goal here
                &[], // Plan steps
                0, // Current step index
            ).await.unwrap_or_else(|_| agent::StepValidation {
                is_valid: true,
                confidence: 0.8,
                issues: vec![],
                suggestions: vec![],
                next_step_recommendation: "Continue with analysis".to_string(),
                user_action_needed: "continue".to_string(),
            });
            
            // Categorize the output content into project tabs
            if let Err(e) = categorize_code_output(&request.code, &formatted_output, &request.project_id, &state).await {
                println!("⚠️ Backend: Warning - failed to categorize code output: {}", e);
                // Don't fail the entire request, just log the warning
            }
            
            let result: serde_json::Value = serde_json::json!({
                "output": formatted_output,
                "validation": {
                    "isValid": validation.is_valid,
                    "confidence": validation.confidence,
                    "issues": validation.issues,
                    "suggestions": validation.suggestions,
                    "nextStep": validation.next_step_recommendation
                }
            });
            
            Ok(result)
        }
        Err(error) => {
            println!("❌ Backend: Python code execution failed: {}", error);
            
            // Try to auto-install missing packages
            if let Ok(Some(package)) = deps::auto_install_if_missing(&error) {
                println!("📦 Backend: Auto-installing package: {}", package);
                // Retry execution after installing package
                match executor::run_python_code(&request.code) {
                    Ok(output) => {
                        let (_, formatted_output) = output_parser::parse_output(&output, false);
                        let result = serde_json::json!({
                            "output": formatted_output,
                            "validation": {
                                "isValid": true,
                                "confidence": 0.9,
                                "issues": Vec::<String>::new(),
                                "suggestions": vec![format!("Auto-installed package: {}", package)],
                                "nextStep": "Continue with analysis"
                            }
                        });
                        Ok(result)
                    }
                    Err(retry_error) => {
                        Err(format!("Failed to execute code after installing {}: {}", package, retry_error))
                    }
                }
            } else {
                Err(format!("Failed to execute code: {}", error))
            }
        }
    }
}

#[tauri::command]
async fn save_session(
    session_id: String,
    data: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Save to memory
    state.sessions.lock().unwrap().insert(session_id.clone(), data.clone());
    
    // Save to disk
    save_session_to_disk(&session_id, &data)?;
    
    println!("💾 Backend: Session saved to disk: {}", session_id);
    Ok(())
}

#[tauri::command]
async fn load_session(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<Option<serde_json::Value>, String> {
    // First try to load from memory
    {
        let sessions = state.sessions.lock().unwrap();
        if let Some(session) = sessions.get(&session_id) {
            return Ok(Some(session.clone()));
        }
    }
    
    // If not in memory, try to load from disk
    if let Some(session) = load_session_from_disk(&session_id)? {
        // Store in memory for future access
        state.sessions.lock().unwrap().insert(session_id.clone(), session.clone());
        println!("📂 Backend: Session loaded from disk: {}", session_id);
        return Ok(Some(session));
    }
    
    Ok(None)
}

#[tauri::command]
async fn create_project(
    request: CreateProjectRequest,
    state: State<'_, AppState>,
) -> Result<Project, String> {
    println!("📁 Backend: Creating new project: {}", request.name);
    
    let project_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    
    let project = Project {
        id: project_id.clone(),
        name: request.name,
        goal: request.goal,
        created_at: now.clone(),
        updated_at: now,
        data_files: Vec::new(),
        images: Vec::new(),
        references: Vec::new(),
        write_up: String::new(),
    };
    
    // Save project to file
    save_project(&project)?;
    
    // Update state
    let mut projects_guard = state.projects.lock().unwrap();
    projects_guard.insert(project_id.clone(), project.clone());
    
    println!("✅ Backend: Project created successfully");
    Ok(project)
}

#[tauri::command]
async fn get_projects(
    state: State<'_, AppState>,
) -> Result<Vec<Project>, String> {
    println!("📁 Backend: Getting all projects");
    
    let projects_guard = state.projects.lock().unwrap();
    let projects: Vec<Project> = projects_guard.values().cloned().collect();
    
    println!("✅ Backend: Found {} projects", projects.len());
    Ok(projects)
}

#[tauri::command]
async fn get_project(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<Option<Project>, String> {
    println!("📁 Backend: Getting project: {}", project_id);
    
    let projects_guard = state.projects.lock().unwrap();
    let project = projects_guard.get(&project_id).cloned();
    
    println!("✅ Backend: Project found: {}", project.is_some());
    Ok(project)
}

#[tauri::command]
async fn save_file(
    request: SaveFileRequest,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("💾 Backend: Saving file: {} to project: {}", request.filename, request.project_id);
    
    let project_dir = get_project_dir(&request.project_id);
    let file_path = match request.file_type.as_str() {
        "data" => project_dir.join("data").join(&request.filename),
        "image" => project_dir.join("images").join(&request.filename),
        "write_up" => project_dir.join("write_up.md"),
        _ => return Err("Invalid file type".to_string()),
    };
    
    // Create directory if it doesn't exist
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    // Save file
    fs::write(&file_path, &request.content)
        .map_err(|e| format!("Failed to save file: {}", e))?;
    
    // Update project metadata
    let mut projects_guard = state.projects.lock().unwrap();
    if let Some(project) = projects_guard.get_mut(&request.project_id) {
        match request.file_type.as_str() {
            "data" => {
                if !project.data_files.contains(&request.filename) {
                    project.data_files.push(request.filename);
                }
            },
            "image" => {
                if !project.images.contains(&request.filename) {
                    project.images.push(request.filename);
                }
            },
            "write_up" => {
                project.write_up = request.content.clone();
            },
            _ => {}
        }
        project.updated_at = chrono::Utc::now().to_rfc3339();
        save_project(project)?;
    }
    
    println!("✅ Backend: File saved successfully");
    Ok(())
}

#[tauri::command]
async fn update_session(
    session_id: String,
    cells: Vec<serde_json::Value>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let session_data = serde_json::json!({
        "sessionId": session_id,
        "status": "active",
        "cells": cells
    });
    
    // Update in memory
    state.sessions.lock().unwrap().insert(session_id.clone(), session_data.clone());
    
    // Save to disk
    save_session_to_disk(&session_id, &session_data)?;
    
    println!("💾 Backend: Session updated and saved: {}", session_id);
    Ok(())
}

#[tauri::command]
async fn add_reference(
    project_id: String,
    reference: Reference,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("📚 Backend: Adding reference to project: {}", project_id);
    
    let mut projects_guard = state.projects.lock().unwrap();
    if let Some(project) = projects_guard.get_mut(&project_id) {
        project.references.push(reference);
        project.updated_at = chrono::Utc::now().to_rfc3339();
        save_project(project)?;
    }
    
    println!("✅ Backend: Reference added successfully");
    Ok(())
}

fn main() {
    // Initialize projects from disk
    let projects = load_projects().unwrap_or_else(|e| {
        eprintln!("Failed to load projects: {}", e);
        HashMap::new()
    });
    
    // Load API key from disk
    let api_key = load_api_key().unwrap_or_else(|e| {
        eprintln!("Failed to load API key: {}", e);
        None
    });
    
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .manage(AppState {
            sessions: Mutex::new(HashMap::new()),
            api_key: Mutex::new(api_key),
            projects: Mutex::new(projects),
            current_project: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            set_api_key,
            get_api_key_status,
            start_research,
            execute_code,
            save_session,
            load_session,
            update_session,
            create_project,
            get_projects,
            get_project,
            save_file,
            add_reference,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
