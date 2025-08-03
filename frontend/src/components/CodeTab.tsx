import React, { useState, useEffect } from 'react';
import { Code, Package, Variable, Plus, Download, FileText, Play } from 'lucide-react';
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

interface VariableInfo {
  name: string;
  type_name: string;
  shape?: string;
  purpose: string;
  example_value: string;
  source: string;
  updated_at: string;
  related_to: string[];
  visibility: string;
  units?: string;
  tags: string[];
}

interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
  description: string;
  created_at: string;
  dependencies: string[];
  requirements_txt?: string;
}

interface CodeTabProps {
  projectId: string;
}

const CodeTab: React.FC<CodeTabProps> = ({ projectId }) => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [variables, setVariables] = useState<VariableInfo[]>([]);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [_loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [showNewCodeForm, setShowNewCodeForm] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [newCodeRequest, setNewCodeRequest] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'libraries' | 'variables'>('code');

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [librariesData, variablesData] = await Promise.all([
        apiService.getLibraries(projectId),
        apiService.getVariables(projectId)
      ]);
      setLibraries(librariesData as Library[]);
      setVariables(variablesData as VariableInfo[]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewCode = async () => {
    if (!newCodeRequest.trim()) {
      alert('Please describe what code you want to generate');
      return;
    }

    try {
      setGeneratingCode(true);
      
      // Create context from existing libraries and variables
      const context = `
Project Context:
- Libraries: ${libraries.map(lib => lib.name).join(', ')}
- Variables: ${variables.map(v => `${v.name} (${v.type_name})`).join(', ')}

User Request: ${newCodeRequest}

Generate Python code that:
1. Uses appropriate libraries from the project
2. Works with existing variables if relevant
3. Includes proper imports and documentation
4. Has a clear filename and description
5. Lists all required dependencies

Return a JSON response with:
{
  "filename": "descriptive_filename.py",
  "content": "complete Python code",
  "description": "what this code does",
  "dependencies": ["library1", "library2"],
  "requirements_txt": "library1==1.0.0\\nlibrary2==2.0.0"
}`;

      const response = await apiService.callLLM({
        prompt: context,
        context: `Code generation for project: ${projectId}`,
        userComment: `Generate code for: ${newCodeRequest}`
      });

      const responseText = (response as any).response || JSON.stringify(response);
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const codeData = JSON.parse(jsonMatch[0]);
          
          const newCodeFile: CodeFile = {
            id: Date.now().toString(),
            name: codeData.filename || 'generated_code.py',
            content: codeData.content || responseText,
            language: 'python',
            description: codeData.description || 'Generated code',
            created_at: new Date().toISOString(),
            dependencies: codeData.dependencies || [],
            requirements_txt: codeData.requirements_txt || ''
          };

          setCodeFiles(prev => [...prev, newCodeFile]);
          
          // Install dependencies if requirements.txt is provided
          if (codeData.requirements_txt) {
            await installDependencies(codeData.requirements_txt);
          }
          
          setNewCodeRequest('');
          setShowNewCodeForm(false);
          alert('Code generated successfully!');
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse code generation response:', parseError);
        // Create a fallback code file
        const fallbackFile: CodeFile = {
          id: Date.now().toString(),
          name: 'generated_code.py',
          content: responseText,
          language: 'python',
          description: 'Generated code (raw response)',
          created_at: new Date().toISOString(),
          dependencies: [],
          requirements_txt: ''
        };
        setCodeFiles(prev => [...prev, fallbackFile]);
        setNewCodeRequest('');
        setShowNewCodeForm(false);
        alert('Code generated (raw response). Please review and edit as needed.');
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
      alert('Failed to generate code. Please try again.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const installDependencies = async (requirementsTxt: string) => {
    try {
      const lines = requirementsTxt.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const libraryName = line.split('==')[0].split('>=')[0].split('<=')[0].trim();
        if (libraryName) {
          await apiService.installLibrary(projectId, libraryName);
        }
      }
      await loadData(); // Reload libraries
    } catch (error) {
      console.error('Failed to install dependencies:', error);
    }
  };

  const handleInstallLibrary = async (libraryName: string) => {
    try {
      setInstalling(libraryName);
      await apiService.installLibrary(projectId, libraryName);
      await loadData();
    } catch (error) {
      console.error('Failed to install library:', error);
    } finally {
      setInstalling(null);
    }
  };

  const handleInstallAll = async () => {
    try {
      setInstalling('all');
      for (const library of libraries) {
        await apiService.installLibrary(projectId, library.name);
      }
      await loadData();
    } catch (error) {
      console.error('Failed to install all libraries:', error);
    } finally {
      setInstalling(null);
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

  const getTypeColor = (typeName: string) => {
    const colors: { [key: string]: string } = {
      'pd.DataFrame': 'bg-blue-100 text-blue-800',
      'numpy.ndarray': 'bg-green-100 text-green-800',
      'list': 'bg-purple-100 text-purple-800',
      'dict': 'bg-yellow-100 text-yellow-800',
      'str': 'bg-gray-100 text-gray-800',
      'int': 'bg-red-100 text-red-800',
      'float': 'bg-orange-100 text-orange-800'
    };
    return colors[typeName] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Code Management</h3>
        <button
          onClick={() => setShowNewCodeForm(true)}
          className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Code</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'code' 
              ? 'bg-white text-cedar-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Code className="w-4 h-4" />
            <span>Code Files</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('libraries')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'libraries' 
              ? 'bg-white text-cedar-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Libraries</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('variables')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'variables' 
              ? 'bg-white text-cedar-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Variable className="w-4 h-4" />
            <span>Variables</span>
          </div>
        </button>
      </div>

      {/* New Code Generation Form */}
      {showNewCodeForm && (
        <div className="p-4 bg-blue-50 rounded-lg mb-6">
          <h4 className="text-lg font-medium mb-4 flex items-center space-x-2">
            <Code className="w-5 h-5 text-blue-600" />
            <span>Generate New Code</span>
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What code would you like me to write?
              </label>
              <textarea
                value={newCodeRequest}
                onChange={(e) => setNewCodeRequest(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the code you need (e.g., 'Create a function to analyze sales data', 'Write a script to clean and process CSV files')"
                rows={4}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={generateNewCode}
                disabled={generatingCode || !newCodeRequest.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{generatingCode ? 'Generating...' : 'Generate Code'}</span>
              </button>
              <button
                onClick={() => {
                  setShowNewCodeForm(false);
                  setNewCodeRequest('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'code' && (
          <div className="space-y-4">
            {codeFiles.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <Code className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-600">No code files yet. Generate new code to get started!</p>
              </div>
            ) : (
              codeFiles.map((file) => (
                <div key={file.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-800">{file.name}</h4>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(file.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{file.description}</p>
                  {file.dependencies.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Dependencies:</p>
                      <div className="flex flex-wrap gap-1">
                        {file.dependencies.map((dep, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-gray-50 p-3 rounded border">
                    <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
                      {file.content}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'libraries' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium">Python Libraries</h4>
              {libraries.length > 0 && (
                <button
                  onClick={handleInstallAll}
                  disabled={installing === 'all'}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>{installing === 'all' ? 'Installing...' : 'Install All'}</span>
                </button>
              )}
            </div>

            {libraries.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <Package className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-600">No libraries yet. Generate code to automatically add dependencies!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {libraries.map((library) => (
                  <div key={library.name} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{library.name}</span>
                          {library.version && (
                            <span className="text-sm text-gray-500">v{library.version}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(library.status)}`}>
                            {library.status}
                          </span>
                          {library.installed_at && (
                            <span className="text-xs text-gray-500">
                              Installed: {formatDate(library.installed_at)}
                            </span>
                          )}
                        </div>
                        {library.error_message && (
                          <p className="text-xs text-red-600 mt-1">{library.error_message}</p>
                        )}
                      </div>
                      {library.status === 'pending' && (
                        <button
                          onClick={() => handleInstallLibrary(library.name)}
                          disabled={installing === library.name}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          {installing === library.name ? 'Installing...' : 'Install'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Data Variables</h4>
            
            {variables.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <Variable className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-600">No variables yet. Variables will appear here as you work with data!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {variables.map((variable) => (
                  <div key={variable.name} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Variable className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{variable.name}</span>
                          <span className={`px-2 py-1 rounded text-xs ${getTypeColor(variable.type_name)}`}>
                            {variable.type_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{variable.purpose}</p>
                        {variable.shape && (
                          <p className="text-xs text-gray-500">Shape: {variable.shape}</p>
                        )}
                        <p className="text-xs text-gray-500">Updated: {formatDate(variable.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeTab; 