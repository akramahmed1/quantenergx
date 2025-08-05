#!/bin/bash

# QuantEnergx Local Development Setup Script
# This script sets up the complete local development environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_DB_NAME=${DB_NAME:-quantenergx}
POSTGRES_USER=${DB_USER:-quantenergx}
POSTGRES_PASSWORD=${DB_PASSWORD:-quantenergx123}
POSTGRES_PORT=${DB_PORT:-5432}
REDIS_PORT=${REDIS_PORT:-6379}
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
GRPC_PORT=${GRPC_PORT:-50051}

# Health check configuration
MAX_RETRIES=30
RETRY_INTERVAL=2

# Cleanup function
cleanup() {
    echo -e "${YELLOW}Cleaning up background processes...${NC}"
    # Kill background processes started by this script
    jobs -p | xargs -r kill 2>/dev/null || true
}

# Set up cleanup trap
trap cleanup EXIT

# Utility functions
print_step() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Wait for service to be ready
wait_for_service() {
    local url="$1"
    local service_name="$2"
    local retries=0
    
    echo "Waiting for $service_name to be ready..."
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        retries=$((retries + 1))
        echo "Attempt $retries/$MAX_RETRIES - $service_name not ready yet..."
        sleep $RETRY_INTERVAL
    done
    
    print_error "$service_name failed to start after $MAX_RETRIES attempts"
    return 1
}

# Check system requirements
check_system_requirements() {
    print_step "Checking System Requirements"
    
    # Check Node.js version
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        REQUIRED_NODE_MAJOR=20
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
        
        if [ "$NODE_MAJOR" -ge "$REQUIRED_NODE_MAJOR" ]; then
            print_success "Node.js $NODE_VERSION (>= v$REQUIRED_NODE_MAJOR required)"
        else
            print_error "Node.js $NODE_VERSION found, but >= v$REQUIRED_NODE_MAJOR required"
            exit 1
        fi
    else
        print_error "Node.js not found. Please install Node.js >= v20"
        exit 1
    fi
    
    # Check npm version
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm $NPM_VERSION"
    else
        print_error "npm not found"
        exit 1
    fi
    
    # Check for Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker $DOCKER_VERSION"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker not found - will skip containerized services"
        DOCKER_AVAILABLE=false
    fi
    
    # Check for Docker Compose
    if [ "$DOCKER_AVAILABLE" = true ]; then
        if docker compose version > /dev/null 2>&1; then
            COMPOSE_VERSION=$(docker compose version --short)
            print_success "Docker Compose $COMPOSE_VERSION"
            COMPOSE_AVAILABLE=true
        elif command_exists docker-compose; then
            COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
            print_success "Docker Compose $COMPOSE_VERSION (v1)"
            COMPOSE_AVAILABLE=true
            COMPOSE_CMD="docker-compose"
        else
            print_warning "Docker Compose not found - will skip containerized services"
            COMPOSE_AVAILABLE=false
        fi
        
        if [ "$COMPOSE_AVAILABLE" = true ] && [ -z "$COMPOSE_CMD" ]; then
            COMPOSE_CMD="docker compose"
        fi
    fi
}

# Start Docker services
start_docker_services() {
    if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
        print_step "Starting Docker Services"
        
        # Check if services are already running
        if $COMPOSE_CMD ps postgres 2>/dev/null | grep -q "Up"; then
            print_success "PostgreSQL already running"
        else
            echo "Starting PostgreSQL and Redis..."
            $COMPOSE_CMD up -d postgres redis
            
            # Wait for PostgreSQL to be ready
            echo "Waiting for PostgreSQL to be ready..."
            local retries=0
            while [ $retries -lt $MAX_RETRIES ]; do
                if docker exec quantenergx-postgres pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
                    print_success "PostgreSQL is ready!"
                    break
                fi
                retries=$((retries + 1))
                echo "Attempt $retries/$MAX_RETRIES - PostgreSQL not ready yet..."
                sleep $RETRY_INTERVAL
            done
            
            if [ $retries -eq $MAX_RETRIES ]; then
                print_error "PostgreSQL failed to start"
                return 1
            fi
        fi
        
        # Check Redis
        if $COMPOSE_CMD ps redis 2>/dev/null | grep -q "Up"; then
            print_success "Redis already running"
        else
            print_error "Redis failed to start"
            return 1
        fi
        
        # Set environment variables for services
        export DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB_NAME"
        export DB_HOST=localhost
        export DB_PORT=$POSTGRES_PORT
        export DB_NAME=$POSTGRES_DB_NAME
        export DB_USER=$POSTGRES_USER
        export DB_PASSWORD=$POSTGRES_PASSWORD
        export REDIS_HOST=localhost
        export REDIS_PORT=$REDIS_PORT
        
        print_success "Docker services started successfully"
    else
        print_warning "Skipping Docker services - not available"
        echo "You'll need to set up PostgreSQL and Redis manually:"
        echo "  - PostgreSQL: localhost:$POSTGRES_PORT, database: $POSTGRES_DB_NAME"
        echo "  - Redis: localhost:$REDIS_PORT"
    fi
}

