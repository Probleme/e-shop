const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review'); // Assuming you have a Review model
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const fs = require('fs').promises;

// @desc    Get all products with filtering
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'price_min', 'price_max'];
  removeFields.forEach(param => delete reqQuery[param]);

  // Create operators ($gt, $gte, etc)
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Build basic query
  let query = Product.find(JSON.parse(queryStr));
  
  // Filter by status if not admin
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin) {
    query = query.find({ status: 'published' });
  }

  // Search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = query.or([
      { name: searchRegex }, 
      { description: searchRegex },
      { shortDescription: searchRegex },
      { brand: searchRegex },
      { tags: searchRegex }
    ]);
  }

  // Price range filter
  if (req.query.price_min || req.query.price_max) {
    const priceFilter = {};
    if (req.query.price_min) priceFilter.$gte = parseFloat(req.query.price_min);
    if (req.query.price_max) priceFilter.$lte = parseFloat(req.query.price_max);
    query = query.find({ price: priceFilter });
  }

  // Select specific fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Product.countDocuments(query.getQuery());

  query = query.skip(startIndex).limit(limit);

  // Populate references
  query = query.populate({
    path: 'category',
    select: 'name slug'
  }).populate({
    path: 'subcategory',
    select: 'name slug'
  });

  // Execute query
  const products = await query;

  // Map products to include discount percentage
  const productsWithDiscount = products.map(product => 
    Product.getWithDiscountPercentage(product)
  );

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = { page: page + 1, limit };
  }

  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  pagination.total = total;
  pagination.pages = Math.ceil(total / limit);
  pagination.page = page;
  pagination.limit = limit;

  res.status(200).json({
    success: true,
    count: products.length,
    pagination,
    data: productsWithDiscount
  });
});

// @desc    Get single product by ID or slug
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const query = req.params.id.match(/^[0-9a-fA-F]{24}$/) 
    ? { _id: req.params.id }  // If ID format
    : { slug: req.params.id }; // If slug format
  
  const product = await Product.findOne(query)
    .populate({
      path: 'category',
      select: 'name slug'
    })
    .populate({
      path: 'subcategory',
      select: 'name slug'
    });

  if (!product) {
    return next(new ErrorResponse(`Product not found with id or slug of ${req.params.id}`, 404));
  }

  // Check if published or user is admin
  if (product.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
    return next(new ErrorResponse(`Product not found with id or slug of ${req.params.id}`, 404));
  }

  // Get reviews
  const reviews = await Review.find({ product: product._id })
    .populate({
      path: 'user',
      select: 'name avatar'
    })
    .sort('-createdAt');

  // Apply discount calculation
  const productWithDiscount = Product.getWithDiscountPercentage(product);

  res.status(200).json({
    success: true,
    data: {
      ...productWithDiscount.toJSON(),
      reviews
    }
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Add user to body
  req.body.user = req.user.id;
  
  // Check if category exists
  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category) {
      return next(new ErrorResponse(`Category with ID ${req.body.category} not found`, 404));
    }
  }
  
  // Check if subcategory exists
  if (req.body.subcategory) {
    const subcategory = await Category.findById(req.body.subcategory);
    if (!subcategory) {
      return next(new ErrorResponse(`Subcategory with ID ${req.body.subcategory} not found`, 404));
    }
  }

  // If SKU is provided, check if it's unique
  if (req.body.sku) {
    const existingSku = await Product.findOne({ sku: req.body.sku });
    if (existingSku) {
      return next(new ErrorResponse('Product with this SKU already exists', 400));
    }
  }

  // Create product
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Check if category exists
  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category) {
      return next(new ErrorResponse(`Category with ID ${req.body.category} not found`, 404));
    }
  }

  // Check if subcategory exists
  if (req.body.subcategory) {
    const subcategory = await Category.findById(req.body.subcategory);
    if (!subcategory) {
      return next(new ErrorResponse(`Subcategory with ID ${req.body.subcategory} not found`, 404));
    }
  }

  // If SKU is changed, check if it's unique
  if (req.body.sku && req.body.sku !== product.sku) {
    const existingSku = await Product.findOne({ sku: req.body.sku });
    if (existingSku) {
      return next(new ErrorResponse('Product with this SKU already exists', 400));
    }
  }

  // Update the product
  product = await Product.findByIdAndUpdate(
    req.params.id, 
    { ...req.body, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Remove all images associated with the product
  if (product.mainImage && product.mainImage !== 'no-photo.jpg') {
    try {
      await fs.unlink(path.join(__dirname, '../public/uploads/products', product.mainImage));
    } catch (err) {
      console.log('Error removing mainImage:', err);
    }
  }

  if (product.images && product.images.length > 0) {
    for (const image of product.images) {
      try {
        await fs.unlink(path.join(__dirname, '../public/uploads/products', image));
      } catch (err) {
        console.log('Error removing image:', err);
      }
    }
  }

  // Use remove() to trigger the pre-remove middleware
  await product.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload product main image
// @route   PUT /api/products/:id/main-image
// @access  Private/Admin
exports.uploadMainImage = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD || file.size > 5000000) {
    return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD || '5MB'}`, 400));
  }

  // Create custom filename
  const fileName = `product_${product._id}_main_${Date.now()}${path.parse(file.name).ext}`;

  // Move file to upload location
  file.mv(`./public/uploads/products/${fileName}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with file upload', 500));
    }

    // Delete old main image if it exists and it's not the default
    if (product.mainImage && product.mainImage !== 'no-photo.jpg') {
      try {
        await fs.unlink(`./public/uploads/products/${product.mainImage}`);
      } catch (err) {
        console.log('Error removing old mainImage:', err);
      }
    }

    // Update database
    await Product.findByIdAndUpdate(req.params.id, { 
      mainImage: fileName,
      updatedAt: Date.now()
    });

    res.status(200).json({
      success: true,
      data: fileName
    });
  });
});

