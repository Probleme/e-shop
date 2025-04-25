import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="text-6xl font-bold text-primary-600 mb-4">404</div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Page Not Found</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        The page you are looking for might have been removed, had its name changed,
        or is temporarily unavailable.
      </p>
      <Link to="/" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
        Return to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage;