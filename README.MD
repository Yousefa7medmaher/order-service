# Order Service

A microservice for managing customer orders in an e-commerce application. Converts shopping carts into orders with comprehensive tracking and management features.

## Features

- ✅ Create orders from shopping cart
- ✅ Order tracking with unique order numbers
- ✅ Multiple order statuses (pending, processing, shipped, delivered, cancelled)
- ✅ Payment method support (cash, credit card, debit card, PayPal)
- ✅ Shipping address management
- ✅ Order history with pagination
- ✅ Order cancellation for pending orders
- ✅ Admin order management
- ✅ Order statistics and analytics
- ✅ Automatic cart clearing after order creation
- ✅ JWT authentication integration

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Axios** - HTTP client for service communication
- **JWT** - Authentication

## Prerequisites

- Node.js v18+
- MongoDB
- Auth Service running
- Product Service running
- Cart Service running

## Installation

### 1. Clone and Install Dependencies

```bash
cd order-service
npm install
```

### 2. Environment Variables

Create `.env` file:

```env
PORT=3004
MONGODB_URI=mongodb://localhost:27017/order-service
AUTH_SERVICE_URL=http://localhost:5000/api/auth
PRODUCT_SERVICE_URL=http://localhost:3000/api/products
CART_SERVICE_URL=http://localhost:3003/api/cart
NODE_ENV=development
```

### 3. Run the Service

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### User Endpoints

#### Create Order from Cart
```http
POST /api/orders/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Cairo",
    "state": "Cairo",
    "zipCode": "11511",
    "country": "Egypt"
  },
  "paymentMethod": "credit_card",
  "notes": "Please deliver in the morning"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "orderNumber": "ORD-12345678-001",
    "userId": "user_id",
    "items": [
      {
        "productId": "product_id",
        "productName": "Product Name",
        "quantity": 2,
        "price": 1000,
        "subtotal": 2000
      }
    ],
    "totalAmount": 2000,
    "totalItems": 2,
    "status": "pending",
    "paymentStatus": "pending",
    "shippingAddress": { ... },
    "createdAt": "2025-12-18T10:30:00.000Z"
  }
}
```

#### Get My Orders
```http
GET /api/orders/my-orders?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by order status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "orders": [ ... ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 50
}
```

#### Get Order by ID
```http
GET /api/orders/:orderId
Authorization: Bearer <token>
```

#### Get Order by Order Number
```http
GET /api/orders/number/:orderNumber
Authorization: Bearer <token>
```

#### Cancel Order
```http
PATCH /api/orders/:orderId/cancel
Authorization: Bearer <token>
```

**Note:** Only pending orders can be cancelled.

### Admin Endpoints

#### Get All Orders
```http
GET /api/orders/admin/all?status=pending&userId=user_id&page=1&limit=10
Authorization: Bearer <admin_token>
```

#### Update Order Status
```http
PATCH /api/orders/admin/:orderId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "processing"
}
```

**Valid Statuses:**
- `pending`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

#### Get Order Statistics
```http
GET /api/orders/admin/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 150,
    "totalRevenue": 300000,
    "byStatus": [
      {
        "_id": "pending",
        "count": 20,
        "totalAmount": 40000
      },
      {
        "_id": "delivered",
        "count": 100,
        "totalAmount": 200000
      }
    ]
  }
}
```

## Order Lifecycle

```
┌─────────┐     ┌────────────┐     ┌─────────┐     ┌───────────┐
│ Pending │ --> │ Processing │ --> │ Shipped │ --> │ Delivered │
└─────────┘     └────────────┘     └─────────┘     └───────────┘
     │
     └──────> Cancelled
```

## Data Models

### Order Schema

```javascript
{
  orderNumber: String (auto-generated, unique),
  userId: String (required),
  userEmail: String,
  userName: String,
  items: [
    {
      productId: String (required),
      productName: String (required),
      quantity: Number (required, min: 1),
      price: Number (required),
      subtotal: Number (required)
    }
  ],
  totalAmount: Number (required),
  totalItems: Number (required),
  status: String (enum: pending, processing, shipped, delivered, cancelled),
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  paymentMethod: String (enum: cash, credit_card, debit_card, paypal),
  paymentStatus: String (enum: pending, paid, failed, refunded),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Order Number Format

Order numbers are automatically generated with the format: `ORD-TIMESTAMP-RANDOM`

Example: `ORD-12345678-123`

- `ORD`: Prefix
- `12345678`: Last 8 digits of timestamp
- `123`: 3-digit random number

## Service Integration

### Complete Order Flow

1. **User adds products to cart** (Cart Service)
2. **User initiates checkout** (Order Service)
3. **Order Service retrieves cart** (Cart Service)
4. **Validates cart is not empty**
5. **Creates order with cart items**
6. **Updates product stock** (Product Service) - Fire and forget
7. **Clears user's cart** (Cart Service)
8. **Returns order confirmation**

### Integration Architecture

```
┌─────────────┐
│ Auth Service│
└──────┬──────┘
       │ JWT Validation
       ↓
