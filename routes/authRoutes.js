/**
 * Authentication Routes
 * 
 * Defines all authentication-related endpoints
 * Maps HTTP methods and paths to controller functions
 */

const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getCurrentUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (local authentication)
 *          Controller function registerUser will be handle the route
 * @access  Public
 */
router.post('/register', registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user (local authentication)
 *          Controller function loginUser will be handle the route
 * @access  Public
 */
router.post('/login', loginUser);

/**
 * @route   POST /api/auth/me
 * @desc    Get current logged in user information
 *          Middleware protect will be used to validate user
 *          Controller function getCurrentUser will be handle the route
 * @access  Private (requires valid JWT token)
 */
router.get('/me', protect, getCurrentUser);

module.exports = router;

