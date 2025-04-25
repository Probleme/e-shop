const Category = require('../models/Category');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  // Get only root categories (those without parent)
  const rootCategories = req.query.root === 'true';
  
  let query;
  
  if (rootCategories) {
    query = Category.find({ parent: null });
  } else {
    query = Category.find();
  }

  // Add sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('sortOrder name'); // Default sort
  }

  // Execute query
  const categories = await query;

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get single category with subcategories and products
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).populate('subcategories');

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }

  // Optionally include products
  if (req.query.includeProducts === 'true') {
    await category.populate('products');
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
exports.getCategoryBySlug = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug });

  if (!category) {
    return next(new ErrorResponse(`Category not found with slug ${req.params.slug}`, 404));
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res, next) => {
  // Check if parent category exists
  if (req.body.parent) {
    const parentCategory = await Category.findById(req.body.parent);
    if (!parentCategory) {
      return next(new ErrorResponse(`Parent category not found with id of ${req.body.parent}`, 404));
    }
  }

  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    data: category
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }

  // Check if parent category exists if updating parent
  if (req.body.parent) {
    const parentCategory = await Category.findById(req.body.parent);
    if (!parentCategory) {
      return next(new ErrorResponse(`Parent category not found with id of ${req.body.parent}`, 404));
    }
    
    // Prevent circular reference
    if (req.body.parent === req.params.id) {
      return next(new ErrorResponse('Category cannot be its own parent', 400));
    }
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }

  // Check if there are products in this category
  const productsCount = await Product.countDocuments({ category: req.params.id });
  if (productsCount > 0) {
    return next(new ErrorResponse(`Cannot delete category with ${productsCount} products`, 400));
  }

  // Check if there are subcategories
  const subcategoriesCount = await Category.countDocuments({ parent: req.params.id });
  if (subcategoriesCount > 0) {
    return next(new ErrorResponse(`Cannot delete category with ${subcategoriesCount} subcategories`, 400));
  }

  await category.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload category image
// @route   PUT /api/categories/:id/image
// @access  Private/Admin
exports.uploadCategoryImage = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD || file.size > 2000000) { // 2MB limit
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD || '2MB'}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `category_${category._id}${path.parse(file.name).ext}`;

  // Move file to upload path
  file.mv(`./public/uploads/categories/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Category.findByIdAndUpdate(req.params.id, {
      imageUrl: `/uploads/categories/${file.name}`
    });

    res.status(200).json({
      success: true,
      data: {
        imageUrl: `/uploads/categories/${file.name}`
      }
    });
  });
});

// @desc    Get featured categories
// @route   GET /api/categories/featured
// @access  Public
exports.getFeaturedCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ featured: true }).sort('sortOrder');

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get top level categories (no parent)
// @route   GET /api/categories/top-level
// @access  Public
exports.getTopLevelCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ parent: null }).sort('sortOrder name');

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get subcategories for a specific category
// @route   GET /api/categories/:id/subcategories
// @access  Public
exports.getSubcategories = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }

  const subcategories = await Category.find({ parent: req.params.id }).sort('sortOrder name');

  res.status(200).json({
    success: true,
    count: subcategories.length,
    data: subcategories
  });
});

// @desc    Get products belonging to a category
// @route   GET /api/categories/:id/products
// @access  Public
exports.getCategoryProducts = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }

  // Set up pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const startIndex = (page - 1) * limit;
  
  // Build query
  let productQuery = {
    $or: [
      { category: req.params.id }, // Products directly in this category
      { subcategory: req.params.id } // Products that have this as subcategory
    ],
    status: 'published'
  };

  // Handle filters if provided
  if (req.query.price_min || req.query.price_max) {
    productQuery.price = {};
    if (req.query.price_min) productQuery.price.$gte = parseFloat(req.query.price_min);
    if (req.query.price_max) productQuery.price.$lte = parseFloat(req.query.price_max);
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    productQuery = {
      ...productQuery,
      $or: [
        { name: searchRegex }, 
        { description: searchRegex },
        { shortDescription: searchRegex },
        { brand: searchRegex },
        { tags: searchRegex }
      ]
    };
  }

  // Count total documents
  const total = await Product.countDocuments(productQuery);

  // Execute query with pagination
  let query = Product.find(productQuery)
    .skip(startIndex)
    .limit(limit);
    
  // Add sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Select fields if specified
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Execute query
  const products = await query;
  
  // Add discount percentage to products
  const productsWithDiscount = products.map(product => 
    Product.getWithDiscountPercentage(product)
  );

  // Prepare pagination
  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
  
  if (page > 1) {
    pagination.prev = page - 1;
  }
  
  if (page < Math.ceil(total / limit)) {
    pagination.next = page + 1;
  }

  res.status(200).json({
    success: true,
    count: products.length,
    pagination,
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug
    },
    data: productsWithDiscount
  });
});