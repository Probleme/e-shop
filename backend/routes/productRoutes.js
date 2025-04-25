const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadMainImage,
  uploadGalleryImages,
  deleteGalleryImage,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getDealOfTheDay,
  getRelatedProducts,
  updateStock,
  updateStatus,
  getProductsByCategory,
  addVariant,
  updateVariant,
  deleteVariant,
  updateSpecifications
} = require('../controllers/productController');

// Special routes
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/deal-of-the-day', getDealOfTheDay);

// Category products
router.get('/category/:categoryId', getProductsByCategory);

// Related products
router.get('/:id/related', getRelatedProducts);

// Variant routes
router.route('/:id/variants')
  .post(protect, authorize('admin'), addVariant);

router.route('/:id/variants/:variantIndex')
  .put(protect, authorize('admin'), updateVariant)
  .delete(protect, authorize('admin'), deleteVariant);

// Specifications
router.put('/:id/specifications', protect, authorize('admin'), updateSpecifications);

// Stock and status
router.put('/:id/stock', protect, authorize('admin'), updateStock);
router.put('/:id/status', protect, authorize('admin'), updateStatus);

// Image upload routes
router.put('/:id/main-image', protect, authorize('admin'), uploadMainImage);
router.put('/:id/gallery', protect, authorize('admin'), uploadGalleryImages);
router.delete('/:id/gallery/:imageIndex', protect, authorize('admin'), deleteGalleryImage);

// Main routes
router.route('/')
  .get(getProducts)
  .post(protect, authorize('admin'), createProduct);

router.route('/:id')
  .get(getProduct)
  .put(protect, authorize('admin'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;