const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');

const {
  submitAnswer,
  getMyAttempts,
  getAttemptById,
  getAnalytics
} = require('../controllers/attemptController');

router.post('/submit', protect, [
  body('questionId')
    .notEmpty()
    .withMessage('Question ID is required'),

  body('answer')
    .notEmpty()
    .withMessage('Answer is required'),

  body('timeSpent')
    .isNumeric()
    .withMessage('Time spent must be a number')
    .custom(value => value >= 0)
    .withMessage('Time spent must be greater than or equal to 0')
], submitAnswer);

router.get('/', protect, getMyAttempts);

router.get('/analytics', protect, getAnalytics);

router.get('/:id', protect, getAttemptById);

module.exports = router;