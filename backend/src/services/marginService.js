const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class MarginService extends EventEmitter {
  constructor(regionConfigService) {
    super();

    this.regionConfigService = regionConfigService;

    // In-memory storage for demo (would use database in production)
    this.marginRequirements = new Map();
    this.marginCalls = new Map();
    this.userCollateral = new Map();
    this.portfolios = new Map();

    // Margin calculation configuration
    this.config = {
      defaultInitialMarginRate: 0.10, // 10%
      defaultMaintenanceMarginRate: 0.075, // 7.5%
      marginCallThreshold: 0.05, // 5% below maintenance
      maxLeverage: 10,
      riskFreeRate: 0.025, // 2.5%
      marginCallGracePeriod: 24, // 24 hours
      supported_calculation_methods: ['span', 'portfolio', 'standard']
    };

    // Risk model parameters
    this.riskParameters = {
      commodityVolatilities: {
        crude_oil: 0.35,
        natural_gas: 0.45,
        heating_oil: 0.30,
        gasoline: 0.32,
        renewable_certificates: 0.25,
        carbon_credits: 0.40,
        electricity: 0.50,
        coal: 0.28
      },
      lookbackPeriod: 252, // trading days
      confidenceLevel: 0.99
    };

    // Initialize correlation matrix after volatilities are defined
    this.riskParameters.correlationMatrix = this.initializeCorrelationMatrix();

    // Start real-time margin monitoring
    this.startMarginMonitoring();
  }

  initializeCorrelationMatrix() {
    // Simplified correlation matrix for demo
    const commodities = Object.keys(this.riskParameters.commodityVolatilities);
    const matrix = {};
    
    commodities.forEach(commodity1 => {
      matrix[commodity1] = {};
      commodities.forEach(commodity2 => {
        if (commodity1 === commodity2) {
          matrix[commodity1][commodity2] = 1.0;
        } else {
          // Random correlations for demo (in production, use historical data)
          matrix[commodity1][commodity2] = -0.3 + Math.random() * 0.6;
        }
      });
    });

    return matrix;
  }

  async calculateInitialMargin(contract, region = 'US') {
    try {
      const regionConfig = await this.regionConfigService.getRegionConfig(region);
      const marginRules = regionConfig?.marginRules || this.getDefaultMarginRules();

      let marginRequirement;

      switch (contract.type) {
      case 'future':
        marginRequirement = await this.calculateFutureMargin(contract, marginRules);
        break;
      case 'option':
        marginRequirement = await this.calculateOptionMargin(contract, marginRules);
        break;
      case 'swap':
        marginRequirement = await this.calculateSwapMargin(contract, marginRules);
        break;
      case 'structured_note':
        marginRequirement = await this.calculateStructuredNoteMargin(contract, marginRules);
        break;
      default:
        throw new Error(`Unsupported contract type: ${contract.type}`);
      }

      // Store margin requirement
      const marginId = uuidv4();
      const marginRecord = {
        id: marginId,
        contractId: contract.id,
        initialMargin: marginRequirement.initial,
        maintenanceMargin: marginRequirement.maintenance,
        variationMargin: 0,
        currency: contract.currency,
        calculationMethod: marginRules.portfolioMarginingEnabled ? 'portfolio' : 'standard',
        lastCalculated: new Date(),
        region
      };

      this.marginRequirements.set(marginId, marginRecord);

      return marginRequirement.initial;
    } catch (error) {
      throw new Error(`Failed to calculate initial margin: ${error.message}`);
    }
  }

  async calculateFutureMargin(contract, marginRules) {
    const { notionalAmount, underlyingCommodity } = contract;
    const volatility = this.riskParameters.commodityVolatilities[underlyingCommodity] || 0.30;
    
    // SPAN-like calculation
    const riskArray = this.calculateRiskArray(contract);
    const commodityRisk = Math.max(...riskArray);
    
    const initialMarginRate = Math.max(
      marginRules.defaultInitialMarginRate,
      volatility * 2 // 2 standard deviations
    );

    const maintenanceMarginRate = Math.max(
      marginRules.defaultMaintenanceMarginRate,
      volatility * 1.5 // 1.5 standard deviations
    );

    return {
      initial: notionalAmount * initialMarginRate,
      maintenance: notionalAmount * maintenanceMarginRate,
      commodityRisk,
      riskArray
    };
  }

  async calculateOptionMargin(contract, marginRules) {
    const { notionalAmount, optionType, premium } = contract;
    
    // For short options, margin is higher
    const isShort = contract.position === 'short'; // Assume this field exists
    
    if (isShort) {
      // Short option margin: premium + percentage of underlying
      const underlyingMargin = await this.calculateFutureMargin({
        ...contract,
        type: 'future'
      }, marginRules);
      
      return {
        initial: premium + underlyingMargin.initial * 0.5,
        maintenance: premium + underlyingMargin.maintenance * 0.5
      };
    } else {
      // Long option margin is just the premium
      return {
        initial: premium,
        maintenance: premium
      };
    }
  }

  async calculateSwapMargin(contract, marginRules) {
    const { notionalAmount, maturityDate } = contract;
    const timeToMaturity = this.calculateTimeToMaturity(maturityDate);
    
    // Swap margin based on duration and notional
    const durationRisk = Math.sqrt(timeToMaturity) * 0.01; // 1% per sqrt(year)
    
    return {
      initial: notionalAmount * durationRisk * 2,
      maintenance: notionalAmount * durationRisk * 1.5
    };
  }

  async calculateStructuredNoteMargin(contract, marginRules) {
    const { notionalAmount, principalProtection } = contract;
    
    // Margin based on principal protection level
    const riskLevel = (100 - principalProtection) / 100;
    const marginRate = marginRules.defaultInitialMarginRate * (1 + riskLevel);
    
    return {
      initial: notionalAmount * marginRate,
      maintenance: notionalAmount * marginRate * 0.75
    };
  }

  calculateRiskArray(contract) {
    // SPAN-like risk array calculation
    const { underlyingCommodity, notionalAmount } = contract;
    const volatility = this.riskParameters.commodityVolatilities[underlyingCommodity] || 0.30;
    
    // Price scenarios: -3σ, -2σ, -1σ, 0, +1σ, +2σ, +3σ
    const scenarios = [-3, -2, -1, 0, 1, 2, 3];
    const riskArray = scenarios.map(sigma => {
      const priceChange = sigma * volatility * Math.sqrt(1/252); // Daily volatility
      const risk = Math.abs(notionalAmount * priceChange);
      return risk;
    });

    return riskArray;
  }

  async calculatePortfolioMargin(userId, region = 'US') {
    try {
      const userContracts = await this.getUserContracts(userId, region);
      const regionConfig = await this.regionConfigService.getRegionConfig(region);
      const marginRules = regionConfig?.marginRules || this.getDefaultMarginRules();

      if (!marginRules.portfolioMarginingEnabled) {
        // Sum individual margins
        return this.calculateSimplePortfolioMargin(userContracts, marginRules);
      }

      // Advanced portfolio margining with netting and diversification
      return this.calculateAdvancedPortfolioMargin(userContracts, marginRules);
    } catch (error) {
      throw new Error(`Failed to calculate portfolio margin: ${error.message}`);
    }
  }

  calculateSimplePortfolioMargin(contracts, marginRules) {
    let totalInitialMargin = 0;
    let totalMaintenanceMargin = 0;

    contracts.forEach(contract => {
      const marginReq = this.marginRequirements.get(contract.id);
      if (marginReq) {
        totalInitialMargin += marginReq.initialMargin;
        totalMaintenanceMargin += marginReq.maintenanceMargin;
      }
    });

    return {
      totalInitialMargin,
      totalMaintenanceMargin,
      method: 'simple'
    };
  }

  calculateAdvancedPortfolioMargin(contracts, marginRules) {
    // Group contracts by commodity
    const commodityGroups = {};
    contracts.forEach(contract => {
      const commodity = contract.underlyingCommodity;
      if (!commodityGroups[commodity]) {
        commodityGroups[commodity] = [];
      }
      commodityGroups[commodity].push(contract);
    });

    let totalRisk = 0;
    const commodityRisks = {};

    // Calculate risk for each commodity group
    Object.entries(commodityGroups).forEach(([commodity, groupContracts]) => {
      const commodityRisk = this.calculateCommodityGroupRisk(groupContracts);
      commodityRisks[commodity] = commodityRisk;
      totalRisk += commodityRisk;
    });

    // Apply diversification benefit
    const diversificationFactor = this.calculateDiversificationFactor(commodityRisks);
    const diversifiedRisk = totalRisk * diversificationFactor;

    return {
      totalInitialMargin: diversifiedRisk * 1.2, // 20% buffer
      totalMaintenanceMargin: diversifiedRisk,
      method: 'portfolio',
      commodityRisks,
      diversificationFactor
    };
  }

  calculateCommodityGroupRisk(contracts) {
    // Net positions and calculate combined risk
    let netPosition = 0;
    let totalRisk = 0;

    contracts.forEach(contract => {
      const position = contract.notionalAmount * (contract.side === 'buy' ? 1 : -1);
      netPosition += position;
      
      const marginReq = this.marginRequirements.get(contract.id);
      if (marginReq) {
        totalRisk += marginReq.initialMargin;
      }
    });

    // Netting benefit
    const nettingFactor = Math.abs(netPosition) / contracts.reduce((sum, c) => sum + c.notionalAmount, 0);
    return totalRisk * (0.5 + 0.5 * nettingFactor); // 50% netting benefit
  }

  calculateDiversificationFactor(commodityRisks) {
    const commodities = Object.keys(commodityRisks);
    if (commodities.length <= 1) return 1.0;

    // Calculate correlation-based diversification
    let totalVariance = 0;
    const totalRisk = Object.values(commodityRisks).reduce((sum, risk) => sum + risk, 0);

    commodities.forEach(commodity1 => {
      commodities.forEach(commodity2 => {
        const correlation = this.riskParameters.correlationMatrix[commodity1]?.[commodity2] || 0;
        const weight1 = commodityRisks[commodity1] / totalRisk;
        const weight2 = commodityRisks[commodity2] / totalRisk;
        totalVariance += weight1 * weight2 * correlation;
      });
    });

    return Math.sqrt(Math.max(0.25, totalVariance)); // Minimum 75% diversification benefit
  }

  async checkMarginRequirements(userId, region = 'US') {
    try {
      const portfolioMargin = await this.calculatePortfolioMargin(userId, region);
      const userCollateral = this.getUserCollateral(userId, region);
      
      const availableMargin = userCollateral.cash + userCollateral.securities * 0.8; // 80% haircut on securities
      const marginDeficit = portfolioMargin.totalMaintenanceMargin - availableMargin;

      if (marginDeficit > 0) {
        await this.issueMarginCall(userId, marginDeficit, region);
        return {
          status: 'margin_call',
          deficit: marginDeficit,
          availableMargin,
          requiredMargin: portfolioMargin.totalMaintenanceMargin
        };
      }

      return {
        status: 'adequate',
        excessMargin: availableMargin - portfolioMargin.totalMaintenanceMargin,
        availableMargin,
        requiredMargin: portfolioMargin.totalMaintenanceMargin
      };
    } catch (error) {
      throw new Error(`Failed to check margin requirements: ${error.message}`);
    }
  }

  async issueMarginCall(userId, amount, region = 'US') {
    const marginCallId = uuidv4();
    const regionConfig = await this.regionConfigService.getRegionConfig(region);
    const gracePeriod = regionConfig?.marginRules?.marginCallGracePeriod || this.config.marginCallGracePeriod;

    const marginCall = {
      id: marginCallId,
      userId,
      contractIds: [], // Would be populated with specific contracts
      requiredAmount: amount,
      currency: 'USD',
      dueDate: new Date(Date.now() + gracePeriod * 60 * 60 * 1000), // Grace period in hours
      status: 'pending',
      region,
      createdAt: new Date()
    };

    this.marginCalls.set(marginCallId, marginCall);

    // Emit event for notifications
    this.emit('marginCall', {
      userId,
      marginCallId,
      amount,
      dueDate: marginCall.dueDate,
      region
    });

    return marginCall;
  }

  getUserCollateral(userId, region) {
    const key = `${userId}-${region}`;
    return this.userCollateral.get(key) || {
      cash: 0,
      securities: 0,
      commodities: 0,
      currency: 'USD'
    };
  }

  async updateUserCollateral(userId, collateralUpdate, region = 'US') {
    const key = `${userId}-${region}`;
    const existing = this.getUserCollateral(userId, region);
    
    const updated = {
      ...existing,
      ...collateralUpdate,
      lastUpdated: new Date()
    };

    this.userCollateral.set(key, updated);

    // Recheck margin requirements
    await this.checkMarginRequirements(userId, region);

    return updated;
  }

  startMarginMonitoring() {
    // Real-time margin monitoring (every minute)
    this.marginMonitoringInterval = setInterval(async () => {
      try {
        await this.performMarginSweep();
      } catch (error) {
        console.error('Margin monitoring error:', error);
      }
    }, 60000); // 1 minute
  }

  stopMarginMonitoring() {
    if (this.marginMonitoringInterval) {
      clearInterval(this.marginMonitoringInterval);
      this.marginMonitoringInterval = null;
    }
  }

  async performMarginSweep() {
    // Get all users with active positions
    const activeUsers = new Set();
    this.marginRequirements.forEach(margin => {
      // In production, this would query user ownership
      activeUsers.add('sample-user-id');
    });

    // Check margin for each user
    for (const userId of activeUsers) {
      try {
        await this.checkMarginRequirements(userId);
      } catch (error) {
        console.error(`Margin check failed for user ${userId}:`, error);
      }
    }
  }

  calculateTimeToMaturity(maturityDate) {
    const now = new Date();
    const maturity = new Date(maturityDate);
    return Math.max(0, (maturity - now) / (1000 * 60 * 60 * 24 * 365.25)); // Years
  }

  getDefaultMarginRules() {
    return {
      defaultInitialMarginRate: this.config.defaultInitialMarginRate,
      defaultMaintenanceMarginRate: this.config.defaultMaintenanceMarginRate,
      marginCallGracePeriod: this.config.marginCallGracePeriod,
      marginCallThreshold: this.config.marginCallThreshold,
      crossMarginingEnabled: true,
      portfolioMarginingEnabled: true,
      riskModelParameters: this.riskParameters
    };
  }

  async getUserContracts(userId, region) {
    // In production, this would query the database
    const contracts = Array.from(this.marginRequirements.values())
      .filter(margin => region ? margin.region === region : true)
      .map(margin => ({ id: margin.contractId, userId })); // Simplified
    
    return contracts;
  }

  // Reporting methods
  async getMarginReport(userId, region = null) {
    const portfolioMargin = await this.calculatePortfolioMargin(userId, region);
    const collateral = this.getUserCollateral(userId, region);
    const marginStatus = await this.checkMarginRequirements(userId, region);

    return {
      userId,
      region,
      portfolioMargin,
      collateral,
      marginStatus,
      timestamp: new Date()
    };
  }

  async getMarginCall(marginCallId) {
    return this.marginCalls.get(marginCallId);
  }

  async resolveMarginCall(marginCallId, resolution = 'met') {
    const marginCall = this.marginCalls.get(marginCallId);
    if (!marginCall) {
      throw new Error(`Margin call not found: ${marginCallId}`);
    }

    marginCall.status = resolution;
    marginCall.resolvedAt = new Date();

    this.emit('marginCallResolved', {
      marginCallId,
      userId: marginCall.userId,
      resolution,
      region: marginCall.region
    });

    return marginCall;
  }
}

module.exports = MarginService;