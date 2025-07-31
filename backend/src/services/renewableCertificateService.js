/**
 * Renewable Certificate Trading Service
 * Handles trading of renewable energy certificates with blockchain transparency
 */

class RenewableCertificateService {
  constructor() {
    this.certificateTypes = {
      REC: 'Renewable Energy Certificate',
      REGO: 'Renewable Energy Guarantees of Origin',
      GO: 'Guarantees of Origin',
      I_REC: 'International Renewable Energy Certificate',
      TIGR: 'The International Go Registry'
    };

    this.energySources = {
      solar: 'Solar photovoltaic',
      wind_onshore: 'Onshore wind',
      wind_offshore: 'Offshore wind',
      hydro_large: 'Large hydroelectric',
      hydro_small: 'Small hydroelectric',
      biomass: 'Biomass',
      biogas: 'Biogas',
      geothermal: 'Geothermal',
      wave: 'Wave energy',
      tidal: 'Tidal energy'
    };

    this.blockchainConfig = {
      network: 'hyperledger_fabric',
      channel: 'renewable_certificates',
      chaincode: 'rec_trading'
    };
  }

  /**
   * Issue a new renewable energy certificate
   * @param {Object} certificateData - Certificate issuance data
   * @returns {Object} Issuance result
   */
  async issueCertificate(certificateData) {
    try {
      const certificateId = this.generateCertificateId(certificateData);
      
      const certificate = {
        id: certificateId,
        type: certificateData.type || 'REC',
        energy_source: certificateData.energy_source,
        generation_facility: {
          id: certificateData.facility_id,
          name: certificateData.facility_name,
          location: certificateData.facility_location,
          capacity: certificateData.facility_capacity,
          commissioning_date: certificateData.commissioning_date
        },
        generation_period: {
          start_date: certificateData.generation_start,
          end_date: certificateData.generation_end,
          energy_generated: certificateData.energy_generated // MWh
        },
        certificate_details: {
          vintage: new Date(certificateData.generation_start).getFullYear(),
          quantity: certificateData.energy_generated, // 1 certificate = 1 MWh
          unit: 'MWh',
          country: certificateData.country,
          region: certificateData.region
        },
        issuance: {
          issuer: 'QuantEnergx Renewable Registry',
          issuance_date: new Date().toISOString(),
          registry: certificateData.registry || 'QuantEnergx',
          status: 'active'
        },
        environmental_attributes: this.calculateEnvironmentalAttributes(certificateData),
        blockchain_record: await this.recordCertificateOnBlockchain(certificateId, certificateData)
      };

      return {
        success: true,
        certificate_id: certificateId,
        certificate: certificate,
        blockchain_hash: certificate.blockchain_record.hash,
        verification_url: this.getVerificationUrl(certificate.blockchain_record.hash)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Trade renewable certificates
   * @param {Object} tradeData - Trading transaction data
   * @returns {Object} Trade execution result
   */
  async tradeCertificates(tradeData) {
    try {
      const tradeId = this.generateTradeId();
      
      // Validate certificate ownership and availability
      const ownershipValidation = await this.validateOwnership(tradeData.seller_id, tradeData.certificate_ids);
      if (!ownershipValidation.valid) {
        throw new Error('Invalid certificate ownership or availability');
      }

      // Execute the trade
      const trade = {
        id: tradeId,
        type: tradeData.trade_type || 'bilateral',
        certificates: tradeData.certificate_ids,
        quantity: tradeData.quantity, // MWh
        price: {
          amount: tradeData.price_per_mwh,
          currency: tradeData.currency || 'USD',
          total_value: tradeData.price_per_mwh * tradeData.quantity
        },
        parties: {
          seller: {
            id: tradeData.seller_id,
            name: tradeData.seller_name,
            type: tradeData.seller_type
          },
          buyer: {
            id: tradeData.buyer_id,
            name: tradeData.buyer_name,
            type: tradeData.buyer_type
          }
        },
        trade_details: {
          execution_time: new Date().toISOString(),
          settlement_date: tradeData.settlement_date,
          delivery_terms: tradeData.delivery_terms || 'electronic',
          payment_terms: tradeData.payment_terms || 'immediate'
        },
        compliance: {
          regulatory_framework: tradeData.regulatory_framework,
          additionality_verified: tradeData.additionality_verified || false,
          green_claims_eligible: this.checkGreenClaimsEligibility(tradeData)
        },
        blockchain_record: await this.recordTradeOnBlockchain(tradeId, tradeData)
      };

      // Update certificate ownership
      await this.transferOwnership(tradeData.certificate_ids, tradeData.seller_id, tradeData.buyer_id);

      return {
        success: true,
        trade_id: tradeId,
        trade: trade,
        blockchain_hash: trade.blockchain_record.hash,
        settlement_instructions: this.generateSettlementInstructions(trade)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retire certificates (for green claims)
   * @param {Object} retirementData - Certificate retirement data
   * @returns {Object} Retirement result
   */
  async retireCertificates(retirementData) {
    try {
      const retirementId = this.generateRetirementId();
      
      const retirement = {
        id: retirementId,
        certificate_ids: retirementData.certificate_ids,
        quantity: retirementData.quantity,
        retired_by: {
          id: retirementData.owner_id,
          name: retirementData.owner_name,
          type: retirementData.owner_type
        },
        retirement_details: {
          retirement_date: new Date().toISOString(),
          purpose: retirementData.purpose || 'voluntary_green_claim',
          beneficiary: retirementData.beneficiary,
          reporting_period: retirementData.reporting_period
        },
        environmental_claim: {
          claim_type: retirementData.claim_type,
          scope: retirementData.scope || 'scope_2',
          methodology: 'Market-based method',
          verification_standard: retirementData.verification_standard
        },
        blockchain_record: await this.recordRetirementOnBlockchain(retirementId, retirementData)
      };

      // Update certificate status to retired
      await this.updateCertificateStatus(retirementData.certificate_ids, 'retired');

      return {
        success: true,
        retirement_id: retirementId,
        retirement: retirement,
        blockchain_hash: retirement.blockchain_record.hash,
        green_claim_certificate: this.generateGreenClaimCertificate(retirement)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track certificate lifecycle and provenance
   * @param {String} certificateId - Certificate identifier
   * @returns {Object} Lifecycle tracking result
   */
  async trackCertificateLifecycle(certificateId) {
    try {
      // Mock lifecycle data - in real implementation, query blockchain and database
      const lifecycle = {
        certificate_id: certificateId,
        current_status: 'active',
        creation: {
          issued_date: '2024-01-15T10:00:00Z',
          issuer: 'QuantEnergx Renewable Registry',
          facility_name: 'Sunfield Solar Farm',
          generation_period: '2024-01-01 to 2024-01-31'
        },
        ownership_history: [
          {
            owner: 'Sunfield Solar LLC',
            from_date: '2024-01-15T10:00:00Z',
            to_date: '2024-02-20T14:30:00Z',
            transfer_type: 'issuance'
          },
          {
            owner: 'GreenEnergy Corp',
            from_date: '2024-02-20T14:30:00Z',
            to_date: null,
            transfer_type: 'purchase'
          }
        ],
        trades: [
          {
            trade_id: 'TRD_001',
            date: '2024-02-20T14:30:00Z',
            seller: 'Sunfield Solar LLC',
            buyer: 'GreenEnergy Corp',
            price: 25.50,
            currency: 'USD'
          }
        ],
        environmental_attributes: {
          carbon_offset: 0.85, // tons CO2 per MWh
          additionality_verified: true,
          local_benefits: ['Job creation', 'Energy independence']
        },
        blockchain_records: [
          {
            event: 'issuance',
            hash: '0x1234567890abcdef',
            block_number: 123456,
            timestamp: '2024-01-15T10:00:00Z'
          },
          {
            event: 'trade',
            hash: '0xabcdef1234567890',
            block_number: 125678,
            timestamp: '2024-02-20T14:30:00Z'
          }
        ]
      };

      return {
        success: true,
        lifecycle: lifecycle,
        verification_status: 'verified',
        transparency_score: this.calculateTransparencyScore(lifecycle)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available certificates for trading
   * @param {Object} filters - Search filters
   * @returns {Object} Available certificates
   */
  async getAvailableCertificates(filters = {}) {
    try {
      // Mock certificate data - in real implementation, query database
      const certificates = [
        {
          id: 'REC_US_SOLAR_001',
          type: 'REC',
          energy_source: 'solar',
          quantity: 1000,
          vintage: 2024,
          location: 'Texas, USA',
          price: 25.50,
          seller: 'Sunfield Solar LLC',
          facility_name: 'Sunfield Solar Farm'
        },
        {
          id: 'REGO_EU_WIND_001',
          type: 'REGO',
          energy_source: 'wind_offshore',
          quantity: 2500,
          vintage: 2024,
          location: 'North Sea, UK',
          price: 45.75,
          seller: 'Atlantic Wind Power',
          facility_name: 'Atlantic Wind Farm'
        },
        {
          id: 'GO_EU_HYDRO_001',
          type: 'GO',
          energy_source: 'hydro_small',
          quantity: 500,
          vintage: 2024,
          location: 'Bavaria, Germany',
          price: 30.25,
          seller: 'Alpine Hydro GmbH',
          facility_name: 'Bavarian Run-of-River'
        }
      ];

      // Apply filters
      let filteredCertificates = certificates;
      
      if (filters.energy_source) {
        filteredCertificates = filteredCertificates.filter(cert => 
          cert.energy_source === filters.energy_source
        );
      }
      
      if (filters.vintage) {
        filteredCertificates = filteredCertificates.filter(cert => 
          cert.vintage === filters.vintage
        );
      }
      
      if (filters.location) {
        filteredCertificates = filteredCertificates.filter(cert => 
          cert.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      return {
        success: true,
        total_certificates: filteredCertificates.length,
        total_quantity: filteredCertificates.reduce((sum, cert) => sum + cert.quantity, 0),
        certificates: filteredCertificates,
        market_statistics: this.getMarketStatistics()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper methods
   */
  generateCertificateId(data) {
    const timestamp = Date.now();
    const source = data.energy_source.toUpperCase();
    const country = data.country.toUpperCase();
    return `${data.type}_${country}_${source}_${timestamp}`;
  }

  generateTradeId() {
    return `TRD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRetirementId() {
    return `RET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateEnvironmentalAttributes(data) {
    const baseAttributes = {
      carbon_offset: this.getCarbonOffsetFactor(data.energy_source) * data.energy_generated,
      air_quality_improvement: true,
      water_conservation: this.getWaterConservationBenefit(data.energy_source),
      land_use_efficiency: this.getLandUseEfficiency(data.energy_source)
    };

    return baseAttributes;
  }

  getCarbonOffsetFactor(energySource) {
    const factors = {
      solar: 0.85,
      wind_onshore: 0.90,
      wind_offshore: 0.95,
      hydro_large: 0.80,
      hydro_small: 0.85,
      biomass: 0.70,
      biogas: 0.75,
      geothermal: 0.88
    };
    return factors[energySource] || 0.75;
  }

  getWaterConservationBenefit(energySource) {
    const waterSaving = {
      solar: 'High - No water consumption',
      wind_onshore: 'High - No water consumption',
      wind_offshore: 'High - No water consumption',
      hydro_large: 'Medium - Reservoir management',
      hydro_small: 'High - Run-of-river operation',
      biomass: 'Low - Some water required',
      biogas: 'Medium - Waste management benefit',
      geothermal: 'Medium - Closed loop systems'
    };
    return waterSaving[energySource] || 'Medium';
  }

  getLandUseEfficiency(energySource) {
    const efficiency = {
      solar: 'Medium - Dual land use possible',
      wind_onshore: 'High - Agriculture continues between turbines',
      wind_offshore: 'High - No land use impact',
      hydro_large: 'Low - Large reservoir area',
      hydro_small: 'High - Minimal land impact',
      biomass: 'Low - Requires feedstock land',
      biogas: 'High - Uses waste materials',
      geothermal: 'High - Small surface footprint'
    };
    return efficiency[energySource] || 'Medium';
  }

  async validateOwnership(sellerId, certificateIds) {
    // Mock ownership validation - in real implementation, check database
    return {
      valid: true,
      certificates_owned: certificateIds.length,
      verification_method: 'blockchain_registry'
    };
  }

  checkGreenClaimsEligibility(tradeData) {
    // Check various criteria for green claims eligibility
    const criteria = {
      additionality: tradeData.additionality_verified || false,
      temporal_matching: true, // Simplified
      geographic_relevance: true,
      tracking_system: true
    };

    return Object.values(criteria).every(criterion => criterion === true);
  }

  async transferOwnership(certificateIds, fromId, toId) {
    // Mock ownership transfer - in real implementation, update database and blockchain
    return {
      success: true,
      certificates_transferred: certificateIds.length,
      from: fromId,
      to: toId,
      timestamp: new Date().toISOString()
    };
  }

  async updateCertificateStatus(certificateIds, status) {
    // Mock status update
    return {
      success: true,
      certificates_updated: certificateIds.length,
      new_status: status
    };
  }

  generateSettlementInstructions(trade) {
    return {
      trade_id: trade.id,
      settlement_date: trade.trade_details.settlement_date,
      payment_amount: trade.price.total_value,
      payment_currency: trade.price.currency,
      delivery_method: 'electronic_transfer',
      registry_transfer_required: true,
      compliance_documentation: ['Trade confirmation', 'Ownership transfer certificate']
    };
  }

  generateGreenClaimCertificate(retirement) {
    return {
      certificate_id: `GCC_${retirement.id}`,
      claim_statement: `${retirement.quantity} MWh of renewable energy consumed`,
      verification_standard: retirement.environmental_claim.verification_standard,
      retirement_date: retirement.retirement_details.retirement_date,
      validity: 'Valid for environmental reporting and disclosure'
    };
  }

  calculateTransparencyScore(lifecycle) {
    let score = 0;
    
    // Blockchain records presence
    if (lifecycle.blockchain_records.length > 0) score += 40;
    
    // Complete ownership history
    if (lifecycle.ownership_history.length > 0) score += 30;
    
    // Environmental attributes verified
    if (lifecycle.environmental_attributes.additionality_verified) score += 20;
    
    // Trade transparency
    if (lifecycle.trades.length > 0) score += 10;

    return Math.min(100, score);
  }

  getMarketStatistics() {
    return {
      total_volume_last_30_days: 125000, // MWh
      average_price: 32.50,
      price_range: {
        min: 18.75,
        max: 65.00
      },
      top_energy_sources: ['wind_offshore', 'solar', 'hydro_small'],
      active_traders: 85,
      certificates_issued_this_month: 50000
    };
  }

  getVerificationUrl(hash) {
    return `https://blockchain.quantenergx.com/verify/${hash}`;
  }

  async recordCertificateOnBlockchain(certificateId, data) {
    return this.recordOnBlockchain('certificate_issuance', { certificateId, data });
  }

  async recordTradeOnBlockchain(tradeId, data) {
    return this.recordOnBlockchain('certificate_trade', { tradeId, data });
  }

  async recordRetirementOnBlockchain(retirementId, data) {
    return this.recordOnBlockchain('certificate_retirement', { retirementId, data });
  }

  async recordOnBlockchain(eventType, data) {
    // Mock blockchain recording
    const record = {
      event_type: eventType,
      data: data,
      timestamp: new Date().toISOString(),
      network: this.blockchainConfig.network
    };

    const hash = this.generateHash(JSON.stringify(record));
    
    return {
      hash: hash,
      block_number: Math.floor(Date.now() / 1000),
      transaction_id: `0x${hash}`,
      status: 'confirmed'
    };
  }

  generateHash(data) {
    // Simple hash generation for demo
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
}

module.exports = RenewableCertificateService;