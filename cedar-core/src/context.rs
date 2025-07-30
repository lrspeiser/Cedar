use std::collections::HashMap;

/// Context for a notebook session, including variables and glossary
#[derive(Debug, Clone)]
pub struct NotebookContext {
    pub variables: HashMap<String, String>,
    pub glossary: HashMap<String, String>,
}

impl NotebookContext {
    /// Create a new empty notebook context
    pub fn new() -> Self {
        Self {
            variables: HashMap::new(),
            glossary: HashMap::new(),
        }
    }

    /// Set a variable in the context
    pub fn set_variable(&mut self, name: &str, value: &str) {
        self.variables.insert(name.to_string(), value.to_string());
    }

    /// Get a variable from the context
    pub fn get_variable(&self, name: &str) -> Option<&String> {
        self.variables.get(name)
    }

    /// Set a glossary term
    pub fn set_glossary(&mut self, term: &str, definition: &str) {
        self.glossary.insert(term.to_string(), definition.to_string());
    }

    /// Get a glossary term
    pub fn get_glossary(&self, term: &str) -> Option<&String> {
        self.glossary.get(term)
    }

    /// Check if a term exists in the glossary
    pub fn has_term(&self, term: &str) -> bool {
        self.glossary.contains_key(term)
    }

    /// Update context from executed code (extract variables, etc.)
    pub fn update_from_code(&mut self, code: &str) {
        // Simple variable extraction - look for assignments
        for line in code.lines() {
            let line = line.trim();
            if let Some(pos) = line.find('=') {
                let var_name = line[..pos].trim();
                if var_name.chars().all(|c| c.is_alphanumeric() || c == '_') {
                    // This is a simple variable assignment
                    // In a real implementation, you'd want to parse the value more carefully
                    let value = line[pos + 1..].trim();
                    if !value.is_empty() {
                        self.set_variable(var_name, value);
                    }
                }
            }
        }
    }
}
