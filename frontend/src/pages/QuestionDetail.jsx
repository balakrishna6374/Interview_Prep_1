import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const response = await axios.get(`/api/questions/${id}`);
      setQuestion(response.data.data);
    } catch (error) {
      console.error('Error fetching question:', error);
      navigate('/questions');
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const response = await axios.post('/api/ai/explain-question', {
        question: { title: question.title, description: question.description }
      });
      setExplanation(response.data.data);
    } catch (error) {
      console.error('Error getting explanation:', error);
      if (question.answer || question.explanation) {
        setExplanation(question.answer || question.explanation || 'No explanation available');
      }
    } finally {
      setExplaining(false);
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await axios.delete(`/api/questions/${id}/save`);
        setSaved(false);
      } else {
        await axios.post(`/api/questions/${id}/save`);
        setSaved(true);
      }
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Hard': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Technical': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Behavioral': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'System Design': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="max-w-4xl w-full space-y-4 sm:space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(question.category)}`}>
              {question.category}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </span>
          </div>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              saved 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <svg className="w-5 h-5 inline mr-1" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-4">{question.title}</h1>
        <p className="text-slate-600 whitespace-pre-line leading-relaxed">{question.description}</p>

        {question.keywords?.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-3">Key topics to cover:</p>
            <div className="flex flex-wrap gap-2">
              {question.keywords.map((keyword, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {(question.answer || question.explanation) && (
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            {question.answer && (
              <div className="p-4 bg-emerald-50 rounded-xl">
                <p className="font-medium text-emerald-800 mb-2">Answer:</p>
                <p className="text-emerald-700 whitespace-pre-line">{question.answer}</p>
              </div>
            )}

            {question.explanation && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="font-medium text-blue-800 mb-2">Explanation:</p>
                <p className="text-blue-700 whitespace-pre-line">{question.explanation}</p>
              </div>
            )}

            <button
              onClick={handleExplain}
              disabled={explaining}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
            >
              {explaining ? 'Loading...' : 'Get AI Explanation'}
            </button>

            {explanation && (
              <div className="p-4 bg-purple-50 rounded-xl animate-fade-in">
                <p className="font-medium text-purple-800 mb-2">AI Explanation:</p>
                <p className="text-purple-700 whitespace-pre-line">{explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;
