const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Inventory:
 *       type: object
 *       required:
 *         - quantity
 *       properties:
 *         id:
 *           type: integer
 *           description: The inventory record ID
 *         productId:
 *           type: integer
 *           description: ID of the product (null if variant is specified)
 *         variantId:
 *           type: integer
 *           description: ID of the variant (null if product is specified)
 *         quantity:
 *           type: integer
 *           description: Current stock quantity
 *         lowStockThreshold:
 *           type: integer
 *           description: Threshold for low stock alerts
 *         sku:
 *           type: string
 *           description: SKU of the product or variant
 *         reservedQuantity:
 *           type: integer
 *           description: Quantity reserved for pending orders
 *         location:
 *           type: string
 *           description: Storage location identifier
 *         lastRestockDate:
 *           type: string
 *           format: date-time
 *           description: Last restock date
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'products',  // Use lowercase table name to match actual table
      key: 'id'
    }
  },
  variantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'variants',  // Use lowercase table name to match actual table
      key: 'id'
    }
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: {
        msg: 'Quantity must be an integer'
      },
      min: {
        args: [0],
        msg: 'Quantity must be greater than or equal to 0'
      }
    }
  },
  lowStockThreshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      isInt: {
        msg: 'Low stock threshold must be an integer'
      },
      min: {
        args: [0],
        msg: 'Low stock threshold must be greater than or equal to 0'
      }
    }
  },
  reservedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: {
        msg: 'Reserved quantity must be an integer'
      },
      min: {
        args: [0],
        msg: 'Reserved quantity must be greater than or equal to 0'
      }
    }
  },
  location: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  lastRestockDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'inventory',
  timestamps: true,
  indexes: [
    {
      fields: ['productId']
    },
    {
      fields: ['variantId']
    },
    {
      unique: true,
      fields: ['sku']
    }
  ],
  validate: {
    eitherProductOrVariant() {
      if ((this.productId === null && this.variantId === null) || 
          (this.productId !== null && this.variantId !== null)) {
        throw new Error('Either productId or variantId must be specified, but not both');
      }
    }
  }
});

module.exports = Inventory;