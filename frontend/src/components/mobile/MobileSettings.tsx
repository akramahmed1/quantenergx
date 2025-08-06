import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Button,
} from '@mui/material';
import { useTranslation } from '../../i18n/I18nProvider';
import { getRegionalConfig, isMarketOpen, RegionalConfig } from '../../i18n/regionalConfig';
import BiometricAuth from './BiometricAuth';
import OfflineTrading from './OfflineTrading';
import PushNotifications from './PushNotifications';

interface MobileSettingsProps {
  onRegionChange?: (region: string) => void;
  onLanguageChange?: (language: string) => void;
}

export const MobileSettings: React.FC<MobileSettingsProps> = ({
  onRegionChange,
  onLanguageChange,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [selectedRegion, setSelectedRegion] = useState('US');
  const [regionalConfig, setRegionalConfig] = useState<RegionalConfig>(getRegionalConfig('US'));
  const [marketStatus, setMarketStatus] = useState(false);
  const [rtlMode, setRtlMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Load saved settings
    const savedRegion = localStorage.getItem('quantenergx_region') || 'US';
    const savedRtl = localStorage.getItem('quantenergx_rtl') === 'true';

    setSelectedRegion(savedRegion);
    setRtlMode(savedRtl);
    updateRegionalConfig(savedRegion);

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Update market status every minute
    const interval = setInterval(() => {
      setMarketStatus(isMarketOpen(selectedRegion));
    }, 60000);

    setMarketStatus(isMarketOpen(selectedRegion));

    return () => clearInterval(interval);
  }, [selectedRegion]);

  useEffect(() => {
    // Apply RTL mode when Arabic is selected
    if (language === 'ar') {
      setRtlMode(true);
      document.dir = 'rtl';
    } else {
      setRtlMode(false);
      document.dir = 'ltr';
    }
  }, [language]);

  const updateRegionalConfig = (region: string) => {
    const config = getRegionalConfig(region);
    setRegionalConfig(config);
    setMarketStatus(isMarketOpen(region));
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    localStorage.setItem('quantenergx_region', region);
    updateRegionalConfig(region);

    if (onRegionChange) {
      onRegionChange(region);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as any);

    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const handleRtlToggle = (enabled: boolean) => {
    setRtlMode(enabled);
    localStorage.setItem('quantenergx_rtl', enabled.toString());
    document.dir = enabled ? 'rtl' : 'ltr';
  };

  const handleBiometricSuccess = () => {
    console.log('Biometric authentication successful');
  };

  const handleBiometricFailure = (error: string) => {
    console.error('Biometric authentication failed:', error);
  };

  const handleSyncOrders = async (orders: any[]) => {
    // Simulate API call to sync orders
    console.log('Syncing orders:', orders);
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const getMarketStatusColor = () => {
    return marketStatus ? 'success' : 'error';
  };

  const getMarketStatusText = () => {
    return marketStatus ? 'Open' : 'Closed';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('mobile.mobileSettings')}
      </Typography>

      <Grid container spacing={3}>
        {/* Language and Region Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('regional.tradingHours')} & {t('common.language')}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={language}
                      onChange={e => handleLanguageChange(e.target.value)}
                      label="Language"
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="fr">Français</MenuItem>
                      <MenuItem value="ar">العربية</MenuItem>
                      <MenuItem value="pt">Português</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Region</InputLabel>
                    <Select
                      value={selectedRegion}
                      onChange={e => handleRegionChange(e.target.value)}
                      label="Region"
                    >
                      <MenuItem value="US">United States</MenuItem>
                      <MenuItem value="UK">United Kingdom</MenuItem>
                      <MenuItem value="EU">European Union</MenuItem>
                      <MenuItem value="GY">Guyana</MenuItem>
                      <MenuItem value="ME">Middle East</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <FormControlLabel
                control={
                  <Switch checked={rtlMode} onChange={e => handleRtlToggle(e.target.checked)} />
                }
                label="Right-to-Left Mode (RTL)"
                sx={{ mt: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                {t('regional.tradingHours')}
              </Typography>

              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Typography variant="body2">
                  {regionalConfig.tradingHours.start} - {regionalConfig.tradingHours.end} (
                  {regionalConfig.tradingHours.timezone})
                </Typography>
                <Button variant="outlined" size="small" color={getMarketStatusColor()}>
                  {getMarketStatusText()}
                </Button>
              </Box>

              <Typography variant="body2" color="textSecondary">
                Currency: {regionalConfig.currency} | Tax Rate:{' '}
                {(regionalConfig.taxRate * 100).toFixed(1)}% | Customs:{' '}
                {(regionalConfig.customsDuty * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Connection Status */}
        <Grid item xs={12}>
          <Alert severity={isOnline ? 'success' : 'warning'}>
            Connection Status: {isOnline ? 'Online' : 'Offline'}
            {!isOnline && ' - Offline features are available'}
          </Alert>
        </Grid>

        {/* Biometric Authentication */}
        <Grid item xs={12} md={6}>
          <BiometricAuth
            onAuthSuccess={handleBiometricSuccess}
            onAuthFailure={handleBiometricFailure}
          />
        </Grid>

        {/* Push Notifications */}
        <Grid item xs={12} md={6}>
          <PushNotifications />
        </Grid>

        {/* Offline Trading */}
        <Grid item xs={12}>
          <OfflineTrading isOnline={isOnline} onSyncOrders={handleSyncOrders} />
        </Grid>

        {/* Regional Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('regional.localRegulations')}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Market Information</Typography>
                  <Typography variant="body2">
                    Max Order Size: ${regionalConfig.regulations.maxOrderSize.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Margin Requirement:{' '}
                    {(regionalConfig.regulations.marginRequirement * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    Settlement Days: {regionalConfig.regulations.settlementDays}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">{t('regional.holidays')}</Typography>
                  <Typography variant="body2">
                    Next Holiday: {regionalConfig.holidays[0] || 'None scheduled'}
                  </Typography>
                  <Typography variant="body2">
                    Total Holidays: {regionalConfig.holidays.length} per year
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MobileSettings;
