const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createOrder,
  getOrderById,
  updateOrderStatus,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  deleteOrder
} = require('../controllers/orderController');

// Routes that require authentication
router.use(protect);

// User routes
router.route('/')
  .post(createOrder)
  .get(authorize('admin'), getOrders);

router.route('/myorders')
  .get(getMyOrders);

router.route('/:id')
  .get(getOrderById)
  .delete(authorize('admin'), deleteOrder);

router.route('/:id/pay')
  .put(updateOrderToPaid);

router.route('/:id/status')
  .put(authorize('admin'), updateOrderStatus);

module.exports = router;