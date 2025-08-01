const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

/**
 * Enhanced Regulatory Service
 * Provides comprehensive regulatory compliance and reporting for global energy markets
 * Supports automated, region-specific regulatory reporting with multiple export formats
 */
class EnhancedRegulatoryService {
  constructor() {
    this.regulatoryFrameworks = {
      // European Union Regulations
      MiFID_II: {
        name: 'Markets in Financial Instruments Directive II',
        region: 'EU',
        reportingRequirements: [
          'transaction_reporting',
          'position_reporting',
          'market_surveillance',
          'investor_protection'
        ],
        exportFormats: ['XML', 'XBRL'],
        reportingDeadline: 'T+1',
      },
      REMIT: {
        name: 'Regulation on Energy Market Integrity and Transparency',
        region: 'EU',
        reportingRequirements: [
          'fundamental_data',
          'inside_information',
          'transaction_reporting',
          'order_data'
        ],
        exportFormats: ['XML', 'CSV'],
        reportingDeadline: 'T+1',
      },
      EMIR: {
        name: 'European Market Infrastructure Regulation',
        region: 'EU',
        reportingRequirements: [
          'derivatives_reporting',
          'clearing_obligations',
          'risk_mitigation',
          'position_reporting'
        ],
        exportFormats: ['XML', 'XBRL'],
        reportingDeadline: 'T+1',
      },
      MAR: {
        name: 'Market Abuse Regulation',
        region: 'EU',
        reportingRequirements: [
          'suspicious_transactions',
          'insider_dealing',
          'market_manipulation',
          'disclosure_requirements'
        ],
        exportFormats: ['XML', 'CSV'],
        reportingDeadline: 'immediate',
      },

      // United States Regulations
      Dodd_Frank: {
        name: 'Dodd-Frank Wall Street Reform Act',
        region: 'US',
        reportingRequirements: [
          'swap_data_reporting',
          'volcker_rule',
          'systemically_important',
          'derivatives_oversight'
        ],
        exportFormats: ['XML', 'CSV'],
        reportingDeadline: 'T+1',
      },
      CFTC: {
        name: 'Commodity Futures Trading Commission Rules',
        region: 'US',
        reportingRequirements: [
          'large_trader_reporting',
          'position_limits',
          'swap_execution',
          'margin_requirements'
        ],
        exportFormats: ['XML', 'CSV'],
        reportingDeadline: 'T+1',
      },
      SEC: {
        name: 'Securities and Exchange Commission Rules',
        region: 'US',
        reportingRequirements: [
          'securities_reporting',
          'insider_trading',
          'market_making',
          'customer_protection'
        ],
        exportFormats: ['XML', 'XBRL'],
        reportingDeadline: 'T+1',
      },

      // United Kingdom Regulations
      FCA: {
        name: 'Financial Conduct Authority Rules',
        region: 'UK',
        reportingRequirements: [
          'transaction_reporting',
          'conduct_of_business',
          'market_conduct',
          'prudential_requirements'
        ],
        exportFormats: ['XML', 'CSV'],
        reportingDeadline: 'T+1',
      },

      // Guyana Local Regulations
      Guyana_Local: {
        name: 'Guyana Energy Sector Regulations',
        region: 'Guyana',
        reportingRequirements: [
          'energy_transactions',
          'local_content',
          'environmental_compliance',
          'revenue_transparency'
        ],
        exportFormats: ['CSV', 'XML'],
        reportingDeadline: 'T+2',
      },
    };

    this.reportingTemplates = new Map();
    this.initializeReportingTemplates();
  }

