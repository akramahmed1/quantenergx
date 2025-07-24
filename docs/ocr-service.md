# OCR & Dirty Document ETL Microservice

## Overview

The OCR & Dirty Document ETL microservice is a comprehensive solution for processing poor-quality, multilingual trading documents including images, PDFs, faxes, and WhatsApp photos. It transforms unstructured document data into structured information suitable for trading systems.

## Features

### Core OCR Capabilities
- **Multi-language Support**: English, Arabic, Farsi/Persian, Chinese (Simplified), Russian, French, Spanish, Urdu
- **Multiple Format Support**: JPEG, PNG, TIFF, BMP, WebP, PDF
- **Intelligent Preprocessing**: Image enhancement, noise reduction, and format conversion
- **Confidence Scoring**: OCR quality assessment with confidence levels

### Document Processing
- **Field Extraction**: Automated extraction of trading-specific fields:
  - Contract numbers and trade identifiers
  - Trade dates and settlement dates
  - Volume, quantity, and pricing information
  - Counterparty and delivery location details
  - Commodity types and Incoterms
- **Stamp Detection**: Identification of official stamps and seals
- **Signature Detection**: Recognition of handwritten signatures
- **Error Flagging**: Automatic detection of low-confidence extractions

### Manual Review Workflow
- **Review Queue**: Documents requiring manual validation
- **Field Correction Interface**: Easy editing of extracted data
- **Approval Workflow**: Three-tier review process (Approved/Needs Revision/Rejected)
- **Audit Trail**: Complete tracking of all changes and approvals

### ETL Pipeline
- **Data Transformation**: Conversion to standardized trading system formats
- **Validation Rules**: Business logic validation for trading data
- **Integration Ready**: APIs for connecting to trading, risk, and compliance systems
- **Real-time Processing**: Live document processing with immediate feedback

### Batch Processing
- **Queue Management**: Bull queue system for high-volume processing
- **Progress Tracking**: Real-time status updates for batch operations
- **Error Handling**: Robust error recovery and reporting
- **Scalable Architecture**: Horizontal scaling support

## Architecture

### Backend Services

#### REST API Endpoints
```
GET  /api/v1/ocr/status           - Service health and capabilities
POST /api/v1/ocr/process          - Process single document
POST /api/v1/ocr/batch            - Process document batch
GET  /api/v1/ocr/batch/:id        - Get batch status
POST /api/v1/ocr/extract-fields   - Extract specific fields
POST /api/v1/ocr/review/:id       - Submit manual review
```

#### gRPC Services
- **ProcessDocument**: High-performance document processing
- **ProcessBatch**: Batch operations with streaming support
- **ExtractFields**: Field extraction with custom definitions
- **SubmitReview**: Review workflow integration

#### Notification System
- **Multi-channel Support**: Email, Telegram, WhatsApp, SMS
- **Event-driven Notifications**: Document completion, review required, batch status
- **Custom Templates**: Configurable message formats for different events

### Frontend Application

#### React Components
- **Document Upload**: Drag & drop interface with progress tracking
- **Review Interface**: Field editing and validation tools
- **Batch Monitor**: Real-time batch processing status
- **Dashboard**: Overview of processing activity and metrics

#### State Management
- **Redux Toolkit**: Centralized state management
- **Real-time Updates**: WebSocket integration for live updates
- **Persistent Storage**: Local caching of document states

## API Reference

### Document Processing

#### Upload Single Document
```bash
curl -X POST http://localhost:3001/api/v1/ocr/process \
  -H "Authorization: Bearer <token>" \
  -F "document=@contract.pdf" \
  -F "language=eng" \
  -F "extractFields=true" \
  -F "detectStamps=true"
```

#### Batch Upload
```bash
curl -X POST http://localhost:3001/api/v1/ocr/batch \
  -H "Authorization: Bearer <token>" \
  -F "documents=@doc1.pdf" \
  -F "documents=@doc2.jpg" \
  -F "language=eng" \
  -F "extractFields=true"
```

### Field Extraction

#### Custom Field Definitions
```json
{
  "fieldDefinitions": [
    {
      "name": "contract_number",
      "type": "text",
      "pattern": "CONTRACT\\s*#?\\s*:?\\s*([A-Z0-9-]+)",
      "required": true
    },
    {
      "name": "trade_volume",
      "type": "number",
      "pattern": "VOLUME\\s*:?\\s*([\\d,]+\\.?\\d*)",
      "required": true
    }
  ]
}
```

### Notification Configuration

#### Subscribe to Notifications
```bash
curl -X POST http://localhost:3001/api/v1/notifications/subscribe \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "channels": ["email", "telegram"],
    "email_address": "trader@company.com",
    "telegram_chat_id": "123456789"
  }'
```

## Configuration

### Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
GRPC_PORT=50051

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/quantenergx
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# OCR Configuration
TESSERACT_PATH=/usr/bin/tesseract
DEFAULT_OCR_LANGUAGE=eng
MAX_FILE_SIZE=52428800

# Notification Services
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
WHATSAPP_API_TOKEN=your-whatsapp-token
EMAIL_API_KEY=your-email-service-key

# External APIs
GOOGLE_CLOUD_VISION_API_KEY=your-google-vision-key
```

### Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English | eng | ✅ Active |
| Arabic | ara | ✅ Active |
| Farsi/Persian | fas | ✅ Active |
| Chinese (Simplified) | chi_sim | ✅ Active |
| Russian | rus | ✅ Active |
| French | fra | ✅ Active |
| Spanish | spa | ✅ Active |
| Urdu | urd | ✅ Active |

## Integration Guide

### Trading System Integration

```javascript
// Example: Process document and integrate with trading system
const processAndTrade = async (documentFile) => {
  // 1. Process document with OCR
  const ocrResult = await fetch('/api/v1/ocr/process', {
    method: 'POST',
    body: formData
  });
  
  // 2. Extract trading fields
  const fieldResult = await fetch(`/api/v1/ocr/extract-fields/${ocrResult.document_id}`, {
    method: 'POST',
    body: JSON.stringify({ fieldDefinitions: tradingFieldDefs })
  });
  
  // 3. Manual review if needed
  if (fieldResult.needs_manual_review) {
    await notifyReviewRequired(ocrResult.document_id);
    return;
  }
  
  // 4. Transform to trading system format
  const tradeData = transformToTradeFormat(fieldResult.extracted_fields);
  
  // 5. Submit to trading system
  await submitTrade(tradeData);
};
```

### Risk Management Integration

```javascript
// Example: Risk validation of extracted trade data
const validateTradeRisk = async (extractedFields) => {
  const riskCheck = {
    volume: extractedFields.volume?.value,
    counterparty: extractedFields.counterparty?.value,
    commodity: extractedFields.commodity?.value,
    price: extractedFields.price?.value
  };
  
  const riskResult = await fetch('/api/v1/risk/validate', {
    method: 'POST',
    body: JSON.stringify(riskCheck)
  });
  
  if (riskResult.violations?.length > 0) {
    await notifyRiskViolation(riskResult.violations);
  }
  
  return riskResult;
};
```

## Deployment

### Docker Deployment

```yaml
version: '3.8'
services:
  quantenergx-backend:
    build: ./backend
    ports:
      - "3001:3001"
      - "50051:50051"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/quantenergx
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
  
  quantenergx-frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:3001
  
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: quantenergx
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
  
  redis:
    image: redis:6
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: quantenergx-ocr
spec:
  replicas: 3
  selector:
    matchLabels:
      app: quantenergx-ocr
  template:
    metadata:
      labels:
        app: quantenergx-ocr
    spec:
      containers:
      - name: ocr-service
        image: quantenergx/ocr:latest
        ports:
        - containerPort: 3001
        - containerPort: 50051
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_HOST
          value: "redis-service"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

## Performance Optimization

### Recommended Settings

- **CPU**: 4+ cores for optimal OCR performance
- **Memory**: 8GB+ for batch processing
- **Storage**: SSD for temporary file processing
- **Network**: High bandwidth for large document uploads

### Scaling Considerations

- **Horizontal Scaling**: Multiple OCR service instances
- **Load Balancing**: Distribute document processing load
- **Caching**: Redis for result caching and session management
- **Queue Management**: Bull queue for background processing

## Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- API key management for external integrations

### Data Protection
- End-to-end encryption for document transmission
- Secure temporary file handling
- Automatic cleanup of processed documents
- Audit logging for compliance

### Compliance Features
- Document retention policies
- Processing audit trails
- Regulatory reporting capabilities
- Data privacy controls

## Monitoring & Logging

### Health Checks
```bash
# Service health
curl http://localhost:3001/health

# OCR service status
curl http://localhost:3001/api/v1/ocr/status
```

### Metrics
- Document processing throughput
- OCR accuracy rates
- Review queue depth
- API response times
- Error rates by document type

### Logging
- Structured JSON logging
- Error tracking and alerting
- Performance monitoring
- User activity logging

## Support & Troubleshooting

### Common Issues

1. **Low OCR Accuracy**
   - Check document quality and resolution
   - Verify language setting matches document
   - Consider preprocessing options

2. **Batch Processing Delays**
   - Monitor Redis queue depth
   - Check system resource utilization
   - Scale processing workers if needed

3. **Field Extraction Errors**
   - Review field definition patterns
   - Check document format consistency
   - Validate training data quality

### Getting Help

- Documentation: [docs.quantenergx.com](https://docs.quantenergx.com)
- Support: support@quantenergx.com
- Issues: [GitHub Issues](https://github.com/akramahmed1/quantenergx/issues)
- Community: [Discord Server](https://discord.gg/quantenergx)