# Category API Endpoints

This document provides examples of request bodies and expected responses for the category endpoints.

## Create Category

`POST /api/categories` (assuming the route is configured this way)

### Request Body

```json
{
   "name": "Electronics",
    "description": "Electronic devices and gadgets",
    "parentId": 1,
    "imageUrl": "https://example.com/images/electronics.jpg",
    "isActive": true,
}
```

### Expected Response

#### Success (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices and gadgets",
    "parentId": 1,
    "imageUrl": "https://example.com/images/electronics.jpg",
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```



## Get All Categories

`GET /api/categories`

### Query Parameters (optional)
- `parentId`: Filter by parentId 

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": 2,
      "name": "Dresses",
      "description": "Women Casual Dress",
      "imageUrl": "https://example.com/images/electronics.jpg",
      "isActive": true,
      "createdAt": "2025-03-25T10:05:49.000Z",
      "updatedAt": "2025-03-25T10:05:49.000Z",
      "parentId": null
    },
    {
      "id": 4,
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "imageUrl": "https://example.com/images/electronics.jpg",
      "isActive": true,
      "createdAt": "2025-03-26T14:01:05.000Z",
      "updatedAt": "2025-03-26T14:01:05.000Z",
      "parentId": null
    },
    {
      "id": 1,
      "name": "Sandals",
      "description": "Hand made Sandals",
      "imageUrl": "https://example.com/images/electronics.jpg",
      "isActive": true,
      "createdAt": "2025-03-25T08:50:19.000Z",
      "updatedAt": "2025-03-25T08:50:19.000Z",
      "parentId": null
    },
    {
      "id": 3,
      "name": "string",
      "description": "string",
      "imageUrl": "https://example.com/images/electronics.jpg",
      "isActive": true,
      "createdAt": "2025-03-26T13:57:56.000Z",
      "updatedAt": "2025-03-26T13:57:56.000Z",
      "parentId": null
    }
  ]
}
  
```

#### Error (500 Internal Server Error)

```json
{
  "message": "Some Internal error while fetching all the categories"
}
```

## Get Category by ID

`GET /api/categories/:id`

### Expected Response

#### Success (200 OK)

```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic devices and gadgets",
  "createdAt": "2025-03-26T12:00:00.000Z",
  "updatedAt": "2025-03-26T12:00:00.000Z"
}
```

#### Error (500 Internal Server Error)

```json
{
  "message": "Some Internal error while fetching the category based on the id"
}
```

## Update Category

`PUT /api/categories/:id`

### Request Body

```json
{
  "name": "Electronics gadget",
  "description": "Electronic devices and gadgets",
  "parentId": 0,
 "imageUrl": "https://example.com/images/electronics.jpg",
 "isActive": true
}
```

### Expected Response

#### Success (200 OK)

```json
	

{
  "success": true,
  "data": {
    "id": 4,
    "name": "Electronics gadget",
    "description": "Electronic devices and gadgets",
    "imageUrl": "https://example.com/images/electronics.jpg",
    "isActive": true,
    "createdAt": "2025-03-26T14:01:05.000Z",
    "updatedAt": "2025-03-26T14:01:05.000Z",
    "parentId": null
  }
}
```

#### Error (500 Internal Server Error)

```json
{
  "message": "Some Internal error while fetching the category based on the id"
}
```

## Delete Category

`DELETE /api/categories/:id`

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
  "message": "Some Internal error while deleting the category based on the id"
}
```
