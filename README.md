# QuantEnergx

> A comprehensive energy trading platform for oil, gas, and renewable energy markets worldwide

## 🌍 Project Vision

QuantEnergx is designed to be a market-leading energy trading platform that enables efficient trading of oil, gas, and renewable energy commodities across global markets. Our platform addresses the complex regulatory and operational requirements of energy trading in the US, UK, Europe, and Middle East markets.

## 🚀 MVP Features

### Core Trading Engine
- Real-time commodity price feeds
- Order management system (buy/sell orders)
- Portfolio tracking and risk management
- Basic settlement and clearing functionality

### Market Data Integration
- Live oil and gas price feeds
- Renewable energy certificate (REC) pricing
- Market volatility indicators
- Historical price analytics

### User Management
- Multi-role user authentication (traders, risk managers, compliance officers)
- Permission-based access control
- Activity logging and audit trails

### Basic Compliance
- Transaction reporting capabilities
- Basic regulatory compliance checks
- KYC (Know Your Customer) integration
- AML (Anti-Money Laundering) monitoring

## 🏛️ Market-Specific Requirements

### United States
- CFTC (Commodity Futures Trading Commission) compliance
- FERC (Federal Energy Regulatory Commission) reporting
- EPA renewable fuel standards integration
- State-level renewable energy certificate tracking

### United Kingdom
- Ofgem compliance and reporting
- UK ETS (Emissions Trading System) integration
- REGO (Renewable Energy Guarantees of Origin) support
- Financial Conduct Authority (FCA) requirements

### European Union
- EU ETS (Emissions Trading System) compliance
- MiFID II regulatory reporting
- REMIT (Regulation on Energy Market Integrity and Transparency)
- Guarantees of Origin (GoO) certificate management

### Middle East
- Regional regulatory frameworks adaptation
- Islamic finance compliance (Sharia-compliant trading)
- Local market data integration
- Cross-border trading regulations

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL for transactional data, Redis for caching
- **Message Queue**: Apache Kafka for real-time data streaming
- **Authentication**: JWT-based authentication with OAuth 2.0
- **API**: RESTful APIs with GraphQL for complex queries

### Frontend
- **Framework**: React.js with TypeScript
- **State Management**: Redux Toolkit
- **UI Framework**: Material-UI with custom trading components
- **Charts**: TradingView charting library for price visualization
- **Real-time**: WebSocket connections for live data

### Infrastructure
- **Cloud**: AWS/Azure with Kubernetes orchestration
- **CI/CD**: GitHub Actions for automated deployment
- **Monitoring**: Prometheus and Grafana for system monitoring
- **Security**: End-to-end encryption, VPN access, multi-factor authentication

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Docker and Docker Compose

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/akramahmed1/quantenergx.git
   cd quantenergx
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment templates
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Configure your database and API keys in the .env files
   ```

4. **Database setup**
   ```bash
   # Start PostgreSQL and Redis with Docker
   docker-compose up -d postgres redis
   
   # Run database migrations
   cd backend
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the application**
   ```bash
   # Start backend server (port 3001)
   cd backend
   npm run dev
   
   # Start frontend server (port 3000)
   cd ../frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api-docs

### Development Environment

```bash
# Run all services with Docker Compose
docker-compose up -d

# Run tests
npm run test:backend
npm run test:frontend

# Run linting
npm run lint:backend
npm run lint:frontend
```

## ☁️ Cloud Deployment

QuantEnergx supports one-click deployment on multiple cloud platforms with zero configuration.

### Render.com

Deploy both backend and frontend services automatically:

1. **Connect Repository**: Connect your GitHub repo to Render
2. **Auto-Deploy**: Render will automatically detect and deploy services using `render.yaml`
3. **Environment Variables**: Set required environment variables in Render dashboard
4. **Database**: PostgreSQL and Redis will be automatically provisioned

```bash
# Manual deployment via Render CLI
render deploy
```

**Services created:**
- `quantenergx-backend` - Node.js API service
- `quantenergx-frontend` - Static site with CDN
- `quantenergx-postgres` - PostgreSQL database
- `quantenergx-redis` - Redis cache

### Vercel (Frontend Only)

Deploy the React frontend with automatic builds:

1. **Connect Repository**: Import your repo in Vercel dashboard
2. **Configure Build**: Set build command to `cd frontend && npm run build`
3. **Auto-Deploy**: Every push to main branch triggers deployment
4. **Custom Domain**: Configure custom domain in Vercel settings

```bash
# Manual deployment via Vercel CLI
npx vercel --cwd frontend
```

**Features:**
- Automatic HTTPS and CDN
- Zero-config deployment
- Preview deployments for PRs
- Custom domains and analytics

### Railway

Deploy full-stack application with databases:

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Service Detection**: Railway automatically detects services from `railway.json`
3. **Environment Setup**: Configure environment variables in Railway dashboard
4. **Database Provisioning**: PostgreSQL and Redis are automatically set up

```bash
# Manual deployment via Railway CLI
railway up
```

**Services created:**
- Backend API service
- Frontend static hosting
- PostgreSQL database plugin
- Redis cache plugin

### Docker & Docker Compose

For any Docker-compatible cloud platform:

```bash
# Local development
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.yml up -d

