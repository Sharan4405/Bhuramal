# API Documentation

Complete reference for all REST API endpoints in the Bhuramal WhatsApp E-Commerce Chatbot system.

## Base URL

- **Development**: `http://localhost:4000`
- **Production**: `https://your-domain.com`

## Authentication

Most admin-related endpoints require JWT authentication.

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Getting a Token

Use the login endpoint to obtain a JWT token:

```bash
POST /api/auth/login
```

## Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Products](#product-endpoints)
3. [Orders](#order-endpoints)
4. [Conversations](#conversation-endpoints)
5. [Messages](#message-endpoints)
6. [Webhooks](#webhook-endpoints)
7. [Health Check](#health-check)
8. [Error Responses](#error-responses)

---

## Authentication Endpoints

### Login

Authenticate an admin user and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Authentication:** None

**Request Body:**
```json
{
  "username": "admin",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@bhuramal.com"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing username or password
- `401 Unauthorized` - Invalid credentials

**Example:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!"
  }'
```

### Register (First Admin)

Create the first admin account (typically done during setup).

**Endpoint:** `POST /api/auth/register`

**Authentication:** None (disable in production after first admin)

**Request Body:**
```json
{
  "username": "admin",
  "password": "SecurePassword123!",
  "email": "admin@bhuramal.com"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@bhuramal.com"
  }
}
```

### Logout

Invalidate the current JWT token (client-side token removal).

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Product Endpoints

### Get All Products

Retrieve a list of all products with optional filtering.

**Endpoint:** `GET /api/products`

**Authentication:** None

**Query Parameters:**
- `search` (optional) - Search products by name or description
- `category` (optional) - Filter by category
- `inStock` (optional) - Filter by stock availability (true/false)
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 25,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Premium Tea",
      "description": "High quality Assam tea",
      "price": 250,
      "category": "Beverages",
      "stock": 100,
      "imageUrl": "https://example.com/tea.jpg",
      "inStock": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T15:45:00.000Z"
    }
  ]
}
```

**Example:**
```bash
# Get all products
curl http://localhost:4000/api/products

# Search and filter
curl "http://localhost:4000/api/products?search=tea&category=Beverages&inStock=true"
```

### Get Product Categories

Get a list of all unique product categories.

**Endpoint:** `GET /api/products/categories`

**Authentication:** None

**Success Response (200 OK):**
```json
{
  "success": true,
  "categories": [
    "Beverages",
    "Snacks",
    "Groceries",
    "Spices"
  ]
}
```

**Example:**
```bash
curl http://localhost:4000/api/products/categories
```

### Create Product

Add a new product to the catalog.

**Endpoint:** `POST /api/products`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Premium Coffee",
  "description": "Arabica blend coffee beans",
  "price": 450,
  "category": "Beverages",
  "stock": 50,
  "imageUrl": "https://example.com/coffee.jpg"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Premium Coffee",
    "description": "Arabica blend coffee beans",
    "price": 450,
    "category": "Beverages",
    "stock": 50,
    "imageUrl": "https://example.com/coffee.jpg",
    "inStock": true,
    "createdAt": "2024-01-21T10:00:00.000Z",
    "updatedAt": "2024-01-21T10:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Coffee",
    "description": "Arabica blend coffee beans",
    "price": 450,
    "category": "Beverages",
    "stock": 50
  }'
```

### Update Product

Update an existing product.

**Endpoint:** `PUT /api/products/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - Product MongoDB ObjectId

**Request Body:**
```json
{
  "name": "Premium Coffee (Updated)",
  "price": 499,
  "stock": 75
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Premium Coffee (Updated)",
    "price": 499,
    "stock": 75,
    "updatedAt": "2024-01-22T11:30:00.000Z"
  }
}
```

### Delete Product

Remove a product from the catalog.

**Endpoint:** `DELETE /api/products/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - Product MongoDB ObjectId

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Bulk Update Stock

Update stock levels for multiple products at once.

**Endpoint:** `PATCH /api/products/bulk/stock`

**Authentication:** Required

**Request Body:**
```json
{
  "updates": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "stock": 150
    },
    {
      "productId": "507f1f77bcf86cd799439012",
      "stock": 200
    }
  ]
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Stock updated for 2 products",
  "updated": 2
}
```

---

## Order Endpoints

### Get All Orders

Retrieve orders with filtering, sorting, and pagination.

**Endpoint:** `GET /api/orders`

**Authentication:** Required

**Query Parameters:**
- `search` (optional) - Search by order ID or customer phone
- `status` (optional) - Filter by status: `pending`, `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`
- `startDate` (optional) - Filter orders after this date (ISO format)
- `endDate` (optional) - Filter orders before this date (ISO format)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `sortBy` (optional, default: `createdAt`) - Sort field
- `sortOrder` (optional, default: `desc`) - Sort direction

**Success Response (200 OK):**
```json
{
  "success": true,
  "page": 1,
  "limit": 20,
  "totalOrders": 150,
  "totalPages": 8,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "orderId": "BBP-20240121-001",
      "customerPhone": "+919876543210",
      "customerName": "John Doe",
      "items": [
        {
          "productId": "507f1f77bcf86cd799439011",
          "name": "Premium Tea",
          "quantity": 2,
          "price": 250,
          "subtotal": 500
        }
      ],
      "subtotal": 500,
      "tax": 45,
      "deliveryCharge": 50,
      "total": 595,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "razorpay",
      "deliveryAddress": "123 Main St, City",
      "createdAt": "2024-01-21T14:30:00.000Z",
      "updatedAt": "2024-01-21T14:30:00.000Z"
    }
  ]
}
```

**Example:**
```bash
# Get all orders
curl http://localhost:4000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by status and date
curl "http://localhost:4000/api/orders?status=pending&startDate=2024-01-01&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Order Statistics

Get aggregated order statistics.

**Endpoint:** `GET /api/orders/stats`

**Authentication:** Required

**Query Parameters:**
- `startDate` (optional) - Start date for statistics
- `endDate` (optional) - End date for statistics

**Success Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 250,
    "totalRevenue": 125000,
    "averageOrderValue": 500,
    "ordersByStatus": {
      "pending": 15,
      "confirmed": 20,
      "preparing": 10,
      "out_for_delivery": 5,
      "delivered": 195,
      "cancelled": 5
    },
    "recentOrders": 45,
    "todayOrders": 12,
    "todayRevenue": 6500
  }
}
```

### Get Order by ID

Retrieve details of a specific order.

**Endpoint:** `GET /api/orders/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - Order MongoDB ObjectId or orderId (BBP-YYYYMMDD-XXX)

**Success Response (200 OK):**
```json
{
  "success": true,
  "order": {
    "_id": "507f1f77bcf86cd799439013",
    "orderId": "BBP-20240121-001",
    "customerPhone": "+919876543210",
    "customerName": "John Doe",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "Premium Tea",
        "quantity": 2,
        "price": 250,
        "subtotal": 500
      }
    ],
    "subtotal": 500,
    "tax": 45,
    "deliveryCharge": 50,
    "total": 595,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "razorpay",
    "deliveryAddress": "123 Main St, City",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-01-21T14:30:00.000Z",
        "note": "Order placed"
      }
    ],
    "createdAt": "2024-01-21T14:30:00.000Z",
    "updatedAt": "2024-01-21T14:30:00.000Z"
  }
}
```

### Update Order Status

Change the status of an order.

**Endpoint:** `PATCH /api/orders/:id/status`

**Authentication:** Required

**URL Parameters:**
- `id` - Order MongoDB ObjectId

**Request Body:**
```json
{
  "status": "confirmed",
  "note": "Order confirmed by admin"
}
```

**Valid Status Values:**
- `pending`
- `confirmed`
- `preparing`
- `out_for_delivery`
- `delivered`
- `cancelled`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Order status updated to confirmed",
  "order": {
    "_id": "507f1f77bcf86cd799439013",
    "orderId": "BBP-20240121-001",
    "status": "confirmed",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-01-21T14:30:00.000Z"
      },
      {
        "status": "confirmed",
        "timestamp": "2024-01-21T15:00:00.000Z",
        "note": "Order confirmed by admin"
      }
    ]
  }
}
```

