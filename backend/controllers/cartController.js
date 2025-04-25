const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id })
    .populate({
      path: 'items.product',
      select: 'name price imageUrl category'
    });

  if (!cart) {
    // Create a new cart if user doesn't have one
    cart = await Cart.create({
      user: req.user.id,
      items: []
    });
  }

  // Calculate cart totals
  const totals = cart.calculateTotals();

  res.status(200).json({
    status: 'success',
    data: {
      items: cart.items,
      coupon: cart.coupon,
      totals
    }
  });
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse(`No product found with id ${productId}`, 404));
  }

  // Check if product is in stock
  if (product.countInStock < quantity) {
    return next(new ErrorResponse(`Not enough items in stock. Available: ${product.countInStock}`, 400));
  }

  // Find user's cart or create one
  let cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      items: []
    });
  }

  // Check if product already exists in cart
  const itemIndex = cart.items.findIndex(item => 
    item.product.toString() === productId
  );

  if (itemIndex > -1) {
    // If product exists, update quantity
    cart.items[itemIndex].quantity += quantity;
  } else {
    // If not, add new item
    cart.items.push({
      product: productId,
      quantity
    });
  }

  await cart.save();

  // Populate product details for response
  await cart.populate('items.product', 'name price imageUrl');
  
  // Calculate cart totals
  const totals = cart.calculateTotals();

  res.status(200).json({
    status: 'success',
    data: {
      items: cart.items,
      coupon: cart.coupon,
      totals
    }
  });
});

// @desc    Update cart item quantity
// @route   POST /api/cart/update
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;

  // Validate required fields
  if (!productId || !quantity) {
    return next(new ErrorResponse('Product ID and quantity are required', 400));
  }

  // Validate quantity
  if (quantity < 1) {
    return next(new ErrorResponse('Quantity must be at least 1', 400));
  }

  // Find user's cart
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  // Find the item in the cart
  const itemIndex = cart.items.findIndex(item => 
    item.product.toString() === productId
  );

  if (itemIndex === -1) {
    return next(new ErrorResponse('Item not found in cart', 404));
  }

  // Check if product is in stock
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse(`No product found with id ${productId}`, 404));
  }

  if (product.countInStock < quantity) {
    return next(new ErrorResponse(`Not enough items in stock. Available: ${product.countInStock}`, 400));
  }

  // Update quantity
  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  // Populate product details for response
  await cart.populate('items.product', 'name price imageUrl');
  
  // Calculate cart totals
  const totals = cart.calculateTotals();

  res.status(200).json({
    status: 'success',
    data: {
      items: cart.items,
      coupon: cart.coupon,
      totals
    }
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:id
// @access  Private
exports.removeCartItem = asyncHandler(async (req, res, next) => {
  const productId = req.params.id;

  // Find user's cart
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  // Remove the item from the cart
  cart.items = cart.items.filter(item => 
    item.product.toString() !== productId
  );

  await cart.save();

  // Populate product details for response
  await cart.populate('items.product', 'name price imageUrl');
  
  // Calculate cart totals
  const totals = cart.calculateTotals();

  res.status(200).json({
    status: 'success',
    data: {
      items: cart.items,
      coupon: cart.coupon,
      totals
    }
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  cart.items = [];
  cart.coupon = null;
  await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      items: [],
      coupon: null,
      totals: {
        subtotal: 0,
        discount: 0,
        shipping: 0,
        tax: 0,
        total: 0
      }
    }
  });
});

// @desc    Apply coupon to cart
// @route   POST /api/cart/apply-coupon
// @access  Private
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return next(new ErrorResponse('Coupon code is required', 400));
  }

  // Find the coupon
  const coupon = await Coupon.findOne({ 
    code: code.toUpperCase(),
    isActive: true 
  });

  if (!coupon) {
    return next(new ErrorResponse('Invalid coupon code', 404));
  }

  // Find user's cart
  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'name price');
  
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  // Calculate subtotal
  const subtotal = cart.items.reduce(
    (sum, item) => sum + (item.product.price * item.quantity),
    0
  );

  // Check if coupon is valid
  const { valid, message } = coupon.isValid(subtotal);
  if (!valid) {
    return next(new ErrorResponse(message, 400));
  }

  // Apply the coupon
  cart.coupon = {
    code: coupon.code,
    discountPercentage: coupon.discountPercentage,
    expiryDate: coupon.expiryDate
  };

  await cart.save();

  // Increment coupon usage
  coupon.usageCount += 1;
  await coupon.save();

  // Calculate cart totals with applied coupon
  const totals = cart.calculateTotals();

  res.status(200).json({
    status: 'success',
    data: {
      items: cart.items,
      coupon: cart.coupon,
      totals
    }
  });
});

// @desc    Remove coupon from cart
// @route   POST /api/cart/remove-coupon
// @access  Private
exports.removeCoupon = asyncHandler(async (req, res, next) => {
  // Find user's cart
  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'name price');
  
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  // Remove the coupon
  cart.coupon = null;
  await cart.save();

  // Calculate cart totals
  const totals = cart.calculateTotals();

  res.status(200).json({
    status: 'success',
    data: {
      items: cart.items,
      coupon: null,
      totals
    }
  });
});