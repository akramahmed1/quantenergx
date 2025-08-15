/**
 * Advanced Real-time Risk Analytics Service
 * Provides VaR, stress testing, scenario modeling, and multi-commodity risk analysis
 */
class RiskAnalyticsService {
  constructor() {
    this.positions = new Map();
    this.marketData = new Map();
    this.riskMetrics = new Map();
    this.stressScenarios = new Map();
    this.correlationMatrix = new Map();
    this.weatherData = new Map();

    this.initializeStressScenarios();
    this.initializeCorrelationMatrix();
  }

  /**
   * Calculate Value at Risk (VaR) for portfolio
   */
  async calculateVaR(portfolioId, confidence = 0.95, timeHorizon = 1) {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const returns = await this.calculatePortfolioReturns(portfolio, timeHorizon);
    const sortedReturns = returns.sort((a, b) => a - b);

    const varIndex = Math.floor((1 - confidence) * sortedReturns.length);
    const var95 = sortedReturns[varIndex];

    const expectedShortfall =
      sortedReturns.slice(0, varIndex + 1).reduce((sum, ret) => sum + ret, 0) / (varIndex + 1);

    return {
      portfolioId,
      confidence,
      timeHorizon,
      var: var95,
      expectedShortfall,
      portfolioValue: portfolio.totalValue,
      timestamp: new Date().toISOString(),
      methodology: 'Historical Simulation',
      riskCurrency: 'USD',
    };
  }

  /**
   * Perform stress testing on portfolio
   */
  async performStressTest(portfolioId, scenarioId) {
    const portfolio = await this.getPortfolio(portfolioId);
    const scenario = this.stressScenarios.get(scenarioId);

    if (!portfolio || !scenario) {
      throw new Error('Portfolio or scenario not found');
    }

    const stressResults = new Map();

    // Apply stress shocks to each position
    for (const [assetId, position] of portfolio.positions) {
      const shocks = scenario.shocks.get(assetId) || scenario.defaultShocks;
      const stressedValue = this.applyStressShocks(position, shocks);

      stressResults.set(assetId, {
        originalValue: position.marketValue,
        stressedValue,
        pnl: stressedValue - position.marketValue,
        pnlPercent: ((stressedValue - position.marketValue) / position.marketValue) * 100,
      });
    }

    const totalOriginalValue = Array.from(portfolio.positions.values()).reduce(
      (sum, pos) => sum + pos.marketValue,
      0
    );

    const totalStressedValue = Array.from(stressResults.values()).reduce(
      (sum, result) => sum + result.stressedValue,
      0
    );

    return {
      portfolioId,
      scenarioId,
      scenarioName: scenario.name,
      totalPnL: totalStressedValue - totalOriginalValue,
      totalPnLPercent: ((totalStressedValue - totalOriginalValue) / totalOriginalValue) * 100,
      results: Object.fromEntries(stressResults),
      timestamp: new Date().toISOString(),
      confidence: scenario.confidence,
    };
  }

