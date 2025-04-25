import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <ShieldAlert size={64} className="text-red-500 mb-4" />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Access Denied</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        You do not have permission to access this page. 
        Please contact an administrator if you believe this is an error.
      </p>
      <div className="flex space-x-4">
        <Link to="/" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
          Return to Homepage
        </Link>
        <Link to="/login" className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50 transition">
          Login
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;