const Category = require('../models/category');
const { sequelize } = require('../config/database');

/**
 * Get all categories
 * @route GET /api/categories
 * @access Public (All roles can view categories)
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    
    const where = {};
    
    // Filter by active status - for non-admin users, always filter inactive categories
    if (includeInactive !== 'true' || !req.user || req.user.role !== 'admin') {
      where.isActive = true;
    }
    
    const categories = await Category.findAll({
      where,
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * @route GET /api/categories/:id
 * @access Public (All roles can view categories)
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Category not found'
        }
      });
    }
    
    // Non-admin users can only view active categories
    if (!category.isActive && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Category not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new category
 * @route POST /api/categories
 * @access Private (Admin only)
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, imageUrl, isActive } = req.body;
    
    const category = await Category.create({
      name,
      description,
      imageUrl,
      isActive: isActive !== undefined ? isActive : true
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * @route PUT /api/categories/:id
 * @access Private (Admin only)
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, imageUrl, isActive } = req.body;
    
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Category not found'
        }
      });
    }
    
    // Update category
    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      imageUrl: imageUrl !== undefined ? imageUrl : category.imageUrl,
      isActive: isActive !== undefined ? isActive : category.isActive
    });
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * @route DELETE /api/categories/:id
 * @access Private (Admin only)
 */
exports.deleteCategory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const category = await Category.findByPk(req.params.id, { transaction });
    
    if (!category) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: {
          message: 'Category not found'
        }
      });
    }
    
    // Delete category
    await category.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};


/**
 * Get category tree
 * @route GET /api/categories/tree
 * @access Public
 */exports.getCategoryTree = async (req, res, next) => {
  try {
    // Get all root categories (parentId is null)
    const rootCategories = await Category.findAll({
      where: { 
        parentId: null,
        isActive: true 
      },
      order: [['name', 'ASC']]
    });
    
    // Function to recursively fetch child categories
    const getChildCategories = async (parentId) => {
      const children = await Category.findAll({
        where: { 
          parentId,
          isActive: true 
        },
        order: [['name', 'ASC']]
      });
      
      // Recursively get children for each child
      for (const child of children) {
        child.dataValues.children = await getChildCategories(child.id);
      }
      
      return children;
    };
    
    // Add children to each root category
    for (const rootCategory of rootCategories) {
      rootCategory.dataValues.children = await getChildCategories(rootCategory.id);
    }
    
    res.status(200).json({
      success: true,
      data: rootCategories
    });
  } catch (error) {
    next(error);
  }
};