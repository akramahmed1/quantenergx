const hcaptcha = require('hcaptcha');

/**
 * hCaptcha verification utility
 * Provides secure captcha verification for forms
 */
class CaptchaUtils {
  constructor() {
    this.secret = process.env.HCAPTCHA_SECRET_KEY;
    this.siteKey = process.env.HCAPTCHA_SITE_KEY;
    this.enabled = process.env.HCAPTCHA_ENABLED !== 'false'; // Enable by default
  }

  /**
   * Verify hCaptcha response
   * @param {string} token - hCaptcha response token
   * @param {string} remoteip - Client IP address (optional)
   * @returns {Promise<Object>} - Verification result
   */
  async verifyCaptcha(token, remoteip = null) {
    // Skip verification in test environment or if disabled
    if (process.env.NODE_ENV === 'test' || !this.enabled) {
      return {
        success: true,
        bypass: true,
        reason: process.env.NODE_ENV === 'test' ? 'test_environment' : 'disabled',
      };
    }

    if (!this.secret) {
      throw new Error('hCaptcha secret key not configured');
    }

    if (!token) {
      return {
        success: false,
        error: 'captcha_token_required',
        message: 'Captcha verification required',
      };
    }

    try {
      const verification = await hcaptcha.verify(this.secret, token, remoteip);

      return {
        success: verification.success,
        timestamp: verification.challenge_ts,
        hostname: verification.hostname,
        error: verification['error-codes']?.[0] || null,
        message: verification.success ? 'Captcha verified' : 'Captcha verification failed',
      };
    } catch (error) {
      console.error('Captcha verification error:', error);
      return {
        success: false,
        error: 'verification_failed',
        message: 'Captcha verification service error',
      };
    }
  }

  /**
   * Get site key for frontend
   * @returns {string|null} - Site key or null if captcha disabled
   */
  getSiteKey() {
    return this.enabled ? this.siteKey : null;
  }

  /**
   * Check if captcha is enabled
   * @returns {boolean} - True if captcha is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Middleware to verify captcha on routes
   * @param {Object} options - Middleware options
   * @returns {Function} - Express middleware
   */
  middleware(options = {}) {
    const { skipForMethods = ['GET'], tokenField = 'hcaptcha_token', optional = false } = options;

    return async (req, res, next) => {
      // Skip verification for specified methods
      if (skipForMethods.includes(req.method)) {
        return next();
      }

      // Skip if captcha is disabled
      if (!this.enabled) {
        return next();
      }

      const token = req.body[tokenField] || req.headers['x-captcha-token'];
      const remoteip = req.ip || req.connection.remoteAddress;

      // If optional and no token provided, continue
      if (optional && !token) {
        return next();
      }

      try {
        const result = await this.verifyCaptcha(token, remoteip);

        if (!result.success) {
          return res.status(400).json({
            success: false,
            error: 'captcha_verification_failed',
            message: result.message,
            captcha_error: result.error,
          });
        }

        // Add verification result to request for potential logging
        req.captchaVerification = result;
        next();
      } catch (error) {
        console.error('Captcha middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'captcha_service_error',
          message: 'Captcha verification service unavailable',
        });
      }
    };
  }
}

module.exports = new CaptchaUtils();
