const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon
} = require('../controllers/cartController');

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/update', updateCartItem);
router.delete('/item/:id', removeCartItem);
router.delete('/', clearCart);
router.post('/apply-coupon', applyCoupon);
router.post('/remove-coupon', removeCoupon);

module.exports = router;