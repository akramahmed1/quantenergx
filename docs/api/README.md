# QuantEnergx API Documentation

## Overview

The QuantEnergx API provides RESTful endpoints for trading operations, real-time data access, plugin management, and webhook integrations.

## Base URL

```
Development: http://localhost:3001/api/v1
Production: https://api.quantenergx.com/api/v1
```

## Authentication

All API requests require authentication using JWT tokens.

```http
Authorization: Bearer <your-jwt-token>
```

## Core Endpoints

### Health Check

Check system health and service status.

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-07-29T22:00:00.000Z",
    "version": "1.0.0",
    "services": {
      "rest_api": "online",
      "grpc_service": "online",
      "websocket": "online",
      "kafka": "online",
      "plugins": "online",
      "webhooks": "online"
    }
  },
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

## Plugin Management

### List Plugins

Get all available plugins and their status.

```http
GET /api/v1/plugins
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "market-data-provider",
      "type": "data_source",
      "version": "1.0.0",
      "enabled": true
    },
    {
      "name": "moving-average",
      "type": "analytics",
      "version": "1.0.0",
      "enabled": true
    }
  ],
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

### Execute Plugin

Execute a specific plugin with input data.

```http
POST /api/v1/plugins/{name}/execute
```

**Parameters:**
- `name` (path): Plugin name

**Request Body:**
```json
{
  "input": "plugin-specific data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": "plugin-specific output",
    "executionTime": 150,
    "timestamp": "2024-07-29T22:00:00.000Z"
  },
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

## Webhook Management

### List Webhook Types

Get all registered webhook types.

```http
GET /api/v1/webhooks
```

**Response:**
```json
{
  "success": true,
  "data": {
    "registeredTypes": [
      "market_data_provider",
      "compliance_service",
      "payment_processor",
      "scada_system",
      "iot_sensor",
      "ml_prediction_service"
    ]
  },
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

### Process Webhook

Process incoming webhook from external service.

```http
POST /api/v1/webhooks/{type}
```

**Parameters:**
- `type` (path): Webhook type

**Headers:**
```http
X-Webhook-Signature: sha256=<signature>
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "webhook-123",
  "source": "third_party",
  "data": {
    "event": "price_update",
    "commodity": "crude_oil",
    "price": 75.25
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "processed": true,
    "webhookId": "webhook-123"
  },
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

## WebSocket Statistics

### Connection Stats

Get WebSocket connection statistics.

```http
GET /api/v1/websocket/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connectedClients": 25,
    "rooms": [
      "trading-user123",
      "market-crude_oil",
      "orders-user456"
    ],
    "timestamp": "2024-07-29T22:00:00.000Z"
  },
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

## Trading Endpoints

### Create Order

Create a new trading order.

```http
POST /api/v1/trading/orders
```

**Request Body:**
```json
{
  "commodity": "crude_oil",
  "quantity": 1000,
  "price": 75.50,
  "side": "buy",
  "orderType": "limit"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-123",
    "status": "pending",
    "timestamp": "2024-07-29T22:00:00.000Z"
  }
}
```

### Get Orders

Retrieve user's orders.

```http
GET /api/v1/trading/orders
```

**Query Parameters:**
- `status` (optional): Filter by order status
- `commodity` (optional): Filter by commodity
- `limit` (optional): Number of orders to return

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-123",
      "commodity": "crude_oil",
      "quantity": 1000,
      "price": 75.50,
      "side": "buy",
      "status": "executed",
      "timestamp": "2024-07-29T22:00:00.000Z"
    }
  ]
}
```

## Market Data Endpoints

### Get Market Prices

Get current market prices for commodities.

```http
GET /api/v1/market/prices/{commodity}
```

**Parameters:**
- `commodity` (path): Commodity symbol

**Response:**
```json
{
  "success": true,
  "data": {
    "commodity": "crude_oil",
    "price": 75.25,
    "change": 0.75,
    "changePercent": 1.01,
    "volume": 125000,
    "timestamp": "2024-07-29T22:00:00.000Z"
  }
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Errors

#### Authentication Error
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

#### Rate Limit Error
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 15 minutes.",
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

#### Validation Error
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid input parameters",
  "details": [
    {
      "field": "quantity",
      "message": "Must be a positive number"
    }
  ],
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

## Rate Limiting

### Limits

- **Global**: 1000 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Trading**: 100 orders per minute per user

### Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1627689600
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get market data
const marketData = await api.get('/market/prices/crude_oil');

// Create order
const order = await api.post('/trading/orders', {
  commodity: 'crude_oil',
  quantity: 1000,
  price: 75.50,
  side: 'buy'
});

// Execute plugin
const result = await api.post('/plugins/moving-average/execute', {
  prices: [75.0, 75.1, 75.2, 75.3, 75.4]
});
```

### Python

```python
import requests

class QuantEnergxAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_market_data(self, commodity):
        response = requests.get(
            f'{self.base_url}/market/prices/{commodity}',
            headers=self.headers
        )
        return response.json()
    
    def create_order(self, order_data):
        response = requests.post(
            f'{self.base_url}/trading/orders',
            json=order_data,
            headers=self.headers
        )
        return response.json()

# Usage
api = QuantEnergxAPI('http://localhost:3001/api/v1', 'your-token')
market_data = api.get_market_data('crude_oil')
```

## Testing

### Postman Collection

Import the Postman collection for easy API testing:
- [Download Collection](./postman/quantenergx-api.json)

### API Testing

```bash
# Health check
curl -X GET http://localhost:3001/health

# Get plugins (with auth)
curl -X GET http://localhost:3001/api/v1/plugins \
  -H "Authorization: Bearer your-token"

# Execute plugin
curl -X POST http://localhost:3001/api/v1/plugins/moving-average/execute \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"prices": [75.0, 75.1, 75.2]}'
```

## Changelog

### v1.0.0 (Current)
- Initial API implementation
- Plugin management endpoints
- Webhook processing
- WebSocket statistics
- Real-time trading infrastructure

### Upcoming Features
- GraphQL endpoint
- Bulk operations
- Advanced filtering
- API versioning
- Enhanced security