# QuantEnergx Deployment Guide

## Overview

This guide covers the **automated CI/CD deployment** strategy for QuantEnergx, following modern DevOps best practices. The frontend and backend are deployed independently using a streamlined, zero-touch CI/CD pipeline.

## 🚀 Quick Start

### Automated Deployment (Recommended)

All deployments are handled automatically through GitHub Actions:

1. **Push to main branch** → Automatic deployment to production
2. **Create pull request** → Preview deployments with status comments
3. **Emergency deployments** → Use the emergency workflow for critical fixes

### Manual Verification

```bash
# Verify all deployments quickly
./scripts/deployment-verification.sh

# Validate local setup before pushing
./scripts/validate-local-ci.sh
```

## 🏗️ Architecture Overview

### Frontend Deployment (Vercel)
- **Platform**: Vercel (optimized for React SPAs)
- **Source**: `frontend/` directory
- **Build**: Static assets with CDN delivery
- **Security**: CSP headers, HTTPS enforced
- **Health Check**: `/health` endpoint via nginx configuration

### Backend Deployment (Render + Railway)
- **Platforms**: Render.com and Railway (redundancy + load balancing)
- **Source**: `backend/` directory  
- **Services**: Node.js API, PostgreSQL, Redis
- **Security**: Rate limiting, secure headers, secret management
- **Health Check**: `/health` and `/api/v1/info` endpoints

## 🔧 CI/CD Workflow Architecture

### Main Workflow (`main-ci-cd.yml`)

The primary deployment pipeline that runs on every push to main and pull requests:

1. **Setup & Pre-checks**: Detects changed files and determines deployment strategy
2. **Security Scan**: CodeQL analysis and dependency auditing
3. **Parallel Build & Test**: 
   - Backend: Lint, test, coverage reporting
   - Frontend: Lint, type-check, build, test
4. **Conditional Deployment**: Only deploys changed components
5. **Health Verification**: Post-deployment health checks with retry logic
6. **Status Reporting**: PR comments with deployment URLs and coverage

### Emergency Workflow (`emergency-deploy.yml`)

For critical hotfixes requiring immediate deployment:

```bash
# Trigger via GitHub Actions UI
# Requires: environment, reason, optional skip-tests flag
```

### Standalone Workflows

- **Frontend/Backend**: Weekly maintenance runs and manual testing
- **Legacy Workflows**: Preserved for reference but disabled

## 🔑 Required GitHub Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

#### Frontend Deployment (Vercel)
```
VERCEL_TOKEN=your-vercel-auth-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
VERCEL_APP_URL=https://your-app.vercel.app
```

#### Backend Deployment (Render)
```
RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/your-service-id
RENDER_API_KEY=your-render-api-key
RENDER_APP_URL=https://your-backend.onrender.com
```

#### Backend Deployment (Railway)
```
RAILWAY_TOKEN=your-railway-token
RAILWAY_APP_URL=https://your-backend.railway.app
```

#### Application Environment Variables
```
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32-chars-minimum

# Database
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://user:password@host:port

# API Security
API_KEY=your-api-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Frontend Configuration
REACT_APP_API_URL=https://your-backend.onrender.com
```

#### Additional Secrets
```
CODECOV_TOKEN=your-codecov-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
SNYK_TOKEN=your-snyk-token-for-security-scanning
```

## 🚀 Deployment Process

### Automatic Deployment (Primary Method)

1. **Code Changes**: Push to main branch or create PR
2. **Automatic Trigger**: GitHub Actions detects changes
3. **Intelligent Building**: Only builds changed components (frontend/backend)
4. **Parallel Deployment**: Simultaneous deployment to all platforms
5. **Health Verification**: Automated health checks with retries
6. **Status Reporting**: PR comments with deployment status

### Deployment Targets

| Platform | Component | URL Pattern | Purpose |
|----------|-----------|-------------|---------|
| Vercel | Frontend | `https://your-app.vercel.app` | React SPA hosting |
| Render | Backend | `https://your-backend.onrender.com` | API + Database |
| Railway | Backend | `https://your-backend.railway.app` | Container deployment |

### Health Check Endpoints

