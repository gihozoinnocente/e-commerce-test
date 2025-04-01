const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('../models/product');
const Category = require('../models/category');
const Variant = require('../models/variant');
const Inventory = require('../models/inventory');

/**
 * Advanced search service for products
 */
class SearchService {
  /**
   * Search products with advanced filtering
   * @param {Object} filters - Search filters
   * @param {Object} pagination - Pagination options
   * @param {Object} sorting - Sorting options
   * @returns {Promise<Object>} - Search results
   */
  async searchProducts(filters = {}, pagination = {}, sorting = {}) {
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
        updatedBefore
      } = filters;
      
      const { page = 1, limit = 10 } = pagination;
      const { sortBy = 'createdAt', sortOrder = 'DESC' } = sorting;
      
      // Build where clause
      const where = {};
      const categoryWhere = {};
      const inventoryWhere = {};
      
      // Text search
      if (query) {
        where[Op.or] = [
          { name: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
          { sku: { [Op.like]: `%${query}%` } },
          { tags: { [Op.like]: `%${query}%` } }
        ];
      }
      
      // Category filtering
      if (categoryId) {
        where.categoryId = categoryId;
      }
      
      // Multiple categories filtering
      if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
        where.categoryId = { [Op.in]: categoryIds };
      }
      
      // Price range filtering
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.basePrice = {};
        
        if (minPrice !== undefined) {
          where.basePrice[Op.gte] = minPrice;
        }
        
