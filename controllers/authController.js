/**
 * Authentication Controller
 * 
 * Handles user registration, login, and OAuth authentication
 * Manages token generation and user session logic
 */

const User = require('../models/User')
const { generateToken, verifyToken } = require('../config/jwt')
const crypto = require('crypto')
const { sendVerificationEmail } = require('../utils/email')
const { sendPasswordResetEmail } = require('../utils/email')

/**
 * @desc    Register new user (local authentication) - sends verification email
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

        // generate random 6-digit verfication code using math library
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create user (password will be hashed in the User.js file by pre-save middleware)
        const user = await User.create({ 
            // create method from mongoose to create user
            firstName,
            lastName,
            email,
            password,
            postalCode,
            authMethod: 'local',
            isEmailVerified: false, // not yet verified upon creation
            emailVerificationCode: verificationCode,
            emailVerificationExpires: Date.now() + 10 * 60 *1000 // 10 mins in total
        })

        // send the verification email to user 
        try { 
            await sendVerificationEmail(email, verificationCode) // use util which takes in the email of user and the randomly generated code
        } 
        catch (emailError) { 
            // if email fails, still create the user but log the error (TEMPORARY implementation)
            console.error(`Failed to send verification email: ${emailError}`)
        }

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
                authMethod: user.authMethod,
                isEmailVerified: user.isEmailVerified
            }
        });
    }
    catch (error) { 
        console.error(`Registration error: ${error.stack}`)

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
        if (!email || !password) { 
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            })
        };

        // find user and include password (excluded by default)
        const user = await User.findOne({ email }).select('+password')

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
        console.error(`Login error: ${error.stack}`);
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
        console.error(`Ger current user error: ${error.stack}`);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user data'
        });
    }
}

/**
 * @desc    Initiate Google OAuth flow
 *          passport automatically handles googleAuth
 *          placeholder for route
 * @route   GET /api/auth/google
 * @access  Public
 */
const googleAuth = (req, res, next) => {

};

/**
 * @desc    Google OAuth callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleAuthCallback = async (req, res) => { 
    try { 
        // req.user is set by Passport after successful OAuth that is handled in passport.js
        const user = req.user;

        // Generate jwt token using jwt.js
        const token = generateToken(user._id);
        console.log(`JWT TOKEN FOR TESTING: ${token}`) // temporary log to acquire token for testing

        // Check if user needs to add a postal code in profile
        const needsPostalCode = !user.postalCode;

        // Redirect to frontend with token and user info
        const frontendURL = process.env.CLIENT_URL || 'http://localhost:3000';
        
        // Encode data to pass to frontend
        const redirectURL = `${frontendURL}/auth/callback?token=${token}&needsPostalCode=${needsPostalCode}`;

        // redirect back to the frontend
        res.redirect(redirectURL);

    }
    catch (error) { 
        console.error(`Google callback error: ${error.stack}`);
        const frontendURL = process.env.CLIENT_URL || 'http://localhost:3000';
        res.redirect(`${frontendURL}/auth/error`);
    }
}

/**
 * @desc    Complete OAuth profile - user needs to add postal code
 * @route   PUT /api/auth/complete-profile
 * @access  Private
 */
