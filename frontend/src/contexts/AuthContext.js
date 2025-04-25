import { createContext, useEffect, useState } from 'react';
import authApi from '../api/auth';
import { toast } from 'react-toastify';

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const response = await authApi.getCurrentUser();
        
        if (response?.status === 'success' && response.data?.user) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
        setError('Failed to verify authentication status');
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authApi.login(credentials);
      
      if (response.status === 'success') {
        setUser(response.data.user);
        toast.success('Login successful! Welcome back!');
        return { success: true };
      }
      
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Register function (doesn't log user in)
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authApi.register(userData);
      return { success: true, data: response };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authApi.logout();
      setUser(null);
      toast.info('You have been logged out.');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user from context even if API call fails
      setUser(null);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (passwordData) => {
    try {
      setLoading(true);
      const response = await authApi.updatePassword(passwordData);
      
      if (response.status === 'success') {
        toast.success('Password updated successfully!');
        return { success: true };
      }
      
      return { success: false, message: response.message || 'Password update failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Password update failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Function to update user data
    const updateUser = (userData) => {
        setUser(prevUser => ({
        ...prevUser,
        ...userData
    }));
};

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initialized,
        error,
        login,
        register,
        logout,
        updatePassword,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};