const DerivativesService = require('../../src/services/derivativesService');
const RegionConfigService = require('../../src/services/regionConfigService');
const MarginService = require('../../src/services/marginService');

describe('DerivativesService', () => {
  let derivativesService;
  let regionConfigService;
  let marginService;

  beforeEach(() => {
    regionConfigService = new RegionConfigService();
    marginService = new MarginService(regionConfigService);
    derivativesService = new DerivativesService(regionConfigService, marginService);
  });

  afterEach(() => {
    // Clean up any timers or intervals
    derivativesService.removeAllListeners();
  });

  describe('Service Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(derivativesService).toBeDefined();
      expect(derivativesService.config).toBeDefined();
      expect(derivativesService.config.supportedDerivatives).toContain('future');
      expect(derivativesService.config.supportedDerivatives).toContain('option');
      expect(derivativesService.config.supportedDerivatives).toContain('swap');
      expect(derivativesService.config.supportedDerivatives).toContain('structured_note');
    });

    test('should initialize market data for supported commodities', () => {
      expect(derivativesService.marketData.size).toBeGreaterThan(0);
      expect(derivativesService.marketData.get('crude_oil')).toBeDefined();
      expect(derivativesService.marketData.get('natural_gas')).toBeDefined();
    });
  });

  describe('Future Contracts', () => {
    test('should create a valid future contract', async () => {
      const params = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 100000,
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        settlementType: 'cash',
        region: 'US',
        userId: 'test-user-id'
      };

      const contract = await derivativesService.createFutureContract(params);

      expect(contract).toBeDefined();
      expect(contract.id).toBeDefined();
      expect(contract.type).toBe('future');
      expect(contract.underlyingCommodity).toBe('crude_oil');
      expect(contract.notionalAmount).toBe(100000);
      expect(contract.settlementType).toBe('cash');
      expect(contract.region).toBe('US');
      expect(contract.status).toBe('active');
      expect(contract.tickSize).toBeDefined();
      expect(contract.contractSize).toBeDefined();
      expect(contract.marginRequirement).toBeGreaterThanOrEqual(0);
    });

    test('should reject future contract with invalid commodity', async () => {
      const params = {
        underlyingCommodity: 'invalid_commodity',
        notionalAmount: 100000,
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        region: 'US',
        userId: 'test-user-id'
      };

      await expect(derivativesService.createFutureContract(params))
        .rejects.toThrow('Unsupported commodity: invalid_commodity');
    });

    test('should reject future contract with invalid notional amount', async () => {
      const params = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 500, // Below minimum
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        region: 'US',
        userId: 'test-user-id'
      };

      await expect(derivativesService.createFutureContract(params))
        .rejects.toThrow('Notional amount must be between');
    });

    test('should emit contractCreated event', async () => {
      const params = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 100000,
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        region: 'US',
        userId: 'test-user-id'
      };

      const eventPromise = new Promise((resolve) => {
        derivativesService.once('contractCreated', resolve);
      });

      await derivativesService.createFutureContract(params);
      const event = await eventPromise;

      expect(event.type).toBe('future');
      expect(event.userId).toBe('test-user-id');
      expect(event.region).toBe('US');
    });
  });

  describe('Option Contracts', () => {
    test('should create a valid call option contract', async () => {
      const params = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 100000,
        optionType: 'call',
        strikePrice: 75,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        exerciseStyle: 'european',
        region: 'US',
        userId: 'test-user-id'
      };

      const contract = await derivativesService.createOptionContract(params);

      expect(contract).toBeDefined();
      expect(contract.type).toBe('option');
      expect(contract.optionType).toBe('call');
      expect(contract.strikePrice).toBe(75);
      expect(contract.exerciseStyle).toBe('european');
      expect(contract.premium).toBeGreaterThan(0);
      expect(contract.delta).toBeDefined();
      expect(contract.gamma).toBeDefined();
      expect(contract.theta).toBeDefined();
      expect(contract.vega).toBeDefined();
    });

    test('should create a valid put option contract', async () => {
      const params = {
        underlyingCommodity: 'natural_gas',
        notionalAmount: 50000,
        optionType: 'put',
        strikePrice: 3.5,
        expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        region: 'EU',
        userId: 'test-user-id'
      };

      const contract = await derivativesService.createOptionContract(params);

      expect(contract.optionType).toBe('put');
      expect(contract.region).toBe('EU');
      expect(contract.premium).toBeGreaterThan(0);
    });

    test('should calculate option premium correctly', () => {
      const premium = derivativesService.calculateOptionPremium({
        spot: 75,
        strike: 75,
        timeToExpiry: 0.25, // 3 months
        volatility: 0.3,
        riskFreeRate: 0.025,
        optionType: 'call'
      });

      expect(premium).toBeGreaterThan(0);
      expect(premium).toBeLessThan(75); // Premium should be less than spot for ATM call
    });
  });

  describe('Swap Contracts', () => {
    test('should create a valid commodity swap contract', async () => {
      const params = {
        underlyingCommodity: 'natural_gas',
        notionalAmount: 1000000,
        swapType: 'commodity_swap',
        fixedRate: 3.25,
        floatingRateIndex: 'NYMEX_HENRY_HUB',
        paymentFrequency: 'monthly',
        maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        region: 'US',
        userId: 'test-user-id'
      };

      const contract = await derivativesService.createSwapContract(params);

      expect(contract.type).toBe('swap');
      expect(contract.swapType).toBe('commodity_swap');
      expect(contract.fixedRate).toBe(3.25);
      expect(contract.floatingRateIndex).toBe('NYMEX_HENRY_HUB');
      expect(contract.paymentFrequency).toBe('monthly');
      expect(contract.resetFrequency).toBe('monthly');
      expect(contract.dayCountConvention).toBe('Actual/360');
    });

    test('should create a basis swap contract', async () => {
      const params = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 500000,
        swapType: 'basis_swap',
        floatingRateIndex: 'WTI_BRENT_SPREAD',
        paymentFrequency: 'quarterly',
        maturityDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        region: 'UK',
        userId: 'test-user-id'
      };

      const contract = await derivativesService.createSwapContract(params);

      expect(contract.swapType).toBe('basis_swap');
      expect(contract.region).toBe('UK');
    });
  });

  describe('Structured Notes', () => {
    test('should create a valid autocall structured note', async () => {
      const params = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 1000000,
        noteType: 'autocall',
        principalProtection: 95,
        maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        payoffStructure: {
          autocallBarrier: 105,
          couponBarrier: 70,
          couponRate: 8.5,
          knockInBarrier: 60
        },
        region: 'US',
        userId: 'test-user-id'
      };

      const contract = await derivativesService.createStructuredNote(params);

      expect(contract.type).toBe('structured_note');
      expect(contract.noteType).toBe('autocall');
      expect(contract.principalProtection).toBe(95);
      expect(contract.payoffStructure).toEqual(params.payoffStructure);
    });

    test('should create a barrier note', async () => {
      const params = {
        underlyingCommodity: 'renewable_certificates',
        notionalAmount: 250000,
        noteType: 'barrier_note',
        principalProtection: 100,
        maturityDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        payoffStructure: {
          barrierLevel: 80,
          participation: 150
        },
        region: 'EU',
        userId: 'test-user-id'
      };

      const contract = await derivativesService.createStructuredNote(params);

      expect(contract.noteType).toBe('barrier_note');
      expect(contract.principalProtection).toBe(100);
    });
  });

  describe('Contract Management', () => {
    test('should retrieve contract by ID', async () => {
      const params = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 100000,
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        region: 'US',
        userId: 'test-user-id'
      };

      const createdContract = await derivativesService.createFutureContract(params);
      const retrievedContract = await derivativesService.getContract(createdContract.id);

      expect(retrievedContract).toEqual(createdContract);
    });

    test('should get user contracts with region filter', async () => {
      const params1 = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 100000,
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        region: 'US',
        userId: 'test-user-id'
      };

      const params2 = {
        underlyingCommodity: 'natural_gas',
        notionalAmount: 50000,
        deliveryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        region: 'EU',
        userId: 'test-user-id'
      };

      await derivativesService.createFutureContract(params1);
      await derivativesService.createFutureContract(params2);

      const usContracts = await derivativesService.getUserContracts('test-user-id', 'US');
      const euContracts = await derivativesService.getUserContracts('test-user-id', 'EU');

      expect(usContracts.length).toBeGreaterThan(0);
      expect(euContracts.length).toBeGreaterThan(0);
    });

    test('should terminate contract successfully', async () => {
      const params = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 100000,
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        region: 'US',
        userId: 'test-user-id'
      };

      const contract = await derivativesService.createFutureContract(params);
      
      const eventPromise = new Promise((resolve) => {
        derivativesService.once('contractTerminated', resolve);
      });

      const terminatedContract = await derivativesService.terminateContract(contract.id, 'user_request');
      const event = await eventPromise;

      expect(terminatedContract.status).toBe('terminated');
      expect(event.contractId).toBe(contract.id);
      expect(event.reason).toBe('user_request');
    });
  });

  describe('Market Data Management', () => {
    test('should update market data and recalculate option Greeks', async () => {
      // Create an option contract first
      const optionParams = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 100000,
        optionType: 'call',
        strikePrice: 75,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        region: 'US',
        userId: 'test-user-id'
      };

      const optionContract = await derivativesService.createOptionContract(optionParams);
      const originalDelta = optionContract.delta;

      // Update market data
      await derivativesService.updateMarketData('crude_oil', {
        spot: 80,
        volatility: 0.4
      });

      // Retrieve contract and check if Greeks were updated
      const updatedContract = await derivativesService.getContract(optionContract.id);
      expect(updatedContract.updatedAt).not.toEqual(optionContract.updatedAt);
    });

    test('should generate random prices within expected ranges', () => {
      const crudePrice = derivativesService.generateRandomPrice('crude_oil');
      const gasPrice = derivativesService.generateRandomPrice('natural_gas');

      expect(crudePrice).toBeGreaterThan(60); // Should be around 75 ± 10%
      expect(crudePrice).toBeLessThan(90);
      expect(gasPrice).toBeGreaterThan(2.5); // Should be around 3.5 ± 10%
      expect(gasPrice).toBeLessThan(4.5);
    });
  });

  describe('Utility Functions', () => {
    test('should get correct tick size for commodities', () => {
      expect(derivativesService.getTickSize('crude_oil')).toBe(0.01);
      expect(derivativesService.getTickSize('natural_gas')).toBe(0.001);
      expect(derivativesService.getTickSize('unknown_commodity')).toBe(0.01);
    });

    test('should get correct contract size for commodities', () => {
      expect(derivativesService.getContractSize('crude_oil')).toBe(1000);
      expect(derivativesService.getContractSize('natural_gas')).toBe(10000);
      expect(derivativesService.getContractSize('unknown_commodity')).toBe(1);
    });

    test('should calculate time to expiry correctly', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      const timeToExpiry = derivativesService.calculateTimeToExpiry(futureDate);
      
      expect(timeToExpiry).toBeCloseTo(1, 1); // Approximately 1 year
      expect(timeToExpiry).toBeGreaterThan(0.9);
      expect(timeToExpiry).toBeLessThan(1.1);
    });

    test('should handle past expiry dates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const timeToExpiry = derivativesService.calculateTimeToExpiry(pastDate);
      
      expect(timeToExpiry).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle service dependencies gracefully', () => {
      const serviceWithoutDeps = new DerivativesService(null, null);
      expect(serviceWithoutDeps).toBeDefined();
    });

    test('should validate contract parameters', async () => {
      const invalidParams = {
        underlyingCommodity: '',
        notionalAmount: -1000,
        region: 'INVALID',
        userId: 'test-user-id'
      };

      await expect(derivativesService.createFutureContract(invalidParams))
        .rejects.toThrow();
    });
  });

  describe('Integration with Margin Service', () => {
    test('should calculate margin requirements for new contracts', async () => {
      const params = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 100000,
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        region: 'US',
        userId: 'test-user-id'
      };

      const contract = await derivativesService.createFutureContract(params);
      
      expect(contract.marginRequirement).toBeGreaterThan(0);
      expect(contract.marginRequirement).toBeLessThan(contract.notionalAmount);
    });
  });
});