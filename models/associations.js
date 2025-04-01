/**
 * Set up model associations
 * This file prevents circular dependencies by setting up all associations
 * after models have been imported and defined
 */
const setupAssociations = () => {
  // Import all models
  const Product = require('./product');
  const Category = require('./category');
  const Variant = require('./variant');
  const Inventory = require('./inventory');
  const User = require('./user');

  // Category associations
  // Self-association for category hierarchy
  //Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });
  //Category.hasMany(Category, { as: 'children', foreignKey: 'parentId' });

  // Product-Category associations
  Product.belongsTo(Category, { foreignKey: 'categoryId' });
  Category.hasMany(Product, { foreignKey: 'categoryId' });

  // Product-User (seller) associations
  Product.belongsTo(User, { as: 'seller', foreignKey: 'userId' });
  User.hasMany(Product, { as: 'products', foreignKey: 'userId' });

  // Product-Variant associations
  // First define Variant belongs to Product (child to parent)
  Variant.belongsTo(Product, { foreignKey: 'productId', onDelete: 'CASCADE' });
  // Then define Product has many Variants (parent to children)
  Product.hasMany(Variant, { foreignKey: 'productId', onDelete: 'CASCADE' });

  // Inventory associations - Product
  // First define Inventory belongs to Product
  Inventory.belongsTo(Product, { foreignKey: 'productId', onDelete: 'CASCADE' });
  // Then define Product has one Inventory
  Product.hasOne(Inventory, { foreignKey: 'productId', onDelete: 'CASCADE' });

  // Inventory associations - Variant
  // First define Inventory belongs to Variant
  Inventory.belongsTo(Variant, { foreignKey: 'variantId', onDelete: 'CASCADE' });
  // Then define Variant has one Inventory
  Variant.hasOne(Inventory, { foreignKey: 'variantId', onDelete: 'CASCADE' });

  // Removed duplicate section

  console.log('All model associations have been set up');
};

module.exports = setupAssociations;