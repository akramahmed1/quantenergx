import { Server as SocketIOServer, Socket } from 'socket.io';
import { KafkaService } from '../kafka/kafkaService';
import { WebSocketMessage, KafkaMessage } from '../types/index';
import winston from 'winston';

/**
 * WebSocketService - Manages real-time WebSocket connections
 * Integrates with Kafka to provide real-time trading updates to clients
 */
export class WebSocketService {
  private io: SocketIOServer;
  private kafkaService: KafkaService;
  private logger: winston.Logger;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(io: SocketIOServer, kafkaService: KafkaService, logger: winston.Logger) {
    this.io = io;
    this.kafkaService = kafkaService;
    this.logger = logger;
    this.initializeWebSocketHandlers();
    this.subscribeToKafkaTopics();
  }

  /**
   * Initialize WebSocket connection handlers
   */
  private initializeWebSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.logger.info(`Client connected: ${socket.id}`, {
        socketId: socket.id,
        clientIP: socket.handshake.address
      });

      this.connectedClients.set(socket.id, socket);

      // Handle authentication
      socket.on('authenticate', (data: { userId: string; token: string }) => {
        this.handleAuthentication(socket, data);
      });

      // Handle trading room joins
      socket.on('join-trading', (userId: string) => {
        this.handleJoinTrading(socket, userId);
      });

      // Handle market data subscriptions
      socket.on('subscribe-market', (commodities: string[]) => {
        this.handleMarketSubscription(socket, commodities);
      });

      // Handle order tracking subscriptions
      socket.on('subscribe-orders', (userId: string) => {
        this.handleOrderSubscription(socket, userId);
      });

