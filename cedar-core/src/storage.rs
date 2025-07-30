use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

/// Get the root directory for data storage
pub fn data_root() -> std::path::PathBuf {
    Path::new("data").to_path_buf()
}

/// A manifest describing a dataset and its metadata
#[derive(Debug, Serialize, Deserialize)]
pub struct DatasetManifest {
    pub name: String,
    pub source: String,
    pub query: String,
    pub record_count: Option<u64>,
    pub description: Option<String>,
    pub created_unix: u64,
}

impl DatasetManifest {
    /// Create a new dataset manifest
    pub fn new(
        name: &str,
        source: &str,
        query: &str,
        record_count: Option<u64>,
        description: Option<&str>,
    ) -> Self {
        let created_unix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            name: name.to_string(),
            source: source.to_string(),
            query: query.to_string(),
            record_count,
            description: description.map(|s| s.to_string()),
            created_unix,
        }
    }

    /// Get the file path where this manifest should be saved
    pub fn path(&self) -> std::path::PathBuf {
        let filename = format!("{}.json", self.name.replace(" ", "_").to_lowercase());
        Path::new("manifests").join(filename)
    }

    /// Save the manifest to disk
    pub fn save(&self) -> Result<(), String> {
        // Ensure manifests directory exists
        let manifests_dir = Path::new("manifests");
        if !manifests_dir.exists() {
            fs::create_dir_all(manifests_dir)
                .map_err(|e| format!("Failed to create manifests directory: {}", e))?;
        }

        // Serialize and save
        let data = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize manifest: {}", e))?;
        
        fs::write(&self.path(), data)
            .map_err(|e| format!("Failed to save manifest: {}", e))
    }
}

/// Create a new dataset manifest
pub fn create_manifest(
    name: &str,
    source: &str,
    query: &str,
    record_count: Option<u64>,
    description: Option<&str>,
) -> DatasetManifest {
    DatasetManifest::new(name, source, query, record_count, description)
}

/// Load a manifest from disk by name
pub fn load_manifest(name: &str) -> Option<DatasetManifest> {
    let filename = format!("{}.json", name.replace(" ", "_").to_lowercase());
    let path = Path::new("manifests").join(filename);
    
    if !path.exists() {
        return None;
    }

    let data = fs::read_to_string(path).ok()?;
    serde_json::from_str(&data).ok()
}

pub fn list_known_datasets() -> Vec<DatasetManifest> {
    let mut result = vec![];
    let root = data_root();
    if let Ok(entries) = std::fs::read_dir(root) {
        for entry in entries.flatten() {
            let path = entry.path().join("manifest.json");
            if path.exists() {
                if let Ok(text) = std::fs::read_to_string(&path) {
                    if let Ok(manifest) = serde_json::from_str::<DatasetManifest>(&text) {
                        result.push(manifest);
                    }
                }
            }
        }
    }
    result
}
