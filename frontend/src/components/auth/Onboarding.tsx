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
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import { getRTLStyles } from '../../utils/rtl';
import LanguageSwitcher from '../common/LanguageSwitcher';

interface OnboardingProps {
  onComplete: (userData: any) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string;
}

interface UserData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Organization Information
  organization: string;
  role: string;
  department: string;
  energyCertifications: string[];
  
  // Preferences
  language: string;
  timezone: string;
  notifications: boolean;
  
  // Compliance
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptCompliance: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ 
  onComplete, 
  onBack, 
  loading = false, 
  error 
}) => {
  const { t } = useTranslation(['common', 'energy', 'compliance']);
  const { isRTL, currentLanguage } = useLanguage();
  
  const [activeStep, setActiveStep] = useState(0);
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    role: 'analyst',
    department: '',
    energyCertifications: [],
    language: currentLanguage,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: true,
    acceptTerms: false,
    acceptPrivacy: false,
    acceptCompliance: false,
  });

  const steps = [
    {
      label: 'Personal Info',
      icon: <PersonIcon />,
    },
    {
      label: 'Organization',
      icon: <BusinessIcon />,
    },
    {
      label: 'Preferences',
      icon: <SecurityIcon />,
    },
    {
      label: 'Compliance',
      icon: <CheckIcon />,
    },
  ];

  const energyRoles = [
    { value: 'analyst', label: 'Energy Analyst' },
    { value: 'trader', label: 'Energy Trader' },
    { value: 'operator', label: 'System Operator' },
    { value: 'engineer', label: 'Energy Engineer' },
    { value: 'manager', label: 'Energy Manager' },
    { value: 'compliance', label: 'Compliance Officer' },
  ];

  const certifications = [
    'CEM (Certified Energy Manager)',
    'NERC Certified',
    'FERC Licensed',
    'ISO 50001 Lead Auditor',
    'Professional Engineer (PE)',
    'Energy Risk Professional (ERP)',
  ];

  const handleNext = () => {
    if (validateStep()) {
      if (activeStep === steps.length - 1) {
        onComplete(userData);
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onBack();
    } else {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  const validateStep = (): boolean => {
    switch (activeStep) {
      case 0: // Personal Info
        return !!(userData.firstName && userData.lastName && userData.email && 
                 userData.password && userData.password === userData.confirmPassword);
      case 1: // Organization
        return !!(userData.organization && userData.role);
      case 2: // Preferences (always valid)
        return true;
      case 3: // Compliance
        return userData.acceptTerms && userData.acceptPrivacy && userData.acceptCompliance;
      default:
        return false;
    }
  };

  const updateUserData = (field: keyof UserData, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ ...getRTLStyles(isRTL) }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <TextField
                label="First Name"
                value={userData.firstName}
                onChange={(e) => updateUserData('firstName', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={userData.lastName}
                onChange={(e) => updateUserData('lastName', e.target.value)}
                required
                fullWidth
              />
            </Box>
            <TextField
              label="Email Address"
              type="email"
              value={userData.email}
              onChange={(e) => updateUserData('email', e.target.value)}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Password"
              type="password"
              value={userData.password}
              onChange={(e) => updateUserData('password', e.target.value)}
              required
              fullWidth
              margin="normal"
              helperText="Minimum 8 characters, include special characters"
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={userData.confirmPassword}
              onChange={(e) => updateUserData('confirmPassword', e.target.value)}
              required
              fullWidth
              margin="normal"
              error={userData.password !== userData.confirmPassword}
              helperText={userData.password !== userData.confirmPassword ? 'Passwords do not match' : ''}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ ...getRTLStyles(isRTL) }}>
            <Typography variant="h6" gutterBottom>
              Organization Information
            </Typography>
            <TextField
              label="Organization Name"
              value={userData.organization}
              onChange={(e) => updateUserData('organization', e.target.value)}
              required
              fullWidth
              margin="normal"
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Role</InputLabel>
              <Select
                value={userData.role}
                onChange={(e) => updateUserData('role', e.target.value)}
                label="Role"
              >
                {energyRoles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Department"
              value={userData.department}
              onChange={(e) => updateUserData('department', e.target.value)}
              fullWidth
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Energy Certifications</InputLabel>
              <Select
                multiple
                value={userData.energyCertifications}
                onChange={(e) => updateUserData('energyCertifications', e.target.value)}
                label="Energy Certifications"
              >
                {certifications.map((cert) => (
                  <MenuItem key={cert} value={cert}>
                    {cert}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ ...getRTLStyles(isRTL) }}>
            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>
            <LanguageSwitcher showLabel={true} />
            <TextField
              label="Timezone"
              value={userData.timezone}
              onChange={(e) => updateUserData('timezone', e.target.value)}
              fullWidth
              margin="normal"
              helperText="Detected from your browser"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={userData.notifications}
                  onChange={(e) => updateUserData('notifications', e.target.checked)}
                />
              }
              label="Enable email notifications for alerts and updates"
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ ...getRTLStyles(isRTL) }}>
            <Typography variant="h6" gutterBottom>
              Compliance Agreements
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              As an energy industry platform, we must comply with NERC CIP, FERC, and other regulatory requirements.
            </Alert>
            <FormControlLabel
              control={
                <Checkbox
                  checked={userData.acceptTerms}
                  onChange={(e) => updateUserData('acceptTerms', e.target.checked)}
                  required
                />
              }
              label="I accept the Terms of Service and User Agreement"
              sx={{ mb: 2, display: 'block' }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={userData.acceptPrivacy}
                  onChange={(e) => updateUserData('acceptPrivacy', e.target.checked)}
                  required
                />
              }
              label="I accept the Privacy Policy and GDPR compliance terms"
              sx={{ mb: 2, display: 'block' }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={userData.acceptCompliance}
                  onChange={(e) => updateUserData('acceptCompliance', e.target.checked)}
                  required
                />
              }
              label="I acknowledge compliance with NERC CIP and FERC regulations"
              sx={{ mb: 2, display: 'block' }}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #388e3c 100%)',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...getRTLStyles(isRTL),
      }}
    >
      <Card sx={{ maxWidth: 600, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
            Welcome to {t('common:app_name')}
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel icon={step.icon}>
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ minHeight: 400 }}>
            {renderStepContent()}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button onClick={handleBack}>
              {activeStep === 0 ? 'Back to Login' : 'Back'}
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!validateStep() || loading}
            >
              {activeStep === steps.length - 1 ? 'Complete Registration' : 'Next'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Onboarding;