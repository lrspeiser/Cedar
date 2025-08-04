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
  variables: any[];
  questions: any[];
  libraries: any[];
  session_id?: string;
  session_status?: string;
  researchAnswers?: Record<string, string>;
  researchInitialization?: any;
}

interface ProjectManagerProps {
  onProjectSelect: (project: Project) => void;
  currentProject: Project | null;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ onProjectSelect, currentProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

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

  const handleCreateNewProject = async () => {
    try {
      setLoading(true);
      
      // Create a placeholder project immediately
      const placeholderProject = await apiService.createProject({
        name: "Untitled Project",
        goal: ""
      }) as Project;
      
      // Auto-select the new project
      onProjectSelect(placeholderProject);
      
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

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    // Show the confirmation dialog
    setProjectToDelete({ id: projectId, name: projectName });
    setShowDeleteConfirm(true);
    setDeleteConfirmation('');
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      setDeletingProject(projectToDelete.id);
      await apiService.deleteProject(projectToDelete.id);
      
      // Remove the project from the list
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      
      // If the deleted project was the current project, clear it
      if (currentProject?.id === projectToDelete.id) {
        onProjectSelect(null as any);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    } finally {
      setDeletingProject(null);
      setShowDeleteConfirm(false);
      setDeleteConfirmation('');
      setProjectToDelete(null);
    }
  };

  const cancelDeleteProject = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmation('');
    setProjectToDelete(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Research Projects</h2>
        <button
          onClick={handleCreateNewProject}
          disabled={loading}
          className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'New Project'}
        </button>
      </div>



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
              className={`p-4 border rounded-lg transition-colors ${
                currentProject?.id === project.id
                  ? 'border-cedar-500 bg-cedar-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onProjectSelect(project)}
                >
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
                <div className="flex items-center space-x-2 ml-4">
                  {currentProject?.id === project.id && (
                    <div className="text-cedar-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id, project.name);
                    }}
                    disabled={deletingProject === project.id}
                    className="text-red-600 hover:text-red-800 text-sm underline transition-colors disabled:opacity-50"
                  >
                    {deletingProject === project.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                onClick={confirmDeleteProject}
                disabled={deletingProject === projectToDelete?.id || deleteConfirmation !== 'DELETE'}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingProject === projectToDelete?.id ? 'Deleting...' : 'Delete Project'}
              </button>
              <button
                onClick={cancelDeleteProject}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 