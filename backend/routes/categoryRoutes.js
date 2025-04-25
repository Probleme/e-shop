const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryBySlug,
  uploadCategoryImage,
  getFeaturedCategories,
  getTopLevelCategories,
  getSubcategories,
  getCategoryProducts
} = require('../controllers/categoryController');

// Special routes
router.get('/featured', getFeaturedCategories);
router.get('/top-level', getTopLevelCategories);
router.get('/:id/subcategories', getSubcategories);
router.get('/:id/products', getCategoryProducts);

// Slug-based lookup
router.get('/slug/:slug', getCategoryBySlug);

// Image upload route
router.put('/:id/image', protect, authorize('admin'), uploadCategoryImage);

// Main CRUD routes
router.route('/')
  .get(getCategories)
  .post(protect, authorize('admin'), createCategory);

router.route('/:id')
  .get(getCategory)
  .put(protect, authorize('admin'), updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

module.exports = router;