# Setup environment files
setup_environment_files() {
    print_step "Setting Up Environment Files"
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            print_success "Created backend/.env from template"
            
            # Update database settings if Docker is available
            if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
                sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB_NAME|g" backend/.env
                sed -i "s|DB_HOST=.*|DB_HOST=localhost|g" backend/.env
                sed -i "s|DB_PORT=.*|DB_PORT=$POSTGRES_PORT|g" backend/.env
                sed -i "s|DB_NAME=.*|DB_NAME=$POSTGRES_DB_NAME|g" backend/.env
                sed -i "s|DB_USER=.*|DB_USER=$POSTGRES_USER|g" backend/.env
                sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$POSTGRES_PASSWORD|g" backend/.env
                sed -i "s|REDIS_HOST=.*|REDIS_HOST=localhost|g" backend/.env
                sed -i "s|REDIS_PORT=.*|REDIS_PORT=$REDIS_PORT|g" backend/.env
                print_success "Updated backend/.env with Docker service settings"
            fi
        else
            print_warning "backend/.env.example not found, creating basic .env file"
            cat > backend/.env << EOF
NODE_ENV=development
PORT=$BACKEND_PORT
DATABASE_URL=postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB_NAME
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
EOF
        fi
    else
        print_success "backend/.env already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env" ]; then
        if [ -f "frontend/.env.example" ]; then
            cp frontend/.env.example frontend/.env
            print_success "Created frontend/.env from template"
            
            # Update API URL
            sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=http://localhost:$BACKEND_PORT|g" frontend/.env
            print_success "Updated frontend/.env with backend URL"
        else
            print_warning "frontend/.env.example not found, creating basic .env file"
            cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:$BACKEND_PORT
REACT_APP_ENVIRONMENT=development
EOF
        fi
    else
        print_success "frontend/.env already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing Dependencies"
    
    echo "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
    
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    print_success "Backend dependencies installed"
    
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
    
    # Install e2e dependencies if directory exists
    if [ -d "e2e" ]; then
        echo "Installing E2E dependencies..."
        cd e2e
        npm install
        cd ..
        print_success "E2E dependencies installed"
    fi
}

# Run database migrations and seeders
run_database_setup() {
    if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
        print_step "Setting Up Database"
        
        cd backend
        
        # Check if knexfile exists
        if [ -f "knexfile.js" ] || [ -f "knexfile.ts" ]; then
            echo "Running database migrations..."
            if npm run db:migrate; then
                print_success "Database migrations completed"
            else
                print_warning "Database migrations failed or not configured"
            fi
            
            echo "Running database seeders..."
            if npm run db:seed; then
                print_success "Database seeders completed"
            else
                print_warning "Database seeders failed or not configured"
            fi
        else
            print_warning "No knexfile found - skipping database migrations and seeders"
            print_warning "You may need to set up database schema manually"
        fi
        
        cd ..
    else
        print_warning "Skipping database setup - Docker services not available"
    fi
}

# Lint and fix code
lint_and_fix_code() {
    print_step "Linting and Fixing Code"
    
    echo "Running backend linting and fixes..."
    cd backend
    if npm run lint:fix; then
        print_success "Backend code linted and fixed"
    else
        print_warning "Backend linting issues found (check output above)"
    fi
    cd ..
    
    echo "Running frontend linting and fixes..."
    cd frontend
    if npm run lint:fix; then
        print_success "Frontend code linted and fixed"
    else
        print_warning "Frontend linting issues found (check output above)"
    fi
    cd ..
    
    echo "Running code formatting..."
    if npm run format; then
        print_success "Code formatted successfully"
    else
        print_warning "Code formatting issues found"
    fi
}