const completeOAuthProfile = async (req, res) => { 
    try { 
        const { postalCode } = req.body; // deconstruct postalCOde into req.body

        if (!postalCode) { 
            return res.status(400).json({
                success: false,
                message: 'Postal code is required'
            });
        }

        // get user using id
        const user = await User.findById(req.user.id)

        if (!user) { 
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // update the postal code value and save the new user values
        user.postalCode = postalCode;
        await user.save(); 

        // send a json payload to verify success of profile creation
        res.status(200).json({
        success: true,
        message: 'Profile completed successfully',
        user: {
            id: user._id,
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
        console.error(`Complete profile error: ${error.stack}`);
        res.status(500).json({
            success: false,
            message: 'Server error completing profile'
        });
    }
}

/**
 * @desc    Verify email with code
 * @route   POST /api/auth/verify-email
 * @access  Private
 */
const verifyEmail = async (req, res) => { 
    try { 
        const { code } = req.body

        if (!code) { 
            return res.status(400).json({
                success: false,
                message: 'Please provide verification code'
            })
        }

        // find a user with matching code that hasnt expired
        const user = await User.findOne({
            _id: req.user.id,
            emailVerificationCode: code,
            emailVerificationExpires: {$gt: Date.now()} // check if expiration time is greater than current time
        })

        if (!user) { 
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification code'
            })
        }

        // set and mark email as verified 
        user.isEmailVerified = true;
        user.emailVerificationCode = undefined; // clear data
        user.emailVerificationExpires = undefined; // clear data
        await user.save(); // save user updates using mongoose

        // send json payload with user emails if email verification is a success
        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isEmailVerified: user.isEmailVerified
            }
        })
    }
    catch (error) { 
        console.error(`Verify email error: ${error}`)
        res.status(500).json({
            success: false,
            message: 'Server error verifying email'
        })
    }
}

/**
 * @desc    Resend verification code
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
const resendVerificationCode = async (req, res) => { 
    try {
        const user = await User.findById(req.user.id)

        // check if user exists
        if (!user) {
        return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // check if email has already been verified
        if (user.isEmailVerified) {
        return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }   

        // Generate new 6 digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Update user object with new code and expiration date
        user.emailVerificationCode = verificationCode;
        user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;  // 10 minutes
        await user.save(); // update user values again using mongoose save

    } 
    catch (error) { 
        console.error(`Resend verification error:' ${error.stack}`);
        res.status(500).json({
            success: false,
            message: 'Server error resending verification code'
        });
    }
}

/**
 * @desc    Request password reset (sends email)
 * @route   POST /api/auth/forgot-password
 *          Uses sendPasswordResetEmail function from email.js utility
 * @access  Public
 */
const forgotPassword = async (req, res) => { 
    try { 
        const { email } = req.body;

        // check if user provided an email address to send reset link
        if (!email) {
        return res.status(400).json({
                success: false,
                message: 'Please provide an email address'
            });
        }

        // get user using email
        const user = await User.findOne({ email })

        // if user doesnt exist send a message but do not reveal if user exists or not
        if (!user) { 
            return res.status(200).json({
                success: true,
                message: 'If an account exists with that email, a password reset link has been sent'
            });
        }

        // check if user used OAUth (cannot reset password)
        if (user.authMethod !== 'local') { 
            return res.status(400).json({
                success: false,
                message: 'Account uses Google sign-in. Please login with Google'
            })
        }

        // Generate reset token - use crypto for security pruposes
        const resetToken = crypto.randomBytes(32).toString('hex'); // 32bytes then hexadecimal

        // hash token before saving to database
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000;  // 1 hour before token expires
        await user.save() // save the new data to db
        
        // send email with unhashed token using email.js util function
        await sendPasswordResetEmail(user.email, resetToken)

        // send json payload confirmation for password reset
        res.status(200).json({
            success: true,
            message: 'Password reset email sent'
        });
    }
    catch (error) { 
        console.error(`Forgot password error: ${error.stack}`);
        res.status(500).json({
            success: false,
            message: 'Error sending password reset email'
        });
    }
}

/**
 * @desc    Reset password using token from email
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res) => { 
    try { 
        const { newPassword } = req.body
        const { token } = req.params

        // if no new password was provided, 
        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a new password'
            })
        }

        // Hash the token from URL to compare with database
        const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')

        // Find user with matching token that is not yet expired
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+password'); // include password when user is queried

        // if no user has a reset token that is matching or is not yet expired
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password (will be hashed by pre-save middleware)
        user.password = newPassword
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save();  // when save() is run, it also runs the pre-save middleware that hashes the password

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        })
    }
    catch (error) { 
        console.error('Reset password error:', error)

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Password validation failed',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
}

module.exports = { 
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
};
