const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a coupon code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  discountPercentage: {
    type: Number,
    required: [true, 'Please add a discount percentage'],
    min: [1, 'Discount must be at least 1%'],
    max: [99, 'Discount cannot exceed 99%']
  },
  minPurchase: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add an expiry date']
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if coupon is valid
CouponSchema.methods.isValid = function(orderAmount) {
  const now = new Date();
  
  if (!this.isActive) {
    return { valid: false, message: 'Coupon is inactive' };
  }
  
  if (now < this.startDate) {
    return { valid: false, message: 'Coupon is not yet active' };
  }
  
  if (now > this.expiryDate) {
    return { valid: false, message: 'Coupon has expired' };
  }
  
  if (this.usageLimit !== null && this.usageCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit exceeded' };
  }
  
  if (orderAmount < this.minPurchase) {
    return { 
      valid: false, 
      message: `Minimum purchase amount of $${this.minPurchase} required` 
    };
  }
  
  return { valid: true };
};

module.exports = mongoose.model('Coupon', CouponSchema);