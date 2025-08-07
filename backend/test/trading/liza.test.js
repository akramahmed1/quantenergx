const LizaTradingService = require('../../src/services/trading/liza');

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('LizaTradingService - Guyana Region Tests', () => {
  let lizaService;

  beforeEach(() => {
    jest.clearAllMocks();
    lizaService = new LizaTradingService({
      baseUrl: 'https://test-api.guyanaenergy.gov.gy/v1',
      apiKey: 'test-api-key',
      refreshInterval: 1000, // 1 second for testing
      cacheTimeout: 5000, // 5 seconds for testing
    });
  });

  afterEach(() => {
    if (lizaService) {
      lizaService.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize with correct Guyana-specific configuration', () => {
      expect(lizaService.config.baseUrl).toContain('guyanaenergy.gov.gy');
      expect(lizaService.config.apiKey).toBe('test-api-key');
      expect(lizaService.config.refreshInterval).toBe(1000);
      expect(lizaService.cache).toBeDefined();
      expect(lizaService.isPolling).toBe(false);
    });

    test('should load initial cache with mock Liza crude data', () => {
      const cachedPrice = lizaService.getCachedPrice('current');
      expect(cachedPrice).toBeDefined();
      expect(cachedPrice.price).toBe(78.50);
      expect(cachedPrice.api_differential).toBe(-3.5);
      expect(cachedPrice.sulfur_content).toBe(0.4);
      expect(cachedPrice.source).toBe('cache');
    });
  });

  describe('Live Price Polling', () => {
    test('should start and stop live pricing successfully', () => {
      expect(lizaService.isPolling).toBe(false);
      
      lizaService.startLivePricing();
      expect(lizaService.isPolling).toBe(true);
      
      lizaService.stopLivePricing();
      expect(lizaService.isPolling).toBe(false);
    });

    test('should emit polling events correctly', (done) => {
      let eventsReceived = [];
      
      lizaService.on('polling_started', () => {
        eventsReceived.push('polling_started');
      });
      
      lizaService.on('polling_stopped', () => {
        eventsReceived.push('polling_stopped');
        expect(eventsReceived).toEqual(['polling_started', 'polling_stopped']);
        done();
      });

      lizaService.startLivePricing();
      setTimeout(() => {
        lizaService.stopLivePricing();
      }, 100);
    });

    test('should handle API errors and emit error events', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      const errorPromise = new Promise((resolve) => {
        lizaService.on('fetch_error', (error) => {
          expect(error.message).toBe('API Error');
          resolve();
        });
      });

      await lizaService.fetchLivePrices();
      await errorPromise;
    });
  });

  describe('Current Price Retrieval', () => {
    test('should return live data when API is available', async () => {
      const mockApiResponse = {
        data: {
          price: 82.50,
          volume: 750000,
          timestamp: new Date().toISOString(),
          api_differential: -2.8,
          sulfur_content: 0.35,
        },
      };

      axios.get.mockResolvedValueOnce(mockApiResponse);

      const result = await lizaService.getCurrentPrice();
      
      expect(result.success).toBe(true);
      expect(result.data.price).toBe(82.50);
      expect(result.data.api_differential).toBe(-2.8);
      expect(result.data.sulfur_content).toBe(0.35);
      expect(result.data.source).toBe('live');
    });

    test('should fallback to cache when API is unavailable', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));

      const result = await lizaService.getCurrentPrice();
      
      expect(result.success).toBe(true);
      expect(result.data.source).toBe('cache');
      expect(result.message).toContain('cached data');
    });

    test('should return error when both API and cache are unavailable', async () => {
      // Clear cache
      lizaService.cache.clear();
      
      // Mock API failure
      axios.get.mockRejectedValue(new Error('Network Error'));

      const result = await lizaService.getCurrentPrice();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No current price data available');
    });
  });

  describe('Historical Price Retrieval', () => {
    test('should fetch historical prices for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');
      
      const mockApiResponse = {
        data: {
          prices: [
            {
              price: 80.25,
              volume: 600000,
              timestamp: new Date('2024-01-01').toISOString(),
              api_differential: -3.2,
              sulfur_content: 0.4,
            },
            {
              price: 81.50,
              volume: 650000,
              timestamp: new Date('2024-01-02').toISOString(),
              api_differential: -2.9,
              sulfur_content: 0.38,
            },
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockApiResponse);

      const result = await lizaService.getHistoricalPrices(startDate, endDate);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].price).toBe(80.25);
      expect(result.data[1].price).toBe(81.50);
      
      // Verify API call parameters
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/liza/prices/historical'),
        expect.objectContaining({
          params: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
          },
        })
      );
    });

    test('should handle historical data API errors', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');
      
      axios.get.mockRejectedValueOnce(new Error('Historical API Error'));

      const result = await lizaService.getHistoricalPrices(startDate, endDate);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Historical API Error');
    });

    test('should return error when API key is not configured', async () => {
      const serviceWithoutKey = new LizaTradingService({ apiKey: '' });
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const result = await serviceWithoutKey.getHistoricalPrices(startDate, endDate);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('API key not configured');
    });
  });

  describe('Pricing Differential Calculation', () => {
    test('should calculate Liza-Brent differential correctly', async () => {
      // Mock current price fetch
      const mockApiResponse = {
        data: {
          price: 80.50,
          volume: 650000,
          timestamp: new Date().toISOString(),
          api_differential: -3.0,
        },
      };

      axios.get.mockResolvedValueOnce(mockApiResponse);

      const result = await lizaService.getPricingDifferential();
      
      expect(result.success).toBe(true);
      expect(result.data.differential).toBe(80.50 - 85.50); // -5.00
      expect(result.data.benchmark).toBe('Brent');
      expect(result.data.timestamp).toBeInstanceOf(Date);
    });

    test('should handle differential calculation when price unavailable', async () => {
      axios.get.mockRejectedValue(new Error('Price unavailable'));
      lizaService.cache.clear(); // Remove cache fallback

      const result = await lizaService.getPricingDifferential();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unable to get current Liza price');
    });
  });

  describe('Guyana Regulatory Compliance', () => {
    test('should validate compliant trade data', () => {
      const validTrade = {
        quantity: 50000, // 50,000 barrels
        price: 82.50,
        counterparty: 'Shell Trading',
        delivery_location: 'Liza Destiny FPSO',
      };

      const result = lizaService.validateTradeCompliance(validTrade);
      
      expect(result.success).toBe(true);
      expect(result.data.compliant).toBe(true);
      expect(result.data.violations).toHaveLength(0);
    });

    test('should identify minimum quantity violation', () => {
      const invalidTrade = {
        quantity: 500, // Below 1,000 minimum
        price: 82.50,
        counterparty: 'Test Trader',
        delivery_location: 'Georgetown',
      };

      const result = lizaService.validateTradeCompliance(invalidTrade);
      
      expect(result.success).toBe(true);
      expect(result.data.compliant).toBe(false);
      expect(result.data.violations).toContain('Minimum trade quantity is 1,000 barrels');
    });

    test('should identify maximum quantity violation', () => {
      const invalidTrade = {
        quantity: 150000, // Above 100,000 maximum
        price: 82.50,
        counterparty: 'Large Trader',
        delivery_location: 'Liza Unity FPSO',
      };

      const result = lizaService.validateTradeCompliance(invalidTrade);
      
      expect(result.success).toBe(true);
      expect(result.data.compliant).toBe(false);
      expect(result.data.violations).toContain('Maximum trade quantity is 100,000 barrels per transaction');
    });

    test('should validate Guyana delivery locations', () => {
      const validLocations = [
        'Georgetown',
        'Liza Destiny FPSO',
        'Liza Unity FPSO',
        'Payara FPSO',
        'Prosperity FPSO',
      ];

      validLocations.forEach(location => {
        const trade = {
          quantity: 10000,
          price: 82.50,
          counterparty: 'Test Trader',
          delivery_location: location,
        };

        const result = lizaService.validateTradeCompliance(trade);
        expect(result.data.compliant).toBe(true);
      });
    });

    test('should reject invalid delivery locations', () => {
      const invalidTrade = {
        quantity: 10000,
        price: 82.50,
        counterparty: 'Test Trader',
        delivery_location: 'Houston', // Not a valid Guyana location
      };

      const result = lizaService.validateTradeCompliance(invalidTrade);
      
      expect(result.success).toBe(true);
      expect(result.data.compliant).toBe(false);
      expect(result.data.violations).toContain('Invalid delivery location for Guyana crude');
    });

    test('should require counterparty identification', () => {
      const invalidTrade = {
        quantity: 10000,
        price: 82.50,
        counterparty: '', // Missing counterparty
        delivery_location: 'Georgetown',
      };

      const result = lizaService.validateTradeCompliance(invalidTrade);
      
      expect(result.success).toBe(true);
      expect(result.data.compliant).toBe(false);
      expect(result.data.violations).toContain('Counterparty identification required');
    });

    test('should identify multiple compliance violations', () => {
      const invalidTrade = {
        quantity: 500, // Too small
        price: 82.50,
        counterparty: '', // Missing
        delivery_location: 'Dubai', // Invalid location
      };

      const result = lizaService.validateTradeCompliance(invalidTrade);
      
      expect(result.success).toBe(true);
      expect(result.data.compliant).toBe(false);
      expect(result.data.violations).toHaveLength(3);
      expect(result.data.violations).toContain('Minimum trade quantity is 1,000 barrels');
      expect(result.data.violations).toContain('Counterparty identification required');
      expect(result.data.violations).toContain('Invalid delivery location for Guyana crude');
    });
  });

  describe('Cache Management', () => {
    test('should update cache with new price data', async () => {
      const mockApiResponse = {
        data: {
          price: 83.25,
          volume: 700000,
          timestamp: new Date().toISOString(),
          api_differential: -2.5,
          sulfur_content: 0.42,
        },
      };

      axios.get.mockResolvedValueOnce(mockApiResponse);

      await lizaService.fetchLivePrices();
      
      const cachedPrice = lizaService.getCachedPrice('current');
      expect(cachedPrice.price).toBe(83.25);
      expect(cachedPrice.api_differential).toBe(-2.5);
      expect(cachedPrice.source).toBe('live');
    });

    test('should respect cache timeout', async () => {
      // Create service with very short cache timeout
      const shortCacheService = new LizaTradingService({
        cacheTimeout: 100, // 100ms
      });

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(shortCacheService.isCacheExpired('current')).toBe(true);
    });
  });

  describe('Health Status', () => {
    test('should return correct health status', () => {
      const health = lizaService.getHealthStatus();
      
      expect(health.success).toBe(true);
      expect(health.data.status).toBeDefined();
      expect(health.data.cacheSize).toBeGreaterThan(0);
      expect(health.data.isPolling).toBe(false);
      expect(health.data.lastFetch).toBeNull(); // No successful fetch yet
    });

    test('should update health status after successful fetch', async () => {
      const mockApiResponse = {
        data: {
          price: 84.00,
          volume: 800000,
          timestamp: new Date().toISOString(),
        },
      };

      axios.get.mockResolvedValueOnce(mockApiResponse);

      await lizaService.fetchLivePrices();
      
      const health = lizaService.getHealthStatus();
      expect(health.data.status).toBe('healthy');
      expect(health.data.lastFetch).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    test('should retry failed API calls', async () => {
      // First two calls fail, third succeeds
      axios.get
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValueOnce({
          data: {
            price: 85.00,
            volume: 900000,
            timestamp: new Date().toISOString(),
          },
        });

      const result = await lizaService.getCurrentPrice();
      
      expect(result.success).toBe(true);
      expect(result.data.price).toBe(85.00);
      expect(axios.get).toHaveBeenCalledTimes(3); // Confirms retry behavior
    });

    test('should handle all retries failed gracefully', async () => {
      // All calls fail
      axios.get.mockRejectedValue(new Error('Persistent network error'));
      
      // Clear cache to force API dependency
      lizaService.cache.clear();

      const result = await lizaService.getCurrentPrice();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No current price data available');
    });
  });

  describe('Event Emission', () => {
    test('should emit price_update events on successful fetch', async () => {
      const mockApiResponse = {
        data: {
          price: 86.00,
          volume: 1000000,
          timestamp: new Date().toISOString(),
        },
      };

      axios.get.mockResolvedValueOnce(mockApiResponse);

      const eventPromise = new Promise((resolve) => {
        lizaService.on('price_update', (priceData) => {
          expect(priceData.price).toBe(86.00);
          expect(priceData.source).toBe('live');
          resolve();
        });
      });

      await lizaService.fetchLivePrices();
      await eventPromise;
    });

    test('should emit fetch_error events on API failures', async () => {
      axios.get.mockRejectedValue(new Error('API service down'));

      const errorPromise = new Promise((resolve) => {
        lizaService.on('fetch_error', (error) => {
          expect(error.message).toBe('API service down');
          resolve();
        });
      });

      await lizaService.fetchLivePrices();
      await errorPromise;
    });
  });

  describe('Cleanup and Resource Management', () => {
    test('should cleanup resources on destroy', () => {
      lizaService.startLivePricing();
      expect(lizaService.isPolling).toBe(true);
      expect(lizaService.cache.size).toBeGreaterThan(0);

      lizaService.destroy();
      
      expect(lizaService.isPolling).toBe(false);
      expect(lizaService.cache.size).toBe(0);
      expect(lizaService.listenerCount('price_update')).toBe(0);
    });
  });
});