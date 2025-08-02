# Rust File Analyzer Implementation

## Overview

This document describes the implementation of a comprehensive Rust-based file analysis system that can handle multiple file types, extract metadata, and provide intelligent recommendations for parquet conversion. The system is designed to be integrated into the Cedar frontend for seamless file upload and analysis.

## Features

### ✅ **Supported File Types**
- **CSV** (.csv) - Comma-separated values
- **TSV** (.tsv, .txt) - Tab-separated values  
- **Excel** (.xlsx, .xls) - Microsoft Excel files
- **JSON** (.json) - JavaScript Object Notation
- **Parquet** (.parquet) - Apache Parquet files
- **Unknown delimiters** - Auto-detection of separators (;, |, etc.)

### ✅ **Comprehensive Metadata Analysis**
- **File Information**: Name, type, size, record count, column count
- **Column Analysis**: Data types, null counts, min/max/median values
- **Data Quality**: Missing data detection, corrupt data handling
- **Sample Data**: First 10 lines display, first 5 rows for analysis
- **Header Detection**: Automatic detection of header rows

### ✅ **Intelligent Data Type Detection**
- **Numeric**: Integers, floats, with statistical analysis
- **Text**: String data with sample values
- **Mixed**: Columns with both numeric and text data
- **Null Handling**: Proper detection of empty, null, NaN values

### ✅ **Parquet Conversion Recommendations**
- **Data Quality Assessment**: Null percentage, mixed type detection
- **Type Conversion Code**: Python scripts for proper data type handling
- **Optimization Tips**: Compression settings, performance recommendations

## Architecture

### Core Components

#### 1. **FileAnalyzer** (Main Struct)
```rust
pub struct FileAnalyzer;

impl FileAnalyzer {
    pub fn analyze_file(file_path: &str) -> Result<FileAnalysisResult>
}
```

#### 2. **Data Structures**
```rust
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
```

## Implementation Details

### File Type Detection and Reading

#### CSV Files
```rust
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
```

#### Excel Files (Python Integration)
```rust
fn read_excel_file(file_path: &str) -> Result<(String, Vec<String>, Option<String>)> {
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
    
    // Parse Python output and return structured data
}
```

#### Delimiter Auto-Detection
```rust
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

    // Read first 10 lines
    // ...
}
```

### Data Analysis Engine

#### Column Analysis
```rust
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

    // Determine data type and calculate statistics
    let data_type = if !numeric_values.is_empty() && text_values.is_empty() {
        "numeric".to_string()
    } else if !text_values.is_empty() && numeric_values.is_empty() {
        "text".to_string()
    } else {
        "mixed".to_string()
    };

    // Calculate min, max, median for numeric columns
    // ...
}
```

#### Header Detection
```rust
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
```

## Integration with Frontend

### API Integration
The file analyzer can be integrated into the Cedar frontend through:

1. **Direct Rust Integration**: Call the analyzer from the frontend
2. **HTTP API**: Expose the analyzer as a REST endpoint
3. **Command Line**: Use as a standalone tool

### Example Frontend Integration
```typescript
// In DataTab.tsx
const analyzeFileWithRust = async (file: File) => {
  const result = await FileAnalyzer.analyze_file(file.path);
  
  if (result.success) {
    const metadata = result.metadata;
    
    // Display comprehensive analysis
    console.log(`File: ${metadata.file_name}`);
    console.log(`Records: ${metadata.total_records}`);
    console.log(`Columns: ${metadata.column_count}`);
    
    // Show column analysis
    metadata.columns.forEach(column => {
      console.log(`Column ${column.name}: ${column.data_type}`);
      console.log(`  Nulls: ${column.null_count}/${column.total_count}`);
      if (column.min_value) {
        console.log(`  Range: ${column.min_value} - ${column.max_value}`);
      }
    });
  }
};
```

## Testing

### Comprehensive Test Suite

#### 1. **Integration Test** (`integration_test.rs`)
- Tests complete workflow from file creation to analysis
- Demonstrates metadata extraction and parquet recommendations
- Shows data quality assessment

#### 2. **File Type Tests** (`test_all_file_types.rs`)
- Tests all supported file formats
- Verifies delimiter auto-detection
- Validates Excel and Parquet Python integration

