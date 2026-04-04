const User = require('../models/User');

const BADGES = {
  FIRST_STEP: { id: 'first_step', name: 'First Step', description: 'Complete your first interview', icon: '🎯' },
  WARM_UP: { id: 'warm_up', name: 'Warm Up', description: 'Answer 10 questions', icon: '🔥' },
  CONSISTENT: { id: 'consistent', name: 'Consistent', description: 'Maintain a 7-day streak', icon: '⭐' },
  DEDICATED: { id: 'dedicated', name: 'Dedicated', description: 'Maintain a 30-day streak', icon: '💪' },
  PERFECT_SCORE: { id: 'perfect_score', name: 'Perfect Score', description: 'Get 100% on an interview', icon: '💯' },
  SPEED_DEMON: { id: 'speed_demon', name: 'Speed Demon', description: 'Complete 5 interviews in one day', icon: '⚡' },
  EARLY_BIRD: { id: 'early_bird', name: 'Early Bird', description: 'Login before 8 AM', icon: '🌅' },
  NIGHT_OWL: { id: 'night_owl', name: 'Night Owl', description: 'Practice after 10 PM', icon: '🦉' },
  CHAT_MASTER: { id: 'chat_master', name: 'Chat Master', description: 'Send 50 messages to AI Coach', icon: '💬' },
  OVERACHIEVER: { id: 'overachiever', name: 'Overachiever', description: 'Complete 100 questions', icon: '🏆' },
  MILLENNIUM: { id: 'millennium', name: 'Millennium', description: 'Earn 1000 points', icon: '💎' },
  WEEKEND_WARRIOR: { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Complete 3 interviews on weekend', icon: '🎪' },
  STAR_STUDENT: { id: 'star_student', name: 'Star Student', description: 'Use STAR method 20 times', icon: '🌟' },
  PROBLEM_SOLVER: { id: 'problem_solver', name: 'Problem Solver', description: 'Fix 10 code errors', icon: '🔧' },
  SOCIAL_BUTTERFLY: { id: 'social_butterfly', name: 'Social Butterfly', description: 'Share your progress', icon: '🦋' }
};

const MISSIONS = {
  DAILY_LOGIN: { id: 'daily_login', title: 'Keep the Streak', description: 'Practice today to maintain your daily streak', type: 'daily', target: 1, reward: 10 },
  FIRST_INTERVIEW: { id: 'first_interview', title: 'First Steps', description: 'Complete your very first mock interview', type: 'one-time', target: 1, reward: 50 },
  THREE_INTERVIEWS: { id: 'three_interviews', title: 'Getting Comfortable', description: 'Complete 3 mock interviews to build confidence', type: 'one-time', target: 3, reward: 100 },
  ASK_AI: { id: 'ask_ai', title: 'Chat Daily', description: 'Ask the AI Coach 5 questions today', type: 'daily', target: 5, reward: 25 },
  PERFECT_DAY: { id: 'perfect_day', title: 'Ace It', description: 'Score 80% or higher on any interview', type: 'daily', target: 1, reward: 75 },
  WEEKLY_GRIND: { id: 'weekly_grind', title: 'Weekly Warrior', description: 'Answer 10 practice questions this week', type: 'weekly', target: 10, reward: 150 },
  SPEED_RUN: { id: 'speed_run', title: 'Triple Threat', description: 'Complete 3 interviews in one day', type: 'daily', target: 3, reward: 100 },
  STAR_MASTER: { id: 'star_master', title: 'STAR Method', description: 'Master the STAR technique 5 times', type: 'weekly', target: 5, reward: 80 }
};

const calculateLevel = (points) => {
  if (points < 100) return 1;
  if (points < 300) return 2;
  if (points < 600) return 3;
  if (points < 1000) return 4;
  if (points < 1500) return 5;
  if (points < 2500) return 6;
  if (points < 4000) return 7;
  if (points < 6000) return 8;
  if (points < 9000) return 9;
  return 10;
};

const getLevelProgress = (points) => {
  const levels = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, Infinity];
  const currentLevel = calculateLevel(points);
  const currentLevelPoints = levels[currentLevel - 1] || 0;
  const nextLevelPoints = levels[currentLevel] || Infinity;
  const progress = currentLevelPoints === nextLevelPoints ? 100 : 
    ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
  return Math.min(Math.round(progress), 100);
};

exports.getGamificationData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.gamification) {
      user.gamification = {
        points: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date(),
        badges: [],
        missions: Object.values(MISSIONS).map(m => ({
          ...m,
          progress: 0,
          completed: false,
          claimed: false
        })),
        totalQuestionsAnswered: 0,
        totalInterviewsCompleted: 0,
        totalChatMessages: 0
      };
      await user.save();
    }

    await updateStreak(user);
    await updateMissions(user);

    res.json({
      success: true,
      data: {
        points: user.gamification.points,
        level: user.gamification.level,
        streak: user.gamification.streak,
        longestStreak: user.gamification.longestStreak,
        levelProgress: getLevelProgress(user.gamification.points),
        badges: user.gamification.badges,
        missions: user.gamification.missions,
        totalQuestionsAnswered: user.gamification.totalQuestionsAnswered,
        totalInterviewsCompleted: user.gamification.totalInterviewsCompleted,
        totalChatMessages: user.gamification.totalChatMessages,
        availableBadges: Object.values(BADGES)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.awardPoints = async (userId, points, reason) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.gamification.points += points;
    user.gamification.level = calculateLevel(user.gamification.points);
    await user.save();

    await checkAndAwardBadges(user);
    await updateMissions(user);

    return user.gamification;
  } catch (err) {
    console.error('Error awarding points:', err);
  }
};

exports.incrementQuestionsAnswered = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.gamification.totalQuestionsAnswered += 1;
    
    await user.save();
    await this.awardPoints(req.user.id, 5, 'Question answered');
    
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.incrementInterviewsCompleted = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.gamification.totalInterviewsCompleted += 1;
    
    await user.save();
    await this.awardPoints(req.user.id, 20, 'Interview completed');
    
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.incrementChatMessages = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.gamification.totalChatMessages += 1;
    
    await user.save();
    await this.awardPoints(req.user.id, 1, 'Chat message');
    
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

async function updateStreak(user) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = new Date(user.gamification.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return;
  } else if (diffDays === 1) {
    user.gamification.streak += 1;
    if (user.gamification.streak > user.gamification.longestStreak) {
      user.gamification.longestStreak = user.gamification.streak;
    }
  } else {
    user.gamification.streak = 1;
  }
  
  user.gamification.lastActiveDate = new Date();
  await user.save();
  
  await checkStreakBadges(user);
}

