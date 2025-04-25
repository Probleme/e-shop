import api from './axios';

const cartService = {
  // Get user's cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },
  
  // Add item to cart
  addToCart: async (productId, quantity = 1) => {
    const response = await api.post('/cart/add', { productId, quantity });
    return response.data;
  },
  
  // Update item quantity
  updateCartItem: async (productId, quantity) => {
    const response = await api.post('/cart/update', { productId, quantity });
    return response.data;
  },
  
  // Remove item from cart
  removeCartItem: async (productId) => {
    const response = await api.delete(`/cart/item/${productId}`);
    return response.data;
  },
  
  // Clear cart
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
  
  // Apply coupon
  applyCoupon: async (code) => {
    const response = await api.post('/cart/apply-coupon', { code });
    return response.data;
  },
  
  // Remove coupon
  removeCoupon: async () => {
    const response = await api.post('/cart/remove-coupon');
    return response.data;
  }
};

export default cartService;