const express = require('express');
const searchController = require('../controllers/searchController');
const { basicLimiter } = require('../middleware/rateLimit');
const cacheService = require('../services/cacheService');

const router = express.Router();

/**
 * @swagger
 * /api/search/products:
 *   get:
 *     summary: Advanced product search
 *     description: Search products with advanced filtering options
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for name, description, or tags
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: categoryIds
 *         schema:
 *           type: string
 *         description: Filter by multiple category IDs (comma-separated)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: attributes
 *         schema:
 *           type: string
 *         description: Filter by attributes (JSON string)
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (after)
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (before)
 *       - in: query
 *         name: updatedAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by update date (after)
 *       - in: query
 *         name: updatedBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by update date (before)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, basePrice, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get(
  '/products',
  basicLimiter,
  cacheService.middleware(60), // Cache for 1 minute
  searchController.advancedSearch
);

/**
 * @swagger
 * /api/search/fulltext:
 *   get:
 *     summary: Full-text product search
 *     description: Search products using MySQL's full-text search capabilities
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Full-text search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Missing search query
 */
router.get(
  '/fulltext',
  basicLimiter,
  searchController.fullTextSearch
);

/**
 * @swagger
 * /api/search/suggestions/{productId}:
 *   get:
 *     summary: Get product suggestions
 *     description: Get product suggestions based on a specific product
 *     tags: [Search]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of suggestions to return
 *     responses:
 *       200:
 *         description: Product suggestions
 */
router.get(
  '/suggestions/:productId',
  cacheService.middleware(3600), // Cache for 1 hour
  searchController.getProductSuggestions
);

/**
 * @swagger
 * /api/search/trending:
 *   get:
 *     summary: Get trending products
 *     description: Get the currently trending products
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of products to return
 *     responses:
 *       200:
 *         description: Trending products
 */
router.get(
  '/trending',
  cacheService.middleware(1800), // Cache for 30 minutes
  searchController.getTrendingProducts
);

module.exports = router;