import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import categoryService from '../api/categoryService';
import { ChevronRight, ChevronDown } from 'lucide-react';

const CategoryMenu = ({ className = '', showTitle = true }) => {
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getTopLevelCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleCategory = async (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));

    // Fetch subcategories if not already loaded
    if (!expandedCategories[categoryId]) {
      try {
        const response = await categoryService.getSubcategories(categoryId);
        const category = categories.find(c => c._id === categoryId);
        
        if (category) {
          category.subcategories = response.data;
          setCategories([...categories]);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    }
  };

  const isActive = (categoryId) => {
    return location.pathname.includes(`/category/${categoryId}`) || 
           location.search.includes(`category=${categoryId}`);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        {showTitle && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <h2 className="font-semibold text-gray-800">Categories</h2>
          </div>
        )}
        <div className="p-4">
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded w-3/4"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {showTitle && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
          <h2 className="font-semibold text-gray-800">Categories</h2>
        </div>
      )}
      <nav className="p-2">
        <ul className="space-y-1">
          {categories.map((category) => (
            <li key={category._id}>
              <div className="flex flex-col">
                <div className="flex items-center">
                  {category.subcategories && category.subcategories.length > 0 ? (
                    <button
                      onClick={() => toggleCategory(category._id)}
                      className="p-2 text-gray-600 hover:text-primary-600 transition"
                      aria-label={expandedCategories[category._id] ? 'Collapse category' : 'Expand category'}
                    >
                      {expandedCategories[category._id] ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                  ) : (
                    <span className="w-6"></span>
                  )}
                  <Link
                    to={`/products?category=${category._id}`}
                    className={`flex-grow py-2 px-2 rounded-md text-sm ${
                      isActive(category._id)
                        ? 'font-medium text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </Link>
                </div>
                
                {/* Subcategories */}
                {expandedCategories[category._id] && category.subcategories?.length > 0 && (
                  <ul className="pl-8 pb-1 space-y-1">
                    {category.subcategories.map((subcategory) => (
                      <li key={subcategory._id}>
                        <Link
                          to={`/products?category=${subcategory._id}`}
                          className={`block py-1.5 px-2 rounded-md text-sm ${
                            isActive(subcategory._id)
                              ? 'font-medium text-primary-600 bg-primary-50'
                              : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                          }`}
                        >
                          {subcategory.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default CategoryMenu;