import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert
} from '@mui/material';
import { useTranslation } from '../i18n/I18nProvider';
import BiometricAuth from '../components/mobile/BiometricAuth';
import OfflineTrading from '../components/mobile/OfflineTrading';
import PushNotifications from '../components/mobile/PushNotifications';
import MobileSettings from '../components/mobile/MobileSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mobile-tabpanel-${index}`}
      aria-labelledby={`mobile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `mobile-tab-${index}`,
    'aria-controls': `mobile-tabpanel-${index}`,
  };
}

export const MobileFeaturesDemo: React.FC = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authMessage, setAuthMessage] = useState<string>('');
  const [authSeverity, setAuthSeverity] = useState<'success' | 'error'>('success');

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAuthSuccess = () => {
    setAuthMessage('Biometric authentication successful!');
    setAuthSeverity('success');
    setTimeout(() => setAuthMessage(''), 3000);
  };

  const handleAuthFailure = (error: string) => {
    setAuthMessage(`Authentication failed: ${error}`);
    setAuthSeverity('error');
    setTimeout(() => setAuthMessage(''), 3000);
  };

  const handleSyncOrders = async (orders: any[]) => {
    // Simulate API call
    console.log('Syncing orders:', orders);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Orders synced successfully');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          {t('mobile.title')} - Demo
        </Typography>
        
        <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
          Comprehensive mobile trading platform with offline capabilities, biometric authentication, and multi-language support
        </Typography>

        {authMessage && (
          <Box sx={{ mb: 2 }}>
            <Alert severity={authSeverity}>
              {authMessage}
            </Alert>
          </Box>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          Connection Status: {isOnline ? 'Online' : 'Offline'} | 
          Language: {t('common.language')} | 
          Mobile Features: Active
        </Alert>

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="mobile features demo tabs">
              <Tab label={t('mobile.biometricAuth')} {...a11yProps(0)} />
              <Tab label={t('mobile.offlineTrading')} {...a11yProps(1)} />
              <Tab label={t('mobile.pushNotifications')} {...a11yProps(2)} />
              <Tab label={t('mobile.mobileSettings')} {...a11yProps(3)} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h5" gutterBottom>
              {t('mobile.biometricAuth')}
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Secure authentication using fingerprint or facial recognition technology.
              This feature uses the WebAuthn API for secure, passwordless authentication.
            </Typography>
            <BiometricAuth
              onAuthSuccess={handleAuthSuccess}
              onAuthFailure={handleAuthFailure}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h5" gutterBottom>
              {t('mobile.offlineTrading')}
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Trade even when offline. Orders are stored locally and automatically synchronized
              when connection is restored. Perfect for trading on-the-go.
            </Typography>
            <OfflineTrading
              isOnline={isOnline}
              onSyncOrders={handleSyncOrders}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h5" gutterBottom>
              {t('mobile.pushNotifications')}
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Stay informed with real-time push notifications for trades, price alerts,
              market updates, and system notifications. Fully configurable and secure.
            </Typography>
            <PushNotifications />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h5" gutterBottom>
              {t('mobile.mobileSettings')}
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Comprehensive mobile settings including language selection, regional configurations,
              trading hours, tax information, and all mobile feature controls in one place.
            </Typography>
            <MobileSettings />
          </TabPanel>
        </Paper>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Features Demonstrated:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li>✅ Biometric authentication (WebAuthn API)</li>
            <li>✅ Offline trading with background sync</li>
            <li>✅ Push notifications (Web Push API)</li>
            <li>✅ Multi-language support (EN, ES, FR, AR, PT)</li>
            <li>✅ Regional configurations (US, UK, EU, Guyana, Middle East)</li>
            <li>✅ Progressive Web App (PWA) capabilities</li>
            <li>✅ Right-to-Left (RTL) support for Arabic</li>
            <li>✅ Trading hours and holiday calendars</li>
            <li>✅ Tax and customs information</li>
            <li>✅ Real-time online/offline status</li>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default MobileFeaturesDemo;