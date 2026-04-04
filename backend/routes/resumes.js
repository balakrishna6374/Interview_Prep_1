const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');

const {
  uploadResume,
  analyzeResume,
  getMyAnalyses,
  getAnalysisById,
  getSkillDatabase
} = require('../controllers/resumeController');

router.get('/skills', protect, getSkillDatabase);

router.post('/analyze', protect, uploadResume, analyzeResume);

router.get('/', protect, getMyAnalyses);

router.get('/:id', protect, getAnalysisById);

module.exports = router;