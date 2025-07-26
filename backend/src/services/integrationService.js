const TradingService = require('./tradingService');
const UserManagementService = require('./userManagementService');
const NotificationService = require('./notificationService');
const RiskManagementService = require('./riskManagementService');

class IntegrationService {
  constructor() {
    // Initialize services
    this.tradingService = new TradingService();
    this.userService = new UserManagementService();
    this.notificationService = new NotificationService();
    this.riskService = new RiskManagementService();

    // User preferences storage (in production, this would be database)
    this.userPreferences = new Map();

    // Set up event listeners
    this.setupEventListeners();

    // Initialize default user preferences
    this.initializeDefaultPreferences();
  }

  setupEventListeners() {
    // Trading events
    this.tradingService.on('orderPlaced', this.handleOrderPlaced.bind(this));
    this.tradingService.on('tradeExecuted', this.handleTradeExecuted.bind(this));
    this.tradingService.on('orderCancelled', this.handleOrderCancelled.bind(this));
    this.tradingService.on('orderModified', this.handleOrderModified.bind(this));

    console.log('Integration service event listeners set up successfully');
  }

  initializeDefaultPreferences() {
    // Set up default notification preferences for demo users
    const defaultPreferences = {
      channels: ['email'],
      email: 'demo@quantenergx.com',
      phone: '+1234567890',
      telegramChatId: null,
      whatsappPhone: null,
      preferences: {
        tradeNotifications: true,
        riskAlerts: true,
        marginCalls: true,
        complianceAlerts: true,
        dailyReports: true,
        marketOpening: false,
      },
    };

    // Set for demo users
    ['trader1', 'risk1', 'admin'].forEach(username => {
      this.userPreferences.set(username, { ...defaultPreferences });
    });
  }

  // Event handlers
  async handleOrderPlaced(order) {
    try {
      const userPrefs = this.getUserPreferences(order.userId);

      if (userPrefs?.preferences?.tradeNotifications) {
        await this.notificationService.notifyOrderPlaced(order, userPrefs);
      }

      // Log for audit
      await this.userService.logAuditEvent({
        userId: order.userId,
        action: 'order_placed',
        details: {
          orderId: order.id,
          commodity: order.commodity,
          side: order.side,
          quantity: order.quantity,
          type: order.type,
        },
      });

      console.log(`Order placed notification sent for order ${order.id}`);
    } catch (error) {
      console.error('Error handling order placed event:', error);
    }
  }

  async handleTradeExecuted(trade) {
    try {
      // Get order details
      const aggressorOrder = this.tradingService.getOrder(trade.aggressorOrderId);
      if (!aggressorOrder) return;

      const userPrefs = this.getUserPreferences(aggressorOrder.userId);

      // Send trade notification
      if (userPrefs?.preferences?.tradeNotifications) {
        await this.notificationService.notifyTradeExecuted(trade, userPrefs);
      }

      // Check for risk limit breaches after trade
      await this.checkRiskLimitsAfterTrade(aggressorOrder.userId, trade);

      // Log trade execution
      await this.userService.logAuditEvent({
        userId: aggressorOrder.userId,
        action: 'trade_executed',
        details: {
          tradeId: trade.id,
          orderId: trade.aggressorOrderId,
          commodity: trade.commodity,
          quantity: trade.quantity,
          price: trade.price,
          value: trade.value,
        },
      });

      console.log(`Trade executed notification sent for trade ${trade.id}`);
    } catch (error) {
      console.error('Error handling trade executed event:', error);
    }
  }

  async handleOrderCancelled(order) {
    try {
      const userPrefs = this.getUserPreferences(order.userId);

      if (userPrefs?.preferences?.tradeNotifications) {
        await this.notificationService.notifyOrderCancelled(order, userPrefs);
      }

      // Log cancellation
      await this.userService.logAuditEvent({
        userId: order.userId,
        action: 'order_cancelled',
        details: {
          orderId: order.id,
          commodity: order.commodity,
          side: order.side,
          remainingQuantity: order.remainingQuantity,
        },
      });

      console.log(`Order cancelled notification sent for order ${order.id}`);
    } catch (error) {
      console.error('Error handling order cancelled event:', error);
    }
  }

  async handleOrderModified(data) {
    try {
      const { oldOrder, newOrder } = data;

      // Log modification
      await this.userService.logAuditEvent({
        userId: newOrder.userId,
        action: 'order_modified',
        details: {
          orderId: newOrder.id,
          oldQuantity: oldOrder.quantity,
          newQuantity: newOrder.quantity,
          oldPrice: oldOrder.price,
          newPrice: newOrder.price,
        },
      });

      console.log(`Order modified for order ${newOrder.id}`);
    } catch (error) {
      console.error('Error handling order modified event:', error);
    }
  }

