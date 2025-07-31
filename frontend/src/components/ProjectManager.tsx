import React, { useState, useEffect } from 'react';
import { apiService } from '../api';

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

interface ProjectManagerProps {
  onProjectSelect: (project: Project) => void;
  currentProject: Project | null;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ onProjectSelect, currentProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectGoal, setNewProjectGoal] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await apiService.getProjects();
      setProjects(projectsData as Project[]);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim() || !newProjectGoal.trim()) {
      alert('Please enter both project name and goal');
      return;
    }

    try {
      setLoading(true);
      const newProject = await apiService.createProject({
        name: newProjectName,
        goal: newProjectGoal,
      });
      
      setProjects(prev => [...prev, newProject as Project]);
      setNewProjectName('');
      setNewProjectGoal('');
      setShowCreateForm(false);
      
      // Auto-select the new project
      onProjectSelect(newProject as Project);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Research Projects</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors"
        >
          New Project
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Research Goal
              </label>
              <textarea
                value={newProjectGoal}
                onChange={(e) => setNewProjectGoal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
                placeholder="Describe your research goal"
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={createProject}
                disabled={loading}
                className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Project'}
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

      {loading && projects.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedar-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No projects yet. Create your first research project!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectSelect(project)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                currentProject?.id === project.id
                  ? 'border-cedar-500 bg-cedar-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{project.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{project.goal}</p>
                  <div className="flex space-x-4 text-xs text-gray-500">
                    <span>Created: {formatDate(project.created_at)}</span>
                    <span>Updated: {formatDate(project.updated_at)}</span>
                    <span>{project.data_files.length} data files</span>
                    <span>{project.images.length} images</span>
                    <span>{project.references.length} references</span>
                  </div>
                </div>
                {currentProject?.id === project.id && (
                  <div className="text-cedar-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 