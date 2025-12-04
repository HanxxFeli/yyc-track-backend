/**
 * Main Server File
 * 
 * Entry point for the application
 * Configures Express server, connects to database, and starts listening for requests
 */

require('dotenv').config(); // load env variables from .env
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/mongoDB')

// initialize Express app 
const app = express();

// temporary connection to MongoDB
connectDB();

// Middleware - to be used before routes
app.use(express.json()); // allow express to read JSON from req body
app.use(express.urlencoded({ extended: false })); // allow express to read URL-encoded data


// CORS - allow requests from frontend 
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // frontend URL
  credentials: true // allows cookies to be used
}))

// Routes
const authRoutes = require('./routes/authRoutes') // import created AuthRoutes
app.use('/api/auth', authRoutes);

// Temporary test route 
app.get('/', (req, res) => { 
  res.json({
    message: 'YYC TRACK API is running',
    version: '1.0.0',
    endpoints: { 
      auth: '/api/auth'
    }
  });
})

// 404 - Route not Found
app.use((req, res) => { 
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
})

// Starting the server 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { 
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})