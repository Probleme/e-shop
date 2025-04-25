const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1'],
    default: 1
  }
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  coupon: {
    code: String,
    discountPercentage: Number,
    expiryDate: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Set updatedAt on save
CartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate cart totals
CartSchema.methods.calculateTotals = function() {
  const subtotal = this.items.reduce(
    (sum, item) => sum + (item.product.price * item.quantity),
    0
  );
  
  const discount = this.coupon 
    ? (subtotal * (this.coupon.discountPercentage / 100)) 
    : 0;
    
  return {
    subtotal,
    discount,
    shipping: subtotal > 50 ? 0 : 9.99, // Free shipping over $50
    tax: (subtotal - discount) * 0.08, // 8% tax
    total: subtotal - discount + (subtotal > 50 ? 0 : 9.99) + ((subtotal - discount) * 0.08)
  };
};

module.exports = mongoose.model('Cart', CartSchema);