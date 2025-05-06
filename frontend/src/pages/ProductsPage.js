import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import productService from '../api/productService';
import categoryService from '../api/categoryService';
import { useCart } from '../contexts/CartContext';
import { 
  ShoppingBag, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Grid, 
  List,
  RefreshCw,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import CategoryNav from '../components/categories/CategoryNav'; // Import the CategoryNav component

// Product Card Component (unchanged)
const ProductCard = ({ product, listView = false }) => {
  /* Keeping this unchanged as it's already well implemented */
  const { addToCart } = useCart();
  
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product._id, 1);
  };
  
  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
    
  if (listView) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-4 hover:shadow-md transition">
        <Link 
          to={`/product/${product.slug || product._id}`} 
          className="block md:w-1/4 flex-shrink-0"
        >
          <div className="relative h-48 md:h-full overflow-hidden rounded-md">
            <img 
              src={product.mainImage} 
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
                    i < Math.floor(product.rating) 
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
            <button
              onClick={handleAddToCart}
              className="inline-flex items-center px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
            >
              <ShoppingBag size={16} className="mr-1" />
              Add to Cart
            </button>
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
            src={product.mainImage || '/placeholder-product.jpg'} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        </div>
        
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {discountPercentage}% OFF
          </div>
        )}
      </Link>
      
      <div className="p-4">
        <Link to={`/product/${product.slug || product._id}`}>
          <h3 className="font-medium text-gray-800 hover:text-primary-600 transition line-clamp-2">
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
            className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full shadow-sm transition"
            aria-label="Add to cart"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Filter Accordion Component
