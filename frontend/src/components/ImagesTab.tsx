import React, { useState } from 'react';
import { apiService } from '../api';

interface ImagesTabProps {
  projectId: string;
  images: string[];
  onImagesUpdate: (images: string[]) => void;
}

export const ImagesTab: React.FC<ImagesTabProps> = ({ projectId, images, onImagesUpdate }) => {
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
      await apiService.saveFile({
        project_id: projectId,
        filename: newImageName,
        content: newImageData,
        file_type: 'image',
      });
      
      onImagesUpdate([...images, newImageName]);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Charts & Images</h3>
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
          <p className="text-gray-600">No images yet. Add charts and visualizations to your project!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {images.map((imageName, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="text-green-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-800 text-sm">{imageName}</h4>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-100 rounded-md p-3 text-center">
                <div className="text-gray-400">
                  <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mt-2">Image Preview</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 