const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  updateAddress,
  sendVerificationEmail,
  verifyEmail
} = require('../controllers/userController');

// Protected routes - require authentication
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/address', updateAddress);
router.post('/send-verification-email', sendVerificationEmail);

// Public route for email verification
router.get('/verify-email/:token', verifyEmail);

module.exports = router;