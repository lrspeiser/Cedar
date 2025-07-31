import React, { useState } from 'react';
import { apiService } from '../api';

interface DataTabProps {
  projectId: string;
  dataFiles: string[];
  onDataFilesUpdate: (files: string[]) => void;
}

const DataTab: React.FC<DataTabProps> = ({ projectId, dataFiles, onDataFilesUpdate }) => {
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      console.error('Failed to create data file:', error);
      alert('Failed to create data file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Data Files</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors"
        >
          Add Data File
        </button>
      </div>

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
                className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create File'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {dataFiles.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600">No data files yet. Add your first data file to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {dataFiles.map((filename, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{filename}</h4>
                    <p className="text-sm text-gray-500">Data file</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataTab; 