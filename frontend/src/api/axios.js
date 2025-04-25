import axios from 'axios';
import { toast } from 'react-toastify';

// API base URL from environment variables with fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

// Response interceptor for handling errors
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || 'Something went wrong';
    
    // Don't show errors for authentication checks
    if (error.config.url !== '/auth/me') {
      toast.error(message);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Check if it's a token expiry issue
      if (error.response?.data?.message?.includes('expired')) {
        // Try to refresh token
        return api.get('/auth/refresh-token')
          .then(response => {
            // Retry the original request
            return api(error.config);
          })
          .catch(refreshError => {
            // If refresh fails, redirect to login
            window.location.href = '/login';
            return Promise.reject(refreshError);
          });
      }
      
      // Don't redirect on initial auth check
      if (error.config.url !== '/auth/me' && !error.config._retry) {
        // For authentication errors, redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;