const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
// If you're using AWS S3 or similar for file storage
// const { uploadToS3 } = require('../utils/fileUpload');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        emailVerified: user.emailVerified,
        phone: user.phone,
        address: user.address
      }
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone } = req.body;
  
  // Build update object with only allowed fields
  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;

  // Handle file upload if avatar is included
  if (req.files && req.files.avatar) {
    const file = req.files.avatar;
    
    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Please upload an image file', 400));
    }
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return next(new ErrorResponse('Image size should be less than 2MB', 400));
    }
    
    // Create custom filename
    const filename = `avatar_${req.user.id}${path.parse(file.name).ext}`;
    
    // Local file storage
    file.mv(`./public/uploads/avatars/${filename}`, async (err) => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse('Problem with file upload', 500));
      }
      
      // Update user with file path
      updateData.avatar = `/uploads/avatars/${filename}`;
      
      const user = await User.findByIdAndUpdate(req.user.id, updateData, {
        new: true,
        runValidators: true
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            address: user.address
          }
        }
      });
    });
  } else {
    // Update without file
    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          address: user.address
        }
      }
    });
  }
});

// @desc    Update user address
// @route   PUT /api/users/address
// @access  Private
exports.updateAddress = asyncHandler(async (req, res, next) => {
  const { address } = req.body;
  
  if (!address) {
    return next(new ErrorResponse('Address information is required', 400));
  }
  
  // Validate address fields
  const validFields = ['street', 'city', 'state', 'zipCode', 'country'];
  const addressFields = {};
  
  Object.keys(address).forEach(key => {
    if (validFields.includes(key)) {
      addressFields[key] = address[key];
    }
  });
  
  // Update user address
  const user = await User.findByIdAndUpdate(
    req.user.id, 
    { address: addressFields },
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address
      }
    }
  });
});

// @desc    Send email verification
// @route   POST /api/users/send-verification-email
// @access  Private
exports.sendVerificationEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (user.emailVerified) {
    return next(new ErrorResponse('Email is already verified', 400));
  }
  
  // Generate verification token
  const verificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  
  // Create verification URL
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  // In production, you would send an email with this URL
  // For now, we'll just return it in the response
  
  res.status(200).json({
    status: 'success',
    message: 'Verification email sent',
    data: {
      verificationUrl // In production, don't expose this
    }
  });
});

// @desc    Verify email
// @route   GET /api/users/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  
  // Find user by token
  const user = await User.findOne({ emailVerificationToken });
  
  if (!user) {
    return next(new ErrorResponse('Invalid verification token', 400));
  }
  
  // Set email as verified and remove token
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save({ validateBeforeSave: false });
  
  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully'
  });
});