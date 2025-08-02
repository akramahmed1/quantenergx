import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Button,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Notifications,
  // NotificationsActive,
  // NotificationsOff,
  TrendingUp,
  AttachMoney,
  Update,
  Warning
} from '@mui/icons-material';
import { useTranslation } from '../../i18n/I18nProvider';

interface NotificationSettings {
  enabled: boolean;
  tradeAlerts: boolean;
  priceAlerts: boolean;
  marketUpdates: boolean;
  systemAlerts: boolean;
}

interface PushNotification {
  id: string;
  title: string;
  body: string;
  type: 'trade' | 'price' | 'market' | 'system';
  timestamp: number;
  read: boolean;
}

interface PushNotificationsProps {
  onNotificationReceived?: (notification: PushNotification) => void;
}

export const PushNotifications: React.FC<PushNotificationsProps> = ({
  onNotificationReceived
}) => {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    tradeAlerts: true,
    priceAlerts: true,
    marketUpdates: false,
    systemAlerts: true
  });
  const [recentNotifications, setRecentNotifications] = useState<PushNotification[]>([]);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    checkNotificationSupport();
    loadNotificationSettings();
    loadRecentNotifications();
    registerServiceWorker();
  }, []);

  const checkNotificationSupport = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  const loadNotificationSettings = () => {
    try {
      const saved = localStorage.getItem('quantenergx_notification_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const loadRecentNotifications = () => {
    try {
      const saved = localStorage.getItem('quantenergx_recent_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentNotifications(parsed);
      }
    } catch (error) {
      console.error('Failed to load recent notifications:', error);
    }
  };

  const saveNotificationSettings = (newSettings: NotificationSettings) => {
    try {
      localStorage.setItem('quantenergx_notification_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setServiceWorkerRegistration(registration);
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);
    
    if (permission === 'granted') {
      const newSettings = { ...settings, enabled: true };
      saveNotificationSettings(newSettings);
      
      // Subscribe to push notifications if service worker is available
      if (serviceWorkerRegistration) {
        await subscribeToPushNotifications();
      }
    }
    
    return permission;
  };

  const subscribeToPushNotifications = async () => {
    if (!serviceWorkerRegistration) {
      console.error('Service Worker not registered');
      return;
    }

    try {
      // You would replace this with your actual VAPID public key
      const vapidPublicKey = 'your-vapid-public-key-here';
      
      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      // Send subscription to your backend
      console.log('Push subscription:', subscription);
      
      // Store subscription info
      localStorage.setItem('quantenergx_push_subscription', JSON.stringify(subscription));
      
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  };

  const sendLocalNotification = (notification: PushNotification) => {
    if (permission === 'granted' && settings.enabled) {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: notification.id,
        timestamp: notification.timestamp,
        requireInteraction: notification.type === 'system'
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        markNotificationAsRead(notification.id);
      };

      // Auto-close after 5 seconds for non-system notifications
      if (notification.type !== 'system') {
        setTimeout(() => browserNotification.close(), 5000);
      }
    }

    // Add to recent notifications
    const updatedNotifications = [notification, ...recentNotifications.slice(0, 9)];
    setRecentNotifications(updatedNotifications);
    localStorage.setItem('quantenergx_recent_notifications', JSON.stringify(updatedNotifications));

    // Call callback if provided
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  };

  const markNotificationAsRead = (id: string) => {
    const updated = recentNotifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    );
    setRecentNotifications(updated);
    localStorage.setItem('quantenergx_recent_notifications', JSON.stringify(updated));
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      try {
        const permissionResult = await requestNotificationPermission();
        if (permissionResult === 'granted') {
          saveNotificationSettings({ ...settings, enabled: true });
        }
      } catch (error) {
        console.error('Failed to enable notifications:', error);
      }
    } else {
      saveNotificationSettings({ ...settings, enabled: false });
    }
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveNotificationSettings(newSettings);
  };

  const getNotificationIcon = (type: PushNotification['type']) => {
    switch (type) {
      case 'trade':
        return <TrendingUp color="primary" />;
      case 'price':
        return <AttachMoney color="warning" />;
      case 'market':
        return <Update color="info" />;
      case 'system':
        return <Warning color="error" />;
      default:
        return <Notifications />;
    }
  };

  const unreadCount = recentNotifications.filter(n => !n.read).length;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            {t('mobile.pushNotifications')}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {unreadCount > 0 && (
              <Chip 
                label={unreadCount}
                color="error"
                size="small"
              />
            )}
            <Chip 
              label={settings.enabled ? t('notifications.pushEnabled') : t('notifications.pushDisabled')}
              color={settings.enabled ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Box>

        {!('Notification' in window) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Notifications are not supported in this browser
          </Alert>
        )}

        {permission === 'denied' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Notifications are blocked. Please enable them in your browser settings.
          </Alert>
        )}

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => toggleNotifications(e.target.checked)}
                disabled={permission === 'denied'}
              />
            }
            label={t('mobile.enableNotifications')}
          />

          {settings.enabled && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.tradeAlerts}
                    onChange={(e) => updateNotificationSetting('tradeAlerts', e.target.checked)}
                  />
                }
                label={t('notifications.tradeAlert')}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.priceAlerts}
                    onChange={(e) => updateNotificationSetting('priceAlerts', e.target.checked)}
                  />
                }
                label={t('notifications.priceAlert')}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.marketUpdates}
                    onChange={(e) => updateNotificationSetting('marketUpdates', e.target.checked)}
                  />
                }
                label={t('notifications.marketUpdate')}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.systemAlerts}
                    onChange={(e) => updateNotificationSetting('systemAlerts', e.target.checked)}
                  />
                }
                label={t('notifications.systemAlert')}
              />
            </>
          )}
        </FormGroup>

        {settings.enabled && (
          <Box mt={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                const testNotification: PushNotification = {
                  id: `test_${Date.now()}`,
                  title: 'QuantEnergx Test',
                  body: 'This is a test notification',
                  type: 'system',
                  timestamp: Date.now(),
                  read: false
                };
                sendLocalNotification(testNotification);
              }}
            >
              Test Notification
            </Button>
          </Box>
        )}

        {recentNotifications.length > 0 && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Recent Notifications
            </Typography>
            
            <List dense>
              {recentNotifications.slice(0, 5).map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => markNotificationAsRead(notification.id)}
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                      borderRadius: 1
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {notification.body}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(notification.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < Math.min(recentNotifications.length, 5) - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Hook for sending notifications
export const useNotifications = () => {
  const sendNotification = (
    title: string,
    body: string,
    type: PushNotification['type'] = 'system'
  ) => {
    const notification: PushNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      body,
      type,
      timestamp: Date.now(),
      read: false
    };

    // This would trigger the notification component
    window.dispatchEvent(new CustomEvent('quantenergx-notification', {
      detail: notification
    }));

    return notification;
  };

  return { sendNotification };
};

export default PushNotifications;