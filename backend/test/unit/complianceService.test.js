const ComplianceService = require('../../src/services/complianceService');

describe('ComplianceService Unit Tests', () => {
  let complianceService;

  beforeEach(() => {
    complianceService = new ComplianceService();
  });

  describe('performComplianceCheck', () => {
    it('should perform a complete compliance check', async () => {
      const transactionData = {
        commodity: 'crude_oil',
        volume: 1000,
        price: 80.5,
        marketPrice: 80.0,
        value: 80500,
        traderId: 'trader123',
        counterpartyId: 'cp456',
        country: 'US',
        currentPositions: 5000,
        certifications: {
          environmental: true,
          renewable: false
        }
      };

      const result = await complianceService.performComplianceCheck(transactionData, 'US');

      expect(result).toHaveProperty('checkId');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('region', 'US');
      expect(result).toHaveProperty('overallCompliance');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('requiredActions');
      expect(result).toHaveProperty('riskLevel');

      expect(Array.isArray(result.results)).toBe(true);
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.requiredActions)).toBe(true);
    });

    it('should handle missing transaction data gracefully', async () => {
      const incompleteData = {
        commodity: 'crude_oil',
        volume: 1000
        // Missing required fields
      };

      await expect(
        complianceService.performComplianceCheck(incompleteData, 'US')
      ).rejects.toThrow('Compliance check failed');
    });
  });

  describe('_checkPositionLimits', () => {
    it('should pass when position is within limits', async () => {
      const transactionData = {
        commodity: 'crude_oil',
        volume: 1000,
        currentPositions: 5000
      };

      const result = await complianceService._checkPositionLimits(transactionData, 'US');

      expect(result).toHaveProperty('check', 'position_limits');
      expect(result).toHaveProperty('compliant', true);
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('severity', 'none');
    });

    it('should fail when position exceeds limits', async () => {
      const transactionData = {
        commodity: 'crude_oil',
        volume: 8000000, // Large volume
        currentPositions: 5000000
      };

      const result = await complianceService._checkPositionLimits(transactionData, 'US');

      expect(result).toHaveProperty('compliant', false);
      expect(result).toHaveProperty('severity', 'high');
      expect(result.details.totalPosition).toBeGreaterThan(result.details.limit);
    });
  });

  describe('_checkMarketManipulation', () => {
    it('should pass for normal trading activity', async () => {
      const transactionData = {
        price: 80.2,
        marketPrice: 80.0,
        volume: 1000
      };

      const result = await complianceService._checkMarketManipulation(transactionData, 'US');

      expect(result).toHaveProperty('check', 'market_manipulation');
      expect(result).toHaveProperty('compliant', true);
      expect(result).toHaveProperty('severity', 'none');
    });

    it('should flag suspicious price deviations', async () => {
      const transactionData = {
        price: 90.0, // 12.5% above market
        marketPrice: 80.0,
        volume: 1000
      };

      const result = await complianceService._checkMarketManipulation(transactionData, 'US');

      expect(result).toHaveProperty('compliant', false);
      expect(result).toHaveProperty('severity', 'medium');
      expect(result.details.suspiciousPatterns).toContain('unusual_price_deviation');
    });

    it('should flag large volume trades', async () => {
      const transactionData = {
        price: 80.0,
        marketPrice: 80.0,
        volume: 150000 // Large volume
      };

      const result = await complianceService._checkMarketManipulation(transactionData, 'US');

      expect(result.details.suspiciousPatterns).toContain('large_volume_trade');
    });
  });

  describe('_checkKYCAML', () => {
    it('should pass for verified parties', async () => {
      const transactionData = {
        traderId: 'trader123',
        counterpartyId: 'cp456',
        value: 80500,
        country: 'US'
      };

      const result = await complianceService._checkKYCAML(transactionData, 'US');

      expect(result).toHaveProperty('check', 'kyc_aml');
      expect(result).toHaveProperty('compliant', true);
      expect(result.details.traderVerified).toBe(true);
      expect(result.details.counterpartyVerified).toBe(true);
    });

    it('should flag large transactions', async () => {
      const transactionData = {
        traderId: 'trader123',
        counterpartyId: 'cp456',
        value: 1500000, // Large transaction
        country: 'US'
      };

      const result = await complianceService._checkKYCAML(transactionData, 'US');

      expect(result.details.issues).toContain('large_transaction_reporting_required');
    });
  });

  describe('_checkEnvironmentalStandards', () => {
    it('should pass for non-renewable commodities without special requirements', async () => {
      const transactionData = {
        commodity: 'crude_oil',
        certifications: {}
      };

      const result = await complianceService._checkEnvironmentalStandards(transactionData, 'US');

      expect(result).toHaveProperty('check', 'environmental_standards');
      expect(result).toHaveProperty('compliant', true);
    });

    it('should require certifications for renewable commodities', async () => {
      const transactionData = {
        commodity: 'renewable_energy',
        certifications: {}
      };

      const result = await complianceService._checkEnvironmentalStandards(transactionData, 'EU');

      expect(result).toHaveProperty('compliant', false);
      expect(result.details.issues).toContain('missing_environmental_certification');
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate a compliance report', async () => {
      const dateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z'
      };

      const report = await complianceService.generateComplianceReport('trader123', dateRange);

      expect(report).toHaveProperty('reportId');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('traderId', 'sample_trader');
      expect(report).toHaveProperty('period', dateRange);
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('detailedViolations');
      expect(report).toHaveProperty('recommendations');

      expect(Array.isArray(report.detailedViolations)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Regulatory frameworks', () => {
    it('should have regulatory frameworks defined', () => {
      expect(complianceService.regulatoryFrameworks).toHaveProperty('US');
      expect(complianceService.regulatoryFrameworks).toHaveProperty('UK');
      expect(complianceService.regulatoryFrameworks).toHaveProperty('EU');
      expect(complianceService.regulatoryFrameworks).toHaveProperty('ME');

      expect(complianceService.regulatoryFrameworks.US).toHaveProperty('cftc');
      expect(complianceService.regulatoryFrameworks.US).toHaveProperty('ferc');
    });
  });

  describe('Compliance checks', () => {
    it('should have compliance checks defined', () => {
      expect(Array.isArray(complianceService.complianceChecks)).toBe(true);
      expect(complianceService.complianceChecks).toContain('position_limits');
      expect(complianceService.complianceChecks).toContain('transaction_reporting');
      expect(complianceService.complianceChecks).toContain('kyc_aml');
    });
  });
});