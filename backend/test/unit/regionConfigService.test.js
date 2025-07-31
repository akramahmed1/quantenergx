const RegionConfigService = require('../../src/services/regionConfigService');

describe('RegionConfigService', () => {
  let regionConfigService;

  beforeEach(() => {
    regionConfigService = new RegionConfigService();
  });

  afterEach(() => {
    regionConfigService.removeAllListeners();
  });

  describe('Service Initialization', () => {
    test('should initialize with default regional configurations', () => {
      expect(regionConfigService).toBeDefined();
      expect(regionConfigService.regionConfigs.size).toBeGreaterThan(0);
      
      // Check default regions
      expect(regionConfigService.regionConfigs.has('US')).toBe(true);
      expect(regionConfigService.regionConfigs.has('EU')).toBe(true);
      expect(regionConfigService.regionConfigs.has('UK')).toBe(true);
      expect(regionConfigService.regionConfigs.has('APAC')).toBe(true);
      expect(regionConfigService.regionConfigs.has('CA')).toBe(true);
    });

    test('should have complete configuration for each region', () => {
      const usConfig = regionConfigService.regionConfigs.get('US');
      
      expect(usConfig.region).toBe('US');
      expect(usConfig.marginRules).toBeDefined();
      expect(usConfig.settlementRules).toBeDefined();
      expect(usConfig.tradingHours).toBeDefined();
      expect(usConfig.complianceRules).toBeDefined();
      expect(usConfig.currency).toBe('USD');
      expect(usConfig.timezone).toBe('America/New_York');
      expect(usConfig.isActive).toBe(true);
    });
  });

  describe('Default Margin Rules', () => {
    test('should generate US-specific margin rules', () => {
      const usMarginRules = regionConfigService.getDefaultMarginRules('US');
      
      expect(usMarginRules.defaultInitialMarginRate).toBe(0.12); // Higher for US
      expect(usMarginRules.portfolioMarginingEnabled).toBe(true);
      expect(usMarginRules.regulatoryModel).toBe('CFTC_SPAN');
    });

    test('should generate EU-specific margin rules', () => {
      const euMarginRules = regionConfigService.getDefaultMarginRules('EU');
      
      expect(euMarginRules.defaultInitialMarginRate).toBe(0.10);
      expect(euMarginRules.marginCallGracePeriod).toBe(48); // Longer grace period
      expect(euMarginRules.regulatoryModel).toBe('EMIR_SIMM');
    });

    test('should generate APAC-specific margin rules', () => {
      const apacMarginRules = regionConfigService.getDefaultMarginRules('APAC');
      
      expect(apacMarginRules.defaultInitialMarginRate).toBe(0.15); // Higher due to volatility
      expect(apacMarginRules.marginCallGracePeriod).toBe(12); // Shorter grace period
      expect(apacMarginRules.regulatoryModel).toBe('REGIONAL_STANDARD');
    });

    test('should provide base rules for unknown regions', () => {
      const unknownMarginRules = regionConfigService.getDefaultMarginRules('UNKNOWN');
      
      expect(unknownMarginRules.defaultInitialMarginRate).toBe(0.10);
      expect(unknownMarginRules.defaultMaintenanceMarginRate).toBe(0.075);
    });
  });

  describe('Default Settlement Rules', () => {
    test('should generate US-specific settlement rules', () => {
      const usSettlementRules = regionConfigService.getDefaultSettlementRules('US');
      
      expect(usSettlementRules.standardSettlementPeriod).toBe(2); // T+2
      expect(usSettlementRules.cutoffTimes.fedwire_cutoff).toBe('18:00');
      expect(usSettlementRules.supportedPaymentSystems).toContain('Fedwire');
      expect(usSettlementRules.regulatoryReporting).toBe(true);
    });

    test('should generate EU-specific settlement rules', () => {
      const euSettlementRules = regionConfigService.getDefaultSettlementRules('EU');
      
      expect(euSettlementRules.standardSettlementPeriod).toBe(1); // T+1 for some instruments
      expect(euSettlementRules.cutoffTimes.target2_cutoff).toBe('17:00');
      expect(euSettlementRules.supportedPaymentSystems).toContain('TARGET2');
    });

    test('should generate APAC-specific settlement rules', () => {
      const apacSettlementRules = regionConfigService.getDefaultSettlementRules('APAC');
      
      expect(apacSettlementRules.standardSettlementPeriod).toBe(3); // T+3 due to time zones
      expect(apacSettlementRules.crossBorderSettlement).toBe(true);
    });
  });

  describe('Default Trading Hours', () => {
    test('should generate US trading hours', () => {
      const usTradingHours = regionConfigService.getDefaultTradingHours('US');
      
      expect(usTradingHours.openTime).toBe('09:00');
      expect(usTradingHours.closeTime).toBe('17:00');
      expect(usTradingHours.timezone).toBe('America/New_York');
      expect(usTradingHours.extendedHours).toBeDefined();
      expect(usTradingHours.extendedHours.preMarket).toBe('08:00');
    });

    test('should generate APAC trading hours with night session', () => {
      const apacTradingHours = regionConfigService.getDefaultTradingHours('APAC');
      
      expect(apacTradingHours.timezone).toBe('Asia/Singapore');
      expect(apacTradingHours.nightSession).toBeDefined();
      expect(apacTradingHours.nightSession.openTime).toBe('19:00');
    });
  });

  describe('Default Compliance Rules', () => {
    test('should generate US compliance rules', () => {
      const usComplianceRules = regionConfigService.getDefaultComplianceRules('US');
      
      expect(usComplianceRules.regulatoryBodies).toContain('CFTC');
      expect(usComplianceRules.reportingRequirements.dodd_frank).toBe(true);
      expect(usComplianceRules.kycRequirements).toBe('enhanced');
      expect(usComplianceRules.sanctionsScreening).toBe(true);
    });

    test('should generate EU compliance rules', () => {
      const euComplianceRules = regionConfigService.getDefaultComplianceRules('EU');
      
      expect(euComplianceRules.regulatoryBodies).toContain('ESMA');
      expect(euComplianceRules.reportingRequirements.mifid_ii).toBe(true);
      expect(euComplianceRules.gdprCompliant).toBe(true);
    });
  });

  describe('Configuration Retrieval', () => {
    test('should get region configuration', async () => {
      const usConfig = await regionConfigService.getRegionConfig('US');
      
      expect(usConfig).toBeDefined();
      expect(usConfig.region).toBe('US');
      expect(usConfig.isActive).toBe(true);
    });

    test('should return undefined for non-existent region', async () => {
      const config = await regionConfigService.getRegionConfig('NON_EXISTENT');
      
      expect(config).toBeUndefined();
    });

    test('should get all active regions', async () => {
      const activeRegions = await regionConfigService.getActiveRegions();
      
      expect(activeRegions.length).toBeGreaterThan(0);
      expect(activeRegions.every(region => region.isActive)).toBe(true);
    });

    test('should get all regions including inactive', async () => {
      // Deactivate a region first
      await regionConfigService.deactivateRegion('CA', 'test');
      
      const allRegions = await regionConfigService.getAllRegions();
      const activeRegions = await regionConfigService.getActiveRegions();
      
      expect(allRegions.length).toBeGreaterThan(activeRegions.length);
    });
  });

  describe('Configuration Updates', () => {
    test('should update region configuration', async () => {
      const updates = {
        marginRules: {
          defaultInitialMarginRate: 0.15,
          defaultMaintenanceMarginRate: 0.10
        }
      };

      const eventPromise = new Promise((resolve) => {
        regionConfigService.once('regionConfigUpdated', resolve);
      });

      const updatedConfig = await regionConfigService.updateRegionConfig('US', updates);
      const event = await eventPromise;

      expect(updatedConfig.marginRules.defaultInitialMarginRate).toBe(0.15);
      expect(updatedConfig.lastUpdated).toBeDefined();
      expect(event.region).toBe('US');
      expect(event.backupId).toBeDefined();
    });

    test('should create backup when updating configuration', async () => {
      const originalConfig = await regionConfigService.getRegionConfig('US');
      
      const updates = { currency: 'CAD' };
      await regionConfigService.updateRegionConfig('US', updates);

      const history = await regionConfigService.getConfigHistory('US');
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].currency).toBe(originalConfig.currency);
    });

    test('should validate configuration updates', async () => {
      const invalidUpdates = {
        marginRules: {
          defaultInitialMarginRate: 1.5 // Invalid: > 1
        }
      };

      await expect(regionConfigService.updateRegionConfig('US', invalidUpdates))
        .rejects.toThrow('Initial margin rate must be between 0 and 1');
    });

    test('should reject update for non-existent region', async () => {
      const updates = { currency: 'EUR' };

      await expect(regionConfigService.updateRegionConfig('NON_EXISTENT', updates))
        .rejects.toThrow('Region configuration not found: NON_EXISTENT');
    });
  });

  describe('Configuration Creation', () => {
    test('should create new region configuration', async () => {
      const regionData = {
        region: 'TEST',
        name: 'Test Region',
        currency: 'USD',
        timezone: 'UTC',
        isActive: true
      };

      const eventPromise = new Promise((resolve) => {
        regionConfigService.once('regionConfigCreated', resolve);
      });

      const config = await regionConfigService.createRegionConfig(regionData);
      const event = await eventPromise;

      expect(config.region).toBe('TEST');
      expect(config.currency).toBe('USD');
      expect(config.marginRules).toBeDefined();
      expect(config.settlementRules).toBeDefined();
      expect(event.region).toBe('TEST');
    });

    test('should reject creation of existing region', async () => {
      const regionData = {
        region: 'US',
        name: 'United States',
        currency: 'USD',
        timezone: 'America/New_York',
        isActive: true
      };

      await expect(regionConfigService.createRegionConfig(regionData))
        .rejects.toThrow('Region configuration already exists: US');
    });
  });

  describe('Configuration Validation', () => {
    test('should validate complete configuration', () => {
      const validConfig = {
        region: 'TEST',
        currency: 'USD',
        timezone: 'UTC',
        marginRules: {
          defaultInitialMarginRate: 0.10,
          defaultMaintenanceMarginRate: 0.075
        },
        settlementRules: {
          standardSettlementPeriod: 2
        },
        tradingHours: {
          openTime: '09:00',
          closeTime: '17:00'
        }
      };

      expect(() => regionConfigService.validateRegionConfig(validConfig))
        .not.toThrow();
    });

    test('should reject configuration with missing required fields', () => {
      const invalidConfig = {
        region: 'TEST'
        // Missing required fields
      };

      expect(() => regionConfigService.validateRegionConfig(invalidConfig))
        .toThrow('Missing required field');
    });

    test('should reject invalid margin rates', () => {
      const invalidConfig = {
        region: 'TEST',
        currency: 'USD',
        timezone: 'UTC',
        marginRules: {
          defaultInitialMarginRate: 1.5, // Invalid
          defaultMaintenanceMarginRate: 0.075
        },
        settlementRules: { standardSettlementPeriod: 2 },
        tradingHours: { openTime: '09:00', closeTime: '17:00' }
      };

      expect(() => regionConfigService.validateRegionConfig(invalidConfig))
        .toThrow('Initial margin rate must be between 0 and 1');
    });

    test('should reject maintenance margin >= initial margin', () => {
      const invalidConfig = {
        region: 'TEST',
        currency: 'USD',
        timezone: 'UTC',
        marginRules: {
          defaultInitialMarginRate: 0.075,
          defaultMaintenanceMarginRate: 0.10 // Higher than initial
        },
        settlementRules: { standardSettlementPeriod: 2 },
        tradingHours: { openTime: '09:00', closeTime: '17:00' }
      };

      expect(() => regionConfigService.validateRegionConfig(invalidConfig))
        .toThrow('Maintenance margin rate must be less than initial margin rate');
    });
  });

  describe('Region Activation/Deactivation', () => {
    test('should deactivate region', async () => {
      const eventPromise = new Promise((resolve) => {
        regionConfigService.once('regionDeactivated', resolve);
      });

      const config = await regionConfigService.deactivateRegion('CA', 'maintenance');
      const event = await eventPromise;

      expect(config.isActive).toBe(false);
      expect(config.deactivationReason).toBe('maintenance');
      expect(config.deactivatedAt).toBeDefined();
      expect(event.region).toBe('CA');
      expect(event.reason).toBe('maintenance');
    });

    test('should reactivate region', async () => {
      // First deactivate
      await regionConfigService.deactivateRegion('CA', 'test');

      const eventPromise = new Promise((resolve) => {
        regionConfigService.once('regionActivated', resolve);
      });

      const config = await regionConfigService.activateRegion('CA');
      const event = await eventPromise;

      expect(config.isActive).toBe(true);
      expect(config.deactivationReason).toBeNull();
      expect(config.reactivatedAt).toBeDefined();
      expect(event.region).toBe('CA');
    });

    test('should reject deactivation of non-existent region', async () => {
      await expect(regionConfigService.deactivateRegion('NON_EXISTENT'))
        .rejects.toThrow('Region configuration not found: NON_EXISTENT');
    });
  });

  describe('Utility Methods', () => {
    test('should get margin rules for region', async () => {
      const marginRules = await regionConfigService.getMarginRules('US');
      
      expect(marginRules).toBeDefined();
      expect(marginRules.defaultInitialMarginRate).toBeDefined();
      expect(marginRules.defaultMaintenanceMarginRate).toBeDefined();
    });

    test('should get settlement rules for region', async () => {
      const settlementRules = await regionConfigService.getSettlementRules('US');
      
      expect(settlementRules).toBeDefined();
      expect(settlementRules.standardSettlementPeriod).toBeDefined();
      expect(settlementRules.supportedSettlementMethods).toBeDefined();
    });

    test('should get trading hours for region', async () => {
      const tradingHours = await regionConfigService.getTradingHours('US');
      
      expect(tradingHours).toBeDefined();
      expect(tradingHours.openTime).toBeDefined();
      expect(tradingHours.closeTime).toBeDefined();
      expect(tradingHours.timezone).toBeDefined();
    });

    test('should get compliance rules for region', async () => {
      const complianceRules = await regionConfigService.getComplianceRules('US');
      
      expect(complianceRules).toBeDefined();
      expect(complianceRules.positionLimits).toBeDefined();
      expect(complianceRules.reportingThresholds).toBeDefined();
    });

    test('should check if region is active', async () => {
      const isActive = await regionConfigService.isRegionActive('US');
      expect(isActive).toBe(true);

      const isInactive = await regionConfigService.isRegionActive('NON_EXISTENT');
      expect(isInactive).toBe(false);
    });
  });

  describe('Trading Hours Validation', () => {
    test('should allow trading during business hours', async () => {
      // Mock a Tuesday at 10 AM EST
      const mockTime = new Date('2023-12-05T15:00:00Z'); // 10 AM EST

      const isTradingAllowed = await regionConfigService.isTradingAllowed('US', mockTime);
      expect(isTradingAllowed).toBe(true);
    });

    test('should not allow trading outside business hours', async () => {
      // Mock a Tuesday at 8 AM EST (before market open)
      const mockTime = new Date('2023-12-05T13:00:00Z'); // 8 AM EST

      const isTradingAllowed = await regionConfigService.isTradingAllowed('US', mockTime);
      expect(isTradingAllowed).toBe(false);
    });

    test('should not allow trading on weekends', async () => {
      // Mock a Saturday
      const mockTime = new Date('2023-12-02T15:00:00Z'); // Saturday

      const isTradingAllowed = await regionConfigService.isTradingAllowed('US', mockTime);
      expect(isTradingAllowed).toBe(false);
    });

    test('should not allow trading for inactive regions', async () => {
      await regionConfigService.deactivateRegion('CA', 'test');

      const mockTime = new Date('2023-12-05T15:00:00Z'); // Tuesday 10 AM EST

      const isTradingAllowed = await regionConfigService.isTradingAllowed('CA', mockTime);
      expect(isTradingAllowed).toBe(false);
    });
  });

  describe('Configuration History and Rollback', () => {
    test('should maintain configuration history', async () => {
      // Make multiple updates
      await regionConfigService.updateRegionConfig('US', { currency: 'EUR' });
      await regionConfigService.updateRegionConfig('US', { currency: 'GBP' });

      const history = await regionConfigService.getConfigHistory('US');
      
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].backupTimestamp).toBeDefined();
      expect(history[1].backupTimestamp).toBeDefined();
      expect(history[0].backupTimestamp).toBeGreaterThan(history[1].backupTimestamp);
    });

    test('should rollback to previous configuration', async () => {
      const originalConfig = await regionConfigService.getRegionConfig('US');
      
      // Update configuration
      await regionConfigService.updateRegionConfig('US', { currency: 'EUR' });
      
      // Get backup ID
      const history = await regionConfigService.getConfigHistory('US');
      const backupId = history[0].backupId;

      const eventPromise = new Promise((resolve) => {
        regionConfigService.once('regionConfigRolledBack', resolve);
      });

      // Rollback
      const rolledBackConfig = await regionConfigService.rollbackConfig('US', backupId);
      const event = await eventPromise;

      expect(rolledBackConfig.currency).toBe(originalConfig.currency);
      expect(rolledBackConfig.rolledBackFrom).toBe(backupId);
      expect(event.region).toBe('US');
      expect(event.backupId).toBe(backupId);
    });

    test('should reject rollback with invalid backup ID', async () => {
      await expect(regionConfigService.rollbackConfig('US', 'invalid-backup-id'))
        .rejects.toThrow('Backup not found: invalid-backup-id');
    });
  });

  describe('Default Configurations', () => {
    test('should provide different clearing houses by region', () => {
      expect(regionConfigService.getDefaultClearingHouse('US')).toBe('CME_CLEARING');
      expect(regionConfigService.getDefaultClearingHouse('EU')).toBe('LCH_EU');
      expect(regionConfigService.getDefaultClearingHouse('UK')).toBe('LCH_UK');
      expect(regionConfigService.getDefaultClearingHouse('APAC')).toBe('SGX_CLEARING');
      expect(regionConfigService.getDefaultClearingHouse('UNKNOWN')).toBe('DEFAULT_CLEARING');
    });

    test('should provide regulatory frameworks by region', () => {
      const usFramework = regionConfigService.getDefaultRegulatoryFramework('US');
      expect(usFramework.primary).toBe('CFTC');
      expect(usFramework.framework).toBe('US_DERIVATIVES');

      const euFramework = regionConfigService.getDefaultRegulatoryFramework('EU');
      expect(euFramework.primary).toBe('ESMA');
      expect(euFramework.framework).toBe('EU_DERIVATIVES');
    });
  });

  describe('Error Handling', () => {
    test('should handle service initialization gracefully', () => {
      const newService = new RegionConfigService();
      expect(newService.regionConfigs.size).toBeGreaterThan(0);
    });

    test('should handle non-existent regions gracefully', async () => {
      const marginRules = await regionConfigService.getMarginRules('NON_EXISTENT');
      expect(marginRules).toBeDefined(); // Should return defaults
      
      const isActive = await regionConfigService.isRegionActive('NON_EXISTENT');
      expect(isActive).toBe(false);
    });
  });
});