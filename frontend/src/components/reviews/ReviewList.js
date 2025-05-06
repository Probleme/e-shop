import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Star, ThumbsUp, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const ReviewItem = ({ review }) => {
  const formattedDate = format(new Date(review.createdAt), 'MMM dd, yyyy');
  
  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{review.title || 'Product Review'}</h4>
          <div className="flex items-center mt-1">
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
            <span className="ml-2 text-sm text-gray-600">
              {review.rating}/5
            </span>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          {formattedDate}
        </div>
      </div>
      
      <div className="flex items-start mt-2">
        {review.user?.avatar ? (
          <img 
            src={review.user.avatar} 
            alt={review.user.name} 
            className="w-10 h-10 rounded-full mr-3"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <span className="text-gray-600 font-medium text-sm">
              {review.user?.name?.charAt(0) || 'U'}
            </span>
          </div>
        )}
        
        <div>
          <div className="text-sm font-medium text-gray-900">
            {review.user?.name || 'Anonymous'}
            {review.verified && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                Verified Purchase
              </span>
            )}
          </div>
          
          <div className="mt-2 text-gray-700 whitespace-pre-line">
            {review.text}
          </div>
          
          <div className="mt-3 flex space-x-4 text-sm">
            <button className="flex items-center text-gray-500 hover:text-gray-700">
              <ThumbsUp size={14} className="mr-1" />
              Helpful
            </button>
            <button className="flex items-center text-gray-500 hover:text-gray-700">
              <Flag size={14} className="mr-1" />
              Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewList = ({ productId, initialCount = 3 }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCount, setExpandedCount] = useState(initialCount);
  
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/api/products/${productId}/reviews`);
        setReviews(response.data.data);
        
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setError('Could not load reviews. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (productId) {
      fetchReviews();
    }
  }, [productId]);
  
  // Show more reviews
  const handleShowMore = () => {
    setExpandedCount(reviews.length);
  };
  
  // Show less reviews
  const handleShowLess = () => {
    setExpandedCount(initialCount);
    // Scroll to the top of the review section
    document.getElementById('reviewsSection')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border-b border-gray-200 pb-6">
            <div className="flex justify-between">
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="flex">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-4 w-4 mr-1 bg-gray-200 rounded-full"></div>
                  ))}
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="flex mt-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-600 mb-4">Be the first to review this product</p>
      </div>
    );
  }
  
  return (
    <div id="reviewsSection" className="space-y-6">
      {reviews.slice(0, expandedCount).map((review) => (
        <ReviewItem key={review._id} review={review} />
      ))}
      
      {reviews.length > initialCount && (
        <div className="text-center pt-4">
          {expandedCount < reviews.length ? (
            <button 
              onClick={handleShowMore}
              className="flex items-center justify-center mx-auto font-medium text-primary-600 hover:text-primary-800"
            >
              Show More Reviews
              <ChevronDown className="ml-1" size={16} />
            </button>
          ) : (
            <button 
              onClick={handleShowLess}
              className="flex items-center justify-center mx-auto font-medium text-primary-600 hover:text-primary-800"
            >
              Show Less
              <ChevronUp className="ml-1" size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewList;