import React from 'react';
import Header from '../components/layout/Navbar';
import useAuth from '../hooks/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name || 'Admin'}</h2>
          <p className="text-gray-600">
            This is your admin dashboard where you can manage products, users, and orders.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Products</h3>
            <p className="text-3xl font-bold text-primary-600 mb-4">0</p>
            <button className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
              Manage Products
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Users</h3>
            <p className="text-3xl font-bold text-primary-600 mb-4">0</p>
            <button className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
              Manage Users
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Orders</h3>
            <p className="text-3xl font-bold text-primary-600 mb-4">0</p>
            <button className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
              Manage Orders
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;