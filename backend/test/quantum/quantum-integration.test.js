/**
 * @title Quantum Integration Tests
 * @description Tests for quantum forecasting and blockchain integration
 */

const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Import the modules under test
const { QuantumService } = require('../../src/services/quantumService');
const { QuantumAuthMiddleware } = require('../../src/middleware/quantumAuth');

describe('Quantum Integration Tests', function () {
    let quantumService;
    let authMiddleware;
    let axiosStub;
    let jwtToken;

    before(function () {
        // Create JWT token for testing
        jwtToken = jwt.sign(
            { address: '0x1234567890123456789012345678901234567890', userId: 1 },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    beforeEach(function () {
        // Initialize services
        quantumService = new QuantumService({
            quantumServiceUrl: 'http://localhost:5000',
            enableFallback: true,
            retryAttempts: 1
        });

        authMiddleware = new QuantumAuthMiddleware({
            quantumServiceUrl: 'http://localhost:5000',
            jwtSecret: process.env.JWT_SECRET || 'test-secret',
            enableQuantumFallback: true
        });

        // Stub axios for quantum service calls
        axiosStub = sinon.stub(axios, 'request').resolves({
            status: 200,
            data: {
                quantum_available: true,
                service: 'quantum_lstm_forecaster'
            }
        });

        sinon.stub(axios, 'get').resolves({
            status: 200,
            data: {
                status: 'healthy',
                quantum_available: true,
                service: 'quantum_lstm_forecaster'
            }
        });

        sinon.stub(axios, 'post').resolves({
            status: 200,
            data: {
                success: true,
                forecast: {
                    predictions: [50.1, 50.5, 49.8, 51.2],
                    hours_ahead: 4,
                    model_type: 'quantum_lstm',
                    timestamp: new Date().toISOString(),
                    confidence_interval: {
                        lower: [49.0, 49.4, 48.7, 50.1],
                        upper: [51.2, 51.6, 50.9, 52.3],
                        confidence: 0.95
                    }
                }
            }
        });
    });

    afterEach(function () {
        sinon.restore();
    });

    describe('QuantumService', function () {
        describe('generateForecast', function () {
            it('should generate quantum forecast successfully', async function () {
                const params = {
                    commodity: 'oil',
                    historical_data: generateSampleData(50),
                    hours_ahead: 24,
                    model_type: 'quantum_lstm',
                    user_address: '0x1234567890123456789012345678901234567890'
                };

                const forecast = await quantumService.generateForecast(params);

                expect(forecast).to.have.property('predictions');
                expect(forecast).to.have.property('model_type');
                expect(forecast).to.have.property('confidence_interval');
                expect(forecast).to.have.property('metadata');
                expect(forecast.metadata.quantum_enhanced).to.be.true;
                expect(forecast.predictions).to.have.length.greaterThan(0);
            });

            it('should fallback to classical forecast when quantum fails', async function () {
                // Make quantum service fail
                axios.post.restore();
                sinon.stub(axios, 'post').rejects(new Error('Quantum service unavailable'));

                const params = {
                    commodity: 'oil',
                    historical_data: generateSampleData(50),
                    hours_ahead: 24,
                    model_type: 'quantum_lstm',
                    user_address: '0x1234567890123456789012345678901234567890'
                };

                const forecast = await quantumService.generateForecast(params);

                expect(forecast).to.have.property('predictions');
                expect(forecast.model_type).to.equal('classical_fallback');
                expect(forecast.predictions).to.have.length(24);
            });

            it('should validate input parameters', async function () {
                const invalidParams = {
                    commodity: 'invalid_commodity',
                    historical_data: [], // Empty array
                    hours_ahead: 200, // Too many hours
                    user_address: '0x1234567890123456789012345678901234567890'
                };

                try {
                    await quantumService.generateForecast(invalidParams);
                    expect.fail('Should have thrown validation error');
                } catch (error) {
                    expect(error.message).to.include('Invalid commodity');
                }
            });

            it('should handle different commodity types', async function () {
                const commodities = ['oil', 'natural_gas', 'electricity', 'renewable_energy', 'carbon_credit'];

                for (const commodity of commodities) {
                    const params = {
                        commodity,
                        historical_data: generateSampleData(30),
                        hours_ahead: 12,
                        user_address: '0x1234567890123456789012345678901234567890'
                    };

                    const forecast = await quantumService.generateForecast(params);
                    expect(forecast.metadata.commodity).to.equal(commodity);
                }
            });
        });

        describe('runBenchmark', function () {
            it('should run quantum vs classical benchmark', async function () {
                // Mock benchmark response
                axios.post.restore();
                sinon.stub(axios, 'post').resolves({
                    status: 200,
                    data: {
                        success: true,
                        benchmark_results: {
                            classical_lstm: {
                                mse: 0.0245,
                                mae: 0.1234,
                                rmse: 0.1565
                            },
                            quantum_lstm: {
                                mse: 0.0231,
                                mae: 0.1198,
                                rmse: 0.1520
                            },
                            improvement_percentage: 5.7,
                            quantum_advantage: true
                        }
                    }
                });

                const params = {
                    test_data: generateSampleData(100),
                    epochs: 20,
                    user_address: '0x1234567890123456789012345678901234567890'
                };

                const benchmark = await quantumService.runBenchmark(params);

                expect(benchmark).to.have.property('classical_lstm');
                expect(benchmark).to.have.property('quantum_lstm');
                expect(benchmark).to.have.property('improvement_percentage');
                expect(benchmark).to.have.property('quantum_advantage');
                expect(benchmark.quantum_advantage).to.be.true;
                expect(benchmark.improvement_percentage).to.be.greaterThan(0);
            });
        });

        describe('checkHealth', function () {
            it('should return healthy status when quantum service is available', async function () {
                const health = await quantumService.checkHealth();

                expect(health).to.have.property('status', 'healthy');
                expect(health).to.have.property('quantum_available', true);
                expect(health).to.have.property('classical_fallback');
                expect(health).to.have.property('last_check');
            });

            it('should return unavailable status when quantum service fails', async function () {
                axios.get.restore();
                sinon.stub(axios, 'get').rejects(new Error('Service unavailable'));

                const health = await quantumService.checkHealth();

                expect(health).to.have.property('status', 'unavailable');
                expect(health).to.have.property('quantum_available', false);
                expect(health).to.have.property('error');
            });
        });

        describe('generateEntropy', function () {
            it('should generate quantum entropy', async function () {
                const userAddress = '0x1234567890123456789012345678901234567890';
                const entropy = await quantumService.generateEntropy(userAddress);

                expect(entropy).to.have.property('entropy');
                expect(entropy).to.have.property('quality_score');
                expect(entropy).to.have.property('source');
                expect(entropy).to.have.property('timestamp');
                expect(entropy.quality_score).to.be.a('number');
                expect(entropy.quality_score).to.be.at.least(0);
                expect(entropy.quality_score).to.be.at.most(1);
            });
        });

        describe('metrics tracking', function () {
            it('should track performance metrics', async function () {
                const params = {
                    commodity: 'oil',
                    historical_data: generateSampleData(30),
                    hours_ahead: 12,
                    user_address: '0x1234567890123456789012345678901234567890'
                };

                await quantumService.generateForecast(params);

                const metrics = quantumService.getMetrics();
                expect(metrics).to.have.property('requests');
                expect(metrics).to.have.property('successes');
                expect(metrics).to.have.property('failures');
                expect(metrics).to.have.property('avgResponseTime');
                expect(metrics).to.have.property('successRate');
                expect(metrics.requests).to.be.greaterThan(0);
            });
        });
    });

    describe('QuantumAuthMiddleware', function () {
        let mockReq, mockRes, nextSpy;

        beforeEach(function () {
            mockReq = {
                headers: {
                    authorization: `Bearer ${jwtToken}`,
                    'x-quantum-signature': '0x1234567890abcdef',
                    'x-quantum-entropy': '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
                },
                path: '/api/v1/forecast',
                method: 'POST',
                body: { test: 'data' }
            };

            mockRes = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            nextSpy = sinon.spy();
        });

        describe('middleware function', function () {
            it('should authenticate valid JWT token', async function () {
                mockReq.path = '/api/v1/users'; // Non-quantum secured endpoint

                const middleware = authMiddleware.middleware();
                await middleware(mockReq, mockRes, nextSpy);

                expect(nextSpy.calledOnce).to.be.true;
                expect(mockReq.user).to.have.property('address');
            });

            it('should reject missing authorization header', async function () {
                delete mockReq.headers.authorization;

                const middleware = authMiddleware.middleware();
                await middleware(mockReq, mockRes, nextSpy);

                expect(mockRes.status.calledWith(401)).to.be.true;
                expect(mockRes.json.calledWith({
                    error: 'Authorization header required',
                    code: 'MISSING_AUTH_HEADER'
                })).to.be.true;
                expect(nextSpy.called).to.be.false;
            });

            it('should verify quantum signature for secured endpoints', async function () {
                // Mock quantum key retrieval
                sinon.stub(authMiddleware, 'getQuantumKey').resolves({
                    isActive: true,
                    expiresAt: Math.floor(Date.now() / 1000) + 3600,
                    publicKey: '0xabcdef',
                    usageCount: 5
                });

                const middleware = authMiddleware.middleware();
                await middleware(mockReq, mockRes, nextSpy);

                expect(nextSpy.calledOnce).to.be.true;
                expect(mockReq.quantumAuth).to.be.an('object');
            });

            it('should reject expired quantum keys', async function () {
                sinon.stub(authMiddleware, 'getQuantumKey').resolves({
                    isActive: true,
                    expiresAt: Math.floor(Date.now() / 1000) - 3600, // Expired
                    publicKey: '0xabcdef',
                    usageCount: 5
                });

                const middleware = authMiddleware.middleware();
                await middleware(mockReq, mockRes, nextSpy);

                expect(mockRes.status.calledWith(401)).to.be.true;
                expect(nextSpy.called).to.be.false;
            });
        });

        describe('quantum parameter validation', function () {
            it('should validate quantum parameters correctly', function () {
                const validation = authMiddleware.validateQuantumParameters(mockReq);

                expect(validation).to.have.property('valid', true);
                expect(validation).to.have.property('errors');
                expect(validation.errors).to.be.an('array').that.is.empty;
            });

            it('should reject invalid quantum entropy format', function () {
                mockReq.headers['x-quantum-entropy'] = 'invalid_hex';

                const validation = authMiddleware.validateQuantumParameters(mockReq);

                expect(validation.valid).to.be.false;
                expect(validation.errors).to.include('Invalid quantum entropy format');
            });

            it('should require quantum headers for secured endpoints', function () {
                delete mockReq.headers['x-quantum-signature'];
                delete mockReq.headers['x-quantum-entropy'];

                const validation = authMiddleware.validateQuantumParameters(mockReq);

                expect(validation.valid).to.be.false;
                expect(validation.errors).to.include.members([
                    'Missing quantum signature header',
                    'Missing quantum entropy header'
                ]);
            });
        });

        describe('isQuantumSecuredEndpoint', function () {
            it('should identify quantum-secured endpoints correctly', function () {
                const securedPaths = [
                    '/api/v1/trades',
                    '/api/v1/forecast',
                    '/api/v1/quantum',
                    '/api/v1/settlements'
                ];

                const nonSecuredPaths = [
                    '/api/v1/users',
                    '/api/v1/health',
                    '/api/v1/public'
                ];

                securedPaths.forEach(path => {
                    expect(authMiddleware.isQuantumSecuredEndpoint(path)).to.be.true;
                });

                nonSecuredPaths.forEach(path => {
                    expect(authMiddleware.isQuantumSecuredEndpoint(path)).to.be.false;
                });
            });
        });
    });

    describe('Integration scenarios', function () {
        it('should handle complete quantum forecast workflow', async function () {
            // Simulate full workflow: auth -> forecast -> response
            const params = {
                commodity: 'oil',
                historical_data: generateSampleData(48),
                hours_ahead: 24,
                model_type: 'quantum_lstm',
                user_address: '0x1234567890123456789012345678901234567890'
            };

            // Test authentication
            const mockReq = {
                headers: {
                    authorization: `Bearer ${jwtToken}`,
                    'x-quantum-signature': '0x1234567890abcdef',
                    'x-quantum-entropy': '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
                },
                path: '/api/v1/forecast',
                method: 'POST',
                body: params
            };

            const mockRes = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const nextSpy = sinon.spy();

            // Mock quantum key
            sinon.stub(authMiddleware, 'getQuantumKey').resolves({
                isActive: true,
                expiresAt: Math.floor(Date.now() / 1000) + 3600,
                publicKey: '0xabcdef',
                usageCount: 5
            });

            // Test middleware
            const middleware = authMiddleware.middleware();
            await middleware(mockReq, mockRes, nextSpy);

            expect(nextSpy.calledOnce).to.be.true;
            expect(mockReq.user).to.have.property('address');
            expect(mockReq.quantumAuth).to.be.an('object');

            // Test forecast generation
            const forecast = await quantumService.generateForecast(params);
            expect(forecast).to.have.property('predictions');
            expect(forecast.metadata.quantum_enhanced).to.be.true;
        });

        it('should handle quantum service unavailable scenario', async function () {
            // Make all quantum services fail
            axios.get.restore();
            axios.post.restore();
            sinon.stub(axios, 'get').rejects(new Error('Service unavailable'));
            sinon.stub(axios, 'post').rejects(new Error('Service unavailable'));

            const params = {
                commodity: 'natural_gas',
                historical_data: generateSampleData(30),
                hours_ahead: 12,
                user_address: '0x1234567890123456789012345678901234567890'
            };

            // Should still work with fallback
            const forecast = await quantumService.generateForecast(params);
            expect(forecast).to.have.property('predictions');
            expect(forecast.model_type).to.equal('classical_fallback');

            // Health check should show unavailable
            const health = await quantumService.checkHealth();
            expect(health.status).to.equal('unavailable');
            expect(health.quantum_available).to.be.false;
        });

        it('should demonstrate quantum advantage in benchmark', async function () {
            // Mock a scenario where quantum shows clear advantage
            axios.post.restore();
            sinon.stub(axios, 'post').resolves({
                status: 200,
                data: {
                    success: true,
                    benchmark_results: {
                        classical_lstm: {
                            mse: 0.0350,
                            mae: 0.1500,
                            rmse: 0.1871
                        },
                        quantum_lstm: {
                            mse: 0.0280,
                            mae: 0.1200,
                            rmse: 0.1673
                        },
                        improvement_percentage: 20.0,
                        quantum_advantage: true
                    }
                }
            });

            const params = {
                test_data: generateSampleData(100),
                epochs: 50,
                user_address: '0x1234567890123456789012345678901234567890'
            };

            const benchmark = await quantumService.runBenchmark(params);

            // Verify quantum advantage
            expect(benchmark.quantum_advantage).to.be.true;
            expect(benchmark.improvement_percentage).to.be.greaterThan(15);
            expect(benchmark.quantum_lstm.mse).to.be.lessThan(benchmark.classical_lstm.mse);
            expect(benchmark.quantum_lstm.mae).to.be.lessThan(benchmark.classical_lstm.mae);
            expect(benchmark.quantum_lstm.rmse).to.be.lessThan(benchmark.classical_lstm.rmse);
        });
    });

    describe('Performance requirements', function () {
        it('should meet response time requirements', async function () {
            const startTime = Date.now();

            const params = {
                commodity: 'electricity',
                historical_data: generateSampleData(24),
                hours_ahead: 6,
                user_address: '0x1234567890123456789012345678901234567890'
            };

            await quantumService.generateForecast(params);

            const responseTime = Date.now() - startTime;
            expect(responseTime).to.be.lessThan(5000); // Should complete within 5 seconds
        });

        it('should handle high concurrency', async function () {
            const promises = [];
            const numRequests = 10;

            for (let i = 0; i < numRequests; i++) {
                const params = {
                    commodity: 'oil',
                    historical_data: generateSampleData(30),
                    hours_ahead: 12,
                    user_address: `0x123456789012345678901234567890123456789${i}`
                };

                promises.push(quantumService.generateForecast(params));
            }

            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled').length;

            expect(successful).to.be.greaterThan(numRequests * 0.8); // At least 80% success rate
        });
    });

    // Helper function to generate sample data
    function generateSampleData(count) {
        const data = [];
        let price = 50.0;

        for (let i = 0; i < count; i++) {
            // Add some realistic variation
            price *= (1 + (Math.random() - 0.5) * 0.02);

            data.push({
                timestamp: new Date(Date.now() - (count - i) * 60 * 60 * 1000).toISOString(),
                price: price,
                volume: 1000 + Math.random() * 500,
                volatility: 0.05 + Math.random() * 0.1,
                demand: 800 + Math.random() * 200
            });
        }

        return data;
    }
});