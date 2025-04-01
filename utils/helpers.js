/**
 * Helper functions for the product catalog API
 */

/**
 * Calculate final price after discount
 * @param {number} basePrice - Base price
 * @param {string} discountType - Type of discount ('none', 'percentage', 'fixed')
 * @param {number} discountValue - Value of discount
 * @returns {number} - Final price after discount
 */
exports.calculateFinalPrice = (basePrice, discountType, discountValue) => {
    if (!basePrice || basePrice <= 0) {
      return 0;
    }
  
    switch (discountType) {
      case 'percentage':
        // Ensure the percentage is between 0 and 100
        const percentage = Math.min(Math.max(discountValue, 0), 100);
        return basePrice * (1 - percentage / 100);
      
      case 'fixed':
        // Ensure the discount doesn't make the price negative
        return Math.max(basePrice - discountValue, 0);
      
      case 'none':
      default:
        return basePrice;
    }
  };
  
  /**
   * Format price to currency string
   * @param {number} price - Price to format
   * @param {string} currencyCode - Currency code (default: 'USD')
   * @returns {string} - Formatted price
   */
  exports.formatPrice = (price, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(price);
  };
  
  /**
   * Check if an item is low in stock
   * @param {number} quantity - Current quantity
   * @param {number} threshold - Low stock threshold
   * @returns {boolean} - Whether the item is low in stock
   */
  exports.isLowStock = (quantity, threshold) => {
    return quantity <= threshold && quantity > 0;
  };
  
  /**
   * Check if an item is out of stock
   * @param {number} quantity - Current quantity
   * @returns {boolean} - Whether the item is out of stock
   */
  exports.isOutOfStock = (quantity) => {
    return quantity <= 0;
  };
  
  /**
   * Generate a pagination object
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total number of items
   * @returns {Object} - Pagination object
   */
  exports.getPagination = (page, limit, total) => {
    const currentPage = parseInt(page, 10) || 1;
    const itemsPerPage = parseInt(limit, 10) || 10;
    const totalPages = Math.ceil(total / itemsPerPage);
    
    return {
      currentPage,
      itemsPerPage,
      totalPages,
      totalItems: total,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };
  };
  
  /**
   * Parse array or comma-separated string to array
   * @param {string|Array} value - Input value
   * @returns {Array} - Resulting array
   */
  exports.parseArrayOrString = (value) => {
    if (!value) {
      return [];
    }
    
    if (Array.isArray(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
    
    return [];
  };
  
  /**
   * Generate SKU for product variants
   * @param {string} baseSku - Base SKU of the product
   * @param {Object} options - Variant options (e.g., color, size)
   * @returns {string} - Generated SKU
   */
  exports.generateVariantSku = (baseSku, options) => {
    if (!baseSku || !options || Object.keys(options).length === 0) {
      return baseSku;
    }
    
    const optionParts = Object.values(options)
      .map(value => {
        if (typeof value === 'string') {
          // Convert to uppercase, remove spaces, and limit to first 3 chars
          return value.toUpperCase().replace(/\s+/g, '').slice(0, 3);
        }
        return value;
      })
      .join('-');
    
    return `${baseSku}-${optionParts}`;
  };
  
  /**
   * Sanitize and validate search query
   * @param {string} query - Search query
   * @returns {string} - Sanitized query
   */
  exports.sanitizeSearchQuery = (query) => {
    if (!query) {
      return '';
    }
    
    // Remove special characters that could be used for SQL injection
    return query.replace(/[;'"\\%_]/g, '');
  };