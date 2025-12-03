/**
 * JWT Configuration
 * 
 * Helper functions for generating and verifying JSON Web Tokens
 * Used for user authentication and authorization
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {string} id - User ID from MongoDB
 * @returns {string} JWT token
 */
const generateToken = (id) => { 
  return jwt.sign(
    { id }, // payload data in the json
    process.env.JWT_SECRET, // Secret key for sign in
    { 
      expiresIn: process.env.JWT_SECRET || '7d' // token expires in 7 days
    }
  )
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload (contains user id)
 */
const verifyToken = (token) => { 
  try { 
    return jwt.verify(token, process.env.JWT_SECRET)
  }
  catch (error) { 
    throw new Error('Invalid Token')
  }
}

// export the generateToken and verifyToken methods
module.exports = { 
  generateToken,
  verifyToken
};