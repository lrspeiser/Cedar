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

/// Enhanced data file information for the data tab
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

/// Column information for data files
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    pub sample_values: Vec<String>,
}

/// Data analysis request for LLM
#[derive(Debug, Serialize, Deserialize)]
pub struct DataAnalysisRequest {
    pub filename: String,
    pub file_type: String,
    pub size_bytes: u64,
    pub content_preview: String, // First few lines of the file
}

/// Data analysis response from LLM
#[derive(Debug, Serialize, Deserialize)]
pub struct DataAnalysisResponse {
    pub analysis_script: String, // Python script to analyze the data
    pub data_summary: String,    // LLM-generated summary of data structure
    pub suggested_table_name: String,
    pub column_analysis: Vec<ColumnAnalysis>,
}

/// Column analysis from LLM
#[derive(Debug, Serialize, Deserialize)]
pub struct ColumnAnalysis {
    pub name: String,
    pub data_type: String,
    pub description: String,
    pub sample_values: Vec<String>,
}

/// DuckDB table information
#[derive(Debug, Serialize, Deserialize)]
pub struct DuckDBTableInfo {
    pub table_name: String,
    pub row_count: u64,
    pub column_count: u32,
    pub columns: Vec<ColumnInfo>,
    pub created_at: u64,
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

impl DataFileInfo {
    /// Create a new data file info
    pub fn new(
        name: &str,
        file_type: &str,
        size_bytes: u64,
        source: &str,
    ) -> Self {
        let created_unix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            file_type: file_type.to_string(),
            size_bytes,
            uploaded_at: created_unix,
            table_name: None,
            row_count: None,
            column_count: None,
            columns: None,
            sample_data: None,
            data_summary: None,
            source: source.to_string(),
        }
    }

    /// Get the file path for this data file
    pub fn file_path(&self) -> std::path::PathBuf {
        data_root().join(&self.name)
    }

    /// Save data file info to disk
    pub fn save(&self) -> Result<(), String> {
        let data_dir = data_root();
        if !data_dir.exists() {
            fs::create_dir_all(&data_dir)
                .map_err(|e| format!("Failed to create data directory: {}", e))?;
        }

        let info_path = data_dir.join(format!("{}.json", self.id));
        let data = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize data file info: {}", e))?;
        
        fs::write(info_path, data)
            .map_err(|e| format!("Failed to save data file info: {}", e))
    }

    /// Load data file info from disk
    pub fn load(id: &str) -> Result<Option<Self>, String> {
        let info_path = data_root().join(format!("{}.json", id));
        
        if !info_path.exists() {
            return Ok(None);
        }

        let data = fs::read_to_string(info_path)
            .map_err(|e| format!("Failed to read data file info: {}", e))?;
        
        let info: DataFileInfo = serde_json::from_str(&data)
            .map_err(|e| format!("Failed to deserialize data file info: {}", e))?;
        
        Ok(Some(info))
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

/// List all data files in the data directory
pub fn list_data_files() -> Result<Vec<DataFileInfo>, String> {
    let mut files = vec![];
    let data_dir = data_root();
    
    if !data_dir.exists() {
        return Ok(files);
    }

    if let Ok(entries) = std::fs::read_dir(data_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(data) = fs::read_to_string(&path) {
                    if let Ok(file_info) = serde_json::from_str::<DataFileInfo>(&data) {
                        files.push(file_info);
                    }
                }
            }
        }
    }

    Ok(files)
}

/// Save uploaded file content and create DataFileInfo
pub fn save_uploaded_file(
    filename: &str,
    content: &str,
    file_type: &str,
) -> Result<DataFileInfo, String> {
    let size_bytes = content.len() as u64;
    let file_info = DataFileInfo::new(filename, file_type, size_bytes, "upload");
    
    // Save the actual file content
    let file_path = file_info.file_path();
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to save uploaded file: {}", e))?;
    
    // Save the file info
    file_info.save()?;
    
    Ok(file_info)
}

