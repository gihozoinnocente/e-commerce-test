/**
 * OrderItem Model
 * Handles database operations for order items
 */
const BaseModel = require('./BaseModel');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const db = require('../config/db');

/**
 * OrderItem model class
 * Demonstrates inheritance from BaseModel
 */
class OrderItem extends BaseModel {
    /**
     * Create a new OrderItem model instance
     */
    constructor() {
        super('order_items'); // Pass the table name to BaseModel
    }

    /**
     * Find order items for a specific order
     * @param {number} orderId - Order ID
     * @returns {Promise<Array>} Array of order items
     */
    async findByOrderId(orderId) {
        try {
            const sql = `
                SELECT oi.*, p.name as product_name, p.image_url, p.seller_id
                FROM ${this.tableName} oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
                ORDER BY oi.id ASC
            `;
            
            return await db.query(sql, [orderId]);
        } catch (error) {
            logger.error(`Error in OrderItem.findByOrderId: ${error.message}`);
            throw error;
        }
    }

    /**
     * Find order items for a specific seller's products
     * @param {number} orderId - Order ID
     * @param {number} sellerId - Seller user ID
     * @returns {Promise<Array>} Array of order items
     */
    async findByOrderAndSeller(orderId, sellerId) {
        try {
            const sql = `
                SELECT oi.*, p.name as product_name, p.image_url
                FROM ${this.tableName} oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ? AND p.seller_id = ?
                ORDER BY oi.id ASC
            `;
            
            return await db.query(sql, [orderId, sellerId]);
        } catch (error) {
            logger.error(`Error in OrderItem.findByOrderAndSeller: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get most popular products
     * @param {number} limit - Number of products to return
     * @returns {Promise<Array>} Array of popular products with quantities
     */
    async getPopularProducts(limit = 10) {
        try {
            const sql = `
                SELECT 
                    oi.product_id,
                    p.name as product_name,
                    p.price,
                    p.image_url,
                    p.seller_id,
                    SUM(oi.quantity) as total_quantity,
                    COUNT(DISTINCT oi.order_id) as order_count
                FROM ${this.tableName} oi
                JOIN products p ON oi.product_id = p.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.status != 'cancelled'
                GROUP BY oi.product_id
                ORDER BY total_quantity DESC
                LIMIT ? 
            `;
            
            return await db.query(sql, [limit]);
        } catch (error) {
            logger.error(`Error in OrderItem.getPopularProducts: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get popular products for a specific seller
     * @param {number} sellerId - Seller user ID
     * @param {number} limit - Number of products to return
     * @returns {Promise<Array>} Array of popular products with quantities
     */
    async getSellerPopularProducts(sellerId, limit = 10) {
        try {
            const sql = `
                SELECT 
                    oi.product_id,
                    p.name as product_name,
                    p.price,
                    p.image_url,
                    SUM(oi.quantity) as total_quantity,
                    COUNT(DISTINCT oi.order_id) as order_count
                FROM ${this.tableName} oi
                JOIN products p ON oi.product_id = p.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.status != 'cancelled' AND p.seller_id = ?
                GROUP BY oi.product_id
                ORDER BY total_quantity DESC
                LIMIT ?
            `;
            
            return await db.query(sql, [sellerId, limit]);
        } catch (error) {
            logger.error(`Error in OrderItem.getSellerPopularProducts: ${error.message}`);
            throw error;
        }
    }

    /**
     * Calculate total quantity sold for a product
     * @param {number} productId - Product ID
     * @returns {Promise<number>} Total quantity sold
     */
    async getTotalQuantitySold(productId) {
        try {
            const sql = `
                SELECT SUM(oi.quantity) as total_quantity
                FROM ${this.tableName} oi
                JOIN orders o ON oi.order_id = o.id
                WHERE oi.product_id = ? AND o.status != 'cancelled'
            `;
            
            const result = await db.query(sql, [productId]);
            return result[0].total_quantity || 0;
        } catch (error) {
            logger.error(`Error in OrderItem.getTotalQuantitySold: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get revenue by product
     * @param {string} period - Time period ('day', 'week', 'month', 'all')
     * @param {number} limit - Number of products to return
     * @returns {Promise<Array>} Array of products with revenue
     */
    async getRevenueByProduct(period = 'month', limit = 10) {
        try {
            let timeFilter;
            
            switch (period) {
                case 'day':
                    timeFilter = 'o.created_at >= CURDATE()';
                    break;
                case 'week':
                    timeFilter = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case 'month':
                    timeFilter = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                    break;
                case 'all':
                    timeFilter = '1=1'; // No time filter
                    break;
                default:
                    timeFilter = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            }
            
            const sql = `
                SELECT 
                    oi.product_id,
                    p.name as product_name,
                    p.category,
                    p.seller_id,
                    SUM(oi.subtotal) as revenue,
                    SUM(oi.quantity) as quantity_sold
                FROM ${this.tableName} oi
                JOIN products p ON oi.product_id = p.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.status != 'cancelled' AND ${timeFilter}
                GROUP BY oi.product_id
                ORDER BY revenue DESC
                LIMIT ?
            `;
            
            return await db.query(sql, [limit]);
        } catch (error) {
            logger.error(`Error in OrderItem.getRevenueByProduct: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get revenue by product for a specific seller
     * @param {number} sellerId - Seller user ID
     * @param {string} period - Time period ('day', 'week', 'month', 'all')
     * @param {number} limit - Number of products to return
     * @returns {Promise<Array>} Array of products with revenue
     */
    async getSellerRevenueByProduct(sellerId, period = 'month', limit = 10) {
        try {
            let timeFilter;
            
            switch (period) {
                case 'day':
                    timeFilter = 'o.created_at >= CURDATE()';
                    break;
                case 'week':
                    timeFilter = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case 'month':
                    timeFilter = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                    break;
                case 'all':
                    timeFilter = '1=1'; // No time filter
                    break;
                default:
                    timeFilter = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            }
            
            const sql = `
                SELECT 
                    oi.product_id,
                    p.name as product_name,
                    p.category,
                    SUM(oi.subtotal) as revenue,
                    SUM(oi.quantity) as quantity_sold
                FROM ${this.tableName} oi
                JOIN products p ON oi.product_id = p.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.status != 'cancelled' AND ${timeFilter} AND p.seller_id = ?
                GROUP BY oi.product_id
                ORDER BY revenue DESC
                LIMIT ?
            `;
            
            return await db.query(sql, [sellerId, limit]);
        } catch (error) {
            logger.error(`Error in OrderItem.getSellerRevenueByProduct: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new OrderItem();