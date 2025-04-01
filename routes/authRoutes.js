const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validator');

const router = express.Router();
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, seller, buyer]
 *                 description: User role (defaults to buyer if not specified)
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input or email already registered
 */
router.post(
    '/register',
    [
      body('email')
        .isEmail()
        .withMessage('Please provide a valid email address'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
      body('firstName')
        .notEmpty()
        .withMessage('First name is required'),
      body('lastName')
        .notEmpty()
        .withMessage('Last name is required'),
      body('role')
        .optional()
        .isIn(['admin', 'seller', 'buyer'])
        .withMessage('Role must be admin, seller, or buyer')
    ],
    validate,
    authController.register
  );

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and get access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
    '/login',
    loginLimiter,
    [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    validate,
    authController.login
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Get the profile of the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Not authenticated
 */
router.get('/me', protect, authController.getMe);

/**
 * @swagger
 * /api/auth/update-details:
 *   put:
 *     summary: Update user details
 *     description: Update user profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User details updated
 *       401:
 *         description: Not authenticated
 */
router.put(
    '/update-details',
    protect,
    [
        body('firstName')
            .optional()
            .notEmpty()
            .withMessage('First name cannot be empty'),
        body('lastName')
            .optional()
            .notEmpty()
            .withMessage('Last name cannot be empty'),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Please provide a valid email address')
    ],
    validate,
    authController.updateDetails
);

/**
 * @swagger
 * /api/auth/update-password:
 *   put:
 *     summary: Update password
 *     description: Update user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 *       401:
 *         description: Incorrect current password
 */
router.put(
    '/update-password',
    protect,
    [
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('New password must be at least 8 characters long')
            .matches(/[a-zA-Z]/)
            .withMessage('New password must contain at least one letter')
            .matches(/\d/)
            .withMessage('New password must contain at least one number')
    ],
    validate,
    authController.updatePassword
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Request password reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset token sent
 *       404:
 *         description: User not found
 */
router.post(
    '/forgot-password',
    [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
    ],
    validate,
    authController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     description: Reset password using token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post(
    '/reset-password/:token',
    [
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/[a-zA-Z]/)
            .withMessage('Password must contain at least one letter')
            .matches(/\d/)
            .withMessage('Password must contain at least one number')
    ],
    validate,
    authController.resetPassword
);

module.exports = router;