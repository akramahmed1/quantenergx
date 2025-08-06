# Quantum and Blockchain API Documentation

## Overview

This document provides comprehensive API documentation for the quantum forecasting and blockchain trading features of the QuantEnergx platform.

## Base URLs

- **Production**: `https://api.quantenergx.com`
- **Staging**: `https://staging-api.quantenergx.com`
- **Development**: `http://localhost:3001`

## Authentication

### JWT Authentication

All API endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Quantum Authentication (Enhanced Security)

Quantum-secured endpoints additionally require quantum signatures:

```
X-Quantum-Signature: <quantum_signature>
X-Quantum-Entropy: <quantum_entropy>
```

## Quantum Forecasting API

### POST /api/v1/forecast

Generate quantum-enhanced energy price forecasts using hybrid LSTM models.

**Security**: Requires quantum authentication

**Request Body**:
```json
{
  "commodity": "string (required)",
  "historical_data": "array (required)",
  "hours_ahead": "integer (optional, default: 24)",
  "model_type": "string (optional, default: quantum_lstm)"
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| commodity | string | Yes | Energy commodity type: `oil`, `natural_gas`, `electricity`, `renewable_energy`, `carbon_credit` |
| historical_data | array | Yes | Array of historical price data points (minimum 24 points) |
| hours_ahead | integer | No | Number of hours to forecast (1-168) |
| model_type | string | No | Model type: `quantum_lstm`, `classical_lstm`, `hybrid` |

**Historical Data Format**:
```json
[
  {
    "timestamp": "2024-01-01T00:00:00Z",
    "price": 75.50,
    "volume": 1000.0,
    "volatility": 0.15,
    "demand": 850.0
  }
]
```

**Response**:
```json
{
  "success": true,
  "forecast": {
    "predictions": [76.2, 75.8, 77.1],
    "hours_ahead": 24,
    "model_type": "quantum_lstm",
    "timestamp": "2024-01-01T12:00:00Z",
    "confidence_interval": {
      "lower": [74.5, 74.1, 75.4],
      "upper": [77.9, 77.5, 78.8],
      "confidence": 0.95
    }
  },
  "metadata": {
    "quantum_enabled": true,
    "processing_time_ms": 1250,
    "model_accuracy": 0.95,
    "quantum_authenticated": true
  }
}
```

**Example Request**:
```bash
curl -X POST http://localhost:3001/api/v1/forecast \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Quantum-Signature: 0x1234567890abcdef..." \
  -H "X-Quantum-Entropy: 0x9876543210fedcba..." \
  -H "Content-Type: application/json" \
  -d '{
    "commodity": "oil",
    "historical_data": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "price": 75.50,
        "volume": 1000,
        "volatility": 0.15,
        "demand": 850
      }
    ],
    "hours_ahead": 24
  }'
