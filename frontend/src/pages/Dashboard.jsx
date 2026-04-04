import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState(null);

  useEffect(() => {
    fetchData();
    fetchGamification();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, userRes] = await Promise.all([
        axios.get('/api/attempts/analytics'),
        axios.get('/api/auth/me')
      ]);
      setAnalytics(analyticsRes.data.data);
      setRecentAttempts(analyticsRes.data.data.recentAttempts || []);
      if (refreshUser) {
        refreshUser(userRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGamification = async () => {
    try {
      const res = await axios.get('/api/gamification');
      if (res.data.success) {
        setGamification(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching gamification:', error);
    }
  };

  const getProgressScore = () => `${analytics?.progressScore || user?.progressScore || 0}%`;
  const getTotalAttempts = () => analytics?.totalAttempts || 0;
  const getAverageScore = () => analytics?.averageScore || 0;
  const getCompletedCount = () => user?.completedQuestions?.length || 0;

  const chartData = analytics?.improvementTrend?.length > 0 ? {
    labels: analytics.improvementTrend.map(t => t.date),
    datasets: [{
      label: 'Average Score',
      data: analytics.improvementTrend.map(t => t.averageScore),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 8, displayColors: false },
    },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
      x: { grid: { display: false } },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
          {user?.profileImage ? (
            <img 
              src={user.profileImage} 
              alt={user?.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<span class="text-2xl sm:text-3xl font-bold text-white">${user?.name?.charAt(0)?.toUpperCase() || '?'}</span>`;
              }}
            />
          ) : (
            <span className="text-2xl sm:text-3xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>!
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Here's your interview preparation overview</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5 sm:p-6 hover:shadow-lg transition-shadow">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { to: '/mock-interview', label: 'Mock Interview', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', color: 'blue' },
            { to: '/ai-questions', label: 'AI Questions', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'emerald' },
            { to: '/resume', label: 'Resume Analyse', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'violet' },
            { to: '/chatbot', label: 'AI Coach', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', color: 'amber' },
          ].map((item) => (
            <Link key={item.to} to={item.to} className={`group flex items-center gap-3 sm:gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/50 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                item.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                item.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                item.color === 'violet' ? 'bg-violet-500/10 text-violet-600' :
                'bg-amber-500/10 text-amber-600'
              }`}>
                <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{item.label}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Gamification */}
      {gamification && (
        <div className="card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Your Achievements</h3>
                <p className="text-sm text-slate-500">Level {gamification.level} • {gamification.points} points</p>
              </div>
            </div>
            <Link to="/achievements" className="btn-primary py-2.5 px-5 text-sm font-semibold">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            <div className="bg-slate-50 rounded-xl p-3 sm:p-4 text-center border border-slate-100">
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{gamification.streak}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Day Streak</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 sm:p-4 text-center border border-slate-100">
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">{gamification.badges?.length || 0}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Badges</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 sm:p-4 text-center border border-slate-100">
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{gamification.level}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Level</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600 font-medium">Level Progress</span>
              <span className="text-blue-600 font-bold">{gamification.levelProgress}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${gamification.levelProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {[
          { label: 'Progress', value: getProgressScore(), icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'blue' },
          { label: 'Attempts', value: getTotalAttempts(), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'emerald' },
          { label: 'Avg Score', value: `${getAverageScore()}%`, icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', color: 'amber' },
          { label: 'Completed', value: getCompletedCount(), icon: 'M5 13l4 4L19 7', color: 'violet' },
        ].map((stat, idx) => (
          <div key={idx} className="card p-4 sm:p-5 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">{stat.label}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                stat.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                'bg-violet-100 text-violet-600'
              }`}>
                <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Performance Trend</h2>
          <span className="badge-primary py-1.5 px-3 text-xs font-semibold">Last 30 days</span>
        </div>
        {chartData ? (
          <div className="h-52 sm:h-56 lg:h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="h-52 sm:h-56 lg:h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 font-medium">No data yet. Start practicing!</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Weak Areas */}
        {analytics?.weakAreas?.length > 0 && (
          <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Areas to Improve</h2>
            </div>
            <div className="space-y-3">
              {analytics.weakAreas.map((area, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-transparent rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-700 text-sm">{area.category}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 sm:w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${area.score}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-10 text-right">{area.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Attempts */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Recent Attempts</h2>
            <Link to="/analytics" className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline">
              View all
            </Link>
          </div>
          {recentAttempts.length > 0 ? (
            <div className="space-y-3">
              {recentAttempts.slice(0, 5).map((attempt) => (
                <div key={attempt._id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate text-sm">
                      {attempt.question?.title || 'Question'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="badge-gray text-xs py-0.5 px-2">
                        {attempt.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className={`ml-3 px-3 py-1.5 rounded-lg font-bold text-sm
                    ${attempt.score >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                      attempt.score >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'}`}>
                    {attempt.score}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm mb-4 font-medium">No attempts yet</p>
              <Link to="/questions" className="btn-primary py-2.5 px-5 text-sm font-semibold">
                Start Practicing
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
