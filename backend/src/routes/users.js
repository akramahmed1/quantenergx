const express = require('express');
const { body, query, validationResult } = require('express-validator');
const UserManagementService = require('../services/userManagementService');
const { authenticateToken } = require('../middleware/auth');

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
      audit: 'GET /users/audit (admin only)'
    },
    serviceStatus: userService ? 'online' : 'offline'
  });
});

// Register new user
router.post('/auth/register',
  [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('role').optional().isIn(['trader', 'risk_manager', 'compliance_officer', 'analyst', 'viewer'])
      .withMessage('Invalid role')
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userData = {
        ...req.body,
        role: req.body.role || 'viewer' // Default to viewer role
      };

      const user = await userService.createUser(userData);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user
      });

    } catch (error) {
      console.error('User registration error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Login user
router.post('/auth/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('mfaToken').optional().isLength({ min: 6, max: 6 }).withMessage('MFA token must be 6 digits')
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { username, password, mfaToken } = req.body;
      
      const result = await userService.authenticateUser(username, password, mfaToken);

      res.json({
        success: true,
        message: 'Login successful',
        ...result
      });

    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message === 'MFA_REQUIRED') {
        return res.status(200).json({
          success: false,
          requiresMFA: true,
          message: 'MFA token required'
        });
      }

      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Logout user
router.post('/auth/logout',
  authenticateToken,
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      await userService.logoutUser(req.user.sessionId);

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get user profile
router.get('/profile',
  authenticateToken,
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      const user = userService.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Get user sessions
      const sessions = userService.getUserSessions(req.user.id);

      res.json({
        success: true,
        user,
        sessions: sessions.length,
        permissions: userService.getRoles()[user.role]?.permissions || []
      });

    } catch (error) {
      console.error('Profile retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Update user profile
router.put('/profile',
  authenticateToken,
  [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const updatedUser = await userService.updateUser(req.user.id, req.body);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Toggle MFA
router.post('/profile/mfa',
  authenticateToken,
  [
    body('enable').isBoolean().withMessage('Enable must be boolean')
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const result = await userService.toggleMFA(req.user.id, req.body.enable);

      res.json({
        success: true,
        message: `MFA ${req.body.enable ? 'enabled' : 'disabled'} successfully`,
        ...result
      });

    } catch (error) {
      console.error('MFA toggle error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get all users (admin only)
router.get('/list',
  authenticateToken,
  [
    query('role').optional().isString().withMessage('Role must be string'),
    query('isActive').optional().isBoolean().withMessage('IsActive must be boolean'),
    query('search').optional().isString().withMessage('Search must be string'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      // Check admin permission
      if (!userService.hasPermission(req.user, '*')) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const filters = {
        role: req.query.role,
        isActive: req.query.isActive,
        search: req.query.search
      };

      const users = userService.getAllUsers(filters);
      const limit = parseInt(req.query.limit) || users.length;

      res.json({
        success: true,
        users: users.slice(0, limit),
        total: users.length,
        filters
      });

    } catch (error) {
      console.error('Users retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Update user (admin only)
router.put('/:userId',
  authenticateToken,
  [
    body('role').optional().isIn(['admin', 'trader', 'risk_manager', 'compliance_officer', 'analyst', 'viewer'])
      .withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('IsActive must be boolean'),
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      // Check admin permission
      if (!userService.hasPermission(req.user, '*')) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const updatedUser = await userService.updateUser(req.params.userId, req.body);

      res.json({
        success: true,
        message: 'User updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('User update error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get roles
router.get('/roles',
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      const roles = userService.getRoles();

      res.json({
        success: true,
        roles
      });

    } catch (error) {
      console.error('Roles retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get user audit log
router.get('/audit/:userId',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      const { userId } = req.params;
      
      // Users can only view their own audit log unless they're admin
      if (req.user.id !== userId && !userService.hasPermission(req.user, '*')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const limit = parseInt(req.query.limit) || 100;
      const auditLog = userService.getUserAuditLog(userId, limit);

      res.json({
        success: true,
        auditLog,
        total: auditLog.length
      });

    } catch (error) {
      console.error('Audit log retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get all audit logs (admin only)
router.get('/audit',
  authenticateToken,
  [
    query('userId').optional().isUUID().withMessage('UserId must be valid UUID'),
    query('action').optional().isString().withMessage('Action must be string'),
    query('startDate').optional().isISO8601().withMessage('StartDate must be valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('EndDate must be valid ISO date'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
  ],
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      // Check admin permission
      if (!userService.hasPermission(req.user, '*')) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const filters = {
        userId: req.query.userId,
        action: req.query.action,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const limit = parseInt(req.query.limit) || 1000;
      const auditLogs = userService.getAllAuditLogs(filters, limit);

      res.json({
        success: true,
        auditLogs,
        total: auditLogs.length,
        filters
      });

    } catch (error) {
      console.error('Audit logs retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get user sessions
router.get('/sessions',
  authenticateToken,
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      const sessions = userService.getUserSessions(req.user.id);

      res.json({
        success: true,
        sessions
      });

    } catch (error) {
      console.error('Sessions retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Revoke session
router.delete('/sessions/:sessionId',
  authenticateToken,
  async (req, res) => {
    try {
      if (!userService) {
        return res.status(503).json({
          success: false,
          error: 'User management service unavailable'
        });
      }

      const { sessionId } = req.params;
      const revoked = await userService.revokeSession(sessionId);

      if (!revoked) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        message: 'Session revoked successfully'
      });

    } catch (error) {
      console.error('Session revocation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;