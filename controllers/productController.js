const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('../models/product');
const Category = require('../models/category');
const Variant = require('../models/variant');
const Inventory = require('../models/inventory');
const User = require('../models/user');

/**
 * Get all products with filtering, sorting, and pagination
 * @route GET /api/products
 * @access Public (All roles can view products)
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      name,
      categoryId,
      minPrice,
      maxPrice,
      tags,
      isActive,
      isFeatured,
      sellerId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    
    // Build where clause
    const where = {};
    
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (minPrice) {
      where.basePrice = { ...where.basePrice, [Op.gte]: minPrice };
    }
    
    if (maxPrice) {
      where.basePrice = { ...where.basePrice, [Op.lte]: maxPrice };
    }
    
    if (tags) {
      where.tags = { [Op.like]: `%${tags}%` };
    }
    
    // For non-admins, only show active products
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else if (!req.user || req.user.role !== 'admin') {
      where.isActive = true;
    }
    
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true';
    }
    
    // Filter by seller
    if (sellerId) {
      where.userId = sellerId;
    }
    
    // If user is a seller, only show their products
    if (req.user && req.user.role === 'seller') {
      where.userId = req.user.id;
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    
    // Sort order validation
    const validSortFields = ['name', 'basePrice', 'createdAt', 'updatedAt'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const orderBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Get products
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: Variant,
          attributes: ['id', 'sku', 'name', 'price']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName']
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
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 * @route GET /api/products/:id
 * @access Public (All roles can view products)
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'parentId']
        },
        {
          model: Variant,
          include: [
            {
              model: Inventory,
              attributes: ['quantity', 'lowStockThreshold', 'reservedQuantity']
            }
          ]
        },
        {
          model: Inventory,
          attributes: ['quantity', 'lowStockThreshold', 'reservedQuantity']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    // Check if product is active or user is admin/seller of the product
    if (!product.isActive && 
        (!req.user || 
         (req.user.role !== 'admin' && 
          !(req.user.role === 'seller' && req.user.id === product.userId)))) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new product
 * @route POST /api/products
 * @access Private (Admins and Sellers only)
 */
exports.createProduct = async (req, res, next) => {
  let transaction;
  
  try {
    // Start the transaction
    transaction = await sequelize.transaction();
    
    const {
      name,
      description,
      sku,
      basePrice,
      discountType,
      discountValue,
      categoryId,
      tags,
      imageUrls,
      attributes,
      isActive,
      isFeatured,
      inventory
    } = req.body;
    
    // Check if category exists
    const category = await Category.findByPk(categoryId, { transaction });
    
    if (!category) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: {
          message: 'Category not found'
        }
      });
    }
    
    // Check if SKU is already in use
    if (sku) {
      const existingSku = await Product.findOne({
        where: { sku },
        transaction
      });
      
      if (existingSku) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: {
            message: 'SKU is already in use'
          }
        });
      }
    }
    
    // Create the product
    const product = await Product.create({
      name,
      description,
      sku,
      basePrice,
      discountType: discountType || 'none',
      discountValue: discountValue || 0,
      categoryId,
      userId: req.user.id, // Set the seller ID from the authenticated user
      tags,
      imageUrls,
      attributes,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false
    }, { transaction });
    
    // Create inventory if provided
    if (inventory) {
      await Inventory.create({
        productId: product.id,
        variantId: null, // Explicitly set variantId to null for product inventory
        sku: product.sku,
        quantity: inventory.quantity || 0,
        lowStockThreshold: inventory.lowStockThreshold || 10,
        reservedQuantity: inventory.reservedQuantity || 0,
        location: inventory.location,
        lastRestockDate: inventory.quantity > 0 ? new Date() : null
      }, { transaction });
    }
    
    // Commit the transaction
    await transaction.commit();
    
    // Get the complete product with its relationships
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Inventory,
          attributes: ['quantity', 'lowStockThreshold', 'reservedQuantity']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: createdProduct
    });
  } catch (error) {
    // Only roll back the transaction if it exists and is still active
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

/**
 * Update product
 * @route PUT /api/products/:id
 * @access Private (Admin or Product Owner)
 */
exports.updateProduct = async (req, res, next) => {
  let transaction;
  
  try {
    transaction = await sequelize.transaction();
    
    const {
      name,
      description,
      sku,
      basePrice,
      discountType,
      discountValue,
      categoryId,
      tags,
      imageUrls,
      attributes,
      isActive,
      isFeatured,
      inventory
    } = req.body;
    
    const product = await Product.findByPk(req.params.id, { transaction });
    
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    // Check if user is authorized to update this product
    if (req.user.role !== 'admin' && product.userId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: {
          message: 'You are not authorized to update this product'
        }
      });
    }
    
    // Check if category exists if provided
    if (categoryId && categoryId !== product.categoryId) {
      const category = await Category.findByPk(categoryId, { transaction });
      
      if (!category) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: {
            message: 'Category not found'
          }
        });
      }
    }
    
    // Check if SKU is already in use
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({
        where: { 
          sku,
          id: { [Op.ne]: product.id }
        },
        transaction
      });
      
      if (existingProduct) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: {
            message: 'SKU is already in use'
          }
        });
      }
    }
    
    // Update product
    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      sku: sku || product.sku,
      basePrice: basePrice !== undefined ? basePrice : product.basePrice,
      discountType: discountType || product.discountType,
      discountValue: discountValue !== undefined ? discountValue : product.discountValue,
      categoryId: categoryId || product.categoryId,
      tags: tags !== undefined ? tags : product.tags,
      imageUrls: imageUrls !== undefined ? imageUrls : product.imageUrls,
      attributes: attributes !== undefined ? attributes : product.attributes,
      isActive: isActive !== undefined ? isActive : product.isActive,
      isFeatured: isFeatured !== undefined ? isFeatured : product.isFeatured
    }, { transaction });
    
    // Update inventory if provided
    if (inventory) {
      const existingInventory = await Inventory.findOne({
        where: { 
          productId: product.id,
          variantId: null // Ensure we're getting the product's inventory, not a variant's
        },
        transaction
      });
      
      if (existingInventory) {
        await existingInventory.update({
          sku: sku || product.sku,
          quantity: inventory.quantity !== undefined ? inventory.quantity : existingInventory.quantity,
          lowStockThreshold: inventory.lowStockThreshold !== undefined ? inventory.lowStockThreshold : existingInventory.lowStockThreshold,
          reservedQuantity: inventory.reservedQuantity !== undefined ? inventory.reservedQuantity : existingInventory.reservedQuantity,
          location: inventory.location !== undefined ? inventory.location : existingInventory.location,
          lastRestockDate: inventory.quantity > existingInventory.quantity ? new Date() : existingInventory.lastRestockDate
        }, { transaction });
      } else {
        await Inventory.create({
          productId: product.id,
          variantId: null, // Explicitly set variantId to null for product inventory
          sku: product.sku,
          quantity: inventory.quantity || 0,
          lowStockThreshold: inventory.lowStockThreshold || 10,
          reservedQuantity: inventory.reservedQuantity || 0,
          location: inventory.location,
          lastRestockDate: inventory.quantity > 0 ? new Date() : null
        }, { transaction });
      }
    }
    
    await transaction.commit();
    
    // Get the updated product with its relationships
    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: Inventory,
          attributes: ['quantity', 'lowStockThreshold', 'reservedQuantity']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