  /**
   * Initialize reporting templates for each regulatory framework
   */
  initializeReportingTemplates() {
    // MiFID II Transaction Reporting Template
    this.reportingTemplates.set('MiFID_II', {
      transactionReport: {
        fields: [
          'transaction_reference_number',
          'trading_venue',
          'instrument_identification',
          'quantity',
          'price',
          'currency',
          'transaction_time',
          'buy_sell_indicator',
          'client_identification',
          'investment_decision_maker',
          'execution_decision_maker'
        ],
        format: 'XML',
        schema: 'ESMA_MiFID_II_v2.0.xsd'
      }
    });

    // REMIT Fundamental Data Template
    this.reportingTemplates.set('REMIT', {
      fundamentalData: {
        fields: [
          'data_provider_id',
          'publication_time',
          'data_type',
          'asset_id',
          'capacity',
          'unavailable_capacity',
          'scheduled_consumption',
          'day_ahead_price'
        ],
        format: 'XML',
        schema: 'ACER_REMIT_v3.0.xsd'
      }
    });

    // Dodd-Frank Swap Data Reporting Template
    this.reportingTemplates.set('Dodd_Frank', {
      swapDataReport: {
        fields: [
          'unique_swap_identifier',
          'unique_transaction_identifier',
          'prior_usi',
          'product_id',
          'asset_class',
          'transaction_type',
          'reference_data',
          'counterparty_data',
          'collateral_data'
        ],
        format: 'XML',
        schema: 'CFTC_SDR_v1.0.xsd'
      }
    });

    // CFTC Large Trader Reporting Template
    this.reportingTemplates.set('CFTC', {
      largeTraderReport: {
        fields: [
          'reporting_date',
          'trader_id',
          'commodity_code',
          'contract_month',
          'long_positions',
          'short_positions',
          'position_delta',
          'trading_venue'
        ],
        format: 'CSV',
        headers: true
      }
    });

    // Guyana Local Reporting Template
    this.reportingTemplates.set('Guyana_Local', {
      energyTransactionReport: {
        fields: [
          'transaction_id',
          'transaction_date',
          'commodity_type',
          'volume',
          'unit_price',
          'total_value',
          'local_content_percentage',
          'environmental_impact_score',
          'revenue_transparency_data'
        ],
        format: 'CSV',
        headers: true
      }
    });

    // Add template for SEC regulation
    this.reportingTemplates.set('SEC', {
      securitiesReport: {
        fields: [
          'transaction_reference_number',
          'securities_type',
          'quantity',
          'price',
          'currency',
          'transaction_time',
          'buy_sell_indicator',
          'client_identification'
        ],
        format: 'XML',
        schema: 'SEC_v1.0.xsd'
      }
    });
  }

  /**
   * Perform comprehensive regulatory compliance check
   */
  async performRegulatoryCheck(transactionData, exchangeId) {
    const checkId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Get applicable regulations based on exchange
    const applicableRegulations = this.getApplicableRegulations(exchangeId);
    
    const complianceResults = [];
    
    for (const regulation of applicableRegulations) {
      try {
        const result = await this.checkRegulationCompliance(
          regulation,
          transactionData,
          exchangeId
        );
        complianceResults.push(result);
      } catch (error) {
        console.error(`Compliance check failed for ${regulation}:`, error);
        complianceResults.push({
          regulation,
          compliant: false,
          error: error.message,
          severity: 'high'
        });
      }
    }

    const violations = complianceResults.filter(result => !result.compliant);
    const overallCompliance = violations.length === 0;

    return {
      checkId,
      timestamp,
      exchangeId,
      applicableRegulations,
      overallCompliance,
      complianceResults,
      violations,
      requiredReports: this.generateRequiredReports(complianceResults, transactionData),
      riskLevel: this.calculateRiskLevel(violations),
    };
  }

  /**
   * Generate automated regulatory reports
   */
  async generateRegulatoryReports(transactionData, regulations, exportFormat = 'XML') {
    const reportId = uuidv4();
    const timestamp = new Date().toISOString();
    const reports = [];

    for (const regulation of regulations) {
      if (this.regulatoryFrameworks[regulation]) {
        const framework = this.regulatoryFrameworks[regulation];
        
        // Check if export format is supported
        if (!framework.exportFormats.includes(exportFormat)) {
          throw new Error(
            `Export format ${exportFormat} not supported for ${regulation}. ` +
            `Supported formats: ${framework.exportFormats.join(', ')}`
          );
        }

        const report = await this.generateSingleReport(
          regulation,
          transactionData,
          exportFormat
        );
        
        reports.push({
          regulation,
          reportId: `${reportId}_${regulation}`,
          format: exportFormat,
          content: report.content,
          filename: report.filename,
          schema: report.schema,
          generatedAt: timestamp,
          deadline: this.calculateReportingDeadline(framework.reportingDeadline),
        });
      }
    }

    return {
      reportId,
      timestamp,
      reports,
      totalReports: reports.length,
      exportFormat,
    };
  }

