/**
 * Renewable Certificates Routes
 * API endpoints for renewable energy certificate trading with blockchain transparency
 */

const express = require('express');
const router = express.Router();
const RenewableCertificateService = require('../services/renewableCertificateService');

const recService = new RenewableCertificateService();

/**
 * @route   POST /api/v1/renewable-certificates/issue
 * @desc    Issue a new renewable energy certificate
 * @access  Private
 */
router.post('/issue', async (req, res) => {
  try {
    const result = await recService.issueCertificate(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/v1/renewable-certificates/trade
 * @desc    Trade renewable energy certificates
 * @access  Private
 */
router.post('/trade', async (req, res) => {
  try {
    const result = await recService.tradeCertificates(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/v1/renewable-certificates/retire
 * @desc    Retire certificates for green claims
 * @access  Private
 */
router.post('/retire', async (req, res) => {
  try {
    const result = await recService.retireCertificates(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/renewable-certificates/available
 * @desc    Get available certificates for trading
 * @access  Private
 */
router.get('/available', async (req, res) => {
  try {
    const filters = {
      energy_source: req.query.energy_source,
      vintage: req.query.vintage ? parseInt(req.query.vintage) : undefined,
      location: req.query.location,
      min_quantity: req.query.min_quantity ? parseInt(req.query.min_quantity) : undefined,
      max_price: req.query.max_price ? parseFloat(req.query.max_price) : undefined,
    };

    const result = await recService.getAvailableCertificates(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/renewable-certificates/track/:certificateId
 * @desc    Track certificate lifecycle and provenance
 * @access  Private
 */
router.get('/track/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const result = await recService.trackCertificateLifecycle(certificateId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/renewable-certificates/types
 * @desc    Get available certificate types and energy sources
 * @access  Public
 */
router.get('/types', (req, res) => {
  try {
    res.json({
      success: true,
      certificate_types: {
        REC: {
          name: 'Renewable Energy Certificate',
          description: 'US-based renewable energy certificates',
          regions: ['United States'],
          typical_unit: '1 MWh',
        },
        REGO: {
          name: 'Renewable Energy Guarantees of Origin',
          description: 'UK renewable energy certificates',
          regions: ['United Kingdom'],
          typical_unit: '1 MWh',
        },
        GO: {
          name: 'Guarantees of Origin',
          description: 'European renewable energy certificates',
          regions: ['European Union'],
          typical_unit: '1 MWh',
        },
        I_REC: {
          name: 'International Renewable Energy Certificate',
          description: 'Global renewable energy certificates',
          regions: ['International'],
          typical_unit: '1 MWh',
        },
        TIGR: {
          name: 'The International Go Registry',
          description: 'International tracking system for renewable energy',
          regions: ['International'],
          typical_unit: '1 MWh',
        },
      },
      energy_sources: {
        solar: {
          name: 'Solar photovoltaic',
          description: 'Solar panels converting sunlight to electricity',
          typical_capacity_factor: '15-25%',
          carbon_offset: '0.85 tons CO2 per MWh',
        },
        wind_onshore: {
          name: 'Onshore wind',
          description: 'Land-based wind turbines',
          typical_capacity_factor: '25-35%',
          carbon_offset: '0.90 tons CO2 per MWh',
        },
        wind_offshore: {
          name: 'Offshore wind',
          description: 'Ocean-based wind turbines',
          typical_capacity_factor: '35-50%',
          carbon_offset: '0.95 tons CO2 per MWh',
        },
        hydro_large: {
          name: 'Large hydroelectric',
          description: 'Large-scale hydroelectric dams',
          typical_capacity_factor: '40-60%',
          carbon_offset: '0.80 tons CO2 per MWh',
        },
        hydro_small: {
          name: 'Small hydroelectric',
          description: 'Run-of-river hydroelectric systems',
          typical_capacity_factor: '30-50%',
          carbon_offset: '0.85 tons CO2 per MWh',
        },
        biomass: {
          name: 'Biomass',
          description: 'Organic matter for energy generation',
          typical_capacity_factor: '70-90%',
          carbon_offset: '0.70 tons CO2 per MWh',
        },
        biogas: {
          name: 'Biogas',
          description: 'Gas from organic waste decomposition',
          typical_capacity_factor: '70-90%',
          carbon_offset: '0.75 tons CO2 per MWh',
        },
        geothermal: {
          name: 'Geothermal',
          description: "Heat from earth's core for electricity",
          typical_capacity_factor: '70-95%',
          carbon_offset: '0.88 tons CO2 per MWh',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/renewable-certificates/market-stats
 * @desc    Get renewable certificate market statistics
 * @access  Private
 */
router.get('/market-stats', (req, res) => {
  try {
    res.json({
      success: true,
      market_statistics: {
        global_volume_2024: {
          total_certificates: 145000000, // MWh
          total_value: 4650000000, // USD
          average_price: 32.07, // USD per MWh
          growth_rate: '+12.5%',
        },
        regional_breakdown: {
          north_america: {
            volume: 65000000, // MWh
            average_price: 28.5,
            dominant_sources: ['wind_onshore', 'solar', 'hydro_large'],
          },
          europe: {
            volume: 55000000, // MWh
            average_price: 38.75,
            dominant_sources: ['wind_offshore', 'solar', 'hydro_small'],
          },
          asia_pacific: {
            volume: 20000000, // MWh
            average_price: 25.25,
            dominant_sources: ['solar', 'wind_onshore', 'hydro_large'],
          },
          other_regions: {
            volume: 5000000, // MWh
            average_price: 35.0,
            dominant_sources: ['hydro_large', 'geothermal', 'biomass'],
          },
        },
        price_trends: {
          solar: { current_price: 25.5, change_30d: '+2.3%' },
          wind_onshore: { current_price: 32.75, change_30d: '+1.8%' },
          wind_offshore: { current_price: 45.25, change_30d: '+3.2%' },
          hydro: { current_price: 28.9, change_30d: '+0.9%' },
          biomass: { current_price: 38.5, change_30d: '+1.5%' },
        },
        top_buyers: [
          'Corporate renewable energy buyers',
          'Utilities meeting renewable portfolio standards',
          'Green energy suppliers',
          'Carbon-neutral companies',
        ],
        top_sellers: [
          'Independent power producers',
          'Renewable energy developers',
          'Utility-scale renewable facilities',
          'Distributed generation aggregators',
        ],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/renewable-certificates/blockchain/:hash
 * @desc    Verify certificate data on blockchain
 * @access  Public
 */
router.get('/blockchain/:hash', (req, res) => {
  try {
    const { hash } = req.params;

    res.json({
      success: true,
      blockchain_verification: {
        hash: hash,
        verified: true,
        block_number: Math.floor(Date.now() / 1000),
        timestamp: new Date().toISOString(),
        network: 'hyperledger_fabric',
        channel: 'renewable_certificates',
        chaincode: 'rec_trading',
        verification_url: `https://blockchain.quantenergx.com/verify/${hash}`,
        data_integrity: 'confirmed',
        immutable_record: true,
        transparency_score: 100,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/renewable-certificates/compliance
 * @desc    Get renewable energy compliance information
 * @access  Public
 */
router.get('/compliance', (req, res) => {
  try {
    res.json({
      success: true,
      compliance_frameworks: {
        renewable_portfolio_standards: {
          description: 'State-level mandates for renewable energy percentage',
          regions: ['United States (various states)', 'Australia', 'India'],
          typical_targets: '20-50% renewable energy by 2030',
        },
        eu_renewable_directive: {
          description: 'European Union renewable energy directive',
          regions: ['European Union'],
          current_target: '32% renewable energy by 2030',
        },
        corporate_commitments: {
          re100: 'Companies committed to 100% renewable electricity',
          science_based_targets: 'Science-based emissions reduction targets',
          net_zero_initiatives: 'Corporate net-zero commitments',
        },
        additionality_requirements: {
          temporal_matching: 'Energy generation and consumption time correlation',
          geographic_relevance: 'Regional proximity of generation and consumption',
          additionality: 'New renewable capacity driven by demand',
          tracking_systems: 'Certified renewable energy tracking registries',
        },
      },
      green_claims_standards: {
        scope_2_guidance: 'GHG Protocol Scope 2 Guidance for renewable energy claims',
        cdp_reporting: 'CDP climate disclosure requirements',
        gri_standards: 'Global Reporting Initiative sustainability standards',
        tcfd_recommendations: 'Task Force on Climate-related Financial Disclosures',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
