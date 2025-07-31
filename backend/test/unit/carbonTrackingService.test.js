/**
 * Carbon Tracking Service Tests
 */

const CarbonTrackingService = require('../../src/services/carbonTrackingService');

describe('CarbonTrackingService', () => {
  let carbonService;

  beforeEach(() => {
    carbonService = new CarbonTrackingService();
  });

  describe('calculateCarbonFootprint', () => {
    test('should calculate footprint for crude oil transaction', async () => {
      const transaction = {
        id: 'TXN_001',
        commodity: 'crude_oil',
        quantity: 1000, // barrels
        transport: {
          type: 'truck_transport',
          distance: 500, // km
          weight: 140 // tons (1000 barrels * 0.14 tons/barrel)
        },
        processing: {
          refining_intensity: 50, // kg CO2 per barrel
          electricity_usage: 100 // MWh
        },
        upstream_intensity: 25, // kg CO2 per barrel
        include_downstream: true,
        end_use_intensity: 200 // kg CO2 per barrel
      };

      const result = await carbonService.calculateCarbonFootprint(transaction);

      expect(result.success).toBe(true);
      expect(result.transaction_id).toBe('TXN_001');
      expect(result.total_emissions).toBeGreaterThan(0);
      expect(result.carbon_intensity).toBeGreaterThan(0);
      expect(result.breakdown).toHaveProperty('product_emissions');
      expect(result.breakdown).toHaveProperty('transport_emissions');
      expect(result.breakdown).toHaveProperty('processing_emissions');
      expect(result.breakdown).toHaveProperty('indirect_emissions');
      expect(result.methodology).toBe('GHG Protocol Corporate Standard');
      expect(result.blockchain_hash).toBeTruthy();
    });

    test('should calculate minimal footprint for renewable energy certificate', async () => {
      const transaction = {
        id: 'TXN_002',
        commodity: 'solar_certificate',
        quantity: 1000, // MWh
        transport: {
          type: 'pipeline_transport',
          distance: 0 // Electronic certificate
        }
      };

      const result = await carbonService.calculateCarbonFootprint(transaction);

      expect(result.success).toBe(true);
      expect(result.total_emissions).toBeLessThan(100); // Should be very low for renewables
    });

    test('should handle transaction without transport data', async () => {
      const transaction = {
        id: 'TXN_003',
        commodity: 'natural_gas',
        quantity: 1000 // thousand cubic feet
      };

      const result = await carbonService.calculateCarbonFootprint(transaction);

      expect(result.success).toBe(true);
      expect(result.breakdown.transport_emissions).toBe(0);
      expect(result.total_emissions).toBeGreaterThan(0); // Should still have product emissions
    });
  });

  describe('trackCarbonCredits', () => {
    test('should create carbon credit record', async () => {
      const creditData = {
        project_type: 'forestry',
        amount: 1000, // tons CO2
        vintage_year: 2024,
        standard: 'VCS',
        location: 'Brazil'
      };

      const result = await carbonService.trackCarbonCredits(creditData);

      expect(result.success).toBe(true);
      expect(result.credit_id).toContain('CC_');
      expect(result.credit_record.credits_amount).toBe(1000);
      expect(result.credit_record.project_type).toBe('forestry');
      expect(result.credit_record.verification_standard).toBe('VCS');
      expect(result.blockchain_hash).toBeTruthy();
      expect(result.verification_url).toContain('hyperledger_fabric');
    });

    test('should use default standard if not provided', async () => {
      const creditData = {
        project_type: 'renewable_energy',
        amount: 500,
        vintage_year: 2024,
        location: 'India'
      };

      const result = await carbonService.trackCarbonCredits(creditData);

      expect(result.success).toBe(true);
      expect(result.credit_record.verification_standard).toBe('VCS');
    });
  });

  describe('calculateOffsetRequirements', () => {
    test('should calculate offset requirements for multiple transactions', async () => {
      const transactions = [
        {
          id: 'TXN_001',
          commodity: 'crude_oil',
          quantity: 500
        },
        {
          id: 'TXN_002',
          commodity: 'natural_gas',
          quantity: 1000
        }
      ];

      const result = await carbonService.calculateOffsetRequirements(transactions);

      expect(result.success).toBe(true);
      expect(result.total_emissions).toBeGreaterThan(0);
      expect(result.offset_required).toBe(result.total_emissions);
      expect(result.estimated_cost).toHaveProperty('base_cost');
      expect(result.estimated_cost).toHaveProperty('admin_fee');
      expect(result.estimated_cost).toHaveProperty('total_cost');
      expect(result.estimated_cost.currency).toBe('USD');
      expect(result.transaction_breakdown).toHaveLength(2);
      expect(result.recommended_projects).toBeInstanceOf(Array);
      expect(result.compliance_status).toBeInstanceOf(Array);
    });

    test('should handle empty transaction list', async () => {
      const result = await carbonService.calculateOffsetRequirements([]);

      expect(result.success).toBe(true);
      expect(result.total_emissions).toBe(0);
      expect(result.offset_required).toBe(0);
      expect(result.transaction_breakdown).toHaveLength(0);
    });
  });

  describe('generateCarbonReport', () => {
    test('should generate comprehensive carbon report', async () => {
      const result = await carbonService.generateCarbonReport('ENTITY_001', '2024');

      expect(result.success).toBe(true);
      expect(result.entity_id).toBe('ENTITY_001');
      expect(result.reporting_period).toBe('2024');
      expect(result.total_emissions).toBeGreaterThan(0);
      expect(result.emissions_intensity).toBeGreaterThan(0);
      expect(result.emissions_breakdown).toHaveProperty('crude_oil');
      expect(result.emissions_breakdown).toHaveProperty('natural_gas');
      expect(result.trends).toBeInstanceOf(Array);
      expect(result.reduction_initiatives).toBeInstanceOf(Array);
      expect(result.targets).toHaveProperty('net_zero_target');
      expect(result.verification).toHaveProperty('verified_by');
      expect(result.verification.standard).toBe('ISO 14064-1');
    });
  });

  describe('getCarbonMarketPrices', () => {
    test('should return current carbon market prices', async () => {
      const result = await carbonService.getCarbonMarketPrices();

      expect(result.success).toBe(true);
      expect(result.markets).toHaveProperty('eu_ets');
      expect(result.markets).toHaveProperty('california_cap_trade');
      expect(result.markets).toHaveProperty('voluntary_market');
      
      const euEts = result.markets.eu_ets;
      expect(euEts).toHaveProperty('price');
      expect(euEts).toHaveProperty('currency');
      expect(euEts).toHaveProperty('change');
      expect(euEts).toHaveProperty('volume');
      expect(euEts.currency).toBe('EUR');
    });
  });

  describe('emission factor calculations', () => {
    test('should calculate correct product emissions for crude oil', () => {
      const transaction = {
        commodity: 'crude_oil',
        quantity: 100 // barrels
      };

      const emissions = carbonService.calculateProductEmissions(transaction);
      const expectedEmissions = 100 * carbonService.emissionFactors.crude_oil; // 100 * 317

      expect(emissions).toBe(expectedEmissions);
    });

    test('should calculate correct product emissions for natural gas', () => {
      const transaction = {
        commodity: 'natural_gas',
        quantity: 1000 // thousand cubic feet
      };

      const emissions = carbonService.calculateProductEmissions(transaction);
      const expectedEmissions = 1000 * carbonService.emissionFactors.natural_gas; // 1000 * 53.1

      expect(emissions).toBe(expectedEmissions);
    });

    test('should calculate minimal emissions for renewable energy', () => {
      const transaction = {
        commodity: 'solar_energy',
        quantity: 1000 // MWh
      };

      const emissions = carbonService.calculateProductEmissions(transaction);

      expect(emissions).toBeLessThan(100); // Should be very low for renewables
    });
  });

  describe('transport emissions calculation', () => {
    test('should calculate transport emissions correctly', () => {
      const transaction = {
        transport: {
          type: 'truck_transport',
          distance: 100, // km
        },
        quantity: 1000,
        unit_weight: 0.14 // tons per unit
      };

      const emissions = carbonService.calculateTransportEmissions(transaction);
      const expectedEmissions = 100 * (1000 * 0.14) * carbonService.emissionFactors.truck_transport;

      expect(emissions).toBe(expectedEmissions);
    });

    test('should return zero emissions when no transport data', () => {
      const transaction = {
        quantity: 1000
      };

      const emissions = carbonService.calculateTransportEmissions(transaction);

      expect(emissions).toBe(0);
    });
  });

  describe('blockchain integration', () => {
    test('should record carbon data on blockchain', async () => {
      const result = await carbonService.recordOnBlockchain('TXN_001', 1000);

      expect(result.hash).toBeTruthy();
      expect(result.block_number).toBeGreaterThan(0);
      expect(result.network).toBe('hyperledger_fabric');
      expect(result.status).toBe('confirmed');
    });

    test('should generate consistent hash for same data', () => {
      const data = 'test data';
      const hash1 = carbonService.generateMockHash(data);
      const hash2 = carbonService.generateMockHash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
    });
  });

  describe('compliance status checking', () => {
    test('should check compliance against multiple schemes', () => {
      const emissions = 15000; // tons CO2
      const status = carbonService.checkComplianceStatus(emissions);

      expect(status).toBeInstanceOf(Array);
      expect(status.length).toBeGreaterThan(0);
      
      const euEts = status.find(s => s.scheme === 'eu_ets');
      expect(euEts).toBeTruthy();
      expect(euEts.threshold).toBe(10000);
      expect(euEts.compliance_required).toBe(true);
      expect(euEts.surplus_deficit).toBeLessThan(0);
    });
  });

  describe('offset cost calculation', () => {
    test('should calculate offset costs correctly', () => {
      const emissions = 1000; // tons CO2
      const cost = carbonService.calculateOffsetCost(emissions);

      expect(cost.base_cost).toBe(15000); // 1000 * 15
      expect(cost.admin_fee).toBe(750); // 15000 * 0.05
      expect(cost.total_cost).toBe(15750); // 15000 + 750
      expect(cost.currency).toBe('USD');
    });
  });

  describe('recommended offset projects', () => {
    test('should filter projects by available credits', () => {
      const emissions = 20000; // tons CO2
      const projects = carbonService.getRecommendedOffsetProjects(emissions);

      // Should only return projects with sufficient credits
      projects.forEach(project => {
        expect(project.available_credits).toBeGreaterThanOrEqual(emissions);
      });
    });

    test('should return projects for small offset requirements', () => {
      const emissions = 1000; // tons CO2
      const projects = carbonService.getRecommendedOffsetProjects(emissions);

      expect(projects.length).toBeGreaterThan(0);
      projects.forEach(project => {
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('price_per_ton');
        expect(project).toHaveProperty('verification');
        expect(project).toHaveProperty('co_benefits');
      });
    });
  });

  describe('error handling', () => {
    test('should handle calculation errors gracefully', async () => {
      // Mock a method to throw an error
      const originalMethod = carbonService.calculateProductEmissions;
      carbonService.calculateProductEmissions = jest.fn(() => {
        throw new Error('Calculation error');
      });

      const result = await carbonService.calculateCarbonFootprint({
        id: 'TEST',
        commodity: 'crude_oil',
        quantity: 100
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Calculation error');

      // Restore original method
      carbonService.calculateProductEmissions = originalMethod;
    });
  });
});