  /**
   * Generate a single regulatory report
   */
  async generateSingleReport(regulation, transactionData, exportFormat) {
    const template = this.reportingTemplates.get(regulation);
    const framework = this.regulatoryFrameworks[regulation];
    
    if (!template) {
      throw new Error(`No template found for regulation: ${regulation}`);
    }

    const reportData = this.extractReportData(transactionData, template);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    let content, filename, schema;

    switch (exportFormat) {
    case 'XML':
      content = this.generateXMLReport(reportData, regulation, template);
      filename = `${regulation}_${timestamp}.xml`;
      schema = template.transactionReport?.schema || template.fundamentalData?.schema || template.swapDataReport?.schema;
      break;
        
    case 'XBRL':
      content = this.generateXBRLReport(reportData, regulation, template);
      filename = `${regulation}_${timestamp}.xbrl`;
      schema = `${regulation}_taxonomy.xsd`;
      break;
        
    case 'CSV':
      content = this.generateCSVReport(reportData, regulation, template);
      filename = `${regulation}_${timestamp}.csv`;
      schema = null;
      break;
        
    default:
      throw new Error(`Unsupported export format: ${exportFormat}`);
    }

    return { content, filename, schema };
  }

  /**
   * Export reports to files
   */
  async exportReports(reports, outputDirectory = '/tmp/regulatory_reports') {
    try {
      // Create output directory if it doesn't exist
      await fs.mkdir(outputDirectory, { recursive: true });
      
      const exportedFiles = [];
      
      for (const report of reports) {
        const filePath = path.join(outputDirectory, report.filename);
        await fs.writeFile(filePath, report.content, 'utf8');
        
        exportedFiles.push({
          regulation: report.regulation,
          filename: report.filename,
          filePath,
          size: Buffer.byteLength(report.content, 'utf8'),
          exportedAt: new Date().toISOString(),
        });
      }
      
      return {
        success: true,
        exportedFiles,
        totalFiles: exportedFiles.length,
        outputDirectory,
      };
    } catch (error) {
      throw new Error(`Failed to export reports: ${error.message}`);
    }
  }

  /**
   * Get applicable regulations for an exchange
   */
  getApplicableRegulations(exchangeId) {
    const regionRegulationMap = {
      ICE: ['CFTC', 'SEC', 'FCA', 'EMIR'],
      EEX: ['MiFID_II', 'REMIT', 'EMIR', 'MAR'],
      CME: ['CFTC', 'Dodd_Frank', 'SEC'],
      NYMEX: ['CFTC', 'Dodd_Frank', 'SEC'],
      APX: ['MiFID_II', 'REMIT', 'EMIR'],
      MEPEX: ['FCA'], // Assuming FCA oversight for Middle East operations
      DME: ['FCA'], // Dubai regulated exchange
      OPEC: ['SEC'], // International oversight
      GUYANA_NDR: ['Guyana_Local'],
    };

    return regionRegulationMap[exchangeId] || [];
  }

  /**
   * Check compliance with a specific regulation
   */
  async checkRegulationCompliance(regulation, transactionData, exchangeId) {
    const framework = this.regulatoryFrameworks[regulation];
    
    if (!framework) {
      throw new Error(`Unknown regulation: ${regulation}`);
    }

    const checks = [];
    
    // Check reporting requirements
    for (const requirement of framework.reportingRequirements) {
      const check = await this.checkSpecificRequirement(
        requirement,
        transactionData,
        regulation
      );
      checks.push(check);
    }

    const violations = checks.filter(check => !check.compliant);
    const compliant = violations.length === 0;

    return {
      regulation,
      framework: framework.name,
      region: framework.region,
      compliant,
      checks,
      violations,
      severity: this.calculateSeverity(violations),
      reportingDeadline: this.calculateReportingDeadline(framework.reportingDeadline),
    };
  }

  /**
   * Check specific requirement compliance
   */
  async checkSpecificRequirement(requirement, transactionData, regulation) {
    const checks = {
      // Transaction reporting checks
      transaction_reporting: () => this.checkTransactionReporting(transactionData, regulation),
      position_reporting: () => this.checkPositionReporting(transactionData, regulation),
      
      // Market surveillance checks
      market_surveillance: () => this.checkMarketSurveillance(transactionData, regulation),
      suspicious_transactions: () => this.checkSuspiciousTransactions(transactionData, regulation),
      
      // Data reporting checks
      fundamental_data: () => this.checkFundamentalData(transactionData, regulation),
      order_data: () => this.checkOrderData(transactionData, regulation),
      
      // Compliance checks
      position_limits: () => this.checkPositionLimits(transactionData, regulation),
      margin_requirements: () => this.checkMarginRequirements(transactionData, regulation),
      
      // Specific regulatory checks
      local_content: () => this.checkLocalContent(transactionData, regulation),
      environmental_compliance: () => this.checkEnvironmentalCompliance(transactionData, regulation),
    };

    const checkFunction = checks[requirement];
    
    if (!checkFunction) {
      return {
        requirement,
        compliant: true,
        message: `No specific check implemented for ${requirement}`,
        severity: 'low',
      };
    }

    try {
      return await checkFunction();
    } catch (error) {
      return {
        requirement,
        compliant: false,
        message: error.message,
        severity: 'high',
      };
    }
  }

