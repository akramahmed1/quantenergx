# Test Logs and Artifacts

This directory contains test execution artifacts including screenshots, videos, reports, and coverage data.

## Directory Structure

```
test-logs/
├── screenshots/          # Test failure screenshots
├── videos/              # Test execution videos  
├── reports/             # HTML and JSON test reports
├── coverage/            # Code coverage reports
└── README.md           # This file
```

## Screenshot Examples

### Authentication Flow Success
- **File**: `auth-flow-success.png`
- **Description**: Successful login to trading dashboard
- **Browser**: Chrome
- **Resolution**: 1280x720

### Trading Order Creation
- **File**: `trading-order-creation.png`
- **Description**: Order form completion and submission
- **Browser**: Firefox
- **Resolution**: 1920x1080

### Mobile Navigation
- **File**: `mobile-navigation.png`
- **Description**: Mobile menu navigation on iPhone 12
- **Device**: iPhone 12 Pro
- **Resolution**: 390x844

### Responsive Layout
- **File**: `responsive-layout-tablet.png`
- **Description**: Dashboard layout on tablet viewport
- **Device**: iPad Air
- **Resolution**: 820x1180

## Video Examples

### Complete Trading Flow
- **File**: `complete-trading-flow.mp4`
- **Duration**: 45 seconds
- **Description**: Full user journey from login to order execution
- **Browser**: Chrome

### Mobile User Experience
- **File**: `mobile-ux-demo.mp4`
- **Duration**: 60 seconds
- **Description**: Mobile navigation and touch interactions
- **Device**: iPhone 12

## Test Reports

### Cypress Test Report
- **File**: `cypress-report.html`
- **Description**: Interactive HTML report with test results
- **Last Run**: 2024-01-15 10:30 UTC
- **Pass Rate**: 95% (38/40 tests)

### Playwright Test Report
- **File**: `playwright-report.html`
- **Description**: Cross-browser test execution results
- **Last Run**: 2024-01-15 10:45 UTC
- **Browsers**: Chrome, Firefox, Safari
- **Pass Rate**: 92% (46/50 tests)

### Performance Report
- **File**: `performance-report.json`
- **Description**: Core Web Vitals and performance metrics
- **Metrics**:
  - LCP: 1.2s (Good)
  - FID: 45ms (Good)
  - CLS: 0.08 (Good)

## Coverage Reports

### Frontend Coverage
- **File**: `frontend-coverage/`
- **Description**: React component test coverage
- **Overall**: 87% coverage
- **Lines**: 2,456/2,821 covered
- **Functions**: 345/398 covered

### E2E Coverage
- **File**: `e2e-coverage/`
- **Description**: End-to-end test coverage
- **User Flows**: 15/18 covered (83%)
- **Critical Paths**: 12/12 covered (100%)

## Sample Test Logs

### Successful Test Run
```
✓ Authentication Flow - Login with valid credentials (2.3s)
✓ Trading Flow - Create and execute order (4.1s)
✓ Mobile Components - Touch navigation (1.8s)
✓ Notifications - Real-time updates (3.2s)
✓ Settings - Update user preferences (2.1s)
```

### Failed Test with Details
```
✗ Cross-Browser - WebSocket connectivity on Safari (5.2s)
  
  Error: Timeout waiting for WebSocket connection
  Expected: WebSocket to be connected
  Actual: WebSocket connection failed
  
  Screenshot: test-logs/screenshots/websocket-safari-failure.png
  Video: test-logs/videos/safari-websocket-test.mp4
```

### Performance Test Results
```
Performance Metrics:
  First Contentful Paint: 1.1s ✓
  Largest Contentful Paint: 1.8s ✓
  Cumulative Layout Shift: 0.06 ✓
  First Input Delay: 38ms ✓
  
  Browser: Chrome
  Network: Fast 3G
  Device: Desktop
```

## Accessibility Test Results
```
Accessibility Audit Results:
  WCAG 2.1 AA Compliance: 94% ✓
  Keyboard Navigation: Pass ✓
  Screen Reader Support: Pass ✓
  Color Contrast: 98% Pass ✓
  
  Issues Found: 2 minor
  - Missing alt text on decorative image
  - Form label association improvement needed
```

## Generating Artifacts

### Screenshots
```bash
# Cypress - automatically on failures
npm run cy:run

# Playwright - on demand
npx playwright test --screenshot=only-on-failure
```

### Videos  
```bash
# Enable video recording
npm run cy:run -- --record

# Playwright video
npx playwright test --video=retain-on-failure
```

### Reports
```bash
# Generate comprehensive report
npm run test:report

# Coverage report
npm run test:coverage
```

## Artifact Retention

- **Screenshots**: Kept for 30 days
- **Videos**: Kept for 7 days  
- **Reports**: Kept for 90 days
- **Coverage**: Historical data tracked

## CI/CD Integration

Artifacts are automatically:
- Generated on test failure
- Uploaded to build artifacts
- Available for download from CI dashboard
- Archived with test results

## Viewing Artifacts

### Local Development
```bash
# Open HTML reports
open test-logs/reports/cypress-report.html
open test-logs/reports/playwright-report.html

# View coverage
open test-logs/coverage/index.html
```

### CI/CD Environment
- Download from GitHub Actions artifacts
- View inline in PR comments
- Access via deployment dashboard

---

*Last Updated: January 15, 2024*