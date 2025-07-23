/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Fab,
  Collapse,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Minimize as MinimizeIcon,
  FlashOn as FlashIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import { getRTLStyles } from '../../utils/rtl';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
}

interface ChatBotProps {
  position?: 'bottom-right' | 'bottom-left';
  initialMessage?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ 
  position = 'bottom-right',
  initialMessage = "Hello! I'm your QuantEnerGx AI assistant. How can I help you with energy analytics today?"
}) => {
  const { t } = useTranslation(['common', 'analytics', 'energy']);
  const { isRTL } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: initialMessage,
      sender: 'bot',
      timestamp: new Date(),
      suggestions: [
        'Show me market prices',
        'Analyze portfolio performance',
        'Energy consumption trends',
        'Risk assessment report'
      ]
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const energyQuickReplies = [
    'Show current energy prices',
    'Portfolio performance summary',
    'Risk analysis',
    'Compliance status',
    'Market trends',
    'Energy forecast',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = generateBotResponse(currentMessage);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: botResponse.suggestions,
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userMessage: string): { text: string; suggestions?: string[] } => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return {
        text: "Current energy prices: Natural Gas: $3.45/MMBtu, Electricity: $67.50/MWh, Wind: $35.20/MWh. The market is showing moderate volatility with a 2.3% increase from yesterday.",
        suggestions: ['Show price trends', 'Compare with last week', 'Set price alerts']
      };
    }
    
    if (lowerMessage.includes('portfolio') || lowerMessage.includes('performance')) {
      return {
        text: "Your portfolio performance: Total Return: +5.2%, Risk Score: 3.4/10, Diversification: Good. Top performer: Renewable Energy Fund (+8.1%). Would you like a detailed breakdown?",
        suggestions: ['Detailed analysis', 'Rebalancing options', 'Risk optimization']
      };
    }
    
    if (lowerMessage.includes('risk')) {
      return {
        text: "Risk Assessment Summary: Portfolio VaR (95%): $45,230, Concentration Risk: Low, Market Risk: Medium. Your current risk profile is within acceptable limits for your role.",
        suggestions: ['Stress test results', 'Risk mitigation', 'Compliance check']
      };
    }
    
    if (lowerMessage.includes('compliance') || lowerMessage.includes('regulation')) {
      return {
        text: "Compliance Status: ✅ NERC CIP Compliant, ✅ FERC Approved, ✅ GDPR Compliant. Last audit: 15 days ago. No outstanding issues. Next review: 75 days.",
        suggestions: ['View audit report', 'Schedule review', 'Export certificates']
      };
    }
    
    if (lowerMessage.includes('forecast') || lowerMessage.includes('prediction')) {
      return {
        text: "24-hour Energy Forecast: Demand expected to increase 12% during peak hours (6-9 PM). Wind generation forecast: 65% capacity. Recommended actions: Consider hedging positions.",
        suggestions: ['Extended forecast', 'Weather impact', 'Trading recommendations']
      };
    }
    
    // Default response
    return {
      text: "I can help you with energy market analysis, portfolio management, risk assessment, compliance monitoring, and forecasting. What specific information are you looking for?",
      suggestions: energyQuickReplies.slice(0, 3)
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentMessage(suggestion);
    handleSendMessage();
  };

  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      bottom: 20,
      zIndex: 1000,
    };

    if (position === 'bottom-left') {
      return { ...base, left: 20 };
    }
    return { ...base, right: 20 };
  };

  return (
    <Box sx={getPositionStyles()}>
      {/* Chat Window */}
      <Collapse in={isOpen && !minimized}>
        <Paper
          elevation={8}
          sx={{
            width: 380,
            height: 500,
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            ...getRTLStyles(isRTL),
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.dark', mr: 1 }}>
                <BotIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  QuantEnerGx AI
                </Typography>
                <Typography variant="caption">
                  Energy Analytics Assistant
                </Typography>
              </Box>
            </Box>
            <Box>
              <IconButton
                size="small"
                sx={{ color: 'white', mr: 1 }}
                onClick={() => setMinimized(true)}
              >
                <MinimizeIcon />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: 'white' }}
                onClick={() => setIsOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              bgcolor: 'grey.50',
            }}
          >
            <List sx={{ p: 1 }}>
              {messages.map((message) => (
                <React.Fragment key={message.id}>
                  <ListItem
                    sx={{
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar
                        sx={{
                          bgcolor: message.sender === 'user' ? 'secondary.main' : 'primary.main',
                          width: 32,
                          height: 32,
                        }}
                      >
                        {message.sender === 'user' ? <PersonIcon /> : <BotIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Paper
                          sx={{
                            p: 1.5,
                            bgcolor: message.sender === 'user' ? 'secondary.light' : 'white',
                            maxWidth: '80%',
                            ml: message.sender === 'user' ? 'auto' : 0,
                            mr: message.sender === 'bot' ? 'auto' : 0,
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body2">
                            {message.text}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {message.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Paper>
                      }
                    />
                  </ListItem>
                  
                  {/* Suggestions */}
                  {message.suggestions && (
                    <ListItem>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 5 }}>
                        {message.suggestions.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={suggestion}
                            size="small"
                            variant="outlined"
                            onClick={() => handleSuggestionClick(suggestion)}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    </ListItem>
                  )}
                </React.Fragment>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <ListItem>
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <BotIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Paper sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, maxWidth: '80%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            AI is thinking...
                          </Typography>
                        </Box>
                      </Paper>
                    }
                  />
                </ListItem>
              )}
            </List>
            <div ref={messagesEndRef} />
          </Box>

          <Divider />

          {/* Input */}
          <Box sx={{ p: 2, bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask about energy data, analysis, or compliance..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                size="small"
                sx={{ mr: 1 }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isTyping}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Collapse>

      {/* Minimized Bar */}
      <Collapse in={isOpen && minimized}>
        <Paper
          elevation={4}
          sx={{
            p: 1,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            borderRadius: 3,
          }}
          onClick={() => setMinimized(false)}
        >
          <Avatar sx={{ bgcolor: 'primary.main', mr: 1, width: 32, height: 32 }}>
            <BotIcon />
          </Avatar>
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            QuantEnerGx AI
          </Typography>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Collapse>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          '&:hover': {
            transform: 'scale(1.1)',
          },
          transition: 'transform 0.2s',
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>
    </Box>
  );
};

export default ChatBot;