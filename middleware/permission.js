/**
 * Permission middleware for role-based access control
 */

// Define permissions for each role and resource
const permissions = {
    // Admin can do everything
    admin: {
      categories: ['view', 'create', 'update', 'delete'],
      products: ['view', 'create', 'update', 'delete'],
      variants: ['view', 'create', 'update', 'delete'],
      inventory: ['view', 'update'],
      reports: ['view'],
      users: ['view', 'create', 'update', 'delete']
    },
    
    // Seller can manage their own products and view categories
    seller: {
      categories: ['view'],
      products: ['view', 'create', 'update', 'delete'],
      variants: ['view', 'create', 'update', 'delete'],
      inventory: ['view', 'update'],
      reports: ['view'],
      users: ['view']
    },
    
    // Buyer can only view products, categories, and variants
    buyer: {
      categories: ['view'],
      products: ['view'],
      variants: ['view'],
      inventory: [],
      reports: [],
      users: []
    }
  };
  
  /**
   * Check if a role has permission for an action on a resource
   * @param {string} role - User role (admin, seller, buyer)
   * @param {string} resource - Resource name (categories, products, etc.)
   * @param {string} action - Action name (view, create, update, delete)
   * @returns {boolean} - Whether the role has permission
   */
  const hasPermission = (role, resource, action) => {
    // If role doesn't exist in permissions, deny access
    if (!permissions[role]) {
      return false;
    }
    
    // If resource doesn't exist for this role, deny access
    if (!permissions[role][resource]) {
      return false;
    }
    
    // Check if action is allowed for this role and resource
    return permissions[role][resource].includes(action);
  };
  
  /**
   * Create middleware to check permission for a specific resource and action
   * @param {string} resource - Resource name
   * @param {string} action - Action name
   * @returns {Function} - Express middleware
   */
  exports.checkPermission = (resource, action) => {
    return (req, res, next) => {
      // Get user role from authenticated user
      const role = req.user ? req.user.role : null;
      
      // If no role or no permission, deny access
      if (!role || !hasPermission(role, resource, action)) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to perform this action'
          }
        });
      }
      
      // If has permission, continue
      next();
    };
  };
  
  /**
   * Create middleware to check ownership of a resource (for sellers)
   * @param {string} model - Model to check (e.g., Product)
   * @param {string} paramIdField - Request parameter for resource ID
   * @param {string} userIdField - Field in model that refers to user ID
   * @returns {Function} - Express middleware
   */
  exports.checkOwnership = (model, paramIdField = 'id', userIdField = 'userId') => {
    return async (req, res, next) => {
      try {
        // If user is admin, skip ownership check
        if (req.user && req.user.role === 'admin') {
          return next();
        }
        
        // Get resource ID from request params
        const resourceId = req.params[paramIdField];
        
        if (!resourceId) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Resource ID not provided'
            }
          });
        }
        
        // Find resource
        const resource = await model.findByPk(resourceId);
        
        if (!resource) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'Resource not found'
            }
          });
        }
        
        // Check if user is the owner
        if (resource[userIdField] !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: {
              message: 'You are not authorized to perform this action on this resource'
            }
          });
        }
        
        // If user is the owner, continue
        next();
      } catch (error) {
        next(error);
      }
    };
  };
  
  /**
   * Get all permissions for a role
   * @param {string} role - User role
   * @returns {Object} - Permissions object
   */
  exports.getRolePermissions = (role) => {
    return permissions[role] || {};
  };
  
  /**
   * Get all permissions
   * @returns {Object} - All permissions object
   */
  exports.getAllPermissions = () => {
    return permissions;
  };