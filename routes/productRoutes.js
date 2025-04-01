const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const validate = require('../middleware/validator');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of products with optional filtering, sorting, and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by product name
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: integer
 *         description: Filter by seller ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, basePrice, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Search products
 *     description: Search products by query string
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       400:
 *         description: Query parameter is required
 */
router.get('/search', productController.searchProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve a specific product by its ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product in the catalog (Admin or Seller only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sku
 *               - basePrice
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sku:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               discountType:
 *                 type: string
 *                 enum: [none, percentage, fixed]
 *               discountValue:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               attributes:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               inventory:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                   lowStockThreshold:
 *                     type: integer
 *                   reservedQuantity:
 *                     type: integer
 *                   location:
 *                     type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized to create products
 */
router.post(
  '/',
  protect,
  checkPermission('products', 'create'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ max: 200 })
      .withMessage('Product name cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim(),
    body('sku')
      .trim()
      .notEmpty()
      .withMessage('SKU is required')
      .isLength({ max: 50 })
      .withMessage('SKU cannot exceed 50 characters'),
    body('basePrice')
      .notEmpty()
      .withMessage('Base price is required')
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number'),
    body('discountType')
      .optional()
      .isIn(['none', 'percentage', 'fixed'])
      .withMessage('Discount type must be none, percentage, or fixed'),
    body('discountValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount value must be a positive number'),
    body('categoryId')
      .notEmpty()
      .withMessage('Category ID is required')
      .isInt()
      .withMessage('Category ID must be an integer'),
    body('tags')
      .optional()
      .custom(value => {
        if (Array.isArray(value)) {
          return true;
        }
        if (typeof value === 'string') {
          return true;
        }
        throw new Error('Tags must be an array or a string');
      }),
    body('imageUrls')
      .optional()
      .isArray()
      .withMessage('Image URLs must be an array'),
    body('imageUrls.*')
      .optional()
      .isURL()
      .withMessage('Each image URL must be a valid URL'),
    body('attributes')
      .optional()
      .isObject()
      .withMessage('Attributes must be an object'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean value'),
    body('inventory.quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Inventory quantity must be a non-negative integer'),
    body('inventory.lowStockThreshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Low stock threshold must be a non-negative integer'),
    body('inventory.reservedQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Reserved quantity must be a non-negative integer'),
    body('inventory.location')
      .optional()
      .isString()
      .withMessage('Location must be a string')
  ],
  validate,
  productController.createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     description: Update an existing product by ID (Admin or Product Owner)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sku:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               discountType:
 *                 type: string
 *                 enum: [none, percentage, fixed]
 *               discountValue:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               attributes:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               inventory:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                   lowStockThreshold:
 *                     type: integer
 *                   reservedQuantity:
 *                     type: integer
 *                   location:
 *                     type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized to update this product
 */
router.put(
  '/:id',
  protect,
  checkPermission('products', 'update'),
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Product name cannot be empty')
      .isLength({ max: 200 })
      .withMessage('Product name cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim(),
    body('sku')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('SKU cannot be empty')
      .isLength({ max: 50 })
      .withMessage('SKU cannot exceed 50 characters'),
    body('basePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number'),
    body('discountType')
      .optional()
      .isIn(['none', 'percentage', 'fixed'])
      .withMessage('Discount type must be none, percentage, or fixed'),
    body('discountValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount value must be a positive number'),
    body('categoryId')
      .optional()
      .isInt()
      .withMessage('Category ID must be an integer'),
    body('tags')
      .optional()
      .custom(value => {
        if (Array.isArray(value)) {
          return true;
        }
        if (typeof value === 'string') {
          return true;
        }
        throw new Error('Tags must be an array or a string');
      }),
    body('imageUrls')
      .optional()
      .isArray()
      .withMessage('Image URLs must be an array'),
    body('imageUrls.*')
      .optional()
      .isURL()
      .withMessage('Each image URL must be a valid URL'),
    body('attributes')
      .optional()
      .isObject()
      .withMessage('Attributes must be an object'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean value'),
    body('inventory.quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Inventory quantity must be a non-negative integer'),
    body('inventory.lowStockThreshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Low stock threshold must be a non-negative integer'),
    body('inventory.reservedQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Reserved quantity must be a non-negative integer'),
    body('inventory.location')
      .optional()
      .isString()
      .withMessage('Location must be a string')
  ],
  validate,
  productController.updateProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Delete a product by ID (Admin or Product Owner)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Product not found
 *       403:
 *         description: Not authorized to delete this product
 */
router.delete(
  '/:id',
  protect,
  checkPermission('products', 'delete'),
  productController.deleteProduct
);

/**
 * @swagger
 * /api/products/{id}/variants:
 *   get:
 *     summary: Get product variants
 *     description: Retrieve all variants of a specific product
 *     tags: [Products, Variants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of product variants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variant'
 *       404:
 *         description: Product not found
 */
router.get('/:id/variants', productController.getProductVariants);

/**
 * @swagger
 * /api/products/{id}/variants:
 *   post:
 *     summary: Create product variant
 *     description: Create a new variant for a specific product (Admin or Product Owner)
 *     tags: [Products, Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sku
 *               - price
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               discountType:
 *                 type: string
 *                 enum: [none, percentage, fixed]
 *               discountValue:
 *                 type: number
 *               options:
 *                 type: object
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *               inventory:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                   lowStockThreshold:
 *                     type: integer
 *                   reservedQuantity:
 *                     type: integer
 *                   location:
 *                     type: string
 *     responses:
 *       201:
 *         description: Variant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Variant'
 *       404:
 *         description: Product not found
 *       403:
 *         description: Not authorized to add variants to this product
 *       400:
 *         description: Invalid input
 */
router.post(
  '/:id/variants',
  protect,
  checkPermission('variants', 'create'),
  [
    body('sku')
      .trim()
      .notEmpty()
      .withMessage('SKU is required')
      .isLength({ max: 50 })
      .withMessage('SKU cannot exceed 50 characters'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Variant name cannot exceed 200 characters'),
    body('price')
      .notEmpty()
      .withMessage('Price is required')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('discountType')
      .optional()
      .isIn(['none', 'percentage', 'fixed'])
      .withMessage('Discount type must be none, percentage, or fixed'),
    body('discountValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount value must be a positive number'),
    body('options')
      .optional()
      .isObject()
      .withMessage('Options must be an object'),
    body('imageUrls')
      .optional()
      .isArray()
      .withMessage('Image URLs must be an array'),
    body('imageUrls.*')
      .optional()
      .isURL()
      .withMessage('Each image URL must be a valid URL'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
    body('inventory.quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Inventory quantity must be a non-negative integer'),
    body('inventory.lowStockThreshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Low stock threshold must be a non-negative integer'),
    body('inventory.reservedQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Reserved quantity must be a non-negative integer'),
    body('inventory.location')
      .optional()
      .isString()
      .withMessage('Location must be a string')
  ],
  validate,
  productController.createProductVariant
);

/**
 * @swagger
 * /api/products/{productId}/variants/{id}:
 *   put:
 *     summary: Update product variant
 *     description: Update a specific variant of a product (Admin or Product Owner)
 *     tags: [Products, Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Variant ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               discountType:
 *                 type: string
 *                 enum: [none, percentage, fixed]
 *               discountValue:
 *                 type: number
 *               options:
 *                 type: object
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *               inventory:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                   lowStockThreshold:
 *                     type: integer
 *                   reservedQuantity:
 *                     type: integer
 *                   location:
 *                     type: string
 *     responses:
 *       200:
 *         description: Variant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Variant'
 *       404:
 *         description: Product or variant not found
 *       403:
 *         description: Not authorized to update variants of this product
 *       400:
 *         description: Invalid input
 */
router.put(
  '/:productId/variants/:id',
  protect,
  checkPermission('variants', 'update'),
  [
    body('sku')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('SKU cannot be empty')
      .isLength({ max: 50 })
      .withMessage('SKU cannot exceed 50 characters'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Variant name cannot exceed 200 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('discountType')
      .optional()
      .isIn(['none', 'percentage', 'fixed'])
      .withMessage('Discount type must be none, percentage, or fixed'),
    body('discountValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount value must be a positive number'),
    body('options')
      .optional()
      .isObject()
      .withMessage('Options must be an object'),
    body('imageUrls')
      .optional()
      .isArray()
      .withMessage('Image URLs must be an array'),
    body('imageUrls.*')
      .optional()
      .isURL()
      .withMessage('Each image URL must be a valid URL'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
    body('inventory.quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Inventory quantity must be a non-negative integer'),
    body('inventory.lowStockThreshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Low stock threshold must be a non-negative integer'),
    body('inventory.reservedQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Reserved quantity must be a non-negative integer'),
    body('inventory.location')
      .optional()
      .isString()
      .withMessage('Location must be a string')
  ],
  validate,
  productController.updateProductVariant
);

/**
 * @swagger
 * /api/products/{productId}/variants/{id}:
 *   delete:
 *     summary: Delete product variant
 *     description: Delete a specific variant of a product (Admin or Product Owner)
 *     tags: [Products, Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Variant deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Product or variant not found
 *       403:
 *         description: Not authorized to delete variants of this product
 */
router.delete(
  '/:productId/variants/:id',
  protect,
  checkPermission('variants', 'delete'),
  productController.deleteProductVariant
);

module.exports = router;