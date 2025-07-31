const UserManagementService = require('../../src/services/userManagementService');

describe('UserManagementService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserManagementService();
  });

  describe('User Registration', () => {
    test('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader'
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.status).toBe('active');
      expect(user.createdAt).toBeDefined();
    });

    test('should reject duplicate email addresses', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader'
      };

      await userService.createUser(userData);

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Email already exists');
    });

    test('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader'
      };

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });

    test('should enforce password requirements', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader'
      };

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Password does not meet requirements');
    });

    test('should validate role', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid_role'
      };

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid role');
    });
  });

  describe('User Authentication', () => {
    beforeEach(async () => {
      // Create a test user
      await userService.createUser({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader'
      });
    });

    test('should authenticate user with correct credentials', async () => {
      const result = await userService.authenticateUser('test@example.com', 'SecurePassword123!');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    test('should reject incorrect password', async () => {
      const result = await userService.authenticateUser('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(result.user).toBeUndefined();
      expect(result.token).toBeUndefined();
    });

    test('should reject non-existent user', async () => {
      const result = await userService.authenticateUser('nonexistent@example.com', 'SecurePassword123!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    test('should lock account after max failed attempts', async () => {
      // Attempt failed logins up to the limit
      for (let i = 0; i < userService.config.maxLoginAttempts; i++) {
        await userService.authenticateUser('test@example.com', 'wrongpassword');
      }

      const result = await userService.authenticateUser('test@example.com', 'SecurePassword123!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account locked due to multiple failed attempts');
    });

    test('should create audit log for authentication attempts', async () => {
      await userService.authenticateUser('test@example.com', 'wrongpassword');

      const user = userService.findUserByEmail('test@example.com');
      const logs = userService.getUserAuditLogs(user.id);

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('login_failed');
      expect(logs[0].email).toBe('test@example.com');
    });
  });

  describe('Session Management', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await userService.createUser({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader'
      });
    });

    test('should create session on successful authentication', async () => {
      const result = await userService.authenticateUser('test@example.com', 'SecurePassword123!');

      expect(result.sessionId).toBeDefined();
      
      const session = userService.getSession(result.sessionId);
      expect(session).toBeDefined();
      expect(session.userId).toBe(testUser.id);
      expect(session.email).toBe(testUser.email);
    });

    test('should validate active sessions', () => {
      const sessionId = userService.createSession(testUser.id, testUser.email);
      
      const isValid = userService.validateSession(sessionId);
      expect(isValid).toBe(true);
    });

    test('should invalidate expired sessions', () => {
      const sessionId = userService.createSession(testUser.id, testUser.email);
      
      // Manually expire the session
      const session = userService.sessions.get(sessionId);
      session.expiresAt = Date.now() - 1000; // 1 second ago
      
      const isValid = userService.validateSession(sessionId);
      expect(isValid).toBe(false);
    });

    test('should logout and invalidate session', () => {
      const sessionId = userService.createSession(testUser.id, testUser.email);
      
      expect(userService.validateSession(sessionId)).toBe(true);
      
      userService.logout(sessionId);
      
      expect(userService.validateSession(sessionId)).toBe(false);
    });
  });

  describe('Role and Permissions', () => {
    test('should check user permissions correctly', async () => {
      const traderUser = await userService.createUser({
        email: 'trader@example.com',
        password: 'SecurePassword123!',
        firstName: 'Jane',
        lastName: 'Trader',
        role: 'trader'
      });

      const adminUser = await userService.createUser({
        email: 'admin@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Admin',
        role: 'admin'
      });

      // Trader should have trading permissions
      expect(userService.hasPermission(traderUser.id, 'trading.place_orders')).toBe(true);
      expect(userService.hasPermission(traderUser.id, 'user.delete')).toBe(false);

      // Admin should have all permissions
      expect(userService.hasPermission(adminUser.id, 'trading.place_orders')).toBe(true);
      expect(userService.hasPermission(adminUser.id, 'user.delete')).toBe(true);
    });

    test('should get user role information', async () => {
      const user = await userService.createUser({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader'
      });

      const roleInfo = userService.getUserRole(user.id);

      expect(roleInfo).toBeDefined();
      expect(roleInfo.name).toBe('Trader');
      expect(roleInfo.permissions).toContain('trading.place_orders');
      expect(roleInfo.description).toBe('Trading operations');
    });

    test('should update user role', async () => {
      const user = await userService.createUser({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader'
      });

      expect(user.role).toBe('trader');

      const updatedUser = await userService.updateUserRole(user.id, 'risk_manager');

      expect(updatedUser.role).toBe('risk_manager');
      expect(userService.hasPermission(user.id, 'risk.view_dashboard')).toBe(true);
    });
  });

  describe('Multi-Factor Authentication', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await userService.createUser({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader'
      });
    });

    test('should enable MFA for user', () => {
      const mfaSetup = userService.enableMFA(testUser.id);

      expect(mfaSetup.secret).toBeDefined();
      expect(mfaSetup.qrCode).toBeDefined();
      expect(mfaSetup.backupCodes).toBeDefined();
      expect(mfaSetup.backupCodes).toHaveLength(10);

      const user = userService.findUserById(testUser.id);
      expect(user.mfaEnabled).toBe(true);
    });

    test('should generate and validate MFA tokens', () => {
      userService.enableMFA(testUser.id);

      const token = userService.generateMFAToken(testUser.id);
      expect(token).toBeDefined();
      expect(token.length).toBe(6);
      expect(/^\d{6}$/.test(token)).toBe(true);

      const isValid = userService.validateMFAToken(testUser.id, token);
      expect(isValid).toBe(true);
    });

    test('should expire MFA tokens after timeout', () => {
      userService.enableMFA(testUser.id);

      const token = userService.generateMFAToken(testUser.id);
      
      // Manually expire the token
      const tokenData = userService.mfaTokens.get(testUser.id);
      tokenData.expiresAt = Date.now() - 1000; // 1 second ago
      
      const isValid = userService.validateMFAToken(testUser.id, token);
      expect(isValid).toBe(false);
    });

    test('should validate backup codes', () => {
      const mfaSetup = userService.enableMFA(testUser.id);
      const backupCode = mfaSetup.backupCodes[0];

      const isValid = userService.validateBackupCode(testUser.id, backupCode);
      expect(isValid).toBe(true);

      // Backup code should be invalidated after use
      const isValidAgain = userService.validateBackupCode(testUser.id, backupCode);
      expect(isValidAgain).toBe(false);
    });
  });

  describe('User Profile Management', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await userService.createUser({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader'
      });
    });

    test('should update user profile', async () => {
      const updates = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567890',
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            sms: false
          }
        }
      };

      const updatedUser = await userService.updateUserProfile(testUser.id, updates);

      expect(updatedUser.firstName).toBe('Jane');
      expect(updatedUser.lastName).toBe('Smith');
      expect(updatedUser.phone).toBe('+1234567890');
      expect(updatedUser.preferences.language).toBe('en');
      expect(updatedUser.preferences.notifications.email).toBe(true);
    });

    test('should change user password', async () => {
      const result = await userService.changePassword(
        testUser.id,
        'SecurePassword123!',
        'NewSecurePassword456!'
      );

      expect(result.success).toBe(true);

      // Verify new password works
      const authResult = await userService.authenticateUser('test@example.com', 'NewSecurePassword456!');
      expect(authResult.success).toBe(true);

      // Verify old password doesn't work
      const oldAuthResult = await userService.authenticateUser('test@example.com', 'SecurePassword123!');
      expect(oldAuthResult.success).toBe(false);
    });

    test('should reject password change with incorrect current password', async () => {
      const result = await userService.changePassword(
        testUser.id,
        'WrongCurrentPassword',
        'NewSecurePassword456!'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current password is incorrect');
    });
  });

  describe('User Management Operations', () => {
    test('should list users with pagination', async () => {
      // Create multiple users
      for (let i = 0; i < 15; i++) {
        await userService.createUser({
          email: `user${i}@example.com`,
          password: 'SecurePassword123!',
          firstName: `User${i}`,
          lastName: 'Test',
          role: 'trader'
        });
      }

      const page1 = userService.listUsers({ page: 1, limit: 10 });
      const page2 = userService.listUsers({ page: 2, limit: 10 });

      expect(page1.users).toHaveLength(10);
      expect(page2.users).toHaveLength(5);
      expect(page1.pagination.total).toBe(15);
      expect(page1.pagination.totalPages).toBe(2);
    });

    test('should filter users by role', async () => {
      await userService.createUser({
        email: 'trader@example.com',
        password: 'SecurePassword123!',
        firstName: 'Trader',
        lastName: 'User',
        role: 'trader'
      });

      await userService.createUser({
        email: 'admin@example.com',
        password: 'SecurePassword123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      });

      const traders = userService.listUsers({ role: 'trader' });
      const admins = userService.listUsers({ role: 'admin' });

      expect(traders.users).toHaveLength(1);
      expect(traders.users[0].role).toBe('trader');
      expect(admins.users).toHaveLength(1);
      expect(admins.users[0].role).toBe('admin');
    });

    test('should deactivate user account', async () => {
      const user = await userService.createUser({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader'
      });

      const deactivatedUser = userService.deactivateUser(user.id, 'Account violation');

      expect(deactivatedUser.status).toBe('deactivated');
      expect(deactivatedUser.deactivationReason).toBe('Account violation');
      expect(deactivatedUser.deactivatedAt).toBeDefined();

      // Should not be able to authenticate deactivated user
      const authResult = await userService.authenticateUser('test@example.com', 'SecurePassword123!');
      expect(authResult.success).toBe(false);
      expect(authResult.error).toBe('Account is deactivated');
    });
  });
});