- **Frontend**: `GET /health` → Returns "healthy"
- **Backend**: `GET /health` → Returns JSON with service status
- **Backend**: `GET /api/v1/info` → Returns API information

#### Frontend Pipeline (`.github/workflows/frontend.yml`)
1. **Lint & Security**: ESLint, Prettier, TypeScript checks, security audit
2. **Test**: Unit tests with coverage reporting  
3. **Build**: Production React build with optimizations
4. **Deploy**: Automatic deployment to Vercel on main branch
5. **Security Check**: Validate security headers post-deployment

#### Backend Pipeline (`.github/workflows/backend.yml`)
1. **Security Scan**: Semgrep, TruffleHog, ESLint security rules
2. **Lint & Test**: ESLint, unit tests, integration tests, coverage
3. **Advanced Testing**: Contract tests, fuzz testing, mutation testing
4. **Build**: Create deployment package
5. **Deploy**: Parallel deployment to Render and Railway
6. **Security Tests**: Rate limiting, security headers, HTTPS enforcement

### Manual Deployment

#### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

#### Backend (Render)
```bash
# Trigger deployment via webhook
curl -X POST "$RENDER_DEPLOY_HOOK_URL" \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

#### Backend (Railway)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy from backend directory  
cd backend
railway deploy
```

## 💻 Local Development

### Quick Start
```bash
# Method 1: Docker Compose (Recommended)
docker-compose up -d

# Method 2: Manual startup
npm run install:all
npm start
```

### Environment Setup
```bash
# Copy and configure environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your local configuration
```

### Development URLs
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001  
- **Health Checks**: 
  - Frontend: http://localhost:3000/health
  - Backend: http://localhost:3001/health

## 🔐 Security Management

### Secret Management Best Practices

1. **Never commit secrets** to repository
2. **Use GitHub Secrets** for CI/CD environment variables
3. **Rotate secrets regularly** (quarterly minimum)
4. **Use different secrets** for development, staging, production
5. **Audit secret access** through GitHub audit logs

### Environment File Security
```bash
# ✅ Good - These files are included
.env.example

# ❌ Never commit these files  
.env
.env.local
.env.production
secrets.json
credentials.json
```

### Security Headers
The platform implements comprehensive security headers:
- Content Security Policy (CSP)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- X-XSS-Protection (XSS filtering)
- Strict-Transport-Security (HTTPS enforcement)

## 🧪 Testing and Verification

### Automated Testing Pipeline

The CI/CD pipeline includes comprehensive testing:

1. **Code Quality**: ESLint, Prettier, TypeScript checks
2. **Unit Tests**: Jest with coverage reporting
3. **Security Audits**: npm audit, CodeQL, dependency scanning
4. **Health Checks**: Post-deployment endpoint verification

### Local Development Testing

```bash
# Complete local validation (recommended before pushing)
./scripts/validate-local-ci.sh

# Quick build and test
npm run build
npm run test

# Local development
npm run install:all
npm start  # Starts both frontend and backend
```

### Manual Verification

```bash
# Verify deployments
./scripts/deployment-verification.sh

# Test specific endpoints
curl https://your-app.vercel.app/health
curl https://your-backend.onrender.com/health
curl https://your-backend.onrender.com/api/v1/info
```

### Development URLs (Local)
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001  
- **Health Checks**: 
  - Frontend: http://localhost:3000/health
  - Backend: http://localhost:3001/health

## 🔐 Security Features

### Implemented Security Measures

1. **Headers**: CSP, X-Frame-Options, X-Content-Type-Options, HSTS
2. **Rate Limiting**: API endpoint protection
3. **Secret Management**: GitHub Secrets for sensitive data
4. **HTTPS Enforcement**: All production traffic encrypted
5. **Dependency Scanning**: Automated vulnerability detection
6. **Code Analysis**: Static analysis with CodeQL

## 🚨 Troubleshooting

### Common Issues

#### Frontend Build Failures
```bash
# Check Node.js version (requires 18+)
node --version

# Clear build cache
rm -rf frontend/node_modules frontend/build
cd frontend && npm ci && npm run build
```

#### Backend Deployment Issues  
```bash
# Check environment variables
echo $DATABASE_URL
echo $JWT_SECRET

# Test local backend
cd backend && npm start
curl http://localhost:3001/health
```

