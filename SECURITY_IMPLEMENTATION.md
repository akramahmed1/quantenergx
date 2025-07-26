# QuantEnergx Security Implementation Guide

## 🔒 Overview

This document outlines the comprehensive security features implemented in the QuantEnergx platform. All security measures have been designed to follow industry best practices and comply with financial services regulations.

## 🛡️ Security Features Implemented

### 1. HTTPS/TLS Enforcement

**Implementation**: Automatic HTTPS redirection in production environments
- **Location**: `backend/src/server.js`
- **Configuration**: Environment variable `ENFORCE_HTTPS=true`
- **Details**: All HTTP requests are redirected to HTTPS in production

```javascript
// HTTPS enforcement middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
  }
  next();
});
```

### 2. API Rate Limiting

**Implementation**: Multi-tier rate limiting system
- **Global Limit**: 1000 requests per 15 minutes per IP
- **Auth Endpoints**: 5 attempts per 15 minutes per IP
- **Speed Limiting**: Progressive delays for sustained traffic
- **Location**: `backend/src/server.js`

```javascript
// Rate limiting configuration
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // requests per window
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // auth attempts per window
  skipSuccessfulRequests: true
});
```

### 3. PostgreSQL Row Level Security (RLS)

**Implementation**: Comprehensive RLS policies for data isolation
- **Location**: `backend/src/database/setup_rls.sql`
- **Manager**: `backend/src/utils/databaseManager.js`
- **Features**:
  - User data isolation
  - Role-based access control
  - Audit trail protection
  - Automatic context management

**Key Policies**:
- Users can only access their own data
- Risk managers can see all trading data
- Compliance officers have audit access
- Service accounts for system operations

### 4. hCaptcha Integration

**Implementation**: Captcha verification for sensitive operations
- **Location**: `backend/src/utils/captchaUtils.js`
- **Protected Endpoints**:
  - User registration
  - User login
  - Password reset requests
  - Password reset confirmations

```javascript
// Captcha middleware usage
router.post('/auth/register',
  validationUtils.validateRegistration(),
  captchaUtils.middleware({ tokenField: 'hcaptcha_token' }),
  // ... handler
);
```

### 5. Enhanced Input Validation

**Implementation**: Comprehensive validation for all user inputs
- **Location**: `backend/src/utils/validationUtils.js`
- **Features**:
  - Email validation with disposable domain detection
  - File upload validation with type and size checks
  - Input sanitization with HTML escaping
  - Custom validation rules for business logic

**Validation Types**:
- Email addresses (RFC compliant + domain validation)
- File uploads (type, size, MIME validation)
- API payloads (structured validation with Joi)
- Form inputs (sanitization and length limits)

### 6. Advanced Password Security

**Implementation**: Argon2 password hashing with fallback support
- **Location**: `backend/src/utils/passwordUtils.js`
- **Features**:
  - Argon2id algorithm (default)
  - bcrypt fallback support
  - Password strength validation
  - Secure password generation
  - Hash migration support

```javascript
// Password hashing configuration
const argon2Options = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 1,
};
```

### 7. Server-Side API Key Management

**Implementation**: Secure API key and secret handling
- **Features**:
  - All secrets stored server-side only
  - Environment variable encryption
  - API key rotation support
  - Usage tracking and auditing

**Configuration**: Updated `.env.example` with security comments
- JWT secrets with minimum length requirements
- API encryption keys for sensitive data
- Clear server-side only annotations

### 8. Enhanced Security Headers

**Implementation**: Comprehensive security headers with CSP
- **Location**: `backend/src/server.js`
- **Features**:
  - Content Security Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      // ... other directives
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 9. Centralized Security Logging

**Implementation**: Comprehensive security event logging
- **Location**: `backend/src/utils/securityLogger.js`
- **Features**:
  - Failed login tracking
  - Suspicious activity detection
  - Security threshold monitoring
  - Audit trail for compliance
  - Real-time alerting capabilities

**Logged Events**:
- Authentication attempts (success/failure)
- Password reset activities
- API key usage
- Trading activities
- Data access events
- System errors and security violations

### 10. Static Analysis Integration

**Implementation**: Multi-tool security scanning in CI/CD
- **Location**: `.github/workflows/ci.yml`
- **Tools Integrated**:
  - ESLint with security plugins
  - Semgrep for security patterns
  - NodeJSScan for Node.js vulnerabilities
  - TruffleHog for secrets detection
  - GitLeaks for credential scanning
  - CodeQL for comprehensive analysis

### 11. Dependency Security Management

