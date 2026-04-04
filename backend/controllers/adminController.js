const User = require('../models/User');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');

exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('savedQuestions')
      .populate('completedQuestions');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const attempts = await Attempt.find({ user: req.params.id });

    const totalAttempts = attempts.length;

    const averageScore =
      attempts.length > 0
        ? Math.round(
            attempts.reduce((sum, a) => sum + (a.score || 0), 0) /
              attempts.length
          )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          totalAttempts,
          averageScore
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete admin user'
      });
    }

    await Attempt.deleteMany({ user: req.params.id });
    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { category, difficulty, search } = req.query;

    let query = {};

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Question.countDocuments(query);

    const questions = await Question.find(query)
      .populate('createdBy', 'name email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: questions
    });
  } catch (err) {
    next(err);
  }
};

exports.getSystemAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalAttempts = await Attempt.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });

    const categoryDistribution = await Question.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const difficultyDistribution = await Question.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    const recentUsers = await User.find()
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAttempts = await Attempt.find()
      .populate('user', 'name email')
      .populate('question', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    const averageUserScore = await Attempt.aggregate([
      { $group: { _id: '$user', avg: { $avg: '$score' } } },
      { $group: { _id: null, avg: { $avg: '$avg' } } }
    ]);

    const avgScore =
      averageUserScore.length > 0
        ? Math.round(averageUserScore[0].avg)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalQuestions,
          totalAttempts,
          adminCount,
          userCount: totalUsers - adminCount
        },
        categoryDistribution: categoryDistribution.map(c => ({
          category: c._id,
          count: c.count
        })),
        difficultyDistribution: difficultyDistribution.map(d => ({
          difficulty: d._id,
          count: d.count
        })),
        recentUsers,
        recentAttempts,
        averageUserScore: avgScore
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};