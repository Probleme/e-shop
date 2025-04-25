import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShoppingBag, 
  Facebook, 
  GithubIcon,
  RectangleGogglesIcon,
  AlertTriangle
} from 'lucide-react';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const registrationEmail = location.state?.email;
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(registrationEmail || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginFailed, setLoginFailed] = useState(false);
  
  // Remember stored email if available
  useEffect(() => {
    const storedEmail = localStorage.getItem('rememberedEmail');
    if (storedEmail && !email) {
      setEmail(storedEmail);
      setRememberMe(true);
    }
  }, [email]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginFailed(false);
    
    if (validateForm()) {
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      const result = await login({ email, password });
      
      if (result.success) {
        // Redirect to previous page or home
        navigate(from, { replace: true });
      } else {
        setLoginFailed(true);
      }
    }
  };

  // Handle social login clicks (these would connect to OAuth providers in a real implementation)
  const handleSocialLogin = (provider) => {
    toast.info(`${provider} login is coming soon!`);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Hero section with e-commerce branding */}
      <div className="bg-primary-600 py-6 px-4 sm:px-6 lg:px-8 text-white text-center">
        <p className="text-sm">New arrivals - Summer Collection 2025 - Shop now and get 15% off your first order</p>
      </div>
      
      <div className="flex flex-grow items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-primary-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to E-Shop
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                create a new account
              </Link>
            </p>
          </div>
          
          {/* Login failure message */}
          {loginFailed && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-red-700">
                  Invalid email or password. Please try again or reset your password.
                </p>
              </div>
            </div>
          )}
          
          {/* Main form */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <form className="space-y-6 p-8" onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                        errors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                {/* Password field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                        errors.password ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors`}
                      placeholder="••••••••"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link 
                    to="/forgot-password" 
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors"
                  aria-live="polite"
                >
                  {loading ? (
                    <>
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <div className="h-5 w-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                      </span>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <LogIn className="h-5 w-5 text-primary-500 group-hover:text-primary-400" aria-hidden="true" />
                      </span>
                      <span>Sign in</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            
            {/* Social Login Section */}
            <div className="px-8 pb-8">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleSocialLogin('Facebook')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">Sign in with Facebook</span>
                  <Facebook className="h-5 w-5 mx-auto text-blue-600" />
                </button>
                <button
                  onClick={() => handleSocialLogin('Twitter')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">Sign in with Twitter</span>
                    <RectangleGogglesIcon className="h-5 w-5 mx-auto text-blue-400" />
                </button>
                {/* <button
                    onClick={() => handleSocialLogin('Google')}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <span className="sr-only">Sign in with Google</span>
                    <Google className="h-5 w-5 mx-auto text-red-500" />
                </button> */}
                <button
                  onClick={() => handleSocialLogin('GitHub')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">Sign in with GitHub</span>
                    <GithubIcon className="h-5 w-5 mx-auto text-gray-800" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Guest checkout option */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Just browsing?{' '}
              <Link to="/" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                Continue as guest
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-white py-4 px-4 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>© 2025 E-Shop. All rights reserved.</p>
        <p className="mt-1">
          <Link to="/privacy" className="text-gray-600 hover:text-gray-900 mx-2">Privacy Policy</Link>
          <Link to="/terms" className="text-gray-600 hover:text-gray-900 mx-2">Terms of Service</Link>
          <Link to="/help" className="text-gray-600 hover:text-gray-900 mx-2">Help Center</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;