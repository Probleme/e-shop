import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import categoryService from '../../api/categoryService';

const CategoryForm = ({ category = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    parent: category?.parent?._id || '',
    featured: category?.featured || false,
    order: category?.order || 0
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(category?.imageUrl || null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        // Filter out current category to prevent self-reference
        const filteredCategories = category?._id 
          ? response.data.filter(cat => cat._id !== category._id)
          : response.data;
        setCategories(filteredCategories || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    
    fetchCategories();
  }, [category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create or update category
      const categoryData = {...formData};
    
    // If parent is empty string, remove it so MongoDB treats it as null
    if (categoryData.parent === '') {
    delete categoryData.parent;
    }

      let result;
      if (category) {
        // Update existing category
        result = await categoryService.updateCategory(category._id, formData);
      } else {
        // Create new category
        result = await categoryService.createCategory(formData);
      }
      
      // If there's an image file, upload it
      if (imageFile && result.data._id) {
        const formData = new FormData();
        formData.append('file', imageFile);
        await categoryService.uploadCategoryImage(result.data._id, formData);
      }
      
      toast.success(`Category ${category ? 'updated' : 'created'} successfully`);
      onSubmit(result.data);
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Category Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full p-2 border border-gray-300 rounded"
        ></textarea>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Parent Category</label>
        <select
          name="parent"
          value={formData.parent}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">None (Top Level)</option>
          {categories && categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>
      
      <div className="flex space-x-4">
        <div className="w-1/2">
          <label className="block text-sm font-medium mb-1">Sort Order</label>
          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            min="0"
          />
        </div>
        
        <div className="w-1/2 flex items-center pt-6">
          <input
            type="checkbox"
            id="featured"
            name="featured"
            checked={formData.featured}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="featured">Featured Category</label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Category Image</label>
        <div className="flex items-center space-x-4">
          <div className="border border-gray-300 rounded p-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="category-image"
            />
            <label
              htmlFor="category-image"
              className="flex items-center justify-center cursor-pointer p-2 hover:bg-gray-100 rounded"
            >
              <Image className="mr-1" size={16} />
              <span>Choose Image</span>
            </label>
          </div>
          
          {imagePreview && (
            <div className="w-16 h-16 relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover rounded"
              />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">Recommended size: 300x300 pixels</p>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <RefreshCw size={16} className="animate-spin mr-2" />
              Saving...
            </span>
          ) : (
            <span>{category ? 'Update Category' : 'Add Category'}</span>
          )}
        </button>
      </div>
    </form>
  );
};

const CategoryTreeItem = ({ category, level = 0, onEdit, onDelete, onToggle, expanded }) => {
  return (
    <div>
      <div 
        className={`flex items-center p-2 hover:bg-gray-100 ${level > 0 ? 'ml-4 border-l border-gray-200 pl-4' : ''}`}
      >
        {category.subcategories && category.subcategories.length > 0 ? (
          <button 
            onClick={() => onToggle(category._id)}
            className="mr-2 p-1 rounded hover:bg-gray-200"
          >
            {expanded.includes(category._id) ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        ) : (
          <span className="w-6"></span>
        )}
        
        <span className="flex-1 font-medium">{category.name}</span>
        
        <div className="flex space-x-2">
          {category.featured && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
              Featured
            </span>
          )}
          <button
            onClick={() => onEdit(category)}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(category._id, category.name)}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {expanded.includes(category._id) && category.subcategories && category.subcategories.length > 0 && (
        <div className="ml-4">
          {category.subcategories.map(subcategory => (
            <CategoryTreeItem
              key={subcategory._id}
              category={subcategory}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              expanded={expanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expanded, setExpanded] = useState([]);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getCategories({ populate: 'parent' });
      
      // Make sure we have an array even if the backend response structure varies
      let categoriesData = response.data;
      if (response.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      }
      
      // Build category tree
      const categoryTree = buildCategoryTree(categoriesData || []);
      setCategories(categoryTree);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Build a hierarchical tree from flat categories list
  const buildCategoryTree = (flatCategories) => {
    const categoryMap = {};
    const rootCategories = [];
    
    // First pass: Create a mapping of id to category
    flatCategories.forEach(category => {
      categoryMap[category._id] = { ...category, subcategories: [] };
    });
    
    // Second pass: Assign subcategories
    flatCategories.forEach(category => {
      const categoryWithSubs = categoryMap[category._id];
      
      if (category.parent && categoryMap[category.parent._id || category.parent]) {
        // Add as subcategory if parent exists
        const parentId = category.parent._id || category.parent;
        categoryMap[parentId].subcategories.push(categoryWithSubs);
      } else {
        // Otherwise, it's a root category
        rootCategories.push(categoryWithSubs);
      }
    });
    
    // Sort categories by order
    const sortByOrder = (a, b) => (a.order || 0) - (b.order || 0);
    rootCategories.sort(sortByOrder);
    
    // Sort subcategories recursively
    const sortSubcategories = (categories) => {
      categories.forEach(category => {
        category.subcategories.sort(sortByOrder);
        sortSubcategories(category.subcategories);
      });
    };
    
    sortSubcategories(rootCategories);
    
    return rootCategories;
  };

  const handleToggle = (categoryId) => {
    setExpanded(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      try {
        await categoryService.deleteCategory(categoryId);
        toast.success('Category deleted successfully');
        fetchCategories();

        // Dispatch a custom event to notify other components
        window.dispatchEvent(new Event('category-updated'));
      } catch (err) {
        console.error('Failed to delete category:', err);
        toast.error(err.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    fetchCategories();

    // Dispatch a custom event to notify other components
    window.dispatchEvent(new Event('category-updated'));
    
    // Show toast message
    toast.success('Category saved successfully');
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  // Filter categories based on search query
  const searchCategories = (categories, query) => {
    if (!query) return categories;
    
    const filterRecursive = (cats, query) => {
      return cats.filter(category => {
        const matchesQuery = 
          category.name.toLowerCase().includes(query.toLowerCase()) ||
          (category.description || '').toLowerCase().includes(query.toLowerCase());
        
        let matchingSubcategories = [];
        if (category.subcategories && category.subcategories.length > 0) {
          matchingSubcategories = filterRecursive(category.subcategories, query);
        }
        
        // Replace subcategories with filtered subcategories
        if (matchingSubcategories.length > 0) {
          category = { ...category, subcategories: matchingSubcategories };
          return true;
        }
        
        return matchesQuery;
      });
    };
    
    return filterRecursive(categories, query);
  };

  const filteredCategories = searchQuery ? searchCategories(categories, searchQuery) : categories;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Categories Management</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          <Plus size={16} className="mr-1" />
          Add Category
        </button>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>
      
      {/* Category Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <CategoryForm
              category={editingCategory}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}
      
      {/* Categories List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-3 border-b border-gray-200 font-medium text-gray-600">
          Category Name
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="animate-spin h-8 w-8 mx-auto text-primary-600" />
              <p className="mt-2 text-gray-600">Loading categories...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <p className="text-gray-700">{error}</p>
              <button
                onClick={fetchCategories}
                className="mt-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredCategories && filteredCategories.length > 0 ? (
            filteredCategories.map(category => (
              <CategoryTreeItem
                key={category._id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                expanded={expanded}
              />
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              {searchQuery ? 'No categories match your search' : 'No categories found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesManagement;