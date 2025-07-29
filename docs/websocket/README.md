# WebSocket Protocol Documentation

## Overview

QuantEnergx uses WebSocket connections to provide real-time updates for trading data, market information, and system alerts. This document describes the WebSocket protocol, events, and client implementation.

## Connection

### Endpoint
```
Development: ws://localhost:3001
Production: wss://api.quantenergx.com
```

### Authentication

WebSocket connections require authentication after connecting:

```javascript
const socket = io('http://localhost:3001');

socket.emit('authenticate', {
  userId: 'user-123',
  token: 'your-jwt-token'
});

socket.on('auth-success', (data) => {
  console.log('Authenticated:', data.message);
});

socket.on('auth-error', (error) => {
  console.error('Authentication failed:', error.message);
});
```

## Client Events (Sent to Server)

### Authentication

#### `authenticate`
Authenticate the WebSocket connection.

**Payload:**
```json
{
  "userId": "user-123",
  "token": "your-jwt-token"
}
```

**Response Events:**
- `auth-success` - Authentication successful
- `auth-error` - Authentication failed

### Subscriptions

#### `join-trading`
Join trading room for real-time trade updates.

**Payload:**
```json
"user-123"
```

**Response:**
```json
{
  "room": "trading-user-123",
  "message": "Joined trading room for user user-123"
}
```

#### `subscribe-market`
Subscribe to market data updates for specific commodities.

**Payload:**
```json
["crude_oil", "natural_gas", "heating_oil"]
```

**Response:**
```json
{
  "commodities": ["crude_oil", "natural_gas", "heating_oil"],
  "message": "Subscribed to market data for: crude_oil, natural_gas, heating_oil"
}
```

#### `subscribe-orders`
Subscribe to order status updates.

**Payload:**
```json
"user-123"
```

**Response:**
```json
{
  "userId": "user-123",
  "room": "orders-user-123",
  "message": "Subscribed to order updates for user user-123"
}
```

#### `subscribe-compliance`
Subscribe to compliance alerts.

**Payload:**
```json
"user-123"
```

**Response:**
```json
{
  "userId": "user-123",
  "room": "compliance-user-123",
  "message": "Subscribed to compliance alerts for user user-123"
}
```

### Health Check

#### `ping`
Send ping to check connection health.

**Response:**
```json
{
  "timestamp": 1627689600000
}
```

## Server Events (Received from Server)

### Authentication Events

#### `auth-success`
Authentication successful.

**Payload:**
```json
{
  "message": "Authentication successful",
  "userId": "user-123"
}
```

#### `auth-error`
Authentication failed.

**Payload:**
```json
{
  "message": "Invalid authentication data"
}
```

### Subscription Confirmations

#### `trading-joined`
Confirmation of joining trading room.

#### `market-subscribed`
Confirmation of market data subscription.

#### `orders-subscribed`
Confirmation of order updates subscription.

#### `compliance-subscribed`
Confirmation of compliance alerts subscription.

### Real-time Data Events

#### `market-update`
Real-time market data update.

