const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const sanitizeHtml = require('sanitize-html');
const errorHandler = require('./middleware/errorHandler');
const fileUpload = require('express-fileupload');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Set security headers with enhanced XSS protection
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
    },
  },
  xssFilter: true,
  noSniff: true
}));

// Custom XSS prevention middleware with sanitize-html
app.use((req, res, next) => {
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
          disallowedTagsMode: 'recursiveEscape'
        });
      }
    }
  }
  next();
});

// Logger for development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File Upload Middleware
app.use(fileUpload({
    limits: { fileSize: process.env.MAX_FILE_SIZE || 2 * 1024 * 1024 }, // 2MB default
    createParentPath: true // Create upload directory if it doesn't exist
  }));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// CORS setup for development
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CSRF Protection (basic implementation)
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: 'token-placeholder' }); // This would be real CSRF token in production
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'E-commerce API v1.0',
    documentation: '/api/docs'
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Routes (commented out until implemented)
// Once you implement these routes, uncomment them
/*
app.use('/api/reviews', require('./routes/reviews'));
*/

// Error handler middleware (must be last)
app.use(errorHandler);

module.exports = app;