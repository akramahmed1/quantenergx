// Force disable Kafka for local development/testing
process.env.KAFKA_ENABLED = 'false';

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger/config.js';
import * as yaml from 'yamljs';
import * as fs from 'fs';
import * as path from 'path';
import { APIResponse } from './types/index';
import { KafkaService, getKafkaService } from './kafka/kafkaService';
import { WebSocketService } from './websocket/websocketService';
import { WebhookManager } from './webhooks/webhookManager';
import { PluginManager } from './plugins/pluginManager';
import { SecurityMiddleware } from './middleware/security';

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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
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
let kafkaService: KafkaService | undefined;
let websocketService: WebSocketService;
let webhookManager: WebhookManager;
let pluginManager: PluginManager;
let grpcService: any;

// Initialize security middleware with enhanced configuration
const securityMiddleware = new SecurityMiddleware({
  enforceHttps: process.env.NODE_ENV === 'production',
  hstsMaxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true,
});

// Initialize all services
async function initializeServices(): Promise<void> {
  try {
    // Initialize Kafka service (skip if disabled for local development)
    if (process.env.NODE_ENV !== 'test' && process.env.KAFKA_ENABLED !== 'false') {
      try {
        kafkaService = getKafkaService(logger);
        await kafkaService.initialize();
        logger.info('Kafka service initialized');
      } catch (error) {
        logger.warn('Failed to initialize Kafka service, continuing without it', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      logger.info('Kafka service disabled for this environment');
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

// Apply enhanced security middleware
app.use(...securityMiddleware.getMiddleware());

// Enhanced security headers - using our custom security middleware instead of helmet
// helmet is still used for additional non-conflicting security features
app.use(
  helmet({
    // Disable conflicting headers that our security middleware handles better
    contentSecurityPolicy: false,
    hsts: false,
    frameguard: false,
    // Keep other helmet features
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    dnsPrefetchControl: true,
    ieNoOpen: true,
    noSniff: false, // Handled by our middleware
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: false, // Handled by our middleware
    xssFilter: false, // Handled by our middleware
  })
);

// Configure Swagger UI
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .info .title { color: #1f2937; font-size: 36px; }
    .swagger-ui .scheme-container { background: #f8fafc; border: 1px solid #e2e8f0; }
  `,
  customSiteTitle: 'QuantEnergx API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
};

// Load OpenAPI spec from YAML
let openApiSpec: any;
try {
  const yamlPath = path.join(__dirname, 'swagger', 'openapi.yaml');
  if (fs.existsSync(yamlPath)) {
    openApiSpec = yaml.load(yamlPath);
    logger.info('Loaded OpenAPI spec from YAML file');
  } else {
    openApiSpec = swaggerSpec;
    logger.warn('YAML file not found, using JS config');
  }
} catch (error) {
  logger.warn('Failed to load OpenAPI spec from YAML, using JS config:', error);
  openApiSpec = swaggerSpec;
}

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve as any);
app.get('/api-docs', (req: Request, res: Response, next: NextFunction) => {
  const swaggerHandler = swaggerUi.setup(openApiSpec, swaggerUiOptions);
  (swaggerHandler as any)(req, res, next);
});

// Serve OpenAPI spec as JSON
app.get('/api-docs.json', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openApiSpec);
});

// Serve OpenAPI spec as YAML
app.get('/api-docs.yaml', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(yaml.stringify(openApiSpec, 2));
});

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
});

// Apply rate limiting
app.use(globalLimiter as any);
app.use(speedLimiter as any);

// Apply auth rate limiting to authentication endpoints
app.use('/api/v1/users/auth', authLimiter as any);
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
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as any).status === 400 &&
    'body' in err
  ) {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }
  next(err);
});

app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - System
 *     summary: Health check
 *     description: Check system health and service status
 *     security: []
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     services:
 *                       type: object
 *                       properties:
 *                         rest_api:
 *                           type: string
 *                           example: online
 *                         grpc_service:
 *                           type: string
 *                           example: online
 *                         websocket:
 *                           type: string
 *                           example: online
 *                         kafka:
 *                           type: string
 *                           example: online
 *                         plugins:
 *                           type: string
 *                           example: online
 *                         webhooks:
 *                           type: string
 *                           example: online
 */
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

/**
 * @swagger
 * /api/v1/websocket/stats:
 *   get:
 *     tags:
 *       - WebSocket
 *     summary: Get WebSocket statistics
 *     description: Get WebSocket connection statistics
 *     responses:
 *       200:
 *         description: WebSocket stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         connectedClients:
 *                           type: integer
 *                         rooms:
 *                           type: array
 *                           items:
 *                             type: string
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
// WebSocket stats endpoint
app.get('/api/v1/websocket/stats', (req: Request, res: Response): void => {
  if (websocketService) {
    res.json({
      success: true,
      data: websocketService.getStats(),
      timestamp: new Date(),
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'WebSocket service not available',
      timestamp: new Date(),
    });
  }
});

/**
 * @swagger
 * /api/v1/plugins:
 *   get:
 *     tags:
 *       - Plugins
 *     summary: List plugins
 *     description: Get all available plugins and their status
 *     responses:
 *       200:
 *         description: Plugins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Plugin'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
// Plugin management endpoints
app.get('/api/v1/plugins', (req: Request, res: Response): void => {
  if (pluginManager) {
    res.json({
      success: true,
      data: pluginManager.listPlugins(),
      timestamp: new Date(),
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'Plugin manager not available',
      timestamp: new Date(),
    });
  }
});

/**
 * @swagger
 * /api/v1/plugins/{name}/execute:
 *   post:
 *     tags:
 *       - Plugins
 *     summary: Execute plugin
 *     description: Execute a specific plugin with input data
 *     parameters:
 *       - name: name
 *         in: path
 *         required: true
 *         description: Plugin name
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: object
 *                 description: Plugin-specific input data
 *             required:
 *               - input
 *     responses:
 *       200:
 *         description: Plugin executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         result:
 *                           type: object
 *                         executionTime:
 *                           type: number
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
app.post('/api/v1/plugins/:name/execute', async (req: Request, res: Response): Promise<void> => {
  if (!pluginManager) {
    res.status(503).json({
      success: false,
      error: 'Plugin manager not available',
      timestamp: new Date(),
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
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error(`Plugin execution error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Plugin execution failed',
      timestamp: new Date(),
    });
  }
});

/**
 * @swagger
 * /api/v1/webhooks/{type}:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Process webhook
 *     description: Process incoming webhook from external service
 *     parameters:
 *       - name: type
 *         in: path
 *         required: true
 *         description: Webhook type
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               source:
 *                 type: string
 *               data:
 *                 type: object
 *               signature:
 *                 type: string
 *             required:
 *               - id
 *               - data
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         processed:
 *                           type: boolean
 *                         webhookId:
 *                           type: string
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
// Webhook endpoints
app.post('/api/v1/webhooks/:type', async (req: Request, res: Response): Promise<void> => {
  if (!webhookManager) {
    res.status(503).json({
      success: false,
      error: 'Webhook manager not available',
      timestamp: new Date(),
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
      signature,
    };

    const result = await webhookManager.processWebhook(type, payload, signature);

    res.json({
      ...result,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error(`Webhook processing error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed',
      timestamp: new Date(),
    });
  }
});

/**
 * @swagger
 * /api/v1/webhooks:
 *   get:
 *     tags:
 *       - Webhooks
 *     summary: List webhook types
 *     description: Get all registered webhook types
 *     responses:
 *       200:
 *         description: Webhook types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         registeredTypes:
 *                           type: array
 *                           items:
 *                             type: string
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
// Get registered webhook types
app.get('/api/v1/webhooks', (req: Request, res: Response): void => {
  if (webhookManager) {
    res.json({
      success: true,
      data: {
        registeredTypes: webhookManager.getRegisteredTypes(),
      },
      timestamp: new Date(),
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'Webhook manager not available',
      timestamp: new Date(),
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
  initializeServices()
    .then(() => {
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
    })
    .catch(error => {
      logger.error('Failed to start server:', error);
      process.exit(1);
    });
}

// Export both app and io for testing and external use
export { app, io, logger, kafkaService, websocketService, webhookManager, pluginManager };
export default app;
