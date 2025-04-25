import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import useAuth from '../hooks/useAuth'; // Fix: import from hooks folder instead
import api from '../api/axios';
import { toast } from 'react-toastify';
import { 
  CreditCard, 
  Truck, 
  User, 
  ChevronRight, 
  MapPin, 
  Phone, 
  RefreshCw,
  Lock,
  AlertTriangle,
  Check
} from 'lucide-react';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, totals, coupon, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phoneNumber: ''
  });

  // Fill default shipping address if user has previously used address
  useEffect(() => {
    if (user?.address) {
      setShippingAddress({
        address: user.address.street || '',
        city: user.address.city || '',
        postalCode: user.address.postalCode || '',
        country: user.address.country || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0) {
      toast.info('Your cart is empty');
      navigate('/cart');
    }
  }, [cartItems, cartLoading, navigate]);

  // Handle shipping address change
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress({
      ...shippingAddress,
      [name]: value
    });
  };

  // Validate address form
  const validateAddressForm = () => {
    const { address, city, postalCode, country } = shippingAddress;
    if (!address || !city || !postalCode || !country) {
      toast.error('Please fill all required fields');
      return false;
    }
    return true;
  };

  // Continue to payment step
  const handleContinueToPayment = (e) => {
    e.preventDefault();
    if (validateAddressForm()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  // Handle order placement
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Create order items from cart items
      const orderItems = cartItems.map(item => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        imageUrl: item.product.mainImage || item.product.imageUrl
      }));

      // Create order payload
      const orderData = {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice: totals.subtotal,
        shippingPrice: totals.shipping,
        taxPrice: totals.tax,
        discountAmount: totals.discount,
        totalPrice: totals.total
      };

      // If coupon is applied, add to order
      if (coupon) {
        orderData.coupon = {
          code: coupon.code,
          discountPercentage: coupon.discountPercentage
        };
      }

      // Send order to API
      const response = await api.post('/api/orders', orderData);
      
      // Clear cart after successful order
      await clearCart();
      
      // Show success message
      toast.success('Order placed successfully!');
      
      // Navigate to order confirmation
      navigate(`/order/${response.data.data._id}`);
      
    } catch (err) {
      console.error('Failed to place order:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <RefreshCw size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Checkout</h1>
      
      {/* Checkout steps */}
      <div className="flex mb-8 overflow-x-auto">
        <div 
          className={`flex-1 px-4 py-2 text-center border-b-2 ${
            step >= 1 ? 'border-primary-600 text-primary-700' : 'border-gray-200 text-gray-500'
          }`}
        >
          <div className="flex items-center justify-center">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 ${
              step >= 1 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <User size={14} />
            </div>
            <span>Shipping</span>
          </div>
        </div>
        <div className="flex items-center px-2">
          <ChevronRight className="text-gray-400" />
        </div>
        <div 
          className={`flex-1 px-4 py-2 text-center border-b-2 ${
            step >= 2 ? 'border-primary-600 text-primary-700' : 'border-gray-200 text-gray-500'
          }`}
        >
          <div className="flex items-center justify-center">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 ${
              step >= 2 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <CreditCard size={14} />
            </div>
            <span>Payment</span>
          </div>
        </div>
        <div className="flex items-center px-2">
          <ChevronRight className="text-gray-400" />
        </div>
        <div 
          className={`flex-1 px-4 py-2 text-center border-b-2 ${
            step >= 3 ? 'border-primary-600 text-primary-700' : 'border-gray-200 text-gray-500'
          }`}
        >
          <div className="flex items-center justify-center">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 ${
              step >= 3 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <Check size={14} />
            </div>
            <span>Complete</span>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertTriangle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main checkout form */}
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <MapPin className="mr-2" size={18} />
                  Shipping Address
                </h2>
              </div>
              <form onSubmit={handleContinueToPayment} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={shippingAddress.address}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={shippingAddress.postalCode}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={shippingAddress.phoneNumber}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/cart')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <CreditCard className="mr-2" size={18} />
                  Payment Method
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="credit_card"
                      name="paymentMethod"
                      type="radio"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => handlePaymentMethodChange('credit_card')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="credit_card" className="ml-3 flex items-center">
                      <img src="/payment-icons/credit-card.svg" alt="Credit Card" className="h-8 mr-2" />
                      <span className="text-gray-800">Credit/Debit Card</span>
                    </label>
                  </div>
                  
                  {paymentMethod === 'credit_card' && (
                    <div className="ml-7 mt-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Card Number
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="cardNumber"
                              placeholder="1234 5678 9012 3456"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <CreditCard size={16} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            id="expiryDate"
                            placeholder="MM/YY"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
                            CVC
                          </label>
                          <input
                            type="text"
                            id="cvc"
                            placeholder="123"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="col-span-2">
                          <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-1">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            id="cardholderName"
                            placeholder="John Smith"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div className="flex items-center mt-4 text-xs text-gray-600">
                        <Lock size={14} className="mr-1" />
                        <span>Your payment information is encrypted and secure.</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      id="paypal"
                      name="paymentMethod"
                      type="radio"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => handlePaymentMethodChange('paypal')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="paypal" className="ml-3 flex items-center">
                      <img src="/payment-icons/paypal.svg" alt="PayPal" className="h-6 mr-2" />
                      <span className="text-gray-800">PayPal</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="cash_on_delivery"
                      name="paymentMethod"
                      type="radio"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={() => handlePaymentMethodChange('cash_on_delivery')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="cash_on_delivery" className="ml-3 flex items-center">
                      <span className="text-gray-800">Cash on Delivery</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center mt-8 pt-4 border-t border-gray-200">
                  <MapPin size={16} className="text-gray-600 mr-2" />
                  <div>
                    <h3 className="font-medium text-gray-800">Shipping Address</h3>
                    <p className="text-sm text-gray-600">
                      {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.postalCode}, {shippingAddress.country}
                    </p>
                    {shippingAddress.phoneNumber && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Phone size={14} className="mr-1" />
                        {shippingAddress.phoneNumber}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => setStep(1)} 
                    className="ml-auto text-sm text-primary-600 hover:text-primary-800"
                  >
                    Change
                  </button>
                </div>
                
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition flex items-center disabled:bg-primary-400 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
            </div>
            <div className="p-6">
              {/* Order items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.product._id} className="flex items-start">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.product.mainImage || item.product.imageUrl || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium text-gray-800">
                          {item.product.name}
                        </h3>
                        <p className="text-sm font-medium text-gray-800">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Price breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <p className="text-gray-600">Subtotal</p>
                  <p className="text-gray-800">${totals.subtotal?.toFixed(2)}</p>
                </div>
                
                {coupon && totals.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <p className="text-gray-600">Discount</p>
                      <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                        {coupon.code}
                      </span>
                    </div>
                    <p className="text-green-600">-${totals.discount?.toFixed(2)}</p>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <p className="text-gray-600">Shipping</p>
                  {totals.shipping > 0 ? (
                    <p className="text-gray-800">${totals.shipping?.toFixed(2)}</p>
                  ) : (
                    <p className="text-green-600">Free</p>
                  )}
                </div>
                
                <div className="flex justify-between text-sm">
                  <p className="text-gray-600">Tax</p>
                  <p className="text-gray-800">${totals.tax?.toFixed(2)}</p>
                </div>
                
                <div className="flex justify-between pt-4 border-t border-gray-200 mt-4">
                  <p className="text-base font-bold text-gray-900">Total</p>
                  <p className="text-base font-bold text-gray-900">${totals.total?.toFixed(2)}</p>
                </div>
              </div>
              
              {/* Shipping info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center mb-4">
                  <Truck size={18} className="text-gray-500 mr-2" />
                  <h3 className="font-medium text-gray-800">Shipping Information</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {totals.subtotal > 50 ? (
                    <span className="text-green-600">Free shipping on orders over $50</span>
                  ) : (
                    <>Shipping fee: <span className="font-medium">${totals.shipping?.toFixed(2)}</span></>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  Estimated delivery: <span className="font-medium">3-5 business days</span>
                </p>
              </div>
              
              {/* Secure checkout note */}
              <div className="flex items-center justify-center mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
                <Lock size={14} className="mr-1" />
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;