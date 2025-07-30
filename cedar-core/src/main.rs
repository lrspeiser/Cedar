// src/main.rs

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod agent;
mod executor;
mod llm;
mod cell;
mod deps;
mod output_parser;

use tauri::{Manager, State};
use std::sync::Mutex;

#[derive(Default)]
struct AppState {
    // Add shared app state here (e.g., notebook path, user config)
    pub last_output: Mutex<Option<String>>,
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![run_code_cell])
        .run(tauri::generate_context!())
        .expect("error while running Cedar");
}

/// Run a single Python code cell (basic version)
#[tauri::command]
fn run_code_cell(code: String, state: State<AppState>) -> Result<String, String> {
    match executor::run_python_code(&code) {
        Ok(output) => {
            let mut last = state.last_output.lock().unwrap();
            *last = Some(output.clone());
            Ok(output)
        }
        Err(err) => Err(err),
    }
}
