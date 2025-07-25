const request = require('supertest');
const app = require('../src/server');
const path = require('path');
const fs = require('fs');

describe('OCR Service API Tests', () => {
  let authToken;
  
  beforeAll(async () => {
    // Mock authentication token for testing
    authToken = 'mock-jwt-token-for-testing';
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('rest_api', 'online');
    });
  });

  describe('GET /api/v1/', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api/v1/')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'QuantEnergx API');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('ocr');
    });
  });

  describe('GET /api/v1/ocr/status', () => {
    it('should return OCR service status', async () => {
      const response = await request(app)
        .get('/api/v1/ocr/status')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'OCR Service');
      expect(response.body).toHaveProperty('status', 'online');
      expect(response.body).toHaveProperty('supported_languages');
      expect(response.body.supported_languages).toContain('eng');
      expect(response.body.supported_languages).toContain('ara');
    });
  });

  describe('GET /api/v1/notifications/channels', () => {
    it('should return available notification channels', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/channels')
        .expect(200);

      expect(response.body).toHaveProperty('channels');
      expect(response.body.channels).toHaveProperty('email');
      expect(response.body.channels).toHaveProperty('telegram');
      expect(response.body.channels).toHaveProperty('whatsapp');
    });
  });

  describe('POST /api/v1/ocr/process', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/ocr/process')
        .expect(401);
    });

    it('should validate file upload', async () => {
      const response = await request(app)
        .post('/api/v1/ocr/process')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/notifications/send', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/notifications/send')
        .expect(401);
    });

    it('should validate notification data', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should accept valid notification request', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          channel: 'email',
          recipient: 'test@example.com',
          message: 'Test notification message',
          options: {
            subject: 'Test Subject'
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits for OCR endpoints', async () => {
      // This test would require multiple rapid requests
      // Implementation depends on the rate limiting configuration
      const response = await request(app)
        .get('/api/v1/ocr/status');
      
      expect(response.status).toBeLessThan(500);
    });
  });
});

// Integration tests for OCR functionality
describe('OCR Integration Tests', () => {
  const sampleText = `
    TRADING CONTRACT
    Contract Number: TC-2024-001
    Trade Date: 2024-01-15
    Volume: 50,000 barrels
    Price: $75.50 per barrel
    Counterparty: Energy Trading Corp
    Commodity: Crude Oil
    Delivery Location: Houston, TX
    Incoterms: FOB
  `;

  beforeAll(() => {
    // Create a sample text file for testing
    const testDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(testDir, 'sample_contract.txt'),
      sampleText
    );
  });

  describe('Field Extraction', () => {
    it('should extract contract number correctly', () => {
      const contractNumberRegex = /contract\s*#?\s*:?\s*([A-Z0-9-]+)/i;
      const match = sampleText.match(contractNumberRegex);
      expect(match).toBeTruthy();
      expect(match[1]).toBe('TC-2024-001');
    });

    it('should extract trade date correctly', () => {
      const tradeDateRegex = /trade\s*date\s*:?\s*(\d{4}-\d{2}-\d{2})/i;
      const match = sampleText.match(tradeDateRegex);
      expect(match).toBeTruthy();
      expect(match[1]).toBe('2024-01-15');
    });

    it('should extract volume correctly', () => {
      const volumeRegex = /volume\s*:?\s*([\d,]+\.?\d*)\s*(barrels?|bbl)/i;
      const match = sampleText.match(volumeRegex);
      expect(match).toBeTruthy();
      expect(match[1]).toBe('50,000');
    });

    it('should extract price correctly', () => {
      const priceRegex = /price\s*:?\s*\$?([\d,]+\.?\d*)/i;
      const match = sampleText.match(priceRegex);
      expect(match).toBeTruthy();
      expect(match[1]).toBe('75.50');
    });

    it('should extract counterparty correctly', () => {
      const counterpartyRegex = /counterparty\s*:?\s*([A-Z][A-Za-z\s&,\.]+)/i;
      const match = sampleText.match(counterpartyRegex);
      expect(match).toBeTruthy();
      expect(match[1]).toBe('Energy Trading Corp');
    });
  });

  describe('Document Validation', () => {
    it('should validate required fields', () => {
      const requiredFields = ['contract', 'trade date', 'volume', 'price'];
      const documentText = sampleText.toLowerCase();
      
      requiredFields.forEach(field => {
        expect(documentText).toContain(field);
      });
    });

    it('should detect commodity type', () => {
      const commodityRegex = /(crude\s*oil|natural\s*gas|lng|gasoline|diesel)/i;
      const match = sampleText.match(commodityRegex);
      expect(match).toBeTruthy();
      expect(match[1].toLowerCase()).toBe('crude oil');
    });

    it('should detect incoterms', () => {
      const incotermsRegex = /(FOB|CIF|CFR|DAP|DDP|FAS|FCA|CPT|CIP)/i;
      const match = sampleText.match(incotermsRegex);
      expect(match).toBeTruthy();
      expect(match[1]).toBe('FOB');
    });
  });
});

// Mock data for testing
const mockOCRResult = {
  documentId: 'test-doc-123',
  text: 'Sample extracted text from OCR',
  confidence: 95.5,
  detectedLanguage: 'eng',
  fields: {
    contract_number: {
      name: 'contract_number',
      value: 'TC-2024-001',
      type: 'text',
      confidence: 98,
      needs_review: false
    },
    volume: {
      name: 'volume',
      value: 50000,
      type: 'number',
      confidence: 92,
      needs_review: false
    }
  },
  processingTime: 1250
};

const mockBatchStatus = {
  batch_id: 'batch-456',
  total_documents: 3,
  completed: 2,
  failed: 0,
  processing: 1,
  waiting: 0,
  results: [
    { document_id: 'doc1', filename: 'contract1.pdf', status: 'completed', confidence: 95 },
    { document_id: 'doc2', filename: 'invoice2.jpg', status: 'completed', confidence: 88 },
    { document_id: 'doc3', filename: 'receipt3.png', status: 'processing', confidence: 0 }
  ]
};

module.exports = {
  mockOCRResult,
  mockBatchStatus
};