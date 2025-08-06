/**
 * @fileoverview Quantum Service Integration Routes
 * @description API routes for quantum forecasting and blockchain integration
 * @author QuantEnergx Team
 */

const express = require('express');
const axios = require('axios');
const { body, query, validationResult } = require('express-validator');
const logger = require('winston');
const { QuantumService } = require('../services/quantumService');

const router = express.Router();

// Initialize quantum service
const quantumService = new QuantumService({
    quantumServiceUrl: process.env.QUANTUM_SERVICE_URL || 'http://localhost:5000',
    contractAddress: process.env.QRL_CONTRACT_ADDRESS,
    enableFallback: true
});

/**
 * @swagger
 * /api/v1/forecast:
 *   post:
 *     summary: Generate quantum-enhanced energy price forecasts
 *     description: Uses quantum LSTM model to predict energy commodity prices
 *     tags: [Quantum Forecasting]
 *     security:
 *       - bearerAuth: []
 *       - quantumSignature: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commodity
 *               - historical_data
 *             properties:
 *               commodity:
 *                 type: string
 *                 enum: [oil, natural_gas, electricity, renewable_energy, carbon_credit]
 *                 description: Type of energy commodity
 *               historical_data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                     volume:
 *                       type: number
 *                       minimum: 0
 *                     volatility:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *                     demand:
 *                       type: number
 *                       minimum: 0
 *               hours_ahead:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 168
 *                 default: 24
 *                 description: Number of hours to forecast
 *               model_type:
 *                 type: string
 *                 enum: [quantum_lstm, classical_lstm, hybrid]
 *                 default: quantum_lstm
 *                 description: Model type to use for forecasting
 *     responses:
 *       200:
 *         description: Forecast generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 forecast:
 *                   type: object
 *                   properties:
 *                     predictions:
 *                       type: array
 *                       items:
 *                         type: number
 *                     hours_ahead:
 *                       type: integer
 *                     model_type:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     confidence_interval:
 *                       type: object
 *                       properties:
 *                         lower:
 *                           type: array
 *                           items:
 *                             type: number
 *                         upper:
 *                           type: array
 *                           items:
 *                             type: number
 *                         confidence:
 *                           type: number
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     quantum_enabled:
 *                       type: boolean
 *                     processing_time_ms:
 *                       type: number
 *                     model_accuracy:
 *                       type: number
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Internal server error
 */
router.post('/forecast',
    [
        // Validation middleware
        body('commodity')
            .isIn(['oil', 'natural_gas', 'electricity', 'renewable_energy', 'carbon_credit'])
            .withMessage('Invalid commodity type'),
        body('historical_data')
            .isArray({ min: 24 })
            .withMessage('Historical data must be an array with at least 24 data points'),
        body('historical_data.*.price')
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),
        body('historical_data.*.volume')
            .isFloat({ min: 0 })
            .withMessage('Volume must be a positive number'),
        body('historical_data.*.volatility')
            .isFloat({ min: 0, max: 1 })
            .withMessage('Volatility must be between 0 and 1'),
        body('historical_data.*.demand')
            .isFloat({ min: 0 })
            .withMessage('Demand must be a positive number'),
        body('hours_ahead')
            .optional()
            .isInt({ min: 1, max: 168 })
            .withMessage('Hours ahead must be between 1 and 168'),
        body('model_type')
            .optional()
            .isIn(['quantum_lstm', 'classical_lstm', 'hybrid'])
            .withMessage('Invalid model type')
    ],
    async (req, res) => {
        try {
            // Check validation results
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors.array()
                });
            }

            const startTime = Date.now();
            const {
                commodity,
                historical_data,
                hours_ahead = 24,
                model_type = 'quantum_lstm'
            } = req.body;

            logger.info('Quantum forecast request', {
                user: req.user.address,
                commodity,
                hours_ahead,
                model_type,
                data_points: historical_data.length
            });

            // Generate forecast using quantum service
            const forecast = await quantumService.generateForecast({
                commodity,
                historical_data,
                hours_ahead,
                model_type,
                user_address: req.user.address
            });

            const processingTime = Date.now() - startTime;

            // Log quantum authentication details if available
            if (req.quantumAuth) {
                logger.info('Quantum-authenticated forecast', {
                    user: req.user.address,
                    quantum_signature: !!req.quantumAuth.signature,
                    quantum_entropy: !!req.quantumAuth.entropy
                });
            }

            res.json({
                success: true,
                forecast,
                metadata: {
                    quantum_enabled: forecast.model_type === 'quantum_lstm',
                    processing_time_ms: processingTime,
                    model_accuracy: forecast.confidence_interval?.confidence || 0.95,
                    quantum_authenticated: !!req.quantumAuth
                }
            });

        } catch (error) {
            logger.error('Forecast generation failed', {
                user: req.user?.address,
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                error: 'Forecast generation failed',
                code: 'FORECAST_ERROR',
                details: error.message
            });
        }
    }
);

