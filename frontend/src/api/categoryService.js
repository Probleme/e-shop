import api from './axios';

const categoryService = {
  // Get all categories
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  
  // Get top-level categories
  getTopLevelCategories: async () => {
    const response = await api.get('/categories/top-level');
    return response.data;
  },
  
  // Get featured categories
  getFeaturedCategories: async () => {
    const response = await api.get('/categories/featured');
    return response.data;
  },
  
  // Get a single category by ID
  getCategory: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
  
  // Get a category by slug
  getCategoryBySlug: async (slug) => {
    const response = await api.get(`/categories/slug/${slug}`);
    return response.data;
  },
  
  // Get subcategories for a category
  getSubcategories: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}/subcategories`);
    return response.data;
  },
  
  // Get products in a category
  getCategoryProducts: async (categoryId, params) => {
    const response = await api.get(`/categories/${categoryId}/products`, { params });
    return response.data;
  }
};

export default categoryService;