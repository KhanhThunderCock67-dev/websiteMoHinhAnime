const express = require('express');
const router = express.Router();
const {
  protect,
  authorize,
  optionalAuth,
} = require('../middlewares/authMiddleware');
const {
  getProductReviews,
  createOrUpdateReview,
  updateReview,
  deleteReview,
  toggleHelpfulVote,
  getAdminReviews,
  updateReviewStatus,
} = require('../controllers/reviewController');

// 1. Admin Moderation Routes
router.get('/admin', protect, authorize('admin'), getAdminReviews);
router.patch('/admin/:id/status', protect, authorize('admin'), updateReviewStatus);
router.delete('/admin/:id', protect, authorize('admin'), deleteReview);

// 2. Public / Customer Storefront Routes
router.get('/product/:productId', optionalAuth, getProductReviews);
router.post('/', protect, createOrUpdateReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/vote', protect, toggleHelpfulVote);

module.exports = router;
