import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import { 
  ShoppingBag, 
  Star, 
  Truck, 
  Shield, 
  Clock, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  ArrowRight,
  Mail,
  Settings,
  BarChart2,
  Package,
  PlusCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

// Component for product card
const ProductCard = ({ product }) => {
  const addToCart = async (productId) => {
    try {
      await api.post('/cart/add', { productId, quantity: 1 });
      toast.success('Product added to cart');
    } catch (err) {
      toast.error('Failed to add product to cart');
    }
  };

  const addToWishlist = async (productId) => {
    try {
      await api.post('/wishlist/add', { productId });
      toast.success('Product added to wishlist');
    } catch (err) {
      toast.error('Failed to add product to wishlist');
    }
  };
  
  const discountPercentage = product.originalPrice && 
    Math.round((product.originalPrice - product.price) / product.originalPrice * 100);
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition group">
      <div className="relative">
        <Link to={`/product/${product._id}`}>
          <div className="h-64 overflow-hidden">
            <img 
              src={product.imageUrl || '/placeholder-product.jpg'} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          </div>
        </Link>
        
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {discountPercentage}% OFF
          </div>
        )}
        
        <button 
          onClick={() => addToWishlist(product._id)}
          className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-sm hover:bg-gray-100 transition"
        >
          <Heart className="h-5 w-5 text-gray-400 hover:text-red-500" />
        </button>
      </div>
      
      <div className="p-4">
        <span className="text-xs text-gray-500">{product.category?.name}</span>
        <Link to={`/product/${product._id}`}>
          <h3 className="font-medium text-gray-800 hover:text-primary-600 transition mt-1 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center mt-1">
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-current text-amber-400" />
            <span className="ml-1 text-sm text-gray-600">
              {product.rating || 0}
            </span>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">${product.price?.toFixed(2)}</span>
            {product.originalPrice > product.price && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                ${product.originalPrice?.toFixed(2)}
              </span>
            )}
          </div>
          <button 
            onClick={() => addToCart(product._id)}
            className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full shadow-sm transition"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Testimonial component
const Testimonial = ({ testimonial }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
    <div className="flex items-center space-x-2 mb-1">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`h-5 w-5 ${i < testimonial.rating ? 'fill-current text-yellow-400' : 'text-gray-300'}`} 
        />
      ))}
    </div>
    <p className="text-gray-600 mt-3">{testimonial.content}</p>
    <div className="flex items-center mt-6">
      <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
        <img 
          src={testimonial.user?.avatar || '/placeholder-avatar.jpg'} 
          alt={testimonial.user?.name} 
          className="h-full w-full object-cover" 
        />
      </div>
      <div className="ml-3">
        <h4 className="font-medium text-gray-900">{testimonial.user?.name}</h4>
        <p className="text-sm text-gray-500">Verified Customer</p>
      </div>
    </div>
  </div>
);

// Admin Quick Actions Component
const AdminQuickActions = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
        <Settings className="mr-2 h-5 w-5" />
        Admin Quick Actions
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/admin/dashboard"
          className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
        >
          <BarChart2 className="h-8 w-8 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-800">Dashboard</span>
        </Link>
        
        <Link
          to="/admin/products"
          className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
        >
          <Package className="h-8 w-8 text-green-600 mb-2" />
          <span className="text-sm font-medium text-gray-800">Products</span>
        </Link>
        
        <Link
          to="/admin/products/new"
          className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
        >
          <PlusCircle className="h-8 w-8 text-purple-600 mb-2" />
          <span className="text-sm font-medium text-gray-800">New Product</span>
        </Link>
        
        <Link
          to="/admin/settings"
          className="flex flex-col items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition"
        >
          <Settings className="h-8 w-8 text-amber-600 mb-2" />
          <span className="text-sm font-medium text-gray-800">Settings</span>
        </Link>
      </div>
    </div>
  );
};

