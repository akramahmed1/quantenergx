#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates required environment variables for different deployment contexts
 */

const process = require('process');
const path = require('path');

// Define required environment variables for different contexts
const ENV_REQUIREMENTS = {
  backend: {
    production: [
      'NODE_ENV',
      'PORT',
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET'
    ],
    development: [
      'NODE_ENV',
      'PORT'
    ]
  },
  frontend: {
    production: [
      'REACT_APP_API_URL'
    ],
    development: [
      'REACT_APP_API_URL'
    ]
  }
};

function validateEnvironment(context = 'backend', environment = 'development') {
  console.log(`🔍 Validating ${context} environment variables for ${environment}...`);
  
  const requirements = ENV_REQUIREMENTS[context]?.[environment] || [];
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of requirements) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Context-specific validations
  if (context === 'backend') {
    // Check JWT secret length in production
    if (environment === 'production') {
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        warnings.push('JWT_SECRET should be at least 32 characters for production');
      }
      if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
        warnings.push('JWT_REFRESH_SECRET should be at least 32 characters for production');
      }
    }
  }

  // Report results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables or copy from .env.example');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment variable warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  console.log('✅ Environment validation passed');
}

// Parse command line arguments
const args = process.argv.slice(2);
const context = args[0] || 'backend';
const environment = process.env.NODE_ENV || 'development';

// Load .env file if in development
if (environment === 'development') {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available, skip
  }
}

validateEnvironment(context, environment);