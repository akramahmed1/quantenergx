# Multi-stage build for QuantEnergx Backend
# Compatible with Render, Railway, Docker, and other cloud platforms

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Development dependencies (for build if needed)
FROM node:20-alpine AS dev-dependencies

WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 3: Production build
FROM node:20-alpine AS production

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Create uploads directory
RUN mkdir -p uploads && chown nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]