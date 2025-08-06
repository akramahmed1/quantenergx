# Multi-stage build for QuantEnergx Frontend React SPA
# Compatible with Render, Railway, Docker, and other cloud platforms

# Stage 1: Build environment
FROM node:20-alpine AS builder

# Install security updates
RUN apk update && apk upgrade

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code and prepare environment
COPY . .

# Use .env.example as template if .env doesn't exist  
RUN if [ ! -f .env ]; then cp .env.example .env || echo "REACT_APP_API_URL=http://localhost:3001" > .env; fi

# Build the React application with environment validation
RUN npm run build

# Stage 2: Production nginx server
FROM nginx:1.25-alpine AS production

# Install security updates and curl for health checks
RUN apk update && apk upgrade && apk add --no-cache curl

# Remove default nginx configuration and unnecessary files
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create health check endpoint
RUN echo '{"status":"ok","service":"quantenergx-frontend","timestamp":"'$(date -Iseconds)'"}' > /usr/share/nginx/html/health

# Set proper permissions and security
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod 644 /usr/share/nginx/html/health

# Remove unnecessary packages and clean up
RUN rm -rf /var/cache/apk/*

# Add labels for better container management
LABEL maintainer="QuantEnergx Team" \
      version="1.0.0" \
      description="QuantEnergx Frontend React SPA" \
      org.opencontainers.image.source="https://github.com/akramahmed1/quantenergx"

# Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Enhanced health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx with optimized configuration
CMD ["nginx", "-g", "daemon off;"]