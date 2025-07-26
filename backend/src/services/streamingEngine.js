const EventEmitter = require('events');
const WebSocket = require('ws');

/**
 * Millisecond-level streaming and trading engine
 * Handles tick-level market data and order execution
 */
class StreamingEngine extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map();
    this.marketDataFeeds = new Map();
    this.orderQueue = [];
    this.tickQueue = [];
    this.lastProcessedTime = Date.now();
    this.processingInterval = null;
    this.metrics = {
      ticksProcessed: 0,
      ordersExecuted: 0,
      latencyStats: {
        min: Infinity,
        max: 0,
        avg: 0,
        samples: []
      }
    };
    
    this.isRunning = false;
  }

  /**
   * Start the streaming engine
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Process tick data every millisecond
    this.processingInterval = setInterval(() => {
      this.processTicks();
      this.processOrders();
      this.updateMetrics();
    }, 1);
    
    this.emit('started');
  }

  /**
   * Stop the streaming engine
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    this.emit('stopped');
  }

  /**
   * Register a client for streaming data
   */
  registerClient(clientId, websocket) {
    this.clients.set(clientId, {
      ws: websocket,
      subscriptions: new Set(),
      connected: true,
      lastPing: Date.now()
    });
    
    websocket.on('close', () => {
      this.unregisterClient(clientId);
    });
    
    websocket.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastPing = Date.now();
      }
    });
  }

  /**
   * Unregister a client
   */
  unregisterClient(clientId) {
    this.clients.delete(clientId);
  }

  /**
   * Subscribe client to market data feed
   */
  subscribe(clientId, symbol, feedType = 'level1') {
    const client = this.clients.get(clientId);
    if (!client) return false;
    
    const subscription = `${symbol}:${feedType}`;
    client.subscriptions.add(subscription);
    
    return true;
  }

  /**
   * Add tick data to processing queue
   */
  addTick(tickData) {
    const tick = {
      ...tickData,
      timestamp: Date.now(),
      sequence: this.tickQueue.length
    };
    
    this.tickQueue.push(tick);
    
    // Limit queue size to prevent memory issues
    if (this.tickQueue.length > 10000) {
      this.tickQueue.shift();
    }
  }

  /**
   * Submit order for execution
   */
  submitOrder(orderData) {
    const order = {
      ...orderData,
      id: this.generateOrderId(),
      timestamp: Date.now(),
      status: 'pending'
    };
    
    this.orderQueue.push(order);
    this.emit('orderSubmitted', order);
    
    return order.id;
  }

  /**
   * Process tick data
   */
  processTicks() {
    const currentTime = Date.now();
    const ticksToProcess = this.tickQueue.splice(0, 100); // Process up to 100 ticks per cycle
    
    ticksToProcess.forEach(tick => {
      this.processTickData(tick);
      this.broadcastTick(tick);
      this.metrics.ticksProcessed++;
    });
  }

  /**
   * Process individual tick
   */
  processTickData(tick) {
    // Update market data feeds
    const symbol = tick.symbol;
    if (!this.marketDataFeeds.has(symbol)) {
      this.marketDataFeeds.set(symbol, {
        lastPrice: 0,
        bid: 0,
        ask: 0,
        volume: 0,
        lastUpdate: 0
      });
    }
    
    const feed = this.marketDataFeeds.get(symbol);
    feed.lastPrice = tick.price || feed.lastPrice;
    feed.bid = tick.bid || feed.bid;
    feed.ask = tick.ask || feed.ask;
    feed.volume += tick.volume || 0;
    feed.lastUpdate = tick.timestamp;
    
    // Emit tick event for analytics
    this.emit('tick', tick);
  }

  /**
   * Broadcast tick to subscribed clients
   */
  broadcastTick(tick) {
    const subscription = `${tick.symbol}:level1`;
    
    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(subscription) && client.connected) {
        try {
          client.ws.send(JSON.stringify({
            type: 'tick',
            data: tick
          }));
        } catch (error) {
          console.error(`Failed to send tick to client ${clientId}:`, error);
          client.connected = false;
        }
      }
    });
  }

  /**
   * Process orders in queue
   */
  processOrders() {
    const ordersToProcess = this.orderQueue.splice(0, 50); // Process up to 50 orders per cycle
    
    ordersToProcess.forEach(order => {
      this.executeOrder(order);
    });
  }

  /**
   * Execute individual order
   */
  executeOrder(order) {
    const startTime = Date.now();
    
    // Simulate order execution logic
    const marketData = this.marketDataFeeds.get(order.symbol);
    if (!marketData) {
      order.status = 'rejected';
      order.reason = 'No market data available';
    } else {
      // Simple execution logic
      order.status = 'executed';
      order.executionPrice = order.side === 'buy' ? marketData.ask : marketData.bid;
      order.executionTime = Date.now();
      
      this.metrics.ordersExecuted++;
    }
    
    const executionLatency = Date.now() - startTime;
    this.updateLatencyStats(executionLatency);
    
    // Broadcast order update
    this.broadcastOrderUpdate(order);
    this.emit('orderExecuted', order);
  }

  /**
   * Broadcast order update to clients
   */
  broadcastOrderUpdate(order) {
    this.clients.forEach((client, clientId) => {
      if (client.connected) {
        try {
          client.ws.send(JSON.stringify({
            type: 'orderUpdate',
            data: order
          }));
        } catch (error) {
          console.error(`Failed to send order update to client ${clientId}:`, error);
          client.connected = false;
        }
      }
    });
  }

  /**
   * Update latency statistics
   */
  updateLatencyStats(latency) {
    const stats = this.metrics.latencyStats;
    stats.min = Math.min(stats.min, latency);
    stats.max = Math.max(stats.max, latency);
    stats.samples.push(latency);
    
    // Keep only last 1000 samples
    if (stats.samples.length > 1000) {
      stats.samples.shift();
    }
    
    // Calculate average
    stats.avg = stats.samples.reduce((sum, val) => sum + val, 0) / stats.samples.length;
  }

  /**
   * Update performance metrics
   */
  updateMetrics() {
    const currentTime = Date.now();
    const elapsed = currentTime - this.lastProcessedTime;
    
    if (elapsed >= 1000) { // Update every second
      this.emit('metrics', {
        ...this.metrics,
        queueSizes: {
          ticks: this.tickQueue.length,
          orders: this.orderQueue.length
        },
        connectedClients: this.clients.size,
        timestamp: currentTime
      });
      
      this.lastProcessedTime = currentTime;
    }
  }

  /**
   * Generate unique order ID
   */
  generateOrderId() {
    return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current market data for symbol
   */
  getMarketData(symbol) {
    return this.marketDataFeeds.get(symbol) || null;
  }

  /**
   * Get engine status and metrics
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      metrics: this.metrics,
      queueSizes: {
        ticks: this.tickQueue.length,
        orders: this.orderQueue.length
      },
      connectedClients: this.clients.size,
      marketDataFeeds: Array.from(this.marketDataFeeds.keys())
    };
  }

  /**
   * Simulate market data for testing
   */
  simulateMarketData() {
    const symbols = ['CRUDE_OIL', 'NATURAL_GAS', 'ELECTRICITY', 'CARBON_CREDITS'];
    
    setInterval(() => {
      symbols.forEach(symbol => {
        const basePrice = this.getBasePrice(symbol);
        const volatility = this.getVolatility(symbol);
        
        this.addTick({
          symbol,
          price: basePrice + (Math.random() - 0.5) * volatility,
          bid: basePrice - Math.random() * 0.1,
          ask: basePrice + Math.random() * 0.1,
          volume: Math.floor(Math.random() * 1000) + 100,
          source: 'simulation'
        });
      });
    }, 10); // Add tick every 10ms for simulation
  }

  /**
   * Get base price for symbol (for simulation)
   */
  getBasePrice(symbol) {
    const basePrices = {
      'CRUDE_OIL': 75.50,
      'NATURAL_GAS': 3.25,
      'ELECTRICITY': 45.75,
      'CARBON_CREDITS': 25.00
    };
    
    return basePrices[symbol] || 50.00;
  }

  /**
   * Get volatility for symbol (for simulation)
   */
  getVolatility(symbol) {
    const volatilities = {
      'CRUDE_OIL': 2.0,
      'NATURAL_GAS': 0.5,
      'ELECTRICITY': 5.0,
      'CARBON_CREDITS': 1.0
    };
    
    return volatilities[symbol] || 1.0;
  }
}

module.exports = StreamingEngine;