#### 3. **Unit Tests** (in `file_analyzer.rs`)
```rust
#[test]
fn test_csv_analysis() {
    let temp_file = NamedTempFile::new().unwrap();
    let csv_content = "Name,Age,City\nJohn,25,New York\nJane,30,Los Angeles";
    write(&temp_file, csv_content).unwrap();

    let result = FileAnalyzer::analyze_file(temp_file.path().to_str().unwrap()).unwrap();
    assert!(result.success);
    
    let metadata = result.metadata.unwrap();
    assert_eq!(metadata.column_count, 3);
    assert_eq!(metadata.total_records, 2);
    assert!(metadata.has_headers);
}
```

### Test Results
```
🧪 Testing File Analyzer - All File Types

=== Test 1: CSV File ===
✅ CSV file test passed
   Records: 5, Columns: 4
   Column 'Age': numeric (Min: 25, Max: 42, Median: 30)

=== Test 2: TSV File ===
✅ TSV file test passed
   Records: 4, Columns: 4

=== Test 3: Excel File ===
✅ Excel file test passed
   Records: 5, Columns: 5

=== Test 4: JSON File ===
✅ JSON file test passed

=== Test 5: Unknown Delimiter File ===
✅ Unknown delimiter file test passed
   Detected delimiter: Some(";")
```

## Performance Characteristics

### Memory Usage
- **Efficient**: Only reads first 10 lines for analysis
- **Streaming**: Processes data line by line
- **Minimal**: No large data structures in memory

### Speed
- **Fast**: Sub-second analysis for typical files
- **Scalable**: Performance independent of file size
- **Optimized**: Uses efficient string parsing

### Accuracy
- **Reliable**: Robust error handling
- **Precise**: Accurate data type detection
- **Comprehensive**: Detailed metadata extraction

## Error Handling

### Robust Error Management
```rust
pub struct FileAnalysisResult {
    pub success: bool,
    pub metadata: Option<FileMetadata>,
    pub error: Option<String>,
    pub first_10_lines: Vec<String>,
}
```

### Common Error Scenarios
1. **File Not Found**: Clear error message with file path
2. **Permission Denied**: Access control error handling
3. **Corrupt Files**: Graceful degradation with partial analysis
4. **Python Dependencies**: Fallback for missing Excel/Parquet support

## Future Enhancements

### Planned Features
1. **More File Types**: XML, YAML, Avro support
2. **Advanced Analytics**: Statistical summaries, data profiling
3. **Schema Inference**: Automatic schema generation
4. **Data Validation**: Rule-based data quality checks
5. **Performance Optimization**: Parallel processing for large files

### Integration Opportunities
1. **Database Connectors**: Direct database table analysis
2. **Cloud Storage**: S3, GCS, Azure blob support
3. **Streaming**: Real-time data analysis
4. **Machine Learning**: Automated data type classification

## Usage Examples

### Basic Usage
```rust
use cedar::file_analyzer::FileAnalyzer;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let result = FileAnalyzer::analyze_file("data.csv")?;
    
    if result.success {
        let metadata = result.metadata.unwrap();
        println!("File analysis completed successfully!");
        println!("Records: {}, Columns: {}", metadata.total_records, metadata.column_count);
    }
    
    Ok(())
}
```

### Advanced Usage with Custom Analysis
```rust
fn custom_analysis(metadata: &FileMetadata) {
    // Data quality assessment
    let total_nulls: usize = metadata.columns.iter().map(|c| c.null_count).sum();
    let total_cells = metadata.total_records * metadata.column_count;
    let null_percentage = (total_nulls as f64 / total_cells as f64) * 100.0;
    
    println!("Data Quality Report:");
    println!("  Null percentage: {:.1}%", null_percentage);
    println!("  Mixed type columns: {}", 
        metadata.columns.iter().filter(|c| c.data_type == "mixed").count());
    
    // Generate conversion recommendations
    if null_percentage > 10.0 {
        println!("  ⚠️  High null percentage - consider data cleaning");
    }
}
```

## Conclusion

The Rust File Analyzer provides a robust, efficient, and comprehensive solution for file analysis and metadata extraction. It successfully handles multiple file types, provides detailed column analysis, and generates intelligent recommendations for data processing workflows.

The system is ready for integration into the Cedar frontend and provides a solid foundation for advanced data analysis features. 