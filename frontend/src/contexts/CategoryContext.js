import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import categoryService from '../api/categoryService';

const CategoryContext = createContext();

export const useCategoryContext = () => useContext(CategoryContext);

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const refreshCategories = useCallback(() => {
    setLastUpdate(Date.now());
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all categories
        const allCategoriesResponse = await categoryService.getCategories();
        let allCategoriesData = allCategoriesResponse.data;
        if (allCategoriesResponse.data && Array.isArray(allCategoriesResponse.data.data)) {
          allCategoriesData = allCategoriesResponse.data.data;
        }
        setCategories(allCategoriesData || []);

        // Fetch featured categories
        const featuredResponse = await categoryService.getFeaturedCategories();
        let featuredData = featuredResponse.data;
        if (featuredResponse.data && Array.isArray(featuredResponse.data.data)) {
          featuredData = featuredResponse.data.data;
        }
        setFeaturedCategories(featuredData || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Add event listener for category updates
    window.addEventListener('category-updated', refreshCategories);
    
    return () => {
      window.removeEventListener('category-updated', refreshCategories);
    };
  }, [lastUpdate, refreshCategories]);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        featuredCategories,
        isLoading,
        error,
        refreshCategories
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export default CategoryContext;