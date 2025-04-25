import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { X, ShoppingBag, Trash2 } from 'lucide-react';

const MiniCart = ({ isOpen, onClose }) => {
  const { cartItems, totals, removeFromCart, updateCartItemQuantity } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Mini cart drawer */}
      <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Cart items */}
        {cartItems.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
            <ShoppingBag size={40} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link
              to="/products"
              onClick={onClose}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-grow overflow-y-auto p-4">
              <ul className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <li key={item.product._id} className="py-4 flex">
                    <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                      <img
                        src={item.product.mainImage || item.product.imageUrl || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        className="w-full h-full object-center object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1 flex flex-col">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            <Link 
                              to={`/product/${item.product._id}`} 
                              onClick={onClose}
                              className="hover:text-primary-600"
                            >
                              {item.product.name}
                            </Link>
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex-1 flex items-end justify-between">
                        <div className="flex items-center">
                          <button
                            onClick={() => updateCartItemQuantity(item.product._id, item.quantity - 1)}
                            className="text-gray-400 hover:text-gray-500"
                            disabled={item.quantity <= 1}
                          >
                            <span className="sr-only">Decrease quantity</span>
                            <span className="text-lg font-medium">−</span>
                          </button>
                          <span className="mx-2 text-gray-700">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(item.product._id, item.quantity + 1)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <span className="sr-only">Increase quantity</span>
                            <span className="text-lg font-medium">+</span>
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product._id)}
                          className="text-red-500 hover:text-red-600"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Summary */}
            <div className="border-t border-gray-200 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <p className="text-gray-500">Subtotal</p>
                <p className="font-medium">${totals.subtotal?.toFixed(2)}</p>
              </div>
              
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">Discount</p>
                  <p className="font-medium text-green-600">-${totals.discount.toFixed(2)}</p>
                </div>
              )}
              
              <div className="flex justify-between text-base font-medium pt-2 border-t border-gray-200">
                <p className="text-gray-900">Total</p>
                <p className="text-gray-900">${totals.total?.toFixed(2)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="text-center py-2 px-4 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 transition"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MiniCart;