const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'YYC Track API is running',
    version: '1.0.0'
  });
});

// TODO: Routes will be added here by team members
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/user');
// app.use('/api/auth', authRoutes);
// app.use('/api/user', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connected successfully');
    } else {
      console.log('⚠️  MONGO_URI not set - running without database');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't exit in development - allow testing without DB
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
  });
};

startServer();