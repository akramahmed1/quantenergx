#!/bin/bash

# QuantEnergx Regression Test Script
# This script runs the full test suite to ensure new changes don't break existing functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[REGRESSION]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Initialize variables
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
TEST_RESULTS_DIR="test-results/regression"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
RESULTS_FILE="$TEST_RESULTS_DIR/regression_results_$TIMESTAMP.json"

# Create results directory
mkdir -p "$TEST_RESULTS_DIR"

print_status "Starting regression test suite at $(date)"
print_status "Results will be saved to: $RESULTS_FILE"

# Initialize results JSON
echo "{" > "$RESULTS_FILE"
echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$RESULTS_FILE"
echo "  \"environment\": \"${NODE_ENV:-development}\"," >> "$RESULTS_FILE"
echo "  \"git_commit\": \"$(git rev-parse HEAD)\"," >> "$RESULTS_FILE"
echo "  \"git_branch\": \"$(git branch --show-current)\"," >> "$RESULTS_FILE"
echo "  \"results\": {" >> "$RESULTS_FILE"

# Track overall success
OVERALL_SUCCESS=true

# Function to run test category and record results
run_test_category() {
    local category=$1
    local command=$2
    local directory=$3
    
    print_status "Running $category tests..."
    
    cd "$directory"
    
    if eval "$command" > "../test-results/regression/${category}_${TIMESTAMP}.log" 2>&1; then
        print_success "$category tests passed"
        echo "    \"$category\": {" >> "../$RESULTS_FILE"
        echo "      \"status\": \"passed\"," >> "../$RESULTS_FILE"
        echo "      \"timestamp\": \"$(date -Iseconds)\"," >> "../$RESULTS_FILE"
        echo "      \"log_file\": \"${category}_${TIMESTAMP}.log\"" >> "../$RESULTS_FILE"
        echo "    }," >> "../$RESULTS_FILE"
    else
        print_error "$category tests failed"
        OVERALL_SUCCESS=false
        echo "    \"$category\": {" >> "../$RESULTS_FILE"
        echo "      \"status\": \"failed\"," >> "../$RESULTS_FILE"
        echo "      \"timestamp\": \"$(date -Iseconds)\"," >> "../$RESULTS_FILE"
        echo "      \"log_file\": \"${category}_${TIMESTAMP}.log\"" >> "../$RESULTS_FILE"
        echo "    }," >> "../$RESULTS_FILE"
    fi
    
    cd - > /dev/null
}

# Backend regression tests
print_status "=== Backend Regression Tests ==="

# Install dependencies if needed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install
    cd - > /dev/null
fi

# Run backend test categories
run_test_category "backend_unit" "npm test -- --testPathPattern=test/unit" "$BACKEND_DIR"
run_test_category "backend_integration" "npm test -- --testPathPattern=test/integration" "$BACKEND_DIR"
run_test_category "backend_api" "npm test -- test/ocr.test.js" "$BACKEND_DIR"
run_test_category "backend_lint" "npm run lint" "$BACKEND_DIR"

# Frontend regression tests (if frontend directory exists)
if [ -d "$FRONTEND_DIR" ]; then
    print_status "=== Frontend Regression Tests ==="
    
    # Install dependencies if needed
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd "$FRONTEND_DIR"
        npm install
        cd - > /dev/null
    fi
    
    # Run frontend test categories
    run_test_category "frontend_unit" "npm test -- --coverage --watchAll=false" "$FRONTEND_DIR"
    run_test_category "frontend_lint" "npm run lint" "$FRONTEND_DIR"
    run_test_category "frontend_type_check" "npm run type-check" "$FRONTEND_DIR"
    run_test_category "frontend_build" "npm run build" "$FRONTEND_DIR"
else
    print_warning "Frontend directory not found, skipping frontend tests"
fi

# Advanced test categories (if available)
print_status "=== Advanced Test Categories ==="

# Fuzz tests
if [ -f "$BACKEND_DIR/test/fuzz/input-validation.test.js" ]; then
    run_test_category "fuzz_testing" "npm test -- --testPathPattern=test/fuzz" "$BACKEND_DIR"
else
    print_warning "Fuzz tests not found, skipping"
fi

# Contract tests
if [ -f "$BACKEND_DIR/test/contract/api-compatibility.test.js" ]; then
    run_test_category "contract_testing" "npm test -- --testPathPattern=test/contract" "$BACKEND_DIR"
else
    print_warning "Contract tests not found, skipping"
fi

# Security tests (if available)
if [ -d "$BACKEND_DIR/test/security" ]; then
    run_test_category "security_testing" "npm test -- --testPathPattern=test/security" "$BACKEND_DIR"
fi

# Performance tests (if available)
if [ -d "$BACKEND_DIR/test/performance" ]; then
    run_test_category "performance_testing" "npm test -- --testPathPattern=test/performance" "$BACKEND_DIR"
fi

# Close results JSON
sed -i '$ s/,$//' "$RESULTS_FILE"  # Remove last comma
echo "  }," >> "$RESULTS_FILE"
echo "  \"overall_status\": \"$(if [ "$OVERALL_SUCCESS" = true ]; then echo "passed"; else echo "failed"; fi)\"," >> "$RESULTS_FILE"
echo "  \"completed_at\": \"$(date -Iseconds)\"" >> "$RESULTS_FILE"
echo "}" >> "$RESULTS_FILE"

# Final results
print_status "=== Regression Test Results ==="
if [ "$OVERALL_SUCCESS" = true ]; then
    print_success "All regression tests passed! ✅"
    print_status "No breaking changes detected."
    exit 0
else
    print_error "Some regression tests failed! ❌"
    print_error "Potential breaking changes detected."
    print_status "Check individual test logs in $TEST_RESULTS_DIR for details."
    exit 1
fi