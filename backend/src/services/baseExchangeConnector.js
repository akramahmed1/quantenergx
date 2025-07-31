/**
 * Base Exchange Connector Interface
 * Provides standardized interface for all exchange connectors
 */
class BaseExchangeConnector {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.region = config.region;
    this.markets = config.markets;
    this.endpoints = config.endpoints;
    this.protocols = config.protocols;
    this.timeZone = config.timeZone;
    this.regulations = config.regulations || [];
    this.status = 'disconnected';
    this.connection = null;
  }

  /**
   * Initialize connector - must be implemented by specific connectors
   */
  async initialize() {
    throw new Error('initialize() must be implemented by connector');
  }

  /**
   * Connect to exchange - must be implemented by specific connectors
   */
  async connect(credentials) {
    throw new Error('connect() must be implemented by connector');
  }

  /**
   * Disconnect from exchange - must be implemented by specific connectors
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by connector');
  }

  /**
   * Submit order - must be implemented by specific connectors
   */
  async submitOrder(orderData) {
    throw new Error('submitOrder() must be implemented by connector');
  }

  /**
   * Get market data - must be implemented by specific connectors
   */
  async getMarketData(symbol) {
    throw new Error('getMarketData() must be implemented by connector');
  }

  /**
   * Subscribe to market data - must be implemented by specific connectors
   */
  async subscribeToMarketData(symbols, callback) {
    throw new Error('subscribeToMarketData() must be implemented by connector');
  }

  /**
   * Get account information - can be overridden by specific connectors
   */
  async getAccountInfo() {
    return {
      exchangeId: this.id,
      status: this.status,
      markets: this.markets,
      regulations: this.regulations,
    };
  }

  /**
   * Validate credentials - can be overridden by specific connectors
   */
  validateCredentials(credentials) {
    const required = ['apiKey', 'apiSecret'];
    const missing = required.filter(field => !credentials[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required credentials: ${missing.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Get connector info
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      region: this.region,
      markets: this.markets,
      protocols: this.protocols,
      timeZone: this.timeZone,
      regulations: this.regulations,
      status: this.status,
    };
  }

  /**
   * Check if connector supports a specific market
   */
  supportsMarket(market) {
    return this.markets.includes(market);
  }

  /**
   * Check if connector supports a specific regulation
   */
  supportsRegulation(regulation) {
    return this.regulations.includes(regulation);
  }

  /**
   * Get applicable regulations for this connector
   */
  getApplicableRegulations() {
    return this.regulations;
  }
}

module.exports = BaseExchangeConnector;