import React, { useState, useEffect } from 'react';
import { apiService } from '../api';

interface Library {
  name: string;
  version?: string;
  source: string;
  status: string;
  installed_at?: string;
  error_message?: string;
  required_by: string[];
}

interface LibrariesTabProps {
  projectId: string;
}

const LibrariesTab: React.FC<LibrariesTabProps> = ({ projectId }) => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [newLibrary, setNewLibrary] = useState({ name: '', version: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadLibraries();
  }, [projectId]);

  const loadLibraries = async () => {
    try {
      setLoading(true);
      const librariesData = await apiService.getLibraries(projectId);
      setLibraries(librariesData);
    } catch (error) {
      console.error('Failed to load libraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallLibrary = async (libraryName: string) => {
    try {
      setInstalling(libraryName);
      await apiService.installLibrary(projectId, libraryName);
      await loadLibraries(); // Reload to update status
    } catch (error) {
      console.error('Failed to install library:', error);
    } finally {
      setInstalling(null);
    }
  };

  const handleInstallAll = async () => {
    try {
      setInstalling('all');
      await apiService.installAllLibraries(projectId);
      await loadLibraries();
    } catch (error) {
      console.error('Failed to install all libraries:', error);
    } finally {
      setInstalling(null);
    }
  };

  const handleAddLibrary = async () => {
    if (!newLibrary.name.trim()) return;
    
    try {
      const library: Library = {
        name: newLibrary.name.trim(),
        version: newLibrary.version.trim() || undefined,
        source: 'manual',
        status: 'pending',
        installed_at: undefined,
        error_message: undefined,
        required_by: [],
      };
      
      await apiService.addLibrary(projectId, library);
      setNewLibrary({ name: '', version: '' });
      setShowAddForm(false);
      await loadLibraries();
    } catch (error) {
      console.error('Failed to add library:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'installed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'installing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'auto_detected': return 'bg-purple-100 text-purple-800';
      case 'manual': return 'bg-blue-100 text-blue-800';
      case 'requirements': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingLibraries = libraries.filter(l => l.status === 'pending');
  const installedLibraries = libraries.filter(l => l.status === 'installed');
  const failedLibraries = libraries.filter(l => l.status === 'failed');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedar-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Python Libraries</h2>
          <p className="text-gray-600 mt-1">
            Manage Python dependencies for your research project
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Add Library'}
          </button>
          {pendingLibraries.length > 0 && (
            <button
              onClick={handleInstallAll}
              disabled={installing === 'all'}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {installing === 'all' ? 'Installing...' : `Install All (${pendingLibraries.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Add Library Form */}
      {showAddForm && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Library</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Library Name
              </label>
              <input
                type="text"
                value={newLibrary.name}
                onChange={(e) => setNewLibrary({ ...newLibrary, name: e.target.value })}
                placeholder="e.g., pandas, numpy"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-cedar-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version (optional)
              </label>
              <input
                type="text"
                value={newLibrary.version}
                onChange={(e) => setNewLibrary({ ...newLibrary, version: e.target.value })}
                placeholder="e.g., 1.5.0"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-cedar-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleAddLibrary}
              disabled={!newLibrary.name.trim()}
              className="px-4 py-2 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 disabled:opacity-50 transition-colors"
            >
              Add Library
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-600">{libraries.length}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">{pendingLibraries.length}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{installedLibraries.length}</div>
          <div className="text-sm text-gray-600">Installed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{failedLibraries.length}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
      </div>

      {/* Libraries List */}
      <div className="space-y-4">
        {libraries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No libraries yet</h3>
            <p className="text-gray-600 mb-4">
              Libraries will be automatically detected when you run code, or you can add them manually
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 transition-colors"
            >
              Add First Library
            </button>
          </div>
        ) : (
          libraries.map((library) => (
            <div key={library.name} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(library.status)}`}>
                      {library.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(library.source)}`}>
                      {library.source}
                    </span>
                    {library.version && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        v{library.version}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {library.name}
                  </h3>
                  {library.required_by.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Required by: {library.required_by.length} code cell(s)
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {library.status === 'pending' && (
                    <button
                      onClick={() => handleInstallLibrary(library.name)}
                      disabled={installing === library.name}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      {installing === library.name ? 'Installing...' : 'Install'}
                    </button>
                  )}
                  {library.status === 'failed' && (
                    <button
                      onClick={() => handleInstallLibrary(library.name)}
                      disabled={installing === library.name}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {installing === library.name ? 'Retrying...' : 'Retry'}
                    </button>
                  )}
                </div>
              </div>

              {library.status === 'installed' && library.installed_at && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">✓ Successfully installed</span>
                    <span className="text-xs text-green-600">
                      {new Date(library.installed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              {library.status === 'failed' && library.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-800">✗ Installation failed</span>
                  </div>
                  <p className="text-red-700 text-sm">{library.error_message}</p>
                </div>
              )}

              {library.status === 'installing' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm font-medium text-blue-800">Installing...</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Requirements.txt Export */}
      {libraries.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Requirements.txt</h3>
          <div className="bg-gray-50 border rounded-md p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {libraries
                .filter(l => l.status === 'installed')
                .map(l => {
                  if (l.version) {
                    return `${l.name}==${l.version}`;
                  } else {
                    return l.name;
                  }
                })
                .join('\n')}
            </pre>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Copy this content to a requirements.txt file for easy project setup
          </p>
        </div>
      )}
    </div>
  );
};

export default LibrariesTab; 