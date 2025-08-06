# Multi-stage build for QuantEnergx Backend
# Compatible with Render, Railway, Docker, and other cloud platforms

# Stage 1: Dependencies and Build
FROM node:20-alpine AS builder

# Install security updates and build tools
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for TypeScript build)
RUN npm ci

# Copy source code and prepare environment
COPY . .

# Use .env.example as template if .env doesn't exist
RUN if [ ! -f .env ]; then cp .env.example .env || echo "NODE_ENV=production\nPORT=3001" > .env; fi

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

# Install security updates and dumb-init
RUN apk update && apk upgrade && apk add --no-cache dumb-init curl

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create required directories with proper permissions
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs logs uploads && \
    chmod 750 logs uploads

# Remove unnecessary files and set secure permissions
RUN rm -rf /app/src /app/test && \
    find /app -name "*.md" -delete && \
    chmod -R 755 /app && \
    chmod -R 700 /app/node_modules

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Add labels for better container management
LABEL maintainer="QuantEnergx Team" \
      version="1.0.0" \
      description="QuantEnergx Backend API Service" \
      org.opencontainers.image.source="https://github.com/akramahmed1/quantenergx"

# Health check with better error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application with environment validation
CMD ["npm", "start"]