async function checkAndAwardBadges(user) {
  const badges = user.gamification.badges || [];
  const hasBadge = (id) => badges.some(b => b.id === id);
  const awardBadge = async (badge) => {
    if (!hasBadge(badge.id)) {
      badges.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        earnedAt: new Date()
      });
    }
  };

  if (user.gamification.totalInterviewsCompleted >= 1 && !hasBadge('first_step')) {
    await awardBadge(BADGES.FIRST_STEP);
  }
  if (user.gamification.totalQuestionsAnswered >= 10 && !hasBadge('warm_up')) {
    await awardBadge(BADGES.WARM_UP);
  }
  if (user.gamification.streak >= 7 && !hasBadge('consistent')) {
    await awardBadge(BADGES.CONSISTENT);
  }
  if (user.gamification.streak >= 30 && !hasBadge('dedicated')) {
    await awardBadge(BADGES.DEDICATED);
  }
  if (user.gamification.points >= 1000 && !hasBadge('millennium')) {
    await awardBadge(BADGES.MILLENNIUM);
  }
  if (user.gamification.totalQuestionsAnswered >= 100 && !hasBadge('overachiever')) {
    await awardBadge(BADGES.OVERACHIEVER);
  }
  if (user.gamification.totalChatMessages >= 50 && !hasBadge('chat_master')) {
    await awardBadge(BADGES.CHAT_MASTER);
  }

  user.gamification.badges = badges;
  await user.save();
}

async function checkStreakBadges(user) {
  const badges = user.gamification.badges || [];
  const hasBadge = (id) => badges.some(b => b.id === id);
  
  if (user.gamification.streak >= 7 && !hasBadge('consistent')) {
    badges.push({
      id: BADGES.CONSISTENT.id,
      name: BADGES.CONSISTENT.name,
      description: BADGES.CONSISTENT.description,
      icon: BADGES.CONSISTENT.icon,
      earnedAt: new Date()
    });
  }
  if (user.gamification.streak >= 30 && !hasBadge('dedicated')) {
    badges.push({
      id: BADGES.DEDICATED.id,
      name: BADGES.DEDICATED.name,
      description: BADGES.DEDICATED.description,
      icon: BADGES.DEDICATED.icon,
      earnedAt: new Date()
    });
  }
  
  user.gamification.badges = badges;
  await user.save();
}

async function updateMissions(user) {
  const missions = user.gamification.missions;
  
  missions.forEach(mission => {
    if (mission.claimed) return;
    
    switch (mission.id) {
      case 'first_interview':
        mission.progress = user.gamification.totalInterviewsCompleted;
        break;
      case 'three_interviews':
        mission.progress = user.gamification.totalInterviewsCompleted;
        break;
      case 'ask_ai':
        mission.progress = user.gamification.totalChatMessages;
        break;
      case 'weekly_grind':
        mission.progress = user.gamification.totalQuestionsAnswered;
        break;
      case 'daily_login':
        mission.progress = user.gamification.streak;
        break;
      case 'perfect_day':
        mission.progress = user.gamification.totalInterviewsCompleted >= 1 ? 1 : 0;
        break;
      case 'speed_run':
        mission.progress = Math.min(user.gamification.totalInterviewsCompleted, mission.target);
        break;
      case 'star_master':
        mission.progress = Math.min(user.gamification.totalQuestionsAnswered, mission.target);
        break;
    }
    
    if (mission.progress >= mission.target && !mission.completed) {
      mission.completed = true;
      mission.completedAt = new Date();
    }
  });
  
  await user.save();
}

exports.resetDailyMissions = async (userId) => {
  try {
    const user = await User.findById(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    user.gamification.missions.forEach(mission => {
      if (mission.type === 'daily' && mission.completed) {
        mission.completed = false;
        mission.progress = 0;
      }
    });
    
    await user.save();
  } catch (err) {
    console.error('Error resetting missions:', err);
  }
};

exports.claimMissionReward = async (req, res) => {
  try {
    const { missionId } = req.body;
    const user = await User.findById(req.user.id);
    
    const mission = user.gamification.missions.find(m => m.id === missionId);
    
    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }
    
    if (mission.claimed) {
      return res.status(400).json({ success: false, error: 'Reward already claimed' });
    }
    
    if (mission.progress < mission.target) {
      return res.status(400).json({ success: false, error: 'Mission not completed yet' });
    }
    
    user.gamification.points += mission.reward;
    user.gamification.level = calculateLevel(user.gamification.points);
    
    mission.claimed = true;
    mission.completed = true;
    
    await user.save();
    
    res.json({
      success: true,
      data: {
        points: user.gamification.points,
        level: user.gamification.level,
        levelProgress: getLevelProgress(user.gamification.points),
        message: `Claimed ${mission.reward} points!`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
