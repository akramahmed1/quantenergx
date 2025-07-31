const request = require('supertest');
const express = require('express');
const derivativesRoutes = require('../../src/routes/derivatives');
const marginRoutes = require('../../src/routes/margin');
const settlementRoutes = require('../../src/routes/settlement');

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware
app.use((req, res, next) => {
  req.user = {
    id: 'test-user-id',
    role: 'trader',
    email: 'test@example.com'
  };
  next();
});

// Mount routes
app.use('/api/v1/derivatives', derivativesRoutes);
app.use('/api/v1/margin', marginRoutes);
app.use('/api/v1/settlement', settlementRoutes);

describe('Derivatives Integration Tests', () => {
  describe('Complete Derivatives Trading Workflow', () => {
    test('should create future contract, calculate margin, and settle', async () => {
      // Step 1: Create a future contract
      const futureResponse = await request(app)
        .post('/api/v1/derivatives/futures')
        .send({
          underlyingCommodity: 'crude_oil',
          notionalAmount: 1000000,
          deliveryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          settlementType: 'cash',
          region: 'US'
        })
        .expect(201);

      expect(futureResponse.body.success).toBe(true);
      expect(futureResponse.body.data.type).toBe('future');
      expect(futureResponse.body.data.marginRequirement).toBeGreaterThan(0);

      const contractId = futureResponse.body.data.id;

      // Step 2: Get portfolio margin
      const marginResponse = await request(app)
        .get('/api/v1/margin/portfolio?region=US')
        .expect(200);

      expect(marginResponse.body.success).toBe(true);
      expect(marginResponse.body.data.portfolioMargin).toBeDefined();

      // Step 3: Create settlement instruction
      const settlementResponse = await request(app)
        .post('/api/v1/settlement/instructions')
        .send({
          contractId: contractId,
          settlementType: 'cash',
          amount: 1000000,
          currency: 'USD',
          region: 'US'
        })
        .expect(201);

      expect(settlementResponse.body.success).toBe(true);
      expect(settlementResponse.body.data.status).toBe('pending');

      const settlementId = settlementResponse.body.data.id;

      // Step 4: Execute settlement
      const executionResponse = await request(app)
        .put(`/api/v1/settlement/instructions/${settlementId}/execute`)
        .expect(200);

      expect(executionResponse.body.success).toBe(true);
    });

    test('should create option contract and calculate Greeks', async () => {
      const optionResponse = await request(app)
        .post('/api/v1/derivatives/options')
        .send({
          underlyingCommodity: 'natural_gas',
          notionalAmount: 500000,
          optionType: 'call',
          strikePrice: 3.5,
          expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          exerciseStyle: 'american',
          region: 'US'
        })
        .expect(201);

      expect(optionResponse.body.success).toBe(true);
      expect(optionResponse.body.data.type).toBe('option');
      expect(optionResponse.body.data.optionType).toBe('call');
      expect(optionResponse.body.data.premium).toBeGreaterThan(0);
      expect(optionResponse.body.data.delta).toBeDefined();
      expect(optionResponse.body.data.gamma).toBeDefined();
      expect(optionResponse.body.data.theta).toBeDefined();
      expect(optionResponse.body.data.vega).toBeDefined();
    });

    test('should create swap contract with appropriate terms', async () => {
      const swapResponse = await request(app)
        .post('/api/v1/derivatives/swaps')
        .send({
          underlyingCommodity: 'natural_gas',
          notionalAmount: 2000000,
          swapType: 'commodity_swap',
          fixedRate: 3.25,
          floatingRateIndex: 'NYMEX_HENRY_HUB',
          paymentFrequency: 'quarterly',
          maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          region: 'US'
        })
        .expect(201);

      expect(swapResponse.body.success).toBe(true);
      expect(swapResponse.body.data.type).toBe('swap');
      expect(swapResponse.body.data.swapType).toBe('commodity_swap');
      expect(swapResponse.body.data.fixedRate).toBe(3.25);
      expect(swapResponse.body.data.paymentFrequency).toBe('quarterly');
    });

    test('should create structured note with custom payoff', async () => {
      const structuredNoteResponse = await request(app)
        .post('/api/v1/derivatives/structured-notes')
        .send({
          underlyingCommodity: 'crude_oil',
          notionalAmount: 1500000,
          noteType: 'autocall',
          principalProtection: 95,
          maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          payoffStructure: {
            autocallBarrier: 105,
            couponBarrier: 70,
            couponRate: 8.5,
            knockInBarrier: 60
          },
          region: 'US'
        })
        .expect(201);

      expect(structuredNoteResponse.body.success).toBe(true);
      expect(structuredNoteResponse.body.data.type).toBe('structured_note');
      expect(structuredNoteResponse.body.data.noteType).toBe('autocall');
      expect(structuredNoteResponse.body.data.principalProtection).toBe(95);
    });
  });

  describe('Multi-Region Derivatives Trading', () => {
    test('should create contracts in different regions with region-specific rules', async () => {
      // US contract
      const usResponse = await request(app)
        .post('/api/v1/derivatives/futures')
        .send({
          underlyingCommodity: 'crude_oil',
          notionalAmount: 1000000,
          deliveryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          region: 'US'
        })
        .expect(201);

      // EU contract
      const euResponse = await request(app)
        .post('/api/v1/derivatives/futures')
        .send({
          underlyingCommodity: 'crude_oil',
          notionalAmount: 1000000,
          deliveryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          region: 'EU'
        })
        .expect(201);

      expect(usResponse.body.data.region).toBe('US');
      expect(euResponse.body.data.region).toBe('EU');

      // Margin requirements might differ by region
      expect(usResponse.body.data.marginRequirement).toBeGreaterThan(0);
      expect(euResponse.body.data.marginRequirement).toBeGreaterThan(0);
    });

    test('should get region-specific margin rules', async () => {
      const usRulesResponse = await request(app)
        .get('/api/v1/margin/rules/US')
        .expect(200);

      const euRulesResponse = await request(app)
        .get('/api/v1/margin/rules/EU')
        .expect(200);

      expect(usRulesResponse.body.data.region).toBe('US');
      expect(euRulesResponse.body.data.region).toBe('EU');

      // US typically has higher initial margin rates
      expect(usRulesResponse.body.data.defaultInitialMarginRate)
        .toBeGreaterThan(euRulesResponse.body.data.defaultInitialMarginRate);
    });

    test('should get region-specific settlement rules', async () => {
      const usSettlementRules = await request(app)
        .get('/api/v1/settlement/rules/US')
        .expect(200);

      const euSettlementRules = await request(app)
        .get('/api/v1/settlement/rules/EU')
        .expect(200);

      expect(usSettlementRules.body.data.standardSettlementPeriod).toBe(2); // T+2
      expect(euSettlementRules.body.data.standardSettlementPeriod).toBe(1); // T+1
    });
  });

  describe('Margin Management Workflow', () => {
    test('should calculate portfolio margin for multiple contracts', async () => {
      // Create multiple contracts
      await request(app)
        .post('/api/v1/derivatives/futures')
        .send({
          underlyingCommodity: 'crude_oil',
          notionalAmount: 500000,
          deliveryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          region: 'US'
        })
        .expect(201);

      await request(app)
        .post('/api/v1/derivatives/options')
        .send({
          underlyingCommodity: 'natural_gas',
          notionalAmount: 300000,
          optionType: 'put',
          strikePrice: 3.0,
          expirationDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          region: 'US'
        })
        .expect(201);

      // Get portfolio margin
      const portfolioResponse = await request(app)
        .get('/api/v1/margin/portfolio?region=US')
        .expect(200);

      expect(portfolioResponse.body.data.portfolioMargin.totalInitialMargin).toBeGreaterThan(0);
      expect(portfolioResponse.body.data.portfolioMargin.totalMaintenanceMargin).toBeGreaterThan(0);
    });

    test('should calculate margin for hypothetical contract', async () => {
      const marginCalcResponse = await request(app)
        .post('/api/v1/margin/calculate')
        .send({
          contractType: 'future',
          underlyingCommodity: 'heating_oil',
          notionalAmount: 750000,
          region: 'US'
        })
        .expect(200);

      expect(marginCalcResponse.body.data.initialMargin).toBeGreaterThan(0);
      expect(marginCalcResponse.body.data.contractType).toBe('future');
      expect(marginCalcResponse.body.data.underlyingCommodity).toBe('heating_oil');
    });

    test('should update collateral and check margin status', async () => {
      // Update collateral
      const collateralResponse = await request(app)
        .put('/api/v1/margin/collateral')
        .send({
          cash: 150000,
          securities: 50000,
          region: 'US'
        })
        .expect(200);

      expect(collateralResponse.body.data.cash).toBe(150000);
      expect(collateralResponse.body.data.securities).toBe(50000);

      // Get margin status
      const statusResponse = await request(app)
        .get('/api/v1/margin/collateral?region=US')
        .expect(200);

      expect(statusResponse.body.data.marginStatus).toBeDefined();
    });
  });

  describe('Settlement Workflow Management', () => {
    test('should create and track settlement workflow', async () => {
      // Create a contract first
      const contractResponse = await request(app)
        .post('/api/v1/derivatives/futures')
        .send({
          underlyingCommodity: 'gasoline',
          notionalAmount: 800000,
          deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          region: 'US'
        })
        .expect(201);

      const contractId = contractResponse.body.data.id;

      // Create settlement instruction
      const settlementResponse = await request(app)
        .post('/api/v1/settlement/instructions')
        .send({
          contractId: contractId,
          settlementType: 'physical',
          amount: 800000,
          deliveryInstructions: {
            location: 'New York Harbor',
            recipient: 'Test Energy Corp'
          },
          region: 'US'
        })
        .expect(201);

      const settlementId = settlementResponse.body.data.id;

      // Get settlement details
      const detailsResponse = await request(app)
        .get(`/api/v1/settlement/instructions/${settlementId}`)
        .expect(200);

      expect(detailsResponse.body.data.instruction.settlementType).toBe('physical');
      expect(detailsResponse.body.data.workflow).toBeDefined();
      expect(detailsResponse.body.data.workflow.steps.length).toBeGreaterThan(0);

      // Check workflow has physical settlement steps
      const stepNames = detailsResponse.body.data.workflow.steps.map(step => step.name);
      expect(stepNames).toContain('delivery_scheduling');
      expect(stepNames).toContain('quality_inspection');
    });

    test('should cancel settlement instruction', async () => {
      // Create a contract and settlement
      const contractResponse = await request(app)
        .post('/api/v1/derivatives/futures')
        .send({
          underlyingCommodity: 'natural_gas',
          notionalAmount: 400000,
          deliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          region: 'US'
        })
        .expect(201);

      const settlementResponse = await request(app)
        .post('/api/v1/settlement/instructions')
        .send({
          contractId: contractResponse.body.data.id,
          settlementType: 'cash',
          amount: 400000,
          region: 'US'
        })
        .expect(201);

      const settlementId = settlementResponse.body.data.id;

      // Cancel settlement
      const cancelResponse = await request(app)
        .put(`/api/v1/settlement/instructions/${settlementId}/cancel`)
        .send({
          reason: 'changed_requirements'
        })
        .expect(200);

      expect(cancelResponse.body.data.status).toBe('cancelled');
      expect(cancelResponse.body.data.cancellationReason).toBe('changed_requirements');
    });

    test('should filter user settlements by criteria', async () => {
      // Create settlements of different types
      const contractResponse = await request(app)
        .post('/api/v1/derivatives/futures')
        .send({
          underlyingCommodity: 'renewable_certificates',
          notionalAmount: 200000,
          deliveryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          region: 'EU'
        })
        .expect(201);

      await request(app)
        .post('/api/v1/settlement/instructions')
        .send({
          contractId: contractResponse.body.data.id,
          settlementType: 'cash',
          amount: 200000,
          region: 'EU'
        })
        .expect(201);

      // Get settlements with filters
      const settlementsResponse = await request(app)
        .get('/api/v1/settlement/instructions?region=EU&settlementType=cash&page=1&limit=10')
        .expect(200);

      expect(settlementsResponse.body.data.instructions).toBeDefined();
      expect(settlementsResponse.body.data.pagination).toBeDefined();
      expect(settlementsResponse.body.data.pagination.page).toBe(1);
      expect(settlementsResponse.body.data.pagination.limit).toBe(10);
    });
  });

  describe('Contract Management', () => {
    test('should retrieve and filter user contracts', async () => {
      // Create multiple contracts
      await request(app)
        .post('/api/v1/derivatives/futures')
        .send({
          underlyingCommodity: 'coal',
          notionalAmount: 600000,
          deliveryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
          region: 'APAC'
        })
        .expect(201);

      await request(app)
        .post('/api/v1/derivatives/options')
        .send({
          underlyingCommodity: 'electricity',
          notionalAmount: 300000,
          optionType: 'call',
          strikePrice: 45,
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          region: 'APAC'
        })
        .expect(201);

      // Get contracts with filters
      const contractsResponse = await request(app)
        .get('/api/v1/derivatives/contracts?region=APAC&type=future&status=active')
        .expect(200);

      expect(contractsResponse.body.data.contracts).toBeDefined();
      expect(contractsResponse.body.data.pagination).toBeDefined();
      
      // Check that filtering works
      const contracts = contractsResponse.body.data.contracts;
      contracts.forEach(contract => {
        expect(contract.region).toBe('APAC');
        expect(contract.type).toBe('future');
        expect(contract.status).toBe('active');
      });
    });

    test('should terminate contract', async () => {
      const contractResponse = await request(app)
        .post('/api/v1/derivatives/futures')
        .send({
          underlyingCommodity: 'carbon_credits',
          notionalAmount: 100000,
          deliveryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          region: 'EU'
        })
        .expect(201);

      const contractId = contractResponse.body.data.id;

      const terminateResponse = await request(app)
        .put(`/api/v1/derivatives/contracts/${contractId}/terminate`)
        .send({
          reason: 'portfolio_rebalancing'
        })
        .expect(200);

      expect(terminateResponse.body.data.status).toBe('terminated');
    });
  });

  describe('Market Data Integration', () => {
    test('should get market data for derivatives', async () => {
      const marketDataResponse = await request(app)
        .get('/api/v1/derivatives/market-data/crude_oil?region=US')
        .expect(200);

      expect(marketDataResponse.body.data.commodity).toBe('crude_oil');
      expect(marketDataResponse.body.data.spot).toBeGreaterThan(0);
      expect(marketDataResponse.body.data.volatility).toBeGreaterThan(0);
      expect(marketDataResponse.body.data.derivatives).toBeDefined();
      expect(marketDataResponse.body.data.derivatives.impliedVolatility).toBeDefined();
    });
  });

  describe('Error Handling and Validation', () => {
    test('should validate contract parameters', async () => {
      const invalidResponse = await request(app)
        .post('/api/v1/derivatives/futures')
        .send({
          underlyingCommodity: 'invalid_commodity',
          notionalAmount: 500, // Below minimum
          deliveryDate: 'invalid-date',
          region: 'INVALID_REGION'
        })
        .expect(400);

      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.error).toBe('Validation failed');
      expect(invalidResponse.body.details).toBeDefined();
    });

    test('should handle non-existent contract retrieval', async () => {
      const invalidId = '123e4567-e89b-12d3-a456-426614174999';
      
      await request(app)
        .get(`/api/v1/derivatives/contracts/${invalidId}`)
        .expect(404);
    });

    test('should validate settlement parameters', async () => {
      const invalidSettlementResponse = await request(app)
        .post('/api/v1/settlement/instructions')
        .send({
          contractId: 'invalid-uuid',
          settlementType: 'invalid_type',
          amount: -1000,
          currency: 'INVALID'
        })
        .expect(400);

      expect(invalidSettlementResponse.body.success).toBe(false);
    });

    test('should validate margin calculation parameters', async () => {
      const invalidMarginResponse = await request(app)
        .post('/api/v1/margin/calculate')
        .send({
          contractType: 'invalid_type',
          underlyingCommodity: '',
          notionalAmount: -5000
        })
        .expect(400);

      expect(invalidMarginResponse.body.success).toBe(false);
    });
  });

  describe('Performance and Pagination', () => {
    test('should handle large contract lists with pagination', async () => {
      // Create multiple contracts for pagination testing
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/v1/derivatives/futures')
            .send({
              underlyingCommodity: 'crude_oil',
              notionalAmount: 100000 + i * 10000,
              deliveryDate: new Date(Date.now() + (30 + i) * 24 * 60 * 60 * 1000).toISOString(),
              region: 'US'
            })
        );
      }

      await Promise.all(promises);

      // Test pagination
      const page1Response = await request(app)
        .get('/api/v1/derivatives/contracts?page=1&limit=3')
        .expect(200);

      expect(page1Response.body.data.pagination.page).toBe(1);
      expect(page1Response.body.data.pagination.limit).toBe(3);
      expect(page1Response.body.data.contracts.length).toBeLessThanOrEqual(3);
    });
  });
});