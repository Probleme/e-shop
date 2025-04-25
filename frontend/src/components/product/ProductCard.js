import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-toastify';

const ProductCard = ({ product, listView = false }) => {
  const { addToCart } = useCart();
  
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await addToCart(product._id, 1);
    if (success) {
      toast.success(`${product.name} added to cart!`);
    }
  };
  
  // Calculate discount percentage if original price exists and is higher than current price
  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Handle product image
  const productImage = product.mainImage || (product.images && product.images.length > 0 
    ? product.images[0] 
    : '/placeholder-product.jpg');
  
  if (listView) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-4 hover:shadow-md transition">
        <Link 
          to={`/product/${product.slug || product._id}`} 
          className="block md:w-1/4 flex-shrink-0"
        >
          <div className="relative h-48 md:h-full overflow-hidden rounded-md">
            <img 
              src={productImage} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
            {discountPercentage > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                {discountPercentage}% OFF
              </div>
            )}
          </div>
        </Link>
        
        <div className="flex-grow flex flex-col">
          <Link to={`/product/${product.slug || product._id}`}>
            <h3 className="font-medium text-lg text-gray-900 hover:text-primary-600">
              {product.name}
            </h3>
          </Link>
          
          <div className="flex items-center mt-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={16} 
                  className={`${
                    i < Math.floor(product.rating || 0) 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
            <span className="ml-1 text-sm text-gray-600">
              ({product.reviewCount || 0})
            </span>
          </div>
          
          <p className="text-gray-600 text-sm mt-2 line-clamp-3">
            {product.shortDescription || product.description?.substring(0, 150)}
          </p>
          
          <div className="mt-auto pt-4 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">${product.price?.toFixed(2)}</span>
              {discountPercentage > 0 && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ${product.originalPrice?.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="inline-flex items-center px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={16} className="mr-1" />
                {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                className="p-2 border border-gray-300 rounded-md text-gray-500 hover:text-primary-600 hover:border-primary-600 transition"
                aria-label="Add to wishlist"
              >
                <Heart size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition group">
      <Link to={`/product/${product.slug || product._id}`} className="block relative">
        <div className="h-48 overflow-hidden">
          <img 
            src={productImage} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        </div>
        
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {discountPercentage}% OFF
          </div>
        )}
        
        {product.stock <= 0 && (
          <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white text-xs font-bold px-2 py-1 rounded">
            Out of Stock
          </div>
        )}
        
        {/* Quick actions */}
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (product.stock > 0) {
                  addToCart(product._id, 1);
                  toast.success(`${product.name} added to cart!`);
                } else {
                  toast.info('This product is out of stock');
                }
              }}
              disabled={product.stock <= 0}
              className="bg-white text-gray-900 rounded-full p-2 shadow-md hover:bg-primary-600 hover:text-white transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              aria-label="Add to cart"
            >
              <ShoppingBag size={18} />
            </button>
          </div>
        </div>
      </Link>
      
      <div className="p-4">
        {/* Product category if available */}
        {product.category && product.category.name && (
          <Link 
            to={`/category/${product.category._id}`}
            className="text-xs text-gray-500 hover:text-primary-600 transition"
          >
            {product.category.name}
          </Link>
        )}
        
        <Link to={`/product/${product.slug || product._id}`}>
          <h3 className="font-medium text-gray-800 hover:text-primary-600 transition line-clamp-2 mt-1">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center mt-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={14} 
                className={`${
                  i < Math.floor(product.rating || 0) 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-300'
                }`} 
              />
            ))}
          </div>
          <span className="ml-1 text-xs text-gray-600">
            ({product.reviewCount || 0})
          </span>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">${product.price?.toFixed(2)}</span>
            {discountPercentage > 0 && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                ${product.originalPrice?.toFixed(2)}
              </span>
            )}
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full shadow-sm transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            aria-label="Add to cart"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;