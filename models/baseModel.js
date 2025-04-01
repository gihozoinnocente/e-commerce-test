/**
 * Base Model Class
 * Provides common database operations for all models
 */
const db = require('../config/db');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

class BaseModel {
    /**
     * Create a new BaseModel
     * @param {string} tableName - Name of the database table
     */
    constructor(tableName) {
        this.tableName = tableName;
    }

    /**
     * Find a record by ID
     * @param {number} id - Record ID
     * @param {Object} connection - Optional database connection for transactions
     * @returns {Promise<Object>} Found record
     */
    async findById(id, connection = null) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        try {
            const conn = connection || await db.getConnection();
            const [rows] = await conn.query(query, [id]);
            if (!connection) conn.release();
            return rows;
        } catch (error) {
            logger.error(`Error in ${this.tableName}.findById:`, error);
            throw error;
        }
    }

    /**
     * Create a new record
     * @param {Object} data - Record data
     * @param {Object} connection - Optional database connection for transactions
     * @returns {Promise<number>} ID of created record
     */
    async create(data, connection = null) {
        const query = `INSERT INTO ${this.tableName} SET ?`;
        try {
            const conn = connection || await db.getConnection();
            const [result] = await conn.query(query, [data]);
            if (!connection) conn.release();
            return [result.insertId, result];
        } catch (error) {
            logger.error(`Error in ${this.tableName}.create:`, error);
            throw error;
        }
    }

    /**
     * Update a record
     * @param {number} id - Record ID
     * @param {Object} data - Update data
     * @param {Object} connection - Optional database connection for transactions
     * @returns {Promise<Object>} Update result
     */
    async update(id, data, connection = null) {
        const query = `UPDATE ${this.tableName} SET ? WHERE id = ?`;
        try {
            const conn = connection || await db.getConnection();
            const [result] = await conn.query(query, [data, id]);
            if (!connection) conn.release();
            return result;
        } catch (error) {
            logger.error(`Error in ${this.tableName}.update:`, error);
            throw error;
        }
    }

    /**
     * Delete a record
     * @param {number} id - Record ID
     * @param {Object} connection - Optional database connection for transactions
     * @returns {Promise<Object>} Delete result
     */
    async delete(id, connection = null) {
        const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
        try {
            const conn = connection || await db.getConnection();
            const [result] = await conn.query(query, [id]);
            if (!connection) conn.release();
            return result;
        } catch (error) {
            logger.error(`Error in ${this.tableName}.delete:`, error);
            throw error;
        }
    }

    /**
     * Find all records with pagination
     * @param {Object} options - Query options (limit, offset)
     * @param {Object} connection - Optional database connection for transactions
     * @returns {Promise<Array>} Found records
     */
    async findAll(options = {}, connection = null) {
        const { limit = 10, offset = 0 } = options;
        const query = `SELECT * FROM ${this.tableName} LIMIT ? OFFSET ?`;
        try {
            const conn = connection || await db.getConnection();
            const [rows] = await conn.query(query, [limit, offset]);
            if (!connection) conn.release();
            return rows;
        } catch (error) {
            logger.error(`Error in ${this.tableName}.findAll:`, error);
            throw error;
        }
    }

    /**
     * Count total records
     * @param {string} where - Optional WHERE clause
     * @param {Object} connection - Optional database connection for transactions
     * @returns {Promise<number>} Total count
     */
    async count(where = '', connection = null) {
        const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${where ? 'WHERE ' + where : ''}`;
        try {
            const conn = connection || await db.getConnection();
            const [rows] = await conn.query(query);
            if (!connection) conn.release();
            return rows[0].count;
        } catch (error) {
            logger.error(`Error in ${this.tableName}.count:`, error);
            throw error;
        }
    }

    /**
     * Find records by field value
     * @param {string} field - Field name
     * @param {any} value - Field value
     * @param {Object} options - Query options (limit, offset)
     * @param {Object} connection - Optional database connection for transactions
     * @returns {Promise<Array>} Found records
     */
    async findByField(field, value, options = {}, connection = null) {
        const { limit = 10, offset = 0 } = options;
        const query = `SELECT * FROM ${this.tableName} WHERE ${field} = ? LIMIT ? OFFSET ?`;
        try {
            const conn = connection || await db.getConnection();
            const [rows] = await conn.query(query, [value, limit, offset]);
            if (!connection) conn.release();
            return rows;
        } catch (error) {
            logger.error(`Error in ${this.tableName}.findByField:`, error);
            throw error;
        }
    }

    /**
     * Execute a custom query
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @param {Object} connection - Optional database connection for transactions
     * @returns {Promise<Array>} Query results
     */
    async query(query, params = [], connection = null) {
        try {
            const conn = connection || await db.getConnection();
            const [rows] = await conn.query(query, params);
            if (!connection) conn.release();
            return rows;
        } catch (error) {
            logger.error(`Error in ${this.tableName}.query:`, error);
            throw error;
        }
    }
}

module.exports = BaseModel;