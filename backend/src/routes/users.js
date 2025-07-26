const express = require('express');
const { body, query, validationResult } = require('express-validator');
const UserManagementService = require('../services/userManagementService');
const { authenticateToken } = require('../middleware/auth');
const passwordUtils = require('../utils/passwordUtils');
const captchaUtils = require('../utils/captchaUtils');
const validationUtils = require('../utils/validationUtils');

const router = express.Router();

// Initialize user management service
let userService;
try {
  userService = new UserManagementService();
} catch (error) {
  console.error('Failed to initialize UserManagementService:', error);
  userService = null;
}

// User management status
router.get('/', (req, res) => {
  res.json({
    message: 'User Management API',
    endpoints: {
      auth: 'POST /users/auth/login',
      register: 'POST /users/auth/register',
      logout: 'POST /users/auth/logout',
      profile: 'GET /users/profile',
      users: 'GET /users (admin only)',
      roles: 'GET /users/roles',
      audit: 'GET /users/audit (admin only)',
    },
    serviceStatus: userService ? 'online' : 'offline',
  });
});

// Register new user
router.post(
  '/auth/register',
  validationUtils.validateRegistration(),
  validationUtils.handleValidationErrors(),
  captchaUtils.middleware({ tokenField: 'hcaptcha_token' }),
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable',
        });
      }

      // Validate password strength
      const passwordValidation = passwordUtils.validatePasswordStrength(req.body.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'weak_password',
          issues: passwordValidation.issues,
          suggestions: passwordValidation.suggestions,
        });
      }

      // Hash password with Argon2
      const hashedPassword = await passwordUtils.hashPassword(req.body.password);

      const userData = {
        ...req.body,
        password: hashedPassword,
        role: req.body.role || 'viewer', // Default to viewer role
        email: validationUtils.sanitizeString(req.body.email, { maxLength: 254 }),
        firstName: validationUtils.sanitizeString(req.body.firstName, { maxLength: 50 }),
        lastName: validationUtils.sanitizeString(req.body.lastName, { maxLength: 50 }),
      };

      const user = await userService.createUser(userData);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user,
        captcha_verified: req.captchaVerification?.success || false,
      });
    } catch (error) {
      console.error('User registration error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Login user
router.post(
  '/auth/login',
  validationUtils.validateLogin(),
  validationUtils.handleValidationErrors(),
  captchaUtils.middleware({ tokenField: 'hcaptcha_token' }),
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable',
        });
      }

      const { username, password, mfaToken } = req.body;

      const result = await userService.authenticateUser(username, password, mfaToken);

      res.json({
        success: true,
        message: 'Login successful',
        captcha_verified: req.captchaVerification?.success || false,
        ...result,
      });
    } catch (error) {
      console.error('Login error:', error);

      if (error.message === 'MFA_REQUIRED') {
        return res.status(200).json({
          success: false,
          requiresMFA: true,
          message: 'MFA token required',
        });
      }

      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Password reset request
router.post(
  '/auth/password-reset-request',
  validationUtils.validatePasswordReset(),
  validationUtils.handleValidationErrors(),
  captchaUtils.middleware({ tokenField: 'hcaptcha_token' }),
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable',
        });
      }

      const { email } = req.body;
      const sanitizedEmail = validationUtils.sanitizeString(email, { maxLength: 254 });

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        captcha_verified: req.captchaVerification?.success || false,
      });

      // Asynchronously process password reset (don't wait for response)
      if (userService.requestPasswordReset) {
        userService.requestPasswordReset(sanitizedEmail).catch(error => {
          console.error('Password reset request error:', error);
        });
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      // Don't reveal internal errors to prevent information disclosure
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }
  }
);

// Password reset confirmation
router.post(
  '/auth/password-reset-confirm',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('token').isLength({ min: 32, max: 128 }).withMessage('Invalid reset token'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('hcaptcha_token').notEmpty().withMessage('Captcha verification required'),
  ],
  validationUtils.handleValidationErrors(),
  captchaUtils.middleware({ tokenField: 'hcaptcha_token' }),
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable',
        });
      }

      const { token, newPassword } = req.body;

      // Validate new password strength
      const passwordValidation = passwordUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'weak_password',
          issues: passwordValidation.issues,
          suggestions: passwordValidation.suggestions,
        });
      }

      // Hash new password
      const hashedPassword = await passwordUtils.hashPassword(newPassword);

      if (userService.confirmPasswordReset) {
        await userService.confirmPasswordReset(token, hashedPassword);
      }

      res.json({
        success: true,
        message: 'Password reset successfully',
        captcha_verified: req.captchaVerification?.success || false,
      });
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
    }
  }
);

