const Question = require('../models/Question');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

const sanitizeInput = (input) => {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  });
};

exports.getQuestions = async (req, res, next) => {
  try {
    const category = req.query.category;
    const difficulty = req.query.difficulty;
    const search = req.query.search;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

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

exports.getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (err) {
    next(err);
  }
};

exports.createQuestion = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const sanitizedBody = {
      title: sanitizeInput(req.body.title),
      description: sanitizeInput(req.body.description),
      category: req.body.category,
      difficulty: req.body.difficulty,
      hints: req.body.hints ? sanitizeInput(req.body.hints) : undefined,
      solution: req.body.solution ? sanitizeInput(req.body.solution) : undefined,
      createdBy: req.user.id
    };

    const question = await Question.create(sanitizedBody);

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (err) {
    next(err);
  }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    let question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    if (
      question.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this question'
      });
    }

    const sanitizedBody = {};

    if (req.body.title) sanitizedBody.title = sanitizeInput(req.body.title);
    if (req.body.description) sanitizedBody.description = sanitizeInput(req.body.description);
    if (req.body.category) sanitizedBody.category = req.body.category;
    if (req.body.difficulty) sanitizedBody.difficulty = req.body.difficulty;
    if (req.body.hints) sanitizedBody.hints = sanitizeInput(req.body.hints);
    if (req.body.solution) sanitizedBody.solution = sanitizeInput(req.body.solution);

    question = await Question.findByIdAndUpdate(
      req.params.id,
      sanitizedBody,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    if (
      question.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this question'
      });
    }

    await question.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

exports.saveQuestion = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.savedQuestions.some(q => q.toString() === req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Question already saved'
      });
    }

    user.savedQuestions.push(req.params.id);
    await user.save();

    res.status(200).json({
      success: true,
      data: user.savedQuestions
    });
  } catch (err) {
    next(err);
  }
};

exports.unsaveQuestion = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.savedQuestions = user.savedQuestions.filter(
      q => q.toString() !== req.params.id
    );

    await user.save();

    res.status(200).json({
      success: true,
      data: user.savedQuestions
    });
  } catch (err) {
    next(err);
  }
};

exports.markCompleted = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.completedQuestions.some(q => q.toString() === req.params.id)) {
      user.completedQuestions.push(req.params.id);

      const totalQuestions = await Question.countDocuments();
      user.progressScore = Math.round(
        (user.completedQuestions.length / totalQuestions) * 100
      );

      await user.save();
    }

    res.status(200).json({
      success: true,
      data: user.completedQuestions
    });
  } catch (err) {
    next(err);
  }
};

exports.getRandomQuestions = async (req, res, next) => {
  try {
    const category = req.query.category;
    const difficulty = req.query.difficulty;
    const count = parseInt(req.query.count) || 5;

    let query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: count } }
    ]);

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (err) {
    next(err);
  }
};