**Payload:**
```json
{
  "type": "MARKET_UPDATE",
  "payload": {
    "commodity": "crude_oil",
    "price": 75.25,
    "change": 0.75,
    "changePercent": 1.01,
    "volume": 125000,
    "timestamp": "2024-07-29T22:00:00.000Z",
    "bid": 75.20,
    "ask": 75.30
  },
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

#### `trade-update`
Real-time trade execution update.

**Payload:**
```json
{
  "type": "TRADE_UPDATE",
  "payload": {
    "id": "trade-123",
    "orderId": "order-456",
    "userId": "user-123",
    "commodity": "crude_oil",
    "quantity": 1000,
    "price": 75.25,
    "side": "buy",
    "status": "executed",
    "executionTime": "2024-07-29T22:00:00.000Z"
  },
  "timestamp": "2024-07-29T22:00:00.000Z",
  "userId": "user-123"
}
```

#### `order-update`
Real-time order status update.

**Payload:**
```json
{
  "type": "ORDER_UPDATE",
  "payload": {
    "id": "order-456",
    "userId": "user-123",
    "status": "partially_filled",
    "filledQuantity": 500,
    "remainingQuantity": 500,
    "averagePrice": 75.23,
    "timestamp": "2024-07-29T22:00:00.000Z"
  },
  "timestamp": "2024-07-29T22:00:00.000Z",
  "userId": "user-123"
}
```

#### `system-alert`
System-wide alerts and notifications.

**Payload:**
```json
{
  "type": "SYSTEM_ALERT",
  "payload": {
    "alertType": "market_volatility",
    "severity": "warning",
    "message": "High volatility detected in crude oil market",
    "affectedCommodities": ["crude_oil"],
    "timestamp": "2024-07-29T22:00:00.000Z"
  },
  "timestamp": "2024-07-29T22:00:00.000Z"
}
```

#### `compliance-alert`
Compliance-related alerts.

**Payload:**
```json
{
  "type": "SYSTEM_ALERT",
  "payload": {
    "type": "COMPLIANCE_ALERT",
    "checkType": "position_limit",
    "severity": "high",
    "message": "Position limit approaching for crude oil",
    "userId": "user-123",
    "details": {
      "currentPosition": 9500000,
      "limit": 10000000,
      "utilization": 0.95
    }
  },
  "timestamp": "2024-07-29T22:00:00.000Z",
  "userId": "user-123"
}
```

### Connection Events

#### `connect`
Connection established.

#### `disconnect`
Connection lost.

**Payload:**
```json
{
  "reason": "transport close"
}
```

#### `pong`
Response to ping.

## Client Implementation

### JavaScript/TypeScript

```typescript
import { io, Socket } from 'socket.io-client';

class QuantEnergxWebSocket {
  private socket: Socket;
  private userId: string;
  private token: string;

