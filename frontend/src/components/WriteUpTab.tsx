import React, { useState, useEffect } from 'react';
import { apiService } from '../api';

interface WriteUpTabProps {
  projectId: string;
  writeUp: string;
  onWriteUpUpdate: (writeUp: string) => void;
}

export const WriteUpTab: React.FC<WriteUpTabProps> = ({ projectId, writeUp, onWriteUpUpdate }) => {
  const [content, setContent] = useState(writeUp);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    setContent(writeUp);
  }, [writeUp]);

  const saveWriteUp = async () => {
    try {
      setLoading(true);
      await apiService.saveFile({
        project_id: projectId,
        filename: 'write_up.md',
        content: content,
        file_type: 'write_up',
      });
      
      onWriteUpUpdate(content);
      setLastSaved(new Date());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save write-up:', error);
      alert('Failed to save write-up');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    return lastSaved.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Research Write-Up</h3>
        <div className="flex items-center space-x-2">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {formatLastSaved()}
            </span>
          )}
          {isEditing ? (
            <div className="flex space-x-2">
              <button
                onClick={saveWriteUp}
                disabled={loading}
                className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setContent(writeUp);
                  setIsEditing(false);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        {isEditing ? (
          <div className="p-4">
            <textarea
              value={content}
              onChange={handleContentChange}
              className="w-full h-96 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500 font-mono text-sm resize-none"
              placeholder="Write your research findings, analysis, and conclusions here..."
            />
            <div className="mt-2 text-xs text-gray-500">
              <p>💡 Tip: Use Markdown formatting for better organization</p>
              <p>📝 You can use headers (# ## ###), lists (- *), bold (**text**), italic (*text*), and links</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {content ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 bg-gray-50 p-4 rounded-md">
                  {content}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">No write-up content yet.</p>
                <p className="text-sm text-gray-500">Click "Edit" to start writing your research findings and conclusions.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-500 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-800">Writing Tips</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Start with an introduction and research question</li>
                <li>• Include your methodology and data analysis</li>
                <li>• Present your findings with supporting evidence</li>
                <li>• Discuss implications and conclusions</li>
                <li>• Reference your sources and data files</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 