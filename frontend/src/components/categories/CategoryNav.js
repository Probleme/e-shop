import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useCategoryContext } from '../../contexts/CategoryContext';

const CategoryNav = ({ isMobile = false, onCategoryClick = () => {} }) => {
  const { featuredCategories, isLoading } = useCategoryContext();
  const [activeCategory, setActiveCategory] = useState(null);

  // Function to handle mouse enter
  const handleMouseEnter = (categoryId) => {
    if (!isMobile) {
      setActiveCategory(categoryId);
    }
  };

  // Function to handle mouse leave
  const handleMouseLeave = () => {
    if (!isMobile) {
      setActiveCategory(null);
    }
  };

  // Function to toggle submenu on mobile
  const toggleSubmenu = (categoryId) => {
    if (isMobile) {
      setActiveCategory(prev => prev === categoryId ? null : categoryId);
    }
  };

  // Function to handle category click
  const handleClick = (categoryId) => {
    onCategoryClick(categoryId);
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-50 ${isMobile ? 'py-2' : 'shadow-sm border-t border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-center space-x-8'}`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: '80px' }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Return early with message if no categories
  if (featuredCategories.length === 0 && !isLoading) {
    return (
      <div className={`bg-gray-50 ${isMobile ? 'py-2' : 'shadow-sm border-t border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-2 text-sm text-gray-500">
            No categories available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 ${isMobile ? 'py-2' : 'shadow-sm border-t border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav>
          <ul className={`${isMobile ? 'flex flex-col space-y-2' : 'flex items-center justify-center space-x-8'}`}>
            {featuredCategories.map((category) => (
              <li key={category._id} className="relative">
                <div
                  className={`flex items-center cursor-pointer ${isMobile ? 'py-2' : 'py-3'}`}
                  onMouseEnter={() => handleMouseEnter(category._id)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => toggleSubmenu(category._id)}
                >
                  <Link
                    to={`/category/${category.slug || category._id}`}
                    className={`text-gray-700 hover:text-primary-600 font-medium text-sm ${
                      activeCategory === category._id ? 'text-primary-600' : ''
                    }`}
                    onClick={() => handleClick(category._id)}
                  >
                    {category.name}
                  </Link>
                  
                  {/* Show dropdown indicator if category has subcategories */}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${
                      activeCategory === category._id ? 'transform rotate-180' : ''
                    }`} />
                  )}
                </div>
                
                {/* Dropdown for subcategories */}
                {category.subcategories && category.subcategories.length > 0 && activeCategory === category._id && (
                  <div 
                    className={`${
                      isMobile 
                        ? 'relative bg-gray-100 rounded py-2 px-4 mt-1' 
                        : 'absolute top-full left-0 z-10 bg-white shadow-lg rounded-lg py-2 min-w-[200px]'
                    }`}
                  >
                    <ul className="space-y-1">
                      {category.subcategories.map((subcategory) => (
                        <li key={subcategory._id}>
                          <Link
                            to={`/category/${subcategory.slug || subcategory._id}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600"
                            onClick={() => handleClick(subcategory._id)}
                          >
                            {subcategory.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default CategoryNav;