import React, { useState, useEffect } from 'react';
import { apiService } from '../api';
import ResearchSession from './ResearchSession';
import DataTab from './DataTab';
import ImagesTab from './ImagesTab';
import ReferencesTab from './ReferencesTab';
import VariablesTab from './VariablesTab';
import QuestionsTab from './QuestionsTab';
import LibrariesTab from './LibrariesTab';
import WriteUpTab from './WriteUpTab';

interface Visualization {
  name: string;
  type: string;
  description: string;
  filename: string;
  content: string;
  code: string;
  timestamp: string;
}

interface Project {
  id: string;
  name: string;
  goal: string;
  created_at: string;
  data_files: string[];
  images: Visualization[];
  references: any[];
  variables: any[];
  questions: any[];
  libraries: any[];
  write_up: string;
  researchAnswers?: Record<string, string>;
  session_id?: string;
  session_status?: string;
}

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
}

type TabType = 'notebook' | 'questions' | 'libraries' | 'data' | 'images' | 'references' | 'variables' | 'write-up';

const ProjectView: React.FC<ProjectViewProps> = ({ project, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');
  const [projectData, setProjectData] = useState<Project>(project);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [researchAnswers] = useState<Record<string, string> | undefined>(project.researchAnswers);
  const [researchGoal, setResearchGoal] = useState(project.goal || '');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [showGoalInput, setShowGoalInput] = useState(!project.goal);

  // Auto-switch to notebook tab if project has an active session
  useEffect(() => {
    if (project.session_id && project.session_status === 'active') {
      setActiveTab('notebook');
    }
  }, [project.session_id, project.session_status]);

  // Auto-start research if project has answers but no active session
  useEffect(() => {
    const autoStartResearch = async () => {
      if (project.researchAnswers && Object.keys(project.researchAnswers).length > 0 && 
          (!project.session_id || project.session_status !== 'active')) {
        try {
          const sessionId = `session_${project.id}`;
          
          const response = await apiService.startResearch({
            projectId: project.id,
            sessionId: sessionId,
            goal: project.goal,
            answers: project.researchAnswers
          });

          const responseData = response as any;
          if (responseData.cells) {
            // Research started successfully - update the project data
            setProjectData(prev => ({
              ...prev,
              session_id: sessionId,
              session_status: 'active'
            }));
          }
        } catch (error) {
          console.error('Failed to auto-start research:', error);
        }
      }
    };

    autoStartResearch();
  }, [project.id, project.goal, project.researchAnswers, project.session_id, project.session_status]);

  const tabs = [
    { id: 'notebook', label: 'Notebook', icon: '📓' },
    { id: 'questions', label: 'Questions', icon: '❓' },
    { id: 'libraries', label: 'Libraries', icon: '📦' },
    { id: 'data', label: 'Data', icon: '📊' },
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'references', label: 'References', icon: '📚' },
    { id: 'variables', label: 'Variables', icon: '📊' },
    { id: 'write-up', label: 'Write-Up', icon: '✍️' },
  ];

  const generateProjectTitle = async (goal: string): Promise<string> => {
    try {
      // Use the existing initialize_research command to get a title
      const response = await apiService.initializeResearch({
        goal: goal
      }) as any;
      return response.title || 'Research Project';
    } catch (error) {
      console.error('Error generating title:', error);
      return 'Research Project';
    }
  };

  const handleResearchGoalSubmit = async () => {
    if (!researchGoal.trim()) return;
    
    setIsGeneratingTitle(true);
    
    try {
      // Generate project title
      const title = await generateProjectTitle(researchGoal);
      
      // Update project with goal and title
      const updatedProject = await apiService.updateProject(project.id, {
        name: title,
        goal: researchGoal
      }) as Project;
      
      // Update local state
      setProjectData(updatedProject);
      setShowGoalInput(false);
      
      // Start research session
      const sessionId = `session_${project.id}`;
      
      const response = await apiService.startResearch({
        projectId: project.id,
        sessionId: sessionId,
        goal: researchGoal,
        answers: {}
      });

      // Update project with session info
      const finalProject = {
        ...updatedProject,
        session_id: sessionId,
        session_status: 'active'
      };
      
      setProjectData(finalProject);
      
    } catch (error) {
      console.error('Failed to start research:', error);
      alert('Failed to start research. Please try again.');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const refreshProjectData = async () => {
    try {
      const updatedProject = await apiService.getProject(project.id);
      setProjectData(updatedProject as Project);
    } catch (error) {
      console.error('Failed to refresh project data:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type "DELETE" to confirm deletion');
      return;
    }

    try {
      setIsDeleting(true);
      await apiService.deleteProject(project.id);
      alert('Project deleted successfully');
      onBack(); // Go back to project list
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project: ' + error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmation('');
    }
  };

  const renderTabContent = () => {
    // Generate a persistent session ID based on project ID
    const persistentSessionId = project.session_id || `session_${project.id}`;
    
    switch (activeTab) {
      case 'notebook':
        return (
          <ResearchSession
            sessionId={persistentSessionId}
            projectId={project.id}
            goal={project.goal}
            answers={researchAnswers}
            onContentGenerated={refreshProjectData}
            onDataRouted={(result) => {
              console.log('Data routed:', result);
              // Refresh project data to show updated tabs
              if (result.success) {
                refreshProjectData();
              }
            }}
          />
        );
      case 'questions':
        return (
          <QuestionsTab
            projectId={project.id}
          />
        );
      case 'libraries':
        return (
          <LibrariesTab
            projectId={project.id}
          />
        );
      case 'data':
        return (
          <DataTab
            projectId={project.id}
            dataFiles={projectData.data_files}
            onDataFilesUpdate={(files) => console.log('Data files updated:', files)}
          />
        );
      case 'images':
        return (
          <ImagesTab
            projectId={project.id}
            images={projectData.images}
            onImagesUpdate={refreshProjectData}
          />
        );
      case 'references':
        return (
          <ReferencesTab
            projectId={project.id}
            references={projectData.references}
            onReferencesUpdate={(references) => console.log('References updated:', references)}
          />
        );
      case 'variables':
        return (
          <VariablesTab
            projectId={project.id}
          />
        );
      case 'write-up':
        return (
          <WriteUpTab
            projectId={project.id}
            writeUp={projectData.write_up}
            onWriteUpUpdate={(writeUp) => console.log('Write up updated:', writeUp)}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Projects
            </button>
            <div className="flex-1 mx-8">
              {showGoalInput ? (
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={researchGoal}
                      onChange={(e) => setResearchGoal(e.target.value)}
                      placeholder="What would you like to research?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-cedar-500 focus:border-cedar-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleResearchGoalSubmit();
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={handleResearchGoalSubmit}
                    disabled={!researchGoal.trim() || isGeneratingTitle}
                    className="bg-cedar-500 text-white px-6 py-2 rounded-md hover:bg-cedar-600 disabled:opacity-50"
                  >
                    {isGeneratingTitle ? 'Creating Name...' : 'Start Research'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isGeneratingTitle ? 'Creating Name...' : projectData.name}
                  </h1>
                  {projectData.goal && (
                    <p className="text-gray-600">{projectData.goal}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshProjectData}
              className="px-3 py-2 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 transition-colors flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>Delete Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Project
            </h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. All project data, files, and research will be permanently deleted.
            </p>
            <p className="text-gray-600 mb-4">
              Type <strong>"DELETE"</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              placeholder="Type DELETE to confirm"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Project'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-1 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-cedar-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ProjectView; 