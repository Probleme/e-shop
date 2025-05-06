import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Users,
  CreditCard,
  Package,
  Star,
  Tag,
  Settings,
  ChevronRight,
  PieChart,
  ArrowUpRight,
  Clock,
  Heart,
  Truck,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import productService from '../api/productService';
import userService from '../api/userService';
import orderService from '../api/orderService';

// Recent Order Component
const RecentOrderItem = ({ order }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center">
        <div className="bg-gray-100 rounded-md p-2">
          <CreditCard size={16} className="text-gray-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-900">Order #{order._id ? order._id.substring(0, 8) : order.id}</p>
          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
        <span className="ml-4 text-sm font-medium">${(order.totalPrice || 0).toFixed(2)}</span>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon, change, linkTo }) => {
  const Icon = icon;
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-1">
              <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-gray-500 ml-1">from last month</span>
            </div>
          )}
        </div>
        <div className="p-2 rounded-md bg-primary-50">
          <Icon size={20} className="text-primary-600" />
        </div>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="mt-4 inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          View details
          <ChevronRight size={14} className="ml-1" />
        </Link>
      )}
    </div>
  );
};

// Navigation Item for Admin
const AdminNavItem = ({ icon, title, path }) => {
  const Icon = icon;
  return (
    <Link
      to={path}
      className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition"
    >
      <div className="w-8 h-8 rounded-md bg-primary-50 flex items-center justify-center">
        <Icon size={18} className="text-primary-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{title}</p>
      </div>
      <ChevronRight size={16} className="text-gray-400" />
    </Link>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    users: 0,
    orders: 0,
    revenue: 0,
    recentOrders: []
  });
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
    
        // For admin users - fetch stats
        if (user?.role === 'admin') {
          // Use Promise.allSettled for better error handling
          const [
            productsRes,
            usersRes,
            ordersRes
          ] = await Promise.allSettled([
            productService.getProductCount(),
            userService.getUserCount(),
            orderService.getOrderStats()
          ]);
          
          // Process results safely
          const productCount = productsRes.status === 'fulfilled' ? productsRes.value.count : 0;
          const userCount = usersRes.status === 'fulfilled' ? usersRes.value.count : 0;
          const orderStats = ordersRes.status === 'fulfilled' ? ordersRes.value : { totalOrders: 0, totalRevenue: 0, recentOrders: [] };
    
          setStats({
            products: productCount,
            users: userCount,
            orders: orderStats.totalOrders,
            revenue: orderStats.totalRevenue,
            recentOrders: orderStats.recentOrders
          });
        } else {
          // For regular users - fetch their orders
          try {
            const ordersRes = await orderService.getMyOrders();
            setUserOrders(ordersRes.data || []);
          } catch (err) {
            console.error("Failed to fetch user orders:", err);
            setUserOrders([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Could not load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  // Handle errors during rendering
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw size={32} className="text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {user?.role === 'admin' ? (
        /* Admin Dashboard */
        <div>
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.name}. Manage your e-commerce platform from here.
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="Total Products" 
              value={stats.products} 
              icon={Package} 
              change={2.5} 
              linkTo="/admin/products" 
            />
            <StatsCard 
              title="Registered Users" 
              value={stats.users} 
              icon={Users} 
              change={4.7} 
              linkTo="/admin/users" 
            />
            <StatsCard 
              title="Total Orders" 
              value={stats.orders} 
              icon={ShoppingBag} 
              change={-1.2} 
              linkTo="/admin/orders" 
            />
            <StatsCard 
              title="Revenue" 
              value={`$${stats.revenue.toFixed(2)}`} 
              icon={CreditCard} 
              change={3.1} 
              linkTo="/admin/sales" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                  <Link 
                    to="/admin/orders" 
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    View All
                  </Link>
                </div>
                <div className="p-6">
                  {stats.recentOrders.length > 0 ? (
                    <div className="space-y-1">
                      {stats.recentOrders.map((order) => (
                        <RecentOrderItem key={order._id || order.id} order={order} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No recent orders</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                <AdminNavItem 
                  icon={Package} 
                  title="Manage Products" 
                  path="/admin/products" 
                />
                <AdminNavItem 
                  icon={Tag} 
                  title="Manage Categories" 
                  path="/admin/categories" 
                />
                <AdminNavItem 
                  icon={Users} 
                  title="Manage Users" 
                  path="/admin/users" 
                />
                <AdminNavItem 
                  icon={CreditCard} 
                  title="View Orders" 
                  path="/admin/orders" 
                />
                <AdminNavItem 
                  icon={Star} 
                  title="Review Management" 
                  path="/admin/reviews" 
                />
                <AdminNavItem 
                  icon={Settings} 
                  title="Store Settings" 
                  path="/admin/settings" 
                />
                <AdminNavItem 
                  icon={PieChart} 
                  title="View Analytics" 
                  path="/admin/analytics" 
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* User Dashboard */
        <div>
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.name}. View your orders and manage your account.
            </p>
          </div>

          {/* User Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <CreditCard size={20} className="text-blue-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Orders</p>
                  <p className="text-xl font-semibold">{userOrders.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <Clock size={20} className="text-green-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-xl font-semibold">
                    {userOrders.filter(order => ['pending', 'processing'].includes(order.status)).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Truck size={20} className="text-purple-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Shipped</p>
                  <p className="text-xl font-semibold">
                    {userOrders.filter(order => order.status === 'shipped').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full">
                  <Heart size={20} className="text-red-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Wishlist</p>
                  <p className="text-xl font-semibold">0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders and Account Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                  <Link 
                    to="/orders" 
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    View All
                  </Link>
                </div>
                <div className="p-6">
                  {userOrders.length > 0 ? (
                    <div className="space-y-1">
                      {userOrders.slice(0, 5).map((order) => (
                        <RecentOrderItem key={order._id || order.id} order={order} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No orders yet</p>
                      <Link 
                        to="/products" 
                        className="inline-flex items-center mt-2 text-sm text-primary-600 hover:text-primary-700"
                      >
                        Start shopping
                        <ArrowUpRight size={14} className="ml-1" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Account</h2>
              </div>
              <div className="p-4 space-y-2">
                <Link 
                  to="/profile" 
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50"
                >
                  <span className="text-gray-700">Personal Information</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
                <Link 
                  to="/orders" 
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50"
                >
                  <span className="text-gray-700">Order History</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
                <Link 
                  to="/addresses" 
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50"
                >
                  <span className="text-gray-700">Saved Addresses</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
                <Link 
                  to="/wishlist" 
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50"
                >
                  <span className="text-gray-700">Wishlist</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start">
          <AlertTriangle className="mr-2 flex-shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;