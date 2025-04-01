const searchService = require('../services/searchService');
const cacheService = require('../services/cacheService');

/**
 * Advanced search
 * @route GET /api/search/products
 * @access Public
 */
exports.advancedSearch = async (req, res, next) => {
  try {
    const {
      query,
      categoryId,
      categoryIds,
      minPrice,
      maxPrice,
      tags,
      attributes,
      inStock,
      isActive,
      isFeatured,
      createdAfter,
      createdBefore,
      updatedAfter,
      updatedBefore,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    
    // Parse arrays and objects from query string
    let parsedCategoryIds = categoryIds;
    let parsedTags = tags;
    let parsedAttributes = attributes;
    
    if (categoryIds && typeof categoryIds === 'string') {
      try {
        parsedCategoryIds = categoryIds.split(',').map(id => parseInt(id, 10));
      } catch (error) {
        parsedCategoryIds = null;
      }
    }
    
    if (tags && typeof tags === 'string') {
      parsedTags = tags.split(',').map(tag => tag.trim());
    }
    
    if (attributes && typeof attributes === 'string') {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch (error) {
        parsedAttributes = null;
      }
    }
    
    // Create search filters
    const filters = {
      query,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      categoryIds: parsedCategoryIds,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      tags: parsedTags,
      attributes: parsedAttributes,
      inStock: inStock !== undefined ? inStock === 'true' : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
      createdAfter,
      createdBefore,
      updatedAfter,
      updatedBefore
    };
    
    // Pagination and sorting
    const pagination = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
    
    const sorting = {
      sortBy,
      sortOrder
    };
    
    // Execute search
    const results = await searchService.searchProducts(filters, pagination, sorting);
    
    res.status(200).json({
      success: true,
      count: results.count,
      totalPages: results.totalPages,
      currentPage: results.currentPage,
      data: results.products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Full-text search
 * @route GET /api/search/fulltext
 * @access Public
 */
exports.fullTextSearch = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Search query is required'
        }
      });
    }
    
    // Use cache for common search queries
    const cacheKey = cacheService.createKey('fulltext', query, page, limit);
    const cachedResults = await cacheService.get(cacheKey);
    
    if (cachedResults) {
      return res.status(200).json({
        success: true,
        cached: true,
        count: cachedResults.count,
        totalPages: cachedResults.totalPages,
        currentPage: cachedResults.currentPage,
        data: cachedResults.products
      });
    }
    
    const results = await searchService.fullTextSearch(query, { page, limit });
    
    // Cache results for 5 minutes
    await cacheService.set(cacheKey, results, 300);
    
    res.status(200).json({
      success: true,
      count: results.count,
      totalPages: results.totalPages,
      currentPage: results.currentPage,
      data: results.products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product suggestions
 * @route GET /api/search/suggestions/:productId
 * @access Public
 */
exports.getProductSuggestions = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;
    
    // Use cache for product suggestions
    const cacheKey = cacheService.createKey('suggestions', productId, limit);
    const cachedSuggestions = await cacheService.get(cacheKey);
    
    if (cachedSuggestions) {
      return res.status(200).json({
        success: true,
        cached: true,
        count: cachedSuggestions.length,
        data: cachedSuggestions
      });
    }
    
    const suggestions = await searchService.getProductSuggestions(
      parseInt(productId, 10),
      parseInt(limit, 10)
    );
    
    // Cache suggestions for 1 hour
    await cacheService.set(cacheKey, suggestions, 3600);
    
    res.status(200).json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trending products
 * @route GET /api/search/trending
 * @access Public
 */
exports.getTrendingProducts = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    
    // Use cache for trending products, but with shorter TTL
    const cacheKey = cacheService.createKey('trending', limit);
    const cachedTrending = await cacheService.get(cacheKey);
    
    if (cachedTrending) {
      return res.status(200).json({
        success: true,
        cached: true,
        count: cachedTrending.length,
        data: cachedTrending
      });
    }
    
    const trendingProducts = await searchService.getTrendingProducts(
      parseInt(limit, 10)
    );
    
    // Cache trending products for 30 minutes
    await cacheService.set(cacheKey, trendingProducts, 1800);
    
    res.status(200).json({
      success: true,
      count: trendingProducts.length,
      data: trendingProducts
    });
  } catch (error) {
    next(error);
  }
};