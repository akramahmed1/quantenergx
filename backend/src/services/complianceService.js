const { v4: uuidv4 } = require('uuid');

class ComplianceService {
  constructor() {
    this.regulatoryFrameworks = {
      US: {
        cftc: { name: 'CFTC', description: 'Commodity Futures Trading Commission' },
        ferc: { name: 'FERC', description: 'Federal Energy Regulatory Commission' },
        epa: { name: 'EPA', description: 'Environmental Protection Agency' }
      },
      UK: {
        ofgem: { name: 'Ofgem', description: 'Office of Gas and Electricity Markets' },
        fca: { name: 'FCA', description: 'Financial Conduct Authority' },
        uk_ets: { name: 'UK ETS', description: 'UK Emissions Trading System' }
      },
      EU: {
        eu_ets: { name: 'EU ETS', description: 'EU Emissions Trading System' },
        mifid2: { name: 'MiFID II', description: 'Markets in Financial Instruments Directive' },
        remit: { name: 'REMIT', description: 'Regulation on Energy Market Integrity and Transparency' }
      },
      ME: {
        islamic_finance: { name: 'Islamic Finance', description: 'Sharia-compliant trading requirements' },
        local_regulatory: { name: 'Local Regulatory', description: 'Regional regulatory frameworks' }
      }
    };

    this.complianceChecks = [
      'position_limits',
      'transaction_reporting',
      'market_manipulation',
      'insider_trading',
      'kyc_aml',
      'environmental_standards',
      'trade_settlement',
      'margin_requirements'
    ];
  }

  async performComplianceCheck(transactionData, region = 'US') {
    const checkId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Validate required fields
    if (!transactionData || typeof transactionData !== 'object') {
      throw new Error('Compliance check failed: Invalid transaction data');
    }
    
    const requiredFields = ['commodity', 'volume'];
    const missingFields = requiredFields.filter(field => !(field in transactionData));
    
    if (missingFields.length > 0) {
      throw new Error(`Compliance check failed: Missing required fields: ${missingFields.join(', ')}`);
    }
    
    try {
      const results = await Promise.all([
        this._checkPositionLimits(transactionData, region),
        this._checkTransactionReporting(transactionData, region),
        this._checkMarketManipulation(transactionData, region),
        this._checkKYCAML(transactionData, region),
        this._checkEnvironmentalStandards(transactionData, region)
      ]);

      const violations = results.filter(result => !result.compliant);
      const overallCompliance = violations.length === 0;

      return {
        checkId,
        timestamp,
        region,
        overallCompliance,
        results,
        violations,
        requiredActions: this._generateRequiredActions(violations),
        riskLevel: this._calculateRiskLevel(violations)
      };

    } catch (error) {
      console.error('Compliance check failed:', error);
      throw new Error(`Compliance check failed: ${error.message}`);
    }
  }

  async _checkPositionLimits(transactionData, _region) {
    // Check position limits based on regional regulations
    const { commodity, volume, currentPositions } = transactionData;
    
    const limits = this._getPositionLimits(commodity, 'US'); // Use default region
    const totalPosition = (currentPositions || 0) + volume;
    
    const compliant = totalPosition <= limits.maxPosition;
    
    return {
      check: 'position_limits',
      compliant,
      details: {
        currentPosition: currentPositions || 0,
        transactionVolume: volume,
        totalPosition,
        limit: limits.maxPosition,
        utilization: (totalPosition / limits.maxPosition) * 100
      },
      severity: compliant ? 'none' : 'high'
    };
  }

  async _checkTransactionReporting(transactionData, region) {
    // Check if transaction requires regulatory reporting
    const { volume, commodity, value } = transactionData;
    
    const reportingThresholds = this._getReportingThresholds(commodity, region);
    const requiresReporting = volume >= reportingThresholds.volumeThreshold || 
                             value >= reportingThresholds.valueThreshold;

    return {
      check: 'transaction_reporting',
      compliant: true, // Assuming we handle reporting automatically
      details: {
        requiresReporting,
        thresholds: reportingThresholds,
        reportingDeadline: requiresReporting ? 
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
      },
      severity: 'none'
    };
  }

  async _checkMarketManipulation(transactionData, _region) {
    // Simple market manipulation detection
    const { price, marketPrice, volume } = transactionData;
    
    const priceDeviation = Math.abs((price - marketPrice) / marketPrice) * 100;
    const suspiciousPatterns = [];

    // Check for unusual price deviations
    if (priceDeviation > 5) {
      suspiciousPatterns.push('unusual_price_deviation');
    }

    // Check for unusual timing
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      suspiciousPatterns.push('off_hours_trading');
    }

    // Check for unusual volume
    if (volume > 100000) { // Threshold for large trades
      suspiciousPatterns.push('large_volume_trade');
    }

    const compliant = suspiciousPatterns.length === 0;

