use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow};

#[derive(Debug, Serialize, Deserialize)]
pub struct ColumnMetadata {
    pub name: String,
    pub data_type: String,
    pub min_value: Option<String>,
    pub max_value: Option<String>,
    pub median_value: Option<String>,
    pub null_count: usize,
    pub total_count: usize,
    pub sample_values: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileMetadata {
    pub file_name: String,
    pub file_type: String,
    pub file_size: u64,
    pub total_records: usize,
    pub column_count: usize,
    pub columns: Vec<ColumnMetadata>,
    pub first_5_rows: Vec<Vec<String>>,
    pub summary: String,
    pub has_headers: bool,
    pub delimiter: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileAnalysisResult {
    pub success: bool,
    pub metadata: Option<FileMetadata>,
    pub error: Option<String>,
    pub first_10_lines: Vec<String>,
}

pub struct FileAnalyzer;

impl FileAnalyzer {
    pub fn analyze_file(file_path: &str) -> Result<FileAnalysisResult> {
        let path = Path::new(file_path);
        let file_name = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();
        
        let file_size = std::fs::metadata(file_path)?.len();
        let file_extension = path.extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        println!("Reading first 10 lines of file: {}", file_name);
        
        // Determine file type and get first 10 lines
        let (file_type, first_10_lines, delimiter) = match file_extension.as_str() {
            "csv" => Self::read_csv_file(file_path)?,
            "tsv" | "txt" => Self::read_tsv_file(file_path)?,
            "xlsx" | "xls" => Self::read_excel_file(file_path)?,
            "json" => Self::read_json_file(file_path)?,
            "parquet" => Self::read_parquet_file(file_path)?,
            _ => {
                // Try to detect delimiter for unknown files
                Self::detect_and_read_file(file_path)?
            }
        };

        println!("First 10 lines:");
        for (i, line) in first_10_lines.iter().enumerate() {
            println!("{}: {}", i + 1, line);
        }

        // Analyze the data structure
        let metadata = Self::analyze_data_structure(&first_10_lines, &file_name, &file_type, file_size, delimiter)?;

        Ok(FileAnalysisResult {
            success: true,
            metadata: Some(metadata),
            error: None,
            first_10_lines,
        })
    }

    fn read_csv_file(file_path: &str) -> Result<(String, Vec<String>, Option<String>)> {
        let file = File::open(file_path)?;
        let reader = BufReader::new(file);
        let mut lines = Vec::new();
        
        for (i, line) in reader.lines().enumerate() {
            if i >= 10 { break; }
            lines.push(line?);
        }
        
        Ok(("csv".to_string(), lines, Some(",".to_string())))
    }

    fn read_tsv_file(file_path: &str) -> Result<(String, Vec<String>, Option<String>)> {
        let file = File::open(file_path)?;
        let reader = BufReader::new(file);
        let mut lines = Vec::new();
        
        for (i, line) in reader.lines().enumerate() {
            if i >= 10 { break; }
            lines.push(line?);
        }
        
        Ok(("tsv".to_string(), lines, Some("\t".to_string())))
    }

    fn read_excel_file(file_path: &str) -> Result<(String, Vec<String>, Option<String>)> {
        // For Excel files, we'll need to use a Python script since Rust Excel libraries are complex
        // This will be handled by calling Python code
        let python_script = format!(
            r#"
import pandas as pd
import sys

try:
    df = pd.read_excel('{}')
    print("EXCEL_SUCCESS")
    print("COLUMNS:", "|".join(df.columns.astype(str)))
    print("ROWS:", len(df))
    for i, row in df.head(10).iterrows():
        print("ROW_" + str(i) + ":" + "|".join(row.astype(str)))
except Exception as e:
    print("EXCEL_ERROR:", str(e))
    sys.exit(1)
"#,
            file_path
        );

        let output = std::process::Command::new("python3")
            .arg("-c")
            .arg(&python_script)
            .output()?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = output_str.lines().collect();

        if lines.is_empty() || !lines[0].contains("EXCEL_SUCCESS") {
            return Err(anyhow!("Failed to read Excel file: {}", String::from_utf8_lossy(&output.stderr)));
        }

        let mut result_lines = Vec::new();
        for line in lines {
            if line.starts_with("ROW_") {
                let row_data = line.splitn(2, ':').nth(1).unwrap_or("");
                result_lines.push(row_data.to_string());
            }
        }

        Ok(("xlsx".to_string(), result_lines, Some("|".to_string())))
    }

    fn read_json_file(file_path: &str) -> Result<(String, Vec<String>, Option<String>)> {
        let file = File::open(file_path)?;
        let reader = BufReader::new(file);
        let mut lines = Vec::new();
        
        for (i, line) in reader.lines().enumerate() {
            if i >= 10 { break; }
            lines.push(line?);
        }
        
        Ok(("json".to_string(), lines, None))
    }

    fn read_parquet_file(file_path: &str) -> Result<(String, Vec<String>, Option<String>)> {
        // For Parquet files, we'll use Python as well
        let python_script = format!(
            r#"
import pandas as pd
import sys

try:
    df = pd.read_parquet('{}')
    print("PARQUET_SUCCESS")
    print("COLUMNS:", "|".join(df.columns.astype(str)))
    print("ROWS:", len(df))
    for i, row in df.head(10).iterrows():
        print("ROW_" + str(i) + ":" + "|".join(row.astype(str)))
except Exception as e:
    print("PARQUET_ERROR:", str(e))
    sys.exit(1)
"#,
            file_path
        );

        let output = std::process::Command::new("python3")
            .arg("-c")
            .arg(&python_script)
            .output()?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = output_str.lines().collect();

        if lines.is_empty() || !lines[0].contains("PARQUET_SUCCESS") {
            return Err(anyhow!("Failed to read Parquet file: {}", String::from_utf8_lossy(&output.stderr)));
        }

        let mut result_lines = Vec::new();
        for line in lines {
            if line.starts_with("ROW_") {
                let row_data = line.splitn(2, ':').nth(1).unwrap_or("");
                result_lines.push(row_data.to_string());
            }
        }

        Ok(("parquet".to_string(), result_lines, Some("|".to_string())))
    }

    fn detect_and_read_file(file_path: &str) -> Result<(String, Vec<String>, Option<String>)> {
        let file = File::open(file_path)?;
        let mut reader = BufReader::new(file);
        let mut first_line = String::new();
        reader.read_line(&mut first_line)?;

        // Detect delimiter
        let delimiter = if first_line.contains('\t') {
            Some("\t".to_string())
        } else if first_line.contains(';') {
            Some(";".to_string())
        } else if first_line.contains(',') {
            Some(",".to_string())
        } else {
            None
        };

        // Reset file and read first 10 lines
        let file = File::open(file_path)?;
        let reader = BufReader::new(file);
        let mut lines = Vec::new();
        
        for (i, line) in reader.lines().enumerate() {
            if i >= 10 { break; }
            lines.push(line?);
        }

        let file_type = if delimiter.is_some() { "delimited" } else { "text" };
        Ok((file_type.to_string(), lines, delimiter))
    }

    fn analyze_data_structure(
        lines: &[String], 
        file_name: &str, 
        file_type: &str, 
        file_size: u64,
        delimiter: Option<String>
    ) -> Result<FileMetadata> {
        if lines.is_empty() {
            return Err(anyhow!("No data to analyze"));
        }

        let delimiter = delimiter.unwrap_or_else(|| ",".to_string());
        let has_headers = Self::detect_headers(&lines[0], &delimiter);
        
        let start_row = if has_headers { 1 } else { 0 };
        let data_lines: Vec<&String> = lines.iter().skip(start_row).collect();
        
        if data_lines.is_empty() {
            return Err(anyhow!("No data rows found"));
        }

        // Parse headers
        let headers = if has_headers {
            Self::parse_row(&lines[0], &delimiter)
        } else {
            (0..Self::parse_row(&data_lines[0], &delimiter).len())
                .map(|i| format!("Column_{}", i + 1))
                .collect()
        };

        // Parse all data rows
        let mut all_rows = Vec::new();
        for line in data_lines {
            let row = Self::parse_row(line, &delimiter);
            all_rows.push(row);
        }

        // Analyze each column
        let mut columns = Vec::new();
        for (col_idx, header) in headers.iter().enumerate() {
            let column_data: Vec<String> = all_rows.iter()
                .map(|row| row.get(col_idx).cloned().unwrap_or_default())
                .collect();

            let metadata = Self::analyze_column(header, &column_data);
            columns.push(metadata);
        }

        // Get first 5 rows for display
        let first_5_rows = all_rows.iter()
            .take(5)
            .cloned()
            .collect();

        let summary = Self::generate_summary(file_name, file_type, &headers, all_rows.len());

        Ok(FileMetadata {
            file_name: file_name.to_string(),
            file_type: file_type.to_string(),
            file_size,
            total_records: all_rows.len(),
            column_count: headers.len(),
            columns,
            first_5_rows,
            summary,
            has_headers,
            delimiter: Some(delimiter),
        })
    }

    fn detect_headers(first_line: &str, delimiter: &str) -> bool {
        let parts: Vec<&str> = first_line.split(delimiter).collect();
        if parts.len() < 2 { return false; }

        // Check if first row looks like headers (contains text, not numbers)
        parts.iter().all(|part| {
            let trimmed = part.trim();
            !trimmed.is_empty() && 
            !trimmed.chars().all(|c| c.is_numeric() || c == '.' || c == '-') &&
            trimmed.chars().any(|c| c.is_alphabetic())
        })
    }

    fn parse_row(line: &str, delimiter: &str) -> Vec<String> {
        line.split(delimiter)
            .map(|s| s.trim().to_string())
            .collect()
    }

    fn analyze_column(header: &str, data: &[String]) -> ColumnMetadata {
        let mut numeric_values = Vec::new();
        let mut text_values = Vec::new();
        let mut null_count = 0;
        let mut sample_values = Vec::new();

        for value in data {
            let trimmed = value.trim();
            if trimmed.is_empty() || trimmed.to_lowercase() == "null" || trimmed.to_lowercase() == "nan" {
                null_count += 1;
                continue;
            }

            // Try to parse as number
            if let Ok(num) = trimmed.parse::<f64>() {
                numeric_values.push(num);
            } else {
                text_values.push(trimmed.to_string());
            }

            // Collect sample values (up to 5)
            if sample_values.len() < 5 {
                sample_values.push(trimmed.to_string());
            }
        }

        // Determine data type
        let data_type = if !numeric_values.is_empty() && text_values.is_empty() {
            "numeric".to_string()
        } else if !text_values.is_empty() && numeric_values.is_empty() {
            "text".to_string()
        } else {
            "mixed".to_string()
        };

        // Calculate statistics for numeric columns
        let (min_value, max_value, median_value) = if !numeric_values.is_empty() {
            numeric_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
            let min = numeric_values.first().map(|v| v.to_string());
            let max = numeric_values.last().map(|v| v.to_string());
            let median = if numeric_values.len() % 2 == 0 {
                let mid = numeric_values.len() / 2;
                let avg = (numeric_values[mid - 1] + numeric_values[mid]) / 2.0;
                Some(avg.to_string())
            } else {
                let mid = numeric_values.len() / 2;
                Some(numeric_values[mid].to_string())
            };
            (min, max, median)
        } else {
            (None, None, None)
        };

        ColumnMetadata {
            name: header.to_string(),
            data_type,
            min_value,
            max_value,
            median_value,
            null_count,
            total_count: data.len(),
            sample_values,
        }
    }

    fn generate_summary(file_name: &str, file_type: &str, headers: &[String], row_count: usize) -> String {
        format!(
            "File '{}' contains {} records with {} columns. File type: {}. Columns: {}",
            file_name,
            row_count,
            headers.len(),
            file_type,
            headers.join(", ")
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_csv_analysis() {
        let temp_file = NamedTempFile::new().unwrap();
        let csv_content = "Name,Age,City\nJohn,25,New York\nJane,30,Los Angeles\nBob,35,Chicago";
        write(&temp_file, csv_content).unwrap();

        let result = FileAnalyzer::analyze_file(temp_file.path().to_str().unwrap()).unwrap();
        assert!(result.success);
        assert_eq!(result.first_10_lines.len(), 3);
        
        let metadata = result.metadata.unwrap();
        assert_eq!(metadata.column_count, 3);
        assert_eq!(metadata.total_records, 3);
        assert!(metadata.has_headers);
    }

    #[test]
    fn test_tsv_analysis() {
        let temp_file = NamedTempFile::new().unwrap();
        let tsv_content = "Name\tAge\tCity\nJohn\t25\tNew York\nJane\t30\tLos Angeles";
        write(&temp_file, tsv_content).unwrap();

        let result = FileAnalyzer::analyze_file(temp_file.path().to_str().unwrap()).unwrap();
        assert!(result.success);
        
        let metadata = result.metadata.unwrap();
        assert_eq!(metadata.column_count, 3);
        assert_eq!(metadata.total_records, 2);
    }
} 