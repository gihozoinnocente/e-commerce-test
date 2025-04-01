# Product API Endpoints

This document provides examples of request bodies and expected responses for the product endpoints.

## Create Product

`POST /api/products` (assuming the route is configured this way)

### Request Body

```json
{
  "name": "Smartphone X",
  "description": "Latest model with advanced features",
  "sku": "SM-X-001",
  "basePrice": 600,
  "discountType": "percentage",
  "discountValue": 10,
  "categoryId": 1,
  "tags": [
    "smartphone,electronics,new"
  ],
  "imageUrls": [
     "https://example.com/images/smartphone-x-1.jpg",
    "https://example.com/images/smartphone-x-2.jpg"
  ],
  "attributes": {
      "color": "Black",
      "storage": "128GB",
      "screen": "6.5 inch"
  },
  "isActive": true,
  "isFeatured": true,
  "inventory": {
    "quantity": 0,
    "lowStockThreshold": 0,
    "reservedQuantity": 0,
    "location": "string"
  }
}
```

### Expected Response

#### Success (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Smartphone X",
    "description": "Latest model with advanced features",
    "sku": "SM-X-001",
    "basePrice": 799.99,
    "discountType": "percentage",
    "discountValue": 10,
    "categoryId": 2,
    "userId": 3,
    "tags": "smartphone,electronics,new",
    "imageUrls": [
      "https://example.com/images/smartphone-x-1.jpg",
      "https://example.com/images/smartphone-x-2.jpg"
    ],
    "attributes": {
      "color": "Black",
      "storage": "128GB",
      "screen": "6.5 inch"
    },
    "isActive": true,
    "isFeatured": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Error (500 Internal Server Error)

```json
{
  "message": "Some Internal error while storing the product!"
}
```

## Get All Products

`GET /api/products`

### Query Parameters (all optional)
- `name`: Filter by product name
- `minPrice`: Filter products with cost greater than or equal to this value
- `maxPrice`: Filter products with cost less than or equal to this value

### Expected Response

#### Success (200 OK)

```json
[
  {
    "id": 1,
    "name": "iPhone 13",
    "description": "Apple iPhone 13 with A15 Bionic chip",
    "cost": 799.99,
    "categoryId": 1,
    "createdAt": "2025-03-26T12:00:00.000Z",
    "updatedAt": "2025-03-26T12:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Samsung Galaxy S22",
    "description": "Samsung flagship smartphone",
    "cost": 749.99,
    "categoryId": 1,
    "createdAt": "2025-03-26T12:00:00.000Z",
    "updatedAt": "2025-03-26T12:00:00.000Z"
  }
]
```

#### Error (500 Internal Server Error)

```json
{
  "message": "Some Internal error while fetching all the products"
}
```

## Get Product by ID

`GET /api/products/:id`

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "data": {
    "tags": [
      "smartphone",
      "electronics",
      "new"
    ],
    "imageUrls": [
      "https://example.com/images/smartphone-x-1.jpg",
      "https://example.com/images/smartphone-x-2.jpg"
    ],
    "attributes": {
      "color": "Black",
      "storage": "128GB",
      "screen": "6.5 inch"
    },
    "id": 9,
    "name": "Smartphone X",
    "description": "Latest model with advanced features",
    "sku": "SM-X-0101",
    "basePrice": "600.00",
    "discountType": "percentage",
    "discountValue": "10.00",
    "categoryId": 1,
    "userId": 1,
    "isActive": true,
    "isFeatured": true,
    "createdAt": "2025-03-26T13:45:22.000Z",
    "updatedAt": "2025-03-26T13:45:22.000Z",
    "Category": {
      "id": 1,
      "name": "Sandals",
      "parentId": null
    },
    "Variants": [],
    "Inventory": {
      "quantity": 0,
      "lowStockThreshold": 10,
      "reservedQuantity": 0
    },
    "seller": {
      "id": 1,
      "firstName": "Innocente",
      "lastName": "Gihozo"
    }
  }
}
```

#### Error (500 Internal Server Error)

```json
{
  "message": "Some Internal error while fetching the product based on the id"
}
```

## Update Product

`PUT /api/products/:id`

### Request Body

```json
{
  "name": "Smartphone X",
  "description": "Latest model with advanced features",
  "sku": "SM-X-0101",
  "basePrice": 600,
  "discountType": "percentage",
  "discountValue": 10,
  "categoryId": 1,
  "tags": [
    "smartphone,electronics,new"
  ],
  "imageUrls": [
     "https://example.com/images/smartphone-x-1.jpg",
    "https://example.com/images/smartphone-x-2.jpg"
  ],
  "attributes": {
      "color": "Black-red",
      "storage": "128GB",
      "screen": "6.5 inch"
  },
  "isActive": true,
  "isFeatured": true,
  "inventory": {
    "quantity": 0,
    "lowStockThreshold": 0,
    "reservedQuantity": 0,
    "location": "string"
  }
}
```

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "data": {
    "tags": [
      "smartphone",
      "electronics",
      "new"
    ],
    "imageUrls": [
      "https://example.com/images/smartphone-x-1.jpg",
      "https://example.com/images/smartphone-x-2.jpg"
    ],
    "attributes": {
      "color": "Black-red",
      "storage": "128GB",
      "screen": "6.5 inch"
    },
    "id": 9,
    "name": "Smartphone X",
    "description": "Latest model with advanced features",
    "sku": "SM-X-0101",
    "basePrice": "600.00",
    "discountType": "percentage",
    "discountValue": "10.00",
    "categoryId": 1,
    "userId": 1,
    "isActive": true,
    "isFeatured": true,
    "createdAt": "2025-03-26T13:45:22.000Z",
    "updatedAt": "2025-03-26T13:50:44.000Z",
    "Category": {
      "id": 1,
      "name": "Sandals"
    },
    "Inventory": {
      "quantity": 0,
      "lowStockThreshold": 0,
      "reservedQuantity": 0
    },
    "seller": {
      "id": 1,
      "firstName": "Innocente",
      "lastName": "Gihozo"
    }
  }
```

#### Error (500 Internal Server Error)

```json
{
  "message": "Some Internal error while fetching the product based on the id"
}
```

## Delete Product

`DELETE /api/products/:id`

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "data": {}
}
```

#### Error (500 Internal Server Error)

```json
{
  "message": "Some Internal error while deleting the product based on the id"
}
```