### Update Order

Update order details (items, address, etc.).

**Endpoint:** `PUT /api/orders/:id`

**Authentication:** Required

**Request Body:**
```json
{
  "deliveryAddress": "456 New Address, City",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 3
    }
  ]
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Order updated successfully",
  "order": { /* updated order object */ }
}
```

### Delete Order

Soft delete or permanently delete an order.

**Endpoint:** `DELETE /api/orders/:id`

**Authentication:** Required

**Query Parameters:**
- `permanent` (optional, default: false) - Permanently delete if true

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

---

## Conversation Endpoints

### Get All Conversations

Retrieve all customer conversations.

**Endpoint:** `GET /api/conversations`

**Authentication:** Required

**Query Parameters:**
- `status` (optional) - Filter by status: `active`, `resolved`
- `search` (optional) - Search by customer phone or name
- `page` (optional) - Page number
- `limit` (optional) - Items per page

**Success Response (200 OK):**
```json
{
  "success": true,
  "conversations": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "customerPhone": "+919876543210",
      "customerName": "John Doe",
      "status": "active",
      "lastMessage": "Can I track my order?",
      "lastMessageAt": "2024-01-21T16:30:00.000Z",
      "unreadCount": 2,
      "assignedOrder": "507f1f77bcf86cd799439013",
      "createdAt": "2024-01-21T14:00:00.000Z"
    }
  ]
}
```

