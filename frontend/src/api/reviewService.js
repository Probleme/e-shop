import api from './axios';

const reviewService = {
  // Get all reviews for a product
  getProductReviews: async (productId, params) => {
    const response = await api.get(`/products/${productId}/reviews`, { params });
    return response.data;
  },
  
  // Get a specific review
  getReview: async (productId, reviewId) => {
    const response = await api.get(`/products/${productId}/reviews/${reviewId}`);
    return response.data;
  },
  
  // Add a new review (requires authentication)
  addReview: async (productId, reviewData) => {
    const response = await api.post(`/products/${productId}/reviews`, reviewData);
    return response.data;
  },
  
  // Update a review (requires authentication and ownership)
  updateReview: async (productId, reviewId, reviewData) => {
    const response = await api.put(`/products/${productId}/reviews/${reviewId}`, reviewData);
    return response.data;
  },
  
  // Delete a review (requires authentication and ownership or admin)
  deleteReview: async (productId, reviewId) => {
    const response = await api.delete(`/products/${productId}/reviews/${reviewId}`);
    return response.data;
  },
  
  // Verify a review (admin only)
  verifyReview: async (productId, reviewId) => {
    const response = await api.put(`/products/${productId}/reviews/${reviewId}/verify`);
    return response.data;
  },
  
  // Get all reviews (admin function)
  getAllReviews: async (params) => {
    const response = await api.get('/reviews', { params });
    return response.data;
  }
};

export default reviewService;