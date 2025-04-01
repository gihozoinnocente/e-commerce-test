const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('../models/product');
const Category = require('../models/category');
const Inventory = require('../models/inventory');

/**
 * Get inventory status report
 * @route GET /api/reports/inventory-status
 * @access Private
 */
exports.getInventoryStatusReport = async (req, res, next) => {
  try {
    // Get counts for different inventory statuses
    const outOfStock = await Inventory.count({
      where: { quantity: 0 }
    });
    
    const lowStock = await Inventory.count({
      where: {
        [Op.and]: [
          { quantity: { [Op.lte]: sequelize.col('lowStockThreshold') } },
          { quantity: { [Op.gt]: 0 } }
        ]
      }
    });
    
    const healthyStock = await Inventory.count({
      where: {
        quantity: { [Op.gt]: sequelize.col('lowStockThreshold') }
      }
    });
    
    const totalStock = await Inventory.sum('quantity');
    
    // Get top 10 products with lowest stock relative to threshold
    const criticalStock = await Inventory.findAll({
      where: {
        quantity: { [Op.gt]: 0 }
      },
      attributes: [
        'id',
        'sku',
        'quantity',
        'lowStockThreshold',
        [sequelize.literal('(quantity / lowStockThreshold) * 100'), 'stockPercentage']
      ],
      include: [
        {
          model: Product,
          attributes: ['id', 'name']
        },
        {
          model: Variant,
          attributes: ['id', 'name'],
          include: [
            {
              model: Product,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [
        [sequelize.literal('stockPercentage'), 'ASC']
      ],
      limit: 10
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          outOfStock,
          lowStock,
          healthyStock,
          totalItems: outOfStock + lowStock + healthyStock,
          totalStock
        },
        criticalStock
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product category distribution report
 * @route GET /api/reports/category-distribution
 * @access Private
 */
exports.getCategoryDistributionReport = async (req, res, next) => {
  try {
    // Get product count by category
    const categoryDistribution = await Product.findAll({
      attributes: [
        'categoryId',
        [sequelize.fn('COUNT', sequelize.col('Product.id')), 'productCount']
      ],
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        }
      ],
      group: ['categoryId', 'Category.id', 'Category.name'],
      order: [
        [sequelize.literal('productCount'), 'DESC']
      ]
    });
    
    // Calculate percentages
    const totalProducts = await Product.count();
    
    const distributionWithPercentage = categoryDistribution.map(item => ({
      categoryId: item.categoryId,
      categoryName: item.Category.name,
      productCount: item.dataValues.productCount,
      percentage: (item.dataValues.productCount / totalProducts) * 100
    }));
    
    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        distribution: distributionWithPercentage
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock alert report
 * @route GET /api/reports/low-stock-alert
 * @access Private
 */
exports.getLowStockAlertReport = async (req, res, next) => {
  try {
    // Get low stock items grouped by category
    const query = `
      SELECT 
        c.id AS categoryId,
        c.name AS categoryName,
        COUNT(i.id) AS itemCount,
        SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END) AS outOfStockCount,
        SUM(CASE WHEN i.quantity > 0 AND i.quantity <= i.lowStockThreshold THEN 1 ELSE 0 END) AS lowStockCount
      FROM 
        inventory i
      LEFT JOIN 
        products p ON i.productId = p.id
      LEFT JOIN 
        variants v ON i.variantId = v.id
      LEFT JOIN 
        products p2 ON v.productId = p2.id
      LEFT JOIN 
        categories c ON p.categoryId = c.id OR p2.categoryId = c.id
      WHERE 
        i.quantity <= i.lowStockThreshold
      GROUP BY 
        c.id, c.name
      ORDER BY 
        itemCount DESC
    `;
    
    const lowStockByCategory = await sequelize.query(query, {
      type: QueryTypes.SELECT
    });
    
    // Get details of low stock items
    const lowStockItems = await Inventory.findAll({
      where: {
        quantity: { [Op.lte]: sequelize.col('lowStockThreshold') }
      },
      attributes: [
        'id',
        'sku',
        'quantity',
        'lowStockThreshold',
        'reservedQuantity',
        'lastRestockDate'
      ],
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'categoryId'],
          include: [
            {
              model: Category,
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Variant,
          attributes: ['id', 'name', 'productId'],
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'categoryId'],
              include: [
                {
                  model: Category,
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        }
      ],
      order: [
        ['quantity', 'ASC']
      ]
    });
    
    res.status(200).json({
      success: true,
      data: {
        categorySummary: lowStockByCategory,
        items: lowStockItems
      }
    });
  } catch (error) {
    next(error);
  }
};