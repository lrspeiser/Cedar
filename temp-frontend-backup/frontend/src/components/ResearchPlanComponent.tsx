import React, { useState } from 'react';
import { Play, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { apiService } from '../api';

interface ResearchPlanStep {
  id: string;
  title: string;
  description: string;
  code?: string;
  status: string; // "pending", "ready", "executing", "completed", "failed"
  order: number;
}

interface ResearchPlan {
  id: string;
  title: string;
  description: string;
  steps: ResearchPlanStep[];
  created_at: string;
  status: string;
}

interface ResearchPlanComponentProps {
  plan: ResearchPlan;
  sessionId: string;
  projectId: string;
  goal: string;
  onStepCompleted?: (stepId: string, result: any) => void;
  onNextStepsGenerated?: (nextSteps: ResearchPlanStep[]) => void;
}

const ResearchPlanComponent: React.FC<ResearchPlanComponentProps> = ({
  plan,
  sessionId,
  projectId,
  goal,
  onStepCompleted,
  onNextStepsGenerated
}) => {
  const [executingSteps, setExecutingSteps] = useState<Set<string>>(new Set());
  const [stepResults, setStepResults] = useState<Record<string, any>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const handleExecuteStep = async (step: ResearchPlanStep) => {
    if (!step.code) {
      console.warn('Step has no code to execute:', step.id);
      return;
    }

    setExecutingSteps(prev => new Set(prev).add(step.id));

    try {
      console.log(`🔧 Executing step: ${step.id} - ${step.title}`);
      
      const result = await apiService.executeStep({
        sessionId,
        projectId,
        stepId: step.id,
        code: step.code,
        stepTitle: step.title,
        stepDescription: step.description
      });

      console.log(`✅ Step completed: ${step.id}`, result);
      
      // Store the result
      setStepResults(prev => ({
        ...prev,
        [step.id]: result
      }));
      
      // Mark as completed
      setCompletedSteps(prev => new Set(prev).add(step.id));
      
      // Notify parent component
      if (onStepCompleted) {
        onStepCompleted(step.id, result);
      }

      // Check if this was the last step and generate next steps
      const allSteps = plan.steps.map(s => s.id);
      const completedStepIds = Array.from(completedSteps).concat([step.id]);
      
      if (completedStepIds.length === allSteps.length) {
        await generateNextSteps(completedStepIds);
      }

    } catch (error) {
      console.error(`❌ Step execution failed: ${step.id}`, error);
      
      // Store error result
      setStepResults(prev => ({
        ...prev,
        [step.id]: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setExecutingSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(step.id);
        return newSet;
      });
    }
  };

  const generateNextSteps = async (completedStepIds: string[]) => {
    try {
      console.log('🔄 Generating next steps based on completed work');
      
      // Get project context
      const project = await apiService.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Get variables, libraries, etc.
      const variables = await apiService.getVariables(projectId);
      const libraries = await apiService.getLibraries(projectId);
      
      const projectContext = {
        variables,
        libraries,
        data_files: (project as any).data_files || [],
        images: (project as any).images || [],
        references: (project as any).references || [],
        questions: (project as any).questions || [],
        write_up: (project as any).write_up || '',
        project_goal: (project as any).goal
      };

      // Get completed step results
      const completedStepsData = completedStepIds.map(stepId => stepResults[stepId]).filter(Boolean);
      
      // Get current results (latest step result)
      const currentResults = completedStepsData.length > 0 
        ? completedStepsData[completedStepsData.length - 1] 
        : {};

      const nextSteps = await apiService.generateNextSteps({
        goal,
        completedSteps: completedStepsData,
        currentResults,
        projectContext
      });

      console.log('✅ Next steps generated:', nextSteps);
      
      if (onNextStepsGenerated) {
        onNextStepsGenerated(nextSteps as ResearchPlanStep[]);
      }

    } catch (error) {
      console.error('❌ Failed to generate next steps:', error);
    }
  };

  const getStepStatusIcon = (step: ResearchPlanStep) => {
    if (executingSteps.has(step.id)) {
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    if (completedSteps.has(step.id)) {
      const result = stepResults[step.id];
      if (result?.status === 'failed') {
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      }
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return null;
  };

  const getStepStatusText = (step: ResearchPlanStep) => {
    if (executingSteps.has(step.id)) {
      return 'Executing...';
    }
    
    if (completedSteps.has(step.id)) {
      const result = stepResults[step.id];
      if (result?.status === 'failed') {
        return 'Failed';
      }
      return 'Completed';
    }
    
    return 'Ready';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h2>
            <p className="text-gray-600 mb-2">{plan.description}</p>
            <p className="text-sm text-gray-500">
              Created: {formatTimestamp(plan.created_at)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              plan.status === 'ready' ? 'bg-green-100 text-green-800' :
              plan.status === 'executing' ? 'bg-blue-100 text-blue-800' :
              plan.status === 'completed' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Total Steps: {plan.steps.length}</span>
          <span>Completed: {completedSteps.size}</span>
          <span>Executing: {executingSteps.size}</span>
        </div>
      </div>

      {/* Plan Steps */}
      <div className="space-y-4">
        {plan.steps.map((step) => (
          <div key={step.id} className="bg-white border rounded-lg overflow-hidden">
            {/* Step Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getStepStatusIcon(step)}
                  <span className="text-sm font-medium text-gray-600">
                    Step {step.order}: {step.title}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  executingSteps.has(step.id) ? 'bg-blue-100 text-blue-800' :
                  completedSteps.has(step.id) ? 
                    (stepResults[step.id]?.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') :
                    'bg-gray-100 text-gray-800'
                }`}>
                  {getStepStatusText(step)}
                </span>
              </div>
              
              {step.code && !completedSteps.has(step.id) && !executingSteps.has(step.id) && (
                <button
                  onClick={() => handleExecuteStep(step)}
                  disabled={executingSteps.has(step.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 disabled:opacity-50 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  <span>Go</span>
                </button>
              )}
            </div>

            {/* Step Content */}
            <div className="p-4 space-y-4">
              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
                <p className="text-gray-600">{step.description}</p>
              </div>

              {/* Code */}
              {step.code && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Code:</h4>
                  <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                    <code>{step.code}</code>
                  </pre>
                </div>
              )}

              {/* Results */}
              {stepResults[step.id] && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Results:</h4>
                  <div className={`p-3 rounded-md text-sm ${
                    stepResults[step.id].status === 'failed' 
                      ? 'bg-red-50 text-red-800' 
                      : 'bg-green-50 text-green-800'
                  }`}>
                    {stepResults[step.id].status === 'failed' ? (
                      <div>
                        <p className="font-medium">Execution Failed:</p>
                        <p>{stepResults[step.id].error}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">Execution Successful:</p>
                        {stepResults[step.id].output && (
                          <div className="mt-2">
                            <p className="font-medium">Output:</p>
                            <pre className="whitespace-pre-wrap mt-1">{stepResults[step.id].output}</pre>
                          </div>
                        )}
                        {stepResults[step.id].logs && (
                          <div className="mt-2">
                            <p className="font-medium">Logs:</p>
                            <pre className="whitespace-pre-wrap mt-1 text-xs">{stepResults[step.id].logs}</pre>
                          </div>
                        )}
                        {stepResults[step.id].data_summary && (
                          <div className="mt-2">
                            <p className="font-medium">Data Summary:</p>
                            <pre className="whitespace-pre-wrap mt-1 text-xs">{stepResults[step.id].data_summary}</pre>
                          </div>
                        )}
                        <p className="text-xs mt-2">
                          Execution time: {stepResults[step.id].execution_time_ms}ms
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResearchPlanComponent; 