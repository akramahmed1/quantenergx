const winston = require('winston');
const path = require('path');

/**
 * Enhanced logging and monitoring utility
 * Provides centralized logging for security events and system monitoring
 */
class SecurityLogger {
  constructor() {
    this.initializeLoggers();
    this.securityEvents = new Map(); // In-memory tracking for recent events
    this.alertThresholds = {
      failedLogins: 5, // per IP per 15 minutes
      suspiciousActivity: 10, // per IP per hour
      errorRate: 50, // 5xx errors per minute
      trafficSpike: 1000, // requests per minute
    };
  }

  initializeLoggers() {
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, '../../logs');

    // Main application logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'quantenergx-backend' },
      transports: [
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ],
    });

    // Security-specific logger
    this.securityLogger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      defaultMeta: { service: 'quantenergx-security' },
      transports: [
        new winston.transports.File({
          filename: path.join(logsDir, 'security.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        }),
      ],
    });

    // Audit logger for compliance
    this.auditLogger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      defaultMeta: { service: 'quantenergx-audit' },
      transports: [
        new winston.transports.File({
          filename: path.join(logsDir, 'audit.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 20,
        }),
      ],
    });

    // Console logging in development
    if (process.env.NODE_ENV !== 'production') {
      const consoleFormat = winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      );

      this.logger.add(new winston.transports.Console({ format: consoleFormat }));
      this.securityLogger.add(new winston.transports.Console({ format: consoleFormat }));
    }
  }

  /**
   * Log failed login attempts
   */
  logFailedLogin(username, ip, userAgent, reason = 'invalid_credentials') {
    const event = {
      event: 'failed_login',
      username,
      ip,
      userAgent,
      reason,
      timestamp: new Date().toISOString(),
    };

    this.securityLogger.warn('Failed login attempt', event);
    this.trackSecurityEvent('failed_login', ip);
  }

  /**
   * Log successful login
   */
  logSuccessfulLogin(userId, username, ip, userAgent, mfaUsed = false) {
    const event = {
      event: 'successful_login',
      userId,
      username,
      ip,
      userAgent,
      mfaUsed,
      timestamp: new Date().toISOString(),
    };

    this.securityLogger.info('Successful login', event);
    this.auditLogger.info('User login', event);
  }

  /**
   * Log password reset requests
   */
  logPasswordReset(email, ip, userAgent, action = 'request') {
    const event = {
      event: 'password_reset',
      action, // 'request' or 'confirm'
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    this.securityLogger.info('Password reset activity', event);
    this.auditLogger.info('Password reset', event);
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(type, details, ip, userAgent) {
    const event = {
      event: 'suspicious_activity',
      type, // 'rate_limit_exceeded', 'invalid_request', 'unauthorized_access'
      details,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    this.securityLogger.warn('Suspicious activity detected', event);
    this.trackSecurityEvent('suspicious_activity', ip);
  }

  /**
   * Log API key usage
   */
  logApiKeyUsage(keyId, endpoint, ip, success = true) {
    const event = {
      event: 'api_key_usage',
      keyId,
      endpoint,
      ip,
      success,
      timestamp: new Date().toISOString(),
    };

    this.auditLogger.info('API key usage', event);
  }

  /**
   * Log system errors
   */
  logSystemError(error, context = {}) {
    this.logger.error('System error', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log trading activity
   */
  logTradingActivity(userId, action, details) {
    const event = {
      event: 'trading_activity',
      userId,
      action, // 'order_placed', 'order_cancelled', 'trade_executed'
      details,
      timestamp: new Date().toISOString(),
    };

    this.auditLogger.info('Trading activity', event);
  }

  /**
   * Log data access
   */
  logDataAccess(userId, dataType, operation, recordId = null) {
    const event = {
      event: 'data_access',
      userId,
      dataType, // 'user_data', 'market_data', 'compliance_report'
      operation, // 'read', 'create', 'update', 'delete'
      recordId,
      timestamp: new Date().toISOString(),
    };

    this.auditLogger.info('Data access', event);
  }

  /**
   * Track security events for threshold monitoring
   */
  trackSecurityEvent(eventType, ip) {
    const now = Date.now();
    const key = `${eventType}:${ip}`;

    if (!this.securityEvents.has(key)) {
      this.securityEvents.set(key, []);
    }

    const events = this.securityEvents.get(key);
    events.push(now);

    // Clean up old events (older than 1 hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentEvents = events.filter(timestamp => timestamp > oneHourAgo);
    this.securityEvents.set(key, recentEvents);

    // Check thresholds
    this.checkSecurityThresholds(eventType, ip, recentEvents.length);
  }

  /**
   * Check if security thresholds are exceeded
   */
  checkSecurityThresholds(eventType, ip, eventCount) {
    const threshold = this.alertThresholds[eventType];

    if (threshold && eventCount >= threshold) {
      this.securityLogger.error('Security threshold exceeded', {
        event: 'threshold_exceeded',
        eventType,
        ip,
        eventCount,
        threshold,
        timestamp: new Date().toISOString(),
      });

      // In a real implementation, this would trigger alerts
      console.warn(
        `SECURITY ALERT: ${eventType} threshold exceeded for IP ${ip}: ${eventCount}/${threshold}`
      );
    }
  }

  /**
   * Middleware to log HTTP requests
   */
  requestLogger() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Log request
      this.logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || null,
        timestamp: new Date().toISOString(),
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function (...args) {
        const duration = Date.now() - startTime;

        // Log response
        this.logger.info('HTTP Response', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userId: req.user?.id || null,
          timestamp: new Date().toISOString(),
        });

        // Check for 5xx errors
        if (res.statusCode >= 500) {
          this.logSystemError(new Error(`HTTP ${res.statusCode} error`), {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
          });
        }

        originalEnd.apply(res, args);
      }.bind(this);

      next();
    };
  }

  /**
   * Get security metrics for monitoring dashboard
   */
  getSecurityMetrics() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const metrics = {
      failedLogins: 0,
      suspiciousActivity: 0,
      uniqueIPs: new Set(),
      timestamp: new Date().toISOString(),
    };

    for (const [key, events] of this.securityEvents) {
      const [eventType, ip] = key.split(':');
      const recentEvents = events.filter(timestamp => timestamp > oneHourAgo);

      if (recentEvents.length > 0) {
        metrics.uniqueIPs.add(ip);

        if (eventType === 'failed_login') {
          metrics.failedLogins += recentEvents.length;
        } else if (eventType === 'suspicious_activity') {
          metrics.suspiciousActivity += recentEvents.length;
        }
      }
    }

    metrics.uniqueIPs = metrics.uniqueIPs.size;
    return metrics;
  }
}

module.exports = new SecurityLogger();
