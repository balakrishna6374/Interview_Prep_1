const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const {
  register,
  login,
  logout,
  getMe,
  updateProfile
} = require('../controllers/authController');

router.post('/register',
  upload.single('profileImage'),
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required'),

    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),

    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  register
);

router.post('/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),

    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  login
);

router.get('/logout', protect, logout);

router.get('/me', protect, getMe);

router.put('/profile',
  protect,
  upload.single('profileImage'),
  [
    body('name')
      .optional({ checkFalsy: true })
      .notEmpty()
      .withMessage('Name cannot be empty')
  ],
  updateProfile
);
module.exports = router;