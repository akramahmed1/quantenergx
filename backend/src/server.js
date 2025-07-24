const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const winston = require('winston');
const OCRGRPCService = require('./grpc/services/ocrGrpcService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GRPC_PORT = process.env.GRPC_PORT || 50051;

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'quantenergx-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Initialize gRPC service
const grpcService = new OCRGRPCService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for document uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      rest_api: 'online',
      grpc_service: 'online'
    }
  });
});

// API routes
app.use('/api/v1', require('./routes'));

// 404 handler for API routes
app.use('/api/v1/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Catch-all 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start servers only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`QuantEnergx Backend Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Start gRPC service
  grpcService.start(GRPC_PORT);
  logger.info(`QuantEnergx gRPC Service running on port ${GRPC_PORT}`);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  grpcService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  grpcService.stop();
  process.exit(0);
});

module.exports = app;
