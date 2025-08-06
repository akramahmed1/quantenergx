const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class SettlementService extends EventEmitter {
  constructor(regionConfigService) {
    super();

    this.regionConfigService = regionConfigService;

    // In-memory storage for demo (would use database in production)
    this.settlementInstructions = new Map();
    this.settlementWorkflows = new Map();
    this.settlementHistory = new Map();

    // Settlement configuration
    this.config = {
      supportedSettlementTypes: ['physical', 'cash', 'net_cash'],
      defaultSettlementPeriod: 2, // T+2 days
      maxSettlementAmount: 1000000000, // $1B
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD'],
      autoSettlementThreshold: 1000000, // $1M
    };

    // Settlement processors
    this.processors = {
      cash: this.processCashSettlement.bind(this),
      physical: this.processPhysicalSettlement.bind(this),
      net_cash: this.processNetCashSettlement.bind(this),
    };

    // Start settlement monitoring
    this.startSettlementMonitoring();
  }

  async createSettlementInstruction(params) {
    try {
      const {
        contractId,
        userId,
        settlementType = 'cash',
        amount,
        currency = 'USD',
        settlementDate,
        region = 'US',
        deliveryInstructions = null,
        autoSettle = false,
      } = params;

      // Validate parameters
      await this.validateSettlementParams(params);

      // Get region-specific settlement rules
      const regionConfig = await this.regionConfigService.getRegionConfig(region);
      const settlementRules = regionConfig?.settlementRules || this.getDefaultSettlementRules();

      // Check if settlement type is supported in region
      if (!settlementRules.supportedSettlementMethods.includes(settlementType)) {
        throw new Error(`Settlement type ${settlementType} not supported in region ${region}`);
      }

      const settlementId = uuidv4();
      const finalSettlementDate = settlementDate
        ? new Date(settlementDate)
        : this.calculateSettlementDate(settlementRules.standardSettlementPeriod);

      const instruction = {
        id: settlementId,
        contractId,
        userId,
        settlementType,
        amount,
        currency,
        settlementDate: finalSettlementDate,
        status: 'pending',
        region,
        deliveryInstructions,
        autoSettle,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add region-specific cash flow details
      if (settlementType === 'cash' || settlementType === 'net_cash') {
        instruction.cashflowDetails = {
          paymentMethod: 'wire_transfer',
          clearingHouse: regionConfig?.clearingHouse || 'default',
          cutoffTime: settlementRules.cutoffTimes.settlement_cutoff || '17:00',
        };
      }

      this.settlementInstructions.set(settlementId, instruction);

      // Create settlement workflow
      const workflow = await this.createSettlementWorkflow(instruction, settlementRules);

      // Auto-settle if enabled and amount is below threshold
      if (autoSettle && amount <= settlementRules.autoSettlementThreshold) {
        await this.executeSettlement(settlementId);
      }

      this.emit('settlementInstructionCreated', {
        settlementId,
        contractId,
        userId,
        region,
        settlementType,
        amount,
      });

      return instruction;
    } catch (error) {
      throw new Error(`Failed to create settlement instruction: ${error.message}`);
    }
  }

  async createSettlementWorkflow(instruction, settlementRules) {
    const workflowId = uuidv4();
    const steps = this.generateWorkflowSteps(instruction, settlementRules);

    const workflow = {
      id: workflowId,
      settlementId: instruction.id,
      steps,
      currentStep: 0,
      status: 'pending',
      region: instruction.region,
      createdAt: new Date(),
    };

    this.settlementWorkflows.set(workflowId, workflow);
    return workflow;
  }

  generateWorkflowSteps(instruction, settlementRules) {
    const baseSteps = [
      {
        stepNumber: 1,
        name: 'validation',
        status: 'pending',
        description: 'Validate settlement instruction and check compliance',
        processor: 'validation_engine',
      },
      {
        stepNumber: 2,
        name: 'authorization',
        status: 'pending',
        description: 'Authorize settlement with required approvals',
        processor: 'authorization_engine',
      },
    ];

    // Add settlement-type specific steps
    if (instruction.settlementType === 'physical') {
      baseSteps.push(
        {
          stepNumber: 3,
          name: 'delivery_scheduling',
          status: 'pending',
          description: 'Schedule physical delivery and logistics',
          processor: 'logistics_engine',
        },
        {
          stepNumber: 4,
          name: 'quality_inspection',
          status: 'pending',
          description: 'Quality inspection and certificate issuance',
          processor: 'inspection_engine',
        },
        {
          stepNumber: 5,
          name: 'delivery_confirmation',
          status: 'pending',
          description: 'Confirm physical delivery completion',
          processor: 'delivery_engine',
        }
      );
    } else {
      baseSteps.push({
        stepNumber: 3,
        name: 'payment_processing',
        status: 'pending',
        description: 'Process cash settlement payment',
        processor: 'payment_engine',
      });
    }

    // Add netting step if enabled
    if (settlementRules.nettingEnabled && instruction.settlementType === 'net_cash') {
      baseSteps.splice(-1, 0, {
        stepNumber: baseSteps.length,
        name: 'netting',
        status: 'pending',
        description: 'Calculate net settlement amounts',
        processor: 'netting_engine',
      });
    }

    // Final settlement step
    baseSteps.push({
      stepNumber: baseSteps.length + 1,
      name: 'settlement_completion',
      status: 'pending',
      description: 'Complete settlement and update records',
      processor: 'settlement_engine',
    });

    return baseSteps;
  }

  async executeSettlement(settlementId) {
    try {
      const instruction = this.settlementInstructions.get(settlementId);
      if (!instruction) {
        throw new Error(`Settlement instruction not found: ${settlementId}`);
      }

      if (instruction.status !== 'pending') {
        throw new Error(`Settlement ${settlementId} is not in pending status`);
      }

      // Find associated workflow
      const workflow = Array.from(this.settlementWorkflows.values()).find(
        w => w.settlementId === settlementId
      );

      if (!workflow) {
        throw new Error(`Workflow not found for settlement: ${settlementId}`);
      }

      // Update instruction status
      instruction.status = 'processing';
      instruction.updatedAt = new Date();

      // Execute workflow steps
      await this.executeWorkflow(workflow);

      return instruction;
    } catch (error) {
      await this.handleSettlementError(settlementId, error);
      throw error;
    }
  }

  async executeWorkflow(workflow) {
    workflow.status = 'in_progress';

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      workflow.currentStep = i;

      try {
        step.status = 'processing';
        step.startedAt = new Date();

        // Execute step based on processor
        await this.executeWorkflowStep(step, workflow);

        step.status = 'completed';
        step.completedAt = new Date();

        // Emit progress event
        this.emit('workflowStepCompleted', {
          workflowId: workflow.id,
          settlementId: workflow.settlementId,
          stepNumber: step.stepNumber,
          stepName: step.name,
        });
      } catch (error) {
        step.status = 'failed';
        step.errorMessage = error.message;
        step.completedAt = new Date();

        workflow.status = 'failed';
        throw new Error(`Workflow step ${step.name} failed: ${error.message}`);
      }
    }

    workflow.status = 'completed';
    workflow.completedAt = new Date();

    // Update settlement instruction
    const instruction = this.settlementInstructions.get(workflow.settlementId);
    instruction.status = 'settled';
    instruction.settledAt = new Date();

    this.emit('settlementCompleted', {
      settlementId: workflow.settlementId,
      workflowId: workflow.id,
      region: workflow.region,
    });
  }

  async executeWorkflowStep(step, workflow) {
    const instruction = this.settlementInstructions.get(workflow.settlementId);

    switch (step.name) {
    case 'validation':
      await this.validateSettlement(instruction);
      break;
    case 'authorization':
      await this.authorizeSettlement(instruction);
      break;
    case 'netting':
      await this.processNetting(instruction);
      break;
    case 'payment_processing':
      await this.processPayment(instruction);
      break;
    case 'delivery_scheduling':
      await this.scheduleDelivery(instruction);
      break;
    case 'quality_inspection':
      await this.performQualityInspection(instruction);
      break;
    case 'delivery_confirmation':
      await this.confirmDelivery(instruction);
      break;
    case 'settlement_completion':
      await this.completeSettlement(instruction);
      break;
    default:
      throw new Error(`Unknown workflow step: ${step.name}`);
    }
  }

  async validateSettlement(instruction) {
    // Validate settlement instruction
    const regionConfig = await this.regionConfigService.getRegionConfig(instruction.region);
    const settlementRules = regionConfig?.settlementRules || this.getDefaultSettlementRules();

    // Check settlement timing
    if (instruction.settlementDate < new Date()) {
      throw new Error('Settlement date cannot be in the past');
    }

    // Check amount limits
    if (instruction.amount > this.config.maxSettlementAmount) {
      throw new Error(`Settlement amount exceeds maximum: ${this.config.maxSettlementAmount}`);
    }

    // Check trading hours and cutoffs
    const now = new Date();
    const cutoffTime = settlementRules.cutoffTimes.settlement_cutoff;
    if (cutoffTime && this.isPastCutoff(now, cutoffTime)) {
      // Move to next business day
      instruction.settlementDate = this.getNextBusinessDay(instruction.settlementDate);
    }

    return true;
  }

  async authorizeSettlement(instruction) {
    // Simulate authorization checks
    if (instruction.amount > 10000000) {
      // $10M requires additional approval
      // In production, this would trigger approval workflow
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return true;
  }

  async processNetting(instruction) {
    // Find all pending settlements for same user and commodity
    const userSettlements = Array.from(this.settlementInstructions.values()).filter(
      s =>
        s.userId === instruction.userId &&
        s.region === instruction.region &&
        s.status === 'processing' &&
        s.settlementType === 'net_cash'
    );

    // Calculate net amount
    const netAmount = userSettlements.reduce((sum, settlement) => {
      return sum + (settlement.side === 'buy' ? -settlement.amount : settlement.amount);
    }, 0);

    instruction.netAmount = netAmount;
    instruction.originalAmount = instruction.amount;
    instruction.amount = Math.abs(netAmount);

    return netAmount;
  }

  async processPayment(instruction) {
    // Simulate payment processing
    const processor = this.processors[instruction.settlementType];
    if (!processor) {
      throw new Error(`No processor found for settlement type: ${instruction.settlementType}`);
    }

    return await processor(instruction);
  }

  async processCashSettlement(instruction) {
    // Simulate cash settlement processing
    await new Promise(resolve => setTimeout(resolve, 200));

    instruction.paymentReference = `PAY-${uuidv4().substr(0, 8)}`;
    instruction.clearingHouse = instruction.cashflowDetails?.clearingHouse || 'default';

    return {
      status: 'completed',
      paymentReference: instruction.paymentReference,
      processedAt: new Date(),
    };
  }

  async processPhysicalSettlement(instruction) {
    // Simulate physical settlement processing
    await new Promise(resolve => setTimeout(resolve, 500));

    instruction.deliveryReference = `DEL-${uuidv4().substr(0, 8)}`;

    return {
      status: 'completed',
      deliveryReference: instruction.deliveryReference,
      processedAt: new Date(),
    };
  }

  async processNetCashSettlement(instruction) {
    // Process net cash settlement
    await this.processNetting(instruction);

    if (instruction.amount > 0) {
      return await this.processCashSettlement(instruction);
    } else {
      // No net amount, mark as settled
      return {
        status: 'completed',
        netted: true,
        processedAt: new Date(),
      };
    }
  }

  async scheduleDelivery(instruction) {
    // Simulate delivery scheduling
    await new Promise(resolve => setTimeout(resolve, 100));

    instruction.deliverySchedule = {
      scheduledDate: instruction.settlementDate,
      location: instruction.deliveryInstructions?.location || 'default_terminal',
      carrier: 'default_logistics',
      scheduledAt: new Date(),
    };

    return instruction.deliverySchedule;
  }

  async performQualityInspection(instruction) {
    // Simulate quality inspection
    await new Promise(resolve => setTimeout(resolve, 150));

    instruction.qualityReport = {
      inspectionId: `QC-${uuidv4().substr(0, 8)}`,
      passed: true,
      grade: 'A',
      inspectedAt: new Date(),
      inspector: 'certified_inspector',
    };

    return instruction.qualityReport;
  }

  async confirmDelivery(instruction) {
    // Simulate delivery confirmation
    await new Promise(resolve => setTimeout(resolve, 100));

    instruction.deliveryConfirmation = {
      confirmationId: `CONF-${uuidv4().substr(0, 8)}`,
      deliveredAt: new Date(),
      receivedBy: instruction.deliveryInstructions?.recipient || 'default_recipient',
      signature: 'digital_signature_hash',
    };

    return instruction.deliveryConfirmation;
  }

  async completeSettlement(instruction) {
    // Final settlement completion
    instruction.settlementReference = `SETT-${uuidv4().substr(0, 8)}`;
    instruction.finalAmount = instruction.amount;

    // Store in settlement history
    this.settlementHistory.set(instruction.id, {
      ...instruction,
      completedAt: new Date(),
    });

    return {
      status: 'completed',
      settlementReference: instruction.settlementReference,
      completedAt: new Date(),
    };
  }

  async handleSettlementError(settlementId, error) {
    const instruction = this.settlementInstructions.get(settlementId);
    if (instruction) {
      instruction.status = 'failed';
      instruction.errorMessage = error.message;
      instruction.failedAt = new Date();

      this.emit('settlementFailed', {
        settlementId,
        error: error.message,
        region: instruction.region,
      });
    }
  }

  startSettlementMonitoring() {
    // Monitor settlements every 5 minutes
    this.settlementMonitoringInterval = setInterval(
      async () => {
        try {
          await this.processScheduledSettlements();
          await this.checkOverdueSettlements();
        } catch (error) {
          console.error('Settlement monitoring error:', error);
        }
      },
      5 * 60 * 1000
    ); // 5 minutes
  }

  stopSettlementMonitoring() {
    if (this.settlementMonitoringInterval) {
      clearInterval(this.settlementMonitoringInterval);
      this.settlementMonitoringInterval = null;
    }
  }

  async processScheduledSettlements() {
    const now = new Date();
    const pendingSettlements = Array.from(this.settlementInstructions.values()).filter(
      s => s.status === 'pending' && s.settlementDate <= now && s.autoSettle
    );

    for (const settlement of pendingSettlements) {
      try {
        await this.executeSettlement(settlement.id);
      } catch (error) {
        console.error(`Auto-settlement failed for ${settlement.id}:`, error);
      }
    }
  }

  async checkOverdueSettlements() {
    const now = new Date();
    const overdueThreshold = 24 * 60 * 60 * 1000; // 24 hours

    const overdueSettlements = Array.from(this.settlementInstructions.values()).filter(
      s => s.status === 'processing' && now - s.updatedAt > overdueThreshold
    );

    overdueSettlements.forEach(settlement => {
      this.emit('settlementOverdue', {
        settlementId: settlement.id,
        region: settlement.region,
        overdueHours: Math.floor((now - settlement.updatedAt) / (60 * 60 * 1000)),
      });
    });
  }

  // Utility methods
  calculateSettlementDate(standardPeriod) {
    const date = new Date();
    date.setDate(date.getDate() + standardPeriod);
    return this.getNextBusinessDay(date);
  }

  getNextBusinessDay(date) {
    const businessDay = new Date(date);
    while (businessDay.getDay() === 0 || businessDay.getDay() === 6) {
      // Skip weekends
      businessDay.setDate(businessDay.getDate() + 1);
    }
    return businessDay;
  }

  isPastCutoff(currentTime, cutoffTime) {
    const [hours, minutes] = cutoffTime.split(':').map(Number);
    const cutoff = new Date(currentTime);
    cutoff.setHours(hours, minutes, 0, 0);

    return currentTime > cutoff;
  }

  async validateSettlementParams(params) {
    const { contractId, userId, settlementType, amount, currency } = params;

    if (!contractId || !userId) {
      throw new Error('Contract ID and User ID are required');
    }

    if (!this.config.supportedSettlementTypes.includes(settlementType)) {
      throw new Error(`Unsupported settlement type: ${settlementType}`);
    }

    if (!amount || amount <= 0) {
      throw new Error('Settlement amount must be positive');
    }

    if (!this.config.supportedCurrencies.includes(currency)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
  }

  getDefaultSettlementRules() {
    return {
      standardSettlementPeriod: this.config.defaultSettlementPeriod,
      cutoffTimes: {
        trade_cutoff: '15:00',
        settlement_cutoff: '17:00',
      },
      supportedSettlementMethods: this.config.supportedSettlementTypes,
      physicalDeliveryEnabled: true,
      cashSettlementEnabled: true,
      nettingEnabled: true,
      autoSettlementThreshold: this.config.autoSettlementThreshold,
    };
  }

  // Query methods
  async getSettlementInstruction(settlementId) {
    return this.settlementInstructions.get(settlementId);
  }

  async getSettlementWorkflow(workflowId) {
    return this.settlementWorkflows.get(workflowId);
  }

  async getUserSettlements(userId, region = null) {
    return Array.from(this.settlementInstructions.values()).filter(s => {
      if (s.userId !== userId) return false;
      if (region && s.region !== region) return false;
      return true;
    });
  }

  async getSettlementsByStatus(status, region = null) {
    return Array.from(this.settlementInstructions.values()).filter(s => {
      if (s.status !== status) return false;
      if (region && s.region !== region) return false;
      return true;
    });
  }

  async cancelSettlement(settlementId, reason = 'user_request') {
    const instruction = this.settlementInstructions.get(settlementId);
    if (!instruction) {
      throw new Error(`Settlement instruction not found: ${settlementId}`);
    }

    if (instruction.status !== 'pending') {
      throw new Error(`Cannot cancel settlement in status: ${instruction.status}`);
    }

    instruction.status = 'cancelled';
    instruction.cancellationReason = reason;
    instruction.cancelledAt = new Date();

    this.emit('settlementCancelled', {
      settlementId,
      reason,
      region: instruction.region,
    });

    return instruction;
  }
}

module.exports = SettlementService;
