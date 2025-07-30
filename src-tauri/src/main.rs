// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, State};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::collections::HashMap;

// State to manage research sessions
struct AppState {
    sessions: Mutex<HashMap<String, serde_json::Value>>,
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

#[tauri::command]
async fn start_research(
    request: ResearchRequest,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    // In a real implementation, this would call your cedar-core backend
    // For now, we'll return mock data
    let session_id = request.session_id.unwrap_or_else(|| format!("session_{}", chrono::Utc::now().timestamp()));
    
    let mock_response = serde_json::json!({
        "sessionId": session_id,
        "status": "planning",
        "cells": [
            {
                "id": "1",
                "type": "intent",
                "content": request.goal,
                "timestamp": chrono::Utc::now().to_rfc3339()
            },
            {
                "id": "2",
                "type": "plan",
                "content": "Load and examine the dataset",
                "timestamp": chrono::Utc::now().to_rfc3339()
            },
            {
                "id": "3",
                "type": "code",
                "content": "import pandas as pd\n\ndf = pd.read_csv('data.csv')\nprint(df.head())",
                "timestamp": chrono::Utc::now().to_rfc3339()
            }
        ]
    });
    
    // Store session in state
    state.sessions.lock().unwrap().insert(session_id.clone(), mock_response.clone());
    
    Ok(mock_response)
}

#[tauri::command]
async fn execute_code(
    request: ExecuteCodeRequest,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    // In a real implementation, this would execute Python code via your cedar-core
    let mock_output = serde_json::json!({
        "output": "   col1  col2  col3\n0     1     2     3\n1     4     5     6\n2     7     8     9\n3    10    11    12\n4    13    14    15",
        "validation": {
            "isValid": true,
            "confidence": 0.95,
            "issues": [],
            "suggestions": ["Consider adding data validation"],
            "nextStep": "Proceed with analysis"
        }
    });
    
    Ok(mock_output)
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
        })
        .invoke_handler(tauri::generate_handler![
            start_research,
            execute_code,
            save_session,
            load_session
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
