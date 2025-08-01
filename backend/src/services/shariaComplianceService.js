/**
 * Sharia Compliance Service
 * Handles Islamic finance compliance for Middle East markets
 */

class ShariaComplianceService {
  constructor() {
    this.prohibitedSectors = [
      'alcohol',
      'tobacco',
      'gambling',
      'conventional_banking',
      'interest_based_finance',
      'pork_products',
      'adult_entertainment'
    ];

    this.shariaCompliantEnergySectors = [
      'solar_energy',
      'wind_energy',
      'hydroelectric',
      'geothermal',
      'biomass',
      'natural_gas',
      'crude_oil_halal'
    ];
  }

  /**
   * Check if a trading instrument is Sharia compliant
   * @param {Object} instrument - Trading instrument details
   * @returns {Object} Compliance result
   */
  async checkShariaCompliance(instrument) {
    try {
      const complianceChecks = {
        sector_compliance: this.checkSectorCompliance(instrument),
        interest_check: this.checkInterestCompliance(instrument),
        speculation_check: this.checkSpeculationCompliance(instrument),
        asset_backing: this.checkAssetBacking(instrument),
        contract_structure: this.checkContractStructure(instrument)
      };

      const isCompliant = Object.values(complianceChecks).every(check => check.compliant);

      return {
        success: true,
        instrument_id: instrument.id,
        is_sharia_compliant: isCompliant,
        compliance_score: this.calculateComplianceScore(complianceChecks),
        checks: complianceChecks,
        certification: isCompliant ? this.generateShariaCertificate(instrument) : null,
        recommendations: this.generateRecommendations(complianceChecks)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        is_sharia_compliant: false
      };
    }
  }

  /**
   * Check sector compliance against Sharia principles
   */
  checkSectorCompliance(instrument) {
    const sector = instrument.sector?.toLowerCase() || '';
    const isProhibited = this.prohibitedSectors.some(prohibited => 
      sector.includes(prohibited)
    );

    return {
      compliant: !isProhibited,
      score: isProhibited ? 0 : 100,
      details: {
        sector: instrument.sector,
        prohibited_sectors_matched: this.prohibitedSectors.filter(prohibited =>
          sector.includes(prohibited)
        ),
        message: isProhibited ? 
          'Instrument involves prohibited business activities' : 
          'Sector is permissible under Sharia law'
      }
    };
  }

  /**
   * Check for interest-based transactions (Riba)
   */
  checkInterestCompliance(instrument) {
    const hasInterest = instrument.interest_rate > 0 || 
                       instrument.financing_type === 'interest_based';

    return {
      compliant: !hasInterest,
      score: hasInterest ? 0 : 100,
      details: {
        interest_rate: instrument.interest_rate || 0,
        financing_type: instrument.financing_type,
        message: hasInterest ? 
          'Transaction involves Riba (interest) which is prohibited' : 
          'No interest-based elements detected'
      }
    };
  }

  /**
   * Check for excessive speculation (Gharar)
   */
  checkSpeculationCompliance(instrument) {
    const speculationScore = this.calculateSpeculationRisk(instrument);
    const isCompliant = speculationScore <= 30; // 30% threshold

    return {
      compliant: isCompliant,
      score: Math.max(0, 100 - speculationScore),
      details: {
        speculation_risk: speculationScore,
        risk_factors: this.identifySpeculationRisks(instrument),
        message: isCompliant ? 
          'Acceptable level of uncertainty' : 
          'Excessive speculation (Gharar) detected'
      }
    };
  }

  /**
   * Check asset backing requirements
   */
  checkAssetBacking(instrument) {
    const hasPhysicalAsset = instrument.asset_backed === true;
    const assetRatio = instrument.asset_backing_ratio || 0;

    return {
      compliant: hasPhysicalAsset && assetRatio >= 0.51, // Minimum 51% asset backing
      score: hasPhysicalAsset ? Math.min(100, assetRatio * 100) : 0,
      details: {
        asset_backed: hasPhysicalAsset,
        backing_ratio: assetRatio,
        physical_assets: instrument.underlying_assets,
        message: hasPhysicalAsset && assetRatio >= 0.51 ? 
          'Sufficient asset backing' : 
          'Insufficient tangible asset backing'
      }
    };
  }

