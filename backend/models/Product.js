const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be greater than or equal to 0']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price must be greater than or equal to 0']
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Please add a category']
  },
  subcategory: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  images: [String],
  mainImage: {
    type: String,
    default: 'no-photo.jpg'
  },
  featured: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isDealOfTheDay: {
    type: Boolean,
    default: false
  },
  dealExpiresAt: Date,
  specifications: [{
    name: String,
    value: String
  }],
  rating: {
    type: Number,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['g', 'kg', 'oz', 'lb'],
      default: 'g'
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in', 'm'],
      default: 'cm'
    }
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'out_of_stock'],
    default: 'draft'
  },
  variants: [{
    name: String,
    options: [String],
    values: [{
      combination: [String],
      price: Number,
      stock: Number,
      sku: String,
      image: String
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String]
});

// Create slug from name
ProductSchema.pre('save', function(next) {
  // Only generate slug if name is modified or it's a new record
  if (!this.isModified('name') && this.slug) {
    return next();
  }
  
  // Generate a slug
  this.slug = slugify(this.name, { 
    lower: true,
    remove: /[*+~.()'"!:@]/g
  });
  
  // If product has variants, ensure the price is the lowest variant price
  if (this.variants && this.variants.length > 0 && this.variants[0].values.length > 0) {
    const prices = this.variants[0].values.map(v => v.price).filter(p => p);
    if (prices.length > 0) {
      this.price = Math.min(...prices);
    }
  }
  
  // Update the updatedAt field
  this.updatedAt = Date.now();
  
  next();
});

// Cascade delete reviews when a product is deleted
ProductSchema.pre('remove', async function(next) {
  await this.model('Review').deleteMany({ product: this._id });
  next();
});

// Static method to get product with discount percentage
ProductSchema.statics.getWithDiscountPercentage = function(product) {
  if (product.originalPrice && product.originalPrice > product.price) {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    return {
      ...product.toObject(),
      discountPercentage: discount
    };
  }
  return product;
};

module.exports = mongoose.model('Product', ProductSchema);