const ExchangeConnectorRegistry = require('../src/services/exchangeConnectorRegistry');
const EnhancedRegulatoryService = require('../src/services/enhancedRegulatoryService');
const { NYMEXConnector, DMEConnector, OPECConnector, GuyanaConnector } = require('../src/services/exchangeConnectors');

describe('Exchange Connector Registry', () => {
  let registry;

  beforeEach(() => {
    registry = new ExchangeConnectorRegistry();
  });

  test('should initialize with default connectors', () => {
    const connectors = registry.getRegisteredConnectors();
    expect(connectors.length).toBeGreaterThan(0);
    
    const exchangeIds = connectors.map(c => c.exchangeId);
    expect(exchangeIds).toContain('NYMEX');
    expect(exchangeIds).toContain('DME');
    expect(exchangeIds).toContain('OPEC');
    expect(exchangeIds).toContain('GUYANA_NDR');
  });

  test('should register new connector', () => {
    const initialCount = registry.getRegisteredConnectors().length;
    
    class TestConnector extends require('../src/services/baseExchangeConnector') {
      constructor() {
        super({
          id: 'TEST',
          name: 'Test Exchange',
          region: 'Test',
          markets: ['test_commodity'],
          endpoints: {},
          protocols: ['REST'],
          timeZone: 'UTC',
          regulations: ['TEST_REG'],
        });
      }

      async initialize() {}
      async connect() { return { status: 'connected' }; }
      async disconnect() { return { status: 'disconnected' }; }
      async submitOrder() { return { orderId: 'test' }; }
      async getMarketData() { return { price: 100 }; }
      async subscribeToMarketData() { return { subscriptionId: 'test' }; }
    }

    registry.registerConnector('TEST', TestConnector);
    
    const newCount = registry.getRegisteredConnectors().length;
    expect(newCount).toBe(initialCount + 1);
  });

  test('should get connectors by region', () => {
    const americasConnectors = registry.getConnectorsByRegion('Americas');
    expect(americasConnectors.length).toBeGreaterThan(0);
    
    const exchangeIds = americasConnectors.map(c => c.exchangeId);
    expect(exchangeIds).toContain('NYMEX');
  });

  test('should get connectors by market', () => {
    const oilConnectors = registry.getConnectorsByMarket('crude_oil');
    expect(oilConnectors.length).toBeGreaterThan(0);
    
    const exchangeIds = oilConnectors.map(c => c.exchangeId);
    expect(exchangeIds).toContain('NYMEX');
    expect(exchangeIds).toContain('DME');
  });

  test('should get connectors by regulation', () => {
    const cftcConnectors = registry.getConnectorsByRegulation('CFTC');
    expect(cftcConnectors.length).toBeGreaterThan(0);
    
    const exchangeIds = cftcConnectors.map(c => c.exchangeId);
    expect(exchangeIds).toContain('NYMEX');
  });

  test('should find best exchange for criteria', () => {
    const criteria = {
      market: 'crude_oil',
      region: 'Americas',
      regulation: 'CFTC'
    };
    
    const bestExchange = registry.findBestExchange(criteria);
    expect(bestExchange).toBeDefined();
    expect(bestExchange.info.markets).toContain('crude_oil');
    expect(bestExchange.info.region).toBe('Americas');
    expect(bestExchange.info.regulations).toContain('CFTC');
  });
});