        if (maxPrice !== undefined) {
          where.basePrice[Op.lte] = maxPrice;
        }
      }
      
      // Tags filtering
      if (tags) {
        const tagList = Array.isArray(tags) ? tags : [tags];
        
        where[Op.and] = tagList.map(tag => ({
          tags: { [Op.like]: `%${tag}%` }
        }));
      }
      
      // Attribute filtering
      if (attributes && typeof attributes === 'object') {
        Object.entries(attributes).forEach(([key, value]) => {
          // Use raw SQL for JSON attribute filtering
          const attributePath = `$.${key}`;
          where[sequelize.literal(`JSON_EXTRACT(attributes, '${attributePath}')`)] = value;
        });
      }
      
      // Stock filtering
      if (inStock === true) {
        inventoryWhere.quantity = { [Op.gt]: 0 };
      } else if (inStock === false) {
        inventoryWhere.quantity = 0;
      }
      
      // Active/Featured filtering
      if (isActive !== undefined) {
        where.isActive = isActive === 'true' || isActive === true;
      }
      
      if (isFeatured !== undefined) {
        where.isFeatured = isFeatured === 'true' || isFeatured === true;
      }
      
      // Date range filtering
      if (createdAfter || createdBefore) {
        where.createdAt = {};
        
        if (createdAfter) {
          where.createdAt[Op.gte] = new Date(createdAfter);
        }
        
        if (createdBefore) {
          where.createdAt[Op.lte] = new Date(createdBefore);
        }
      }
      
      if (updatedAfter || updatedBefore) {
        where.updatedAt = {};
        
        if (updatedAfter) {
          where.updatedAt[Op.gte] = new Date(updatedAfter);
        }
        
        if (updatedBefore) {
          where.updatedAt[Op.lte] = new Date(updatedBefore);
        }
      }
      
      // Pagination
      const offset = (page - 1) * limit;
      
      // Sort order validation
      const validSortFields = ['name', 'basePrice', 'createdAt', 'updatedAt'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const orderBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      // Get products
      const { count, rows: products } = await Product.findAndCountAll({
        where,
        include: [
          {
            model: Category,
            attributes: ['id', 'name', 'parentId'],
            where: Object.keys(categoryWhere).length > 0 ? categoryWhere : undefined
          },
          {
            model: Variant,
            attributes: ['id', 'sku', 'name', 'price', 'options'],
            required: false
          },
          {
            model: Inventory,
            attributes: ['quantity', 'lowStockThreshold', 'reservedQuantity'],
            where: Object.keys(inventoryWhere).length > 0 ? inventoryWhere : undefined,
            required: Object.keys(inventoryWhere).length > 0
          }
        ],
        order: [[orderBy, order]],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        distinct: true
      });
      
      // Calculate total pages
      const totalPages = Math.ceil(count / limit);
      
      return {
        count,
        totalPages,
        currentPage: parseInt(page, 10),
        products
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get product suggestions based on user behavior and similar products
   * @param {number} productId - Base product ID
   * @param {number} limit - Number of suggestions to return
   * @returns {Promise<Array>} - Suggested products
   */
  async getProductSuggestions(productId, limit = 5) {
    try {
      // Get the base product
      const baseProduct = await Product.findByPk(productId);
      
      if (!baseProduct) {
        throw new Error('Product not found');
      }
      
      // Get similar products in the same category
      const similarProducts = await Product.findAll({
        where: {
          categoryId: baseProduct.categoryId,
          id: { [Op.ne]: productId },
          isActive: true
        },
        limit: parseInt(limit, 10),
        order: sequelize.random() // Random selection for variety
      });
      
      // If we don't have enough products, fetch some featured products too
      if (similarProducts.length < limit) {
        const remainingLimit = limit - similarProducts.length;
        
        const featuredProducts = await Product.findAll({
          where: {
            id: { [Op.ne]: productId },
            isFeatured: true,
            isActive: true,
            id: { [Op.notIn]: similarProducts.map(p => p.id) } // Exclude already selected products
          },
          limit: remainingLimit,
          order: sequelize.random()
        });
        
        return [...similarProducts, ...featuredProducts];
      }
      
      return similarProducts;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Search products by full-text search (requires MySQL fulltext indexes)
   * @param {string} query - Search query
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - Search results
   */
  async fullTextSearch(query, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      
      if (!query) {
        throw new Error('Search query is required');
      }
      
      // Pagination
      const offset = (page - 1) * limit;
      
      // Convert query to fulltext format
      const searchTerms = query.split(' ').filter(Boolean).map(term => `+${term}*`).join(' ');
      
      // Use raw SQL for fulltext search
      const [results, metadata] = await sequelize.query(`
        SELECT p.*, 
          MATCH(p.name, p.description, p.tags) AGAINST(:searchTerms IN BOOLEAN MODE) AS relevance 
        FROM products p
        WHERE MATCH(p.name, p.description, p.tags) AGAINST(:searchTerms IN BOOLEAN MODE)
        ORDER BY relevance DESC
        LIMIT :limit OFFSET :offset
      `, {
        replacements: {
          searchTerms,
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10)
        },
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get total count for pagination
      const [countResult] = await sequelize.query(`
        SELECT COUNT(*) as total
        FROM products p
        WHERE MATCH(p.name, p.description, p.tags) AGAINST(:searchTerms IN BOOLEAN MODE)
      `, {
        replacements: { searchTerms },
        type: sequelize.QueryTypes.SELECT
      });
      
      const count = parseInt(countResult.total, 10);
      const totalPages = Math.ceil(count / limit);
      
      // Load products with associations
      const productIds = results.map(result => result.id);
      
      if (productIds.length === 0) {
        return {
          count: 0,
          totalPages: 0,
          currentPage: parseInt(page, 10),
          products: []
        };
      }
      
      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds } },
        include: [
          {
            model: Category,
            attributes: ['id', 'name', 'parentId']
          },
          {
            model: Variant,
            attributes: ['id', 'sku', 'name', 'price', 'options'],
            required: false
          },
          {
            model: Inventory,
            attributes: ['quantity', 'lowStockThreshold', 'reservedQuantity'],
            required: false
          }
        ]
      });
      
      // Sort products by relevance (maintaining the order from the fulltext search)
      const sortedProducts = productIds.map(id => products.find(p => p.id === id)).filter(Boolean);
      
      return {
        count,
        totalPages,
        currentPage: parseInt(page, 10),
        products: sortedProducts
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get trending products based on inventory movements
   * @param {number} limit - Number of products to return
   * @returns {Promise<Array>} - Trending products
   */
  async getTrendingProducts(limit = 5) {
    try {
      // In a real application, this would use sales data
      // For this demo, we'll use a proxy based on inventory levels compared to threshold
      const products = await Product.findAll({
        attributes: [
          'id', 'name', 'description', 'sku', 'basePrice', 
          'discountType', 'discountValue', 'categoryId',
          'tags', 'imageUrls', 'isActive', 'isFeatured'
        ],
        include: [
          {
            model: Category,
            attributes: ['id', 'name']
          },
          {
            model: Inventory,
            attributes: [
              'quantity', 'lowStockThreshold',
              [sequelize.literal('(quantity / lowStockThreshold)'), 'stockRatio']
            ],
            where: {
              quantity: { [Op.gt]: 0 } // Only in-stock items
            }
          }
        ],
        where: {
          isActive: true
        },
        order: [[sequelize.col('Inventory.stockRatio'), 'ASC']],
        limit: parseInt(limit, 10)
      });
      
      return products;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SearchService();