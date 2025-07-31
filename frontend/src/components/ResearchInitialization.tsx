import React, { useState } from 'react';
import { apiService } from '../api';

interface ResearchQuestion {
  id: string;
  question: string;
  category: string;
  required: boolean;
}

interface ResearchInitialization {
  title: string;
  questions: ResearchQuestion[];
}

interface ResearchInitializationProps {
  onComplete: (title: string, goal: string, answers: Record<string, string>) => void;
  onCancel: () => void;
}

export const ResearchInitialization: React.FC<ResearchInitializationProps> = ({
  onComplete,
  onCancel
}) => {
  const [step, setStep] = useState<'goal' | 'questions'>('goal');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialization, setInitialization] = useState<ResearchInitialization | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleSubmitGoal = async () => {
    if (!goal.trim()) {
      setError('Please enter a research goal');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.initializeResearch({ goal });
      setInitialization(result as ResearchInitialization);
      setStep('questions');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initialize research');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitAnswers = () => {
    if (!initialization) return;

    // Check if all required questions are answered
    const requiredQuestions = initialization.questions.filter(q => q.required);
    const unansweredRequired = requiredQuestions.filter(q => !answers[q.id]?.trim());

    if (unansweredRequired.length > 0) {
      setError('Please answer all required questions');
      return;
    }

    onComplete(initialization.title, goal, answers);
  };

  const canSubmitAnswers = () => {
    if (!initialization) return false;
    const requiredQuestions = initialization.questions.filter(q => q.required);
    return requiredQuestions.every(q => answers[q.id]?.trim());
  };

  if (step === 'goal') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Start New Research</h2>
          <p className="text-gray-600">
            Describe what you'd like to research. I'll help you plan the approach and gather the information needed.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
              placeholder="e.g., Analyze customer churn patterns to identify key factors"
              rows={4}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleSubmitGoal}
              disabled={loading}
              className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Continue'}
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'questions' && initialization) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {initialization.title}
          </h2>
          <p className="text-gray-600 mb-4">
            Please answer these questions to help me plan your research effectively.
          </p>
        </div>

        <div className="space-y-6">
          {initialization.questions.map((question) => (
            <div key={question.id} className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cedar-500"
                placeholder="Enter your answer..."
                rows={3}
              />
              <div className="mt-1 text-xs text-gray-500">
                Category: {question.category}
              </div>
            </div>
          ))}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleSubmitAnswers}
              disabled={!canSubmitAnswers()}
              className="bg-cedar-500 text-white px-4 py-2 rounded-md hover:bg-cedar-600 transition-colors disabled:opacity-50"
            >
              Start Research
            </button>
            <button
              onClick={() => setStep('goal')}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Back
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 