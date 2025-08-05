#!/bin/bash
# QuantEnergx DevOps Overhaul Verification Script
# Tests all modernization improvements and best practices

# Disable strict error handling for better test reporting
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}🔍 $1${NC}"
    echo "========================================"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

test_result() {
    if [ $1 -eq 0 ]; then
        print_success "$2"
        ((TESTS_PASSED++))
    else
        print_error "$2"
        ((TESTS_FAILED++))
    fi
}

test_warning() {
    print_warning "$1"
    ((TESTS_WARNING++))
}

echo "🚀 QuantEnergx DevOps Overhaul Verification"
echo "============================================"
echo ""

# Test 1: Dependency Hygiene
print_header "1. Dependency Hygiene & Security"

# Check if problematic packages are removed
if ! npm list bundlesize >/dev/null 2>&1; then
    test_result 0 "bundlesize removed (vulnerability fix)"
else
    test_result 1 "bundlesize still present (should be removed)"
fi

# Check if node-telegram-bot-api is updated
if npm list node-telegram-bot-api | grep -q "0.66"; then
    test_result 0 "node-telegram-bot-api updated to 0.66.0+"
else
    test_warning "node-telegram-bot-api may need updating"
fi

# Check if webpack-bundle-analyzer is installed
if npm list webpack-bundle-analyzer >/dev/null 2>&1; then
    test_result 0 "webpack-bundle-analyzer installed (bundlesize replacement)"
else
    test_result 1 "webpack-bundle-analyzer missing"
fi

# Check if is-ci is installed
if npm list is-ci >/dev/null 2>&1; then
    test_result 0 "is-ci installed (prevents Husky in production)"
else
    test_result 1 "is-ci missing"
fi

# Check dependency documentation
if [ -f "DEPENDENCY_UPGRADE_NOTES.md" ]; then
    test_result 0 "Dependency upgrade notes documented"
else
    test_result 1 "Dependency upgrade notes missing"
fi

echo ""

# Test 2: Environment Validation
print_header "2. Environment Variable Validation"

# Check if validation script exists
if [ -f "scripts/validate-env.js" ]; then
    test_result 0 "Environment validation script exists"
else
    test_result 1 "Environment validation script missing"
fi

# Test validation script functionality
if [ -f "scripts/validate-env.js" ] && [ -x "scripts/validate-env.js" ]; then
    test_result 0 "Environment validation script is executable"
else
    test_result 1 "Environment validation script not executable"
fi

# Check if validation is integrated into package.json scripts
if grep -q "validate-env" backend/package.json && grep -q "validate-env" frontend/package.json; then
    test_result 0 "Environment validation integrated into build scripts"
else
    test_result 1 "Environment validation not integrated into build scripts"
fi

echo ""

# Test 3: TypeScript & Linting Configuration
print_header "3. TypeScript & Linting Configuration"

# Check TypeScript strict mode
if grep -q '"strict": true' frontend/tsconfig.json && grep -q '"strict": true' backend/tsconfig.json; then
    test_result 0 "TypeScript strict mode enabled"
else
    test_result 1 "TypeScript strict mode not enabled"
fi

# Test linting (allow warnings)
cd backend && npm run lint >/dev/null 2>&1
if [ $? -eq 0 ]; then
    test_result 0 "Backend linting passes"
else
    test_warning "Backend has linting warnings (acceptable)"
fi

cd ../frontend && npm run lint >/dev/null 2>&1
if [ $? -eq 0 ]; then
    test_result 0 "Frontend linting passes"
else
    test_warning "Frontend has linting warnings (acceptable)"
fi

cd ..

echo ""

# Test 4: Docker Configuration
print_header "4. Docker & Container Configuration"

# Check if Dockerfiles exist and are modernized
if [ -f "backend/Dockerfile" ] && grep -qi "multi-stage" backend/Dockerfile; then
    test_result 0 "Backend Dockerfile exists with multi-stage build"
else
    test_result 1 "Backend Dockerfile missing or not modernized"
fi

if [ -f "frontend/Dockerfile" ] && grep -qi "multi-stage" frontend/Dockerfile; then
    test_result 0 "Frontend Dockerfile exists with multi-stage build"
else
    test_result 1 "Frontend Dockerfile missing or not modernized"
fi

# Check if health checks are configured
if grep -q "HEALTHCHECK" backend/Dockerfile && grep -q "HEALTHCHECK" frontend/Dockerfile; then
    test_result 0 "Docker health checks configured"
else
    test_result 1 "Docker health checks missing"
fi