┌─────────────┐    Get Cart    ┌──────────────┐
│Order Service│ ←────────────→ │ Cart Service │
└──────┬──────┘                 └──────────────┘
       │
       │ Update Stock
       ↓
┌────────────────┐
│ Product Service│
└────────────────┘
```

## Error Handling

| Error | Status Code | Description |
|-------|-------------|-------------|
| No token provided | 401 | Missing authentication token |
| Unauthorized | 401 | Token verification failed |
| Access denied | 403 | Insufficient permissions |
| Cart is empty | 400 | No items in cart |
| Order not found | 404 | Order doesn't exist |
| Invalid status | 400 | Invalid order status |
| Cannot cancel | 400 | Order not in pending status |

## Testing

### Complete Test Scenario

```bash
TOKEN="your_jwt_token"

# 1. Add products to cart
curl -X POST http://localhost:3003/api/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"product_id","quantity":2}'

# 2. View cart
curl -X GET http://localhost:3003/api/cart \
  -H "Authorization: Bearer $TOKEN"

# 3. Create order
curl -X POST http://localhost:3004/api/orders/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Cairo",
      "state": "Cairo",
      "zipCode": "11511",
      "country": "Egypt"
    },
    "paymentMethod": "credit_card",
    "notes": "Call before delivery"
  }'

# 4. Get my orders
curl -X GET http://localhost:3004/api/orders/my-orders \
  -H "Authorization: Bearer $TOKEN"

# 5. Get order by number
curl -X GET http://localhost:3004/api/orders/number/ORD-12345678-001 \
  -H "Authorization: Bearer $TOKEN"

# 6. Cancel order (only if pending)
curl -X PATCH http://localhost:3004/api/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer $TOKEN"
```

### Admin Testing

```bash
ADMIN_TOKEN="admin_jwt_token"

# Get all orders
curl -X GET http://localhost:3004/api/orders/admin/all \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Update order status
curl -X PATCH http://localhost:3004/api/orders/admin/ORDER_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"processing"}'

# Get statistics
curl -X GET http://localhost:3004/api/orders/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Docker

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3004

CMD ["node", "src/server.js"]
```

### Docker Compose Integration

```yaml
order-service:
  build: ./order-service
  container_name: order-service
  ports:
    - "3004:3004"
  environment:
    - MONGODB_URI=mongodb://mongo-order:27017/order-db
    - AUTH_SERVICE_URL=http://auth-service:5000/api/auth
    - PRODUCT_SERVICE_URL=http://products-service:3000/api/products
    - CART_SERVICE_URL=http://cart-service:3003/api/cart
  depends_on:
    - mongo-order
    - auth-service
    - products-service
    - cart-service
  networks:
    - microservices-net
```

## Project Structure

```
order-service/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   └── order.model.js
│   ├── controllers/
│   │   └── order.controller.js
│   ├── routes/
│   │   └── order.routes.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── services/
│   │   ├── cart.service.js
│   │   └── product.service.js
│   └── server.js
├── .env
├── .dockerignore
├── Dockerfile
├── package.json
└── README.md
```

## Best Practices

1. **Order Number Generation**: Unique order numbers are auto-generated
2. **Cart Clearing**: Cart is automatically cleared after successful order
3. **Stock Updates**: Product stock is updated asynchronously (fire and forget)
4. **Status Validation**: Only valid status transitions are allowed
5. **Cancellation Rules**: Only pending orders can be cancelled
6. **Error Handling**: Comprehensive error handling with detailed logging
7. **Pagination**: All list endpoints support pagination

## Common Issues

### Issue: "Cart is empty"
- Add products to cart before creating order
- Verify Cart Service is running
- Check cart endpoint returns items

### Issue: "Failed to get cart"
- Ensure Cart Service URL is correct in environment variables
- Check Cart Service is running and accessible
- Verify network connectivity between services

### Issue: "Only pending orders can be cancelled"
- Orders can only be cancelled while in `pending` status
- Use admin endpoint to change status if needed

### Issue: "Order not found"
- Verify order ID or order number is correct
- Ensure user has permission to view the order
- Check order exists in database

## Performance Considerations

- **Pagination**: Use pagination for large order lists
- **Indexing**: Order number and userId are indexed for fast queries
- **Async Operations**: Stock updates are non-blocking
- **Error Recovery**: Cart clearing failure doesn't affect order creation

## Health Check

```bash
curl http://localhost:3004/health
```

**Response:**
```json
{
  "status": "OK",
  "service": "Order Service",
  "timestamp": "2025-12-18T10:30:00.000Z"
}
```

## Monitoring

Key metrics to monitor:
- Order creation rate
- Average order value
- Order status distribution
- Failed order attempts
- Service response times

## Security

- All endpoints require JWT authentication
- Admin endpoints require admin role
- Users can only access their own orders
- Sensitive operations are logged

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT

## Contact

For issues and questions, please open an issue in the repository.