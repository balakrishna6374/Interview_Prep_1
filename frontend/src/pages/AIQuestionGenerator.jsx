import { useState } from 'react';
import axios from 'axios';

const AIQuestionGenerator = () => {
  const [formData, setFormData] = useState({
    topic: '',
    category: 'Technical',
    difficulty: 'Medium',
    count: 5
  });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setGeneratedQuestions([]);

    try {
      const response = await axios.post('/api/ai/generate-questions', formData);
      setGeneratedQuestions(response.data.data);
      setSuccess(`Successfully generated ${response.data.data.length} questions!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (question) => {
    try {
      await axios.post('/api/questions', question);
    } catch (err) {
      console.error('Error saving question:', err);
    }
  };

  const handleSaveAll = async () => {
    for (const question of generatedQuestions) {
      await handleSaveQuestion(question);
    }
    setSuccess('All questions saved to database!');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'Hard': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Technical': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Behavioral': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'System Design': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">AI Question Generator</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Generate interview questions using AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-5 lg:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 sm:mb-5">Generate Questions</h2>
          
          {error && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-600 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="e.g., JavaScript, React, System Design"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="Technical">Technical</option>
                <option value="Behavioral">Behavioral</option>
                <option value="System Design">System Design</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Count</label>
                <select
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={7}>7</option>
                  <option value={10}>10</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate with AI
                </>
              )}
            </button>
          </form>
        </div>

        <div className="card p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">Generated Questions</h2>
            {generatedQuestions.length > 0 && (
              <button onClick={handleSaveAll} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs sm:text-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save All
              </button>
            )}
          </div>

          {generatedQuestions.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-slate-400">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm sm:text-base">No questions generated yet</p>
              <p className="text-xs sm:text-sm mt-1">Fill the form and click generate</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2">
              {generatedQuestions.map((q, idx) => (
                <div key={idx} className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(q.category)}`}>
                        {q.category}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSaveQuestion(q)}
                      className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex-shrink-0"
                    >
                      Save
                    </button>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1 text-sm sm:text-base">{q.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-2">{q.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {q.keywords?.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                        {kw}
                      </span>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setExpandedAnswers(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {expandedAnswers[idx] ? 'Hide Answer & Explanation' : 'Show Answer & Explanation'}
                  </button>
                  
                  {expandedAnswers[idx] && (
                    <div className="mt-3 space-y-2 animate-fade-in">
                      {q.answer && (
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                          <p className="text-xs sm:text-sm font-medium text-emerald-800 mb-1">Answer:</p>
                          <p className="text-xs sm:text-sm text-emerald-700">{q.answer}</p>
                        </div>
                      )}
                      {q.explanation && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1">Explanation:</p>
                          <p className="text-xs sm:text-sm text-blue-700">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIQuestionGenerator;
