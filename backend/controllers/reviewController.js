const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
exports.getProductReviews = asyncHandler(async (req, res, next) => {
  const productId = req.params.productId;
  
  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse(`No product found with id of ${productId}`, 404));
  }
  
  // Get reviews for this product
  const reviews = await Review.find({ product: productId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'user',
      select: 'name avatar'
    });
  
  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get single review
// @route   GET /api/products/:productId/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate({
      path: 'product',
      select: 'name description price mainImage'
    })
    .populate({
      path: 'user',
      select: 'name avatar'
    });
  
  if (!review) {
    return next(new ErrorResponse(`No review found with id of ${req.params.id}`, 404));
  }
  
  // Check if review belongs to the specified product
  if (review.product._id.toString() !== req.params.productId) {
    return next(new ErrorResponse(`Review does not belong to product with id of ${req.params.productId}`, 400));
  }
  
  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Add review
// @route   POST /api/products/:productId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res, next) => {
  // Add user and product to req.body
  req.body.user = req.user.id;
  req.body.product = req.params.productId;
  
  // Validate product exists
  const product = await Product.findById(req.params.productId);
  if (!product) {
    return next(new ErrorResponse(`No product found with id of ${req.params.productId}`, 404));
  }
  
  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user.id,
    product: req.params.productId
  });
  
  if (existingReview) {
    return next(new ErrorResponse(`User already reviewed this product`, 400));
  }
  
  // Validate rating is between 1-5
  if (req.body.rating < 1 || req.body.rating > 5) {
    return next(new ErrorResponse(`Rating must be between 1 and 5`, 400));
  }
  
  const review = await Review.create(req.body);
  
  // Update product average rating
  await updateProductRating(req.params.productId);
  
  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Update review
// @route   PUT /api/products/:productId/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new ErrorResponse(`No review found with id of ${req.params.id}`, 404));
  }
  
  // Check if review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to update this review`, 401));
  }
  
  // Check if review belongs to the specified product
  if (review.product.toString() !== req.params.productId) {
    return next(new ErrorResponse(`Review does not belong to product with id of ${req.params.productId}`, 400));
  }
  
  // Validate rating is between 1-5 if provided
  if (req.body.rating && (req.body.rating < 1 || req.body.rating > 5)) {
    return next(new ErrorResponse(`Rating must be between 1 and 5`, 400));
  }
  
  // Update review
  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  // Update product average rating
  await updateProductRating(req.params.productId);
  
  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/products/:productId/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new ErrorResponse(`No review found with id of ${req.params.id}`, 404));
  }
  
  // Check if review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to delete this review`, 401));
  }
  
  // Check if review belongs to the specified product
  if (review.product.toString() !== req.params.productId) {
    return next(new ErrorResponse(`Review does not belong to product with id of ${req.params.productId}`, 400));
  }
  
  await review.deleteOne();
  
  // Update product average rating
  await updateProductRating(req.params.productId);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Verify review (admin only)
// @route   PUT /api/products/:productId/reviews/:id/verify
// @access  Private/Admin
exports.verifyReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new ErrorResponse(`No review found with id of ${req.params.id}`, 404));
  }
  
  // Check if review belongs to the specified product
  if (review.product.toString() !== req.params.productId) {
    return next(new ErrorResponse(`Review does not belong to product with id of ${req.params.productId}`, 400));
  }
  
  // Update review verification status
  review.verified = true;
  review.verifiedAt = Date.now();
  
  await review.save();
  
  res.status(200).json({
    success: true,
    data: review
  });
});

// Helper function to update product average rating
async function updateProductRating(productId) {
  const reviews = await Review.find({ product: productId });
  
  // Calculate average rating
  const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
  
  // Update product with average rating and review count
  await Product.findByIdAndUpdate(productId, {
    rating: averageRating,
    reviewCount: reviews.length
  });
}