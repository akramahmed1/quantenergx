# Local Development Setup Guide

This guide helps you quickly set up your local development environment for QuantEnergx.

## Quick Start

```bash
# Make the script executable (if needed)
chmod +x setup-local.sh

# Run the setup script
./setup-local.sh
```

The setup script will:
- ✅ Check system requirements (Node.js 20+, npm, Docker)
- ✅ Start PostgreSQL and Redis with Docker Compose
- ✅ Create environment files from templates
- ✅ Install all dependencies (root, backend, frontend, e2e)
- ✅ Run database migrations and seeders (if configured)
- ✅ Lint and auto-fix code issues
- ✅ Build backend and frontend applications
- ✅ Start both servers in development mode
- ✅ Perform health checks on all services
- ✅ Provide troubleshooting guidance

## Prerequisites

### Required
- **Node.js** >= 20.0.0
- **npm** >= 8.0.0

### Optional (for full functionality)
- **Docker** - for PostgreSQL and Redis
- **Docker Compose** V2 - for service orchestration

## Command Line Options

```bash
./setup-local.sh [options]

Options:
  -h, --help     Show help message
  --no-docker    Skip Docker services (use existing DB/Redis)
  --no-build     Skip building applications
  --no-lint      Skip linting and formatting
```

## Environment Variables

You can customize the setup by setting these environment variables:

```bash
# Database Configuration
export DB_NAME=quantenergx        # PostgreSQL database name
export DB_USER=quantenergx        # PostgreSQL username
export DB_PASSWORD=quantenergx123 # PostgreSQL password
export DB_PORT=5432               # PostgreSQL port

# Service Ports
export REDIS_PORT=6379            # Redis port
export BACKEND_PORT=3001          # Backend server port
export FRONTEND_PORT=3000         # Frontend server port
export GRPC_PORT=50051            # gRPC server port

# Run with custom configuration
./setup-local.sh
```

## Service URLs (After Setup)

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React application |
| Backend API | http://localhost:3001 | Express.js REST API |
| API Documentation | http://localhost:3001/api-docs | Swagger/OpenAPI docs |
| PostgreSQL | localhost:5432 | Database (via Docker) |
| Redis | localhost:6379 | Cache (via Docker) |

## Manual Setup (Without Docker)

If you prefer not to use Docker or don't have it installed:

1. **Install PostgreSQL and Redis locally**
2. **Create databases:**
   ```sql
   CREATE DATABASE quantenergx;
   CREATE USER quantenergx WITH PASSWORD 'quantenergx123';
   GRANT ALL PRIVILEGES ON DATABASE quantenergx TO quantenergx;
   ```
3. **Run setup without Docker:**
   ```bash
   ./setup-local.sh --no-docker
   ```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Kill processes using the ports
kill $(lsof -ti:3000)  # Frontend
kill $(lsof -ti:3001)  # Backend
kill $(lsof -ti:5432)  # PostgreSQL
kill $(lsof -ti:6379)  # Redis
```

#### Docker Issues
```bash
# Restart Docker services
docker compose down
docker compose up -d postgres redis

# Check service logs
docker compose logs postgres
docker compose logs redis
```

#### Build Failures
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear specific workspace
cd backend && rm -rf node_modules package-lock.json && npm install
cd frontend && rm -rf node_modules package-lock.json && npm install
```

#### Database Issues
```bash
# Check database connection
docker exec quantenergx-postgres pg_isready -U quantenergx

# Connect to database
docker exec -it quantenergx-postgres psql -U quantenergx -d quantenergx

# Reset database
docker compose down -v  # WARNING: This deletes all data
docker compose up -d postgres redis
```

### Environment File Issues

If environment files are missing or incorrect:

```bash
# Regenerate environment files
rm backend/.env frontend/.env
./setup-local.sh --no-build --no-lint
```

### Log Files

The setup script creates log files to help debug issues:

- `backend.log` - Backend server logs
- `frontend.log` - Frontend server logs

```bash
# Monitor logs in real-time
tail -f backend.log
tail -f frontend.log
```

## Development Workflow

### Starting Development
```bash
# Full setup (run once or when dependencies change)
./setup-local.sh

# Or start just the servers (if already set up)
npm run start  # Starts both backend and frontend
```

### Making Changes
- **Backend**: Edit files in `./backend/src/` - server auto-restarts
- **Frontend**: Edit files in `./frontend/src/` - browser auto-reloads
- **Database**: Migrations in `./backend/migrations/`

### Running Tests
```bash
npm test                    # All tests
npm run test:coverage      # With coverage
npm run test:security      # Security tests
npm run test:performance   # Performance tests
```

### Code Quality
```bash
npm run lint              # Check code quality
npm run lint:fix          # Auto-fix issues
npm run format            # Format code
```

## Advanced Configuration

### Custom Database Setup

Create a `backend/knexfile.js` for database migrations:

```javascript
module.exports = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  }
};
```

### Custom Environment Variables

Add additional variables to `backend/.env.example` and `frontend/.env.example` - they will be automatically copied during setup.

### Health Check Endpoints

The setup script expects these health check endpoints:

- Backend: `GET /health` - returns status 200 when healthy
- Frontend: `GET /` - returns status 200 when healthy

## Getting Help

- **Logs**: Check `backend.log` and `frontend.log`
- **Issues**: [GitHub Issues](https://github.com/akramahmed1/quantenergx/issues)
- **Documentation**: Project README files
- **Community**: Project discussions

## Reset Everything

To completely reset your development environment:

```bash
# Stop all services
docker compose down -v
kill $(cat .backend.pid .frontend.pid 2>/dev/null)

# Clean all build artifacts
rm -rf node_modules backend/node_modules frontend/node_modules
rm -rf backend/dist frontend/build
rm -f package-lock.json backend/package-lock.json frontend/package-lock.json
rm -f backend/.env frontend/.env *.log *.pid

# Start fresh
./setup-local.sh
```