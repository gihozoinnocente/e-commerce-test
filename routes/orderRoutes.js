/**
 * Order Routes
 * Defines API endpoints for order operations
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */
const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validation');
const { body, param } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - product_id
 *         - quantity
 *       properties:
 *         product_id:
 *           type: integer
 *           description: ID of the product being ordered
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the product
 *         price:
 *           type: number
 *           description: Price of the product at time of order
 *     Order:
 *       type: object
 *       required:
 *         - shipping_address
 *         - payment_method
 *         - items
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated order ID
 *         user_id:
 *           type: integer
 *           description: ID of the user who placed the order
 *         shipping_address:
 *           type: string
 *           description: Delivery address for the order
 *         payment_method:
 *           type: string
 *           description: Payment method used
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *           description: Current status of the order
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         total_amount:
 *           type: number
 *           description: Total order amount
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 */

// Create order validation
const createOrderValidation = [
    body('shipping_address').notEmpty().withMessage('Shipping address is required'),
    body('payment_method').notEmpty().withMessage('Payment method is required'),
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.product_id').isInt().withMessage('Product ID must be an integer'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// Cancel order validation
const cancelOrderValidation = [
    param('id').isInt().withMessage('Order ID must be an integer'),
    body('reason').optional().isString().withMessage('Reason must be a string')
];

// Update status validation
const updateStatusValidation = [
    param('id').isInt().withMessage('Order ID must be an integer'),
    body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('Invalid order status')
];

// Ship order validation
const shipOrderValidation = [
    param('id').isInt().withMessage('Order ID must be an integer'),
    body('trackingNumber').notEmpty().withMessage('Tracking number is required')
];

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shipping_address
 *               - payment_method
 *               - items
 *             properties:
 *               shipping_address:
 *                 type: string
 *               payment_method:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderItem'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth.protect, auth.restrictTo('customer', 'admin'), createOrderValidation, validate, OrderController.createOrder);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
router.get('/my-orders', auth.protect, OrderController.getUserOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/:id', auth.protect, param('id').isInt(), validate, OrderController.getOrderDetails);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/:id/cancel', auth.protect, cancelOrderValidation, validate, OrderController.cancelOrder);

/**
 * @swagger
 * /api/orders/seller:
 *   get:
 *     summary: Get seller's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
router.get('/seller', auth.protect, auth.restrictTo('seller'), OrderController.getSellerOrders);

/**
 * @swagger
 * /api/orders/seller/dashboard:
 *   get:
 *     summary: Get seller's dashboard data
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller's dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_orders:
 *                   type: integer
 *                 total_revenue:
 *                   type: number
 *                 recent_orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
router.get('/seller/dashboard', auth.protect, auth.restrictTo('seller'), OrderController.getSellerDashboardData);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.patch('/:id/status', auth.protect, auth.restrictTo('seller', 'admin'), updateStatusValidation, validate, OrderController.updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/ship:
 *   post:
 *     summary: Ship an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackingNumber
 *             properties:
 *               trackingNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order shipped successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/:id/ship', auth.protect, auth.restrictTo('seller', 'admin'), shipOrderValidation, validate, OrderController.shipOrder);

/**
 * @swagger
 * /api/orders/{id}/deliver:
 *   post:
 *     summary: Deliver an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order delivered successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/:id/deliver', auth.protect, auth.restrictTo('seller', 'admin'), param('id').isInt(), validate, OrderController.deliverOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth.protect, auth.restrictTo('admin'), OrderController.getAllOrders);

/**
 * @swagger
 * /api/orders/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_orders:
 *                   type: integer
 *                 total_revenue:
 *                   type: number
 *                 recent_orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard/stats', auth.protect, auth.restrictTo('admin'), OrderController.getDashboardData);

module.exports = router;