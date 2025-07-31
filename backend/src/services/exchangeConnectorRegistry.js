const BaseExchangeConnector = require('./baseExchangeConnector');
const { 
  NYMEXConnector, 
  DMEConnector, 
  OPECConnector, 
  GuyanaConnector 
} = require('./exchangeConnectors');

/**
 * Exchange Connector Registry
 * Manages all exchange connectors in a modular, plug-and-play architecture
 */
class ExchangeConnectorRegistry {
  constructor() {
    this.connectors = new Map();
    this.activeConnections = new Map();
    this.initializeDefaultConnectors();
  }

  /**
   * Initialize default exchange connectors
   */
  initializeDefaultConnectors() {
    // Register all default connectors
    this.registerConnector('NYMEX', NYMEXConnector);
    this.registerConnector('DME', DMEConnector);
    this.registerConnector('OPEC', OPECConnector);
    this.registerConnector('GUYANA_NDR', GuyanaConnector);
    
    // Legacy connectors from MultiExchangeConnector can be registered here
    this.registerLegacyConnectors();
  }

  /**
   * Register a new exchange connector
   */
  registerConnector(exchangeId, ConnectorClass) {
    if (!exchangeId || !ConnectorClass) {
      throw new Error('Exchange ID and Connector Class are required');
    }

    // Validate that the connector extends BaseExchangeConnector
    const connector = new ConnectorClass();
    if (!(connector instanceof BaseExchangeConnector)) {
      throw new Error('Connector must extend BaseExchangeConnector');
    }

    this.connectors.set(exchangeId, {
      ConnectorClass,
      instance: null,
      registered: new Date().toISOString(),
    });

    console.log(`Registered exchange connector: ${exchangeId}`);
  }

  /**
   * Unregister an exchange connector
   */
  unregisterConnector(exchangeId) {
    if (this.activeConnections.has(exchangeId)) {
      throw new Error(`Cannot unregister ${exchangeId}: active connection exists`);
    }

    const removed = this.connectors.delete(exchangeId);
    if (removed) {
      console.log(`Unregistered exchange connector: ${exchangeId}`);
    }
    
    return removed;
  }

  /**
   * Get a connector instance
   */
  getConnector(exchangeId) {
    const connectorInfo = this.connectors.get(exchangeId);
    
    if (!connectorInfo) {
      throw new Error(`Exchange connector not found: ${exchangeId}`);
    }

    // Create instance if not exists
    if (!connectorInfo.instance) {
      connectorInfo.instance = new connectorInfo.ConnectorClass();
      connectorInfo.instance.initialize();
    }

    return connectorInfo.instance;
  }

  /**
   * Connect to an exchange
   */
  async connectToExchange(exchangeId, credentials) {
    if (this.activeConnections.has(exchangeId)) {
      throw new Error(`Already connected to ${exchangeId}`);
    }

    const connector = this.getConnector(exchangeId);
    
    try {
      const connectionResult = await connector.connect(credentials);
      
      this.activeConnections.set(exchangeId, {
        connector,
        connectionInfo: connectionResult,
        connectedAt: new Date().toISOString(),
        credentials: { ...credentials, apiSecret: '[REDACTED]' }, // Don't store secret
      });

      return connectionResult;
    } catch (error) {
      throw new Error(`Failed to connect to ${exchangeId}: ${error.message}`);
    }
  }

  /**
   * Disconnect from an exchange
   */
  async disconnectFromExchange(exchangeId) {
    const connectionInfo = this.activeConnections.get(exchangeId);
    
    if (!connectionInfo) {
      throw new Error(`No active connection to ${exchangeId}`);
    }

    try {
      const disconnectionResult = await connectionInfo.connector.disconnect();
      this.activeConnections.delete(exchangeId);
      
      return disconnectionResult;
    } catch (error) {
      throw new Error(`Failed to disconnect from ${exchangeId}: ${error.message}`);
    }
  }

  /**
   * Submit order to an exchange
   */
  async submitOrder(exchangeId, orderData) {
    const connectionInfo = this.activeConnections.get(exchangeId);
    
    if (!connectionInfo) {
      throw new Error(`Not connected to ${exchangeId}`);
    }

    try {
      return await connectionInfo.connector.submitOrder(orderData);
    } catch (error) {
      throw new Error(`Order submission failed on ${exchangeId}: ${error.message}`);
    }
  }

  /**
   * Get market data from an exchange
   */
  async getMarketData(exchangeId, symbol) {
    const connectionInfo = this.activeConnections.get(exchangeId);
    
    if (!connectionInfo) {
      throw new Error(`Not connected to ${exchangeId}`);
    }

    try {
      return await connectionInfo.connector.getMarketData(symbol);
    } catch (error) {
      throw new Error(`Failed to get market data from ${exchangeId}: ${error.message}`);
    }
  }

  /**
   * Subscribe to market data from an exchange
   */
  async subscribeToMarketData(exchangeId, symbols, callback) {
    const connectionInfo = this.activeConnections.get(exchangeId);
    
    if (!connectionInfo) {
      throw new Error(`Not connected to ${exchangeId}`);
    }

    try {
      return await connectionInfo.connector.subscribeToMarketData(symbols, callback);
    } catch (error) {
      throw new Error(`Failed to subscribe to market data from ${exchangeId}: ${error.message}`);
    }
  }

