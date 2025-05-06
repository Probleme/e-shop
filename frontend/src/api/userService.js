import api from './axios';

const userService = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put('/auth/updatedetails', userData);
    return response.data;
  },
  
  // Update password
  updatePassword: async (passwordData) => {
    const response = await api.put('/auth/updatepassword', passwordData);
    return response.data;
  },
  
  // Admin functions
  // Get all users (admin)
  getUsers: async (params) => {
    const response = await api.get('/auth/users', { params });
    return response.data;
  },
  
  // Get specific user (admin)
  getUser: async (id) => {
    const response = await api.get(`/auth/users/${id}`);
    return response.data;
  },
  
  // Create user (admin)
  createUser: async (userData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },
  
  // Update user (admin)
  updateUser: async (id, userData) => {
    const response = await api.put(`/auth/users/${id}`, userData);
    return response.data;
  },
  
  // Delete user (admin)
  deleteUser: async (id) => {
    const response = await api.delete(`/auth/users/${id}`);
    return response.data;
  },
  
  // Get user count for dashboard
  getUserCount: async () => {
    try {
      const response = await api.get('/auth/users', { params: { limit: 1 } });
      return { count: response.data.pagination?.total || 0 };
    } catch (error) {
      console.error("Error fetching user count:", error);
      return { count: 0 };
    }
  }
};

export default userService;