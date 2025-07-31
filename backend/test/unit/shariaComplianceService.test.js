/**
 * Sharia Compliance Service Tests
 */

const ShariaComplianceService = require('../../src/services/shariaComplianceService');

describe('ShariaComplianceService', () => {
  let shariaService;

  beforeEach(() => {
    shariaService = new ShariaComplianceService();
  });

  describe('checkShariaCompliance', () => {
    test('should approve compliant solar energy instrument', async () => {
      const instrument = {
        id: 'SOLAR_001',
        sector: 'solar_energy',
        interest_rate: 0,
        financing_type: 'asset_based',
        asset_backed: true,
        asset_backing_ratio: 0.8,
        contract_structure: 'murabaha',
        type: 'spot',
        volatility: 20,
        allows_short_selling: false,
        max_leverage: 1
      };

      const result = await shariaService.checkShariaCompliance(instrument);

      expect(result.success).toBe(true);
      expect(result.is_sharia_compliant).toBe(true);
      expect(result.compliance_score).toBeGreaterThan(80);
      expect(result.certification).toBeTruthy();
      expect(result.certification.certificate_id).toContain('SHARIA_');
    });

    test('should reject instrument with interest-based financing', async () => {
      const instrument = {
        id: 'OIL_002',
        sector: 'crude_oil',
        interest_rate: 5.5,
        financing_type: 'interest_based',
        asset_backed: true,
        asset_backing_ratio: 0.6,
        contract_structure: 'conventional'
      };

      const result = await shariaService.checkShariaCompliance(instrument);

      expect(result.success).toBe(true);
      expect(result.is_sharia_compliant).toBe(false);
      expect(result.checks.interest_check.compliant).toBe(false);
      expect(result.recommendations).toContain('Structure transaction without interest-based elements');
    });

    test('should reject prohibited sector (alcohol)', async () => {
      const instrument = {
        id: 'ALC_001',
        sector: 'alcohol_production',
        interest_rate: 0,
        financing_type: 'asset_based',
        asset_backed: true,
        asset_backing_ratio: 0.7,
        contract_structure: 'murabaha'
      };

      const result = await shariaService.checkShariaCompliance(instrument);

      expect(result.success).toBe(true);
      expect(result.is_sharia_compliant).toBe(false);
      expect(result.checks.sector_compliance.compliant).toBe(false);
    });

    test('should reject instrument with excessive speculation', async () => {
      const instrument = {
        id: 'DERIV_001',
        sector: 'natural_gas',
        interest_rate: 0,
        financing_type: 'asset_based',
        asset_backed: true,
        asset_backing_ratio: 0.6,
        contract_structure: 'salam',
        type: 'derivative',
        volatility: 80,
        allows_short_selling: true,
        max_leverage: 10
      };

      const result = await shariaService.checkShariaCompliance(instrument);

      expect(result.success).toBe(true);
      expect(result.is_sharia_compliant).toBe(false);
      expect(result.checks.speculation_check.compliant).toBe(false);
    });

    test('should reject instrument with insufficient asset backing', async () => {
      const instrument = {
        id: 'GAS_001',
        sector: 'natural_gas',
        interest_rate: 0,
        financing_type: 'asset_based',
        asset_backed: true,
        asset_backing_ratio: 0.3, // Below 51% requirement
        contract_structure: 'ijara'
      };

      const result = await shariaService.checkShariaCompliance(instrument);

      expect(result.success).toBe(true);
      expect(result.is_sharia_compliant).toBe(false);
      expect(result.checks.asset_backing.compliant).toBe(false);
    });
  });

  describe('getShariaCompliantProducts', () => {
    test('should return available Sharia-compliant products', async () => {
      const result = await shariaService.getShariaCompliantProducts();

      expect(result.success).toBe(true);
      expect(result.products).toBeInstanceOf(Array);
      expect(result.products.length).toBeGreaterThan(0);
      
      const product = result.products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('contract_structure');
      expect(product.asset_backed).toBe(true);
    });
  });

  describe('isValidTradingTime', () => {
    test('should validate trading time outside Friday prayer hours', () => {
      // Mock current time to Wednesday 10 AM
      const mockDate = new Date('2024-01-17T10:00:00Z'); // Wednesday
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const result = shariaService.isValidTradingTime();

      expect(result.valid).toBe(true);
      expect(result.reason).toBe('Normal trading hours');

      global.Date.mockRestore();
    });

    test('should restrict trading during Friday prayer time', () => {
      // Mock current time to Friday 1 PM (prayer time)
      const mockDate = new Date('2024-01-19T13:00:00Z'); // Friday 1 PM
      Object.setPrototypeOf(mockDate, Date.prototype);
      mockDate.getDay = () => 5; // Friday
      mockDate.getHours = () => 13; // 1 PM
      
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const result = shariaService.isValidTradingTime();

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Friday prayer time (Jummah) - trading suspended');

      global.Date.mockRestore();
    });
  });

  describe('calculateComplianceScore', () => {
    test('should calculate correct weighted average score', () => {
      const checks = {
        sector_compliance: { score: 100 },
        interest_check: { score: 100 },
        speculation_check: { score: 80 },
        asset_backing: { score: 90 },
        contract_structure: { score: 100 }
      };

      const score = shariaService.calculateComplianceScore(checks);

      expect(score).toBe(94); // (100+100+80+90+100)/5 = 94
    });
  });

  describe('calculateSpeculationRisk', () => {
    test('should calculate high risk for derivative with leverage', () => {
      const instrument = {
        type: 'derivative',
        volatility: 60,
        allows_short_selling: true,
        max_leverage: 5
      };

      const riskScore = shariaService.calculateSpeculationRisk(instrument);

      expect(riskScore).toBeGreaterThan(50);
    });

    test('should calculate low risk for spot transaction', () => {
      const instrument = {
        type: 'spot',
        volatility: 15,
        allows_short_selling: false,
        max_leverage: 1
      };

      const riskScore = shariaService.calculateSpeculationRisk(instrument);

      expect(riskScore).toBeLessThan(30);
    });
  });

  describe('generateShariaCertificate', () => {
    test('should generate valid Sharia certificate', () => {
      const instrument = { id: 'SOLAR_001' };
      const certificate = shariaService.generateShariaCertificate(instrument);

      expect(certificate.certificate_id).toContain('SHARIA_SOLAR_001_');
      expect(certificate.certifying_authority).toBe('QuantEnergx Sharia Board');
      expect(certificate.shariah_standards).toContain('AAOIFI');
      expect(new Date(certificate.valid_until)).toBeInstanceOf(Date);
    });
  });

  describe('generateRecommendations', () => {
    test('should provide relevant recommendations for non-compliant checks', () => {
      const checks = {
        sector_compliance: { compliant: false },
        interest_check: { compliant: false },
        speculation_check: { compliant: true },
        asset_backing: { compliant: true },
        contract_structure: { compliant: true }
      };

      const recommendations = shariaService.generateRecommendations(checks);

      expect(recommendations).toContain('Consider alternative energy sectors that are Sharia compliant');
      expect(recommendations).toContain('Structure transaction without interest-based elements');
      expect(recommendations.length).toBe(2);
    });

    test('should provide no recommendations for fully compliant instrument', () => {
      const checks = {
        sector_compliance: { compliant: true },
        interest_check: { compliant: true },
        speculation_check: { compliant: true },
        asset_backing: { compliant: true },
        contract_structure: { compliant: true }
      };

      const recommendations = shariaService.generateRecommendations(checks);

      expect(recommendations).toHaveLength(0);
    });
  });
});