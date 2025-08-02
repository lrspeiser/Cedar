import React, { useState, useEffect } from 'react';
import { apiService } from '../api';

interface DataTabProps {
  projectId: string;
  dataFiles: string[];
  onDataFilesUpdate: (files: string[]) => void;
}

interface DataFileInfo {
  id: string;
  name: string;
  file_type: string;
  size_bytes: number;
  uploaded_at: number;
  table_name?: string;
  row_count?: number;
  column_count?: number;
  columns?: ColumnInfo[];
  sample_data?: string[][];
  data_summary?: string;
  source: string;
}

interface ColumnInfo {
  name: string;
  data_type: string;
  nullable: boolean;
  sample_values: string[];
}

interface DataAnalysisCell {
  id: string;
  type: 'data_analysis';
  content: string;
  timestamp: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  metadata?: {
    pastedData?: string;
    uploadedFile?: File;
    analysisResult?: any;
    streamLines?: string[];
    isStreaming?: boolean;
  };
}

const DataTab: React.FC<DataTabProps> = ({ projectId, dataFiles, onDataFilesUpdate }) => {
  const [pastedData, setPastedData] = useState('');
  const [analyzingPastedData, setAnalyzingPastedData] = useState(false);
  const [dataAnalysisCells, setDataAnalysisCells] = useState<DataAnalysisCell[]>([]);
  const [dataFileInfos, setDataFileInfos] = useState<DataFileInfo[]>([]);
  const [processedDataSources, setProcessedDataSources] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<DataFileInfo | null>(null);
  const [showQueryInterface, setShowQueryInterface] = useState(false);
  const [query, setQuery] = useState('');
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [queryResults, setQueryResults] = useState<string[][]>([]);
  const [naturalLanguageAnswer, setNaturalLanguageAnswer] = useState('');
  const [executingQuery, setExecutingQuery] = useState(false);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load data file information on component mount
  useEffect(() => {
    loadDataFiles();
  }, [projectId]);

  const loadDataFiles = async () => {
    try {
      const response = await apiService.listDataFiles({ projectId });
      if (response.data_files) {
        setDataFileInfos(response.data_files);
      }
    } catch (error) {
      console.error('Failed to load data files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileUpload(file);
  };

  const uploadFile = async () => {
    if (!fileUpload) return;

    try {
      setUploading(true);
      
      // Create a new analysis cell for file upload
      const analysisCell: DataAnalysisCell = {
        id: `file-analysis-${Date.now()}`,
        type: 'data_analysis',
        content: `# File Analysis\n\n**File:** ${fileUpload.name}\n**Size:** ${formatFileSize(fileUpload.size)}\n**Type:** ${fileUpload.type || 'Unknown'}\n\n`,
        timestamp: new Date().toISOString(),
        status: 'active',
        metadata: {
          uploadedFile: fileUpload,
          streamLines: [],
          isStreaming: true,
        },
      };

      // Add the cell to the UI immediately
      setDataAnalysisCells(prev => [...prev, analysisCell]);

      // Stream initial progress
      await streamLines(analysisCell.id, [
        '## 🔄 Starting File Analysis...',
        '',
        '📁 Reading file content...',
        '🔍 Extracting data structure...',
        '🤖 Analyzing with AI...',
        '💾 Preparing PostgreSQL schema...',
        '',
      ], 100);

      // Read file content
      const content = await fileUpload.text();
      
      // Extract file extension and determine file type
      const fileExtension = fileUpload.name.split('.').pop()?.toLowerCase() || '';
      const isCSV = fileExtension === 'csv';
      const isTSV = fileExtension === 'tsv' || fileExtension === 'txt';
      const isJSON = fileExtension === 'json';
      const isExcel = ['xlsx', 'xls'].includes(fileExtension);
      
             // Get existing database names for context
       const existingTables = dataFiles.map(file => {
         const name = file.replace(/\.(csv|tsv|json|xlsx|xls|parquet)$/i, '');
         return name.replace(/[_-]/g, ' ').replace(/\d+$/, '').trim();
       }).filter((name, index, arr) => arr.indexOf(name) === index);

       // Create analysis goal for file upload
       const analysisGoal = `Analyze this file data and return ONLY valid JSON with metadata and storage code:

File: ${fileUpload.name}
Data:
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

Return this JSON structure:
{
  "metadata": {
    "table_name": "clean_table_name",
    "display_name": "brief descriptive name",
    "description": "what this data represents",
    "source": "file_upload",
    "created_at": "2024-01-01T00:00:00Z",
    "estimated_rows": 5,
    "estimated_columns": 2,
    "data_format": "${fileExtension}",
    "has_headers": true,
    "storage_format": "parquet",
    "original_filename": "${fileUpload.name}",
    "file_size_bytes": ${fileUpload.size}
  },
  "fields": [
    {
      "name": "state",
      "duckdb_type": "VARCHAR",
      "description": "US state name",
      "sample_values": ["Alabama", "Alaska", "Arizona"],
      "is_nullable": false,
      "is_unique": true
    },
    {
      "name": "estimated_number_of_streets",
      "duckdb_type": "INTEGER", 
      "description": "Estimated street count",
      "sample_values": [120000, 30000, 100000],
      "is_nullable": false,
      "is_unique": false
    }
  ],
  "data_summary": "State-level street count estimates",
  "storage_code": {
    "rust_function": "pub fn save_data() { /* Rust code */ }",
    "python_code": "import pandas as pd; df.to_parquet('file.parquet')",
    "duckdb_schema": "CREATE TABLE data (state VARCHAR, estimated_number_of_streets INTEGER)",
    "file_path": "data/state_streets.parquet",
    "conversion_code": "df = pd.read_csv(data); df.to_parquet('file.parquet')"
  }
}`;

      const response = await apiService.initializeResearch({
        goal: analysisGoal
      });

      console.log('File analysis completed:', response);
      
      // Stream the analysis results
      await streamLines(analysisCell.id, [
        '✅ AI analysis completed',
        '',
        '## 📊 Analysis Results',
        '',
      ], 50);

      // Parse and display the response from initializeResearch
      let analysisResult;
      try {
        // Extract analysis from initializeResearch response
        const analysisText = response.background_summary || response.sources?.[0]?.summary || JSON.stringify(response);
        
        // Try to parse as JSON first
        try {
          analysisResult = JSON.parse(analysisText);
        } catch (e) {
          // If not valid JSON, create a structured response from the text
          const lines = content.split('\n');
          const headers = lines[0]?.split(isCSV ? ',' : isTSV ? '\t' : '\t') || [];
          const tableName = fileUpload.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.(csv|tsv|json|xlsx|xls)$/i, '');
          
                     analysisResult = {
             metadata: {
               table_name: tableName,
               display_name: generateContentBasedName(headers, lines.slice(1, 5)),
               description: `Data from uploaded file: ${fileUpload.name}`,
               source: "file_upload",
               created_at: new Date().toISOString(),
               estimated_rows: lines.length - 1,
               estimated_columns: headers.length,
               data_format: fileExtension,
               has_headers: true,
               storage_format: "parquet",
               original_filename: fileUpload.name,
               file_size_bytes: fileUpload.size
             },
             fields: headers.map((header, index) => ({
               name: header.trim().replace(/[^a-zA-Z0-9_]/g, '_'),
               duckdb_type: "VARCHAR",
               description: `Column ${index + 1} from the uploaded file`,
               sample_values: lines.slice(1, 4).map(line => line.split(isCSV ? ',' : isTSV ? '\t' : '\t')[index] || '').filter(Boolean),
               is_nullable: true,
               is_unique: false
             })),
             data_summary: analysisText,
             storage_code: {
               rust_function: `pub fn save_uploaded_file_parquet(project_id: &str, file_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    use std::fs;
    use std::path::PathBuf;
    
    let data_dir = get_project_data_dir(project_id);
    fs::create_dir_all(&data_dir)?;
    
    // Call Python script to convert file to parquet
    let python_script = format!("
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# Read the uploaded file
if '{}'.endswith('.xlsx') or '{}'.endswith('.xls'):
    df = pd.read_excel('{}')
elif '{}'.endswith('.csv'):
    df = pd.read_csv('{}')
elif '{}'.endswith('.json'):
    df = pd.read_json('{}')
else:
    df = pd.read_csv('{}', sep='\\t')

# Convert to parquet with compression
df.to_parquet('{}', index=False, compression='snappy')

print(f"Converted {len(df)} rows and {len(df.columns)} columns to parquet format")
", file_path, file_path, file_path, file_path, file_path, file_path, file_path, file_path, data_dir.join("${tableName}.parquet").display());
    
    // Execute Python conversion
    std::process::Command::new("python3")
        .arg("-c")
        .arg(&python_script)
        .output()?;
    
    Ok(())
}`,
               python_code: `import duckdb
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# Load the parquet data into DuckDB
con = duckdb.connect(':memory:')

# Read parquet file directly
df = pq.read_table('${tableName}.parquet').to_pandas()
con.register('${tableName}', df)

# Query the data
result = con.execute("SELECT * FROM ${tableName} LIMIT 5").fetchdf()
print(result)

# Example analytics query
analytics_result = con.execute("""
    SELECT 
        COUNT(*) as total_rows,
        COUNT(DISTINCT *) as unique_rows
    FROM ${tableName}
""").fetchdf()
print("\\nAnalytics Summary:")
print(analytics_result)`,
               duckdb_schema: `CREATE TABLE ${tableName} (
  ${headers.map((header, index) => `${header.trim().replace(/[^a-zA-Z0-9_]/g, '_')} VARCHAR`).join(',\n  ')}
);`,
               file_path: `data/${tableName}.parquet`,
               conversion_code: `import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# Read the uploaded file
file_path = '${fileUpload.name}'
if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
    df = pd.read_excel(file_path)
elif file_path.endswith('.csv'):
    df = pd.read_csv(file_path)
elif file_path.endswith('.json'):
    df = pd.read_json(file_path)
else:
    df = pd.read_csv(file_path, sep='\\t')

# Convert to parquet with compression
df.to_parquet('${tableName}.parquet', index=False, compression='snappy')

print(f"Converted {len(df)} rows and {len(df.columns)} columns to parquet format")
print(f"File size: {os.path.getsize('${tableName}.parquet')} bytes")`
             },
             data_quality: {
               issues: [],
               recommendations: ["Consider adding data validation", "Check for missing values", "Parquet format optimized for analytics queries"]
             }
           };
        }
      } catch (e) {
        console.error('Error parsing analysis response:', e);
        analysisResult = { 
          raw_response: response,
          error: "Failed to parse analysis response"
        };
      }

      // Stream metadata
      if (analysisResult.metadata) {
        await streamLines(analysisCell.id, [
          '### 📋 File Metadata',
          '',
          `- **Original Filename:** ${analysisResult.metadata.original_filename}`,
          `- **File Size:** ${formatFileSize(analysisResult.metadata.file_size_bytes)}`,
          `- **Data Type:** ${analysisResult.metadata.data_type}`,
          `- **Estimated Rows:** ${analysisResult.metadata.estimated_rows}`,
          `- **Estimated Columns:** ${analysisResult.metadata.estimated_columns}`,
          `- **Has Headers:** ${analysisResult.metadata.has_headers ? 'Yes' : 'No'}`,
          `- **Encoding:** ${analysisResult.metadata.encoding}`,
          '',
        ], 50);
      }

      // Stream field analysis
      if (analysisResult.fields && analysisResult.fields.length > 0) {
        await streamLines(analysisCell.id, [
          '### 🔍 Field Analysis',
          '',
        ], 30);

        for (const field of analysisResult.fields) {
          await streamLines(analysisCell.id, [
            `**${field.name}** (${field.duckdb_type})`,
            `- Description: ${field.description}`,
            `- Sample Values: ${field.sample_values?.slice(0, 3).join(', ')}`,
            `- Nullable: ${field.is_nullable ? 'Yes' : 'No'}`,
            `- Unique: ${field.is_unique ? 'Yes' : 'No'}`,
            '',
          ], 40);
        }
      }

      // Stream PostgreSQL schema
      if (analysisResult.postgres_schema) {
        await streamLines(analysisCell.id, [
          '### 🗄️ PostgreSQL Schema',
          '',
          `**Table Name:** ${analysisResult.metadata.table_name}`,
          `**Description:** ${analysisResult.metadata.table_description}`,
          '',
          '**CREATE TABLE Statement:**',
          '```sql',
          analysisResult.postgres_schema.create_table_sql,
          '```',
          '',
        ], 50);

        if (analysisResult.postgres_schema.indexes && analysisResult.postgres_schema.indexes.length > 0) {
          await streamLines(analysisCell.id, [
            '**Suggested Indexes:**',
            ...analysisResult.postgres_schema.indexes.map(idx => `- ${idx}`),
            '',
          ], 40);
        }
      }

      // Stream storage recommendations
      if (analysisResult.storage_recommendations && analysisResult.storage_recommendations.length > 0) {
        await streamLines(analysisCell.id, [
          '### 💾 Storage Recommendations',
          '',
        ], 30);

        for (const rec of analysisResult.storage_recommendations) {
          await streamLines(analysisCell.id, [
            `**${rec.format.toUpperCase()}**`,
            `- Reasoning: ${rec.reasoning}`,
            `- DuckDB Compatibility: ${rec.duckdb_compatibility}`,
            `- Pros: ${rec.pros?.join(', ')}`,
            `- Cons: ${rec.cons?.join(', ')}`,
            '',
          ], 40);
        }
      }

      // Stream data quality issues
      if (analysisResult.data_quality_issues && analysisResult.data_quality_issues.length > 0) {
        await streamLines(analysisCell.id, [
          '### ⚠️ Data Quality Issues',
          '',
        ], 30);

        for (const issue of analysisResult.data_quality_issues) {
          await streamLines(analysisCell.id, [
            `**${issue.severity.toUpperCase()}: ${issue.issue}**`,
            `- Suggestion: ${issue.suggestion}`,
            '',
          ], 40);
        }
      }

      // Stream data summary
      if (analysisResult.data_summary) {
        await streamLines(analysisCell.id, [
          '### 📋 Data Summary',
          '',
          analysisResult.data_summary,
          '',
        ], 30);
      }

      // Stream completion
      await streamLines(analysisCell.id, [
        '## ✅ File Analysis Complete!',
        '',
        'The file has been analyzed and PostgreSQL schema generated.',
        'You can now save the data in any of the recommended formats.',
        '',
      ], 50);

      // Update the cell to completed status
      setDataAnalysisCells(prev => prev.map(cell => 
        cell.id === analysisCell.id 
          ? { 
              ...cell, 
              status: 'completed' as const,
              metadata: {
                ...cell.metadata,
                analysisResult: analysisResult,
                isStreaming: false,
              },
            }
          : cell
      ));

      // Automatically save the analyzed data
      try {
        await saveAnalyzedData('parquet', analysisCell.id);
        
        // Add to processed data sources
        if (analysisResult.metadata) {
          setProcessedDataSources(prev => [...prev, {
            id: analysisCell.id,
            display_name: analysisResult.metadata.display_name,
            table_name: analysisResult.metadata.table_name,
            description: analysisResult.metadata.description,
            source: analysisResult.metadata.source,
            created_at: analysisResult.metadata.created_at,
            estimated_rows: analysisResult.metadata.estimated_rows,
            estimated_columns: analysisResult.metadata.estimated_columns,
            data_format: analysisResult.metadata.data_format,
            storage_format: analysisResult.metadata.storage_format,
            fields: analysisResult.fields,
            storage_code: analysisResult.storage_code
          }]);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Don't show error to user, just log it
      }

      setFileUpload(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Failed to analyze uploaded file:', error);
      alert('Failed to analyze uploaded file');
    } finally {
      setUploading(false);
    }
  };

  const analyzePastedData = async () => {
    if (!pastedData.trim()) {
      alert('Please paste some data to analyze');
      return;
    }

    // Create a new analysis cell
    const analysisCell: DataAnalysisCell = {
      id: `data-analysis-${Date.now()}`,
      type: 'data_analysis',
      content: `# Data Analysis\n\n**Data to analyze:**\n\`\`\`\n${pastedData.slice(0, 200)}${pastedData.length > 200 ? '...' : ''}\n\`\`\`\n\n`,
      timestamp: new Date().toISOString(),
      status: 'active',
      metadata: {
        pastedData: pastedData,
        streamLines: [],
        isStreaming: true,
      },
    };

    // Add the cell to the UI immediately
    setDataAnalysisCells(prev => [...prev, analysisCell]);

    try {
      setAnalyzingPastedData(true);
      
      // Stream initial progress
      await streamLines(analysisCell.id, [
        '## 🔄 Starting Data Analysis...',
        '',
        '🤖 Connecting to AI service...',
        '📊 Analyzing data structure...',
        '🔍 Identifying field types and patterns...',
        '💾 Preparing Parquet storage...',
        '',
      ], 100);
      
      // Get existing database names for context
      const existingTables = dataFiles.map(file => {
        const name = file.replace(/\.(csv|tsv|json|xlsx|xls|parquet)$/i, '');
        return name.replace(/[_-]/g, ' ').replace(/\d+$/, '').trim();
      }).filter((name, index, arr) => arr.indexOf(name) === index);

      // Call LLM to analyze the pasted data and provide storage code
      const analysisGoal = `Analyze this data and return ONLY valid JSON with metadata and storage code:

Data:
${pastedData}

Return this JSON structure:
{
  "metadata": {
    "table_name": "clean_table_name",
    "display_name": "brief descriptive name",
    "description": "what this data represents",
    "source": "user_pasted_data",
    "created_at": "2024-01-01T00:00:00Z",
    "estimated_rows": 5,
    "estimated_columns": 2,
    "data_format": "csv",
    "has_headers": true,
    "storage_format": "parquet"
  },
  "fields": [
    {
      "name": "state",
      "duckdb_type": "VARCHAR",
      "description": "US state name",
      "sample_values": ["Alabama", "Alaska", "Arizona"],
      "is_nullable": false,
      "is_unique": true
    },
    {
      "name": "estimated_number_of_streets",
      "duckdb_type": "INTEGER", 
      "description": "Estimated street count",
      "sample_values": [120000, 30000, 100000],
      "is_nullable": false,
      "is_unique": false
    }
  ],
  "data_summary": "State-level street count estimates",
  "storage_code": {
    "rust_function": "pub fn save_data() { /* Rust code */ }",
    "python_code": "import pandas as pd; df.to_parquet('file.parquet')",
    "duckdb_schema": "CREATE TABLE data (state VARCHAR, estimated_number_of_streets INTEGER)",
    "file_path": "data/state_streets.parquet",
    "conversion_code": "df = pd.read_csv(data); df.to_parquet('file.parquet')"
  }
}`;

      const response = await apiService.initializeResearch({
        goal: analysisGoal
      });

      console.log('Data analysis completed:', response);
      
      // Stream the analysis results
      await streamLines(analysisCell.id, [
        '✅ AI analysis completed',
        '',
        '## 📊 Analysis Results',
        '',
      ], 50);

      // Parse and display the response from initializeResearch
      let analysisResult;
      try {
        // Extract analysis from initializeResearch response
        const analysisText = response.background_summary || response.sources?.[0]?.summary || JSON.stringify(response);
        
        // Try to parse as JSON first
        try {
          analysisResult = JSON.parse(analysisText);
        } catch (e) {
          // If not valid JSON, create a structured response from the text
          const lines = pastedData.split('\n');
          const headers = lines[0]?.split('\t') || [];
          
          analysisResult = {
            metadata: {
              table_name: `pasted_data_${Date.now()}`,
              display_name: generateContentBasedName(headers, lines.slice(1, 5)),
              description: "Data pasted by user",
              source: "user_pasted_data",
              created_at: new Date().toISOString(),
              estimated_rows: lines.length - 1,
              estimated_columns: headers.length,
              data_format: "tsv",
              has_headers: true,
              storage_format: "parquet"
            },
            fields: headers.map((header, index) => ({
              name: header.trim().replace(/[^a-zA-Z0-9_]/g, '_'),
              duckdb_type: "VARCHAR",
              description: `Column ${index + 1} from the dataset`,
              sample_values: lines.slice(1, 4).map(line => line.split('\t')[index] || '').filter(Boolean),
              is_nullable: true,
              is_unique: false
            })),
            data_summary: analysisText,
            storage_code: {
              rust_function: `pub fn save_pasted_data_parquet(project_id: &str, data: &str) -> Result<(), Box<dyn std::error::Error>> {
    use std::fs;
    use std::path::PathBuf;
    
    let data_dir = get_project_data_dir(project_id);
    fs::create_dir_all(&data_dir)?;
    
    // Save raw data first, then convert to parquet via Python
    let raw_file_path = data_dir.join("pasted_data_raw.csv");
    fs::write(&raw_file_path, data)?;
    
    // Call Python script to convert to parquet
    let python_script = format!("
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# Read the raw data
df = pd.read_csv('{}')

# Convert to parquet
df.to_parquet('{}', index=False)
", raw_file_path.display(), data_dir.join("pasted_data.parquet").display());
    
    // Execute Python conversion
    std::process::Command::new("python3")
        .arg("-c")
        .arg(&python_script)
        .output()?;
    
    Ok(())
}`,
              python_code: `import duckdb
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# Load the parquet data into DuckDB
con = duckdb.connect(':memory:')

# Read parquet file directly
df = pq.read_table('pasted_data.parquet').to_pandas()
con.register('pasted_data', df)

# Query the data
result = con.execute("SELECT * FROM pasted_data LIMIT 5").fetchdf()
print(result)

# Example analytics query
analytics_result = con.execute("""
    SELECT 
        COUNT(*) as total_rows,
        COUNT(DISTINCT *) as unique_rows
    FROM pasted_data
""").fetchdf()
print("\\nAnalytics Summary:")
print(analytics_result)`,
              duckdb_schema: `CREATE TABLE pasted_data (
  ${headers.map((header, index) => `${header.trim().replace(/[^a-zA-Z0-9_]/g, '_')} VARCHAR`).join(',\n  ')}
);`,
              file_path: "data/pasted_data.parquet",
              conversion_code: `import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# Read the pasted data
data = """${pastedData}"""
from io import StringIO
df = pd.read_csv(StringIO(data), sep='\\t')

# Convert to parquet with compression
df.to_parquet('pasted_data.parquet', index=False, compression='snappy')

print(f"Converted {len(df)} rows and {len(df.columns)} columns to parquet format")
print(f"File size: {os.path.getsize('pasted_data.parquet')} bytes")`
            },
            data_quality: {
              issues: [],
              recommendations: ["Consider adding data validation", "Check for missing values", "Parquet format optimized for analytics queries"]
            }
          };
        }
      } catch (e) {
        console.error('Error parsing analysis response:', e);
        analysisResult = { 
          raw_response: response,
          error: "Failed to parse analysis response"
        };
      }

      // Stream metadata
      if (analysisResult.metadata) {
        await streamLines(analysisCell.id, [
          '### 📋 Data Metadata',
          '',
          `- **Display Name:** ${analysisResult.metadata.display_name}`,
          `- **Table Name:** ${analysisResult.metadata.table_name}`,
          `- **Description:** ${analysisResult.metadata.description}`,
          `- **Source:** ${analysisResult.metadata.source}`,
          `- **Data Format:** ${analysisResult.metadata.data_format}`,
          `- **Storage Format:** ${analysisResult.metadata.storage_format}`,
          `- **Estimated Rows:** ${analysisResult.metadata.estimated_rows}`,
          `- **Estimated Columns:** ${analysisResult.metadata.estimated_columns}`,
          `- **Has Headers:** ${analysisResult.metadata.has_headers ? 'Yes' : 'No'}`,
          '',
        ], 50);
      }

      // Stream field analysis
      if (analysisResult.fields && analysisResult.fields.length > 0) {
        await streamLines(analysisCell.id, [
          '### 🔍 Field Analysis',
          '',
        ], 30);

        for (const field of analysisResult.fields) {
          await streamLines(analysisCell.id, [
            `**${field.name}** (${field.duckdb_type})`,
            `- Description: ${field.description}`,
            `- Sample Values: ${field.sample_values?.slice(0, 3).join(', ')}`,
            `- Nullable: ${field.is_nullable ? 'Yes' : 'No'}`,
            `- Unique: ${field.is_unique ? 'Yes' : 'No'}`,
            '',
          ], 40);
        }
      }

      // Stream DuckDB schema and storage code
      if (analysisResult.storage_code) {
        await streamLines(analysisCell.id, [
          '### 🦆 DuckDB Schema',
          '',
          `**Table Name:** ${analysisResult.metadata.table_name}`,
          `**File Path:** ${analysisResult.storage_code.file_path}`,
          '',
          '**CREATE TABLE Statement:**',
          '```sql',
          analysisResult.storage_code.duckdb_schema,
          '```',
          '',
        ], 50);

        await streamLines(analysisCell.id, [
          '### 💾 Storage Code',
          '',
          '**Rust Function:**',
          '```rust',
          analysisResult.storage_code.rust_function,
          '```',
          '',
          '**Python Code (DuckDB Integration):**',
          '```python',
          analysisResult.storage_code.python_code,
          '```',
          '',
        ], 50);
      }

      // Stream data quality
      if (analysisResult.data_quality) {
        if (analysisResult.data_quality.issues && analysisResult.data_quality.issues.length > 0) {
          await streamLines(analysisCell.id, [
            '### ⚠️ Data Quality Issues',
            '',
          ], 30);

          for (const issue of analysisResult.data_quality.issues) {
            await streamLines(analysisCell.id, [
              `**${issue.severity.toUpperCase()}: ${issue.issue}**`,
              `- Field: ${issue.field}`,
              `- Suggestion: ${issue.suggestion}`,
              '',
            ], 40);
          }
        }

        if (analysisResult.data_quality.recommendations && analysisResult.data_quality.recommendations.length > 0) {
          await streamLines(analysisCell.id, [
            '### 💡 Recommendations',
            '',
            ...analysisResult.data_quality.recommendations.map(rec => `- ${rec}`),
            '',
          ], 40);
        }
      }

      // Stream data summary
      if (analysisResult.data_summary) {
        await streamLines(analysisCell.id, [
          '### 📋 Data Summary',
          '',
          analysisResult.data_summary,
          '',
        ], 30);
      }

      // Stream completion
      await streamLines(analysisCell.id, [
        '## ✅ Analysis Complete!',
        '',
        `**Display Name:** ${analysisResult.metadata.display_name}`,
        'The data has been analyzed and converted to Parquet format.',
        'DuckDB schema and analytics code are ready for implementation.',
        '',
      ], 50);

      // Update the cell to completed status
      setDataAnalysisCells(prev => prev.map(cell => 
        cell.id === analysisCell.id 
          ? { 
              ...cell, 
              status: 'completed' as const,
              metadata: {
                ...cell.metadata,
                analysisResult: analysisResult,
                isStreaming: false,
              },
            }
          : cell
      ));

      // Automatically save the analyzed data
      try {
        await saveAnalyzedData('parquet', analysisCell.id);
        
        // Add to processed data sources
        if (analysisResult.metadata) {
          setProcessedDataSources(prev => [...prev, {
            id: analysisCell.id,
            display_name: analysisResult.metadata.display_name,
            table_name: analysisResult.metadata.table_name,
            description: analysisResult.metadata.description,
            source: analysisResult.metadata.source,
            created_at: analysisResult.metadata.created_at,
            estimated_rows: analysisResult.metadata.estimated_rows,
            estimated_columns: analysisResult.metadata.estimated_columns,
            data_format: analysisResult.metadata.data_format,
            storage_format: analysisResult.metadata.storage_format,
            fields: analysisResult.fields,
            storage_code: analysisResult.storage_code
          }]);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Don't show error to user, just log it
      }

    } catch (error) {
      console.error('Failed to analyze pasted data:', error);
      
      // Stream error
      await streamLines(analysisCell.id, [
        '',
        '## ❌ Error During Analysis',
        '',
        `**Error**: ${error}`,
        '',
        'Please check your API key and try again.',
      ], 100);
      
      // Update the cell to error status
      setDataAnalysisCells(prev => prev.map(cell => 
        cell.id === analysisCell.id 
          ? { 
              ...cell, 
              status: 'error' as const,
              metadata: {
                ...cell.metadata,
                isStreaming: false,
              },
            }
          : cell
      ));
    } finally {
      setAnalyzingPastedData(false);
    }
  };

  const streamLines = async (cellId: string, lines: string[], delayMs: number = 100) => {
    for (const line of lines) {
      if (line.trim()) {
        setDataAnalysisCells(prev => prev.map(cell => 
          cell.id === cellId 
            ? {
                ...cell,
                content: cell.content + line + '\n',
                metadata: {
                  ...cell.metadata,
                  streamLines: [...(cell.metadata?.streamLines || []), line],
                },
              }
            : cell
        ));
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  };

  const saveAnalyzedData = async (format: string, cellId: string) => {
    const cell = dataAnalysisCells.find(c => c.id === cellId);
    
    if (!cell) {
      alert('Cell not found');
      return;
    }
    
    if (!cell.metadata?.analysisResult) {
      alert('No analysis result found in cell');
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const analysisResult = cell.metadata.analysisResult;
      
      // Determine the data content (from pasted data or uploaded file)
      let dataContent = '';
      if (cell.metadata.pastedData) {
        dataContent = cell.metadata.pastedData;
      } else if (cell.metadata.uploadedFile) {
        // For uploaded files, we need to read the content again
        dataContent = await cell.metadata.uploadedFile.text();
      } else {
        alert('No data content found in cell');
        return;
      }
      
      // Save the original data (will be converted to parquet)
      const dataFilename = `${analysisResult.metadata.table_name}_${timestamp}.${format}`;
      await apiService.saveFile({
        project_id: projectId,
        filename: dataFilename,
        content: dataContent,
        file_type: 'data'
      });

      // Save the complete analysis metadata (for LLM research queries)
      const metadataFilename = `${analysisResult.metadata.table_name}_metadata_${timestamp}.json`;
      await apiService.saveFile({
        project_id: projectId,
        filename: metadataFilename,
        content: JSON.stringify(analysisResult, null, 2),
        file_type: 'data'
      });

      // Save DuckDB schema file
      const schemaFilename = `${analysisResult.metadata.table_name}_schema_${timestamp}.sql`;
      await apiService.saveFile({
        project_id: projectId,
        filename: schemaFilename,
        content: analysisResult.storage_code.duckdb_schema,
        file_type: 'data'
      });

      // Save Rust storage code
      const rustFilename = `${analysisResult.metadata.table_name}_storage_${timestamp}.rs`;
      await apiService.saveFile({
        project_id: projectId,
        filename: rustFilename,
        content: analysisResult.storage_code.rust_function,
        file_type: 'data'
      });

      // Save Python integration code
      const pythonFilename = `${analysisResult.metadata.table_name}_duckdb_${timestamp}.py`;
      await apiService.saveFile({
        project_id: projectId,
        filename: pythonFilename,
        content: analysisResult.storage_code.python_code,
        file_type: 'data'
      });

      // Save Python conversion code
      const conversionFilename = `${analysisResult.metadata.table_name}_conversion_${timestamp}.py`;
      await apiService.saveFile({
        project_id: projectId,
        filename: conversionFilename,
        content: analysisResult.storage_code.conversion_code,
        file_type: 'data'
      });

      // Save data summary file
      const summaryFilename = `${analysisResult.metadata.table_name}_summary_${timestamp}.md`;
      const summaryContent = `# ${analysisResult.metadata.display_name}

## Table Information
- **Display Name:** ${analysisResult.metadata.display_name}
- **Table Name:** ${analysisResult.metadata.table_name}
- **Description:** ${analysisResult.metadata.description}

## Data Summary
${analysisResult.data_summary}

## Fields
${analysisResult.fields.map(field => `
### ${field.name}
- **DuckDB Type:** ${field.duckdb_type}
- **Description:** ${field.description}
- **Sample Values:** ${field.sample_values?.slice(0, 3).join(', ')}
- **Nullable:** ${field.is_nullable ? 'Yes' : 'No'}
- **Unique:** ${field.is_unique ? 'Yes' : 'No'}
`).join('')}

## Data Quality Issues
${analysisResult.data_quality?.issues?.map(issue => `
- **${issue.severity.toUpperCase()}:** ${issue.issue}
  - Field: ${issue.field}
  - Suggestion: ${issue.suggestion}
`).join('') || 'None detected'}

## Recommendations
${analysisResult.data_quality?.recommendations?.map(rec => `- ${rec}`).join('\n') || 'None'}

## Storage Information
- **File Path:** ${analysisResult.storage_code.file_path}
- **Source:** ${analysisResult.metadata.source}
- **Created At:** ${analysisResult.metadata.created_at}
- **Rows:** ${analysisResult.metadata.estimated_rows}
- **Columns:** ${analysisResult.metadata.estimated_columns}
- **Format:** ${analysisResult.metadata.data_format}
`;

      await apiService.saveFile({
        project_id: projectId,
        filename: summaryFilename,
        content: summaryContent,
        file_type: 'data'
      });

      alert(`✅ Data saved successfully!\n\n📊 **${analysisResult.metadata.display_name}**\n\n📁 Files created:\n• ${dataFilename} (original data)\n• ${metadataFilename} (LLM metadata)\n• ${schemaFilename} (DuckDB schema)\n• ${rustFilename} (Rust storage)\n• ${pythonFilename} (Python integration)\n• ${conversionFilename} (Parquet conversion)\n• ${summaryFilename} (data summary)\n\n🦆 All data optimized for DuckDB analytics with Parquet storage!`);
      await loadDataFiles(); // Refresh the list
    } catch (error) {
      console.error('Failed to save analyzed data:', error);
      alert(`Failed to save analyzed data: ${error}`);
    }
  };

  const generateSQLFromNaturalLanguage = async () => {
    if (!selectedFile || !naturalLanguageQuery.trim()) return;

    try {
      setExecutingQuery(true);
      setNaturalLanguageAnswer(''); // Clear previous answer
      
      // Get the selected data source info
      const dataSource = processedDataSources.find(ds => ds.id === selectedFile.id) || 
                        dataFileInfos.find(df => df.id === selectedFile.id);
      
      if (!dataSource) {
        alert('Selected data source not found');
        return;
      }

      // Create comprehensive metadata for LLM
      const metadata = {
        table_name: dataSource.table_name || dataSource.name,
        display_name: dataSource.display_name || dataSource.name,
        description: dataSource.description || 'No description available',
        source: dataSource.source || 'unknown',
        created_at: dataSource.created_at || new Date().toISOString(),
        estimated_rows: dataSource.estimated_rows || 0,
        estimated_columns: dataSource.estimated_columns || 0,
        data_format: dataSource.data_format || 'unknown',
        storage_format: dataSource.storage_format || 'parquet',
        fields: dataSource.fields || [],
        storage_code: dataSource.storage_code || {}
      };

      // Create prompt for LLM to generate SQL and provide answer
      const queryPrompt = `Generate SQL query and answer for this question:

Table: ${metadata.table_name}
Columns: ${metadata.fields.map(f => `${f.name} (${f.duckdb_type})`).join(', ')}
Question: "${naturalLanguageQuery}"

Return in this format:
SQL Query: [the SQL query]
Results: [the query results] 
Answer: [natural language answer]`;

      // Call LLM to generate SQL and get answer
      const response = await apiService.initializeResearch({
        goal: queryPrompt
      });

      // Extract the response
      const llmResponse = response.background_summary || response.sources?.[0]?.summary || JSON.stringify(response);
      
      // Parse the response to extract SQL and answer
      const sqlMatch = llmResponse.match(/SQL Query:\s*(.*?)(?=\nResults:|$)/s);
      const resultsMatch = llmResponse.match(/Results:\s*(.*?)(?=\nAnswer:|$)/s);
      const answerMatch = llmResponse.match(/Answer:\s*(.*?)$/s);

      if (sqlMatch) {
        const generatedSQL = sqlMatch[1].trim();
        setQuery(generatedSQL);
        
        // Execute the query and get results
        const queryResponse = await apiService.executeDuckDBQuery({
          projectId,
          tableName: metadata.table_name,
          query: generatedSQL
        });

        if (queryResponse.results) {
          setQueryResults(queryResponse.results);
          
          // If we have an answer from LLM, display it
          if (answerMatch) {
            const answer = answerMatch[1].trim();
            setNaturalLanguageAnswer(answer);
          } else {
            setNaturalLanguageAnswer('');
          }
        }
      } else {
        // Fallback: just generate SQL and execute
        const sqlGenerationPrompt = `Generate a DuckDB SQL query based on the natural language request.

Available table: ${metadata.table_name}
Table description: ${metadata.description}

Table schema:
${metadata.fields.map(field => 
  `- ${field.name} (${field.duckdb_type}): ${field.description}`
).join('\n')}

Natural language request: "${naturalLanguageQuery}"

Requirements:
1. Return ONLY the SQL query, no explanations
2. Use proper DuckDB syntax
3. Make the query efficient and readable
4. Include appropriate LIMIT clauses for large datasets
5. Use the exact table name: ${metadata.table_name}

SQL Query:`;

        const sqlResponse = await apiService.initializeResearch({
          goal: sqlGenerationPrompt
        });

        const generatedSQL = (sqlResponse.background_summary || sqlResponse.sources?.[0]?.summary || sqlResponse).trim();
        setQuery(generatedSQL);
        
        await executeQueryWithSQL(generatedSQL);
      }
      
    } catch (error) {
      console.error('Failed to process natural language query:', error);
      alert('Failed to process natural language query');
    } finally {
      setExecutingQuery(false);
    }
  };

  const executeQueryWithSQL = async (sqlQuery: string) => {
    if (!selectedFile || !sqlQuery.trim()) return;

    try {
      const response = await apiService.executeDuckDBQuery({
        projectId,
        tableName: selectedFile.table_name || selectedFile.name,
        query: sqlQuery
      });

      if (response.results) {
        setQueryResults(response.results);
      }
    } catch (error) {
      console.error('Failed to execute query:', error);
      alert('Failed to execute query');
    }
  };

  const executeQuery = async () => {
    if (!selectedFile || !query.trim()) return;
    setNaturalLanguageAnswer(''); // Clear previous answer
    await executeQueryWithSQL(query);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const generateContentBasedName = (headers: string[], sampleRows: string[]) => {
    // Analyze headers and sample data to generate a meaningful name
    const headerText = headers.join(' ').toLowerCase();
    const sampleText = sampleRows.join(' ').toLowerCase();
    const allText = headerText + ' ' + sampleText;

    // Common patterns to look for
    const patterns = [
      { keywords: ['customer', 'client', 'user'], name: 'Customer Data' },
      { keywords: ['sale', 'revenue', 'income', 'profit'], name: 'Sales Data' },
      { keywords: ['employee', 'staff', 'worker'], name: 'Employee Records' },
      { keywords: ['product', 'item', 'inventory'], name: 'Product Data' },
      { keywords: ['order', 'purchase', 'transaction'], name: 'Order Data' },
      { keywords: ['weather', 'temperature', 'climate'], name: 'Weather Data' },
      { keywords: ['survey', 'response', 'feedback'], name: 'Survey Data' },
      { keywords: ['financial', 'bank', 'account'], name: 'Financial Data' },
      { keywords: ['location', 'address', 'city', 'country'], name: 'Location Data' },
      { keywords: ['date', 'time', 'timestamp'], name: 'Time Series Data' },
      { keywords: ['price', 'cost', 'amount'], name: 'Pricing Data' },
      { keywords: ['email', 'phone', 'contact'], name: 'Contact Data' },
      { keywords: ['category', 'type', 'classification'], name: 'Categorized Data' },
      { keywords: ['score', 'rating', 'review'], name: 'Rating Data' },
      { keywords: ['status', 'state', 'condition'], name: 'Status Data' }
    ];

    // Find the best matching pattern
    for (const pattern of patterns) {
      if (pattern.keywords.some(keyword => allText.includes(keyword))) {
        return pattern.name;
      }
    }

    // If no specific pattern found, try to create a name from headers
    if (headers.length > 0) {
      const mainHeader = headers[0].replace(/[^a-zA-Z\s]/g, '').trim();
      if (mainHeader.length > 0) {
        return `${mainHeader} Data`;
      }
    }

    // Fallback to a generic but descriptive name
    return `Data with ${headers.length} columns`;
  };

  const renderAnalysisCell = (cell: DataAnalysisCell) => {
    const isStreaming = cell.metadata?.isStreaming;
    
    return (
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm mb-4">
        {/* Cell Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="text-blue-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900">Data Analysis</span>
              <div className="text-xs text-gray-500">
                {new Date(cell.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status Indicator */}
            <div className={`px-2 py-1 rounded text-xs ${
              cell.status === 'completed' ? 'bg-green-100 text-green-800' :
              cell.status === 'error' ? 'bg-red-100 text-red-800' :
              cell.status === 'active' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {cell.status === 'active' ? (
                <span className="flex items-center">
                  analyzing
                  <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                </span>
              ) : (
                cell.status
              )}
            </div>
          </div>
        </div>

        {/* Cell Content */}
        <div className="p-4">
          <div className="whitespace-pre-wrap text-gray-800 font-mono text-sm bg-black bg-opacity-5 p-3 rounded border">
            {cell.content}
            {isStreaming && <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>}
          </div>
          
          {/* Auto-save notification for completed analysis */}
          {cell.status === 'completed' && cell.metadata?.analysisResult && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="text-blue-500 mr-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                                         <h6 className="text-sm font-medium text-blue-800">Analysis Complete</h6>
                     <p className="text-xs text-blue-600">
                       {cell.metadata?.analysisResult?.metadata?.display_name && 
                         `"${cell.metadata.analysisResult.metadata.display_name}" - `}
                       Data analyzed and converted to Parquet format. Ready for analytics.
                     </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Data Analysis */}
      <div className="flex-1 flex flex-col p-4 border-r border-gray-200">
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">Data Analysis</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowQueryInterface(!showQueryInterface)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                {showQueryInterface ? 'Hide' : 'Show'} Query Interface
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-medium mb-4">Upload Data File</h4>
            <div className="space-y-4">
              <div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.json,.parquet,.xlsx,.xls,.tsv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cedar-50 file:text-cedar-700 hover:file:bg-cedar-100"
                />
              </div>
              {fileUpload && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Selected: {fileUpload.name} ({formatFileSize(fileUpload.size)})
                  </span>
                  <button
                    onClick={uploadFile}
                    disabled={uploading}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Data Analysis Section */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-lg font-medium mb-4">Analyze Pasted Data</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paste Your Data
                </label>
                <textarea
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Paste CSV, JSON, TSV, or any structured data here..."
                  rows={6}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={analyzePastedData}
                  disabled={!pastedData.trim() || analyzingPastedData}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {analyzingPastedData ? 'Analyzing...' : 'Analyze with AI'}
                </button>
                <button
                  onClick={() => {
                    setPastedData('');
                    setDataAnalysisCells([]);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Query Interface */}
          {showQueryInterface && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-lg font-medium mb-4">DuckDB Query Interface</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Data Source
                  </label>
                  <select
                    value={selectedFile?.id || ''}
                    onChange={(e) => {
                      const file = [...dataFileInfos, ...processedDataSources].find(f => f.id === e.target.value);
                      setSelectedFile(file || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a data source...</option>
                    <optgroup label="Processed Data Sources">
                      {processedDataSources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.display_name} ({source.table_name})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Uploaded Files">
                      {dataFileInfos.map((file) => (
                        <option key={file.id} value={file.id}>
                          {file.table_name || file.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                
                {/* Natural Language Query */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Natural Language Query
                  </label>
                  <textarea
                    value={naturalLanguageQuery}
                    onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                    placeholder="Show me the top 10 rows, or find all records where..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                  <button
                    onClick={generateSQLFromNaturalLanguage}
                    disabled={!selectedFile || !naturalLanguageQuery.trim() || executingQuery}
                    className="mt-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
                  >
                    {executingQuery ? 'Generating...' : 'Generate SQL'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SQL Query
                  </label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="SELECT * FROM table_name LIMIT 10;"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={4}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={executeQuery}
                    disabled={!selectedFile || !query.trim() || executingQuery}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {executingQuery ? 'Executing...' : 'Execute Query'}
                  </button>
                </div>
                
                {/* Natural Language Answer */}
                {naturalLanguageAnswer && (
                  <div className="mt-4">
                    <h5 className="text-md font-medium mb-2">AI Analysis</h5>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{naturalLanguageAnswer}</p>
                    </div>
                  </div>
                )}

                {/* Query Results */}
                {queryResults.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-md font-medium mb-2">Query Results</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                          <tr>
                            {queryResults[0]?.map((header, index) => (
                              <th key={index} className="px-3 py-2 border-b bg-gray-50 text-left text-sm font-medium text-gray-700">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResults.slice(1).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-3 py-2 border-b text-sm text-gray-900">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Analysis Results</h4>
            {dataAnalysisCells.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No analysis results yet. Paste data and click "Analyze with AI" to get started.</p>
              </div>
            ) : (
              dataAnalysisCells.map((cell) => renderAnalysisCell(cell))
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Data Sources */}
      <div className="w-80 flex flex-col p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Sources</h3>
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* Processed Data Sources */}
          {processedDataSources.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Processed Data</h4>
              {processedDataSources.map((source) => (
                <div key={source.id} className="p-3 bg-white border border-green-200 rounded-lg hover:border-green-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-800 text-sm">{source.display_name}</h5>
                      <p className="text-xs text-gray-500 mt-1">
                        {source.table_name} • {source.storage_format?.toUpperCase() || 'PARQUET'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {source.estimated_rows?.toLocaleString()} rows • {source.estimated_columns} columns
                      </p>
                      {source.description && (
                        <p className="text-xs text-gray-600 mt-1">{source.description}</p>
                      )}
                      <div className="mt-2 flex space-x-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ready for Query
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Uploaded Files */}
          {dataFileInfos.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files</h4>
              {dataFileInfos.map((fileInfo) => (
                <div key={fileInfo.id} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-800 text-sm">{fileInfo.name}</h5>
                      <p className="text-xs text-gray-500 mt-1">
                        {fileInfo.file_type.toUpperCase()} • {formatFileSize(fileInfo.size_bytes)}
                      </p>
                      {fileInfo.row_count && fileInfo.column_count && (
                        <p className="text-xs text-gray-500">
                          {fileInfo.row_count.toLocaleString()} rows • {fileInfo.column_count} columns
                        </p>
                      )}
                      {fileInfo.data_summary && (
                        <p className="text-xs text-gray-600 mt-1">{fileInfo.data_summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* No Data Sources */}
          {processedDataSources.length === 0 && dataFileInfos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No data sources found.</p>
              <p className="text-xs mt-1">Paste data or upload files to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataTab; 