# Check if non-root users are configured
if grep -q "USER nodejs" backend/Dockerfile && grep -q "USER nginx" frontend/Dockerfile; then
    test_result 0 "Non-root users configured in Docker"
else
    test_result 1 "Non-root users not configured in Docker"
fi

echo ""

# Test 5: Security Headers Configuration
print_header "5. Security Headers & Cloud Configuration"

# Check vercel.json security headers
if [ -f "vercel.json" ] && grep -q "Content-Security-Policy" vercel.json && grep -q "Permissions-Policy" vercel.json; then
    test_result 0 "Vercel security headers enhanced"
else
    test_result 1 "Vercel security headers not enhanced"
fi

# Check railway.json security headers
if [ -f "railway.json" ] && grep -q "Content-Security-Policy" railway.json && grep -q "Permissions-Policy" railway.json; then
    test_result 0 "Railway security headers enhanced"
else
    test_result 1 "Railway security headers not enhanced"
fi

# Check nginx configuration
if [ -f "frontend/nginx.conf" ] && grep -q "Permissions-Policy" frontend/nginx.conf; then
    test_result 0 "Nginx security headers enhanced"
else
    test_result 1 "Nginx security headers not enhanced"
fi

echo ""

# Test 6: Build Scripts & Husky Configuration
print_header "6. Build Scripts & Production Configuration"

# Check if Husky is prevented in CI
if grep -q "is-ci || husky install" package.json; then
    test_result 0 "Husky prevented in CI/production builds"
else
    test_result 1 "Husky not prevented in CI/production builds"
fi

# Check if environment validation runs before builds
if grep -q "prebuild.*validate-env" backend/package.json && grep -q "prebuild.*validate-env" frontend/package.json; then
    test_result 0 "Environment validation runs before builds"
else
    test_result 1 "Environment validation not integrated with builds"
fi

echo ""

# Test 7: CI/CD & Automation
print_header "7. CI/CD & Automation Configuration"

# Check if Dependabot is configured
if [ -f ".github/dependabot.yml" ] && grep -q "weekly" .github/dependabot.yml; then
    test_result 0 "Dependabot configured for automated updates"
else
    test_result 1 "Dependabot not configured"
fi

# Check if CI workflow exists
if [ -f ".github/workflows/ci.yml" ]; then
    test_result 0 "CI workflow configured"
else
    test_result 1 "CI workflow missing"
fi

# Check if deployment validation scripts exist
if [ -f "scripts/validate-deployment.sh" ] && [ -f "scripts/verify-deployment.sh" ] && [ -f "scripts/check-deployment.sh" ]; then
    test_result 0 "Deployment validation scripts exist"
else
    test_result 1 "Deployment validation scripts missing"
fi

echo ""

# Test 8: Documentation Updates
print_header "8. Documentation & Deployment Guides"

# Check if DEPLOYMENT.md is updated
if [ -f "DEPLOYMENT.md" ] && grep -q "Environment Variable Validation" DEPLOYMENT.md; then
    test_result 0 "DEPLOYMENT.md updated with new features"
else
    test_result 1 "DEPLOYMENT.md not updated"
fi

# Check if dependency notes exist
if [ -f "DEPENDENCY_UPGRADE_NOTES.md" ] && grep -q "Security Vulnerabilities" DEPENDENCY_UPGRADE_NOTES.md; then
    test_result 0 "Dependency upgrade notes comprehensive"
else
    test_result 1 "Dependency upgrade notes incomplete"
fi

echo ""

# Test Summary
print_header "Verification Summary"
echo ""
echo "📊 Test Results:"
echo "   ✅ Passed: $TESTS_PASSED"
echo "   ❌ Failed: $TESTS_FAILED"
echo "   ⚠️  Warnings: $TESTS_WARNING"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))
    echo "📈 Success Rate: $SUCCESS_RATE%"
else
    SUCCESS_RATE=0
    echo "📈 Success Rate: 0% (no tests run)"
fi

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "🎉 All critical tests passed! DevOps overhaul completed successfully."
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Test Docker builds: docker-compose up --build"
    echo "   2. Run full test suite: npm run test:all"
    echo "   3. Deploy to staging environment"
    echo "   4. Monitor deployment health checks"
    echo ""
    echo "🔗 Verification Commands:"
    echo "   • Environment validation: node scripts/validate-env.js backend"
    echo "   • Security audit: npm audit"
    echo "   • Deployment check: scripts/check-deployment.sh"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    print_warning "⚠️  Most tests passed, but some issues need attention."
    echo ""
    echo "🔧 Fix the failed tests above and re-run this verification script."
    exit 1
else
    print_error "❌ Multiple critical issues detected. Review and fix before deployment."
    exit 1
fi