const express = require('express');
const router = express.Router();
const {
  handleMulterUpload,
  handleMulterReviewUpload,
  handleMulterReviewUploadMultiple,
} = require('../middlewares/uploadMiddleware');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { uploadImage, uploadMultipleImages } = require('../controllers/uploadController');

// POST /api/upload - Admin-only upload route for product catalog & banners
router.post('/', protect, authorize('admin'), handleMulterUpload('image'), uploadImage);

// POST /api/upload/review-images - Authenticated users can upload up to 5 real review photos into /uploads/reviews/
router.post('/review-images', protect, handleMulterReviewUploadMultiple('images', 5), uploadMultipleImages);

// POST /api/upload/review-image - Authenticated users single image upload helper into /uploads/reviews/
router.post('/review-image', protect, handleMulterReviewUpload('image'), uploadImage);

module.exports = router;
