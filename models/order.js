/**
 * Order Model
 * Handles database operations for orders
 */
const BaseModel = require('./baseModel');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const db = require('../config/db');
const OrderItem = require('./OrderItem');

/**
 * Order model class
 * Demonstrates inheritance from BaseModel
 */
class Order extends BaseModel {
    /**
     * Create a new Order model instance
     */
    constructor() {
        super('orders'); // Pass the table name to BaseModel
    }

    /**
     * Find orders by user ID
     * @param {number} userId - User ID
     * @param {Object} options - Query options (limit, offset)
     * @returns {Promise<Array>} Array of orders
     */
    async findByUser(userId, { limit = 10, offset = 0 } = {}) {
        try {
            const sql = `
                SELECT o.*, 
                    COUNT(oi.id) as total_items,
                    SUM(oi.quantity * oi.price) as total_amount
                FROM ${this.tableName} o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.user_id = ?
                GROUP BY o.id
                ORDER BY o.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            return await db.query(sql, [userId, limit, offset]);
        } catch (error) {
            logger.error(`Error in Order.findByUser: ${error.message}`);
            throw error;
        }
    }

    /**
     * Find orders for a seller's products
     * @param {number} sellerId - Seller user ID
     * @param {Object} options - Query options (limit, offset)
     * @returns {Promise<Array>} Array of orders
     */
    async findBySeller(sellerId, { limit = 10, offset = 0 } = {}) {
        try {
            const sql = `
                SELECT DISTINCT o.*,
                    COUNT(DISTINCT oi.id) as total_items,
                    SUM(oi.quantity * oi.price) as total_amount
                FROM ${this.tableName} o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN products p ON oi.product_id = p.id
                WHERE p.seller_id = ?
                GROUP BY o.id
                ORDER BY o.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            return await db.query(sql, [sellerId, limit, offset]);
        } catch (error) {
            logger.error(`Error in Order.findBySeller: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get order details with items
     * @param {number} orderId - Order ID
     * @returns {Promise<Object>} Order details with items
     */
    async getOrderDetails(orderId) {
        try {
            // Get order details
            const [order] = await this.findById(orderId);
            if (!order) {
                return null;
            }

            // Get order items
            const items = await OrderItem.findByOrderId(orderId);
            order.items = items;

            return order;
        } catch (error) {
            logger.error(`Error in Order.getOrderDetails: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a new order with items
     * @param {Object} orderData - Order data
     * @param {Array} items - Order items
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Created order with items
     */
    async createWithItems(orderData, items, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Create order
            const order = {
                ...orderData,
                user_id: userId,
                status: 'pending',
                created_at: new Date()
            };
            const [orderId] = await this.create(order, connection);

            // Create order items
            for (const item of items) {
                await OrderItem.create({
                    order_id: orderId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price
                }, connection);
            }

            await connection.commit();
            return await this.getOrderDetails(orderId);
        } catch (error) {
            await connection.rollback();
            logger.error(`Error in Order.createWithItems: ${error.message}`);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update order status
     * @param {number} orderId - Order ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Updated order
     */
    async updateStatus(orderId, status) {
        try {
            await this.update(orderId, { status });
            return await this.getOrderDetails(orderId);
        } catch (error) {
            logger.error(`Error in Order.updateStatus: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get dashboard statistics
     * @param {number} userId - User ID (optional, for seller stats)
     * @returns {Promise<Object>} Dashboard statistics
     */
    async getDashboardStats(userId = null) {
        try {
            let sql;
            let params = [];

            if (userId) {
                // Seller stats
                sql = `
                    SELECT 
                        COUNT(DISTINCT o.id) as total_orders,
                        SUM(oi.quantity * oi.price) as total_revenue,
                        COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders,
                        COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) as completed_orders
                    FROM ${this.tableName} o
                    JOIN order_items oi ON o.id = oi.order_id
                    JOIN products p ON oi.product_id = p.id
                    WHERE p.seller_id = ?
                `;
                params = [userId];
            } else {
                // Admin stats
                sql = `
                    SELECT 
                        COUNT(DISTINCT o.id) as total_orders,
                        SUM(oi.quantity * oi.price) as total_revenue,
                        COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders,
                        COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) as completed_orders
                    FROM ${this.tableName} o
                    JOIN order_items oi ON o.id = oi.order_id
                `;
            }

            const [stats] = await db.query(sql, params);
            return stats;
        } catch (error) {
            logger.error(`Error in Order.getDashboardStats: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new Order();