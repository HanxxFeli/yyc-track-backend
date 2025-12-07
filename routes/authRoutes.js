/**
 * Authentication Routes
 * 
 * Defines all authentication-related endpoints
 * Maps HTTP methods and paths to controller functions
 * Include routes related to google OAuth
 */

const express = require('express');
const router = express.Router();
const passport = require('passport')
const {
  registerUser,
  loginUser,
  getCurrentUser,
  googleAuth,
  googleAuthCallback,
  completeOAuthProfile,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// LOCAL ROUTES

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

// GOOGLE OAUTH ROUTES

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 *          Uses passport.authentication middleware to trigger OAuth flow
 * @access  Public
 */
router.get('/google', passport.authenticate('google',{ 
    scope: ['profile', 'email'] // gets the profile and email
}));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback URL - handle redirect from google
 *          Controller function googleAuthCallback - handle the redirected user from google
 * @access  Public
 */
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false
}), googleAuthCallback)

/**
 * @route   PUT /api/auth/complete-profile
 * @desc    Complete OAuth profile (add postal code)
 *          Protect middleware to verify jwt token and authentication
 *          Controller completeOAuthProfile to acquire and add postal code to user data
 * @access  Private
 */
router.put('/complete-profile', protect, completeOAuthProfile);

// EMAIL VERIFICATION ROUTES

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with 6-digit code
 *          Protect middleware will used to validate user authentication
 *          verifyEmail from controller will handle email verification
 * @access  Private
 */
router.post('/verify-email', protect, verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification code
 *          Protect middleware will used to validate user authentication
 *          resendVerificationCode from controller will handle resending code to user
 * @access  Private
 */
router.post('/resend-verification', protect, resendVerificationCode);

// Password reset routes
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 *          forgotPassword from controller will send the email link to the user
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   PUT /api/auth/reset-password/:token
 * @desc    Reset password using token
 *          resetPassword from controller will use token that was sent to the user to reset password
 * @access  Public
 */
router.put('/reset-password/:token', resetPassword);


module.exports = router;

