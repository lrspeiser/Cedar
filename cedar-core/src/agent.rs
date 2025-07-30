use crate::cell::{NotebookCell, CellOrigin, CellType};
use crate::llm;
use crate::storage;
use crate::context::NotebookContext;
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
struct PlanBundle {
    total_steps: usize,
    steps: Vec<PlanStep>,
}

#[derive(Debug, Deserialize)]
struct PlanStep {
    label: String,
    description: String,
    #[serde(default)]
    code: Option<String>,
}

/// Generate a structured multi-step plan from the user's research goal
pub async fn generate_plan_from_goal(
    goal: &str,
    context: &mut NotebookContext,
) -> Result<Vec<NotebookCell>, String> {
    let known = storage::list_known_datasets();
    let known_hint = if !known.is_empty() {
        let dataset_names: Vec<String> = known.iter().map(|d| format!("- {}", d.name)).collect();
        format!(
            "\n\nNote: These datasets are already available:\n{}",
            dataset_names.join("\n")
        )
    } else {
        "".to_string()
    };

    let context_vars = context.variables.iter()
        .map(|(k, v)| format!("{} = {}", k, v))
        .collect::<Vec<_>>()
        .join(", ");

    let context_glossary = context.glossary.iter()
        .map(|(k, v)| format!("- {}: {}", k, v))
        .collect::<Vec<_>>()
        .join("\n");

    let prompt = format!(
        r#"You are an AI notebook assistant.

Given the research goal:
"{goal}"

Known variables:
{context_vars}

Known glossary:
{context_glossary}

Return a JSON object with:
- `total_steps`: number of plan steps
- `steps`: list of steps (each with a label, description, optional code)

Each step must include:
- `label`: one of "python", "data", "plot", "discussion"
- `description`: what the step does
- optional `code`: Python code only for executable steps

Do not explain your output. Return valid JSON only.

Example:
{{
  "total_steps": 2,
  "steps": [
    {{
      "label": "data",
      "description": "Load dataset",
      "code": "df = pd.read_csv('stars.csv')"
    }},
    {{
      "label": "discussion",
      "description": "Explain dataset contents"
    }}
  ]
}}
{known_hint}
"#
    );

    let raw_json = llm::ask_llm(&prompt).await?;
    let parsed: PlanBundle = serde_json::from_str(&raw_json)
        .map_err(|e| format!("Failed to parse LLM plan JSON: {e}\n---\n{}", raw_json))?;

    let mut cells = vec![];

    // 🧠 Ask the LLM if any glossary entries should be added
    let glossary_prompt = format!(
        r#"Given the following plan steps, list any important scientific concepts, equations, or named ideas that should be included in a glossary for future reference.

Return ONLY a JSON object like:
{{ "Kepler's Third Law": "Defines how orbital period relates to distance from the Sun", ... }}

Steps:
{}
"#,
        parsed
            .steps
            .iter()
            .map(|s| format!("- {}", s.description))
            .collect::<Vec<_>>()
            .join("\n")
    );

    if let Ok(glossary_json) = llm::ask_llm(&glossary_prompt).await {
        if let Ok(entries) = serde_json::from_str::<HashMap<String, String>>(&glossary_json) {
            for (term, def) in entries {
                if !context.has_term(&term) {
                    context.set_glossary(&term, &def);
                }
            }
        }
    }

    for step in parsed.steps {
        let desc_cell = NotebookCell::new(CellType::Plan, CellOrigin::Ai, &step.description);
        cells.push(desc_cell);

        if let Some(code) = step.code {
            let code_cell = NotebookCell::new(CellType::Code, CellOrigin::Ai, &code);
            cells.push(code_cell);
        }
    }

    Ok(cells)
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
