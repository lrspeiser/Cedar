import React, { useState, useEffect } from 'react';
import { apiService } from '../api';

interface Question {
  id: string;
  question: string;
  answer?: string;
  category: string;
  created_at: string;
  answered_at?: string;
  status: string;
  related_to: string[];
}

interface QuestionsTabProps {
  projectId: string;
}

const QuestionsTab: React.FC<QuestionsTabProps> = ({ projectId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [projectId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsData = await apiService.getQuestions(projectId);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async (context: 'initial' | 'follow_up') => {
    try {
      setGenerating(true);
      const newQuestions = await apiService.generateQuestions(projectId, context);
      
      // Add the new questions to the project
      for (const question of newQuestions) {
        await apiService.addQuestion(projectId, question);
      }
      
      await loadQuestions(); // Reload to show new questions
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    try {
      await apiService.answerQuestion(projectId, questionId, answer);
      await loadQuestions(); // Reload to update the UI
      setEditingAnswer(null);
      setAnswerText('');
    } catch (error) {
      console.error('Failed to answer question:', error);
    }
  };

  const handleSkipQuestion = async (questionId: string) => {
    try {
      await apiService.updateQuestion(projectId, questionId, { status: 'skipped' });
      await loadQuestions();
    } catch (error) {
      console.error('Failed to skip question:', error);
    }
  };

  const startEditing = (questionId: string, currentAnswer?: string) => {
    setEditingAnswer(questionId);
    setAnswerText(currentAnswer || '');
  };

  const cancelEditing = () => {
    setEditingAnswer(null);
    setAnswerText('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'skipped': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'initial': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-purple-100 text-purple-800';
      case 'clarification': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const answeredQuestions = questions.filter(q => q.status === 'answered');
  const skippedQuestions = questions.filter(q => q.status === 'skipped');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedar-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Research Questions</h2>
          <p className="text-gray-600 mt-1">
            Answer these questions to help guide your research direction
          </p>
        </div>
        <div className="flex space-x-3">
          {questions.length === 0 && (
            <button
              onClick={() => handleGenerateQuestions('initial')}
              disabled={generating}
              className="px-4 py-2 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 disabled:opacity-50 transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Initial Questions'}
            </button>
          )}
          {questions.length > 0 && (
            <button
              onClick={() => handleGenerateQuestions('follow_up')}
              disabled={generating}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Follow-up Questions'}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">{pendingQuestions.length}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{answeredQuestions.length}</div>
          <div className="text-sm text-gray-600">Answered</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-600">{skippedQuestions.length}</div>
          <div className="text-sm text-gray-600">Skipped</div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">❓</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
            <p className="text-gray-600 mb-4">
              Generate initial questions to help clarify your research goals
            </p>
            <button
              onClick={() => handleGenerateQuestions('initial')}
              disabled={generating}
              className="px-6 py-3 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 disabled:opacity-50 transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Initial Questions'}
            </button>
          </div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
                      {question.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(question.category)}`}>
                      {question.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(question.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {question.question}
                  </h3>
                </div>
              </div>

              {question.status === 'pending' && (
                <div className="space-y-3">
                  {editingAnswer === question.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-cedar-500 focus:border-transparent resize-none"
                        rows={4}
                      />
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleAnswerQuestion(question.id, answerText)}
                          disabled={!answerText.trim()}
                          className="px-4 py-2 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 disabled:opacity-50 transition-colors"
                        >
                          Submit Answer
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSkipQuestion(question.id)}
                          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => startEditing(question.id)}
                        className="px-4 py-2 bg-cedar-500 text-white rounded-md hover:bg-cedar-600 transition-colors"
                      >
                        Answer Question
                      </button>
                      <button
                        onClick={() => handleSkipQuestion(question.id)}
                        className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              )}

              {question.status === 'answered' && question.answer && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Answer</span>
                    <span className="text-xs text-green-600">
                      {question.answered_at && new Date(question.answered_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-green-900">{question.answer}</p>
                  <button
                    onClick={() => startEditing(question.id, question.answer)}
                    className="mt-3 text-sm text-green-600 hover:text-green-800 underline"
                  >
                    Edit Answer
                  </button>
                </div>
              )}

              {question.status === 'skipped' && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Question skipped</span>
                    <button
                      onClick={() => startEditing(question.id)}
                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      Answer Now
                    </button>
                  </div>
                </div>
              )}

              {question.related_to.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Related to:</div>
                  <div className="flex flex-wrap gap-2">
                    {question.related_to.map((related, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {related}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Progress indicator */}
      {questions.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {answeredQuestions.length} of {questions.length} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-cedar-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${questions.length > 0 ? (answeredQuestions.length / questions.length) * 100 : 0}%`
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionsTab; 