# Testing Documentation for QuantEnergx Platform

## Overview

This document provides comprehensive testing information for the QuantEnergx energy trading platform, including UI testing with Cypress, E2E testing with Playwright, and guidelines for running tests locally and in CI/CD environments.

## Table of Contents

- [Testing Architecture](#testing-architecture)
- [Test Coverage](#test-coverage)
- [Running Tests Locally](#running-tests-locally)
- [CI/CD Testing](#cicd-testing)
- [Test Data and Fixtures](#test-data-and-fixtures)
- [Debugging Tests](#debugging-tests)
- [Performance Testing](#performance-testing)
- [Accessibility Testing](#accessibility-testing)
- [Mobile Testing](#mobile-testing)
- [Cross-Browser Testing](#cross-browser-testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Testing Architecture

### Testing Stack
- **Cypress**: Component and E2E testing for user flows
- **Playwright**: Cross-browser testing and advanced E2E scenarios
- **Jest**: Unit testing for React components
- **Testing Library**: React component testing utilities

### Test Structure
```
e2e/
├── cypress/
│   ├── e2e/                    # Cypress E2E tests
│   ├── fixtures/               # Test data files
│   └── support/                # Custom commands and utilities
├── tests/                      # Playwright tests
└── test-logs/                  # Test artifacts and screenshots
```

## Test Coverage

### Cypress Test Coverage

#### Authentication & Security
- **File**: `auth.cy.ts`
- **Coverage**: Login/logout flows, session management, error handling
- **Key Scenarios**:
  - Valid/invalid credential handling
  - Session expiration
  - Security compliance
  - Accessibility testing

#### Trading Flows
- **File**: `trading-flow.cy.ts`
- **Coverage**: Complete trading workflow with real-time features
- **Key Scenarios**:
  - Order creation and execution
  - Real-time market data updates
  - WebSocket connectivity
  - Risk management integration
  - Audit trail verification

#### Settings Management
- **File**: `settings.cy.ts`
- **Coverage**: User preferences, security settings, notifications
- **Key Scenarios**:
  - Profile updates
  - Notification preferences
  - Security configuration
  - Trading preferences
  - Password management

#### Notifications System
- **File**: `notifications.cy.ts`
- **Coverage**: Real-time notifications, alerts, user interactions
- **Key Scenarios**:
  - Real-time notification delivery
  - Notification categorization
  - Mark as read/delete operations
  - Push notification preferences
  - Mobile notification handling

#### Mobile Components
- **File**: `mobile-components.cy.ts`
- **Coverage**: Mobile-specific features and responsive design
- **Key Scenarios**:
  - Touch interactions
  - Biometric authentication
  - Offline trading capabilities
  - Mobile settings
  - Responsive layouts

#### AI & ESG Dashboards
- **File**: `ai-esg-dashboards.cy.ts`
- **Coverage**: AI analytics and ESG metrics
- **Key Scenarios**:
  - AI predictions and recommendations
  - ESG scoring and reporting
  - Model performance metrics
  - Sustainability tracking

#### Compliance & Risk
- **File**: `compliance-risk.cy.ts`
- **Coverage**: Regulatory compliance and risk management
- **Key Scenarios**:
  - Regulatory status monitoring
  - Audit trail management
  - Risk assessment tools
  - VaR calculations
  - OCR document processing
  - Sharia compliance

### Playwright Test Coverage

#### Cross-Browser Testing
- **File**: `cross-browser.spec.ts`
- **Coverage**: Multi-browser compatibility testing
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Key Scenarios**:
  - Consistent UI behavior
  - WebSocket compatibility
  - Performance benchmarks
  - File upload handling
  - Browser-specific features

#### Mobile & Responsive Testing
- **File**: `mobile-responsive.spec.ts`
- **Coverage**: Mobile devices and responsive design
- **Devices**: iPhone 12/Pro, Pixel 5, Samsung Galaxy S21, iPad Air
- **Key Scenarios**:
  - Touch interactions
  - Orientation changes
  - PWA functionality
  - Performance on mobile networks
  - Biometric authentication

#### Performance & Accessibility
- **File**: `performance-accessibility.spec.ts`
- **Coverage**: Core Web Vitals and WCAG compliance
- **Key Scenarios**:
  - Load time optimization
  - Memory efficiency
  - WCAG 2.1 AA compliance
  - Keyboard navigation
  - Screen reader support

## Running Tests Locally

### Prerequisites
```bash
# Install dependencies
npm install

# Install browsers for Playwright
npx playwright install
```

### Cypress Tests

#### Interactive Mode
```bash
# Open Cypress GUI
npm run cy:open

# Run specific test file
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

#### Headless Mode
```bash
# Run all Cypress tests
npm run cy:run

# Run with specific browser
npm run cy:run:chrome
npm run cy:run:firefox
npm run cy:run:edge

# Run with coverage
npm run cy:run -- --env coverage=true
```

### Playwright Tests

#### All Tests
```bash
# Run all Playwright tests
npm run pw:test

# Run with UI mode (headed)
npm run pw:test:headed

# Run with debug mode
npm run pw:test:debug
```

#### Specific Tests
```bash
# Run cross-browser tests only
npx playwright test cross-browser

# Run mobile tests only
npx playwright test mobile-responsive

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Frontend Unit Tests
```bash
# Run React component tests
cd frontend
npm run test

# Run with coverage
npm run test:coverage
```

## CI/CD Testing

### GitHub Actions Workflow

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Scheduled nightly runs

#### Configuration Files
- `.github/workflows/test.yml` - Main test workflow
- `.github/workflows/e2e.yml` - E2E test workflow

### CI Test Commands
```bash
# Install and run all tests
npm run install:all
npm run test
npm run e2e

# Generate test reports
npm run test:coverage
npm run e2e:report
```

### Test Parallelization
- Cypress tests run in parallel across 4 containers
- Playwright tests run across multiple browsers simultaneously
- Frontend unit tests use Jest's built-in parallelization

## Test Data and Fixtures

### Cypress Fixtures
Located in `e2e/cypress/fixtures/`:
- `notifications.json` - Sample notification data
- `ai-analytics.json` - AI model analytics
- `esg-metrics.json` - ESG scoring data
- `compliance-status.json` - Regulatory compliance data
- `risk-metrics.json` - Risk assessment data

### Mock Data Generation
```javascript
// Custom command for creating mock trades
cy.createMockTrade({
  commodity: 'Crude Oil',
  quantity: 1000,
  price: 75.50
})

// Mock real-time market updates
cy.simulateMarketUpdate({
  commodity: 'crude_oil',
  price: 76.25,
  change: 0.75
})
```

### Environment Configuration
```bash
# Test environment variables
CYPRESS_baseUrl=http://localhost:3000
CYPRESS_apiUrl=http://localhost:3001
PLAYWRIGHT_baseURL=http://localhost:3000
```

## Debugging Tests

### Cypress Debugging
```bash
# Run in headed mode
npx cypress run --headed

# Debug specific test
npx cypress run --spec "cypress/e2e/auth.cy.ts" --headed --no-exit

# Enable debug logs
DEBUG=cypress:* npx cypress run
```

### Playwright Debugging
```bash
# Debug mode with browser
npx playwright test --debug

# Generate code from interactions
npx playwright codegen localhost:3000

# Trace viewer
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Visual Debugging
- Cypress: Screenshots saved to `cypress/screenshots/`
- Playwright: Screenshots saved to `test-results/`
- Videos: Available for failed tests

## Performance Testing

### Metrics Tracked
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Performance Test Commands
```bash
# Run performance tests
npx playwright test performance-accessibility --grep "Performance"

# Generate performance report
npm run test:performance
```

### Lighthouse Integration
```bash
# Run Lighthouse audits
npm install -g @lhci/cli
lhci autorun --config=lighthouserc.json
```

## Accessibility Testing

### Standards Compliance
- **WCAG 2.1 AA** compliance
- **Section 508** compliance
- Screen reader compatibility

### Accessibility Test Commands
```bash
# Run accessibility tests
npx playwright test performance-accessibility --grep "Accessibility"

# Cypress accessibility tests
npx cypress run --spec "cypress/e2e/**/**.cy.ts" --env a11y=true
```

### Tools Integration
- **axe-core**: Automated accessibility testing
- **cypress-axe**: Cypress accessibility plugin
- **Pa11y**: Command-line accessibility testing

## Mobile Testing

### Supported Devices
- iPhone 12/12 Pro
- Samsung Galaxy S21
- Google Pixel 5
- iPad Air

### Mobile Test Commands
```bash
# Run mobile tests
npx playwright test mobile-responsive

# Test specific device
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Touch Testing
```javascript
// Touch interactions
await page.tap('[data-testid="mobile-menu"]')
await page.touchscreen.swipe(100, 200, 300, 200)

// Biometric authentication testing
await page.addInitScript(() => {
  window.navigator.credentials = mockCredentials
})
```

## Cross-Browser Testing

### Supported Browsers
- **Chromium** (Chrome, Edge)
- **Firefox**
- **WebKit** (Safari)

### Browser-Specific Tests
```bash
# Run on all browsers
npx playwright test cross-browser

# Specific browser
npx playwright test --project=webkit
```

### Browser Compatibility Checks
- CSS feature support
- JavaScript API availability
- WebSocket compatibility
- File upload behavior

## Best Practices

### Test Organization
1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the scenario
3. **Implement proper setup/teardown** in beforeEach/afterEach
4. **Mock external dependencies** for reliable tests

### Data Management
1. **Use fixtures** for test data
2. **Reset state** between tests
3. **Avoid hardcoded values** in tests
4. **Use data-testid** attributes for reliable selectors

### Maintenance
1. **Regular test review** and cleanup
2. **Update test data** to match current features
3. **Monitor test performance** and optimize slow tests
4. **Keep dependencies updated**

### Writing New Tests
```javascript
// Good test structure
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  })

  it('should perform specific action successfully', () => {
    // Arrange
    // Act  
    // Assert
  })

  afterEach(() => {
    // Cleanup
  })
})
```

## Troubleshooting

### Common Issues

#### Test Timeouts
```bash
# Increase timeout in cypress.config.ts
defaultCommandTimeout: 10000

# Increase timeout in playwright.config.ts
timeout: 30000
```

#### Element Not Found
```javascript
// Use explicit waits
cy.get('[data-testid="element"]', { timeout: 10000 })
await page.waitForSelector('[data-testid="element"]')
```

#### Flaky Tests
1. **Add proper waits** for async operations
2. **Use data attributes** instead of CSS selectors
3. **Mock time-dependent** functionality
4. **Retry failed tests** with consistent results

#### CI/CD Failures
1. **Check environment variables**
2. **Verify dependencies** are installed
3. **Review test artifacts** and screenshots
4. **Check for race conditions**

### Debug Commands
```bash
# Cypress debug
DEBUG=cypress:* npm run cy:run

# Playwright debug
PWDEBUG=1 npx playwright test

# Verbose logging
npm run test -- --verbose
```

### Test Artifacts Location
- **Screenshots**: `test-logs/screenshots/`
- **Videos**: `test-logs/videos/`
- **Reports**: `test-logs/reports/`
- **Coverage**: `test-logs/coverage/`

## Test Reports and Artifacts

### Report Generation
```bash
# Generate HTML reports
npm run test:report

# Coverage reports
npm run test:coverage

# Playwright reports
npx playwright show-report
```

### Artifact Management
- Screenshots automatically captured on failures
- Videos recorded for debugging
- Test reports in multiple formats (HTML, JSON, JUnit)
- Coverage reports with detailed metrics

---

For questions or issues with testing, please refer to the project's issue tracker or contact the development team.