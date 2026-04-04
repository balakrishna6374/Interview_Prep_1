const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const User = require('../models/User');

exports.submitAnswer = async (req, res, next) => {
  try {
    const { questionId, answer, timeSpent } = req.body;
    const userId = req.user.id;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    const score = calculateScore(answer, question.keywords, question.sampleAnswer);
    const feedback = generateFeedback(score, answer, question.keywords);

    const attempt = await Attempt.create({
      user: userId,
      question: questionId,
      answer,
      score,
      timeSpent,
      feedback,
      category: question.category,
      difficulty: question.difficulty
    });

    const user = await User.findById(userId);
    user.totalAttempts += 1;

    const allAttempts = await Attempt.find({ user: userId });

    const totalScore =
      allAttempts.reduce((sum, att) => sum + (att.score || 0), 0);

    user.averageScore = Math.round(totalScore / user.totalAttempts);

    if (!user.completedQuestions.includes(questionId)) {
      user.completedQuestions.push(questionId);
      const totalQuestions = await Question.countDocuments();
      user.progressScore = Math.round(
        (user.completedQuestions.length / totalQuestions) * 100
      );
    }

    await user.save();

    await attempt.populate('question');

    res.status(201).json({
      success: true,
      data: {
        attempt,
        score,
        feedback,
        userStats: {
          totalAttempts: user.totalAttempts,
          averageScore: user.averageScore,
          progressScore: user.progressScore
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyAttempts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const total = await Attempt.countDocuments({ user: req.user.id });

    const attempts = await Attempt.find({ user: req.user.id })
      .populate('question')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: attempts
    });
  } catch (err) {
    next(err);
  }
};

exports.getAttemptById = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('question');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found'
      });
    }

    if (attempt.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this attempt'
      });
    }

    res.status(200).json({
      success: true,
      data: attempt
    });
  } catch (err) {
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const mongoose = require('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const totalAttempts = await Attempt.countDocuments({ user: userId });

    const averageScore = await Attempt.aggregate([
      { $match: { user: userObjectId } },
      { $group: { _id: null, avg: { $avg: '$score' } } }
    ]);

    const categoryScores = await Attempt.aggregate([
      { $match: { user: userObjectId } },
      { $group: { _id: '$category', avg: { $avg: '$score' }, count: { $sum: 1 } } }
    ]);

    const difficultyScores = await Attempt.aggregate([
      { $match: { user: userObjectId } },
      { $group: { _id: '$difficulty', avg: { $avg: '$score' }, count: { $sum: 1 } } }
    ]);

    const recentAttempts = await Attempt.find({ user: userId })
      .populate('question')
      .sort({ createdAt: -1 })
      .limit(10);

    const weakAreas = categoryScores
      .filter(c => c.avg < 60)
      .map(c => ({
        category: c._id,
        score: Math.round(c.avg)
      }));

    const improvementTrend = await Attempt.aggregate([
      { $match: { user: userObjectId } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          avgScore: { $avg: '$score' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    const avgScore =
      averageScore.length > 0
        ? Math.round(averageScore[0].avg)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalAttempts,
        averageScore: avgScore,
        categoryScores: categoryScores.map(c => ({
          category: c._id,
          averageScore: Math.round(c.avg),
          count: c.count
        })),
        difficultyScores: difficultyScores.map(d => ({
          difficulty: d._id,
          averageScore: Math.round(d.avg),
          count: d.count
        })),
        recentAttempts,
        weakAreas,
        improvementTrend: improvementTrend.map(t => ({
          date: t._id,
          averageScore: Math.round(t.avgScore)
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};

function calculateScore(answer, keywords, sampleAnswer) {
  if (!answer || answer.trim().length === 0) {
    return 0;
  }

  const answerLower = answer.toLowerCase();
  let score = 0;
  let keywordMatches = 0;

  if (keywords && keywords.length > 0) {
    keywords.forEach(keyword => {
      if (answerLower.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    });
    score = Math.round((keywordMatches / keywords.length) * 70);
  }

  const lengthScore = Math.min(30, Math.round((answer.length / 500) * 30));
  score += lengthScore;

  return Math.min(100, Math.max(0, score));
}

function generateFeedback(score, answer, keywords) {
  let feedback = '';

  if (score >= 80) {
    feedback = 'Excellent answer! You covered the key points well.';
  } else if (score >= 60) {
    feedback = 'Good answer, but could be more comprehensive.';
  } else if (score >= 40) {
    feedback = 'Fair attempt. Try to include more relevant details.';
  } else {
    feedback = 'Needs improvement. Review the topic and try again.';
  }

  if (keywords && keywords.length > 0) {
    const missingKeywords = keywords.filter(
      kw => !answer.toLowerCase().includes(kw.toLowerCase())
    );

    if (missingKeywords.length > 0) {
      feedback += ` Consider including: ${missingKeywords
        .slice(0, 3)
        .join(', ')}`;
    }
  }

  return feedback;
}