#### Database Connection Problems
```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check Redis connectivity  
redis-cli -u $REDIS_URL ping
```

### Deployment Status Monitoring

#### Vercel Deployment Logs
- Visit: https://vercel.com/dashboard
- Select your project → Deployments tab
- View real-time logs and build status

#### Render Deployment Logs
- Visit: https://dashboard.render.com
- Select your service → Logs tab
- Monitor deployment progress and errors

#### Railway Deployment Logs
- Visit: https://railway.app/dashboard
- Select your project → Service → Logs
- Real-time deployment monitoring

### Performance Monitoring
```bash
# Frontend performance
curl -w "@curl-format.txt" -o /dev/null -s https://your-app.vercel.app

# Backend performance
curl -w "@curl-format.txt" -o /dev/null -s https://your-backend.onrender.com/health
```

## 📞 Support

### Getting Help
1. **Check deployment logs** first (see monitoring section above)
2. **Review GitHub Actions** for CI/CD pipeline failures
3. **Validate environment variables** and secrets configuration
4. **Test locally** before cloud deployment
5. **Create GitHub issue** with logs and error details

### Emergency Contacts
- **Platform Issues**: Check status pages
  - [Vercel Status](https://vercel-status.com)
  - [Render Status](https://status.render.com)  
  - [Railway Status](https://status.railway.app)

### Rollback Procedures
```bash
# Rollback frontend (Vercel)
vercel rollback [deployment-url]

# Rollback backend (via re-deployment)
# Use previous commit SHA in deployment webhook
```

## 🔍 Deployment Verification

### Automated Health Check
Use the provided script to verify your deployments:

```bash
# Set your deployment URLs
export FRONTEND_URL="https://your-app.vercel.app"
export BACKEND_URL="https://your-backend.onrender.com"

# Run health check
./scripts/check-deployment.sh
```

### Manual Verification Steps

#### 1. Health Endpoints
```bash
# Frontend health check
curl https://your-app.vercel.app/health
# Expected: "healthy"

# Backend health check  
curl https://your-backend.onrender.com/health
# Expected: JSON with status "healthy"
```

#### 2. Security Headers
```bash
# Check security headers
curl -I https://your-app.vercel.app | grep -E "(X-Frame-Options|Content-Security-Policy)"
curl -I https://your-backend.onrender.com | grep -E "(X-Frame-Options|Strict-Transport-Security)"
```

#### 3. Admin Login Test
1. Navigate to: `https://your-app.vercel.app/login`
2. Username: `admin`
3. Password: `Admin!2025Demo`
4. Verify successful authentication and dashboard access

#### 4. API Functionality
```bash
# Test API info endpoint
curl https://your-backend.onrender.com/api/v1/info

# Test authentication (should return validation error)
curl -X POST https://your-backend.onrender.com/api/v1/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}'
```

### Post-Deployment Checklist
- [ ] Frontend health endpoint responds
- [ ] Backend health endpoint responds  
- [ ] Security headers are present
- [ ] Admin login works
- [ ] API endpoints are accessible
- [ ] Database connections are stable
- [ ] Redis cache is working
- [ ] CI/CD pipelines completed successfully
- [ ] Monitoring and alerts are configured

# Run tests
npm test

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Environment Setup
1. Copy `.env.example` files in both `backend/` and `frontend/` directories
2. Rename them to `.env`
3. Fill in the required environment variables

## Deployment Process

### Automatic Deployment

The unified deployment workflow (`unified-deployment.yml`) automatically:

1. **Build & Test Phase**:
   - Installs dependencies for all workspaces
   - Runs linting (with soft fail for warnings)
   - Builds both frontend and backend
   - Runs comprehensive test suites with coverage reporting
   - Uploads coverage to Codecov

2. **Security Scan Phase**:
   - Performs npm security audits
   - Runs CodeQL static analysis
   - Checks for secrets and vulnerabilities

3. **Deployment Phase** (on main/master branch only):
   - **Vercel**: Full-stack deployment with serverless functions
   - **Render**: Static frontend + Node.js backend with database
   - **Railway**: Containerized deployment with plugins

4. **Post-Deployment Phase**:
   - Health checks for all platforms
   - Deployment status reporting in PR comments
   - Slack notifications (if configured)

### Manual Deployment

#### Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Render
Deployments are triggered via webhook or through the Render dashboard.

#### Railway
```bash
npm install -g @railway/cli
railway login
railway up
```

## Platform-Specific Configuration

### Vercel Configuration (`vercel.json`)
- Routes API calls to backend serverless functions
- Serves static frontend files
- Implements security headers and caching
- Handles SPA routing with catch-all routes

### Render Configuration (`render.yaml`)
- Separate services for frontend (static) and backend (web service)
- PostgreSQL and Redis databases
- Auto-generated environment variables
- Security headers and health checks

### Railway Configuration (`railway.json`)
- Multi-service deployment with shared networking
- PostgreSQL and Redis plugins
- Environment variable management
- Static file serving with caching

## Environment Variables

### Backend Environment Variables
```
NODE_ENV=production
PORT=3001
GRPC_PORT=50051
JWT_SECRET=<secure-random-string>
JWT_REFRESH_SECRET=<secure-random-string>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
DATABASE_URL=<postgresql-connection-string>
REDIS_URL=<redis-connection-string>
LOG_LEVEL=info
ENFORCE_HTTPS=true
API_KEY=<api-key>
ENCRYPTION_KEY=<encryption-key>
```

### Frontend Environment Variables
```
REACT_APP_API_URL=<backend-api-url>
REACT_APP_ENVIRONMENT=production
```

## Health Checks

All platforms include health check endpoints:
- **Endpoint**: `/health`
- **Method**: GET
- **Response**: `200 OK` with service status

## Monitoring and Alerts

### Coverage Reporting
- Code coverage is automatically uploaded to Codecov
- Coverage badges can be added to README.md
- Minimum coverage thresholds can be enforced

### Deployment Status
- PR comments include deployment URLs and status
- Failed deployments trigger notifications
- Health checks verify post-deployment functionality

### Security Monitoring
- Automated security scans on every push
- Dependency vulnerability alerts
- Code quality checks with ESLint

## Troubleshooting

### Common Issues

#### Build Failures
- Check Node.js version compatibility (requires 18+)
- Verify all dependencies are installed
- Review linting errors and fix critical issues

#### Deployment Failures
- Verify all required secrets are configured
- Check platform-specific logs for detailed errors
- Ensure environment variables are properly set

#### Health Check Failures
- Verify database connections
- Check Redis connectivity
- Review application logs for startup errors

### Debug Commands
```bash
# Check build output
npm run build

# Verify linting
npm run lint

# Test database connection
npm run db:migrate

# Check test coverage
npm run test:coverage
```

## Security Best Practices

### Secrets Management
- Never commit secrets to version control
- Use GitHub Secrets for CI/CD environment variables
- Rotate secrets regularly
- Use different secrets for different environments

### Application Security
- HTTPS enforcement on all platforms
- Security headers implementation
- Input validation and sanitization
- Regular dependency updates

### Database Security
- Use connection pooling
- Implement proper access controls
- Regular backups
- Encryption at rest and in transit

## Performance Optimization

### Frontend
- Static asset caching with long-term cache headers
- Code splitting and lazy loading
- Image optimization
- Bundle size monitoring

### Backend
- Database query optimization
- Redis caching implementation
- API rate limiting
- Horizontal scaling capabilities

## Future Improvements

### Planned Enhancements
1. **Blue-Green Deployments**: Zero-downtime deployment strategy
2. **Canary Releases**: Gradual rollout with traffic splitting
3. **Multi-Environment Support**: Staging and production environments
4. **Enhanced Monitoring**: Application performance monitoring (APM)
5. **Automated Rollbacks**: Automatic rollback on health check failures

### Infrastructure as Code
- Terraform configurations for cloud resources
- Kubernetes deployment manifests
- Docker Compose for local development

## Support

For deployment issues or questions:
1. Check this documentation first
2. Review GitHub Actions logs
3. Check platform-specific dashboards
4. Contact the development team

## License

This deployment configuration is part of the QuantEnergx project and follows the same MIT license terms.