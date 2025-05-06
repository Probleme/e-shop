const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const fs = require('fs');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  // Finding by ID or slug
  let query;
  
  if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    // It's a valid MongoDB ObjectId, query by _id
    query = { _id: req.params.id };
  } else {
    // It's not a valid ObjectId, assume it's a slug
    query = { slug: req.params.id };
  }
  
  const product = await Product.findOne(query)
    .populate({
      path: 'category',
      select: 'name slug'
    })
    .populate({
      path: 'reviews',
      select: 'rating text user'
    });

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Create slug from name if not provided
  if (!req.body.slug && req.body.name) {
    req.body.slug = req.body.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Validate category if provided
  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category) {
      return next(new ErrorResponse(`Category not found with id of ${req.body.category}`, 404));
    }
  }

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
  // Create slug from name if name is updated and slug is not provided
  if (req.body.name && !req.body.slug) {
    req.body.slug = req.body.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Validate category if provided
  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category) {
      return next(new ErrorResponse(`Category not found with id of ${req.body.category}`, 404));
    }
  }

  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

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

  // Delete product images if they exist
  if (product.mainImage) {
    try {
      const imagePath = path.join(__dirname, '../public', product.mainImage.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (err) {
      console.error('Error deleting product main image:', err);
    }
  }

  // Delete gallery images
  if (product.gallery && product.gallery.length > 0) {
    for (const image of product.gallery) {
      try {
        const imagePath = path.join(__dirname, '../public', image.replace(/^\//, ''));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (err) {
        console.error('Error deleting product gallery image:', err);
      }
    }
  }

  // Delete associated reviews
  await Review.deleteMany({ product: req.params.id });

  await product.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload main product image
// @route   PUT /api/products/:id/main-image
// @access  Private/Admin
exports.uploadMainImage = asyncHandler(async (req, res, next) => {
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
  file.name = `product_${req.params.id}_main${path.parse(file.name).ext}`;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Delete old image if exists
  if (product.mainImage) {
    try {
      const oldImagePath = path.join(__dirname, '../public', product.mainImage.replace(/^\//, ''));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    } catch (err) {
      console.error('Error deleting old product image:', err);
    }
  }

  // Upload new file
  file.mv(`${process.env.FILE_UPLOAD_PATH || './public/uploads'}/products/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Update product with image URL
    const mainImage = `/uploads/products/${file.name}`;
    await Product.findByIdAndUpdate(req.params.id, { mainImage });

    res.status(200).json({
      success: true,
      data: { mainImage }
    });
  });
});

// @desc    Upload product gallery images
// @route   PUT /api/products/:id/gallery
// @access  Private/Admin
exports.uploadGalleryImages = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    return next(new ErrorResponse(`Please upload files`, 400));
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Make sure files is an array
  const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];

  // Make sure all files are images
  for (const file of files) {
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse(`Please upload only image files`, 400));
    }

    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD || 1000000) {
      return next(
        new ErrorResponse(
          `Please upload images less than ${process.env.MAX_FILE_UPLOAD || 1000000} bytes`,
          400
        )
      );
    }
  }

  // Process each file
  const galleryImages = [];
  const uploadPath = `${process.env.FILE_UPLOAD_PATH || './public/uploads'}/products`;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Create custom filename
    file.name = `product_${req.params.id}_gallery_${Date.now()}_${i}${path.parse(file.name).ext}`;
    
    // Upload file
    await new Promise((resolve, reject) => {
      file.mv(`${uploadPath}/${file.name}`, err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    
    galleryImages.push(`/uploads/products/${file.name}`);
  }

  // Update product gallery
  const updatedGallery = [...(product.gallery || []), ...galleryImages];
  await Product.findByIdAndUpdate(req.params.id, { gallery: updatedGallery });

  res.status(200).json({
    success: true,
    data: { gallery: updatedGallery }
  });
});

// @desc    Delete gallery image
// @route   DELETE /api/products/:id/gallery/:imageIndex
// @access  Private/Admin
exports.deleteGalleryImage = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  const imageIndex = req.params.imageIndex;
  if (!product.gallery || !product.gallery[imageIndex]) {
    return next(new ErrorResponse(`Image not found at index ${imageIndex}`, 404));
  }

  // Delete the image file
  const imageUrl = product.gallery[imageIndex];
  try {
    const imagePath = path.join(__dirname, '../public', imageUrl.replace(/^\//, ''));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  } catch (err) {
    console.error('Error deleting gallery image:', err);
  }

  // Remove the image URL from the gallery array
  const updatedGallery = [...product.gallery];
  updatedGallery.splice(imageIndex, 1);
  
  await Product.findByIdAndUpdate(req.params.id, { gallery: updatedGallery });

  res.status(200).json({
    success: true,
    data: { gallery: updatedGallery }
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 8;
  
  const products = await Product.find({ featured: true, status: 'active' })
    .limit(limit)
    .populate('category', 'name slug');

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get best selling products
// @route   GET /api/products/best-sellers
// @access  Public
exports.getBestSellers = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 8;
  
  const products = await Product.find({ status: 'active' })
    .sort({ sales: -1 })
    .limit(limit)
    .populate('category', 'name slug');

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
exports.getNewArrivals = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 8;
  
  const products = await Product.find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category', 'name slug');

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get deal of the day
// @route   GET /api/products/deal-of-the-day
// @access  Public
exports.getDealOfTheDay = asyncHandler(async (req, res, next) => {
  // Find a product with the biggest discount percentage
  const products = await Product.find({
    status: 'active',
    originalPrice: { $gt: 0 },
    price: { $gt: 0 }
  })
    .sort({ discount: -1 })
    .limit(1)
    .populate('category', 'name slug');

  let dealProduct = null;
  if (products.length > 0) {
    dealProduct = products[0];
    
    // Add a default expiry date for the deal (24 hours from now)
    dealProduct = {
      ...dealProduct.toObject(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  res.status(200).json({
    success: true,
    data: dealProduct
  });
});

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
exports.getProductsByCategory = asyncHandler(async (req, res, next) => {
  // Get the category and its subcategories
  const category = await Category.findById(req.params.categoryId);
  
  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.categoryId}`, 404));
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
  
  const categoryIds = await getSubcategoryIds(req.params.categoryId);
  
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
  
  // Execute query with pagination
  const total = await Product.countDocuments({ category: { $in: categoryIds }, status: 'active' });
  const products = await Product.find({ category: { $in: categoryIds }, status: 'active' })
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
    count: products.length,
    data: products
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
  
  // Find products in the same category, excluding the current product
  const relatedProducts = await Product.find({
    _id: { $ne: req.params.id },
    category: product.category,
    status: 'active'
  })
    .limit(limit)
    .populate('category', 'name slug');
  
  res.status(200).json({
    success: true,
    count: relatedProducts.length,
    data: relatedProducts
  });
});

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
exports.updateStock = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }
  
  if (!req.body.stock && req.body.stock !== 0) {
    return next(new ErrorResponse(`Please provide stock value`, 400));
  }
  
  product.stock = req.body.stock;
  await product.save();
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Update product status
// @route   PUT /api/products/:id/status
// @access  Private/Admin
exports.updateStatus = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }
  
  if (!req.body.status || !['active', 'inactive', 'draft'].includes(req.body.status)) {
    return next(new ErrorResponse(`Invalid status value`, 400));
  }
  
  product.status = req.body.status;
  await product.save();
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Add product variant
// @route   POST /api/products/:id/variants
// @access  Private/Admin
exports.addVariant = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }
  
  // Initialize variants array if it doesn't exist
  if (!product.variants) {
    product.variants = [];
  }
  
  product.variants.push(req.body);
  await product.save();
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Update product variant
// @route   PUT /api/products/:id/variants/:variantIndex
// @access  Private/Admin
exports.updateVariant = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }
  
  const variantIndex = parseInt(req.params.variantIndex);
  
  if (!product.variants || !product.variants[variantIndex]) {
    return next(new ErrorResponse(`Variant not found at index ${variantIndex}`, 404));
  }
  
  // Update the variant at the specified index
  product.variants[variantIndex] = {
    ...product.variants[variantIndex],
    ...req.body
  };
  
  await product.save();
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product variant
// @route   DELETE /api/products/:id/variants/:variantIndex
// @access  Private/Admin
exports.deleteVariant = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }
  
  const variantIndex = parseInt(req.params.variantIndex);
  
  if (!product.variants || !product.variants[variantIndex]) {
    return next(new ErrorResponse(`Variant not found at index ${variantIndex}`, 404));
  }
  
  // Remove the variant at the specified index
  product.variants.splice(variantIndex, 1);
  await product.save();
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Update product specifications
// @route   PUT /api/products/:id/specifications
// @access  Private/Admin
exports.updateSpecifications = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }
  
  if (!Array.isArray(req.body.specifications)) {
    return next(new ErrorResponse(`Specifications should be an array`, 400));
  }
  
  product.specifications = req.body.specifications;
  await product.save();
  
  res.status(200).json({
    success: true,
    data: product
  });
});