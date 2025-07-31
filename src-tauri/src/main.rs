// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(test)]
mod tests;

use tauri::State;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::collections::HashMap;
use std::env;
use std::io::{self, Write};
use cedar::cell;
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
                
                // Try to parse as JSON first to handle missing fields
                match serde_json::from_str::<serde_json::Value>(&content) {
                    Ok(json_value) => {
                        // Ensure all required fields exist with defaults
                        let mut project_json = json_value.as_object().unwrap().clone();
                        
                        // Add missing fields with defaults
                        if !project_json.contains_key("questions") {
                            project_json.insert("questions".to_string(), serde_json::json!([]));
                        }
                        if !project_json.contains_key("libraries") {
                            project_json.insert("libraries".to_string(), serde_json::json!([]));
                        }
                        if !project_json.contains_key("variables") {
                            project_json.insert("variables".to_string(), serde_json::json!([]));
                        }
                        if !project_json.contains_key("references") {
                            project_json.insert("references".to_string(), serde_json::json!([]));
                        }
                        if !project_json.contains_key("data_files") {
                            project_json.insert("data_files".to_string(), serde_json::json!([]));
                        }
                        if !project_json.contains_key("images") {
                            project_json.insert("images".to_string(), serde_json::json!([]));
                        }
                        if !project_json.contains_key("write_up") {
                            project_json.insert("write_up".to_string(), serde_json::json!(""));
                        }
                        
                        let project: Project = serde_json::from_value(serde_json::Value::Object(project_json))
                            .map_err(|e| format!("Failed to parse project with defaults: {}", e))?;
                        projects.insert(project.id.clone(), project);
                    },
                    Err(_) => {
                        // Fallback to direct parsing
                        let project: Project = serde_json::from_str(&content)
                            .map_err(|e| format!("Failed to parse project: {}", e))?;
                        projects.insert(project.id.clone(), project);
                    }
                }
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
        save_project(&project)?;
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
            save_project(&project)?;
            Ok(())
        } else {
            Err("Question not found".to_string())
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
            save_project(&project)?;
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
        save_project(&project)?;
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
            save_project(&project)?;
        }
    }
    
    // Install the library using pip
    let install_command = {
        let projects_guard = state.projects.lock().unwrap();
        if let Some(library) = projects_guard.get(&project_id)
            .and_then(|p| p.libraries.iter().find(|l| l.name == library_name)) {
            if let Some(version) = &library.version {
                format!("pip install {}=={}", library_name, version)
            } else {
                format!("pip install {}", library_name)
            }
        } else {
            format!("pip install {}", library_name)
        }
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
            save_project(&project)?;
            Ok(())
        } else {
            Err("Library not found".to_string())
        }
    } else {
        Err("Project not found".to_string())
    }
}

#[derive(serde::Deserialize, serde::Serialize)]
struct StartResearchRequest {
    project_id: String,
    session_id: String,
    goal: String,
}

#[tauri::command]
async fn start_research(
    request: StartResearchRequest,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔬 Starting research for project: {}", request.project_id);
    
    // For now, return a simple response indicating research started
    // This is a placeholder - the full implementation would involve LLM calls
    let response = serde_json::json!({
        "status": "started",
        "session_id": request.session_id,
        "message": "Research started successfully",
        "next_step": "Generate initial questions"
    });
    
    Ok(response)
}

#[derive(serde::Deserialize, serde::Serialize)]
struct ExecuteCodeRequest {
    code: String,
    session_id: String,
}

#[tauri::command]
async fn execute_code(
    request: ExecuteCodeRequest,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔧 Executing code for session: {}", request.session_id);
    
    // For now, return a simple response indicating code execution
    // This is a placeholder - the full implementation would involve Python execution
    let response = serde_json::json!({
        "status": "executed",
        "session_id": request.session_id,
        "output": "Code execution completed (placeholder)",
        "success": true
    });
    
    Ok(response)
}

#[derive(serde::Deserialize, serde::Serialize)]
struct GenerateQuestionsRequest {
    project_id: String,
    goal: String,
}