  /**
   * Get all registered connectors
   */
  getRegisteredConnectors() {
    const result = [];
    
    for (const [exchangeId, connectorInfo] of this.connectors) {
      const connector = connectorInfo.instance || new connectorInfo.ConnectorClass();
      result.push({
        exchangeId,
        info: connector.getInfo(),
        registered: connectorInfo.registered,
        connected: this.activeConnections.has(exchangeId),
      });
    }
    
    return result;
  }

  /**
   * Get all active connections
   */
  getActiveConnections() {
    const result = [];
    
    for (const [exchangeId, connectionInfo] of this.activeConnections) {
      result.push({
        exchangeId,
        connectionInfo: connectionInfo.connectionInfo,
        connectedAt: connectionInfo.connectedAt,
        info: connectionInfo.connector.getInfo(),
      });
    }
    
    return result;
  }

  /**
   * Get connectors by region
   */
  getConnectorsByRegion(region) {
    const result = [];
    
    for (const [exchangeId, connectorInfo] of this.connectors) {
      const connector = connectorInfo.instance || new connectorInfo.ConnectorClass();
      if (connector.region === region) {
        result.push({
          exchangeId,
          info: connector.getInfo(),
          connected: this.activeConnections.has(exchangeId),
        });
      }
    }
    
    return result;
  }

  /**
   * Get connectors by market
   */
  getConnectorsByMarket(market) {
    const result = [];
    
    for (const [exchangeId, connectorInfo] of this.connectors) {
      const connector = connectorInfo.instance || new connectorInfo.ConnectorClass();
      if (connector.supportsMarket(market)) {
        result.push({
          exchangeId,
          info: connector.getInfo(),
          connected: this.activeConnections.has(exchangeId),
        });
      }
    }
    
    return result;
  }

  /**
   * Get connectors by regulation
   */
  getConnectorsByRegulation(regulation) {
    const result = [];
    
    for (const [exchangeId, connectorInfo] of this.connectors) {
      const connector = connectorInfo.instance || new connectorInfo.ConnectorClass();
      if (connector.supportsRegulation(regulation)) {
        result.push({
          exchangeId,
          info: connector.getInfo(),
          connected: this.activeConnections.has(exchangeId),
        });
      }
    }
    
    return result;
  }

