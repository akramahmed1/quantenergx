const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class RegionConfigService extends EventEmitter {
  constructor() {
    super();

    // In-memory storage for demo (would use database in production)
    this.regionConfigs = new Map();
    this.configHistory = new Map();

    // Initialize default regional configurations
    this.initializeDefaultConfigs();
  }

  initializeDefaultConfigs() {
    const defaultRegions = [
      {
        region: 'US',
        name: 'United States',
        currency: 'USD',
        timezone: 'America/New_York',
        isActive: true
      },
      {
        region: 'EU',
        name: 'European Union',
        currency: 'EUR',
        timezone: 'Europe/London',
        isActive: true
      },
      {
        region: 'APAC',
        name: 'Asia Pacific',
        currency: 'USD',
        timezone: 'Asia/Singapore',
        isActive: true
      },
      {
        region: 'UK',
        name: 'United Kingdom',
        currency: 'GBP',
        timezone: 'Europe/London',
        isActive: true
      },
      {
        region: 'CA',
        name: 'Canada',
        currency: 'CAD',
        timezone: 'America/Toronto',
        isActive: true
      }
    ];

    defaultRegions.forEach(regionInfo => {
      const config = this.createDefaultRegionConfig(regionInfo);
      this.regionConfigs.set(regionInfo.region, config);
    });
  }

  createDefaultRegionConfig(regionInfo) {
    return {
      region: regionInfo.region,
      marginRules: this.getDefaultMarginRules(regionInfo.region),
      settlementRules: this.getDefaultSettlementRules(regionInfo.region),
      tradingHours: this.getDefaultTradingHours(regionInfo.region),
      complianceRules: this.getDefaultComplianceRules(regionInfo.region),
      currency: regionInfo.currency,
      timezone: regionInfo.timezone,
      isActive: regionInfo.isActive,
      clearingHouse: this.getDefaultClearingHouse(regionInfo.region),
      regulatoryFramework: this.getDefaultRegulatoryFramework(regionInfo.region),
      lastUpdated: new Date(),
      createdAt: new Date()
    };
  }

  getDefaultMarginRules(region) {
    const baseRules = {
      defaultInitialMarginRate: 0.10, // 10%
      defaultMaintenanceMarginRate: 0.075, // 7.5%
      marginCallGracePeriod: 24, // hours
      marginCallThreshold: 0.05, // 5%
      crossMarginingEnabled: true,
      portfolioMarginingEnabled: true,
      riskModelParameters: {
        confidenceLevel: 0.99,
        lookbackPeriod: 252,
        volScalingFactor: 1.0
      }
    };

    // Region-specific adjustments
    switch (region) {
      case 'US':
        return {
          ...baseRules,
          defaultInitialMarginRate: 0.12, // Higher initial margin
          portfolioMarginingEnabled: true,
          regulatoryModel: 'CFTC_SPAN'
        };
      case 'EU':
        return {
          ...baseRules,
          defaultInitialMarginRate: 0.10,
          marginCallGracePeriod: 48, // Longer grace period
          regulatoryModel: 'EMIR_SIMM'
        };
      case 'UK':
        return {
          ...baseRules,
          defaultInitialMarginRate: 0.11,
          portfolioMarginingEnabled: true,
          regulatoryModel: 'FCA_SPAN'
        };
      case 'APAC':
        return {
          ...baseRules,
          defaultInitialMarginRate: 0.15, // Higher due to volatility
          marginCallGracePeriod: 12, // Shorter grace period
          regulatoryModel: 'REGIONAL_STANDARD'
        };
      case 'CA':
        return {
          ...baseRules,
          defaultInitialMarginRate: 0.10,
          regulatoryModel: 'CSA_STANDARD'
        };
      default:
        return baseRules;
    }
  }

  getDefaultSettlementRules(region) {
    const baseRules = {
      standardSettlementPeriod: 2, // T+2
      cutoffTimes: {
        trade_cutoff: '15:00',
        settlement_cutoff: '17:00'
      },
      supportedSettlementMethods: ['cash', 'physical', 'net_cash'],
      physicalDeliveryEnabled: true,
      cashSettlementEnabled: true,
      nettingEnabled: true,
      autoSettlementThreshold: 1000000 // $1M
    };

    // Region-specific adjustments
    switch (region) {
      case 'US':
        return {
          ...baseRules,
          cutoffTimes: {
            trade_cutoff: '15:00',
            settlement_cutoff: '17:00',
            fedwire_cutoff: '18:00'
          },
          supportedPaymentSystems: ['Fedwire', 'ACH', 'CHIPS'],
          regulatoryReporting: true
        };
      case 'EU':
        return {
          ...baseRules,
          standardSettlementPeriod: 1, // T+1 for some instruments
          cutoffTimes: {
            trade_cutoff: '16:00',
            settlement_cutoff: '18:00',
            target2_cutoff: '17:00'
          },
          supportedPaymentSystems: ['TARGET2', 'SEPA'],
          regulatoryReporting: true
        };
      case 'UK':
        return {
          ...baseRules,
          cutoffTimes: {
            trade_cutoff: '16:00',
            settlement_cutoff: '17:30',
            chaps_cutoff: '17:00'
          },
          supportedPaymentSystems: ['CHAPS', 'Faster Payments'],
          regulatoryReporting: true
        };
      case 'APAC':
        return {
          ...baseRules,
          standardSettlementPeriod: 3, // T+3 due to time zones
          cutoffTimes: {
            trade_cutoff: '14:00',
            settlement_cutoff: '16:00'
          },
          crossBorderSettlement: true
        };
      case 'CA':
        return {
          ...baseRules,
          cutoffTimes: {
            trade_cutoff: '15:30',
            settlement_cutoff: '17:30'
          },
          supportedPaymentSystems: ['LVTS', 'Interac'],
          regulatoryReporting: true
        };
      default:
        return baseRules;
    }
  }

  getDefaultTradingHours(region) {
    const baseTradingHours = {
      tradingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      holidays: []
    };

    switch (region) {
      case 'US':
        return {
          ...baseTradingHours,
          openTime: '09:00',
          closeTime: '17:00',
          timezone: 'America/New_York',
          extendedHours: {
            preMarket: '08:00',
            postMarket: '20:00'
          }
        };
      case 'EU':
        return {
          ...baseTradingHours,
          openTime: '08:00',
          closeTime: '18:00',
          timezone: 'Europe/London',
          extendedHours: {
            preMarket: '07:00',
            postMarket: '19:00'
          }
        };
      case 'UK':
        return {
          ...baseTradingHours,
          openTime: '08:00',
          closeTime: '16:30',
          timezone: 'Europe/London'
        };
      case 'APAC':
        return {
          ...baseTradingHours,
          openTime: '09:00',
          closeTime: '17:00',
          timezone: 'Asia/Singapore',
          nightSession: {
            openTime: '19:00',
            closeTime: '03:00'
          }
        };
      case 'CA':
        return {
          ...baseTradingHours,
          openTime: '09:00',
          closeTime: '17:00',
          timezone: 'America/Toronto'
        };
      default:
        return {
          ...baseTradingHours,
          openTime: '09:00',
          closeTime: '17:00',
          timezone: 'UTC'
        };
    }
  }

  getDefaultComplianceRules(region) {
    const baseRules = {
      positionLimits: {
        crude_oil: 50000000, // $50M
        natural_gas: 30000000, // $30M
        renewable_certificates: 20000000, // $20M
        carbon_credits: 25000000 // $25M
      },
      reportingThresholds: {
        large_trader: 10000000, // $10M
        position_reporting: 5000000, // $5M
        transaction_reporting: 1000000 // $1M
      },
      requiredDisclosures: [
        'beneficial_ownership',
        'related_party_transactions'
      ],
      riskLimits: {
        daily_var: 1000000, // $1M
        stress_test: 5000000 // $5M
      }
    };

    // Region-specific compliance adjustments
    switch (region) {
      case 'US':
        return {
          ...baseRules,
          regulatoryBodies: ['CFTC', 'NFA', 'FERC'],
          reportingRequirements: {
            dodd_frank: true,
            position_limits: true,
            swap_data_reporting: true
          },
          kycRequirements: 'enhanced',
          sanctionsScreening: true
        };
      case 'EU':
        return {
          ...baseRules,
          regulatoryBodies: ['ESMA', 'National Regulators'],
          reportingRequirements: {
            mifid_ii: true,
            emir: true,
            remit: true
          },
          gdprCompliant: true,
          sanctionsScreening: true
        };
      case 'UK':
        return {
          ...baseRules,
          regulatoryBodies: ['FCA', 'PRA'],
          reportingRequirements: {
            uk_mifir: true,
            uk_emir: true
          },
          sanctionsScreening: true
        };
      case 'APAC':
        return {
          ...baseRules,
          reportingThresholds: {
            ...baseRules.reportingThresholds,
            large_trader: 5000000 // Lower threshold
          },
          crossBorderReporting: true
        };
      case 'CA':
        return {
          ...baseRules,
          regulatoryBodies: ['IIROC', 'Provincial Regulators'],
          reportingRequirements: {
            canadian_derivatives: true
          }
        };
      default:
        return baseRules;
    }
  }

  getDefaultClearingHouse(region) {
    const clearingHouses = {
      US: 'CME_CLEARING',
      EU: 'LCH_EU',
      UK: 'LCH_UK',
      APAC: 'SGX_CLEARING',
      CA: 'CDCC'
    };
    return clearingHouses[region] || 'DEFAULT_CLEARING';
  }

  getDefaultRegulatoryFramework(region) {
    const frameworks = {
      US: {
        primary: 'CFTC',
        secondary: ['NFA', 'FERC'],
        framework: 'US_DERIVATIVES'
      },
      EU: {
        primary: 'ESMA',
        secondary: ['National Competent Authorities'],
        framework: 'EU_DERIVATIVES'
      },
      UK: {
        primary: 'FCA',
        secondary: ['PRA'],
        framework: 'UK_DERIVATIVES'
      },
      APAC: {
        primary: 'REGIONAL',
        secondary: ['Local Regulators'],
        framework: 'REGIONAL_DERIVATIVES'
      },
      CA: {
        primary: 'IIROC',
        secondary: ['Provincial Regulators'],
        framework: 'CANADIAN_DERIVATIVES'
      }
    };
    return frameworks[region] || frameworks.US;
  }

  // Configuration management methods
  async getRegionConfig(region) {
    return this.regionConfigs.get(region);
  }

  async updateRegionConfig(region, updates) {
    try {
      const existingConfig = this.regionConfigs.get(region);
      if (!existingConfig) {
        throw new Error(`Region configuration not found: ${region}`);
      }

      // Create backup
      const backupId = uuidv4();
      this.configHistory.set(backupId, {
        ...existingConfig,
        backupId,
        backupTimestamp: new Date()
      });

      const updatedConfig = {
        ...existingConfig,
        ...updates,
        lastUpdated: new Date()
      };

      // Validate configuration
      this.validateRegionConfig(updatedConfig);

      this.regionConfigs.set(region, updatedConfig);

      this.emit('regionConfigUpdated', {
        region,
        updates,
        backupId
      });

      return updatedConfig;
    } catch (error) {
      throw new Error(`Failed to update region configuration: ${error.message}`);
    }
  }

  async createRegionConfig(regionData) {
    try {
      const { region } = regionData;

      if (this.regionConfigs.has(region)) {
        throw new Error(`Region configuration already exists: ${region}`);
      }

      const config = {
        ...this.createDefaultRegionConfig(regionData),
        ...regionData,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      this.validateRegionConfig(config);

      this.regionConfigs.set(region, config);

      this.emit('regionConfigCreated', { region });

      return config;
    } catch (error) {
      throw new Error(`Failed to create region configuration: ${error.message}`);
    }
  }

  validateRegionConfig(config) {
    const required = ['region', 'currency', 'timezone', 'marginRules', 'settlementRules', 'tradingHours'];
    
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate margin rules
    const { marginRules } = config;
    if (marginRules.defaultInitialMarginRate < 0 || marginRules.defaultInitialMarginRate > 1) {
      throw new Error('Initial margin rate must be between 0 and 1');
    }

    if (marginRules.defaultMaintenanceMarginRate < 0 || marginRules.defaultMaintenanceMarginRate > 1) {
      throw new Error('Maintenance margin rate must be between 0 and 1');
    }

    if (marginRules.defaultMaintenanceMarginRate >= marginRules.defaultInitialMarginRate) {
      throw new Error('Maintenance margin rate must be less than initial margin rate');
    }

    // Validate settlement rules
    const { settlementRules } = config;
    if (settlementRules.standardSettlementPeriod < 0 || settlementRules.standardSettlementPeriod > 10) {
      throw new Error('Settlement period must be between 0 and 10 days');
    }

    // Validate trading hours
    const { tradingHours } = config;
    if (!tradingHours.openTime || !tradingHours.closeTime) {
      throw new Error('Trading hours must include open and close times');
    }

    return true;
  }

  async getActiveRegions() {
    return Array.from(this.regionConfigs.values())
      .filter(config => config.isActive);
  }

  async getAllRegions() {
    return Array.from(this.regionConfigs.values());
  }

  async deactivateRegion(region, reason = 'administrative') {
    const config = this.regionConfigs.get(region);
    if (!config) {
      throw new Error(`Region configuration not found: ${region}`);
    }

    await this.updateRegionConfig(region, {
      isActive: false,
      deactivationReason: reason,
      deactivatedAt: new Date()
    });

    this.emit('regionDeactivated', { region, reason });

    return config;
  }

  async activateRegion(region) {
    const config = this.regionConfigs.get(region);
    if (!config) {
      throw new Error(`Region configuration not found: ${region}`);
    }

    await this.updateRegionConfig(region, {
      isActive: true,
      deactivationReason: null,
      deactivatedAt: null,
      reactivatedAt: new Date()
    });

    this.emit('regionActivated', { region });

    return config;
  }

  // Utility methods for other services
  async getMarginRules(region) {
    const config = await this.getRegionConfig(region);
    return config?.marginRules || this.getDefaultMarginRules(region);
  }

  async getSettlementRules(region) {
    const config = await this.getRegionConfig(region);
    return config?.settlementRules || this.getDefaultSettlementRules(region);
  }

  async getTradingHours(region) {
    const config = await this.getRegionConfig(region);
    return config?.tradingHours || this.getDefaultTradingHours(region);
  }

  async getComplianceRules(region) {
    const config = await this.getRegionConfig(region);
    return config?.complianceRules || this.getDefaultComplianceRules(region);
  }

  async isRegionActive(region) {
    const config = await this.getRegionConfig(region);
    return config?.isActive || false;
  }

  async isTradingAllowed(region, currentTime = new Date()) {
    const config = await this.getRegionConfig(region);
    if (!config || !config.isActive) {
      return false;
    }

    const tradingHours = config.tradingHours;
    const dayOfWeek = currentTime.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: config.timezone 
    }).toLowerCase();

    if (!tradingHours.tradingDays.includes(dayOfWeek)) {
      return false;
    }

    // Check holidays
    const currentDate = currentTime.toDateString();
    if (tradingHours.holidays.some(holiday => new Date(holiday).toDateString() === currentDate)) {
      return false;
    }

    // Check trading hours
    const currentTimeString = currentTime.toLocaleTimeString('en-GB', {
      hour12: false,
      timeZone: config.timezone,
      hour: '2-digit',
      minute: '2-digit'
    });

    return currentTimeString >= tradingHours.openTime && currentTimeString <= tradingHours.closeTime;
  }

  // Configuration history and rollback
  async getConfigHistory(region) {
    return Array.from(this.configHistory.values())
      .filter(backup => backup.region === region)
      .sort((a, b) => b.backupTimestamp - a.backupTimestamp);
  }

  async rollbackConfig(region, backupId) {
    const backup = this.configHistory.get(backupId);
    if (!backup || backup.region !== region) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    const rollbackConfig = { ...backup };
    delete rollbackConfig.backupId;
    delete rollbackConfig.backupTimestamp;
    rollbackConfig.lastUpdated = new Date();
    rollbackConfig.rolledBackFrom = backupId;

    this.regionConfigs.set(region, rollbackConfig);

    this.emit('regionConfigRolledBack', {
      region,
      backupId,
      rolledBackAt: new Date()
    });

    return rollbackConfig;
  }
}

module.exports = RegionConfigService;