const FilterAccordion = ({ title, children, initiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  
  return (
    <div className="border-b border-gray-200 pb-4">
      <button 
        className="w-full flex items-center justify-between py-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <div className="pt-2">
          {children}
        </div>
      )}
    </div>
  );
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categoryDetails, setCategoryDetails] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listView, setListView] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  });
  
  // Get current filter values from URL params
  const currentCategory = searchParams.get('category');
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'createdAt';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentPriceMin = searchParams.get('price_min');
  const currentPriceMax = searchParams.get('price_max');
  
  // Fetch category details and build breadcrumb path
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (!currentCategory) {
        setCategoryDetails(null);
        setCategoryPath([]);
        return;
      }
      
      try {
        // Check if it's a slug or ID
        const isSlug = currentCategory.includes('-');
        
        let response;
        if (isSlug) {
          response = await categoryService.getCategoryBySlug(currentCategory);
        } else {
          response = await categoryService.getCategory(currentCategory);
        }
        
        setCategoryDetails(response.data);
        
        // Build category path for breadcrumbs
        const buildCategoryPath = async (category) => {
          let path = [category];
          let currentCat = category;
          
          while (currentCat.parent) {
            try {
              const parentResponse = await categoryService.getCategory(currentCat.parent);
              const parentCategory = parentResponse.data;
              path.unshift(parentCategory);
              currentCat = parentCategory;
            } catch (err) {
              console.error('Error fetching parent category:', err);
              break;
            }
          }
          
          setCategoryPath(path);
        };
        
        buildCategoryPath(response.data);
        
      } catch (err) {
        console.error('Failed to fetch category details:', err);
        setCategoryDetails(null);
        setCategoryPath([]);
      }
    };
    
    fetchCategoryDetails();
  }, [currentCategory]);
  
  // Fetch products with current filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        const params = {
          page: currentPage,
          limit: pagination.limit,
          sort: currentSort
        };
        
        if (currentCategory) {
          params.category = currentCategory;
        }
        
        if (currentSearch) {
          params.search = currentSearch;
        }
        
        if (currentPriceMin) {
          params.price_min = currentPriceMin;
        }
        
        if (currentPriceMax) {
          params.price_max = currentPriceMax;
        }
        
        const response = await productService.getProducts(params);
        setProducts(response.data);
        setPagination(response.pagination || {
          page: currentPage,
          limit: 12,
          total: response.count,
          pages: Math.ceil(response.count / 12)
        });
        setError(null);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again.');
        toast.error('Error loading products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [currentCategory, currentSearch, currentSort, currentPage, currentPriceMin, currentPriceMax, pagination.limit]);
  
  // Apply filters
  const applyFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    
    // Reset to page 1 when applying new filters
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    
    setSearchParams(newParams);
  };
  
  // Handle category change from CategoryNav
  // const handleCategoryChange = (category) => {
  //   // Use slug if available, otherwise use ID
  //   applyFilter('category', category.slug || category._id);
  // };
  
  // Handle price filter
  const handlePriceFilter = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const min = formData.get('min');
    const max = formData.get('max');
    
    applyFilter('price_min', min);
    applyFilter('price_max', max);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchParams({});
  };
  
  // Handle pagination
  const goToPage = (page) => {
    applyFilter('page', page.toString());
    window.scrollTo(0, 0);
  };
  
  // Sort options
  const sortOptions = [
    { value: 'createdAt', label: 'Newest' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-rating', label: 'Best Rated' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {categoryDetails ? categoryDetails.name : 'All Products'}
        </h1>
        
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Link to="/" className="text-sm text-gray-600 hover:text-primary-600">Home</Link>
          <ChevronRight size={14} className="text-gray-400" />
          
          <Link to="/products" className="text-sm text-gray-600 hover:text-primary-600">Products</Link>
          
          {/* Show category path in breadcrumbs */}
          {categoryPath.map((category, index) => (
            <React.Fragment key={category._id}>
              <ChevronRight size={14} className="text-gray-400" />
              {index === categoryPath.length - 1 ? (
                <span className="text-sm text-gray-800">{category.name}</span>
              ) : (
                <Link 
                  to={`/products?category=${category.slug || category._id}`} 
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  {category.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Category description if available */}
        {categoryDetails?.description && (
          <p className="mt-4 text-gray-600">{categoryDetails.description}</p>
        )}
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <div className="lg:w-1/4 space-y-6">
          {/* Category Navigation */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-medium text-gray-800">Categories</h2>
            </div>
            <div className="p-4">
              <CategoryNav isSidebar={true} />
            </div>
          </div>
          
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Filter size={18} className="mr-2" />
                Filters
              </h2>
              {(currentPriceMin || currentPriceMax) && (
                <button 
                  onClick={() => {
                    // Clear price filters but keep category
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('price_min');
                    newParams.delete('price_max');
                    newParams.set('page', '1');
                    setSearchParams(newParams);
                  }}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
            
            {/* Price range filter */}
            <FilterAccordion title="Price Range" initiallyOpen={true}>
              <form onSubmit={handlePriceFilter} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1/2">
                    <label htmlFor="min" className="text-xs text-gray-600">Min</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        id="min"
                        name="min"
                        min="0"
                        placeholder="0"
                        defaultValue={currentPriceMin || ''}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                  <div className="w-1/2">
                    <label htmlFor="max" className="text-xs text-gray-600">Max</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        id="max"
                        name="max"
                        min="0"
                        placeholder="1000"
                        defaultValue={currentPriceMax || ''}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded text-sm transition"
                >
                  Apply Filter
                </button>
              </form>
            </FilterAccordion>
            
            {/* Additional filters can be added here */}
          </div>
        </div>
        
        {/* Products grid */}
        <div className="lg:w-3/4">
          {/* Toolbar */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Sort by:</span>
              <select
                value={currentSort}
                onChange={(e) => applyFilter('sort', e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {products.length} of {pagination.total || 0} products
              </div>
              
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button
                  onClick={() => setListView(false)}
                  className={`p-2 ${!listView ? 'bg-gray-100' : 'bg-white'}`}
                  aria-label="Grid view"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setListView(true)}
                  className={`p-2 ${listView ? 'bg-gray-100' : 'bg-white'}`}
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw size={32} className="animate-spin text-primary-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center flex flex-col items-center">
              <AlertTriangle size={24} className="mb-2" />
              {error}
              <button
                onClick={() => window.location.reload()}
                className="block mx-auto mt-2 text-sm underline"
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className={listView ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'}>
                {products.map((product) => (
                  <ProductCard 
                    key={product._id} 
                    product={product} 
                    listView={listView} 
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center space-x-1">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === pagination.pages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, i, arr) => {
                        // Add ellipsis
                        if (i > 0 && page - arr[i - 1] > 1) {
                          return (
                            <React.Fragment key={`ellipsis-${page}`}>
                              <span className="px-3 py-2 text-gray-500">...</span>
                              <button
                                onClick={() => goToPage(page)}
                                className={`px-3 py-2 rounded-md ${
                                  currentPage === page
                                    ? 'bg-primary-600 text-white'
                                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-2 rounded-md ${
                              currentPage === page
                                ? 'bg-primary-600 text-white'
                                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                      className="px-3 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;