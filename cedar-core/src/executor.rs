// src/executor.rs

use std::process::{Command, Stdio};
use std::io::Write;

/// Run Python code by spawning a subprocess
/// Returns: Ok(stdout) or Err(stderr)
pub fn run_python_code(code: &str) -> Result<String, String> {
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
