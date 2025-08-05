import React, { useState, useEffect } from 'react';
import {
  Fab,
  Badge,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Snackbar,
  Alert
} from '@mui/material';
import {
  PhoneAndroid,
  Fingerprint,
  CloudOff,
  Notifications,
  Settings,
  Sync
} from '@mui/icons-material';
import { useTranslation } from '../../i18n/I18nProvider';
import { useNotifications } from './PushNotifications';
import { useOfflineOrders } from './OfflineTrading';

interface MobileIntegrationProps {
  onOpenMobileSettings: () => void;
  onOpenBiometricAuth: () => void;
  onOpenOfflineTrading: () => void;
  onOpenNotifications: () => void;
}

export const MobileIntegration: React.FC<MobileIntegrationProps> = ({
  onOpenMobileSettings,
  onOpenBiometricAuth,
  onOpenOfflineTrading,
  onOpenNotifications
}) => {
  const { t } = useTranslation();
  const { sendNotification } = useNotifications();
  const { getOfflineOrders } = useOfflineOrders();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineOrdersCount, setOfflineOrdersCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
      sendNotification('Connection Restored', 'You are now online. Syncing data...', 'system');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
      sendNotification('Offline Mode', 'You are now offline. Offline features are available.', 'system');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sendNotification]);

  useEffect(() => {
    // Update offline orders count
    const updateOfflineCount = () => {
      const offlineOrders = getOfflineOrders();
      setOfflineOrdersCount(offlineOrders.length);
    };

    updateOfflineCount();
    
    // Set up periodic check
    const interval = setInterval(updateOfflineCount, 10000);
    return () => clearInterval(interval);
  }, [getOfflineOrders]);

  useEffect(() => {
    // Listen for custom notification events
    const handleCustomNotification = (event: CustomEvent) => {
      setNotificationCount(prev => prev + 1);
    };

    window.addEventListener('quantenergx-notification', handleCustomNotification as EventListener);
    
    return () => {
      window.removeEventListener('quantenergx-notification', handleCustomNotification as EventListener);
    };
  }, []);

  const speedDialActions = [
    {
      icon: <Settings />,
      name: t('mobile.mobileSettings'),
      onClick: onOpenMobileSettings
    },
    {
      icon: <Fingerprint />,
      name: t('mobile.biometricAuth'),
      onClick: onOpenBiometricAuth
    },
    {
      icon: (
        <Badge badgeContent={offlineOrdersCount} color="error">
          <CloudOff />
        </Badge>
      ),
      name: t('mobile.offlineTrading'),
      onClick: onOpenOfflineTrading
    },
    {
      icon: (
        <Badge badgeContent={notificationCount} color="error">
          <Notifications />
        </Badge>
      ),
      name: t('mobile.pushNotifications'),
      onClick: onOpenNotifications
    }
  ];

  return (
    <>
      {/* Mobile Features Speed Dial */}
      <SpeedDial
        ariaLabel="Mobile features"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1300
        }}
        icon={<SpeedDialIcon icon={<PhoneAndroid />} />}
        direction="up"
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>

      {/* Offline Status Indicator */}
      {!isOnline && (
        <Fab
          color="warning"
          size="medium"
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1300
          }}
          onClick={onOpenOfflineTrading}
        >
          <Badge badgeContent={offlineOrdersCount} color="error">
            <CloudOff />
          </Badge>
        </Fab>
      )}

      {/* Sync Status Indicator */}
      {isOnline && offlineOrdersCount > 0 && (
        <Fab
          color="info"
          size="medium"
          sx={{
            position: 'fixed',
            bottom: 88,
            left: 16,
            zIndex: 1300,
            animation: 'pulse 2s infinite'
          }}
          onClick={onOpenOfflineTrading}
        >
          <Badge badgeContent={offlineOrdersCount} color="primary">
            <Sync />
          </Badge>
        </Fab>
      )}

      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        autoHideDuration={6000}
        onClose={() => setShowOfflineAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowOfflineAlert(false)}
          severity="warning"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {t('mobile.offlineMode')} - {t('mobile.offlineData')}
        </Alert>
      </Snackbar>

      {/* Add CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(33, 150, 243, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
            }
          }
        `}
      </style>
    </>
  );
};

export default MobileIntegration;