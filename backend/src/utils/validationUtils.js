const { body, validationResult } = require('express-validator');
const validator = require('validator');
const joi = require('joi');

/**
 * Enhanced input validation utilities
 * Provides comprehensive validation for all user inputs
 */
class ValidationUtils {
  constructor() {
    // Common validation patterns
    this.patterns = {
      username: /^[a-zA-Z0-9_-]{3,30}$/,
      name: /^[a-zA-Z\s'-]{1,50}$/,
      phone: /^\+?[\d\s-()]{10,20}$/,
      apiKey: /^[A-Za-z0-9_-]{32,128}$/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    };

    // File type whitelist
    this.allowedFileTypes = {
      documents: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx'],
      images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      all: [
        '.pdf',
        '.doc',
        '.docx',
        '.txt',
        '.csv',
        '.xlsx',
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
      ],
    };

    // Maximum file sizes (in bytes)
    this.maxFileSizes = {
      document: 50 * 1024 * 1024, // 50MB
      image: 10 * 1024 * 1024, // 10MB
      default: 5 * 1024 * 1024, // 5MB
    };
  }

  /**
   * Validate email with additional checks
   * @param {string} email - Email to validate
   * @returns {Object} - Validation result
   */
  validateEmail(email) {
    const result = { valid: false, issues: [] };

    if (!email) {
      result.issues.push('Email is required');
      return result;
    }

    if (!validator.isEmail(email)) {
      result.issues.push('Invalid email format');
      return result;
    }

    if (email.length > 254) {
      result.issues.push('Email is too long');
      return result;
    }

    // Check for disposable email domains (basic list)
    const disposableDomains = [
      '10minutemail.com',
      'temp-mail.org',
      'guerrillamail.com',
      'mailinator.com',
      'yopmail.com',
      'throwaway.email',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(domain)) {
      result.issues.push('Disposable email addresses are not allowed');
      return result;
    }

    result.valid = true;
    return result;
  }

  /**
   * Validate file upload
   * @param {Object} file - Multer file object
   * @param {string} category - File category ('documents', 'images', 'all')
   * @returns {Object} - Validation result
   */
  validateFile(file, category = 'all') {
    const result = { valid: false, issues: [] };

    if (!file) {
      result.issues.push('File is required');
      return result;
    }

    // Check file size
    const maxSize = this.maxFileSizes[category] || this.maxFileSizes.default;
    if (file.size > maxSize) {
      result.issues.push(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
    }

    // Check file type
    const allowedTypes = this.allowedFileTypes[category] || this.allowedFileTypes.all;
    const fileExt = '.' + file.originalname.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExt)) {
      result.issues.push(
        `File type ${fileExt} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Check MIME type matches extension
    const mimeToExt = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'text/plain': '.txt',
      'text/csv': '.csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };

    if (file.mimetype && mimeToExt[file.mimetype]) {
      const expectedExts = Array.isArray(mimeToExt[file.mimetype])
        ? mimeToExt[file.mimetype]
        : [mimeToExt[file.mimetype]];

      if (!expectedExts.includes(fileExt)) {
        result.issues.push('File extension does not match file type');
      }
    }

    result.valid = result.issues.length === 0;
    return result;
  }

  /**
   * Sanitize string input
   * @param {string} input - Input string
   * @param {Object} options - Sanitization options
   * @returns {string} - Sanitized string
   */
  sanitizeString(input, options = {}) {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Basic HTML escape
    if (options.escapeHtml !== false) {
      sanitized = validator.escape(sanitized);
    }

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Trim whitespace
    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }

    // Limit length
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  /**
   * Express validator middleware for user registration
   */
  validateRegistration() {
    return [
      body('username')
        .matches(this.patterns.username)
        .withMessage('Username must be 3-30 characters, alphanumeric, underscore or dash only'),
      body('email').custom(async email => {
        const validation = this.validateEmail(email);
        if (!validation.valid) {
          throw new Error(validation.issues.join(', '));
        }
        return true;
      }),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage(
          'Password must contain at least one lowercase letter, one uppercase letter, and one number'
        ),
      body('firstName')
        .matches(this.patterns.name)
        .withMessage(
          'First name must be 1-50 characters, letters, spaces, apostrophes and hyphens only'
        ),
      body('lastName')
        .matches(this.patterns.name)
        .withMessage(
          'Last name must be 1-50 characters, letters, spaces, apostrophes and hyphens only'
        ),
      body('role')
        .optional()
        .isIn(['trader', 'risk_manager', 'compliance_officer', 'analyst', 'viewer'])
        .withMessage('Invalid role'),
      body('hcaptcha_token').notEmpty().withMessage('Captcha verification required'),
    ];
  }

  /**
   * Express validator middleware for user login
   */
  validateLogin() {
    const validations = [
      body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ max: 100 })
        .withMessage('Username too long'),
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ max: 200 })
        .withMessage('Password too long'),
      body('mfaToken')
        .optional()
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('MFA token must be 6 digits'),
    ];

    // Only require captcha if enabled
    if (process.env.HCAPTCHA_ENABLED !== 'false') {
      validations.push(
        body('hcaptcha_token').notEmpty().withMessage('Captcha verification required')
      );
    }

    return validations;
  }

  /**
   * Express validator middleware for password reset
   */
  validatePasswordReset() {
    return [
      body('email').custom(async email => {
        const validation = this.validateEmail(email);
        if (!validation.valid) {
          throw new Error(validation.issues.join(', '));
        }
        return true;
      }),
      body('hcaptcha_token').notEmpty().withMessage('Captcha verification required'),
    ];
  }

  /**
   * Express validator middleware for API keys
   */
  validateApiKey() {
    return [
      body('name')
        .isLength({ min: 1, max: 100 })
        .withMessage('API key name must be 1-100 characters'),
      body('permissions')
        .isArray()
        .withMessage('Permissions must be an array')
        .custom(permissions => {
          const validPermissions = ['read', 'write', 'admin'];
          for (const perm of permissions) {
            if (!validPermissions.includes(perm)) {
              throw new Error(`Invalid permission: ${perm}`);
            }
          }
          return true;
        }),
    ];
  }

  /**
   * Express validator middleware for trading orders
   */
  validateTradingOrder() {
    return [
      body('symbol')
        .isLength({ min: 1, max: 20 })
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage('Symbol must be alphanumeric, underscore or dash only'),
      body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be a positive number'),
      body('price')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Price must be a positive number'),
      body('type')
        .isIn(['market', 'limit', 'stop'])
        .withMessage('Order type must be market, limit, or stop'),
      body('side').isIn(['buy', 'sell']).withMessage('Order side must be buy or sell'),
    ];
  }

  /**
   * Middleware to handle validation errors
   */
  handleValidationErrors() {
    return (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'validation_failed',
          errors: errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value,
          })),
        });
      }
      next();
    };
  }

  /**
   * Joi schema for complex object validation
   */
  getJoiSchemas() {
    return {
      userProfile: joi.object({
        firstName: joi.string().pattern(this.patterns.name).required(),
        lastName: joi.string().pattern(this.patterns.name).required(),
        email: joi.string().email().required(),
        phone: joi.string().pattern(this.patterns.phone).optional(),
        preferences: joi
          .object({
            theme: joi.string().valid('light', 'dark').default('light'),
            notifications: joi.boolean().default(true),
            language: joi.string().length(2).default('en'),
          })
          .optional(),
      }),

      marketData: joi.object({
        symbol: joi
          .string()
          .pattern(/^[A-Z0-9_-]+$/)
          .required(),
        source: joi.string().valid('bloomberg', 'refinitiv', 'ice', 'nymex').required(),
        dataType: joi.string().valid('price', 'volume', 'volatility').required(),
        timestamp: joi.date().iso().required(),
      }),

      riskLimits: joi.object({
        userId: joi.string().uuid().required(),
        maxPosition: joi.number().positive().required(),
        maxLoss: joi.number().positive().required(),
        commodities: joi.array().items(joi.string()).min(1).required(),
      }),
    };
  }
}

module.exports = new ValidationUtils();
