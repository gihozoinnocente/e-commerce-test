const express = require('express');
const reportController = require('../controllers/reportController');

const router = express.Router();

/**
 * @swagger
 * /api/reports/inventory-status:
 *   get:
 *     summary: Get inventory status report
 *     description: Retrieve a summary report of inventory status
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Inventory status report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         outOfStock:
 *                           type: integer
 *                         lowStock:
 *                           type: integer
 *                         healthyStock:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         totalStock:
 *                           type: integer
 *                     criticalStock:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/inventory-status', reportController.getInventoryStatusReport);

/**
 * @swagger
 * /api/reports/category-distribution:
 *   get:
 *     summary: Get product category distribution report
 *     description: Retrieve a report showing the distribution of products across categories
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Category distribution report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                     distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           categoryId:
 *                             type: integer
 *                           categoryName:
 *                             type: string
 *                           productCount:
 *                             type: integer
 *                           percentage:
 *                             type: number
 */
router.get('/category-distribution', reportController.getCategoryDistributionReport);

/**
 * @swagger
 * /api/reports/low-stock-alert:
 *   get:
 *     summary: Get low stock alert report
 *     description: Retrieve a report of items with low or out of stock status grouped by category
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Low stock alert report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     categorySummary:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           categoryId:
 *                             type: integer
 *                           categoryName:
 *                             type: string
 *                           itemCount:
 *                             type: integer
 *                           outOfStockCount:
 *                             type: integer
 *                           lowStockCount:
 *                             type: integer
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Inventory'
 */
router.get('/low-stock-alert', reportController.getLowStockAlertReport);

module.exports = router;