const bcrypt = require('bcryptjs');
const argon2 = require('argon2');
const crypto = require('crypto');

/**
 * Enhanced password utility with support for bcrypt and Argon2
 * Provides secure password hashing with configurable algorithms
 */
class PasswordUtils {
  constructor() {
    this.algorithm = process.env.PASSWORD_ALGORITHM || 'argon2'; // Default to Argon2
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.argon2Options = {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    };
  }

  /**
   * Hash password using the configured algorithm
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password with algorithm prefix
   */
  async hashPassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    try {
      if (this.algorithm === 'argon2') {
        const hash = await argon2.hash(password, this.argon2Options);
        return `argon2:${hash}`;
      } else {
        const hash = await bcrypt.hash(password, this.bcryptRounds);
        return `bcrypt:${hash}`;
      }
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Stored hash with algorithm prefix
   * @returns {Promise<boolean>} - True if password matches
   */
  async verifyPassword(password, hash) {
    if (!password || !hash) {
      return false;
    }

    try {
      const [algorithm, actualHash] = hash.split(':', 2);

      if (algorithm === 'argon2') {
        return await argon2.verify(actualHash, password);
      } else if (algorithm === 'bcrypt') {
        return await bcrypt.compare(password, actualHash);
      } else {
        // Legacy support for hashes without algorithm prefix (assume bcrypt)
        return await bcrypt.compare(password, hash);
      }
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Check if password hash needs rehashing (algorithm upgrade)
   * @param {string} hash - Stored hash
   * @returns {boolean} - True if rehashing is needed
   */
  needsRehash(hash) {
    if (!hash) return true;

    const [algorithm] = hash.split(':', 2);

    // If no algorithm prefix, needs upgrade
    if (!algorithm || algorithm === hash) {
      return true;
    }

    // If current algorithm is different from stored, needs upgrade
    return algorithm !== this.algorithm;
  }

  /**
   * Generate secure random password
   * @param {number} length - Password length (default: 16)
   * @returns {string} - Random password
   */
  generateSecurePassword(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with score and suggestions
   */
  validatePasswordStrength(password) {
    const result = {
      valid: false,
      score: 0,
      issues: [],
      suggestions: [],
    };

    if (!password) {
      result.issues.push('Password is required');
      return result;
    }

    if (password.length < 8) {
      result.issues.push('Password must be at least 8 characters long');
    } else {
      result.score += 1;
    }

    if (password.length >= 12) {
      result.score += 1;
    } else {
      result.suggestions.push('Use at least 12 characters for better security');
    }

    if (/[A-Z]/.test(password)) {
      result.score += 1;
    } else {
      result.issues.push('Password must contain at least one uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      result.score += 1;
    } else {
      result.issues.push('Password must contain at least one lowercase letter');
    }

    if (/\d/.test(password)) {
      result.score += 1;
    } else {
      result.issues.push('Password must contain at least one number');
    }

    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      result.score += 1;
    } else {
      result.suggestions.push('Include special characters for stronger security');
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      result.issues.push('Avoid repeating characters');
      result.score -= 1;
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      result.issues.push('Avoid common patterns and words');
      result.score -= 2;
    }

    result.valid = result.issues.length === 0 && result.score >= 4;
    return result;
  }
}

module.exports = new PasswordUtils();
