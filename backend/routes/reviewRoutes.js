const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams allows us to access params from parent router
const { protect, authorize } = require('../middleware/auth');
const {
  getProductReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
  verifyReview
} = require('../controllers/reviewController');

// Get all reviews for a product (public)
router.route('/').get(getProductReviews);

// Add a review (requires authentication)
router.route('/').post(protect, addReview);

// Routes for specific reviews
router.route('/:id')
  .get(getReview)
  .put(protect, updateReview)
  .delete(protect, deleteReview);

// Verify a review (admin only)
router.route('/:id/verify').put(protect, authorize('admin'), verifyReview);

module.exports = router;