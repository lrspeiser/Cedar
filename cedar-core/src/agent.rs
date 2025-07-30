// src/agent.rs

use crate::llm;
use crate::cell::{NotebookCell, CellOrigin, CellType};

/// Given a user goal (natural language), ask the LLM to return a plan as a numbered list.
/// Returns a new `NotebookCell` with type `Plan`.
pub async fn generate_plan_from_goal(goal: &str) -> Result<NotebookCell, String> {
    let prompt = format!(
        "You are an AI notebook assistant. Given the following user goal:\n\n\"{}\"\n\nRespond with a clear, numbered list of steps that describe how to accomplish this using Python code and data analysis.",
        goal
    );

    let plan_text = llm::ask_llm(&prompt).await?;
    Ok(NotebookCell::new(CellType::Plan, CellOrigin::Ai, &plan_text))
}

/// Given a single plan step, ask the LLM to generate Python code for it.
pub async fn generate_code_for_step(step_description: &str) -> Result<NotebookCell, String> {
    let prompt = format!(
        "Write a clean Python code snippet to complete this task:\n\n\"{}\"\n\nDon't explain it—just output the code.",
        step_description
    );

    let code_text = llm::ask_llm(&prompt).await?;
    Ok(NotebookCell::new(CellType::Code, CellOrigin::Ai, &code_text))
}
