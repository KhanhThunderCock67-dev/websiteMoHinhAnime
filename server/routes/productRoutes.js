const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFeaturedProducts,
  getLowStockProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public catalog routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/low-stock', protect, authorize('admin'), getLowStockProducts);
router.get('/:identifier', getProductByIdOrSlug);

// Admin management routes
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
