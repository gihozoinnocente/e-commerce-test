/**
 * Custom error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    // Format the error response
    const errorResponse = {
      success: false,
      error: {
        message: err.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }
    };
  
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const errors = err.errors.map(e => ({
        field: e.path,
        message: e.message
      }));
      
      errorResponse.error.details = errors;
      return res.status(400).json(errorResponse);
    }
  
    // Handle other Sequelize errors
    if (err.name === 'SequelizeDatabaseError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Database Error',
          ...(process.env.NODE_ENV === 'development' && { originalError: err.message })
        }
      });
    }
  
    // Log error for server errors
    if (statusCode === 500) {
      console.error(`[ERROR] ${err.stack}`);
    }
  
    res.status(statusCode).json(errorResponse);
  };
  
  module.exports = errorHandler;