const HomePage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleProducts, setVisibleProducts] = useState(4); // Default for smaller screens
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  
  // State for API data
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [banners, setBanners] = useState([]);
  const [dealOfTheDay, setDealOfTheDay] = useState(null);
  const [loading, setLoading] = useState({
    products: true,
    categories: true,
    testimonials: true,
    banners: true,
    dealOfTheDay: true
  });
  
  // Fetch all necessary data
  useEffect(() => {
    const fetchHomePageData = async () => {
      try {
        // Fetch featured products
        const featuredResponse = await api.get('/products/featured');
        setFeaturedProducts(featuredResponse.data.data);
        setLoading(prev => ({ ...prev, products: false }));
        
        // Fetch new arrivals
        const newArrivalsResponse = await api.get('/products/new-arrivals');
        setNewArrivals(newArrivalsResponse.data.data);
        
        // Fetch best sellers
        const bestSellersResponse = await api.get('/products/best-sellers');
        setBestSellers(bestSellersResponse.data.data);
        
        // Fetch categories
        const categoriesResponse = await api.get('/categories');
        setCategories(categoriesResponse.data.data);
        setLoading(prev => ({ ...prev, categories: false }));
        
        // Fetch testimonials
        const testimonialsResponse = await api.get('/testimonials');
        setTestimonials(testimonialsResponse.data.data);
        setLoading(prev => ({ ...prev, testimonials: false }));
        
        // Fetch banners/carousel slides
        const bannersResponse = await api.get('/banners');
        setBanners(bannersResponse.data.data);
        setLoading(prev => ({ ...prev, banners: false }));
        
        // Fetch deal of the day
        const dealResponse = await api.get('/products/deal-of-the-day');
        setDealOfTheDay(dealResponse.data.data);
        setLoading(prev => ({ ...prev, dealOfTheDay: false }));
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        // Set loading to false even on error to show fallback UI
        setLoading({
          products: false,
          categories: false,
          testimonials: false,
          banners: false,
          dealOfTheDay: false
        });
      }
    };
    
    fetchHomePageData();
  }, []);
  
  // Update visible products based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setVisibleProducts(4);
      } else if (window.innerWidth >= 768) {
        setVisibleProducts(3);
      } else if (window.innerWidth >= 640) {
        setVisibleProducts(2);
      } else {
        setVisibleProducts(1);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on mount
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Handle newsletter subscription
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsNewsletterSubmitting(true);
    
    try {
      await api.post('/newsletter/subscribe', { email });
      toast.success('Thank you for subscribing!');
      setEmail('');
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };
  
  // Wrap carousel navigation functions in useCallback
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);
  
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);
  
  // Auto advance carousel - now with proper dependencies
  useEffect(() => {
    if (banners.length === 0) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [nextSlide, banners.length]);

  // Fallback categories if API fails
  const fallbackCategories = [
    { name: "Electronics", icon: "💻" },
    { name: "Clothing", icon: "👕" },
    { name: "Home & Garden", icon: "🏡" },
    { name: "Books", icon: "📚" },
    { name: "Sports", icon: "🏀" },
    { name: "Toys", icon: "🧸" }
  ];
  
  // Fallback banner/carousel content if API fails
  const fallbackBanners = [
    {
      id: 1,
      title: "Summer Collection 2025",
      subtitle: "NEW ARRIVALS",
      description: "Up to 40% off on summer essentials",
      buttonText: "Shop Now",
      buttonLink: "/collections/summer",
      imageUrl: "https://images.unsplash.com/photo-1577660002965-04865592fc60?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8ZmFzaGlvbiUyMGNsb3RoZXN8ZW58MHx8MHx8&auto=format&fit=crop&w=1200&q=80",
      colorScheme: "bg-blue-50 text-blue-900"
    }
  ];
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Admin Quick Actions - Only visible for admins */}
      {isAuthenticated && isAdmin && (
        <div className="container mx-auto px-4 pt-6">
          <AdminQuickActions />
        </div>
      )}
      
      {/* Hero Carousel Section */}
      <section className="relative overflow-hidden bg-gray-100">
        <div className="relative h-[500px] md:h-[600px]">
          {(banners.length > 0 ? banners : fallbackBanners).map((banner, index) => (
            <div 
              key={banner.id} 
              className={`absolute inset-0 flex transition-opacity duration-700 ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <div className={`flex flex-col md:flex-row h-full ${banner.colorScheme || 'bg-blue-50 text-blue-900'}`}>
                <div className="w-full md:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center">
                  <span className="inline-block px-3 py-1 bg-white bg-opacity-30 rounded text-sm font-semibold mb-4">
                    {banner.subtitle}
                  </span>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                    {banner.title}
                  </h1>
                  <p className="text-lg md:text-xl mb-6 max-w-md">
                    {banner.description}
                  </p>
                  <div>
                    <Link 
                      to={banner.buttonLink}
                      className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition"
                    >
                      {banner.buttonText}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </div>
                </div>
                <div className="w-full md:w-1/2 relative h-1/2 md:h-full overflow-hidden">
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
          
          {/* Navigation buttons */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full shadow-md z-20 hover:bg-opacity-100 transition"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full shadow-md z-20 hover:bg-opacity-100 transition"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 text-gray-800" />
          </button>
          
          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {(banners.length > 0 ? banners : fallbackBanners).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentSlide ? 'bg-primary-600' : 'bg-white bg-opacity-50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              Explore our wide range of products across popular categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {(categories.length > 0 ? categories : fallbackCategories).map((category, index) => (
              <Link
                to={`/category/${category._id || category.name.toLowerCase().replace(/\s+/g, '-')}`}
                key={category._id || index} 
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 flex flex-col items-center group"
              >
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-100 transition">
                  {category.icon ? (
                    <span className="text-4xl">{category.icon}</span>
                  ) : (
                    <img 
                      src={category.imageUrl || `/category-icons/${category.name.toLowerCase()}.svg`} 
                      alt={category.name}
                      className="h-10 w-10"
                    />
                  )}
                </div>
                <p className="text-center font-medium text-gray-800 group-hover:text-primary-600 transition">
                  {category.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="mt-2 text-gray-600">
                Discover our handpicked selection of premium products
              </p>
            </div>
            <Link 
              to="/products" 
              className="hidden md:flex items-center font-medium text-primary-600 hover:text-primary-700"
            >
              View All
              <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          
          {loading.products ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, visibleProducts * 2).map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No featured products available at the moment.
            </div>
          )}
          
          <div className="mt-8 flex justify-center md:hidden">
            <Link 
              to="/products" 
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
            >
              View All Products
              <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Deal of the Day Section */}
      {dealOfTheDay && (
        <section className="py-16 bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center overflow-hidden rounded-2xl shadow-lg bg-white">
              {/* Product image */}
              <div className="w-full md:w-1/2 p-6 md:p-0">
                <img 
                  src={dealOfTheDay.imageUrl || '/placeholder-product.jpg'}
                  alt={dealOfTheDay.name}
                  className="w-full h-auto md:h-[400px] object-cover"
                />
              </div>
              
              {/* Product details */}
              <div className="w-full md:w-1/2 p-8 lg:p-12">
                <div className="bg-red-100 text-red-800 inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  Deal of the Day
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{dealOfTheDay.name}</h2>
                <div className="flex items-center mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-5 w-5 ${star <= dealOfTheDay.rating ? 'fill-current text-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">({dealOfTheDay.reviewCount || 0} reviews)</span>
                </div>
                
                <p className="text-gray-600 mb-6">
                  {dealOfTheDay.description}
                </p>
                
                <div className="flex items-baseline mb-6">
                  <span className="text-3xl font-bold text-red-600 mr-2">${dealOfTheDay.price.toFixed(2)}</span>
                  {dealOfTheDay.originalPrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through">${dealOfTheDay.originalPrice.toFixed(2)}</span>
                      <span className="ml-2 bg-red-100 text-red-800 px-2 py-0.5 rounded text-sm font-medium">
                        {Math.round((dealOfTheDay.originalPrice - dealOfTheDay.price) / dealOfTheDay.originalPrice * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                
                {dealOfTheDay.expiresAt && (
                  <div className="mb-6">
                    <div className="text-sm text-gray-500 mb-2">Hurry! Offer ends in:</div>
                    <div className="flex space-x-3">
                      {/* You would use a proper countdown timer component here */}
                      {['05', '23', '42', '11'].map((num, i) => (
                        <div key={i} className="bg-gray-900 text-white px-3 py-2 rounded text-xl font-bold">
                          {num}
                        </div>
                      ))}
                      <div className="flex flex-col justify-center space-y-1">
                        <span className="text-xs text-gray-600">Days</span>
                        <span className="text-xs text-gray-600">Hours</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <Link to={`/product/${dealOfTheDay._id}`} className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center justify-center">
                  Shop This Deal
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Bestsellers Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Bestsellers</h2>
            <p className="mt-2 text-gray-600 max-w-xl mx-auto">
              Our most popular products based on sales
            </p>
          </div>
          
          {bestSellers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {bestSellers.slice(0, visibleProducts).map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Loading bestsellers...
            </div>
          )}
          
          <div className="mt-10 text-center">
            <Link 
              to="/bestsellers" 
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
            >
              View All Bestsellers
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Free Shipping</h3>
              <p className="text-gray-600">
                Free shipping on all orders over $50
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Our customer service is available around the clock
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                100% secure payment processing
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Easy Returns</h3>
              <p className="text-gray-600">
                30-day money-back guarantee
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonial Section */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900">What Our Customers Say</h2>
              <p className="mt-2 text-gray-600 max-w-xl mx-auto">
                Trusted by thousands of satisfied customers worldwide
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.slice(0, 3).map(testimonial => (
                <Testimonial key={testimonial._id} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* New Arrivals Preview */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
              <p className="mt-2 text-gray-600">
                The latest additions to our collection
              </p>
            </div>
            <Link 
              to="/new-arrivals" 
              className="hidden md:flex items-center font-medium text-primary-600 hover:text-primary-700"
            >
              View All
              <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          
          {newArrivals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.slice(0, visibleProducts).map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Loading new arrivals...
            </div>
          )}
          
          <div className="mt-8 flex justify-center md:hidden">
            <Link 
              to="/new-arrivals" 
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
            >
              View All New Arrivals
              <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Mail className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Subscribe to Our Newsletter</h2>
            <p className="mb-6 text-primary-100">
              Stay updated on new products, special discounts, and exclusive offers
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
                required
              />
              <button
                type="submit"
                disabled={isNewsletterSubmitting}
                className="px-6 py-3 bg-white text-primary-700 rounded-md hover:bg-gray-100 transition disabled:opacity-75"
              >
                {isNewsletterSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="h-5 w-5 border-t-2 border-primary-500 border-solid rounded-full animate-spin mr-2"></div>
                    Subscribing...
                  </span>
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>
            <p className="text-xs mt-4 text-primary-200">
              By subscribing, you agree to receive marketing emails. You can unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;