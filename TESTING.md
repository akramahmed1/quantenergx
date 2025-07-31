# QuantEnergX Testing Guide

This document provides comprehensive instructions for running, extending, and understanding the testing framework for the QuantEnergX energy trading platform.

## Table of Contents

- [Overview](#overview)
- [Testing Architecture](#testing-architecture)
- [Quick Start](#quick-start)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Coverage Reports](#coverage-reports)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

QuantEnergX uses a comprehensive testing strategy that includes:
- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between modules and services
- **Functional Tests**: Test complete user workflows and business logic
- **Smoke Tests**: Quick tests to verify basic functionality
- **E2E Tests**: End-to-end testing using Cypress and Playwright
- **Security Tests**: Specialized tests for security vulnerabilities
- **Performance Tests**: Load and stress testing
- **Contract Tests**: API contract verification using Pact

## Testing Architecture

```
quantenergx/
├── backend/               # Backend Node.js/TypeScript tests
│   ├── test/
│   │   ├── unit/         # Unit tests for individual modules
│   │   ├── integration/  # Integration tests
│   │   ├── contract/     # API contract tests (Pact)
│   │   ├── security/     # Security-specific tests
│   │   ├── performance/  # Load and performance tests
│   │   ├── fuzz/         # Fuzz testing for input validation
│   │   └── fixtures/     # Test data and mocks
│   └── jest.config.js    # Jest configuration
├── frontend/             # React/TypeScript tests
│   ├── src/__tests__/    # Component and Redux tests
│   └── package.json      # React Testing Library config
├── e2e/                  # End-to-end tests
│   ├── cypress/          # Cypress test files
│   ├── playwright/       # Playwright test files
│   └── tests/            # Shared E2E test utilities
├── test-suite/           # Cross-language test utilities
└── pyproject.toml        # Python testing configuration
```

## Quick Start

### Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install individually
npm install                    # Root dependencies
npm install --prefix backend   # Backend dependencies
npm install --prefix frontend  # Frontend dependencies
npm install --prefix e2e       # E2E test dependencies
```

### Run All Tests

```bash
# Run all tests across backend and frontend
npm test

# Run all tests with coverage
npm run test:coverage

# Run quality checks (lint + format + test)
npm run quality:check
```

## Test Types

### Unit Tests

**Purpose**: Test individual functions, classes, and components in isolation.

**Backend Examples**:
- Service layer functions
- Utility functions
- Database models
- API route handlers

**Frontend Examples**:
- React components
- Redux reducers/actions
- Utility functions
- Custom hooks

### Integration Tests

**Purpose**: Test interactions between multiple modules or services.

**Examples**:
- API endpoint integration
- Database operations
- External service integrations
- Service-to-service communication

### Functional Tests

**Purpose**: Test complete business workflows and user scenarios.

**Examples**:
- User registration and login flow
- Trading operations end-to-end
- Order processing workflows
- Payment processing

### Smoke Tests

**Purpose**: Quick verification that critical functionality works.

**Examples**:
- Application startup
- Database connectivity
- External API availability
- Basic UI rendering

### Security Tests

**Purpose**: Verify security measures and identify vulnerabilities.

**Examples**:
- Input validation
- Authentication/authorization
- Rate limiting
- SQL injection prevention
- XSS protection

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test types
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:security       # Security tests only
npm run test:fuzz          # Fuzz tests only
npm run test:contract      # Contract tests only

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- test/unit/core-functions.test.js

# Run tests in watch mode
npm test -- --watch

# Run tests with specific pattern
npm test -- --testNamePattern="should validate"
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/__tests__/App.test.tsx

# Run tests in CI mode (no watch)
npm test -- --watchAll=false

# Run tests with coverage threshold
npm run test:coverage -- --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

### E2E Tests

```bash
cd e2e

# Run Cypress tests
npm run cy:run              # Headless mode
npm run cy:open             # Interactive mode
npm run cy:run:chrome       # Specific browser

# Run Playwright tests
npm run pw:test             # Headless mode
npm run pw:test:headed      # With browser UI
npm run pw:test:debug       # Debug mode

# Run both E2E frameworks
npm run test:e2e
```

### Python Tests (if applicable)

```bash
# Run pytest
pytest tests/

# Run with coverage
pytest --cov=backend tests/

# Run specific test file
pytest tests/test_example.py

# Run with markers
pytest -m "unit"           # Run only unit tests
pytest -m "not slow"       # Skip slow tests
```

## Writing Tests

### Backend Unit Test Example

```javascript
// test/unit/userService.test.js
const { UserService } = require('../../src/services/UserService');
const { User } = require('../../src/models/User');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('createUser', () => {
    test('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User'
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    test('should throw error with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        name: 'Test User'
      };

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

### Frontend Component Test Example

```typescript
// src/__tests__/UserProfile.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { UserProfile } from '../components/UserProfile';
import { createMockStore } from '../test-utils/mockStore';

describe('UserProfile', () => {
  const renderWithStore = (initialState = {}) => {
    const store = createMockStore(initialState);
    return render(
      <Provider store={store}>
        <UserProfile />
      </Provider>
    );
  };

  test('renders user information correctly', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'trader'
    };

    renderWithStore({ auth: { user: mockUser } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('trader')).toBeInTheDocument();
  });

  test('handles edit button click', () => {
    renderWithStore({ auth: { user: { name: 'John Doe' } } });

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByRole('form')).toBeInTheDocument();
  });
});
```

### E2E Test Example (Cypress)

```javascript
// e2e/cypress/e2e/user-login.cy.js
describe('User Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login successfully with valid credentials', () => {
    cy.get('[data-testid="email-input"]').type('user@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    cy.get('[data-testid="email-input"]').type('user@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Invalid credentials');
  });
});
```

## CI/CD Integration

### GitHub Actions Workflows

Tests are automatically run in CI/CD through several workflows:

1. **`ci.yml`**: Main CI workflow with comprehensive testing
2. **`backend.yml`**: Backend-specific testing and deployment
3. **`frontend.yml`**: Frontend testing and deployment
4. **`code_quality.yml`**: Code quality and security checks

### Test Execution Order

1. **Security Scan**: Vulnerability and secret detection
2. **Lint & Format**: Code style and syntax checking
3. **Unit Tests**: Fast, isolated tests
4. **Integration Tests**: Service interaction tests
5. **E2E Tests**: Full application workflows
6. **Performance Tests**: Load and stress testing

### Coverage Requirements

- **Backend**: Minimum 80% code coverage
- **Frontend**: Minimum 75% code coverage
- **Critical paths**: 95% coverage required

## Coverage Reports

### Viewing Coverage

```bash
# Backend coverage
cd backend && npm run test:coverage
open coverage/lcov-report/index.html

# Frontend coverage
cd frontend && npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage Configuration

Backend coverage is configured in `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

## Best Practices

### General Guidelines

1. **Test Naming**: Use descriptive test names that explain the expected behavior
2. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
3. **Test Isolation**: Each test should be independent and not rely on others
4. **Mock External Dependencies**: Use mocks for external services and APIs
5. **Test Data**: Use factories or fixtures for consistent test data

### Backend Testing

1. **Unit Tests**: Test business logic without external dependencies
2. **Integration Tests**: Use test databases and real service instances
3. **API Tests**: Test complete request/response cycles
4. **Error Handling**: Test both success and failure scenarios
5. **Security**: Include tests for authentication, authorization, and input validation

### Frontend Testing

1. **Component Tests**: Test components in isolation with mocked dependencies
2. **Integration Tests**: Test component interactions and data flow
3. **User Interaction**: Test user workflows and event handling
4. **Accessibility**: Include accessibility testing with tools like jest-axe
5. **Responsive Design**: Test components across different screen sizes

### E2E Testing

1. **User Journeys**: Focus on critical user workflows
2. **Data Independence**: Use test data that doesn't conflict with other tests
3. **Wait Strategies**: Use proper waiting strategies for async operations
4. **Error Recovery**: Test error states and recovery scenarios
5. **Cross-Browser**: Test on multiple browsers and devices

## Troubleshooting

### Common Issues

#### Backend Tests

```bash
# Database connection issues
export NODE_ENV=test
export DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/test_db

# Memory issues with large test suites
npm test -- --maxWorkers=4 --forceExit

# Mock issues
# Clear all mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
```

#### Frontend Tests

```bash
# Memory issues
npm test -- --watchAll=false --maxWorkers=4

# Module resolution issues
# Add to package.json:
"jest": {
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}

# Async component issues
# Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loading...')).not.toBeInTheDocument();
});
```

#### E2E Tests

```bash
# Browser issues
npx cypress install
npx playwright install

# Timeout issues
# Increase timeout in cypress.config.js or playwright.config.js
defaultCommandTimeout: 10000

# Element not found
# Use proper waiting strategies
cy.get('[data-testid="element"]', { timeout: 10000 }).should('be.visible');
```

### Debug Mode

```bash
# Backend debug
node --inspect-brk node_modules/.bin/jest --runInBand

# Frontend debug
npm test -- --no-watch --runInBand

# E2E debug
npm run cy:open      # Cypress interactive mode
npm run pw:test:debug # Playwright debug mode
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Pact Contract Testing](https://docs.pact.io/)

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Include both positive and negative test cases
3. Add appropriate test documentation
4. Ensure tests pass in CI/CD pipeline
5. Update this documentation if needed

For questions or issues with testing, please create an issue in the repository or contact the development team.