/// Generate Python script for data analysis
pub fn generate_data_analysis_script(file_info: &DataFileInfo) -> String {
    let file_path = file_info.file_path();
    let file_path_str = file_path.to_string_lossy();
    
    match file_info.file_type.as_str() {
        "csv" => format!(
            r#"
import pandas as pd
import json

# Read the CSV file
df = pd.read_csv('{}')

# Basic information
print("=== DATA ANALYSIS ===")
print(f"File: {file_info.name}")
print(f"Shape: {{df.shape[0]}} rows, {{df.shape[1]}} columns")
print(f"Memory usage: {{df.memory_usage(deep=True).sum() / 1024:.2f}} KB")

# Column information
print("\n=== COLUMNS ===")
for col in df.columns:
    dtype = str(df[col].dtype)
    null_count = df[col].isnull().sum()
    unique_count = df[col].nunique()
    sample_values = df[col].dropna().head(3).astype(str).tolist()
    
    print(f"Column: {{col}}")
    print(f"  Type: {{dtype}}")
    print(f"  Null values: {{null_count}}")
    print(f"  Unique values: {{unique_count}}")
    print(f"  Sample values: {{sample_values}}")
    print()

# Sample data
print("=== SAMPLE DATA ===")
print(df.head().to_string())

# Data summary
print("\n=== DATA SUMMARY ===")
print(df.describe().to_string())

# Save analysis results
analysis_result = {{
    "file_name": "{file_info.name}",
    "row_count": int(df.shape[0]),
    "column_count": int(df.shape[1]),
    "columns": [
        {{
            "name": col,
            "data_type": str(df[col].dtype),
            "nullable": df[col].isnull().any(),
            "sample_values": df[col].dropna().head(3).astype(str).tolist()
        }}
        for col in df.columns
    ],
    "sample_data": df.head().values.tolist()
}}

print("\\n=== ANALYSIS RESULT ===")
print(json.dumps(analysis_result, indent=2))
"#,
            file_path_str
        ),
        "json" => format!(
            r#"
import json
import pandas as pd

# Read the JSON file
with open('{}', 'r') as f:
    data = json.load(f)

# Convert to DataFrame if it's a list of objects
if isinstance(data, list):
    df = pd.DataFrame(data)
else:
    df = pd.DataFrame([data])

print("=== DATA ANALYSIS ===")
print(f"File: {file_info.name}")
print(f"Shape: {{df.shape[0]}} rows, {{df.shape[1]}} columns")

# Column information
print("\n=== COLUMNS ===")
for col in df.columns:
    dtype = str(df[col].dtype)
    null_count = df[col].isnull().sum()
    unique_count = df[col].nunique()
    sample_values = df[col].dropna().head(3).astype(str).tolist()
    
    print(f"Column: {{col}}")
    print(f"  Type: {{dtype}}")
    print(f"  Null values: {{null_count}}")
    print(f"  Unique values: {{unique_count}}")
    print(f"  Sample values: {{sample_values}}")
    print()

# Sample data
print("=== SAMPLE DATA ===")
print(df.head().to_string())

# Save analysis results
analysis_result = {{
    "file_name": "{file_info.name}",
    "row_count": int(df.shape[0]),
    "column_count": int(df.shape[1]),
    "columns": [
        {{
            "name": col,
            "data_type": str(df[col].dtype),
            "nullable": df[col].isnull().any(),
            "sample_values": df[col].dropna().head(3).astype(str).tolist()
        }}
        for col in df.columns
    ],
    "sample_data": df.head().values.tolist()
}}

print("\\n=== ANALYSIS RESULT ===")
print(json.dumps(analysis_result, indent=2))
"#,
            file_path_str
        ),
        _ => format!(
            r#"
import pandas as pd
import json

print("=== DATA ANALYSIS ===")
print(f"File: {file_info.name}")
print(f"Type: {file_info.file_type}")
print("This file type requires manual analysis.")

# Try to read with pandas
try:
    if '{file_info.file_type}' == 'parquet':
        df = pd.read_parquet('{file_path_str}')
    elif '{file_info.file_type}' == 'excel':
        df = pd.read_excel('{file_path_str}')
    else:
        # Try to read as CSV
        df = pd.read_csv('{file_path_str}')
    
    print(f"Successfully read file with shape: {{df.shape}}")
    print("\\n=== SAMPLE DATA ===")
    print(df.head().to_string())
    
    analysis_result = {{
        "file_name": "{file_info.name}",
        "row_count": int(df.shape[0]),
        "column_count": int(df.shape[1]),
        "columns": [
            {{
                "name": col,
                "data_type": str(df[col].dtype),
                "nullable": df[col].isnull().any(),
                "sample_values": df[col].dropna().head(3).astype(str).tolist()
            }}
            for col in df.columns
        ],
        "sample_data": df.head().values.tolist()
    }}
    
    print("\\n=== ANALYSIS RESULT ===")
    print(json.dumps(analysis_result, indent=2))
    
except Exception as e:
    print(f"Error reading file: {{e}}")
    analysis_result = {{
        "file_name": "{file_info.name}",
        "error": str(e)
    }}
    print("\\n=== ANALYSIS RESULT ===")
    print(json.dumps(analysis_result, indent=2))
"#
        ),
    }
}

/// Create DuckDB table from data file
pub fn create_duckdb_table(file_info: &DataFileInfo) -> Result<String, String> {
    let table_name = file_info.table_name.as_ref()
        .unwrap_or(&format!("table_{}", file_info.id.replace("-", "_")));
    
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
