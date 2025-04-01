const NodeCache = require('node-cache');
const redis = require('redis');
const { promisify } = require('util');

/**
 * Cache Service for performance optimization
 */
class CacheService {
  constructor() {
    // Initialize in-memory cache for development
    this.memoryCache = new NodeCache({
      stdTTL: 300, // 5 minutes default TTL
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false // Don't clone objects for better performance
    });
    
    // Initialize Redis client for production if configured
    this.redisClient = null;
    this.redisEnabled = process.env.REDIS_ENABLED === 'true';
    
    if (this.redisEnabled) {
      try {
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          password: process.env.REDIS_PASSWORD,
          socket: {
            reconnectStrategy: (retries) => Math.min(retries * 50, 1000) // Backoff strategy
          }
        });
        
        this.redisClient.on('error', (err) => {
          console.error('Redis error:', err);
          // Fallback to memory cache if Redis fails
          this.redisEnabled = false;
        });
        
        this.redisClient.on('connect', () => {
          console.log('Redis connected successfully');
        });
        
        // Promisify Redis methods
        this.redisGet = promisify(this.redisClient.get).bind(this.redisClient);
        this.redisSet = promisify(this.redisClient.set).bind(this.redisClient);
        this.redisDel = promisify(this.redisClient.del).bind(this.redisClient);
        this.redisFlush = promisify(this.redisClient.flushall).bind(this.redisClient);
      } catch (error) {
        console.error('Redis initialization error:', error);
        this.redisEnabled = false;
      }
    }
  }
  
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached value or null
   */
  async get(key) {
    try {
      // Try Redis first if enabled
      if (this.redisEnabled && this.redisClient) {
        const redisValue = await this.redisGet(key);
        if (redisValue) {
          return JSON.parse(redisValue);
        }
      }
      
      // Fallback to memory cache
      const memValue = this.memoryCache.get(key);
      return memValue || null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, value, ttl = 300) {
    try {
      // Set in Redis if enabled
      if (this.redisEnabled && this.redisClient) {
        await this.redisSet(key, JSON.stringify(value), 'EX', ttl);
      }
      
      // Also set in memory cache for performance
      this.memoryCache.set(key, value, ttl);
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }
  
  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async del(key) {
    try {
      // Delete from Redis if enabled
      if (this.redisEnabled && this.redisClient) {
        await this.redisDel(key);
      }
      
      // Delete from memory cache
      this.memoryCache.del(key);
      
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }
  
  /**
   * Flush all cache
   * @returns {Promise<boolean>} - Success status
   */
  async flush() {
    try {
      // Flush Redis if enabled
      if (this.redisEnabled && this.redisClient) {
        await this.redisFlush();
      }
      
      // Flush memory cache
      this.memoryCache.flushAll();
      
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
  
  /**
   * Create a cache key from parts
   * @param {...any} parts - Key parts
   * @returns {string} - Cache key
   */
  createKey(...parts) {
    return parts.join(':');
  }
  
  /**
   * Cache middleware for Express routes
   * @param {number} ttl - Time to live in seconds
   * @returns {Function} - Express middleware
   */
  middleware(ttl = 60) {
    return async (req, res, next) => {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      // Skip caching for authenticated routes
      if (req.user) {
        return next();
      }
      
      const key = this.createKey('route', req.originalUrl);
      
      try {
        const cachedResponse = await this.get(key);
        
        if (cachedResponse) {
          return res.status(cachedResponse.status)
            .set('X-Cache', 'HIT')
            .json(cachedResponse.body);
        }
        
        // Store original json method
        const originalJson = res.json;
        
        // Override json method to cache the response
        res.json = (body) => {
          // Restore original json method
          res.json = originalJson;
          
          // Only cache successful responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const responseToCache = {
              status: res.statusCode,
              body
            };
            
            this.set(key, responseToCache, ttl).catch(console.error);
          }
          
          // Call original json method
          return originalJson.call(res, body);
        };
        
        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }
  
  /**
   * Create a function that uses cache
   * @param {Function} fn - Function to cache
   * @param {number} ttl - Time to live in seconds
   * @param {Function} keyFn - Function to generate cache key
   * @returns {Function} - Cached function
   */
  cacheFunction(fn, ttl = 300, keyFn = (...args) => JSON.stringify(args)) {
    return async (...args) => {
      const key = this.createKey('func', fn.name, keyFn(...args));
      
      try {
        const cachedResult = await this.get(key);
        
        if (cachedResult) {
          return cachedResult;
        }
        
        const result = await fn(...args);
        await this.set(key, result, ttl);
        
        return result;
      } catch (error) {
        console.error(`Cache function error for ${fn.name}:`, error);
        return fn(...args); // Fallback to original function
      }
    };
  }
}

module.exports = new CacheService();