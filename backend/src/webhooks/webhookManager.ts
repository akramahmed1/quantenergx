import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { WebhookPayload } from '../types/index';
import winston from 'winston';

/**
 * WebhookManager - Handles webhook integrations for third-party services,
 * hardware systems, and AI platforms
 */
export class WebhookManager {
  private logger: winston.Logger;
  private webhookHandlers: Map<string, WebhookHandler> = new Map();
  private secretKey: string;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.secretKey = process.env.WEBHOOK_SECRET_KEY || 'default-secret-key';
    this.initializeDefaultHandlers();
  }

  /**
   * Initialize default webhook handlers
   */
  private initializeDefaultHandlers(): void {
    // Third-party service handlers
    this.registerHandler('market_data_provider', new MarketDataWebhookHandler(this.logger));
    this.registerHandler('compliance_service', new ComplianceWebhookHandler(this.logger));
    this.registerHandler('payment_processor', new PaymentWebhookHandler(this.logger));

    // Hardware integration handlers
    this.registerHandler('scada_system', new SCADAWebhookHandler(this.logger));
    this.registerHandler('iot_sensor', new IoTSensorWebhookHandler(this.logger));
    this.registerHandler('smart_meter', new SmartMeterWebhookHandler(this.logger));

    // AI/ML platform handlers
    this.registerHandler('ml_prediction_service', new MLPredictionWebhookHandler(this.logger));
    this.registerHandler('fraud_detection_ai', new FraudDetectionWebhookHandler(this.logger));
    this.registerHandler('risk_analysis_ai', new RiskAnalysisWebhookHandler(this.logger));

    this.logger.info('Webhook handlers initialized');
  }

  /**
   * Register a new webhook handler
   */
  public registerHandler(type: string, handler: WebhookHandler): void {
    this.webhookHandlers.set(type, handler);
    this.logger.info(`Webhook handler registered: ${type}`);
  }

  /**
   * Verify webhook signature
   */
  public verifySignature(payload: string, signature: string, secret?: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret || this.secretKey)
        .update(payload)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      this.logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process incoming webhook
   */
  public async processWebhook(
    type: string,
    payload: WebhookPayload,
    signature?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Verify signature if provided
      if (signature) {
        const isValidSignature = this.verifySignature(JSON.stringify(payload.data), signature);

        if (!isValidSignature) {
          this.logger.warn(`Invalid webhook signature for type: ${type}`);
          return { success: false, message: 'Invalid signature' };
        }
      }

      const handler = this.webhookHandlers.get(type);
      if (!handler) {
        this.logger.warn(`No handler found for webhook type: ${type}`);
        return { success: false, message: 'Handler not found' };
      }

      const result = await handler.handle(payload);

      this.logger.info(`Webhook processed successfully: ${type}`, {
        webhookId: payload.id,
        type,
        source: payload.source,
      });

      return {
        success: true,
        message: 'Webhook processed successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error processing webhook ${type}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Processing failed',
      };
    }
  }

  /**
   * Express middleware for webhook validation
   */
  public validateWebhook() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { type } = req.params;
      const signature = req.headers['x-webhook-signature'] as string;

      if (!type) {
        res.status(400).json({ error: 'Webhook type is required' });
        return;
      }

      if (!this.webhookHandlers.has(type)) {
        res.status(404).json({ error: 'Webhook handler not found' });
        return;
      }

      // Store raw body for signature verification
      req.body.rawBody = JSON.stringify(req.body);
      req.body.signature = signature;

      next();
    };
  }

  /**
   * Get all registered webhook types
   */
  public getRegisteredTypes(): string[] {
    return Array.from(this.webhookHandlers.keys());
  }
}

/**
 * Base webhook handler interface
 */
export abstract class WebhookHandler {
  protected logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  abstract handle(payload: WebhookPayload): Promise<any>;
}

/**
 * Market Data Provider Webhook Handler
 */
