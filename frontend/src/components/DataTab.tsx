import React, { useState, useEffect } from 'react';
import { apiService } from '../api';
import { logger } from '../utils/logger';

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

const DataTab: React.FC<DataTabProps> = ({ projectId, dataFiles: _dataFiles, onDataFilesUpdate: _onDataFilesUpdate, onAddNotebookEntry: _onAddNotebookEntry }) => {
  // UI State
  const [pastedData, setPastedData] = useState('');
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  
  // Loading States
  const [uploading, setUploading] = useState(false);
  const [analyzingPastedData, setAnalyzingPastedData] = useState(false);
  const [loadingDataFiles, setLoadingDataFiles] = useState(false);
  
  // Collapsible Sections
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [showPasteSection, setShowPasteSection] = useState(false);
  const [showGenerateSection, setShowGenerateSection] = useState(false);
  
  // Data State
  const [dataFileInfos, setDataFileInfos] = useState<DataFileInfo[]>([]);
  const [dataAnalysisCells, setDataAnalysisCells] = useState<DataAnalysisCell[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadDataFiles();
    loadAnalysisCells();
  }, [projectId]);

  // ============================================================================
  // PURE PRESENTATION LOGIC - NO DATA PROCESSING
  // ============================================================================

  const loadDataFiles = async () => {
    try {
      setLoadingDataFiles(true);
      logger.info('DataTab', 'Loading data files', { projectId });
      const response = await apiService.listDataFiles({ projectId }) as any;
      logger.info('DataTab', 'List data files response', { response });
      if (response.data_files) {
        setDataFileInfos(response.data_files);
        logger.info('DataTab', 'Data files loaded successfully', { count: response.data_files.length });
      } else {
        logger.warn('DataTab', 'No data_files in response', { response });
      }
    } catch (error) {
      logger.error('DataTab', 'Failed to load data files', { error, projectId });
      console.error('Failed to load data files:', error);
    } finally {
      setLoadingDataFiles(false);
    }
  };

  const loadAnalysisCells = async () => {
    try {
      const cells = await apiService.listAnalysisCells({ projectId }) as DataAnalysisCell[];
      setDataAnalysisCells(cells);
    } catch (error) {
      console.error('Failed to load analysis cells:', error);
    }
  };

  // ============================================================================
  // FILE UPLOAD - PURE BACKEND CALL
  // ============================================================================

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileUpload(file);
    }
  };

  const uploadFile = async () => {
    if (!fileUpload) {
      logger.warn('DataTab', 'No file selected for upload');
      return;
    }

    try {
      setUploading(true);
      logger.info('DataTab', 'Starting file upload', { 
        filename: fileUpload.name, 
        size: fileUpload.size, 
        type: fileUpload.type,
        projectId 
      });
      
      // Read file content
      const content = await readFileAsText(fileUpload);
      logger.info('DataTab', 'File content read successfully', { 
        contentLength: content.length,
        preview: content.substring(0, 200) + '...'
      });
      
      // Call Rust backend to handle ALL processing
      logger.info('DataTab', 'Calling uploadDataFile API', {
        projectId,
        filename: fileUpload.name,
        contentLength: content.length,
        fileType: fileUpload.type || undefined
      });

      const result = await apiService.uploadDataFile({
        projectId,
        filename: fileUpload.name,
        content,
        fileType: fileUpload.type || undefined
      });

      logger.info('DataTab', 'File upload API call successful', { result });
      console.log('File upload result:', result);
      
      // Reload data files to show the new file
      await loadDataFiles();
      
      // Clear the upload
      setFileUpload(null);
      setShowUploadSection(false);
      
      logger.info('DataTab', 'File upload completed successfully');
      
    } catch (error) {
      logger.error('DataTab', 'File upload failed', { 
        error: error instanceof Error ? error.toString() : String(error),
        errorObject: error,
        filename: fileUpload?.name,
        projectId 
      });
      console.error('File upload failed:', error);
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ============================================================================
  // PASTED DATA - PURE BACKEND CALL
  // ============================================================================

  const analyzePastedData = async () => {
    if (!pastedData.trim()) {
      logger.warn('DataTab', 'No pasted data to analyze');
      alert('Please paste some data to analyze');
      return;
    }

    try {
      setAnalyzingPastedData(true);
      logger.info('DataTab', 'Starting pasted data analysis', { 
        dataLength: pastedData.length,
        preview: pastedData.substring(0, 200) + '...',
        projectId 
      });
      
      // Call Rust backend to handle ALL processing
      const result = await apiService.uploadDataFile({
        projectId,
        filename: `pasted_data_${Date.now()}.csv`,
        content: pastedData,
        fileType: 'csv'
      });

      logger.info('DataTab', 'Pasted data analysis successful', { result });
      console.log('Pasted data analysis result:', result);
      
      // Reload data files to show the new file
      await loadDataFiles();
      
      // Clear the pasted data
      setPastedData('');
      setShowPasteSection(false);
      
      logger.info('DataTab', 'Pasted data analysis completed successfully');
      
    } catch (error) {
      logger.error('DataTab', 'Pasted data analysis failed', { 
        error: error instanceof Error ? error.toString() : String(error),
        errorObject: error,
        dataLength: pastedData.length,
        projectId 
      });
      console.error('Pasted data analysis failed:', error);
      alert('Data analysis failed. Please try again.');
    } finally {
      setAnalyzingPastedData(false);
    }
  };

  // ============================================================================
  // GENERATE DATA - PURE BACKEND CALL
  // ============================================================================

  const generateData = async () => {
    try {
      // Call Rust backend to generate sample data
      const result = await apiService.callLLM({
        prompt: "Generate a sample CSV dataset with 10 rows and 5 columns of realistic data. Include headers.",
        context: "Data generation for testing purposes",
        userComment: "Generate sample data for the user"
      });

      console.log('Generated data result:', result);
      
      // The backend should handle saving this as a data file
      await loadDataFiles();
      
      setShowGenerateSection(false);
      
    } catch (error) {
      console.error('Data generation failed:', error);
      alert('Data generation failed. Please try again.');
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS - PURE PRESENTATION
  // ============================================================================

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
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

  const getSelectedFileMetadata = () => {
    if (!selectedFileId) return null;
    return dataFileInfos.find(file => file.id === selectedFileId);
  };

  // ============================================================================
  // RENDER FUNCTIONS - PURE PRESENTATION
  // ============================================================================

  const renderFileList = () => (
    <div className="space-y-2">
      {loadingDataFiles ? (
        <div className="text-gray-500">Loading data files...</div>
      ) : dataFileInfos.length === 0 ? (
        <div className="text-gray-500">No data files uploaded yet.</div>
      ) : (
        dataFileInfos.map((file) => (
          <div
            key={file.id}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedFileId === file.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedFileId(file.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{file.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size_bytes)} • {file.file_type.toUpperCase()} • {formatDate(file.uploaded_at)}
                </p>
                {file.row_count && file.column_count && (
                  <p className="text-sm text-gray-500">
                    {file.row_count.toLocaleString()} rows × {file.column_count} columns
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderFileMetadata = () => {
    const file = getSelectedFileMetadata();
    if (!file) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">File Metadata</h3>
        
        <div className="space-y-3">
          <div>
            <span className="font-medium">Summary:</span>
            <p className="text-sm text-gray-600">{file.data_summary || 'No summary available'}</p>
          </div>
          
          {file.columns && file.columns.length > 0 && (
            <div>
              <span className="font-medium">Columns:</span>
              <div className="mt-2 space-y-1">
                {file.columns.map((col, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    <span className="font-medium">{col.name}</span> ({col.data_type})
                    {col.sample_values.length > 0 && (
                      <span className="text-gray-500 ml-2">
                        Sample: {col.sample_values.slice(0, 3).join(', ')}
                        {col.sample_values.length > 3 && '...'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {file.sample_data && file.sample_data.length > 0 && (
            <div>
              <span className="font-medium">Sample Data:</span>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      {file.sample_data[0]?.map((header, index) => (
                        <th key={index} className="px-2 py-1 text-left">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {file.sample_data.slice(1, 6).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-2 py-1 border-t">{cell}</td>
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
    );
  };

  const renderUploadSection = () => (
    <div className={`transition-all duration-300 ${showUploadSection ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3">Upload File</h3>
        
        <div className="space-y-3">
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".csv,.json,.xlsx,.xls,.tsv,.parquet"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          {fileUpload && (
            <div className="text-sm text-gray-600">
              Selected: {fileUpload.name} ({formatFileSize(fileUpload.size)})
            </div>
          )}
          
          <button
            onClick={uploadFile}
            disabled={!fileUpload || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPasteSection = () => (
    <div className={`transition-all duration-300 ${showPasteSection ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3">Paste Data</h3>
        
        <div className="space-y-3">
          <textarea
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            placeholder="Paste your CSV, JSON, or other data here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
          />
          
          <button
            onClick={analyzePastedData}
            disabled={!pastedData.trim() || analyzingPastedData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzingPastedData ? 'Analyzing...' : 'Analyze Data'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderGenerateSection = () => (
    <div className={`transition-all duration-300 ${showGenerateSection ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3">Generate Sample Data</h3>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Generate sample data for testing and development purposes.
          </p>
          
          <button
            onClick={generateData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Generate Sample Data
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalysisCells = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Analysis History</h3>
      
      {dataAnalysisCells.length === 0 ? (
        <div className="text-gray-500">No analysis performed yet.</div>
      ) : (
        dataAnalysisCells.map((cell) => (
          <div key={cell.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">{cell.type_}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                cell.status === 'completed' ? 'bg-green-100 text-green-800' :
                cell.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {cell.status}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              {new Date(cell.timestamp).toLocaleString()}
            </div>
            
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">
                {cell.content}
              </pre>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Data Management</h2>
            <p className="text-gray-600">Upload, analyze, and manage your data files</p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => setShowUploadSection(!showUploadSection)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload File
            </button>
            
            <button
              onClick={() => setShowPasteSection(!showPasteSection)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Paste Data
            </button>
            
            <button
              onClick={() => setShowGenerateSection(!showGenerateSection)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Generate Data
            </button>
          </div>

          {/* Collapsible Sections */}
          {renderUploadSection()}
          {renderPasteSection()}
          {renderGenerateSection()}

          {/* Data Files List */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Data Files</h3>
            {renderFileList()}
            {renderFileMetadata()}
          </div>

          {/* Analysis History */}
          <div>
            {renderAnalysisCells()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTab; 