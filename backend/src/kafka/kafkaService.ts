import { Kafka, Producer, Consumer, KafkaMessage as KafkaJSMessage } from 'kafkajs';
import { KafkaMessage } from '../types/index';
import winston from 'winston';

/**
 * KafkaService - Handles real-time messaging for trading platform
 * Provides pub/sub capabilities for market data, trade updates, and system alerts
 */
export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;

    // Initialize Kafka client
    this.kafka = new Kafka({
      clientId: 'quantenergx-backend',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      connectionTimeout: 3000,
      requestTimeout: 25000,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  /**
   * Initialize Kafka producer and consumers
   */
  async initialize(): Promise<void> {
    try {
      // Initialize producer
      this.producer = this.kafka.producer({
        transactionTimeout: 30000,
        idempotent: true,
        maxInFlightRequests: 1,
      });

      await this.producer.connect();
      this.logger.info('Kafka producer connected successfully');

      // Create topics if they don't exist
      await this.createTopics();
    } catch (error) {
      this.logger.error('Failed to initialize Kafka service:', error);
      throw error;
    }
  }

  /**
   * Create necessary Kafka topics
   */
  private async createTopics(): Promise<void> {
    const admin = this.kafka.admin();
    await admin.connect();

    const topics = [
      {
        topic: 'market-data',
        numPartitions: 3,
        replicationFactor: 1,
        configEntries: [
          { name: 'cleanup.policy', value: 'compact' },
          { name: 'retention.ms', value: '604800000' }, // 7 days
        ],
      },
      {
        topic: 'trade-updates',
        numPartitions: 5,
        replicationFactor: 1,
        configEntries: [
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'retention.ms', value: '2592000000' }, // 30 days
        ],
      },
      {
        topic: 'order-updates',
        numPartitions: 5,
        replicationFactor: 1,
      },
      {
        topic: 'system-alerts',
        numPartitions: 2,
        replicationFactor: 1,
      },
      {
        topic: 'compliance-events',
        numPartitions: 3,
        replicationFactor: 1,
      },
      {
        topic: 'webhook-events',
        numPartitions: 2,
        replicationFactor: 1,
      },
    ];

    try {
      await admin.createTopics({
        topics,
        waitForLeaders: true,
      });
      this.logger.info('Kafka topics created successfully');
    } catch (error) {
      // Topics might already exist, log but don't throw
      this.logger.warn('Error creating topics (may already exist):', error);
    } finally {
      await admin.disconnect();
    }
  }

  /**
   * Publish message to Kafka topic
   */
  async publishMessage(topic: string, message: KafkaMessage): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.key || null,
            value: JSON.stringify(message.value),
            timestamp: message.timestamp.getTime().toString(),
            headers: {
              source: 'quantenergx-backend',
              messageType: message.value.type || 'unknown',
            },
          },
        ],
      });

      this.logger.debug(`Message published to topic ${topic}`, {
        topic,
        messageType: message.value.type,
        timestamp: message.timestamp,
      });
    } catch (error) {
      this.logger.error(`Failed to publish message to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to Kafka topic with message handler
   */
  async subscribeToTopic(
    topic: string,
    groupId: string,
    messageHandler: (message: KafkaMessage) => Promise<void>
  ): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    try {
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) return;

            const kafkaMessage: KafkaMessage = {
              topic,
              partition,
              offset: message.offset,
              key: message.key?.toString(),
              value: JSON.parse(message.value.toString()),
              timestamp: new Date(parseInt(message.timestamp)),
            };

            await messageHandler(kafkaMessage);
          } catch (error) {
            this.logger.error(`Error processing message from topic ${topic}:`, error);
          }
        },
      });

      this.consumers.set(`${topic}-${groupId}`, consumer);
      this.logger.info(`Subscribed to topic ${topic} with group ${groupId}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Publish market data update
   */
  async publishMarketData(marketData: any): Promise<void> {
    const message: KafkaMessage = {
      topic: 'market-data',
      partition: 0,
      offset: '',
      key: marketData.commodity,
      value: {
        type: 'MARKET_UPDATE',
        ...marketData,
      },
      timestamp: new Date(),
    };

    await this.publishMessage('market-data', message);
  }

  /**
   * Publish trade update
   */
  async publishTradeUpdate(trade: any): Promise<void> {
    const message: KafkaMessage = {
      topic: 'trade-updates',
      partition: 0,
      offset: '',
      key: trade.id,
      value: {
        type: 'TRADE_UPDATE',
        ...trade,
      },
      timestamp: new Date(),
    };

    await this.publishMessage('trade-updates', message);
  }

  /**
   * Publish order update
   */
  async publishOrderUpdate(order: any): Promise<void> {
    const message: KafkaMessage = {
      topic: 'order-updates',
      partition: 0,
      offset: '',
      key: order.id,
      value: {
        type: 'ORDER_UPDATE',
        ...order,
      },
      timestamp: new Date(),
    };

    await this.publishMessage('order-updates', message);
  }

  /**
   * Publish system alert
   */
  async publishSystemAlert(alert: any): Promise<void> {
    const message: KafkaMessage = {
      topic: 'system-alerts',
      partition: 0,
      offset: '',
      value: {
        type: 'SYSTEM_ALERT',
        ...alert,
      },
      timestamp: new Date(),
    };

    await this.publishMessage('system-alerts', message);
  }

  /**
   * Gracefully shutdown Kafka connections
   */
  async shutdown(): Promise<void> {
    try {
      // Disconnect all consumers
      for (const [key, consumer] of this.consumers) {
        await consumer.disconnect();
        this.logger.info(`Consumer ${key} disconnected`);
      }

      // Disconnect producer
      if (this.producer) {
        await this.producer.disconnect();
        this.logger.info('Kafka producer disconnected');
      }

      this.logger.info('Kafka service shutdown complete');
    } catch (error) {
      this.logger.error('Error during Kafka shutdown:', error);
    }
  }
}

// Singleton instance
let kafkaServiceInstance: KafkaService | null = null;

export const getKafkaService = (logger: winston.Logger): KafkaService => {
  if (!kafkaServiceInstance) {
    kafkaServiceInstance = new KafkaService(logger);
  }
  return kafkaServiceInstance;
};
