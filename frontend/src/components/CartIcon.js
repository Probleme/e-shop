import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const CartIcon = () => {
  const { cartItems, getCartItemCount } = useCart();
  const itemCount = getCartItemCount();

  return (
    <Link 
      to="/cart" 
      className="relative p-2 text-gray-600 hover:text-primary-600 transition"
      aria-label="Shopping cart"
    >
      <ShoppingCart size={22} />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;