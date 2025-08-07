# Liza Crude Oil Trading Service

## Overview

The Liza Trading Service provides real-time pricing, API integration, and regulatory compliance for Guyana's Liza crude oil trading operations. This service is specifically designed to handle the unique characteristics and regulatory requirements of Guyana's energy sector.

## Features

### Live Price Polling
- **Real-time Updates**: Polls the Guyana Energy API every 30 seconds (configurable)
- **Automatic Retry**: 3 retry attempts with 5-second delays on API failures
- **Event-driven**: Emits `price_update`, `polling_started`, `polling_stopped`, and `fetch_error` events

### Fallback Cache System
- **Cache Timeout**: 5-minute default expiration (configurable)
- **Persistent Storage**: Ready for integration with Redis or database
- **Graceful Degradation**: Falls back to cached data when API is unavailable

### Regulatory Compliance
- **Quantity Limits**: Enforces 1,000-100,000 barrel transaction limits
- **Location Validation**: Validates delivery locations within Guyana
- **Counterparty Requirements**: Ensures proper counterparty identification

## API Endpoints

### Configuration
Set the following environment variables:
```bash
LIZA_API_BASE_URL=https://api.guyanaenergy.gov.gy/v1
LIZA_API_KEY=your_api_key_here
LIZA_REFRESH_INTERVAL=30000    # 30 seconds
LIZA_CACHE_TIMEOUT=300000      # 5 minutes
```

### Usage Examples

```javascript
const LizaTradingService = require('./services/trading/liza');

// Initialize service
const lizaService = new LizaTradingService({
  refreshInterval: 30000,
  cacheTimeout: 300000
});

// Start live pricing
lizaService.startLivePricing();

// Get current price
const currentPrice = await lizaService.getCurrentPrice();
console.log(currentPrice);
// {
//   success: true,
//   data: {
//     price: 82.50,
//     volume: 750000,
//     timestamp: Date,
//     api_differential: -2.8,
//     sulfur_content: 0.35,
//     source: 'live'
//   },
//   timestamp: Date
// }

// Get historical prices
const historicalData = await lizaService.getHistoricalPrices(
  new Date('2024-01-01'),
  new Date('2024-01-07')
);

// Calculate pricing differential vs Brent
const differential = await lizaService.getPricingDifferential();
console.log(differential);
// {
//   success: true,
//   data: {
//     differential: -3.0,
//     benchmark: 'Brent',
//     timestamp: Date
//   }
// }

// Validate trade compliance
const tradeValidation = lizaService.validateTradeCompliance({
  quantity: 50000,
  price: 82.50,
  counterparty: 'Shell Trading',
  delivery_location: 'Liza Destiny FPSO'
});

// Listen for events
lizaService.on('price_update', (priceData) => {
  console.log('New price:', priceData.price);
});

lizaService.on('fetch_error', (error) => {
  console.error('API error:', error.message);
});

// Cleanup
lizaService.destroy();
```

## Valid Delivery Locations

The service validates trades against approved Guyana delivery locations:
- Georgetown
- Liza Destiny FPSO
- Liza Unity FPSO
- Payara FPSO
- Prosperity FPSO

## Compliance Rules

### Transaction Limits
- **Minimum**: 1,000 barrels per transaction
- **Maximum**: 100,000 barrels per transaction

### Required Information
- Counterparty identification (mandatory)
- Valid Guyana delivery location
- Price and quantity within acceptable ranges

## Health Monitoring

```javascript
const health = lizaService.getHealthStatus();
console.log(health);
// {
//   success: true,
//   data: {
//     status: 'healthy',
//     lastFetch: Date,
//     cacheSize: 1,
//     isPolling: true
//   }
// }
```

## Error Handling

The service provides comprehensive error handling:
- Network failures with automatic retry
- API unavailability with cache fallback
- Invalid data with validation errors
- Compliance violations with detailed messages

## Events

| Event | Description | Payload |
|-------|-------------|---------|
| `polling_started` | Live pricing started | None |
| `polling_stopped` | Live pricing stopped | None |
| `price_update` | New price received | `LizaPriceData` object |
| `fetch_error` | API request failed | `Error` object |
| `polling_error` | Polling cycle error | `Error` object |

## Data Structures

### LizaPriceData
```javascript
{
  price: number,           // USD per barrel
  volume: number,          // Daily volume in barrels
  timestamp: Date,         // Price timestamp
  api_differential: number, // Differential vs API gravity
  sulfur_content: number,  // Sulfur content percentage
  source: 'live' | 'cache' // Data source
}
```

## Integration Notes

### Production Considerations
1. **API Keys**: Secure storage of Guyana Energy API credentials
2. **Rate Limiting**: Respect API rate limits (current: 2 requests/minute)
3. **Persistent Cache**: Implement Redis or database cache for production
4. **Monitoring**: Set up alerts for API failures and compliance violations
5. **Logging**: Comprehensive logging for audit requirements

### Regional Compliance
This service is specifically designed for Guyana's energy trading regulations and may need adaptation for other jurisdictions.