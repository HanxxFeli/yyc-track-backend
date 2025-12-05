/**
 * Main Server File
 * 
 * Entry point for the application
 * Configures Express server, connects to database, and starts listening for requests
 */

require('dotenv').config(); // load env variables from .env
const express = require('express')
const cors = require('cors') // cors middleware 
const session = require('express-session')
const passport = require('./config/passport')
const connectDB = require('./config/mongoDB')

// initialize Express app 
const app = express();

// temporary connection to MongoDB (eventually move into try-catch block)
connectDB();

// Middleware - to be used before routes
// CORS - allow requests from frontend 
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // frontend URL
  credentials: true // allows cookies to be used
}))

// Parser middleware - allow json to be read from request body
app.use(express.json()); // allow express to read JSON from req body
app.use(express.urlencoded({ extended: false })); // allow express to read URL-encoded data

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false, 
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Initialize passport 
app.use(passport.initialize());
app.use(passport.session());


// Routes
const authRoutes = require('./routes/authRoutes') // import created authRoutes
const userRoutes = require('./routes/userRoutes') // import created userRoutes

app.use('/api/auth', authRoutes); // include all routes in authRoutes file
app.use('/api/users', userRoutes); // include all routes in userRoutes file

// Temporary test route 
app.get('/', (req, res) => { 
  res.json({
    message: 'YYC TRACK API is running',
    version: '1.0.0',
    endpoints: { 
      auth: '/api/auth',
      users: '/api/users'
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