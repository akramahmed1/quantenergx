const { v4: uuidv4 } = require('uuid');

class RiskManagementService {
  constructor() {
    this.riskLimits = {
      position: {
        max_single_position: 10000000,
        max_portfolio_exposure: 50000000,
        max_commodity_concentration: 0.3, // 30%
      },
      credit: {
        max_counterparty_exposure: 5000000,
        max_unsecured_exposure: 1000000,
        min_credit_rating: 'BBB',
      },
      market: {
        var_limit_daily: 1000000, // Value at Risk daily limit
        var_limit_monthly: 5000000,
        max_leverage: 5.0,
        stress_test_threshold: 0.95,
      },
      operational: {
        max_trade_size: 20000000,
        max_daily_volume: 100000000,
        settlement_risk_limit: 10000000,
      },
    };

    this.volatilityModels = {
      crude_oil: { base_volatility: 0.25, stress_multiplier: 2.5 },
      natural_gas: { base_volatility: 0.35, stress_multiplier: 3.0 },
      renewable: { base_volatility: 0.15, stress_multiplier: 1.8 },
    };
  }

  async assessPortfolioRisk(portfolioData) {
    const assessmentId = uuidv4();
    const timestamp = new Date().toISOString();

    try {
      const riskMetrics = await Promise.all([
        this._calculateVaR(portfolioData),
        this._assessConcentrationRisk(portfolioData),
        this._evaluateCreditRisk(portfolioData),
        this._analyzeMarketRisk(portfolioData),
        this._checkLiquidityRisk(portfolioData),
        this._assessOperationalRisk(portfolioData),
      ]);

      const overallRiskScore = this._calculateOverallRiskScore(riskMetrics);
      const riskLevel = this._determineRiskLevel(overallRiskScore);
      const alerts = this._generateRiskAlerts(riskMetrics);

      return {
        assessmentId,
        timestamp,
        portfolioId: portfolioData.portfolioId,
        overallRiskScore,
        riskLevel,
        riskMetrics,
        alerts,
        recommendations: this._generateRiskRecommendations(riskMetrics, riskLevel),
      };
    } catch (error) {
      console.error('Risk assessment failed:', error);
      throw new Error(`Risk assessment failed: ${error.message}`);
    }
  }

  async _calculateVaR(portfolioData) {
    // Value at Risk calculation using Monte Carlo simulation
    const { positions, confidenceLevel = 0.95 } = portfolioData;

    let portfolioValue = 0;
    let portfolioVolatility = 0;

    // Calculate portfolio value and weighted volatility
    positions.forEach(position => {
      const value = position.quantity * position.currentPrice;
      portfolioValue += value;

      const volatility = this.volatilityModels[position.commodity]?.base_volatility || 0.2;
      portfolioVolatility += (value / portfolioValue) * volatility;
    });

    // Simple VaR calculation (in production, use more sophisticated models)
    const zScore = this._getZScore(confidenceLevel);
    const dailyVaR = (portfolioValue * portfolioVolatility * zScore) / Math.sqrt(252); // Annualized to daily
    const monthlyVaR = dailyVaR * Math.sqrt(21); // Monthly

    const withinLimits =
      dailyVaR <= this.riskLimits.market.var_limit_daily &&
      monthlyVaR <= this.riskLimits.market.var_limit_monthly;

    return {
      metric: 'value_at_risk',
      dailyVaR,
      monthlyVaR,
      portfolioValue,
      portfolioVolatility,
      confidenceLevel,
      withinLimits,
      utilizationDaily: (dailyVaR / this.riskLimits.market.var_limit_daily) * 100,
      utilizationMonthly: (monthlyVaR / this.riskLimits.market.var_limit_monthly) * 100,
      severity: withinLimits ? 'low' : 'high',
    };
  }