#[tauri::command]
async fn generate_questions(
    request: GenerateQuestionsRequest,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("❓ Generating questions for project: {}", request.project_id);
    
    // For now, return a simple response with placeholder questions
    // This is a placeholder - the full implementation would involve LLM calls
    let response = serde_json::json!({
        "status": "generated",
        "project_id": request.project_id,
        "questions": [
            {
                "id": "q1",
                "question": "What specific aspects of this research are you most interested in?",
                "category": "initial",
                "status": "pending"
            },
            {
                "id": "q2", 
                "question": "Do you have any existing data or resources to work with?",
                "category": "initial",
                "status": "pending"
            }
        ]
    });
    
    Ok(response)
}

#[tauri::command]
async fn run_test_suite(state: State<'_, AppState>) -> Result<Vec<ApiTestResult>, String> {
    println!("🧪 Running test suite...");
    run_api_test_suite(state).await
}

// API Testing Functions
#[derive(Debug, Serialize, Deserialize)]
struct ApiTestRequest {
    endpoint: String,
    method: String,
    data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiTestResult {
    endpoint: String,
    success: bool,
    response: serde_json::Value,
    error: Option<String>,
    duration_ms: u64,
}

#[tauri::command]
async fn test_api_endpoint(
    request: ApiTestRequest,
    state: State<'_, AppState>,
) -> Result<ApiTestResult, String> {
    let start_time = std::time::Instant::now();
    
    let endpoint = request.endpoint.clone();
    let method = request.method.clone();
    
    let result = match (method.as_str(), endpoint.as_str()) {
        ("POST", "start_research") => {
            if let Some(data) = request.data {
                let args: StartResearchRequest = serde_json::from_value(data)
                    .map_err(|e| format!("Failed to parse start_research args: {}", e))?;
                start_research(args, state).await
                    .map(|r| ApiTestResult {
                        endpoint: endpoint.clone(),
                        success: true,
                        response: r,
                        error: None,
                        duration_ms: start_time.elapsed().as_millis() as u64,
                    })
                    .map_err(|e| ApiTestResult {
                        endpoint: endpoint.clone(),
                        success: false,
                        response: serde_json::json!({}),
                        error: Some(e),
                        duration_ms: start_time.elapsed().as_millis() as u64,
                    })
            } else {
                Err(ApiTestResult {
                    endpoint: endpoint.clone(),
                    success: false,
                    response: serde_json::json!({}),
                    error: Some("Missing data for start_research".to_string()),
                    duration_ms: start_time.elapsed().as_millis() as u64,
                })
            }
        }
        ("POST", "execute_code") => {
            if let Some(data) = request.data {
                let args: ExecuteCodeRequest = serde_json::from_value(data)
                    .map_err(|e| format!("Failed to parse execute_code args: {}", e))?;
                execute_code(args, state).await
                    .map(|r| ApiTestResult {
                        endpoint: endpoint.clone(),
                        success: true,
                        response: r,
                        error: None,
                        duration_ms: start_time.elapsed().as_millis() as u64,
                    })
                    .map_err(|e| ApiTestResult {
                        endpoint: endpoint.clone(),
                        success: false,
                        response: serde_json::json!({}),
                        error: Some(e),
                        duration_ms: start_time.elapsed().as_millis() as u64,
                    })
            } else {
                Err(ApiTestResult {
                    endpoint: endpoint.clone(),
                    success: false,
                    response: serde_json::json!({}),
                    error: Some("Missing data for execute_code".to_string()),
                    duration_ms: start_time.elapsed().as_millis() as u64,
                })
            }
        }
        ("GET", "get_projects") => {
            get_projects(state).await
                .map(|r| ApiTestResult {
                    endpoint: endpoint.clone(),
                    success: true,
                    response: serde_json::json!(r),
                    error: None,
                    duration_ms: start_time.elapsed().as_millis() as u64,
                })
                .map_err(|e| ApiTestResult {
                    endpoint: endpoint.clone(),
                    success: false,
                    response: serde_json::json!({}),
                    error: Some(e),
                    duration_ms: start_time.elapsed().as_millis() as u64,
                })
        }
        _ => Err(ApiTestResult {
            endpoint: endpoint.clone(),
            success: false,
            response: serde_json::json!({}),
            error: Some(format!("Unknown endpoint: {} {}", method, endpoint)),
            duration_ms: start_time.elapsed().as_millis() as u64,
        })
    };
    
    match result {
        Ok(test_result) => Ok(test_result),
        Err(test_result) => Ok(test_result),
    }
}

#[tauri::command]
async fn run_api_test_suite(state: State<'_, AppState>) -> Result<Vec<ApiTestResult>, String> {
    println!("🧪 Running API test suite...");
    
    let mut results = Vec::new();
    
    // Test 1: Get projects
    let test1 = ApiTestRequest {
        endpoint: "get_projects".to_string(),
        method: "GET".to_string(),
        data: None,
    };
    results.push(test_api_endpoint(test1, state.clone()).await?);
    
    // Test 2: Start research
    let test2 = ApiTestRequest {
        endpoint: "start_research".to_string(),
        method: "POST".to_string(),
        data: Some(serde_json::json!({
            "project_id": "test-project",
            "session_id": "test-session",
            "goal": "Test research goal"
        })),
    };
    results.push(test_api_endpoint(test2, state.clone()).await?);
    
    // Test 3: Execute code
    let test3 = ApiTestRequest {
        endpoint: "execute_code".to_string(),
        method: "POST".to_string(),
        data: Some(serde_json::json!({
            "code": "print('Hello, World!')",
            "session_id": "test-session"
        })),
    };
    results.push(test_api_endpoint(test3, state).await?);
    
    println!("✅ API test suite completed with {} tests", results.len());
    Ok(results)
}

// CLI Testing Functions
#[derive(Debug, Serialize, Deserialize)]
struct CliTestRequest {
    command: String,
    args: serde_json::Value,
}

async fn run_cli_test(request: CliTestRequest) -> Result<serde_json::Value, String> {
    println!("🧪 Running CLI test: {}", request.command);
    
    match request.command.as_str() {
        "start_research" => {
            let args: StartResearchRequest = serde_json::from_value(request.args)
                .map_err(|e| format!("Failed to parse start_research args: {}", e))?;
            // For CLI testing, we'll just return a mock response
            let response = serde_json::json!({
                "status": "started",
                "session_id": args.session_id,
                "message": "Research started successfully (CLI test)",
                "next_step": "Generate initial questions"
            });
            Ok(response)
        }
        "execute_code" => {
            let args: ExecuteCodeRequest = serde_json::from_value(request.args)
                .map_err(|e| format!("Failed to parse execute_code args: {}", e))?;
            // For CLI testing, we'll just return a mock response
            let response = serde_json::json!({
                "status": "executed",
                "session_id": args.session_id,
                "output": "Code execution completed (CLI test)",
                "success": true
            });
            Ok(response)
        }
        "generate_questions" => {
            let args: GenerateQuestionsRequest = serde_json::from_value(request.args)
                .map_err(|e| format!("Failed to parse generate_questions args: {}", e))?;
            // For CLI testing, we'll just return a mock response
            let response = serde_json::json!({
                "status": "generated",
                "project_id": args.project_id,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What specific aspects of this research are you most interested in?",
                        "category": "initial",
                        "status": "pending"
                    },
                    {
                        "id": "q2", 
                        "question": "Do you have any existing data or resources to work with?",
                        "category": "initial",
                        "status": "pending"
                    }
                ]
            });
            Ok(response)
        }
        "create_project" => {
            let args: CreateProjectRequest = serde_json::from_value(request.args)
                .map_err(|e| format!("Failed to parse create_project args: {}", e))?;
            // For CLI testing, we'll just return a mock response
            let response = serde_json::json!({
                "id": "cli-test-project-123",
                "name": args.name,
                "goal": args.goal,
                "created_at": chrono::Utc::now().to_rfc3339(),
                "updated_at": chrono::Utc::now().to_rfc3339(),
                "data_files": [],
                "images": [],
                "references": [],
                "variables": [],
                "questions": [],
                "libraries": [],
                "write_up": ""
            });
            Ok(response)
        }
        "get_projects" => {
            // For CLI testing, we'll just return a mock response
            let response = serde_json::json!([
                {
                    "id": "test-project-1",
                    "name": "Test Project 1",
                    "goal": "Test research goal 1",
                    "created_at": chrono::Utc::now().to_rfc3339(),
                    "updated_at": chrono::Utc::now().to_rfc3339(),
                    "data_files": [],
                    "images": [],
                    "references": [],
                    "variables": [],
                    "questions": [],
                    "libraries": [],
                    "write_up": ""
                }
            ]);
            Ok(response)
        }
        "set_api_key" => {
            let args: SetApiKeyRequest = serde_json::from_value(request.args)
                .map_err(|e| format!("Failed to parse set_api_key args: {}", e))?;
            // For CLI testing, we'll just return a mock response
            let response = serde_json::json!({
                "status": "success",
                "message": "API key set successfully (CLI test)"
            });
            Ok(response)
        }
        "get_api_key_status" => {
            // For CLI testing, we'll just return a mock response
            let response = serde_json::json!({
                "has_key": true,
                "message": "API key is set (CLI test)"
            });
            Ok(response)
        }
        _ => Err(format!("Unknown command: {}", request.command))
    }
}

