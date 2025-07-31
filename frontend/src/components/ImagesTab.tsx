import React, { useState } from 'react';
import { apiService } from '../api';

interface Visualization {
  name: string;
  type: string;
  description: string;
  filename: string;
  content: string;
  code: string;
  timestamp: string;
}

interface ImagesTabProps {
  projectId: string;
  images: Visualization[];
  onImagesUpdate: (images: Visualization[]) => void;
}

const ImagesTab: React.FC<ImagesTabProps> = ({ projectId, images, onImagesUpdate }) => {
  const [newImageName, setNewImageName] = useState('');
  const [newImageData, setNewImageData] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const createImage = async () => {
    if (!newImageName.trim() || !newImageData.trim()) {
      alert('Please enter both image name and data');
      return;
    }

    try {
      setLoading(true);
      const newVisualization: Visualization = {
        name: newImageName,
        type: 'manual',
        description: 'Manually added image',
        filename: newImageName,
        content: newImageData,
        code: '',
        timestamp: new Date().toISOString()
      };
      
      await apiService.saveFile({
        project_id: projectId,
        filename: newImageName,
        content: newImageData,
        file_type: 'image',
      });
      
      onImagesUpdate([...images, newVisualization]);
      setNewImageName('');
      setNewImageData('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create image:', error);
      alert('Failed to create image');
    } finally {
      setLoading(false);
    }
  };

  const getVisualizationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'chart':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'table':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
          </svg>
        );
      case 'graph':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'chart':
        return 'text-blue-500';
      case 'table':
        return 'text-green-500';
      case 'graph':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Charts & Visualizations</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors"
        >
          Add Image
        </button>
      </div>

      {showCreateForm && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-medium mb-4">Add New Image</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Name
              </label>
              <input
                type="text"
                value={newImageName}
                onChange={(e) => setNewImageName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
                placeholder="e.g., chart_1.png"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Data (Base64 or URL)
              </label>
              <textarea
                value={newImageData}
                onChange={(e) => setNewImageData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500 font-mono text-sm"
                placeholder="Paste image data or URL here..."
                rows={4}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={createImage}
                disabled={loading}
                className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Add Image'}
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

      {images.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600">No visualizations yet. Start research to automatically generate charts and tables!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {images.map((visualization, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={getTypeColor(visualization.type)}>
                      {getVisualizationIcon(visualization.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm">{visualization.name}</h4>
                      <p className="text-xs text-gray-500 capitalize">{visualization.type}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatTimestamp(visualization.timestamp)}</span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{visualization.description}</p>
                
                <div className="bg-gray-50 rounded-md p-3 mb-3">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 text-center">Visualization Preview</p>
                </div>
                
                {visualization.code && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-2">
                      View Code
                    </summary>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      <code>{visualization.code}</code>
                    </pre>
                  </details>
                )}
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{visualization.filename}</span>
                  <button className="text-xs text-cedar-600 hover:text-cedar-700">
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagesTab; 