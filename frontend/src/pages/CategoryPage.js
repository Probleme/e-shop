import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, RefreshCw, Grid, List, Filter, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import categoryService from '../api/categoryService';
import productService from '../api/productService';
import { useCart } from '../contexts/CartContext';
import ProductCard from '../components/product/ProductCard'; // Assuming you have a ProductCard component

// Filter Accordion Component (same as in ProductsPage)
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

const CategoryPage = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
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
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'createdAt';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentPriceMin = searchParams.get('price_min');
  const currentPriceMax = searchParams.get('price_max');
  
  // Fetch category details
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get category details
        const categoryResponse = await categoryService.getCategory(id);
        setCategory(categoryResponse.data);
        
        // Get subcategories
        const subcategoriesResponse = await categoryService.getSubcategories(id);
        setSubcategories(subcategoriesResponse.data);
        
        // Get category products
        const params = {
          page: currentPage,
          limit: pagination.limit,
          sort: currentSort
        };
        
        if (currentSearch) {
          params.search = currentSearch;
        }
        
        if (currentPriceMin) {
          params.price_min = currentPriceMin;
        }
        
        if (currentPriceMax) {
          params.price_max = currentPriceMax;
        }
        
        const productsResponse = await categoryService.getCategoryProducts(id, params);
        setProducts(productsResponse.data);
        setPagination(productsResponse.pagination || {
          page: currentPage,
          limit: 12,
          total: productsResponse.count,
          pages: Math.ceil(productsResponse.count / 12)
        });
        
      } catch (err) {
        console.error('Failed to fetch category data:', err);
        setError('Failed to load category data. Please try again.');
        toast.error('Error loading category');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoryDetails();
  }, [id, currentSearch, currentSort, currentPage, currentPriceMin, currentPriceMax]);
  
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <RefreshCw size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }
  
  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle size={40} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Category not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the category you're looking for. It may have been removed or the URL is incorrect.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{category.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Link to="/" className="text-sm text-gray-600 hover:text-primary-600">Home</Link>
          <ChevronRight size={14} className="text-gray-400" />
          <Link to="/products" className="text-sm text-gray-600 hover:text-primary-600">Products</Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-sm text-gray-800">{category.name}</span>
        </div>
        
        {category.description && (
          <p className="mt-4 text-gray-600">{category.description}</p>
        )}
      </div>
      
      {/* Subcategories (if any) */}
      {subcategories.length > 0 && (
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {subcategories.map(subcat => (
            <Link 
              key={subcat._id} 
              to={`/category/${subcat._id}`}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition text-center flex flex-col items-center"
            >
              {subcat.imageUrl ? (
                <img 
                  src={subcat.imageUrl} 
                  alt={subcat.name}
                  className="w-16 h-16 object-contain mb-2"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl text-gray-400">{subcat.name.charAt(0)}</span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-800">{subcat.name}</span>
            </Link>
          ))}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Filter size={18} className="mr-2" />
                Filters
              </h2>
              {(currentPriceMin || currentPriceMax) && (
                <button 
                  onClick={clearAllFilters}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Clear All
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
          
          {/* Products */}
          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                There are currently no products in this category that match your filters.
              </p>
              {(currentPriceMin || currentPriceMax) && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
                >
                  Clear All Filters
                </button>
              )}
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

export default CategoryPage;