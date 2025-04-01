const rateLimit = require('express-rate-limit');
const { RateLimiterMySQL } = require('rate-limiter-flexible');
const { sequelize } = require('../config/database');

/**
 * Basic rate limiter using memory store
 * Useful for development and small-scale deployments
 */
exports.basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes'
    }
  }
});

/**
 * Login rate limiter - stricter limits for auth endpoints
 * Prevents brute force attacks
 */
exports.loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many login attempts from this IP, please try again after an hour'
    }
  }
});

/**
 * Advanced rate limiter using MySQL as store
 * Suitable for production and distributed environments
 */
const setupMySQLRateLimiter = async () => {
  // Create table for rate limiting if it doesn't exist
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS rate_limit (
      key VARCHAR(255) NOT NULL,
      points INT NOT NULL,
      expire BIGINT,
      PRIMARY KEY (key)
    )
  `);
  
  const opts = {
    storeClient: sequelize,
    points: 100, // Number of points
    duration: 60 * 15, // Per 15 minutes
    tableName: 'rate_limit',
    keyPrefix: 'rl'
  };
  
  const rateLimiterMySQL = new RateLimiterMySQL(opts);
  
  return async (req, res, next) => {
    try {
      const key = req.ip;
      await rateLimiterMySQL.consume(key, 1);
      next();
    } catch (error) {
      if (error.remainingPoints !== undefined) {
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests, please try again later',
            retryAfter: Math.round(error.msBeforeNext / 1000) || 1
          }
        });
      } else {
        // If error is not related to rate limiting, pass it to the next middleware
        next(error);
      }
    }
  };
};

exports.setupMySQLRateLimiter = setupMySQLRateLimiter;