### Get Conversation Messages

Retrieve all messages for a specific conversation.

**Endpoint:** `GET /api/conversations/:id/messages`

**Authentication:** Required

**URL Parameters:**
- `id` - Conversation MongoDB ObjectId

**Query Parameters:**
- `limit` (optional, default: 50) - Number of messages
- `before` (optional) - Get messages before this timestamp

**Success Response (200 OK):**
```json
{
  "success": true,
  "conversationId": "507f1f77bcf86cd799439014",
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "conversationId": "507f1f77bcf86cd799439014",
      "messageId": "wamid.xxxxxxxxxxxx",
      "from": "+919876543210",
      "to": "+911234567890",
      "body": "Hi, I want to place an order",
      "direction": "inbound",
      "timestamp": "2024-01-21T14:00:00.000Z",
      "status": "delivered"
    },
    {
      "_id": "507f1f77bcf86cd799439016",
      "conversationId": "507f1f77bcf86cd799439014",
      "from": "+911234567890",
      "to": "+919876543210",
      "body": "Hello! Welcome to Bhuramal. Here's our menu...",
      "direction": "outbound",
      "timestamp": "2024-01-21T14:00:30.000Z",
      "status": "delivered"
    }
  ]
}
```

### Resolve Conversation

Mark a conversation as resolved.

**Endpoint:** `PATCH /api/conversations/:id/resolve`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Conversation marked as resolved",
  "conversation": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "resolved",
    "resolvedAt": "2024-01-21T17:00:00.000Z"
  }
}
```

### Reopen Conversation

Reopen a resolved conversation.

**Endpoint:** `PATCH /api/conversations/:id/reopen`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Conversation reopened",
  "conversation": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "active",
    "resolvedAt": null
  }
}
```

---

## Message Endpoints

### Send Message to User

Send a WhatsApp message to a customer from the admin dashboard.

**Endpoint:** `POST /api/messages/send`

**Authentication:** Required

**Request Body:**
```json
{
  "to": "+919876543210",
  "message": "Your order has been confirmed and is being prepared."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": "wamid.xxxxxxxxxxxx"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Phone number and message are required"
}
```

---

## Webhook Endpoints

### WhatsApp Webhook Verification

Verify WhatsApp webhook during setup.

**Endpoint:** `GET /webhook`

**Authentication:** None (verified via token)

