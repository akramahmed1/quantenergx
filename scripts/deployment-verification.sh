#!/bin/bash

# Complete deployment verification script for QuantEnergx
# This script verifies all deployment endpoints and health checks

set -e

echo "🔍 QuantEnergx Deployment Verification"
echo "======================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URLS=(
  "${VERCEL_APP_URL:-https://quantenergx.vercel.app}"
  "${NETLIFY_APP_URL:-}"
)

BACKEND_URLS=(
  "${RENDER_APP_URL:-https://quantenergx-backend.onrender.com}"
  "${RAILWAY_APP_URL:-https://quantenergx-backend.railway.app}"
)

# Track results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to check endpoint
check_endpoint() {
  local url="$1"
  local expected_status="$2"
  local description="$3"
  
  if [ -z "$url" ] || [ "$url" = "https://" ]; then
    echo -e "${YELLOW}⏭️  Skipping: $description (URL not configured)${NC}"
    return 0
  fi
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  echo -n "🔍 Checking $description... "
  
  local status_code
  status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$url" || echo "000")
  
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✅ PASS${NC} ($status_code)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC} ($status_code, expected $expected_status)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
}

# Function to check health endpoint
check_health() {
  local url="$1"
  local description="$2"
  
  if [ -z "$url" ] || [ "$url" = "https://" ]; then
    echo -e "${YELLOW}⏭️  Skipping: $description health check (URL not configured)${NC}"
    return 0
  fi
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  echo -n "🏥 Checking $description health... "
  
  local response
  response=$(curl -s --max-time 30 "$url/health" || echo "ERROR")
  
  if echo "$response" | grep -q "healthy"; then
    echo -e "${GREEN}✅ HEALTHY${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    return 0
  else
    echo -e "${RED}❌ UNHEALTHY${NC}"
    echo "   Response: $response"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
}

# Function to check security headers
check_security_headers() {
  local url="$1"
  local description="$2"
  
  if [ -z "$url" ] || [ "$url" = "https://" ]; then
    echo -e "${YELLOW}⏭️  Skipping: $description security headers (URL not configured)${NC}"
    return 0
  fi
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  echo -n "🔒 Checking $description security headers... "
  
  local headers
  headers=$(curl -s -I --max-time 30 "$url" || echo "ERROR")
  
  local missing_headers=()
  
  if ! echo "$headers" | grep -qi "x-frame-options"; then
    missing_headers+=("X-Frame-Options")
  fi
  
  if ! echo "$headers" | grep -qi "x-content-type-options"; then
    missing_headers+=("X-Content-Type-Options")
  fi
  
  if ! echo "$headers" | grep -qi "x-xss-protection"; then
    missing_headers+=("X-XSS-Protection")
  fi
  
  if [ ${#missing_headers[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ SECURE${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    return 0
  else
    echo -e "${YELLOW}⚠️  MISSING${NC}: ${missing_headers[*]}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
}

echo
echo "🌐 Frontend Deployments"
echo "----------------------"

for url in "${FRONTEND_URLS[@]}"; do
  if [ -n "$url" ] && [ "$url" != "https://" ]; then
    platform=$(echo "$url" | sed 's/.*\/\/\([^.]*\).*/\1/')
    check_endpoint "$url" "200" "$platform frontend"
    check_health "$url" "$platform frontend"
    check_security_headers "$url" "$platform frontend"
    echo
  fi
done

echo "🔧 Backend Deployments"
echo "----------------------"

for url in "${BACKEND_URLS[@]}"; do
  if [ -n "$url" ] && [ "$url" != "https://" ]; then
    platform=$(echo "$url" | sed 's/.*\/\/\([^.]*\).*/\1/')
    check_endpoint "$url/health" "200" "$platform backend"
    check_health "$url" "$platform backend"
    check_security_headers "$url" "$platform backend"
    echo
  fi
done

echo "🧪 API Endpoint Tests"
echo "--------------------"

for url in "${BACKEND_URLS[@]}"; do
  if [ -n "$url" ] && [ "$url" != "https://" ]; then
    platform=$(echo "$url" | sed 's/.*\/\/\([^.]*\).*/\1/')
    check_endpoint "$url/api/v1/info" "200" "$platform API info"
  fi
done

echo
echo "📊 Results Summary"
echo "=================="
echo -e "Total checks: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "\n${GREEN}🎉 All deployments are healthy and secure!${NC}"
  exit 0
else
  echo -e "\n${RED}⚠️  Some checks failed. Please review the deployment.${NC}"
  exit 1
fi