```

**Error Responses**:

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request parameters |
| 401 | QUANTUM_AUTH_FAILED | Quantum authentication failed |
| 500 | FORECAST_ERROR | Internal forecasting error |

---

### POST /api/v1/quantum/benchmark

Compare quantum LSTM performance against classical LSTM.

**Security**: Requires JWT authentication

**Request Body**:
```json
{
  "test_data": "array (required)",
  "epochs": "integer (optional, default: 20)"
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| test_data | array | Yes | Test dataset (minimum 50 data points) |
| epochs | integer | No | Training epochs (5-100) |

**Response**:
```json
{
  "success": true,
  "benchmark_results": {
    "classical_lstm": {
      "mse": 0.0245,
      "mae": 0.1234,
      "rmse": 0.1565
    },
    "quantum_lstm": {
      "mse": 0.0231,
      "mae": 0.1198,
      "rmse": 0.1520
    },
    "improvement_percentage": 5.7,
    "quantum_advantage": true
  }
}
```

---

### GET /api/v1/quantum/health

Check quantum service health and availability.

**Security**: Public endpoint

**Response**:
```json
{
  "status": "healthy",
  "quantum_available": true,
  "classical_fallback": true,
  "service_version": "1.0.0",
  "last_check": "2024-01-01T12:00:00Z",
  "blockchain_connected": true
}
```

**Status Values**:
- `healthy`: All systems operational
- `degraded`: Limited functionality available
- `unavailable`: Service unavailable

## Quantum Security API

### POST /api/v1/quantum/entropy

Generate cryptographically secure quantum entropy.

**Security**: Requires JWT authentication

**Response**:
```json
{
  "entropy": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "quality_score": 0.95,
  "source": "quantum_hardware",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Entropy Sources**:
- `quantum_hardware`: IBM Quantum hardware
- `quantum_simulator`: Quantum simulator
- `classical_fallback`: Cryptographically secure PRNG

---

### POST /api/v1/quantum/key

Register a post-quantum cryptographic key for the user.

**Security**: Requires JWT authentication

**Request Body**:
```json
{
  "public_key": "0x1234567890abcdef...",
  "key_type": "dilithium",
  "validity_days": 30
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| public_key | string | Yes | Hex-encoded post-quantum public key (min 64 chars) |
| key_type | string | No | Key type: `dilithium`, `kyber`, `falcon`, `rainbow` |
| validity_days | integer | No | Key validity period (1-365 days) |

**Response**:
```json
{
  "success": true,
  "key_hash": "0xabcdef1234567890...",
  "expires_at": "2024-02-01T12:00:00Z",
  "transaction_hash": "0x9876543210fedcba..."
}
```

---

### GET /api/v1/quantum/key

Retrieve quantum key information for the authenticated user.

**Security**: Requires JWT authentication

**Response**:
```json
{
  "key_hash": "0xabcdef1234567890...",
  "public_key": "0x1234567890abcdef...",
  "created_at": "2024-01-01T12:00:00Z",
  "expires_at": "2024-02-01T12:00:00Z",
  "is_active": true,
  "usage_count": 42
}
```

**Error Responses**:

| Status | Code | Description |
|--------|------|-------------|
| 404 | KEY_NOT_FOUND | No active quantum key found |
| 500 | KEY_RETRIEVAL_ERROR | Failed to retrieve key |

## Blockchain Trading API

### Smart Contract Integration

The platform integrates with the `QRLTrade` smart contract for quantum-resistant energy trading.

**Contract Features**:
- Multi-commodity energy trading
- Post-quantum cryptographic authentication
- Quantum entropy generation
- Automated settlement processing

### Contract Addresses

| Network | Address |
|---------|---------|
| Ethereum Mainnet | `0x...` (TBD) |
| Sepolia Testnet | `0x...` (deployed via scripts) |
| Local Hardhat | `0x...` (varies) |

### Supported Commodities

| ID | Type | Description |
|----|------|-------------|
| 0 | OIL | Crude oil (WTI, Brent) |
| 1 | NATURAL_GAS | Natural gas futures |
| 2 | ELECTRICITY | Power/electricity trading |
| 3 | RENEWABLE_ENERGY_CERTIFICATE | RECs/REGOs |
| 4 | CARBON_CREDIT | Carbon offset credits |

### Trade Lifecycle

1. **Create Trade**: Buyer creates trade with quantum entropy
2. **Confirm Trade**: Both parties sign with quantum signatures
3. **Settle Trade**: Automatic settlement with payment transfer

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": "Additional error details",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| VALIDATION_ERROR | Request validation failed | Check request parameters |
| AUTH_FAILED | Authentication failed | Verify JWT token |
| QUANTUM_AUTH_FAILED | Quantum auth failed | Check quantum signature |
| QUANTUM_SERVICE_UNAVAILABLE | Service unavailable | Retry or use fallback |
| BLOCKCHAIN_ERROR | Blockchain operation failed | Check network status |
| RATE_LIMIT_EXCEEDED | Too many requests | Implement rate limiting |

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

| Endpoint | Limit | Window |
|----------|-------|--------|
| /forecast | 100 requests | 1 hour |
| /benchmark | 10 requests | 1 hour |
| /quantum/entropy | 1000 requests | 1 hour |
| /quantum/key | 50 requests | 1 hour |

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641024000
```

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

class QuantEnergxAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async generateForecast(data) {
    const response = await axios.post(
      `${this.baseURL}/api/v1/forecast`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  async getQuantumHealth() {
    const response = await axios.get(
      `${this.baseURL}/api/v1/quantum/health`
    );
    return response.data;
  }
}

// Usage
const api = new QuantEnergxAPI('http://localhost:3001', 'your_jwt_token');
const forecast = await api.generateForecast({
  commodity: 'oil',
  historical_data: [...],
  hours_ahead: 24
});
```

### Python

```python
import requests
import json

class QuantEnergxAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def generate_forecast(self, data):
        url = f'{self.base_url}/api/v1/forecast'
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()
    
    def get_quantum_health(self):
        url = f'{self.base_url}/api/v1/quantum/health'
        response = requests.get(url)
        return response.json()

# Usage
api = QuantEnergxAPI('http://localhost:3001', 'your_jwt_token')
forecast = api.generate_forecast({
    'commodity': 'oil',
    'historical_data': [...],
    'hours_ahead': 24
})
```

### cURL Examples

**Generate Forecast**:
```bash
curl -X POST http://localhost:3001/api/v1/forecast \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @forecast_request.json
```

**Check Health**:
```bash
curl http://localhost:3001/api/v1/quantum/health
```

**Register Quantum Key**:
```bash
curl -X POST http://localhost:3001/api/v1/quantum/key \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "public_key": "0x1234567890abcdef...",
    "validity_days": 30
  }'
```

## Testing

### Test Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | http://localhost:3001 | Development testing |
| Staging | https://staging-api.quantenergx.com | Integration testing |
| Production | https://api.quantenergx.com | Production API |

### Test Data

Sample test data is available for development:

```json
{
  "test_oil_data": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "price": 75.50,
      "volume": 1000,
      "volatility": 0.15,
      "demand": 850
    }
  ]
}
```

## Performance

### Response Times

| Endpoint | Target | Typical |
|----------|--------|---------|
| /forecast | < 5s | 1.2s |
| /benchmark | < 60s | 45s |
| /health | < 100ms | 50ms |
| /entropy | < 1s | 300ms |

### Throughput

- **Concurrent Users**: 1000+
- **Requests per Second**: 100+
- **Data Processing**: 10MB/request max

## Security

### Best Practices

1. **Always use HTTPS** in production
2. **Rotate JWT tokens** regularly
3. **Validate quantum signatures** for sensitive operations
4. **Monitor API usage** for anomalies
5. **Implement proper error handling**

### Quantum Security Features

- Post-quantum cryptographic keys
- Quantum signature verification
- Entropy quality validation
- Future-proof against quantum attacks

## Support

### Documentation

- **API Reference**: This document
- **Integration Guide**: `/docs/quantum-integration.md`
- **Quantum Service**: `/quantum_service/README.md`
- **Blockchain**: `/blockchain/README.md`

### Contact

- **Technical Support**: Create GitHub issue
- **Business Inquiries**: support@quantenergx.com
- **Security Issues**: security@quantenergx.com

### Community

- **GitHub**: https://github.com/akramahmed1/quantenergx
- **Discord**: https://discord.gg/quantenergx
- **Documentation**: https://docs.quantenergx.com

---

**Last Updated**: January 2024  
**API Version**: 1.0.0  
**Document Version**: 1.0.0