  async _assessConcentrationRisk(portfolioData) {
    const { positions } = portfolioData;

    // Calculate concentration by commodity
    const commodityExposure = {};
    let totalValue = 0;

    positions.forEach(position => {
      const value = position.quantity * position.currentPrice;
      totalValue += value;

      if (!commodityExposure[position.commodity]) {
        commodityExposure[position.commodity] = 0;
      }
      commodityExposure[position.commodity] += value;
    });

    // Find maximum concentration
    let maxCommodityConcentration = 0;
    let mostConcentratedCommodity = null;

    Object.entries(commodityExposure).forEach(([commodity, exposure]) => {
      const concentration = exposure / totalValue;
      if (concentration > maxCommodityConcentration) {
        maxCommodityConcentration = concentration;
        mostConcentratedCommodity = commodity;
      }
    });

    const withinLimits =
      maxCommodityConcentration <= this.riskLimits.position.max_commodity_concentration;

    return {
      metric: 'concentration_risk',
      maxCommodityConcentration,
      mostConcentratedCommodity,
      commodityBreakdown: Object.fromEntries(
        Object.entries(commodityExposure).map(([commodity, exposure]) => [
          commodity,
          { exposure, percentage: (exposure / totalValue) * 100 },
        ])
      ),
      withinLimits,
      utilizationPercentage:
        (maxCommodityConcentration / this.riskLimits.position.max_commodity_concentration) * 100,
      severity: withinLimits ? 'low' : 'medium',
    };
  }

  async _evaluateCreditRisk(portfolioData) {
    const { counterparties, trades } = portfolioData;

    // Calculate exposure by counterparty
    const counterpartyExposure = {};
    let totalCreditExposure = 0;

    trades.forEach(trade => {
      const exposure = trade.notionalValue;
      totalCreditExposure += exposure;

      if (!counterpartyExposure[trade.counterpartyId]) {
        counterpartyExposure[trade.counterpartyId] = {
          exposure: 0,
          creditRating: counterparties[trade.counterpartyId]?.creditRating || 'NR',
          secured: 0,
          unsecured: 0,
        };
      }

      counterpartyExposure[trade.counterpartyId].exposure += exposure;

      if (trade.collateralized) {
        counterpartyExposure[trade.counterpartyId].secured += exposure;
      } else {
        counterpartyExposure[trade.counterpartyId].unsecured += exposure;
      }
    });

    // Find violations
    const violations = [];
    let maxCounterpartyExposure = 0;

    Object.entries(counterpartyExposure).forEach(([counterpartyId, data]) => {
      if (data.exposure > maxCounterpartyExposure) {
        maxCounterpartyExposure = data.exposure;
      }

      if (data.exposure > this.riskLimits.credit.max_counterparty_exposure) {
        violations.push({
          type: 'counterparty_limit_exceeded',
          counterpartyId,
          exposure: data.exposure,
          limit: this.riskLimits.credit.max_counterparty_exposure,
        });
      }

      if (data.unsecured > this.riskLimits.credit.max_unsecured_exposure) {
        violations.push({
          type: 'unsecured_limit_exceeded',
          counterpartyId,
          unsecuredExposure: data.unsecured,
          limit: this.riskLimits.credit.max_unsecured_exposure,
        });
      }
    });

    return {
      metric: 'credit_risk',
      totalCreditExposure,
      maxCounterpartyExposure,
      counterpartyBreakdown: counterpartyExposure,
      violations,
      withinLimits: violations.length === 0,
      creditScore: this._calculateCreditScore(counterpartyExposure),
      severity: violations.length === 0 ? 'low' : 'high',
    };
  }

  async _analyzeMarketRisk(portfolioData) {
    const { positions, marketData } = portfolioData;

    // Calculate beta and correlation risks
    let portfolioBeta = 0;
    let totalValue = 0;

    const correlationMatrix = this._buildCorrelationMatrix(positions);

    positions.forEach(position => {
      const value = position.quantity * position.currentPrice;
      totalValue += value;

      // Simplified beta calculation
      const positionBeta = marketData[position.commodity]?.beta || 1.0;
      portfolioBeta += (value / totalValue) * positionBeta;
    });

    // Stress testing
    const stressScenarios = [
      { name: 'oil_price_crash', impact: -0.3 },
      { name: 'gas_supply_shock', impact: 0.4 },
      { name: 'renewable_policy_change', impact: -0.15 },
      { name: 'general_market_crash', impact: -0.25 },
    ];

    const stressTestResults = stressScenarios.map(scenario => {
      const potentialLoss = totalValue * Math.abs(scenario.impact);
      return {
        scenario: scenario.name,
        impact: scenario.impact,
        potentialLoss,
        percentageOfPortfolio: Math.abs(scenario.impact) * 100,
      };
    });

    const worstCaseScenario = stressTestResults.reduce((worst, current) =>
      current.potentialLoss > worst.potentialLoss ? current : worst
    );

    return {
      metric: 'market_risk',
      portfolioBeta,
      correlationRisk: this._assessCorrelationRisk(correlationMatrix),
      stressTestResults,
      worstCaseScenario,
      leverageRatio: this._calculateLeverage(portfolioData),
      withinLimits: portfolioBeta <= 2.0, // Arbitrary threshold
      severity: portfolioBeta > 2.0 ? 'medium' : 'low',
    };
  }