**Query Parameters:**
- `hub.mode` - Should be "subscribe"
- `hub.verify_token` - Must match WHATSAPP_VERIFY_TOKEN
- `hub.challenge` - Random string to echo back

**Success Response (200 OK):**
Returns the `hub.challenge` value as plain text.

### WhatsApp Webhook Handler

Receive incoming WhatsApp messages and events.

**Endpoint:** `POST /webhook`

**Authentication:** Signature verification

**Request Body:** (WhatsApp API format)
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "919876543210",
                "id": "wamid.xxxxxxxxxxxx",
                "timestamp": "1642777200",
                "text": {
                  "body": "hi"
                },
                "type": "text"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Success Response (200 OK):**
```json
{
  "status": "ok"
}
```

### Razorpay Webhook

Receive payment notifications from Razorpay.

**Endpoint:** `POST /payment/webhook`

**Authentication:** Signature verification

**Request Body:** (Razorpay format)
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxxxxxxxxxxx",
        "amount": 59500,
        "currency": "INR",
        "status": "captured",
        "notes": {
          "orderId": "BBP-20240121-001"
        }
      }
    }
  }
}
```

**Success Response (200 OK):**
```json
{
  "status": "ok"
}
```

---

## Health Check

### Health Check Endpoint

Check if the server is running.

**Endpoint:** `GET /health`

**Authentication:** None

**Success Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-21T18:00:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

---

## Error Responses

All endpoints follow a consistent error response format.

### Error Format

```json
{
  "success": false,
  "error": "Detailed error message",
  "code": "ERROR_CODE" // optional
}
```

### Common HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request parameters
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict (e.g., duplicate)
- **422 Unprocessable Entity** - Validation error
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error

### Example Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "No token provided"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Product not found"
}
```

**422 Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "name": "Product name is required",
    "price": "Price must be a positive number"
  }
}
```

**429 Rate Limit:**
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Limit**: 150 requests per minute per IP address
- **Window**: 1 minute
- **Response**: 429 status code when exceeded
- **Headers**: Rate limit info in response headers
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Timestamp when limit resets

---

## Pagination

List endpoints support pagination with these parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Field to sort by (default varies by endpoint)
- `sortOrder` - `asc` or `desc` (default: desc)

**Example:**
```bash
curl "http://localhost:4000/api/orders?page=2&limit=10&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## WebSocket Events

The system uses Socket.io for real-time updates. Connect to the WebSocket server at the same base URL.

### Client → Server Events

**Join Admin Room:**
```javascript
socket.emit('join', { room: 'admin' });
```

### Server → Client Events

**New Order:**
```javascript
socket.on('newOrder', (order) => {
  console.log('New order received:', order);
});
```

**Order Update:**
```javascript
socket.on('orderUpdate', (order) => {
  console.log('Order status changed:', order);
});
```

**New Message:**
```javascript
socket.on('newMessage', (message) => {
  console.log('New message:', message);
});
```

**Conversation Update:**
```javascript
socket.on('conversationUpdate', (conversation) => {
  console.log('Conversation updated:', conversation);
});
```

---

## Best Practices

1. **Always use HTTPS** in production
2. **Store JWT tokens securely** (HttpOnly cookies recommended)
3. **Implement token refresh** for better security
4. **Handle rate limiting** gracefully with exponential backoff
5. **Validate input** on client side before sending requests
6. **Use appropriate HTTP methods** (GET, POST, PUT, PATCH, DELETE)
7. **Include error handling** for all API calls
8. **Log failed requests** for debugging
9. **Monitor API usage** and set up alerts
10. **Keep API documentation** up to date

---

## Example Integration

### Frontend API Client (Next.js)

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Usage example
export async function getOrders(filters = {}) {
  const params = new URLSearchParams(filters);
  return apiCall(`/api/orders?${params}`);
}

export async function updateOrderStatus(orderId: string, status: string) {
  return apiCall(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
```

---

## Support

For API issues or questions:
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Open an issue on GitHub
- Contact the development team

**Last Updated:** March 10, 2026
