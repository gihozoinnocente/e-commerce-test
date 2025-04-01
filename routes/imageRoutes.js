const express = require('express');
const imageController = require('../controllers/imageController');
const imageService = require('../services/imageService');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/images/products/{productId}:
 *   post:
 *     summary: Upload product images
 *     description: Upload one or more product images
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: No images uploaded
 *       404:
 *         description: Product not found
 */
router.post(
  '/products/:productId',
  protect,
  restrictTo('admin', 'manager', 'editor'),
  imageService.getUploadMiddleware(),
  imageController.uploadProductImages
);

/**
 * @swagger
 * /api/images/variants/{variantId}:
 *   post:
 *     summary: Upload variant images
 *     description: Upload one or more variant images
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Variant ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: No images uploaded
 *       404:
 *         description: Variant not found
 */
router.post(
  '/variants/:variantId',
  protect,
  restrictTo('admin', 'manager', 'editor'),
  imageService.getUploadMiddleware(),
  imageController.uploadVariantImages
);

/**
 * @swagger
 * /api/images/products/{productId}/{imageIndex}:
 *   delete:
 *     summary: Delete product image
 *     description: Delete a specific product image by index
 *     tags: [Images]
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
 *         name: imageIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Image index in the imageUrls array
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       400:
 *         description: Invalid image index
 *       404:
 *         description: Product not found
 */
router.delete(
  '/products/:productId/:imageIndex',
  protect,
  restrictTo('admin', 'manager', 'editor'),
  imageController.deleteProductImage
);

/**
 * @swagger
 * /api/images/responsive:
 *   post:
 *     summary: Generate responsive image URLs
 *     description: Generate responsive image URLs for different device sizes
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrls
 *             properties:
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Responsive image URLs generated
 *       400:
 *         description: Invalid input
 */
router.post(
  '/responsive',
  imageController.getResponsiveImageUrls
);

module.exports = router;