/**
 * @swagger
 * /api/v1/quantum/benchmark:
 *   post:
 *     summary: Run quantum vs classical performance benchmark
 *     description: Compare quantum LSTM against classical LSTM performance
 *     tags: [Quantum Benchmarking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - test_data
 *             properties:
 *               test_data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     price:
 *                       type: number
 *                     volume:
 *                       type: number
 *                     volatility:
 *                       type: number
 *                     demand:
 *                       type: number
 *               epochs:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 100
 *                 default: 20
 *     responses:
 *       200:
 *         description: Benchmark completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 benchmark_results:
 *                   type: object
 *                   properties:
 *                     classical_lstm:
 *                       type: object
 *                       properties:
 *                         mse:
 *                           type: number
 *                         mae:
 *                           type: number
 *                         rmse:
 *                           type: number
 *                     quantum_lstm:
 *                       type: object
 *                       properties:
 *                         mse:
 *                           type: number
 *                         mae:
 *                           type: number
 *                         rmse:
 *                           type: number
 *                     improvement_percentage:
 *                       type: number
 *                     quantum_advantage:
 *                       type: boolean
 */
router.post('/quantum/benchmark',
    [
        body('test_data')
            .isArray({ min: 50 })
            .withMessage('Test data must be an array with at least 50 data points'),
        body('epochs')
            .optional()
            .isInt({ min: 5, max: 100 })
            .withMessage('Epochs must be between 5 and 100')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors.array()
                });
            }

            const { test_data, epochs = 20 } = req.body;

            logger.info('Quantum benchmark request', {
                user: req.user.address,
                data_points: test_data.length,
                epochs
            });

            const benchmark = await quantumService.runBenchmark({
                test_data,
                epochs,
                user_address: req.user.address
            });

            res.json({
                success: true,
                benchmark_results: benchmark
            });

        } catch (error) {
            logger.error('Benchmark failed', {
                user: req.user?.address,
                error: error.message
            });

            res.status(500).json({
                error: 'Benchmark failed',
                code: 'BENCHMARK_ERROR',
                details: error.message
            });
        }
    }
);

/**
 * @swagger
 * /api/v1/quantum/health:
 *   get:
 *     summary: Check quantum service health
 *     description: Get status of quantum computing capabilities
 *     tags: [Quantum Service]
 *     responses:
 *       200:
 *         description: Service health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unavailable]
 *                 quantum_available:
 *                   type: boolean
 *                 classical_fallback:
 *                   type: boolean
 *                 service_version:
 *                   type: string
 *                 last_check:
 *                   type: string
 *                   format: date-time
 */
