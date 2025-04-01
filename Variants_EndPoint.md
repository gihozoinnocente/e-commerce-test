# Product Variants API Endpoints

This document provides examples of request bodies and expected responses for the product variant endpoints.

## Get Product Variants

`GET /api/products/:id/variants`

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "productId": 1,
      "sku": "VAR-001",
      "name": "iPhone 13 - Blue",
      "price": 799.99,
      "discountType": "none",
      "discountValue": 0,
      "options": {
        "color": "Blue",
        "storage": "128GB"
      },
      "imageUrls": [
        "https://example.com/images/iphone-13-blue-1.jpg",
        "https://example.com/images/iphone-13-blue-2.jpg"
      ],
      "isActive": true,
      "createdAt": "2025-03-01T12:00:00.000Z",
      "updatedAt": "2025-03-26T12:00:00.000Z",
      "Inventory": {
        "quantity": 25,
        "lowStockThreshold": 10,
        "reservedQuantity": 3
      }
    },
    {
      "id": 2,
      "productId": 1,
      "sku": "VAR-002",
      "name": "iPhone 13 - Black",
      "price": 799.99,
      "discountType": "none",
      "discountValue": 0,
      "options": {
        "color": "Black",
        "storage": "128GB"
      },
      "imageUrls": [
        "https://example.com/images/iphone-13-black-1.jpg",
        "https://example.com/images/iphone-13-black-2.jpg"
      ],
      "isActive": true,
      "createdAt": "2025-03-01T12:00:00.000Z",
      "updatedAt": "2025-03-26T12:00:00.000Z",
      "Inventory": {
        "quantity": 18,
        "lowStockThreshold": 10,
        "reservedQuantity": 2
      }
    },
    {
      "id": 3,
      "productId": 1,
      "sku": "VAR-003",
      "name": "iPhone 13 - Red",
      "price": 799.99,
      "discountType": "fixed",
      "discountValue": 50,
      "options": {
        "color": "Red",
        "storage": "128GB"
      },
      "imageUrls": [
        "https://example.com/images/iphone-13-red-1.jpg",
        "https://example.com/images/iphone-13-red-2.jpg"
      ],
      "isActive": true,
      "createdAt": "2025-03-01T12:00:00.000Z",
      "updatedAt": "2025-03-26T12:00:00.000Z",
      "Inventory": {
        "quantity": 30,
        "lowStockThreshold": 10,
        "reservedQuantity": 0
      }
    }
  ]
}
```

#### Not Found (404)

```json
{
  "success": false,
  "error": {
    "message": "Product not found"
  }
}
```

## Create Product Variant

`POST /api/products/:id/variants`

### Request Body

```json
{
  "sku": "VAR-004",
  "name": "iPhone 13 - Green",
  "price": 849.99,
  "discountType": "percentage",
  "discountValue": 10,
  "options": {
    "color": "Green",
    "storage": "256GB"
  },
  "imageUrls": [
    "https://example.com/images/iphone-13-green-1.jpg",
    "https://example.com/images/iphone-13-green-2.jpg"
  ],
  "isActive": true,
  "inventory": {
    "quantity": 15,
    "lowStockThreshold": 5,
    "reservedQuantity": 0,
    "location": "Warehouse A"
  }
}
```

### Expected Response

#### Success (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 4,
    "productId": 1,
    "sku": "VAR-004",
    "name": "iPhone 13 - Green",
    "price": 849.99,
    "discountType": "percentage",
    "discountValue": 10,
    "options": {
      "color": "Green",
      "storage": "256GB"
    },
    "imageUrls": [
      "https://example.com/images/iphone-13-green-1.jpg",
      "https://example.com/images/iphone-13-green-2.jpg"
    ],
    "isActive": true,
    "createdAt": "2025-03-26T12:00:00.000Z",
    "updatedAt": "2025-03-26T12:00:00.000Z",
    "Inventory": {
      "quantity": 15,
      "lowStockThreshold": 5,
      "reservedQuantity": 0
    }
  }
}
```

#### Not Found (404)

```json
{
  "success": false,
  "error": {
    "message": "Product not found"
  }
}
```

#### Unauthorized (403)

```json
{
  "success": false,
  "error": {
    "message": "You are not authorized to add variants to this product"
  }
}
```

#### Bad Request (400)

```json
{
  "success": false,
  "error": {
    "message": "SKU is already in use"
  }
}
```

## Update Product Variant

`PUT /api/products/:productId/variants/:id`

### Request Body

```json
{
  "sku": "VAR-004-UPDATED",
  "name": "iPhone 13 - Forest Green",
  "price": 899.99,
  "discountType": "percentage",
  "discountValue": 15,
  "options": {
    "color": "Forest Green",
    "storage": "256GB",
    "special": "Limited Edition"
  },
  "imageUrls": [
    "https://example.com/images/iphone-13-forest-green-1.jpg",
    "https://example.com/images/iphone-13-forest-green-2.jpg"
  ],
  "isActive": true,
  "inventory": {
    "quantity": 20,
    "lowStockThreshold": 8,
    "reservedQuantity": 2,
    "location": "Warehouse B"
  }
}
```

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 4,
    "productId": 1,
    "sku": "VAR-004-UPDATED",
    "name": "iPhone 13 - Forest Green",
    "price": 899.99,
    "discountType": "percentage",
    "discountValue": 15,
    "options": {
      "color": "Forest Green",
      "storage": "256GB",
      "special": "Limited Edition"
    },
    "imageUrls": [
      "https://example.com/images/iphone-13-forest-green-1.jpg",
      "https://example.com/images/iphone-13-forest-green-2.jpg"
    ],
    "isActive": true,
    "createdAt": "2025-03-26T12:00:00.000Z",
    "updatedAt": "2025-03-26T12:30:00.000Z",
    "Inventory": {
      "quantity": 20,
      "lowStockThreshold": 8,
      "reservedQuantity": 2
    }
  }
}
```

#### Not Found (404)

```json
{
  "success": false,
  "error": {
    "message": "Product not found"
  }
}
```

```json
{
  "success": false,
  "error": {
    "message": "Variant not found"
  }
}
```

#### Unauthorized (403)

```json
{
  "success": false,
  "error": {
    "message": "You are not authorized to update variants of this product"
  }
}
```

#### Bad Request (400)

```json
{
  "success": false,
  "error": {
    "message": "SKU is already in use"
  }
}
```

## Delete Product Variant

`DELETE /api/products/:productId/variants/:id`

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "data": {}
}
```

#### Not Found (404)

```json
{
  "success": false,
  "error": {
    "message": "Product not found"
  }
}
```

```json
{
  "success": false,
  "error": {
    "message": "Variant not found"
  }
}
```

#### Unauthorized (403)

```json
{
  "success": false,
  "error": {
    "message": "You are not authorized to delete variants of this product"
  }
}
```

## Notes

- Product variants are strongly tied to their parent product and require authorization checks
- Variants can have their own pricing, discounts, and inventory separate from the parent product
- Variant SKUs must be unique across the system
- The `options` field is a flexible JSON object that can contain any variant-specific attributes
- When updating inventory quantity for a variant, the `lastRestockDate` is automatically updated if the quantity increases
- Deleting a variant will also delete its associated inventory records
- Authentication is required for creating, updating, and deleting variants
- A user must be either an admin or the original seller of the product to modify its variants