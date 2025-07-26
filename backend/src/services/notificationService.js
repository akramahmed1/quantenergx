const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

class NotificationService {
  constructor() {
    this.telegramBot = null;
    this.whatsappConfig = {
      apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      token: process.env.WHATSAPP_API_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    };

    this.emailConfig = {
      provider: process.env.EMAIL_PROVIDER || 'sendgrid', // sendgrid, ses, mailgun
      apiKey: process.env.EMAIL_API_KEY,
      fromEmail: process.env.FROM_EMAIL || 'notifications@quantenergx.com',
      fromName: process.env.FROM_NAME || 'QuantEnergx',
    };

    this.smsConfig = {
      provider: process.env.SMS_PROVIDER || 'twilio', // twilio, aws-sns, vonage
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    };

    // Initialize Telegram bot if token is provided
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    }
  }

  async sendNotification(channel, recipient, message, options = {}) {
    try {
      switch (channel) {
        case 'telegram':
          return await this.sendTelegramMessage(recipient, message, options);
        case 'whatsapp':
          return await this.sendWhatsAppMessage(recipient, message, options);
        case 'email':
          return await this.sendEmailNotification(recipient, message, options);
        case 'sms':
          return await this.sendSMSNotification(recipient, message, options);
        default:
          throw new Error(`Unsupported notification channel: ${channel}`);
      }
    } catch (error) {
      console.error(`Notification failed for channel ${channel}:`, error);
      throw error;
    }
  }

  async sendTelegramMessage(chatId, message, options = {}) {
    if (!this.telegramBot) {
      throw new Error('Telegram bot not configured');
    }

    const { keyboard, parseMode = 'Markdown' } = options;

    const telegramOptions = {
      parse_mode: parseMode,
    };

    if (keyboard) {
      telegramOptions.reply_markup = {
        inline_keyboard: keyboard,
      };
    }

    const result = await this.telegramBot.sendMessage(chatId, message, telegramOptions);
    return {
      success: true,
      messageId: result.message_id,
      channel: 'telegram',
    };
  }

  async sendWhatsAppMessage(phoneNumber, message, options = {}) {
    try {
      if (!this.whatsappConfig.token || !this.whatsappConfig.phoneNumberId) {
        console.log(`WhatsApp credentials missing. Would send to ${phoneNumber}: ${message}`);
        return {
          success: true,
          messageId: `wa_${Date.now()}`,
          channel: 'whatsapp',
          recipient: phoneNumber,
          status: 'simulated',
        };
      }

      const { templateName, templateParams } = options;

      let requestBody;

      if (templateName && templateParams) {
        // Use WhatsApp template message
        requestBody = {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: templateParams.map(param => ({
                  type: 'text',
                  text: param,
                })),
              },
            ],
          },
        };
      } else {
        // Use regular text message
        requestBody = {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message },
        };
      }

      const response = await axios.post(
        `${this.whatsappConfig.apiUrl}/${this.whatsappConfig.phoneNumberId}/messages`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.whatsappConfig.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
        channel: 'whatsapp',
        recipient: phoneNumber,
        status: 'sent',
      };
    } catch (error) {
      console.error('WhatsApp message failed:', error.response?.data || error.message);
      return {
        success: false,
        channel: 'whatsapp',
        recipient: phoneNumber,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  async sendEmailNotification(email, message, options = {}) {
    try {
      const { subject = 'QuantEnergx Notification', html, attachments } = options;

      if (!this.emailConfig.apiKey) {
        console.log(`Email credentials missing. Would send to ${email}:`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);
        return {
          success: true,
          messageId: `email_${Date.now()}`,
          channel: 'email',
          recipient: email,
          status: 'simulated',
        };
      }

      let result;

      switch (this.emailConfig.provider) {
        case 'sendgrid':
          result = await this._sendEmailViaSendGrid(email, subject, message, html, attachments);
          break;
        case 'ses':
          result = await this._sendEmailViaSES(email, subject, message, html, attachments);
          break;
        case 'mailgun':
          result = await this._sendEmailViaMailgun(email, subject, message, html, attachments);
          break;
        default:
          throw new Error(`Unsupported email provider: ${this.emailConfig.provider}`);
      }

      return {
        success: true,
        messageId: result.messageId,
        channel: 'email',
        recipient: email,
        status: 'sent',
      };
    } catch (error) {
      console.error('Email sending failed:', error.message);
      return {
        success: false,
        channel: 'email',
        recipient: email,
        error: error.message,
      };
    }
  }

  async _sendEmailViaSendGrid(email, subject, message, html, attachments) {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email }],
            subject,
          },
        ],
        from: {
          email: this.emailConfig.fromEmail,
          name: this.emailConfig.fromName,
        },
        content: [
          { type: 'text/plain', value: message },
          ...(html ? [{ type: 'text/html', value: html }] : []),
        ],
        ...(attachments && { attachments }),
      },
      {
        headers: {
          Authorization: `Bearer ${this.emailConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { messageId: response.headers['x-message-id'] || `sg_${Date.now()}` };
  }

  async _sendEmailViaSES(_email, _subject, _message, _html, _attachments) {
    // For AWS SES, you would use AWS SDK
    // This is a placeholder implementation
    throw new Error('AWS SES integration not yet implemented');
  }

  async _sendEmailViaMailgun(email, subject, message, html, _attachments) {
    // For Mailgun API
    const domain = process.env.MAILGUN_DOMAIN;
    const response = await axios.post(
      `https://api.mailgun.net/v3/${domain}/messages`,
      new URLSearchParams({
        from: `${this.emailConfig.fromName} <${this.emailConfig.fromEmail}>`,
        to: email,
        subject,
        text: message,
        ...(html && { html }),
      }),
      {
        auth: {
          username: 'api',
          password: this.emailConfig.apiKey,
        },
      }
    );

    return { messageId: response.data.id };
  }

  async sendSMSNotification(phoneNumber, message, options = {}) {
    try {
      if (!this.smsConfig.accountSid || !this.smsConfig.authToken) {
        console.log(`SMS credentials missing. Would send to ${phoneNumber}: ${message}`);
        return {
          success: true,
          messageId: `sms_${Date.now()}`,
          channel: 'sms',
          recipient: phoneNumber,
          status: 'simulated',
        };
      }

      let result;

      switch (this.smsConfig.provider) {
        case 'twilio':
          result = await this._sendSMSViaTwilio(phoneNumber, message, options);
          break;
        case 'aws-sns':
          result = await this._sendSMSViaSNS(phoneNumber, message, options);
          break;
        case 'vonage':
          result = await this._sendSMSViaVonage(phoneNumber, message, options);
          break;
        default:
          throw new Error(`Unsupported SMS provider: ${this.smsConfig.provider}`);
      }

      return {
        success: true,
        messageId: result.messageId,
        channel: 'sms',
        recipient: phoneNumber,
        status: 'sent',
      };
    } catch (error) {
      console.error('SMS sending failed:', error.message);
      return {
        success: false,
        channel: 'sms',
        recipient: phoneNumber,
        error: error.message,
      };
    }
  }

  async _sendSMSViaTwilio(phoneNumber, message, _options) {
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${this.smsConfig.accountSid}/Messages.json`,
      new URLSearchParams({
        From: this.smsConfig.fromNumber,
        To: phoneNumber,
        Body: message,
      }),
      {
        auth: {
          username: this.smsConfig.accountSid,
          password: this.smsConfig.authToken,
        },
      }
    );

    return { messageId: response.data.sid };
  }

  async _sendSMSViaSNS(_phoneNumber, _message, _options) {
    // For AWS SNS, you would use AWS SDK
    // This is a placeholder implementation
    throw new Error('AWS SNS integration not yet implemented');
  }

  async _sendSMSViaVonage(phoneNumber, message, _options) {
    // For Vonage (Nexmo) API
    const response = await axios.post('https://rest.nexmo.com/sms/json', {
      from: this.smsConfig.fromNumber,
      to: phoneNumber,
      text: message,
      api_key: process.env.VONAGE_API_KEY,
      api_secret: process.env.VONAGE_API_SECRET,
    });

    return { messageId: response.data.messages[0]['message-id'] };
  }

  // OCR-specific notification methods
  async notifyDocumentProcessed(documentId, result, userPreferences) {
    const message = this.formatOCRCompletionMessage(documentId, result);

    const notifications = [];

    // Send notifications based on user preferences
    for (const channel of userPreferences.channels || ['email']) {
      try {
        const notificationResult = await this.sendNotification(
          channel,
          userPreferences[channel + '_address'],
          message,
          {
            subject: 'Document Processing Complete',
            keyboard: channel === 'telegram' ? this.getOCRTelegramKeyboard(documentId) : null,
          }
        );
        notifications.push(notificationResult);
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }

    return notifications;
  }

  async notifyBatchProcessed(batchId, results, userPreferences) {
    const message = this.formatBatchCompletionMessage(batchId, results);

    const notifications = [];

    for (const channel of userPreferences.channels || ['email']) {
      try {
        const notificationResult = await this.sendNotification(
          channel,
          userPreferences[channel + '_address'],
          message,
          {
            subject: 'Batch Processing Complete',
          }
        );
        notifications.push(notificationResult);
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }

    return notifications;
  }

  async notifyReviewRequired(documentId, confidence, userPreferences) {
    const message = this.formatReviewRequiredMessage(documentId, confidence);

    const notifications = [];

    for (const channel of userPreferences.channels || ['email']) {
      try {
        const notificationResult = await this.sendNotification(
          channel,
          userPreferences[channel + '_address'],
          message,
          {
            subject: 'Document Review Required',
            keyboard: channel === 'telegram' ? this.getReviewTelegramKeyboard(documentId) : null,
          }
        );
        notifications.push(notificationResult);
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }

    return notifications;
  }

  formatOCRCompletionMessage(documentId, result) {
    return `✅ *Document Processing Complete*

📄 Document ID: \`${documentId}\`
🎯 Confidence: ${result.confidence}%
🌐 Language: ${result.detectedLanguage}
⏱️ Processing Time: ${result.processingTime}ms

${result.fields ? '📋 Fields extracted successfully' : ''}
${result.stamps ? '🏷️ Stamps detected' : ''}
${result.signatures ? '✍️ Signatures detected' : ''}

View details in QuantEnergx platform.`;
  }

  formatBatchCompletionMessage(batchId, results) {
    const total = results.total_documents;
    const completed = results.completed;
    const failed = results.failed;

    return `📦 *Batch Processing Complete*

🆔 Batch ID: \`${batchId}\`
📊 Results: ${completed}/${total} successful
${failed > 0 ? `❌ Failed: ${failed}` : '✅ All documents processed successfully'}

View detailed results in QuantEnergx platform.`;
  }

  formatReviewRequiredMessage(documentId, confidence) {
    return `⚠️ *Manual Review Required*

📄 Document ID: \`${documentId}\`
🎯 Confidence: ${confidence}%

This document requires manual review due to low confidence or complex content.

Please review and approve in QuantEnergx platform.`;
  }

  getOCRTelegramKeyboard(documentId) {
    return [
      [
        { text: '👀 View Document', url: `${process.env.FRONTEND_URL}/ocr/review/${documentId}` },
        { text: '📊 Dashboard', url: `${process.env.FRONTEND_URL}/` },
      ],
    ];
  }

  getReviewTelegramKeyboard(documentId) {
    return [
      [{ text: '✅ Review Now', url: `${process.env.FRONTEND_URL}/ocr/review/${documentId}` }],
      [
        { text: '📋 Queue', url: `${process.env.FRONTEND_URL}/ocr/review` },
        { text: '📊 Dashboard', url: `${process.env.FRONTEND_URL}/` },
      ],
    ];
  }

  // Trading-specific notifications
  async notifyTradeExecuted(trade, userPreferences) {
    const message = this.formatTradeExecutedMessage(trade);
    return await this.sendMultiChannelNotification(userPreferences, message, {
      subject: 'Trade Executed',
    });
  }

  async notifyOrderPlaced(order, userPreferences) {
    const message = this.formatOrderPlacedMessage(order);
    return await this.sendMultiChannelNotification(userPreferences, message, {
      subject: 'Order Placed',
    });
  }

  async notifyOrderCancelled(order, userPreferences) {
    const message = this.formatOrderCancelledMessage(order);
    return await this.sendMultiChannelNotification(userPreferences, message, {
      subject: 'Order Cancelled',
    });
  }

  async notifyRiskLimitBreach(riskData, userPreferences) {
    const message = this.formatRiskLimitBreachMessage(riskData);
    return await this.sendMultiChannelNotification(userPreferences, message, {
      subject: 'Risk Limit Breach - Immediate Action Required',
      priority: 'high',
    });
  }

  async notifyMarginCall(marginData, userPreferences) {
    const message = this.formatMarginCallMessage(marginData);
    return await this.sendMultiChannelNotification(userPreferences, message, {
      subject: 'Margin Call - Urgent Action Required',
      priority: 'critical',
    });
  }

  async notifyComplianceAlert(complianceData, userPreferences) {
    const message = this.formatComplianceAlertMessage(complianceData);
    return await this.sendMultiChannelNotification(userPreferences, message, {
      subject: 'Compliance Alert',
      priority: 'high',
    });
  }

  // Multi-channel notification helper
  async sendMultiChannelNotification(userPreferences, message, options = {}) {
    const notifications = [];
    const channels = userPreferences.channels || ['email'];

    for (const channel of channels) {
      try {
        const recipient = this.getRecipientForChannel(channel, userPreferences);
        if (recipient) {
          const result = await this.sendNotification(channel, recipient, message, options);
          notifications.push(result);
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        notifications.push({
          success: false,
          channel,
          error: error.message,
        });
      }
    }

    return notifications;
  }

  getRecipientForChannel(channel, userPreferences) {
    switch (channel) {
      case 'email':
        return userPreferences.email;
      case 'sms':
        return userPreferences.phone;
      case 'telegram':
        return userPreferences.telegramChatId;
      case 'whatsapp':
        return userPreferences.whatsappPhone;
      default:
        return null;
    }
  }

  // Message formatters for trading events
  formatTradeExecutedMessage(trade) {
    return `🎯 *Trade Executed*

💼 Trade ID: \`${trade.id}\`
📊 ${trade.side.toUpperCase()} ${trade.quantity} ${trade.commodity.toUpperCase()}
💰 Price: $${trade.price.toFixed(2)}
💵 Value: $${trade.value.toLocaleString()}
⏰ Time: ${new Date(trade.timestamp).toLocaleString()}

Your trade has been successfully executed.`;
  }

  formatOrderPlacedMessage(order) {
    return `📝 *Order Placed*

🆔 Order ID: \`${order.id}\`
📊 ${order.side.toUpperCase()} ${order.quantity} ${order.commodity.toUpperCase()}
💰 ${order.type === 'market' ? 'Market Order' : `Limit: $${order.price.toFixed(2)}`}
⏰ Placed: ${new Date(order.createdAt).toLocaleString()}

Your order is now active in the market.`;
  }

  formatOrderCancelledMessage(order) {
    return `❌ *Order Cancelled*

🆔 Order ID: \`${order.id}\`
📊 ${order.side.toUpperCase()} ${order.quantity} ${order.commodity.toUpperCase()}
⏰ Cancelled: ${new Date(order.updatedAt).toLocaleString()}

Your order has been successfully cancelled.`;
  }

  formatRiskLimitBreachMessage(riskData) {
    return `🚨 *RISK LIMIT BREACH*

⚠️ Alert Type: ${riskData.alertType}
📈 Current Value: $${riskData.currentValue.toLocaleString()}
📊 Limit: $${riskData.limit.toLocaleString()}
🔴 Breach: ${((riskData.currentValue / riskData.limit - 1) * 100).toFixed(1)}%

🚨 IMMEDIATE ACTION REQUIRED
Review your positions and consider reducing exposure.`;
  }

  formatMarginCallMessage(marginData) {
    return `🔴 *MARGIN CALL - URGENT*

💰 Required Margin: $${marginData.requiredMargin.toLocaleString()}
💵 Available: $${marginData.availableMargin.toLocaleString()}
📉 Shortfall: $${marginData.shortfall.toLocaleString()}
⏰ Deadline: ${marginData.deadline}

🚨 URGENT: Deposit funds or reduce positions immediately to avoid liquidation.`;
  }

  formatComplianceAlertMessage(complianceData) {
    return `⚖️ *Compliance Alert*

🚨 Issue: ${complianceData.issueType}
📋 Regulation: ${complianceData.regulation}
📄 Reference: ${complianceData.reference}
⏰ Detected: ${new Date(complianceData.timestamp).toLocaleString()}

Please review and address this compliance issue immediately.`;
  }

  formatPositionReportMessage(positions) {
    let message = '📊 *Daily Position Report*\n\n';

    positions.forEach(pos => {
      const pnlIcon = pos.unrealizedPnL >= 0 ? '📈' : '📉';
      message += `${pnlIcon} ${pos.commodity.toUpperCase()}: ${pos.quantity > 0 ? 'LONG' : 'SHORT'} ${Math.abs(pos.quantity)}\n`;
      message += `💰 P&L: $${pos.unrealizedPnL.toLocaleString()}\n\n`;
    });

    const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
    message += `📈 Total P&L: $${totalPnL.toLocaleString()}`;

    return message;
  }

  // Scheduled notification methods
  async sendDailyPositionReport(userId, positions, userPreferences) {
    const message = this.formatPositionReportMessage(positions);
    return await this.sendMultiChannelNotification(userPreferences, message, {
      subject: 'Daily Position Report',
    });
  }

  async sendMarketOpeningAlert(marketData, userPreferences) {
    const message = `🔔 *Market Opening*

📊 ${new Date().toLocaleDateString()} Trading Session
🕒 ${new Date().toLocaleTimeString()}

Key Prices:
🛢️ Crude Oil: $${marketData.crude_oil?.toFixed(2) || 'N/A'}
⛽ Natural Gas: $${marketData.natural_gas?.toFixed(2) || 'N/A'}
🔋 RECs: $${marketData.renewable_certificates?.toFixed(2) || 'N/A'}

Ready to trade!`;

    return await this.sendMultiChannelNotification(userPreferences, message, {
      subject: 'Market Opening',
    });
  }

  async notifyTradeProcessed(tradeData, userPreferences) {
    const message = `🔄 *Trade Processed from Document*

💼 Contract: ${tradeData.contractNumber}
📊 Volume: ${tradeData.volume}
💰 Price: $${tradeData.price}
🏢 Counterparty: ${tradeData.counterparty}

Trade has been added to your portfolio.`;

    const notifications = [];

    for (const channel of userPreferences.channels || ['email']) {
      try {
        const notificationResult = await this.sendNotification(
          channel,
          userPreferences[channel + '_address'],
          message,
          { subject: 'Trade Processed from Document' }
        );
        notifications.push(notificationResult);
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }

    return notifications;
  }

  async notifyRiskAlert(riskData, userPreferences) {
    const message = `⚠️ *Risk Alert*

🚨 Alert: ${riskData.alertType}
📈 Current Exposure: ${riskData.exposure}
📊 Limit: ${riskData.limit}
⚡ Action Required: ${riskData.action}

Please review your positions immediately.`;

    const notifications = [];

    for (const channel of userPreferences.channels || ['telegram', 'email']) {
      try {
        const result = await this.sendNotification(
          channel,
          userPreferences[channel] || userPreferences.email,
          message
        );
        notifications.push(result);
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        notifications.push({
          success: false,
          channel,
          error: error.message,
        });
      }
    }

    return notifications;
  }
}

module.exports = NotificationService;
