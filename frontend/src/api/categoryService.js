import api from './axios';

const sanitizeCategoryData = (data) => {
  const sanitizedData = { ...data };
  
  // Remove empty parent field
  if (sanitizedData.parent === '') {
    delete sanitizedData.parent;
  }
  
  return sanitizedData;
};


const categoryService = {
  // Get all categories
  getCategories: async (params) => {
    const response = await api.get('/categories', { params });
    return response.data;
  },
  
  // Get top-level categories (categories with no parent)
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
  },
  
  // Admin functions
  // Update these two methods
  createCategory: async (categoryData) => {
    const sanitizedData = sanitizeCategoryData(categoryData);
    const response = await api.post('/categories', sanitizedData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const sanitizedData = sanitizeCategoryData(categoryData);
    const response = await api.put(`/categories/${id}`, sanitizedData);
    return response.data;
  },
  
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
  
  uploadCategoryImage: async (id, formData) => {
    const response = await api.put(`/categories/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default categoryService;