// src/agent.rs


use crate::llm;
use crate::storage;

use crate::cell::{NotebookCell, CellOrigin, CellType};

/// Given a user goal (natural language), ask the LLM to return a plan as a numbered list.
/// Looks for known datasets and mentions them in the prompt

pub async fn generate_plan_from_goal(goal: &str) -> Result<NotebookCell, String> {
    let known = storage::list_known_datasets();

    // Pass known dataset names into the LLM prompt
    let known_datasets = if !known.is_empty() {
        let names: Vec<String> = known.iter().map(|d| format!("- {}", d.name)).collect();
        format!(
            "\n\nNote: These datasets are already available locally:\n{}",
            names.join("\n")
        )
    } else {
        "".to_string()
    };

    let prompt = format!(
        "You are a notebook assistant. Given the user goal:\n\"{}\"{}\n\nReturn a numbered list of plain English steps to complete this task using Python and pandas. Use available data where possible.",
        goal, known_datasets
    );

    let plan_text = crate::llm::ask_llm(&prompt).await?;
    Ok(NotebookCell::new(CellType::Plan, CellOrigin::Ai, &plan_text))
}

/// Given a single plan step, ask the LLM to generate Python code for it.
pub async fn generate_code_for_step(step_description: &str) -> Result<NotebookCell, String> {
    let prompt = format!(
        "Write a clean Python code snippet to complete this task:\n\n\"{}\"\n\nIMPORTANT: Return ONLY the Python code without any markdown formatting, backticks, or explanations. Just the raw Python code that can be executed directly.",
        step_description
    );

    let code_text = llm::ask_llm(&prompt).await?;
    Ok(NotebookCell::new(CellType::Code, CellOrigin::Ai, &code_text))
}