  async _checkLiquidityRisk(portfolioData) {
    const { positions, marketData } = portfolioData;

    let illiquidValue = 0;
    let totalValue = 0;
    const liquidityBreakdown = {};

    positions.forEach(position => {
      const value = position.quantity * position.currentPrice;
      totalValue += value;

      const liquidityScore = marketData[position.commodity]?.liquidity || 0.5;
      const timeToLiquidate = this._estimateLiquidationTime(position, liquidityScore);

      liquidityBreakdown[position.id] = {
        commodity: position.commodity,
        value,
        liquidityScore,
        timeToLiquidate,
        liquidityRisk: liquidityScore < 0.5 ? 'high' : liquidityScore < 0.8 ? 'medium' : 'low',
      };

      if (liquidityScore < 0.5) {
        illiquidValue += value;
      }
    });

    const illiquidPercentage = (illiquidValue / totalValue) * 100;

    return {
      metric: 'liquidity_risk',
      totalValue,
      illiquidValue,
      illiquidPercentage,
      liquidityBreakdown,
      averageLiquidationTime: this._calculateAverageLiquidationTime(liquidityBreakdown),
      withinLimits: illiquidPercentage <= 20, // 20% threshold
      severity: illiquidPercentage > 30 ? 'high' : illiquidPercentage > 20 ? 'medium' : 'low',
    };
  }

  async _assessOperationalRisk(portfolioData) {
    const { trades, systems } = portfolioData;

    // Assess operational risk factors
    const riskFactors = {
      systemDowntime: systems?.downtime || 0,
      failedTrades: trades.filter(t => t.status === 'failed').length,
      settlementDelays: trades.filter(t => t.settlementStatus === 'delayed').length,
      dataQualityIssues: 0, // Would be calculated from data validation
      staffingLevels: systems?.staffing || 1.0,
    };

    const operationalScore = this._calculateOperationalScore(riskFactors);

    return {
      metric: 'operational_risk',
      riskFactors,
      operationalScore,
      withinLimits: operationalScore >= 0.8, // 80% threshold
      severity: operationalScore < 0.6 ? 'high' : operationalScore < 0.8 ? 'medium' : 'low',
    };
  }

  _calculateOverallRiskScore(riskMetrics) {
    const weights = {
      value_at_risk: 0.3,
      concentration_risk: 0.2,
      credit_risk: 0.25,
      market_risk: 0.15,
      liquidity_risk: 0.1,
    };

    let score = 0;
    riskMetrics.forEach(metric => {
      const weight = weights[metric.metric] || 0;
      const metricScore = this._getMetricScore(metric);
      score += weight * metricScore;
    });

    return Math.round(score * 100);
  }

  _getMetricScore(metric) {
    switch (metric.severity) {
    case 'low':
      return 0.9;
    case 'medium':
      return 0.6;
    case 'high':
      return 0.3;
    default:
      return 0.5;
    }
  }

