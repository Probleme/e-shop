const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res, next) => {
  // Find cart for the current user
  let cart = await Cart.findOne({ user: req.user.id })
    .populate({
      path: 'items.product',
      select: 'name price slug mainImage stock'
    });
  
  // If no cart exists, create an empty one
  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      items: []
    });
  }
  
  // Recalculate totals to ensure they're up-to-date
  await updateCartTotals(cart);
  
  res.status(200).json({
    success: true,
    data: cart
  });
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1, variant } = req.body;
  
  // Validate product exists and is active
  const product = await Product.findOne({ _id: productId, status: 'active' });
  if (!product) {
    return next(new ErrorResponse(`No product found with id of ${productId} or product is inactive`, 404));
  }
  
  // Check product stock
  if (product.stock !== null && product.stock !== undefined && product.stock < quantity) {
    return next(new ErrorResponse(`Product is out of stock or has insufficient quantity`, 400));
  }
  
  // Find or create cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      items: []
    });
  }
  
  // Check if product already exists in cart
  const existingItemIndex = cart.items.findIndex(item => 
    item.product.toString() === productId && 
    JSON.stringify(item.variant || {}) === JSON.stringify(variant || {})
  );
  
  if (existingItemIndex > -1) {
    // Update quantity of existing item
    cart.items[existingItemIndex].quantity += quantity;
    
    // Check if new quantity exceeds stock
    if (product.stock !== null && product.stock !== undefined && 
        cart.items[existingItemIndex].quantity > product.stock) {
      return next(new ErrorResponse(`Cannot add more of this product. Maximum stock reached.`, 400));
    }
  } else {
    // Add new item to cart
    cart.items.push({
      product: productId,
      quantity,
      variant,
      price: product.price
    });
  }
  
  // Recalculate totals
  await updateCartTotals(cart);
  
  // Populate product details for response
  cart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name price slug mainImage'
  });
  
  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    data: cart
  });
});

// @desc    Update cart item quantity
// @route   POST /api/cart/update
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { itemId, quantity } = req.body;
  
  if (!itemId || !quantity) {
    return next(new ErrorResponse('Please provide item ID and quantity', 400));
  }
  
  // Find cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }
  
  // Find the item in cart
  const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
  if (itemIndex === -1) {
    return next(new ErrorResponse('Item not found in cart', 404));
  }
  
  // Check product stock
  const productId = cart.items[itemIndex].product;
  const product = await Product.findById(productId);
  
  if (!product) {
    return next(new ErrorResponse('Product no longer available', 400));
  }
  
  if (product.status !== 'active') {
    return next(new ErrorResponse('Product is not active', 400));
  }
  
  if (product.stock !== null && product.stock !== undefined && quantity > product.stock) {
    return next(new ErrorResponse('Quantity exceeds available stock', 400));
  }
  
  // Update quantity or remove if quantity is 0
  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price; // Update price in case it changed
  }
  
  // Recalculate totals
  await updateCartTotals(cart);
  
  // Populate product details for response
  cart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name price slug mainImage'
  });
  
  res.status(200).json({
    success: true,
    message: 'Cart updated',
    data: cart
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:id
// @access  Private
exports.removeCartItem = asyncHandler(async (req, res, next) => {
  const itemId = req.params.id;
  
  // Find cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }
  
  // Find the item in cart
  const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
  if (itemIndex === -1) {
    return next(new ErrorResponse('Item not found in cart', 404));
  }
  
  // Remove item
  cart.items.splice(itemIndex, 1);
  
  // Recalculate totals
  await updateCartTotals(cart);
  
  // Populate product details for response
  cart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name price slug mainImage'
  });
  
  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: cart
  });
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res, next) => {
  // Find cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }
  
  // Clear all items
  cart.items = [];
  cart.coupon = null;
  cart.couponDiscount = 0;
  cart.subtotal = 0;
  cart.total = 0;
  
  await cart.save();
  
  res.status(200).json({
    success: true,
    message: 'Cart cleared',
    data: cart
  });
});

// @desc    Apply coupon to cart
// @route   POST /api/cart/apply-coupon
// @access  Private
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  
  if (!code) {
    return next(new ErrorResponse('Please provide coupon code', 400));
  }
  
  // Find coupon and validate it
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    isActive: true
  });
  
  if (!coupon) {
    return next(new ErrorResponse('Invalid or expired coupon code', 400));
  }
  
  // Find cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }
  
  // Check if cart subtotal meets minimum requirement
  if (coupon.minOrderAmount && cart.subtotal < coupon.minOrderAmount) {
    return next(new ErrorResponse(`Minimum order amount of $${coupon.minOrderAmount} required for this coupon`, 400));
  }
  
  // Apply coupon to cart
  cart.coupon = coupon._id;
  
  // Recalculate cart with coupon
  await updateCartTotals(cart);
  
  // Populate product details for response
  cart = await Cart.findById(cart._id)
    .populate({
      path: 'items.product',
      select: 'name price slug mainImage'
    })
    .populate('coupon', 'code discountType discountValue');
  
  res.status(200).json({
    success: true,
    message: 'Coupon applied',
    data: cart
  });
});

// @desc    Remove coupon from cart
// @route   POST /api/cart/remove-coupon
// @access  Private
exports.removeCoupon = asyncHandler(async (req, res, next) => {
  // Find cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }
  
  // Remove coupon
  cart.coupon = null;
  cart.couponDiscount = 0;
  
  // Recalculate totals
  await updateCartTotals(cart);
  
  // Populate product details for response
  cart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name price slug mainImage'
  });
  
  res.status(200).json({
    success: true,
    message: 'Coupon removed',
    data: cart
  });
});

// Helper function to update cart totals
async function updateCartTotals(cart) {
  // Re-fetch products to get current prices
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (product && product.status === 'active') {
      item.price = product.price;
    } else {
      // If product is no longer available or active, mark price as 0
      item.price = 0;
    }
  }
  
  // Calculate subtotal
  cart.subtotal = cart.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Apply coupon if exists
  if (cart.coupon) {
    const coupon = await Coupon.findById(cart.coupon);
    
    if (coupon && coupon.isActive && 
        new Date() >= coupon.startDate && 
        new Date() <= coupon.endDate) {
      
      // Check minimum order amount
      if (!coupon.minOrderAmount || cart.subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          cart.couponDiscount = (cart.subtotal * coupon.discountValue) / 100;
          
          // Apply maximum discount if set
          if (coupon.maxDiscountAmount && cart.couponDiscount > coupon.maxDiscountAmount) {
            cart.couponDiscount = coupon.maxDiscountAmount;
          }
        } else if (coupon.discountType === 'fixed') {
          cart.couponDiscount = coupon.discountValue;
          
          // Ensure discount doesn't exceed subtotal
          if (cart.couponDiscount > cart.subtotal) {
            cart.couponDiscount = cart.subtotal;
          }
        }
      } else {
        // If minimum order is not met, remove coupon
        cart.coupon = null;
        cart.couponDiscount = 0;
      }
    } else {
      // Coupon is invalid or expired, remove it
      cart.coupon = null;
      cart.couponDiscount = 0;
    }
  } else {
    cart.couponDiscount = 0;
  }
  
  // Calculate final total
  cart.total = cart.subtotal - cart.couponDiscount;
  
  // Ensure non-negative values
  cart.total = Math.max(0, cart.total);
  cart.couponDiscount = Math.max(0, cart.couponDiscount);
  
  await cart.save();
  
  return cart;
}