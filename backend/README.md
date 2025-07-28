# QuantEnergx Backend

> Server-side components for the QuantEnergx energy trading platform

## 🏗️ Architecture Overview

The backend is built using a microservices architecture to handle the complex requirements of energy commodity trading. The system is designed for high availability, scalability, and regulatory compliance.

### Core Services

#### Trading Engine Service
- **Purpose**: Core order matching and execution
- **Technology**: Node.js with Express.js
- **Database**: PostgreSQL for transactional data
- **Message Queue**: Apache Kafka for order events

#### Market Data Service
- **Purpose**: Real-time price feeds and market information
- **Technology**: Node.js with WebSocket support
- **Cache**: Redis for high-frequency data
- **External APIs**: Integration with commodity data providers

#### Risk Management Service
- **Purpose**: Position monitoring and risk calculations
- **Technology**: Node.js with mathematical libraries
- **Database**: PostgreSQL for position data
- **Alerts**: Kafka events for risk threshold breaches

#### Compliance Service
- **Purpose**: Regulatory reporting and audit trails
- **Technology**: Node.js with compliance frameworks
- **Database**: PostgreSQL with audit logging
- **Reporting**: Automated report generation and submission

#### User Management Service
- **Purpose**: Authentication, authorization, and user profiles
- **Technology**: Node.js with JWT and OAuth 2.0
- **Database**: PostgreSQL for user data
- **Security**: Multi-factor authentication support

## 📁 Project Structure

```
backend/
├── services/
│   ├── trading-engine/          # Core trading functionality
│   ├── market-data/             # Market data aggregation
│   ├── risk-management/         # Risk calculations and monitoring
│   ├── compliance/              # Regulatory compliance
│   ├── user-management/         # Authentication and user services
│   └── notification/            # Alert and notification service
├── shared/
│   ├── lib/                     # Shared libraries and utilities
│   ├── models/                  # Database models and schemas
│   ├── middleware/              # Express middleware
│   └── config/                  # Configuration management
├── scripts/
│   ├── migrations/              # Database migration scripts
│   ├── seeds/                   # Initial data seeding
│   └── deployment/              # Deployment scripts
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
├── docker/                      # Docker configurations
├── docs/                        # API documentation
└── package.json                 # Node.js dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Redis 6.x or higher
- Docker and Docker Compose (for local development)

### Installation

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup**
   ```bash
   # Start services with Docker
   docker-compose up -d postgres redis
   
   # Run migrations
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Development Commands

```bash
# Start all services in development mode
npm run dev

# Run specific service
npm run dev:trading-engine
npm run dev:market-data
npm run dev:risk-management

# Run tests
npm run test
npm run test:unit
npm run test:integration
npm run test:e2e

# Database operations
npm run db:migrate
npm run db:rollback
npm run db:seed
npm run db:reset

# Linting and formatting
npm run lint
npm run format
npm run type-check
```

## 🔧 Configuration

### Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/quantenergx
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Market Data APIs
MARKET_DATA_API_KEY=your-api-key
MARKET_DATA_BASE_URL=https://api.marketdata.com

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=quantenergx-backend

# External Services
COMPLIANCE_API_URL=https://compliance-service.com
RISK_ENGINE_URL=https://risk-engine.com
```

### Service Configuration

Each service can be configured independently through environment variables and configuration files located in the `shared/config/` directory.

## 📊 API Documentation

### REST API Endpoints

#### Trading API (`/api/v1/trading`)
- `POST /orders` - Create new trading order
- `GET /orders` - List user orders
- `PUT /orders/:id` - Update order
- `DELETE /orders/:id` - Cancel order
- `GET /orders/:id/status` - Get order status

#### Market Data API (`/api/v1/market`)
- `GET /prices/:commodity` - Get current prices
- `GET /prices/:commodity/history` - Get historical prices
- `GET /volatility/:commodity` - Get volatility metrics
- `WebSocket /ws/market` - Real-time price updates

#### Portfolio API (`/api/v1/portfolio`)
- `GET /positions` - Get current positions
- `GET /performance` - Get performance metrics
- `GET /risk-metrics` - Get risk calculations
- `GET /pnl` - Get profit/loss summary

#### Compliance API (`/api/v1/compliance`)
- `GET /reports` - List compliance reports
- `POST /reports/generate` - Generate new report
- `GET /audit-trail` - Get transaction audit trail
- `GET /regulatory-status` - Get compliance status

### GraphQL API

The GraphQL endpoint is available at `/graphql` and provides a unified interface for complex queries across multiple services.

## 🔍 Testing

### Test Structure
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: Service-to-service communication testing
- **End-to-End Tests**: Complete workflow testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability and penetration testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run performance tests
npm run test:performance

# Run security tests
npm run test:security
```

## 📈 Performance Considerations

### Optimization Strategies
- **Database Indexing**: Optimized indexes for trading queries
- **Caching**: Redis caching for frequently accessed data
- **Connection Pooling**: Database connection optimization
- **Message Queues**: Asynchronous processing for non-critical operations
- **Load Balancing**: Horizontal scaling capabilities

### Monitoring
- **Health Checks**: Service health monitoring endpoints
- **Metrics**: Prometheus metrics collection
- **Logging**: Structured logging with correlation IDs
- **Tracing**: Distributed tracing for request flow analysis

## 🔒 Security

### Security Measures
- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control (RBAC)
- **Data Encryption**: End-to-end encryption for sensitive data
- **API Security**: Rate limiting and request validation
- **Audit Logging**: Comprehensive audit trail for all operations

### Compliance Security
- **Data Retention**: Automated data retention policies
- **Access Controls**: Strict access controls for compliance data
- **Encryption at Rest**: Database and file encryption
- **Secure Communications**: TLS encryption for all communications

## 🔧 Deployment

### Docker Deployment
```bash
# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# Scale specific services
docker-compose up -d --scale trading-engine=3
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n quantenergx
```

## 📚 Additional Resources

- [Main Project Documentation](../docs/README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.