# Build applications
build_applications() {
    print_step "Building Applications"
    
    echo "Building backend..."
    cd backend
    if npm run build; then
        print_success "Backend built successfully"
    else
        print_warning "Backend build failed - will try to start with JS files"
    fi
    cd ..
    
    echo "Building frontend..."
    cd frontend
    if npm run build; then
        print_success "Frontend built successfully"
    else
        print_error "Frontend build failed"
        return 1
    fi
    cd ..
}

# Start servers
start_servers() {
    print_step "Starting Development Servers"
    
    # Start backend
    echo "Starting backend server..."
    cd backend
    
    # Try to start with built version first, fallback to dev mode
    if [ -f "dist/server.js" ]; then
        npm start > ../backend.log 2>&1 &
        BACKEND_PID=$!
        print_success "Backend started with built version (PID: $BACKEND_PID)"
    elif [ -f "src/server.js" ]; then
        npm run start:js > ../backend.log 2>&1 &
        BACKEND_PID=$!
        print_success "Backend started with JS files (PID: $BACKEND_PID)"
    else
        npm run dev > ../backend.log 2>&1 &
        BACKEND_PID=$!
        print_success "Backend started in development mode (PID: $BACKEND_PID)"
    fi
    cd ..
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    echo "Starting frontend server..."
    cd frontend
    npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    print_success "Frontend started (PID: $FRONTEND_PID)"
    cd ..
    
    # Store PIDs for cleanup
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid
}

# Health checks
perform_health_checks() {
    print_step "Performing Health Checks"
    
    # Check backend health
    if wait_for_service "http://localhost:$BACKEND_PORT/health" "Backend API"; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed - check backend.log for details"
        echo "Backend log tail:"
        tail -n 10 backend.log 2>/dev/null || echo "No backend log found"
    fi
    
    # Check frontend health
    if wait_for_service "http://localhost:$FRONTEND_PORT" "Frontend Application"; then
        print_success "Frontend health check passed"
    else
        print_warning "Frontend health check failed - check frontend.log for details"
        echo "Frontend log tail:"
        tail -n 10 frontend.log 2>/dev/null || echo "No frontend log found"
    fi
    
    # Check database connection if available
    if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
        if docker exec quantenergx-postgres pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
            print_success "PostgreSQL health check passed"
        else
            print_warning "PostgreSQL health check failed"
        fi
        
        if docker exec quantenergx-redis redis-cli ping > /dev/null 2>&1; then
            print_success "Redis health check passed"
        else
            print_warning "Redis health check failed"
        fi
    fi
}

# Print next steps
print_next_steps() {
    print_step "Setup Complete!"
    
    echo -e "${GREEN}🎉 Your QuantEnergx development environment is ready!${NC}"
    echo ""
    echo "📍 Service URLs:"
    echo "  • Frontend:  http://localhost:$FRONTEND_PORT"
    echo "  • Backend:   http://localhost:$BACKEND_PORT"
    echo "  • API Docs:  http://localhost:$BACKEND_PORT/api-docs"
    
    if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
        echo "  • PostgreSQL: localhost:$POSTGRES_PORT (db: $POSTGRES_DB_NAME)"
        echo "  • Redis:      localhost:$REDIS_PORT"
    fi
    
    echo ""
    echo "📝 Useful Commands:"
    echo "  • View backend logs:  tail -f backend.log"
    echo "  • View frontend logs: tail -f frontend.log"
    echo "  • Stop all services:  $COMPOSE_CMD down (for Docker services)"
    echo "  • Run tests:          npm test"
    echo "  • Lint code:          npm run lint"
    echo ""
    echo "🔧 Development:"
    echo "  • Edit backend code in: ./backend/src/"
    echo "  • Edit frontend code in: ./frontend/src/"
    echo "  • Backend will auto-restart on changes"
    echo "  • Frontend will auto-reload on changes"
    echo ""
    
    if [ -f ".backend.pid" ] || [ -f ".frontend.pid" ]; then
        echo "🛑 To stop servers:"
        echo "  • Kill processes: kill \$(cat .backend.pid .frontend.pid 2>/dev/null)"
        echo "  • Or use Ctrl+C if running in foreground"
        echo ""
    fi
}