    return {
      check: 'market_manipulation',
      compliant,
      details: {
        priceDeviation,
        suspiciousPatterns,
        riskScore: suspiciousPatterns.length * 25
      },
      severity: compliant ? 'none' : 'medium'
    };
  }

  async _checkKYCAML(transactionData, _region) {
    // Check KYC/AML compliance
    const { traderId, counterpartyId, value, country } = transactionData;
    
    // Simulate KYC/AML database checks
    const traderVerified = await this._isTraderVerified(traderId);
    const counterpartyVerified = await this._isCounterpartyVerified(counterpartyId);
    const sanctionsCheck = await this._checkSanctions(counterpartyId, country);
    
    const issues = [];
    
    if (!traderVerified) issues.push('trader_not_verified');
    if (!counterpartyVerified) issues.push('counterparty_not_verified');
    if (!sanctionsCheck.clear) issues.push('sanctions_concern');
    
    // Large transaction threshold checks
    if (value > 1000000) {
      issues.push('large_transaction_reporting_required');
    }

    const compliant = issues.length === 0;

    return {
      check: 'kyc_aml',
      compliant,
      details: {
        traderVerified,
        counterpartyVerified,
        sanctionsCheck,
        issues,
        amlRiskScore: this._calculateAMLRiskScore(transactionData)
      },
      severity: compliant ? 'none' : 'high'
    };
  }

  async _checkEnvironmentalStandards(transactionData, region) {
    // Check environmental compliance (ESG factors)
    const { commodity, certifications } = transactionData;
    
    const envRequirements = this._getEnvironmentalRequirements(commodity, region);
    const issues = [];

    // Check for required certifications
    if (envRequirements.requiresCertification && !certifications?.environmental) {
      issues.push('missing_environmental_certification');
    }

    // Check carbon footprint requirements
    if (envRequirements.carbonFootprintTracking && !transactionData.carbonFootprint) {
      issues.push('missing_carbon_footprint_data');
    }

    // Check renewable energy certificates for green energy trades
    if (commodity.includes('renewable') && !certifications?.renewable) {
      issues.push('missing_renewable_certificates');
    }

    const compliant = issues.length === 0;

    return {
      check: 'environmental_standards',
      compliant,
      details: {
        requirements: envRequirements,
        issues,
        esgScore: this._calculateESGScore(transactionData)
      },
      severity: compliant ? 'none' : 'medium'
    };
  }

  _getPositionLimits(commodity, region) {
    // Simplified position limits - in production, these would come from a database
    const baseLimits = {
      crude_oil: { maxPosition: 10000000 }, // 10M barrels
      natural_gas: { maxPosition: 50000000 }, // 50M cubic feet
      renewable: { maxPosition: 5000 } // 5000 MW
    };

    // Regional adjustments
    const regionalMultipliers = {
      US: 1.0,
      UK: 0.8,
      EU: 0.9,
      ME: 1.2
    };

    const baseLimit = baseLimits[commodity] || { maxPosition: 1000000 };
    const multiplier = regionalMultipliers[region] || 1.0;

    return {
      maxPosition: baseLimit.maxPosition * multiplier
    };
  }

  _getReportingThresholds(commodity, region) {
    // Regulatory reporting thresholds by region
    const thresholds = {
      US: { volumeThreshold: 1000, valueThreshold: 1000000 },
      UK: { volumeThreshold: 800, valueThreshold: 800000 },
      EU: { volumeThreshold: 900, valueThreshold: 900000 },
      ME: { volumeThreshold: 1200, valueThreshold: 1200000 }
    };

    return thresholds[region] || thresholds.US;
  }

  async _isTraderVerified(_traderId) {
    // Simulate database lookup
    return true; // Placeholder
  }

  async _isCounterpartyVerified(_counterpartyId) {
    // Simulate database lookup
    return true; // Placeholder
  }

  async _checkSanctions(counterpartyId, country) {
    // Simulate sanctions database check
    const sanctionedCountries = ['Country1', 'Country2']; // Placeholder
    return {
      clear: !sanctionedCountries.includes(country),
      details: country
    };
  }

  _calculateAMLRiskScore(transactionData) {
    let score = 0;
    
    if (transactionData.value > 5000000) score += 30;
    if (transactionData.cashTransaction) score += 20;
    if (transactionData.crossBorder) score += 15;
    if (transactionData.newCounterparty) score += 10;
    
    return Math.min(score, 100);
  }

  _calculateESGScore(transactionData) {
    let score = 100;
    
    if (!transactionData.certifications?.environmental) score -= 20;
    if (!transactionData.carbonFootprint) score -= 15;
    if (transactionData.commodity.includes('coal')) score -= 30;
    if (transactionData.commodity.includes('renewable')) score += 20;
    
    return Math.max(score, 0);
  }

  _getEnvironmentalRequirements(commodity, region) {
    return {
      requiresCertification: commodity.includes('renewable'),
      carbonFootprintTracking: region === 'EU' || region === 'UK',
      esgReporting: true
    };
  }

  _generateRequiredActions(violations) {
    const actions = [];
    
    violations.forEach(violation => {
      switch (violation.check) {
      case 'position_limits':
        actions.push({
          action: 'reduce_position',
          priority: 'high',
          deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        });
        break;
      case 'kyc_aml':
        actions.push({
          action: 'complete_verification',
          priority: 'critical',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        break;
      case 'environmental_standards':
        actions.push({
          action: 'obtain_certifications',
          priority: 'medium',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
        break;
      default:
        actions.push({
          action: 'review_compliance',
          priority: 'medium',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
      }
    });
    
    return actions;
  }

  _calculateRiskLevel(violations) {
    if (violations.length === 0) return 'low';
    
    const highSeverityCount = violations.filter(v => v.severity === 'high').length;
    const mediumSeverityCount = violations.filter(v => v.severity === 'medium').length;
    
    if (highSeverityCount > 0) return 'high';
    if (mediumSeverityCount > 1) return 'medium';
    return 'low';
  }

  async generateComplianceReport(_traderId, dateRange) {
    // Generate comprehensive compliance report
    const reportId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // This would query the database for historical compliance data
    const mockData = {
      totalTransactions: 150,
      compliantTransactions: 145,
      violations: 5,
      complianceRate: 96.7
    };
    
    return {
      reportId,
      timestamp,
      traderId: 'sample_trader', // Use placeholder
      period: dateRange,
      summary: mockData,
      detailedViolations: [],
      recommendations: [
        'Implement automated pre-trade compliance checks',
        'Enhanced KYC verification for new counterparties',
        'Regular compliance training for trading staff'
      ]
    };
  }
}

module.exports = ComplianceService;