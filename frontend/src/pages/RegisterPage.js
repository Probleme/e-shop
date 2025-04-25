import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Camera, 
  Phone, 
  MapPin, 
  ChevronRight, 
  ShoppingBag 
} from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    agreeToTerms: false,
    newsletter: false
  });
  
  const [errors, setErrors] = useState({});
  
  // Handle text input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle address field changes
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };
  
  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  
  // Trigger file input click
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };
  
  // Validate form based on current step
  const validateForm = () => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      } else if (formData.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
      
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (step === 2) {
      // Phone validation (optional)
      if (formData.phone && !/^\+?[\d\s()-]{8,20}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
      
      // Address validation is optional during registration
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const handleNextStep = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };
  
  // Submit registration form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      setErrors(prev => ({ ...prev, agreeToTerms: 'You must agree to the terms and conditions' }));
      return;
    }
    
    if (validateForm()) {
      try {
        setLoading(true);
        
        // Create FormData object to handle file upload
        const formDataToSend = new FormData();
        
        // Add basic user data
        formDataToSend.append('name', formData.name);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('password', formData.password);
        
        // Add optional data
        if (formData.phone) formDataToSend.append('phone', formData.phone);
        
        // Add address if any field is filled
        const hasAddressData = Object.values(formData.address).some(value => value.trim() !== '');
        if (hasAddressData) {
          formDataToSend.append('address', JSON.stringify(formData.address));
        }
        
        // Add avatar if selected
        if (avatarFile) {
          formDataToSend.append('avatar', avatarFile);
        }
        
        // Add newsletter preference
        formDataToSend.append('newsletter', formData.newsletter.toString());
        
        // Call registration API
        const response = await api.post('/auth/signup', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.status === 'success') {
          toast.success('Registration successful! Please log in.');
          navigate('/login', { 
            state: { 
              email: formData.email,
              registrationSuccess: true 
            }
          });
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Registration failed. Please try again.';
        toast.error(message);
        
        // If server returns field-specific errors, update the errors state
        if (error.response?.data?.errors) {
          setErrors(prev => ({
            ...prev,
            ...error.response.data.errors
          }));
        }
      } finally {
        setLoading(false);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
        
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="rounded-full h-8 w-8 flex items-center justify-center bg-primary-600 text-white">
                1
              </div>
              <div className="ml-2 text-sm font-medium text-gray-900">Account</div>
            </div>
            <div className="ml-2 mr-2 h-0.5 w-16 bg-gray-300">
              <div className={`h-0.5 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`} style={{ width: step >= 2 ? '100%' : '0' }}></div>
            </div>
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
              <div className={`ml-2 text-sm font-medium ${step >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>Profile</div>
            </div>
          </div>
        </div>
        
        {/* Main form */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Step 1: Account Information */}
          {step === 1 && (
            <form onSubmit={handleNextStep}>
              <div className="px-6 py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Account Information</h3>
                
                <div className="space-y-6">
                  {/* Name field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                  
                  {/* Email field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
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
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                        placeholder="••••••••"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                  </div>
                  
                  {/* Confirm Password field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                        placeholder="••••••••"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </form>
          )}
          
          {/* Step 2: Profile Information */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information <span className="text-sm text-gray-500">(Optional)</span></h3>
                
                <div className="space-y-6">
                  {/* Avatar upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Profile Picture
                    </label>
                    <div className="flex items-center">
                      <div 
                        onClick={handleAvatarClick}
                        className={`h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer border-2 ${avatarPreview ? 'border-primary-300' : 'border-dashed border-gray-300'}`}
                      >
                        {avatarPreview ? (
                          <img 
                            src={avatarPreview} 
                            alt="Preview" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Camera className="h-8 w-8 text-gray-400" />
                        )}
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </div>
                      <div className="ml-5">
                        <button
                          type="button"
                          onClick={handleAvatarClick}
                          className="text-sm font-medium text-primary-600 hover:text-primary-500"
                        >
                          {avatarPreview ? 'Change picture' : 'Upload picture'}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. 2MB max.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Phone Number */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                          errors.phone ? 'border-red-300' : 'border-gray-300'
                        } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">For order notifications and delivery updates</p>
                  </div>
                  
                  {/* Address Information */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Shipping Address
                      </label>
                      <span className="text-xs text-gray-500">You can add this later</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* Street Address */}
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          id="street"
                          name="street"
                          type="text"
                          value={formData.address.street}
                          onChange={handleAddressChange}
                          className="pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                          placeholder="Street Address"
                        />
                      </div>
                      
                      {/* City and State in 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          id="city"
                          name="city"
                          type="text"
                          value={formData.address.city}
                          onChange={handleAddressChange}
                          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                          placeholder="City"
                        />
                        <input
                          id="state"
                          name="state"
                          type="text"
                          value={formData.address.state}
                          onChange={handleAddressChange}
                          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                          placeholder="State/Province"
                        />
                      </div>
                      
                      {/* Zip Code and Country in 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          id="zipCode"
                          name="zipCode"
                          type="text"
                          value={formData.address.zipCode}
                          onChange={handleAddressChange}
                          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                          placeholder="Postal/Zip Code"
                        />
                        <input
                          id="country"
                          name="country"
                          type="text"
                          value={formData.address.country}
                          onChange={handleAddressChange}
                          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Newsletter and Terms */}
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="newsletter"
                          name="newsletter"
                          type="checkbox"
                          checked={formData.newsletter}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="newsletter" className="text-gray-700">
                          Subscribe to our newsletter for exclusive deals and updates
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="agreeToTerms"
                          name="agreeToTerms"
                          type="checkbox"
                          checked={formData.agreeToTerms}
                          onChange={handleChange}
                          className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${errors.agreeToTerms ? 'border-red-300' : ''}`}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="agreeToTerms" className="text-gray-700">
                          I agree to the{' '}
                          <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                            Privacy Policy
                          </Link>
                        </label>
                        {errors.agreeToTerms && (
                          <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By creating an account, you'll be able to track orders, save your favorite items, and receive special offers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;