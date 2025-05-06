import api from './axios';

const productService = {
  // Get all products with optional filtering
  getProducts: async (params) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  
  // Get a single product by ID
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  // Get products by category
  getProductsByCategory: async (categoryId, params) => {
    const response = await api.get(`/products/category/${categoryId}`, { params });
    return response.data;
  },
  
  // Get featured products
  getFeaturedProducts: async () => {
    const response = await api.get('/products/featured');
    return response.data;
  },
  
  // Get best sellers
  getBestSellers: async () => {
    const response = await api.get('/products/best-sellers');
    return response.data;
  },
  
  // Get new arrivals
  getNewArrivals: async () => {
    const response = await api.get('/products/new-arrivals');
    return response.data;
  },
  
  // Get deal of the day
  getDealOfTheDay: async () => {
    const response = await api.get('/products/deal-of-the-day');
    return response.data;
  },
  
  // Get related products
  getRelatedProducts: async (productId) => {
    const response = await api.get(`/products/${productId}/related`);
    return response.data;
  },
  
  // Admin functions
  // Create a product
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },
  
  // Update a product
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },
  
  // Delete a product
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  
  // Upload main product image
  uploadMainImage: async (id, formData) => {
    const response = await api.put(`/products/${id}/main-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Upload product gallery images
  uploadGalleryImages: async (id, formData) => {
    const response = await api.put(`/products/${id}/gallery`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Delete a gallery image
  deleteGalleryImage: async (productId, imageIndex) => {
    const response = await api.delete(`/products/${productId}/gallery/${imageIndex}`);
    return response.data;
  },
  
  // Update product stock
  updateStock: async (id, stockData) => {
    const response = await api.put(`/products/${id}/stock`, stockData);
    return response.data;
  },
  
  // Update product status (active/inactive)
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/products/${id}/status`, statusData);
    return response.data;
  },
  
  // Variant management
  addVariant: async (productId, variantData) => {
    const response = await api.post(`/products/${productId}/variants`, variantData);
    return response.data;
  },
  
  updateVariant: async (productId, variantIndex, variantData) => {
    const response = await api.put(`/products/${productId}/variants/${variantIndex}`, variantData);
    return response.data;
  },
  
  deleteVariant: async (productId, variantIndex) => {
    const response = await api.delete(`/products/${productId}/variants/${variantIndex}`);
    return response.data;
  },
  
  // Update product specifications
  updateSpecifications: async (id, specData) => {
    const response = await api.put(`/products/${id}/specifications`, specData);
    return response.data;
  },
  
  // Product count for dashboard
  getProductCount: async () => {
    try {
      const response = await api.get('/products', { params: { limit: 1 } });
      return { count: response.data.pagination?.total || 0 };
    } catch (error) {
      console.error("Error fetching product count:", error);
      return { count: 0 };
    }
  }
};

export default productService;