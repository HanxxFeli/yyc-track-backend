/**
 * User Routes
 * 
 * Defines all user-related endpoints
 * Most routes require authentication, some require admin role
 */

const express = require('express');
const router = express.Router();
const {
    updateProfile,
    changePassword,
    deleteAccount,
    getAllUsers,
    getUserById
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile (firstName, lastName, postalCode)
 *          Use protect middleware to verify jwt and user authentication
 * @access  Private
 */
router.put('/profile', protect, updateProfile);


/**
 * @route   PUT /api/users/password
 * @desc    Change user password
 *          Use protect middleware to verify jwt and user authentication
 * @access  Private
 */
router.put('/password', protect, changePassword);

/**
 * @route   DELETE /api/users/account
 * @desc    Deactivate user account (soft delete)
 *          Use protect middleware to verify jwt and user authentication
 * @access  Private
 */
router.delete('/account', protect, deleteAccount);

/**
 * @route   GET /api/users
 * @desc    Get all users
 *          Use protect middleware to verify jwt and user authentication
 *          Use admin middleware to verify admin status
 * @access  Private/Admin
 */
router.get('/', protect, admin, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 *          Use protect middleware to verify jwt and user authentication
 *          Use admin middleware to verify admin status
 * @access  Private/Admin
 */
router.get('/:id', protect, admin, getUserById);

module.exports = router;