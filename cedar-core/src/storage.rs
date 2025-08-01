use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

pub fn data_root() -> std::path::PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("cedar")
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DatasetManifest {
    pub name: String,
    pub source: String,
    pub query: String,
    pub record_count: Option<u64>,
    pub description: Option<String>,
    pub created_unix: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DataFileInfo {
    pub id: String,
    pub name: String,
    pub file_type: String, // "csv", "json", "parquet", "excel", etc.
    pub size_bytes: u64,
    pub uploaded_at: u64,
    pub table_name: Option<String>, // DuckDB table name
    pub row_count: Option<u64>,
    pub column_count: Option<u32>,
    pub columns: Option<Vec<ColumnInfo>>,
    pub sample_data: Option<Vec<Vec<String>>>, // First few rows as strings
    pub data_summary: Option<String>, // LLM-generated summary
    pub source: String, // "upload", "llm_generated", "python_created"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    pub sample_values: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DataAnalysisRequest {
    pub filename: String,
    pub file_type: String,
    pub size_bytes: u64,
    pub content_preview: String, // First few lines of the file
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DataAnalysisResponse {
    pub analysis_script: String, // Python script to analyze the data
    pub data_summary: String,    // LLM-generated summary of data structure
    pub suggested_table_name: String,
    pub column_analysis: Vec<ColumnAnalysis>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ColumnAnalysis {
    pub name: String,
    pub data_type: String,
    pub description: String,
    pub sample_values: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DuckDBTableInfo {
    pub table_name: String,
    pub row_count: u64,
    pub column_count: u32,
    pub columns: Vec<ColumnInfo>,
    pub created_at: u64,
}

impl DatasetManifest {
    pub fn new(
        name: &str,
        source: &str,
        query: &str,
        record_count: Option<u64>,
        description: Option<&str>,
    ) -> Self {
        Self {
            name: name.to_string(),
            source: source.to_string(),
            query: query.to_string(),
            record_count,
            description: description.map(|s| s.to_string()),
            created_unix: chrono::Utc::now().timestamp() as u64,
        }
    }

    pub fn path(&self) -> std::path::PathBuf {
        data_root().join("datasets").join(format!("{}.json", self.name))
    }

    pub fn save(&self) -> Result<(), String> {
        let path = self.path();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
        
        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize dataset manifest: {}", e))?;
        
        fs::write(&path, json)
            .map_err(|e| format!("Failed to save dataset manifest: {}", e))?;
        
        Ok(())
    }
}

impl DataFileInfo {
    pub fn new(
        name: &str,
        file_type: &str,
        size_bytes: u64,
        source: &str,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            file_type: file_type.to_string(),
            size_bytes,
            uploaded_at: chrono::Utc::now().timestamp() as u64,
            table_name: None,
            row_count: None,
            column_count: None,
            columns: None,
            sample_data: None,
            data_summary: None,
            source: source.to_string(),
        }
    }

    pub fn file_path(&self) -> std::path::PathBuf {
        data_root().join("data_files").join(&self.name)
    }

    pub fn save(&self) -> Result<(), String> {
        let path = data_root().join("data_files").join(format!("{}.json", self.id));
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
        
        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize data file info: {}", e))?;
        
        fs::write(&path, json)
            .map_err(|e| format!("Failed to save data file info: {}", e))?;
        
        Ok(())
    }

    pub fn load(id: &str) -> Result<Option<Self>, String> {
        let path = data_root().join("data_files").join(format!("{}.json", id));
        if !path.exists() {
            return Ok(None);
        }
        
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read data file info: {}", e))?;
        
        let file_info: DataFileInfo = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to deserialize data file info: {}", e))?;
        
        Ok(Some(file_info))
    }
}

pub fn create_manifest(
    name: &str,
    source: &str,
    query: &str,
    record_count: Option<u64>,
    description: Option<&str>,
) -> DatasetManifest {
    DatasetManifest::new(name, source, query, record_count, description)
}

pub fn load_manifest(name: &str) -> Option<DatasetManifest> {
    let path = data_root().join("datasets").join(format!("{}.json", name));
    if !path.exists() {
        return None;
    }
    
    let content = fs::read_to_string(path).ok()?;
    serde_json::from_str(&content).ok()
}

pub fn list_known_datasets() -> Vec<DatasetManifest> {
    let datasets_dir = data_root().join("datasets");
    if !datasets_dir.exists() {
        return Vec::new();
    }
    
    let mut datasets = Vec::new();
    if let Ok(entries) = fs::read_dir(datasets_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                if let Some(extension) = entry.path().extension() {
                    if extension == "json" {
                        if let Ok(content) = fs::read_to_string(entry.path()) {
                            if let Ok(manifest) = serde_json::from_str::<DatasetManifest>(&content) {
                                datasets.push(manifest);
                            }
                        }
                    }
                }
            }
        }
    }
    
    datasets
}

pub fn list_data_files() -> Result<Vec<DataFileInfo>, String> {
    let data_files_dir = data_root().join("data_files");
    if !data_files_dir.exists() {
        return Ok(Vec::new());
    }
    
    let mut data_files = Vec::new();
    if let Ok(entries) = fs::read_dir(data_files_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                if let Some(extension) = entry.path().extension() {
                    if extension == "json" {
                        if let Ok(content) = fs::read_to_string(entry.path()) {
                            if let Ok(file_info) = serde_json::from_str::<DataFileInfo>(&content) {
                                data_files.push(file_info);
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(data_files)
}

pub fn save_uploaded_file(
    filename: &str,
    content: &str,
    file_type: &str,
) -> Result<DataFileInfo, String> {
    let size_bytes = content.len() as u64;
    let file_info = DataFileInfo::new(filename, file_type, size_bytes, "upload");
    
    // Save the actual file content
    let file_path = file_info.file_path();
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to save uploaded file: {}", e))?;
    
    // Save the file info
    file_info.save()?;
    
    Ok(file_info)
}

/// Generate Python script for data analysis
pub fn generate_data_analysis_script(file_info: &DataFileInfo) -> String {
    // Simplified version for testing
    format!(
        r#"
import pandas as pd
import json

print("=== DATA ANALYSIS ===")
print("File: {}")
print("Type: {}")
print("This is a simplified analysis script.")

analysis_result = {{
    "file_name": "{}",
    "row_count": 0,
    "column_count": 0,
    "columns": [],
    "sample_data": []
}}

print("\\n=== ANALYSIS RESULT ===")
print(json.dumps(analysis_result, indent=2))
"#,
        file_info.name, file_info.file_type, file_info.name
    )
}

/// Create DuckDB table from data file
pub fn create_duckdb_table(file_info: &DataFileInfo) -> Result<String, String> {
    let default_table_name = format!("table_{}", file_info.id.replace("-", "_"));
    let table_name = file_info.table_name.as_ref()
        .unwrap_or(&default_table_name);
    
    let file_path = file_info.file_path();
    let file_path_str = file_path.to_string_lossy();
    
    let create_sql = match file_info.file_type.as_str() {
        "csv" => format!(
            "CREATE TABLE {} AS SELECT * FROM read_csv_auto('{}');",
            table_name, file_path_str
        ),
        "json" => format!(
            "CREATE TABLE {} AS SELECT * FROM read_json_auto('{}');",
            table_name, file_path_str
        ),
        "parquet" => format!(
            "CREATE TABLE {} AS SELECT * FROM read_parquet('{}');",
            table_name, file_path_str
        ),
        _ => format!(
            "CREATE TABLE {} AS SELECT * FROM read_csv_auto('{}');",
            table_name, file_path_str
        ),
    };
    
    Ok(create_sql)
}

/// Get DuckDB query for table information
pub fn get_table_info_query(table_name: &str) -> String {
    format!(
        r#"
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = '{}'
ORDER BY ordinal_position;
"#,
        table_name
    )
}

/// Get DuckDB query for sample data
pub fn get_sample_data_query(table_name: &str, limit: usize) -> String {
    format!("SELECT * FROM {} LIMIT {};", table_name, limit)
}
