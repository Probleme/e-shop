import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import productService from '../api/productService';
import { useCart } from '../contexts/CartContext';
import {
  ShoppingBag,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RefreshCcw,
  Minus,
  Plus,
  Star,
  ChevronRight,
  ChevronLeft,
  Check,
  Info,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

// Product Image Gallery Component
const ProductGallery = ({ mainImage, images = [] }) => {
  const [currentImage, setCurrentImage] = useState(mainImage);
  const [activeThumb, setActiveThumb] = useState(0);
  
  // Update current image when props change
  useEffect(() => {
    setCurrentImage(mainImage);
    setActiveThumb(0);
  }, [mainImage, images]);
  
  // Set of images including main image
  const allImages = [mainImage, ...images.filter(img => img !== mainImage)];
  
  return (
    <div>
      {/* Main image */}
      <div className="mb-4 aspect-square overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
        <img
          src={currentImage || '/placeholder-product.jpg'}
          alt="Product"
          className="h-full w-full object-cover object-center"
        />
      </div>
      
      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {allImages.map((image, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentImage(image);
                setActiveThumb(i);
              }}
              className={`relative flex-shrink-0 w-16 h-16 overflow-hidden rounded-md border-2 ${
                activeThumb === i 
                  ? 'border-primary-600' 
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={image || '/placeholder-product.jpg'}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Related Products Component
const RelatedProducts = ({ productId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getRelatedProducts(productId, 4);
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch related products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (productId) {
      fetchRelatedProducts();
    }
  }, [productId]);
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw size={24} className="animate-spin text-primary-600" />
      </div>
    );
  }
  
  if (products.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link 
            key={product._id} 
            to={`/product/${product.slug || product._id}`} 
            className="group"
          >
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.mainImage || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center mt-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={`${
                          i < Math.floor(product.rating) 
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
                <p className="mt-2 font-bold text-gray-900">
                  ${product.price?.toFixed(2)}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="ml-2 text-sm font-normal text-gray-500 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [activeTab, setActiveTab] = useState('description');
  
  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productService.getProduct(id);
        setProduct(response.data);
        
        // Initialize selected variants if product has variants
        if (response.data.variants && response.data.variants.length > 0) {
          const initialVariants = {};
          response.data.variants.forEach(variant => {
            initialVariants[variant.name] = variant.options[0];
          });
          setSelectedVariants(initialVariants);
        }
        
        // Reset quantity when product changes
        setQuantity(1);
      } catch (err) {
        console.error('Failed to fetch product details:', err);
        setError('Could not load product details. Please try again.');
        toast.error('Error loading product details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [id]);
  
  // Handle quantity changes
  const incrementQuantity = () => {
    if (quantity < (product?.stock || 10)) {
      setQuantity(prev => prev + 1);
    }
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  // Handle variant selection
  const handleVariantChange = (variantName, optionValue) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: optionValue
    }));
  };
  
  // Add to cart handler
  const handleAddToCart = async () => {
    if (!product) return;
    
    // Check if the product is in stock
    if (product.stock <= 0) {
      toast.error('This product is currently out of stock');
      return;
    }
    
    const success = await addToCart(product._id, quantity);
    if (success) {
      toast.success(`${product.name} added to your cart!`);
    }
  };
  
  // Buy now handler
  const handleBuyNow = async () => {
    if (!product) return;
    
    // Check if the product is in stock
    if (product.stock <= 0) {
      toast.error('This product is currently out of stock');
      return;
    }
    
    const success = await addToCart(product._id, quantity);
    if (success) {
      navigate('/cart');
    }
  };
  
  // Calculate discount percentage
  const discountPercentage = product && product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
    
  // Check if product is in stock
  const inStock = product && product.stock > 0;
  
  // Get stock status label
  const getStockStatus = () => {
    if (!product) return '';
    
    if (product.stock <= 0) return 'Out of stock';
    if (product.stock <= 5) return `Low stock (${product.stock} left)`;
    return 'In stock';
  };
  
  // Get stock status color
  const getStockStatusColor = () => {
    if (!product) return 'text-gray-500';
    
    if (product.stock <= 0) return 'text-red-500';
    if (product.stock <= 5) return 'text-orange-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <RefreshCw size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle size={40} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Product not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the product you're looking for. It may have been removed or the URL is incorrect.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
          >
            <ChevronLeft className="mr-1" size={16} />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <ChevronRight size={16} className="mx-2" />
        <Link to="/products" className="hover:text-primary-600">Products</Link>
        {product.category && (
          <>
            <ChevronRight size={16} className="mx-2" />
            <Link 
              to={`/products?category=${product.category._id}`} 
              className="hover:text-primary-600"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight size={16} className="mx-2" />
        <span className="text-gray-800">{product.name}</span>
      </nav>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 p-6">
          {/* Product Images */}
          <div>
            <ProductGallery 
              mainImage={product.mainImage} 
              images={product.images || []} 
            />
          </div>
          
          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={18} 
                    className={`${
                      i < Math.floor(product.rating) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                ({product.reviewCount || 0} reviews)
              </span>
            </div>
            
            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-900">
                ${product.price?.toFixed(2)}
              </span>
              {discountPercentage > 0 && (
                <>
                  <span className="ml-3 text-lg text-gray-500 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded text-sm font-medium">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>
            
            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-gray-600 mb-6">
                {product.shortDescription}
              </p>
            )}
            
            {/* Stock Status */}
            <div className="flex items-center mb-6">
              <div className={`flex items-center ${getStockStatusColor()}`}>
                {inStock ? (
                  <Check size={16} className="mr-1" />
                ) : (
                  <Info size={16} className="mr-1" />
                )}
                <span className="font-medium">{getStockStatus()}</span>
              </div>
              
              {product.sku && (
                <div className="ml-6 text-gray-500 text-sm">
                  SKU: <span className="font-medium">{product.sku}</span>
                </div>
              )}
            </div>
            
            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 mb-6">
                {product.variants.map((variant, idx) => (
                  <div key={idx}>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      {variant.name}:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option, i) => (
                        <button
                          key={i}
                          onClick={() => handleVariantChange(variant.name, option)}
                          className={`px-3 py-1 rounded border ${
                            selectedVariants[variant.name] === option
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity:</h3>
              <div className="flex items-center">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="p-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Minus size={16} />
                </button>
                <div className="px-4 py-2 w-16 text-center border-t border-b border-gray-300">
                  {quantity}
                </div>
                <button
                  onClick={incrementQuantity}
                  disabled={quantity >= (product.stock || 10)}
                  className="p-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 md:flex-none md:min-w-[180px] flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Add to Cart
              </button>
              
              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className="flex-1 md:flex-none md:min-w-[180px] flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
              
              <button className="p-3 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                <Heart size={20} />
              </button>
              
              <button className="p-3 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                <Share2 size={20} />
              </button>
            </div>
            
            {/* Additional Info */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <div className="flex items-center text-sm">
                <Truck className="h-5 w-5 text-gray-500 mr-2" />
                <span>
                  Free shipping on orders over $50
                </span>
              </div>
              
              <div className="flex items-center text-sm">
                <ShieldCheck className="h-5 w-5 text-gray-500 mr-2" />
                <span>
                  30-day money-back guarantee
                </span>
              </div>
              
              <div className="flex items-center text-sm">
                <RefreshCcw className="h-5 w-5 text-gray-500 mr-2" />
                <span>
                  Easy returns & exchanges
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Tabs */}
        <div className="border-t border-gray-200 mt-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-6 text-center font-medium text-sm whitespace-nowrap ${
                  activeTab === 'description'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Description
              </button>
              
              {product.specifications && product.specifications.length > 0 && (
                <button
                  onClick={() => setActiveTab('specifications')}
                  className={`py-4 px-6 text-center font-medium text-sm whitespace-nowrap ${
                    activeTab === 'specifications'
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Specifications
                </button>
              )}
              
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-6 text-center font-medium text-sm whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reviews ({product.reviewCount || 0})
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {/* Description Tab */}
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                {product.description.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
            
            {/* Specifications Tab */}
            {activeTab === 'specifications' && product.specifications && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="divide-y divide-gray-200">
                    {product.specifications.map((spec, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                          {spec.name}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Additional fixed specifications */}
                    {product.weight?.value && (
                      <tr>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                          Weight
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {product.weight.value} {product.weight.unit}
                        </td>
                      </tr>
                    )}
                    
                    {product.dimensions?.length && (
                      <tr>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                          Dimensions
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {product.dimensions.unit}
                        </td>
                      </tr>
                    )}
                    
                    {product.brand && (
                      <tr>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                          Brand
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {product.brand}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {product.reviews.map((review, idx) => (
                      <div key={idx} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-center mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={16} 
                                className={`${
                                  i < review.rating 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {review.user?.name || 'Customer'}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.text || review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reviews yet</p>
                    <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
                      Write a Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Related Products */}
      <RelatedProducts productId={product._id} />
    </div>
  );
};

export default ProductDetail;