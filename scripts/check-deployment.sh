#!/bin/bash
# QuantEnergx Cloud Deployment Health Check Script
# Validates health endpoints and basic functionality of deployed services

set -e

# Configuration - Update these URLs with your actual deployment URLs
FRONTEND_URL="${FRONTEND_URL:-https://your-app.vercel.app}"
BACKEND_URL="${BACKEND_URL:-https://your-backend.onrender.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}🔍 $1${NC}"
    echo "=================================="
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo "   Checking $name: $url"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.txt "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        print_status "$name is healthy (HTTP $response)"
        if [ -f /tmp/response.txt ]; then
            echo "   Response: $(cat /tmp/response.txt | head -c 100)..."
        fi
    else
        print_error "$name is unhealthy (HTTP $response)"
        return 1
    fi
}

# Function to check security headers
check_security_headers() {
    local url=$1
    local name=$2
    
    echo "   Checking security headers for $name..."
    
    headers=$(curl -s -I "$url" 2>/dev/null || echo "")
    
    security_headers=("X-Frame-Options" "X-Content-Type-Options" "X-XSS-Protection" "Content-Security-Policy")
    
    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -qi "$header"; then
            print_status "$header present"
        else
            print_warning "$header missing"
        fi
    done
}

echo "🚀 QuantEnergx Cloud Deployment Health Check"
echo "============================================="
echo ""

# Frontend Health Check
print_header "Frontend Health Check"
echo "URL: $FRONTEND_URL"
echo ""

if check_endpoint "$FRONTEND_URL/health" "Frontend Health Endpoint"; then
    print_status "Frontend is operational"
    check_security_headers "$FRONTEND_URL" "Frontend"
else
    print_error "Frontend health check failed"
fi

echo ""

# Backend Health Check  
print_header "Backend Health Check"
echo "URL: $BACKEND_URL"
echo ""

if check_endpoint "$BACKEND_URL/health" "Backend Health Endpoint"; then
    print_status "Backend is operational"
    
    # Check API endpoints
    echo ""
    echo "   Testing API endpoints..."
    
    # Test API info endpoint
    if check_endpoint "$BACKEND_URL/api/v1/info" "API Info Endpoint"; then
        print_status "API endpoints accessible"
    fi
    
    # Test auth endpoint (should return validation error, not 500)
    echo "   Testing authentication endpoint..."
    auth_response=$(curl -s -w "%{http_code}" -o /tmp/auth_response.txt -X POST "$BACKEND_URL/api/v1/users/auth/login" -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "000")
    
    if [ "$auth_response" = "400" ] || [ "$auth_response" = "422" ]; then
        print_status "Authentication endpoint responding correctly (validation error expected)"
    else
        print_warning "Authentication endpoint returned HTTP $auth_response"
    fi
    
    check_security_headers "$BACKEND_URL" "Backend"
else
    print_error "Backend health check failed"
fi

echo ""

# Overall Status
print_header "Overall Deployment Status"

# Count successful checks
frontend_ok=false
backend_ok=false

if curl -s "$FRONTEND_URL/health" > /dev/null 2>&1; then
    frontend_ok=true
fi

if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    backend_ok=true
fi

if [ "$frontend_ok" = true ] && [ "$backend_ok" = true ]; then
    print_status "✨ All services are operational!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Test admin login at: $FRONTEND_URL/login"
    echo "   - Username: admin"
    echo "   - Password: Admin!2025Demo"
    echo ""
    echo "2. Verify trading functionality"
    echo "3. Check monitoring dashboards"
    echo "4. Review deployment logs"
elif [ "$frontend_ok" = true ]; then
    print_warning "Frontend operational, backend needs attention"
elif [ "$backend_ok" = true ]; then
    print_warning "Backend operational, frontend needs attention"
else
    print_error "Both services need attention"
fi

echo ""
echo "📊 Service URLs:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo "   Health:   $FRONTEND_URL/health | $BACKEND_URL/health"

# Cleanup
rm -f /tmp/response.txt /tmp/auth_response.txt