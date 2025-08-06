/**
 * @fileoverview Quantum Authentication Middleware
 * @description Provides quantum-safe authentication for energy trading operations
 * @author QuantEnergx Team
 */

const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const logger = require('winston');
const axios = require('axios');

/**
 * Quantum Authentication Middleware
 * Verifies quantum signatures and manages quantum-safe authentication
 */
class QuantumAuthMiddleware {
    constructor(config = {}) {
        this.config = {
            quantumServiceUrl: config.quantumServiceUrl || process.env.QUANTUM_SERVICE_URL || 'http://localhost:5000',
            contractAddress: config.contractAddress || process.env.QRL_CONTRACT_ADDRESS,
            providerUrl: config.providerUrl || process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
            jwtSecret: config.jwtSecret || process.env.JWT_SECRET,
            quantumKeyExpiry: config.quantumKeyExpiry || 30 * 24 * 60 * 60 * 1000, // 30 days
            enableQuantumFallback: config.enableQuantumFallback !== false,
            ...config
        };

        // Initialize blockchain provider
        this.provider = new ethers.JsonRpcProvider(this.config.providerUrl);
        
        // Initialize contract interface (will be set up in init())
        this.qrlContract = null;
        
        // Cache for quantum keys
        this.quantumKeyCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
        
        logger.info('QuantumAuthMiddleware initialized', {
            quantumServiceUrl: this.config.quantumServiceUrl,
            contractAddress: this.config.contractAddress
        });
    }

    /**
     * Initialize the middleware with contract ABI
     */
    async init() {
        try {
            // In a real implementation, you would load the ABI from the compiled contract
            // For now, we'll use a minimal ABI for the functions we need
            const minimalABI = [
                "function getQuantumKey(address user) view returns (tuple(bytes32 keyHash, bytes publicKey, uint256 createdAt, uint256 expiresAt, bool isActive, uint256 usageCount))",
                "function isQuantumEntropyUsed(bytes32 entropy) view returns (bool)",
                "event QuantumKeyRegistered(address indexed user, bytes32 keyHash)",
                "event QuantumSignatureVerified(uint256 indexed tradeId, address indexed signer)"
            ];

            if (this.config.contractAddress) {
                this.qrlContract = new ethers.Contract(
                    this.config.contractAddress,
                    minimalABI,
                    this.provider
                );
                logger.info('QRL contract initialized', { address: this.config.contractAddress });
            }
        } catch (error) {
            logger.error('Failed to initialize quantum auth middleware', error);
            if (!this.config.enableQuantumFallback) {
                throw error;
            }
        }
    }