// @desc    Upload product gallery images
// @route   PUT /api/products/:id/gallery
// @access  Private/Admin
exports.uploadGalleryImages = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  if (!req.files || !req.files.files) {
    return next(new ErrorResponse('Please upload at least one file', 400));
  }

  // Make sure req.files.files is an array
  const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
  
  if (files.length > 10) {
    return next(new ErrorResponse('You can upload maximum 10 images at once', 400));
  }

  const uploadedFiles = [];

  // Process each file
  const filePromises = files.map(file => {
    return new Promise((resolve, reject) => {
      // Validate file
      if (!file.mimetype.startsWith('image')) {
        return reject(new Error(`${file.name} is not an image`));
      }

      if (file.size > process.env.MAX_FILE_UPLOAD || file.size > 5000000) {
        return reject(new Error(`${file.name} exceeds size limit`));
      }

      // Create custom filename
      const fileName = `product_${product._id}_gallery_${Date.now()}_${uploadedFiles.length}${path.parse(file.name).ext}`;

      // Move file
      file.mv(`./public/uploads/products/${fileName}`, async err => {
        if (err) {
          reject(err);
        } else {
          uploadedFiles.push(fileName);
          resolve();
        }
      });
    });
  });

  try {
    await Promise.all(filePromises);
    
    // Update product with new images
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { images: { $each: uploadedFiles } },
        updatedAt: Date.now()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedProduct.images
    });
  } catch (err) {
    return next(new ErrorResponse(`Error uploading images: ${err.message}`, 500));
  }
});

// @desc    Delete product gallery image
// @route   DELETE /api/products/:id/gallery/:imageIndex
// @access  Private/Admin
exports.deleteGalleryImage = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  const imageIndex = parseInt(req.params.imageIndex);
  
  if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= product.images.length) {
    return next(new ErrorResponse('Invalid image index', 400));
  }

  // Get filename to delete
  const imageToDelete = product.images[imageIndex];

  // Remove from filesystem
  try {
    await fs.unlink(`./public/uploads/products/${imageToDelete}`);
  } catch (err) {
    console.log('Error removing image from filesystem:', err);
  }

  // Remove from product images array
  product.images.splice(imageIndex, 1);
  product.updatedAt = Date.now();
  await product.save();

  res.status(200).json({
    success: true,
    data: product.images
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 8;
  
  const products = await Product.find({ featured: true, status: 'published' })
    .limit(limit)
    .select('name price originalPrice mainImage slug rating reviewCount')
    .sort('-updatedAt');

  const productsWithDiscount = products.map(product => 
    Product.getWithDiscountPercentage(product)
  );

  res.status(200).json({
    success: true,
    count: productsWithDiscount.length,
    data: productsWithDiscount
  });
});

