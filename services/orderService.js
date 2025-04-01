/**
 * Order Service
 * Handles business logic for order operations
 */
const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const Product = require('../models/product');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const db = require('../config/db');

class OrderService {
    /**
     * Create a new order
     * @param {Object} orderData - Basic order data (shipping_address, etc.)
     * @param {Array} items - Array of order items
     * @param {number} userId - ID of user creating the order
     */
    async createOrder(orderData, items, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Validate items exist and have sufficient stock
            for (const item of items) {
                const [product] = await Product.findById(item.product_id);
                if (!product) {
                    throw new ApiError(404, `Product ${item.product_id} not found`);
                }
                if (product.stock < item.quantity) {
                    throw new ApiError(400, `Insufficient stock for product ${product.name}`);
                }
                // Set the current price
                item.price = product.price;
            }

            // 2. Create the order
            const [orderId] = await Order.create({
                user_id: userId,
                shipping_address: orderData.shipping_address,
                status: 'pending',
                created_at: new Date()
            }, connection);

            // 3. Create order items
            for (const item of items) {
                await OrderItem.create({
                    order_id: orderId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price
                }, connection);

                // 4. Update product stock
                await Product.updateStock(
                    item.product_id, 
                    -item.quantity,
                    connection
                );
            }

            await connection.commit();

            // 5. Return the created order with items
            const order = await this.getOrderById(orderId);
            return order;

        } catch (error) {
            await connection.rollback();
            logger.error('Error in createOrder:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get an order by ID
     * @param {number} orderId - Order ID to fetch
     */
    async getOrderById(orderId) {
        try {
            // Get the order
            const [order] = await Order.findById(orderId);
            if (!order) {
                throw new ApiError(404, 'Order not found');
            }

            // Get the order items
            const items = await OrderItem.findByOrderId(orderId);
            order.items = items;

            return order;
        } catch (error) {
            logger.error('Error in getOrderById:', error);
            throw error;
        }
    }

    /**
     * Get orders for a user
     * @param {number} userId - User ID to get orders for
     * @param {Object} options - Pagination options
     */
    async getUserOrders(userId, options = {}) {
        try {
            const orders = await Order.findByUser(userId, options);
            return orders;
        } catch (error) {
            logger.error('Error in getUserOrders:', error);
            throw error;
        }
    }

    /**
     * Cancel an order
     * @param {number} orderId - Order ID to cancel
     * @param {number} userId - User ID requesting cancellation
     */
    async cancelOrder(orderId, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Get the order
            const [order] = await Order.findById(orderId);
            if (!order) {
                throw new ApiError(404, 'Order not found');
            }

            // 2. Verify ownership
            if (order.user_id !== userId) {
                throw new ApiError(403, 'Not authorized to cancel this order');
            }

            // 3. Check if order can be cancelled
            if (order.status !== 'pending') {
                throw new ApiError(400, 'Only pending orders can be cancelled');
            }

            // 4. Get order items to restore stock
            const items = await OrderItem.findByOrderId(orderId);

            // 5. Update order status
            await Order.update(orderId, { status: 'cancelled' }, connection);

            // 6. Restore product stock
            for (const item of items) {
                await Product.updateStock(
                    item.product_id,
                    item.quantity,
                    connection
                );
            }

            await connection.commit();
            return await this.getOrderById(orderId);

        } catch (error) {
            await connection.rollback();
            logger.error('Error in cancelOrder:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update order status
     * @param {number} orderId - Order ID to update
     * @param {string} newStatus - New status to set
     * @param {number} userId - User ID making the update
     */
    async updateOrderStatus(orderId, newStatus, userId) {
        try {
            // 1. Get the order
            const [order] = await Order.findById(orderId);
            if (!order) {
                throw new ApiError(404, 'Order not found');
            }

            // 2. Validate status transition
            const validTransitions = {
                'pending': ['processing', 'cancelled'],
                'processing': ['shipped', 'cancelled'],
                'shipped': ['delivered'],
                'delivered': [],
                'cancelled': []
            };

            if (!validTransitions[order.status]?.includes(newStatus)) {
                throw new ApiError(400, `Cannot transition from ${order.status} to ${newStatus}`);
            }

            // 3. Update the status
            await Order.update(orderId, { status: newStatus });
            return await this.getOrderById(orderId);

        } catch (error) {
            logger.error('Error in updateOrderStatus:', error);
            throw error;
        }
    }

    /**
     * Get orders for a seller
     * @param {number} sellerId - Seller ID to get orders for
     * @param {Object} options - Pagination options
     */
    async getSellerOrders(sellerId, options = {}) {
        try {
            const orders = await Order.findBySeller(sellerId, options);
            return orders;
        } catch (error) {
            logger.error('Error in getSellerOrders:', error);
            throw error;
        }
    }
}

module.exports = new OrderService();
