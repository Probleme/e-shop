import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { User, MapPin, Shield, Camera, ChevronRight, Edit2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
    const { user, loading, updateUser } = useAuth(); // Add updateUser from useAuth
    const [activeTab, setActiveTab] = useState('personal');
    const [editMode, setEditMode] = useState(false);
    const [editAddress, setEditAddress] = useState(false);
    const [profileData, setProfileData] = useState({
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      }
    });
    const [changePassword, setChangePassword] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
  
    // Initialize profile data when user object changes
    useEffect(() => {
      if (user) {
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: {
            street: user.address?.street || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            zipCode: user.address?.zipCode || '',
            country: user.address?.country || '',
          }
        });
      }
    }, [user]);
  
    // Handle profile image change
    const handleAvatarChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    };
  
    // Handle input changes for profile data
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setProfileData({
        ...profileData,
        [name]: value
      });
    };
  
    // Handle address field changes
    const handleAddressChange = (e) => {
      const { name, value } = e.target;
      setProfileData({
        ...profileData,
        address: {
          ...profileData.address,
          [name]: value
        }
      });
    };
  
    // Handle password change inputs
    const handlePasswordChange = (e) => {
      const { name, value } = e.target;
      setChangePassword({
        ...changePassword,
        [name]: value
      });
    };
  
    // Submit profile update
    const handleProfileSubmit = async (e) => {
      e.preventDefault();
      try {
        let response;
        
        // Create FormData if there's an avatar to upload
        if (avatarFile) {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          formData.append('name', profileData.name);
          formData.append('phone', profileData.phone);
          
          response = await api.put('/users/profile', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          response = await api.put('/users/profile', {
            name: profileData.name,
            phone: profileData.phone
          });
        }
        
        // Update the user in AuthContext with the new data
        if (response.data?.data?.user) {
          updateUser(response.data.data.user);
        } else {
          // If the API doesn't return the updated user, update with form data
          updateUser({
            name: profileData.name,
            phone: profileData.phone,
            ...(avatarPreview && { avatar: avatarPreview })
          });
        }
        
        toast.success('Profile updated successfully');
        setEditMode(false);
        
        // Clear the file input
        setAvatarFile(null);
      } catch (error) {
        console.error('Profile update error:', error);
        toast.error('Failed to update profile');
      }
    };
  
    // Submit address update
    const handleAddressSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await api.put('/users/address', { address: profileData.address });
        
        // Update the address in the AuthContext
        if (response.data?.data?.user?.address) {
          updateUser({ address: response.data.data.user.address });
        } else {
          // If the API doesn't return the updated address, update with form data
          updateUser({ address: profileData.address });
        }
        
        toast.success('Address updated successfully');
        setEditAddress(false);
      } catch (error) {
        console.error('Address update error:', error);
        toast.error('Failed to update address');
      }
    };
  
    // Submit password change
    const handlePasswordSubmit = async (e) => {
      e.preventDefault();
      
      if (changePassword.newPassword !== changePassword.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
  
      try {
        await api.put('/auth/update-password', {
          currentPassword: changePassword.currentPassword,
          newPassword: changePassword.newPassword
        });
        
        toast.success('Password updated successfully');
        setChangePassword({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } catch (error) {
        console.error('Password update error:', error);
        toast.error(error.response?.data?.message || 'Failed to update password');
      }
    };
  
    // Verify email
    const sendVerificationEmail = async () => {
      try {
        await api.post('/users/send-verification-email');
        toast.success('Verification email sent. Please check your inbox.');
      } catch (error) {
        console.error('Email verification error:', error);
        toast.error('Failed to send verification email');
      }
    };
  
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      );
    }
  
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    
    const formatTime = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile Header with Avatar */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-8 flex flex-col md:flex-row md:items-center">
            <div className="relative">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                {(avatarPreview || user?.avatar) ? (
                  <img 
                    src={avatarPreview || `${user.avatar}`} 
                    alt={user?.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-primary-600 text-4xl font-bold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer hover:bg-gray-100 transition">
                <Camera size={18} className="text-primary-600" />
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            
            <div className="md:ml-6 mt-4 md:mt-0 text-white">
              <h1 className="text-3xl font-bold">{user?.name}</h1>
              <div className="flex items-center mt-1">
                <Mail size={16} className="mr-1" />
                <span>{user?.email}</span>
              </div>
              <div className="mt-2 flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user?.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                  {user?.role === 'admin' ? 'Admin' : 'Customer'}
                </span>
                {user?.emailVerified ? (
                  <span className="inline-flex items-center ml-2 text-green-100">
                    <CheckCircle size={14} className="mr-1" />
                    Verified
                  </span>
                ) : (
                  <button 
                    onClick={sendVerificationEmail} 
                    className="inline-flex items-center ml-2 text-yellow-100 hover:text-white transition"
                  >
                    <AlertCircle size={14} className="mr-1" />
                    Verify Email
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Profile Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              <button
                className={`py-4 px-6 font-medium text-sm flex items-center whitespace-nowrap ${activeTab === 'personal' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-primary-600'}`}
                onClick={() => setActiveTab('personal')}
              >
                <User size={18} className="mr-2" />
                Personal Information
              </button>
              <button
                className={`py-4 px-6 font-medium text-sm flex items-center whitespace-nowrap ${activeTab === 'address' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-primary-600'}`}
                onClick={() => setActiveTab('address')}
              >
                <MapPin size={18} className="mr-2" />
                Shipping Address
              </button>
              <button
                className={`py-4 px-6 font-medium text-sm flex items-center whitespace-nowrap ${activeTab === 'security' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-primary-600'}`}
                onClick={() => setActiveTab('security')}
              >
                <Shield size={18} className="mr-2" />
                Security
              </button>
            </nav>
          </div>
          
          {/* Profile Content */}
          <div className="p-6">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center text-primary-600 hover:text-primary-500"
                  >
                    <Edit2 size={16} className="mr-1" />
                    {editMode ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                {!editMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-sm">Full Name</p>
                        <p className="font-medium">{user?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Email</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Phone</p>
                        <p className="font-medium">{user?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Member Since</p>
                        <p className="font-medium">{formatDate(user?.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Last Login</p>
                        <p className="font-medium">
                          {user?.lastLogin ? `${formatDate(user.lastLogin)} at ${formatTime(user.lastLogin)}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProfileSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={profileData.email}
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Contact support to change your email</p>
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="(123) 456-7890"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            
            {/* Address Tab */}
            {activeTab === 'address' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Shipping Address</h2>
                  <button
                    onClick={() => setEditAddress(!editAddress)}
                    className="flex items-center text-primary-600 hover:text-primary-500"
                  >
                    <Edit2 size={16} className="mr-1" />
                    {editAddress ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                {!editAddress ? (
                  <div>
                    {user?.address?.street ? (
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-gray-600 mt-1">{user.address.street}</p>
                        <p className="text-gray-600">
                          {user.address.city}, {user.address.state} {user.address.zipCode}
                        </p>
                        <p className="text-gray-600">{user.address.country}</p>
                        {user.phone && <p className="text-gray-600 mt-1">Phone: {user.phone}</p>}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 text-yellow-700 flex items-start">
                        <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                        <p>You haven't added a shipping address yet. Add one for faster checkout.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleAddressSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          id="street"
                          name="street"
                          value={profileData.address.street}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={profileData.address.city}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province
                        </label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={profileData.address.state}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          id="zipCode"
                          name="zipCode"
                          value={profileData.address.zipCode}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          id="country"
                          name="country"
                          value={profileData.address.country}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            
            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Settings</h2>
                
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={changePassword.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={changePassword.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required
                          minLength={6}
                        />
                        <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={changePassword.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Email Verification</h3>
                  
                  {user?.emailVerified ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle size={18} className="mr-2" />
                      Your email address has been verified
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center text-yellow-600 mb-4">
                        <AlertCircle size={18} className="mr-2" />
                        Your email address is not verified
                      </div>
                      <button
                        onClick={sendVerificationEmail}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
                      >
                        Send Verification Email
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <Link to="/orders" className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">My Orders</h3>
                <p className="text-sm text-gray-500">View and track orders</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <Link to="/wishlist" className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">Wishlist</h3>
                <p className="text-sm text-gray-500">Items you've saved</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <Link to="/payment-methods" className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">Payment Methods</h3>
                <p className="text-sm text-gray-500">Manage your saved payment methods</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;