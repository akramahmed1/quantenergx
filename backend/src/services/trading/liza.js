const { EventEmitter } = require('events');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * Liza Crude Oil Trading Service for Guyana
 * Provides real-time pricing, API integration, and fallback cache
 * Compliant with Guyana energy trading regulations
 */
class LizaTradingService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      baseUrl: process.env.LIZA_API_BASE_URL || 'https://api.guyanaenergy.gov.gy/v1',
      apiKey: process.env.LIZA_API_KEY || '',
      refreshInterval: parseInt(process.env.LIZA_REFRESH_INTERVAL || '30000'), // 30 seconds
      cacheTimeout: parseInt(process.env.LIZA_CACHE_TIMEOUT || '300000'), // 5 minutes
      retryAttempts: 3,
      retryDelay: 5000,
      ...config,
    };

    this.cache = new Map();
    this.pollingInterval = null;
    this.isPolling = false;
    this.lastSuccessfulFetch = null;

    this.initializeService();
  }

  initializeService() {
    if (!this.config.apiKey) {
      console.warn('LIZA API key not configured, using fallback data only');
    }
    
    // Load initial cache if available
    this.loadInitialCache();
  }

  /**
   * Start live price polling
   */
  startLivePricing() {
    if (this.isPolling) {
      console.log('Live pricing already active');
      return;
    }

    this.isPolling = true;
    this.pollingInterval = setInterval(async () => {
      try {
        await this.fetchLivePrices();
      } catch (error) {
        console.error('Error in live price polling:', error);
        this.emit('polling_error', error);
      }
    }, this.config.refreshInterval);

    // Initial fetch
    this.fetchLivePrices().catch(error => {
      console.error('Initial price fetch failed:', error);
    });

    this.emit('polling_started');
  }

  /**
   * Stop live price polling
   */
  stopLivePricing() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    this.emit('polling_stopped');
  }

  /**
   * Fetch live Liza crude prices from API
   */
  async fetchLivePrices() {
    if (!this.config.apiKey) {
      return null;
    }

    let attempt = 0;
    while (attempt < this.config.retryAttempts) {
      try {
        const response = await axios.get(`${this.config.baseUrl}/liza/prices`, {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });

        const priceData = {
          price: response.data.price,
          volume: response.data.volume,
          timestamp: new Date(response.data.timestamp),
          api_differential: response.data.api_differential || 0,
          sulfur_content: response.data.sulfur_content || 0.5,
          source: 'live',
        };

        // Update cache
        this.updateCache('current', priceData);
        this.lastSuccessfulFetch = new Date();

        this.emit('price_update', priceData);
        return priceData;

      } catch (error) {
        attempt++;
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay);
        } else {
          console.error(`Failed to fetch live prices after ${this.config.retryAttempts} attempts:`, error);
          this.emit('fetch_error', error);
        }
      }
    }

    return null;
  }

  /**
   * Get current Liza crude price with fallback cache
   */
  async getCurrentPrice() {
    try {
      // Try to get live data first
      const liveData = await this.fetchLivePrices();
      if (liveData) {
        return {
          success: true,
          data: liveData,
          timestamp: new Date(),
        };
      }

      // Fallback to cache
      const cachedData = this.getCachedPrice('current');
      if (cachedData && !this.isCacheExpired('current')) {
        return {
          success: true,
          data: { ...cachedData, source: 'cache' },
          timestamp: new Date(),
          message: 'Using cached data due to API unavailability',
        };
      }

      // Return error if no data available
      return {
        success: false,
        error: 'No current price data available',
        timestamp: new Date(),
      };

    } catch (error) {
      console.error('Error getting current price:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get historical Liza prices for a date range
   */
  async getHistoricalPrices(startDate, endDate) {
    if (!this.config.apiKey) {
      return {
        success: false,
        error: 'API key not configured for historical data',
        timestamp: new Date(),
      };
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}/liza/prices/historical`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
        timeout: 30000,
      });

      const historicalData = response.data.prices.map(price => ({
        price: price.price,
        volume: price.volume,
        timestamp: new Date(price.timestamp),
        api_differential: price.api_differential || 0,
        sulfur_content: price.sulfur_content || 0.5,
        source: 'live',
      }));

      return {
        success: true,
        data: historicalData,
        timestamp: new Date(),
      };

    } catch (error) {
      console.error('Error fetching historical prices:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch historical prices',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Calculate pricing differential against Brent crude
   */
  async getPricingDifferential() {
    try {
      const lizaPrice = await this.getCurrentPrice();
      if (!lizaPrice.success || !lizaPrice.data) {
        return {
          success: false,
          error: 'Unable to get current Liza price',
          timestamp: new Date(),
        };
      }

      // In production, this would fetch Brent prices from another API
      const brentPrice = 85.50; // Mock Brent price
      const differential = lizaPrice.data.price - brentPrice;

      return {
        success: true,
        data: {
          differential,
          benchmark: 'Brent',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };

    } catch (error) {
      console.error('Error calculating pricing differential:', error);
      return {
        success: false,
        error: error.message || 'Failed to calculate differential',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Validate trade compliance for Guyana regulations
   */
  validateTradeCompliance(tradeData) {
    const violations = [];

    // Guyana-specific compliance checks
    if (tradeData.quantity < 1000) {
      violations.push('Minimum trade quantity is 1,000 barrels');
    }

    if (tradeData.quantity > 100000) {
      violations.push('Maximum trade quantity is 100,000 barrels per transaction');
    }

    if (!tradeData.delivery_location || !this.isValidGuyanaLocation(tradeData.delivery_location)) {
      violations.push('Invalid delivery location for Guyana crude');
    }

    if (!tradeData.counterparty) {
      violations.push('Counterparty identification required');
    }

    const compliant = violations.length === 0;

    return {
      success: true,
      data: {
        compliant,
        violations,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Cache management methods
   */
  updateCache(key, data) {
    const expiry = new Date(Date.now() + this.config.cacheTimeout);
    this.cache.set(key, { data, expiry });
  }

  getCachedPrice(key) {
    const entry = this.cache.get(key);
    return entry ? entry.data : null;
  }

  isCacheExpired(key) {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return new Date() > entry.expiry;
  }

  loadInitialCache() {
    // In production, this would load from persistent storage
    const mockData = {
      price: 78.50,
      volume: 500000,
      timestamp: new Date(),
      api_differential: -3.5,
      sulfur_content: 0.4,
      source: 'cache',
    };
    this.updateCache('current', mockData);
  }

  isValidGuyanaLocation(location) {
    const validLocations = [
      'Georgetown',
      'Liza Destiny FPSO',
      'Liza Unity FPSO',
      'Payara FPSO',
      'Prosperity FPSO',
    ];
    return validLocations.includes(location);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      success: true,
      data: {
        status: this.lastSuccessfulFetch ? 'healthy' : 'degraded',
        lastFetch: this.lastSuccessfulFetch,
        cacheSize: this.cache.size,
        isPolling: this.isPolling,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopLivePricing();
    this.cache.clear();
    this.removeAllListeners();
  }
}

module.exports = LizaTradingService;