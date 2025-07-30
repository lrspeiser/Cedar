use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// The possible types of a notebook cell
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CellType {
    Intent,
    Plan,
    Code,
    Output,
    Feedback,
    Reference,
}

/// The origin of a cell: user-written or LLM-generated
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CellOrigin {
    User,
    Ai,
}

/// Structured reference data for academic citations and sources
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReferenceData {
    pub title: String,
    pub authors: Option<Vec<String>>,
    pub journal: Option<String>,
    pub year: Option<u32>,
    pub url: Option<String>,
    pub doi: Option<String>,
    pub r#abstract: Option<String>,
    pub relevance: Option<String>, // Why this reference is relevant to the research
}

/// The core structure of a notebook cell
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotebookCell {
    pub id: String,
    pub cell_type: CellType,
    pub origin: CellOrigin,
    pub content: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub execution_result: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

impl NotebookCell {
    /// Create a new cell with a unique ID
    pub fn new(cell_type: CellType, origin: CellOrigin, content: &str) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            cell_type,
            origin,
            content: content.to_string(),
            execution_result: None,
            metadata: None,
        }
    }

    /// Create a new reference cell with structured data
    pub fn new_reference(origin: CellOrigin, reference_data: &ReferenceData) -> Self {
        let content = serde_json::to_string_pretty(reference_data)
            .unwrap_or_else(|_| "Invalid reference data".to_string());
        
        Self {
            id: Uuid::new_v4().to_string(),
            cell_type: CellType::Reference,
            origin,
            content,
            execution_result: None,
            metadata: Some(serde_json::json!({
                "reference_type": "academic"
            })),
        }
    }
}