  _determineRiskLevel(score) {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  _generateRiskAlerts(riskMetrics) {
    const alerts = [];

    riskMetrics.forEach(metric => {
      if (metric.severity === 'high' || !metric.withinLimits) {
        alerts.push({
          id: uuidv4(),
          type: metric.metric,
          severity: metric.severity,
          message: this._getAlertMessage(metric),
          timestamp: new Date().toISOString(),
          requiredAction: this._getRequiredAction(metric),
        });
      }
    });

    return alerts;
  }

  _getAlertMessage(metric) {
    switch (metric.metric) {
    case 'value_at_risk':
      return `VaR limits exceeded. Daily VaR: $${metric.dailyVaR.toLocaleString()}`;
    case 'concentration_risk':
      return `Concentration risk in ${metric.mostConcentratedCommodity}: ${(metric.maxCommodityConcentration * 100).toFixed(1)}%`;
    case 'credit_risk':
      return `Credit limit violations detected for ${metric.violations.length} counterparties`;
    case 'market_risk':
      return `Portfolio beta elevated at ${metric.portfolioBeta.toFixed(2)}`;
    case 'liquidity_risk':
      return `Illiquid positions represent ${metric.illiquidPercentage.toFixed(1)}% of portfolio`;
    default:
      return `Risk threshold exceeded for ${metric.metric}`;
    }
  }

  _getRequiredAction(metric) {
    switch (metric.metric) {
    case 'value_at_risk':
      return 'Reduce position sizes or hedge exposure';
    case 'concentration_risk':
      return 'Diversify commodity exposure';
    case 'credit_risk':
      return 'Reduce counterparty exposure or increase collateral';
    case 'market_risk':
      return 'Consider hedging strategies';
    case 'liquidity_risk':
      return 'Increase liquid asset allocation';
    default:
      return 'Review and mitigate risk exposure';
    }
  }

  _generateRiskRecommendations(riskMetrics, riskLevel) {
    const recommendations = [];

    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push('Immediate risk review required');
      recommendations.push('Consider halting new positions until risk is reduced');
    }

    riskMetrics.forEach(metric => {
      if (!metric.withinLimits) {
        recommendations.push(this._getRequiredAction(metric));
      }
    });

    // General recommendations
    recommendations.push('Regular stress testing recommended');
    recommendations.push('Update risk models with latest market data');

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Helper methods
  _getZScore(confidenceLevel) {
    // Z-scores for common confidence levels
    const zScores = {
      0.9: 1.282,
      0.95: 1.645,
      0.99: 2.326,
    };
    return zScores[confidenceLevel] || 1.645;
  }

  _buildCorrelationMatrix(_positions) {
    // Simplified correlation matrix
    return {}; // Would implement actual correlation calculations
  }

  _assessCorrelationRisk(_correlationMatrix) {
    return { score: 0.5, level: 'medium' }; // Placeholder
  }

  _calculateLeverage(_portfolioData) {
    // Calculate portfolio leverage ratio
    return 1.0; // Placeholder
  }

  _estimateLiquidationTime(position, liquidityScore) {
    // Estimate time to liquidate position based on size and liquidity
    const baseDays = 1;
    const sizeFactor = Math.log(position.quantity / 1000) || 1;
    const liquidityFactor = 1 / liquidityScore;

    return Math.max(baseDays * sizeFactor * liquidityFactor, 0.1);
  }

  _calculateAverageLiquidationTime(liquidityBreakdown) {
    const times = Object.values(liquidityBreakdown).map(item => item.timeToLiquidate);
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  _calculateCreditScore(counterpartyExposure) {
    // Simplified credit score calculation
    let score = 100;

    Object.values(counterpartyExposure).forEach(data => {
      if (data.creditRating === 'BB' || data.creditRating === 'B') score -= 10;
      if (data.creditRating === 'CCC' || data.creditRating === 'CC') score -= 20;
      if (data.unsecured > 0) score -= 5;
    });

    return Math.max(score, 0);
  }

  _calculateOperationalScore(riskFactors) {
    let score = 1.0;

    score -= riskFactors.systemDowntime * 0.1;
    score -= (riskFactors.failedTrades / 100) * 0.2;
    score -= (riskFactors.settlementDelays / 50) * 0.1;
    score *= riskFactors.staffingLevels;

    return Math.max(score, 0);
  }

  async generateRiskReport(portfolioId, dateRange) {
    // Generate comprehensive risk report
    const reportId = uuidv4();
    const timestamp = new Date().toISOString();

    // This would pull actual portfolio data
    const mockPortfolioData = {
      portfolioId,
      positions: [],
      trades: [],
      counterparties: {},
      marketData: {},
      systems: {},
    };

    const riskAssessment = await this.assessPortfolioRisk(mockPortfolioData);

    return {
      reportId,
      timestamp,
      portfolioId,
      period: dateRange,
      riskAssessment,
      historicalTrends: [], // Would include historical risk metrics
      recommendations: riskAssessment.recommendations,
      executiveSummary: this._generateExecutiveSummary(riskAssessment),
    };
  }

  _generateExecutiveSummary(riskAssessment) {
    return {
      overallRiskLevel: riskAssessment.riskLevel,
      keyRisks: riskAssessment.alerts.map(alert => alert.type),
      recommendedActions: riskAssessment.recommendations.slice(0, 3),
      riskTrend: 'stable', // Would calculate from historical data
    };
  }
}

module.exports = RiskManagementService;