// @desc    Get best sellers
// @route   GET /api/products/best-sellers
// @access  Public
exports.getBestSellers = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 8;
  
  const products = await Product.find({ isBestSeller: true, status: 'published' })
    .limit(limit)
    .select('name price originalPrice mainImage slug rating reviewCount')
    .sort('-updatedAt');

  const productsWithDiscount = products.map(product => 
    Product.getWithDiscountPercentage(product)
  );

  res.status(200).json({
    success: true,
    count: productsWithDiscount.length,
    data: productsWithDiscount
  });
});

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
exports.getNewArrivals = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 8;
  
  const products = await Product.find({ isNewArrival: true, status: 'published' })
    .limit(limit)
    .select('name price originalPrice mainImage slug rating reviewCount')
    .sort('-createdAt');

  const productsWithDiscount = products.map(product => 
    Product.getWithDiscountPercentage(product)
  );

  res.status(200).json({
    success: true,
    count: productsWithDiscount.length,
    data: productsWithDiscount
  });
});

// @desc    Get deal of the day
// @route   GET /api/products/deal-of-the-day
// @access  Public
exports.getDealOfTheDay = asyncHandler(async (req, res, next) => {
  const now = new Date();
  
  const deal = await Product.findOne({ 
    isDealOfTheDay: true, 
    status: 'published',
    $or: [
      { dealExpiresAt: { $gt: now } },
      { dealExpiresAt: null }
    ]
  })
  .populate({
    path: 'category',
    select: 'name slug'
  });

  if (!deal) {
    return res.status(404).json({
      success: false,
      error: 'No active deal of the day found'
    });
  }

  // Apply discount calculation
  const dealWithDiscount = Product.getWithDiscountPercentage(deal);

  res.status(200).json({
    success: true,
    data: dealWithDiscount
  });
});

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
exports.getRelatedProducts = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  const limit = parseInt(req.query.limit) || 4;
  
  // Find products in same category, excluding current product
  const relatedProducts = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    status: 'published'
  })
    .limit(limit)
    .select('name price originalPrice mainImage slug rating reviewCount')
    .sort('-rating');

  const productsWithDiscount = relatedProducts.map(product => 
    Product.getWithDiscountPercentage(product)
  );

  res.status(200).json({
    success: true,
    count: productsWithDiscount.length,
    data: productsWithDiscount
  });
});

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
exports.updateStock = asyncHandler(async (req, res, next) => {
  const { stock } = req.body;
  
  if (stock === undefined || isNaN(stock) || stock < 0) {
    return next(new ErrorResponse('Please provide a valid stock quantity', 400));
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { 
      stock,
      status: stock > 0 ? (product?.status === 'out_of_stock' ? 'published' : product?.status) : 'out_of_stock',
      updatedAt: Date.now() 
    },
    { new: true }
  );

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Update product status
// @route   PUT /api/products/:id/status
// @access  Private/Admin
exports.updateStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status || !['draft', 'published', 'archived', 'out_of_stock'].includes(status)) {
    return next(new ErrorResponse('Please provide a valid status', 400));
  }

  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // If setting to out_of_stock, also set stock to 0
  if (status === 'out_of_stock' && product.stock > 0) {
    product.stock = 0;
  }
  
  // If setting to published but stock is 0, prevent that
  if (status === 'published' && product.stock <= 0) {
    return next(new ErrorResponse('Cannot set product with 0 stock to published status', 400));
  }

  product.status = status;
  product.updatedAt = Date.now();
  await product.save();

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
exports.getProductsByCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;

  // Check if category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${categoryId}`, 404));
  }

  // Copy req.query for filtering
  const reqQuery = { ...req.query };
  const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
  removeFields.forEach(param => delete reqQuery[param]);

  // Add category filter
  reqQuery.category = categoryId;

  // Build query string with operators ($gt, $gte, etc)
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Build base query
  let query = Product.find({
    ...JSON.parse(queryStr),
    status: 'published'
  });

  // Add search if provided
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = query.or([
      { name: searchRegex }, 
      { description: searchRegex },
      { shortDescription: searchRegex },
      { brand: searchRegex },
      { tags: searchRegex }
    ]);
  }

  // Select fields if specified
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort products
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const startIndex = (page - 1) * limit;
  const total = await Product.countDocuments(query.getQuery());

  query = query.skip(startIndex).limit(limit);

  // Execute query
  const products = await query;
  
  // Apply discount calculation
  const productsWithDiscount = products.map(product => 
    Product.getWithDiscountPercentage(product)
  );

  // Pagination object
  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };

  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  if (startIndex + products.length < total) {
    pagination.next = { page: page + 1, limit };
  }

  res.status(200).json({
    success: true,
    count: products.length,
    pagination,
    category: {
      id: category._id,
      name: category.name,
      slug: category.slug
    },
    data: productsWithDiscount
  });
});