/**
 * Delete product
 * @route DELETE /api/products/:id
 * @access Private (Admin or Product Owner)
 */
exports.deleteProduct = async (req, res, next) => {
  let transaction;
  
  try {
    transaction = await sequelize.transaction();
    
    const product = await Product.findByPk(req.params.id, { transaction });
    
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    // Check if user is authorized to delete this product
    if (req.user.role !== 'admin' && product.userId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: {
          message: 'You are not authorized to delete this product'
        }
      });
    }
    
    // Delete product (will cascade to inventory and variants)
    await product.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

/**
 * Search products
 * @route GET /api/products/search
 * @access Public (All roles can search products)
 */
exports.searchProducts = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Query parameter is required'
        }
      });
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    
    // Search in name, description, and tags
    const where = {
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
        { tags: { [Op.like]: `%${query}%` } },
        { sku: { [Op.like]: `%${query}%` } }
      ],
      isActive: true // Only search active products
    };
    
    // Get products
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['name', 'ASC']],
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
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product variants
 * @route GET /api/products/:id/variants
 * @access Public (All roles can view variants)
 */
exports.getProductVariants = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    // Check if product is active or user is admin/seller of the product
    if (!product.isActive && 
        (!req.user || 
         (req.user.role !== 'admin' && 
          !(req.user.role === 'seller' && req.user.id === product.userId)))) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    const variants = await Variant.findAll({
      where: { productId: req.params.id },
      include: [
        {
          model: Inventory,
          attributes: ['quantity', 'lowStockThreshold', 'reservedQuantity']
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: variants.length,
      data: variants
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create product variant
 * @route POST /api/products/:id/variants
 * @access Private (Admin or Product Owner)
 */
exports.createProductVariant = async (req, res, next) => {
  let transaction;
  
  try {
    transaction = await sequelize.transaction();
    
    const {
      sku,
      name,
      price,
      discountType,
      discountValue,
      options,
      imageUrls,
      isActive,
      inventory
    } = req.body;
    
    const product = await Product.findByPk(req.params.id, { transaction });
    
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    // Check if user is authorized to add variants to this product
    if (req.user.role !== 'admin' && product.userId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: {
          message: 'You are not authorized to add variants to this product'
        }
      });
    }
    
    // Check if SKU is already in use
    const existingVariant = await Variant.findOne({
      where: { sku },
      transaction
    });
    
    if (existingVariant) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: {
          message: 'SKU is already in use'
        }
      });
    }
    
    // Create variant
    const variant = await Variant.create({
      productId: product.id,
      sku,
      name: name || product.name,
      price: price || product.basePrice,
      discountType: discountType || 'none',
      discountValue: discountValue || 0,
      options,
      imageUrls,
      isActive: isActive !== undefined ? isActive : true
    }, { transaction });
    
    // Create inventory if provided
    if (inventory) {
      await Inventory.create({
        variantId: variant.id,
        productId: null, // Explicitly set productId to null for variant inventory
        sku: variant.sku,
        quantity: inventory.quantity || 0,
        lowStockThreshold: inventory.lowStockThreshold || 10,
        reservedQuantity: inventory.reservedQuantity || 0,
        location: inventory.location,
        lastRestockDate: inventory.quantity > 0 ? new Date() : null
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Get the variant with its relationships
    const createdVariant = await Variant.findByPk(variant.id, {
      include: [
        {
          model: Inventory,
          attributes: ['quantity', 'lowStockThreshold', 'reservedQuantity']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: createdVariant
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

/**
 * Update product variant
 * @route PUT /api/products/:productId/variants/:id
 * @access Private (Admin or Product Owner)
 */
exports.updateProductVariant = async (req, res, next) => {
  let transaction;
  
  try {
    transaction = await sequelize.transaction();
    
    const {
      sku,
      name,
      price,
      discountType,
      discountValue,
      options,
      imageUrls,
      isActive,
      inventory
    } = req.body;
    
    // Verify product exists
    const product = await Product.findByPk(req.params.productId, { transaction });
    
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    // Check if user is authorized to update variants of this product
    if (req.user.role !== 'admin' && product.userId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: {
          message: 'You are not authorized to update variants of this product'
        }
      });
    }
    
    // Verify variant exists and belongs to the product
    const variant = await Variant.findOne({
      where: {
        id: req.params.id,
        productId: req.params.productId
      },
      transaction
    });
    
    if (!variant) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: {
          message: 'Variant not found'
        }
      });
    }
    
    // Check if SKU is already in use by another variant
    if (sku && sku !== variant.sku) {
      const existingVariant = await Variant.findOne({
        where: { 
          sku,
          id: { [Op.ne]: variant.id }
        },
        transaction
      });
      
      if (existingVariant) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: {
            message: 'SKU is already in use'
          }
        });
      }
    }
    
    // Update variant
    await variant.update({
      sku: sku || variant.sku,
      name: name !== undefined ? name : variant.name,
      price: price !== undefined ? price : variant.price,
      discountType: discountType || variant.discountType,
      discountValue: discountValue !== undefined ? discountValue : variant.discountValue,
      options: options !== undefined ? options : variant.options,
      imageUrls: imageUrls !== undefined ? imageUrls : variant.imageUrls,
      isActive: isActive !== undefined ? isActive : variant.isActive
    }, { transaction });
    
    // Update inventory if provided
    if (inventory) {
      const existingInventory = await Inventory.findOne({
        where: { 
          variantId: variant.id,
          productId: null // Ensure we're getting the variant's inventory
        },
        transaction
      });
      
      if (existingInventory) {
        await existingInventory.update({
          sku: sku || variant.sku,
          quantity: inventory.quantity !== undefined ? inventory.quantity : existingInventory.quantity,
          lowStockThreshold: inventory.lowStockThreshold !== undefined ? inventory.lowStockThreshold : existingInventory.lowStockThreshold,
          reservedQuantity: inventory.reservedQuantity !== undefined ? inventory.reservedQuantity : existingInventory.reservedQuantity,
          location: inventory.location !== undefined ? inventory.location : existingInventory.location,
          lastRestockDate: inventory.quantity > existingInventory.quantity ? new Date() : existingInventory.lastRestockDate
        }, { transaction });
      } else {
        await Inventory.create({
          variantId: variant.id,
          productId: null, // Explicitly set productId to null for variant inventory
          sku: variant.sku,
          quantity: inventory.quantity || 0,
          lowStockThreshold: inventory.lowStockThreshold || 10,
          reservedQuantity: inventory.reservedQuantity || 0,
          location: inventory.location,
          lastRestockDate: inventory.quantity > 0 ? new Date() : null
        }, { transaction });
      }
    }
    
    await transaction.commit();
    
    // Get the updated variant with its relationships
    const updatedVariant = await Variant.findByPk(variant.id, {
      include: [
        {
          model: Inventory,
          attributes: ['quantity', 'lowStockThreshold', 'reservedQuantity']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: updatedVariant
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

/**
 * Delete product variant
 * @route DELETE /api/products/:productId/variants/:id
 * @access Private (Admin or Product Owner)
 */
exports.deleteProductVariant = async (req, res, next) => {
  let transaction;
  
  try {
    transaction = await sequelize.transaction();
    
    // Verify product exists
    const product = await Product.findByPk(req.params.productId, { transaction });
    
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    // Check if user is authorized to delete variants of this product
    if (req.user.role !== 'admin' && product.userId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: {
          message: 'You are not authorized to delete variants of this product'
        }
      });
    }
    
    // Verify variant exists and belongs to the product
    const variant = await Variant.findOne({
      where: {
        id: req.params.id,
        productId: req.params.productId
      },
      transaction
    });
    
    if (!variant) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: {
          message: 'Variant not found'
        }
      });
    }
    
    // Delete variant (will cascade to inventory)
    await variant.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};