  // Specific compliance check methods
  async checkTransactionReporting(transactionData, regulation) {
    const requiredFields = this.getRequiredFields(regulation, 'transaction');
    const missingFields = requiredFields.filter(field => !transactionData[field]);
    
    return {
      requirement: 'transaction_reporting',
      compliant: missingFields.length === 0,
      message: missingFields.length > 0 
        ? `Missing required fields: ${missingFields.join(', ')}`
        : 'All required transaction fields present',
      missingFields,
      severity: missingFields.length > 0 ? 'high' : 'none',
    };
  }

  async checkPositionReporting(transactionData, regulation) {
    // Check if position reporting thresholds are met
    const { quantity, totalPosition } = transactionData;
    const threshold = this.getPositionReportingThreshold(regulation);
    
    const requiresReporting = totalPosition >= threshold;
    
    return {
      requirement: 'position_reporting',
      compliant: true, // Assuming we handle this automatically
      message: requiresReporting 
        ? 'Position reporting required and will be submitted'
        : 'Position below reporting threshold',
      requiresReporting,
      threshold,
      currentPosition: totalPosition,
      severity: 'none',
    };
  }

  async checkLocalContent(transactionData, regulation) {
    if (regulation !== 'Guyana_Local') {
      return {
        requirement: 'local_content',
        compliant: true,
        message: 'Local content requirement not applicable',
        severity: 'none',
      };
    }

    const { localContentPercentage } = transactionData;
    const minimumRequired = 30; // 30% local content requirement
    
    return {
      requirement: 'local_content',
      compliant: localContentPercentage >= minimumRequired,
      message: localContentPercentage >= minimumRequired
        ? `Local content ${localContentPercentage}% meets requirement`
        : `Local content ${localContentPercentage}% below minimum ${minimumRequired}%`,
      currentPercentage: localContentPercentage,
      minimumRequired,
      severity: localContentPercentage >= minimumRequired ? 'none' : 'medium',
    };
  }

  async checkEnvironmentalCompliance(transactionData, regulation) {
    const { environmentalImpactScore, certifications } = transactionData;
    
    const requiredScore = 70; // Minimum environmental score
    const scoreCompliant = environmentalImpactScore >= requiredScore;
    const certCompliant = certifications?.environmental || false;
    
    return {
      requirement: 'environmental_compliance',
      compliant: scoreCompliant && certCompliant,
      message: !scoreCompliant 
        ? 'Environmental impact score below minimum'
        : !certCompliant 
          ? 'Environmental certification missing'
          : 'Environmental compliance requirements met',
      currentScore: environmentalImpactScore,
      requiredScore,
      hasCertification: certCompliant,
      severity: (!scoreCompliant || !certCompliant) ? 'medium' : 'none',
    };
  }

  // Report generation methods
  generateXMLReport(reportData, regulation, template) {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const rootElement = `<${regulation}_Report xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`;
    const timestamp = new Date().toISOString();
    
    let xmlContent = xmlHeader + rootElement + '\n';
    xmlContent += '  <ReportHeader>\n';
    xmlContent += `    <ReportID>${uuidv4()}</ReportID>\n`;
    xmlContent += `    <GeneratedAt>${timestamp}</GeneratedAt>\n`;
    xmlContent += `    <Regulation>${regulation}</Regulation>\n`;
    xmlContent += '  </ReportHeader>\n';
    
    xmlContent += '  <TransactionData>\n';
    Object.entries(reportData).forEach(([key, value]) => {
      xmlContent += `    <${key}>${this.escapeXml(value)}</${key}>\n`;
    });
    xmlContent += '  </TransactionData>\n';
    
    xmlContent += `</${regulation}_Report>`;
    
    return xmlContent;
  }

  generateXBRLReport(reportData, regulation, template) {
    const xbrlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const namespace = `http://www.quantenergx.com/${regulation.toLowerCase()}`;
    
    let xbrlContent = xbrlHeader;
    xbrlContent += `<xbrl xmlns="${namespace}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n`;
    
    Object.entries(reportData).forEach(([key, value]) => {
      xbrlContent += `  <${regulation.toLowerCase()}:${key} contextRef="current">${this.escapeXml(value)}</${regulation.toLowerCase()}:${key}>\n`;
    });
    
    xbrlContent += '</xbrl>';
    
    return xbrlContent;
  }

