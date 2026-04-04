const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');

const {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  saveQuestion,
  unsaveQuestion,
  markCompleted,
  getRandomQuestions
} = require('../controllers/questionController');

router.get('/random', protect, getRandomQuestions);

router.get('/', protect, getQuestions);
router.get('/:id', protect, getQuestion);

router.post(
  '/',
  protect,
  [
    body('title')
      .notEmpty()
      .withMessage('Title is required'),

    body('description')
      .notEmpty()
      .withMessage('Description is required'),

    body('category')
      .isIn(['Technical', 'Behavioral', 'System Design'])
      .withMessage('Invalid category'),

    body('difficulty')
      .isIn(['Easy', 'Medium', 'Hard'])
      .withMessage('Invalid difficulty')
  ],
  createQuestion
);

router.put('/:id', protect, updateQuestion);

router.delete('/:id', protect, deleteQuestion);

router.post('/:id/save', protect, saveQuestion);

router.delete('/:id/save', protect, unsaveQuestion);

router.post('/:id/complete', protect, markCompleted);

module.exports = router;