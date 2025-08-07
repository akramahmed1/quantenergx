const CFTCComplianceService = require('../../src/services/compliance/cftc');

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Mock Joi validation
jest.mock('joi', () => ({
  object: jest.fn(() => ({
    validate: jest.fn(() => ({ error: null }))
  })),
  string: jest.fn(() => ({
    min: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    required: jest.fn().mockReturnThis(),
    email: jest.fn().mockReturnThis(),
    pattern: jest.fn().mockReturnThis(),
    length: jest.fn().mockReturnThis(),
    uppercase: jest.fn().mockReturnThis(),
    valid: jest.fn().mockReturnThis(),
  })),
  number: jest.fn(() => ({
    min: jest.fn().mockReturnThis(),
    required: jest.fn().mockReturnThis(),
  })),
  date: jest.fn(() => ({
    required: jest.fn().mockReturnThis(),
    greater: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
  })),
  array: jest.fn(() => ({
    items: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    required: jest.fn().mockReturnThis(),
  })),
  ref: jest.fn(),
}));

describe('CFTCComplianceService - US and Singapore Region Tests', () => {
  let complianceService;

  beforeEach(() => {
    jest.clearAllMocks();
    complianceService = new CFTCComplianceService();
  });

  afterEach(() => {
    if (complianceService) {
      complianceService.removeAllListeners();
    }
  });

  describe('Initialization', () => {
    test('should initialize with correct US and Singapore configurations', () => {
      expect(complianceService.cftcConfig.baseUrl).toContain('cftc.gov');
      expect(complianceService.masConfig.baseUrl).toContain('mas.gov.sg');
      expect(complianceService.retryConfig.maxAttempts).toBe(3);
      expect(complianceService.auditLog).toEqual([]);
    });

    test('should set up retry configuration correctly', () => {
      expect(complianceService.retryConfig).toEqual({
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
      });
    });
  });

  describe('CFTC Form 102 Submission - US Region', () => {
    const validCFTCData = {
      reportingEntity: {
        name: 'QuantEnergx Trading LLC',
        cftcId: 'CFTC123456',
        address: '123 Wall Street, New York, NY 10005, USA',
        contactPerson: 'John Smith',
        contactEmail: 'john.smith@quantenergx.com',
        contactPhone: '+1234567890',
      },
      reportingPeriod: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      },
      positions: [
        {
          commodity: 'crude_oil',
          contractMonth: 'MAR24',
          longQuantity: 1000,
          shortQuantity: 500,
          netQuantity: 500,
          notionalValue: 50000000,
        },
        {
          commodity: 'natural_gas',
          contractMonth: 'APR24',
          longQuantity: 2000,
          shortQuantity: 1000,
          netQuantity: 1000,
          notionalValue: 75000000,
        },
      ],
      aggregateData: {
        totalLongPositions: 3000,
        totalShortPositions: 1500,
        totalNotionalValue: 125000000,
      },
    };

    test('should submit CFTC Form 102 successfully', async () => {
      const mockApiResponse = {
        data: {
          status: 'accepted',
          confirmationNumber: 'CFTC-2024-001234',
        },
      };

      axios.post.mockResolvedValueOnce(mockApiResponse);

      const result = await complianceService.submitCFTCForm102(validCFTCData, 'user123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('accepted');
      expect(result.data.confirmationNumber).toBe('CFTC-2024-001234');
      expect(result.data.submissionId).toBeDefined();
      expect(result.data.responseTime).toBeGreaterThan(0);

      // Verify API call
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/form-102/submit'),
        expect.objectContaining({
          formData: validCFTCData,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('should handle CFTC submission validation errors', async () => {
      const invalidCFTCData = {
        ...validCFTCData,
        aggregateData: {
          totalLongPositions: 999, // Incorrect calculation
          totalShortPositions: 1500,
          totalNotionalValue: 125000000,
        },
      };

      const result = await complianceService.submitCFTCForm102(invalidCFTCData, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Form validation failed');
      expect(result.data.status).toBe('rejected');
      expect(result.data.errors).toContain('Total long positions calculation mismatch');
    });

    test('should retry CFTC submission on API failures', async () => {
      // First two calls fail, third succeeds
      axios.post
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
        .mockResolvedValueOnce({
          data: {
            status: 'submitted',
            confirmationNumber: 'CFTC-2024-001235',
          },
        });

      const result = await complianceService.submitCFTCForm102(validCFTCData, 'user123');

      expect(result.success).toBe(true);
      expect(result.data.confirmationNumber).toBe('CFTC-2024-001235');
      expect(axios.post).toHaveBeenCalledTimes(3); // Confirms retry behavior
    });

    test('should log all CFTC submission attempts in audit trail', async () => {
      axios.post.mockResolvedValueOnce({
        data: { status: 'submitted', confirmationNumber: 'CFTC-TEST-001' },
      });

      await complianceService.submitCFTCForm102(validCFTCData, 'user123');

      const auditLog = complianceService.getAuditLog();
      expect(auditLog.success).toBe(true);
      expect(auditLog.data.length).toBeGreaterThan(0);

      const submissionStartLog = auditLog.data.find(entry => 
        entry.action === 'cftc_form_102_submission_started'
      );
      const submissionCompletedLog = auditLog.data.find(entry => 
        entry.action === 'cftc_form_102_submission_completed'
      );

      expect(submissionStartLog).toBeDefined();
      expect(submissionStartLog.userId).toBe('user123');
      expect(submissionStartLog.region).toBe('US');
      
      expect(submissionCompletedLog).toBeDefined();
      expect(submissionCompletedLog.details.confirmationNumber).toBe('CFTC-TEST-001');
    });
  });

  describe('MAS 610A Submission - Singapore Region', () => {
    const validMASData = {
      institutionDetails: {
        name: 'QuantEnergx Asia Pte Ltd',
        masLicenseNumber: 'AB123456',
        reportingDate: new Date('2024-01-31'),
        contactOfficer: 'Jane Doe',
        contactEmail: 'jane.doe@quantenergx.sg',
      },
      commodityDerivatives: [
        {
          productType: 'swap',
          underlyingCommodity: 'crude_oil',
          notionalAmount: 10000000,
          currency: 'USD',
          maturityDate: new Date('2024-06-30'),
          counterpartyType: 'bank',
          riskMetrics: {
            deltaEquivalent: 500000,
            vegaEquivalent: 25000,
            dv01: 1000,
          },
        },
        {
          productType: 'future',
          underlyingCommodity: 'natural_gas',
          notionalAmount: 5000000,
          currency: 'SGD',
          maturityDate: new Date('2024-03-31'),
          counterpartyType: 'corporate',
          riskMetrics: {
            deltaEquivalent: 250000,
          },
        },
      ],
      riskSummary: {
        totalNotional: 15000000,
        netDeltaEquivalent: 750000,
        varEstimate: 150000,
      },
    };

    test('should submit MAS 610A report successfully', async () => {
      const mockApiResponse = {
        data: {
          status: 'acknowledged',
          acknowledgmentNumber: 'MAS-2024-610A-001',
        },
      };

      axios.post.mockResolvedValueOnce(mockApiResponse);

      const result = await complianceService.submitMAS610A(validMASData, 'user456');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('acknowledged');
      expect(result.data.acknowledgmentNumber).toBe('MAS-2024-610A-001');
      expect(result.data.submissionId).toBeDefined();
      expect(result.data.responseTime).toBeGreaterThan(0);

      // Verify API call
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/610a/submit'),
        expect.objectContaining({
          institutionData: validMASData,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Institution-License': 'AB123456',
          }),
        })
      );
    });

    test('should handle MAS validation errors', async () => {
      const invalidMASData = {
        ...validMASData,
        riskSummary: {
          totalNotional: 999999, // Incorrect calculation
          netDeltaEquivalent: 750000,
          varEstimate: 150000,
        },
      };

      const result = await complianceService.submitMAS610A(invalidMASData, 'user456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Form validation failed');
      expect(result.data.status).toBe('rejected');
      expect(result.data.validationErrors).toContain('Total notional amount calculation mismatch');
    });

    test('should retry MAS submission with exponential backoff', async () => {
      // All calls fail to test max retry behavior
      axios.post.mockRejectedValue(new Error('MAS API unavailable'));

      const result = await complianceService.submitMAS610A(validMASData, 'user456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('All retry attempts failed');
      expect(axios.post).toHaveBeenCalledTimes(3); // maxAttempts
    });

    test('should log MAS submission attempts in audit trail', async () => {
      axios.post.mockResolvedValueOnce({
        data: { status: 'processing', acknowledgmentNumber: 'MAS-TEST-001' },
      });

      await complianceService.submitMAS610A(validMASData, 'user456');

      const auditLog = complianceService.getAuditLog({ region: 'Singapore' });
      expect(auditLog.success).toBe(true);
      expect(auditLog.data.length).toBeGreaterThan(0);

      const submissionStartLog = auditLog.data.find(entry => 
        entry.action === 'mas_610a_submission_started'
      );
      const submissionCompletedLog = auditLog.data.find(entry => 
        entry.action === 'mas_610a_submission_completed'
      );

      expect(submissionStartLog).toBeDefined();
      expect(submissionStartLog.userId).toBe('user456');
      expect(submissionStartLog.region).toBe('Singapore');
      
      expect(submissionCompletedLog).toBeDefined();
      expect(submissionCompletedLog.details.acknowledgmentNumber).toBe('MAS-TEST-001');
    });
  });

  describe('Schema Validation', () => {
    test('should validate CFTC form structure correctly', () => {
      const invalidData = {
        reportingEntity: {
          name: '', // Empty name
          cftcId: 'INVALID', // Invalid format
        },
        // Missing required fields
      };

      const result = complianceService.validateCFTCForm102(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate MAS form structure correctly', () => {
      const invalidData = {
        institutionDetails: {
          name: 'Test Corp',
          masLicenseNumber: 'INVALID123', // Invalid format
        },
        // Missing required fields
      };

      const result = complianceService.validateMAS610A(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should perform business logic validation for CFTC', () => {
      const dataWithCalculationErrors = {
        reportingEntity: {
          name: 'Test Corp',
          cftcId: 'ABCD123456',
          address: '123 Test St, City, State 12345',
          contactPerson: 'Test Person',
          contactEmail: 'test@test.com',
          contactPhone: '+1234567890',
        },
        reportingPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        positions: [
          {
            commodity: 'crude_oil',
            contractMonth: 'MAR24',
            longQuantity: 1000,
            shortQuantity: 500,
            netQuantity: 500,
            notionalValue: 50000000,
          },
        ],
        aggregateData: {
          totalLongPositions: 999, // Incorrect calculation
          totalShortPositions: 500,
          totalNotionalValue: 50000000,
        },
      };

      const result = complianceService.validateCFTCForm102(dataWithCalculationErrors);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total long positions calculation mismatch');
    });
  });

  describe('Audit Logging', () => {
    test('should create audit log entries with correct structure', async () => {
      axios.post.mockResolvedValueOnce({
        data: { status: 'submitted', confirmationNumber: 'TEST-001' },
      });

      const validCFTCData = {
        reportingEntity: {
          name: 'Test Corp',
          cftcId: 'TEST123456',
          address: 'Test Address',
          contactPerson: 'Test Person',
          contactEmail: 'test@test.com',
          contactPhone: '+1234567890',
        },
        reportingPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        positions: [{
          commodity: 'crude_oil',
          contractMonth: 'MAR24',
          longQuantity: 1000,
          shortQuantity: 500,
          netQuantity: 500,
          notionalValue: 50000000,
        }],
        aggregateData: {
          totalLongPositions: 1000,
          totalShortPositions: 500,
          totalNotionalValue: 50000000,
        },
      };

      await complianceService.submitCFTCForm102(validCFTCData, 'testuser');

      const auditLog = complianceService.getAuditLog();
      const logEntry = auditLog.data[0];

      expect(logEntry.id).toBeDefined();
      expect(logEntry.timestamp).toBeInstanceOf(Date);
      expect(logEntry.userId).toBe('testuser');
      expect(logEntry.action).toBeDefined();
      expect(logEntry.details).toBeDefined();
      expect(logEntry.region).toMatch(/US|Singapore/);
    });

    test('should filter audit logs by criteria', async () => {
      // Create some test log entries
      complianceService.logAction('test_action_us', { test: 'data' }, 'user1');
      complianceService.logAction('test_action_sg', { test: 'data2' }, 'user2');

      // Filter by user
      const userFilter = complianceService.getAuditLog({ userId: 'user1' });
      expect(userFilter.data.length).toBe(1);
      expect(userFilter.data[0].userId).toBe('user1');

      // Filter by action
      const actionFilter = complianceService.getAuditLog({ action: 'us' });
      expect(actionFilter.data.length).toBe(1);
      expect(actionFilter.data[0].action).toContain('us');
    });

    test('should emit audit log events', (done) => {
      complianceService.on('audit_log', (logEntry) => {
        expect(logEntry.action).toBe('test_audit_event');
        expect(logEntry.userId).toBe('testuser');
        done();
      });

      complianceService.logAction('test_audit_event', { test: 'data' }, 'testuser');
    });
  });

  describe('Submission Status Tracking', () => {
    test('should get CFTC submission status', async () => {
      const mockStatusResponse = {
        data: {
          submissionId: 'test-123',
          status: 'processing',
          lastUpdated: new Date().toISOString(),
        },
      };

      axios.get.mockResolvedValueOnce(mockStatusResponse);

      const result = await complianceService.getSubmissionStatus('test-123', 'cftc');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('processing');
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/form-102/status/test-123'),
        expect.any(Object)
      );
    });

    test('should get MAS submission status', async () => {
      const mockStatusResponse = {
        data: {
          submissionId: 'mas-456',
          status: 'acknowledged',
          lastUpdated: new Date().toISOString(),
        },
      };

      axios.get.mockResolvedValueOnce(mockStatusResponse);

      const result = await complianceService.getSubmissionStatus('mas-456', 'mas');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('acknowledged');
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/610a/status/mas-456'),
        expect.any(Object)
      );
    });

    test('should handle status retrieval errors', async () => {
      axios.get.mockRejectedValueOnce(new Error('Status service unavailable'));

      const result = await complianceService.getSubmissionStatus('test-123', 'cftc');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Status service unavailable');
    });
  });

  describe('Health Status and Monitoring', () => {
    test('should return service health status', () => {
      const health = complianceService.getHealthStatus();

      expect(health.success).toBe(true);
      expect(health.data.status).toBe('healthy');
      expect(health.data.auditLogSize).toBe(0);
      expect(health.data.lastActivity).toBeNull();
      expect(health.data.services.cftc).toBeDefined();
      expect(health.data.services.mas).toBeDefined();
    });

    test('should update health status based on activity', async () => {
      axios.post.mockResolvedValueOnce({
        data: { status: 'submitted' },
      });

      const validCFTCData = {
        reportingEntity: {
          name: 'Test Corp',
          cftcId: 'TEST123456',
          address: 'Test Address',
          contactPerson: 'Test Person',
          contactEmail: 'test@test.com',
          contactPhone: '+1234567890',
        },
        reportingPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        positions: [{
          commodity: 'crude_oil',
          contractMonth: 'MAR24',
          longQuantity: 1000,
          shortQuantity: 500,
          netQuantity: 500,
          notionalValue: 50000000,
        }],
        aggregateData: {
          totalLongPositions: 1000,
          totalShortPositions: 500,
          totalNotionalValue: 50000000,
        },
      };

      await complianceService.submitCFTCForm102(validCFTCData, 'user123');

      const health = complianceService.getHealthStatus();
      expect(health.data.auditLogSize).toBeGreaterThan(0);
      expect(health.data.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe('Response Time Tracking', () => {
    test('should track CFTC submission response time', async () => {
      // Add delay to simulate API response time
      axios.post.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: { status: 'submitted', confirmationNumber: 'TEST-001' }
          }), 100)
        )
      );

      const validCFTCData = {
        reportingEntity: {
          name: 'Test Corp',
          cftcId: 'TEST123456',
          address: 'Test Address',
          contactPerson: 'Test Person',
          contactEmail: 'test@test.com',
          contactPhone: '+1234567890',
        },
        reportingPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        positions: [{
          commodity: 'crude_oil',
          contractMonth: 'MAR24',
          longQuantity: 1000,
          shortQuantity: 500,
          netQuantity: 500,
          notionalValue: 50000000,
        }],
        aggregateData: {
          totalLongPositions: 1000,
          totalShortPositions: 500,
          totalNotionalValue: 50000000,
        },
      };

      const result = await complianceService.submitCFTCForm102(validCFTCData, 'user123');

      expect(result.success).toBe(true);
      expect(result.data.responseTime).toBeGreaterThan(90); // Should be at least 100ms
    });

    test('should track MAS submission response time', async () => {
      axios.post.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: { status: 'acknowledged', acknowledgmentNumber: 'MAS-TEST-001' }
          }), 50)
        )
      );

      const validMASData = {
        institutionDetails: {
          name: 'Test Corp',
          masLicenseNumber: 'AB123456',
          reportingDate: new Date('2024-01-31'),
          contactOfficer: 'Test Officer',
          contactEmail: 'test@test.com',
        },
        commodityDerivatives: [{
          productType: 'swap',
          underlyingCommodity: 'crude_oil',
          notionalAmount: 10000000,
          currency: 'USD',
          maturityDate: new Date('2024-06-30'),
          counterpartyType: 'bank',
          riskMetrics: {
            deltaEquivalent: 500000,
          },
        }],
        riskSummary: {
          totalNotional: 10000000,
          netDeltaEquivalent: 500000,
          varEstimate: 100000,
        },
      };

      const result = await complianceService.submitMAS610A(validMASData, 'user456');

      expect(result.success).toBe(true);
      expect(result.data.responseTime).toBeGreaterThan(40); // Should be at least 50ms
    });
  });

  describe('Admin Functions', () => {
    test('should clear audit log with valid admin token', () => {
      // Add some test entries
      complianceService.logAction('test_action', { test: 'data' }, 'user1');
      complianceService.logAction('test_action2', { test: 'data2' }, 'user2');

      expect(complianceService.auditLog.length).toBe(2);

      // Mock environment variable
      process.env.ADMIN_TOKEN = 'valid-admin-token';

      const result = complianceService.clearAuditLog('admin', 'valid-admin-token');

      expect(result.success).toBe(true);
      expect(result.data.cleared).toBe(2);
      expect(complianceService.auditLog.length).toBe(1); // One new entry for the clear action
    });

    test('should reject audit log clear with invalid token', () => {
      complianceService.logAction('test_action', { test: 'data' }, 'user1');

      const result = complianceService.clearAuditLog('admin', 'invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
      expect(complianceService.auditLog.length).toBe(1); // Should remain unchanged
    });
  });
});