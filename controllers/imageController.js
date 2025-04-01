const imageService = require('../services/imageService');
const Product = require('../models/product');
const Variant = require('../models/variant');

/**
 * Upload product images
 * @route POST /api/images/products/:productId
 * @access Private
 */
exports.uploadProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    
    // Check if product exists
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please upload at least one image'
        }
      });
    }
    
    // Process the uploaded images
    const images = await imageService.processProductImages(req.files, productId);
    
    // Update product with new image URLs
    const currentImages = product.imageUrls || [];
    const updatedImages = [...currentImages, ...images.map(img => img.original)];
    
    await product.update({
      imageUrls: updatedImages
    });
    
    res.status(200).json({
      success: true,
      data: {
        imageUrls: updatedImages,
        newImages: images
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload variant images
 * @route POST /api/images/variants/:variantId
 * @access Private
 */
exports.uploadVariantImages = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    
    // Check if variant exists
    const variant = await Variant.findByPk(variantId);
    
    if (!variant) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Variant not found'
        }
      });
    }
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please upload at least one image'
        }
      });
    }
    
    // Product ID is used for folder organization
    const productId = variant.productId;
    
    // Process the uploaded images
    const images = await imageService.processProductImages(req.files, productId);
    
    // Update variant with new image URLs
    const currentImages = variant.imageUrls || [];
    const updatedImages = [...currentImages, ...images.map(img => img.original)];
    
    await variant.update({
      imageUrls: updatedImages
    });
    
    res.status(200).json({
      success: true,
      data: {
        imageUrls: updatedImages,
        newImages: images
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product image
 * @route DELETE /api/images/products/:productId/:imageId
 * @access Private
 */
exports.deleteProductImage = async (req, res, next) => {
  try {
    const { productId, imageIndex } = req.params;
    
    // Check if product exists
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    // Get current images
    const currentImages = product.imageUrls || [];
    
    // Check if image exists
    const index = parseInt(imageIndex, 10);
    
    if (isNaN(index) || index < 0 || index >= currentImages.length) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid image index'
        }
      });
    }
    
    // Remove image from array
    const updatedImages = [...currentImages];
    updatedImages.splice(index, 1);
    
    // Update product
    await product.update({
      imageUrls: updatedImages
    });
    
    res.status(200).json({
      success: true,
      data: {
        imageUrls: updatedImages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate responsive image URLs
 * @route POST /api/images/responsive
 * @access Public
 */
exports.getResponsiveImageUrls = async (req, res, next) => {
  try {
    const { imageUrls } = req.body;
    
    if (!imageUrls || !Array.isArray(imageUrls)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide an array of image URLs'
        }
      });
    }
    
    // Generate responsive URLs for each image
    const responsiveImages = imageUrls.map(url => 
      imageService.createResponsiveImageObject(url)
    );
    
    res.status(200).json({
      success: true,
      data: responsiveImages
    });
  } catch (error) {
    next(error);
  }
};