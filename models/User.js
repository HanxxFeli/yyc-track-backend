/**
 * User Model Schema
 * 
 * creates the user model schema that will be used for identifying the fields within the user object
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// create user schema using mongoose
const UserSchema = new mongoose.Schema({
  
  // Personal Information Section
  firstName: {
    type: String,
    required: [true, 'Please input a first name'],
    trim: true    // trim out whitespace
  },
  lastName: {
    type: String,
    required: [true, 'Please input a last name'],
    trim: true
  },

  // Email Section (common for both registration or OAUTH methods)
  email: {
    type: String,
    required: [true, 'Please input a valid email address'],
    unique: true,
    lowercase: true,    // automatically set the emails to lowercase
    trim: true
  },

  // Authentication Fields Section
  password: {
    type: String,
    required: function() { 
      // password is only required for local auth users
      return this.authMethod === 'local';
    },
    minlength: [7, 'At least 7 characters'],
    match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/, 
      'Password must include at least one lowercase letter, one uppercase letter, and one special character'
    ],    // regex matching for lowercase, uppercase and special character
    select: false   // security feature to hide password by default when querying
  },

  passwordResetToken: { 
    type: String,
    select: false // do not return
  },

  passwordResetExpires: { 
    type: Date,
    select: false // do not return
  },

  // Google OAuth ID
  googleId: { 
    type: String,
    sparse: true, // allow multiple null values but unique non-null values
    unique: true
  },

  // Track Authentication Method 
  authMethod: { 
    type: String,
    enum: ['local', 'google'],
    required: true,
    default: 'local'
  },

  // OAuth Profile picture (if available, can be utilized)
  profilePicture: { 
    type: String,
    default: null
  },

  // Email Verification
  isEmailVerified: { 
    type: Boolean,
    default: function() { 
      // if user does login via OAuth, consider it as pre-verified
      return this.authMethod === 'google';
    }
  },

  emailVerificationCode: { 
    type: String,
    select: false // dont return
  },

  emailVerificationExpires: {
    type: Date,
    select: false // dont return
  },

  // Profile Information (OAuth users will be asked for postal code later)
  postalCode: {
    type: String, 
    trim: true
  },

  // Role Management 
  role: { 
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true  // automatically manages createdAt and updatedAt
});

// Hash the password for 'local' users before saving to the DB
UserSchema.pre('save', async function() {
  // Only hash the password if it's modified and exists
  if (!this.isModified('password') || !this.password) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10); // add a random string for 10 rounds to the password before hashing
    this.password = await bcrypt.hash(this.password, salt); // creates the plain password with the hashed version
  } catch (error) {
    throw error;
  }
});

// Method to compare password for login and checks is password provides matches the hashed password
UserSchema.methods.comparePassword = async function(userPassword) {
  // Can't compare if there's no password (OAuth users)
  if (!this.password) {
    return false;
  }

  // provided password vs hashed password; returns boolean
  return await bcrypt.compare(userPassword, this.password);
};

// Export the model
module.exports = mongoose.model('User', UserSchema);