fn run_cli_mode() -> Result<(), String> {
    println!("🧪 Cedar CLI Testing Mode");
    println!("Available commands:");
    println!("  start_research");
    println!("  execute_code");
    println!("  generate_questions");
    println!("  create_project");
    println!("  get_projects");
    println!("  set_api_key");
    println!("  get_api_key_status");
    println!("  exit");
    println!();
    
    loop {
        print!("cedar-test> ");
        io::stdout().flush().map_err(|e| format!("Failed to flush stdout: {}", e))?;
        
        let mut input = String::new();
        io::stdin().read_line(&mut input)
            .map_err(|e| format!("Failed to read input: {}", e))?;
        
        let input = input.trim();
        if input == "exit" {
            break;
        }
        
        if input.is_empty() {
            continue;
        }
        
        // Parse command and args
        let parts: Vec<&str> = input.splitn(2, ' ').collect();
        let command = parts[0];
        let args_json = if parts.len() > 1 { parts[1] } else { "{}" };
        
        let args: serde_json::Value = serde_json::from_str(args_json)
            .map_err(|e| format!("Invalid JSON args: {}", e))?;
        
        let request = CliTestRequest {
            command: command.to_string(),
            args,
        };
        
        // Run the test
        let runtime = tokio::runtime::Runtime::new()
            .map_err(|e| format!("Failed to create runtime: {}", e))?;
        
        match runtime.block_on(run_cli_test(request)) {
            Ok(result) => {
                println!("✅ Success:");
                println!("{}", serde_json::to_string_pretty(&result)
                    .map_err(|e| format!("Failed to serialize result: {}", e))?);
            }
            Err(e) => {
                println!("❌ Error: {}", e);
            }
        }
        println!();
    }
    
    Ok(())
}

fn main() {
    // Check for CLI testing mode
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 && args[1] == "--cli-test" {
        if let Err(e) = run_cli_mode() {
            eprintln!("❌ CLI mode error: {}", e);
            std::process::exit(1);
        }
        return;
    }
    
    // Initialize projects from disk
    let projects = load_projects().unwrap_or_else(|e| {
        println!("⚠️ Failed to load projects: {}", e);
        HashMap::new()
    });
    
    println!("📁 Loaded {} projects from disk", projects.len());
    
    // Load API key from disk
    let api_key = load_api_key().unwrap_or_else(|e| {
        println!("⚠️ Failed to load API key: {}", e);
        None
    });
    
    if api_key.is_some() {
        println!("🔑 API key loaded successfully");
    } else {
        println!("🔑 No API key found");
    }
    
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
            save_session,
            load_session,
            create_project,
            get_projects,
            get_project,
            save_file,
            update_session,
            add_variable,
            get_variables,
            update_variable,
            delete_variable,
            add_reference,
            add_question,
            get_questions,
            answer_question,
            update_question,
            add_library,
            get_libraries,
            install_library,
            update_library,
            start_research,
            execute_code,
            generate_questions,
            // API Testing endpoints
            test_api_endpoint,
            run_test_suite,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
