/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Link,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import { getRTLStyles } from '../../utils/rtl';
import LanguageSwitcher from '../common/LanguageSwitcher';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
  loading?: boolean;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ 
  onLogin, 
  onSwitchToRegister, 
  loading = false, 
  error 
}) => {
  const { t } = useTranslation(['common', 'energy']);
  const { isRTL } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onLogin(email, password);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #388e3c 100%)',
        p: 2,
        ...getRTLStyles(isRTL),
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SecurityIcon 
              sx={{ 
                fontSize: 48, 
                color: 'primary.main', 
                mb: 1 
              }} 
            />
            <Typography variant="h4" component="h1" fontWeight="bold">
              {t('common:app_name')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('energy:renewable_energy')} Platform
            </Typography>
          </Box>

          {/* Language Switcher */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <LanguageSwitcher variant="menu" showLabel={false} />
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={`${t('common:login')} Email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              margin="normal"
              required
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position={isRTL ? 'end' : 'start'}>
                    <BusinessIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-root': {
                  direction: isRTL ? 'rtl' : 'ltr',
                },
                '& .MuiFormLabel-root': {
                  ...getRTLStyles(isRTL),
                },
              }}
            />

            <TextField
              fullWidth
              label={t('common:password', { ns: 'common' })}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-root': {
                  direction: isRTL ? 'rtl' : 'ltr',
                },
                '& .MuiFormLabel-root': {
                  ...getRTLStyles(isRTL),
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              {loading ? t('common:loading') : t('common:login')}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* OAuth Options */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            sx={{ mb: 2 }}
            startIcon={<SecurityIcon />}
          >
            Continue with SSO
          </Button>

          {/* Register Link */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={onSwitchToRegister}
                sx={{ 
                  textDecoration: 'none',
                  fontWeight: 'medium',
                  color: 'primary.main',
                }}
              >
                {t('common:register')}
              </Link>
            </Typography>
          </Box>

          {/* Compliance Notice */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              NERC CIP & FERC Compliant Platform
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;