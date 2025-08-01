# Data Management System with DuckDB Integration

## Overview

Cedar now includes a comprehensive data management system that provides:

- **File Upload & Analysis**: Automatic file type detection and LLM-powered data structure analysis
- **DuckDB Integration**: PostgreSQL-style SQL interface for data querying and manipulation
- **LLM Integration**: AI-powered data understanding and analysis
- **Standardized Storage**: Consistent data storage and retrieval across the application

## Features

### 1. File Upload & Processing

#### Supported File Types
- **CSV**: Comma-separated values with automatic delimiter detection
- **JSON**: Structured data with automatic schema inference
- **Parquet**: Columnar data format for efficient storage
- **Excel**: Spreadsheet data (.xlsx, .xls)
- **TSV**: Tab-separated values

#### Automatic Processing
- File type detection from extension and content
- Content preview generation for LLM analysis
- Metadata extraction (size, row count, column count)
- Automatic table name generation

### 2. LLM-Powered Data Analysis

#### Analysis Features
- **Data Structure Understanding**: LLM analyzes data structure and provides insights
- **Column Analysis**: Automatic data type detection and column descriptions
- **Sample Data Extraction**: First few rows for preview and validation
- **Data Summary**: Natural language description of the dataset

#### Analysis Process
1. File upload triggers automatic LLM analysis
2. LLM generates Python script for data analysis
3. Script executes to extract metadata and sample data
4. Results are stored with the file for future reference

### 3. DuckDB Integration

#### PostgreSQL-Style Interface
- Standard SQL syntax support
- Automatic table creation from uploaded files
- Query execution with result formatting
- Error handling and reporting

#### Database Features
- **Automatic Schema Inference**: DuckDB automatically detects data types
- **Query Optimization**: Built-in query optimization for performance
- **Transaction Support**: ACID-compliant transactions
- **File Format Support**: Native support for CSV, JSON, Parquet, and more

## Architecture

### Backend Components

#### 1. Storage Module (`cedar-core/src/storage.rs`)
```rust
// Core data structures
pub struct DataFileInfo {
    pub id: String,
    pub name: String,
    pub file_type: String,
    pub size_bytes: u64,
    pub uploaded_at: u64,
    pub table_name: Option<String>,
    pub row_count: Option<u64>,
    pub column_count: Option<u32>,
    pub columns: Option<Vec<ColumnInfo>>,
    pub sample_data: Option<Vec<Vec<String>>>,
    pub data_summary: Option<String>,
    pub source: String,
}

pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    pub sample_values: Vec<String>,
}
```

#### 2. Tauri Backend Commands
- `upload_data_file`: Handles file upload and initial analysis
- `analyze_data_file`: Performs detailed data analysis
- `execute_duckdb_query`: Executes SQL queries on data tables
- `list_data_files`: Retrieves all data files for a project

#### 3. Frontend Components
- **DataTab**: Enhanced UI for data management
- **File Upload**: Drag-and-drop or file picker interface
- **Query Interface**: SQL editor with result display
- **Data Preview**: Table view of uploaded data

### Data Flow

1. **File Upload**
   ```
   User Upload → File Type Detection → Content Storage → LLM Analysis → DuckDB Table Creation
   ```

2. **Data Analysis**
   ```
   File Selection → Python Script Generation → Execution → Result Parsing → Metadata Update
   ```

3. **Query Execution**
   ```
   SQL Query → DuckDB Execution → Result Formatting → Frontend Display
   ```

## Usage Examples

### 1. Uploading a CSV File

```javascript
// Frontend API call
const result = await apiService.uploadDataFile({
  projectId: 'project-123',
  filename: 'employees.csv',
  content: 'name,age,department\nJohn,30,Engineering\nJane,25,Marketing',
  fileType: 'csv'
});

// Backend automatically:
// 1. Detects file type
// 2. Sends to LLM for analysis
// 3. Creates DuckDB table
// 4. Returns file info with analysis
```

### 2. Executing SQL Queries

```javascript
// Query the uploaded data
const results = await apiService.executeDuckDBQuery({
  projectId: 'project-123',
  tableName: 'table_abc123',
  query: 'SELECT department, AVG(CAST(age AS FLOAT)) as avg_age FROM table_abc123 GROUP BY department'
});
```

### 3. Analyzing Data Structure

```javascript
// Get detailed analysis of uploaded file
const analysis = await apiService.analyzeDataFile({
  projectId: 'project-123',
  fileId: 'file-456'
});
```

## Integration with Research Workflow

### Data Context in Research

When starting research, the system automatically includes data context:

```javascript
// Research with data integration
const research = await apiService.startResearch({
  projectId: 'project-123',
  sessionId: 'session-456',
  goal: 'Analyze employee performance patterns using the uploaded data'
});

// The LLM automatically has access to:
// - Data file metadata
// - Column information
// - Sample data
// - Data summary
```

### Code Generation with Data

The LLM can generate code that references uploaded data:

```python
# Example generated code
import pandas as pd
import duckdb

# Load data from DuckDB
conn = duckdb.connect('data.db')
df = conn.execute("SELECT * FROM table_abc123").df()

# Perform analysis
avg_salary_by_dept = df.groupby('department')['salary'].mean()
print(avg_salary_by_dept)
```

## Testing

### Test Suite

Use the provided test suite to verify functionality:

```javascript
// Load test suite in browser console
// Copy content from test-data-management.js

// Run all tests
await testDataManagement();

// Clean up
await cleanupTestProject();
```

### Manual Testing

1. **File Upload Test**
   - Upload CSV file with employee data
   - Verify automatic analysis
   - Check DuckDB table creation

2. **Query Test**
   - Execute simple SELECT query
   - Test aggregation functions
   - Verify result formatting

3. **Integration Test**
   - Start research with data context
   - Verify LLM uses data information
   - Check generated code references

## Configuration

### Dependencies

#### Backend Dependencies
```toml
# cedar-core/Cargo.toml
duckdb = { version = "0.9", features = ["bundled"] }

# src-tauri/Cargo.toml
duckdb = { version = "0.9", features = ["bundled"] }
```

#### Frontend Dependencies
No additional dependencies required - uses existing Tauri integration.

### Environment Variables

- `OPENAI_API_KEY`: Required for LLM-powered data analysis
- No additional environment variables needed for DuckDB

## Performance Considerations

### File Size Limits
- **Recommended**: Files under 100MB for optimal performance
- **Maximum**: Limited by available system memory
- **Processing**: Large files may take longer for LLM analysis

### Query Performance
- **DuckDB Optimization**: Automatic query optimization
- **Indexing**: Automatic indexing for common query patterns
- **Memory Usage**: Efficient memory management for large datasets

### Caching
- **File Metadata**: Cached in memory for fast access
- **Query Results**: Not cached by default (stateless)
- **Analysis Results**: Stored with file metadata

## Security Considerations

### File Upload Security
- **File Type Validation**: Strict file type checking
- **Content Validation**: Malicious content detection
- **Size Limits**: Configurable file size limits

### Data Privacy
- **Local Storage**: All data stored locally on user's machine
- **No Cloud Upload**: No data sent to external services (except LLM analysis)
- **API Key Security**: OpenAI API key handled securely

### Query Security
- **SQL Injection Protection**: Parameterized queries
- **Access Control**: Project-based data isolation
- **Query Limits**: Configurable query execution limits

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file format is supported
   - Verify file size is within limits
   - Ensure OpenAI API key is configured

2. **LLM Analysis Fails**
   - Verify OpenAI API key is valid
   - Check internet connection
   - Review file content for issues

3. **Query Execution Fails**
   - Verify table name is correct
   - Check SQL syntax
   - Ensure data types are compatible

### Debug Information

Enable debug logging to troubleshoot issues:

```javascript
// Frontend debugging
console.log('API Response:', response);

// Backend debugging (in Tauri logs)
// Check application logs for detailed error information
```

## Future Enhancements

### Planned Features
1. **Data Visualization**: Built-in charts and graphs
2. **Advanced Analytics**: Statistical analysis functions
3. **Data Export**: Export query results to various formats
4. **Collaborative Features**: Share data files between projects
5. **Real-time Updates**: Live data streaming capabilities

### Integration Opportunities
1. **External Databases**: Connect to PostgreSQL, MySQL, etc.
2. **Cloud Storage**: Integration with S3, Google Cloud Storage
3. **Data Pipelines**: ETL workflow automation
4. **Machine Learning**: Direct integration with ML frameworks

## Conclusion

The Data Management System provides Cedar with powerful data handling capabilities while maintaining the simplicity and security of local storage. The DuckDB integration offers PostgreSQL-style querying with excellent performance, while the LLM integration ensures intelligent data understanding and analysis.

This system enables users to:
- Upload and analyze data files easily
- Query data using familiar SQL syntax
- Integrate data into research workflows
- Maintain data privacy and security
- Scale from simple datasets to complex analytics

The implementation follows Cedar's principles of simplicity, security, and AI-powered intelligence while providing enterprise-grade data management capabilities. 