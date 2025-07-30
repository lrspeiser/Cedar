use crate::cell::{NotebookCell, CellOrigin, CellType, ReferenceData};
use crate::llm;
use crate::storage;
use crate::context::NotebookContext;
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct PlanBundle {
    total_steps: usize,
    steps: Vec<PlanStep>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct PlanStep {
    pub label: String,
    pub description: String,
    #[serde(default)]
    pub code: Option<String>,
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

    // 📚 Generate relevant academic references
    let references = generate_references_for_goal(goal, &parsed.steps).await?;
    cells.extend(references);

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

/// Generate relevant academic references for a research goal
async fn generate_references_for_goal(
    goal: &str,
    steps: &[PlanStep],
) -> Result<Vec<NotebookCell>, String> {
    let step_descriptions: Vec<String> = steps.iter()
        .map(|s| format!("- {}", s.description))
        .collect();

    let prompt = format!(
        r#"Given this research goal and plan steps, suggest 3-5 relevant academic references, papers, or authoritative sources that would be helpful for this research.

Research Goal: "{goal}"

Plan Steps:
{}

Return ONLY a JSON array of reference objects. Each reference should include:
- `title`: Full title of the paper/book/website
- `authors`: Array of author names (if available)
- `journal`: Journal name or publication venue (if applicable)
- `year`: Publication year (if known)
- `url`: URL to the source (if available)
- `doi`: DOI identifier (if available)
- `abstract`: Brief description or abstract (if available)
- `relevance`: Why this reference is relevant to the research goal

Example format:
[
  {{
    "title": "Customer Churn Prediction Using Machine Learning",
    "authors": ["Smith, J.", "Johnson, A."],
    "journal": "Journal of Marketing Analytics",
    "year": 2022,
    "url": "https://example.com/paper",
    "doi": "10.1000/example.doi",
    "abstract": "This paper presents a comprehensive analysis of customer churn prediction...",
    "relevance": "Directly addresses churn analysis methodology and provides relevant techniques for identifying churn factors"
  }}
]

Focus on high-quality, peer-reviewed sources when possible. Include both recent papers and foundational works."#,
        step_descriptions.join("\n")
    );

    let raw_json = llm::ask_llm(&prompt).await?;
    let references: Vec<ReferenceData> = serde_json::from_str(&raw_json)
        .map_err(|e| format!("Failed to parse references JSON: {e}\n---\n{}", raw_json))?;

    let mut cells = vec![];
    for reference in references {
        let reference_cell = NotebookCell::new_reference(CellOrigin::Ai, &reference);
        cells.push(reference_cell);
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

/// Validate a step's output against the original plan and suggest improvements
pub async fn validate_step_output(
    step_description: &str,
    step_code: &str,
    step_output: &str,
    original_goal: &str,
    all_steps: &[PlanStep],
    current_step_index: usize,
) -> Result<StepValidation, String> {
    let steps_context: Vec<String> = all_steps.iter()
        .enumerate()
        .map(|(i, step)| {
            if i == current_step_index {
                format!("[CURRENT] {}: {}", step.description, step_output)
            } else {
                format!("{}: {}", step.description, if step.code.is_some() { "[PENDING]" } else { "[NO CODE]" })
            }
        })
        .collect();

    let prompt = format!(
        r#"You are an AI research assistant validating a step in a data analysis workflow.

ORIGINAL RESEARCH GOAL: "{original_goal}"

CURRENT STEP: "{step_description}"
CODE EXECUTED: 
{step_code}

OUTPUT RECEIVED:
{step_output}

FULL WORKFLOW CONTEXT:
{}

Analyze this step's output and determine:

1. Does the output make sense for this step?
2. Does it align with the research goal?
3. Are there any obvious issues (errors, unexpected results, missing data)?
4. What should be the next logical step?

Return ONLY a JSON object with this structure:
{{
  "is_valid": true/false,
  "confidence": 0.0-1.0,
  "issues": ["list of specific issues found"],
  "suggestions": ["list of improvement suggestions"],
  "next_step_recommendation": "what should happen next",
  "user_action_needed": "continue|revise|restart|ask_user"
}}

Be specific and actionable in your analysis."#,
        steps_context.join("\n")
    );

    let raw_json = llm::ask_llm(&prompt).await?;
    let validation: StepValidation = serde_json::from_str(&raw_json)
        .map_err(|e| format!("Failed to parse validation JSON: {e}\n---\n{}", raw_json))?;

    Ok(validation)
}

/// Generate improved code for a step based on validation feedback
pub async fn generate_improved_code(
    step_description: &str,
    original_code: &str,
    validation_feedback: &StepValidation,
) -> Result<NotebookCell, String> {
    let issues_text = validation_feedback.issues.join("\n- ");
    let suggestions_text = validation_feedback.suggestions.join("\n- ");

    let prompt = format!(
        r#"The previous code for this step had issues. Please generate improved code.

STEP: "{step_description}"

ORIGINAL CODE:
{original_code}

ISSUES FOUND:
- {issues_text}

SUGGESTIONS:
- {suggestions_text}

Generate improved Python code that addresses these issues. Return ONLY the Python code without any markdown formatting, backticks, or explanations."#
    );

    let improved_code = llm::ask_llm(&prompt).await?;
    Ok(NotebookCell::new(CellType::Code, CellOrigin::Ai, &improved_code))
}

#[derive(Debug, Deserialize)]
pub struct StepValidation {
    pub is_valid: bool,
    pub confidence: f64,
    pub issues: Vec<String>,
    pub suggestions: Vec<String>,
    pub next_step_recommendation: String,
    pub user_action_needed: String,
}
