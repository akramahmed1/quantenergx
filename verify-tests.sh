#!/bin/bash

# Test setup verification script for QuantEnergx platform

echo "🚀 QuantEnergx Test Suite Verification"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📂 Project structure verification..."

# Check key directories exist
directories=(
    "frontend"
    "e2e"
    "e2e/cypress/e2e"
    "e2e/tests"
    "test-logs"
)

for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir exists"
    else
        echo "❌ $dir missing"
    fi
done

# Check test files exist
echo ""
echo "📋 Test files verification..."

cypress_tests=(
    "e2e/cypress/e2e/auth.cy.ts"
    "e2e/cypress/e2e/trading-flow.cy.ts"
    "e2e/cypress/e2e/settings.cy.ts"
    "e2e/cypress/e2e/notifications.cy.ts"
    "e2e/cypress/e2e/mobile-components.cy.ts"
    "e2e/cypress/e2e/ai-esg-dashboards.cy.ts"
    "e2e/cypress/e2e/compliance-risk.cy.ts"
)

playwright_tests=(
    "e2e/tests/basic-flow.spec.ts"
    "e2e/tests/cross-browser.spec.ts"
    "e2e/tests/mobile-responsive.spec.ts"
    "e2e/tests/performance-accessibility.spec.ts"
)

echo "Cypress tests:"
for test in "${cypress_tests[@]}"; do
    if [ -f "$test" ]; then
        echo "✅ $test"
    else
        echo "❌ $test"
    fi
done

echo ""
echo "Playwright tests:"
for test in "${playwright_tests[@]}"; do
    if [ -f "$test" ]; then
        echo "✅ $test"
    else
        echo "❌ $test"
    fi
done

# Check fixtures
echo ""
echo "📊 Test fixtures verification..."

fixtures=(
    "e2e/cypress/fixtures/notifications.json"
    "e2e/cypress/fixtures/ai-analytics.json"
    "e2e/cypress/fixtures/esg-metrics.json"
    "e2e/cypress/fixtures/compliance-status.json"
    "e2e/cypress/fixtures/risk-metrics.json"
)

for fixture in "${fixtures[@]}"; do
    if [ -f "$fixture" ]; then
        echo "✅ $fixture"
    else
        echo "❌ $fixture"
    fi
done

# Check configuration files
echo ""
echo "⚙️  Configuration files verification..."

configs=(
    "e2e/cypress.config.ts"
    "e2e/playwright.config.ts"
    "TESTING.md"
)

for config in "${configs[@]}"; do
    if [ -f "$config" ]; then
        echo "✅ $config"
    else
        echo "❌ $config"
    fi
done

# Count test coverage
echo ""
echo "📈 Test coverage summary..."

cypress_count=$(find e2e/cypress/e2e -name "*.cy.ts" | wc -l)
playwright_count=$(find e2e/tests -name "*.spec.ts" | wc -l)
fixture_count=$(find e2e/cypress/fixtures -name "*.json" | wc -l)

echo "Cypress E2E tests: $cypress_count"
echo "Playwright tests: $playwright_count"
echo "Test fixtures: $fixture_count"

# Check dependencies
echo ""
echo "📦 Dependencies verification..."

cd e2e

if [ -f "package.json" ]; then
    echo "✅ E2E package.json exists"
    
    # Check if key dependencies are listed
    if grep -q "cypress" package.json; then
        echo "✅ Cypress dependency found"
    else
        echo "❌ Cypress dependency missing"
    fi
    
    if grep -q "@playwright/test" package.json; then
        echo "✅ Playwright dependency found"
    else
        echo "❌ Playwright dependency missing"
    fi
else
    echo "❌ E2E package.json missing"
fi

cd ..

echo ""
echo "🎯 Test Suite Summary"
echo "===================="
echo "✨ New Cypress Tests Added: 5"
echo "   - Settings management"
echo "   - Notifications system"
echo "   - Mobile components"
echo "   - AI/ESG dashboards"
echo "   - Compliance & risk"
echo ""
echo "🌐 Enhanced Playwright Tests: 3"
echo "   - Cross-browser compatibility"
echo "   - Mobile & responsive design"
echo "   - Performance & accessibility"
echo ""
echo "📁 Test Infrastructure:"
echo "   - Comprehensive test documentation (TESTING.md)"
echo "   - Sample test artifacts and logs"
echo "   - Enhanced custom commands"
echo "   - Improved configurations"
echo ""
echo "🚀 Ready to run tests with:"
echo "   npm run cy:run        # Cypress tests"
echo "   npm run pw:test       # Playwright tests"
echo "   npm run e2e           # All E2E tests"

echo ""
echo "✅ Test suite verification completed!"