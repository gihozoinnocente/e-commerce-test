# Inventory API Endpoints

This document provides examples of request bodies and expected responses for the inventory endpoints.

## Get All Inventory Items

`GET /api/inventory`

### Query Parameters (all optional)
- `sku`: Filter by SKU (partial match)
- `lowStock`: Set to "true" to show only low stock items
- `location`: Filter by location (partial match)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Field to sort by (default: "quantity", options: "sku", "quantity", "lowStockThreshold", "lastRestockDate")
- `sortOrder`: Sort direction (default: "ASC", options: "ASC", "DESC")

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "count": 50,
  "totalPages": 5,
  "currentPage": 1,
  "data": [
    {
      "id": 1,
      "sku": "INV-001",
      "quantity": 100,
      "lowStockThreshold": 20,
      "reservedQuantity": 5,
      "location": "Warehouse A",
      "lastRestockDate": "2025-03-15T10:00:00.000Z",
      "createdAt": "2025-03-01T12:00:00.000Z",
      "updatedAt": "2025-03-26T12:00:00.000Z",
      "Product": {
        "id": 1,
        "name": "iPhone 13",
        "sku": "PROD-001",
        "basePrice": 799.99,
        "isActive": true
      },
      "Variant": {
        "id": 1,
        "name": "iPhone 13 - Blue",
        "sku": "VAR-001",
        "price": 799.99,
        "isActive": true,
        "Product": {
          "id": 1,
          "name": "iPhone 13"
        }
      }
    },
    {
      "id": 2,
      "sku": "INV-002",
      "quantity": 50,
      "lowStockThreshold": 15,
      "reservedQuantity": 2,
      "location": "Warehouse B",
      "lastRestockDate": "2025-03-20T10:00:00.000Z",
      "createdAt": "2025-03-01T12:00:00.000Z",
      "updatedAt": "2025-03-26T12:00:00.000Z",
      "Product": {
        "id": 2,
        "name": "Samsung Galaxy S22",
        "sku": "PROD-002",
        "basePrice": 749.99,
        "isActive": true
      },
      "Variant": null
    }
  ]
}
```

#### Error (500 Internal Server Error)

Error handling is delegated to the error middleware (next(error)).

## Get Inventory by ID

`GET /api/inventory/:id`

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "sku": "INV-001",
    "quantity": 100,
    "lowStockThreshold": 20,
    "reservedQuantity": 5,
    "location": "Warehouse A",
    "lastRestockDate": "2025-03-15T10:00:00.000Z",
    "createdAt": "2025-03-01T12:00:00.000Z",
    "updatedAt": "2025-03-26T12:00:00.000Z",
    "Product": {
      "id": 1,
      "name": "iPhone 13",
      "sku": "PROD-001",
      "basePrice": 799.99,
      "isActive": true
    },
    "Variant": {
      "id": 1,
      "name": "iPhone 13 - Blue",
      "sku": "VAR-001",
      "price": 799.99,
      "isActive": true,
      "Product": {
        "id": 1,
        "name": "iPhone 13"
      }
    }
  }
}
```

#### Not Found (404)

```json
{
  "success": false,
  "error": {
    "message": "Inventory record not found"
  }
}
```

## Update Inventory

`PUT /api/inventory/:id`

### Request Body

