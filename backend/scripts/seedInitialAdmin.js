const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const createAdmin = async () => {
  try {
    const email = process.argv[2];
    const name = process.argv[3] || 'Admin User';
    
    if (!email) {
      console.log('Please provide an email address as argument');
      process.exit(1);
    }

    // Check if admin already exists
    const adminExists = await User.findOne({ email });
    
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create random secure password
    const password = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);

    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      emailVerified: true
    });

    console.log(`Admin user created with email: ${email}`);
    console.log(`Initial password: ${password}`);
    console.log('Please login and change this password immediately');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();