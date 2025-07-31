const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class DerivativesService extends EventEmitter {
  constructor(regionConfigService, marginService) {
    super();

    this.regionConfigService = regionConfigService;
    this.marginService = marginService;

    // In-memory storage for demo (would use database in production)
    this.contracts = new Map();
    this.positions = new Map();
    this.marketData = new Map();

    // Derivatives configuration
    this.config = {
      supportedDerivatives: ['future', 'option', 'swap', 'structured_note'],
      supportedCommodities: [
        'crude_oil',
        'natural_gas',
        'heating_oil',
        'gasoline',
        'renewable_certificates',
        'carbon_credits',
        'electricity',
        'coal'
      ],
      maxNotionalPerContract: 100000000, // $100M
      minNotionalPerContract: 1000, // $1K
      defaultCurrency: 'USD'
    };

    this.initializeMarketData();
  }

  initializeMarketData() {
    // Initialize sample market data for derivatives
    this.config.supportedCommodities.forEach(commodity => {
      this.marketData.set(commodity, {
        spot: this.generateRandomPrice(commodity),
        volatility: 0.2 + Math.random() * 0.3, // 20-50%
        riskFreeRate: 0.025, // 2.5%
        dividendYield: 0,
        lastUpdated: new Date()
      });
    });
  }

  generateRandomPrice(commodity) {
    const basePrices = {
      crude_oil: 75,
      natural_gas: 3.5,
      heating_oil: 2.8,
      gasoline: 2.2,
      renewable_certificates: 50,
      carbon_credits: 25,
      electricity: 45,
      coal: 85
    };
    
    const basePrice = basePrices[commodity] || 50;
    return basePrice * (0.9 + Math.random() * 0.2); // ±10% variation
  }

  // Future Contracts
  async createFutureContract(params) {
    try {
      const {
        underlyingCommodity,
        notionalAmount,
        deliveryDate,
        settlementType = 'cash',
        region = 'US',
        userId
      } = params;

      // Validate parameters
      this.validateDerivativeParams(params);
      
      // Check region-specific rules
      const regionConfig = await this.regionConfigService.getRegionConfig(region);
      if (!regionConfig || !regionConfig.isActive) {
        throw new Error(`Trading not supported in region: ${region}`);
      }

      const contractId = uuidv4();
      const contract = {
        id: contractId,
        type: 'future',
        underlyingCommodity,
        notionalAmount,
        currency: this.config.defaultCurrency,
        maturityDate: new Date(deliveryDate),
        deliveryDate: new Date(deliveryDate),
        settlementType,
        region,
        status: 'active',
        tickSize: this.getTickSize(underlyingCommodity),
        contractSize: this.getContractSize(underlyingCommodity),
        marginRequirement: 0, // Will be calculated by margin service
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Calculate margin requirements
      if (this.marginService) {
        contract.marginRequirement = await this.marginService.calculateInitialMargin(contract, region);
      }

      this.contracts.set(contractId, contract);

      // Emit event for other services
      this.emit('contractCreated', {
        contractId,
        type: 'future',
        userId,
        region
      });

      return contract;
    } catch (error) {
      throw new Error(`Failed to create future contract: ${error.message}`);
    }
  }

  // Option Contracts
  async createOptionContract(params) {
    try {
      const {
        underlyingCommodity,
        notionalAmount,
        optionType,
        strikePrice,
        expirationDate,
        exerciseStyle = 'european',
        region = 'US',
        userId
      } = params;

      this.validateDerivativeParams(params);
      
      const regionConfig = await this.regionConfigService.getRegionConfig(region);
      if (!regionConfig || !regionConfig.isActive) {
        throw new Error(`Trading not supported in region: ${region}`);
      }

      const contractId = uuidv4();
      const marketData = this.marketData.get(underlyingCommodity);
      
      // Calculate option premium using Black-Scholes approximation
      const premium = this.calculateOptionPremium({
        spot: marketData.spot,
        strike: strikePrice,
        timeToExpiry: this.calculateTimeToExpiry(expirationDate),
        volatility: marketData.volatility,
        riskFreeRate: marketData.riskFreeRate,
        optionType
      });

      const contract = {
        id: contractId,
        type: 'option',
        underlyingCommodity,
        notionalAmount,
        currency: this.config.defaultCurrency,
        maturityDate: new Date(expirationDate),
        optionType,
        strikePrice,
        expirationDate: new Date(expirationDate),
        exerciseStyle,
        premium,
        region,
        status: 'active',
        volatility: marketData.volatility,
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Calculate Greeks
      this.calculateGreeks(contract, marketData);

      this.contracts.set(contractId, contract);

      this.emit('contractCreated', {
        contractId,
        type: 'option',
        userId,
        region
      });

      return contract;
    } catch (error) {
      throw new Error(`Failed to create option contract: ${error.message}`);
    }
  }

  // Swap Contracts
  async createSwapContract(params) {
    try {
      const {
        underlyingCommodity,
        notionalAmount,
        swapType,
        fixedRate,
        floatingRateIndex,
        paymentFrequency = 'quarterly',
        maturityDate,
        region = 'US',
        userId
      } = params;

      this.validateDerivativeParams(params);
      
      const regionConfig = await this.regionConfigService.getRegionConfig(region);
      if (!regionConfig || !regionConfig.isActive) {
        throw new Error(`Trading not supported in region: ${region}`);
      }

      const contractId = uuidv4();
      const contract = {
        id: contractId,
        type: 'swap',
        underlyingCommodity,
        notionalAmount,
        currency: this.config.defaultCurrency,
        maturityDate: new Date(maturityDate),
        swapType,
        fixedRate,
        floatingRateIndex,
        paymentFrequency,
        resetFrequency: 'monthly',
        dayCountConvention: 'Actual/360',
        region,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.contracts.set(contractId, contract);

      this.emit('contractCreated', {
        contractId,
        type: 'swap',
        userId,
        region
      });

      return contract;
    } catch (error) {
      throw new Error(`Failed to create swap contract: ${error.message}`);
    }
  }

  // Structured Notes
  async createStructuredNote(params) {
    try {
      const {
        underlyingCommodity,
        notionalAmount,
        noteType,
        principalProtection = 100,
        maturityDate,
        payoffStructure,
        region = 'US',
        userId
      } = params;

      this.validateDerivativeParams(params);
      
      const regionConfig = await this.regionConfigService.getRegionConfig(region);
      if (!regionConfig || !regionConfig.isActive) {
        throw new Error(`Trading not supported in region: ${region}`);
      }

      const contractId = uuidv4();
      const contract = {
        id: contractId,
        type: 'structured_note',
        underlyingCommodity,
        notionalAmount,
        currency: this.config.defaultCurrency,
        maturityDate: new Date(maturityDate),
        noteType,
        principalProtection,
        payoffStructure,
        region,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.contracts.set(contractId, contract);

      this.emit('contractCreated', {
        contractId,
        type: 'structured_note',
        userId,
        region
      });

      return contract;
    } catch (error) {
      throw new Error(`Failed to create structured note: ${error.message}`);
    }
  }

  // Utility methods
  validateDerivativeParams(params) {
    const { underlyingCommodity, notionalAmount } = params;

    if (!this.config.supportedCommodities.includes(underlyingCommodity)) {
      throw new Error(`Unsupported commodity: ${underlyingCommodity}`);
    }

    if (notionalAmount < this.config.minNotionalPerContract || 
        notionalAmount > this.config.maxNotionalPerContract) {
      throw new Error(`Notional amount must be between ${this.config.minNotionalPerContract} and ${this.config.maxNotionalPerContract}`);
    }
  }

  getTickSize(commodity) {
    const tickSizes = {
      crude_oil: 0.01,
      natural_gas: 0.001,
      heating_oil: 0.0001,
      gasoline: 0.0001,
      renewable_certificates: 0.01,
      carbon_credits: 0.01,
      electricity: 0.01,
      coal: 0.01
    };
    return tickSizes[commodity] || 0.01;
  }

  getContractSize(commodity) {
    const contractSizes = {
      crude_oil: 1000, // 1000 barrels
      natural_gas: 10000, // 10,000 MMBtu
      heating_oil: 42000, // 42,000 gallons
      gasoline: 42000, // 42,000 gallons
      renewable_certificates: 1, // 1 MWh
      carbon_credits: 1, // 1 metric ton CO2
      electricity: 1, // 1 MWh
      coal: 1 // 1 metric ton
    };
    return contractSizes[commodity] || 1;
  }

  calculateTimeToExpiry(expirationDate) {
    const now = new Date();
    const expiry = new Date(expirationDate);
    const timeToExpiry = (expiry - now) / (1000 * 60 * 60 * 24 * 365.25); // Years
    return Math.max(0, timeToExpiry);
  }

  calculateOptionPremium({ spot, strike, timeToExpiry, volatility, riskFreeRate, optionType }) {
    // Simplified Black-Scholes calculation
    const d1 = (Math.log(spot / strike) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiry) / 
               (volatility * Math.sqrt(timeToExpiry));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    const N = (x) => 0.5 * (1 + this.erf(x / Math.sqrt(2)));

    if (optionType === 'call') {
      return spot * N(d1) - strike * Math.exp(-riskFreeRate * timeToExpiry) * N(d2);
    } else {
      return strike * Math.exp(-riskFreeRate * timeToExpiry) * N(-d2) - spot * N(-d1);
    }
  }

  calculateGreeks(contract, marketData) {
    // Simplified Greeks calculation
    const { spot } = marketData;
    const { strikePrice, optionType } = contract;
    const timeToExpiry = this.calculateTimeToExpiry(contract.expirationDate);

    // Delta (price sensitivity)
    contract.delta = optionType === 'call' ? 0.5 : -0.5; // Simplified

    // Gamma (delta sensitivity)
    contract.gamma = 0.01; // Simplified

    // Theta (time decay)
    contract.theta = -contract.premium * 0.1 / 365; // Simplified

    // Vega (volatility sensitivity)
    contract.vega = contract.premium * 0.2; // Simplified
  }

  erf(x) {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  // Contract management methods
  async getContract(contractId) {
    return this.contracts.get(contractId);
  }

  async getUserContracts(userId, region = null) {
    const contracts = Array.from(this.contracts.values());
    return contracts.filter(contract => {
      if (region && contract.region !== region) return false;
      // In a real implementation, this would check user ownership
      return true;
    });
  }

  async updateMarketData(commodity, data) {
    const existing = this.marketData.get(commodity) || {};
    this.marketData.set(commodity, {
      ...existing,
      ...data,
      lastUpdated: new Date()
    });

    // Recalculate option Greeks and premiums
    this.updateOptionContracts(commodity);
  }

  updateOptionContracts(commodity) {
    const marketData = this.marketData.get(commodity);
    const contracts = Array.from(this.contracts.values())
      .filter(c => c.type === 'option' && c.underlyingCommodity === commodity);

    contracts.forEach(contract => {
      this.calculateGreeks(contract, marketData);
      contract.updatedAt = new Date();
    });
  }

  async terminateContract(contractId, reason = 'user_request') {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    contract.status = 'terminated';
    contract.updatedAt = new Date();

    this.emit('contractTerminated', {
      contractId,
      type: contract.type,
      reason
    });

    return contract;
  }
}

module.exports = DerivativesService;