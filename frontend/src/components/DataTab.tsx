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

const DataTab: React.FC<DataTabProps> = ({ projectId, dataFiles, onDataFilesUpdate }) => {
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      const response = await apiService.listDataFiles({ projectId });
      if (response.data_files) {
        setDataFileInfos(response.data_files);
      }
    } catch (error) {
      console.error('Failed to load data files:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDataFile = async () => {
    if (!newFileName.trim() || !newFileContent.trim()) {
      alert('Please enter both file name and content');
      return;
    }

    try {
      setLoading(true);
      await apiService.saveFile({
        project_id: projectId,
        filename: newFileName,
        content: newFileContent,
        file_type: 'data',
      });
      
      onDataFilesUpdate([...dataFiles, newFileName]);
      setNewFileName('');
      setNewFileContent('');
      setShowCreateForm(false);
      await loadDataFiles(); // Refresh the list
    } catch (error) {
      console.error('Failed to create data file:', error);
      alert('Failed to create data file');
    } finally {
      setLoading(false);
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

  const analyzeFile = async (fileInfo: DataFileInfo) => {
    try {
      setLoading(true);
      const response = await apiService.analyzeDataFile({
        projectId,
        fileId: fileInfo.id
      });
      
      console.log('File analyzed successfully:', response);
      await loadDataFiles(); // Refresh with updated analysis
    } catch (error) {
      console.error('Failed to analyze file:', error);
      alert('Failed to analyze file');
    } finally {
      setLoading(false);
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

  const createNotebookQueryCell = async () => {
    if (!selectedFile || !query.trim()) return;

    try {
      // Get current session ID from project
      const project = await apiService.getProject(projectId);
      const sessionId = project?.session_id;
      
      if (!sessionId) {
        alert('No active session found. Please start a research session first.');
        return;
      }

      // Execute the query
      const response = await apiService.executeDuckDBQuery({
        projectId,
        tableName: selectedFile.table_name || 'unknown',
        query: query.trim()
      });

      // Create a notebook cell for the query
      const queryCell = {
        id: `query_${Date.now()}`,
        type: 'duckdb_query',
        content: `DuckDB Query on ${selectedFile.name}:\n${query.trim()}`,
        timestamp: new Date().toISOString(),
        status: 'completed',
        metadata: {
          queryResults: response.results || [],
          tableName: selectedFile.table_name,
          fileName: selectedFile.name
        }
      };

      // Add the cell to the session
      const session = await apiService.loadSession(sessionId);
      if (session) {
        const cells = session.cells || [];
        cells.push(queryCell);
        await apiService.updateSession(sessionId, cells);
        
        alert('Query executed and added to notebook!');
      }
      
    } catch (error) {
      console.error('Failed to create notebook query cell:', error);
      alert('Failed to create notebook query cell');
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

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Data Management</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors"
            >
              Add Data File
            </button>
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
                <button
                  onClick={createNotebookQueryCell}
                  disabled={!selectedFile || !query.trim()}
                  className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:opacity-50"
                >
                  Add to Notebook
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

        {/* Create Data File Form */}
        {showCreateForm && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-medium mb-4">Create New Data File</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
                  placeholder="e.g., sample_data.csv"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Content
                </label>
                <textarea
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500 font-mono text-sm"
                  placeholder="Paste your data here..."
                  rows={8}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={createDataFile}
                  disabled={loading}
                  className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create File'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Files List */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Data Files ({dataFileInfos.length})</h4>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedar-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading data files...</p>
            </div>
          ) : dataFileInfos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No data files found. Upload a file or create one to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {dataFileInfos.map((fileInfo) => (
                <div key={fileInfo.id} className="p-4 border border-gray-200 rounded-lg hover:border-cedar-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="text-blue-500">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800">{fileInfo.name}</h5>
                          <p className="text-sm text-gray-500">
                            {fileInfo.file_type.toUpperCase()} • {formatFileSize(fileInfo.size_bytes)} • {formatDate(fileInfo.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      
                      {/* File Statistics */}
                      {(fileInfo.row_count || fileInfo.column_count) && (
                        <div className="flex space-x-4 text-sm text-gray-600 mb-2">
                          {fileInfo.row_count && (
                            <span>{fileInfo.row_count.toLocaleString()} rows</span>
                          )}
                          {fileInfo.column_count && (
                            <span>{fileInfo.column_count} columns</span>
                          )}
                          {fileInfo.table_name && (
                            <span>Table: {fileInfo.table_name}</span>
                          )}
                        </div>
                      )}
                      
                      {/* Data Summary */}
                      {fileInfo.data_summary && (
                        <p className="text-sm text-gray-600 mb-3">{fileInfo.data_summary}</p>
                      )}
                      
                      {/* Column Information */}
                      {fileInfo.columns && fileInfo.columns.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium text-gray-700 mb-1">Columns:</h6>
                          <div className="flex flex-wrap gap-2">
                            {fileInfo.columns.map((col, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                                title={`${col.data_type}${col.nullable ? ' (nullable)' : ''}`}
                              >
                                {col.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Sample Data */}
                      {fileInfo.sample_data && fileInfo.sample_data.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium text-gray-700 mb-1">Sample Data:</h6>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <tbody>
                                {fileInfo.sample_data.slice(0, 3).map((row, rowIndex) => (
                                  <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                      <td key={cellIndex} className="px-2 py-1 border border-gray-200">
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
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => analyzeFile(fileInfo)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Analyze
                      </button>
                      <button
                        onClick={() => setSelectedFile(fileInfo)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Query
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataTab; 