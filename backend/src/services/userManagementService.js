const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class UserManagementService {
  constructor() {
    // In-memory storage for demo (would use database in production)
    this.users = new Map();
    this.sessions = new Map();
    this.mfaTokens = new Map();
    this.auditLogs = new Map();
    
    // Configuration
    this.config = {
      passwordMinLength: 8,
      passwordRequireSpecialChars: true,
      maxLoginAttempts: 5,
      lockoutDuration: 30 * 60 * 1000, // 30 minutes
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      mfaTokenExpiry: 5 * 60 * 1000, // 5 minutes
      jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key'
    };

    // Role definitions
    this.roles = {
      admin: {
        name: 'Administrator',
        permissions: ['*'], // All permissions
        description: 'Full system access'
      },
      trader: {
        name: 'Trader',
        permissions: [
          'trading.place_orders',
          'trading.view_orders',
          'trading.cancel_orders',
          'trading.view_positions',
          'trading.view_portfolio',
          'market.view_data',
          'reports.view_trading'
        ],
        description: 'Trading operations'
      },
      risk_manager: {
        name: 'Risk Manager',
        permissions: [
          'risk.view_dashboard',
          'risk.view_positions',
          'risk.view_reports',
          'risk.set_limits',
          'trading.view_orders',
          'trading.view_positions',
          'market.view_data',
          'reports.view_all'
        ],
        description: 'Risk management and oversight'
      },
      compliance_officer: {
        name: 'Compliance Officer',
        permissions: [
          'compliance.view_dashboard',
          'compliance.view_reports',
          'compliance.manage_kyc',
          'compliance.manage_aml',
          'compliance.view_audit_trail',
          'trading.view_orders',
          'trading.view_positions',
          'reports.view_all'
        ],
        description: 'Compliance monitoring and reporting'
      },
      analyst: {
        name: 'Analyst',
        permissions: [
          'market.view_data',
          'reports.view_analytics',
          'trading.view_positions',
          'risk.view_reports'
        ],
        description: 'Market analysis and reporting'
      },
      viewer: {
        name: 'Viewer',
        permissions: [
          'market.view_data',
          'reports.view_basic'
        ],
        description: 'Read-only access'
      }
    };

    // Initialize demo users
    this.initializeDemoUsers();
  }

  async initializeDemoUsers() {
    // Create demo users for testing
    const demoUsers = [
      {
        username: 'admin',
        email: 'admin@quantenergx.com',
        password: 'Admin123!',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator'
      },
      {
        username: 'trader1',
        email: 'trader1@quantenergx.com',
        password: 'Trader123!',
        role: 'trader',
        firstName: 'John',
        lastName: 'Trader'
      },
      {
        username: 'risk1',
        email: 'risk1@quantenergx.com',
        password: 'Risk123!',
        role: 'risk_manager',
        firstName: 'Jane',
        lastName: 'Risk'
      }
    ];

    for (const userData of demoUsers) {
      try {
        await this.createUser(userData);
      } catch (error) {
        console.warn('Demo user creation failed:', error.message);
      }
    }
  }

  // Create a new user
  async createUser(userData) {
    try {
      // Validate input
      this.validateUserData(userData);
      
      // Check if user already exists
      const existingUser = Array.from(this.users.values())
        .find(user => user.username === userData.username || user.email === userData.email);
      
      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user object
      const user = {
        id: uuidv4(),
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'viewer',
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
        mfaEnabled: false,
        mfaSecret: null,
        loginAttempts: 0,
        lastLogin: null,
        lockedUntil: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store user
      this.users.set(user.id, user);

      // Log audit event
      await this.logAuditEvent({
        userId: user.id,
        action: 'user_created',
        details: { username: user.username, role: user.role }
      });

      // Return user without password
      const { password: _password, ...userWithoutPassword } = user;
      return userWithoutPassword;

    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Authenticate user
  async authenticateUser(username, password, mfaToken = null) {
    // Find user
    const user = Array.from(this.users.values())
      .find(u => u.username === username || u.email === username);

    if (!user) {
      await this.logAuditEvent({
        action: 'login_failed',
        details: { username, reason: 'user_not_found' }
      });
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      await this.logAuditEvent({
        userId: user.id,
        action: 'login_failed',
        details: { username, reason: 'account_locked' }
      });
      throw new Error('Account temporarily locked due to multiple failed attempts');
    }

    // Check if account is active
    if (!user.isActive) {
      await this.logAuditEvent({
        userId: user.id,
        action: 'login_failed',
        details: { username, reason: 'account_inactive' }
      });
      throw new Error('Account is inactive');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      // Increment login attempts
      user.loginAttempts++;
      if (user.loginAttempts >= this.config.maxLoginAttempts) {
        user.lockedUntil = new Date(Date.now() + this.config.lockoutDuration).toISOString();
      }
        
      await this.logAuditEvent({
        userId: user.id,
        action: 'login_failed',
        details: { username, reason: 'invalid_password', attempts: user.loginAttempts }
      });
        
      throw new Error('Invalid credentials');
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaToken) {
        // Generate and store MFA token for demo (in production, would use TOTP)
        const token = crypto.randomInt(100000, 999999).toString();
        this.mfaTokens.set(user.id, {
          token,
          expiresAt: Date.now() + this.config.mfaTokenExpiry
        });
          
        await this.logAuditEvent({
          userId: user.id,
          action: 'mfa_token_generated',
          details: { username }
        });

        throw new Error('MFA_REQUIRED'); // Special error to indicate MFA is needed
      }

      // Verify MFA token
      const storedMfaData = this.mfaTokens.get(user.id);
      if (!storedMfaData || Date.now() > storedMfaData.expiresAt || storedMfaData.token !== mfaToken) {
        await this.logAuditEvent({
          userId: user.id,
          action: 'login_failed',
          details: { username, reason: 'invalid_mfa_token' }
        });
        throw new Error('Invalid or expired MFA token');
      }

      // Remove used MFA token
      this.mfaTokens.delete(user.id);
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date().toISOString();

    // Generate JWT token
    const sessionId = uuidv4();
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        sessionId 
      },
      this.config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Store session
    this.sessions.set(sessionId, {
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.config.sessionTimeout).toISOString(),
      ipAddress: null, // Would be set by route handler
      userAgent: null  // Would be set by route handler
    });

    await this.logAuditEvent({
      userId: user.id,
      action: 'login_successful',
      details: { username, sessionId }
    });

    const { password: _userPassword, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
      sessionId
    };
  }

  // Logout user
  async logoutUser(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        this.sessions.delete(sessionId);
        
        await this.logAuditEvent({
          userId: session.userId,
          action: 'logout',
          details: { sessionId }
        });
      }
      
      return true;
    } catch (error) {
      throw new Error(`Failed to logout: ${error.message}`);
    }
  }

  // Validate JWT token
  validateToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret);
      
      // Check if session still exists
      const session = this.sessions.get(decoded.sessionId);
      if (!session || new Date() > new Date(session.expiresAt)) {
        throw new Error('Session expired');
      }

      return decoded;
    } catch (_error) {
      throw new Error('Invalid token');
    }
  }

  // Check user permissions
  hasPermission(user, permission) {
    const userRole = this.roles[user.role];
    if (!userRole) return false;

    // Admin has all permissions
    if (userRole.permissions.includes('*')) return true;

    // Check specific permission
    return userRole.permissions.includes(permission);
  }

  // Get user by ID
  getUserById(userId) {
    const user = this.users.get(userId);
    if (!user) return null;

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Update user
  async updateUser(userId, updates) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate updates
      if (updates.password) {
        this.validatePassword(updates.password);
        updates.password = await bcrypt.hash(updates.password, 12);
      }

      if (updates.email && updates.email !== user.email) {
        const existingUser = Array.from(this.users.values())
          .find(u => u.email === updates.email && u.id !== userId);
        if (existingUser) {
          throw new Error('Email already exists');
        }
      }

      if (updates.role && !this.roles[updates.role]) {
        throw new Error('Invalid role');
      }

      // Apply updates
      Object.assign(user, updates, {
        updatedAt: new Date().toISOString()
      });

      await this.logAuditEvent({
        userId,
        action: 'user_updated',
        details: { updates: Object.keys(updates) }
      });

      const { password: _password, ...userWithoutPassword } = user;
      return userWithoutPassword;

    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Enable/disable MFA
  async toggleMFA(userId, enable) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.mfaEnabled = enable;
      if (enable) {
        // In production, would generate TOTP secret
        user.mfaSecret = crypto.randomBytes(16).toString('hex');
      } else {
        user.mfaSecret = null;
      }

      user.updatedAt = new Date().toISOString();

      await this.logAuditEvent({
        userId,
        action: enable ? 'mfa_enabled' : 'mfa_disabled',
        details: {}
      });

      return { mfaEnabled: user.mfaEnabled };

    } catch (error) {
      throw new Error(`Failed to toggle MFA: ${error.message}`);
    }
  }

  // Get all users (admin only)
  getAllUsers(filters = {}) {
    let users = Array.from(this.users.values());

    // Apply filters
    if (filters.role) {
      users = users.filter(user => user.role === filters.role);
    }
    if (filters.isActive !== undefined) {
      users = users.filter(user => user.isActive === filters.isActive);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      users = users.filter(user => 
        user.username.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search)
      );
    }

    // Remove passwords
    return users.map(({ password: _password, ...user }) => user);
  }

  // Get user audit log
  getUserAuditLog(userId, limit = 100) {
    const logs = Array.from(this.auditLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return logs;
  }

  // Get all audit logs (admin only)
  getAllAuditLogs(filters = {}, limit = 1000) {
    let logs = Array.from(this.auditLogs.values());

    // Apply filters
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    if (filters.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return logs.slice(0, limit);
  }

  // Log audit event
  async logAuditEvent(event) {
    const auditLog = {
      id: uuidv4(),
      userId: event.userId || null,
      action: event.action,
      details: event.details || {},
      timestamp: new Date().toISOString(),
      ipAddress: event.ipAddress || null,
      userAgent: event.userAgent || null
    };

    this.auditLogs.set(auditLog.id, auditLog);
    return auditLog;
  }

  // Validate user data
  validateUserData(userData) {
    if (!userData.username || userData.username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error('Valid email is required');
    }

    if (!userData.password) {
      throw new Error('Password is required');
    }

    this.validatePassword(userData.password);

    if (userData.role && !this.roles[userData.role]) {
      throw new Error('Invalid role');
    }
  }

  // Validate password
  validatePassword(password) {
    if (password.length < this.config.passwordMinLength) {
      throw new Error(`Password must be at least ${this.config.passwordMinLength} characters long`);
    }

    if (this.config.passwordRequireSpecialChars) {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
      }
    }
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get roles
  getRoles() {
    return this.roles;
  }

  // Get user sessions
  getUserSessions(userId) {
    return Array.from(this.sessions.entries())
      .filter(([_, session]) => session.userId === userId)
      .map(([sessionId, session]) => ({
        sessionId,
        ...session
      }));
  }

  // Revoke user session
  async revokeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      
      await this.logAuditEvent({
        userId: session.userId,
        action: 'session_revoked',
        details: { sessionId }
      });
      
      return true;
    }
    return false;
  }

  // Clean up expired sessions
  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > new Date(session.expiresAt)) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = UserManagementService;