  constructor(url: string, userId: string, token: string) {
    this.userId = userId;
    this.token = token;
    this.socket = io(url);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.socket.on('connect', () => {
      console.log('Connected to QuantEnergx WebSocket');
      this.authenticate();
    });

    this.socket.on('auth-success', (data) => {
      console.log('Authentication successful:', data);
      this.subscribeToMarketData(['crude_oil', 'natural_gas']);
      this.subscribeToTradingUpdates();
    });

    this.socket.on('market-update', (data) => {
      this.handleMarketUpdate(data);
    });

    this.socket.on('trade-update', (data) => {
      this.handleTradeUpdate(data);
    });

    this.socket.on('order-update', (data) => {
      this.handleOrderUpdate(data);
    });

    this.socket.on('system-alert', (data) => {
      this.handleSystemAlert(data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
    });
  }

  private authenticate(): void {
    this.socket.emit('authenticate', {
      userId: this.userId,
      token: this.token
    });
  }

  subscribeToMarketData(commodities: string[]): void {
    this.socket.emit('subscribe-market', commodities);
  }

  subscribeToTradingUpdates(): void {
    this.socket.emit('join-trading', this.userId);
    this.socket.emit('subscribe-orders', this.userId);
  }

  subscribeToComplianceAlerts(): void {
    this.socket.emit('subscribe-compliance', this.userId);
  }

  private handleMarketUpdate(data: any): void {
    console.log('Market update:', data.payload);
    // Update UI with new market data
  }

  private handleTradeUpdate(data: any): void {
    console.log('Trade update:', data.payload);
    // Update trade status in UI
  }

  private handleOrderUpdate(data: any): void {
    console.log('Order update:', data.payload);
    // Update order status in UI
  }

  private handleSystemAlert(data: any): void {
    console.log('System alert:', data.payload);
    // Show alert notification
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}

// Usage
const ws = new QuantEnergxWebSocket(
  'http://localhost:3001',
  'user-123',
  'your-jwt-token'
);
```

### React Hook

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  marketData: Record<string, any>;
  orders: any[];
  alerts: any[];
}

export const useQuantEnergxWebSocket = (
  url: string,
  userId: string,
  token: string
): UseWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const socketInstance = io(url);
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setConnected(true);
      socketInstance.emit('authenticate', { userId, token });
    });

    socketInstance.on('auth-success', () => {
      socketInstance.emit('subscribe-market', ['crude_oil', 'natural_gas']);
      socketInstance.emit('join-trading', userId);
      socketInstance.emit('subscribe-orders', userId);
    });

    socketInstance.on('market-update', (data) => {
      setMarketData(prev => ({
        ...prev,
        [data.payload.commodity]: data.payload
      }));
    });

    socketInstance.on('order-update', (data) => {
      setOrders(prev => 
        prev.map(order => 
          order.id === data.payload.id 
            ? { ...order, ...data.payload }
            : order
        )
      );
    });

    socketInstance.on('system-alert', (data) => {
      setAlerts(prev => [data.payload, ...prev]);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [url, userId, token]);

  return {
    socket,
    connected,
    marketData,
    orders,
    alerts
  };
};
```

### Python Client

```python
import socketio
import json

class QuantEnergxWebSocket:
    def __init__(self, url, user_id, token):
        self.sio = socketio.Client()
        self.user_id = user_id
        self.token = token
        self.url = url
        self.setup_handlers()
    
    def setup_handlers(self):
        @self.sio.event
        def connect():
            print('Connected to QuantEnergx WebSocket')
            self.authenticate()
        
        @self.sio.event
        def auth_success(data):
            print('Authentication successful:', data)
            self.subscribe_to_market_data(['crude_oil', 'natural_gas'])
            self.subscribe_to_trading_updates()
        
        @self.sio.event
        def market_update(data):
            self.handle_market_update(data)
        
        @self.sio.event
        def trade_update(data):
            self.handle_trade_update(data)
        
        @self.sio.event
        def order_update(data):
            self.handle_order_update(data)
        
        @self.sio.event
        def system_alert(data):
            self.handle_system_alert(data)
        
        @self.sio.event
        def disconnect():
            print('Disconnected from WebSocket')
    
    def connect(self):
        self.sio.connect(self.url)
    
    def authenticate(self):
        self.sio.emit('authenticate', {
            'userId': self.user_id,
            'token': self.token
        })
    
    def subscribe_to_market_data(self, commodities):
        self.sio.emit('subscribe-market', commodities)
    
    def subscribe_to_trading_updates(self):
        self.sio.emit('join-trading', self.user_id)
        self.sio.emit('subscribe-orders', self.user_id)
    
    def handle_market_update(self, data):
        print(f"Market update: {data['payload']}")
    
    def handle_trade_update(self, data):
        print(f"Trade update: {data['payload']}")
    
    def handle_order_update(self, data):
        print(f"Order update: {data['payload']}")
    
    def handle_system_alert(self, data):
        print(f"System alert: {data['payload']}")
    
    def disconnect(self):
        self.sio.disconnect()

# Usage
ws = QuantEnergxWebSocket(
    'http://localhost:3001',
    'user-123',
    'your-jwt-token'
)
ws.connect()
```

## Error Handling

### Connection Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  // Implement retry logic
});

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server disconnected the client, reconnect manually
    socket.connect();
  }
  // else the socket will automatically try to reconnect
});
```

### Authentication Errors

```javascript
socket.on('auth-error', (error) => {
  console.error('Authentication failed:', error.message);
  // Redirect to login or refresh token
});
```

## Best Practices

### Connection Management

1. **Reconnection**: Implement automatic reconnection with exponential backoff
2. **Heartbeat**: Use ping/pong to monitor connection health
3. **Cleanup**: Always disconnect when component unmounts

### Data Handling

1. **State Management**: Use proper state management for real-time data
2. **Rate Limiting**: Handle high-frequency updates efficiently
3. **Error Boundaries**: Implement error boundaries for WebSocket errors

### Security

1. **Token Refresh**: Refresh authentication tokens before expiry
2. **Validation**: Validate all incoming data
3. **Rate Limiting**: Implement client-side rate limiting

## Troubleshooting

### Common Issues

#### Connection Fails
- Check network connectivity
- Verify WebSocket URL
- Check firewall settings

#### Authentication Fails
- Verify JWT token validity
- Check token format
- Ensure user ID matches token

#### No Data Received
- Check subscription status
- Verify room membership
- Check server logs

### Debug Mode

```javascript
// Enable debug logging
localStorage.debug = 'socket.io-client:socket';

// Or for specific namespace
localStorage.debug = 'socket.io-client:socket,socket.io-client:manager';
```

### Monitoring

```javascript
socket.on('connect', () => {
  console.log('WebSocket connected at:', new Date());
});

socket.on('disconnect', (reason) => {
  console.log('WebSocket disconnected at:', new Date(), 'reason:', reason);
});

// Track message frequency
let messageCount = 0;
socket.onAny(() => {
  messageCount++;
  console.log('Total messages received:', messageCount);
});
```