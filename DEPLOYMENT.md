# QuantEnergx Deployment Guide

## Overview

This guide covers the comprehensive automated deployment setup for QuantEnergx across multiple cloud platforms: Vercel, Render, and Railway.

## Prerequisites

### Required GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Vercel Deployment
- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

#### Render Deployment
- `RENDER_DEPLOY_HOOK_URL`: Webhook URL for triggering deployments
- `RENDER_API_KEY`: Render API key for authentication
- `RENDER_APP_URL`: Your Render application URL (for health checks)

#### Railway Deployment
- `RAILWAY_TOKEN`: Railway authentication token
- `RAILWAY_APP_URL`: Your Railway application URL (for health checks)

#### Application Environment Variables
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_REFRESH_SECRET`: Secret key for JWT refresh tokens
- `DATABASE_URL`: PostgreSQL database connection string
- `REDIS_URL`: Redis connection string
- `API_KEY`: Application API key
- `ENCRYPTION_KEY`: Data encryption key

#### Optional Integrations
- `SLACK_WEBHOOK_URL`: Slack webhook for deployment notifications

## Local Development

### Setup Commands
```bash
# Install all dependencies
npm install

# Build the application
npm run build

# Start development servers
npm start

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