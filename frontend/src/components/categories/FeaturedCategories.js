import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import categoryService from '../../api/categoryService';

const FeaturedCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getFeaturedCategories();
        setCategories(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch featured categories:', err);
        setError('Could not load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCategories();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || categories.length === 0) {
    return null; // Don't show anything if there's an error or no featured categories
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <Link
            key={category._id}
            to={`/category/${category.slug || category._id}`}
            className="group"
          >
            <div className="bg-white rounded-lg p-4 flex flex-col items-center justify-center h-32 shadow-sm hover:shadow-md transition">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="h-16 w-16 object-contain mb-2 group-hover:scale-110 transition-transform"
                />
              ) : (
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xl mb-2 group-hover:bg-primary-200 transition-colors">
                  {category.name.charAt(0)}
                </div>
              )}
              <h3 className="text-center font-medium text-sm text-gray-800 group-hover:text-primary-600 transition-colors">
                {category.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCategories;