import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MockInterview = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('select');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreview, setResumePreview] = useState('');
  const [resumeSkills, setResumeSkills] = useState([]);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [jobDetails, setJobDetails] = useState({ title: '', description: '' });
  const fileInputRef = useRef(null);

  const [generalSettings, setGeneralSettings] = useState({
    role: 'Software Engineer',
    count: 5,
    focusAreas: ['Technical', 'Problem Solving', 'Communication']
  });

  const [resumeSettings, setResumeSettings] = useState({
    count: 5,
    focusAreas: ['Technical', 'Problem Solving', 'Communication']
  });

  const [jobSettings, setJobSettings] = useState({
    count: 5,
    focusAreas: ['Technical', 'Problem Solving', 'Communication']
  });

  useEffect(() => {
    if (inProgress && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (inProgress && timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft, inProgress]);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setResumeFile(file);
    setUploadingResume(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await axios.post('/api/ai/extract-skills', formData);
      
      if (response.data.success) {
        setResumeSkills(response.data.data.skills || []);
        setResumePreview(file.name);
      } else {
        setError(response.data.error || 'Failed to extract skills from resume');
      }
    } catch (err) {
      console.error('Error extracting skills:', err);
      setError(err.response?.data?.error || err.message || 'Failed to extract skills from resume');
      setResumeSkills([]);
    } finally {
      setUploadingResume(false);
    }
  };

  const startResumeInterview = async () => {
    if (!resumeSkills.length) {
      setError('Please upload a resume first to extract skills.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/ai/resume-mock-interview', {
        skills: resumeSkills,
        count: resumeSettings.count,
        focusAreas: resumeSettings.focusAreas
      });
      
      if (response.data.success && response.data.data?.length > 0) {
        setQuestions(response.data.data);
        setCurrentIndex(0);
        setResults([]);
        setAnswer('');
        setTimeLeft(300);
        setLoading(false);
        setInProgress(true);
        setView('interview');
      } else {
        setError('Failed to generate questions. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error starting resume interview:', err);
      setError(err.response?.data?.error || 'Failed to start interview. Please check your API key.');
      setLoading(false);
    }
  };

  const startJobDescriptionInterview = async () => {
    if (!jobDetails.title.trim() || !jobDetails.description.trim()) {
      setError('Please enter both job title and job description.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/ai/job-description-interview', {
        jobTitle: jobDetails.title,
        jobDescription: jobDetails.description,
        count: jobSettings.count,
        focusAreas: jobSettings.focusAreas
      });
      
      if (response.data.success && response.data.data?.length > 0) {
        setQuestions(response.data.data);
        setCurrentIndex(0);
        setResults([]);
        setAnswer('');
        setTimeLeft(300);
        setLoading(false);
        setInProgress(true);
        setView('interview');
      } else {
        setError('Failed to generate questions. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error starting job description interview:', err);
      setError(err.response?.data?.error || 'Failed to start interview. Please check your API key.');
      setLoading(false);
    }
  };

  const fetchGeneralQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/ai/mock-interview', {
        role: generalSettings.role,
        focusAreas: generalSettings.focusAreas,
        count: generalSettings.count
      });
      
      if (response.data.success && response.data.data?.length > 0) {
        setQuestions(response.data.data);
        setCurrentIndex(0);
        setResults([]);
        setAnswer('');
        setTimeLeft(300);
        setLoading(false);
        setInProgress(true);
        setView('interview');
      } else {
        setError('Failed to generate questions. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.response?.data?.error || 'Failed to generate questions. Please check your API key.');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setLoading(true);
    try {
      const currentQ = questions[currentIndex];
      
      const [evalResponse, compareResponse] = await Promise.all([
        axios.post('/api/ai/evaluate-answer', {
          question: {
            title: currentQ.title,
            description: currentQ.description
          },
          answer: answer
        }),
        axios.post('/api/ai/compare-answer', {
          question: currentQ.title,
          userAnswer: answer,
          correctAnswer: currentQ.answer || currentQ.explanation || 'No ideal answer available'
        }).catch(() => ({ data: { data: null } }))
      ]);

      const evalData = evalResponse.data.data;
      const compareData = compareResponse.data.data;

      const newResults = [...results, {
        question: currentQ,
        userAnswer: answer,
        score: evalData.score,
        feedback: evalData.feedback,
        comparison: compareData
      }];
      setResults(newResults);
      axios.post('/api/gamification/increment-questions').catch(() => {});

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setAnswer('');
        setTimeLeft(300);
        setLoading(false);
      } else {
        setCompleted(true);
        axios.post('/api/gamification/increment-interviews').catch(() => {});
        setLoading(false);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError(error.response?.data?.error || 'Failed to evaluate answer');
      setLoading(false);
    }
  };

  const getTotalScore = () => {
    if (results.length === 0) return 0;
    return Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft > 120) return 'text-emerald-600';
    if (timeLeft > 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const resetInterview = () => {
    setCompleted(false);
    setInProgress(false);
    setResults([]);
    setCurrentIndex(0);
    setAnswer('');
    setTimeLeft(300);
    setQuestions([]);
    setView('select');
    setResumeFile(null);
    setResumePreview('');
    setResumeSkills([]);
    setJobDetails({ title: '', description: '' });
    setError('');
  };

  const handleBack = () => {
    setView('select');
    setError('');
  };

  if (loading && inProgress) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-medium">Analyzing your answer...</p>
        </div>
      </div>
    );
  }

  if (error && !inProgress && view !== 'select') {
    return (
      <div className="max-w-2xl w-full animate-fade-in mx-auto">
        <div className="card p-6 sm:p-8 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Start Interview</h2>
          <p className="text-slate-500 mb-6 text-sm sm:text-base">{error}</p>
          <button
            onClick={() => { setError(''); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    const totalScore = getTotalScore();
    return (
      <div className="max-w-4xl w-full mx-auto space-y-4 sm:space-y-6 animate-fade-in">
        <div className="card p-6 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Interview Complete!</h1>
          <p className="text-slate-500 mb-6 sm:mb-8 text-sm sm:text-base">
            {resumeSkills.length > 0 ? 'Resume-Based Mock Interview' : 
             jobDetails.title ? 'Job Description-Based Mock Interview' : 
             'General Mock Interview'}
          </p>
          
          <div className={`text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 ${totalScore >= 60 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {totalScore}%
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            {results.map((r, idx) => (
              <div key={idx} className="p-2 sm:p-3 bg-slate-100 rounded-xl min-w-[50px]">
                <p className="text-xs text-slate-400 mb-0.5">Q{idx + 1}</p>
                <p className={`text-lg sm:text-xl font-bold ${r.score >= 80 ? 'text-emerald-600' : r.score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {r.score}%
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Detailed Review</h2>
          {results.map((r, idx) => (
            <div key={idx} className="card p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs sm:text-sm text-slate-400">Question {idx + 1}</span>
                  <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{r.question.title}</h3>
                </div>
                <span className={`text-xl sm:text-2xl font-bold flex-shrink-0 ${
                  r.score >= 80 ? 'text-emerald-600' : r.score >= 60 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {r.score}%
                </span>
              </div>

              <div className="mb-4 p-3 sm:p-4 bg-rose-50 rounded-xl border border-rose-100">
                <p className="text-sm font-medium text-rose-800 mb-1.5 sm:mb-2">Your Answer:</p>
                <p className="text-sm text-rose-700 whitespace-pre-line">{r.userAnswer}</p>
              </div>

              {r.question.answer && (
                <div className="mb-4 p-3 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm font-medium text-emerald-800 mb-1.5 sm:mb-2">Ideal Answer:</p>
                  <p className="text-sm text-emerald-700 whitespace-pre-line">{r.question.answer}</p>
                </div>
              )}

              {r.comparison && (
                <div className="p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                  <p className="text-sm font-medium text-blue-800 mb-2 sm:mb-3">AI Analysis:</p>
                  
                  {r.comparison.strengths && r.comparison.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-emerald-600 mb-1">What you did well:</p>
                      <ul className="text-xs sm:text-sm text-slate-600 space-y-1">
                        {r.comparison.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.comparison.missing && r.comparison.missing.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-rose-600 mb-1">What you missed:</p>
                      <ul className="text-xs sm:text-sm text-slate-600 space-y-1">
                        {r.comparison.missing.map((m, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-rose-500 mt-0.5">✗</span> {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.comparison.improvements && r.comparison.improvements.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-600 mb-1">Suggestions to improve:</p>
                      <ul className="text-xs sm:text-sm text-slate-600 space-y-1">
                        {r.comparison.improvements.map((imp, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-blue-500 mt-0.5">→</span> {imp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 sm:p-4 bg-slate-100 rounded-xl">
                <p className="text-sm font-medium text-slate-700 mb-1">Feedback:</p>
                <p className="text-sm text-slate-600">{r.feedback}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={resetInterview}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Interview Selection View
  if (view === 'select') {
    return (
      <div className="max-w-5xl w-full mx-auto animate-fade-in">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">Mock Interview</h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Choose your interview type to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {/* General Interview */}
          <div 
            onClick={() => { setView('general'); setError(''); }}
            className="card p-5 sm:p-6 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">General Questions</h3>
            <p className="text-sm text-slate-500 mb-4">Practice with common interview questions based on your target role</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">Behavioral</span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">Technical</span>
            </div>
          </div>

          {/* Resume Based Interview */}
          <div 
            onClick={() => { setView('resume'); setError(''); }}
            className="card p-5 sm:p-6 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4 bg-emerald-100 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Resume Based</h3>
            <p className="text-sm text-slate-500 mb-4">Upload your resume and get questions matched to your skills</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">Skills</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">Experience</span>
            </div>
          </div>

          {/* Job Description Based Interview */}
          <div 
            onClick={() => { setView('job'); setError(''); }}
            className="card p-5 sm:p-6 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group md:col-span-2 lg:col-span-1"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4 bg-purple-100 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Job Description</h3>
            <p className="text-sm text-slate-500 mb-4">Enter job title and description to generate targeted questions</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">Role Specific</span>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">Requirements</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // General Interview Setup
  if (view === 'general') {
    return (
      <div className="max-w-3xl w-full mx-auto animate-fade-in">
        <button
          onClick={handleBack}
          className="flex items-center text-slate-500 hover:text-slate-700 mb-4 sm:mb-6 text-sm font-medium"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Interview Types
        </button>

        <div className="card p-5 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">General Questions Interview</h2>
              <p className="text-slate-500 text-sm hidden sm:block">Practice with common interview questions based on your target role</p>
            </div>
          </div>

          <div className="mb-5 sm:mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Target Role</label>
            <input
              type="text"
              value={generalSettings.role}
              onChange={(e) => setGeneralSettings({ ...generalSettings, role: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g., Software Engineer, Data Scientist"
            />
          </div>

          <div className="mb-5 sm:mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Number of Questions</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[3, 5, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => setGeneralSettings({ ...generalSettings, count: num })}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    generalSettings.count === num
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="text-xl sm:text-2xl font-bold">{num}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 sm:mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Focus Areas</label>
            <div className="flex flex-wrap gap-2">
              {['Technical', 'Problem Solving', 'Communication', 'Leadership', 'Behavioral', 'System Design'].map((area) => (
                <button
                  key={area}
                  onClick={() => {
                    const newAreas = generalSettings.focusAreas.includes(area)
                      ? generalSettings.focusAreas.filter(a => a !== area)
                      : [...generalSettings.focusAreas, area];
                    setGeneralSettings({ ...generalSettings, focusAreas: newAreas });
                  }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 transition-all text-xs sm:text-sm ${
                    generalSettings.focusAreas.includes(area)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-blue-50 rounded-xl border border-blue-100 mb-5 sm:mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">AI-Powered Interview:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                  <li>Questions are generated in real-time using AI</li>
                  <li>Each question has a 5-minute time limit</li>
                  <li>AI will evaluate your answers with detailed feedback</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-5 sm:mb-6 p-4 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="ml-3 text-slate-500 font-medium">Generating questions...</span>
            </div>
          ) : (
            <button
              onClick={fetchGeneralQuestions}
              disabled={generalSettings.focusAreas.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm sm:text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start General Interview
            </button>
          )}
        </div>
      </div>
    );
  }

  // Resume Based Interview Setup
  if (view === 'resume') {
    return (
      <div className="max-w-3xl w-full mx-auto animate-fade-in">
        <button
          onClick={handleBack}
          className="flex items-center text-slate-500 hover:text-slate-700 mb-4 sm:mb-6 text-sm font-medium"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Interview Types
        </button>

        <div className="card p-5 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">Resume Based Interview</h2>
              <p className="text-slate-500 text-sm hidden sm:block">Upload your resume to get questions matched to your skills</p>
            </div>
          </div>

          <div className="mb-5 sm:mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Upload Resume</label>
            <div 
              onClick={() => !uploadingResume && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                uploadingResume 
                  ? 'border-emerald-300 bg-emerald-50 cursor-wait' 
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleResumeUpload}
                className="hidden"
              />
              {uploadingResume ? (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  <span className="mt-3 text-emerald-600 font-medium text-sm">Extracting skills from resume...</span>
                </div>
              ) : resumeSkills.length > 0 ? (
                <div className="text-emerald-600">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium text-sm sm:text-base">{resumeFile?.name}</p>
                  <p className="text-sm text-emerald-600 mt-1">Skills extracted successfully!</p>
                </div>
              ) : (
                <div className="text-slate-500">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="font-medium text-sm sm:text-base">Click to upload or drag and drop</p>
                  <p className="text-xs sm:text-sm mt-1 text-slate-400">PDF, DOC, DOCX, or TXT (max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-5 sm:mb-6 p-4 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {resumeSkills.length > 0 && (
            <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-sm font-medium text-emerald-800 mb-2">Extracted Skills ({resumeSkills.length}):</p>
              <div className="flex flex-wrap gap-2">
                {resumeSkills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white text-emerald-700 rounded-full text-xs sm:text-sm border border-emerald-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-5 sm:mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Number of Questions</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[3, 5, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => setResumeSettings({ ...resumeSettings, count: num })}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    resumeSettings.count === num
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="text-xl sm:text-2xl font-bold">{num}</span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <span className="ml-3 text-slate-500 font-medium">Generating questions...</span>
            </div>
          ) : (
            <button
              onClick={startResumeInterview}
              disabled={resumeSkills.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resumeSkills.length === 0 ? 'Upload Resume to Start' : 'Start Resume Interview'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Job Description Based Interview Setup
  if (view === 'job') {
    return (
      <div className="max-w-3xl w-full mx-auto animate-fade-in">
        <button
          onClick={handleBack}
          className="flex items-center text-slate-500 hover:text-slate-700 mb-4 sm:mb-6 text-sm font-medium"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Interview Types
        </button>

        <div className="card p-5 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">Job Description Interview</h2>
              <p className="text-slate-500 text-sm hidden sm:block">Enter job details to generate targeted questions</p>
            </div>
          </div>

          <div className="mb-5 sm:mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
            <input
              type="text"
              value={jobDetails.title}
              onChange={(e) => setJobDetails({ ...jobDetails, title: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div className="mb-5 sm:mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Job Description</label>
            <textarea
              value={jobDetails.description}
              onChange={(e) => setJobDetails({ ...jobDetails, description: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all h-28 sm:h-32 lg:h-40 resize-none"
              placeholder="Paste the job description here..."
            />
          </div>

          {error && (
            <div className="mb-5 sm:mb-6 p-4 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <span className="ml-3 text-slate-500 font-medium">Generating questions...</span>
            </div>
          ) : (
            <button
              onClick={startJobDescriptionInterview}
              disabled={!jobDetails.title.trim() || !jobDetails.description.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold text-sm sm:text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Job Description Interview
            </button>
          )}
        </div>
      </div>
    );
  }

  // Interview In Progress View
  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-4xl w-full mx-auto space-y-4 sm:space-y-5 lg:space-y-6 animate-fade-in">
      {/* Progress Bar */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
              view === 'resume' ? 'bg-emerald-100 text-emerald-700' :
              view === 'job' ? 'bg-purple-100 text-purple-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {view === 'resume' && 'Resume Based'}
              {view === 'job' && 'Job Description Based'}
              {view === 'general' && 'General Interview'}
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-600">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <div className={`text-xl sm:text-2xl font-mono font-bold ${getTimerColor()}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              timeLeft > 120 ? 'bg-emerald-500' : timeLeft > 60 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${(timeLeft / 300) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="card p-4 sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
          <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${
            currentQuestion.category === 'Technical' ? 'bg-blue-100 text-blue-700' :
            currentQuestion.category === 'Behavioral' ? 'bg-purple-100 text-purple-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {currentQuestion.category}
          </span>
          <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${
            currentQuestion.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' :
            currentQuestion.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
            'bg-rose-100 text-rose-700'
          }`}>
            {currentQuestion.difficulty}
          </span>
        </div>
        
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">{currentQuestion.title}</h2>
        <p className="text-slate-600 mb-4 text-sm sm:text-base">{currentQuestion.description}</p>
        
        {currentQuestion.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentQuestion.keywords.map((keyword, idx) => (
              <span key={idx} className="px-2.5 sm:px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm">
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Answer */}
      <div className="card p-4 sm:p-5 lg:p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2 sm:mb-3">
          Your Answer
          <span className="text-slate-400 font-normal ml-2 text-xs sm:text-sm">({answer.length} characters)</span>
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here... (You have 5 minutes)"
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-40 sm:h-48 resize-none text-sm sm:text-base"
          disabled={loading}
        />
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
          {currentQuestion.answer && (
            <button
              type="button"
              onClick={() => alert(`Hint: ${currentQuestion.answer}`)}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium order-2 sm:order-1"
            >
              Show Answer Hint
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || loading}
            className="w-full sm:w-auto order-1 sm:order-2 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </>
            ) : answer.trim() ? 'Submit Answer' : 'Please enter an answer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockInterview;
