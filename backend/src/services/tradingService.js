const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class TradingService extends EventEmitter {
  constructor() {
    super();

    // In-memory storage for demo (would use database in production)
    this.orders = new Map();
    this.trades = new Map();
    this.positions = new Map();
    this.portfolios = new Map();
    this.orderBook = new Map(); // commodity -> { bids: [], asks: [] }

    // Trading configuration
    this.tradingConfig = {
      maxOrderSize: 10000000, // $10M max order size
      maxPositionSize: 50000000, // $50M max position size
      minOrderSize: 1000, // $1K min order size
      supportedOrderTypes: ['market', 'limit', 'stop', 'stop_limit'],
      supportedTimeInForce: ['day', 'gtc', 'ioc', 'fok'], // Good Till Cancelled, Immediate or Cancel, Fill or Kill
      tradingHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC',
      },
    };

    // Initialize order books for supported commodities
    this.initializeOrderBooks();
  }

  initializeOrderBooks() {
    const commodities = [
      'crude_oil',
      'natural_gas',
      'heating_oil',
      'gasoline',
      'renewable_certificates',
      'carbon_credits',
    ];

    commodities.forEach(commodity => {
      this.orderBook.set(commodity, {
        bids: [], // buy orders (sorted by price descending)
        asks: [], // sell orders (sorted by price ascending)
      });
    });
  }

  // Create a new order
  async placeOrder(orderRequest) {
    try {
      this.validateOrderRequest(orderRequest);

      const order = {
        id: uuidv4(),
        ...orderRequest,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        filledQuantity: 0,
        remainingQuantity: orderRequest.quantity,
        avgFillPrice: 0,
        trades: [],
      };

      // Store order
      this.orders.set(order.id, order);

      // Add to order book if limit order
      if (order.type === 'limit') {
        this.addToOrderBook(order);
      }

      // Process order based on type
      await this.processOrder(order);

      // Emit order placed event
      this.emit('orderPlaced', order);

      return order;
    } catch (error) {
      throw new Error(`Failed to place order: ${error.message}`);
    }
  }

  // Modify an existing order
  async modifyOrder(orderId, modifications) {
    try {
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending' && order.status !== 'partial') {
        throw new Error('Cannot modify order with status: ' + order.status);
      }

      // Remove from order book if it was there
      if (order.type === 'limit') {
        this.removeFromOrderBook(order);
      }

      // Apply modifications
      const oldOrder = { ...order };
      Object.assign(order, modifications, {
        updatedAt: new Date().toISOString(),
      });

      // Re-validate modified order
      this.validateOrderRequest(order);

      // Add back to order book if still limit order
      if (order.type === 'limit') {
        this.addToOrderBook(order);
      }

      // Re-process order
      await this.processOrder(order);

      // Emit order modified event
      this.emit('orderModified', { oldOrder, newOrder: order });

      return order;
    } catch (error) {
      throw new Error(`Failed to modify order: ${error.message}`);
    }
  }

  // Cancel an order
  async cancelOrder(orderId) {
    try {
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'filled' || order.status === 'cancelled') {
        throw new Error('Cannot cancel order with status: ' + order.status);
      }

      // Remove from order book
      if (order.type === 'limit') {
        this.removeFromOrderBook(order);
      }

      // Update order status
      order.status = 'cancelled';
      order.updatedAt = new Date().toISOString();

      // Emit order cancelled event
      this.emit('orderCancelled', order);

      return order;
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  // Process order based on type
  async processOrder(order) {
    switch (order.type) {
      case 'market':
        await this.processMarketOrder(order);
        break;
      case 'limit':
        await this.processLimitOrder(order);
        break;
      case 'stop':
        await this.processStopOrder(order);
        break;
      case 'stop_limit':
        await this.processStopLimitOrder(order);
        break;
      default:
        throw new Error(`Unsupported order type: ${order.type}`);
    }
  }

  // Process market order (immediate execution at best available price)
  async processMarketOrder(order) {
    const orderBook = this.orderBook.get(order.commodity);
    if (!orderBook) {
      throw new Error(`No order book for commodity: ${order.commodity}`);
    }

    const contraOrders = order.side === 'buy' ? orderBook.asks : orderBook.bids;

    if (contraOrders.length === 0) {
      // No liquidity available - use simulated market price
      const marketPrice = await this.getMarketPrice(order.commodity);
      await this.executeTrade(order, order.quantity, marketPrice);
    } else {
      // Execute against available orders
      let remainingQty = order.quantity;

      while (remainingQty > 0 && contraOrders.length > 0) {
        const contraOrder = contraOrders[0];
        const fillQty = Math.min(remainingQty, contraOrder.remainingQuantity);

        await this.executeTrade(order, fillQty, contraOrder.price, contraOrder);
        remainingQty -= fillQty;
      }

      // If still has remaining quantity, execute at market price
      if (remainingQty > 0) {
        const marketPrice = await this.getMarketPrice(order.commodity);
        await this.executeTrade(order, remainingQty, marketPrice);
      }
    }
  }

  // Process limit order
  async processLimitOrder(order) {
    const orderBook = this.orderBook.get(order.commodity);
    const contraOrders = order.side === 'buy' ? orderBook.asks : orderBook.bids;

    // Check for immediate matches
    let remainingQty = order.remainingQuantity;

    while (remainingQty > 0 && contraOrders.length > 0) {
      const contraOrder = contraOrders[0];

      // Check if prices cross
      const canMatch =
        order.side === 'buy' ? order.price >= contraOrder.price : order.price <= contraOrder.price;

      if (!canMatch) break;

      const fillQty = Math.min(remainingQty, contraOrder.remainingQuantity);
      await this.executeTrade(order, fillQty, contraOrder.price, contraOrder);
      remainingQty -= fillQty;
    }

    // Update order status
    if (order.filledQuantity === order.quantity) {
      order.status = 'filled';
    } else if (order.filledQuantity > 0) {
      order.status = 'partial';
    } else {
      order.status = 'pending';
    }
  }

  // Execute a trade between orders
  async executeTrade(aggressorOrder, quantity, price, passiveOrder = null) {
    const trade = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      commodity: aggressorOrder.commodity,
      quantity,
      price,
      aggressorOrderId: aggressorOrder.id,
      passiveOrderId: passiveOrder ? passiveOrder.id : null,
      aggressorUserId: aggressorOrder.userId,
      passiveUserId: passiveOrder ? passiveOrder.userId : 'market',
      value: quantity * price,
    };

    // Store trade
    this.trades.set(trade.id, trade);

    // Update aggressor order
    aggressorOrder.filledQuantity += quantity;
    aggressorOrder.remainingQuantity -= quantity;
    aggressorOrder.avgFillPrice = this.calculateAvgFillPrice(aggressorOrder);
    aggressorOrder.trades.push(trade.id);
    aggressorOrder.updatedAt = new Date().toISOString();

    if (aggressorOrder.remainingQuantity === 0) {
      aggressorOrder.status = 'filled';
      this.removeFromOrderBook(aggressorOrder);
    }

    // Update passive order if exists
    if (passiveOrder) {
      passiveOrder.filledQuantity += quantity;
      passiveOrder.remainingQuantity -= quantity;
      passiveOrder.avgFillPrice = this.calculateAvgFillPrice(passiveOrder);
      passiveOrder.trades.push(trade.id);
      passiveOrder.updatedAt = new Date().toISOString();

      if (passiveOrder.remainingQuantity === 0) {
        passiveOrder.status = 'filled';
        this.removeFromOrderBook(passiveOrder);
      }
    }

    // Update positions
    await this.updatePositions(trade);

    // Emit trade executed event
    this.emit('tradeExecuted', trade);

    return trade;
  }

  // Update positions after trade execution
  async updatePositions(trade) {
    const aggressorOrder = this.orders.get(trade.aggressorOrderId);
    const side = aggressorOrder.side;
    const quantity = side === 'buy' ? trade.quantity : -trade.quantity;

    // Update aggressor position
    await this.updateUserPosition(trade.aggressorUserId, trade.commodity, quantity, trade.price);

    // Update passive position if not market trade
    if (trade.passiveUserId !== 'market') {
      const passiveQuantity = -quantity; // opposite side
      await this.updateUserPosition(
        trade.passiveUserId,
        trade.commodity,
        passiveQuantity,
        trade.price
      );
    }
  }

  // Update user position
  async updateUserPosition(userId, commodity, quantity, price) {
    const positionKey = `${userId}_${commodity}`;
    let position = this.positions.get(positionKey);

    if (!position) {
      position = {
        userId,
        commodity,
        quantity: 0,
        avgPrice: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        lastUpdate: new Date().toISOString(),
      };
    }

    // Calculate new average price and quantity
    const oldQuantity = position.quantity;
    const oldAvgPrice = position.avgPrice;

    if ((oldQuantity >= 0 && quantity >= 0) || (oldQuantity <= 0 && quantity <= 0)) {
      // Same side - weighted average
      const totalValue = oldQuantity * oldAvgPrice + quantity * price;
      position.quantity += quantity;
      position.avgPrice = position.quantity !== 0 ? totalValue / position.quantity : 0;
    } else {
      // Opposite side - realize P&L on closed portion
      const closedQuantity = Math.min(Math.abs(oldQuantity), Math.abs(quantity));
      position.realizedPnL += closedQuantity * (price - oldAvgPrice) * Math.sign(oldQuantity);
      position.quantity += quantity;

      if (Math.sign(position.quantity) !== Math.sign(oldQuantity)) {
        // Position flipped sides
        position.avgPrice = price;
      }
    }

    position.lastUpdate = new Date().toISOString();
    this.positions.set(positionKey, position);

    // Calculate unrealized P&L
    await this.updateUnrealizedPnL(position);
  }

  // Calculate unrealized P&L for position
  async updateUnrealizedPnL(position) {
    try {
      const currentPrice = await this.getMarketPrice(position.commodity);
      position.unrealizedPnL = position.quantity * (currentPrice - position.avgPrice);
    } catch (error) {
      console.warn('Failed to update unrealized P&L:', error.message);
    }
  }

  // Add order to order book
  addToOrderBook(order) {
    const orderBook = this.orderBook.get(order.commodity);
    if (!orderBook) return;

    const orders = order.side === 'buy' ? orderBook.bids : orderBook.asks;

    // Insert order in price-priority order
    const insertIndex = this.findInsertIndex(orders, order);
    orders.splice(insertIndex, 0, order);
  }

  // Remove order from order book
  removeFromOrderBook(order) {
    const orderBook = this.orderBook.get(order.commodity);
    if (!orderBook) return;

    const orders = order.side === 'buy' ? orderBook.bids : orderBook.asks;
    const index = orders.findIndex(o => o.id === order.id);

    if (index !== -1) {
      orders.splice(index, 1);
    }
  }

  // Find insertion index for order book
  findInsertIndex(orders, newOrder) {
    const isAsk = newOrder.side === 'sell';

    for (let i = 0; i < orders.length; i++) {
      if (isAsk) {
        // Ask side: ascending price order
        if (newOrder.price < orders[i].price) return i;
      } else {
        // Bid side: descending price order
        if (newOrder.price > orders[i].price) return i;
      }
    }

    return orders.length;
  }

  // Calculate average fill price for order
  calculateAvgFillPrice(order) {
    if (order.filledQuantity === 0) return 0;

    let totalValue = 0;
    for (const tradeId of order.trades) {
      const trade = this.trades.get(tradeId);
      if (trade) {
        totalValue += trade.quantity * trade.price;
      }
    }

    return totalValue / order.filledQuantity;
  }

  // Get current market price (simulated)
  async getMarketPrice(commodity) {
    // In production, this would fetch from market data service
    const basePrices = {
      crude_oil: 80.5,
      natural_gas: 3.2,
      heating_oil: 2.45,
      gasoline: 2.3,
      renewable_certificates: 45.0,
      carbon_credits: 85.0,
    };

    const basePrice = basePrices[commodity] || 50.0;
    const volatility = 0.02; // 2% volatility
    const randomFactor = 1 + (Math.random() - 0.5) * volatility;

    return basePrice * randomFactor;
  }

  // Validate order request
  validateOrderRequest(order) {
    // Required fields
    const requiredFields = ['userId', 'commodity', 'side', 'type', 'quantity'];
    for (const field of requiredFields) {
      if (!order[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate commodity
    const supportedCommodities = Array.from(this.orderBook.keys());
    if (!supportedCommodities.includes(order.commodity)) {
      throw new Error(`Unsupported commodity: ${order.commodity}`);
    }

    // Validate side
    if (!['buy', 'sell'].includes(order.side)) {
      throw new Error('Side must be buy or sell');
    }

    // Validate order type
    if (!this.tradingConfig.supportedOrderTypes.includes(order.type)) {
      throw new Error(`Unsupported order type: ${order.type}`);
    }

    // Validate quantity
    if (order.quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    if (order.quantity < this.tradingConfig.minOrderSize) {
      throw new Error(`Order size below minimum: ${this.tradingConfig.minOrderSize}`);
    }

    if (order.quantity > this.tradingConfig.maxOrderSize) {
      throw new Error(`Order size exceeds maximum: ${this.tradingConfig.maxOrderSize}`);
    }

    // Validate price for limit orders
    if (
      (order.type === 'limit' || order.type === 'stop_limit') &&
      (!order.price || order.price <= 0)
    ) {
      throw new Error('Limit orders require a positive price');
    }

    // Validate stop price for stop orders
    if (
      (order.type === 'stop' || order.type === 'stop_limit') &&
      (!order.stopPrice || order.stopPrice <= 0)
    ) {
      throw new Error('Stop orders require a positive stop price');
    }

    // Validate time in force
    if (order.timeInForce && !this.tradingConfig.supportedTimeInForce.includes(order.timeInForce)) {
      throw new Error(`Unsupported time in force: ${order.timeInForce}`);
    }
  }

  // Get order by ID
  getOrder(orderId) {
    return this.orders.get(orderId);
  }

  // Get orders for user
  getUserOrders(userId, status = null) {
    const userOrders = Array.from(this.orders.values()).filter(order => order.userId === userId);

    if (status) {
      return userOrders.filter(order => order.status === status);
    }

    return userOrders;
  }

  // Get trade history
  getTradeHistory(userId = null, commodity = null, limit = 100) {
    let trades = Array.from(this.trades.values());

    if (userId) {
      trades = trades.filter(
        trade => trade.aggressorUserId === userId || trade.passiveUserId === userId
      );
    }

    if (commodity) {
      trades = trades.filter(trade => trade.commodity === commodity);
    }

    // Sort by timestamp descending
    trades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return trades.slice(0, limit);
  }

  // Get user positions
  getUserPositions(userId) {
    return Array.from(this.positions.values()).filter(position => position.userId === userId);
  }

  // Get order book for commodity
  getOrderBook(commodity, depth = 10) {
    const orderBook = this.orderBook.get(commodity);
    if (!orderBook) {
      throw new Error(`No order book for commodity: ${commodity}`);
    }

    return {
      commodity,
      timestamp: new Date().toISOString(),
      bids: orderBook.bids.slice(0, depth).map(order => ({
        price: order.price,
        quantity: order.remainingQuantity,
        orders: 1,
      })),
      asks: orderBook.asks.slice(0, depth).map(order => ({
        price: order.price,
        quantity: order.remainingQuantity,
        orders: 1,
      })),
    };
  }

  // Get portfolio summary
  async getPortfolioSummary(userId) {
    const positions = this.getUserPositions(userId);
    const orders = this.getUserOrders(userId);
    const trades = this.getTradeHistory(userId);

    // Update unrealized P&L for all positions
    for (const position of positions) {
      await this.updateUnrealizedPnL(position);
    }

    const totalValue = positions.reduce(
      (sum, pos) => sum + Math.abs(pos.quantity * pos.avgPrice),
      0
    );
    const totalPnL = positions.reduce((sum, pos) => sum + pos.realizedPnL + pos.unrealizedPnL, 0);

    return {
      userId,
      timestamp: new Date().toISOString(),
      positionCount: positions.length,
      activeOrders: orders.filter(o => o.status === 'pending' || o.status === 'partial').length,
      totalTrades: trades.length,
      totalValue,
      totalPnL,
      positions: positions,
      recentTrades: trades.slice(0, 10),
    };
  }

  // Process stop orders and stop limit orders (simplified)
  async processStopOrder(order) {
    // In production, this would monitor market prices and trigger when stop price is hit
    order.status = 'pending';
  }

  async processStopLimitOrder(order) {
    // In production, this would monitor market prices and convert to limit order when stop price is hit
    order.status = 'pending';
  }
}

module.exports = TradingService;
