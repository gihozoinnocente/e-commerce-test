const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../config/database');
const Product = require('../../models/product');
const Category = require('../../models/category');

// Mock data
const mockProduct = {
  name: 'Test Product',
  description: 'This is a test product',
  sku: 'TEST-001',
  basePrice: 99.99,
  categoryId: 1,
  tags: ['test', 'product'],
  isActive: true
};

// Setup and teardown
beforeAll(async () => {
  // Connect to test database and sync models
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  
  // Create a test category
  await Category.create({
    id: 1,
    name: 'Test Category',
    description: 'Category for testing',
    isActive: true
  });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

describe('Product Controller', () => {
  let productId;
  
  // Test creating a product
  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const res = await request(app)
        .post('/api/products')
        .send(mockProduct);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toEqual(mockProduct.name);
      expect(res.body.data.sku).toEqual(mockProduct.sku);
      
      // Save product ID for later tests
      productId = res.body.data.id;
    });
    
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: 'Missing Fields Product'
          // Missing required fields
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('message');
    });
    
    it('should return 400 if SKU already exists', async () => {
      const res = await request(app)
        .post('/api/products')
        .send(mockProduct); // Same SKU as before
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('SKU');
    });
  });
  
  // Test getting products
  describe('GET /api/products', () => {
    it('should get all products', async () => {
      const res = await request(app).get('/api/products');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
    
    it('should filter products by name', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({ name: 'Test' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('Test');
    });
  });
  
  // Test getting a single product
  describe('GET /api/products/:id', () => {
    it('should get a product by ID', async () => {
      const res = await request(app).get(`/api/products/${productId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toEqual(productId);
      expect(res.body.data.name).toEqual(mockProduct.name);
    });
    
    it('should return 404 for non-existent product', async () => {
      const res = await request(app).get('/api/products/99999');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found');
    });
  });
  
  // Test updating a product
  describe('PUT /api/products/:id', () => {
    it('should update a product', async () => {
      const updatedData = {
        name: 'Updated Test Product',
        description: 'This product has been updated',
        basePrice: 129.99
      };
      
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .send(updatedData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toEqual(updatedData.name);
      expect(res.body.data.description).toEqual(updatedData.description);
      expect(parseFloat(res.body.data.basePrice)).toEqual(updatedData.basePrice);
    });
    
    it('should return 404 for updating non-existent product', async () => {
      const res = await request(app)
        .put('/api/products/99999')
        .send({ name: 'Non-existent Product' });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found');
    });
  });
  
  // Test product search
  describe('GET /api/products/search', () => {
    it('should search products by query', async () => {
      const res = await request(app)
        .get('/api/products/search')
        .query({ query: 'Updated' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('Updated');
    });
    
    it('should return 400 if search query is missing', async () => {
      const res = await request(app).get('/api/products/search');
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Query parameter');
    });
  });
  
  // Test deleting a product
  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      const res = await request(app).delete(`/api/products/${productId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      
      // Verify product is deleted
      const checkRes = await request(app).get(`/api/products/${productId}`);
      expect(checkRes.statusCode).toEqual(404);
    });
    
    it('should return 404 for deleting non-existent product', async () => {
      const res = await request(app).delete('/api/products/99999');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found');
    });
  });
});