#!/bin/bash

# QuantEnergx Complete Deployment Readiness Check
# This script performs a comprehensive validation of the entire deployment setup

set -e

echo "🚀 QuantEnergx Deployment Readiness Assessment"
echo "=============================================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Counters
TOTAL_CATEGORIES=0
PASSED_CATEGORIES=0
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Category tracking
declare -A CATEGORY_RESULTS

# Function to start category
start_category() {
  local category="$1"
  TOTAL_CATEGORIES=$((TOTAL_CATEGORIES + 1))
  echo -e "\n${BOLD}${BLUE}📂 $category${NC}"
  echo "$(printf '=%.0s' {1..50})"
  CATEGORY_CHECKS=0
  CATEGORY_PASSED=0
}

# Function to run check
check() {
  local description="$1"
  local command="$2"
  local critical="${3:-false}"
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  CATEGORY_CHECKS=$((CATEGORY_CHECKS + 1))
  
  echo -n "🔍 $description... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    CATEGORY_PASSED=$((CATEGORY_PASSED + 1))
    return 0
  else
    if [ "$critical" = "true" ]; then
      echo -e "${RED}❌ CRITICAL FAIL${NC}"
    else
      echo -e "${YELLOW}⚠️  FAIL${NC}"
    fi
    return 1
  fi
}

# Function to end category
end_category() {
  local category="$1"
  if [ $CATEGORY_PASSED -eq $CATEGORY_CHECKS ]; then
    echo -e "${GREEN}✅ $category: All checks passed ($CATEGORY_PASSED/$CATEGORY_CHECKS)${NC}"
    PASSED_CATEGORIES=$((PASSED_CATEGORIES + 1))
    CATEGORY_RESULTS["$category"]="✅ PASS"
  else
    echo -e "${YELLOW}⚠️  $category: Some issues found ($CATEGORY_PASSED/$CATEGORY_CHECKS)${NC}"
    CATEGORY_RESULTS["$category"]="⚠️  PARTIAL"
  fi
}

# 1. Repository Structure
start_category "Repository Structure"
check "package.json exists" "test -f package.json" true
check "Frontend directory structure" "test -d frontend && test -f frontend/package.json" true
check "Backend directory structure" "test -d backend && test -f backend/package.json" true
check "Docker configurations" "test -f frontend/Dockerfile && test -f backend/Dockerfile" true
check "Environment examples" "test -f frontend/.env.example && test -f backend/.env.example" true
end_category "Repository Structure"

# 2. CI/CD Workflows
start_category "CI/CD Workflows"
check "Main CI/CD workflow" "test -f .github/workflows/main-ci-cd.yml" true
check "Emergency deployment workflow" "test -f .github/workflows/emergency-deploy.yml" true
check "Frontend standalone workflow" "test -f .github/workflows/frontend.yml"
check "Backend standalone workflow" "test -f .github/workflows/backend.yml"
check "Legacy workflows preserved" "test -f .github/workflows/ci-legacy.yml"
end_category "CI/CD Workflows"

# 3. Deployment Configurations
start_category "Deployment Configurations"
check "Vercel configuration" "test -f frontend/vercel.json" true
check "Render configuration" "test -f render.yaml" true
check "Railway configuration" "test -f railway.json" true
check "Docker Compose" "test -f docker-compose.yml" true
check "Nginx configuration" "test -f frontend/nginx.conf" true
end_category "Deployment Configurations"

# 4. Health Endpoints
start_category "Health Endpoints"
check "Frontend health file" "test -f frontend/public/health.txt" true
check "Backend health endpoint code" "grep -q '/health' backend/src/server.js" true
check "API info endpoint code" "grep -q '/info' backend/src/routes/index.js" true
end_category "Health Endpoints"

# 5. Scripts and Tools
start_category "Scripts and Tools"
check "Local validation script" "test -x scripts/validate-local-ci.sh" true
check "Deployment verification script" "test -x scripts/deployment-verification.sh" true
check "Other utility scripts" "test -d scripts" true
end_category "Scripts and Tools"

# 6. Dependencies and Build
start_category "Dependencies and Build"
check "Root dependencies installed" "test -d node_modules" 
check "Frontend builds successfully" "cd frontend && npm run build > /dev/null 2>&1" true
check "Backend builds successfully" "cd backend && npm run build > /dev/null 2>&1" true
check "Frontend tests exist" "test -d frontend/src && find frontend/src -name '*.test.*' | head -1" 
check "Backend tests exist" "test -d backend/test" true
end_category "Dependencies and Build"

# 7. Security Configuration
start_category "Security Configuration"
check "Git hooks configuration" "test -f .husky/pre-commit || test -f package.json && grep -q husky package.json"
check "Lint staged configuration" "grep -q lint-staged package.json"
check "Security headers in configs" "grep -q 'X-Frame-Options' frontend/vercel.json"
check "HTTPS enforcement" "grep -q 'ENFORCE_HTTPS' backend/.env.example"
end_category "Security Configuration"

# 8. Documentation
start_category "Documentation"
check "Deployment guide" "test -f DEPLOYMENT.md" true
check "README exists" "test -f README.md" true
check "Deployment summary" "test -f DEPLOYMENT_SUMMARY.md"
check "Security documentation" "test -f SECURITY.md"
check "Contributing guidelines" "test -f CONTRIBUTING.md"
end_category "Documentation"

echo
echo "📊 Final Assessment"
echo "==================="
echo -e "Categories: ${BLUE}$PASSED_CATEGORIES/$TOTAL_CATEGORIES passed${NC}"
echo -e "Total checks: ${BLUE}$PASSED_CHECKS/$TOTAL_CHECKS passed${NC}"

PASS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "Overall pass rate: ${BLUE}$PASS_RATE%${NC}"

echo
echo "📋 Category Summary"
echo "==================="
for category in "${!CATEGORY_RESULTS[@]}"; do
  echo -e "$category: ${CATEGORY_RESULTS[$category]}"
done

echo
if [ $PASSED_CATEGORIES -eq $TOTAL_CATEGORIES ] && [ $PASS_RATE -ge 95 ]; then
  echo -e "${GREEN}🎉 DEPLOYMENT READY!${NC}"
  echo -e "${GREEN}All critical systems are operational and ready for production deployment.${NC}"
  exit 0
elif [ $PASS_RATE -ge 80 ]; then
  echo -e "${YELLOW}✅ MOSTLY READY${NC}"
  echo -e "${YELLOW}Deployment infrastructure is functional with minor issues.${NC}"
  echo -e "${YELLOW}Review failed checks and consider fixes before production deployment.${NC}"
  exit 0
else
  echo -e "${RED}❌ NOT READY${NC}"
  echo -e "${RED}Critical issues found. Address failures before deployment.${NC}"
  exit 1
fi