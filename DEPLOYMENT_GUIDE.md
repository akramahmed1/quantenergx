# QuantEnergx Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- Docker and Docker Compose (for local development)
- Git

### 1. Clone and Setup
```bash
git clone https://github.com/akramahmed1/quantenergx.git
cd quantenergx

# Install all dependencies
npm run install:all
```

### 2. Environment Configuration
```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the .env files with your configuration
```

### 3. Quick Start with Docker (Recommended)
```bash
# Start all services (frontend, backend, database, redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### 4. Manual Development Setup
```bash
# Start backend
cd backend
npm run dev

# Start frontend (in new terminal)
cd frontend
npm start
```

## 🔐 Authentication & Demo Access

### Default Demo Credentials
The application includes pre-configured demo users for testing:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Administrator | `admin` | `Admin!2025Demo` | Full system access |
| Trader | `trader1` | `Trader!2025Demo` | Trading operations |
| Risk Manager | `risk1` | `Risk!2025Demo` | Risk management |

### Login Process
1. Navigate to http://localhost:3000
2. Application automatically redirects to `/login`
3. Click "View Demo Credentials" to see available accounts
4. Click any credential box to auto-fill the form
5. Click "Sign In" to authenticate

## 🛠️ Troubleshooting

### Common Issues

#### 1. Blank Page at http://localhost:3000
**Problem**: Frontend shows blank page or wrong path
**Solution**: 
```bash
# Check if homepage is set correctly in frontend/package.json
"homepage": "/"

# Restart frontend server
npm start
```

#### 2. Authentication Errors
**Problem**: "validation_failed" or "Captcha verification required"
**Solution**:
```bash
# Ensure hCAPTCHA is disabled for local development
echo "HCAPTCHA_ENABLED=false" >> backend/.env

# Restart backend
cd backend && npm run build && npm start
```

#### 3. Backend Connection Issues
**Problem**: Frontend can't connect to backend
**Solution**:
```bash
# Check backend is running on port 3001
curl http://localhost:3001/health

# Verify frontend API URL
echo "REACT_APP_API_URL=http://localhost:3001" >> frontend/.env
```

#### 4. Database Connection Errors
**Problem**: Backend fails to start due to database issues
**Solution**:
```bash
# For local development, database is optional
# Backend will create in-memory users automatically
# No action needed for basic testing
```

#### 5. Dependency Vulnerabilities
**Problem**: npm audit shows vulnerabilities
**Solution**:
```bash
# Fixed most critical vulnerabilities
# Remaining are in dev dependencies and don't affect production

# To address remaining issues:
npm audit fix
npm audit fix --force  # For breaking changes (use with caution)
```

## ☁️ Cloud Deployment

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

### Render (Backend)
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && npm start`
5. Add environment variables in Render dashboard

### Railway (Full Stack)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway up
```

### Environment Variables for Production

#### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
ENFORCE_HTTPS=true
HCAPTCHA_ENABLED=true
HCAPTCHA_SITE_KEY=your-production-site-key
HCAPTCHA_SECRET_KEY=your-production-secret-key
JWT_SECRET=your-secure-32-char-production-secret
JWT_REFRESH_SECRET=your-secure-32-char-refresh-secret
DATABASE_URL=your-production-database-url
REDIS_URL=your-production-redis-url
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-backend-api.com
REACT_APP_HCAPTCHA_SITE_KEY=your-production-site-key
REACT_APP_ENVIRONMENT=production
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run security audit
npm run security:audit

# Run linting
npm run lint
```

### E2E Testing
```bash
# Start application first
npm start

# Run E2E tests
npm run e2e
```

## 📊 Monitoring

### Health Checks
- Frontend: http://localhost:3000/health
- Backend: http://localhost:3001/health

### Logs
```bash
# View application logs
docker-compose logs -f

# Backend logs
cd backend && npm run dev  # Shows real-time logs

# Check log files
tail -f backend/logs/combined.log
```

## 🔧 Development Scripts

### Root Package Scripts
```bash
npm run install:all     # Install all dependencies
npm run build          # Build both frontend and backend
npm start              # Start both services
npm test               # Run all tests
npm run lint           # Lint all code
npm run security:audit # Security audit
```

### Backend Scripts
```bash
npm run build         # TypeScript compilation
npm start            # Production server
npm run dev          # Development server with hot reload
npm run test         # Jest tests
npm run lint         # ESLint
npm run security:scan # Security scanning
```

### Frontend Scripts
```bash
npm start            # Development server
npm run build        # Production build
npm test             # React tests
npm run lint         # ESLint + TypeScript
npm run type-check   # TypeScript validation
```

## 🚨 Security Considerations

### Production Checklist
- [ ] Change all default passwords
- [ ] Set secure JWT secrets (minimum 32 characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure hCAPTCHA for production
- [ ] Set up proper database with authentication
- [ ] Enable rate limiting
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Enable dependency scanning
- [ ] Configure firewall rules

### Security Features Included
- ✅ JWT token authentication
- ✅ Password hashing with Argon2
- ✅ Rate limiting on API endpoints
- ✅ Security headers (Helmet.js)
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ hCAPTCHA integration
- ✅ Audit logging
- ✅ Session management

## 📞 Support

### Getting Help
- Check this troubleshooting guide first
- Review the logs for error messages
- Check GitHub Issues for known problems
- Create a new issue with:
  - Steps to reproduce
  - Error messages/logs
  - Environment details (Node version, OS, etc.)

### Useful Commands
```bash
# Check versions
node --version
npm --version
docker --version

# Reset everything
docker-compose down -v
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all

# Clean build
npm run build
```