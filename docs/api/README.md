# QuantEnergx API Documentation

## Overview

The QuantEnergx API provides comprehensive RESTful endpoints for energy trading operations, real-time data access, risk management, derivatives trading, settlement processing, and regulatory compliance. 

## Swagger/OpenAPI Explorer

**🎯 Live Interactive API Documentation**: http://localhost:3001/api-docs

The QuantEnergx API now includes a complete Swagger UI for interactive endpoint testing and documentation. This allows developers to:

- **Test endpoints live** with real API responses
- **Explore comprehensive documentation** for all 12 major endpoint categories  
- **View detailed request/response schemas** with examples
- **Execute API calls directly** from the browser interface
- **Copy curl commands** for integration testing
- **Authenticate with JWT tokens** for secure endpoint access

### Available Endpoints via Swagger

✅ **System Health** - Monitor service status and system health  
✅ **Trading Operations** - Order management and trade execution  
✅ **Market Data** - Real-time and historical price feeds  
✅ **Risk Management** - Portfolio VaR analysis and risk monitoring  
✅ **Derivatives Trading** - Futures, options, swaps, and structured products  
✅ **Settlement Processing** - Cash, physical, and net settlement workflows  
✅ **Exchange Connectors** - Multi-exchange connectivity and status monitoring  
✅ **Plugin Management** - Dynamic plugin execution and management  
✅ **Webhook Processing** - Third-party integrations and event handling  
✅ **OCR Document Processing** - Text extraction and document analysis  
✅ **Compliance Reporting** - Regulatory reporting and audit trails  
✅ **WebSocket Statistics** - Real-time connection monitoring  

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

## Quick Start with Swagger

1. **Access Swagger UI**: Navigate to http://localhost:3001/api-docs
2. **Authorize**: Click the "Authorize" button and enter your JWT token
3. **Test Endpoints**: Expand any endpoint category and click "Try it out"
4. **Execute Requests**: Fill in parameters and click "Execute" to test live

## Core Endpoints

### System Health
Check system health and service status.

```http
GET /health
```

**✅ Live Testing Available**: Use Swagger UI to test this endpoint

### Trading Operations

#### Get Orders
```http
GET /api/v1/trading/orders
```

#### Create Order
```http
POST /api/v1/trading/orders
```

**✅ Live Testing Available**: Full CRUD operations testable in Swagger UI

### Market Data

#### Get Market Prices
```http
GET /api/v1/market/prices/{commodity}
```

**Supported Commodities**: crude_oil, natural_gas, heating_oil, gasoline, electricity, coal

### Risk Management

#### Portfolio Risk Analysis
```http
GET /api/v1/risk/portfolio
```

#### Value at Risk (VaR) Calculation
```http
GET /api/v1/risk/var?confidence=95&horizon=1
```

### Derivatives Trading

#### Get Derivative Contracts
```http
GET /api/v1/derivatives/contracts
```

#### Create Derivative Contract
```http
POST /api/v1/derivatives/contracts
```

**Supported Types**: future, option, swap, structured_note

### Settlement Processing

#### Get Settlement Instructions
```http
GET /api/v1/settlement/instructions
```

#### Create Settlement Instruction
```http
POST /api/v1/settlement/instructions
```

**Settlement Types**: cash, physical, net

### Exchange Connectors

#### Get Available Exchanges
```http
GET /api/v1/exchanges
```

#### Get Exchange Status
```http
GET /api/v1/exchanges/{exchangeId}/status
```

**Supported Exchanges**: ICE, EEX, CME, NYMEX, DME, OPEC, Guyana NDR

### Plugin Management

#### List Available Plugins
```http
GET /api/v1/plugins
```

#### Execute Plugin
```http
POST /api/v1/plugins/{name}/execute
```

### Webhook Processing

#### List Webhook Types
```http
GET /api/v1/webhooks
```

#### Process Webhook
```http
POST /api/v1/webhooks/{type}
```

### OCR Document Processing

#### Process Document
```http
POST /api/v1/ocr/process
```

**Supported Formats**: PDF, image files (PNG, JPG, TIFF)

### Compliance Reporting

#### Get Compliance Reports
```http
GET /api/v1/compliance/reports
```

**Jurisdictions**: US, EU, UK, APAC, CA  
**Report Types**: trade_reporting, position_reporting, risk_reporting

### WebSocket Statistics

#### Get Connection Statistics
```http
GET /api/v1/websocket/stats
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2025-08-01T11:15:00.000Z"
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

## Testing with Swagger UI

### API Testing Workflow

1. **Start Local Development Server**:
   ```bash
   cd backend && npm run dev
   ```

2. **Access Swagger UI**: 
   Open http://localhost:3001/api-docs in your browser

3. **Authenticate**:
   - Click the "Authorize" button in Swagger UI
   - Enter your JWT token
   - Click "Authorize"

4. **Test Endpoints**:
   - Expand any endpoint category
   - Click "Try it out" on any endpoint
   - Fill in required parameters
   - Click "Execute" to test live

5. **Review Results**:
   - View real API responses
   - Check response headers and status codes
   - Copy curl commands for integration

### Example Test Scenarios

#### Health Check Test
- **Endpoint**: GET /health
- **Expected Response**: 200 OK with service status
- **Test Steps**: No parameters required, just click Execute

#### Plugin List Test  
- **Endpoint**: GET /api/v1/plugins
- **Expected Response**: Array of available plugins
- **Authentication**: Required (JWT token)

#### Market Data Test
- **Endpoint**: GET /api/v1/market/prices/{commodity}
- **Parameters**: commodity = "crude_oil"
- **Expected Response**: Current price data with timestamp

## OpenAPI Specification

### Available Formats

- **Interactive UI**: http://localhost:3001/api-docs
- **JSON Format**: http://localhost:3001/api-docs.json
- **YAML Format**: http://localhost:3001/api-docs.yaml

### Specification Details

- **OpenAPI Version**: 3.0.3
- **API Version**: 2.0.0
- **Security**: JWT Bearer token authentication
- **Schemas**: Comprehensive data models for all endpoints
- **Examples**: Real-world request/response examples
- **Validation**: Built-in parameter and response validation

## Supported Features

### Trading Platform Features
- Real-time trading infrastructure
- Multi-commodity support (Oil, Gas, Electricity, Renewables, Carbon Credits)
- Derivatives trading (Futures, Options, Swaps, Structured Notes)
- Advanced risk management with VaR calculations
- Multi-exchange connectivity (ICE, EEX, CME, NYMEX, DME, OPEC)
- Compliance across multiple jurisdictions (MiFID II, REMIT, Dodd-Frank, EMIR)
- Settlement processing (Cash/Physical/Net)
- Plugin architecture and webhook integrations
- OCR document processing
- IoT and SCADA integration

### Compliance Standards
- MiFID II (EU Markets in Financial Instruments)
- REMIT (EU Energy Market Integrity)
- Dodd-Frank (US Wall Street Reform)
- EMIR (EU Market Infrastructure)
- CFTC Rules (US Commodity Futures)
- MAR (EU Market Abuse Regulation)
- SEC Rules (US Securities)
- FCA Rules (UK Financial Conduct)
- Guyana Local Energy Regulations
- SOC 2 Type II, ISO 27001, NERC CIP

### Supported Regions
US, EU, UK, APAC, CA, Middle East, Guyana, Global

## Getting Help

- **Documentation**: This README and Swagger UI
- **API Issues**: Create GitHub issue with API tag
- **Support**: support@quantenergx.com
- **Live Testing**: Use Swagger UI for immediate endpoint testing