const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { getApiStats } = require('../middleware/apiTracker');

const {
  getAllUsers,
  getUserById,
  deleteUser,
  getAllQuestions,
  getSystemAnalytics,
  updateUser
} = require('../controllers/adminController');

router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/questions', getAllQuestions);

router.get('/analytics', getSystemAnalytics);

router.get('/api-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await getApiStats(startDate, endDate);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching API stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API statistics'
    });
  }
});

module.exports = router;