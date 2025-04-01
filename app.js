const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const { serve, setup } = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const { basicLimiter } = require('./middleware/rateLimit');

// Import routes
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');
const imageRoutes = require('./routes/imageRoutes');
const setupAssociations = require('./models/associations');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Performance middleware
app.use(compression()); // Compress responses

// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use(morgan('dev'));

// Rate limiting (applied globally)
app.use(basicLimiter);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Documentation
app.use('/api-docs', serve, setup);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/images', imageRoutes);

// Make sure to call setupAssociations() before starting your server
// Add this before your server starts listening
setupAssociations();
console.log('Model associations have been set up');

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error Handling
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

module.exports = app;