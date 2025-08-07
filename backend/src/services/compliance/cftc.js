const { EventEmitter } = require('events');
const axios = require('axios');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

/**
 * CFTC and MAS Compliance Service
 * Handles automated filing of regulatory forms with retry logic and audit logging
 */
class CFTCComplianceService extends EventEmitter {
  constructor() {
    super();

    this.auditLog = [];
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    };

    this.cftcConfig = {
      baseUrl: process.env.CFTC_API_BASE_URL || 'https://swaps.cftc.gov/public-swaps-api',
      apiKey: process.env.CFTC_API_KEY || '',
      timeout: parseInt(process.env.CFTC_TIMEOUT || '30000'),
    };

    this.masConfig = {
      baseUrl: process.env.MAS_API_BASE_URL || 'https://api.mas.gov.sg/regulatory-returns',
      certificatePath: process.env.MAS_CERT_PATH || '',
      keyPath: process.env.MAS_KEY_PATH || '',
      timeout: parseInt(process.env.MAS_TIMEOUT || '45000'),
    };
  }

  /**
   * Submit CFTC Form 102 with automated retry logic
   */
  async submitCFTCForm102(data, userId) {
    const startTime = Date.now();
    const submissionId = uuidv4();

    // Log submission attempt
    this.logAction('cftc_form_102_submission_started', {
      submissionId,
      reportingPeriod: data.reportingPeriod,
      positionCount: data.positions.length,
    }, userId);

    try {
      // Validate form data
      const validationResult = this.validateCFTCForm102(data);
      if (!validationResult.isValid) {
        const result = {
          submissionId,
          status: 'rejected',
          errors: validationResult.errors,
          submittedAt: new Date(),
          responseTime: Date.now() - startTime,
        };

        this.logAction('cftc_form_102_validation_failed', {
          submissionId,
          errors: validationResult.errors,
        }, userId);

        return {
          success: false,
          error: 'Form validation failed',
          data: result,
          timestamp: new Date(),
        };
      }

      // Submit with retry logic
      const result = await this.submitWithRetry(
        'cftc',
        async () => await this.performCFTCSubmission(data, submissionId),
        `CFTC Form 102 submission ${submissionId}`
      );

      result.responseTime = Date.now() - startTime;

      this.logAction('cftc_form_102_submission_completed', {
        submissionId,
        status: result.status,
        responseTime: result.responseTime,
        confirmationNumber: result.confirmationNumber,
      }, userId);

      return {
        success: result.status !== 'rejected',
        data: result,
        timestamp: new Date(),
      };

    } catch (error) {
      const result = {
        submissionId,
        status: 'rejected',
        errors: [error.message || 'Unknown error'],
        submittedAt: new Date(),
        responseTime: Date.now() - startTime,
      };

      this.logAction('cftc_form_102_submission_failed', {
        submissionId,
        error: error.message || 'Unknown error',
      }, userId);

      return {
        success: false,
        error: error.message || 'Submission failed',
        data: result,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Submit MAS 610A report with automated retry logic
   */
  async submitMAS610A(data, userId) {
    const startTime = Date.now();
    const submissionId = uuidv4();

    // Log submission attempt
    this.logAction('mas_610a_submission_started', {
      submissionId,
      reportingDate: data.institutionDetails.reportingDate,
      derivativeCount: data.commodityDerivatives.length,
    }, userId);

    try {
      // Validate form data
      const validationResult = this.validateMAS610A(data);
      if (!validationResult.isValid) {
        const result = {
          submissionId,
          status: 'rejected',
          validationErrors: validationResult.errors,
          submittedAt: new Date(),
          responseTime: Date.now() - startTime,
        };

        this.logAction('mas_610a_validation_failed', {
          submissionId,
          errors: validationResult.errors,
        }, userId);

        return {
          success: false,
          error: 'Form validation failed',
          data: result,
          timestamp: new Date(),
        };
      }

      // Submit with retry logic
      const result = await this.submitWithRetry(
        'mas',
        async () => await this.performMASSubmission(data, submissionId),
        `MAS 610A submission ${submissionId}`
      );

      result.responseTime = Date.now() - startTime;

      this.logAction('mas_610a_submission_completed', {
        submissionId,
        status: result.status,
        responseTime: result.responseTime,
        acknowledgmentNumber: result.acknowledgmentNumber,
      }, userId);

      return {
        success: result.status !== 'rejected',
        data: result,
        timestamp: new Date(),
      };

    } catch (error) {
      const result = {
        submissionId,
        status: 'rejected',
        validationErrors: [error.message || 'Unknown error'],
        submittedAt: new Date(),
        responseTime: Date.now() - startTime,
      };

      this.logAction('mas_610a_submission_failed', {
        submissionId,
        error: error.message || 'Unknown error',
      }, userId);

      return {
        success: false,
        error: error.message || 'Submission failed',
        data: result,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Validate CFTC Form 102 data
   */
  validateCFTCForm102(data) {
    const schema = Joi.object({
      reportingEntity: Joi.object({
        name: Joi.string().min(1).max(200).required(),
        cftcId: Joi.string().pattern(/^[A-Z0-9]{10}$/).required(),
        address: Joi.string().min(10).max(500).required(),
        contactPerson: Joi.string().min(1).max(100).required(),
        contactEmail: Joi.string().email().required(),
        contactPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
      }).required(),
      reportingPeriod: Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().greater(Joi.ref('startDate')).required(),
      }).required(),
      positions: Joi.array().items(Joi.object({
        commodity: Joi.string().valid('crude_oil', 'natural_gas', 'heating_oil', 'gasoline', 'propane').required(),
        contractMonth: Joi.string().pattern(/^[A-Z]{3}\d{2}$/).required(),
        longQuantity: Joi.number().min(0).required(),
        shortQuantity: Joi.number().min(0).required(),
        netQuantity: Joi.number().required(),
        notionalValue: Joi.number().min(0).required(),
      })).min(1).required(),
      aggregateData: Joi.object({
        totalLongPositions: Joi.number().min(0).required(),
        totalShortPositions: Joi.number().min(0).required(),
        totalNotionalValue: Joi.number().min(0).required(),
      }).required(),
    });

    const { error } = schema.validate(data, { abortEarly: false });
    
    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => detail.message),
      };
    }

    // Additional business logic validation
    const businessErrors = [];
    
    // Validate aggregate calculations
    const calculatedLong = data.positions.reduce((sum, pos) => sum + pos.longQuantity, 0);
    const calculatedShort = data.positions.reduce((sum, pos) => sum + pos.shortQuantity, 0);
    const calculatedNotional = data.positions.reduce((sum, pos) => sum + pos.notionalValue, 0);

    if (Math.abs(calculatedLong - data.aggregateData.totalLongPositions) > 0.01) {
      businessErrors.push('Total long positions calculation mismatch');
    }
    
    if (Math.abs(calculatedShort - data.aggregateData.totalShortPositions) > 0.01) {
      businessErrors.push('Total short positions calculation mismatch');
    }
    
    if (Math.abs(calculatedNotional - data.aggregateData.totalNotionalValue) > 0.01) {
      businessErrors.push('Total notional value calculation mismatch');
    }

    return {
      isValid: businessErrors.length === 0,
      errors: businessErrors,
    };
  }

  /**
   * Validate MAS 610A data
   */
  validateMAS610A(data) {
    const schema = Joi.object({
      institutionDetails: Joi.object({
        name: Joi.string().min(1).max(200).required(),
        masLicenseNumber: Joi.string().pattern(/^[A-Z]{2}\d{6}$/).required(),
        reportingDate: Joi.date().max('now').required(),
        contactOfficer: Joi.string().min(1).max(100).required(),
        contactEmail: Joi.string().email().required(),
      }).required(),
      commodityDerivatives: Joi.array().items(Joi.object({
        productType: Joi.string().valid('future', 'option', 'swap', 'forward').required(),
        underlyingCommodity: Joi.string().required(),
        notionalAmount: Joi.number().min(0).required(),
        currency: Joi.string().length(3).uppercase().required(),
        maturityDate: Joi.date().greater('now').required(),
        counterpartyType: Joi.string().valid('bank', 'corporate', 'fund', 'other').required(),
        riskMetrics: Joi.object({
          deltaEquivalent: Joi.number().required(),
          vegaEquivalent: Joi.number().optional(),
          dv01: Joi.number().optional(),
        }).required(),
      })).required(),
      riskSummary: Joi.object({
        totalNotional: Joi.number().min(0).required(),
        netDeltaEquivalent: Joi.number().required(),
        varEstimate: Joi.number().min(0).required(),
      }).required(),
    });

    const { error } = schema.validate(data, { abortEarly: false });
    
    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => detail.message),
      };
    }

    // Additional business logic validation
    const businessErrors = [];
    
    // Validate risk summary calculations
    const calculatedNotional = data.commodityDerivatives.reduce((sum, deriv) => sum + deriv.notionalAmount, 0);
    const calculatedDelta = data.commodityDerivatives.reduce((sum, deriv) => sum + deriv.riskMetrics.deltaEquivalent, 0);

    if (Math.abs(calculatedNotional - data.riskSummary.totalNotional) > 0.01) {
      businessErrors.push('Total notional amount calculation mismatch');
    }
    
    if (Math.abs(calculatedDelta - data.riskSummary.netDeltaEquivalent) > 0.01) {
      businessErrors.push('Net delta equivalent calculation mismatch');
    }

    return {
      isValid: businessErrors.length === 0,
      errors: businessErrors,
    };
  }

  /**
   * Perform actual CFTC submission
   */
  async performCFTCSubmission(data, submissionId) {
    const response = await axios.post(
      `${this.cftcConfig.baseUrl}/form-102/submit`,
      {
        submissionId,
        formData: data,
        submittedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Authorization': `Bearer ${this.cftcConfig.apiKey}`,
          'Content-Type': 'application/json',
          'X-Submission-Id': submissionId,
        },
        timeout: this.cftcConfig.timeout,
      }
    );

    return {
      submissionId,
      status: response.data.status || 'submitted',
      confirmationNumber: response.data.confirmationNumber,
      errors: response.data.errors,
      submittedAt: new Date(),
      responseTime: 0, // Will be set by caller
    };
  }

  /**
   * Perform actual MAS submission
   */
  async performMASSubmission(data, submissionId) {
    // In production, this would use client certificates for authentication
    const response = await axios.post(
      `${this.masConfig.baseUrl}/610a/submit`,
      {
        submissionId,
        institutionData: data,
        submittedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Submission-Id': submissionId,
          'X-Institution-License': data.institutionDetails.masLicenseNumber,
        },
        timeout: this.masConfig.timeout,
        // In production: httpsAgent with client certificates
      }
    );

    return {
      submissionId,
      status: response.data.status || 'submitted',
      acknowledgmentNumber: response.data.acknowledgmentNumber,
      validationErrors: response.data.validationErrors,
      submittedAt: new Date(),
      responseTime: 0, // Will be set by caller
    };
  }

  /**
   * Generic retry logic with exponential backoff
   */
  async submitWithRetry(service, submitFunction, operationDescription) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        console.log(`${operationDescription} - Attempt ${attempt}/${this.retryConfig.maxAttempts}`);
        const result = await submitFunction();
        
        if (attempt > 1) {
          console.log(`${operationDescription} - Succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        console.error(`${operationDescription} - Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryConfig.maxAttempts) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxDelay
          );
          
          console.log(`${operationDescription} - Retrying in ${delay}ms`);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Log audit actions
   */
  logAction(action, details, userId, ipAddress, userAgent) {
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      userId,
      action,
      details,
      region: action.includes('cftc') ? 'US' : 'Singapore',
      ipAddress,
      userAgent,
    };

    this.auditLog.push(logEntry);
    this.emit('audit_log', logEntry);

    // In production, this would be persisted to a secure audit database
    console.log(`Audit Log: ${action}`, {
      userId,
      timestamp: logEntry.timestamp,
      details: logEntry.details,
    });
  }

  /**
   * Get audit log entries
   */
  getAuditLog(filters = {}) {
    let filteredLog = [...this.auditLog];

    if (filters.userId) {
      filteredLog = filteredLog.filter(entry => entry.userId === filters.userId);
    }
    if (filters.region) {
      filteredLog = filteredLog.filter(entry => entry.region === filters.region);
    }
    if (filters.startDate) {
      filteredLog = filteredLog.filter(entry => entry.timestamp >= filters.startDate);
    }
    if (filters.endDate) {
      filteredLog = filteredLog.filter(entry => entry.timestamp <= filters.endDate);
    }
    if (filters.action) {
      filteredLog = filteredLog.filter(entry => entry.action.includes(filters.action));
    }

    return {
      success: true,
      data: filteredLog.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      timestamp: new Date(),
    };
  }

  /**
   * Get submission status
   */
  async getSubmissionStatus(submissionId, service) {
    try {
      const baseUrl = service === 'cftc' ? this.cftcConfig.baseUrl : this.masConfig.baseUrl;
      const endpoint = service === 'cftc' ? 'form-102' : '610a';
      
      const response = await axios.get(
        `${baseUrl}/${endpoint}/status/${submissionId}`,
        {
          headers: service === 'cftc' ? 
            { 'Authorization': `Bearer ${this.cftcConfig.apiKey}` } : 
            { 'X-Service': 'quantenergx' },
          timeout: 15000,
        }
      );

      return {
        success: true,
        data: response.data,
        timestamp: new Date(),
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get submission status',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Utility methods
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    const lastActivity = this.auditLog.length > 0 
      ? this.auditLog[this.auditLog.length - 1].timestamp 
      : null;

    return {
      success: true,
      data: {
        status: 'healthy',
        auditLogSize: this.auditLog.length,
        lastActivity,
        services: {
          cftc: {
            configured: !!this.cftcConfig.apiKey,
            lastCheck: null, // In production, would track API health checks
          },
          mas: {
            configured: !!this.masConfig.certificatePath,
            lastCheck: null,
          },
        },
      },
      timestamp: new Date(),
    };
  }

  /**
   * Clear audit log (admin only, with proper authorization)
   */
  clearAuditLog(userId, adminToken) {
    // In production, verify admin token and authorization
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      return {
        success: false,
        error: 'Unauthorized',
        timestamp: new Date(),
      };
    }

    const clearedCount = this.auditLog.length;
    this.auditLog = [];

    this.logAction('audit_log_cleared', { clearedCount }, userId);

    return {
      success: true,
      data: { cleared: clearedCount },
      timestamp: new Date(),
    };
  }
}

module.exports = CFTCComplianceService;