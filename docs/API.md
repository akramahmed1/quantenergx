# QuantEnerGx API Documentation

## Overview

The QuantEnerGx API provides comprehensive energy trading and analytics capabilities compliant with NERC CIP, IEC 61850, and FERC regulations. This RESTful API supports multiple authentication methods and provides real-time energy market data, analytics, and compliance monitoring.

## Base URL

```
Production: https://api.quantenergx.com/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication

### JWT Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### OAuth2 (Enterprise)
Enterprise customers can use OAuth2 SSO integration.

## API Endpoints

### Authentication (`/auth`)

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "organization": "Energy Corp",
  "role": "analyst"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@company.com",
  "full_name": "John Doe",
  "organization": "Energy Corp",
  "role": "analyst",
  "is_active": true,
  "created_at": "2025-01-23T10:00:00Z"
}
```

#### POST /auth/login
Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "username": "user@company.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### GET /auth/me
Get current user information.

**Response:**
```json
{
  "id": 1,
  "email": "user@company.com",
  "full_name": "John Doe",
  "role": "analyst",
  "permissions": ["market_data_read", "analytics_read"]
}
```

### Market Data (`/market`)

#### GET /market/prices/current
Get current energy prices across markets.

**Query Parameters:**
- `market` (optional): Market identifier (CAISO, PJM, ERCOT, etc.)
- `commodity` (optional): Energy commodity type

**Response:**
```json
[
  {
    "id": 1,
    "market": "CAISO",
    "commodity": "electricity",
    "price": 67.50,
    "unit": "$/MWh",
    "timestamp": "2025-01-23T10:00:00Z",
    "risk_score": 0.25
  }
]
```

#### GET /market/prices/historical
Get historical energy price data.

**Query Parameters:**
- `start_date`: Start date (ISO 8601 format)
- `end_date`: End date (ISO 8601 format)
- `market` (optional): Market filter
- `interval`: Data interval (hourly, daily, weekly)

**Response:**
```json
[
  {
    "timestamp": "2025-01-23T09:00:00Z",
    "price": 65.20,
    "market": "CAISO",
    "volatility": 0.15
  }
]
```

#### GET /market/markets/status
Get real-time market status and health indicators.

**Response:**
```json
{
  "timestamp": "2025-01-23T10:00:00Z",
  "markets": {
    "CAISO": {
      "status": "operational",
      "last_update": "2025-01-23T10:00:00Z",
      "data_quality": 0.95
    }
  },
  "overall_health": "operational",
  "alerts": []
}
```

### Analytics (`/analytics`)

#### GET /analytics/portfolio/performance
Get portfolio performance analytics.

**Query Parameters:**
- `portfolio_id` (optional): Portfolio identifier
- `time_range`: Analysis time range (1d, 7d, 30d, 90d, 1y)

**Response:**
```json
{
  "total_return": 0.052,
  "annualized_return": 0.156,
  "volatility": 0.08,
  "sharpe_ratio": 1.42,
  "max_drawdown": 0.03,
  "var_95": 0.025
}
```

#### GET /analytics/risk/assessment
Get comprehensive risk assessment.

**Query Parameters:**
- `risk_model`: Risk model (var, cvar, monte_carlo)
- `confidence_level`: Statistical confidence level (0.90-0.99)

**Response:**
```json
{
  "portfolio_var": 45230.50,
  "expected_shortfall": 67845.75,
  "concentration_risk": 0.08,
  "stress_test_results": {
    "extreme_weather": {"impact": -0.15, "probability": 0.05}
  }
}
```

### Device Telemetry (`/telemetry`)

#### POST /telemetry/devices/register
Register a new energy device.

**Request Body:**
```json
{
  "device_id": "SOLAR_001",
  "device_type": "solar",
  "manufacturer": "SolarTech",
  "location": "California",
  "capacity_kw": 500.0
}
```

**Response:**
```json
{
  "id": 1,
  "device_id": "SOLAR_001",
  "api_key": "generated_api_key_here",
  "registered_at": "2025-01-23T10:00:00Z"
}
```

#### POST /telemetry/ingest
Ingest telemetry data from devices.

**Headers:**
```
device_api_key: your_device_api_key
```

**Request Body:**
```json
[
  {
    "metric_name": "power_kw",
    "metric_value": 450.5,
    "unit": "kW",
    "timestamp": "2025-01-23T10:00:00Z"
  }
]
```

### Compliance (`/security`)

#### GET /security/compliance/status
Get compliance status for energy industry standards.

**Response:**
```json
{
  "nerc_cip_compliance": "compliant",
  "iec_61850_compliance": "compliant",
  "ferc_compliance": "compliant",
  "soc2_status": "certified",
  "last_assessment": "2025-01-23T10:00:00Z"
}
```

### Localization (`/localization`)

#### GET /localization/languages/supported
Get list of supported languages.

**Response:**
```json
{
  "languages": [
    {"code": "en", "name": "English", "rtl": false},
    {"code": "ar", "name": "العربية", "rtl": true}
  ]
}
```

#### GET /localization/translations/{language_code}
Get translations for specific language.

**Response:**
```json
{
  "common": {
    "login": "Login",
    "dashboard": "Dashboard"
  },
  "energy": {
    "power": "Power",
    "voltage": "Voltage"
  }
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "detail": "Error description",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2025-01-23T10:00:00Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- Standard users: 60 requests/minute
- Premium users: 300 requests/minute
- Enterprise: Custom limits

## WebSocket Support

Real-time data streaming available via WebSocket:

```javascript
const ws = new WebSocket('wss://api.quantenergx.com/ws/market-data');
```

## SDKs and Libraries

- Python SDK: `pip install quantenergx-python`
- JavaScript/Node.js: `npm install quantenergx-js`
- Go: `go get github.com/quantenergx/go-client`

## Postman Collection

Download the complete Postman collection: [QuantEnerGx API.postman_collection.json](./postman/QuantEnerGx_API.postman_collection.json)

## Support

- API Documentation: https://docs.quantenergx.com
- Developer Portal: https://developer.quantenergx.com
- Support: api-support@quantenergx.com