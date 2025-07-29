import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { APIResponse } from './types/index';
import { KafkaService, getKafkaService } from './kafka/kafkaService';
import { WebSocketService } from './websocket/websocketService';
import { WebhookManager } from './webhooks/webhookManager';
import { PluginManager } from './plugins/pluginManager';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 3001;
const GRPC_PORT = process.env.GRPC_PORT || 50051;

// Create HTTP server for WebSocket support
const server = createServer(app);

// Initialize Socket.IO for real-time communication
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

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
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Initialize services
let kafkaService: KafkaService;
let websocketService: WebSocketService;
let webhookManager: WebhookManager;
let pluginManager: PluginManager;
let grpcService: any;

// Initialize all services
async function initializeServices(): Promise<void> {
  try {
    // Initialize Kafka service
    if (process.env.NODE_ENV !== 'test') {
      kafkaService = getKafkaService(logger);
      await kafkaService.initialize();
      logger.info('Kafka service initialized');
    }

    // Initialize WebSocket service
    websocketService = new WebSocketService(io, kafkaService, logger);
    logger.info('WebSocket service initialized');

    // Initialize Webhook manager
    webhookManager = new WebhookManager(logger);
    logger.info('Webhook manager initialized');

    // Initialize Plugin manager
    pluginManager = new PluginManager(logger);
    await pluginManager.initialize();
    logger.info('Plugin manager initialized');

    // Initialize gRPC service (keeping existing functionality)
    try {
      const OCRGRPCService = require('./grpc/services/ocrGrpcService');
      grpcService = new OCRGRPCService();
      logger.info('gRPC service initialized');
    } catch (error) {
      logger.warn('gRPC service not available, continuing without it');
    }

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    // Don't throw error to allow server to start without Kafka in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

// HTTPS/TLS enforcement middleware
app.use((req: Request, res: Response, next: NextFunction): void => {
  // In production, enforce HTTPS
  if (process.env.NODE_ENV === 'production') {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
      return;
    }
  }
  next();
});

// Enhanced security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['\'self\''],
        styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
        fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
        imgSrc: ['\'self\'', 'data:', 'https:'],
        scriptSrc: ['\'self\''],
        connectSrc: ['\'self\''],
        frameSrc: ['\'none\''],
        objectSrc: ['\'none\''],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response): void => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    });
  },
});

// Speed limiting for sustained traffic
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per windowMs without delay
  delayMs: (hits: number): number => hits * 100, // Add 100ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Authentication rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response): void => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes',
    });
  },
});

// Apply rate limiting
app.use(globalLimiter);
app.use(speedLimiter);

// Apply auth rate limiting to authentication endpoints
app.use('/api/v1/users/auth', authLimiter);
app.use(cors());

// JSON parsing with error handling
app.use(
  express.json({
    limit: '50mb',
    type: 'application/json',
  })
);

// Handle JSON parsing errors
app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }
  next(err);
});

app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response): void => {
  const healthResponse: APIResponse = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        rest_api: 'online',
        grpc_service: grpcService ? 'online' : 'offline',
        websocket: 'online',
        kafka: kafkaService ? 'online' : 'offline',
        plugins: pluginManager ? 'online' : 'offline',
        webhooks: webhookManager ? 'online' : 'offline',
      },
    },
    timestamp: new Date(),
  };
  res.status(200).json(healthResponse);
});

// WebSocket stats endpoint
app.get('/api/v1/websocket/stats', (req: Request, res: Response): void => {
  if (websocketService) {
    res.json({
      success: true,
      data: websocketService.getStats(),
      timestamp: new Date()
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'WebSocket service not available',
      timestamp: new Date()
    });
  }
});

// Plugin management endpoints
app.get('/api/v1/plugins', (req: Request, res: Response): void => {
  if (pluginManager) {
    res.json({
      success: true,
      data: pluginManager.listPlugins(),
      timestamp: new Date()
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'Plugin manager not available',
      timestamp: new Date()
    });
  }
});

app.post('/api/v1/plugins/:name/execute', async (req: Request, res: Response): Promise<void> => {
  if (!pluginManager) {
    res.status(503).json({
      success: false,
      error: 'Plugin manager not available',
      timestamp: new Date()
    });
    return;
  }

  try {
    const { name } = req.params;
    const input = req.body;
    
    const result = await pluginManager.executePlugin(name, input);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Plugin execution error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Plugin execution failed',
      timestamp: new Date()
    });
  }
});

// Webhook endpoints
app.post('/api/v1/webhooks/:type', webhookManager?.validateWebhook(), async (req: Request, res: Response): Promise<void> => {
  if (!webhookManager) {
    res.status(503).json({
      success: false,
      error: 'Webhook manager not available',
      timestamp: new Date()
    });
    return;
  }

  try {
    const { type } = req.params;
    const signature = req.body.signature;
    const payload = {
      id: req.body.id || `webhook-${Date.now()}`,
      type,
      source: req.body.source || 'unknown',
      data: req.body,
      timestamp: new Date(),
      signature
    };

    const result = await webhookManager.processWebhook(type, payload, signature);
    
    res.json({
      ...result,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Webhook processing error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed',
      timestamp: new Date()
    });
  }
});

// Get registered webhook types
app.get('/api/v1/webhooks', (req: Request, res: Response): void => {
  if (webhookManager) {
    res.json({
      success: true,
      data: {
        registeredTypes: webhookManager.getRegisteredTypes()
      },
      timestamp: new Date()
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'Webhook manager not available',
      timestamp: new Date()
    });
  }
});

// API routes
app.use('/api/v1', require('./routes'));

// 404 handler for API routes
app.use('/api/v1/*', (req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Catch-all 404 handler
app.use('*', (req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown handler
async function gracefulShutdown(): Promise<void> {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    if (pluginManager) {
      await pluginManager.shutdown();
    }
    
    if (kafkaService) {
      await kafkaService.shutdown();
    }
    
    if (grpcService) {
      grpcService.stop();
    }
    
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Start servers only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  initializeServices().then(() => {
    server.listen(PORT, () => {
      logger.info(`QuantEnergx Backend Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('Real-time trading infrastructure enabled:');
      logger.info('  ✓ WebSocket server for real-time communication');
      logger.info('  ✓ Kafka integration for message streaming');
      logger.info('  ✓ Webhook support for third-party integrations');
      logger.info('  ✓ Modular plugin architecture');
    });

    // Start gRPC service if available
    if (grpcService) {
      grpcService.start(GRPC_PORT);
      logger.info(`QuantEnergx gRPC Service running on port ${GRPC_PORT}`);
    }

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  }).catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

// Export both app and io for testing and external use
export { app, io, logger, kafkaService, websocketService, webhookManager, pluginManager };
export default app;