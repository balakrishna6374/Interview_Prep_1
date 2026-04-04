import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Questions = () => {
  const { user } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: '', difficulty: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [deleting, setDeleting] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [questionAnswer, setQuestionAnswer] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, [filters.category, filters.difficulty, pagination.page]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.search) params.append('search', filters.search);
      params.append('page', pagination.page);
      params.append('limit', 12);

      const response = await axios.get(`/api/questions?${params}`);
      setQuestions(response.data.data);
      setPagination(prev => ({ ...prev, totalPages: response.data.totalPages, total: response.data.total }));
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.response?.data?.error || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, questionId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    setDeleting(questionId);
    try {
      await axios.delete(`/api/questions/${questionId}`);
      setQuestions(questions.filter(q => q._id !== questionId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Failed to delete question');
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchQuestions();
  };

  const handleQuestionClick = async (question) => {
    setSelectedQuestion(question);
    setAnswerLoading(true);
    setQuestionAnswer(null);
    
    try {
      const response = await fetch('/api/ai/get-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.title, description: question.description })
      });
      const data = await response.json();
      setQuestionAnswer(data.data || data.answer || 'No answer available');
    } catch (err) {
      console.error('Error fetching answer:', err);
      setQuestionAnswer(question.answer || 'Failed to load answer');
    } finally {
      setAnswerLoading(false);
    }
  };

  const closeAnswer = () => {
    setSelectedQuestion(null);
    setQuestionAnswer(null);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'Hard': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Technical': return 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4';
      case 'Behavioral': return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0M7 10a2 2 0 11-4 0 2 2 0 014 0z';
      case 'System Design': return 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z';
      default: return 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Question Bank</h1>
          <p className="text-slate-500 mt-1 text-sm">{pagination.total} questions available</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4 lg:p-5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 items-stretch sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-slate-600 mb-1 sm:mb-2">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search questions..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 sm:mb-2">Category</label>
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="w-full sm:w-auto min-w-[120px] px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm">
              <option value="">All</option>
              <option value="Technical">Technical</option>
              <option value="Behavioral">Behavioral</option>
              <option value="System Design">System Design</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 sm:mb-2">Difficulty</label>
            <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })} className="w-full sm:w-auto min-w-[110px] px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm">
              <option value="">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden xs:inline">Filter</span>
          </button>
        </form>
      </div>

      {/* Questions Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm font-medium">Loading questions...</p>
          </div>
        </div>
      ) : error ? (
        <div className="card p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">Error Loading Questions</h3>
          <p className="text-slate-500 mb-4 text-sm">{error}</p>
          <button onClick={fetchQuestions} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">Try Again</button>
        </div>
      ) : questions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {questions.map((question, idx) => (
            <div key={question._id} className="card p-4 sm:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group relative" style={{ animationDelay: `${idx * 50}ms` }}>
              {user?.role === 'admin' && (
                <button onClick={(e) => handleDelete(e, question._id)} disabled={deleting === question._id} className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 z-10" title="Delete Question">
                  {deleting === question._id ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  )}
                </button>
              )}

              <div onClick={() => handleQuestionClick(question)} className="block cursor-pointer">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 text-blue-600">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getCategoryIcon(question.category)} />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-500">{question.category}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>{question.difficulty}</span>
                </div>
              
                <h3 className="font-semibold text-slate-800 mb-1.5 sm:mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm sm:text-base">
                  {question.title}
                </h3>
                
                <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-3 sm:mb-4">{question.description}</p>
              
                {question.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {question.keywords.slice(0, 3).map((keyword, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{keyword}</span>
                    ))}
                    {question.keywords.length > 3 && <span className="px-1.5 py-0.5 text-slate-400 text-xs">+{question.keywords.length - 3}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">No questions found</h3>
          <p className="text-slate-500 mb-4 text-sm">Try adjusting your filters or search terms</p>
          <button onClick={() => setFilters({ category: '', difficulty: '', search: '' })} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all">Clear Filters</button>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <p className="text-xs sm:text-sm text-slate-500 order-2 sm:order-1">Showing {((pagination.page - 1) * 12) + 1} to {Math.min(pagination.page * 12, pagination.total)} of {pagination.total}</p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium text-sm">{pagination.page} <span className="text-slate-400">/</span> {pagination.totalPages}</div>
            <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Answer Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeAnswer}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-slate-900">Answer</h2>
              <button onClick={closeAnswer} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{selectedQuestion.category}</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(selectedQuestion.difficulty)}`}>{selectedQuestion.difficulty}</span>
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">{selectedQuestion.title}</h3>
              <p className="text-slate-600 mb-4 whitespace-pre-line text-sm sm:text-base">{selectedQuestion.description}</p>
              
              {selectedQuestion.keywords?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedQuestion.keywords.map((keyword, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs sm:text-sm">{keyword}</span>
                  ))}
                </div>
              )}
              
              <div className="border-t border-slate-100 pt-4">
                {answerLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <span className="ml-3 text-slate-500 font-medium">Loading answer...</span>
                  </div>
                ) : (
                  <div className="bg-emerald-50 rounded-xl p-4 sm:p-5 border border-emerald-100">
                    <p className="font-medium text-emerald-800 mb-2">Answer:</p>
                    <p className="text-emerald-700 whitespace-pre-line text-sm sm:text-base">{questionAnswer}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
