const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  // Get user cart
  const cart = await Cart.findOne({ user: req.user.id })
    .populate({
      path: 'items.product',
      select: 'name price stock mainImage'
    })
    .populate('coupon');
  
  if (!cart || cart.items.length === 0) {
    return next(new ErrorResponse('Your cart is empty', 400));
  }
  
  // Check if all products are in stock
  for (const item of cart.items) {
    if (!item.product) {
      return next(new ErrorResponse('One or more products in your cart are no longer available', 400));
    }
    
    if (item.product.stock !== null && item.product.stock !== undefined && 
        item.product.stock < item.quantity) {
      return next(
        new ErrorResponse(`Insufficient stock for ${item.product.name}. Available: ${item.product.stock}`, 400)
      );
    }
  }
  
  // Create order items from cart items
  const orderItems = cart.items.map(item => ({
    product: item.product._id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.price,
    image: item.product.mainImage,
    variant: item.variant
  }));
  
  // Get shipping info, payment info, etc. from request body
  const {
    shippingAddress,
    paymentMethod,
    shippingPrice = 0,
    taxPrice = 0,
    notes
  } = req.body;
  
  // Validate required fields
  if (!shippingAddress) {
    return next(new ErrorResponse('Shipping address is required', 400));
  }
  
  if (!paymentMethod) {
    return next(new ErrorResponse('Payment method is required', 400));
  }
  
  // Calculate prices
  const itemsPrice = cart.subtotal;
  const discountPrice = cart.couponDiscount || 0;
  
  // Create new order
  const order = await Order.create({
    user: req.user.id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    discountPrice,
    coupon: cart.coupon,
    totalPrice: cart.total + taxPrice + shippingPrice,
    notes
  });
  
  // Update product stock
  for (const item of cart.items) {
    if (item.product.stock !== null && item.product.stock !== undefined) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { 
          stock: -item.quantity,
          sales: item.quantity
        }
      });
    }
  }
  
  // Clear cart after order is created
  cart.items = [];
  cart.coupon = null;
  cart.couponDiscount = 0;
  cart.subtotal = 0;
  cart.total = 0;
  await cart.save();
  
  res.status(201).json({
    success: true,
    data: order
  });
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
  
  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate({
      path: 'user',
      select: 'name email'
    })
    .populate('coupon');
  
  if (!order) {
    return next(new ErrorResponse(`No order found with id of ${req.params.id}`, 404));
  }
  
  // Check if user is admin or the order belongs to the user
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this order', 401));
  }
  
  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new ErrorResponse(`No order found with id of ${req.params.id}`, 404));
  }
  
  // Check if user is admin or the order belongs to the user
  if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this order', 401));
  }
  
  // Check if order is already paid
  if (order.isPaid) {
    return next(new ErrorResponse('Order is already paid', 400));
  }
  
  // Update order payment status
  order.isPaid = true;
  order.paidAt = Date.now();
  
  // Add payment result info from payment processor
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer ? req.body.payer.email_address : null
  };
  
  const updatedOrder = await order.save();
  
  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new ErrorResponse('Please provide an order status', 400));
  }
  
  // Validate status value
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse(`Status must be one of: ${validStatuses.join(', ')}`, 400));
  }
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new ErrorResponse(`No order found with id of ${req.params.id}`, 404));
  }
  
  // Update order status and related timestamps
  order.status = status;
  
  if (status === 'shipped' && !order.isShipped) {
    order.isShipped = true;
    order.shippedAt = Date.now();
  } else if (status === 'delivered' && !order.isDelivered) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }
  
  // If cancelling, restore product stock if the order was not already cancelled
  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const item of order.orderItems) {
      // Increment stock and decrement sales
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 
          stock: item.quantity,
          sales: -item.quantity
        }
      });
    }
  }
  
  const updatedOrder = await order.save();
  
  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = asyncHandler(async (req, res, next) => {
  // Setup pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Setup filtering
  const filterObj = {};
  
  if (req.query.status) {
    filterObj.status = req.query.status;
  }
  
  // Check if we need to filter by date range
  if (req.query.startDate && req.query.endDate) {
    filterObj.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  
  // Setup sorting
  let sort = '-createdAt'; // Default sort by newest
  if (req.query.sort) {
    sort = req.query.sort;
  }
  
  // Count total documents for pagination
  const total = await Order.countDocuments(filterObj);
  
  // Get paginated orders
  const orders = await Order.find(filterObj)
    .populate({
      path: 'user',
      select: 'name email'
    })
    .sort(sort)
    .skip(startIndex)
    .limit(limit);
  
  // Pagination result
  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
  
  // If there is a next page
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  // If there is a previous page
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    pagination,
    data: orders
  });
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new ErrorResponse(`No order found with id of ${req.params.id}`, 404));
  }
  
  // Only allow deletion of cancelled orders
  if (order.status !== 'cancelled') {
    return next(new ErrorResponse(`Can only delete cancelled orders`, 400));
  }
  
  await order.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// Add this function for dashboard statistics
// @desc    Get order statistics for dashboard
// @route   GET /api/orders/stats
// @access  Private/Admin
exports.getOrderStats = asyncHandler(async (req, res, next) => {
  // Get start of today, this week, this month
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const startOfMonth = new Date(today);
  startOfMonth.setDate(1);
  
  // Get count of orders by status
  const orderStatusStats = await Order.aggregate([
    { 
      $group: { 
        _id: "$status", 
        count: { $sum: 1 },
        total: { $sum: "$totalPrice" }
      }
    }
  ]);
  
  // Get orders per day for the last 7 days
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  const dailyOrders = await Order.aggregate([
    {
      $match: { createdAt: { $gte: sevenDaysAgo } }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        total: { $sum: "$totalPrice" }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Get all total stats
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
  ]);
  
  // Get today's stats
  const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
  const todayRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: today } } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      todayOrders,
      todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0,
      orderStatusStats,
      dailyOrders
    }
  });
});