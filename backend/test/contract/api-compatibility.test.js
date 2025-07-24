const { Pact } = require('@pact-foundation/pact');
const { like, eachLike, term } = require('@pact-foundation/pact/dist/dsl/matchers');
const path = require('path');
const axios = require('axios');

describe('Contract Testing - API Compatibility', () => {
  let provider;

  beforeAll(async () => {
    // Configure Pact provider
    provider = new Pact({
      consumer: 'quantenergx-frontend',
      provider: 'quantenergx-backend',
      port: 3002, // Use different port for contract tests
      log: path.resolve(process.cwd(), 'test/contract/logs', 'pact.log'),
      dir: path.resolve(process.cwd(), 'test/contract/pacts'),
      logLevel: 'INFO',
      spec: 2
    });

    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  afterEach(async () => {
    await provider.verify();
  });

  describe('Trading API Contract', () => {
    it('should provide trading order creation endpoint', async () => {
      // Define expected interaction
      await provider.addInteraction({
        state: 'user is authenticated',
        uponReceiving: 'a request to create a trading order',
        withRequest: {
          method: 'POST',
          path: '/api/v1/trading/orders',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': like('Bearer token123')
          },
          body: {
            commodity: 'crude_oil',
            volume: like(1000),
            price: like(75.50),
            side: 'buy',
            type: 'limit'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            orderId: like('order_123456'),
            status: 'pending',
            commodity: 'crude_oil',
            volume: like(1000),
            price: like(75.50),
            side: 'buy',
            type: 'limit',
            timestamp: like('2024-01-15T10:30:00Z')
          }
        }
      });

      // Make actual request to verify contract
      const response = await axios.post(
        `${provider.mockService.baseUrl}/api/v1/trading/orders`,
        {
          commodity: 'crude_oil',
          volume: 1000,
          price: 75.50,
          side: 'buy',
          type: 'limit'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token123'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('orderId');
      expect(response.data).toHaveProperty('status', 'pending');
    });

    it('should provide order status endpoint', async () => {
      await provider.addInteraction({
        state: 'order exists',
        uponReceiving: 'a request for order status',
        withRequest: {
          method: 'GET',
          path: '/api/v1/trading/orders/order_123456',
          headers: {
            'Authorization': like('Bearer token123')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            orderId: 'order_123456',
            status: like('executed'),
            commodity: 'crude_oil',
            volume: like(1000),
            price: like(75.50),
            executedPrice: like(75.45),
            side: 'buy',
            type: 'limit',
            timestamp: like('2024-01-15T10:30:00Z'),
            executedAt: like('2024-01-15T10:32:15Z')
          }
        }
      });

      const response = await axios.get(
        `${provider.mockService.baseUrl}/api/v1/trading/orders/order_123456`,
        {
          headers: {
            'Authorization': 'Bearer token123'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('orderId', 'order_123456');
      expect(response.data).toHaveProperty('status');
    });
  });

  describe('Market Data API Contract', () => {
    it('should provide commodity price data', async () => {
      await provider.addInteraction({
        state: 'market is open',
        uponReceiving: 'a request for commodity prices',
        withRequest: {
          method: 'GET',
          path: '/api/v1/market/prices/crude_oil',
          headers: {
            'Authorization': like('Bearer token123')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            commodity: 'crude_oil',
            currency: 'USD',
            unit: 'barrel',
            prices: {
              bid: like(75.20),
              ask: like(75.30),
              last: like(75.25),
              change: like(-0.15),
              changePercent: like(-0.20)
            },
            timestamp: like('2024-01-15T10:35:00Z'),
            exchange: like('NYMEX')
          }
        }
      });

      const response = await axios.get(
        `${provider.mockService.baseUrl}/api/v1/market/prices/crude_oil`,
        {
          headers: {
            'Authorization': 'Bearer token123'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('commodity', 'crude_oil');
      expect(response.data).toHaveProperty('prices');
      expect(response.data.prices).toHaveProperty('bid');
      expect(response.data.prices).toHaveProperty('ask');
    });

    it('should provide historical price data', async () => {
      await provider.addInteraction({
        state: 'historical data is available',
        uponReceiving: 'a request for historical prices',
        withRequest: {
          method: 'GET',
          path: '/api/v1/market/prices/crude_oil/history',
          query: {
            from: '2024-01-01',
            to: '2024-01-15',
            interval: 'daily'
          },
          headers: {
            'Authorization': like('Bearer token123')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            commodity: 'crude_oil',
            interval: 'daily',
            data: eachLike({
              date: like('2024-01-15'),
              open: like(75.10),
              high: like(75.80),
              low: like(74.90),
              close: like(75.25),
              volume: like(125000)
            }, { min: 1 })
          }
        }
      });

      const response = await axios.get(
        `${provider.mockService.baseUrl}/api/v1/market/prices/crude_oil/history`,
        {
          params: {
            from: '2024-01-01',
            to: '2024-01-15',
            interval: 'daily'
          },
          headers: {
            'Authorization': 'Bearer token123'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('commodity', 'crude_oil');
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  describe('OCR Service API Contract', () => {
    it('should provide OCR processing endpoint', async () => {
      await provider.addInteraction({
        state: 'OCR service is available',
        uponReceiving: 'a request to process document',
        withRequest: {
          method: 'POST',
          path: '/api/v1/ocr/process',
          headers: {
            'Authorization': like('Bearer token123'),
            'Content-Type': term({ matcher: 'multipart/form-data; boundary=.*', generate: 'multipart/form-data; boundary=----WebKitFormBoundary' })
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            documentId: like('doc_789012'),
            status: 'processing',
            estimatedCompletion: like('2024-01-15T10:37:00Z'),
            queuePosition: like(2)
          }
        }
      });

      // For contract tests, we'll mock the multipart form data
      const response = await axios.post(
        `${provider.mockService.baseUrl}/api/v1/ocr/process`,
        'mock-file-data',
        {
          headers: {
            'Authorization': 'Bearer token123',
            'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('documentId');
      expect(response.data).toHaveProperty('status', 'processing');
    });

    it('should provide OCR result endpoint', async () => {
      await provider.addInteraction({
        state: 'document has been processed',
        uponReceiving: 'a request for OCR results',
        withRequest: {
          method: 'GET',
          path: '/api/v1/ocr/results/doc_789012',
          headers: {
            'Authorization': like('Bearer token123')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            documentId: 'doc_789012',
            status: 'completed',
            confidence: like(95.5),
            extractedFields: {
              contract_number: {
                value: like('TC-2024-001'),
                confidence: like(98),
                needs_review: false
              },
              volume: {
                value: like(50000),
                confidence: like(92),
                needs_review: false
              },
              price: {
                value: like(75.50),
                confidence: like(89),
                needs_review: true
              }
            },
            text: like('Full extracted text content...'),
            processingTime: like(1250)
          }
        }
      });

      const response = await axios.get(
        `${provider.mockService.baseUrl}/api/v1/ocr/results/doc_789012`,
        {
          headers: {
            'Authorization': 'Bearer token123'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('documentId', 'doc_789012');
      expect(response.data).toHaveProperty('status', 'completed');
      expect(response.data).toHaveProperty('extractedFields');
    });
  });

  describe('Notification API Contract', () => {
    it('should provide notification channels endpoint', async () => {
      await provider.addInteraction({
        state: 'notification service is available',
        uponReceiving: 'a request for available channels',
        withRequest: {
          method: 'GET',
          path: '/api/v1/notifications/channels'
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            channels: {
              email: {
                available: true,
                configuration_required: eachLike('smtp_server')
              },
              telegram: {
                available: true,
                configuration_required: eachLike('bot_token')
              },
              whatsapp: {
                available: false,
                reason: like('integration_pending')
              }
            }
          }
        }
      });

      const response = await axios.get(
        `${provider.mockService.baseUrl}/api/v1/notifications/channels`
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('channels');
      expect(response.data.channels).toHaveProperty('email');
      expect(response.data.channels).toHaveProperty('telegram');
    });
  });
});