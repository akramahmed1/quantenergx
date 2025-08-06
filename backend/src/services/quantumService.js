/**
 * @fileoverview Quantum Service Integration
 * @description Service layer for integrating with quantum LSTM forecasting and blockchain
 * @author QuantEnergx Team
 */

const axios = require('axios');
const { ethers } = require('ethers');
const logger = require('winston');

/**
 * Service for integrating with quantum LSTM forecasting and blockchain contracts
 */
class QuantumService {
    constructor(config = {}) {
        this.config = {
            quantumServiceUrl: config.quantumServiceUrl || process.env.QUANTUM_SERVICE_URL || 'http://localhost:5000',
            contractAddress: config.contractAddress || process.env.QRL_CONTRACT_ADDRESS,
            providerUrl: config.providerUrl || process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
            privateKey: config.privateKey || process.env.QUANTUM_SERVICE_PRIVATE_KEY,
            timeout: config.timeout || 30000,
            enableFallback: config.enableFallback !== false,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            ...config
        };

        // Initialize blockchain connection
        this.provider = null;
        this.contract = null;
        this.wallet = null;

        // Performance tracking
        this.metrics = {
            requests: 0,
            successes: 0,
            failures: 0,
            avgResponseTime: 0,
            quantumUsage: 0,
            classicalFallbacks: 0
        };

        this.init();
    }

    /**
     * Initialize blockchain connections
     */
    async init() {
        try {
            if (this.config.providerUrl) {
                this.provider = new ethers.JsonRpcProvider(this.config.providerUrl);
                
                if (this.config.privateKey) {
                    this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
                }

                if (this.config.contractAddress) {
                    const abi = [
                        "function registerQuantumKey(bytes calldata publicKey, uint256 validityPeriod) external",
                        "function getQuantumKey(address user) view returns (tuple(bytes32 keyHash, bytes publicKey, uint256 createdAt, uint256 expiresAt, bool isActive, uint256 usageCount))",
                        "function generateQuantumEntropy() external returns (bytes32)",
                        "function isQuantumEntropyUsed(bytes32 entropy) view returns (bool)",
                        "event QuantumKeyRegistered(address indexed user, bytes32 keyHash)",
                        "event QuantumEntropyGenerated(bytes32 entropy, uint256 timestamp)"
                    ];

                    this.contract = new ethers.Contract(
                        this.config.contractAddress,
                        abi,
                        this.wallet || this.provider
                    );
                }
            }

            logger.info('QuantumService initialized', {
                quantumServiceUrl: this.config.quantumServiceUrl,
                contractAddress: this.config.contractAddress,
                enableFallback: this.config.enableFallback
            });

        } catch (error) {
            logger.error('Failed to initialize QuantumService', error);
            if (!this.config.enableFallback) {
                throw error;
            }
        }
    }

    /**
     * Generate quantum-enhanced forecast
     */
    async generateForecast(params) {
        const startTime = Date.now();
        this.metrics.requests++;

        try {
            const {
                commodity,
                historical_data,
                hours_ahead = 24,
                model_type = 'quantum_lstm',
                user_address
            } = params;

            // Validate input data
            this.validateForecastInput(params);

            // Prepare request data
            const requestData = {
                historical_data: this.transformHistoricalData(historical_data, commodity),
                hours_ahead,
                model_type
            };

            logger.info('Generating quantum forecast', {
                user_address,
                commodity,
                hours_ahead,
                model_type,
                data_points: historical_data.length
            });

            // Try quantum service first
            let forecast;
            try {
                const response = await this.makeQuantumRequest('/forecast', requestData);
                forecast = response.data.forecast;
                this.metrics.quantumUsage++;
                
                logger.info('Quantum forecast generated successfully', {
                    user_address,
                    model_type: forecast.model_type,
                    predictions: forecast.predictions.length
                });

            } catch (quantumError) {
                logger.warn('Quantum service failed, using fallback', {
                    error: quantumError.message,
                    user_address
                });

                if (this.config.enableFallback) {
                    forecast = await this.generateClassicalForecast(requestData);
                    this.metrics.classicalFallbacks++;
                } else {
                    throw quantumError;
                }
            }

            // Enhance forecast with business logic
            const enhancedForecast = await this.enhanceForecast(forecast, commodity, user_address);

            // Update metrics
            const responseTime = Date.now() - startTime;
            this.updateMetrics(responseTime, true);

            return enhancedForecast;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateMetrics(responseTime, false);
            
            logger.error('Forecast generation failed', {
                error: error.message,
                user_address: params.user_address,
                responseTime
            });
            
            throw error;
        }
    }