    /**
     * Main middleware function for quantum authentication
     */
    middleware() {
        return async (req, res, next) => {
            try {
                // Extract authentication headers
                const authHeader = req.headers.authorization;
                const quantumSignature = req.headers['x-quantum-signature'];
                const quantumEntropy = req.headers['x-quantum-entropy'];

                if (!authHeader) {
                    return res.status(401).json({
                        error: 'Authorization header required',
                        code: 'MISSING_AUTH_HEADER'
                    });
                }

                // Verify JWT token first
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, this.config.jwtSecret);
                
                if (!decoded.address) {
                    return res.status(401).json({
                        error: 'User address not found in token',
                        code: 'INVALID_TOKEN'
                    });
                }

                req.user = decoded;

                // For quantum-secured endpoints, verify quantum signature
                if (this.isQuantumSecuredEndpoint(req.path)) {
                    const quantumVerification = await this.verifyQuantumSignature(
                        decoded.address,
                        req,
                        quantumSignature,
                        quantumEntropy
                    );

                    if (!quantumVerification.valid) {
                        return res.status(401).json({
                            error: 'Quantum signature verification failed',
                            code: 'QUANTUM_AUTH_FAILED',
                            details: quantumVerification.error
                        });
                    }

                    req.quantumAuth = quantumVerification;
                }

                next();
            } catch (error) {
                logger.error('Quantum authentication error', error);
                
                if (this.config.enableQuantumFallback && error.name === 'JsonWebTokenError') {
                    return res.status(401).json({
                        error: 'Authentication failed',
                        code: 'AUTH_FAILED'
                    });
                }

                res.status(500).json({
                    error: 'Internal authentication error',
                    code: 'INTERNAL_AUTH_ERROR'
                });
            }
        };
    }

    /**
     * Check if an endpoint requires quantum security
     */
    isQuantumSecuredEndpoint(path) {
        const quantumSecuredPaths = [
            '/api/v1/trades',
            '/api/v1/forecast',
            '/api/v1/quantum',
            '/api/v1/settlements'
        ];

        return quantumSecuredPaths.some(securePath => 
            path.startsWith(securePath)
        );
    }

    /**
     * Verify quantum signature for a request
     */
    async verifyQuantumSignature(userAddress, req, signature, entropy) {
        try {
            // Check if user has valid quantum key
            const quantumKey = await this.getQuantumKey(userAddress);
            
            if (!quantumKey.isActive) {
                return {
                    valid: false,
                    error: 'User quantum key is not active'
                };
            }

            if (quantumKey.expiresAt * 1000 < Date.now()) {
                return {
                    valid: false,
                    error: 'User quantum key has expired'
                };
            }

            // Check entropy uniqueness
            if (entropy && this.qrlContract) {
                const entropyUsed = await this.qrlContract.isQuantumEntropyUsed(entropy);
                if (entropyUsed) {
                    return {
                        valid: false,
                        error: 'Quantum entropy has already been used'
                    };
                }
            }

            // Verify signature (simplified for demo - in production would use actual post-quantum verification)
            if (signature) {
                const messageToSign = this.createMessageHash(req, userAddress, entropy);
                const isValidSignature = await this.verifyPostQuantumSignature(
                    messageToSign,
                    signature,
                    quantumKey.publicKey
                );

                if (!isValidSignature) {
                    return {
                        valid: false,
                        error: 'Invalid quantum signature'
                    };
                }
            }

            return {
                valid: true,
                quantumKey,
                entropy,
                signature
            };

        } catch (error) {
            logger.error('Quantum signature verification error', error);
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Get quantum key for a user (with caching)
     */
    async getQuantumKey(userAddress) {
        const cacheKey = `quantum_key_${userAddress}`;
        const cached = this.quantumKeyCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.data;
        }

        try {
            let quantumKey;

            if (this.qrlContract) {
                // Get from blockchain
                quantumKey = await this.qrlContract.getQuantumKey(userAddress);
            } else {
                // Fallback: mock quantum key for development
                quantumKey = {
                    keyHash: ethers.keccak256(ethers.toUtf8Bytes(userAddress)),
                    publicKey: ethers.hexlify(ethers.randomBytes(32)),
                    createdAt: Math.floor(Date.now() / 1000),
                    expiresAt: Math.floor((Date.now() + this.config.quantumKeyExpiry) / 1000),
                    isActive: true,
                    usageCount: 0
                };
            }

            // Cache the result
            this.quantumKeyCache.set(cacheKey, {
                data: quantumKey,
                timestamp: Date.now()
            });

            return quantumKey;
        } catch (error) {
            logger.error('Failed to get quantum key', { userAddress, error });
            throw error;
        }
    }

    /**
     * Create message hash for signing
     */
    createMessageHash(req, userAddress, entropy) {
        const message = {
            method: req.method,
            path: req.path,
            timestamp: Math.floor(Date.now() / 1000),
            userAddress,
            entropy: entropy || '',
            body: req.method !== 'GET' ? JSON.stringify(req.body) : ''
        };

        return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(message)));
    }

    /**
     * Verify post-quantum signature (simplified implementation)
     * In production, this would use actual post-quantum cryptography libraries
     */
    async verifyPostQuantumSignature(messageHash, signature, publicKey) {
        try {
            // Simplified verification - in reality would use Dilithium, Kyber, etc.
            const expectedSignature = ethers.keccak256(
                ethers.solidityPacked(['bytes32', 'bytes'], [messageHash, publicKey])
            );
            
            return ethers.keccak256(signature) === expectedSignature;
        } catch (error) {
            logger.error('Post-quantum signature verification failed', error);
            return false;
        }
    }

    /**
     * Generate quantum entropy using quantum service
     */
    async generateQuantumEntropy() {
        try {
            const response = await axios.get(`${this.config.quantumServiceUrl}/health`);
            
            if (response.data.quantum_available) {
                // If quantum service is available, use it for entropy
                const entropyResponse = await axios.post(`${this.config.quantumServiceUrl}/generate-entropy`);
                return entropyResponse.data.entropy;
            } else {
                // Fallback to pseudo-random entropy
                return ethers.keccak256(ethers.toUtf8Bytes(
                    `fallback_entropy_${Date.now()}_${Math.random()}`
                ));
            }
        } catch (error) {
            logger.warn('Failed to generate quantum entropy, using fallback', error);
            return ethers.keccak256(ethers.toUtf8Bytes(
                `fallback_entropy_${Date.now()}_${Math.random()}`
            ));
        }
    }

    /**
     * Validate quantum parameters for a request
     */
    validateQuantumParameters(req) {
        const errors = [];

        // Check required quantum headers for secured endpoints
        if (this.isQuantumSecuredEndpoint(req.path)) {
            if (!req.headers['x-quantum-signature']) {
                errors.push('Missing quantum signature header');
            }

            if (!req.headers['x-quantum-entropy']) {
                errors.push('Missing quantum entropy header');
            }
        }

        // Validate entropy format
        const entropy = req.headers['x-quantum-entropy'];
        if (entropy && !ethers.isHexString(entropy, 32)) {
            errors.push('Invalid quantum entropy format');
        }

        // Validate signature format
        const signature = req.headers['x-quantum-signature'];
        if (signature && !ethers.isHexString(signature)) {
            errors.push('Invalid quantum signature format');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Middleware for quantum parameter validation
     */
    validateQuantumMiddleware() {
        return (req, res, next) => {
            const validation = this.validateQuantumParameters(req);
            
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Invalid quantum parameters',
                    code: 'INVALID_QUANTUM_PARAMS',
                    details: validation.errors
                });
            }

            next();
        };
    }

    /**
     * Get middleware functions
     */
    getMiddleware() {
        return {
            auth: this.middleware(),
            validate: this.validateQuantumMiddleware(),
            // Combined middleware
            quantum: [this.validateQuantumMiddleware(), this.middleware()]
        };
    }
}

module.exports = {
    QuantumAuthMiddleware,
    createQuantumAuth: (config) => new QuantumAuthMiddleware(config)
};