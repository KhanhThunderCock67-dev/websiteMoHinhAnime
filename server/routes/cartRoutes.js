const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncGuestCart,
} = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

// All cart routes require user authentication
router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/sync', syncGuestCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
