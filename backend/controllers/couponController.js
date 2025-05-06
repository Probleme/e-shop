const Coupon = require('../models/Coupon');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = asyncHandler(async (req, res, next) => {
  // Convert code to uppercase
  if (req.body.code) {
    req.body.code = req.body.code.toUpperCase();
  }
  
  // Validate that code doesn't already exist
  const existingCoupon = await Coupon.findOne({ code: req.body.code });
  if (existingCoupon) {
    return next(new ErrorResponse(`Coupon with code ${req.body.code} already exists`, 400));
  }
  
  // Create coupon
  const coupon = await Coupon.create(req.body);
  
  res.status(201).json({
    success: true,
    data: coupon
  });
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
exports.getCoupons = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single coupon
// @route   GET /api/coupons/:id
// @access  Private/Admin
exports.getCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);
  
  if (!coupon) {
    return next(new ErrorResponse(`No coupon found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: coupon
  });
});

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
exports.updateCoupon = asyncHandler(async (req, res, next) => {
  // Convert code to uppercase if provided
  if (req.body.code) {
    req.body.code = req.body.code.toUpperCase();
    
    // Check if updated code already exists on another coupon
    const existingCoupon = await Coupon.findOne({
      code: req.body.code,
      _id: { $ne: req.params.id }
    });
    
    if (existingCoupon) {
      return next(new ErrorResponse(`Coupon with code ${req.body.code} already exists`, 400));
    }
  }
  
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!coupon) {
    return next(new ErrorResponse(`No coupon found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: coupon
  });
});

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);
  
  if (!coupon) {
    return next(new ErrorResponse(`No coupon found with id of ${req.params.id}`, 404));
  }
  
  await coupon.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});