#!/bin/bash

# Simple verification script to test that the setup worked
# This can be run independently to check service health

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        return 1
    fi
}

echo "🔍 QuantEnergx Setup Verification"
echo "================================"

# Check services
echo "Checking services..."

# Frontend
if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend (http://localhost:3000)"
else
    echo -e "${RED}✗ Frontend (http://localhost:3000)${NC}"
    echo "  Try: cd frontend && npm start"
fi

# Backend API
if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    print_status "Backend API (http://localhost:3001)"
else
    echo -e "${RED}✗ Backend API (http://localhost:3001)${NC}"
    echo "  Try: cd backend && npm start"
fi

# API Documentation
if curl -f -s http://localhost:3001/api-docs > /dev/null 2>&1; then
    print_status "API Documentation (http://localhost:3001/api-docs)"
else
    echo -e "${YELLOW}⚠ API Documentation (http://localhost:3001/api-docs)${NC}"
    echo "  May not be configured yet"
fi

# Database (if Docker is running)
if docker ps | grep -q quantenergx-postgres; then
    if docker exec quantenergx-postgres pg_isready -U quantenergx > /dev/null 2>&1; then
        print_status "PostgreSQL Database"
    else
        echo -e "${RED}✗ PostgreSQL Database${NC}"
    fi
else
    echo -e "${YELLOW}⚠ PostgreSQL Database (Docker not running)${NC}"
fi

# Redis (if Docker is running)
if docker ps | grep -q quantenergx-redis; then
    if docker exec quantenergx-redis redis-cli ping > /dev/null 2>&1; then
        print_status "Redis Cache"
    else
        echo -e "${RED}✗ Redis Cache${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Redis Cache (Docker not running)${NC}"
fi

echo ""
echo "📋 System Information:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
if command -v docker > /dev/null; then
    echo "  Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
fi

echo ""
echo "📁 Key Files:"
[ -f "backend/.env" ] && echo -e "  ${GREEN}✓${NC} backend/.env" || echo -e "  ${RED}✗${NC} backend/.env"
[ -f "frontend/.env" ] && echo -e "  ${GREEN}✓${NC} frontend/.env" || echo -e "  ${RED}✗${NC} frontend/.env"
[ -d "backend/node_modules" ] && echo -e "  ${GREEN}✓${NC} backend/node_modules" || echo -e "  ${RED}✗${NC} backend/node_modules"
[ -d "frontend/node_modules" ] && echo -e "  ${GREEN}✓${NC} frontend/node_modules" || echo -e "  ${RED}✗${NC} frontend/node_modules"

echo ""
echo "🎯 Quick Actions:"
echo "  Restart setup:    ./setup-local.sh"
echo "  View logs:        tail -f backend.log frontend.log"
echo "  Stop services:    docker compose down"
echo "  Run tests:        npm test"
echo ""