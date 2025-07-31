import React, { useState, useEffect } from 'react';
import { apiService } from './api';
import { ProjectManager } from './components/ProjectManager';
import { ProjectView } from './components/ProjectView';

interface Project {
  id: string;
  name: string;
  goal: string;
  created_at: string;
  updated_at: string;
  data_files: string[];
  images: string[];
  references: any[];
  write_up: string;
}

function App() {
  const [apiKeySet, setApiKeySet] = useState<boolean>(false);
  const [showApiKeySetup, setShowApiKeySetup] = useState<boolean>(true);
  const [apiKey, setApiKey] = useState<string>('');
  const [isSettingApiKey, setIsSettingApiKey] = useState<boolean>(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    console.log('🚀 App starting up, checking API key status...');
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      console.log('🔍 Checking API key status on app startup...');
      const hasApiKey = await apiService.getApiKeyStatus();
      console.log('✅ API key status check result:', hasApiKey ? 'API key found' : 'No API key found');
      setApiKeySet(hasApiKey);
      setShowApiKeySetup(!hasApiKey);
      console.log('📋 No API key found, showing setup screen');
    } catch (error) {
      console.error('❌ Error checking API key status:', error);
      setApiKeySet(false);
      setShowApiKeySetup(true);
    }
  };

  const handleSetApiKey = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key');
      return;
    }

    try {
      console.log('🚀 Starting API key submission...', { apiKeyLength: apiKey.length, apiKeyPrefix: apiKey.substring(0, 10) + "...", isSettingApiKey });
      setIsSettingApiKey(true);
      console.log('📞 Calling apiService.setApiKey...');
      await apiService.setApiKey(apiKey);
      setApiKeySet(true);
      setShowApiKeySetup(false);
      setApiKey('');
      console.log('✅ API key submitted successfully');
    } catch (error) {
      console.error('❌ Error setting API key:', error);
      console.error('❌ Error details:', { errorMessage: error, errorType: typeof error, errorStack: (error as Error).stack });
      alert(`Failed to set API key: ${error}`);
      console.log('❌ Screen transition: API key setup remains visible due to error');
    } finally {
      setIsSettingApiKey(false);
      console.log('🏁 API key submission process completed');
    }
  };

  const handleProjectSelect = (project: Project) => {
    setCurrentProject(project);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setCurrentProject(updatedProject);
  };

  const handleBackToProjects = () => {
    setCurrentProject(null);
  };

  // API Key Setup Screen
  if (showApiKeySetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Set up your OpenAI API key to get started
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                OpenAI API Key
              </label>
              <input
                id="api-key"
                name="api-key"
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    console.log('🔘 Enter key pressed, submitting API key...');
                    handleSetApiKey();
                  }
                }}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cedar-500 focus:border-cedar-500 focus:z-10 sm:text-sm"
                placeholder="sk-..."
                autoFocus
              />
            </div>
            <div>
              <button
                onClick={() => {
                  console.log('🔘 Button clicked!', { apiKey: apiKey.substring(0, 10) + "...", isSettingApiKey });
                  handleSetApiKey();
                }}
                disabled={isSettingApiKey}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cedar-500 hover:bg-cedar-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cedar-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSettingApiKey ? 'Setting API Key...' : 'Submit API Key'}
              </button>
            </div>
            <div className="text-center">
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cedar-600 hover:text-cedar-500"
              >
                Get your API key from OpenAI Platform
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App Interface
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">Cedar</h1>
              {currentProject && (
                <button
                  onClick={handleBackToProjects}
                  className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Projects</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>API Key: {apiKeySet ? 'Set' : 'Not Set'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentProject ? (
          <ProjectView
            project={currentProject}
            onBack={handleBackToProjects}
          />
        ) : (
          <div className="h-full p-6">
            <ProjectManager
              onProjectSelect={handleProjectSelect}
              currentProject={currentProject}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
