# Role-Based Permissions System

This document outlines the role-based permission system implemented in the Product Catalog API. The system defines three user roles (Admin, Seller, and Buyer) with different permissions for operating on various resources.

## User Roles

### 1. Admin
Administrators have full access to all resources and operations in the system. They can manage categories, products, variants, inventory, and users.

### 2. Seller
Sellers can manage their own products and variants. They can create new products, update their existing products, and view categories. Sellers are restricted from modifying categories or accessing other sellers' products.

### 3. Buyer
Buyers have read-only access to the catalog. They can view products, variants, and categories but cannot modify any resources.

## Permission Matrix

The following table defines the permissions for each role on different resources:

| Resource   | Action    | Admin | Seller | Buyer |
|------------|-----------|-------|--------|-------|
| Categories | View      | ✅    | ✅     | ✅    |
| Categories | Create    | ✅    | ❌     | ❌    |
| Categories | Update    | ✅    | ❌     | ❌    |
| Categories | Delete    | ✅    | ❌     | ❌    |
| Products   | View      | ✅    | ✅     | ✅    |
| Products   | Create    | ✅    | ✅     | ❌    |
| Products   | Update    | ✅    | ✅*    | ❌    |
| Products   | Delete    | ✅    | ✅*    | ❌    |
| Variants   | View      | ✅    | ✅     | ✅    |
| Variants   | Create    | ✅    | ✅*    | ❌    |
| Variants   | Update    | ✅    | ✅*    | ❌    |
| Variants   | Delete    | ✅    | ✅*    | ❌    |
| Inventory  | View      | ✅    | ✅*    | ❌    |
| Inventory  | Update    | ✅    | ✅*    | ❌    |
| Reports    | View      | ✅    | ✅*    | ❌    |
| Users      | View      | ✅    | ❌     | ❌    |
| Users      | Create    | ✅    | ❌     | ❌    |
| Users      | Update    | ✅    | ❌     | ❌    |
| Users      | Delete    | ✅    | ❌     | ❌    |

*Seller permissions are limited to their own resources.

## Ownership Checks

For resources that sellers can manage, the system implements ownership checks to ensure sellers can only modify their own resources:

1. **Products**: A seller can only update, delete, or create variants for products they have created.
2. **Variants**: A seller can only update or delete variants of products they own.
3. **Inventory**: A seller can only update inventory for their own products or variants.

## Implementation Details

### Permission Middleware

The permission system is implemented using middleware that checks user roles and resource ownership:

1. `checkPermission(resource, action)`: Verifies if the user's role has permission to perform the specified action on the resource.
2. `checkOwnership(model, paramIdField, userIdField)`: For sellers, verifies that they own the resource they're attempting to modify.

### Authentication Flow

1. Users authenticate with email and password credentials.
2. Upon successful authentication, a JWT token is issued containing the user's ID and role.
3. Protected routes use the `protect` middleware to verify the JWT token and attach the user information to the request.
4. The permission middleware then checks if the authenticated user has the necessary permissions for the requested operation.

### Resource Controllers

Controllers implement additional logic to enforce permissions:

1. **Category Controller**: Only admins can create, update, or delete categories. All users can view categories.
2. **Product Controller**: Admins can manage all products. Sellers can create products and manage their own products. Buyers can only view products.
3. **Variant Controller**: Access to variants follows the same pattern as products. Sellers can only manage variants of their own products.
4. **Inventory Controller**: Inventory management is restricted to admins and the product owner (seller).

## Accessing Protected Resources

To access protected resources, clients must:

1. Authenticate to obtain a JWT token.
2. Include the token in the Authorization header of subsequent requests:
   ```
   Authorization: Bearer <token>
   ```

## Error Handling

When a user attempts to access a resource or perform an action without proper permissions, the API returns:

- **403 Forbidden**: If the user's role doesn't have permission for the action.
- **404 Not Found**: For resources that exist but the user doesn't have permission to view (to avoid leaking information).

## Conclusion

This role-based permission system ensures that users can only access and modify resources appropriate for their role while maintaining security and data integrity throughout the application.