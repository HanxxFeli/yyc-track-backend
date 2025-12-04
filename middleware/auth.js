/**
 * Authentication Middleware
 * 
 * Protects routes by verifying JWT tokens
 * Extracts user information and attaches to request object
 */

const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

/**
 * Protect routes - verify JWT token and authenticate user
 * Use this middleware on any route that requires authentication
 */
const protect = async (req, res, next) => { 
    let token;

    // Check if token exists in Auth header ("Authorization: Bearer <token>")
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) { 
        try {
            // extract token from header
            token = req.headers.authorization.split(' ')[1];

            
            // verify token using helper and returns decoded payload
            const decoded = verifyToken(token)

            // get user from db using id from token but dont include password
            // use the methods findByID() - get user id, and select() - exclude
            req.user = await User.findById(decoded.id).select('-password')

            // check if user exists in database 
            if (!req.user) { 
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            };

            // check if user account is active
            if (!req.user.isActive) { 
                return res.status(401).json({
                    success: false,
                    message: 'Account has been deactivated'
                })
            };

            // user is authenticated - proceed to next middleware
            next();
        }
        catch (error) { 
            console.error(`Auth middleware error: ${error.message}`)
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            })
        }
    } 
    
    // no token provided 
    if (!token) { 
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token failed'  
        })
    }
};

/**
 * Admin authorization middleware (Role Checker)
 * Must be used AFTER protect middleware
 * Checks if authenticated user has admin role
 */
const admin = (req, res, next) => { 
    // req.user is passed through by protect middleware
    if (req.user && req.user.role === 'admin') { 
        next(); // Allow acces if user is admin
    } else { 
        res.status(403).json({ 
            success: false,
            message: 'Not authorized as admin' 
        })
    }
};

module.exports = { protect, admin };