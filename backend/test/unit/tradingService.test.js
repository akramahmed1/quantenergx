const TradingService = require('../../src/services/tradingService');

describe('TradingService', () => {
  let tradingService;

  beforeEach(() => {
    tradingService = new TradingService();
  });

  afterEach(() => {
    tradingService.removeAllListeners();
  });

  describe('Initialization', () => {
    test('should initialize with correct configuration', () => {
      expect(tradingService.tradingConfig.maxOrderSize).toBe(10000000);
      expect(tradingService.tradingConfig.minOrderSize).toBe(1000);
      expect(tradingService.tradingConfig.supportedOrderTypes).toContain('market');
      expect(tradingService.tradingConfig.supportedOrderTypes).toContain('limit');
    });

    test('should initialize order books for all commodities', () => {
      const expectedCommodities = [
        'crude_oil',
        'natural_gas',
        'heating_oil',
        'gasoline',
        'renewable_certificates',
        'carbon_credits',
      ];

      expectedCommodities.forEach(commodity => {
        expect(tradingService.orderBook.has(commodity)).toBe(true);
        const orderBook = tradingService.orderBook.get(commodity);
        expect(orderBook).toHaveProperty('bids');
        expect(orderBook).toHaveProperty('asks');
        expect(Array.isArray(orderBook.bids)).toBe(true);
        expect(Array.isArray(orderBook.asks)).toBe(true);
      });
    });
  });

  describe('Order Validation', () => {
    test('should validate order size within limits', () => {
      const validOrder = {
        userId: 'user123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        totalValue: 7550
      };

      expect(() => tradingService.validateOrder(validOrder)).not.toThrow();
    });

    test('should reject order below minimum size', () => {
      const invalidOrder = {
        userId: 'user123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'buy',
        quantity: 1,
        price: 75.50,
        totalValue: 75.50
      };

      expect(() => tradingService.validateOrder(invalidOrder))
        .toThrow('Order size below minimum');
    });

    test('should reject order above maximum size', () => {
      const invalidOrder = {
        userId: 'user123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'buy',
        quantity: 200000,
        price: 75.50,
        totalValue: 15100000
      };

      expect(() => tradingService.validateOrder(invalidOrder))
        .toThrow('Order size exceeds maximum');
    });

    test('should reject unsupported order type', () => {
      const invalidOrder = {
        userId: 'user123',
        commodity: 'crude_oil',
        orderType: 'invalid_type',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        totalValue: 7550
      };

      expect(() => tradingService.validateOrder(invalidOrder))
        .toThrow('Unsupported order type');
    });

    test('should reject unsupported commodity', () => {
      const invalidOrder = {
        userId: 'user123',
        commodity: 'gold',
        orderType: 'limit',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        totalValue: 7550
      };

      expect(() => tradingService.validateOrder(invalidOrder))
        .toThrow('Unsupported commodity');
    });
  });

  describe('Order Placement', () => {
    test('should place valid limit order', async () => {
      const orderData = {
        userId: 'user123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        timeInForce: 'gtc'
      };

      const order = await tradingService.placeOrder(orderData);

      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.status).toBe('pending');
      expect(order.commodity).toBe('crude_oil');
      expect(order.side).toBe('buy');
      expect(order.quantity).toBe(100);
      expect(order.price).toBe(75.50);
    });

    test('should emit order placed event', async () => {
      const orderData = {
        userId: 'user123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        timeInForce: 'gtc'
      };

      const eventPromise = new Promise(resolve => {
        tradingService.once('orderPlaced', resolve);
      });

      await tradingService.placeOrder(orderData);
      const event = await eventPromise;

      expect(event.order).toBeDefined();
      expect(event.order.commodity).toBe('crude_oil');
    });

    test('should add order to order book', async () => {
      const orderData = {
        userId: 'user123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        timeInForce: 'gtc'
      };

      const order = await tradingService.placeOrder(orderData);
      const orderBook = tradingService.orderBook.get('crude_oil');

      expect(orderBook.bids).toHaveLength(1);
      expect(orderBook.bids[0].id).toBe(order.id);
    });
  });

  describe('Order Matching', () => {
    test('should match compatible buy and sell orders', async () => {
      // Place a sell order first
      const sellOrder = await tradingService.placeOrder({
        userId: 'seller123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'sell',
        quantity: 100,
        price: 75.50,
        timeInForce: 'gtc'
      });

      // Place a matching buy order
      const buyOrder = await tradingService.placeOrder({
        userId: 'buyer123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        timeInForce: 'gtc'
      });

      // Check that both orders are filled
      expect(sellOrder.status).toBe('filled');
      expect(buyOrder.status).toBe('filled');
    });

    test('should create trade when orders match', async () => {
      let tradeCreated = null;
      tradingService.once('tradeExecuted', (event) => {
        tradeCreated = event.trade;
      });

      // Place matching orders
      await tradingService.placeOrder({
        userId: 'seller123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'sell',
        quantity: 100,
        price: 75.50,
        timeInForce: 'gtc'
      });

      await tradingService.placeOrder({
        userId: 'buyer123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        timeInForce: 'gtc'
      });

      expect(tradeCreated).toBeDefined();
      expect(tradeCreated.commodity).toBe('crude_oil');
      expect(tradeCreated.quantity).toBe(100);
      expect(tradeCreated.price).toBe(75.50);
    });

    test('should partially fill orders when quantities differ', async () => {
      // Place a large sell order
      const sellOrder = await tradingService.placeOrder({
        userId: 'seller123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'sell',
        quantity: 200,
        price: 75.50,
        timeInForce: 'gtc'
      });

      // Place a smaller buy order
      const buyOrder = await tradingService.placeOrder({
        userId: 'buyer123',
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        timeInForce: 'gtc'
      });

      expect(buyOrder.status).toBe('filled');
      expect(sellOrder.status).toBe('partially_filled');
      expect(sellOrder.filledQuantity).toBe(100);
      expect(sellOrder.remainingQuantity).toBe(100);
    });
  });

  describe('Portfolio Management', () => {
    test('should create portfolio for new user', () => {
      const userId = 'user123';
      const portfolio = tradingService.getPortfolio(userId);

      expect(portfolio).toBeDefined();
      expect(portfolio.userId).toBe(userId);
      expect(portfolio.cash).toBe(0);
      expect(portfolio.positions).toEqual({});
    });

    test('should update portfolio after trade execution', async () => {
      const buyerId = 'buyer123';
      const sellerId = 'seller123';

      // Initialize portfolios with cash and positions
      tradingService.updatePortfolio(sellerId, { cash: 100000 });
      tradingService.updatePortfolio(sellerId, { 
        positions: { crude_oil: { quantity: 200, averagePrice: 70.00 } }
      });
      tradingService.updatePortfolio(buyerId, { cash: 10000 });

      // Place matching orders
      await tradingService.placeOrder({
        userId: sellerId,
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'sell',
        quantity: 100,
        price: 75.50,
        timeInForce: 'gtc'
      });

      await tradingService.placeOrder({
        userId: buyerId,
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'buy',
        quantity: 100,
        price: 75.50,
        timeInForce: 'gtc'
      });

      const buyerPortfolio = tradingService.getPortfolio(buyerId);
      const sellerPortfolio = tradingService.getPortfolio(sellerId);

      // Buyer should have less cash but crude oil position
      expect(buyerPortfolio.cash).toBeLessThan(10000);
      expect(buyerPortfolio.positions.crude_oil).toBeDefined();
      expect(buyerPortfolio.positions.crude_oil.quantity).toBe(100);

      // Seller should have more cash but less crude oil
      expect(sellerPortfolio.cash).toBeGreaterThan(100000);
      expect(sellerPortfolio.positions.crude_oil.quantity).toBe(100);
    });
  });

  describe('Position Management', () => {
    test('should calculate position value correctly', () => {
      const position = {
        quantity: 100,
        averagePrice: 75.50,
        currentPrice: 80.00
      };

      const value = tradingService.calculatePositionValue(position);
      const unrealizedPnL = tradingService.calculateUnrealizedPnL(position);

      expect(value).toBe(8000); // 100 * 80.00
      expect(unrealizedPnL).toBe(450); // (80.00 - 75.50) * 100
    });

    test('should handle negative unrealized PnL', () => {
      const position = {
        quantity: 100,
        averagePrice: 75.50,
        currentPrice: 70.00
      };

      const unrealizedPnL = tradingService.calculateUnrealizedPnL(position);
      expect(unrealizedPnL).toBe(-550); // (70.00 - 75.50) * 100
    });
  });

  describe('Market Data Integration', () => {
    test('should update market prices', () => {
      const priceUpdate = {
        commodity: 'crude_oil',
        price: 76.25,
        timestamp: new Date()
      };

      tradingService.updateMarketPrice(priceUpdate);

      const currentPrice = tradingService.getCurrentPrice('crude_oil');
      expect(currentPrice).toBe(76.25);
    });

    test('should emit price update event', () => {
      let priceUpdateEvent = null;
      tradingService.once('priceUpdate', (event) => {
        priceUpdateEvent = event;
      });

      const priceUpdate = {
        commodity: 'crude_oil',
        price: 76.25,
        timestamp: new Date()
      };

      tradingService.updateMarketPrice(priceUpdate);

      expect(priceUpdateEvent).toBeDefined();
      expect(priceUpdateEvent.commodity).toBe('crude_oil');
      expect(priceUpdateEvent.price).toBe(76.25);
    });
  });

  describe('Risk Management', () => {
    test('should check position limits before trade', async () => {
      const userId = 'user123';
      
      // Set up a portfolio with existing large position
      tradingService.updatePortfolio(userId, {
        positions: {
          crude_oil: { quantity: 600000, averagePrice: 75.00 } // Large position
        }
      });

      const orderData = {
        userId: userId,
        commodity: 'crude_oil',
        orderType: 'limit',
        side: 'buy',
        quantity: 100000, // This would exceed position limit
        price: 75.50,
        timeInForce: 'gtc'
      };

      await expect(tradingService.placeOrder(orderData))
        .rejects
        .toThrow('Position size would exceed maximum allowed');
    });

    test('should validate margin requirements', () => {
      const userId = 'user123';
      const orderValue = 50000;
      const availableCash = 10000;
      const marginRequirement = 0.1; // 10% margin

      tradingService.updatePortfolio(userId, { cash: availableCash });

      const hasMargin = tradingService.checkMarginRequirement(userId, orderValue, marginRequirement);
      expect(hasMargin).toBe(true); // 10% of 50000 = 5000, user has 10000

      const hasMarginLarge = tradingService.checkMarginRequirement(userId, 200000, marginRequirement);
      expect(hasMarginLarge).toBe(false); // 10% of 200000 = 20000, user only has 10000
    });
  });
});