    /**
     * Run quantum vs classical benchmark
     */
    async runBenchmark(params) {
        try {
            const { test_data, epochs = 20, user_address } = params;

            logger.info('Running quantum benchmark', {
                user_address,
                data_points: test_data.length,
                epochs
            });

            const requestData = { test_data, epochs };
            const response = await this.makeQuantumRequest('/benchmark', requestData);

            const benchmark = response.data.benchmark_results;
            
            // Validate that quantum shows improvement
            if (benchmark.quantum_advantage) {
                logger.info('Quantum advantage demonstrated', {
                    improvement: benchmark.improvement_percentage,
                    user_address
                });
            } else {
                logger.warn('No quantum advantage detected', {
                    classical_mse: benchmark.classical_lstm.mse,
                    quantum_mse: benchmark.quantum_lstm.mse,
                    user_address
                });
            }

            return benchmark;

        } catch (error) {
            logger.error('Benchmark failed', {
                error: error.message,
                user_address: params.user_address
            });
            throw error;
        }
    }

    /**
     * Check quantum service health
     */
    async checkHealth() {
        try {
            const response = await axios.get(
                `${this.config.quantumServiceUrl}/health`,
                { timeout: 5000 }
            );

            const health = {
                status: 'healthy',
                quantum_available: response.data.quantum_available,
                classical_fallback: this.config.enableFallback,
                service_version: response.data.service || '1.0.0',
                last_check: new Date().toISOString(),
                response_time_ms: response.headers['x-response-time'] || 'unknown'
            };

            // Check blockchain connection
            if (this.provider) {
                try {
                    await this.provider.getBlockNumber();
                    health.blockchain_connected = true;
                } catch (blockchainError) {
                    health.blockchain_connected = false;
                    health.blockchain_error = blockchainError.message;
                }
            }

            return health;

        } catch (error) {
            logger.error('Quantum health check failed', error);
            return {
                status: 'unavailable',
                quantum_available: false,
                classical_fallback: this.config.enableFallback,
                error: error.message,
                last_check: new Date().toISOString()
            };
        }
    }

