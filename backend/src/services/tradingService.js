// Stub TradingService for backend compatibility
const EventEmitter = require('events');
class TradingService extends EventEmitter {
  constructor() {
    super();
    this.orders = new Map();
    this.trades = new Map();
    this.positions = new Map();
    this.portfolios = new Map();
    this.orderBook = new Map();
    this.tradingConfig = {
      maxOrderSize: 10000000,
      maxPositionSize: 50000000,
      minOrderSize: 1000,
      supportedOrderTypes: ['market', 'limit', 'stop', 'stop_limit'],
      supportedTimeInForce: ['day', 'gtc', 'ioc', 'fok'],
      tradingHours: { start: '09:00', end: '17:00', timezone: 'UTC' },
    };
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
      this.orderBook.set(commodity, { bids: [], asks: [] });
    });
  }

  async placeOrder(orderRequest) {
    // Stub: just return the orderRequest with an id
    return { id: 'stub-order-id', ...orderRequest, status: 'pending' };
  }
}

module.exports = TradingService;
