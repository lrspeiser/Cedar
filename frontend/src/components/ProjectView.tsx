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
}

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
}

type TabType = 'notebook' | 'questions' | 'libraries' | 'data' | 'images' | 'references' | 'variables' | 'write-up';

const ProjectView: React.FC<ProjectViewProps> = ({ project, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');
  const [projectData, setProjectData] = useState<Project>(project);

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

  const refreshProjectData = async () => {
    try {
      const updatedProject = await apiService.getProject(project.id);
      setProjectData(updatedProject);
    } catch (error) {
      console.error('Failed to refresh project data:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notebook':
        return (
          <ResearchSession
            sessionId={`session_${Date.now()}`}
            projectId={project.id}
            goal={project.goal}
            onContentGenerated={refreshProjectData}
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
            onUpdate={refreshProjectData}
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
            onUpdate={refreshProjectData}
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
            onUpdate={refreshProjectData}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600">{project.goal}</p>
            </div>
          </div>
          <button
            onClick={refreshProjectData}
            className="px-3 py-2 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

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
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ProjectView; 