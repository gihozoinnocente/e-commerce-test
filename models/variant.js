const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Variant:
 *       type: object
 *       required:
 *         - productId
 *         - sku
 *         - price
 *       properties:
 *         id:
 *           type: integer
 *           description: The variant ID
 *         productId:
 *           type: integer
 *           description: ID of the parent product
 *         sku:
 *           type: string
 *           description: Stock keeping unit (unique identifier)
 *         name:
 *           type: string
 *           description: Variant name
 *         price:
 *           type: number
 *           format: float
 *           description: Price of this variant
 *         discountType:
 *           type: string
 *           enum: [none, percentage, fixed]
 *           description: Type of discount applied
 *         discountValue:
 *           type: number
 *           format: float
 *           description: Value of the discount
 *         options:
 *           type: string
 *           description: JSON object of variant options (color, size, etc)
 *         imageUrls:
 *           type: string
 *           description: JSON array of image URLs
 *         isActive:
 *           type: boolean
 *           description: Whether the variant is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
const Variant = sequelize.define('Variant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',  // Use lowercase table name to match actual table
      key: 'id'
    }
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      msg: 'SKU must be unique'
    },
    validate: {
      notEmpty: {
        msg: 'SKU cannot be empty'
      }
    }
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Price must be a valid number'
      },
      min: {
        args: [0],
        msg: 'Price must be greater than or equal to 0'
      }
    }
  },
  discountType: {
    type: DataTypes.ENUM('none', 'percentage', 'fixed'),
    allowNull: false,
    defaultValue: 'none'
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: {
        msg: 'Discount value must be a valid number'
      },
      min: {
        args: [0],
        msg: 'Discount value must be greater than or equal to 0'
      }
    }
  },
  options: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('options');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(val) {
      this.setDataValue('options', JSON.stringify(val));
    }
  },
  imageUrls: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('imageUrls');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(val) {
      this.setDataValue('imageUrls', JSON.stringify(val));
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'variants',
  timestamps: true,
  indexes: [
    {
      fields: ['productId']
    },
    {
      unique: true,
      fields: ['sku']
    }
  ]
});

module.exports = Variant;