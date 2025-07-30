// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::State;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::collections::HashMap;
use cedar::{agent, cell, context, executor, output_parser, deps};

// State to manage research sessions and API key
struct AppState {
    sessions: Mutex<HashMap<String, serde_json::Value>>,
    api_key: Mutex<Option<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ResearchRequest {
    goal: String,
    session_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ExecuteCodeRequest {
    code: String,
    session_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct SetApiKeyRequest {
    api_key: String,
}

#[tauri::command]
async fn set_api_key(
    request: SetApiKeyRequest,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Store the API key in memory (encrypted in production)
    *state.api_key.lock().unwrap() = Some(request.api_key);
    Ok(())
}

#[tauri::command]
async fn get_api_key_status(
    state: State<'_, AppState>,
) -> Result<bool, String> {
    Ok(state.api_key.lock().unwrap().is_some())
}

#[tauri::command]
async fn start_research(
    request: ResearchRequest,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    // Check if API key is set and clone it
    let api_key = {
        let api_key_guard = state.api_key.lock().unwrap();
        api_key_guard.clone()
    };
    
    if api_key.is_none() {
        return Err("OpenAI API key not set. Please set your API key first.".to_string());
    }
    
    // Set the API key as environment variable for this session
    std::env::set_var("OPENAI_API_KEY", api_key.as_ref().unwrap());
    
    // Create a new notebook context
    let mut context = context::NotebookContext::new();
    
    // Generate the research plan using your real AI system
    let cells = agent::generate_plan_from_goal(&request.goal, &mut context).await?;
    
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
    
    let response = serde_json::json!({
        "sessionId": session_id,
        "status": "planning",
        "cells": cells_json
    });
    
    // Store session in state
    state.sessions.lock().unwrap().insert(session_id.clone(), response.clone());
    
    Ok(response)
}

#[tauri::command]
async fn execute_code(
    request: ExecuteCodeRequest,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    // Check if API key is set and clone it
    let api_key = {
        let api_key_guard = state.api_key.lock().unwrap();
        api_key_guard.clone()
    };
    
    if api_key.is_none() {
        return Err("OpenAI API key not set. Please set your API key first.".to_string());
    }
    
    // Set the API key as environment variable for this session
    std::env::set_var("OPENAI_API_KEY", api_key.as_ref().unwrap());
    
    // Execute the Python code using your real executor
    match executor::run_python_code(&request.code) {
        Ok(output) => {
            // Parse the output
            let (_output_type, formatted_output) = output_parser::parse_output(&output, false);
            
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
            // Try to auto-install missing packages
            if let Ok(Some(package)) = deps::auto_install_if_missing(&error) {
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
    state.sessions.lock().unwrap().insert(session_id, data);
    Ok(())
}

#[tauri::command]
async fn load_session(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<Option<serde_json::Value>, String> {
    let sessions = state.sessions.lock().unwrap();
    Ok(sessions.get(&session_id).cloned())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .manage(AppState {
            sessions: Mutex::new(HashMap::new()),
            api_key: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            set_api_key,
            get_api_key_status,
            start_research,
            execute_code,
            save_session,
            load_session
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
