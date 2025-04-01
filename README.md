# Product Catalog API

A RESTful API for a product catalog system that powers an e-commerce platform. This project allows businesses to manage their product offerings with features like product management, categorization, inventory tracking, reporting, and role-based access control.

## Features

- 📦 **Product Management**: Complete CRUD operations for products
- 🏷️ **Categorization**: Organize products into hierarchical categories
- 🔎 **Search & Filtering**: Find products by name, description, or other attributes
- 🔄 **Product Variants**: Support for different variants of products (sizes, colors, etc.)
- 📊 **Inventory Tracking**: Monitor stock levels for products and variants
- 💰 **Pricing & Discounts**: Support for base pricing and discount types
- 📈 **Reporting**: Generate insights about inventory status and product distribution
- 🔐 **Authentication**: Secure JWT-based authentication system
- 👥 **Role-Based Permissions**: Three distinct user roles (Admin, Seller, Buyer) with appropriate permissions
- 🛡️ **Rate Limiting**: Protection against abuse and DoS attacks
- 🖼️ **Image Handling**: Complete support for product images with multiple sizes
- ⚡ **Performance Optimizations**: Caching, compression, and query optimization

## Tech Stack

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **Sequelize** - ORM for MySQL
- **JWT** - Authentication mechanism
- **Redis** - Optional caching layer
- **Sharp** - Image processing library
- **Swagger** - API documentation

## User Roles and Permissions

The API implements three distinct user roles:

- **Admin**: Full access to all resources and operations.
- **Seller**: Can manage their own products and variants, view categories.
- **Buyer**: Read-only access to catalog data.

See [ROLE_PERMISSIONS.md](./ROLE_PERMISSIONS.md) for detailed information about role permissions.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- Redis (optional, for enhanced caching)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gihozoinnocente/product-catalog-api.git
   cd product-catalog-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables by creating a `.env` file based on the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database credentials and other settings.

5. Set up the database:
   ```bash
   # Create a database in MySQL
   mysql -u root -p -e "CREATE DATABASE product_catalog;"
   
   # The application will automatically create the tables when started in development mode
   ```

6. Start the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

7. Access the Swagger API documentation:
   ```
   http://localhost:3000/api-docs
   ```

## API Authentication

To access protected endpoints, you must include a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_token>
```

To obtain a token:

1. Register a new user: `POST /api/auth/register`
2. Login to get a token: `POST /api/auth/login`


## Database Schema

The application uses the following main data models:

- **Users**: Authentication and role-based access control
- **Categories**: Hierarchical organization of products
- **Products**: Core product information with seller association
- **Variants**: Variations of products (sizes, colors, etc.)
- **Inventory**: Stock management for products and variants

## API Endpoints

### Authentication

| Method | Endpoint                       | Description              | Access     |
|--------|--------------------------------|--------------------------|------------|
| POST   | /api/auth/register             | Register a new user      | Public     |
| POST   | /api/auth/login                | User login               | Public     |
| GET    | /api/auth/me                   | Get current user profile | All Users  |
| PUT    | /api/auth/update-details       | Update user details      | All Users  |
| PUT    | /api/auth/update-password      | Update password          | All Users  |
| POST   | /api/auth/forgot-password      | Request password reset   | Public     |
| POST   | /api/auth/reset-password/:token| Reset password           | Public     |

### Products

| Method | Endpoint                           | Description                       | Access               |
|--------|-----------------------------------|-----------------------------------|----------------------|
| GET    | /api/products                     | Get all products                  | All Users            |
| GET    | /api/products/:id                 | Get product by ID                 | All Users            |
| POST   | /api/products                     | Create a new product              | Admin, Seller        |
| PUT    | /api/products/:id                 | Update a product                  | Admin, Product Owner |
| DELETE | /api/products/:id                 | Delete a product                  | Admin, Product Owner |
| GET    | /api/products/search              | Search products                   | All Users            |
| GET    | /api/products/:id/variants        | Get variants of a product         | All Users            |
| POST   | /api/products/:id/variants        | Create a variant for a product    | Admin, Product Owner |
| PUT    | /api/products/:id/variants/:id    | Update a product variant          | Admin, Product Owner |
| DELETE | /api/products/:id/variants/:id    | Delete a product variant          | Admin, Product Owner |

### Categories

| Method | Endpoint                   | Description                  | Access     |
|--------|---------------------------|------------------------------|------------|
| GET    | /api/categories           | Get all categories           | All Users  |
| GET    | /api/categories/:id       | Get category by ID           | All Users  |
| GET    | /api/categories/tree      | Get category hierarchy tree  | All Users  |
| POST   | /api/categories           | Create a new category        | Admin      |
| PUT    | /api/categories/:id       | Update a category            | Admin      |
| DELETE | /api/categories/:id       | Delete a category            | Admin      |

### Inventory

| Method | Endpoint                         | Description                        | Access               |
|--------|---------------------------------|------------------------------------|----------------------|
| GET    | /api/inventory                  | Get all inventory items            | Admin, Seller        |
| GET    | /api/inventory/:id              | Get inventory by ID                | Admin, Product Owner |
| PUT    | /api/inventory/:id              | Update inventory                   | Admin, Product Owner |
| GET    | /api/inventory/low-stock        | Get low stock items                | Admin, Seller        |
| GET    | /api/inventory/out-of-stock     | Get out of stock items             | Admin, Seller        |
| PATCH  | /api/inventory/update-quantity  | Batch update inventory quantities  | Admin, Product Owner |

### Reports

| Method | Endpoint                             | Description                         | Access         |
|--------|-------------------------------------|-------------------------------------|----------------|
| GET    | /api/reports/inventory-status       | Get inventory status report         | Admin, Seller  |
| GET    | /api/reports/category-distribution  | Get product category distribution   | Admin, Seller  |
| GET    | /api/reports/low-stock-alert        | Get low stock items by category     | Admin, Seller  |

### Search

| Method | Endpoint                           | Description                       | Access     |
|--------|-----------------------------------|-----------------------------------|------------|
| GET    | /api/search/products              | Advanced search with filters      | All Users  |
| GET    | /api/search/fulltext              | Full-text search                  | All Users  |
| GET    | /api/search/suggestions/:productId| Get product suggestions           | All Users  |
| GET    | /api/search/trending              | Get trending products             | All Users  |

### Images

| Method | Endpoint                               | Description                     | Access               |
|--------|-----------------------------------------|---------------------------------|----------------------|
| POST   | /api/images/products/:productId        | Upload product images           | Admin, Product Owner |
| POST   | /api/images/variants/:variantId        | Upload variant images           | Admin, Product Owner |
| DELETE | /api/images/products/:productId/:index | Delete product image            | Admin, Product Owner |
| POST   | /api/images/responsive                 | Generate responsive image URLs  | All Users            |

## Request Body and Response

See [Auth_EndPoint.md](./Auth_EndPoint.md) for detailed information about request body and expected result.
See [Product_EndPoint.md](./Product_EndPoint.md) for detailed information about request body and expected result.
See [Category_EndPoint.md](./Category_EndPoint.md) for detailed information about request body and expected result.
See [Inventory_EndPoint.md](./Inventory_EndPoint.md) for detailed information about request body and expected result.
See [Variants_EndPoint.md](./Variants_EndPoint.md) for detailed information about request body and expected result.

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Server Error

Error responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Specific error for this field"
      }
    ]
  }
}
```

## Testing

Run the automated tests:

```bash
npm test
```

You can also test the API manually using tools like:
- Postman
- cURL
- VS Code's REST Client extension


## License

This project is licensed under the MIT License - see the LICENSE file for details.