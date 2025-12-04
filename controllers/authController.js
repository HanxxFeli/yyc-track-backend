/**
 * Authentication Controller
 * 
 * Handles user registration, login, and OAuth authentication
 * Manages token generation and user session logic
 */

const User = require('../models/User')
const { generateToken } = require('../config/jwt')

/**
 * @desc    Register new user (local authentication)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => { 
    try { 
        const { firstName, lastName, email, password, postalCode} = req.body;

        // check if user already exists
        const userExists = await User.findOne({ email }); // mongoose query method

        if (userExists) { 
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            })
        }

        // Create user (password will be hashed in the User.js file by pre-save middleware)
        const user = await User.create({ 
            // create method from mongoose to create user
            firstName,
            lastName,
            email,
            password,
            postalCode,
            authMethod: 'local'
        })

        // generate JWT token
        const token = generateToken(user._id) // mongoDB ObjectID

        // send response (excluding password)
        res.status(201).json({
            succes: true,
            message: 'User registered successfully',
            token,
            user: { 
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                postalCode: user.postalCode,
                role: user.role,
                authMethod: user.authMethod
            }
        });
    }
    catch (error) { 
        console.error(`Registration error: ${error}`)

        // handle validation error from Mongoose
        if (error.name === 'ValidationError') { 
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            })
        }

        // generic error handling 
        res.status(500).json({
            succes: false,
            message: 'Server error during registration'
        });
    }
}   

/**
 * @desc    Login user (local authentication)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async(req, res) => { 
    try { 
        const { email, password } = req.body;

        // Validate input
        if (!emaill || !password) { 
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            })
        };

        // find user and include password (excluded by default)
        const user = await user.findOne({ email }).select('+password')

        if (!user) { 
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            })
        };

        // check if user used OAuth (there should be no password)
        if (user.authMethod === 'google') { 
            return res.status(400).json({
                success: false,
                message: 'This account uses Google sign-in. Please login with Google.'
            })
        };

        // check if account is active 
        if (!user.isActive) { 
            return res.status(400).json({
                success: false,
                message: 'Account has been deactivated'
            })
        };

        // verify password using method created in User.js 
        const isPasswordMatch = await user.comparePassword(password)

        if (!isPasswordMatch) { 
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        };

        // generate JWT token to be sent in the response
        const token = generateToken(user._id)

        // send response after user has logged in 
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: { 
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                postalCode: user.postalCode,
                role: user.role,
                authMethod: user.authMethod,
                profilePicture: user.profilePicture
            }
        });
    }
    catch (error) { 
        console.error(`Login error: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
}

/**
 * @desc    Get current logged in user 
 * @route   GET /api/auth/me (consider currentUser as the 'me')
 * @access  Private (requires token)
 */
const getCurrentUser = async (req, res) => { 
    try { 
        // find user by id from payload
        const user = await User.findById(req.user.id)

        res.status(200).json({
            success: true,
            user: { 
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                postalCode: user.postalCode,
                role: user.role,
                authMethod: user.authMethod,
                profilePicture: user.profilePicture,
                isEmailVerified: user.isEmailVerified
            }
        })
    } 
    catch (error) { 
        console.error(`Ger current user error: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user data'
        });
    }
}


module.exports = { 
    registerUser,
    loginUser,
    getCurrentUser
};
