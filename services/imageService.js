const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Promisify file system operations
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

// Base upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const PRODUCT_IMAGE_DIR = path.join(UPLOAD_DIR, 'products');

// Ensure upload directories exist
const initializeDirectories = async () => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR);
    }
    
    if (!fs.existsSync(PRODUCT_IMAGE_DIR)) {
      await mkdir(PRODUCT_IMAGE_DIR);
    }
  } catch (error) {
    console.error('Error initializing upload directories:', error);
    throw error;
  }
};

// Initialize directories on startup
initializeDirectories().catch(console.error);

// Configure multer storage
const storage = multer.memoryStorage(); // Store files in memory for processing

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
});

/**
 * Image Service for handling product images
 */
class ImageService {
  /**
   * Get multer upload middleware
   * @returns {Function} - Multer middleware
   */
  getUploadMiddleware() {
    return upload.array('images', 10); // Allow up to 10 images
  }
  
  /**
   * Process uploaded product images
   * @param {Array} files - Uploaded files
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} - Array of image URLs
   */
  async processProductImages(files, productId) {
    if (!files || files.length === 0) {
      return [];
    }
    
    try {
      const productDir = path.join(PRODUCT_IMAGE_DIR, productId.toString());
      
      // Create product directory if it doesn't exist
      if (!fs.existsSync(productDir)) {
        await mkdir(productDir);
      }
      
      const imagePromises = files.map(async (file) => {
        const filename = `${uuidv4()}.webp`;
        const filepath = path.join(productDir, filename);
        
        // Process image with Sharp
        // Convert to WebP format for better compression and quality
        // Create multiple sizes for responsive images
        
        // Original size
        await sharp(file.buffer)
          .webp({ quality: 90 })
          .toFile(filepath);
        
        // Thumbnail
        const thumbFilename = `thumb_${filename}`;
        const thumbPath = path.join(productDir, thumbFilename);
        await sharp(file.buffer)
          .resize(300, 300, { fit: 'inside' })
          .webp({ quality: 80 })
          .toFile(thumbPath);
        
        // Medium size for product listings
        const mediumFilename = `medium_${filename}`;
        const mediumPath = path.join(productDir, mediumFilename);
        await sharp(file.buffer)
          .resize(600, 600, { fit: 'inside' })
          .webp({ quality: 85 })
          .toFile(mediumPath);
        
        // Return relative URLs
        return {
          original: `/uploads/products/${productId}/${filename}`,
          thumbnail: `/uploads/products/${productId}/${thumbFilename}`,
          medium: `/uploads/products/${productId}/${mediumFilename}`
        };
      });
      
      return await Promise.all(imagePromises);
    } catch (error) {
      console.error('Error processing product images:', error);
      throw error;
    }
  }
  
  /**
   * Delete product images
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteProductImages(productId) {
    try {
      const productDir = path.join(PRODUCT_IMAGE_DIR, productId.toString());
      
      if (!fs.existsSync(productDir)) {
        return true; // No images to delete
      }
      
      // Read all files in the directory
      const files = fs.readdirSync(productDir);
      
      // Delete each file
      for (const file of files) {
        await unlink(path.join(productDir, file));
      }
      
      // Remove directory
      fs.rmdirSync(productDir);
      
      return true;
    } catch (error) {
      console.error('Error deleting product images:', error);
      throw error;
    }
  }
  
  /**
   * Optimize an image URL for a specific viewport/device
   * @param {string} imageUrl - Original image URL
   * @param {string} size - Size variant (thumbnail, medium, original)
   * @returns {string} - Optimized image URL
   */
  getOptimizedImageUrl(imageUrl, size = 'original') {
    if (!imageUrl) {
      return null;
    }
    
    // Check if it's already a processed image URL
    if (imageUrl.startsWith('/uploads/products/')) {
      const parts = imageUrl.split('/');
      const filename = parts[parts.length - 1];
      
      if (size === 'thumbnail' && !filename.startsWith('thumb_')) {
        parts[parts.length - 1] = `thumb_${filename}`;
        return parts.join('/');
      }
      
      if (size === 'medium' && !filename.startsWith('medium_')) {
        parts[parts.length - 1] = `medium_${filename}`;
        return parts.join('/');
      }
      
      return imageUrl;
    }
    
    // For external URLs, return as is
    return imageUrl;
  }
  
  /**
   * Create a responsive image object with multiple sizes
   * @param {string} imageUrl - Original image URL
   * @returns {Object} - Responsive image object
   */
  createResponsiveImageObject(imageUrl) {
    if (!imageUrl) {
      return null;
    }
    
    return {
      original: this.getOptimizedImageUrl(imageUrl, 'original'),
      thumbnail: this.getOptimizedImageUrl(imageUrl, 'thumbnail'),
      medium: this.getOptimizedImageUrl(imageUrl, 'medium')
    };
  }
}

module.exports = new ImageService();