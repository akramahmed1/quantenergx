/**
 * Sharia Compliance Routes
 * API endpoints for Islamic finance compliance services
 */

const express = require('express');
const router = express.Router();
const ShariaComplianceService = require('../services/shariaComplianceService');

const shariaService = new ShariaComplianceService();

/**
 * @route   POST /api/v1/sharia/compliance/check
 * @desc    Check if a trading instrument is Sharia compliant
 * @access  Private
 */
router.post('/check', async (req, res) => {
  try {
    const result = await shariaService.checkShariaCompliance(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/sharia/products
 * @desc    Get available Sharia-compliant energy products
 * @access  Private
 */
router.get('/products', async (req, res) => {
  try {
    const result = await shariaService.getShariaCompliantProducts();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/sharia/trading-time
 * @desc    Check if current time is valid for Islamic trading
 * @access  Private
 */
router.get('/trading-time', async (req, res) => {
  try {
    const result = shariaService.isValidTradingTime();
    res.json({
      success: true,
      trading_time_check: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/sharia/bulk-check
 * @desc    Check multiple instruments for Sharia compliance
 * @access  Private
 */
router.post('/bulk-check', async (req, res) => {
  try {
    const { instruments } = req.body;
    const results = [];

    for (const instrument of instruments) {
      const result = await shariaService.checkShariaCompliance(instrument);
      results.push(result);
    }

    res.json({
      success: true,
      total_instruments: instruments.length,
      compliant_count: results.filter(r => r.is_sharia_compliant).length,
      results: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/sharia/guidelines
 * @desc    Get Sharia compliance guidelines and standards
 * @access  Public
 */
router.get('/guidelines', (req, res) => {
  res.json({
    success: true,
    guidelines: {
      prohibited_sectors: [
        'Alcohol production and distribution',
        'Tobacco products',
        'Gambling and gaming',
        'Conventional banking with interest',
        'Pork and pork products',
        'Adult entertainment'
      ],
      permitted_energy_sectors: [
        'Solar energy generation',
        'Wind energy generation',
        'Hydroelectric power',
        'Geothermal energy',
        'Natural gas (halal sourced)',
        'Crude oil (halal sourced)'
      ],
      contract_requirements: {
        asset_backing: 'Minimum 51% tangible asset backing required',
        speculation_limit: 'Excessive uncertainty (Gharar) must be minimized',
        interest_prohibition: 'No interest-based (Riba) transactions',
        contract_clarity: 'All terms must be clearly defined'
      },
      approved_structures: [
        'Murabaha (cost-plus financing)',
        'Ijara (leasing)',
        'Salam (forward sale)',
        'Istisna (manufacturing contract)',
        'Spot transactions'
      ],
      certification_standards: [
        'AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions)',
        'Islamic Fiqh Academy',
        'National Sharia boards',
        'International Islamic Liquidity Management Corporation (IILM)'
      ]
    }
  });
});

module.exports = router;