describe('NYMEX Connector', () => {
  let connector;

  beforeEach(() => {
    connector = new NYMEXConnector();
  });

  test('should initialize with correct configuration', () => {
    expect(connector.id).toBe('NYMEX');
    expect(connector.name).toBe('New York Mercantile Exchange');
    expect(connector.region).toBe('Americas');
    expect(connector.markets).toContain('crude_oil');
    expect(connector.regulations).toContain('CFTC');
  });

  test('should connect successfully with valid credentials', async () => {
    const credentials = { apiKey: 'test_key', apiSecret: 'test_secret' };
    const result = await connector.connect(credentials);
    
    expect(result.exchangeId).toBe('NYMEX');
    expect(result.status).toBe('connected');
    expect(connector.status).toBe('connected');
  });

  test('should validate order data correctly', () => {
    const validOrder = {
      symbol: 'crude_oil',
      quantity: 100,
      price: 75.50,
      side: 'buy'
    };
    
    expect(() => connector.validateNYMEXOrder(validOrder)).not.toThrow();
    
    const invalidOrder = {
      symbol: 'invalid_symbol',
      quantity: -100,
      price: 0,
      side: 'buy'
    };
    
    expect(() => connector.validateNYMEXOrder(invalidOrder)).toThrow();
  });

  test('should calculate fees correctly', () => {
    const orderData = { quantity: 100, price: 75.50 };
    const fees = connector.calculateNYMEXFees(orderData);
    
    expect(fees.exchangeFee).toBe(85); // 100 * 0.85
    expect(fees.clearingFee).toBe(4); // 100 * 0.04
    expect(fees.regulatoryFee).toBe(2); // 100 * 0.02
    expect(fees.total).toBe(91); // 85 + 4 + 2
  });
});

describe('Enhanced Regulatory Service', () => {
  let service;

  beforeEach(() => {
    service = new EnhancedRegulatoryService();
  });

  test('should initialize with all regulatory frameworks', () => {
    const frameworks = Object.keys(service.regulatoryFrameworks);
    
    expect(frameworks).toContain('MiFID_II');
    expect(frameworks).toContain('REMIT');
    expect(frameworks).toContain('Dodd_Frank');
    expect(frameworks).toContain('CFTC');
    expect(frameworks).toContain('SEC');
    expect(frameworks).toContain('FCA');
    expect(frameworks).toContain('Guyana_Local');
  });

  test('should get applicable regulations for exchange', () => {
    const nymexRegulations = service.getApplicableRegulations('NYMEX');
    expect(nymexRegulations).toContain('CFTC');
    expect(nymexRegulations).toContain('Dodd_Frank');
    expect(nymexRegulations).toContain('SEC');
    
    const eexRegulations = service.getApplicableRegulations('EEX');
    expect(eexRegulations).toContain('MiFID_II');
    expect(eexRegulations).toContain('REMIT');
    expect(eexRegulations).toContain('EMIR');
  });

  test('should perform regulatory compliance check', async () => {
    const transactionData = {
      commodity: 'crude_oil',
      volume: 1000,
      price: 75.50,
      value: 75500,
      traderId: 'TRADER_001',
      counterpartyId: 'COUNTER_001',
      country: 'US',
      localContentPercentage: 35,
      environmentalScore: 75,
      certifications: { environmental: true }
    };
    
    const result = await service.performRegulatoryCheck(transactionData, 'NYMEX');
    
    expect(result.checkId).toBeDefined();
    expect(result.exchangeId).toBe('NYMEX');
    expect(result.applicableRegulations).toContain('CFTC');
    expect(result.overallCompliance).toBeDefined();
    expect(result.complianceResults).toBeInstanceOf(Array);
  });

  test('should generate regulatory reports', async () => {
    const transactionData = {
      transaction_reference_number: 'TXN_001',
      quantity: 1000,
      price: 75.50,
      currency: 'USD',
      transaction_time: new Date().toISOString(),
      commodity: 'crude_oil',
      volume: 1000,
      localContentPercentage: 35,
    };
    
    const regulations = ['CFTC', 'SEC'];
    const result = await service.generateRegulatoryReports(transactionData, regulations, 'XML');
    
    expect(result.reportId).toBeDefined();
    expect(result.reports).toBeInstanceOf(Array);
    expect(result.reports.length).toBe(2);
    expect(result.exportFormat).toBe('XML');
    
    const cftcReport = result.reports.find(r => r.regulation === 'CFTC');
    expect(cftcReport).toBeDefined();
    expect(cftcReport.content).toContain('TRADER_001');
  });

  test('should export reports to files', async () => {
    const reports = [
      {
        regulation: 'CFTC',
        filename: 'CFTC_test.csv',
        content: 'trader_id,commodity_code,long_positions\nTRADER_001,CRUDE_OIL,1000'
      }
    ];
    
    const result = await service.exportReports(reports, '/tmp/test_exports');
    
    expect(result.success).toBe(true);
    expect(result.exportedFiles).toBeInstanceOf(Array);
    expect(result.exportedFiles.length).toBe(1);
    expect(result.totalFiles).toBe(1);
  });

  test('should generate XML report correctly', () => {
    const reportData = {
      transaction_reference_number: 'TXN_001',
      quantity: 1000,
      price: 75.50,
      currency: 'USD'
    };
    
    const template = {
      transactionReport: {
        fields: ['transaction_reference_number', 'quantity', 'price', 'currency']
      }
    };
    
    const xmlContent = service.generateXMLReport(reportData, 'CFTC', template);
    
    expect(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xmlContent).toContain('<CFTC_Report');
    expect(xmlContent).toContain('<transaction_reference_number>TXN_001</transaction_reference_number>');
    expect(xmlContent).toContain('<quantity>1000</quantity>');
    expect(xmlContent).toContain('<price>75.5</price>');
    expect(xmlContent).toContain('<currency>USD</currency>');
  });

  test('should generate CSV report correctly', () => {
    const reportData = {
      trader_id: 'TRADER_001',
      commodity_code: 'CRUDE_OIL',
      long_positions: 1000,
      short_positions: 0
    };
    
    const template = {
      largeTraderReport: {
        fields: ['trader_id', 'commodity_code', 'long_positions', 'short_positions'],
        headers: true
      }
    };
    
    const csvContent = service.generateCSVReport(reportData, 'CFTC', template);
    
    expect(csvContent).toContain('trader_id,commodity_code,long_positions,short_positions');
    expect(csvContent).toContain('TRADER_001,CRUDE_OIL,1000,0');
  });

  test('should check local content compliance for Guyana', async () => {
    const transactionData = {
      localContentPercentage: 25 // Below 30% requirement
    };
    
    const result = await service.checkLocalContent(transactionData, 'Guyana_Local');
    
    expect(result.requirement).toBe('local_content');
    expect(result.compliant).toBe(false);
    expect(result.severity).toBe('medium');
    expect(result.currentPercentage).toBe(25);
    expect(result.minimumRequired).toBe(30);
  });

  test('should check environmental compliance', async () => {
    const transactionData = {
      environmentalImpactScore: 65, // Below 70 requirement
      certifications: { environmental: false }
    };
    
    const result = await service.checkEnvironmentalCompliance(transactionData, 'Guyana_Local');
    
    expect(result.requirement).toBe('environmental_compliance');
    expect(result.compliant).toBe(false);
    expect(result.severity).toBe('medium');
    expect(result.currentScore).toBe(65);
    expect(result.requiredScore).toBe(70);
    expect(result.hasCertification).toBe(false);
  });
});

