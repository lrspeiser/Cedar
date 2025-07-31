// src/executor.rs

use std::collections::HashMap;
use std::process::{Command, Stdio};
use std::io::Write;
use std::sync::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    static ref SESSION_CODE: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
}

/// Run Python code in a session-aware manner
/// Returns: Ok(stdout) or Err(stderr)
pub fn run_python_code(code: &str) -> Result<String, String> {
    // Use a simple session ID - in a real implementation, this would come from the frontend
    let session_id = "default_session".to_string();
    
    let mut session_code = SESSION_CODE.lock().unwrap();
    
    // Get existing code for this session
    let empty_string = String::new();
    let existing_code = session_code.get(&session_id).unwrap_or(&empty_string);
    
    // Combine existing code with new code
    let full_code = if existing_code.is_empty() {
        code.to_string()
    } else {
        format!("{}\n\n# New code:\n{}", existing_code, code)
    };
    
    // Execute the combined code
    let result = run_python_code_isolated(&full_code);
    
    // If successful, update the session code
    if result.is_ok() {
        session_code.insert(session_id, full_code);
    }
    
    result
}

/// Run Python code in isolation (original implementation)
/// Returns: Ok(stdout) or Err(stderr)
pub fn run_python_code_isolated(code: &str) -> Result<String, String> {
    // Start a Python subprocess
    let mut process = match Command::new("python3")
        .arg("-u") // unbuffered output
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(child) => child,
        Err(e) => return Err(format!("Failed to start Python: {}", e)),
    };

    // Write the Python code into stdin
    if let Some(stdin) = process.stdin.as_mut() {
        if let Err(e) = stdin.write_all(code.as_bytes()) {
            return Err(format!("Failed to send code to Python: {}", e));
        }
    }

    // Wait for the process to complete and capture output
    let output = match process.wait_with_output() {
        Ok(out) => out,
        Err(e) => return Err(format!("Failed to run Python code: {}", e)),
    };

    if output.status.success() {
        let result = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(result.trim().to_string())
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr).to_string();
        Err(error_msg.trim().to_string())
    }
}
