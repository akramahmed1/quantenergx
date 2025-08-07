# Multi-Region Oil & Gas Trading Infrastructure

This document describes the multi-region infrastructure implemented for QuantEnergx oil and gas trading platform.

## Overview

The infrastructure supports trading operations across five key regions:
- **US** (United States) - SOX compliance, CFTC regulations
- **EU** (European Union) - GDPR compliance, MiFID II regulations  
- **ME** (Middle East) - Islamic finance compliance, ADGM regulations
- **Guyana** - Environmental compliance, energy regulations
- **Bahrain** - Central Bank of Bahrain (CBB) compliance

## Components

### 1. Security Middleware (`backend/src/middleware/security.ts`)

Comprehensive security middleware providing:

- **Content Security Policy (CSP)** with strict directives
- **HTTP Strict Transport Security (HSTS)** with preload support
- **X-Frame-Options** to prevent clickjacking
- **X-Content-Type-Options** to prevent MIME sniffing
- **Regional compliance headers** based on trading region
- **HTTPS enforcement** for production environments

**Usage:**
```typescript
import { SecurityMiddleware } from './middleware/security';

const securityMiddleware = new SecurityMiddleware({
  enforceHttps: true,
  hstsMaxAge: 31536000,
  includeSubDomains: true,
  preload: true
});

app.use(...securityMiddleware.getMiddleware());
```

**Regional Detection:**
The middleware automatically detects regions via:
- Subdomain (e.g., `bahrain.quantenergx.com`)
- Custom header (`X-Trading-Region`)
- API path prefix (`/api/v1/regions/bahrain/`)

### 2. Regional Docker Compose (`docker-compose.regional.yml`)

Multi-region PostgreSQL and Redis clusters with:

- **Isolated networks** per region for security
- **Health checks** for all services
- **Resource limits** for production deployment
- **Persistent volumes** for data durability
- **Regional timezone** configuration

**Usage:**
```bash
# Start specific region
docker compose -f docker-compose.regional.yml up postgres-us redis-us

# Start all regions  
docker compose -f docker-compose.regional.yml up

# Start with specific environment
cp .env.regional.example .env
# Edit .env with your configuration
docker compose -f docker-compose.regional.yml up
```

**Port Mapping:**
- US: PostgreSQL 5432, Redis 6379
- EU: PostgreSQL 5433, Redis 6380
- ME: PostgreSQL 5434, Redis 6381
- Guyana: PostgreSQL 5435, Redis 6382
- Bahrain: PostgreSQL 5436, Redis 6383

### 3. Bahrain CBB Validator (`backend/src/services/cbb-validator.ts`)

Microservice for Central Bank of Bahrain compliance validation:

**Features:**
- Transaction validation against CBB regulations
- KYC/AML compliance checking (stub implementation)
- Sanctions list validation (stub implementation)
- Islamic finance compliance validation
- Real-time compliance scoring

**API Endpoints:**
- `POST /validate` - Validate a trading transaction
- `GET /validate/:validationId` - Get validation result
- `GET /compliance-status` - Get CBB compliance capabilities
- `GET /health` - Service health check

**Example Request:**
```json
{
  "transactionId": "TXN-123456",
  "amount": 1000000,
  "currency": "USD",
  "counterparty": "ENERGY_CORP_BH",
  "transactionType": "spot",
  "commodityType": "crude_oil",
  "settlementDate": "2024-12-31T00:00:00Z"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "validationId": "val-uuid-123",
    "status": "approved",
    "complianceScore": 95,
    "expiresAt": "2024-12-01T00:00:00Z"
  }
}
```

## Configuration

### Environment Variables

Copy `.env.regional.example` to `.env` and configure:

```bash
# US Region
DB_NAME_US=quantenergx_us
DB_USER_US=quantenergx_us  
DB_PASSWORD_US=your_secure_password
REDIS_PASSWORD_US=your_redis_password

# EU Region  
DB_NAME_EU=quantenergx_eu
# ... similar for other regions

# CBB Validator
CBB_API_ENDPOINT=https://api.cbb.gov.bh/v1
CBB_CLIENT_ID=your_client_id
CBB_CLIENT_SECRET=your_client_secret
```

### Regional Database Initialization

Each region has dedicated initialization scripts in `deployment/postgres/`:

- `init-us.sql` - US region with SOX compliance tables
- `init-eu.sql` - EU region with GDPR compliance tables
- `init-me.sql` - ME region with ADGM compliance tables
- `init-guyana.sql` - Guyana region with EPA compliance tables
- `init-bahrain.sql` - Bahrain region with CBB compliance tables

### Redis Configuration

Regional Redis configurations in `deployment/redis/`:

- Optimized for trading workloads
- Memory management with LRU eviction
- Persistence with AOF
- Regional timezone settings

## Security Features

### Strict Security Headers

All HTTP responses include:
- `Content-Security-Policy` with restrictive directives
- `Strict-Transport-Security` with 1-year max-age
- `X-Frame-Options: DENY` 
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Regional Compliance Headers

Based on detected region:
- **Bahrain**: `X-CBB-Compliance: enabled`
- **Guyana**: `X-Environmental-Compliance: enabled`
- **EU**: `X-GDPR-Compliance: enabled`
- **US**: `X-SOX-Compliance: enabled`
- **ME**: `X-Islamic-Finance: sharia-compliant`

### Network Isolation

Each region operates in isolated Docker networks:
- `quantenergx-us`
- `quantenergx-eu`  
- `quantenergx-me`
- `quantenergx-guyana`
- `quantenergx-bahrain`

## Deployment

### Local Development

```bash
# Install dependencies
npm install

# Start specific region
docker compose -f docker-compose.regional.yml up postgres-bahrain redis-bahrain cbb-validator

# Start backend with security middleware
cd backend && npm run dev
```

### Production Deployment

```bash
# Build images
docker compose -f docker-compose.regional.yml build

# Start with production configuration
NODE_ENV=production docker compose -f docker-compose.regional.yml up -d

# Monitor logs
docker compose -f docker-compose.regional.yml logs -f
```

## Monitoring and Health Checks

All services include comprehensive health checks:

- **PostgreSQL**: `pg_isready` with region-specific user/database
- **Redis**: `PING` command with authentication
- **CBB Validator**: HTTP endpoint check on `/health`

Health check intervals:
- Database services: 10s interval, 5s timeout
- Cache services: 10s interval, 3s timeout  
- Application services: 30s interval, 10s timeout

## Compliance Notes

### Bahrain CBB Validator

This is a **stub implementation** designed for easy expansion. For production use:

1. Replace stub validation logic with actual CBB API integration
2. Implement real-time KYC/AML checking
3. Connect to sanctioned entity databases
4. Add comprehensive audit logging
5. Implement proper error handling and retry logic

### Regional Data Residency

Each region maintains data sovereignty:
- All data stored in regional PostgreSQL instances
- Redis caches use regional configurations
- No cross-region data sharing by default
- Compliance logs stored per region

## Testing

```bash
# Test security middleware
npm test -- security.test.ts

# Validate Docker configurations
docker compose -f docker-compose.regional.yml config

# Test CBB validator health
curl http://localhost:3010/health

# Test regional service health
curl http://localhost:5432 # US PostgreSQL
curl http://localhost:5436 # Bahrain PostgreSQL
```

## Future Enhancements

1. **CBB Integration**: Connect to real CBB APIs for live validation
2. **Cross-Region Replication**: Implement secure data replication
3. **Advanced Monitoring**: Add Prometheus metrics and Grafana dashboards
4. **Automated Failover**: Implement region failover mechanisms
5. **Compliance Automation**: Automated regulatory reporting per region