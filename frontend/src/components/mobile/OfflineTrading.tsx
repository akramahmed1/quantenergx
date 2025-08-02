import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CloudOff,
  CloudQueue,
  Sync,
  SyncProblem,
  CheckCircle,
  ErrorOutline
} from '@mui/icons-material';
import { useTranslation } from '../../i18n/I18nProvider';

interface OfflineOrder {
  id: string;
  type: 'buy' | 'sell';
  commodity: string;
  quantity: number;
  price: number;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
}

interface OfflineTradingProps {
  isOnline: boolean;
  onSyncOrders: (orders: OfflineOrder[]) => Promise<void>;
}

export const OfflineTrading: React.FC<OfflineTradingProps> = ({
  isOnline,
  onSyncOrders
}) => {
  const { t } = useTranslation();
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<OfflineOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    loadOfflineData();
    
    // Set up periodic sync when online
    if (isOnline && pendingOrders.length > 0) {
      const syncInterval = setInterval(() => {
        syncPendingOrders();
      }, 30000); // Sync every 30 seconds

      return () => clearInterval(syncInterval);
    }
  }, [isOnline, pendingOrders.length]); // syncPendingOrders is stable, no need to include

  const loadOfflineData = () => {
    try {
      const savedOrders = localStorage.getItem('quantenergx_offline_orders');
      const savedMode = localStorage.getItem('quantenergx_offline_mode');
      const savedSyncTime = localStorage.getItem('quantenergx_last_sync');

      if (savedOrders) {
        setPendingOrders(JSON.parse(savedOrders));
      }
      
      setOfflineMode(savedMode === 'true');
      
      if (savedSyncTime) {
        setLastSyncTime(new Date(savedSyncTime));
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  };

  const saveOfflineData = useCallback((orders: OfflineOrder[]) => {
    try {
      localStorage.setItem('quantenergx_offline_orders', JSON.stringify(orders));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }, []);

  const toggleOfflineMode = (enabled: boolean) => {
    setOfflineMode(enabled);
    localStorage.setItem('quantenergx_offline_mode', enabled.toString());
  };

  const _addOfflineOrder = (order: Omit<OfflineOrder, 'id' | 'timestamp' | 'status'>) => {
    const newOrder: OfflineOrder = {
      ...order,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending'
    };

    const updatedOrders = [...pendingOrders, newOrder];
    setPendingOrders(updatedOrders);
    saveOfflineData(updatedOrders);
  };

  const syncPendingOrders = async () => {
    if (!isOnline || pendingOrders.length === 0 || isSyncing) {
      return;
    }

    setIsSyncing(true);
    
    try {
      await onSyncOrders(pendingOrders);
      
      // Mark orders as synced
      const syncedOrders = pendingOrders.map(order => ({
        ...order,
        status: 'synced' as const
      }));
      
      setPendingOrders(syncedOrders);
      saveOfflineData(syncedOrders);
      setLastSyncTime(new Date());
      localStorage.setItem('quantenergx_last_sync', new Date().toISOString());
      
      // Clear synced orders after 24 hours
      setTimeout(() => {
        const filteredOrders = syncedOrders.filter(order => 
          order.status !== 'synced' || Date.now() - order.timestamp < 24 * 60 * 60 * 1000
        );
        setPendingOrders(filteredOrders);
        saveOfflineData(filteredOrders);
      }, 100);
      
    } catch (error) {
      console.error('Sync failed:', error);
      
      // Mark orders as failed
      const failedOrders = pendingOrders.map(order => ({
        ...order,
        status: 'failed' as const
      }));
      
      setPendingOrders(failedOrders);
      saveOfflineData(failedOrders);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearOfflineData = () => {
    setPendingOrders([]);
    localStorage.removeItem('quantenergx_offline_orders');
    localStorage.removeItem('quantenergx_last_sync');
    setLastSyncTime(null);
  };

  const getStatusIcon = (status: OfflineOrder['status']) => {
    switch (status) {
      case 'pending':
        return <CloudQueue color="warning" />;
      case 'synced':
        return <CheckCircle color="success" />;
      case 'failed':
        return <ErrorOutline color="error" />;
      default:
        return <SyncProblem />;
    }
  };

  const getStatusColor = (status: OfflineOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'synced':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const pendingOrdersCount = pendingOrders.filter(order => order.status === 'pending').length;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            {t('mobile.offlineTrading')}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {!isOnline && <CloudOff color="error" />}
            <Chip 
              label={isOnline ? 'Online' : 'Offline'}
              color={isOnline ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={offlineMode}
              onChange={(e) => toggleOfflineMode(e.target.checked)}
            />
          }
          label={t('trading.offlineMode')}
        />

        {pendingOrdersCount > 0 && (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            {t('trading.syncPending')}: {pendingOrdersCount} orders
          </Alert>
        )}

        {isOnline && pendingOrdersCount > 0 && (
          <Box mt={2} mb={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={syncPendingOrders}
              disabled={isSyncing}
              startIcon={isSyncing ? <CircularProgress size={20} /> : <Sync />}
            >
              {isSyncing ? t('common.loading') : t('mobile.syncData')}
            </Button>
          </Box>
        )}

        {pendingOrders.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Offline Orders ({pendingOrders.length})
            </Typography>
            
            <List dense>
              {pendingOrders.slice(-5).map((order) => (
                <ListItem key={order.id}>
                  <ListItemIcon>
                    {getStatusIcon(order.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${order.type.toUpperCase()} ${order.quantity} ${order.commodity}`}
                    secondary={`$${order.price} - ${new Date(order.timestamp).toLocaleString()}`}
                  />
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>

            {pendingOrders.length > 5 && (
              <Typography variant="caption" color="textSecondary">
                Showing latest 5 of {pendingOrders.length} orders
              </Typography>
            )}
          </Box>
        )}

        {lastSyncTime && (
          <Box mt={2}>
            <Typography variant="caption" color="textSecondary">
              Last sync: {lastSyncTime.toLocaleString()}
            </Typography>
          </Box>
        )}

        {pendingOrders.length > 0 && (
          <Box mt={2}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={clearOfflineData}
            >
              Clear Offline Data
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Hook for offline order management
export const useOfflineOrders = () => {
  const [orders, setOrders] = useState<OfflineOrder[]>([]);

  const addOfflineOrder = useCallback((order: Omit<OfflineOrder, 'id' | 'timestamp' | 'status'>) => {
    const newOrder: OfflineOrder = {
      ...order,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending'
    };

    setOrders(prev => {
      const updated = [...prev, newOrder];
      localStorage.setItem('quantenergx_offline_orders', JSON.stringify(updated));
      return updated;
    });

    return newOrder;
  }, []);

  const getOfflineOrders = useCallback(() => {
    return orders.filter(order => order.status === 'pending');
  }, [orders]);

  useEffect(() => {
    const savedOrders = localStorage.getItem('quantenergx_offline_orders');
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (error) {
        console.error('Failed to load offline orders:', error);
      }
    }
  }, []);

  return {
    addOfflineOrder,
    getOfflineOrders,
    allOrders: orders
  };
};

export default OfflineTrading;