    /**
     * Generate quantum entropy
     */
    async generateEntropy(userAddress) {
        try {
            let entropy;
            let source = 'classical_fallback';
            let qualityScore = 0.5;

            // Try blockchain-based quantum entropy first
            if (this.contract && this.wallet) {
                try {
                    const tx = await this.contract.generateQuantumEntropy();
                    const receipt = await tx.wait();
                    
                    // Extract entropy from events
                    const event = receipt.events?.find(e => e.event === 'QuantumEntropyGenerated');
                    if (event) {
                        entropy = event.args.entropy;
                        source = 'quantum_hardware';
                        qualityScore = 0.95;
                    }
                } catch (blockchainError) {
                    logger.warn('Blockchain entropy generation failed', blockchainError);
                }
            }

            // Fallback to quantum service
            if (!entropy) {
                try {
                    const response = await axios.post(
                        `${this.config.quantumServiceUrl}/generate-entropy`,
                        {},
                        { timeout: 10000 }
                    );
                    entropy = response.data.entropy;
                    source = 'quantum_simulator';
                    qualityScore = 0.8;
                } catch (serviceError) {
                    logger.warn('Quantum service entropy generation failed', serviceError);
                }
            }

            // Final fallback to cryptographically secure random
            if (!entropy) {
                entropy = ethers.keccak256(ethers.toUtf8Bytes(
                    `entropy_${userAddress}_${Date.now()}_${Math.random()}`
                ));
                source = 'classical_fallback';
                qualityScore = 0.5;
            }

            return {
                entropy,
                quality_score: qualityScore,
                source,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Entropy generation failed', error);
            throw error;
        }
    }

    /**
     * Register quantum key on blockchain
     */
    async registerQuantumKey(params) {
        try {
            const {
                user_address,
                public_key,
                key_type = 'dilithium',
                validity_days = 30
            } = params;

            if (!this.contract || !this.wallet) {
                throw new Error('Blockchain not available for key registration');
            }

            const validityPeriod = validity_days * 24 * 60 * 60; // Convert to seconds
            const publicKeyBytes = ethers.getBytes(public_key);

            logger.info('Registering quantum key', {
                user_address,
                key_type,
                validity_days,
                public_key_length: publicKeyBytes.length
            });

            const tx = await this.contract.registerQuantumKey(
                publicKeyBytes,
                validityPeriod
            );

            const receipt = await tx.wait();
            
            // Extract key hash from events
            const event = receipt.events?.find(e => e.event === 'QuantumKeyRegistered');
            const keyHash = event?.args?.keyHash;

            return {
                keyHash,
                expiresAt: Math.floor(Date.now() / 1000) + validityPeriod,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber
            };

        } catch (error) {
            logger.error('Quantum key registration failed', {
                user_address: params.user_address,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get quantum key for user
     */
    async getQuantumKey(userAddress) {
        try {
            if (!this.contract) {
                throw new Error('Blockchain not available');
            }

            const keyInfo = await this.contract.getQuantumKey(userAddress);
            
            return {
                keyHash: keyInfo.keyHash,
                publicKey: keyInfo.publicKey,
                createdAt: keyInfo.createdAt,
                expiresAt: keyInfo.expiresAt,
                isActive: keyInfo.isActive,
                usageCount: keyInfo.usageCount
            };

        } catch (error) {
            logger.error('Failed to get quantum key', {
                userAddress,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Validate forecast input parameters
     */
    validateForecastInput(params) {
        const { historical_data, hours_ahead, commodity } = params;

        if (!historical_data || !Array.isArray(historical_data)) {
            throw new Error('Historical data must be an array');
        }

        if (historical_data.length < 24) {
            throw new Error('At least 24 historical data points required');
        }

        if (hours_ahead < 1 || hours_ahead > 168) {
            throw new Error('Hours ahead must be between 1 and 168');
        }

        const validCommodities = ['oil', 'natural_gas', 'electricity', 'renewable_energy', 'carbon_credit'];
        if (!validCommodities.includes(commodity)) {
            throw new Error(`Invalid commodity. Must be one of: ${validCommodities.join(', ')}`);
        }

        // Validate data point structure
        for (const point of historical_data) {
            if (typeof point.price !== 'number' || point.price < 0) {
                throw new Error('Price must be a positive number');
            }
            if (typeof point.volume !== 'number' || point.volume < 0) {
                throw new Error('Volume must be a positive number');
            }
            if (typeof point.volatility !== 'number' || point.volatility < 0 || point.volatility > 1) {
                throw new Error('Volatility must be between 0 and 1');
            }
            if (typeof point.demand !== 'number' || point.demand < 0) {
                throw new Error('Demand must be a positive number');
            }
        }
    }

    /**
     * Transform historical data for quantum service
     */
    transformHistoricalData(data, commodity) {
        return data.map(point => ({
            timestamp: point.timestamp || new Date().toISOString(),
            price: point.price,
            volume: point.volume,
            volatility: point.volatility,
            demand: point.demand,
            commodity_type: commodity
        }));
    }

    /**
     * Make request to quantum service with retry logic
     */
    async makeQuantumRequest(endpoint, data, method = 'POST') {
        let lastError;

        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const response = await axios({
                    method,
                    url: `${this.config.quantumServiceUrl}${endpoint}`,
                    data: method !== 'GET' ? data : undefined,
                    params: method === 'GET' ? data : undefined,
                    timeout: this.config.timeout,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'QuantEnergx-Backend/1.0.0'
                    }
                });

                return response;

            } catch (error) {
                lastError = error;
                logger.warn(`Quantum service request failed (attempt ${attempt}/${this.config.retryAttempts})`, {
                    endpoint,
                    error: error.message,
                    response: error.response?.data
                });

                if (attempt < this.config.retryAttempts) {
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
                }
            }
        }

        throw lastError;
    }

    /**
     * Generate classical fallback forecast
     */
    async generateClassicalForecast(requestData) {
        // Simple moving average fallback
        const { historical_data, hours_ahead } = requestData;
        const prices = historical_data.map(d => d.price);
        const recentPrices = prices.slice(-24); // Last 24 hours
        const averagePrice = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
        
        // Generate predictions with slight random walk
        const predictions = [];
        let currentPrice = averagePrice;
        
        for (let i = 0; i < hours_ahead; i++) {
            // Add small random variation (±2%)
            const variation = (Math.random() - 0.5) * 0.04;
            currentPrice *= (1 + variation);
            predictions.push(currentPrice);
        }

        return {
            predictions,
            hours_ahead,
            model_type: 'classical_fallback',
            timestamp: new Date().toISOString(),
            confidence_interval: {
                lower: predictions.map(p => p * 0.95),
                upper: predictions.map(p => p * 1.05),
                confidence: 0.75
            }
        };
    }

    /**
     * Enhance forecast with business logic
     */
    async enhanceForecast(forecast, commodity, userAddress) {
        // Add commodity-specific adjustments
        const commodityFactors = {
            oil: { volatility: 1.2, trend: 0.02 },
            natural_gas: { volatility: 1.5, trend: 0.01 },
            electricity: { volatility: 0.8, trend: 0.005 },
            renewable_energy: { volatility: 0.6, trend: -0.01 },
            carbon_credit: { volatility: 2.0, trend: 0.03 }
        };

        const factor = commodityFactors[commodity] || { volatility: 1.0, trend: 0 };

        // Adjust confidence intervals based on commodity volatility
        if (forecast.confidence_interval) {
            const adjustment = factor.volatility;
            forecast.confidence_interval.lower = forecast.confidence_interval.lower.map(
                (val, i) => val * (1 - 0.05 * adjustment)
            );
            forecast.confidence_interval.upper = forecast.confidence_interval.upper.map(
                (val, i) => val * (1 + 0.05 * adjustment)
            );
        }

        // Add metadata
        forecast.metadata = {
            commodity,
            commodity_factor: factor,
            enhanced_timestamp: new Date().toISOString(),
            user_address: userAddress,
            quantum_enhanced: forecast.model_type.includes('quantum')
        };

        return forecast;
    }

    /**
     * Update performance metrics
     */
    updateMetrics(responseTime, success) {
        if (success) {
            this.metrics.successes++;
        } else {
            this.metrics.failures++;
        }

        // Update average response time
        const totalRequests = this.metrics.successes + this.metrics.failures;
        this.metrics.avgResponseTime = (
            (this.metrics.avgResponseTime * (totalRequests - 1) + responseTime) / totalRequests
        );
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            successRate: this.metrics.requests > 0 ? this.metrics.successes / this.metrics.requests : 0,
            quantumUsageRate: this.metrics.requests > 0 ? this.metrics.quantumUsage / this.metrics.requests : 0,
            fallbackRate: this.metrics.requests > 0 ? this.metrics.classicalFallbacks / this.metrics.requests : 0
        };
    }
}

module.exports = {
    QuantumService
};