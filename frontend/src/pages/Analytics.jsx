import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const Analytics = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, userRes] = await Promise.all([
        axios.get('/api/attempts/analytics'),
        axios.get('/api/auth/me')
      ]);
      setAnalytics(analyticsRes.data.data);
      if (refreshUser) {
        refreshUser(userRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      label: 'Total Attempts', 
      value: analytics?.totalAttempts || 0, 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'blue' 
    },
    { 
      label: 'Average Score', 
      value: `${analytics?.averageScore || 0}%`, 
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      color: 'purple' 
    },
    { 
      label: 'Progress Score', 
      value: `${user?.progressScore || analytics?.progressScore || 0}%`, 
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'emerald' 
    },
    { 
      label: 'Weak Areas', 
      value: analytics?.weakAreas?.length || 0, 
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      color: 'rose' 
    },
  ];

  const improvementData = analytics?.improvementTrend?.length > 0 ? {
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
    }],
  } : null;

  const categoryData = analytics?.categoryScores?.length > 0 ? {
    labels: analytics.categoryScores.map(c => c.category),
    datasets: [{
      label: 'Average Score',
      data: analytics.categoryScores.map(c => c.averageScore),
      backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'],
      borderRadius: 8,
    }],
  } : null;

  const difficultyData = analytics?.difficultyScores?.length > 0 ? {
    labels: analytics.difficultyScores.map(d => d.difficulty),
    datasets: [{
      data: analytics.difficultyScores.map(d => d.count),
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: { 
      y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
      x: { grid: { display: false } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
    },
    cutout: '65%',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Performance Analytics</h1>
        <p className="text-slate-500 mt-1">Track your progress and identify areas for improvement</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {stats.map((stat, idx) => (
          <div key={idx} className={`card p-4 sm:p-5 lg:p-6 ${
            stat.color === 'blue' ? 'border-l-4 border-l-blue-500 bg-blue-50/50' :
            stat.color === 'purple' ? 'border-l-4 border-l-purple-500 bg-purple-50/50' :
            stat.color === 'emerald' ? 'border-l-4 border-l-emerald-500 bg-emerald-50/50' :
            'border-l-4 border-l-rose-500 bg-rose-50/50'
          }`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 rounded-xl ${
                stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                stat.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                'bg-rose-100 text-rose-600'
              }`}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{stat.label}</p>
                <p className={`text-xl sm:text-2xl font-bold ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'purple' ? 'text-purple-600' :
                  stat.color === 'emerald' ? 'text-emerald-600' :
                  'text-rose-600'
                }`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Performance Trend */}
        <div className="card p-4 sm:p-5 lg:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 sm:mb-6">Performance Trend</h2>
          {improvementData ? (
            <div className="h-52 sm:h-64 lg:h-72">
              <Line data={improvementData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-52 sm:h-64 lg:h-72 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">No data available yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Category Performance */}
        <div className="card p-4 sm:p-5 lg:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 sm:mb-6">Performance by Category</h2>
          {categoryData ? (
            <div className="h-52 sm:h-64 lg:h-72">
              <Bar data={categoryData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-52 sm:h-64 lg:h-72 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
                <p className="text-sm">No data available yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Attempts by Difficulty */}
        <div className="card p-4 sm:p-5 lg:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 sm:mb-6">Attempts by Difficulty</h2>
          {difficultyData ? (
            <div className="h-56 sm:h-64">
              <Doughnut data={difficultyData} options={doughnutOptions} />
            </div>
          ) : (
            <div className="h-56 sm:h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
                <p className="text-sm">No data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Weak Areas */}
        <div className="card p-4 sm:p-5 lg:p-6 xl:col-span-2">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 sm:mb-6">Areas Needing Improvement</h2>
          {analytics?.weakAreas?.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {analytics.weakAreas.map((area, idx) => (
                <div key={idx} className="p-3 sm:p-4 bg-rose-50/70 rounded-xl border border-rose-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-rose-800 text-sm sm:text-base">{area.category}</span>
                    <span className="text-rose-600 font-bold text-sm sm:text-base">{area.score}%</span>
                  </div>
                  <div className="h-2 bg-rose-200 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${area.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-slate-400">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm sm:text-base">Great job! No weak areas identified yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown Table */}
      {analytics?.categoryScores?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">Category Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="text-left py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold text-slate-600">Category</th>
                  <th className="text-left py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold text-slate-600">Average Score</th>
                  <th className="text-left py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold text-slate-600 hidden sm:table-cell">Attempts</th>
                  <th className="text-left py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold text-slate-600">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.categoryScores.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 sm:py-4 px-4 sm:px-6 font-medium text-slate-800 text-sm">{cat.category}</td>
                    <td className="py-3 sm:py-4 px-4 sm:px-6">
                      <span className={`font-bold text-sm ${
                        cat.averageScore >= 80 ? 'text-emerald-600' :
                        cat.averageScore >= 60 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>{cat.averageScore}%</span>
                    </td>
                    <td className="py-3 sm:py-4 px-4 sm:px-6 text-slate-600 hidden sm:table-cell">{cat.count}</td>
                    <td className="py-3 sm:py-4 px-4 sm:px-6">
                      <div className="w-24 sm:w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            cat.averageScore >= 80 ? 'bg-emerald-500' :
                            cat.averageScore >= 60 ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}
                          style={{ width: `${cat.averageScore}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">Recent Activity</h2>
        </div>
        {analytics?.recentAttempts?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {analytics.recentAttempts.map((attempt) => (
              <div key={attempt._id} className="p-3 sm:p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate text-sm sm:text-base">{attempt.question?.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {attempt.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full hidden xs:inline">
                      {attempt.difficulty}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-sm ${
                  attempt.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                  attempt.score >= 60 ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {attempt.score}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center text-slate-400">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm sm:text-base">No recent activity to show</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
