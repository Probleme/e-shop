const Category = require('../models/Category');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const fs = require('fs');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).populate('parent');

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
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
  const category = await Category.findOne({ slug: req.params.slug }).populate('parent');

  if (!category) {
    return next(new ErrorResponse(`Category not found with slug of ${req.params.slug}`, 404));
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
  // Handle empty parent field - remove it if it's an empty string
  if (req.body.parent === '') {
    delete req.body.parent;
  }
  // Create slug from name if not provided
  if (!req.body.slug && req.body.name) {
    req.body.slug = req.body.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
  // Create slug from name if name is updated and slug is not provided
  if (req.body.name && !req.body.slug) {
    req.body.slug = req.body.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
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

  // Check if category has subcategories
  const hasSubcategories = await Category.exists({ parent: req.params.id });
  if (hasSubcategories) {
    return next(new ErrorResponse(`Cannot delete category that has subcategories`, 400));
  }

  // Check if category has associated products
  const hasProducts = await Product.exists({ category: req.params.id });
  if (hasProducts) {
    return next(new ErrorResponse(`Cannot delete category that has associated products`, 400));
  }

  // Delete category image if it exists
  if (category.imageUrl) {
    try {
      const imagePath = path.join(__dirname, '../public', category.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (err) {
      console.error('Error deleting category image:', err);
    }
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload category image
// @route   PUT /api/categories/:id/image
// @access  Private/Admin
exports.uploadCategoryImage = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD || 1000000) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD || 1000000} bytes`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `category_${req.params.id}${path.parse(file.name).ext}`;

  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }

  // Delete old image if exists
  if (category.imageUrl) {
    try {
      const oldImagePath = path.join(__dirname, '../public', category.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    } catch (err) {
      console.error('Error deleting old category image:', err);
    }
  }

  // Upload new file
  file.mv(`${process.env.FILE_UPLOAD_PATH || './public/uploads'}/categories/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Update category with image URL
    const imageUrl = `/uploads/categories/${file.name}`;
    await Category.findByIdAndUpdate(req.params.id, { imageUrl });

    res.status(200).json({
      success: true,
      data: { imageUrl }
    });
  });
});

// @desc    Get featured categories
// @route   GET /api/categories/featured
// @access  Public
exports.getFeaturedCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ featured: true });

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
  const categories = await Category.find({ parent: { $exists: false } });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get subcategories of a category
// @route   GET /api/categories/:id/subcategories
// @access  Public
exports.getSubcategories = asyncHandler(async (req, res, next) => {
  const subcategories = await Category.find({ parent: req.params.id });

  res.status(200).json({
    success: true,
    count: subcategories.length,
    data: subcategories
  });
});

// @desc    Get products of a category
// @route   GET /api/categories/:id/products
// @access  Public
exports.getCategoryProducts = asyncHandler(async (req, res, next) => {
  // Get the category and its subcategories
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }
  
  // Find all subcategories (recursively)
  const getSubcategoryIds = async (categoryId) => {
    const directSubcategories = await Category.find({ parent: categoryId });
    let allIds = [categoryId];
    
    for (const subcat of directSubcategories) {
      const subcategoryIds = await getSubcategoryIds(subcat._id);
      allIds = [...allIds, ...subcategoryIds];
    }
    
    return allIds;
  };
  
  const categoryIds = await getSubcategoryIds(req.params.id);
  
  // Set up pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const startIndex = (page - 1) * limit;
  
  // Set up sorting
  let sortBy = {};
  if (req.query.sort) {
    const sortField = req.query.sort.startsWith('-') ? 
      req.query.sort.substring(1) : req.query.sort;
    const sortDirection = req.query.sort.startsWith('-') ? -1 : 1;
    sortBy[sortField] = sortDirection;
  } else {
    sortBy = { createdAt: -1 };
  }
  
  // Set up filtering
  let query = { category: { $in: categoryIds } };
  
  // Apply price filter if provided
  if (req.query.price_min || req.query.price_max) {
    query.price = {};
    if (req.query.price_min) {
      query.price.$gte = parseFloat(req.query.price_min);
    }
    if (req.query.price_max) {
      query.price.$lte = parseFloat(req.query.price_max);
    }
  }
  
  // Apply search term if provided
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Execute query with pagination
  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortBy)
    .skip(startIndex)
    .limit(limit)
    .populate('category', 'name slug');
  
  // Pagination result
  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
  
  res.status(200).json({
    success: true,
    pagination,
    data: products
  });
});