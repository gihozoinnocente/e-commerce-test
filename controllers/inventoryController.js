const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Inventory = require('../models/inventory');
const Product = require('../models/product');
const Variant = require('../models/variant');

/**
 * Get inventory items with filtering and pagination
 * @route GET /api/inventory
 * @access Private
 */
exports.getAllInventory = async (req, res, next) => {
  try {
    const {
      sku,
      lowStock,
      location,
      page = 1,
      limit = 10,
      sortBy = 'quantity',
      sortOrder = 'ASC'
    } = req.query;
    
    // Build where clause
    const where = {};
    
    if (sku) {
      where.sku = { [Op.like]: `%${sku}%` };
    }
    
    if (location) {
      where.location = { [Op.like]: `%${location}%` };
    }
    
    if (lowStock === 'true') {
      where[Op.and] = [
        { quantity: { [Op.lte]: sequelize.col('lowStockThreshold') } },
        { quantity: { [Op.gt]: 0 } }
      ];
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    
    // Sort order validation
    const validSortFields = ['sku', 'quantity', 'lowStockThreshold', 'lastRestockDate'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const orderBy = validSortFields.includes(sortBy) ? sortBy : 'quantity';
    const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
    
    // Get inventory
    const { count, rows: inventory } = await Inventory.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'sku', 'basePrice', 'isActive']
        },
        {
          model: Variant,
          attributes: ['id', 'name', 'sku', 'price', 'isActive'],
          include: [
            {
              model: Product,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [[orderBy, order]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      distinct: true
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      success: true,
      count,
      totalPages,
      currentPage: parseInt(page, 10),
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory by ID
 * @route GET /api/inventory/:id
 * @access Private
 */
exports.getInventoryById = async (req, res, next) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'sku', 'basePrice', 'isActive']
        },
        {
          model: Variant,
          attributes: ['id', 'name', 'sku', 'price', 'isActive'],
          include: [
            {
              model: Product,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Inventory record not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update inventory
 * @route PUT /api/inventory/:id
 * @access Private
 */
exports.updateInventory = async (req, res, next) => {
  try {
    const {
      quantity,
      lowStockThreshold,
      reservedQuantity,
      location
    } = req.body;
    
    const inventory = await Inventory.findByPk(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Inventory record not found'
        }
      });
    }
    
    // Update inventory
    const updateData = {};
    
    if (quantity !== undefined) {
      updateData.quantity = quantity;
      // Update lastRestockDate if quantity is increasing
      if (quantity > inventory.quantity) {
        updateData.lastRestockDate = new Date();
      }
    }
    
    if (lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = lowStockThreshold;
    }
    
    if (reservedQuantity !== undefined) {
      updateData.reservedQuantity = reservedQuantity;
    }
    
    if (location !== undefined) {
      updateData.location = location;
    }
    
    await inventory.update(updateData);
    
    // Get the updated inventory with its relationships
    const updatedInventory = await Inventory.findByPk(inventory.id, {
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'sku', 'basePrice', 'isActive']
        },
        {
          model: Variant,
          attributes: ['id', 'name', 'sku', 'price', 'isActive'],
          include: [
            {
              model: Product,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: updatedInventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock items
 * @route GET /api/inventory/low-stock
 * @access Private
 */
exports.getLowStockItems = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Pagination
    const offset = (page - 1) * limit;
    
    // Get low stock items
    const { count, rows: inventory } = await Inventory.findAndCountAll({
      where: {
        [Op.and]: [
          { quantity: { [Op.lte]: sequelize.col('lowStockThreshold') } },
          { quantity: { [Op.gt]: 0 } }
        ]
      },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'sku', 'basePrice', 'isActive']
        },
        {
          model: Variant,
          attributes: ['id', 'name', 'sku', 'price', 'isActive'],
          include: [
            {
              model: Product,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['quantity', 'ASC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      distinct: true
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      success: true,
      count,
      totalPages,
      currentPage: parseInt(page, 10),
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get out of stock items
 * @route GET /api/inventory/out-of-stock
 * @access Private
 */
exports.getOutOfStockItems = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Pagination
    const offset = (page - 1) * limit;
    
    // Get out of stock items
    const { count, rows: inventory } = await Inventory.findAndCountAll({
      where: {
        quantity: 0
      },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'sku', 'basePrice', 'isActive']
        },
        {
          model: Variant,
          attributes: ['id', 'name', 'sku', 'price', 'isActive'],
          include: [
            {
              model: Product,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['lastRestockDate', 'ASC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      distinct: true
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      success: true,
      count,
      totalPages,
      currentPage: parseInt(page, 10),
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update inventory quantity (for batch updates)
 * @route PATCH /api/inventory/update-quantity
 * @access Private
 */
exports.updateInventoryQuantity = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: {
          message: 'Updates must be a non-empty array'
        }
      });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { id, quantity, notes } = update;
      
      if (!id || quantity === undefined) {
        continue;
      }
      
      const inventory = await Inventory.findByPk(id, { transaction });
      
      if (!inventory) {
        results.push({
          id,
          success: false,
          message: 'Inventory record not found'
        });
        continue;
      }
      
      const oldQuantity = inventory.quantity;
      
      await inventory.update({
        quantity,
        lastRestockDate: quantity > oldQuantity ? new Date() : inventory.lastRestockDate
      }, { transaction });
      
      results.push({
        id,
        success: true,
        oldQuantity,
        newQuantity: quantity,
        notes
      });
    }
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};