const express = require('express');
const router = express.Router();
const EnhancedRegulatoryService = require('../services/enhancedRegulatoryService');

// Initialize service
const regulatoryService = new EnhancedRegulatoryService();

/**
 * GET /api/regulatory/frameworks
 * Get all available regulatory frameworks
 */
router.get('/frameworks', async (req, res) => {
  try {
    const frameworks = Object.keys(regulatoryService.regulatoryFrameworks).map(key => ({
      id: key,
      ...regulatoryService.regulatoryFrameworks[key]
    }));
    
    res.json({
      success: true,
      data: frameworks,
      total: frameworks.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/regulatory/frameworks/:regulation
 * Get specific regulatory framework details
 */
router.get('/frameworks/:regulation', async (req, res) => {
  try {
    const { regulation } = req.params;
    const framework = regulatoryService.regulatoryFrameworks[regulation];
    
    if (!framework) {
      return res.status(404).json({
        success: false,
        error: `Regulatory framework not found: ${regulation}`,
        timestamp: new Date().toISOString(),
      });
    }
    
    res.json({
      success: true,
      data: {
        id: regulation,
        ...framework
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/regulatory/check
 * Perform regulatory compliance check
 */
router.post('/check', async (req, res) => {
  try {
    const { transactionData, exchangeId } = req.body;
    
    if (!transactionData) {
      return res.status(400).json({
        success: false,
        error: 'Transaction data is required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!exchangeId) {
      return res.status(400).json({
        success: false,
        error: 'Exchange ID is required',
        timestamp: new Date().toISOString(),
      });
    }
    
    const result = await regulatoryService.performRegulatoryCheck(transactionData, exchangeId);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/regulatory/reports/generate
 * Generate regulatory reports
 */
router.post('/reports/generate', async (req, res) => {
  try {
    const { transactionData, regulations, exportFormat = 'XML' } = req.body;
    
    if (!transactionData) {
      return res.status(400).json({
        success: false,
        error: 'Transaction data is required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!regulations || !Array.isArray(regulations)) {
      return res.status(400).json({
        success: false,
        error: 'Regulations array is required',
        timestamp: new Date().toISOString(),
      });
    }

    const supportedFormats = ['XML', 'XBRL', 'CSV'];
    if (!supportedFormats.includes(exportFormat)) {
      return res.status(400).json({
        success: false,
        error: `Export format must be one of: ${supportedFormats.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
    }
    
    const result = await regulatoryService.generateRegulatoryReports(
      transactionData, 
      regulations, 
      exportFormat
    );
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/regulatory/reports/export
 * Export generated reports to files
 */
router.post('/reports/export', async (req, res) => {
  try {
    const { reports, outputDirectory } = req.body;
    
    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({
        success: false,
        error: 'Reports array is required',
        timestamp: new Date().toISOString(),
      });
    }
    
    const result = await regulatoryService.exportReports(reports, outputDirectory);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/regulatory/reports/templates
 * Get available reporting templates
 */
router.get('/reports/templates', async (req, res) => {
  try {
    const templates = [];
    
    for (const [regulation, template] of regulatoryService.reportingTemplates) {
      templates.push({
        regulation,
        template: Object.keys(template).map(key => ({
          type: key,
          fields: template[key].fields,
          format: template[key].format,
          schema: template[key].schema,
        }))
      });
    }
    
    res.json({
      success: true,
      data: templates,
      total: templates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/regulatory/reports/templates/:regulation
 * Get reporting template for specific regulation
 */
router.get('/reports/templates/:regulation', async (req, res) => {
  try {
    const { regulation } = req.params;
    const template = regulatoryService.reportingTemplates.get(regulation);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template not found for regulation: ${regulation}`,
        timestamp: new Date().toISOString(),
      });
    }
    
    const formattedTemplate = Object.keys(template).map(key => ({
      type: key,
      fields: template[key].fields,
      format: template[key].format,
      schema: template[key].schema,
    }));
    
    res.json({
      success: true,
      data: {
        regulation,
        template: formattedTemplate
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/regulatory/applicable/:exchangeId
 * Get applicable regulations for an exchange
 */
router.get('/applicable/:exchangeId', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const applicableRegulations = regulatoryService.getApplicableRegulations(exchangeId);
    
    if (applicableRegulations.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No regulations found for exchange: ${exchangeId}`,
        timestamp: new Date().toISOString(),
      });
    }
    
    const detailedRegulations = applicableRegulations.map(reg => ({
      id: reg,
      ...regulatoryService.regulatoryFrameworks[reg]
    }));
    
    res.json({
      success: true,
      data: {
        exchangeId,
        regulations: detailedRegulations,
        total: detailedRegulations.length
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/regulatory/validate/transaction
 * Validate transaction data for regulatory compliance
 */
router.post('/validate/transaction', async (req, res) => {
  try {
    const { transactionData, regulation } = req.body;
    
    if (!transactionData) {
      return res.status(400).json({
        success: false,
        error: 'Transaction data is required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!regulation) {
      return res.status(400).json({
        success: false,
        error: 'Regulation is required',
        timestamp: new Date().toISOString(),
      });
    }
    
    const framework = regulatoryService.regulatoryFrameworks[regulation];
    if (!framework) {
      return res.status(404).json({
        success: false,
        error: `Unknown regulation: ${regulation}`,
        timestamp: new Date().toISOString(),
      });
    }
    
    const result = await regulatoryService.checkRegulationCompliance(
      regulation, 
      transactionData, 
      'VALIDATION'
    );
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/regulatory/export-formats
 * Get supported export formats for regulations
 */
router.get('/export-formats', async (req, res) => {
  try {
    const formats = {};
    
    Object.keys(regulatoryService.regulatoryFrameworks).forEach(regulation => {
      const framework = regulatoryService.regulatoryFrameworks[regulation];
      formats[regulation] = framework.exportFormats;
    });
    
    res.json({
      success: true,
      data: formats,
      globalFormats: ['XML', 'XBRL', 'CSV'],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/regulatory/reports/sample
 * Generate sample regulatory report for testing
 */
router.post('/reports/sample', async (req, res) => {
  try {
    const { regulation, exportFormat = 'XML' } = req.body;
    
    if (!regulation) {
      return res.status(400).json({
        success: false,
        error: 'Regulation is required',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Generate sample transaction data
    const sampleTransactionData = {
      transaction_reference_number: 'SAMPLE_TXN_' + Date.now(),
      trading_venue: 'SAMPLE_VENUE',
      instrument_identification: 'CRUDE_OIL_001',
      quantity: 1000,
      price: 75.50,
      currency: 'USD',
      transaction_time: new Date().toISOString(),
      buy_sell_indicator: 'B',
      client_identification: 'CLIENT_001',
      investment_decision_maker: 'TRADER_001',
      execution_decision_maker: 'TRADER_001',
      data_provider_id: 'PROVIDER_001',
      publication_time: new Date().toISOString(),
      asset_id: 'ASSET_001',
      capacity: 5000,
      unavailable_capacity: 500,
      commodity_type: 'crude_oil',
      volume: 1000,
      localContentPercentage: 35,
      environmentalScore: 75,
    };
    
    const result = await regulatoryService.generateSingleReport(
      regulation,
      sampleTransactionData,
      exportFormat
    );
    
    res.json({
      success: true,
      data: {
        regulation,
        exportFormat,
        filename: result.filename,
        content: result.content,
        schema: result.schema,
        sampleData: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;