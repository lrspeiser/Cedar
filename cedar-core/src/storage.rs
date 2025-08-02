use serde::{Deserialize, Serialize};
use std::fs;

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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Visualization {
    pub id: String,
    pub name: String,
    pub visualization_type: String, // "vega-lite", "plotly", "matplotlib", "manual"
    pub description: String,
    pub filename: String,
    pub content: String,
    pub code: Option<String>,
    pub timestamp: u64,
    pub spec: Option<serde_json::Value>, // Vega-Lite specification
    pub data: Option<serde_json::Value>, // Plotly data
    pub layout: Option<serde_json::Value>, // Plotly layout
    pub project_id: String,
    pub session_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DataAnalysisCell {
    pub id: String,
    pub project_id: String,
    pub type_: String, // 'data_analysis', 'rust_analysis', 'llm_analysis'
    pub content: String,
    pub timestamp: String,
    pub status: String, // 'pending', 'active', 'completed', 'error'
    pub metadata: Option<serde_json::Value>,
    pub rust_analysis: Option<serde_json::Value>,
    pub llm_analysis: Option<serde_json::Value>,
    pub stream_lines: Option<Vec<String>>,
    pub is_streaming: bool,
}

impl DataAnalysisCell {
    pub fn new(project_id: &str, type_: &str) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            project_id: project_id.to_string(),
            type_: type_.to_string(),
            content: String::new(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            status: "pending".to_string(),
            metadata: None,
            rust_analysis: None,
            llm_analysis: None,
            stream_lines: None,
            is_streaming: false,
        }
    }

    pub fn save(&self) -> Result<(), String> {
        let path = data_root().join("analysis_cells").join(format!("{}.json", self.id));
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
        
        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize analysis cell: {}", e))?;
        
        fs::write(&path, json)
            .map_err(|e| format!("Failed to save analysis cell: {}", e))?;
        
        Ok(())
    }

    pub fn load(id: &str) -> Result<Option<Self>, String> {
        let path = data_root().join("analysis_cells").join(format!("{}.json", id));
        if !path.exists() {
            return Ok(None);
        }
        
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read analysis cell: {}", e))?;
        
        let cell: DataAnalysisCell = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to deserialize analysis cell: {}", e))?;
        
        Ok(Some(cell))
    }

    pub fn list_by_project(project_id: &str) -> Result<Vec<Self>, String> {
        let cells_dir = data_root().join("analysis_cells");
        if !cells_dir.exists() {
            return Ok(Vec::new());
        }

        let mut cells = Vec::new();
        for entry in fs::read_dir(cells_dir)
            .map_err(|e| format!("Failed to read analysis cells directory: {}", e))? {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();
            
            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(cell) = Self::load(path.file_stem().unwrap().to_str().unwrap()) {
                    if let Some(cell) = cell {
                        if cell.project_id == project_id {
                            cells.push(cell);
                        }
                    }
                }
            }
        }

        // Sort by timestamp (newest first)
        cells.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        Ok(cells)
    }

    pub fn delete(&self) -> Result<(), String> {
        let path = data_root().join("analysis_cells").join(format!("{}.json", self.id));
        if path.exists() {
            fs::remove_file(&path)
                .map_err(|e| format!("Failed to delete analysis cell: {}", e))?;
        }
        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DataAnalysisCellResult {
    pub cell_id: String,
    pub status: String,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
    pub timestamp: String,
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

impl Visualization {
    pub fn new(
        name: String,
        visualization_type: String,
        description: String,
        content: String,
        project_id: String,
        session_id: Option<String>,
    ) -> Self {
        let id = uuid::Uuid::new_v4().to_string();
        let timestamp = chrono::Utc::now().timestamp() as u64;
        let filename = format!("{}.json", name.replace(" ", "_").to_lowercase());

        // Parse content based on visualization type
        let (spec, data, layout) = match visualization_type.as_str() {
            "vega-lite" => {
                if let Ok(parsed_spec) = serde_json::from_str::<serde_json::Value>(&content) {
                    (Some(parsed_spec), None, None)
                } else {
                    (None, None, None)
                }
            }
            "plotly" => {
                if let Ok(plotly_data) = serde_json::from_str::<serde_json::Value>(&content) {
                    let data = plotly_data.get("data").cloned();
                    let layout = plotly_data.get("layout").cloned();
                    (None, data, layout)
                } else {
                    (None, None, None)
                }
            }
            _ => (None, None, None),
        };

        Self {
            id,
            name,
            visualization_type,
            description,
            filename,
            content,
            code: None,
            timestamp,
            spec,
            data,
            layout,
            project_id,
            session_id,
        }
    }

    pub fn file_path(&self) -> std::path::PathBuf {
        let mut path = data_root();
        path.push("visualizations");
        path.push(&self.project_id);
        path.push(&self.filename);
        path
    }

    pub fn save(&self) -> Result<(), String> {
        let file_path = self.file_path();
        
        // Create directory if it doesn't exist
        if let Some(parent) = file_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create visualization directory: {}", e))?;
        }

        // Save visualization metadata
        let metadata_path = file_path.with_extension("metadata.json");
        let metadata_json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize visualization metadata: {}", e))?;
        
        std::fs::write(&metadata_path, metadata_json)
            .map_err(|e| format!("Failed to save visualization metadata: {}", e))?;

        // Save visualization content
        std::fs::write(&file_path, &self.content)
            .map_err(|e| format!("Failed to save visualization content: {}", e))?;

        Ok(())
    }

    pub fn load(file_path: &std::path::Path) -> Result<Self, String> {
        let metadata_path = file_path.with_extension("metadata.json");
        
        let metadata_json = std::fs::read_to_string(&metadata_path)
            .map_err(|e| format!("Failed to read visualization metadata: {}", e))?;
        
        let mut visualization: Self = serde_json::from_str(&metadata_json)
            .map_err(|e| format!("Failed to parse visualization metadata: {}", e))?;

        // Load content
        visualization.content = std::fs::read_to_string(file_path)
            .map_err(|e| format!("Failed to read visualization content: {}", e))?;

        Ok(visualization)
    }
}

/// List all visualizations for a project
pub fn list_project_visualizations(project_id: &str) -> Result<Vec<Visualization>, String> {
    let mut path = data_root();
    path.push("visualizations");
    path.push(project_id);

    if !path.exists() {
        return Ok(Vec::new());
    }

    let mut visualizations = Vec::new();
    
    for entry in std::fs::read_dir(&path)
        .map_err(|e| format!("Failed to read visualizations directory: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let file_path = entry.path();
        
        if file_path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Ok(visualization) = Visualization::load(&file_path) {
                visualizations.push(visualization);
            }
        }
    }

    // Sort by timestamp (newest first)
    visualizations.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    Ok(visualizations)
}

/// Save a new visualization
pub fn save_visualization(visualization: &Visualization) -> Result<(), String> {
    visualization.save()
}

/// Delete a visualization
pub fn delete_visualization(project_id: &str, visualization_id: &str) -> Result<(), String> {
    let visualizations = list_project_visualizations(project_id)?;
    
    if let Some(visualization) = visualizations.iter().find(|v| v.id == visualization_id) {
        let file_path = visualization.file_path();
        let metadata_path = file_path.with_extension("metadata.json");
        
        // Delete content file
        if file_path.exists() {
            std::fs::remove_file(&file_path)
                .map_err(|e| format!("Failed to delete visualization file: {}", e))?;
        }
        
        // Delete metadata file
        if metadata_path.exists() {
            std::fs::remove_file(&metadata_path)
                .map_err(|e| format!("Failed to delete visualization metadata: {}", e))?;
        }
        
        Ok(())
    } else {
        Err("Visualization not found".to_string())
    }
}

/// Generate a Vega-Lite specification from data
pub fn generate_vega_lite_spec(
    data: &[serde_json::Value],
    chart_type: &str,
    x_field: &str,
    y_field: &str,
    title: &str,
) -> Result<serde_json::Value, String> {
    let mark = match chart_type {
        "bar" => "bar",
        "line" => "line",
        "scatter" => "point",
        "area" => "area",
        "histogram" => "bar",
        "box" => "boxplot",
        _ => "bar",
    };

    let mut spec = serde_json::json!({
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": title,
        "data": {
            "values": data
        },
        "mark": mark,
        "encoding": {
            "x": {"field": x_field, "type": "nominal"},
            "y": {"field": y_field, "type": "quantitative"}
        },
        "title": title,
        "width": 400,
        "height": 300
    });

    // Add histogram-specific encoding for histogram charts
    if chart_type == "histogram" {
        spec["encoding"]["x"]["type"] = serde_json::Value::String("quantitative".to_string());
        spec["encoding"]["x"]["bin"] = serde_json::Value::Bool(true);
        spec["encoding"]["y"]["aggregate"] = serde_json::Value::String("count".to_string());
        spec["encoding"]["y"]["field"] = serde_json::Value::String("*".to_string());
    }

    Ok(spec)
}

/// Generate a Plotly specification from data
pub fn generate_plotly_spec(
    data: &[serde_json::Value],
    chart_type: &str,
    x_field: &str,
    y_field: &str,
    title: &str,
) -> Result<serde_json::Value, String> {
    // Extract x and y values from data
    let x_values: Vec<serde_json::Value> = data
        .iter()
        .filter_map(|row| row.get(x_field).cloned())
        .collect();
    
    let y_values: Vec<serde_json::Value> = data
        .iter()
        .filter_map(|row| row.get(y_field).cloned())
        .collect();

    let plot_type = match chart_type {
        "bar" => "bar",
        "line" => "scatter",
        "scatter" => "scatter",
        "area" => "scatter",
        "histogram" => "histogram",
        "box" => "box",
        _ => "bar",
    };

    let mut trace = serde_json::json!({
        "x": x_values,
        "y": y_values,
        "type": plot_type
    });

    // Add line mode for line charts
    if chart_type == "line" {
        trace["mode"] = serde_json::Value::String("lines+markers".to_string());
    }

    // Add fill for area charts
    if chart_type == "area" {
        trace["fill"] = serde_json::Value::String("tonexty".to_string());
    }

    let spec = serde_json::json!({
        "data": [trace],
        "layout": {
            "title": title,
            "xaxis": {"title": x_field},
            "yaxis": {"title": y_field},
            "width": 600,
            "height": 400
        }
    });

    Ok(spec)
}

/// Validate Vega-Lite specification
pub fn validate_vega_lite_spec(spec: &serde_json::Value) -> Result<(), String> {
    // Basic validation - check for required fields
    if !spec.is_object() {
        return Err("Specification must be a JSON object".to_string());
    }

    let obj = spec.as_object().unwrap();
    
    if !obj.contains_key("mark") {
        return Err("Missing required field: mark".to_string());
    }
    
    if !obj.contains_key("encoding") {
        return Err("Missing required field: encoding".to_string());
    }

    // Check encoding structure
    if let Some(encoding) = obj.get("encoding") {
        if !encoding.is_object() {
            return Err("Encoding must be a JSON object".to_string());
        }
        
        let encoding_obj = encoding.as_object().unwrap();
        if !encoding_obj.contains_key("x") && !encoding_obj.contains_key("y") {
            return Err("Encoding must contain at least x or y field".to_string());
        }
    }

    Ok(())
}

/// Validate Plotly specification
pub fn validate_plotly_spec(spec: &serde_json::Value) -> Result<(), String> {
    if !spec.is_object() {
        return Err("Specification must be a JSON object".to_string());
    }

    let obj = spec.as_object().unwrap();
    
    if !obj.contains_key("data") {
        return Err("Missing required field: data".to_string());
    }
    
    if !obj.contains_key("layout") {
        return Err("Missing required field: layout".to_string());
    }

    // Check data structure
    if let Some(data) = obj.get("data") {
        if !data.is_array() {
            return Err("Data must be an array".to_string());
        }
        
        let data_array = data.as_array().unwrap();
        if data_array.is_empty() {
            return Err("Data array cannot be empty".to_string());
        }
    }

    Ok(())
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

// Analysis cell management functions
pub fn save_analysis_cell(cell: &DataAnalysisCell) -> Result<(), String> {
    cell.save()
}

pub fn load_analysis_cell(id: &str) -> Result<Option<DataAnalysisCell>, String> {
    DataAnalysisCell::load(id)
}

pub fn list_analysis_cells(project_id: &str) -> Result<Vec<DataAnalysisCell>, String> {
    DataAnalysisCell::list_by_project(project_id)
}

pub fn delete_analysis_cell(cell: &DataAnalysisCell) -> Result<(), String> {
    cell.delete()
}

pub fn update_analysis_cell_status(cell_id: &str, status: &str) -> Result<(), String> {
    if let Some(mut cell) = DataAnalysisCell::load(cell_id)? {
        cell.status = status.to_string();
        cell.timestamp = chrono::Utc::now().to_rfc3339();
        cell.save()
    } else {
        Err("Analysis cell not found".to_string())
    }
}

pub fn update_analysis_cell_content(cell_id: &str, content: &str) -> Result<(), String> {
    if let Some(mut cell) = DataAnalysisCell::load(cell_id)? {
        cell.content = content.to_string();
        cell.timestamp = chrono::Utc::now().to_rfc3339();
        cell.save()
    } else {
        Err("Analysis cell not found".to_string())
    }
}

pub fn add_rust_analysis_to_cell(cell_id: &str, rust_analysis: serde_json::Value) -> Result<(), String> {
    if let Some(mut cell) = DataAnalysisCell::load(cell_id)? {
        cell.rust_analysis = Some(rust_analysis);
        cell.timestamp = chrono::Utc::now().to_rfc3339();
        cell.save()
    } else {
        Err("Analysis cell not found".to_string())
    }
}

pub fn add_llm_analysis_to_cell(cell_id: &str, llm_analysis: serde_json::Value) -> Result<(), String> {
    if let Some(mut cell) = DataAnalysisCell::load(cell_id)? {
        cell.llm_analysis = Some(llm_analysis);
        cell.timestamp = chrono::Utc::now().to_rfc3339();
        cell.save()
    } else {
        Err("Analysis cell not found".to_string())
    }
}
