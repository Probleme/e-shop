import api from './axios';

const cartService = {
  // Get current cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },
  
  // Add item to cart
  addToCart: async (productId, quantity = 1, variant = null) => {
    const response = await api.post('/cart/add', { productId, quantity, variant });
    return response.data;
  },
  
  // Update cart item quantity
  updateCartItem: async (itemId, quantity) => {
    const response = await api.post('/cart/update', { itemId, quantity });
    return response.data;
  },
  
  // Remove item from cart
  removeCartItem: async (itemId) => {
    const response = await api.delete(`/cart/item/${itemId}`);
    return response.data;
  },
  
  // Clear entire cart
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
  
  // Apply coupon to cart
  applyCoupon: async (code) => {
    const response = await api.post('/cart/apply-coupon', { code });
    return response.data;
  },
  
  // Remove coupon from cart
  removeCoupon: async () => {
    const response = await api.post('/cart/remove-coupon');
    return response.data;
  }
};

export default cartService;