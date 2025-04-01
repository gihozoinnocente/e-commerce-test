const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - sku
 *         - basePrice
 *         - categoryId
 *         - userId
 *       properties:
 *         id:
 *           type: integer
 *           description: The product ID
 *         name:
 *           type: string
 *           description: The product name
 *         description:
 *           type: string
 *           description: The product description
 *         sku:
 *           type: string
 *           description: Stock keeping unit (unique identifier)
 *         basePrice:
 *           type: number
 *           format: float
 *           description: Base price of the product
 *         discountType:
 *           type: string
 *           enum: [none, percentage, fixed]
 *           description: Type of discount applied
 *         discountValue:
 *           type: number
 *           format: float
 *           description: Value of the discount
 *         categoryId:
 *           type: integer
 *           description: Category ID the product belongs to
 *         userId:
 *           type: integer
 *           description: ID of the seller who created the product
 *         tags:
 *           type: string
 *           description: Comma-separated tags
 *         imageUrls:
 *           type: string
 *           description: JSON array of image URLs
 *         attributes:
 *           type: string
 *           description: JSON object of product attributes
 *         isActive:
 *           type: boolean
 *           description: Whether the product is active
 *         isFeatured:
 *           type: boolean
 *           description: Whether the product is featured
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         id: 1
 *         name: Smartphone X
 *         description: Latest model with advanced features
 *         sku: SM-X-001
 *         basePrice: 799.99
 *         discountType: percentage
 *         discountValue: 10
 *         categoryId: 2
 *         userId: 3
 *         tags: smartphone,electronics,new
 *         imageUrls: ["https://example.com/images/smartphone-x-1.jpg", "https://example.com/images/smartphone-x-2.jpg"]
 *         attributes: {"color": "Black", "storage": "128GB", "screen": "6.5 inch"}
 *         isActive: true
 *         isFeatured: true
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 */
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Product name cannot be empty'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
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
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Base price must be a valid number'
      },
      min: {
        args: [0],
        msg: 'Base price must be greater than or equal to 0'
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
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID of the seller who created the product'
  },
  tags: {
    type: DataTypes.STRING(255),
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('tags');
      return rawValue ? rawValue.split(',') : [];
    },
    set(val) {
      if (Array.isArray(val)) {
        this.setDataValue('tags', val.join(','));
      } else {
        this.setDataValue('tags', val);
      }
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
  attributes: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('attributes');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(val) {
      this.setDataValue('attributes', JSON.stringify(val));
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['categoryId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['tags']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['isFeatured']
    }
  ]
});

module.exports = Product;