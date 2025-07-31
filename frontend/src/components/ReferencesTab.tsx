import React, { useState } from 'react';
import { apiService } from '../api';

interface Reference {
  id: string;
  title: string;
  authors: string;
  url?: string;
  content: string;
  added_at: string;
}

interface ReferencesTabProps {
  projectId: string;
  references: Reference[];
  onReferencesUpdate: (references: Reference[]) => void;
}

const ReferencesTab: React.FC<ReferencesTabProps> = ({ projectId, references, onReferencesUpdate }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newReference, setNewReference] = useState({
    title: '',
    authors: '',
    url: '',
    content: '',
  });

  const createReference = async () => {
    if (!newReference.title.trim() || !newReference.authors.trim() || !newReference.content.trim()) {
      alert('Please enter title, authors, and content');
      return;
    }

    try {
      setLoading(true);
      const reference: Reference = {
        id: Date.now().toString(),
        title: newReference.title,
        authors: newReference.authors,
        url: newReference.url || undefined,
        content: newReference.content,
        added_at: new Date().toISOString(),
      };

      await apiService.addReference(projectId, reference);
      
      onReferencesUpdate([...references, reference]);
      setNewReference({ title: '', authors: '', url: '', content: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create reference:', error);
      alert('Failed to create reference');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">References</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors"
        >
          Add Reference
        </button>
      </div>

      {showCreateForm && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-medium mb-4">Add New Reference</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newReference.title}
                onChange={(e) => setNewReference(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
                placeholder="Enter reference title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authors
              </label>
              <input
                type="text"
                value={newReference.authors}
                onChange={(e) => setNewReference(prev => ({ ...prev, authors: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
                placeholder="Enter authors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL (Optional)
              </label>
              <input
                type="url"
                value={newReference.url}
                onChange={(e) => setNewReference(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
                placeholder="Enter URL if available"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content/Summary
              </label>
              <textarea
                value={newReference.content}
                onChange={(e) => setNewReference(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
                placeholder="Enter reference content or summary"
                rows={4}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={createReference}
                disabled={loading}
                className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Add Reference'}
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

      {references.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">No references yet. Add sources and citations to your project!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {references.map((reference) => (
            <div key={reference.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="text-purple-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800">{reference.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Authors:</strong> {reference.authors}
                  </p>
                  {reference.url && (
                    <p className="text-sm text-blue-600 mb-2">
                      <a href={reference.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {reference.url}
                      </a>
                    </p>
                  )}
                  <p className="text-sm text-gray-700 mb-2">{reference.content}</p>
                  <p className="text-xs text-gray-500">Added: {formatDate(reference.added_at)}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600 ml-2">
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

export default ReferencesTab; 