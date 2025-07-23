# QuantEnergX API Specification

## Base URL
```
Production: https://api.quantenergx.com/v1
Development: http://localhost:8000/v1
```

## Authentication
All API endpoints require JWT authentication via Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Core Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout

### Trading
- `GET /trading/positions` - Get user positions
- `POST /trading/orders` - Create new trade order
- `GET /trading/orders/{id}` - Get specific order
- `PUT /trading/orders/{id}` - Update order
- `DELETE /trading/orders/{id}` - Cancel order

### Market Data
- `GET /market/prices` - Get current market prices
- `GET /market/history/{symbol}` - Get historical data
- `GET /market/feeds` - Get live data feeds
- `POST /market/alerts` - Create price alerts

### IoT Devices
- `GET /iot/devices` - List registered devices
- `POST /iot/devices` - Register new device
- `GET /iot/devices/{id}` - Get device details
- `PUT /iot/devices/{id}` - Update device
- `GET /iot/devices/{id}/data` - Get device sensor data

### Analytics
- `GET /analytics/dashboard` - Get dashboard data
- `POST /analytics/reports` - Generate custom reports
- `GET /analytics/metrics` - Get performance metrics
- `GET /analytics/widgets` - Get widget configurations

### Security
- `GET /security/logs` - Get audit logs
- `POST /security/alerts` - Create security alerts
- `GET /security/permissions` - Get user permissions
- `PUT /security/permissions` - Update permissions

## Data Models

### User
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "created_at": "datetime",
  "last_login": "datetime"
}
```

### Trade
```json
{
  "id": "string",
  "user_id": "string",
  "symbol": "string",
  "quantity": "number",
  "price": "number",
  "side": "buy|sell",
  "status": "pending|filled|cancelled",
  "created_at": "datetime"
}
```

### Device
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "location": "string",
  "status": "online|offline|maintenance",
  "last_seen": "datetime"
}
```

## Error Responses
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## Rate Limiting
- 1000 requests per hour per user
- 100 requests per minute for real-time endpoints
- Burst limit of 50 requests per 10 seconds