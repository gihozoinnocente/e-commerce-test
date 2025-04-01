# Authentication API Endpoints

This document provides examples of request bodies and expected responses for the authentication endpoints.

## Signup Endpoint

`POST /api/auth/register` 

### Request Body

```json
{
  "firstName": "johndoe",
  "lastName": "johndoe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": ["admin", "seller,buyer"]  
}
```

### Expected Response

#### Success (201 Created)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzQyOTk1MTE3LCJleHAiOjE3NDMwODE1MTd9.H8iDcPAGweFTS_FsywaV0n3XTYR5au4y1os_ig4nGAg",
  "data": {
    "user": {
      "isActive": true,
      "id": 2,
      "email": "john.doe@example.com",
      "firstName": "johndoe",
      "lastName": "johndoe",
      "role": "admin",
      "updatedAt": "2025-03-26T13:18:37.241Z",
      "createdAt": "2025-03-26T13:18:37.241Z"
    }
  }
}
```

#### Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": {
    "message": "Error message details"
  }

}
```

#### Error (400 Bad request )
{
  "success": false,
  "error": {
    "message": "Unexpected token \n in JSON at position 123"
  }

}

## Signin Endpoint

`POST /api/auth/login` (assuming the route is configured this way)

### Request Body

```json
{
  "email": "johndoe@gmail.com",
  "password": "securePassword123"
}
```

### Expected Response

#### Success (200 OK)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzQyOTk0NDYwLCJleHAiOjE3NDMwODA4NjB9.qFLLgEKwJSeqbHDfx9Jg5wKQhAck6kGqtjUm8NWzvLU",
  "data": {
    "user": {
      "id": 2,
      "email": "john.doe@example.com",
      "firstName": "johndoe",
      "lastName": "johndoe",
      "role": "admin",
      "isActive": true,
      "lastLogin": "2025-03-26T13:07:40.983Z",
      "passwordResetToken": null,
      "passwordResetExpires": null,
      "createdAt": "2025-03-25T08:48:54.000Z",
      "updatedAt": "2025-03-26T13:07:40.984Z"
    }
  }
}
```

#### User Not Found (404 Not Found)

```json
{
  "message": "User Not found."
}
```

#### Invalid Password (401 Unauthorized)

```json
{
  "success": false,
  "error": {
    "message": "Incorrect email or password"
  }
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": {
    "message": "message details not found"
  }
}
```

## Notes

- The JWT token expires in 24 hours (86400 seconds)
- Passwords are hashed using bcrypt with a salt round of 8
- Role assignments use Sequelize's association methods