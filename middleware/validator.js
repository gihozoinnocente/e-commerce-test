const { validationResult } = require('express-validator');

/**
 * Validation middleware that checks for validation errors
 * and returns appropriate response
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation Error',
        details: errors.array().map(error => ({
          field: error.param,
          message: error.msg
        }))
      }
    });
  }
  
  next();
};

module.exports = validate;