import React, { useState } from 'react';
import { ResearchSession } from './ResearchSession';
import { DataTab } from './DataTab';
import { ImagesTab } from './ImagesTab';
import { ReferencesTab } from './ReferencesTab';
import { WriteUpTab } from './WriteUpTab';

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

interface ProjectViewProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

type TabType = 'notebook' | 'data' | 'images' | 'references' | 'write-up';

export const ProjectView: React.FC<ProjectViewProps> = ({ project, onProjectUpdate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');
  const [sessionId, setSessionId] = useState<string>(`session_${Date.now()}`);

  const tabs = [
    { id: 'notebook', label: 'Notebook', icon: '📓' },
    { id: 'data', label: 'Data', icon: '📊' },
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'references', label: 'References', icon: '📚' },
    { id: 'write-up', label: 'Write-Up', icon: '✍️' },
  ];

  const handleDataFilesUpdate = (dataFiles: string[]) => {
    onProjectUpdate({
      ...project,
      data_files: dataFiles,
    });
  };

  const handleImagesUpdate = (images: string[]) => {
    onProjectUpdate({
      ...project,
      images: images,
    });
  };

  const handleReferencesUpdate = (references: any[]) => {
    onProjectUpdate({
      ...project,
      references: references,
    });
  };

  const handleWriteUpUpdate = (writeUp: string) => {
    onProjectUpdate({
      ...project,
      write_up: writeUp,
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notebook':
        return (
          <ResearchSession
            sessionId={sessionId}
            projectId={project.id}
            goal={project.goal}
          />
        );
      case 'data':
        return (
          <DataTab
            projectId={project.id}
            dataFiles={project.data_files}
            onDataFilesUpdate={handleDataFilesUpdate}
          />
        );
      case 'images':
        return (
          <ImagesTab
            projectId={project.id}
            images={project.images}
            onImagesUpdate={handleImagesUpdate}
          />
        );
      case 'references':
        return (
          <ReferencesTab
            projectId={project.id}
            references={project.references}
            onReferencesUpdate={handleReferencesUpdate}
          />
        );
      case 'write-up':
        return (
          <WriteUpTab
            projectId={project.id}
            writeUp={project.write_up}
            onWriteUpUpdate={handleWriteUpUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.goal}</p>
          </div>
          <div className="text-sm text-gray-500">
            <p>Created: {new Date(project.created_at).toLocaleDateString()}</p>
            <p>Updated: {new Date(project.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-cedar-500 text-cedar-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}; 