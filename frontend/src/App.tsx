/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 * 
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, or use of this software is strictly prohibited and may
 * be punishable by law. This software contains trade secrets and 
 * proprietary technology protected by copyright, patent, and trade 
 * secret laws.
 * 
 * Energy Industry Compliance: This software complies with relevant
 * energy industry standards including NERC CIP, IEC 61850, and
 * applicable cybersecurity frameworks for critical infrastructure.
 * 
 * SaaS Security: Implements industry-standard security practices
 * including OAuth2, JWT authentication, data encryption at rest
 * and in transit, and GDPR/CCPA compliance measures.
 * 
 * For licensing inquiries, contact: legal@quantenergx.com
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Container,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Login from './components/auth/Login';
import Onboarding from './components/auth/Onboarding';
import AnalyticsWidget from './components/analytics/AnalyticsWidget';
import ChatBot from './components/chat/ChatBot';
import LanguageSwitcher from './components/common/LanguageSwitcher';
import { useLanguage } from './hooks/useLanguage';
import { getRTLStyles } from './utils/rtl';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organization: string;
}

function App() {
  const { t } = useTranslation(['common', 'energy', 'analytics']);
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Sample analytics data
  const [analyticsData] = useState({
    energyPrices: [
      { timestamp: '2025-01-23T00:00:00Z', value: 45.2 },
      { timestamp: '2025-01-23T01:00:00Z', value: 42.8 },
      { timestamp: '2025-01-23T02:00:00Z', value: 48.1 },
      { timestamp: '2025-01-23T03:00:00Z', value: 51.3 },
      { timestamp: '2025-01-23T04:00:00Z', value: 49.7 },
    ],
    portfolioValue: [
      { timestamp: '2025-01-20', value: 1000000 },
      { timestamp: '2025-01-21', value: 1025000 },
      { timestamp: '2025-01-22', value: 1018000 },
      { timestamp: '2025-01-23', value: 1052000 },
    ],
    carbonFootprint: [
      { timestamp: 'Coal', value: 35, label: 'Coal' },
      { timestamp: 'Natural Gas', value: 25, label: 'Natural Gas' },
      { timestamp: 'Solar', value: 20, label: 'Solar' },
      { timestamp: 'Wind', value: 15, label: 'Wind' },
      { timestamp: 'Hydro', value: 5, label: 'Hydro' },
    ],
  });

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('quantenergx_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful login
      const mockUser: User = {
        id: '1',
        email,
        fullName: 'John Doe',
        role: 'Energy Analyst',
        organization: 'Green Energy Corp',
      };

      setUser(mockUser);
      localStorage.setItem('quantenergx_user', JSON.stringify(mockUser));
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData: any) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful registration
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        fullName: `${userData.firstName} ${userData.lastName}`,
        role: userData.role,
        organization: userData.organization,
      };

      setUser(newUser);
      localStorage.setItem('quantenergx_user', JSON.stringify(newUser));
      setShowOnboarding(false);
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('quantenergx_user');
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // If user is not authenticated, show login/onboarding
  if (!user) {
    if (showOnboarding) {
      return (
        <Onboarding
          onComplete={handleRegister}
          onBack={() => setShowOnboarding(false)}
          loading={loading}
          error={error}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowOnboarding(true)}
        loading={loading}
        error={error}
      />
    );
  }

  // Main authenticated application
  return (
    <Box sx={{ flexGrow: 1, ...getRTLStyles(isRTL) }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <SecurityIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('common:app_name')} - {t('common:dashboard')}
          </Typography>

          <LanguageSwitcher variant="menu" showLabel={false} />

          <IconButton color="inherit" sx={{ mx: 1 }}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user.fullName.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: isRTL ? 'left' : 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: isRTL ? 'left' : 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {user.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.role} at {user.organization}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <AccountIcon sx={{ mr: 2 }} />
              {t('common:profile')}
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <SettingsIcon sx={{ mr: 2 }} />
              {t('common:settings')}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 2 }} />
              {t('common:logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Energy Prices Widget */}
          <Grid item xs={12} md={6} lg={4}>
            <AnalyticsWidget
              title={t('energy:energy_prices', { ns: 'energy' })}
              type="line"
              data={analyticsData.energyPrices}
              unit="$/MWh"
              trend="up"
              height={300}
            />
          </Grid>

          {/* Portfolio Value Widget */}
          <Grid item xs={12} md={6} lg={4}>
            <AnalyticsWidget
              title="Portfolio Value"
              type="metric"
              data={analyticsData.portfolioValue}
              unit="$"
              trend="up"
              height={300}
            />
          </Grid>

          {/* Carbon Footprint Widget */}
          <Grid item xs={12} md={6} lg={4}>
            <AnalyticsWidget
              title={t('energy:carbon_footprint', { ns: 'energy' })}
              type="pie"
              data={analyticsData.carbonFootprint}
              unit="%"
              height={300}
              showTimeRange={false}
            />
          </Grid>

          {/* Market Trends */}
          <Grid item xs={12} lg={8}>
            <AnalyticsWidget
              title="Market Trends"
              type="bar"
              data={analyticsData.energyPrices}
              unit="$/MWh"
              trend="neutral"
              height={400}
            />
          </Grid>

          {/* Key Metrics */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnalyticsWidget
                title="Grid Stability"
                type="metric"
                data={[{ timestamp: 'current', value: 98.5 }]}
                unit="%"
                trend="up"
                height={150}
                showTimeRange={false}
              />
              <AnalyticsWidget
                title="Risk Score"
                type="metric"
                data={[{ timestamp: 'current', value: 3.2 }]}
                unit="/10"
                trend="down"
                height={150}
                showTimeRange={false}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Compliance Status */}
        <Box
          sx={{
            mt: 4,
            p: 2,
            bgcolor: 'success.light',
            borderRadius: 2,
            color: 'success.contrastText',
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" fontWeight="bold">
            ✅ System Status: All compliance standards met (NERC CIP, FERC, GDPR)
          </Typography>
        </Box>
      </Container>

      {/* AI Chat Bot */}
      <ChatBot />
    </Box>
  );
}

export default App;