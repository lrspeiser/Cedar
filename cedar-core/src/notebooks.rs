// src/notebook.rs

use crate::cell::NotebookCell;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// The full notebook object: a list of cells + optional metadata
#[derive(Debug, Serialize, Deserialize)]
pub struct Notebook {
    pub title: String,
    pub cells: Vec<NotebookCell>,
}

impl Notebook {
    /// Create a new, empty notebook with a given title
    pub fn new(title: &str) -> Self {
        Self {
            title: title.to_string(),
            cells: vec![],
        }
    }

    /// Load a notebook from a JSON file
    pub fn load_from_file(path: &Path) -> Result<Self, String> {
        let data = fs::read_to_string(path).map_err(|e| format!("Load failed: {}", e))?;
        let notebook: Notebook =
            serde_json::from_str(&data).map_err(|e| format!("Parse error: {}", e))?;
        Ok(notebook)
    }

    /// Save notebook to a JSON file
    pub fn save_to_file(&self, path: &Path) -> Result<(), String> {
        let data = serde_json::to_string_pretty(self).map_err(|e| format!("Serialize failed: {}", e))?;
        fs::write(path, data).map_err(|e| format!("Save failed: {}", e))
    }

    /// Add a new cell to the notebook
    pub fn add_cell(&mut self, cell: NotebookCell) {
        self.cells.push(cell);
    }

    /// Replace cell content by ID
    pub fn update_cell(&mut self, cell_id: &str, new_content: &str) {
        if let Some(cell) = self.cells.iter_mut().find(|c| c.id == cell_id) {
            cell.content = new_content.to_string();
        }
    }

    /// Get the most recent cell of a given type
    pub fn latest_of_type(&self, cell_type: &str) -> Option<&NotebookCell> {
        self.cells.iter().rev().find(|c| format!("{:?}", c.cell_type).to_lowercase() == cell_type)
    }
}