  /**
   * Check contract structure compliance
   */
  checkContractStructure(instrument) {
    const allowedStructures = ['murabaha', 'ijara', 'salam', 'istisna', 'spot'];
    const structure = instrument.contract_structure?.toLowerCase();
    const isAllowed = allowedStructures.includes(structure);

    return {
      compliant: isAllowed,
      score: isAllowed ? 100 : 0,
      details: {
        contract_structure: structure,
        allowed_structures: allowedStructures,
        message: isAllowed ? 
          'Contract structure is Sharia compliant' : 
          'Contract structure not recognized as Sharia compliant'
      }
    };
  }

  /**
   * Calculate overall compliance score
   */
  calculateComplianceScore(checks) {
    const scores = Object.values(checks).map(check => check.score);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * Calculate speculation risk score
   */
  calculateSpeculationRisk(instrument) {
    let riskScore = 0;

    // Derivative instruments add risk
    if (instrument.type === 'derivative') riskScore += 20;
    
    // High volatility adds risk
    if (instrument.volatility > 50) riskScore += 15;
    
    // Short selling adds risk
    if (instrument.allows_short_selling) riskScore += 25;
    
    // Leverage adds risk
    if (instrument.max_leverage > 2) riskScore += 20;

    return Math.min(100, riskScore);
  }

  /**
   * Identify specific speculation risks
   */
  identifySpeculationRisks(instrument) {
    const risks = [];
    
    if (instrument.type === 'derivative') {
      risks.push('Complex derivative structure');
    }
    if (instrument.volatility > 50) {
      risks.push('High price volatility');
    }
    if (instrument.allows_short_selling) {
      risks.push('Short selling permitted');
    }
    if (instrument.max_leverage > 2) {
      risks.push('High leverage available');
    }

    return risks;
  }

  /**
   * Generate Sharia compliance certificate
   */
  generateShariaCertificate(instrument) {
    return {
      certificate_id: `SHARIA_${instrument.id}_${Date.now()}`,
      issued_date: new Date().toISOString(),
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      certifying_authority: 'QuantEnergx Sharia Board',
      certificate_type: 'Energy Trading Instrument Compliance',
      shariah_standards: ['AAOIFI', 'Islamic Fiqh Academy'],
      notes: 'Certificate valid for spot and forward energy trading'
    };
  }

  /**
   * Generate compliance recommendations
   */
  generateRecommendations(checks) {
    const recommendations = [];

    Object.entries(checks).forEach(([checkName, result]) => {
      if (!result.compliant) {
        switch (checkName) {
        case 'sector_compliance':
          recommendations.push('Consider alternative energy sectors that are Sharia compliant');
          break;
        case 'interest_check':
          recommendations.push('Structure transaction without interest-based elements');
          break;
        case 'speculation_check':
          recommendations.push('Reduce speculation risk through physical delivery or asset backing');
          break;
        case 'asset_backing':
          recommendations.push('Increase tangible asset backing ratio to minimum 51%');
          break;
        case 'contract_structure':
          recommendations.push('Use approved Islamic contract structures like Murabaha or Ijara');
          break;
        }
      }
    });

    return recommendations;
  }

  /**
   * Get Sharia-compliant energy products
   */
  async getShariaCompliantProducts() {
    return {
      success: true,
      products: [
        {
          id: 'halal_crude_oil',
          name: 'Halal Crude Oil',
          type: 'spot',
          description: 'Physically delivered crude oil with Sharia compliance',
          contract_structure: 'salam',
          asset_backed: true,
          minimum_quantity: 1000,
          unit: 'barrels'
        },
        {
          id: 'solar_energy_certificates',
          name: 'Solar Energy Certificates',
          type: 'renewable_certificate',
          description: 'Solar energy production certificates',
          contract_structure: 'ijara',
          asset_backed: true,
          minimum_quantity: 1,
          unit: 'MWh'
        },
        {
          id: 'wind_energy_forward',
          name: 'Wind Energy Forward',
          type: 'forward',
          description: 'Forward contract for wind energy delivery',
          contract_structure: 'istisna',
          asset_backed: true,
          delivery_period: '30_days',
          minimum_quantity: 100,
          unit: 'MWh'
        }
      ]
    };
  }

  /**
   * Validate Islamic calendar and trading hours
   */
  isValidTradingTime() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();

    // Avoid Friday prayer time (12:00-14:00 local time in Middle East)
    if (dayOfWeek === 5 && hour >= 12 && hour < 14) {
      return {
        valid: false,
        reason: 'Friday prayer time (Jummah) - trading suspended'
      };
    }

    return {
      valid: true,
      reason: 'Normal trading hours'
    };
  }
}

module.exports = ShariaComplianceService;