# Individual services
docker build -t quantenergx-backend ./backend
docker build -t quantenergx-frontend ./frontend

# Run with custom environment
docker run -p 3001:3001 --env-file .env quantenergx-backend
docker run -p 3000:80 quantenergx-frontend
```

### Other Cloud Platforms

The provided Docker configurations work with:

- **AWS ECS/Fargate**: Use the Dockerfiles with ECS task definitions
- **Google Cloud Run**: Deploy containers directly from Docker images
- **Azure Container Instances**: Use the docker-compose.yml for multi-container deployments
- **DigitalOcean App Platform**: Connect repo and use Docker build pack
- **Heroku**: Use the Dockerfiles with heroku.yml (create heroku.yml if needed)

### Environment Variables

Required environment variables for production deployment:

**Backend:**
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key
ENFORCE_HTTPS=true
```

**Frontend:**
```bash
REACT_APP_API_URL=https://your-backend-api.com
```

### Health Checks

All services include health check endpoints:

- **Backend**: `GET /health` - Returns service status and version
- **Frontend**: `GET /health` - Simple health check for load balancers

### CI/CD Integration

The deployment configurations work with standard CI/CD workflows:

- **GitHub Actions**: Use the workflows in `.github/workflows/`
- **GitLab CI**: Compatible with Docker-based pipelines
- **Jenkins**: Use Docker build and deploy stages
- **CircleCI**: Standard Docker orb integration

## 👤 Demo Admin User

The system includes a demo admin user for testing and initial setup:

### Default Credentials
- **Username**: `admin`
- **Password**: `Admin!2025Demo`
- **Email**: `admin@quantenergx.com`
- **Role**: Administrator (full system access)

### Password Requirements
Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)

### Password Reset/Change Instructions

#### For Admin Users:
1. **Via API**: Use the `PUT /api/v1/users/profile` endpoint
2. **Via User Management**: Access the user management panel
3. **Database Reset**: Contact system administrator for manual reset

#### For Regular Users:
1. **Self-Service Reset**: Use the "Forgot Password" link on login page
2. **Admin Reset**: Admin can reset any user password via user management panel

#### Manual Password Change Process:
```bash
# Access the backend API
curl -X PUT http://localhost:3001/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPassword123!"
  }'
```

#### Security Best Practices:
- Change default admin password immediately after deployment
- Use strong, unique passwords for all accounts
- Enable MFA (Multi-Factor Authentication) for admin accounts
- Regularly rotate passwords and API keys
- Monitor audit logs for unauthorized access attempts

### Additional Security Notes:
- The demo admin user is created automatically on first system startup
- All user activities are logged in the audit trail
- Failed login attempts are tracked and accounts are temporarily locked after 5 failed attempts
- Sessions expire after 24 hours of inactivity

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- [Documentation Index](./docs/README.md) - Complete documentation overview and organization

## 🤝 Contributing

We welcome contributions to QuantEnergx! Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting pull requests.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run the test suite
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Project Board](https://github.com/akramahmed1/quantenergx/projects)
- [Issue Tracker](https://github.com/akramahmed1/quantenergx/issues)
- [Security Policy](./SECURITY.md)

## 📞 Support

For technical support and business inquiries:
- Email: support@quantenergx.com
- Documentation: [docs.quantenergx.com](https://docs.quantenergx.com)
- Community: [Discord Server](https://discord.gg/quantenergx)