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
  const [selectedFile, setSelectedFile] = useState<DataFileInfo | null>(null);
  const [showQueryInterface, setShowQueryInterface] = useState(false);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<string[][]>([]);
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
      
      // Read file content
      const content = await fileUpload.text();
      
      // Get current session ID from project
      const project = await apiService.getProject(projectId);
      const sessionId = project?.session_id;
      
      if (sessionId) {
        // Upload with notebook integration
        const response = await apiService.uploadDataFileWithNotebook({
          projectId,
          filename: fileUpload.name,
          content,
          fileType: fileUpload.name.split('.').pop() || 'unknown',
          sessionId
        });

        console.log('File uploaded with notebook integration:', response);
        
        // Show success message with notebook cells created
        if (response.notebook_cells) {
          alert(`File uploaded successfully! Created ${response.notebook_cells.length} notebook cells for analysis.`);
        }
      } else {
        // Fallback to regular upload
        const response = await apiService.uploadDataFile({
          projectId,
          filename: fileUpload.name,
          content,
          fileType: fileUpload.name.split('.').pop() || 'unknown'
        });

        console.log('File uploaded successfully:', response);
      }
      
      // Refresh data files
      await loadDataFiles();
      setFileUpload(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
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
        '',
      ], 100);
      
      // Call LLM to analyze the pasted data using initializeResearch as a workaround
      const analysisGoal = `Analyze the following data and provide a comprehensive JSON response with the following structure:

{
  "metadata": {
    "data_type": "string (csv, json, tsv, etc.)",
    "estimated_rows": "number",
    "estimated_columns": "number",
    "has_headers": "boolean",
    "encoding": "string (utf-8, etc.)"
  },
  "fields": [
    {
      "name": "string",
      "type": "string (string, number, date, boolean, etc.)",
      "sample_values": ["array of sample values"],
      "range": {
        "min": "value or null",
        "max": "value or null"
      },
      "null_count": "number or null",
      "unique_count": "number or null",
      "description": "string (what this field represents)"
    }
  ],
  "data_summary": "string (overall description of the dataset)",
  "storage_recommendations": [
    {
      "format": "string (postgres, json, parquet, csv, etc.)",
      "reasoning": "string (why this format is recommended)",
      "pros": ["array of advantages"],
      "cons": ["array of disadvantages"],
      "duckdb_compatibility": "string (how well it works with DuckDB)"
    }
  ],
  "data_quality_issues": [
    {
      "issue": "string",
      "severity": "string (low, medium, high)",
      "suggestion": "string (how to fix)"
    }
  ]
}

Data to analyze:
${pastedData}

Please provide a detailed analysis focusing on:
1. Field types and data ranges
2. Data quality assessment
3. Storage format recommendations (considering DuckDB compatibility)
4. Potential issues or anomalies in the data`;

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
              data_type: "tsv",
              estimated_rows: lines.length - 1,
              estimated_columns: headers.length,
              has_headers: true,
              encoding: "utf-8"
            },
            fields: headers.map((header, index) => ({
              name: header.trim(),
              type: "string",
              sample_values: lines.slice(1, 4).map(line => line.split('\t')[index] || '').filter(Boolean),
              range: { min: null, max: null },
              null_count: 0,
              unique_count: null,
              description: `Column ${index + 1} from the dataset`
            })),
            data_summary: analysisText,
            storage_recommendations: [
              {
                format: "tsv",
                reasoning: "Tabular data with tab separators",
                pros: ["Simple", "Human readable", "Widely supported"],
                cons: ["Limited data types", "No schema validation"],
                duckdb_compatibility: "Excellent"
              },
              {
                format: "parquet",
                reasoning: "Columnar format for analytics",
                pros: ["Compressed", "Fast queries", "Schema support"],
                cons: ["Binary format", "Less human readable"],
                duckdb_compatibility: "Excellent"
              }
            ],
            data_quality_issues: []
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
            `**${field.name}** (${field.type})`,
            `- Description: ${field.description}`,
            `- Sample Values: ${field.sample_values?.slice(0, 3).join(', ')}`,
            field.range ? `- Range: ${field.range.min} - ${field.range.max}` : '',
            field.unique_count ? `- Unique Count: ${field.unique_count}` : '',
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
        '## ✅ Analysis Complete!',
        '',
        'The data has been analyzed and recommendations provided.',
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
    
    if (!cell.metadata?.pastedData) {
      alert('No pasted data found in cell');
      return;
    }
    
    if (!cell.metadata?.analysisResult) {
      alert('No analysis result found in cell');
      return;
    }

    try {
      // Generate filename based on recommended format
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `analyzed_data_${timestamp}.${format}`;
      
      // Save the original data with the recommended format
      await apiService.saveFile({
        project_id: projectId,
        filename: filename,
        content: cell.metadata.pastedData,
        file_type: 'data'
      });

      // Also save the analysis results as metadata
      const analysisFilename = `analysis_metadata_${timestamp}.json`;
      
      await apiService.saveFile({
        project_id: projectId,
        filename: analysisFilename,
        content: JSON.stringify(cell.metadata.analysisResult, null, 2),
        file_type: 'data'
      });

      alert(`Data saved as ${filename} with analysis metadata!`);
      await loadDataFiles(); // Refresh the list
    } catch (error) {
      console.error('Failed to save analyzed data:', error);
      alert(`Failed to save analyzed data: ${error}`);
    }
  };

  const executeQuery = async () => {
    if (!selectedFile || !query.trim()) return;

    try {
      setExecutingQuery(true);
      const response = await apiService.executeDuckDBQuery({
        projectId,
        tableName: selectedFile.table_name || 'unknown',
        query: query.trim()
      });
      
      if (response.results) {
        setQueryResults(response.results);
      }
    } catch (error) {
      console.error('Failed to execute query:', error);
      alert('Failed to execute query');
    } finally {
      setExecutingQuery(false);
    }
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
          
          {/* Save buttons for completed analysis */}
          {cell.status === 'completed' && cell.metadata?.analysisResult?.storage_recommendations && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h6 className="text-sm font-medium text-gray-700 mb-2">Save Data:</h6>
              <div className="flex flex-wrap gap-2">
                {cell.metadata.analysisResult.storage_recommendations.map((rec: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => saveAnalyzedData(rec.format, cell.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                  >
                    Save as {rec.format.toUpperCase()}
                  </button>
                ))}
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
                    Select Table
                  </label>
                  <select
                    value={selectedFile?.id || ''}
                    onChange={(e) => {
                      const file = dataFileInfos.find(f => f.id === e.target.value);
                      setSelectedFile(file || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a table...</option>
                    {dataFileInfos.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.table_name || file.name}
                      </option>
                    ))}
                  </select>
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
          {dataFileInfos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No data files found.</p>
            </div>
          ) : (
            dataFileInfos.map((fileInfo) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DataTab; 