  /**
   * Run scenario modeling for physical and logistics risks
   */
  async runScenarioModeling(portfolioId, scenarios) {
    const portfolio = await this.getPortfolio(portfolioId);
    const results = [];

    for (const scenario of scenarios) {
      const scenarioResult = await this.calculateScenarioImpact(portfolio, scenario);
      results.push(scenarioResult);
    }

    return {
      portfolioId,
      scenarios: results,
      aggregatedMetrics: this.aggregateScenarioMetrics(results),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Analyze multi-commodity risk exposures
   */
  async analyzeMultiCommodityRisk(portfolioId) {
    const portfolio = await this.getPortfolio(portfolioId);
    const commodityExposures = new Map();

    // Group positions by commodity
    for (const [assetId, position] of portfolio.positions) {
      const commodity = this.getCommodityType(position.instrument);

      if (!commodityExposures.has(commodity)) {
        commodityExposures.set(commodity, {
          totalExposure: 0,
          positions: [],
          var: 0,
          beta: 0,
        });
      }

      const exposure = commodityExposures.get(commodity);
      exposure.totalExposure += position.marketValue;
      exposure.positions.push(position);
    }

    // Calculate cross-commodity correlations and risk metrics
    const correlationAnalysis = await this.calculateCrossCommodityCorrelations(commodityExposures);
    const concentrationRisk = this.calculateConcentrationRisk(commodityExposures);

    return {
      portfolioId,
      commodityExposures: Object.fromEntries(commodityExposures),
      correlationAnalysis,
      concentrationRisk,
      diversificationBenefit: this.calculateDiversificationBenefit(commodityExposures),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Analyze weather-linked exposures
   */
  async analyzeWeatherLinkedExposures(portfolioId, weatherForecast) {
    const portfolio = await this.getPortfolio(portfolioId);
    const weatherSensitivePositions = [];

    for (const [assetId, position] of portfolio.positions) {
      const weatherSensitivity = await this.getWeatherSensitivity(position);

      if (weatherSensitivity.isWeatherSensitive) {
        const weatherImpact = this.calculateWeatherImpact(
          position,
          weatherForecast,
          weatherSensitivity
        );
        weatherSensitivePositions.push({
          assetId,
          position,
          weatherSensitivity,
          weatherImpact,
        });
      }
    }

    return {
      portfolioId,
      weatherSensitivePositions,
      aggregatedWeatherRisk: this.aggregateWeatherRisk(weatherSensitivePositions),
      weatherForecast,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate cyber risk exposure
   */
  async calculateCyberRiskExposure(portfolioId) {
    const portfolio = await this.getPortfolio(portfolioId);
    const cyberRiskFactors = {
      tradingSystemDowntime: 0.02, // 2% risk
      dataBreachRisk: 0.01, // 1% risk
      supplyChainDisruption: 0.015, // 1.5% risk
      communicationFailure: 0.005, // 0.5% risk
    };

    const digitalAssetExposure = this.calculateDigitalAssetExposure(portfolio);
    const systemDependencyRisk = this.calculateSystemDependencyRisk(portfolio);

    const totalCyberVaR =
      Object.values(cyberRiskFactors).reduce((sum, risk) => sum + risk, 0) * portfolio.totalValue;

    return {
      portfolioId,
      cyberRiskFactors,
      digitalAssetExposure,
      systemDependencyRisk,
      totalCyberVaR,
      mitigationStrategies: this.getCyberRiskMitigationStrategies(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate real-time risk dashboard data
   */
  async generateRiskDashboard(portfolioId) {
    const [varAnalysis, stressTestResults, commodityRisk, weatherRisk, cyberRisk] =
      await Promise.all([
        this.calculateVaR(portfolioId),
        this.performStressTest(portfolioId, 'market_crash'),
        this.analyzeMultiCommodityRisk(portfolioId),
        this.analyzeWeatherLinkedExposures(portfolioId, await this.getWeatherForecast()),
        this.calculateCyberRiskExposure(portfolioId),
      ]);

    return {
      portfolioId,
      lastUpdated: new Date().toISOString(),
      riskMetrics: {
        var: varAnalysis,
        stressTest: stressTestResults,
        commodityRisk,
        weatherRisk,
        cyberRisk,
      },
      riskScore: this.calculateOverallRiskScore([
        varAnalysis,
        stressTestResults,
        commodityRisk,
        weatherRisk,
        cyberRisk,
      ]),
      alerts: await this.generateRiskAlerts(portfolioId),
      recommendations: await this.generateRiskRecommendations(portfolioId),
    };
  }

  // Helper methods

  async getPortfolio(portfolioId) {
    // Simulated portfolio data
    return {
      id: portfolioId,
      totalValue: 10000000, // $10M
      positions: new Map([
        [
          'CRUDE_OIL_001',
          {
            instrument: 'WTI Crude Oil',
            quantity: 1000,
            marketValue: 3000000,
            delta: 0.8,
            gamma: 0.02,
          },
        ],
        [
          'NATURAL_GAS_001',
          {
            instrument: 'Henry Hub Natural Gas',
            quantity: 5000,
            marketValue: 2500000,
            delta: 0.7,
            gamma: 0.015,
          },
        ],
        [
          'ELECTRICITY_001',
          {
            instrument: 'PJM Electricity',
            quantity: 100,
            marketValue: 4500000,
            delta: 0.9,
            gamma: 0.025,
          },
        ],
      ]),
    };
  }

  async calculatePortfolioReturns(portfolio, timeHorizon) {
    // Simulated historical returns for VaR calculation
    const returns = [];
    for (let i = 0; i < 252 * timeHorizon; i++) {
      const randomReturn = (Math.random() - 0.5) * 0.04; // ±2% daily volatility
      returns.push(randomReturn);
    }
    return returns;
  }

  initializeStressScenarios() {
    this.stressScenarios.set('market_crash', {
      name: 'Market Crash Scenario',
      confidence: 0.99,
      shocks: new Map([
        ['CRUDE_OIL_001', { price: -0.3, volatility: 2.0 }],
        ['NATURAL_GAS_001', { price: -0.25, volatility: 1.8 }],
        ['ELECTRICITY_001', { price: -0.2, volatility: 1.5 }],
      ]),
      defaultShocks: { price: -0.15, volatility: 1.3 },
    });

    this.stressScenarios.set('supply_disruption', {
      name: 'Supply Chain Disruption',
      confidence: 0.95,
      shocks: new Map([
        ['CRUDE_OIL_001', { price: 0.4, volatility: 2.5 }],
        ['NATURAL_GAS_001', { price: 0.35, volatility: 2.0 }],
      ]),
      defaultShocks: { price: 0.2, volatility: 1.5 },
    });
  }

  initializeCorrelationMatrix() {
    // Simplified correlation matrix for commodities
    this.correlationMatrix.set('CRUDE_OIL-NATURAL_GAS', 0.65);
    this.correlationMatrix.set('CRUDE_OIL-ELECTRICITY', 0.45);
    this.correlationMatrix.set('NATURAL_GAS-ELECTRICITY', 0.75);
  }

  applyStressShocks(position, shocks) {
    const shockedPrice = position.marketValue * (1 + shocks.price);
    return shockedPrice;
  }

  getCommodityType(instrument) {
    if (instrument.includes('Crude Oil')) return 'CRUDE_OIL';
    if (instrument.includes('Natural Gas')) return 'NATURAL_GAS';
    if (instrument.includes('Electricity')) return 'ELECTRICITY';
    return 'OTHER';
  }

  async calculateCrossCommodityCorrelations(commodityExposures) {
    const correlations = {};
    const commodities = Array.from(commodityExposures.keys());

    for (let i = 0; i < commodities.length; i++) {
      for (let j = i + 1; j < commodities.length; j++) {
        const key = `${commodities[i]}-${commodities[j]}`;
        correlations[key] = this.correlationMatrix.get(key) || 0.3; // Default correlation
      }
    }

    return correlations;
  }

  calculateConcentrationRisk(commodityExposures) {
    const totalExposure = Array.from(commodityExposures.values()).reduce(
      (sum, exp) => sum + exp.totalExposure,
      0
    );

    const concentrations = {};
    for (const [commodity, exposure] of commodityExposures) {
      concentrations[commodity] = exposure.totalExposure / totalExposure;
    }

    // Calculate Herfindahl-Hirschman Index for concentration
    const hhi = Object.values(concentrations).reduce((sum, conc) => sum + conc * conc, 0);

    return {
      concentrations,
      hhi,
      diversificationScore: 1 - hhi,
    };
  }

  calculateDiversificationBenefit(commodityExposures) {
    // Simplified diversification benefit calculation
    const commodityCount = commodityExposures.size;
    const maxBenefit = 0.3; // 30% maximum benefit

    return Math.min(maxBenefit, (commodityCount - 1) * 0.05);
  }

  async getWeatherSensitivity(position) {
    // Determine if position is weather-sensitive
    const weatherSensitiveInstruments = ['Natural Gas', 'Electricity', 'Heating Oil'];
    const isWeatherSensitive = weatherSensitiveInstruments.some(inst =>
      position.instrument.includes(inst)
    );

    return {
      isWeatherSensitive,
      sensitivity: isWeatherSensitive ? Math.random() * 0.1 : 0, // Up to 10% sensitivity
      weatherFactors: isWeatherSensitive ? ['temperature', 'wind', 'precipitation'] : [],
    };
  }

  calculateWeatherImpact(position, weatherForecast, weatherSensitivity) {
    if (!weatherSensitivity.isWeatherSensitive) {
      return { impact: 0, factors: {} };
    }

    // Simplified weather impact calculation
    const temperatureImpact = (weatherForecast.temperature - 70) * 0.01; // 1% per degree from 70F
    const windImpact = weatherForecast.windSpeed * 0.005; // 0.5% per mph wind

    const totalImpact = (temperatureImpact + windImpact) * weatherSensitivity.sensitivity;

    return {
      impact: totalImpact,
      factors: {
        temperature: temperatureImpact,
        wind: windImpact,
      },
    };
  }

  aggregateWeatherRisk(weatherSensitivePositions) {
    const totalImpact = weatherSensitivePositions.reduce(
      (sum, pos) => sum + pos.weatherImpact.impact * pos.position.marketValue,
      0
    );

    return {
      totalImpact,
      positionsAffected: weatherSensitivePositions.length,
      averageImpact: totalImpact / weatherSensitivePositions.length,
    };
  }

  calculateDigitalAssetExposure(portfolio) {
    // Calculate exposure to digital/electronic trading systems
    const totalValue = portfolio.totalValue;
    const digitalExposure = totalValue * 0.85; // Assume 85% of portfolio is digitally traded

    return {
      digitalExposure,
      exposurePercentage: 0.85,
      criticalSystems: ['trading_platform', 'risk_management', 'settlement'],
    };
  }

  calculateSystemDependencyRisk(portfolio) {
    return {
      tradingSystemRisk: 0.02,
      connectivityRisk: 0.015,
      dataIntegrityRisk: 0.01,
      mitigationFactors: ['backup_systems', 'redundant_connections', 'data_validation'],
    };
  }

  getCyberRiskMitigationStrategies() {
    return [
      'Multi-factor authentication',
      'End-to-end encryption',
      'Regular security audits',
      'Incident response planning',
      'Staff cybersecurity training',
      'Network segmentation',
      'Real-time monitoring',
    ];
  }

  async getWeatherForecast() {
    // Simulated weather forecast
    return {
      temperature: 75 + (Math.random() - 0.5) * 20, // 65-85F range
      windSpeed: Math.random() * 25, // 0-25 mph
      precipitation: Math.random() * 0.5, // 0-0.5 inches
      timestamp: new Date().toISOString(),
    };
  }

  calculateOverallRiskScore(riskAnalyses) {
    // Simplified overall risk score calculation
    let score = 0;

    // VaR contribution (normalized)
    score += Math.abs(riskAnalyses[0].var) * 0.3;

    // Stress test contribution
    score += Math.abs(riskAnalyses[1].totalPnLPercent) * 0.25;

    // Concentration risk
    score += (1 - riskAnalyses[2].concentrationRisk.diversificationScore) * 0.2;

    // Weather risk
    score += Math.abs(riskAnalyses[3].aggregatedWeatherRisk.totalImpact) * 0.15;

    // Cyber risk
    score += (riskAnalyses[4].totalCyberVaR / 1000000) * 0.1; // Normalize to millions

    return Math.min(100, Math.max(0, score * 100)); // 0-100 scale
  }

  async generateRiskAlerts(portfolioId) {
    return [
      {
        level: 'warning',
        message: 'VaR exceeded 95% confidence threshold',
        timestamp: new Date().toISOString(),
      },
      {
        level: 'info',
        message: 'Weather forecast shows extreme temperature variance',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  async generateRiskRecommendations(portfolioId) {
    return [
      'Consider hedging natural gas exposure with weather derivatives',
      'Increase diversification across commodity sectors',
      'Review cyber security protocols for critical trading systems',
      'Update stress testing scenarios to include supply chain disruptions',
    ];
  }

  async calculateScenarioImpact(portfolio, scenario) {
    // Simplified scenario impact calculation
    const impact = portfolio.totalValue * (Math.random() - 0.5) * 0.2; // ±10% impact

    return {
      scenarioName: scenario.name,
      impact,
      impactPercentage: (impact / portfolio.totalValue) * 100,
      probability: scenario.probability || 0.1,
      timeHorizon: scenario.timeHorizon || '1 year',
    };
  }

  aggregateScenarioMetrics(results) {
    const totalImpact = results.reduce((sum, result) => sum + Math.abs(result.impact), 0);
    const avgImpact = totalImpact / results.length;

    return {
      totalImpact,
      averageImpact: avgImpact,
      worstCase: Math.min(...results.map(r => r.impact)),
      bestCase: Math.max(...results.map(r => r.impact)),
    };
  }
}

module.exports = RiskAnalyticsService;
