# AI Trading UI WebSocket API Documentation

## Overview

The AI Trading UI includes real-time WebSocket endpoints for arbitrage alerts and Jupyter notebook management. This document describes the new WebSocket events and data structures.

## WebSocket Connection

Connect to the WebSocket server at: `ws://localhost:3001` (or the configured WebSocket URL)

## Authentication

Before subscribing to any events, clients must authenticate:

```javascript
socket.emit('authenticate', {
  userId: 'string',
  token: 'string' // JWT token or session token
});
```

**Response:**
```javascript
socket.on('auth-success', (data) => {
  // { message: 'Authentication successful', userId: 'string' }
});

socket.on('auth-error', (data) => {
  // { message: 'Authentication failed' }
});
```

## Arbitrage Alerts

### Subscribe to Arbitrage Alerts

```javascript
socket.emit('subscribe-arbitrage', {
  userId: 'string',
  region: 'guyana' | 'middle-east' | 'us' | 'europe' | 'uk' // optional
});
```

**Response:**
```javascript
socket.on('arbitrage-subscribed', (data) => {
  // {
  //   userId: 'string',
  //   region: 'string',
  //   rooms: ['arbitrage-userId', 'arbitrage-region-regionName'],
  //   message: 'string'
  // }
});
```

### Receive Arbitrage Alerts

```javascript
socket.on('arbitrage-alert', (alert) => {
  // {
  //   type: 'ARBITRAGE_ALERT',
  //   payload: {
  //     id: 'string',
  //     timestamp: 'ISO string',
  //     commodity: 'string',
  //     market1: {
  //       name: 'string',
  //       price: number,
  //       currency: 'string',
  //       region: 'string'
  //     },
  //     market2: {
  //       name: 'string',
  //       price: number,
  //       currency: 'string',
  //       region: 'string'
  //     },
  //     spread: number,
  //     spreadPercentage: number,
  //     profitPotential: number,
  //     severity: 'low' | 'medium' | 'high' | 'critical',
  //     compliance: {
  //       region: 'string',
  //       status: 'compliant' | 'warning' | 'violation',
  //       notes?: 'string'
  //     },
  //     expiresAt: 'ISO string',
  //     userId: 'string',
  //     region: 'string'
  //   },
  //   timestamp: number,
  //   userId: 'string'
  // }
});
```

## Regional Configuration

The system supports the following regions with specific configurations:

- **Guyana (GY)**: Georgetown Exchange, Suriname Market
- **Middle East (ME)**: Dubai Mercantile, Qatar Exchange  
- **United States (US)**: NYMEX, ICE Futures
- **Europe (EU)**: ICE Europe, EEX
- **United Kingdom (UK)**: ICE Futures Europe, London Exchange

Each region has:
- Different trading hours
- Regional compliance requirements
- Currency preferences
- Market-specific holidays
- Tax and customs information

## Data Structures

### ArbitrageAlert Interface

```typescript
interface ArbitrageAlert {
  id: string;
  timestamp: Date;
  commodity: string;
  market1: {
    name: string;
    price: number;
    currency: string;
    region: string;
  };
  market2: {
    name: string;
    price: number;
    currency: string;
    region: string;
  };
  spread: number;
  spreadPercentage: number;
  profitPotential: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  compliance: {
    region: string;
    status: 'compliant' | 'warning' | 'violation';
    notes?: string;
  };
  expiresAt: Date;
}
```

### Regional Config Interface

```typescript
interface RegionalConfig {
  country: string;
  timezone: string;
  currency: string;
  taxRate: number;
  customsDuty: number;
  tradingHours: {
    start: string;
    end: string;
    timezone: string;
  };
  holidays: string[];
  regulations: {
    maxOrderSize: number;
    marginRequirement: number;
    settlementDays: number;
  };
}
```

## Error Handling

The WebSocket service includes comprehensive error handling:

- **Connection errors**: Automatic reconnection with exponential backoff
- **Authentication errors**: Clear error messages with retry mechanisms
- **Subscription errors**: Validation of user permissions and region access
- **Data validation**: All incoming data is validated against schemas

## Security Features

- **Authentication required**: All subscriptions require valid authentication
- **User isolation**: Users only receive alerts for their subscriptions
- **Rate limiting**: Protection against excessive subscription requests
- **Data validation**: All messages are validated before processing
- **Region-based access**: Compliance with regional trading regulations

## Performance Considerations

- **Room-based subscriptions**: Efficient message routing to relevant users
- **Connection pooling**: Optimized for high-concurrency scenarios
- **Message batching**: Bulk delivery for high-frequency updates
- **Memory management**: Automatic cleanup of expired alerts

## Usage Examples

### React Hook for Arbitrage Alerts

```typescript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const useArbitrageAlerts = (userId: string, region?: string) => {
  const [alerts, setAlerts] = useState<ArbitrageAlert[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_WEBSOCKET_URL);
    
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('authenticate', { 
        userId, 
        token: localStorage.getItem('authToken') 
      });
      socket.emit('subscribe-arbitrage', { userId, region });
    });

    socket.on('arbitrage-alert', (alertData) => {
      const alert = {
        ...alertData.payload,
        timestamp: new Date(alertData.payload.timestamp),
        expiresAt: new Date(alertData.payload.expiresAt),
      };
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    });

    socket.on('disconnect', () => setConnected(false));

    return () => socket.disconnect();
  }, [userId, region]);

  return { alerts, connected };
};
```

## Testing

The WebSocket API includes comprehensive test coverage:

- **Unit tests**: Individual event handlers and data validation
- **Integration tests**: End-to-end WebSocket communication
- **Load tests**: Performance under high concurrency
- **Security tests**: Authentication and authorization validation