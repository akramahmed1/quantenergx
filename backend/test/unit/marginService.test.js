const MarginService = require('../../src/services/marginService');
const RegionConfigService = require('../../src/services/regionConfigService');

describe('MarginService', () => {
  let marginService;
  let regionConfigService;

  beforeEach(() => {
    regionConfigService = new RegionConfigService();
    marginService = new MarginService(regionConfigService);
  });

  afterEach(() => {
    // Clean up any timers or intervals
    marginService.stopMarginMonitoring();
    marginService.removeAllListeners();
  });

  describe('Service Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(marginService).toBeDefined();
      expect(marginService.config).toBeDefined();
      expect(marginService.config.defaultInitialMarginRate).toBe(0.10);
      expect(marginService.config.defaultMaintenanceMarginRate).toBe(0.075);
      expect(marginService.riskParameters).toBeDefined();
      expect(marginService.riskParameters.commodityVolatilities).toBeDefined();
    });

    test('should initialize correlation matrix', () => {
      const matrix = marginService.riskParameters.correlationMatrix;
      expect(matrix).toBeDefined();
      expect(matrix.crude_oil).toBeDefined();
      expect(matrix.crude_oil.crude_oil).toBe(1.0);
      expect(Math.abs(matrix.crude_oil.natural_gas)).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Future Margin Calculations', () => {
    test('should calculate initial margin for future contract', async () => {
      const contract = {
        type: 'future',
        underlyingCommodity: 'crude_oil',
        notionalAmount: 1000000,
        deliveryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        currency: 'USD'
      };

      const marginAmount = await marginService.calculateInitialMargin(contract, 'US');

      expect(marginAmount).toBeGreaterThan(0);
      expect(marginAmount).toBeLessThan(contract.notionalAmount);
      expect(marginAmount).toBeGreaterThanOrEqual(contract.notionalAmount * 0.05); // At least 5%
    });

    test('should calculate higher margin for more volatile commodities', async () => {
      const oilContract = {
        type: 'future',
        underlyingCommodity: 'crude_oil',
        notionalAmount: 1000000,
        currency: 'USD'
      };

      const gasContract = {
        type: 'future',
        underlyingCommodity: 'natural_gas',
        notionalAmount: 1000000,
        currency: 'USD'
      };

      const oilMargin = await marginService.calculateInitialMargin(oilContract, 'US');
      const gasMargin = await marginService.calculateInitialMargin(gasContract, 'US');

      // Natural gas is typically more volatile than crude oil
      expect(gasMargin).toBeGreaterThan(oilMargin);
    });

    test('should calculate risk array for SPAN-like calculation', () => {
      const contract = {
        underlyingCommodity: 'crude_oil',
        notionalAmount: 1000000
      };

      const riskArray = marginService.calculateRiskArray(contract);

      expect(riskArray).toHaveLength(7); // 7 price scenarios
      expect(Math.max(...riskArray)).toBeGreaterThan(0);
      expect(Math.min(...riskArray)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Option Margin Calculations', () => {
    test('should calculate margin for long option position', async () => {
      const contract = {
        type: 'option',
        underlyingCommodity: 'crude_oil',
        notionalAmount: 100000,
        optionType: 'call',
        premium: 5000,
        position: 'long',
        currency: 'USD'
      };

      const marginAmount = await marginService.calculateInitialMargin(contract, 'US');

      // Long option margin should equal premium
      expect(marginAmount).toBe(contract.premium);
    });

    test('should calculate higher margin for short option position', async () => {
      const contract = {
        type: 'option',
        underlyingCommodity: 'crude_oil',
        notionalAmount: 100000,
        optionType: 'call',
        premium: 5000,
        position: 'short',
        currency: 'USD'
      };

      const marginAmount = await marginService.calculateInitialMargin(contract, 'US');

      // Short option margin should be premium + percentage of underlying
      expect(marginAmount).toBeGreaterThan(contract.premium);
    });
  });

  describe('Swap Margin Calculations', () => {
    test('should calculate margin for swap based on duration', async () => {
      const shortTermSwap = {
        type: 'swap',
        underlyingCommodity: 'natural_gas',
        notionalAmount: 1000000,
        maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
        currency: 'USD'
      };

      const longTermSwap = {
        type: 'swap',
        underlyingCommodity: 'natural_gas',
        notionalAmount: 1000000,
        maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        currency: 'USD'
      };

      const shortTermMargin = await marginService.calculateInitialMargin(shortTermSwap, 'US');
      const longTermMargin = await marginService.calculateInitialMargin(longTermSwap, 'US');

      expect(longTermMargin).toBeGreaterThan(shortTermMargin);
    });
  });

  describe('Structured Note Margin Calculations', () => {
    test('should calculate margin based on principal protection level', async () => {
      const highProtectionNote = {
        type: 'structured_note',
        underlyingCommodity: 'crude_oil',
        notionalAmount: 1000000,
        principalProtection: 95,
        currency: 'USD'
      };

      const lowProtectionNote = {
        type: 'structured_note',
        underlyingCommodity: 'crude_oil',
        notionalAmount: 1000000,
        principalProtection: 50,
        currency: 'USD'
      };

      const highMargin = await marginService.calculateInitialMargin(highProtectionNote, 'US');
      const lowMargin = await marginService.calculateInitialMargin(lowProtectionNote, 'US');

      expect(lowMargin).toBeGreaterThan(highMargin);
    });
  });

  describe('Portfolio Margin Calculations', () => {
    test('should calculate simple portfolio margin', async () => {
      const userId = 'test-user-id';
      const region = 'US';

      // Mock some margin requirements
      const marginReq1 = {
        id: 'margin-1',
        contractId: 'contract-1',
        initialMargin: 50000,
        maintenanceMargin: 37500,
        region
      };

      const marginReq2 = {
        id: 'margin-2',
        contractId: 'contract-2',
        initialMargin: 30000,
        maintenanceMargin: 22500,
        region
      };

      marginService.marginRequirements.set('margin-1', marginReq1);
      marginService.marginRequirements.set('margin-2', marginReq2);

      // Mock getUserContracts to return test contracts
      jest.spyOn(marginService, 'getUserContracts').mockResolvedValue([
        { id: 'contract-1', userId },
        { id: 'contract-2', userId }
      ]);

      const portfolioMargin = await marginService.calculatePortfolioMargin(userId, region);

      expect(portfolioMargin.totalInitialMargin).toBe(80000);
      expect(portfolioMargin.totalMaintenanceMargin).toBe(60000);
    });

    test('should apply diversification benefits in advanced portfolio margining', async () => {
      const userId = 'test-user-id';
      const region = 'US';

      // Enable portfolio margining
      await regionConfigService.updateRegionConfig(region, {
        marginRules: {
          ...regionConfigService.getDefaultMarginRules(region),
          portfolioMarginingEnabled: true
        }
      });

      // Mock contracts with different commodities
      jest.spyOn(marginService, 'getUserContracts').mockResolvedValue([
        {
          id: 'contract-1',
          userId,
          underlyingCommodity: 'crude_oil',
          notionalAmount: 1000000,
          side: 'buy'
        },
        {
          id: 'contract-2',
          userId,
          underlyingCommodity: 'natural_gas',
          notionalAmount: 500000,
          side: 'sell'
        }
      ]);

      const portfolioMargin = await marginService.calculatePortfolioMargin(userId, region);

      expect(portfolioMargin.method).toBe('portfolio');
      expect(portfolioMargin.diversificationFactor).toBeLessThan(1.0);
      expect(portfolioMargin.commodityRisks).toBeDefined();
    });
  });

  describe('Margin Monitoring and Calls', () => {
    test('should issue margin call when requirements not met', async () => {
      const userId = 'test-user-id';
      const region = 'US';

      // Set low collateral
      marginService.userCollateral.set(`${userId}-${region}`, {
        cash: 10000,
        securities: 0,
        commodities: 0,
        currency: 'USD'
      });

      // Mock portfolio margin that exceeds available collateral
      jest.spyOn(marginService, 'calculatePortfolioMargin').mockResolvedValue({
        totalMaintenanceMargin: 50000,
        totalInitialMargin: 60000
      });

      const eventPromise = new Promise((resolve) => {
        marginService.once('marginCall', resolve);
      });

      const marginStatus = await marginService.checkMarginRequirements(userId, region);
      
      expect(marginStatus.status).toBe('margin_call');
      expect(marginStatus.deficit).toBeGreaterThan(0);

      const event = await eventPromise;
      expect(event.userId).toBe(userId);
      expect(event.amount).toBeGreaterThan(0);
    });

    test('should return adequate status when margin requirements met', async () => {
      const userId = 'test-user-id';
      const region = 'US';

      // Set high collateral
      marginService.userCollateral.set(`${userId}-${region}`, {
        cash: 100000,
        securities: 50000,
        commodities: 0,
        currency: 'USD'
      });

      // Mock lower portfolio margin
      jest.spyOn(marginService, 'calculatePortfolioMargin').mockResolvedValue({
        totalMaintenanceMargin: 30000,
        totalInitialMargin: 40000
      });

      const marginStatus = await marginService.checkMarginRequirements(userId, region);
      
      expect(marginStatus.status).toBe('adequate');
      expect(marginStatus.excessMargin).toBeGreaterThan(0);
    });

    test('should resolve margin call', async () => {
      const userId = 'test-user-id';
      const marginCall = await marginService.issueMarginCall(userId, 25000, 'US');

      const eventPromise = new Promise((resolve) => {
        marginService.once('marginCallResolved', resolve);
      });

      const resolvedCall = await marginService.resolveMarginCall(marginCall.id, 'met');
      const event = await eventPromise;

      expect(resolvedCall.status).toBe('met');
      expect(resolvedCall.resolvedAt).toBeDefined();
      expect(event.marginCallId).toBe(marginCall.id);
      expect(event.resolution).toBe('met');
    });
  });

  describe('Collateral Management', () => {
    test('should update user collateral and recheck margin', async () => {
      const userId = 'test-user-id';
      const region = 'US';

      // Mock margin check
      jest.spyOn(marginService, 'checkMarginRequirements').mockResolvedValue({
        status: 'adequate'
      });

      const collateralUpdate = {
        cash: 75000,
        securities: 25000
      };

      const updatedCollateral = await marginService.updateUserCollateral(
        userId,
        collateralUpdate,
        region
      );

      expect(updatedCollateral.cash).toBe(75000);
      expect(updatedCollateral.securities).toBe(25000);
      expect(updatedCollateral.lastUpdated).toBeDefined();
    });

    test('should get user collateral with defaults', () => {
      const userId = 'test-user-id';
      const region = 'US';

      const collateral = marginService.getUserCollateral(userId, region);

      expect(collateral.cash).toBe(0);
      expect(collateral.securities).toBe(0);
      expect(collateral.commodities).toBe(0);
      expect(collateral.currency).toBe('USD');
    });
  });

  describe('Region-specific Margin Rules', () => {
    test('should use region-specific margin rates', async () => {
      const contract = {
        type: 'future',
        underlyingCommodity: 'crude_oil',
        notionalAmount: 1000000,
        currency: 'USD'
      };

      const usMargin = await marginService.calculateInitialMargin(contract, 'US');
      const euMargin = await marginService.calculateInitialMargin(contract, 'EU');

      // US typically has higher margin rates
      expect(usMargin).toBeGreaterThan(euMargin);
    });

    test('should use default rules when region config not available', async () => {
      const contract = {
        type: 'future',
        underlyingCommodity: 'crude_oil',
        notionalAmount: 1000000,
        currency: 'USD'
      };

      const marginAmount = await marginService.calculateInitialMargin(contract, 'UNKNOWN_REGION');

      expect(marginAmount).toBeGreaterThan(0);
    });
  });

  describe('Margin Reporting', () => {
    test('should generate comprehensive margin report', async () => {
      const userId = 'test-user-id';
      const region = 'US';

      // Set up test data
      marginService.userCollateral.set(`${userId}-${region}`, {
        cash: 50000,
        securities: 25000,
        currency: 'USD'
      });

      jest.spyOn(marginService, 'calculatePortfolioMargin').mockResolvedValue({
        totalInitialMargin: 40000,
        totalMaintenanceMargin: 30000,
        method: 'simple'
      });

      jest.spyOn(marginService, 'checkMarginRequirements').mockResolvedValue({
        status: 'adequate',
        excessMargin: 15000
      });

      const report = await marginService.getMarginReport(userId, region);

      expect(report.userId).toBe(userId);
      expect(report.region).toBe(region);
      expect(report.portfolioMargin).toBeDefined();
      expect(report.collateral).toBeDefined();
      expect(report.marginStatus).toBeDefined();
      expect(report.timestamp).toBeDefined();
    });
  });

  describe('Risk Calculations', () => {
    test('should calculate commodity group risk with netting', () => {
      const contracts = [
        {
          notionalAmount: 1000000,
          side: 'buy',
          underlyingCommodity: 'crude_oil'
        },
        {
          notionalAmount: 500000,
          side: 'sell',
          underlyingCommodity: 'crude_oil'
        }
      ];

      // Mock margin requirements
      marginService.marginRequirements.set('contract-1', {
        id: 'margin-1',
        contractId: 'contract-1',
        initialMargin: 100000
      });
      marginService.marginRequirements.set('contract-2', {
        id: 'margin-2',
        contractId: 'contract-2',
        initialMargin: 50000
      });

      const risk = marginService.calculateCommodityGroupRisk(contracts);

      expect(risk).toBeGreaterThan(0);
      expect(risk).toBeLessThan(150000); // Should be less than sum due to netting
    });

    test('should calculate diversification factor for multiple commodities', () => {
      const commodityRisks = {
        crude_oil: 50000,
        natural_gas: 30000,
        heating_oil: 20000
      };

      const diversificationFactor = marginService.calculateDiversificationFactor(commodityRisks);

      expect(diversificationFactor).toBeGreaterThan(0);
      expect(diversificationFactor).toBeLessThanOrEqual(1.0);
      expect(diversificationFactor).toBeGreaterThanOrEqual(0.25); // Minimum benefit
    });
  });

  describe('Time Calculations', () => {
    test('should calculate time to maturity correctly', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      const timeToMaturity = marginService.calculateTimeToMaturity(futureDate);

      expect(timeToMaturity).toBeCloseTo(1, 1);
    });

    test('should handle past maturity dates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const timeToMaturity = marginService.calculateTimeToMaturity(pastDate);

      expect(timeToMaturity).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported contract types', async () => {
      const invalidContract = {
        type: 'invalid_type',
        underlyingCommodity: 'crude_oil',
        notionalAmount: 100000
      };

      await expect(marginService.calculateInitialMargin(invalidContract, 'US'))
        .rejects.toThrow('Unsupported contract type: invalid_type');
    });

    test('should handle missing margin call', async () => {
      await expect(marginService.getMarginCall('non-existent-id'))
        .resolves.toBeUndefined();
    });

    test('should handle margin call resolution for non-existent call', async () => {
      await expect(marginService.resolveMarginCall('non-existent-id', 'met'))
        .rejects.toThrow('Margin call not found: non-existent-id');
    });
  });
});