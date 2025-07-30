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
}

/// The origin of a cell: user-written or LLM-generated
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CellOrigin {
    User,
    Ai,
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
}
