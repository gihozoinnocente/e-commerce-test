const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Protect routes - Authentication check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'You are not logged in. Please log in to access this resource.'
        }
      });
    }
    
    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'The user belonging to this token no longer exists.'
        }
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Your account has been deactivated. Please contact an administrator.'
        }
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token. Please log in again.'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Your token has expired. Please log in again.'
        }
      });
    }
    
    next(error);
  }
};

/**
 * Restrict access to certain roles
 * @param {...String} roles - Allowed roles
 * @returns {Function} - Express middleware function
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You do not have permission to perform this action'
        }
      });
    }
    
    next();
  };
};