// @desc    Add variant to product
// @route   POST /api/products/:id/variants
// @access  Private/Admin
exports.addVariant = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  const { name, options, values } = req.body;

  if (!name || !options || !values) {
    return next(new ErrorResponse('Please provide name, options, and values for variant', 400));
  }

  // Add new variant
  product.variants.push({
    name,
    options,
    values
  });

  // If product has variants, update main price to lowest variant price
  const allPrices = [
    ...product.variants.flatMap(v => 
      v.values.map(val => val.price).filter(p => p !== undefined && p !== null)
    ),
    product.price
  ].filter(p => p > 0);

  if (allPrices.length > 0) {
    product.price = Math.min(...allPrices);
  }

  product.updatedAt = Date.now();
  await product.save();

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Update variant
// @route   PUT /api/products/:id/variants/:variantIndex
// @access  Private/Admin
exports.updateVariant = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  const variantIndex = parseInt(req.params.variantIndex);
  
  if (isNaN(variantIndex) || variantIndex < 0 || variantIndex >= product.variants.length) {
    return next(new ErrorResponse('Invalid variant index', 400));
  }

  const { name, options, values } = req.body;

  // Update variant fields
  if (name) product.variants[variantIndex].name = name;
  if (options) product.variants[variantIndex].options = options;
  if (values) product.variants[variantIndex].values = values;

  // If product has variants, update main price to lowest variant price
  const allPrices = [
    ...product.variants.flatMap(v => 
      v.values.map(val => val.price).filter(p => p !== undefined && p !== null)
    ),
    product.price
  ].filter(p => p > 0);

  if (allPrices.length > 0) {
    product.price = Math.min(...allPrices);
  }

  product.updatedAt = Date.now();
  await product.save();

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete variant
// @route   DELETE /api/products/:id/variants/:variantIndex
// @access  Private/Admin
exports.deleteVariant = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  const variantIndex = parseInt(req.params.variantIndex);
  
  if (isNaN(variantIndex) || variantIndex < 0 || variantIndex >= product.variants.length) {
    return next(new ErrorResponse('Invalid variant index', 400));
  }

  // Remove variant
  product.variants.splice(variantIndex, 1);

  // If product has variants, update main price to lowest variant price
  const allPrices = [
    ...product.variants.flatMap(v => 
      v.values.map(val => val.price).filter(p => p !== undefined && p !== null)
    ),
    product.price
  ].filter(p => p > 0);

  if (allPrices.length > 0) {
    product.price = Math.min(...allPrices);
  }

  product.updatedAt = Date.now();
  await product.save();

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Add or update product specifications
// @route   PUT /api/products/:id/specifications
// @access  Private/Admin
exports.updateSpecifications = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  const { specifications } = req.body;

  if (!specifications || !Array.isArray(specifications)) {
    return next(new ErrorResponse('Please provide specifications array', 400));
  }

  // Update specifications
  product.specifications = specifications;
  product.updatedAt = Date.now();
  await product.save();

  res.status(200).json({
    success: true,
    data: product
  });
});