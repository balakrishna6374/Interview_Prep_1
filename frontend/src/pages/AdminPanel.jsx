import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [apiStats, setApiStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [questionFilters, setQuestionFilters] = useState({ category: '', difficulty: '', search: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab, userSearch, questionFilters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [analyticsRes, apiStatsRes] = await Promise.all([
          axios.get('/api/admin/analytics'),
          axios.get('/api/admin/api-stats')
        ]);
        setAnalytics(analyticsRes.data.data);
        setApiStats(apiStatsRes.data.data);
      } else if (activeTab === 'users') {
        const params = new URLSearchParams();
        if (userSearch) params.append('search', userSearch);
        const response = await axios.get(`/api/admin/users?${params}`);
        setUsers(response.data.data);
      } else if (activeTab === 'questions') {
        const params = new URLSearchParams();
        if (questionFilters.category) params.append('category', questionFilters.category);
        if (questionFilters.difficulty) params.append('difficulty', questionFilters.difficulty);
        if (questionFilters.search) params.append('search', questionFilters.search);
        const response = await axios.get(`/api/admin/questions?${params}`);
        setQuestions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error deleting user');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await axios.delete(`/api/questions/${questionId}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error deleting question');
    }
  };

  const categoryChartData = analytics?.categoryDistribution ? {
    labels: analytics.categoryDistribution.map(c => c.category),
    datasets: [{
      label: 'Questions',
      data: analytics.categoryDistribution.map(c => c.count),
      backgroundColor: ['#0ea5e9', '#10b981', '#8b5cf6'],
      borderRadius: 8,
    }],
  } : null;

  const difficultyChartData = analytics?.difficultyDistribution ? {
    labels: analytics.difficultyDistribution.map(d => d.difficulty),
    datasets: [{
      label: 'Questions',
      data: analytics.difficultyDistribution.map(d => d.count),
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderRadius: 8,
    }],
  } : null;

  const apiRequestsChartData = apiStats?.requestsByDay ? {
    labels: apiStats.requestsByDay.map(r => r.date),
    datasets: [{
      label: 'API Requests',
      data: apiStats.requestsByDay.map(r => r.count),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  } : null;

  const interviewTypeChartData = apiStats?.requestsByInterviewType ? {
    labels: apiStats.requestsByInterviewType.map(r => {
      if (r.type === 'general') return 'General Interview';
      if (r.type === 'resume') return 'Resume Based';
      if (r.type === 'job') return 'Job Description';
      return r.type;
    }),
    datasets: [{
      data: apiStats.requestsByInterviewType.map(r => r.count),
      backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'],
      borderWidth: 0,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'questions', label: 'Questions', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-500 mt-1">Manage your application and monitor activity</p>
      </div>

      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 bg-slate-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-blue-500">
                  <p className="text-sm font-medium text-slate-500">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{analytics.overview.totalUsers}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-indigo-500">
                  <p className="text-sm font-medium text-slate-500">Regular Users</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-1">{analytics.overview.userCount}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-purple-500">
                  <p className="text-sm font-medium text-slate-500">Total Questions</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{analytics.overview.totalQuestions}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-amber-500">
                  <p className="text-sm font-medium text-slate-500">Total Attempts</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">{analytics.overview.totalAttempts}</p>
                </div>
              </div>

              {apiStats && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">API Usage Statistics</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
                      <p className="text-sm opacity-80">Total API Requests</p>
                      <p className="text-2xl font-bold mt-1">{apiStats.totalRequests}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
                      <p className="text-sm opacity-80">Successful Requests</p>
                      <p className="text-2xl font-bold mt-1">{apiStats.successfulRequests}</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white">
                      <p className="text-sm opacity-80">Failed Requests</p>
                      <p className="text-2xl font-bold mt-1">{apiStats.failedRequests}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
                      <p className="text-sm opacity-80">Avg Response Time</p>
                      <p className="text-2xl font-bold mt-1">{apiStats.avgResponseTime}ms</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
                      <p className="text-sm opacity-80">Interview APIs</p>
                      <p className="text-2xl font-bold mt-1">
                        {apiStats.requestsByInterviewType.reduce((sum, r) => sum + r.count, 0)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {apiRequestsChartData && (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">API Requests (Last 7 Days)</h3>
                        <div className="h-64">
                          <Line data={apiRequestsChartData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
                        </div>
                      </div>
                    )}
                    {interviewTypeChartData && (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Interview Type Distribution</h3>
                        <div className="h-64">
                          <Doughnut data={interviewTypeChartData} options={doughnutOptions} />
                        </div>
                      </div>
                    )}
                  </div>

                  {apiStats.requestsByEndpoint.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Top API Endpoints</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Endpoint</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Method</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Requests</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Avg Response</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {apiStats.requestsByEndpoint.map((endpoint, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-3 px-4 text-sm text-slate-700 font-mono">{endpoint.endpoint}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    endpoint.method === 'GET' ? 'bg-emerald-100 text-emerald-700' :
                                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                                    endpoint.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                                    endpoint.method === 'DELETE' ? 'bg-rose-100 text-rose-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {endpoint.method}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-700">{endpoint.count}</td>
                                <td className="py-3 px-4 text-sm text-slate-700">{endpoint.avgResponseTime}ms</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categoryChartData && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-6">Questions by Category</h2>
                    <div className="h-64">
                      <Bar data={categoryChartData} options={chartOptions} />
                    </div>
                  </div>
                )}
                {difficultyChartData && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-6">Questions by Difficulty</h2>
                    <div className="h-64">
                      <Bar data={difficultyChartData} options={chartOptions} />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-800">Recent Users</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {analytics.recentUsers.map((user) => (
                      <div key={user._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-800">Recent Attempts</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {analytics.recentAttempts.map((attempt) => (
                      <div key={attempt._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <p className="font-medium text-slate-800 text-sm truncate max-w-[200px]">
                            {attempt.user?.name || 'User'}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {attempt.question?.title || 'Question'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          attempt.score >= 60 ? 'bg-emerald-100 text-emerald-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {attempt.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">User</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Role</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Progress</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Joined</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-slate-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{user.name}</p>
                                <p className="text-sm text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${user.progressScore}%` }} />
                              </div>
                              <span className="text-sm text-slate-600">{user.progressScore}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-rose-600 hover:text-rose-800 text-sm font-medium"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={questionFilters.search}
                      onChange={(e) => setQuestionFilters({ ...questionFilters, search: e.target.value })}
                      placeholder="Search questions..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <select
                    value={questionFilters.category}
                    onChange={(e) => setQuestionFilters({ ...questionFilters, category: e.target.value })}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">All Categories</option>
                    <option value="Technical">Technical</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="System Design">System Design</option>
                  </select>
                  <select
                    value={questionFilters.difficulty}
                    onChange={(e) => setQuestionFilters({ ...questionFilters, difficulty: e.target.value })}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">All Levels</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {questions.map((question) => (
                  <div key={question._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          question.category === 'Technical' ? 'bg-blue-100 text-blue-700' :
                          question.category === 'Behavioral' ? 'bg-purple-100 text-purple-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {question.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          question.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' :
                          question.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {question.difficulty}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800">{question.title}</p>
                      <p className="text-sm text-slate-500 truncate">{question.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(question._id)}
                      className="ml-4 text-rose-600 hover:text-rose-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;