router.get('/quantum/health', async (req, res) => {
    try {
        const health = await quantumService.checkHealth();
        res.json(health);
    } catch (error) {
        logger.error('Quantum health check failed', error);
        res.status(503).json({
            status: 'unavailable',
            quantum_available: false,
            classical_fallback: true,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/v1/quantum/entropy:
 *   post:
 *     summary: Generate quantum entropy
 *     description: Generate cryptographically secure quantum entropy
 *     tags: [Quantum Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quantum entropy generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entropy:
 *                   type: string
 *                   description: Hex-encoded quantum entropy
 *                 quality_score:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 1
 *                 source:
 *                   type: string
 *                   enum: [quantum_hardware, quantum_simulator, classical_fallback]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.post('/quantum/entropy', async (req, res) => {
    try {
        const entropy = await quantumService.generateEntropy(req.user.address);
        res.json(entropy);
    } catch (error) {
        logger.error('Entropy generation failed', {
            user: req.user?.address,
            error: error.message
        });

        res.status(500).json({
            error: 'Entropy generation failed',
            code: 'ENTROPY_ERROR',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /api/v1/quantum/key:
 *   post:
 *     summary: Register quantum key for user
 *     description: Register a post-quantum cryptographic key
 *     tags: [Quantum Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - public_key
 *             properties:
 *               public_key:
 *                 type: string
 *                 description: Hex-encoded post-quantum public key
 *               key_type:
 *                 type: string
 *                 enum: [dilithium, kyber, falcon, rainbow]
 *                 default: dilithium
 *               validity_days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 default: 30
 *     responses:
 *       200:
 *         description: Quantum key registered successfully
 *       400:
 *         description: Invalid key parameters
 */
router.post('/quantum/key',
    [
        body('public_key')
            .isHexadecimal()
            .isLength({ min: 64 })
            .withMessage('Public key must be a valid hex string of at least 32 bytes'),
        body('key_type')
            .optional()
            .isIn(['dilithium', 'kyber', 'falcon', 'rainbow'])
            .withMessage('Invalid key type'),
        body('validity_days')
            .optional()
            .isInt({ min: 1, max: 365 })
            .withMessage('Validity days must be between 1 and 365')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors.array()
                });
            }

            const {
                public_key,
                key_type = 'dilithium',
                validity_days = 30
            } = req.body;

            const result = await quantumService.registerQuantumKey({
                user_address: req.user.address,
                public_key,
                key_type,
                validity_days
            });

            res.json({
                success: true,
                key_hash: result.keyHash,
                expires_at: result.expiresAt,
                transaction_hash: result.transactionHash
            });

        } catch (error) {
            logger.error('Quantum key registration failed', {
                user: req.user?.address,
                error: error.message
            });

            res.status(500).json({
                error: 'Key registration failed',
                code: 'KEY_REGISTRATION_ERROR',
                details: error.message
            });
        }
    }
);

/**
 * @swagger
 * /api/v1/quantum/key:
 *   get:
 *     summary: Get user's quantum key information
 *     description: Retrieve quantum key details for the authenticated user
 *     tags: [Quantum Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quantum key information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 key_hash:
 *                   type: string
 *                 public_key:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 expires_at:
 *                   type: string
 *                   format: date-time
 *                 is_active:
 *                   type: boolean
 *                 usage_count:
 *                   type: integer
 *       404:
 *         description: No quantum key found for user
 */
router.get('/quantum/key', async (req, res) => {
    try {
        const keyInfo = await quantumService.getQuantumKey(req.user.address);
        
        if (!keyInfo || !keyInfo.isActive) {
            return res.status(404).json({
                error: 'No active quantum key found',
                code: 'KEY_NOT_FOUND'
            });
        }

        res.json({
            key_hash: keyInfo.keyHash,
            public_key: keyInfo.publicKey,
            created_at: new Date(keyInfo.createdAt * 1000).toISOString(),
            expires_at: new Date(keyInfo.expiresAt * 1000).toISOString(),
            is_active: keyInfo.isActive,
            usage_count: keyInfo.usageCount
        });

    } catch (error) {
        logger.error('Failed to get quantum key', {
            user: req.user?.address,
            error: error.message
        });

        res.status(500).json({
            error: 'Failed to retrieve quantum key',
            code: 'KEY_RETRIEVAL_ERROR',
            details: error.message
        });
    }
});

module.exports = router;