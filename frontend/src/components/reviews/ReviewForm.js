import React, { useState } from 'react';
import { Star } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ReviewForm = ({ productId, onReviewSubmitted }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    rating: 0
  });
  
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleRatingClick = (rating) => {
    setFormData({
      ...formData,
      rating
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!isAuthenticated) {
      toast.info('Please login to submit a review');
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    
    // Validate form data
    if (formData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!formData.text.trim()) {
      toast.error('Please enter review text');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await api.post(`/api/v1/products/${productId}/reviews`, formData);
      
      toast.success('Review submitted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        text: '',
        rating: 0
      });
      
      // Callback to parent component
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Write a Review</h3>
      
      {error && (
        <div className="mb-4 bg-red-50 p-3 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rating
          </label>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onMouseEnter={() => setHoveredRating(rating)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => handleRatingClick(rating)}
                className="p-1 focus:outline-none"
              >
                <Star
                  size={24}
                  className={`${
                    (hoveredRating ? rating <= hoveredRating : rating <= formData.rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600 self-center">
              {formData.rating > 0 ? `${formData.rating}/5` : ''}
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title (Optional)
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            placeholder="Summarize your experience"
            maxLength={100}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
            Review *
          </label>
          <textarea
            id="text"
            name="text"
            value={formData.text}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            placeholder="Share your experience with this product"
            maxLength={2000}
            required
          ></textarea>
          <div className="text-xs text-gray-500 mt-1">
            {formData.text.length}/2000 characters
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading || !formData.text.trim() || formData.rating === 0}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:bg-primary-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;