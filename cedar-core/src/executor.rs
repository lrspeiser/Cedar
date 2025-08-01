// src/executor.rs

use std::collections::HashMap;
use std::process::{Command, Stdio};
use std::io::Write;
use std::sync::Mutex;
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExecutionResult {
    pub stdout: String,
    pub stderr: String,
    pub logs: Vec<String>,
    pub data_summary: Option<String>,
    pub execution_time_ms: u64,
    pub success: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StepEvaluation {
    pub step_number: usize,
    pub step_description: String,
    pub execution_result: ExecutionResult,
    pub llm_assessment: String,
    pub next_steps: Vec<String>,
    pub confidence: f64,
    pub issues: Vec<String>,
    pub recommendations: Vec<String>,
}

lazy_static! {
    static ref SESSION_CODE: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
    static ref SESSION_LOGS: Mutex<HashMap<String, Vec<String>>> = Mutex::new(HashMap::new());
}

/// Run Python code with comprehensive logging and evaluation
/// Returns: ExecutionResult with detailed information
pub fn run_python_code_with_logging(code: &str, session_id: &str) -> Result<ExecutionResult, String> {
    let start_time = std::time::Instant::now();
    
    // Add logging to the Python code
    let enhanced_code = add_logging_to_code(code);
    
    let mut session_code = SESSION_CODE.lock().unwrap();
    let mut session_logs = SESSION_LOGS.lock().unwrap();
    
    // Get existing code for this session
    let empty_string = String::new();
    let existing_code = session_code.get(session_id).unwrap_or(&empty_string);
    
    // Combine existing code with new code
    let full_code = if existing_code.is_empty() {
        enhanced_code
    } else {
        format!("{}\n\n# New code:\n{}", existing_code, enhanced_code)
    };
    
    // Execute the combined code
    let result = run_python_code_isolated(&full_code);
    
    let execution_time = start_time.elapsed().as_millis() as u64;
    
    match result {
        Ok(stdout) => {
            // Extract logs and data summary
            let logs = extract_logs_from_output(&stdout);
            let data_summary = extract_data_summary(&stdout);
            
            // Update session
            session_code.insert(session_id.to_string(), full_code);
            session_logs.insert(session_id.to_string(), logs.clone());
            
            Ok(ExecutionResult {
                stdout,
                stderr: String::new(),
                logs,
                data_summary,
                execution_time_ms: execution_time,
                success: true,
            })
        },
        Err(stderr) => {
            Ok(ExecutionResult {
                stdout: String::new(),
                stderr,
                logs: vec![],
                data_summary: None,
                execution_time_ms: execution_time,
                success: false,
            })
        }
    }
}

/// Run Python code in a session-aware manner (legacy function)
/// Returns: Ok(stdout) or Err(stderr)
pub fn run_python_code(code: &str) -> Result<String, String> {
    let result = run_python_code_with_logging(code, "default_session");
    match result {
        Ok(exec_result) => {
            if exec_result.success {
                Ok(exec_result.stdout)
            } else {
                Err(exec_result.stderr)
            }
        },
        Err(e) => Err(e)
    }
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

/// Add comprehensive logging to Python code
fn add_logging_to_code(code: &str) -> String {
    let logging_imports = r#"
import logging
import sys
import time
import traceback
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def log_step(step_name, data=None):
    """Log a step with optional data"""
    logger.info(f"=== STEP: {step_name} ===")
    if data is not None:
        logger.info(f"Data: {data}")
    return data

def log_data_info(data, name="data"):
    """Log information about data"""
    if hasattr(data, 'shape'):
        logger.info(f"{name} shape: {data.shape}")
    if hasattr(data, 'dtype'):
        logger.info(f"{name} dtype: {data.dtype}")
    if hasattr(data, 'columns'):
        logger.info(f"{name} columns: {list(data.columns)}")
    if hasattr(data, 'head'):
        logger.info(f"{name} head:\n{data.head()}")
    return data

def log_result(result, name="result"):
    """Log a result"""
    logger.info(f"=== RESULT: {name} ===")
    logger.info(f"Type: {type(result)}")
    if hasattr(result, '__len__'):
        logger.info(f"Length: {len(result)}")
    logger.info(f"Value: {result}")
    return result
"#;

    format!("{}\n\n{}", logging_imports, code)
}

/// Extract logs from Python output
fn extract_logs_from_output(output: &str) -> Vec<String> {
    output
        .lines()
        .filter(|line| line.contains(" - INFO - ") || line.contains(" - ERROR - ") || line.contains(" - WARNING - "))
        .map(|line| line.to_string())
        .collect()
}

/// Extract data summary from Python output
fn extract_data_summary(output: &str) -> Option<String> {
    let lines: Vec<&str> = output.lines().collect();
    let mut summary_lines = Vec::new();
    
    for line in lines {
        if line.contains("shape:") || line.contains("dtype:") || line.contains("columns:") || line.contains("head:") {
            summary_lines.push(line);
        }
    }
    
    if summary_lines.is_empty() {
        None
    } else {
        Some(summary_lines.join("\n"))
    }
}

/// Evaluate a step using LLM
pub async fn evaluate_step_with_llm(
    step_number: usize,
    step_description: &str,
    execution_result: &ExecutionResult,
    research_goal: &str,
    previous_steps: &[StepEvaluation],
) -> Result<StepEvaluation, String> {
    use crate::llm;
    
    let previous_context = previous_steps
        .iter()
        .map(|step| format!("Step {}: {} - {}", step.step_number, step.step_description, step.llm_assessment))
        .collect::<Vec<_>>()
        .join("\n");
    
    let prompt = format!(
        r#"You are an AI research assistant evaluating a step in a data analysis workflow.

RESEARCH GOAL: "{}"

CURRENT STEP: {}
STEP DESCRIPTION: "{}"

EXECUTION RESULTS:
- Success: {}
- Execution Time: {}ms
- STDOUT: {}
- STDERR: {}
- LOGS: {}

PREVIOUS STEPS CONTEXT:
{}

Please evaluate this step and provide:

1. Assessment: What happened in this step? Was it successful?
2. Issues: Any problems or concerns?
3. Recommendations: What should be improved?
4. Next Steps: What should happen next in the research?

Return ONLY a JSON object with this structure:
{{
  "assessment": "detailed assessment of what happened",
  "next_steps": ["step 1", "step 2", "step 3"],
  "confidence": 0.85,
  "issues": ["issue 1", "issue 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}}

Be specific and actionable in your analysis."#,
        research_goal,
        step_number,
        step_description,
        execution_result.success,
        execution_result.execution_time_ms,
        execution_result.stdout,
        execution_result.stderr,
        execution_result.logs.join("\n"),
        previous_context
    );
    
    let raw_json = llm::ask_llm(&prompt).await?;
    let evaluation: serde_json::Value = serde_json::from_str(&raw_json)
        .map_err(|e| format!("Failed to parse evaluation JSON: {e}\n---\n{}", raw_json))?;
    
    Ok(StepEvaluation {
        step_number,
        step_description: step_description.to_string(),
        execution_result: execution_result.clone(),
        llm_assessment: evaluation["assessment"].as_str().unwrap_or("No assessment provided").to_string(),
        next_steps: evaluation["next_steps"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|v| v.as_str().map(|s| s.to_string()))
            .collect(),
        confidence: evaluation["confidence"].as_f64().unwrap_or(0.5),
        issues: evaluation["issues"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|v| v.as_str().map(|s| s.to_string()))
            .collect(),
        recommendations: evaluation["recommendations"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|v| v.as_str().map(|s| s.to_string()))
            .collect(),
    })
}