      // Handle compliance alerts subscription
      socket.on('subscribe-compliance', (userId: string) => {
        this.handleComplianceSubscription(socket, userId);
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        this.handleDisconnection(socket, reason);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }

  /**
   * Handle client authentication
   */
  private async handleAuthentication(socket: Socket, data: { userId: string; token: string }): Promise<void> {
    try {
      // TODO: Implement proper JWT token validation
      // For now, we'll accept any non-empty token
      if (!data.token || !data.userId) {
        socket.emit('auth-error', { message: 'Invalid authentication data' });
        return;
      }

      // Store user info in socket
      socket.data = { ...socket.data, userId: data.userId, authenticated: true };
      
      socket.emit('auth-success', { 
        message: 'Authentication successful',
        userId: data.userId 
      });

      this.logger.info(`Client authenticated: ${socket.id}`, {
        socketId: socket.id,
        userId: data.userId
      });

    } catch (error) {
      this.logger.error('Authentication error:', error);
      socket.emit('auth-error', { message: 'Authentication failed' });
    }
  }

  /**
   * Handle client joining trading room
   */
  private handleJoinTrading(socket: Socket, userId: string): void {
    const roomName = `trading-${userId}`;
    socket.join(roomName);
    
    socket.emit('trading-joined', { 
      room: roomName,
      message: `Joined trading room for user ${userId}` 
    });

    this.logger.info(`User ${userId} joined trading room`, {
      socketId: socket.id,
      userId,
      room: roomName
    });
  }

  /**
   * Handle market data subscription
   */
  private handleMarketSubscription(socket: Socket, commodities: string[]): void {
    commodities.forEach(commodity => {
      const roomName = `market-${commodity}`;
      socket.join(roomName);
    });

    socket.emit('market-subscribed', {
      commodities,
      message: `Subscribed to market data for: ${commodities.join(', ')}`
    });

    this.logger.info(`Client subscribed to market data`, {
      socketId: socket.id,
      commodities
    });
  }

  /**
   * Handle order tracking subscription
   */
  private handleOrderSubscription(socket: Socket, userId: string): void {
    const roomName = `orders-${userId}`;
    socket.join(roomName);

    socket.emit('orders-subscribed', {
      userId,
      room: roomName,
      message: `Subscribed to order updates for user ${userId}`
    });

    this.logger.info(`Client subscribed to order updates`, {
      socketId: socket.id,
      userId
    });
  }

  /**
   * Handle compliance alerts subscription
   */
  private handleComplianceSubscription(socket: Socket, userId: string): void {
    const roomName = `compliance-${userId}`;
    socket.join(roomName);

    socket.emit('compliance-subscribed', {
      userId,
      room: roomName,
      message: `Subscribed to compliance alerts for user ${userId}`
    });

    this.logger.info(`Client subscribed to compliance alerts`, {
      socketId: socket.id,
      userId
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(socket: Socket, reason: string): void {
    this.connectedClients.delete(socket.id);
    
    this.logger.info(`Client disconnected: ${socket.id}`, {
      socketId: socket.id,
      reason,
      userId: socket.data?.userId
    });
  }

  /**
   * Subscribe to Kafka topics for real-time updates
   */
  private async subscribeToKafkaTopics(): Promise<void> {
    try {
      // Subscribe to market data updates
      await this.kafkaService.subscribeToTopic(
        'market-data',
        'websocket-market-group',
        this.handleMarketDataMessage.bind(this)
      );

      // Subscribe to trade updates
      await this.kafkaService.subscribeToTopic(
        'trade-updates',
        'websocket-trade-group',
        this.handleTradeUpdateMessage.bind(this)
      );

      // Subscribe to order updates
      await this.kafkaService.subscribeToTopic(
        'order-updates',
        'websocket-order-group',
        this.handleOrderUpdateMessage.bind(this)
      );

      // Subscribe to system alerts
      await this.kafkaService.subscribeToTopic(
        'system-alerts',
        'websocket-alert-group',
        this.handleSystemAlertMessage.bind(this)
      );

      // Subscribe to compliance events
      await this.kafkaService.subscribeToTopic(
        'compliance-events',
        'websocket-compliance-group',
        this.handleComplianceMessage.bind(this)
      );

      this.logger.info('WebSocket service subscribed to all Kafka topics');

    } catch (error) {
      this.logger.error('Failed to subscribe to Kafka topics:', error);
    }
  }

  /**
   * Handle market data messages from Kafka
   */
  private async handleMarketDataMessage(message: KafkaMessage): Promise<void> {
    const marketData = message.value;
    const roomName = `market-${marketData.commodity}`;

    const wsMessage: WebSocketMessage = {
      type: 'MARKET_UPDATE',
      payload: marketData,
      timestamp: message.timestamp
    };

    this.io.to(roomName).emit('market-update', wsMessage);

    this.logger.debug(`Market data broadcasted to room ${roomName}`, {
      commodity: marketData.commodity,
      price: marketData.price
    });
  }

  /**
   * Handle trade update messages from Kafka
   */
  private async handleTradeUpdateMessage(message: KafkaMessage): Promise<void> {
    const tradeData = message.value;
    const roomName = `trading-${tradeData.userId}`;

    const wsMessage: WebSocketMessage = {
      type: 'TRADE_UPDATE',
      payload: tradeData,
      timestamp: message.timestamp,
      userId: tradeData.userId
    };

    this.io.to(roomName).emit('trade-update', wsMessage);

    this.logger.debug(`Trade update sent to user ${tradeData.userId}`, {
      tradeId: tradeData.id,
      status: tradeData.status
    });
  }

  /**
   * Handle order update messages from Kafka
   */
  private async handleOrderUpdateMessage(message: KafkaMessage): Promise<void> {
    const orderData = message.value;
    const roomName = `orders-${orderData.userId}`;

    const wsMessage: WebSocketMessage = {
      type: 'ORDER_UPDATE',
      payload: orderData,
      timestamp: message.timestamp,
      userId: orderData.userId
    };

    this.io.to(roomName).emit('order-update', wsMessage);

    this.logger.debug(`Order update sent to user ${orderData.userId}`, {
      orderId: orderData.id,
      status: orderData.status
    });
  }

  /**
   * Handle system alert messages from Kafka
   */
  private async handleSystemAlertMessage(message: KafkaMessage): Promise<void> {
    const alertData = message.value;

    const wsMessage: WebSocketMessage = {
      type: 'SYSTEM_ALERT',
      payload: alertData,
      timestamp: message.timestamp
    };

    // Broadcast system alerts to all connected clients
    this.io.emit('system-alert', wsMessage);

    this.logger.info(`System alert broadcasted to all clients`, {
      alertType: alertData.alertType,
      severity: alertData.severity
    });
  }

  /**
   * Handle compliance messages from Kafka
   */
  private async handleComplianceMessage(message: KafkaMessage): Promise<void> {
    const complianceData = message.value;
    const roomName = `compliance-${complianceData.userId}`;

    const wsMessage: WebSocketMessage = {
      type: 'SYSTEM_ALERT',
      payload: {
        type: 'COMPLIANCE_ALERT',
        ...complianceData
      },
      timestamp: message.timestamp,
      userId: complianceData.userId
    };

    this.io.to(roomName).emit('compliance-alert', wsMessage);

    this.logger.warn(`Compliance alert sent to user ${complianceData.userId}`, {
      checkType: complianceData.checkType,
      severity: complianceData.severity
    });
  }

  /**
   * Send direct message to specific client
   */
  public sendToClient(socketId: string, event: string, data: any): void {
    const socket = this.connectedClients.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  /**
   * Send message to all clients in a room
   */
  public sendToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  /**
   * Get connection statistics
   */
  public getStats(): object {
    return {
      connectedClients: this.connectedClients.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
      timestamp: new Date()
    };
  }
}