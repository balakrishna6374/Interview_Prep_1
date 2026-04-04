const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const gamificationController = require('../controllers/gamificationController');

router.get('/', protect, gamificationController.getGamificationData);
router.post('/claim-reward', protect, gamificationController.claimMissionReward);
router.post('/increment-questions', protect, gamificationController.incrementQuestionsAnswered);
router.post('/increment-interviews', protect, gamificationController.incrementInterviewsCompleted);
router.post('/increment-chat', protect, gamificationController.incrementChatMessages);

module.exports = router;