**Implementation**: Automated vulnerability scanning and fixing
- **Process**: `npm audit` integration in CI/CD
- **Tools**: Retire.js for known vulnerable libraries
- **Automation**: Automated dependency updates with security focus
- **Current Status**: Resolved critical vulnerabilities in telegram bot dependencies

## 🔧 Configuration

### Environment Variables

```bash
# Security Configuration
ENFORCE_HTTPS=true
PASSWORD_ALGORITHM=argon2
BCRYPT_ROUNDS=12

# hCaptcha Configuration
HCAPTCHA_ENABLED=true
HCAPTCHA_SITE_KEY=your-hcaptcha-site-key
HCAPTCHA_SECRET_KEY=your-hcaptcha-secret-key

# Database Security
DATABASE_URL=postgresql://user:password@localhost:5432/quantenergx

# JWT Security (Server-side only)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars

# API Security
API_ENCRYPTION_KEY=your-32-char-encryption-key-here

# Logging and Monitoring
AUDIT_LOG_ENABLED=true
SECURITY_LOG_ENABLED=true
```

### Database Setup

1. **Create Database Schema**:
   ```bash
   node -e "require('./src/utils/databaseManager').createSecureSchema()"
   ```

2. **Initialize RLS Policies**:
   ```bash
   node -e "require('./src/utils/databaseManager').initializeRLS()"
   ```

3. **Verify RLS Status**:
   ```bash
   node -e "require('./src/utils/databaseManager').isRLSEnabled('users').then(console.log)"
   ```

## 🧪 Testing Security Features

### Running Security Tests

```bash
# Backend security tests
cd backend
npm run test:security

# Full security scan
npm run test:all

# Static analysis
npm run lint:security
```

### Manual Security Testing

1. **Rate Limiting Test**:
   ```bash
   # Test auth rate limiting
   for i in {1..10}; do
     curl -X POST http://localhost:3001/api/v1/users/auth/login \
       -H "Content-Type: application/json" \
       -d '{"username":"test","password":"test","hcaptcha_token":"test"}'
   done
   ```

2. **Input Validation Test**:
   ```bash
   # Test XSS protection
   curl -X POST http://localhost:3001/api/v1/users/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"<script>alert(\"xss\")</script>","email":"test@test.com","password":"Test123!","firstName":"Test","lastName":"User","hcaptcha_token":"test"}'
   ```

3. **Security Headers Test**:
   ```bash
   curl -I http://localhost:3001/health
   ```

## 📊 Security Monitoring

### Security Metrics Dashboard

The security logger provides real-time metrics:

```javascript
const securityLogger = require('./src/utils/securityLogger');
const metrics = securityLogger.getSecurityMetrics();
console.log(metrics);
```

### Alerting Thresholds

- **Failed Logins**: 5 per IP per 15 minutes
- **Suspicious Activity**: 10 per IP per hour
- **Error Rate**: 50 5xx errors per minute
- **Traffic Spike**: 1000 requests per minute

## 🚨 Incident Response

### Security Event Response

1. **Failed Login Threshold Exceeded**:
   - Automatic IP blocking (temporary)
   - Security team notification
   - Audit log investigation

2. **Suspicious Activity Detected**:
   - Enhanced monitoring activation
   - Manual review trigger
   - Potential account lockdown

3. **Dependency Vulnerability**:
   - Automated security patch process
   - Impact assessment
   - Emergency deployment if critical

## 📋 Security Checklist for PRs

### Required Security Reviews

- [ ] All new endpoints have authentication
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Captcha integrated (where applicable)
- [ ] Error handling doesn't leak information
- [ ] Audit logging added
- [ ] Security tests written
- [ ] Static analysis passes
- [ ] No secrets in code
- [ ] Documentation updated

### Security Review Process

1. **Automated Checks**: CI/CD security pipeline
2. **Peer Review**: Code review with security focus
3. **Security Team Review**: For significant changes
4. **Penetration Testing**: For major features

## 🔄 Continuous Security

### Regular Security Tasks

- **Weekly**: Dependency vulnerability scans
- **Monthly**: Security metric reviews
- **Quarterly**: Penetration testing
- **Annually**: Security architecture review

### Security Updates

- Automated dependency updates for security patches
- Regular security tool updates
- Continuous monitoring of security advisories
- Proactive vulnerability assessments

## 📞 Security Contacts

For security issues or questions:
- **Security Team**: security@quantenergx.com
- **Emergency**: Follow incident response procedure
- **Vulnerability Reports**: Use responsible disclosure process

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Remember**: Security is an ongoing process, not a one-time implementation. Regular reviews, updates, and testing are essential for maintaining a secure platform.