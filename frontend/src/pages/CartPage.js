import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  RefreshCw,
  Loader
} from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      setCartItems(response.data.data.items || []);
      setCouponApplied(response.data.data.coupon || null);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    //   toast.error('Failed to load your cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCart();
  }, []);
  
  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    
    try {
      setUpdating(true);
      await api.post('/cart/update', { productId, quantity });
      
      // Update the local state
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.product._id === productId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error('Failed to update quantity. Please try again.');
      // Revert changes if API call fails
      fetchCart();
    } finally {
      setUpdating(false);
    }
  };
  
  const handleRemoveItem = async (productId) => {
    try {
      setUpdating(true);
      await api.delete(`/cart/item/${productId}`);
      
      // Update local state
      setCartItems(prevItems => prevItems.filter(item => item.product._id !== productId));
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error('Failed to remove item. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
      setUpdating(true);
      const response = await api.post('/cart/apply-coupon', { code: couponCode });
      setCouponApplied(response.data.data.coupon);
      toast.success('Coupon applied successfully!');
      fetchCart(); // Refresh cart to get updated totals
    } catch (error) {
      console.error('Failed to apply coupon:', error);
      toast.error(error.response?.data?.message || 'Invalid coupon code');
      setCouponApplied(null);
    } finally {
      setUpdating(false);
    }
  };
  
  const handleRemoveCoupon = async () => {
    try {
      setUpdating(true);
      await api.post('/cart/remove-coupon');
      setCouponApplied(null);
      setCouponCode('');
      toast.success('Coupon removed');
      fetchCart(); // Refresh cart to get updated totals
    } catch (error) {
      console.error('Failed to remove coupon:', error);
      toast.error('Failed to remove coupon. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  const proceedToCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Please log in to continue to checkout');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    
    navigate('/checkout');
  };
  
  // Calculate cart totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity, 
    0
  );
  
  const discount = couponApplied ? (subtotal * (couponApplied.discountPercentage / 100)) : 0;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = (subtotal - discount) * 0.08; // Assuming 8% tax
  const total = subtotal - discount + shipping + tax;
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-12 w-12 text-primary-600 animate-spin mb-4" />
          <h2 className="text-xl text-gray-700">Loading your cart...</h2>
        </div>
      </div>
    );
  }
  
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any products to your cart yet.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <div className="flex justify-between">
                <h3 className="font-semibold text-gray-700">Product</h3>
                <div className="flex space-x-8 md:space-x-16">
                  <h3 className="font-semibold text-gray-700 hidden sm:block">Price</h3>
                  <h3 className="font-semibold text-gray-700">Quantity</h3>
                  <h3 className="font-semibold text-gray-700 hidden sm:block">Subtotal</h3>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <div key={item.product._id} className="p-4 flex items-center hover:bg-gray-50">
                  {/* Product image and info */}
                  <div className="flex flex-1 items-center">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.product.imageUrl || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <Link 
                        to={`/product/${item.product._id}`}
                        className="font-medium text-gray-900 hover:text-primary-600"
                      >
                        {item.product.name}
                      </Link>
                      <div className="mt-1 text-sm text-gray-500">
                        {item.product.category?.name}
                      </div>
                      <div className="mt-1 sm:hidden text-sm text-gray-500">
                        ${item.product.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Price, quantity, subtotal */}
                  <div className="flex items-center space-x-4 md:space-x-8 md:space-x-16">
                    {/* Price (hidden on mobile) */}
                    <div className="hidden sm:block text-gray-900">
                      ${item.product.price.toFixed(2)}
                    </div>
                    
                    {/* Quantity */}
                    <div className="flex items-center border rounded-md">
                      <button 
                        className="px-2 py-1 text-gray-600 hover:text-gray-900"
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        disabled={updating || item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-1 border-x">{item.quantity}</span>
                      <button 
                        className="px-2 py-1 text-gray-600 hover:text-gray-900"
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        disabled={updating}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Subtotal (hidden on mobile) */}
                    <div className="hidden sm:block font-medium text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                    
                    {/* Remove button */}
                    <button 
                      onClick={() => handleRemoveItem(item.product._id)}
                      className="text-red-500 hover:text-red-700"
                      disabled={updating}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-4 py-4 bg-gray-50 flex justify-between">
              <Link 
                to="/products" 
                className="inline-flex items-center text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Continue Shopping
              </Link>
              
              <button 
                onClick={fetchCart}
                disabled={updating || loading}
                className="inline-flex items-center text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className={`mr-1 h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
                Update Cart
              </button>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
              </div>
              
              {/* Coupon Code Input */}
              <div className="pt-4 border-t border-gray-200">
                {couponApplied ? (
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-green-600 font-medium">
                          {couponApplied.code}
                        </span>
                        <span className="ml-2 text-gray-600 text-sm">
                          ({couponApplied.discountPercentage}% off)
                        </span>
                      </div>
                      <button 
                        onClick={handleRemoveCoupon}
                        className="text-sm text-red-500 hover:text-red-700"
                        disabled={updating}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-green-600">-${discount.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex mb-4">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={updating || !couponCode}
                      className="px-4 py-2 bg-gray-800 text-white rounded-r-md hover:bg-gray-700 transition disabled:bg-gray-400 text-sm"
                    >
                      {updating ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                {shipping === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <span className="text-gray-900">${shipping.toFixed(2)}</span>
                )}
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">${tax.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between border-t border-gray-200 pt-4">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-semibold text-gray-900">${total.toFixed(2)}</span>
              </div>
            </div>
            
            <button
              onClick={proceedToCheckout}
              disabled={processing || updating}
              className="w-full mt-8 flex justify-center items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:bg-primary-400"
            >
              {processing ? (
                <>
                  <Loader className="animate-spin mr-2 h-5 w-5" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Proceed to Checkout
                </>
              )}
            </button>
            
            <div className="mt-4">
              <p className="text-xs text-gray-500 text-center">
                Shipping calculated at checkout. Tax rates will be calculated based on your delivery address.
              </p>
            </div>
            
            <div className="mt-6 flex items-center justify-center space-x-4">
              <img src="/payment-icons/visa.svg" alt="Visa" className="h-8" />
              <img src="/payment-icons/mastercard.svg" alt="Mastercard" className="h-8" />
              <img src="/payment-icons/amex.svg" alt="American Express" className="h-8" />
              <img src="/payment-icons/paypal.svg" alt="PayPal" className="h-8" />
            </div>
          </div>
          
          {/* Recently viewed items or product recommendations could go here */}
        </div>
      </div>
    </div>
  );
};

export default Cart;