  // Risk monitoring
  async checkRiskLimitsAfterTrade(userId, trade) {
    try {
      // Get user positions
      const positions = this.tradingService.getUserPositions(userId);

      // Mock portfolio data for risk assessment
      const portfolioData = {
        portfolioId: `portfolio_${userId}`,
        positions: positions.map(pos => ({
          id: pos.userId + '_' + pos.commodity,
          commodity: pos.commodity,
          quantity: pos.quantity,
          currentPrice: 80.0, // Mock current price
          value: pos.quantity * 80.0,
        })),
        trades: [trade],
        counterparties: {},
        marketData: {},
        systems: {},
      };

      // Assess risk
      const riskAssessment = await this.riskService.assessPortfolioRisk(portfolioData);

      // Check for limit breaches
      if (riskAssessment.alerts && riskAssessment.alerts.length > 0) {
        const userPrefs = this.getUserPreferences(userId);

        for (const alert of riskAssessment.alerts) {
          if (alert.severity === 'high' || alert.severity === 'critical') {
            const riskData = {
              alertType: alert.type,
              currentValue: alert.currentValue || 0,
              limit: alert.limit || 0,
              message: alert.message,
              severity: alert.severity,
              timestamp: new Date().toISOString(),
            };

            if (alert.type === 'margin_call') {
              await this.notificationService.notifyMarginCall(riskData, userPrefs);
            } else {
              await this.notificationService.notifyRiskLimitBreach(riskData, userPrefs);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking risk limits:', error);
    }
  }

  // User preference management
  getUserPreferences(userId) {
    // Try to get by userId first, then by username
    let preferences = this.userPreferences.get(userId);

    if (!preferences) {
      // Try to find by username (for demo users)
      const user = this.userService.getUserById(userId);
      if (user) {
        preferences = this.userPreferences.get(user.username);
      }
    }

    return preferences;
  }

  async updateUserPreferences(userId, preferences) {
    try {
      const existingPrefs = this.getUserPreferences(userId) || {};
      const updatedPrefs = {
        ...existingPrefs,
        ...preferences,
        updatedAt: new Date().toISOString(),
      };

      this.userPreferences.set(userId, updatedPrefs);

      // Log preference update
      await this.userService.logAuditEvent({
        userId,
        action: 'preferences_updated',
        details: { updatedFields: Object.keys(preferences) },
      });

      return updatedPrefs;
    } catch (error) {
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }
  }

  // Scheduled operations
  async sendDailyReports() {
    try {
      const users = this.userService.getAllUsers();

      for (const user of users) {
        const userPrefs = this.getUserPreferences(user.id);

        if (userPrefs?.preferences?.dailyReports) {
          const positions = this.tradingService.getUserPositions(user.id);

          if (positions.length > 0) {
            await this.notificationService.sendDailyPositionReport(user.id, positions, userPrefs);
          }
        }
      }

      console.log('Daily reports sent successfully');
    } catch (error) {
      console.error('Error sending daily reports:', error);
    }
  }

  async sendMarketOpeningAlerts() {
    try {
      // Mock market data
      const marketData = {
        crude_oil: 80.25,
        natural_gas: 3.35,
        renewable_certificates: 45.5,
      };

      const users = this.userService.getAllUsers();

      for (const user of users) {
        const userPrefs = this.getUserPreferences(user.id);

        if (userPrefs?.preferences?.marketOpening) {
          await this.notificationService.sendMarketOpeningAlert(marketData, userPrefs);
        }
      }

      console.log('Market opening alerts sent successfully');
    } catch (error) {
      console.error('Error sending market opening alerts:', error);
    }
  }

  // Compliance integration
  async performComplianceCheck(userId, transactionData) {
    try {
      // This would integrate with the compliance service
      const complianceResult = {
        compliant: true,
        warnings: [],
        violations: [],
      };

      if (!complianceResult.compliant || complianceResult.violations.length > 0) {
        const userPrefs = this.getUserPreferences(userId);

        const complianceData = {
          issueType: 'compliance_violation',
          regulation: 'CFTC',
          reference: transactionData.id || 'N/A',
          timestamp: new Date().toISOString(),
          details: complianceResult.violations,
        };

        await this.notificationService.notifyComplianceAlert(complianceData, userPrefs);
      }

      return complianceResult;
    } catch (error) {
      console.error('Error performing compliance check:', error);
      throw error;
    }
  }

  // Integration endpoints for external systems
  async processExternalTrade(tradeData) {
    try {
      // Convert external trade format to internal format
      const orderRequest = {
        userId: tradeData.userId,
        commodity: tradeData.commodity,
        side: tradeData.side,
        type: 'market',
        quantity: tradeData.quantity,
        timeInForce: 'day',
      };

      // Place order through trading service
      const order = await this.tradingService.placeOrder(orderRequest);

      // Log external trade processing
      await this.userService.logAuditEvent({
        userId: tradeData.userId,
        action: 'external_trade_processed',
        details: {
          externalTradeId: tradeData.externalId,
          orderId: order.id,
          source: tradeData.source || 'external',
        },
      });

      return order;
    } catch (error) {
      console.error('Error processing external trade:', error);
      throw error;
    }
  }

  // Health check and monitoring
  async getSystemHealth() {
    try {
      const health = {
        timestamp: new Date().toISOString(),
        services: {
          trading: this.tradingService ? 'healthy' : 'unavailable',
          users: this.userService ? 'healthy' : 'unavailable',
          notifications: this.notificationService ? 'healthy' : 'unavailable',
          risk: this.riskService ? 'healthy' : 'unavailable',
        },
        statistics: {
          totalOrders: this.tradingService.orders.size,
          totalTrades: this.tradingService.trades.size,
          activeUsers: this.userService.users.size,
          userPreferences: this.userPreferences.size,
        },
        eventListeners: {
          tradingEvents: 4, // orderPlaced, tradeExecuted, orderCancelled, orderModified
        },
      };

      return health;
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message,
      };
    }
  }

  // Manual trigger methods for testing
  async triggerTestNotification(userId, type, data) {
    try {
      const userPrefs = this.getUserPreferences(userId);
      if (!userPrefs) {
        throw new Error('User preferences not found');
      }

      switch (type) {
        case 'trade_executed':
          await this.notificationService.notifyTradeExecuted(data, userPrefs);
          break;
        case 'risk_alert':
          await this.notificationService.notifyRiskLimitBreach(data, userPrefs);
          break;
        case 'margin_call':
          await this.notificationService.notifyMarginCall(data, userPrefs);
          break;
        case 'compliance_alert':
          await this.notificationService.notifyComplianceAlert(data, userPrefs);
          break;
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      return { success: true, message: `${type} notification sent successfully` };
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }
}

module.exports = IntegrationService;
