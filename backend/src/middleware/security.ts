import { Request, Response, NextFunction } from 'express';

/**
 * Security middleware for QuantEnergx multi-region oil and gas trading platform
 * 
 * Provides strict security headers for compliance with financial trading regulations:
 * - Content Security Policy (CSP) with strict directives
 * - HTTP Strict Transport Security (HSTS) with preload
 * - X-Frame-Options to prevent clickjacking
 * - X-Content-Type-Options to prevent MIME sniffing
 * - X-XSS-Protection for legacy browser protection
 * - Referrer Policy for privacy protection
 * - Permissions Policy for feature restrictions
 */

interface SecurityConfig {
  enforceHttps?: boolean;
  hstsMaxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
  cspDirectives?: Record<string, string[]>;
}

export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      enforceHttps: process.env.NODE_ENV === 'production',
      hstsMaxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
      cspDirectives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", 'wss:', 'ws:'],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': []
      },
      ...config
    };
  }

  /**
   * HTTPS enforcement middleware for production environments
   * Redirects HTTP traffic to HTTPS for secure trading operations
   */
  public enforceHttps = (req: Request, res: Response, next: NextFunction): void => {
    if (this.config.enforceHttps) {
      // Check various headers that indicate HTTPS/TLS termination
      const isSecure = req.secure || 
                      req.get('x-forwarded-proto') === 'https' ||
                      req.get('x-forwarded-ssl') === 'on' ||
                      req.get('x-url-scheme') === 'https';

      if (!isSecure) {
        return res.redirect(301, `https://${req.get('host')}${req.url}`);
      }
    }
    next();
  };

  /**
   * Comprehensive security headers middleware
   * Sets all required security headers for financial trading compliance
   */
  public setSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // HTTP Strict Transport Security (HSTS)
    if (this.config.enforceHttps) {
      let hstsValue = `max-age=${this.config.hstsMaxAge}`;
      if (this.config.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (this.config.preload) {
        hstsValue += '; preload';
      }
      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    // Content Security Policy (CSP) - Strict policy for trading platform
    const cspDirectives = Object.entries(this.config.cspDirectives || {})
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive; // For directives like upgrade-insecure-requests
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');
    
    res.setHeader('Content-Security-Policy', cspDirectives);

    // X-Frame-Options - Prevent clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');

    // X-Content-Type-Options - Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection - Legacy XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy - Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (formerly Feature Policy)
    // Restrict access to powerful browser APIs for security
    const permissionsPolicy = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'bluetooth=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', ');
    res.setHeader('Permissions-Policy', permissionsPolicy);

    // X-Permitted-Cross-Domain-Policies - Restrict cross-domain access
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Cross-Origin-Embedder-Policy - Isolate browsing context
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cross-Origin-Opener-Policy - Isolate browsing context
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin-Resource-Policy - Control cross-origin resource access
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Cache-Control for sensitive trading data
    if (req.path.includes('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  };

  /**
   * Regional compliance middleware
   * Adds specific headers based on regional trading requirements
   */
  public setRegionalHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Extract region from request (could be from subdomain, header, or path)
    const region = this.getRegionFromRequest(req);

    switch (region) {
      case 'bahrain':
        // Central Bank of Bahrain (CBB) compliance headers
        res.setHeader('X-CBB-Compliance', 'enabled');
        res.setHeader('X-Financial-Regulation', 'CBB-2023');
        break;
      case 'guyana':
        // Guyana regulatory compliance
        res.setHeader('X-Environmental-Compliance', 'enabled');
        res.setHeader('X-Energy-Regulation', 'GUYANA-EPA-2023');
        break;
      case 'eu':
        // European Union compliance
        res.setHeader('X-GDPR-Compliance', 'enabled');
        res.setHeader('X-MiFID-II', 'compliant');
        break;
      case 'us':
        // United States compliance
        res.setHeader('X-SOX-Compliance', 'enabled');
        res.setHeader('X-CFTC-Regulation', 'compliant');
        break;
      case 'me':
        // Middle East compliance
        res.setHeader('X-Islamic-Finance', 'sharia-compliant');
        res.setHeader('X-ADGM-Regulation', 'compliant');
        break;
    }

    // Add region identifier for logging and monitoring
    res.setHeader('X-Trading-Region', region || 'global');
    
    next();
  };

  /**
   * Extract region from request
   * Supports multiple region detection methods
   */
  private getRegionFromRequest(req: Request): string | null {
    // Check subdomain (e.g., bahrain.quantenergx.com)
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    if (['us', 'eu', 'me', 'guyana', 'bahrain'].includes(subdomain)) {
      return subdomain;
    }

    // Check custom header
    const regionHeader = req.get('X-Trading-Region');
    if (regionHeader && ['us', 'eu', 'me', 'guyana', 'bahrain'].includes(regionHeader)) {
      return regionHeader;
    }

    // Check path prefix
    const pathRegion = req.path.match(/^\/api\/v1\/regions\/([a-z]+)\//);
    if (pathRegion && ['us', 'eu', 'me', 'guyana', 'bahrain'].includes(pathRegion[1])) {
      return pathRegion[1];
    }

    return null;
  }

  /**
   * Get all middleware functions for easy integration
   */
  public getMiddleware() {
    return [
      this.enforceHttps,
      this.setSecurityHeaders,
      this.setRegionalHeaders
    ];
  }
}

// Default security middleware instance for backward compatibility
const securityMiddleware = new SecurityMiddleware();

export const enforceHttps = securityMiddleware.enforceHttps;
export const setSecurityHeaders = securityMiddleware.setSecurityHeaders;
export const setRegionalHeaders = securityMiddleware.setRegionalHeaders;

export default SecurityMiddleware;