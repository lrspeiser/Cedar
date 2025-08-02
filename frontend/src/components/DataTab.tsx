import React, { useState, useEffect } from 'react';
import { apiService } from '../api';

interface DataTabProps {
  projectId: string;
  dataFiles: string[];
  onDataFilesUpdate: (files: string[]) => void;
  onAddNotebookEntry?: (entry: {
    type: string;
    content: string;
    metadata?: any;
  }) => void;
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
  project_id: string;
  type_: string; // 'data_analysis', 'rust_analysis', 'llm_analysis'
  content: string;
  timestamp: string;
  status: string; // 'pending', 'active', 'completed', 'error'
  metadata?: any;
  rust_analysis?: any;
  llm_analysis?: any;
  stream_lines?: string[];
  is_streaming: boolean;
}

const DataTab: React.FC<DataTabProps> = ({ projectId, dataFiles: _dataFiles, onDataFilesUpdate: _onDataFilesUpdate, onAddNotebookEntry }) => {
  const [pastedData, setPastedData] = useState('');
  const [analyzingPastedData, setAnalyzingPastedData] = useState(false);
  const [dataAnalysisCells, setDataAnalysisCells] = useState<DataAnalysisCell[]>([]);
  const [dataFileInfos, setDataFileInfos] = useState<DataFileInfo[]>([]);
  const [processedDataSources, setProcessedDataSources] = useState<any[]>([]);
  // const [selectedFile, setSelectedFile] = useState<DataFileInfo | null>(null);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // New state for collapsible sections
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [showPasteSection, setShowPasteSection] = useState(false);
  const [showGenerateSection, setShowGenerateSection] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Load data file information and analysis cells on component mount
  useEffect(() => {
    loadDataFiles();
    loadProcessedDataSources();
    loadAnalysisCells();
  }, [projectId]);

  // Load processed data sources from localStorage
  const loadProcessedDataSources = () => {
    try {
      const saved = localStorage.getItem(`processedDataSources_${projectId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProcessedDataSources(parsed);
      }
    } catch (error) {
      console.error('Failed to load processed data sources:', error);
    }
  };

  // Save processed data sources to localStorage
  const saveProcessedDataSources = (sources: any[]) => {
    try {
      localStorage.setItem(`processedDataSources_${projectId}`, JSON.stringify(sources));
    } catch (error) {
      console.error('Failed to save processed data sources:', error);
    }
  };

  const loadDataFiles = async () => {
    try {
      const response = await apiService.listDataFiles({ projectId }) as any;
      if (response.data_files) {
        setDataFileInfos(response.data_files);
      }
    } catch (error) {
      console.error('Failed to load data files:', error);
    }
  };

  const loadAnalysisCells = async () => {
    try {
      const response = await apiService.listAnalysisCells({ projectId });
      if (response && Array.isArray(response)) {
        setDataAnalysisCells(response);
      }
    } catch (error) {
      console.error('Failed to load analysis cells:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileUpload(file);
  };

  // New function to analyze file using Rust backend
  const analyzeFileWithRust = async (file: File) => {
    try {
      // First, save the file temporarily so Rust can access it
      const formData = new FormData();
      formData.append('file', file);
      
      // Call the Rust backend API
      const response = await fetch('/api/analyze-file', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'File analysis failed');
      }
      
      return result;
    } catch (error) {
      console.error('Rust file analysis failed:', error);
      // Fallback to JavaScript parsing
      return null;
    }
  };

  const uploadFile = async () => {
    if (!fileUpload) return;

    try {
      setUploading(true);
      
      // Create a new analysis cell for file upload
      const analysisCell = await apiService.createAnalysisCell({
        projectId,
        type: 'data_analysis'
      }) as DataAnalysisCell;

      // Update the cell with initial content
      await apiService.updateAnalysisCellContent({
        id: analysisCell.id,
        content: `# File Analysis\n\n**File:** ${fileUpload.name}\n**Size:** ${formatFileSize(fileUpload.size)}\n**Type:** ${fileUpload.type || 'Unknown'}\n\n`
      });

      // Add the cell to the UI immediately
      setDataAnalysisCells(prev => [...prev, analysisCell]);

      // Stream initial progress
      await streamLines(analysisCell.id, [
        '## 🔄 Starting File Analysis...',
        '',
        '📁 Reading file content...',
        '🔍 Extracting data structure...',
        '🤖 Analyzing with AI...',
        '💾 Preparing storage schema...',
        '',
      ], 100);

      // Extract file extension and determine file type
      const fileExtension = fileUpload.name.split('.').pop()?.toLowerCase() || '';
      
      // Try Rust file analysis first, fallback to JavaScript if needed
      let rustAnalysis = null;
      let fileData;
      
      try {
        console.log('🔍 Attempting Rust file analysis...');
        rustAnalysis = await analyzeFileWithRust(fileUpload);
        
        if (rustAnalysis && rustAnalysis.metadata) {
          console.log('✅ Rust analysis successful:', rustAnalysis.metadata);
          
          // Convert Rust metadata to frontend format
          fileData = {
            structure: rustAnalysis.metadata.summary,
            headers: rustAnalysis.metadata.columns.map((col: any) => col.name),
            rows: rustAnalysis.metadata.first_5_rows,
            sampleData: rustAnalysis.first_10_lines.join('\n'),
            totalRows: rustAnalysis.metadata.total_records,
            sheetName: null,
            allSheets: null,
            rustMetadata: rustAnalysis.metadata // Store full Rust metadata
          };
        } else {
          throw new Error('Rust analysis returned no metadata');
        }
      } catch (error) {
        console.log('⚠️ Rust analysis failed, falling back to JavaScript parsing:', error);
        // Fallback to JavaScript parsing
        fileData = await readFileContent(fileUpload, fileExtension);
      }
      
      // Get existing database names for context
      // const existingTables = dataFiles.map(file => {
      //   const name = file.replace(/\.(csv|tsv|json|xlsx|xls|parquet)$/i, '');
      //   return name.replace(/[_-]/g, ' ').replace(/\d+$/, '').trim();
      // }).filter((name, index, arr) => arr.indexOf(name) === index);

      // Create analysis goal for file upload
      let analysisGoal;
      
      if (rustAnalysis && rustAnalysis.metadata) {
        // Use comprehensive Rust analysis data
        const metadata = rustAnalysis.metadata;
        analysisGoal = `The user uploaded this data file. You need to evaluate the comprehensive metadata analysis to determine how best to write the code to format it properly for storage in parquet. Analyze this file data and return ONLY valid JSON with metadata and storage code:

File: ${fileUpload.name}
File Type: ${metadata.file_type}
File Size: ${formatFileSize(fileUpload.size)}
Total Records: ${metadata.total_records}
Column Count: ${metadata.column_count}
Has Headers: ${metadata.has_headers}
Delimiter: ${metadata.delimiter || 'auto-detected'}

Data Structure:
${metadata.summary}

Column Analysis:
${metadata.columns.map((col: any, index: number) => `
Column ${index + 1}: "${col.name}"
  Type: ${col.data_type}
  Null Values: ${col.null_count}/${col.total_count} (${((col.null_count / col.total_count) * 100).toFixed(1)}%)
  Sample Values: ${col.sample_values.join(', ')}
  ${col.min_value ? `Min: ${col.min_value}, Max: ${col.max_value}, Median: ${col.median_value}` : ''}
`).join('\n')}

First 10 Lines:
${rustAnalysis.first_10_lines.map((line: string, i: number) => `${i + 1}: ${line}`).join('\n')}

First 5 Rows (structured):
${metadata.first_5_rows.map((row: any[], i: number) => `Row ${i + 1}: [${row.map(cell => `"${cell}"`).join(', ')}]`).join('\n')}

Data Quality Assessment:
- Total null values: ${metadata.columns.reduce((sum: number, col: any) => sum + col.null_count, 0)}
- Mixed type columns: ${metadata.columns.filter((col: any) => col.data_type === 'mixed').length}
- Numeric columns: ${metadata.columns.filter((col: any) => col.data_type === 'numeric').length}
- Text columns: ${metadata.columns.filter((col: any) => col.data_type === 'text').length}

IMPORTANT: This analysis was performed by a comprehensive Rust-based file analyzer that provides accurate data type detection, null value analysis, and statistical summaries. Use this detailed metadata to generate optimal parquet conversion code.
${(fileData as any).totalRows ? `Total Rows in File: ${(fileData as any).totalRows}` : ''}
${(fileData as any).sheetName ? `Active Sheet: ${(fileData as any).sheetName}` : ''}
${(fileData as any).allSheets && (fileData as any).allSheets.length > 1 ? `Available Sheets: ${(fileData as any).allSheets.join(', ')}` : ''}

Return this JSON structure:
{
  "metadata": {
    "table_name": "clean_table_name",
    "display_name": "brief descriptive name", 
    "description": "what this data represents",
    "source": "file_upload",
    "created_at": "2024-01-01T00:00:00Z",
    "estimated_rows": ${metadata.total_records},
    "estimated_columns": ${metadata.column_count},
    "data_format": "${metadata.file_type}",
    "has_headers": ${metadata.has_headers},
    "storage_format": "parquet",
    "original_filename": "${fileUpload.name}",
    "file_size_bytes": ${fileUpload.size}
  },
  "fields": [
    {
      "name": "column_name",
      "duckdb_type": "VARCHAR",
      "description": "column description",
      "sample_values": ["value1", "value2", "value3"],
      "is_nullable": false,
      "is_unique": false
    }
  ],
  "data_summary": "brief summary of the data",
  "storage_code": {
    "rust_function": "pub fn save_data() { /* Rust code */ }",
    "python_code": "import pandas as pd; df.to_parquet('file.parquet')",
    "duckdb_schema": "CREATE TABLE data (column VARCHAR)",
    "file_path": "data/filename.parquet",
    "conversion_code": "df = pd.read_csv(data); df.to_parquet('file.parquet')"
  }
}`;
      } else {
        // Fallback to original JavaScript analysis
        analysisGoal = `The user uploaded this data file. You need to evaluate the sample data to determine how best to write the code to format it properly for storage in parquet. Analyze this file data and return ONLY valid JSON with metadata and storage code:

File: ${fileUpload.name}
File Type: ${fileExtension}
File Size: ${formatFileSize(fileUpload.size)}

Data Structure:
${fileData.structure}

Parsed Headers: ${fileData.headers.join(', ')}
Number of Columns: ${fileData.headers.length}
Number of Sample Rows: ${fileData.rows.length}

Sample Data (first 10 rows, pipe-separated with column names):
${fileData.sampleData}

IMPORTANT: Each row contains ${fileData.headers.length} separate columns. The data is formatted as "ColumnName: Value" for clarity.
${(fileData as any).totalRows ? `Total Rows in File: ${(fileData as any).totalRows}` : ''}
${(fileData as any).sheetName ? `Active Sheet: ${(fileData as any).sheetName}` : ''}
${(fileData as any).allSheets && (fileData as any).allSheets.length > 1 ? `Available Sheets: ${(fileData as any).allSheets.join(', ')}` : ''}

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
      "name": "column_name",
      "duckdb_type": "VARCHAR",
      "description": "column description",
      "sample_values": ["value1", "value2", "value3"],
      "is_nullable": false,
      "is_unique": false
    }
  ],
  "data_summary": "brief summary of the data",
  "storage_code": {
    "rust_function": "pub fn save_data() { /* Rust code */ }",
    "python_code": "import pandas as pd; df.to_parquet('file.parquet')",
    "duckdb_schema": "CREATE TABLE data (column VARCHAR)",
    "file_path": "data/filename.parquet",
    "conversion_code": "df = pd.read_csv(data); df.to_parquet('file.parquet')"
  }
}`;
      }

      const response = await apiService.initializeResearch({
        goal: analysisGoal
      }) as any;

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
          // If not valid JSON, create a structured response from the parsed file data
          const tableName = fileUpload.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.(csv|tsv|json|xlsx|xls|parquet)$/i, '');
          
          analysisResult = {
            metadata: {
              table_name: tableName,
              display_name: generateContentBasedName(fileData.headers, fileData.rows.slice(0, 5)),
              description: `Data from uploaded file: ${fileUpload.name}`,
              source: "file_upload",
              created_at: new Date().toISOString(),
              estimated_rows: (fileData as any).totalRows || fileData.rows.length,
              estimated_columns: fileData.headers.length,
              data_format: fileExtension,
              has_headers: true,
              storage_format: "parquet",
              original_filename: fileUpload.name,
              file_size_bytes: fileUpload.size,
              sheet_name: (fileData as any).sheetName,
              all_sheets: (fileData as any).allSheets,
              sample_rows_analyzed: Math.min(10, fileData.rows.length)
            },
            fields: fileData.headers.map((header: string, index: number) => ({
              name: header.trim().replace(/[^a-zA-Z0-9_]/g, '_'),
              duckdb_type: "VARCHAR",
              description: `Column ${index + 1} from the uploaded file`,
              sample_values: fileData.rows.slice(0, 4).map((row: any) => row[index] || '').filter(Boolean),
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
  ${fileData.headers.map((header: string, index: number) => `${header.trim().replace(/[^a-zA-Z0-9_]/g, '_')} VARCHAR`).join(',\n  ')}
);`,
               file_path: `data/${tableName}.parquet`,
               conversion_code: `import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import os
import sys

def convert_file_to_parquet(file_path, output_path):
    """
    Convert various file formats to parquet with proper error handling
    """
    try:
        file_extension = file_path.lower().split('.')[-1]
        
        print(f"Reading file: {file_path}")
        print(f"File type: {file_extension}")
        
        # Read the file based on its type
        if file_extension in ['xlsx', 'xls']:
            # For Excel files, try to read all sheets and use the first one with data
            excel_file = pd.ExcelFile(file_path)
            print(f"Available sheets: {excel_file.sheet_names}")
            
            # Try to find the first sheet with data
            df = None
            for sheet_name in excel_file.sheet_names:
                try:
                    sheet_df = pd.read_excel(file_path, sheet_name=sheet_name)
                    if not sheet_df.empty and len(sheet_df.columns) > 0:
                        df = sheet_df
                        print(f"Using sheet: {sheet_name}")
                        break
                except Exception as e:
                    print(f"Error reading sheet {sheet_name}: {e}")
                    continue
            
            if df is None:
                raise ValueError("No valid data found in any sheet")
                
        elif file_extension == 'csv':
            # Try different delimiters for CSV
            for delimiter in [',', ';', '\\t', '|']:
                try:
                    df = pd.read_csv(file_path, delimiter=delimiter)
                    if len(df.columns) > 1:
                        print(f"Successfully read CSV with delimiter: '{delimiter}'")
                        break
                except:
                    continue
            else:
                # If all delimiters fail, try with engine='python'
                df = pd.read_csv(file_path, sep=None, engine='python')
                
        elif file_extension == 'json':
            df = pd.read_json(file_path)
        elif file_extension == 'parquet':
            df = pd.read_parquet(file_path)
        else:
            # Try to detect delimiter for other text files
            df = pd.read_csv(file_path, sep=None, engine='python')
        
        # Clean column names
        df.columns = [str(col).strip().replace(' ', '_').replace('-', '_') for col in df.columns]
        
        # Remove completely empty rows and columns
        df = df.dropna(how='all').dropna(axis=1, how='all')
        
        print(f"Data shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        print(f"Data types: {df.dtypes.to_dict()}")
        
        # Convert to parquet with compression
        df.to_parquet(output_path, index=False, compression='snappy')
        
        file_size = os.path.getsize(output_path)
        print(f"✅ Successfully converted {len(df)} rows and {len(df.columns)} columns to parquet")
        print(f"📁 Output file: {output_path}")
        print(f"📊 File size: {file_size:,} bytes")
        
        return df
        
    except Exception as e:
        print(f"❌ Error converting file: {e}")
        print(f"File path: {file_path}")
        print(f"Output path: {output_path}")
        sys.exit(1)

# Convert the uploaded file
file_path = '${fileUpload.name}'
output_path = '${tableName}.parquet'

df = convert_file_to_parquet(file_path, output_path)

# Display sample data
print("\\n📋 Sample data (first 5 rows):")
print(df.head())

print("\\n📊 Data summary:")
print(df.info())`
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
        const metadataLines = [
          '### 📋 File Metadata',
          '',
          `- **Original Filename:** ${analysisResult.metadata.original_filename}`,
          `- **File Size:** ${formatFileSize(analysisResult.metadata.file_size_bytes)}`,
          `- **Data Format:** ${analysisResult.metadata.data_format}`,
          `- **Estimated Rows:** ${analysisResult.metadata.estimated_rows}`,
          `- **Estimated Columns:** ${analysisResult.metadata.estimated_columns}`,
          `- **Has Headers:** ${analysisResult.metadata.has_headers ? 'Yes' : 'No'}`,
          `- **Storage Format:** ${analysisResult.metadata.storage_format}`,
        ];

        // Add Excel-specific information
        if (analysisResult.metadata.sheet_name) {
          metadataLines.push(`- **Active Sheet:** ${analysisResult.metadata.sheet_name}`);
        }
        if (analysisResult.metadata.all_sheets && analysisResult.metadata.all_sheets.length > 1) {
          metadataLines.push(`- **Available Sheets:** ${analysisResult.metadata.all_sheets.join(', ')}`);
        }
        if (analysisResult.metadata.sample_rows_analyzed) {
          metadataLines.push(`- **Sample Rows Analyzed:** ${analysisResult.metadata.sample_rows_analyzed}`);
        }

        metadataLines.push('', '');
        await streamLines(analysisCell.id, metadataLines, 50);
      }

      // Stream parsed data preview
      if (fileData.sampleData && !(fileData as any).error) {
        await streamLines(analysisCell.id, [
          '### 📊 Data Preview',
          '',
          '**First 10 rows of parsed data:**',
          '',
          '```',
          fileData.sampleData,
          '```',
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



      // Stream completion
      await streamLines(analysisCell.id, [
        '## ✅ File Analysis Complete!',
        '',
        'The file has been analyzed and schema generated.',
        'You can now save the data in any of the recommended formats.',
        '',
      ], 50);

      // Store Rust analysis in the cell if available
      if (rustAnalysis) {
        await apiService.addRustAnalysisToCell({
          id: analysisCell.id,
          rustAnalysis: rustAnalysis
        });
      }

      // Store LLM analysis in the cell
      await apiService.addLlmAnalysisToCell({
        id: analysisCell.id,
        llmAnalysis: response
      });

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
          const newSource = {
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
            storage_code: analysisResult.storage_code,
            // Add sample data and columns for metadata display
            columns: analysisResult.fields?.map((field: any) => ({
              name: field.name,
              data_type: field.duckdb_type,
              nullable: field.is_nullable,
              sample_values: field.sample_values || []
            })) || [],
            sample_data: fileData?.rows?.slice(0, 5) || []
          };
          setProcessedDataSources(prev => {
            const updated = [...prev, newSource];
            saveProcessedDataSources(updated);
            return updated;
          });

          // Add notebook entry for the file upload analysis
          if (onAddNotebookEntry) {
            const notebookContent = `# 📁 File Upload Analysis

**File:** ${fileUpload.name}
**Size:** ${formatFileSize(fileUpload.size)}
**Type:** ${fileExtension}

## 📋 Analysis Results

**Display Name:** ${analysisResult.metadata.display_name}
**Table Name:** ${analysisResult.metadata.table_name}
**Description:** ${analysisResult.metadata.description}

**Data Structure:**
- **Estimated Rows:** ${analysisResult.metadata.estimated_rows}
- **Estimated Columns:** ${analysisResult.metadata.estimated_columns}
- **Data Format:** ${analysisResult.metadata.data_format}
- **Storage Format:** ${analysisResult.metadata.storage_format}

## 🔍 Field Analysis

${analysisResult.fields?.map((field: any) => 
  `**${field.name}** (${field.duckdb_type})
  - Description: ${field.description}
  - Sample Values: ${field.sample_values?.slice(0, 3).join(', ')}
  - Nullable: ${field.is_nullable ? 'Yes' : 'No'}
  - Unique: ${field.is_unique ? 'Yes' : 'No'}`
).join('\n\n') || 'No field information available'}

## 💾 Storage Information

**File Path:** ${analysisResult.storage_code?.file_path || 'Not specified'}
**Conversion Code:** Available for ${analysisResult.metadata.data_format} → parquet conversion

## ✅ Status

File analysis completed successfully. Data has been processed and is ready for querying.`;

            onAddNotebookEntry({
              type: 'data_upload',
              content: notebookContent,
              metadata: {
                fileInfo: {
                  name: fileUpload.name,
                  size: fileUpload.size,
                  type: fileExtension
                },
                analysisResult: analysisResult,
                dataSource: newSource
              }
            });
          }
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Don't show error to user, just log it
      }

      setFileUpload(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Collapse upload section after successful upload
      setShowUploadSection(false);
      
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
    const analysisCell = await apiService.createAnalysisCell({
      projectId,
      type: 'data_analysis'
    }) as DataAnalysisCell;

    // Update the cell with initial content
    await apiService.updateAnalysisCellContent({
      id: analysisCell.id,
      content: `# Data Analysis\n\n**Data to analyze:**\n\`\`\`\n${pastedData.slice(0, 200)}${pastedData.length > 200 ? '...' : ''}\n\`\`\`\n\n`
    });

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
      // const existingTables = dataFiles.map(file => {
      //   const name = file.replace(/\.(csv|tsv|json|xlsx|xls|parquet)$/i, '');
      //   return name.replace(/[_-]/g, ' ').replace(/\d+$/, '').trim();
      // }).filter((name, index, arr) => arr.indexOf(name) === index);

      // Call LLM to analyze the pasted data and provide storage code
      const analysisGoal = `The user uploaded this data. You need to evaluate the sample of the data to determine how best to write the code to format it properly for storage in parquet. This may mean it has errors in its CSV structure but the scripts you give to process it must fix them. Analyze this file data and return ONLY valid JSON with metadata and storage code:

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
      }) as any;

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
          const headers = lines[0]?.split(',') || [];
          
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
              sample_values: lines.slice(1, 4).map(line => line.split(',')[index] || '').filter(Boolean),
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
df = pd.read_csv(StringIO(data), sep=',')

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

      // Store LLM analysis in the cell
      await apiService.addLlmAnalysisToCell({
        id: analysisCell.id,
        llmAnalysis: response
      });

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
          const newSource = {
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
            storage_code: analysisResult.storage_code,
            // Add sample data and columns for metadata display
            columns: analysisResult.fields?.map((field: any) => ({
              name: field.name,
              data_type: field.duckdb_type,
              nullable: field.is_nullable,
              sample_values: field.sample_values || []
            })) || [],
            sample_data: pastedData.split('\n').slice(0, 5).map(line => line.split(',').map(cell => cell.trim()))
          };
          setProcessedDataSources(prev => {
            const updated = [...prev, newSource];
            saveProcessedDataSources(updated);
            return updated;
          });
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
        // Collapse paste section after analysis (success or error)
        setShowPasteSection(false);
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



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSelectedFileMetadata = () => {
    // First check processed data sources
    const processedFile = processedDataSources.find(source => source.id === selectedFileId);
    if (processedFile) {
      return {
        type: 'processed',
        data: processedFile
      };
    }
    
    // Then check uploaded files
    const uploadedFile = dataFileInfos.find(file => file.id === selectedFileId);
    if (uploadedFile) {
      return {
        type: 'uploaded',
        data: uploadedFile
      };
    }
    
    return null;
  };

  // const formatDate = (timestamp: number) => {
  //   return new Date(timestamp * 1000).toLocaleString();
  // };

  // Function to read and parse different file formats
  const readFileContent = async (file: File, fileExtension: string) => {
    try {
      switch (fileExtension) {
        case 'csv':
          return await readCSVFile(file);
        case 'tsv':
        case 'txt':
          return await readTSVFile(file);
        case 'json':
          return await readJSONFile(file);
        case 'xlsx':
        case 'xls':
          return await readExcelFile(file);
        case 'parquet':
          return await readParquetFile(file);
        default:
          return await readGenericFile(file);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      return {
        sampleData: `Error reading file: ${error}`,
        structure: 'Unable to determine structure',
        headers: [],
        rows: []
      };
    }
  };

  const readCSVFile = async (file: File) => {
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());
    const first10Lines = lines.slice(0, 10);
    
    // Try to detect delimiter
    const firstLine = first10Lines[0] || '';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    
    let delimiter = ',';
    if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';
    else if (semicolonCount > commaCount) delimiter = ';';
    
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
    const rows = first10Lines.slice(1).map(line => 
      line.split(delimiter).map(cell => cell.trim().replace(/"/g, ''))
    );
    
    return {
      sampleData: first10Lines.join('\n'),
      structure: `CSV with ${headers.length} columns: ${headers.join(', ')}`,
      headers,
      rows
    };
  };

  const readTSVFile = async (file: File) => {
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());
    const first10Lines = lines.slice(0, 10);
    
    const headers = first10Lines[0]?.split('\t').map(h => h.trim()) || [];
    const rows = first10Lines.slice(1).map(line => 
      line.split('\t').map(cell => cell.trim())
    );
    
    return {
      sampleData: first10Lines.join('\n'),
      structure: `TSV with ${headers.length} columns: ${headers.join(', ')}`,
      headers,
      rows
    };
  };

  const readJSONFile = async (file: File) => {
    const content = await file.text();
    let parsedData;
    
    try {
      parsedData = JSON.parse(content);
    } catch {
      // Try parsing as JSONL (JSON Lines)
      const lines = content.split('\n').filter(line => line.trim());
      const first10Lines = lines.slice(0, 10);
      const jsonlData = first10Lines.map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean);
      
      if (jsonlData.length > 0) {
        const keys = Object.keys(jsonlData[0] || {});
        return {
          sampleData: first10Lines.join('\n'),
          structure: `JSONL with ${keys.length} fields: ${keys.join(', ')}`,
          headers: keys,
          rows: jsonlData.slice(0, 10)
        };
      }
      throw new Error('Invalid JSON format');
    }
    
    // Handle array of objects
    if (Array.isArray(parsedData)) {
      const first10Items = parsedData.slice(0, 10);
      const keys = Object.keys(first10Items[0] || {});
      return {
        sampleData: JSON.stringify(first10Items, null, 2),
        structure: `JSON array with ${keys.length} fields: ${keys.join(', ')}`,
        headers: keys,
        rows: first10Items
      };
    }
    
    // Handle single object
    const keys = Object.keys(parsedData);
    return {
      sampleData: JSON.stringify(parsedData, null, 2),
      structure: `JSON object with ${keys.length} fields: ${keys.join(', ')}`,
      headers: keys,
      rows: [parsedData]
    };
  };

  const readExcelFile = async (file: File) => {
    try {
      // Import xlsx library dynamically
      const XLSX = await import('xlsx');
      
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse the Excel file
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first worksheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      if (!worksheet) {
        throw new Error('No worksheet found in Excel file');
      }
      
      // Convert worksheet to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        throw new Error('No data found in Excel file');
      }
      
      // Extract headers (first row)
      const headers = (jsonData[0] as any[])?.map((cell: any) => 
        cell ? String(cell).trim() : `Column_${(jsonData[0] as any[]).indexOf(cell) + 1}`
      ) || [];
      
      // Extract data rows (skip header row)
      const dataRows = jsonData.slice(1).filter((row: any) => 
        row && (row as any[]).some((cell: any) => cell !== null && cell !== undefined && cell !== '')
      );
      
      // Get first 10 rows for analysis
      const first10Rows = dataRows.slice(0, 10);
      
              // Create sample data display with clear column separation
        const sampleData = [
          `Columns: ${headers.join(' | ')}`,
          `Types: ${headers.map(() => 'VARCHAR').join(' | ')}`,
          '---',
          ...first10Rows.map((row: any) => 
            headers.map((header: any, index: number) => `${header}: ${(row as any[])[index] || ''}`).join(' | ')
          )
        ].join('\n');
      
      // Determine data structure description
      const structure = `Excel file with ${headers.length} columns: ${headers.join(', ')}`;
      
      return {
        sampleData,
        structure,
        headers,
        rows: first10Rows,
        totalRows: dataRows.length,
        sheetName: firstSheetName,
        allSheets: workbook.SheetNames
      };
    } catch (error) {
      console.error('Error reading Excel file:', error);
      return {
        sampleData: `Error reading Excel file: ${error}\n\nFile: ${file.name}\nSize: ${file.size} bytes`,
        structure: 'Excel file - error during parsing',
        headers: [],
        rows: [],
        error: (error as Error).message
      };
    }
  };

  const readParquetFile = async (file: File) => {
    // Parquet files are binary and require special handling
    return {
      sampleData: `Parquet file detected: ${file.name}\n\nNote: Parquet files require Python processing with pyarrow.\nThe conversion code will handle this automatically.`,
      structure: 'Parquet file - structure will be determined during conversion',
      headers: [],
      rows: []
    };
  };

  const readGenericFile = async (file: File) => {
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());
    const first10Lines = lines.slice(0, 10);
    
    return {
      sampleData: first10Lines.join('\n'),
      structure: `Generic text file with ${first10Lines.length} lines`,
      headers: [],
      rows: first10Lines
    };
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
      {/* Left Panel - Analysis Results */}
      <div className="flex-1 flex flex-col p-4 border-r border-gray-200">
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">Data Analysis</h3>
          </div>

          {/* Analysis Results */}
          <div className="space-y-4">
            {dataAnalysisCells.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No analysis results yet. Use the action buttons on the right to upload, paste, or generate data.</p>
              </div>
            ) : (
              dataAnalysisCells.map((cell) => renderAnalysisCell(cell))
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Action Buttons and Data Sources */}
      <div className="w-80 flex flex-col p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
        
        {/* Action Buttons */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => {
              setShowUploadSection(!showUploadSection);
              // Clear file upload when closing the section
              if (showUploadSection) {
                setFileUpload(null);
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }
            }}
            className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium text-gray-800">Upload File</span>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showUploadSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <button
            onClick={() => {
              setShowPasteSection(!showPasteSection);
              // Clear pasted data when closing the section
              if (showPasteSection) {
                setPastedData('');
              }
            }}
            className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium text-gray-800">Paste Data</span>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showPasteSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <button
            onClick={() => setShowGenerateSection(!showGenerateSection)}
            className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-medium text-gray-800">Generate Data</span>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showGenerateSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-3 mb-4">
          {/* Upload File Section */}
          {showUploadSection && (
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Upload Data File</h4>
              <div className="space-y-3">
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
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">
                      Selected: {fileUpload.name} ({formatFileSize(fileUpload.size)})
                    </span>
                    <button
                      onClick={uploadFile}
                      disabled={uploading}
                      className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload & Analyze'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paste Data Section */}
          {showPasteSection && (
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Analyze Pasted Data</h4>
              <div className="space-y-3">
                <div>
                  <textarea
                    value={pastedData}
                    onChange={(e) => setPastedData(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Paste CSV, JSON, TSV, or any structured data here..."
                    rows={4}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={analyzePastedData}
                    disabled={!pastedData.trim() || analyzingPastedData}
                    className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {analyzingPastedData ? 'Analyzing...' : 'Analyze'}
                  </button>
                  <button
                    onClick={() => setPastedData('')}
                    className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generate Data Section */}
          {showGenerateSection && (
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Generate Sample Data</h4>
              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  Generate sample datasets for testing and development.
                </p>
                <button
                  onClick={() => {
                    // TODO: Implement data generation
                    alert('Data generation feature coming soon!');
                  }}
                  className="w-full bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600"
                >
                  Generate Sample Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Data Sources List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Data Sources</h4>
          
          {/* Processed Data Sources */}
          {processedDataSources.length > 0 && (
            <>
              <h5 className="text-xs font-medium text-gray-600 mb-2">Processed Data</h5>
              {processedDataSources.map((source) => (
                <div key={source.id} className="p-3 bg-white border border-green-200 rounded-lg hover:border-green-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <button
                        onClick={() => setSelectedFileId(selectedFileId === source.id ? null : source.id)}
                        className="text-left w-full"
                      >
                        <h5 className={`font-medium text-sm ${selectedFileId === source.id ? 'text-blue-600' : 'text-gray-800'} hover:text-blue-600 transition-colors`}>
                          {source.display_name}
                        </h5>
                      </button>
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
              <h5 className="text-xs font-medium text-gray-600 mb-2">Uploaded Files</h5>
              {dataFileInfos.map((fileInfo) => (
                <div key={fileInfo.id} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <button
                        onClick={() => setSelectedFileId(selectedFileId === fileInfo.id ? null : fileInfo.id)}
                        className="text-left w-full"
                      >
                        <h5 className={`font-medium text-sm ${selectedFileId === fileInfo.id ? 'text-blue-600' : 'text-gray-800'} hover:text-blue-600 transition-colors`}>
                          {fileInfo.name}
                        </h5>
                      </button>
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

          {/* File Metadata Display */}
          {selectedFileId && getSelectedFileMetadata() && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-3">File Metadata</h4>
              {(() => {
                const metadata = getSelectedFileMetadata();
                if (!metadata) return null;
                
                if (metadata.type === 'processed') {
                  const data = metadata.data;
                  return (
                    <div className="space-y-3">
                      {/* Summary */}
                      <div>
                        <h5 className="text-xs font-medium text-blue-800 mb-1">Summary</h5>
                        <p className="text-xs text-blue-700">{data.description || 'No summary available'}</p>
                      </div>
                      
                      {/* Number of Records */}
                      <div>
                        <h5 className="text-xs font-medium text-blue-800 mb-1">Number of Records</h5>
                        <p className="text-xs text-blue-700">{data.estimated_rows?.toLocaleString() || 'Unknown'} rows</p>
                      </div>
                      
                      {/* Column Titles */}
                      <div>
                        <h5 className="text-xs font-medium text-blue-800 mb-1">Column Titles</h5>
                        <div className="flex flex-wrap gap-1">
                          {data.columns?.map((col: any, index: number) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {col.name}
                            </span>
                          )) || (
                            <span className="text-xs text-blue-600">No column information available</span>
                          )}
                        </div>
                      </div>
                      
                      {/* First 5 Rows */}
                      <div>
                        <h5 className="text-xs font-medium text-blue-800 mb-1">First 5 Rows</h5>
                        {data.sample_data && data.sample_data.length > 0 ? (
                          <div className="bg-white border border-blue-200 rounded p-2 max-h-32 overflow-y-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr>
                                  {data.columns?.map((col: any, index: number) => (
                                    <th key={index} className="text-left p-1 font-medium text-blue-800 border-b border-blue-200">
                                      {col.name}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {data.sample_data.slice(0, 5).map((row: any[], rowIndex: number) => (
                                  <tr key={rowIndex}>
                                    {row.map((cell: any, cellIndex: number) => (
                                      <td key={cellIndex} className="p-1 text-blue-700 border-b border-blue-100">
                                        {String(cell).length > 20 ? String(cell).substring(0, 20) + '...' : String(cell)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-blue-600">No sample data available</p>
                        )}
                      </div>
                    </div>
                  );
                } else if (metadata.type === 'uploaded') {
                  const data = metadata.data;
                  return (
                    <div className="space-y-3">
                      {/* Summary */}
                      <div>
                        <h5 className="text-xs font-medium text-blue-800 mb-1">Summary</h5>
                        <p className="text-xs text-blue-700">{data.data_summary || 'No summary available'}</p>
                      </div>
                      
                      {/* Number of Records */}
                      <div>
                        <h5 className="text-xs font-medium text-blue-800 mb-1">Number of Records</h5>
                        <p className="text-xs text-blue-700">{data.row_count?.toLocaleString() || 'Unknown'} rows</p>
                      </div>
                      
                      {/* Column Titles */}
                      <div>
                        <h5 className="text-xs font-medium text-blue-800 mb-1">Column Titles</h5>
                        <div className="flex flex-wrap gap-1">
                          {data.columns?.map((col: any, index: number) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {col.name}
                            </span>
                          )) || (
                            <span className="text-xs text-blue-600">No column information available</span>
                          )}
                        </div>
                      </div>
                      
                      {/* First 5 Rows */}
                      <div>
                        <h5 className="text-xs font-medium text-blue-800 mb-1">First 5 Rows</h5>
                        {data.sample_data && data.sample_data.length > 0 ? (
                          <div className="bg-white border border-blue-200 rounded p-2 max-h-32 overflow-y-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr>
                                  {data.columns?.map((col: any, index: number) => (
                                    <th key={index} className="text-left p-1 font-medium text-blue-800 border-b border-blue-200">
                                      {col.name}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {data.sample_data.slice(0, 5).map((row: any[], rowIndex: number) => (
                                  <tr key={rowIndex}>
                                    {row.map((cell: any, cellIndex: number) => (
                                      <td key={cellIndex} className="p-1 text-blue-700 border-b border-blue-100">
                                        {String(cell).length > 20 ? String(cell).substring(0, 20) + '...' : String(cell)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-blue-600">No sample data available</p>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* No Data Sources */}
          {processedDataSources.length === 0 && dataFileInfos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No data sources found.</p>
              <p className="text-xs mt-1">Use the buttons above to add data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataTab; 