# Print troubleshooting information
print_troubleshooting() {
    print_step "Troubleshooting Guide"
    
    echo "🔍 Common Issues and Solutions:"
    echo ""
    echo "1. Port conflicts:"
    echo "   • Backend port $BACKEND_PORT in use: kill \$(lsof -ti:$BACKEND_PORT)"
    echo "   • Frontend port $FRONTEND_PORT in use: kill \$(lsof -ti:$FRONTEND_PORT)"
    echo ""
    echo "2. Docker issues:"
    echo "   • Services won't start: $COMPOSE_CMD down && $COMPOSE_CMD up -d postgres redis"
    echo "   • Permission errors: sudo chown -R \$USER:\$USER ."
    echo ""
    echo "3. Database issues:"
    echo "   • Connection refused: Check if PostgreSQL is running"
    echo "   • Authentication failed: Verify credentials in backend/.env"
    echo "   • Schema issues: Run npm run db:migrate in backend/"
    echo ""
    echo "4. Build failures:"
    echo "   • Clear cache: rm -rf node_modules package-lock.json && npm install"
    echo "   • TypeScript errors: npm run build in respective directory"
    echo ""
    echo "5. Environment issues:"
    echo "   • Missing variables: Check .env files in backend/ and frontend/"
    echo "   • Wrong Node.js version: Use Node.js >= 20"
    echo ""
    echo "📞 Getting Help:"
    echo "   • Check logs: backend.log and frontend.log"
    echo "   • GitHub Issues: https://github.com/akramahmed1/quantenergx/issues"
    echo "   • Documentation: ./README.md"
    echo ""
    echo "🔄 Restart Everything:"
    echo "   • $COMPOSE_CMD down"
    echo "   • ./setup-local.sh"
}

# Main execution
main() {
    echo -e "${BLUE}"
    cat << "EOF"
  ___                 _   _____                       __  __
 / _ \ _   _  __ _ _ _| |_| ____|_ __   ___ _ __ __ _\ \/ /
| | | | | | |/ _` | '_| __|  _| '_ \ / _ \ '__/ _` |\  / 
| |_| | |_| | (_| | | | |_| |___| | | |  __/ | | (_| |/  \ 
 \__\_\\__,_|\__,_|_|  \__|_____|_| |_|\___|_|  \__, /_/\_\
                                               |___/      
EOF
    echo -e "${NC}"
    echo "Local Development Setup Script"
    echo "=============================="
    echo ""
    
    # Execute setup steps
    check_system_requirements
    start_docker_services
    setup_environment_files
    install_dependencies
    run_database_setup
    lint_and_fix_code
    build_applications
    start_servers
    perform_health_checks
    
    # Print results
    print_next_steps
    print_troubleshooting
    
    echo -e "${GREEN}Setup completed successfully!${NC}"
    echo "Press Ctrl+C to stop all services and exit."
    
    # Keep script running to maintain background processes
    while true; do
        sleep 10
        # Check if processes are still running
        if [ -f ".backend.pid" ] && ! kill -0 $(cat .backend.pid) 2>/dev/null; then
            print_warning "Backend process died - check backend.log"
        fi
        if [ -f ".frontend.pid" ] && ! kill -0 $(cat .frontend.pid) 2>/dev/null; then
            print_warning "Frontend process died - check frontend.log"
        fi
    done
}

# Handle script arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "QuantEnergx Local Development Setup Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --no-docker    Skip Docker services setup"
    echo "  --no-build     Skip building applications"
    echo "  --no-lint      Skip linting and formatting"
    echo ""
    echo "Environment Variables:"
    echo "  DB_NAME        PostgreSQL database name (default: quantenergx)"
    echo "  DB_USER        PostgreSQL username (default: quantenergx)"
    echo "  DB_PASSWORD    PostgreSQL password (default: quantenergx123)"
    echo "  DB_PORT        PostgreSQL port (default: 5432)"
    echo "  REDIS_PORT     Redis port (default: 6379)"
    echo "  BACKEND_PORT   Backend server port (default: 3001)"
    echo "  FRONTEND_PORT  Frontend server port (default: 3000)"
    echo ""
    exit 0
fi

# Handle command line options
SKIP_DOCKER=false
SKIP_BUILD=false
SKIP_LINT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-docker)
            SKIP_DOCKER=true
            DOCKER_AVAILABLE=false
            shift
            ;;
        --no-build)
            SKIP_BUILD=true
            shift
            ;;
        --no-lint)
            SKIP_LINT=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"