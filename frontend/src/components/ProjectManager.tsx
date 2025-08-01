import React, { useState, useEffect } from 'react';
import { apiService } from '../api';
import { ResearchInitialization } from './ResearchInitialization';

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
  const [showResearchInit, setShowResearchInit] = useState(false);
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

  const handleResearchComplete = async (title: string, goal: string, answers: Record<string, string>, questions: any[], initialization: any) => {
    try {
      setLoading(true);
      
      // Create the project with the generated title
      const newProject = await apiService.createProject({
        name: title,
        goal: goal,
      }) as Project;
      
      // Convert research initialization answers to questions and save them
      const questionPromises = questions.map(async (questionData) => {
        const answer = answers[questionData.id];
        if (!answer) return;
        
        const question = {
          id: questionData.id,
          question: questionData.question,
          answer: answer,
          category: questionData.category,
          created_at: new Date().toISOString(),
          answered_at: new Date().toISOString(),
          status: 'answered',
          related_to: []
        };
        
        try {
          await apiService.addQuestion(newProject.id, question);
        } catch (error) {
          console.error('Failed to add question:', error);
        }
      });
      
      await Promise.all(questionPromises);
      
      setProjects(prev => [...prev, newProject]);
      setShowResearchInit(false);
      
      // Store the answers and initialization data in the project for later use
      const projectWithAnswers = {
        ...newProject,
        researchAnswers: answers,
        researchInitialization: initialization,
        variables: [],
        questions: [],
        libraries: []
      };
      
      // Auto-select the new project
      onProjectSelect(projectWithAnswers);
      
      // Automatically start research with the answers
      try {
        const sessionId = `session_${newProject.id}`;
        
        const response = await apiService.startResearch({
          projectId: newProject.id,
          sessionId: sessionId,
          goal: goal,
          answers: answers
        });

        const responseData = response as any;
        if (responseData.cells) {
          // Research started successfully - update the project with session info
          const projectWithSession = {
            ...projectWithAnswers,
            session_id: sessionId,
            session_status: 'active'
          };
          
          // Update the project selection with session data
          onProjectSelect(projectWithSession);
        }
      } catch (error) {
        console.error('Failed to auto-start research:', error);
        // Don't fail the project creation, just log the error
      }
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
          onClick={() => setShowResearchInit(true)}
          className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors"
        >
          New Project
        </button>
      </div>

      {showResearchInit && (
        <ResearchInitialization
          onComplete={handleResearchComplete}
          onCancel={() => setShowResearchInit(false)}
        />
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