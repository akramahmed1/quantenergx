const UserManagementService = require('../../src/services/userManagementService');

describe('UserManagementService - Email Validation', () => {
  let userService;

  beforeEach(() => {
    userService = new UserManagementService();
  });

  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
        'admin@quantenergx.com'
      ];

      validEmails.forEach(email => {
        expect(userService.isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..double.dot@example.com',
        'user@domain',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(userService.isValidEmail(email)).toBe(false);
      });
    });

    it('should reject disposable email addresses', () => {
      const disposableEmails = [
        'test@10minutemail.com',
        'user@temp-mail.org',
        'fake@guerrillamail.com',
        'spam@mailinator.com',
        'test@yopmail.com',
        'user@throwaway.email'
      ];

      disposableEmails.forEach(email => {
        expect(userService.isValidEmail(email)).toBe(false);
      });
    });

    it('should reject emails that are too long', () => {
      // Create an email longer than 254 characters
      const longLocalPart = 'a'.repeat(200);
      const longEmail = `${longLocalPart}@example.com`;
      
      expect(userService.isValidEmail(longEmail)).toBe(false);
    });

    it('should handle null and undefined inputs', () => {
      expect(userService.isValidEmail(null)).toBe(false);
      expect(userService.isValidEmail(undefined)).toBe(false);
    });
  });
});