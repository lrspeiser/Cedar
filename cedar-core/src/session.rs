use crate::context::NotebookContext;
use crate::notebook::Notebook;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// A Cedar research session (isolated)
pub struct Session {
    pub id: String,
    pub dir: PathBuf,
    pub notebook: Notebook,
    pub context: NotebookContext,
}

impl Session {
    /// Create a new session from the user’s goal (slugified)
    pub fn new_from_goal(goal: &str) -> Result<Self, String> {
        let id = slugify(goal);
        let dir = PathBuf::from(format!("sessions/{}", id));

        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create session dir: {}", e))?;

        Ok(Self {
            id,
            dir,
            notebook: Notebook::new(goal),
            context: NotebookContext::default(),
        })
    }

    /// Load an existing session by slug (folder name)
    pub fn load(slug: &str) -> Result<Self, String> {
        let dir = PathBuf::from(format!("sessions/{}", slug));
        let notebook_path = dir.join("notebook.json");
        let context_path = dir.join("context.json");

        let notebook = Notebook::load_from_file(&notebook_path)?;
        let context = NotebookContext::load_from_file(&context_path)?;

        Ok(Self {
            id: slug.to_string(),
            dir,
            notebook,
            context,
        })
    }

    /// Save session (notebook + context)
    pub fn save(&self) -> Result<(), String> {
        let notebook_path = self.dir.join("notebook.json");
        let context_path = self.dir.join("context.json");

        self.notebook.save_to_file(&notebook_path)?;
        self.context.save_to_file(&context_path)?;
        Ok(())
    }

    /// Path to write a file inside this session
    pub fn path_in_session(&self, relative: &str) -> PathBuf {
        self.dir.join(relative)
    }
}

/// Reuse the same slugify used in research.rs
fn slugify(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '_' })
        .collect()
}
