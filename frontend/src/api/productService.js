import api from './axios';

const productService = {
  // Get all products with filtering
  getProducts: async (params) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  
  // Get a single product by ID or slug
  getProduct: async (idOrSlug) => {
    const response = await api.get(`/products/${idOrSlug}`);
    return response.data;
  },
  
  // Get featured products
  getFeatured: async (limit = 8) => {
    const response = await api.get(`/products/featured`, { params: { limit } });
    return response.data;
  },
  
  // Get new arrivals
  getNewArrivals: async (limit = 8) => {
    const response = await api.get(`/products/new-arrivals`, { params: { limit } });
    return response.data;
  },
  
  // Get bestsellers
  getBestSellers: async (limit = 8) => {
    const response = await api.get(`/products/best-sellers`, { params: { limit } });
    return response.data;
  },
  
  // Get deal of the day
  getDealOfTheDay: async () => {
    const response = await api.get(`/products/deal-of-the-day`);
    return response.data;
  },
  
  // Get related products
  getRelatedProducts: async (productId, limit = 4) => {
    const response = await api.get(`/products/${productId}/related`, { params: { limit } });
    return response.data;
  }
};

export default productService;