```json
{
  "quantity": 150,
  "lowStockThreshold": 25,
  "reservedQuantity": 10,
  "location": "Warehouse C"
}
```

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "sku": "INV-001",
    "quantity": 150,
    "lowStockThreshold": 25,
    "reservedQuantity": 10,
    "location": "Warehouse C",
    "lastRestockDate": "2025-03-26T12:00:00.000Z",
    "createdAt": "2025-03-01T12:00:00.000Z",
    "updatedAt": "2025-03-26T12:00:00.000Z",
    "Product": {
      "id": 1,
      "name": "iPhone 13",
      "sku": "PROD-001",
      "basePrice": 799.99,
      "isActive": true
    },
    "Variant": {
      "id": 1,
      "name": "iPhone 13 - Blue",
      "sku": "VAR-001",
      "price": 799.99,
      "isActive": true,
      "Product": {
        "id": 1,
        "name": "iPhone 13"
      }
    }
  }
}
```

#### Not Found (404)

```json
{
  "success": false,
  "error": {
    "message": "Inventory record not found"
  }
}
```

## Get Low Stock Items

`GET /api/inventory/low-stock`

### Query Parameters (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "count": 15,
  "totalPages": 2,
  "currentPage": 1,
  "data": [
    {
      "id": 3,
      "sku": "INV-003",
      "quantity": 5,
      "lowStockThreshold": 10,
      "reservedQuantity": 1,
      "location": "Warehouse A",
      "lastRestockDate": "2025-03-10T10:00:00.000Z",
      "createdAt": "2025-03-01T12:00:00.000Z",
      "updatedAt": "2025-03-26T12:00:00.000Z",
      "Product": {
        "id": 3,
        "name": "iPad Pro",
        "sku": "PROD-003",
        "basePrice": 1099.99,
        "isActive": true
      },
      "Variant": null
    },
    {
      "id": 4,
      "sku": "INV-004",
      "quantity": 8,
      "lowStockThreshold": 15,
      "reservedQuantity": 2,
      "location": "Warehouse B",
      "lastRestockDate": "2025-03-12T10:00:00.000Z",
      "createdAt": "2025-03-01T12:00:00.000Z",
      "updatedAt": "2025-03-26T12:00:00.000Z",
      "Product": {
        "id": 4,
        "name": "MacBook Pro",
        "sku": "PROD-004",
        "basePrice": 1299.99,
        "isActive": true
      },
      "Variant": null
    }
  ]
}
```

## Get Out of Stock Items

`GET /api/inventory/out-of-stock`

### Query Parameters (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "count": 8,
  "totalPages": 1,
  "currentPage": 1,
  "data": [
    {
      "id": 5,
      "sku": "INV-005",
      "quantity": 0,
      "lowStockThreshold": 5,
      "reservedQuantity": 0,
      "location": "Warehouse A",
      "lastRestockDate": "2025-03-05T10:00:00.000Z",
      "createdAt": "2025-03-01T12:00:00.000Z",
      "updatedAt": "2025-03-26T12:00:00.000Z",
      "Product": {
        "id": 5,
        "name": "AirPods Pro",
        "sku": "PROD-005",
        "basePrice": 249.99,
        "isActive": true
      },
      "Variant": null
    },
    {
      "id": 6,
      "sku": "INV-006",
      "quantity": 0,
      "lowStockThreshold": 10,
      "reservedQuantity": 0,
      "location": "Warehouse B",
      "lastRestockDate": "2025-03-08T10:00:00.000Z",
      "createdAt": "2025-03-01T12:00:00.000Z",
      "updatedAt": "2025-03-26T12:00:00.000Z",
      "Product": {
        "id": 6,
        "name": "Apple Watch",
        "sku": "PROD-006",
        "basePrice": 399.99,
        "isActive": true
      },
      "Variant": null
    }
  ]
}
```

## Update Inventory Quantity (Batch Update)

`PATCH /api/inventory/update-quantity`

### Request Body

```json
{
  "updates": [
    {
      "id": 1,
      "quantity": 200,
      "notes": "Restocked from supplier"
    },
    {
      "id": 2,
      "quantity": 75,
      "notes": "Adjusted after inventory audit"
    },
    {
      "id": 999,
      "quantity": 50,
      "notes": "This ID doesn't exist"
    }
  ]
}
```

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "success": true,
      "oldQuantity": 100,
      "newQuantity": 200,
      "notes": "Restocked from supplier"
    },
    {
      "id": 2,
      "success": true,
      "oldQuantity": 50,
      "newQuantity": 75,
      "notes": "Adjusted after inventory audit"
    },
    {
      "id": 999,
      "success": false,
      "message": "Inventory record not found"
    }
  ]
}
```

#### Bad Request (400)

```json
{
  "success": false,
  "error": {
    "message": "Updates must be a non-empty array"
  }
}
```

## Notes

- The inventory controller uses transactions for batch updates to ensure data integrity
- When increasing quantity, the lastRestockDate is automatically updated
- The lowStock filter returns items where quantity is less than or equal to lowStockThreshold but greater than 0
- The out-of-stock endpoint returns items where quantity is exactly 0
- All endpoints support pagination
- The inventory records include related Product and Variant information