import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  LogIn, 
  Menu, 
  X, 
  Search,
  Heart,
  ChevronDown,
  Home,
  Package,
  HelpCircle,
  ShoppingBag 
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useOnClickOutside from '../../hooks/useOnClickOutside';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  
  const userMenuRef = useRef(null);
  const categoriesMenuRef = useRef(null);
  
  // Close dropdowns when clicking outside
  useOnClickOutside(userMenuRef, () => setUserDropdownOpen(false));
  useOnClickOutside(categoriesMenuRef, () => setCategoriesOpen(false));

  // Close mobile menu on screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  const categories = [
    { name: "Electronics", path: "/category/electronics" },
    { name: "Clothing", path: "/category/clothing" },
    { name: "Home & Garden", path: "/category/home-garden" },
    { name: "Books", path: "/category/books" },
    { name: "Sports", path: "/category/sports" },
    { name: "Toys", path: "/category/toys" },
  ];
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top bar with announcement or special offer */}
      <div className="bg-primary-600 text-white text-center py-2 text-sm">
        <p>Free shipping on orders over $50! Use code: FREESHIP</p>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main navbar row */}
        <div className="flex justify-between items-center h-16">
          {/* Logo and hamburger menu */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center ml-4 md:ml-0">
              <ShoppingBag className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">E-Shop</span>
            </Link>
            
            {/* Categories dropdown - desktop */}
            <div className="hidden md:ml-6 md:flex relative" ref={categoriesMenuRef}>
              <button 
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2"
              >
                Categories <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              
              {/* Categories dropdown menu */}
              {categoriesOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md w-56 py-2 z-30">
                  {categories.map((category) => (
                    <Link
                      key={category.path}
                      to={category.path}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full border border-gray-300 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button 
                  type="submit" 
                  className="absolute right-0 top-0 mt-2 mr-3 text-gray-400 hover:text-primary-600"
                >
                  <Search size={20} />
                </button>
              </div>
            </form>
          </div>
          
          {/* Right section: cart, wishlist, account */}
          <div className="flex items-center">
            {/* Navigation links - desktop */}
            <nav className="hidden md:flex space-x-6 mr-6">
              <Link to="/" className="text-gray-600 hover:text-primary-600 px-1">
                Home
              </Link>
              <Link to="/shop" className="text-gray-600 hover:text-primary-600 px-1">
                Shop
              </Link>
              <Link to="/deals" className="text-gray-600 hover:text-primary-600 px-1">
                Deals
              </Link>
              {isAdmin && (
                <Link to="/dashboard" className="text-primary-600 font-semibold px-1">
                  Dashboard
                </Link>
              )}
            </nav>
          
            {/* Wishlist - desktop */}
            <Link to="/wishlist" className="hidden md:flex p-2 text-gray-500 hover:text-primary-600 relative">
              <Heart className="h-6 w-6" />
              <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
                0
              </span>
            </Link>
            
            {/* Cart icon */}
            <Link to="/cart" className="p-2 text-gray-500 hover:text-primary-600 relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-primary-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                0
              </span>
            </Link>
            
            {/* User menu - desktop */}
            <div className="ml-4 relative flex-shrink-0" ref={userMenuRef}>
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center text-gray-700 hover:text-primary-600"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-gray-700 font-medium">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <span className="hidden md:block ml-2">{user?.name?.split(' ')[0]}</span>
                  </button>
                  
                  {/* User dropdown menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-30">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        
                        <Link
                          to="/profile"
                          className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                        
                        <Link
                          to="/orders"
                          className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Orders
                        </Link>
                        
                        {isAdmin && (
                          <Link
                            to="/dashboard"
                            className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserDropdownOpen(false)}
                          >
                            <Home className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        )}
                        
                        <button
                          onClick={handleLogout}
                          className="flex w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex">
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-primary-600 flex items-center"
                  >
                    <LogIn className="h-5 w-5 md:mr-1" />
                    <span className="hidden md:inline">Login</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          {/* Search bar - mobile */}
          <div className="p-4 border-b border-gray-200">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full border border-gray-300 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button 
                  type="submit" 
                  className="absolute right-0 top-0 mt-2 mr-3 text-gray-400 hover:text-primary-600"
                >
                  <Search size={20} />
                </button>
              </div>
            </form>
          </div>
          
          {/* Categories - mobile */}
          <div className="border-b border-gray-200">
            <div className="px-4 py-3 text-gray-800 font-medium">Categories</div>
            <div className="grid grid-cols-2 gap-2 px-4 py-2">
              {categories.map((category) => (
                <Link
                  key={category.path}
                  to={category.path}
                  className="py-2 px-3 rounded-md bg-gray-50 hover:bg-gray-100 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Navigation links - mobile */}
          <nav className="py-2 border-b border-gray-200">
            <Link
              to="/"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="mr-3 h-5 w-5 text-gray-500" />
              Home
            </Link>
            
            <Link
              to="/shop"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShoppingBag className="mr-3 h-5 w-5 text-gray-500" />
              Shop
            </Link>
            
            <Link
              to="/deals"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Package className="mr-3 h-5 w-5 text-gray-500" />
              Deals
            </Link>
            
            <Link
              to="/wishlist"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart className="mr-3 h-5 w-5 text-gray-500" />
              Wishlist
            </Link>
            
            <Link
              to="/cart"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShoppingCart className="mr-3 h-5 w-5 text-gray-500" />
              Cart
            </Link>
            
            {isAdmin && (
              <Link
                to="/dashboard"
                className="flex items-center px-4 py-2 text-primary-600 font-medium hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            )}
          </nav>
          
          {/* User section - mobile */}
          <div className="py-3 px-4 border-b border-gray-200">
            {isAuthenticated ? (
              <div>
                <div className="flex items-center py-2">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-gray-700 font-medium">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{user?.name}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    to="/profile"
                    className="flex justify-center items-center px-3 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="flex justify-center items-center px-3 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex justify-center items-center px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 text-sm col-span-2"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  className="flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Register
                </Link>
              </div>
            )}
          </div>
          
          {/* Help and support */}
          <div className="py-2">
            <Link
              to="/help"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <HelpCircle className="mr-3 h-5 w-5 text-gray-500" />
              Help & Support
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;