  generateCSVReport(reportData, regulation, template) {
    const fields = template.largeTraderReport?.fields || 
                  template.energyTransactionReport?.fields || 
                  Object.keys(reportData);
    
    let csvContent = '';
    
    // Add headers if specified in template
    if (template.largeTraderReport?.headers || template.energyTransactionReport?.headers) {
      csvContent += fields.join(',') + '\n';
    }
    
    // Add data row
    const values = fields.map(field => {
      const value = reportData[field] !== undefined ? reportData[field] : '';
      // Escape commas and quotes in CSV
      return typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value;
    });
    
    csvContent += values.join(',') + '\n';
    
    return csvContent;
  }

  // Helper methods
  extractReportData(transactionData, template) {
    const reportData = {};
    
    // Get field list from template
    const fields = template.transactionReport?.fields || 
                  template.fundamentalData?.fields ||
                  template.swapDataReport?.fields ||
                  template.largeTraderReport?.fields ||
                  template.energyTransactionReport?.fields ||
                  Object.keys(transactionData);
    
    fields.forEach(field => {
      reportData[field] = transactionData[field] || this.getDefaultValue(field);
    });
    
    return reportData;
  }

  getDefaultValue(field) {
    const defaults = {
      transaction_reference_number: () => uuidv4(),
      transaction_time: () => new Date().toISOString(),
      reporting_date: () => new Date().toISOString().split('T')[0],
      currency: 'USD',
      buy_sell_indicator: 'B',
      asset_class: 'ENERGY',
    };
    
    const defaultFunction = defaults[field];
    return defaultFunction ? defaultFunction() : '';
  }

  getRequiredFields(regulation, reportType) {
    const fieldMap = {
      MiFID_II: {
        transaction: ['transaction_reference_number', 'quantity', 'price', 'currency', 'transaction_time']
      },
      REMIT: {
        transaction: ['data_provider_id', 'publication_time', 'asset_id', 'capacity']
      },
      Dodd_Frank: {
        transaction: ['unique_swap_identifier', 'product_id', 'asset_class', 'transaction_type']
      },
      CFTC: {
        transaction: ['trader_id', 'commodity_code', 'long_positions', 'short_positions']
      },
      Guyana_Local: {
        transaction: ['transaction_id', 'commodity_type', 'volume', 'local_content_percentage']
      }
    };
    
    return fieldMap[regulation]?.[reportType] || [];
  }

  getPositionReportingThreshold(regulation) {
    const thresholds = {
      MiFID_II: 1000000, // €1M
      CFTC: 5000000,     // $5M
      Dodd_Frank: 8000000, // $8M
      FCA: 800000,       // £800K
      Guyana_Local: 100000, // $100K
    };
    
    return thresholds[regulation] || 1000000;
  }

