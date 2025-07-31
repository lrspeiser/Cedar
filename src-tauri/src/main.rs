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
struct Question {
    id: String,
    question: String,
    answer: Option<String>,
    category: String, // "initial", "follow_up", "clarification"
    created_at: String,
    answered_at: Option<String>,
    status: String, // "pending", "answered", "skipped"
    related_to: Vec<String>, // related questions or research areas
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Library {
    name: String,
    version: Option<String>,
    source: String, // "auto_detected", "manual", "requirements"
    status: String, // "pending", "installed", "failed"
    installed_at: Option<String>,
    error_message: Option<String>,
    required_by: Vec<String>, // which code cells require this library
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
    variables: Vec<VariableInfo>,
    questions: Vec<Question>,
    libraries: Vec<Library>,
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
struct VariableInfo {
    name: String,
    type_name: String,
    shape: Option<String>,
    purpose: String,
    example_value: String,
    source: String,
    updated_at: String,
    related_to: Vec<String>,
    visibility: String, // "public", "hidden", "system"
    units: Option<String>,
    tags: Vec<String>,
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
async fn extract_variables_from_code(
    code: &str,
    output: &str,
    project_id: &str,
    state: &State<'_, AppState>,
) -> Result<(), String> {
    // Simple variable extraction - in a real implementation, you'd want more sophisticated parsing
    let lines: Vec<&str> = code.lines().collect();
    let mut variables = Vec::new();
    
    for line in lines {
        let line = line.trim();
        // Look for assignment patterns like: variable = value
        if let Some(equal_pos) = line.find('=') {
            let var_name = line[..equal_pos].trim();
            
            // Skip if it's not a valid variable name
            if !var_name.chars().next().map_or(false, |c| c.is_alphabetic() || c == '_') {
                continue;
            }
            
            // Skip if it's a function definition or class definition
            if line.contains("def ") || line.contains("class ") || line.contains("import ") || line.contains("from ") {
                continue;
            }
            
            // Extract the value part
            let value_part = line[equal_pos + 1..].trim();
            
            // Determine type and shape based on the value
            let (type_name, shape, example_value) = infer_variable_info(value_part, output);
            
            let variable = VariableInfo {
                name: var_name.to_string(),
                type_name,
                shape,
                purpose: format!("Variable created from code execution"),
                example_value,
                source: "code_execution".to_string(),
                updated_at: chrono::Utc::now().to_rfc3339(),
                related_to: Vec::new(),
                visibility: "public".to_string(),
                units: None,
                tags: Vec::new(),
            };
            
            variables.push(variable);
        }
    }
    
    // Add variables to the project
    for variable in variables {
        add_variable_helper(project_id.to_string(), variable, state).await?;
    }
    
    Ok(())
}

fn infer_variable_info(value_part: &str, output: &str) -> (String, Option<String>, String) {
    // Simple type inference - in a real implementation, you'd want more sophisticated analysis
    let value_part = value_part.trim();
    
    if value_part.starts_with('"') || value_part.starts_with("'") {
        ("str".to_string(), None, value_part.to_string())
    } else if value_part.parse::<i64>().is_ok() {
        ("int".to_string(), None, value_part.to_string())
    } else if value_part.parse::<f64>().is_ok() {
        ("float".to_string(), None, value_part.to_string())
    } else if value_part.starts_with('[') {
        ("list".to_string(), None, value_part.to_string())
    } else if value_part.starts_with('{') {
        ("dict".to_string(), None, value_part.to_string())
    } else if value_part.contains("pd.DataFrame") || value_part.contains("DataFrame") {
        // Try to extract shape from output
        let shape = extract_dataframe_shape(output);
        ("pd.DataFrame".to_string(), shape, value_part.to_string())
    } else if value_part.contains("np.array") || value_part.contains("array") {
        let shape = extract_array_shape(output);
        ("numpy.ndarray".to_string(), shape, value_part.to_string())
    } else {
        ("object".to_string(), None, value_part.to_string())
    }
}

fn extract_dataframe_shape(output: &str) -> Option<String> {
    // Look for DataFrame shape information in output
    if let Some(pos) = output.find("shape:") {
        if let Some(end_pos) = output[pos..].find('\n') {
            let shape_info = &output[pos..pos + end_pos];
            if let Some(start) = shape_info.find('(') {
                if let Some(end) = shape_info.find(')') {
                    return Some(shape_info[start..=end].to_string());
                }
            }
        }
    }
    None
}

fn extract_array_shape(output: &str) -> Option<String> {
    // Look for array shape information in output
    if let Some(pos) = output.find("shape:") {
        if let Some(end_pos) = output[pos..].find('\n') {
            let shape_info = &output[pos..pos + end_pos];
            if let Some(start) = shape_info.find('(') {
                if let Some(end) = shape_info.find(')') {
                    return Some(shape_info[start..=end].to_string());
                }
            }
        }
    }
    None
}

async fn add_variable_helper(
    project_id: String,
    variable: VariableInfo,
    state: &State<'_, AppState>,
) -> Result<(), String> {
    let mut projects = state.projects.lock().unwrap();
    
    if let Some(project) = projects.get_mut(&project_id) {
        // Remove existing variable with same name if it exists
        project.variables.retain(|v| v.name != variable.name);
        // Add the new variable
        project.variables.push(variable.clone());
        
        // Save to disk
        save_project(project)?;
        
        println!("💾 Backend: Variable extracted and added: {}", variable.name);
        Ok(())
    } else {
        Err("Project not found".to_string())
    }
}

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
    let api_key = state.api_key.lock().unwrap();
    if api_key.is_none() {
        return Err("No API key found".to_string());
    }
    
    let api_key = api_key.as_ref().unwrap();
    std::env::set_var("OPENAI_API_KEY", api_key);
    
    // Check if we have questions and if they're answered
    let projects = state.projects.lock().unwrap();
    let project = projects.get(&request.project_id)
        .ok_or("Project not found")?;
    
    let answered_questions: Vec<_> = project.questions.iter()
        .filter(|q| q.status == "answered")
        .collect();
    
    // If no questions exist, generate initial questions first
    if project.questions.is_empty() {
        drop(projects); // Release the lock
        
        // Generate initial questions
        let initial_questions = generate_questions(
            request.project_id.clone(),
            "initial".to_string(),
            state.clone(),
        ).await?;
        
        // Add the questions to the project
        let mut projects = state.projects.lock().unwrap();
        if let Some(project) = projects.get_mut(&request.project_id) {
            project.questions.extend(initial_questions);
            save_project(&project)?;
        }
        
        return Ok(serde_json::json!({
            "session_id": request.session_id,
            "status": "questions_generated",
            "message": "Initial questions have been generated. Please answer them to proceed with research.",
            "questions_count": project.questions.len()
        }));
    }
    
    // If questions exist but none are answered, return early
    if answered_questions.is_empty() {
        return Ok(serde_json::json!({
            "session_id": request.session_id,
            "status": "questions_pending",
            "message": "Please answer the generated questions to proceed with research.",
            "questions_count": project.questions.len()
        }));
    }
    
    // Build context from answered questions
    let questions_context: String = answered_questions.iter()
        .map(|q| format!("Q: {}\nA: {}\n", q.question, q.answer.as_ref().unwrap_or(&"No answer".to_string())))
        .collect();
    
    // Create enhanced research prompt with questions context
    let enhanced_goal = format!(
        "Research Goal: {}\n\nBased on the following clarifying questions and answers:\n{}\n\nPlease conduct comprehensive research that addresses the specific requirements and constraints identified in the Q&A session.",
        request.goal, questions_context
    );
    
    drop(projects); // Release the lock before async call
    
    // Call the LLM with the enhanced context
    let prompt = format!(
        "You are a research assistant. Based on this research goal and context:\n\n{}\n\nCreate a comprehensive research plan with multiple steps. Each step should be actionable and specific. \
        Return your response as a JSON object with this structure: {{\"steps\": [{{\"step\": 1, \"description\": \"...\", \"code\": \"...\", \"output\": \"...\"}}]}}",
        enhanced_goal
    );
    
    match cedar::llm::ask_llm(&prompt).await {
        Ok(response) => {
            // Parse the response and create cells
            let (cells, steps) = match serde_json::from_str::<serde_json::Value>(&response) {
                Ok(json_response) => {
                    if let Some(steps_array) = json_response["steps"].as_array() {
                        let mut cells = Vec::new();
                        
                        // Add a summary cell with the research goal and context
                        cells.push(serde_json::json!({
                            "type": "text",
                            "content": format!("## Research Goal\n{}\n\n## Context from Q&A\n{}", request.goal, questions_context),
                            "timestamp": chrono::Utc::now().to_rfc3339()
                        }));
                        
                        for (i, step) in steps_array.iter().enumerate() {
                            if let (Some(description), Some(code), Some(output)) = (
                                step["description"].as_str(),
                                step["code"].as_str(),
                                step["output"].as_str()
                            ) {
                                // Add description cell
                                cells.push(serde_json::json!({
                                    "type": "text",
                                    "content": format!("## Step {}: {}\n\n{}", i + 1, step["step"].as_u64().unwrap_or(i as u64 + 1), description),
                                    "timestamp": chrono::Utc::now().to_rfc3339()
                                }));
                                
                                // Add code cell
                                cells.push(serde_json::json!({
                                    "type": "code",
                                    "content": code.to_string(),
                                    "output": output.to_string(),
                                    "timestamp": chrono::Utc::now().to_rfc3339()
                                }));
                            }
                        }
                        
                        (cells, steps_array.clone())
                    } else {
                        // Fallback: create a single text cell with the raw response
                        let cells = vec![serde_json::json!({
                            "type": "text",
                            "content": format!("## Research Plan\n\n{}", response),
                            "timestamp": chrono::Utc::now().to_rfc3339()
                        })];
                        (cells, Vec::new())
                    }
                },
                Err(_) => {
                    // Fallback: create a single text cell with the raw response
                    let cells = vec![serde_json::json!({
                        "type": "text",
                        "content": format!("## Research Plan\n\n{}", response),
                        "timestamp": chrono::Utc::now().to_rfc3339()
                    })];
                    (cells, Vec::new())
                }
            };
            
            // Save the session with cells
            let session_data = serde_json::json!({
                "session_id": request.session_id,
                "cells": cells.clone(),
                "status": "research_started",
                "created_at": chrono::Utc::now().to_rfc3339()
            });
            
            save_session(request.session_id.clone(), session_data.clone(), state.clone()).await?;
            
            // Create the response with cells for display
            let response = serde_json::json!({
                "session_id": request.session_id,
                "cells": cells,
                "status": "research_started",
                "message": "Research plan generated and execution started"
            });
            
            // Start automatic execution of the steps
            let execution_request = ExecuteResearchStepsRequest {
                project_id: request.project_id.clone(),
                session_id: request.session_id.clone(),
                goal: request.goal.clone(),
                steps: steps,
                start_step: Some(0),
            };
            
            // Execute steps in background (don't await to avoid blocking)
            let state_clone = state.clone();
            tokio::spawn(async move {
                if let Err(e) = execute_research_steps(execution_request, state_clone).await {
                    println!("❌ Backend: Automatic step execution failed: {}", e);
                }
            });
            
            Ok(response)
        },
        Err(e) => Err(format!("Failed to start research: {}", e))
    }
}

#[tauri::command]
async fn execute_code(
    request: ExecuteCodeRequest,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔧 Backend: Starting code execution for session: {}", request.session_id);
    println!("📝 Backend: Code to execute: {}", request.code);
    
    let api_key = state.api_key.lock().unwrap();
    if api_key.is_none() {
        return Err("No API key found".to_string());
    }
    
    let api_key = api_key.as_ref().unwrap();
    std::env::set_var("OPENAI_API_KEY", api_key);
    println!("✅ Backend: API key found, setting environment variable");
    
    // Extract libraries from the code
    let cell_id = format!("cell_{}", chrono::Utc::now().timestamp());
    let extracted_libraries = match extract_libraries_from_code(
        request.project_id.clone(),
        request.code.clone(),
        cell_id.clone(),
        state.clone(),
    ).await {
        Ok(libraries) => libraries,
        Err(e) => {
            println!("⚠️ Backend: Warning - failed to extract libraries: {}", e);
            Vec::new()
        }
    };
    
    // Add new libraries to the project
    if !extracted_libraries.is_empty() {
        let mut projects = state.projects.lock().unwrap();
        if let Some(project) = projects.get_mut(&request.project_id) {
            for library in extracted_libraries {
                // Check if library already exists
                if !project.libraries.iter().any(|l| l.name == library.name) {
                    project.libraries.push(library);
                } else {
                    // Update existing library to include this cell as required_by
                    if let Some(existing_lib) = project.libraries.iter_mut().find(|l| l.name == library.name) {
                        if !existing_lib.required_by.contains(&cell_id) {
                            existing_lib.required_by.push(cell_id.clone());
                        }
                    }
                }
            }
            save_project(&request.project_id, &project)?;
        }
        drop(projects);
        
        // Install all pending libraries
        if let Err(e) = install_all_libraries(request.project_id.clone(), state.clone()).await {
            println!("⚠️ Backend: Warning - failed to install some libraries: {}", e);
        }
    }
    
    // Execute the Python code
    println!("🐍 Backend: Calling executor::run_python_code");
    match cedar::executor::run_python_code(&request.code) {
        Ok(output) => {
            println!("✅ Backend: Python code executed successfully");
            println!("📄 Backend: Raw output: {}", output);
            
            // Parse and format the output
            let formatted_output = match cedar::output_parser::parse_output(&output, false) {
                Ok(parsed) => parsed,
                Err(_) => output.clone(),
            };
            println!("📝 Backend: Formatted output: {}", formatted_output);
            
            // Validate the output using AI
            println!("🤖 LLM: Starting OpenAI API call");
            let validation_prompt = format!(
                "Validate this Python code output:\n\nCode:\n{}\n\nOutput:\n{}\n\nIs this output valid and meaningful? Respond with 'VALID' or 'INVALID' followed by a brief explanation.",
                request.code, formatted_output
            );
            
            let validation_result = match cedar::llm::ask_llm(&validation_prompt).await {
                Ok(response) => {
                    println!("✅ LLM: Successfully received response (length: {})", response.len());
                    response
                },
                Err(e) => {
                    println!("❌ LLM: Failed to validate output: {}", e);
                    "VALID - Could not validate due to API error".to_string()
                }
            };
            
            // Categorize the output and save to appropriate tabs
            // TODO: Fix type mismatch - categorize_content_to_tabs expects &[NotebookCell] but we have &Vec<Value>
            /*
            if let Err(e) = categorize_content_to_tabs(&vec![serde_json::json!({
                "type": "code",
                "content": request.code,
                "output": formatted_output,
                "timestamp": chrono::Utc::now().to_rfc3339()
            })], &request.project_id, &state).await {
                println!("⚠️ Backend: Warning - failed to categorize content: {}", e);
            }
            */
            
            // Extract variables from the code output
            if let Err(e) = extract_variables_from_code(&request.code, &formatted_output, &request.project_id, &state).await {
                println!("⚠️ Backend: Warning - failed to extract variables: {}", e);
            }
            
            // Return the result
            Ok(serde_json::json!({
                "output": formatted_output,
                "validation": validation_result,
                "session_id": request.session_id,
                "project_id": request.project_id
            }))
        },
        Err(e) => {
            println!("❌ Backend: Python code execution failed: {}", e);
            Err(format!("Failed to execute code: {}", e))
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
        variables: Vec::new(),
        questions: Vec::new(),
        libraries: Vec::new(),
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
async fn add_variable(
    project_id: String,
    variable: VariableInfo,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut projects = state.projects.lock().unwrap();
    
    if let Some(project) = projects.get_mut(&project_id) {
        // Remove existing variable with same name if it exists
        project.variables.retain(|v| v.name != variable.name);
        // Add the new variable
        project.variables.push(variable.clone());
        
        // Save to disk
        save_project(project)?;
        
        println!("💾 Backend: Variable added to project: {}", variable.name);
        Ok(())
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn get_variables(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<VariableInfo>, String> {
    let projects = state.projects.lock().unwrap();
    
    if let Some(project) = projects.get(&project_id) {
        Ok(project.variables.clone())
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn update_variable(
    project_id: String,
    variable_name: String,
    updates: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut projects = state.projects.lock().unwrap();
    
    if let Some(project) = projects.get_mut(&project_id) {
        if let Some(variable) = project.variables.iter_mut().find(|v| v.name == variable_name) {
            // Update fields based on the provided updates
            if let Some(purpose) = updates.get("purpose").and_then(|v| v.as_str()) {
                variable.purpose = purpose.to_string();
            }
            if let Some(tags) = updates.get("tags").and_then(|v| v.as_array()) {
                variable.tags = tags.iter()
                    .filter_map(|v| v.as_str())
                    .map(|s| s.to_string())
                    .collect();
            }
            if let Some(visibility) = updates.get("visibility").and_then(|v| v.as_str()) {
                variable.visibility = visibility.to_string();
            }
            
            // Update timestamp
            variable.updated_at = chrono::Utc::now().to_rfc3339();
            
            // Save to disk
            save_project(project)?;
            
            println!("💾 Backend: Variable updated: {}", variable_name);
            Ok(())
        } else {
            Err("Variable not found".to_string())
        }
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn delete_variable(
    project_id: String,
    variable_name: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut projects = state.projects.lock().unwrap();
    
    if let Some(project) = projects.get_mut(&project_id) {
        project.variables.retain(|v| v.name != variable_name);
        
        // Save to disk
        save_project(project)?;
        
        println!("🗑️ Backend: Variable deleted: {}", variable_name);
        Ok(())
    } else {
        Err("Project not found".to_string())
    }
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

#[tauri::command]
async fn add_question(
    project_id: String,
    question: Question,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut projects = state.projects.lock().unwrap();
    if let Some(project) = projects.get_mut(&project_id) {
        project.questions.push(question);
        save_project(&project_id, &project)?;
        Ok(())
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn get_questions(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<Question>, String> {
    let projects = state.projects.lock().unwrap();
    if let Some(project) = projects.get(&project_id) {
        Ok(project.questions.clone())
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn answer_question(
    project_id: String,
    question_id: String,
    answer: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut projects = state.projects.lock().unwrap();
    if let Some(project) = projects.get_mut(&project_id) {
        if let Some(question) = project.questions.iter_mut().find(|q| q.id == question_id) {
            question.answer = Some(answer.clone());
            question.answered_at = Some(chrono::Utc::now().to_rfc3339());
            question.status = "answered".to_string();
            save_project(&project_id, &project)?;
            Ok(())
        } else {
            Err("Question not found".to_string())
        }
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn generate_questions(
    project_id: String,
    context: String, // "initial" or "follow_up"
    state: State<'_, AppState>,
) -> Result<Vec<Question>, String> {
    let projects = state.projects.lock().unwrap();
    if let Some(project) = projects.get(&project_id) {
        let api_key = state.api_key.lock().unwrap();
        if api_key.is_none() {
            return Err("No API key found".to_string());
        }
        
        let api_key = api_key.as_ref().unwrap();
        std::env::set_var("OPENAI_API_KEY", api_key);
        
        let prompt = match context.as_str() {
            "initial" => format!(
                "Based on this research goal: '{}', generate 5-8 clarifying questions to better understand what the user wants to accomplish. \
                Focus on understanding the scope, specific requirements, constraints, and desired outcomes. \
                Return the questions as a JSON array with this structure: [{{\"question\": \"...\", \"category\": \"initial\", \"related_to\": []}}]",
                project.goal
            ),
            "follow_up" => {
                let answered_questions: Vec<_> = project.questions.iter()
                    .filter(|q| q.status == "answered")
                    .collect();
                let answers_summary: String = answered_questions.iter()
                    .map(|q| format!("Q: {}\nA: {}\n", q.question, q.answer.as_ref().unwrap_or(&"No answer".to_string())))
                    .collect();
                
                format!(
                    "Based on the research goal '{}' and these previous answers:\n{}\n\nGenerate 3-5 follow-up questions to dive deeper into specific aspects or clarify any remaining uncertainties. \
                    Focus on technical details, methodology preferences, or specific constraints that weren't covered. \
                    Return the questions as a JSON array with this structure: [{{\"question\": \"...\", \"category\": \"follow_up\", \"related_to\": []}}]",
                    project.goal, answers_summary
                )
            },
            _ => return Err("Invalid context. Use 'initial' or 'follow_up'".to_string())
        };
        
        match cedar::llm::ask_llm(&prompt).await {
            Ok(response) => {
                // Parse the JSON response to extract questions
                match serde_json::from_str::<Vec<serde_json::Value>>(&response) {
                    Ok(questions_json) => {
                        let mut questions = Vec::new();
                        for q_json in questions_json {
                            if let (Some(question_text), Some(category)) = (
                                q_json["question"].as_str(),
                                q_json["category"].as_str()
                            ) {
                                let related_to = q_json["related_to"].as_array()
                                    .map(|arr| arr.iter()
                                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                                        .collect())
                                    .unwrap_or_default();
                                
                                let question = Question {
                                    id: uuid::Uuid::new_v4().to_string(),
                                    question: question_text.to_string(),
                                    answer: None,
                                    category: category.to_string(),
                                    created_at: chrono::Utc::now().to_rfc3339(),
                                    answered_at: None,
                                    status: "pending".to_string(),
                                    related_to,
                                };
                                questions.push(question);
                            }
                        }
                        Ok(questions)
                    },
                    Err(_) => Err("Failed to parse questions from LLM response".to_string())
                }
            },
            Err(e) => Err(format!("Failed to generate questions: {}", e))
        }
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn update_question(
    project_id: String,
    question_id: String,
    updates: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut projects = state.projects.lock().unwrap();
    if let Some(project) = projects.get_mut(&project_id) {
        if let Some(question) = project.questions.iter_mut().find(|q| q.id == question_id) {
            if let Some(status) = updates["status"].as_str() {
                question.status = status.to_string();
            }
            if let Some(answer) = updates["answer"].as_str() {
                question.answer = Some(answer.to_string());
                question.answered_at = Some(chrono::Utc::now().to_rfc3339());
            }
            save_project(&project_id, &project)?;
            Ok(())
        } else {
            Err("Question not found".to_string())
        }
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn add_library(
    project_id: String,
    library: Library,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut projects = state.projects.lock().unwrap();
    if let Some(project) = projects.get_mut(&project_id) {
        project.libraries.push(library);
        save_project(&project_id, &project)?;
        Ok(())
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn get_libraries(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<Library>, String> {
    let projects = state.projects.lock().unwrap();
    if let Some(project) = projects.get(&project_id) {
        Ok(project.libraries.clone())
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn install_library(
    project_id: String,
    library_name: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut projects = state.projects.lock().unwrap();
    if let Some(project) = projects.get_mut(&project_id) {
        if let Some(library) = project.libraries.iter_mut().find(|l| l.name == library_name) {
            library.status = "installing".to_string();
            save_project(&project_id, &project)?;
        }
    }
    
    // Release the lock before async operation
    drop(projects);
    
    // Install the library using pip
    let install_command = if let Some(library) = projects.lock().unwrap().get(&project_id)
        .and_then(|p| p.libraries.iter().find(|l| l.name == library_name)) {
        if let Some(version) = &library.version {
            format!("pip install {}=={}", library_name, version)
        } else {
            format!("pip install {}", library_name)
        }
    } else {
        format!("pip install {}", library_name)
    };
    
    match std::process::Command::new("sh")
        .arg("-c")
        .arg(&install_command)
        .output() {
        Ok(output) => {
            let mut projects = state.projects.lock().unwrap();
            if let Some(project) = projects.get_mut(&project_id) {
                if let Some(library) = project.libraries.iter_mut().find(|l| l.name == library_name) {
                    if output.status.success() {
                        library.status = "installed".to_string();
                        library.installed_at = Some(chrono::Utc::now().to_rfc3339());
                        library.error_message = None;
                    } else {
                        library.status = "failed".to_string();
                        library.error_message = Some(String::from_utf8_lossy(&output.stderr).to_string());
                    }
                    save_project(&project)?;
                }
            }
            Ok(())
        },
        Err(e) => {
            let mut projects = state.projects.lock().unwrap();
            if let Some(project) = projects.get_mut(&project_id) {
                if let Some(library) = project.libraries.iter_mut().find(|l| l.name == library_name) {
                    library.status = "failed".to_string();
                    library.error_message = Some(e.to_string());
                    save_project(&project)?;
                }
            }
            Err(format!("Failed to install library: {}", e))
        }
    }
}

#[tauri::command]
async fn install_all_libraries(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let projects = state.projects.lock().unwrap();
    if let Some(project) = projects.get(&project_id) {
        let pending_libraries: Vec<_> = project.libraries.iter()
            .filter(|l| l.status == "pending")
            .collect();
        
        for library in pending_libraries {
            let library_name = library.name.clone();
            drop(projects); // Release lock before async call
            if let Err(e) = install_library(project_id.clone(), library_name, state.clone()).await {
                println!("Failed to install library {}: {}", library_name, e);
            }
            let projects = state.projects.lock().unwrap(); // Re-acquire lock
        }
        Ok(())
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn update_library(
    project_id: String,
    library_name: String,
    updates: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut projects = state.projects.lock().unwrap();
    if let Some(project) = projects.get_mut(&project_id) {
        if let Some(library) = project.libraries.iter_mut().find(|l| l.name == library_name) {
            if let Some(status) = updates["status"].as_str() {
                library.status = status.to_string();
            }
            if let Some(version) = updates["version"].as_str() {
                library.version = Some(version.to_string());
            }
            if let Some(error_message) = updates["error_message"].as_str() {
                library.error_message = Some(error_message.to_string());
            }
            save_project(&project_id, &project)?;
            Ok(())
        } else {
            Err("Library not found".to_string())
        }
    } else {
        Err("Project not found".to_string())
    }
}

#[tauri::command]
async fn extract_libraries_from_code(
    project_id: String,
    code: String,
    cell_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<Library>, String> {
    let api_key = state.api_key.lock().unwrap();
    if api_key.is_none() {
        return Err("No API key found".to_string());
    }
    
    let api_key = api_key.as_ref().unwrap();
    std::env::set_var("OPENAI_API_KEY", api_key);
    
    let prompt = format!(
        "Analyze this Python code and extract all the external libraries that need to be installed via pip. \
        Focus on import statements and any libraries that are used but not part of Python's standard library. \
        Return the result as a JSON array with this structure: [{{\"name\": \"library_name\", \"version\": \"optional_version\"}}] \
        \n\nCode:\n{}\n\nOnly include libraries that need to be installed via pip. Do not include standard library modules like os, sys, math, etc.",
        code
    );
    
    match cedar::llm::ask_llm(&prompt).await {
        Ok(response) => {
            match serde_json::from_str::<Vec<serde_json::Value>>(&response) {
                Ok(libraries_json) => {
                    let mut libraries = Vec::new();
                    for lib_json in libraries_json {
                        if let Some(name) = lib_json["name"].as_str() {
                            let version = lib_json["version"].as_str().map(|v| v.to_string());
                            
                            let library = Library {
                                name: name.to_string(),
                                version,
                                source: "auto_detected".to_string(),
                                status: "pending".to_string(),
                                installed_at: None,
                                error_message: None,
                                required_by: vec![cell_id.clone()],
                            };
                            libraries.push(library);
                        }
                    }
                    Ok(libraries)
                },
                Err(_) => Err("Failed to parse libraries from LLM response".to_string())
            }
        },
        Err(e) => Err(format!("Failed to extract libraries: {}", e))
    }
}

#[tauri::command]
async fn execute_research_steps(
    request: ExecuteResearchStepsRequest,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔧 Backend: Starting automatic research step execution for project: {}", request.project_id);
    
    let api_key = state.api_key.lock().unwrap();
    if api_key.is_none() {
        return Err("No API key found".to_string());
    }
    
    let api_key = api_key.as_ref().unwrap();
    std::env::set_var("OPENAI_API_KEY", api_key);
    
    let mut current_step = request.start_step.unwrap_or(0);
    let mut all_results = Vec::new();
    let mut session_id = request.session_id.clone();
    
    loop {
        println!("🔧 Backend: Executing step {}", current_step);
        
        // Get the current step content
        let step_content = if let Some(step) = request.steps.get(current_step) {
            step.clone()
        } else {
            // No more steps, ask LLM for next steps
            println!("🤖 LLM: No more predefined steps, asking LLM for next steps");
            let next_steps_prompt = format!(
                "Based on the research goal '{}' and the following results from previous steps, \
                what are the next logical steps to complete this research? \
                Provide 2-3 specific, actionable steps with code examples. \
                Focus on analysis, visualization, or conclusion steps.\n\n\
                Previous Results:\n{}\n\n\
                Return the response as a JSON array with this structure: \
                [{{\"description\": \"step description\", \"code\": \"python code\", \"expected_output\": \"what this step should produce\"}}]",
                request.goal,
                all_results.join("\n\n")
            );
            
            match cedar::llm::ask_llm(&next_steps_prompt).await {
                Ok(response) => {
                    match serde_json::from_str::<Vec<serde_json::Value>>(&response) {
                        Ok(new_steps) => {
                            if new_steps.is_empty() {
                                println!("✅ Backend: Research completed - no more steps needed");
                                break;
                            }
                            
                            // Add new steps to the request
                            let mut updated_steps = request.steps.clone();
                            updated_steps.extend(new_steps);
                            
                            // Continue with the first new step
                            if let Some(new_step) = updated_steps.get(current_step) {
                                new_step.clone()
                            } else {
                                println!("✅ Backend: Research completed - no more steps available");
                                break;
                            }
                        },
                        Err(_) => {
                            println!("✅ Backend: Research completed - LLM indicated completion");
                            break;
                        }
                    }
                },
                Err(e) => {
                    println!("❌ Backend: Failed to get next steps from LLM: {}", e);
                    break;
                }
            }
        };
        
        // Extract step details
        let description = step_content["description"].as_str().unwrap_or("Step execution");
        let code = step_content["code"].as_str().unwrap_or("");
        let expected_output = step_content["expected_output"].as_str().unwrap_or("");
        
        // Extract libraries from the code
        let cell_id = format!("auto_step_{}", current_step);
        let extracted_libraries = match extract_libraries_from_code(
            request.project_id.clone(),
            code.to_string(),
            cell_id.clone(),
            state.clone(),
        ).await {
            Ok(libraries) => libraries,
            Err(e) => {
                println!("⚠️ Backend: Warning - failed to extract libraries from step {}: {}", current_step, e);
                Vec::new()
            }
        };
        
        // Add new libraries to the project
        if !extracted_libraries.is_empty() {
            let mut projects = state.projects.lock().unwrap();
            if let Some(project) = projects.get_mut(&request.project_id) {
                for library in extracted_libraries {
                    if !project.libraries.iter().any(|l| l.name == library.name) {
                        project.libraries.push(library);
                    } else {
                        if let Some(existing_lib) = project.libraries.iter_mut().find(|l| l.name == library.name) {
                            if !existing_lib.required_by.contains(&cell_id) {
                                existing_lib.required_by.push(cell_id.clone());
                            }
                        }
                    }
                }
                save_project(&request.project_id, &project)?;
            }
            drop(projects);
            
            // Install all pending libraries
            if let Err(e) = install_all_libraries(request.project_id.clone(), state.clone()).await {
                println!("⚠️ Backend: Warning - failed to install some libraries: {}", e);
            }
        }
        
        // Execute the code
        let execution_result = match cedar::executor::run_python_code(code) {
            Ok(output) => {
                println!("✅ Backend: Step {} executed successfully", current_step);
                
                // Parse and format the output
                let formatted_output = match cedar::output_parser::parse_output(&output, false) {
                    Ok(parsed) => parsed,
                    Err(_) => output.clone(),
                };
                
                // Validate the output using AI
                let validation_prompt = format!(
                    "Validate this code execution output for step '{}':\n\nCode:\n{}\n\nExpected Output:\n{}\n\nActual Output:\n{}\n\nProvide a brief assessment of whether the step was successful and any issues.",
                    description, code, expected_output, formatted_output
                );
                
                let validation_result = match cedar::llm::ask_llm(&validation_prompt).await {
                    Ok(response) => response,
                    Err(e) => {
                        println!("⚠️ LLM: Warning - failed to validate output: {}", e);
                        "Validation failed".to_string()
                    }
                };
                
                // Create step result
                let step_result = serde_json::json!({
                    "step_number": current_step,
                    "description": description,
                    "code": code,
                    "output": formatted_output,
                    "raw_output": output,
                    "validation": validation_result,
                    "status": "success",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                });
                
                // Add to all results
                all_results.push(format!("Step {}: {}\nOutput: {}\nValidation: {}", 
                    current_step, description, formatted_output, validation_result));
                
                // Save session data
                let session_data = serde_json::json!({
                    "session_id": session_id,
                    "step_number": current_step,
                    "code": code,
                    "output": formatted_output,
                    "executed_at": chrono::Utc::now().to_rfc3339()
                });
                
                save_session_to_disk(&session_id, &session_data)?;
                
                // Categorize content to appropriate tabs
                if let Err(e) = categorize_content_to_tabs(&vec![serde_json::json!({
                    "type": "code",
                    "content": code,
                    "output": formatted_output,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                })], &request.project_id, &state).await {
                    println!("⚠️ Backend: Warning - failed to categorize content: {}", e);
                }
                
                // Extract variables from code execution
                if let Err(e) = extract_variables_from_code(&request.project_id, &formatted_output, &state).await {
                    println!("⚠️ Backend: Warning - failed to extract variables: {}", e);
                }
                
                step_result
            },
            Err(e) => {
                println!("❌ Backend: Step {} execution failed: {}", current_step, e);
                
                let step_result = serde_json::json!({
                    "step_number": current_step,
                    "description": description,
                    "code": code,
                    "output": format!("Error: {}", e),
                    "raw_output": format!("Error: {}", e),
                    "validation": "Step execution failed",
                    "status": "failed",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                });
                
                all_results.push(format!("Step {}: {} - FAILED\nError: {}", current_step, description, e));
                
                step_result
            }
        };
        
        // Send step result to frontend
        let step_update = serde_json::json!({
            "type": "step_completed",
            "step_result": execution_result,
            "current_step": current_step,
            "total_steps": request.steps.len(),
            "session_id": session_id
        });
        
        // Check if we should continue
        if execution_result["status"] == "failed" {
            println!("❌ Backend: Step {} failed, stopping execution", current_step);
            break;
        }
        
        // Ask LLM if we should continue or if research is complete
        let completion_check_prompt = format!(
            "Based on the research goal '{}' and the results so far, should we continue with more steps? \
            Consider if the research is complete or if more analysis is needed.\n\n\
            Results so far:\n{}\n\n\
            Respond with 'continue' if more steps are needed, or 'complete' if the research is finished.",
            request.goal,
            all_results.join("\n\n")
        );
        
        let should_continue = match cedar::llm::ask_llm(&completion_check_prompt).await {
            Ok(response) => {
                response.to_lowercase().contains("continue")
            },
            Err(_) => {
                // Default to continue if we can't ask LLM
                current_step < request.steps.len() - 1
            }
        };
        
        if !should_continue {
            println!("✅ Backend: LLM indicated research is complete");
            break;
        }
        
        current_step += 1;
        
        // Add a small delay between steps
        std::thread::sleep(std::time::Duration::from_millis(500));
    }
    
    // Create final response
    let final_response = serde_json::json!({
        "session_id": session_id,
        "total_steps_executed": current_step + 1,
        "all_results": all_results,
        "status": "completed",
        "final_summary": format!("Research completed with {} steps executed", current_step + 1)
    });
    
    // Generate visualizations after research completion
    println!("🎨 Backend: Research completed, starting visualization generation");
    match generate_visualizations(
        request.project_id.clone(),
        request.goal.clone(),
        all_results.clone(),
        state.clone(),
    ).await {
        Ok(visualizations) => {
            println!("✅ Backend: Successfully generated {} visualizations", visualizations.len());
            
            // Update research paper with all findings
            println!("📝 Backend: Starting research paper update");
            match update_research_paper(
                request.project_id.clone(),
                request.goal.clone(),
                all_results.clone(),
                visualizations.clone(),
                state.clone(),
            ).await {
                Ok(paper_content) => {
                    println!("✅ Backend: Research paper updated successfully");
                    
                    // Update final response to include visualizations and paper
                    let final_response_with_paper = serde_json::json!({
                        "session_id": session_id,
                        "total_steps_executed": current_step + 1,
                        "all_results": all_results,
                        "visualizations": visualizations,
                        "paper_updated": true,
                        "paper_content_length": paper_content.len(),
                        "status": "completed_with_paper",
                        "final_summary": format!("Research completed with {} steps executed, {} visualizations generated, and paper updated", current_step + 1, visualizations.len())
                    });
                    
                    Ok(final_response_with_paper)
                },
                Err(e) => {
                    println!("⚠️ Backend: Warning - failed to update research paper: {}", e);
                    
                    // Return response with visualizations but without paper update
                    let final_response_without_paper = serde_json::json!({
                        "session_id": session_id,
                        "total_steps_executed": current_step + 1,
                        "all_results": all_results,
                        "visualizations": visualizations,
                        "paper_error": e,
                        "status": "completed_without_paper",
                        "final_summary": format!("Research completed with {} steps executed and {} visualizations generated (paper update failed)", current_step + 1, visualizations.len())
                    });
                    
                    Ok(final_response_without_paper)
                }
            }
        },
        Err(e) => {
            println!("⚠️ Backend: Warning - failed to generate visualizations: {}", e);
            
            // Try to update paper even without visualizations
            println!("📝 Backend: Attempting paper update without visualizations");
            match update_research_paper(
                request.project_id.clone(),
                request.goal.clone(),
                all_results.clone(),
                Vec::new(),
                state.clone(),
            ).await {
                Ok(paper_content) => {
                    println!("✅ Backend: Research paper updated successfully (without visualizations)");
                    
                    let final_response_with_paper_no_viz = serde_json::json!({
                        "session_id": session_id,
                        "total_steps_executed": current_step + 1,
                        "all_results": all_results,
                        "visualization_error": e,
                        "paper_updated": true,
                        "paper_content_length": paper_content.len(),
                        "status": "completed_with_paper_no_viz",
                        "final_summary": format!("Research completed with {} steps executed and paper updated (visualization generation failed)", current_step + 1)
                    });
                    
                    Ok(final_response_with_paper_no_viz)
                },
                Err(paper_error) => {
                    println!("⚠️ Backend: Warning - failed to update research paper: {}", paper_error);
                    
                    let final_response_without_either = serde_json::json!({
                        "session_id": session_id,
                        "total_steps_executed": current_step + 1,
                        "all_results": all_results,
                        "visualization_error": e,
                        "paper_error": paper_error,
                        "status": "completed_without_extras",
                        "final_summary": format!("Research completed with {} steps executed (visualization and paper update failed)", current_step + 1)
                    });
                    
                    Ok(final_response_without_either)
                }
            }
        }
    }
}

#[tauri::command]
async fn generate_visualizations(
    project_id: String,
    goal: String,
    all_results: Vec<String>,
    state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    println!("🎨 Backend: Starting visualization generation for project: {}", project_id);
    
    let api_key = state.api_key.lock().unwrap();
    if api_key.is_none() {
        return Err("No API key found".to_string());
    }
    
    let api_key = api_key.as_ref().unwrap();
    std::env::set_var("OPENAI_API_KEY", api_key);
    
    // Ask LLM what visualizations and tables would be most useful
    let visualization_prompt = format!(
        "Based on the research goal '{}' and the following results, what visualizations and tables would be most useful to create? \
        Consider charts, graphs, tables, and other visual representations that would help understand the data and findings.\n\n\
        Research Results:\n{}\n\n\
        Provide 3-5 specific visualization suggestions with the following structure for each:\n\
        {{\n\
          \"name\": \"descriptive name\",\n\
          \"type\": \"chart/table/graph\",\n\
          \"description\": \"what this visualization shows\",\n\
          \"code\": \"python code to generate this visualization\",\n\
          \"filename\": \"suggested filename for the output\"\n\
        }}\n\n\
        Return as a JSON array. Focus on:\n\
        - Summary statistics tables\n\
        - Trend charts (line plots, bar charts)\n\
        - Distribution plots (histograms, box plots)\n\
        - Correlation heatmaps\n\
        - Comparative visualizations\n\
        - Key findings summaries",
        goal,
        all_results.join("\n\n")
    );
    
    let visualization_response = match cedar::llm::ask_llm(&visualization_prompt).await {
        Ok(response) => response,
        Err(e) => {
            println!("❌ Backend: Failed to get visualization suggestions: {}", e);
            return Err(format!("Failed to get visualization suggestions: {}", e));
        }
    };
    
    // Parse the visualization suggestions
    let visualizations = match serde_json::from_str::<Vec<serde_json::Value>>(&visualization_response) {
        Ok(viz) => viz,
        Err(e) => {
            println!("❌ Backend: Failed to parse visualization suggestions: {}", e);
            return Err(format!("Failed to parse visualization suggestions: {}", e));
        }
    };
    
    println!("🎨 Backend: Generated {} visualization suggestions", visualizations.len());
    
    let mut generated_visualizations = Vec::new();
    
    // Execute each visualization
    for (index, viz) in visualizations.iter().enumerate() {
        let name = viz["name"].as_str().unwrap_or(&format!("Visualization {}", index + 1));
        let viz_type = viz["type"].as_str().unwrap_or("chart");
        let description = viz["description"].as_str().unwrap_or("");
        let code = viz["code"].as_str().unwrap_or("");
        let filename = viz["filename"].as_str().unwrap_or(&format!("viz_{}.png", index + 1));
        
        println!("🎨 Backend: Generating visualization {}: {}", index + 1, name);
        
        // Execute the visualization code
        let session_id = format!("viz_{}", chrono::Utc::now().timestamp());
        let execution_result = match cedar::executor::run_python_code(code) {
            Ok(output) => {
                println!("✅ Backend: Visualization {} generated successfully", name);
                
                // Parse and format the output
                let formatted_output = match cedar::output_parser::parse_output(&output, false) {
                    Ok(parsed) => parsed,
                    Err(_) => output.clone(),
                };
                
                // Create visualization result
                let viz_result = serde_json::json!({
                    "name": name,
                    "type": viz_type,
                    "description": description,
                    "code": code,
                    "filename": filename,
                    "output": formatted_output,
                    "raw_output": output,
                    "status": "success",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                });
                
                // Save to Images tab
                let image_content = serde_json::json!({
                    "name": name,
                    "type": viz_type,
                    "description": description,
                    "filename": filename,
                    "content": formatted_output,
                    "code": code,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                });
                
                // Add to project's images
                let mut projects = state.projects.lock().unwrap();
                if let Some(project) = projects.get_mut(&project_id) {
                    project.images.push(image_content.to_string());
                    save_project(&project_id, &project)?;
                }
                drop(projects);
                
                generated_visualizations.push(viz_result);
                
                // Categorize content to appropriate tabs
                if let Err(e) = categorize_content_to_tabs(&vec![serde_json::json!({
                    "type": "visualization",
                    "content": code,
                    "output": formatted_output,
                    "name": name,
                    "filename": filename,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                })], &project_id, &state).await {
                    println!("⚠️ Backend: Warning - failed to categorize visualization: {}", e);
                }
                
                viz_result
            },
            Err(e) => {
                println!("❌ Backend: Visualization {} generation failed: {}", name, e);
                
                let viz_result = serde_json::json!({
                    "name": name,
                    "type": viz_type,
                    "description": description,
                    "code": code,
                    "filename": filename,
                    "output": format!("Error: {}", e),
                    "raw_output": format!("Error: {}", e),
                    "status": "failed",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                });
                
                generated_visualizations.push(viz_result);
                
                viz_result
            }
        };
        
        // Add a small delay between visualizations
        std::thread::sleep(std::time::Duration::from_millis(500));
    }
    
    println!("🎨 Backend: Completed visualization generation. Generated {} visualizations", generated_visualizations.len());
    
    Ok(generated_visualizations)
}

#[derive(Debug, Serialize, Deserialize)]
struct ExecuteResearchStepsRequest {
    project_id: String,
    session_id: String,
    goal: String,
    steps: Vec<serde_json::Value>,
    start_step: Option<usize>,
}

#[tauri::command]
async fn update_research_paper(
    project_id: String,
    goal: String,
    all_results: Vec<String>,
    visualizations: Vec<serde_json::Value>,
    state: State<'_, AppState>,
) -> Result<String, String> {
    println!("📝 Backend: Starting research paper update for project: {}", project_id);
    
    let api_key = state.api_key.lock().unwrap();
    if api_key.is_none() {
        return Err("No API key found".to_string());
    }
    
    let api_key = api_key.as_ref().unwrap();
    std::env::set_var("OPENAI_API_KEY", api_key);
    
    // Get existing paper content
    let mut projects = state.projects.lock().unwrap();
    let project = projects.get_mut(&project_id).ok_or("Project not found")?;
    let existing_paper = project.write_up.clone();
    drop(projects);
    
    // Get questions and answers
    let questions = {
        let projects = state.projects.lock().unwrap();
        if let Some(project) = projects.get(&project_id) {
            project.questions.clone()
        } else {
            Vec::new()
        }
    };
    
    // Prepare visualization summaries
    let visualization_summaries: Vec<String> = visualizations.iter()
        .filter_map(|viz| {
            let name = viz["name"].as_str()?;
            let description = viz["description"].as_str()?;
            let status = viz["status"].as_str()?;
            Some(format!("- {}: {} ({})", name, description, status))
        })
        .collect();
    
    // Create comprehensive paper update prompt
    let paper_update_prompt = format!(
        "You are a research assistant tasked with creating or updating a comprehensive research paper. \
        Please analyze all the provided information and create a well-structured academic paper.\n\n\
        RESEARCH GOAL:\n{}\n\n\
        INTERVIEW QUESTIONS & ANSWERS:\n{}\n\n\
        RESEARCH RESULTS:\n{}\n\n\
        GENERATED VISUALIZATIONS:\n{}\n\n\
        EXISTING PAPER CONTENT:\n{}\n\n\
        INSTRUCTIONS:\n\
        1. If there's existing content, enhance and expand it with new findings\n\
        2. If no existing content, create a complete research paper\n\
        3. Structure the paper with proper sections: Abstract, Introduction, Methodology, Results, Discussion, Conclusion\n\
        4. Incorporate all research findings, data analysis, and visualization insights\n\
        5. Reference the interview questions and answers in the methodology section\n\
        6. Include specific references to generated visualizations and their findings\n\
        7. Write in clear, academic language suitable for publication\n\
        8. Ensure logical flow from research question to conclusions\n\
        9. Highlight key insights and their implications\n\
        10. Include recommendations based on findings\n\n\
        Please provide a complete, well-formatted research paper that synthesizes all the information provided.",
        goal,
        questions.iter().map(|q| format!("Q: {}\nA: {}", q.question, q.answer.unwrap_or_else(|| "Not answered".to_string()))).collect::<Vec<_>>().join("\n\n"),
        all_results.join("\n\n"),
        visualization_summaries.join("\n"),
        existing_paper.unwrap_or("No existing content".to_string())
    );
    
    let paper_response = match cedar::llm::ask_llm(&paper_update_prompt).await {
        Ok(response) => response,
        Err(e) => {
            println!("❌ Backend: Failed to update research paper: {}", e);
            return Err(format!("Failed to update research paper: {}", e));
        }
    };
    
    // Save the updated paper to the project
    let mut projects = state.projects.lock().unwrap();
    if let Some(project) = projects.get_mut(&project_id) {
        project.write_up = paper_response.clone();
        save_project(&project_id, &project)?;
    }
    drop(projects);
    
    println!("✅ Backend: Research paper updated successfully");
    Ok(paper_response)
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
            add_variable,
            get_variables,
            update_variable,
            delete_variable,
            add_question,
            get_questions,
            answer_question,
            generate_questions,
            update_question,
            add_library,
            get_libraries,
            install_library,
            install_all_libraries,
            update_library,
            extract_libraries_from_code,
            execute_research_steps,
            generate_visualizations,
            update_research_paper,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
