/**
 * Order Controller
 * Handles HTTP requests related to orders
 */
const OrderService = require('../services/OrderService');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Order controller class
 * Manages order-related endpoints
 */
class OrderController {
    /**
     * Create a new order
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async createOrder(req, res, next) {
        try {
            const { items, ...orderData } = req.body;
            const userId = req.user.id;

            const order = await OrderService.createOrder(orderData, items, userId);

            res.status(201).json({
                status: 'success',
                message: 'Order created successfully',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user's orders
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getUserOrders(req, res, next) {
        try {
            const userId = req.user.id;
            const { limit = 10, offset = 0 } = req.query;

            const orders = await OrderService.getUserOrders(userId, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                status: 'success',
                data: orders
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get order details
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getOrderDetails(req, res, next) {
        try {
            const orderId = parseInt(req.params.id);
            const userId = req.user.id;

            const order = await OrderService.getOrderDetails(orderId, userId);

            res.json({
                status: 'success',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cancel order
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async cancelOrder(req, res, next) {
        try {
            const orderId = parseInt(req.params.id);
            const userId = req.user.id;
            const { reason } = req.body;

            const order = await OrderService.cancelOrder(orderId, userId, reason);

            res.json({
                status: 'success',
                message: 'Order cancelled successfully',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get seller's orders
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getSellerOrders(req, res, next) {
        try {
            const sellerId = req.user.id;
            const { limit = 10, offset = 0 } = req.query;

            const orders = await OrderService.getSellerOrders(sellerId, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                status: 'success',
                data: orders
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update order status
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async updateOrderStatus(req, res, next) {
        try {
            const orderId = parseInt(req.params.id);
            const sellerId = req.user.id;
            const { status } = req.body;

            const order = await OrderService.updateOrderStatus(orderId, status, sellerId);

            res.json({
                status: 'success',
                message: 'Order status updated successfully',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get seller dashboard data
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getSellerDashboardData(req, res, next) {
        try {
            const sellerId = req.user.id;
            const stats = await OrderService.getDashboardStats(sellerId);

            res.json({
                status: 'success',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get admin dashboard data
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getAdminDashboardData(req, res, next) {
        try {
            const stats = await OrderService.getDashboardStats();

            res.json({
                status: 'success',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all orders (admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getAllOrders(req, res, next) {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                throw ApiError.forbidden('Not authorized');
            }

            const {
                limit = 10,
                offset = 0,
                status = null,
                sort = 'created_at',
                order = 'DESC'
            } = req.query;

            let orders;
            const options = {
                limit: parseInt(limit),
                offset: parseInt(offset),
                orderBy: `${sort} ${order}`
            };

            if (status) {
                orders = await OrderService.findByStatus(status, options);
            } else {
                orders = await OrderService.findAll(options);
            }

            const total = await OrderService.count(status ? `status = '${status}'` : '');

            res.status(200).json({
                status: 'success',
                count: orders.length,
                total,
                data: orders
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Ship an order (admin or seller)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async shipOrder(req, res, next) {
        try {
            // Admin can ship any order, seller can only ship orders with their products
            if (req.user.role !== 'admin' && req.user.role !== 'seller') {
                throw ApiError.forbidden('Not authorized');
            }

            const orderId = parseInt(req.params.id);
            const { trackingNumber } = req.body;

            if (!trackingNumber) {
                throw ApiError.badRequest('Tracking number is required');
            }

            // For sellers, check if order contains their products
            if (req.user.role === 'seller') {
                const orderDetails = await OrderService.getOrderDetails(orderId);
                if (!orderDetails) {
                    throw ApiError.notFound('Order not found');
                }

                const hasSellerProducts = orderDetails.items.some(item => item.seller_id === req.user.id);
                if (!hasSellerProducts) {
                    throw ApiError.forbidden('Not authorized to ship this order');
                }
            }

            const shipped = await OrderService.shipOrder(orderId, trackingNumber);

            res.status(200).json({
                status: 'success',
                message: 'Order shipped successfully',
                data: { shipped, trackingNumber }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
       * Mark order as delivered (admin or seller)
       * @param {Object} req - Express request object
       * @param {Object} res - Express response object
       * @param {Function} next - Express next middleware function
       */
    async deliverOrder(req, res, next) {
        try {
            // Admin can deliver any order, seller can only deliver orders with their products
            if (req.user.role !== 'admin' && req.user.role !== 'seller') {
                throw ApiError.forbidden('Not authorized');
            }

            const orderId = parseInt(req.params.id);

            // For sellers, check if order contains their products
            if (req.user.role === 'seller') {
                const orderDetails = await OrderService.getOrderDetails(orderId);
                if (!orderDetails) {
                    throw ApiError.notFound('Order not found');
                }

                const hasSellerProducts = orderDetails.items.some(item => item.seller_id === req.user.id);
                if (!hasSellerProducts) {
                    throw ApiError.forbidden('Not authorized to deliver this order');
                }
            }

            const delivered = await OrderService.deliverOrder(orderId);

            res.status(200).json({
                status: 'success',
                message: 'Order marked as delivered',
                data: { delivered }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OrderController();