  calculateReportingDeadline(deadline) {
    const now = new Date();
    
    switch (deadline) {
    case 'immediate':
      return now.toISOString();
    case 'T+1':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case 'T+2':
      return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  calculateSeverity(violations) {
    if (violations.length === 0) return 'none';
    
    const severities = violations.map(v => v.severity);
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  calculateRiskLevel(violations) {
    if (violations.length === 0) return 'low';
    
    const highSeverityCount = violations.filter(v => v.severity === 'high').length;
    const mediumSeverityCount = violations.filter(v => v.severity === 'medium').length;
    
    if (highSeverityCount >= 2) return 'critical';
    if (highSeverityCount >= 1) return 'high';
    if (mediumSeverityCount >= 2) return 'medium';
    return 'low';
  }

  generateRequiredReports(complianceResults, transactionData) {
    const requiredReports = [];
    
    complianceResults.forEach(result => {
      if (result.compliant) {
        const framework = this.regulatoryFrameworks[result.regulation];
        if (framework) {
          requiredReports.push({
            regulation: result.regulation,
            deadline: result.reportingDeadline,
            formats: framework.exportFormats,
            requirements: framework.reportingRequirements,
          });
        }
      }
    });
    
    return requiredReports;
  }

  escapeXml(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Additional check methods for completeness
  async checkMarketSurveillance(transactionData, regulation) {
    const { price, marketPrice, volume, tradingTime } = transactionData;
    
    const priceDeviation = Math.abs((price - marketPrice) / marketPrice) * 100;
    const unusualVolume = volume > 100000; // Large volume threshold
    const offHours = this.isOffHours(tradingTime);
    
    const issues = [];
    if (priceDeviation > 10) issues.push('significant_price_deviation');
    if (unusualVolume) issues.push('unusual_volume');
    if (offHours) issues.push('off_hours_trading');
    
    return {
      requirement: 'market_surveillance',
      compliant: issues.length === 0,
      message: issues.length > 0 
        ? `Market surveillance flags: ${issues.join(', ')}`
        : 'No market surveillance issues detected',
      issues,
      priceDeviation,
      severity: issues.length > 0 ? 'medium' : 'none',
    };
  }

  async checkSuspiciousTransactions(transactionData, regulation) {
    const { traderId, counterpartyId, frequency, value } = transactionData;
    
    const highFrequency = frequency > 100; // transactions per day
    const highValue = value > 10000000; // $10M
    const newCounterparty = transactionData.newCounterparty || false;
    
    const suspicionFactors = [];
    if (highFrequency) suspicionFactors.push('high_frequency');
    if (highValue) suspicionFactors.push('high_value');
    if (newCounterparty) suspicionFactors.push('new_counterparty');
    
    return {
      requirement: 'suspicious_transactions',
      compliant: suspicionFactors.length < 2, // Trigger if 2+ factors
      message: suspicionFactors.length >= 2
        ? `Suspicious transaction factors: ${suspicionFactors.join(', ')}`
        : 'No suspicious transaction patterns detected',
      suspicionFactors,
      riskScore: suspicionFactors.length * 25,
      severity: suspicionFactors.length >= 2 ? 'high' : 'none',
    };
  }

  async checkFundamentalData(transactionData, regulation) {
    const requiredFundamentalFields = [
      'asset_id', 'capacity', 'unavailable_capacity', 'scheduled_consumption'
    ];
    
    const missingFields = requiredFundamentalFields.filter(
      field => !transactionData[field]
    );
    
    return {
      requirement: 'fundamental_data',
      compliant: missingFields.length === 0,
      message: missingFields.length > 0
        ? `Missing fundamental data: ${missingFields.join(', ')}`
        : 'All fundamental data fields present',
      missingFields,
      severity: missingFields.length > 0 ? 'medium' : 'none',
    };
  }

  async checkOrderData(transactionData, regulation) {
    const requiredOrderFields = ['order_id', 'order_time', 'order_type', 'execution_venue'];
    
    const missingFields = requiredOrderFields.filter(
      field => !transactionData[field]
    );
    
    return {
      requirement: 'order_data',
      compliant: missingFields.length === 0,
      message: missingFields.length > 0
        ? `Missing order data: ${missingFields.join(', ')}`
        : 'All order data fields present',
      missingFields,
      severity: missingFields.length > 0 ? 'medium' : 'none',
    };
  }

  async checkPositionLimits(transactionData, regulation) {
    const { quantity, totalPosition, commodity } = transactionData;
    const limit = this.getPositionLimit(commodity, regulation);
    const newTotal = (totalPosition || 0) + quantity;
    
    return {
      requirement: 'position_limits',
      compliant: newTotal <= limit,
      message: newTotal <= limit
        ? 'Position within regulatory limits'
        : `Position ${newTotal} exceeds limit ${limit}`,
      currentPosition: totalPosition || 0,
      newPosition: newTotal,
      limit,
      utilization: (newTotal / limit) * 100,
      severity: newTotal > limit ? 'high' : 'none',
    };
  }

  async checkMarginRequirements(transactionData, regulation) {
    const { value, currentMargin, marginRequirement } = transactionData;
    const required = marginRequirement || (value * 0.1); // 10% default
    const sufficient = currentMargin >= required;
    
    return {
      requirement: 'margin_requirements',
      compliant: sufficient,
      message: sufficient
        ? 'Margin requirements satisfied'
        : `Insufficient margin: ${currentMargin} < ${required}`,
      currentMargin,
      requiredMargin: required,
      deficit: sufficient ? 0 : required - currentMargin,
      severity: sufficient ? 'none' : 'high',
    };
  }

  getPositionLimit(commodity, regulation) {
    const limits = {
      crude_oil: 10000000,
      natural_gas: 50000000,
      electricity: 5000,
      renewable: 2000,
    };
    
    return limits[commodity] || 1000000;
  }

  isOffHours(tradingTime) {
    const time = new Date(tradingTime);
    const hour = time.getHours();
    return hour < 6 || hour > 22;
  }
}

module.exports = EnhancedRegulatoryService;