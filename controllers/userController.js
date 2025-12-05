/**
 * User Controller
 * 
 * Handles user profile management operations
 * All routes here require authentication (using protect middleware)
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async(req, res) => { 
    try { 
        // get user from db (req.user comes from protect middleware)
        const user = await User.findById(req.user.id)

        if (!user) { 
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        // define fields that can be updated
        const { firstName, lastName, postalCode } = req.body;

        // update fields if provided
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (postalCode) user.postalCode = postalCode;

        // save updated user 
        const updatedUser = await user.save(); // use mongoose save method

        // send json comfirmation status to verify payload was successfully updated
        res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
            id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            postalCode: updatedUser.postalCode,
            role: updatedUser.role,
            authMethod: updatedUser.authMethod,
            profilePicture: updatedUser.profilePicture
        }
        });
    }
    catch (error) { 
        console.error(`Update profile error: ${error.stack}`)

        // handle validation errors - get errors key from error object and return the message
        if (error.name === 'ValidationError') { 
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        // generic server error
        res.status(500).json({
            success: false,
            message: 'Server error updating profile'
        });
    }
}

/**
 * @desc    Change user password
 * @route   PUT /api/users/password
 * @access  Private
 */
const changePassword = async (req, res) => { 
    try { 
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) { 
            return res.status(400).json({
                success: false,
                message: 'Please provide current password and new password'
            });   
        }

        // get user with password (excluded by default)
        const user = await User.findById(req.user.id).select('+password')

        if (!user) { 
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // check if user is an OAuth user (OAuth user does not have a password)
        if (user.authMethod !== 'local') { 
            return res.status(400).json({
                success: false,
                message: 'Cannot change password for OAuth accounts'
            })
        }

        // Verify current password 
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) { 
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            })
        };

        // check if new password is same as current
        if (currentPassword === newPassword) { 
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // update password (this will be hashed by pre-save middleware)
        user.password = newPassword;
        await user.save(); // call mongoose method to save

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) { 
        console.error(`Change password error: ${error.stack}`)

        // Handle validation error (if new password doesnt meet requirements)
        if (error.name === 'Validation Error') { 
            const messages = Object.values(error.errors).map(err => err.message); // extract errors.message from error payload
            return res.status(400).json({
                success: false,
                message: 'Pasword validation failed',
                errors: messages
            })
        }

        // generic status 500
            res.status(500).json({
                success: false,
                message: 'Server error changing password'
            });
    }
}

/**
 * @desc    Delete user account (will implement soft delete - sets isActive to false)
 * @route   DELETE /api/users/account
 * @access  Private
 */
const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id); // instantiate user by finding mongoose User through id
        
        if (!user) { 
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // implement soft delete (account deactivation)
        user.isActive = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Account deactivated successfully'         
        });
    }
    catch (error) { 
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deactivating account'
        });
    }
}

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res) => { 
    try { 
        // get all active users but exclude password from payload 
        const users = await User.find({ isActive: true}).select('-password') // returns an array of users that has isActive as true

        // send json payload with users to confirm success
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    }
    catch (error) { 
        console.error('Get all users error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error fetching users'
        });
    }
}

/**
 * @desc    Get user by ID (admin only)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */

const getUserById = async (req, res) => { 
    try { 
        const user = await User.findById(req.params.id).select('-password'); // use id in the param to find user

        if (!user) { 
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // return json payload with user to confirm success
        res.status(200).json({
            success: true,
            user
        });
    } 
    catch (error) { 
        console.error(`Get user by ID error: ${error.stack}`);

        // Handle invalid MongoDB ID format
        if (error.kind === 'ObjectId') {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
        }

        res.status(500).json({
        success: false,
        message: 'Server error fetching user'
        });
    }
}

module.exports = {
  updateProfile,
  changePassword,
  deleteAccount,
  getAllUsers,
  getUserById
};