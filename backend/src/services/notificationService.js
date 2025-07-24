const TelegramBot = require('node-telegram-bot-api');
//const axios = require('axios');

class NotificationService {
  constructor() {
    this.telegramBot = null;
    this.whatsappConfig = {
      apiUrl: process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/send',
      token: process.env.WHATSAPP_API_TOKEN
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
          return await this.sendWhatsAppMessage(recipient, message);
        case 'email':
          return await this.sendEmailNotification(recipient, message, options);
        case 'sms':
          return await this.sendSMSNotification(recipient, message);
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
        inline_keyboard: keyboard
      };
    }

    const result = await this.telegramBot.sendMessage(chatId, message, telegramOptions);
    return {
      success: true,
      messageId: result.message_id,
      channel: 'telegram'
    };
  }

  async sendWhatsAppMessage(phoneNumber, message) {
    // This is a placeholder for WhatsApp Business API integration
    // In production, you would integrate with services like:
    // - WhatsApp Business API
    // - Twilio WhatsApp API
    // - Facebook Graph API for WhatsApp
    
    console.log(`WhatsApp message would be sent to ${phoneNumber}: ${message}`);
    
    return {
      success: true,
      messageId: `wa_${Date.now()}`,
      channel: 'whatsapp',
      recipient: phoneNumber
    };
  }

  async sendEmailNotification(email, message, options = {}) {
    // Placeholder for email service integration
    // In production, integrate with services like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    
    console.log(`Email would be sent to ${email}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    
    return {
      success: true,
      messageId: `email_${Date.now()}`,
      channel: 'email',
      recipient: email
    };
  }

  async sendSMSNotification(phoneNumber, message) {
    // Placeholder for SMS service integration
    // In production, integrate with services like:
    // - Twilio
    // - AWS SNS
    // - Nexmo/Vonage
    
    console.log(`SMS would be sent to ${phoneNumber}: ${message}`);
    
    return {
      success: true,
      messageId: `sms_${Date.now()}`,
      channel: 'sms',
      recipient: phoneNumber
    };
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
            keyboard: channel === 'telegram' ? this.getOCRTelegramKeyboard(documentId) : null
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
            keyboard: channel === 'telegram' ? this.getReviewTelegramKeyboard(documentId) : null
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
        { text: '📊 Dashboard', url: `${process.env.FRONTEND_URL}/` }
      ]
    ];
  }

  getReviewTelegramKeyboard(documentId) {
    return [
      [
        { text: '✅ Review Now', url: `${process.env.FRONTEND_URL}/ocr/review/${documentId}` }
      ],
      [
        { text: '📋 Queue', url: `${process.env.FRONTEND_URL}/ocr/review` },
        { text: '📊 Dashboard', url: `${process.env.FRONTEND_URL}/` }
      ]
    ];
  }

  // Trading-specific notifications
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
        const notification
