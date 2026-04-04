import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Gamification = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      const response = await axios.get('/api/gamification');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (missionId) => {
    try {
      const response = await axios.post('/api/gamification/claim-reward', { missionId });
      if (response.data.success) {
        fetchGamificationData();
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const levelNames = ['', 'Beginner', 'Learner', 'Practitioner', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Pro', 'Elite', 'Legend'];
  const earnedBadges = data?.badges || [];
  const availableBadges = data?.availableBadges || [];
  const lockedBadges = availableBadges.filter(b => !earnedBadges.some(e => e.id === b.id));

  return (
    <div className="max-w-7xl w-full animate-fade-in">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Achievements</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Track your progress and earn rewards</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        <div className="xl:col-span-8 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {['overview', 'missions', 'badges'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-5 lg:p-6">
              {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard icon="⭐" value={data?.points || 0} label="Points" color="amber" />
                    <StatCard icon="📊" value={data?.level || 1} label="Level" color="blue" />
                    <StatCard icon="🔥" value={data?.streak || 0} label="Streak" color="red" />
                    <StatCard icon="🏅" value={earnedBadges.length} label="Badges" color="purple" />
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-sm font-bold text-amber-700">
                          Lv.{data?.level}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{levelNames[data?.level]}</span>
                      </div>
                      <span className="text-xs text-slate-500">{data?.levelProgress || 0}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${data?.levelProgress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {data?.points || 0} / {getNextLevelPoints(data?.level)} points to next level
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <MiniStatCard label="Questions" value={data?.totalQuestionsAnswered || 0} />
                    <MiniStatCard label="Interviews" value={data?.totalInterviewsCompleted || 0} />
                    <MiniStatCard label="Best Streak" value={`${data?.longestStreak || 0}d`} />
                  </div>
                </div>
              )}

              {activeTab === 'missions' && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">💡</span>
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base">How Missions Work</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <MissionInfo icon="📅" title="Daily" desc="Resets every midnight" color="amber" />
                      <MissionInfo icon="📆" title="Weekly" desc="Resets every Monday" color="blue" />
                      <MissionInfo icon="🎯" title="One-Time" desc="Complete once" color="purple" />
                    </div>
                  </div>

                  <MissionSection 
                    title="Daily Missions" 
                    icon="📅" 
                    badge="Resets at midnight" 
                    badgeColor="amber"
                    missions={data?.missions?.filter(m => m.type === 'daily') || []}
                    onClaim={claimReward}
                  />

                  <MissionSection 
                    title="Weekly Missions" 
                    icon="📆" 
                    badge="Resets Monday" 
                    badgeColor="blue"
                    missions={data?.missions?.filter(m => m.type === 'weekly') || []}
                    onClaim={claimReward}
                  />

                  <MissionSection 
                    title="One-Time Goals" 
                    icon="🎯" 
                    badge="Complete once" 
                    badgeColor="purple"
                    missions={data?.missions?.filter(m => m.type === 'one-time') || []}
                    onClaim={claimReward}
                  />
                </div>
              )}

              {activeTab === 'badges' && (
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Earned Badges ({earnedBadges.length})
                    </h3>
                    {earnedBadges.length === 0 ? (
                      <EmptyState message="Complete missions to earn badges" />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {earnedBadges.map((badge) => (
                          <BadgeCard key={badge.id} badge={badge} earned />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Locked Badges ({lockedBadges.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {lockedBadges.map((badge) => (
                        <BadgeCard key={badge.id} badge={badge} earned={false} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4 sm:space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-lg shadow-blue-500/25 flex-shrink-0">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span>${user?.name?.charAt(0)?.toUpperCase() || '?'}</span>`;
                    }}
                  />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate text-sm sm:text-base">{user?.name}</p>
                <p className="text-xs text-slate-500">{levelNames[data?.level]} Level</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Level Progress</span>
                <span className="font-medium text-slate-900">{data?.levelProgress || 0}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                  style={{ width: `${data?.levelProgress || 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm sm:text-base">Quick Stats</h3>
            <div className="space-y-2">
              <QuickStat icon="🔥" label="Current Streak" value={`${data?.streak || 0} days`} />
              <QuickStat icon="🏆" label="Best Streak" value={`${data?.longestStreak || 0} days`} />
              <QuickStat icon="⭐" label="Total Points" value={data?.points || 0} />
              <QuickStat icon="🏅" label="Badges" value={earnedBadges.length} />
              <QuickStat icon="📋" label="Missions Done" value={`${data?.missions?.filter(m => m.claimed).length || 0}/${data?.missions?.length || 0}`} color="amber" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 sm:p-5">
            <h3 className="font-semibold text-amber-900 mb-3 text-sm sm:text-base">Earn Points By</h3>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Complete interview (+20 pts)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Answer question (+5 pts)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Chat with AI Coach (+1 pt)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Complete missions (+varies)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ icon, value, label, color }) {
  const colors = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-500',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600'
  };
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-white flex items-center justify-center text-lg shadow-sm">
        {icon}
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function MiniStatCard({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function MissionInfo({ icon, title, desc, color }) {
  const colors = {
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700'
  };
  return (
    <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
      <span className="text-base">{icon}</span>
      <div>
        <p className={`font-medium text-xs sm:text-sm ${colors[color].replace('bg-', 'text-').replace('-100', '-700')}`}>{title}</p>
        <p className="text-[10px] sm:text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function MissionSection({ title, icon, badge, badgeColor, missions, onClaim }) {
  const completed = missions.filter(m => m.claimed).length;
  const colors = {
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700'
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${colors[badgeColor]}`}>
            {completed}/{missions.length} done
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} onClaim={onClaim} />
        ))}
      </div>
    </div>
  );
}

function MissionCard({ mission, onClaim }) {
  const isComplete = mission.progress >= mission.target && !mission.claimed;
  const isClaimed = mission.claimed;
  const progressPercent = Math.min((mission.progress / mission.target) * 100, 100);

  const getTypeBadge = () => {
    switch (mission.type) {
      case 'daily': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Daily', icon: '⚡' };
      case 'weekly': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Weekly', icon: '📊' };
      case 'one-time': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'One-Time', icon: '🏆' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-700', label: '', icon: '🎯' };
    }
  };

  const typeBadge = getTypeBadge();

  return (
    <div className={`border rounded-xl p-3 sm:p-4 transition-all ${
      isClaimed 
        ? 'border-emerald-200 bg-emerald-50/50' 
        : isComplete 
          ? 'border-amber-200 bg-amber-50/50' 
          : 'border-slate-200 bg-white hover:border-slate-300'
    }`}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
            isClaimed ? 'bg-emerald-100' : 'bg-slate-100'
          }`}>
            {isClaimed ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-base sm:text-lg">{typeBadge.icon}</span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-slate-900 text-xs sm:text-sm truncate">{mission.title}</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden sm:block">{mission.description}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
          isClaimed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          +{mission.reward}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isClaimed ? 'bg-emerald-500' : isComplete ? 'bg-amber-500' : 'bg-slate-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[10px] sm:text-xs text-slate-500 font-medium min-w-[40px] sm:min-w-[50px] text-right">
          {mission.progress}/{mission.target}
        </span>
      </div>

      {isComplete && !isClaimed && (
        <button
          onClick={() => onClaim(mission.id)}
          className="w-full mt-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          Claim {mission.reward} Points
        </button>
      )}

      {isClaimed && (
        <div className="mt-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Reward Claimed!
        </div>
      )}
    </div>
  );
}

function BadgeCard({ badge, earned }) {
  return (
    <div className={`border rounded-xl p-3 text-center transition-all ${
      earned 
        ? 'bg-slate-50 border-slate-200 hover:shadow-md' 
        : 'bg-slate-50/50 border-slate-100 opacity-60'
    }`}>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded-xl flex items-center justify-center text-xl sm:text-2xl ${
        earned ? 'bg-white shadow-sm' : 'bg-slate-100 grayscale'
      }`}>
        {earned ? badge.icon : '🔒'}
      </div>
      <h4 className={`text-xs font-medium ${earned ? 'text-slate-900' : 'text-slate-500'}`}>
        {badge.name}
      </h4>
      {earned && (
        <p className="text-[10px] text-slate-400 mt-1">
          {new Date(badge.earnedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function QuickStat({ icon, label, value, color = 'gray' }) {
  const textColors = {
    gray: 'text-slate-900',
    amber: 'text-amber-700',
    green: 'text-green-700'
  };
  return (
    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs sm:text-sm text-slate-600">{label}</span>
      </div>
      <span className={`text-sm font-bold ${textColors[color]}`}>{value}</span>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-8 sm:py-10 bg-slate-50 rounded-xl">
      <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 bg-slate-100 rounded-xl flex items-center justify-center">
        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-xs sm:text-sm text-slate-500">{message}</p>
    </div>
  );
}

function getNextLevelPoints(level) {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000];
  return thresholds[level] || thresholds[9];
}

export default Gamification;
