const SettlementService = require('../../src/services/settlementService');
const RegionConfigService = require('../../src/services/regionConfigService');

describe('SettlementService', () => {
  let settlementService;
  let regionConfigService;

  beforeEach(() => {
    regionConfigService = new RegionConfigService();
    settlementService = new SettlementService(regionConfigService);
  });

  afterEach(() => {
    settlementService.stopSettlementMonitoring();
    settlementService.removeAllListeners();
  });

  describe('Service Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(settlementService).toBeDefined();
      expect(settlementService.config).toBeDefined();
      expect(settlementService.config.supportedSettlementTypes).toContain('cash');
      expect(settlementService.config.supportedSettlementTypes).toContain('physical');
      expect(settlementService.config.supportedSettlementTypes).toContain('net_cash');
      expect(settlementService.processors).toBeDefined();
    });

    test('should have processors for all settlement types', () => {
      expect(settlementService.processors.cash).toBeDefined();
      expect(settlementService.processors.physical).toBeDefined();
      expect(settlementService.processors.net_cash).toBeDefined();
    });
  });

  describe('Settlement Instruction Creation', () => {
    test('should create a valid cash settlement instruction', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 100000,
        currency: 'USD',
        region: 'US'
      };

      const instruction = await settlementService.createSettlementInstruction(params);

      expect(instruction).toBeDefined();
      expect(instruction.id).toBeDefined();
      expect(instruction.contractId).toBe(params.contractId);
      expect(instruction.userId).toBe(params.userId);
      expect(instruction.settlementType).toBe('cash');
      expect(instruction.amount).toBe(100000);
      expect(instruction.currency).toBe('USD');
      expect(instruction.region).toBe('US');
      expect(instruction.status).toBe('pending');
      expect(instruction.settlementDate).toBeDefined();
      expect(instruction.cashflowDetails).toBeDefined();
    });

    test('should create a physical settlement instruction', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174001',
        userId: 'test-user-id',
        settlementType: 'physical',
        amount: 1000000,
        currency: 'USD',
        region: 'US',
        deliveryInstructions: {
          location: 'Houston Terminal',
          recipient: 'Test Company'
        }
      };

      const instruction = await settlementService.createSettlementInstruction(params);

      expect(instruction.settlementType).toBe('physical');
      expect(instruction.deliveryInstructions).toEqual(params.deliveryInstructions);
      expect(instruction.cashflowDetails).toBeNull();
    });

    test('should create a net cash settlement instruction', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174002',
        userId: 'test-user-id',
        settlementType: 'net_cash',
        amount: 250000,
        currency: 'EUR',
        region: 'EU'
      };

      const instruction = await settlementService.createSettlementInstruction(params);

      expect(instruction.settlementType).toBe('net_cash');
      expect(instruction.currency).toBe('EUR');
      expect(instruction.region).toBe('EU');
    });

    test('should emit settlement instruction created event', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174003',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 50000,
        region: 'US'
      };

      const eventPromise = new Promise((resolve) => {
        settlementService.once('settlementInstructionCreated', resolve);
      });

      await settlementService.createSettlementInstruction(params);
      const event = await eventPromise;

      expect(event.settlementType).toBe('cash');
      expect(event.amount).toBe(50000);
      expect(event.region).toBe('US');
    });

    test('should auto-settle when enabled and below threshold', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174004',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 500000, // Below auto-settlement threshold
        region: 'US',
        autoSettle: true
      };

      // Mock executeSettlement to avoid actual execution
      jest.spyOn(settlementService, 'executeSettlement').mockResolvedValue({});

      await settlementService.createSettlementInstruction(params);

      expect(settlementService.executeSettlement).toHaveBeenCalled();
    });
  });

  describe('Settlement Workflow Creation', () => {
    test('should create workflow for cash settlement', async () => {
      const instruction = {
        id: 'settlement-1',
        settlementType: 'cash',
        region: 'US'
      };

      const settlementRules = await regionConfigService.getSettlementRules('US');
      const workflow = await settlementService.createSettlementWorkflow(instruction, settlementRules);

      expect(workflow).toBeDefined();
      expect(workflow.id).toBeDefined();
      expect(workflow.settlementId).toBe('settlement-1');
      expect(workflow.steps).toBeDefined();
      expect(workflow.steps.length).toBeGreaterThan(0);
      expect(workflow.status).toBe('pending');
      expect(workflow.currentStep).toBe(0);

      // Check for expected cash settlement steps
      const stepNames = workflow.steps.map(step => step.name);
      expect(stepNames).toContain('validation');
      expect(stepNames).toContain('authorization');
      expect(stepNames).toContain('payment_processing');
      expect(stepNames).toContain('settlement_completion');
    });

    test('should create workflow for physical settlement', async () => {
      const instruction = {
        id: 'settlement-2',
        settlementType: 'physical',
        region: 'US'
      };

      const settlementRules = await regionConfigService.getSettlementRules('US');
      const workflow = await settlementService.createSettlementWorkflow(instruction, settlementRules);

      const stepNames = workflow.steps.map(step => step.name);
      expect(stepNames).toContain('delivery_scheduling');
      expect(stepNames).toContain('quality_inspection');
      expect(stepNames).toContain('delivery_confirmation');
    });

    test('should include netting step for net cash settlement when enabled', async () => {
      const instruction = {
        id: 'settlement-3',
        settlementType: 'net_cash',
        region: 'US'
      };

      const settlementRules = await regionConfigService.getSettlementRules('US');
      const workflow = await settlementService.createSettlementWorkflow(instruction, settlementRules);

      const stepNames = workflow.steps.map(step => step.name);
      expect(stepNames).toContain('netting');
    });
  });

  describe('Settlement Execution', () => {
    test('should execute settlement workflow successfully', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174005',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 75000,
        currency: 'USD',
        region: 'US'
      };

      const instruction = await settlementService.createSettlementInstruction(params);

      const completedEventPromise = new Promise((resolve) => {
        settlementService.once('settlementCompleted', resolve);
      });

      await settlementService.executeSettlement(instruction.id);
      const completedEvent = await completedEventPromise;

      expect(completedEvent.settlementId).toBe(instruction.id);

      // Check final instruction status
      const finalInstruction = await settlementService.getSettlementInstruction(instruction.id);
      expect(finalInstruction.status).toBe('settled');
      expect(finalInstruction.settledAt).toBeDefined();
    });

    test('should handle settlement execution failure', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174006',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 75000,
        currency: 'USD',
        region: 'US'
      };

      const instruction = await settlementService.createSettlementInstruction(params);

      // Mock validation to throw error
      jest.spyOn(settlementService, 'validateSettlement').mockRejectedValue(new Error('Validation failed'));

      const failedEventPromise = new Promise((resolve) => {
        settlementService.once('settlementFailed', resolve);
      });

      await expect(settlementService.executeSettlement(instruction.id))
        .rejects.toThrow('Validation failed');

      const failedEvent = await failedEventPromise;
      expect(failedEvent.settlementId).toBe(instruction.id);

      // Check instruction status
      const finalInstruction = await settlementService.getSettlementInstruction(instruction.id);
      expect(finalInstruction.status).toBe('failed');
      expect(finalInstruction.errorMessage).toBeDefined();
    });
  });

  describe('Settlement Workflow Steps', () => {
    test('should validate settlement instruction', async () => {
      const instruction = {
        settlementDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        amount: 50000,
        region: 'US'
      };

      const result = await settlementService.validateSettlement(instruction);
      expect(result).toBe(true);
    });

    test('should reject settlement with past date', async () => {
      const instruction = {
        settlementDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        amount: 50000,
        region: 'US'
      };

      await expect(settlementService.validateSettlement(instruction))
        .rejects.toThrow('Settlement date cannot be in the past');
    });

    test('should reject settlement with excessive amount', async () => {
      const instruction = {
        settlementDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        amount: 2000000000, // $2B, above max
        region: 'US'
      };

      await expect(settlementService.validateSettlement(instruction))
        .rejects.toThrow('Settlement amount exceeds maximum');
    });

    test('should process cash settlement', async () => {
      const instruction = {
        settlementType: 'cash',
        amount: 100000,
        currency: 'USD',
        cashflowDetails: {
          clearingHouse: 'test_clearing'
        }
      };

      const result = await settlementService.processCashSettlement(instruction);

      expect(result.status).toBe('completed');
      expect(result.paymentReference).toBeDefined();
      expect(result.processedAt).toBeDefined();
      expect(instruction.paymentReference).toBeDefined();
    });

    test('should process physical settlement', async () => {
      const instruction = {
        settlementType: 'physical',
        amount: 500000,
        deliveryInstructions: {
          location: 'Houston Terminal'
        }
      };

      const result = await settlementService.processPhysicalSettlement(instruction);

      expect(result.status).toBe('completed');
      expect(result.deliveryReference).toBeDefined();
      expect(instruction.deliveryReference).toBeDefined();
    });

    test('should process netting for net cash settlement', async () => {
      const instruction = {
        userId: 'test-user-id',
        region: 'US',
        settlementType: 'net_cash',
        amount: 100000,
        side: 'buy'
      };

      // Add the instruction to the service
      settlementService.settlementInstructions.set('test-1', instruction);

      // Add another settlement for netting
      const otherInstruction = {
        userId: 'test-user-id',
        region: 'US',
        settlementType: 'net_cash',
        amount: 60000,
        side: 'sell',
        status: 'processing'
      };
      settlementService.settlementInstructions.set('test-2', otherInstruction);

      const netAmount = await settlementService.processNetting(instruction);

      expect(instruction.netAmount).toBeDefined();
      expect(instruction.originalAmount).toBe(100000);
    });

    test('should schedule delivery for physical settlement', async () => {
      const instruction = {
        settlementDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        deliveryInstructions: {
          location: 'Chicago Terminal'
        }
      };

      const result = await settlementService.scheduleDelivery(instruction);

      expect(result.scheduledDate).toBeDefined();
      expect(result.location).toBe('Chicago Terminal');
      expect(result.carrier).toBeDefined();
      expect(instruction.deliverySchedule).toBeDefined();
    });

    test('should perform quality inspection', async () => {
      const instruction = {};

      const result = await settlementService.performQualityInspection(instruction);

      expect(result.inspectionId).toBeDefined();
      expect(result.passed).toBe(true);
      expect(result.grade).toBe('A');
      expect(instruction.qualityReport).toBeDefined();
    });

    test('should confirm delivery', async () => {
      const instruction = {
        deliveryInstructions: {
          recipient: 'Test Recipient'
        }
      };

      const result = await settlementService.confirmDelivery(instruction);

      expect(result.confirmationId).toBeDefined();
      expect(result.deliveredAt).toBeDefined();
      expect(result.receivedBy).toBe('Test Recipient');
      expect(instruction.deliveryConfirmation).toBeDefined();
    });
  });

  describe('Settlement Cancellation', () => {
    test('should cancel pending settlement', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174007',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 25000,
        currency: 'USD',
        region: 'US'
      };

      const instruction = await settlementService.createSettlementInstruction(params);

      const cancelledEventPromise = new Promise((resolve) => {
        settlementService.once('settlementCancelled', resolve);
      });

      const cancelledInstruction = await settlementService.cancelSettlement(
        instruction.id,
        'user_request'
      );
      const cancelledEvent = await cancelledEventPromise;

      expect(cancelledInstruction.status).toBe('cancelled');
      expect(cancelledInstruction.cancellationReason).toBe('user_request');
      expect(cancelledInstruction.cancelledAt).toBeDefined();
      expect(cancelledEvent.settlementId).toBe(instruction.id);
    });

    test('should not cancel non-pending settlement', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174008',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 25000,
        currency: 'USD',
        region: 'US'
      };

      const instruction = await settlementService.createSettlementInstruction(params);
      
      // Change status to processing
      instruction.status = 'processing';

      await expect(settlementService.cancelSettlement(instruction.id))
        .rejects.toThrow('Cannot cancel settlement in status: processing');
    });
  });

  describe('Settlement Monitoring', () => {
    test('should process scheduled settlements', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174009',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 10000,
        currency: 'USD',
        settlementDate: new Date(Date.now() - 3600000), // 1 hour ago
        region: 'US',
        autoSettle: true
      };

      const instruction = await settlementService.createSettlementInstruction(params);
      
      // Mock executeSettlement
      jest.spyOn(settlementService, 'executeSettlement').mockResolvedValue({});

      await settlementService.processScheduledSettlements();

      expect(settlementService.executeSettlement).toHaveBeenCalledWith(instruction.id);
    });

    test('should identify overdue settlements', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174010',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 10000,
        currency: 'USD',
        region: 'US'
      };

      const instruction = await settlementService.createSettlementInstruction(params);
      
      // Set to processing and make it overdue
      instruction.status = 'processing';
      instruction.updatedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

      const overdueEventPromise = new Promise((resolve) => {
        settlementService.once('settlementOverdue', resolve);
      });

      await settlementService.checkOverdueSettlements();
      const overdueEvent = await overdueEventPromise;

      expect(overdueEvent.settlementId).toBe(instruction.id);
      expect(overdueEvent.overdueHours).toBeGreaterThan(24);
    });
  });

  describe('Settlement Queries', () => {
    test('should get user settlements with filters', async () => {
      const userId = 'test-user-id';

      // Create test settlements
      const params1 = {
        contractId: '123e4567-e89b-12d3-a456-426614174011',
        userId,
        settlementType: 'cash',
        amount: 10000,
        currency: 'USD', // Add missing currency
        region: 'US'
      };

      const params2 = {
        contractId: '123e4567-e89b-12d3-a456-426614174012',
        userId,
        settlementType: 'physical',
        amount: 50000,
        currency: 'EUR', // Add missing currency
        region: 'EU'
      };

      await settlementService.createSettlementInstruction(params1);
      await settlementService.createSettlementInstruction(params2);

      const usSettlements = await settlementService.getUserSettlements(userId, 'US');
      const euSettlements = await settlementService.getUserSettlements(userId, 'EU');
      const allSettlements = await settlementService.getUserSettlements(userId);

      expect(usSettlements.length).toBeGreaterThanOrEqual(1);
      expect(euSettlements.length).toBeGreaterThanOrEqual(1);
      expect(allSettlements.length).toBeGreaterThanOrEqual(2);
    });

    test('should get settlements by status', async () => {
      const params = {
        contractId: '123e4567-e89b-12d3-a456-426614174013',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 15000,
        currency: 'USD', // Add missing currency
        region: 'US'
      };

      const instruction = await settlementService.createSettlementInstruction(params);

      const pendingSettlements = await settlementService.getSettlementsByStatus('pending', 'US');

      expect(pendingSettlements.length).toBeGreaterThanOrEqual(1);
      expect(pendingSettlements.some(s => s.id === instruction.id)).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    test('should calculate settlement date correctly', () => {
      const settlementDate = settlementService.calculateSettlementDate(2); // T+2

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 2);

      expect(settlementDate.toDateString()).toBe(
        settlementService.getNextBusinessDay(expectedDate).toDateString()
      );
    });

    test('should skip weekends in business day calculation', () => {
      const friday = new Date('2023-12-01'); // Assuming this is a Friday
      const nextBusinessDay = settlementService.getNextBusinessDay(friday);

      expect(nextBusinessDay.getDay()).not.toBe(0); // Not Sunday
      expect(nextBusinessDay.getDay()).not.toBe(6); // Not Saturday
    });

    test('should check cutoff times correctly', () => {
      const currentTime = new Date();
      currentTime.setHours(16, 30); // 4:30 PM

      const isPastCutoff = settlementService.isPastCutoff(currentTime, '15:00');
      const isBeforeCutoff = settlementService.isPastCutoff(currentTime, '18:00');

      expect(isPastCutoff).toBe(true);
      expect(isBeforeCutoff).toBe(false);
    });
  });

  describe('Parameter Validation', () => {
    test('should validate settlement parameters', async () => {
      const validParams = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 10000,
        currency: 'USD'
      };

      await expect(settlementService.validateSettlementParams(validParams))
        .resolves.not.toThrow();
    });

    test('should reject invalid settlement type', async () => {
      const invalidParams = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'test-user-id',
        settlementType: 'invalid_type',
        amount: 10000,
        currency: 'USD'
      };

      await expect(settlementService.validateSettlementParams(invalidParams))
        .rejects.toThrow('Unsupported settlement type: invalid_type');
    });

    test('should reject invalid currency', async () => {
      const invalidParams = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: 10000,
        currency: 'INVALID'
      };

      await expect(settlementService.validateSettlementParams(invalidParams))
        .rejects.toThrow('Unsupported currency: INVALID');
    });

    test('should reject negative amount', async () => {
      const invalidParams = {
        contractId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'test-user-id',
        settlementType: 'cash',
        amount: -1000,
        currency: 'USD'
      };

      await expect(settlementService.validateSettlementParams(invalidParams))
        .rejects.toThrow('Settlement amount must be positive');
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent settlement instruction', async () => {
      const instruction = await settlementService.getSettlementInstruction('non-existent-id');
      expect(instruction).toBeUndefined();
    });

    test('should handle execution of non-existent settlement', async () => {
      await expect(settlementService.executeSettlement('non-existent-id'))
        .rejects.toThrow('Settlement instruction not found: non-existent-id');
    });

    test('should handle workflow retrieval for non-existent settlement', async () => {
      const workflow = await settlementService.getSettlementWorkflow('non-existent-id');
      expect(workflow).toBeUndefined();
    });
  });
});