// Logout user
router.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    if (!userService) {
      return res.status(503).json({
        success: false,
        error: 'User management service unavailable',
      });
    }

    await userService.logoutUser(req.user.sessionId);

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (!userService) {
      return res.status(503).json({
        success: false,
        error: 'User management service unavailable',
      });
    }

    const user = userService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get user sessions
    const sessions = userService.getUserSessions(req.user.id);

    res.json({
      success: true,
      user,
      sessions: sessions.length,
      permissions: userService.getRoles()[user.role]?.permissions || [],
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update user profile
router.put(
  '/profile',
  authenticateToken,
  [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const updatedUser = await userService.updateUser(req.user.id, req.body);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Toggle MFA
router.post(
  '/profile/mfa',
  authenticateToken,
  [body('enable').isBoolean().withMessage('Enable must be boolean')],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const result = await userService.toggleMFA(req.user.id, req.body.enable);

      res.json({
        success: true,
        message: `MFA ${req.body.enable ? 'enabled' : 'disabled'} successfully`,
        ...result,
      });
    } catch (error) {
      console.error('MFA toggle error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get all users (admin only)
router.get(
  '/list',
  authenticateToken,
  [
    query('role').optional().isString().withMessage('Role must be string'),
    query('isActive').optional().isBoolean().withMessage('IsActive must be boolean'),
    query('search').optional().isString().withMessage('Search must be string'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable',
        });
      }

      // Check admin permission
      if (!userService.hasPermission(req.user, '*')) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const filters = {
        role: req.query.role,
        isActive: req.query.isActive,
        search: req.query.search,
      };

      const users = userService.getAllUsers(filters);
      const limit = parseInt(req.query.limit) || users.length;

      res.json({
        success: true,
        users: users.slice(0, limit),
        total: users.length,
        filters,
      });
    } catch (error) {
      console.error('Users retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Update user (admin only)
router.put(
  '/:userId',
  authenticateToken,
  [
    body('role')
      .optional()
      .isIn(['admin', 'trader', 'risk_manager', 'compliance_officer', 'analyst', 'viewer'])
      .withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('IsActive must be boolean'),
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable',
        });
      }

      // Check admin permission
      if (!userService.hasPermission(req.user, '*')) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const updatedUser = await userService.updateUser(req.params.userId, req.body);

      res.json({
        success: true,
        message: 'User updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('User update error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get roles
router.get('/roles', async (req, res) => {
  try {
    if (!userService) {
      return res.status(503).json({
        success: false,
        error: 'User management service unavailable',
      });
    }

    const roles = userService.getRoles();

    res.json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error('Roles retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user audit log
router.get(
  '/audit/:userId',
  authenticateToken,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable',
        });
      }

      const { userId } = req.params;

      // Users can only view their own audit log unless they're admin
      if (req.user.id !== userId && !userService.hasPermission(req.user, '*')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const limit = parseInt(req.query.limit) || 100;
      const auditLog = userService.getUserAuditLog(userId, limit);

      res.json({
        success: true,
        auditLog,
        total: auditLog.length,
      });
    } catch (error) {
      console.error('Audit log retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get all audit logs (admin only)
router.get(
  '/audit',
  authenticateToken,
  [
    query('userId').optional().isUUID().withMessage('UserId must be valid UUID'),
    query('action').optional().isString().withMessage('Action must be string'),
    query('startDate').optional().isISO8601().withMessage('StartDate must be valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('EndDate must be valid ISO date'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable',
        });
      }

      // Check admin permission
      if (!userService.hasPermission(req.user, '*')) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const filters = {
        userId: req.query.userId,
        action: req.query.action,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const limit = parseInt(req.query.limit) || 1000;
      const auditLogs = userService.getAllAuditLogs(filters, limit);

      res.json({
        success: true,
        auditLogs,
        total: auditLogs.length,
        filters,
      });
    } catch (error) {
      console.error('Audit logs retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get user sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    if (!userService) {
      return res.status(503).json({
        success: false,
        error: 'User management service unavailable',
      });
    }

    const sessions = userService.getUserSessions(req.user.id);

    res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error('Sessions retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Revoke session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    if (!userService) {
      return res.status(503).json({
        success: false,
        error: 'User management service unavailable',
      });
    }

    const { sessionId } = req.params;
    const revoked = await userService.revokeSession(sessionId);

    if (!revoked) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    console.error('Session revocation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