describe('Guyana Connector', () => {
  let connector;

  beforeEach(() => {
    connector = new GuyanaConnector();
  });

  test('should initialize with Guyana-specific requirements', async () => {
    await connector.initialize();
    
    expect(connector.localContentRequirement).toBe(30);
    expect(connector.environmentalStandards.minScore).toBe(70);
    expect(connector.environmentalStandards.renewableTarget).toBe(50);
  });

  test('should validate Guyana-specific order requirements', () => {
    const validOrder = {
      symbol: 'crude_oil',
      quantity: 100,
      price: 76.50,
      side: 'buy',
      localContentPercentage: 35,
      environmentalScore: 75
    };
    
    expect(() => connector.validateGuyanaOrder(validOrder)).not.toThrow();
    
    const invalidOrder = {
      symbol: 'crude_oil',
      quantity: 100,
      price: 76.50,
      side: 'buy',
      localContentPercentage: 25, // Below requirement
      environmentalScore: 65 // Below requirement
    };
    
    expect(() => connector.validateGuyanaOrder(invalidOrder)).toThrow();
  });

  test('should calculate fees with local content discount', () => {
    const orderData = {
      quantity: 100,
      price: 76.50,
      localContentPercentage: 55 // Above 50% for discount
    };
    
    const fees = connector.calculateGuyanaFees(orderData);
    
    expect(fees.localContentDiscount).toBeGreaterThan(0);
    expect(fees.exchangeFee).toBeLessThan(25); // Base rate with discount
    expect(fees.total).toBeGreaterThan(0);
  });
});