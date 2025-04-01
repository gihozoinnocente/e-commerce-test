const express = require('express');
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const validate = require('../middleware/validator');

const router = express.Router();

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items
 *     description: Retrieve inventory items with filtering and pagination
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *         description: Filter by SKU
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter to only show low stock items
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by storage location
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
 *           enum: [sku, quantity, lowStockThreshold, lastRestockDate]
 *           default: quantity
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A paginated list of inventory items
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
 *                     $ref: '#/components/schemas/Inventory'
 */
router.get('/', inventoryController.getAllInventory);

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     summary: Get low stock items
 *     description: Retrieve inventory items with quantity below threshold
 *     tags: [Inventory]
 *     parameters:
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
 *         description: A paginated list of low stock items
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
 *                     $ref: '#/components/schemas/Inventory'
 */
router.get('/low-stock', inventoryController.getLowStockItems);

/**
 * @swagger
 * /api/inventory/out-of-stock:
 *   get:
 *     summary: Get out of stock items
 *     description: Retrieve inventory items with zero quantity
 *     tags: [Inventory]
 *     parameters:
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
 *         description: A paginated list of out of stock items
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
 *                     $ref: '#/components/schemas/Inventory'
 */
router.get('/out-of-stock', inventoryController.getOutOfStockItems);

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get inventory by ID
 *     description: Retrieve a specific inventory record by its ID
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory record ID
 *     responses:
 *       200:
 *         description: Inventory details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Inventory'
 *       404:
 *         description: Inventory record not found
 */
router.get('/:id', inventoryController.getInventoryById);

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update inventory
 *     description: Update an existing inventory record
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory record ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *               lowStockThreshold:
 *                 type: integer
 *                 minimum: 0
 *               reservedQuantity:
 *                 type: integer
 *                 minimum: 0
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Inventory'
 *       404:
 *         description: Inventory record not found
 *       400:
 *         description: Invalid input
 */
router.put(
  '/:id',
  [
    body('quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer'),
    body('lowStockThreshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Low stock threshold must be a non-negative integer'),
    body('reservedQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Reserved quantity must be a non-negative integer'),
    body('location')
      .optional()
      .isString()
      .withMessage('Location must be a string')
  ],
  validate,
  inventoryController.updateInventory
);

/**
 * @swagger
 * /api/inventory/update-quantity:
 *   patch:
 *     summary: Update inventory quantities
 *     description: Batch update inventory quantities for multiple items
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - quantity
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Inventory record ID
 *                     quantity:
 *                       type: integer
 *                       description: New quantity
 *                     notes:
 *                       type: string
 *                       description: Optional notes about the update
 *     responses:
 *       200:
 *         description: Inventory quantities updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       success:
 *                         type: boolean
 *                       oldQuantity:
 *                         type: integer
 *                       newQuantity:
 *                         type: integer
 *                       notes:
 *                         type: string
 *       400:
 *         description: Invalid input
 */
router.patch(
  '/update-quantity',
  [
    body('updates')
      .isArray()
      .withMessage('Updates must be an array'),
    body('updates.*.id')
      .isInt()
      .withMessage('Each update must have a valid inventory ID'),
    body('updates.*.quantity')
      .isInt({ min: 0 })
      .withMessage('Each update must have a valid quantity'),
    body('updates.*.notes')
      .optional()
      .isString()
      .withMessage('Notes must be a string')
  ],
  validate,
  inventoryController.updateInventoryQuantity
);

module.exports = router;