class MarketDataWebhookHandler extends WebhookHandler {
  async handle(payload: WebhookPayload): Promise<any> {
    const { data } = payload;

    this.logger.info('Processing market data webhook', {
      source: payload.source,
      timestamp: payload.timestamp,
    });

    // Process market data update
    // This could trigger Kafka events for real-time updates
    return {
      processed: true,
      timestamp: new Date(),
      marketDataPoints: Array.isArray(data.prices) ? data.prices.length : 1,
    };
  }
}

/**
 * Compliance Service Webhook Handler
 */
class ComplianceWebhookHandler extends WebhookHandler {
  async handle(payload: WebhookPayload): Promise<any> {
    const { data } = payload;

    this.logger.info('Processing compliance webhook', {
      alertType: data.alertType,
      severity: data.severity,
    });

    // Process compliance alert or update
    return {
      processed: true,
      alertId: data.alertId || payload.id,
      action: data.action || 'logged',
    };
  }
}

/**
 * Payment Processor Webhook Handler
 */
class PaymentWebhookHandler extends WebhookHandler {
  async handle(payload: WebhookPayload): Promise<any> {
    const { data } = payload;

    this.logger.info('Processing payment webhook', {
      paymentId: data.paymentId,
      status: data.status,
    });

    // Process payment status update
    return {
      processed: true,
      paymentId: data.paymentId,
      newStatus: data.status,
    };
  }
}

/**
 * SCADA System Webhook Handler
 */
class SCADAWebhookHandler extends WebhookHandler {
  async handle(payload: WebhookPayload): Promise<any> {
    const { data } = payload;

    this.logger.info('Processing SCADA system webhook', {
      systemId: data.systemId,
      alertLevel: data.alertLevel,
    });

    // Process SCADA system data or alerts
    return {
      processed: true,
      systemId: data.systemId,
      dataPoints: data.measurements?.length || 0,
    };
  }
}

/**
 * IoT Sensor Webhook Handler
 */
class IoTSensorWebhookHandler extends WebhookHandler {
  async handle(payload: WebhookPayload): Promise<any> {
    const { data } = payload;

    this.logger.info('Processing IoT sensor webhook', {
      sensorId: data.sensorId,
      sensorType: data.type,
    });

    // Process IoT sensor data
    return {
      processed: true,
      sensorId: data.sensorId,
      reading: data.value,
    };
  }
}

/**
 * Smart Meter Webhook Handler
 */
class SmartMeterWebhookHandler extends WebhookHandler {
  async handle(payload: WebhookPayload): Promise<any> {
    const { data } = payload;

    this.logger.info('Processing smart meter webhook', {
      meterId: data.meterId,
      usage: data.usage,
    });

    // Process smart meter data
    return {
      processed: true,
      meterId: data.meterId,
      consumption: data.usage,
    };
  }
}

/**
 * ML Prediction Service Webhook Handler
 */
class MLPredictionWebhookHandler extends WebhookHandler {
  async handle(payload: WebhookPayload): Promise<any> {
    const { data } = payload;

    this.logger.info('Processing ML prediction webhook', {
      modelId: data.modelId,
      predictionType: data.type,
    });

    // Process ML prediction results
    return {
      processed: true,
      modelId: data.modelId,
      predictions: Array.isArray(data.predictions) ? data.predictions.length : 1,
    };
  }
}

/**
 * Fraud Detection AI Webhook Handler
 */
class FraudDetectionWebhookHandler extends WebhookHandler {
  async handle(payload: WebhookPayload): Promise<any> {
    const { data } = payload;

    this.logger.warn('Processing fraud detection webhook', {
      transactionId: data.transactionId,
      riskScore: data.riskScore,
    });

    // Process fraud detection alert
    return {
      processed: true,
      transactionId: data.transactionId,
      action: data.riskScore > 0.8 ? 'flagged' : 'approved',
    };
  }
}

/**
 * Risk Analysis AI Webhook Handler
 */
class RiskAnalysisWebhookHandler extends WebhookHandler {
  async handle(payload: WebhookPayload): Promise<any> {
    const { data } = payload;

    this.logger.info('Processing risk analysis webhook', {
      analysisId: data.analysisId,
      riskLevel: data.riskLevel,
    });

    // Process risk analysis results
    return {
      processed: true,
      analysisId: data.analysisId,
      riskLevel: data.riskLevel,
    };
  }
}