  /**
   * Find best exchange for a trade
   */
  findBestExchange(criteria) {
    const { market, region, regulation, minimumVolume } = criteria;
    let candidates = this.getRegisteredConnectors();

    // Filter by market
    if (market) {
      candidates = candidates.filter(c => c.info.markets.includes(market));
    }

    // Filter by region
    if (region) {
      candidates = candidates.filter(c => c.info.region === region);
    }

    // Filter by regulation
    if (regulation) {
      candidates = candidates.filter(c => c.info.regulations.includes(regulation));
    }

    // Filter by connection status (prefer connected exchanges)
    const connectedCandidates = candidates.filter(c => c.connected);
    
    if (connectedCandidates.length > 0) {
      return connectedCandidates[0]; // Return first connected candidate
    }

    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Load external connector plugin
   */
  async loadConnectorPlugin(pluginPath, exchangeId) {
    try {
      const ConnectorPlugin = require(pluginPath);
      
      // Validate plugin
      const pluginInstance = new ConnectorPlugin();
      if (!(pluginInstance instanceof BaseExchangeConnector)) {
        throw new Error('Plugin must extend BaseExchangeConnector');
      }

      this.registerConnector(exchangeId, ConnectorPlugin);
      
      return {
        success: true,
        exchangeId,
        pluginPath,
        loadedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to load connector plugin: ${error.message}`);
    }
  }

  /**
   * Get system health status
   */
  getSystemHealth() {
    const totalConnectors = this.connectors.size;
    const activeConnections = this.activeConnections.size;
    const connectionRate = totalConnectors > 0 ? (activeConnections / totalConnectors) * 100 : 0;

    const health = {
      status: connectionRate > 50 ? 'healthy' : connectionRate > 25 ? 'warning' : 'critical',
      totalConnectors,
      activeConnections,
      connectionRate: Math.round(connectionRate),
      lastCheck: new Date().toISOString(),
    };

    // Check individual connector health
    const connectorHealth = [];
    for (const [exchangeId, connectionInfo] of this.activeConnections) {
      try {
        const connector = connectionInfo.connector;
        connectorHealth.push({
          exchangeId,
          status: connector.status,
          lastHeartbeat: connectionInfo.connector.connection?.lastHeartbeat,
          connectedDuration: Date.now() - new Date(connectionInfo.connectedAt).getTime(),
        });
      } catch (error) {
        connectorHealth.push({
          exchangeId,
          status: 'error',
          error: error.message,
        });
      }
    }

    health.connectorHealth = connectorHealth;
    return health;
  }

  /**
   * Register legacy connectors from MultiExchangeConnector
   */
  registerLegacyConnectors() {
    // This would register the existing ICE, EEX, CME, APX, MEPEX connectors
    // For now, we'll create simple wrapper classes

    class ICEConnector extends BaseExchangeConnector {
      constructor() {
        super({
          id: 'ICE',
          name: 'Intercontinental Exchange',
          region: 'Global',
          markets: ['crude_oil', 'natural_gas', 'electricity', 'carbon'],
          endpoints: {
            market_data: 'wss://ice-market-data.com/ws',
            trading: 'https://ice-trading.com/api',
            clearing: 'https://ice-clearing.com/api',
          },
          protocols: ['FIX', 'REST', 'WebSocket'],
          timeZone: 'America/New_York',
          regulations: ['CFTC', 'SEC', 'FCA', 'EMIR'],
        });
      }

      async initialize() { /* Implementation */ }
      async connect(credentials) { 
        this.status = 'connected';
        return { exchangeId: this.id, status: 'connected', timestamp: new Date().toISOString() };
      }
      async disconnect() { 
        this.status = 'disconnected';
        return { exchangeId: this.id, status: 'disconnected', timestamp: new Date().toISOString() };
      }
      async submitOrder(orderData) { 
        return { orderId: `ICE_${Date.now()}`, status: 'submitted', timestamp: new Date().toISOString() };
      }
      async getMarketData(symbol) { 
        return { exchangeId: this.id, symbol, price: 75.5, timestamp: new Date().toISOString() };
      }
      async subscribeToMarketData(symbols, callback) { 
        return { subscriptionId: `ICE_SUB_${Date.now()}`, symbols };
      }
    }

    class EEXConnector extends BaseExchangeConnector {
      constructor() {
        super({
          id: 'EEX',
          name: 'European Energy Exchange',
          region: 'Europe',
          markets: ['electricity', 'natural_gas', 'carbon', 'coal'],
          endpoints: {
            market_data: 'wss://eex-market-data.com/ws',
            trading: 'https://eex-trading.com/api',
            clearing: 'https://eex-clearing.com/api',
          },
          protocols: ['FIX', 'REST'],
          timeZone: 'Europe/Berlin',
          regulations: ['MiFID_II', 'REMIT', 'EMIR', 'MAR'],
        });
      }

      async initialize() { /* Implementation */ }
      async connect(credentials) { 
        this.status = 'connected';
        return { exchangeId: this.id, status: 'connected', timestamp: new Date().toISOString() };
      }
      async disconnect() { 
        this.status = 'disconnected';
        return { exchangeId: this.id, status: 'disconnected', timestamp: new Date().toISOString() };
      }
      async submitOrder(orderData) { 
        return { orderId: `EEX_${Date.now()}`, status: 'submitted', timestamp: new Date().toISOString() };
      }
      async getMarketData(symbol) { 
        return { exchangeId: this.id, symbol, price: 45.75, timestamp: new Date().toISOString() };
      }
      async subscribeToMarketData(symbols, callback) { 
        return { subscriptionId: `EEX_SUB_${Date.now()}`, symbols };
      }
    }

    class CMEConnector extends BaseExchangeConnector {
      constructor() {
        super({
          id: 'CME',
          name: 'Chicago Mercantile Exchange',
          region: 'Americas',
          markets: ['crude_oil', 'natural_gas', 'electricity', 'refined_products'],
          endpoints: {
            market_data: 'wss://cme-market-data.com/ws',
            trading: 'https://cme-trading.com/api',
            clearing: 'https://cme-clearing.com/api',
          },
          protocols: ['FIX', 'CME Direct'],
          timeZone: 'America/Chicago',
          regulations: ['CFTC', 'Dodd_Frank', 'SEC'],
        });
      }

      async initialize() { /* Implementation */ }
      async connect(credentials) { 
        this.status = 'connected';
        return { exchangeId: this.id, status: 'connected', timestamp: new Date().toISOString() };
      }
      async disconnect() { 
        this.status = 'disconnected';
        return { exchangeId: this.id, status: 'disconnected', timestamp: new Date().toISOString() };
      }
      async submitOrder(orderData) { 
        return { orderId: `CME_${Date.now()}`, status: 'submitted', timestamp: new Date().toISOString() };
      }
      async getMarketData(symbol) { 
        return { exchangeId: this.id, symbol, price: 73.25, timestamp: new Date().toISOString() };
      }
      async subscribeToMarketData(symbols, callback) { 
        return { subscriptionId: `CME_SUB_${Date.now()}`, symbols };
      }
    }

    // Register legacy connectors
    this.registerConnector('ICE', ICEConnector);
    this.registerConnector('EEX', EEXConnector);
    this.registerConnector('CME', CMEConnector);
  }

  /**
   * Disconnect all active connections
   */
  async disconnectAll() {
    const results = [];
    
    for (const exchangeId of this.activeConnections.keys()) {
      try {
        const result = await this.disconnectFromExchange(exchangeId);
        results.push({ exchangeId, success: true, result });
      } catch (error) {
        results.push({ exchangeId, success: false, error: error.message });
      }
    }
    
    return {
      disconnected: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }
}

module.exports = ExchangeConnectorRegistry;