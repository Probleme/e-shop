import React, { createContext, useContext, useState, useEffect } from 'react';
import cartService from '../api/cartService';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load cart when component mounts or when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // If user is not authenticated, initialize with empty cart
      setCartItems([]);
      setCoupon(null);
      setTotals({
        subtotal: 0,
        discount: 0,
        shipping: 0,
        tax: 0,
        total: 0
      });
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch the cart data
  const fetchCart = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.getCart();
      setCartItems(response.data.items || []);
      setCoupon(response.data.coupon || null);
      setTotals(response.data.totals || {
        subtotal: 0,
        discount: 0,
        shipping: 0,
        tax: 0,
        total: 0
      });
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart data');
      toast.error('Failed to load your cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.info('Please log in to add items to your cart');
      return;
    }
    
    try {
      const response = await cartService.addToCart(productId, quantity);
      setCartItems(response.data.items);
      setCoupon(response.data.coupon);
      setTotals(response.data.totals);
      toast.success('Item added to cart!');
      return true;
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error(err.response?.data?.message || 'Failed to add item to cart');
      return false;
    }
  };

  // Update item quantity
  const updateCartItemQuantity = async (productId, quantity) => {
    try {
      const response = await cartService.updateCartItem(productId, quantity);
      setCartItems(response.data.items);
      setCoupon(response.data.coupon);
      setTotals(response.data.totals);
      return true;
    } catch (err) {
      console.error('Error updating cart:', err);
      toast.error('Failed to update quantity');
      return false;
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      const response = await cartService.removeCartItem(productId);
      setCartItems(response.data.items);
      setCoupon(response.data.coupon);
      setTotals(response.data.totals);
      toast.success('Item removed from cart');
      return true;
    } catch (err) {
      console.error('Error removing from cart:', err);
      toast.error('Failed to remove item');
      return false;
    }
  };

  // Clear the cart
  const clearCart = async () => {
    try {
      const response = await cartService.clearCart();
      setCartItems(response.data.items || []);
      setCoupon(null);
      setTotals(response.data.totals);
      toast.success('Cart cleared');
      return true;
    } catch (err) {
      console.error('Error clearing cart:', err);
      toast.error('Failed to clear cart');
      return false;
    }
  };

  // Apply coupon
  const applyCoupon = async (code) => {
    try {
      const response = await cartService.applyCoupon(code);
      setCartItems(response.data.items);
      setCoupon(response.data.coupon);
      setTotals(response.data.totals);
      toast.success('Coupon applied successfully!');
      return true;
    } catch (err) {
      console.error('Error applying coupon:', err);
      toast.error(err.response?.data?.message || 'Invalid coupon code');
      return false;
    }
  };

  // Remove coupon
  const removeCoupon = async () => {
    try {
      const response = await cartService.removeCoupon();
      setCartItems(response.data.items);
      setCoupon(null);
      setTotals(response.data.totals);
      toast.success('Coupon removed');
      return true;
    } catch (err) {
      console.error('Error removing coupon:', err);
      toast.error('Failed to remove coupon');
      return false;
    }
  };

  // Get cart item count
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    coupon,
    totals,
    loading,
    error,
    fetchCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    getCartItemCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};