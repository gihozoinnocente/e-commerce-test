const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/user');

/**
 * Generate a JWT token for a user
 * @param {number} id - User ID
 * @returns {string} - JWT token
 */
const signToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

/**
 * Create and send JWT token as response
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        success: true,
        token,
        data: {
            user
        }
    });
};

/**
 * User registration
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Email is already registered'
                }
            });
        }

        // Validate the role
        const validRoles = ['admin', 'seller', 'buyer'];

        // Default to 'buyer' for new registrations
        let userRole = 'buyer';

        // If role is provided and it's valid
        if (role && validRoles.includes(role)) {
            // Only allow admin users to create admin accounts
            if (role === 'admin') {
                // Check if the request is from an authenticated admin
                if (req.user && req.user.role === 'admin') {
                    userRole = 'admin';
                }
            } else {
                // For seller or buyer roles, allow them to be set
                userRole = role;
            }
        }

        // Create new user with the determined role
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            role
        });

        createSendToken(user, 201, res);
    } catch (error) {
        next(error);
    }
};
/**
 * User login
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide email and password'
                }
            });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });

        // Check if user exists and password is correct
        if (!user || !(await user.isPasswordMatch(password))) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Incorrect email or password'
                }
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Your account has been deactivated. Please contact an administrator.'
                }
            });
        }

        // Update last login timestamp
        await user.update({ lastLogin: new Date() });

        // Send token
        createSendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user details (name and email)
 * @route PUT /api/auth/update-details
 * @access Private
 */
exports.updateDetails = async (req, res, next) => {
    try {
        const { firstName, lastName, email } = req.body;

        // Update user
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found'
                }
            });
        }

        // Update fields
        await user.update({
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            email: email || user.email
        });

        res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update password
 * @route PUT /api/auth/update-password
 * @access Private
 */
exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide current password and new password'
                }
            });
        }

        // Get user with password
        const user = await User.findByPk(req.user.id);

        // Check current password
        if (!(await user.isPasswordMatch(currentPassword))) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Your current password is incorrect'
                }
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        createSendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide your email address'
                }
            });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'There is no user with that email address'
                }
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash the token and store in database
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set expiration (10 minutes)
        user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

        await user.save();

        // In a real application, send an email with the token
        // For now, just return the token in the response (development only)

        res.status(200).json({
            success: true,
            message: 'Password reset token sent',
            resetToken // Would be removed in production
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset password using token
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide a new password'
                }
            });
        }

        // Hash the token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid reset token and not expired
        const user = await User.findOne({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Token is invalid or has expired'
                }
            });
        }

        // Update password and clear reset fields
        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        createSendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};