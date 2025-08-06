import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  AlertTitle,
  Chip,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import { io } from 'socket.io-client';

export interface ArbitrageAlert {
  id: string;
  timestamp: Date;
  commodity: string;
  market1: {
    name: string;
    price: number;
    currency: string;
    region: string;
  };
  market2: {
    name: string;
    price: number;
    currency: string;
    region: string;
  };
  spread: number;
  spreadPercentage: number;
  profitPotential: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  compliance: {
    region: string;
    status: 'compliant' | 'warning' | 'violation';
    notes?: string;
  };
  expiresAt: Date;
}

interface ArbitrageAlertsProps {
  userId?: string;
  region?: 'guyana' | 'middle-east' | 'us' | 'europe' | 'uk';
  compactMode?: boolean;
}

const ArbitrageAlerts: React.FC<ArbitrageAlertsProps> = ({
  userId = 'demo-user',
  region = 'us',
  compactMode = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [alerts, setAlerts] = useState<ArbitrageAlert[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<ArbitrageAlert | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // WebSocket connection setup
  useEffect(() => {
    const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';
    const newSocket = io(wsUrl, {
      transports: ['websocket'],
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      // Authenticate and subscribe to arbitrage alerts
      newSocket.emit('authenticate', { userId, token: localStorage.getItem('authToken') || 'demo-token' });
      newSocket.emit('subscribe-arbitrage', { userId, region });
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('arbitrage-alert', (alertData: any) => {
      const alert: ArbitrageAlert = {
        ...alertData,
        timestamp: new Date(alertData.timestamp),
        expiresAt: new Date(alertData.expiresAt),
      };
      
      setAlerts(prevAlerts => {
        const updatedAlerts = [alert, ...prevAlerts.slice(0, 49)]; // Keep only 50 most recent
        return updatedAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      });

      // Show browser notification if enabled
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`Arbitrage Alert: ${alert.commodity}`, {
          body: `${alert.spreadPercentage.toFixed(2)}% spread between ${alert.market1.name} and ${alert.market2.name}`,
          icon: '/favicon.ico',
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId, region, notificationsEnabled]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleToggleExpand = useCallback((alertId: string) => {
    setExpandedAlert(prev => prev === alertId ? null : alertId);
  }, []);

  const handleViewDetails = useCallback((alert: ArbitrageAlert) => {
    setSelectedAlert(alert);
    setShowDetailDialog(true);
  }, []);

  const getSeverityIcon = (severity: ArbitrageAlert['severity']) => {
    switch (severity) {
      case 'critical': return <ErrorIcon />;
      case 'high': return <WarningIcon />;
      case 'medium': return <InfoIcon />;
      case 'low': return <TrendingUpIcon />;
      default: return <InfoIcon />;
    }
  };

  const generatePriceChart = (alert: ArbitrageAlert) => {
    if (!alert) return null;

    const data = [
      {
        x: [alert.market1.name, alert.market2.name],
        y: [alert.market1.price, alert.market2.price],
        type: 'bar' as const,
        marker: {
          color: [theme.palette.primary.main, theme.palette.secondary.main],
        },
        name: 'Price Comparison',
      },
    ];

    const layout = {
      title: {
        text: `${alert.commodity} Price Comparison`,
      },
      xaxis: { title: { text: 'Markets' } },
      yaxis: { title: { text: `Price (${alert.market1.currency})` } },
      height: isMobile ? 250 : 300,
      margin: { l: 60, r: 30, t: 50, b: 50 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: theme.palette.text.primary },
    };

    return (
      <Plot
        data={data}
        layout={layout}
        style={{ width: '100%', height: '100%' }}
        config={{ responsive: true, displayModeBar: false }}
      />
    );
  };

  if (compactMode) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h6" component="h2">
              Arbitrage Alerts
            </Typography>
            <Chip
              label={connectionStatus}
              color={connectionStatus === 'connected' ? 'success' : 'error'}
              size="small"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {alerts.length} active alerts
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" component="h1">
          Arbitrage Alerts
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            label={connectionStatus}
            color={connectionStatus === 'connected' ? 'success' : 'error'}
          />
          <FormControlLabel
            control={
              <Switch
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
            }
            label={notificationsEnabled ? <NotificationsIcon /> : <NotificationsOffIcon />}
          />
        </Box>
      </Box>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No arbitrage alerts available. Monitoring markets for opportunities...
            </Typography>
          </CardContent>
        </Card>
      ) : (
        alerts.map((alert) => (
          <Card key={alert.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  {getSeverityIcon(alert.severity)}
                  <Typography variant="h6">
                    {alert.commodity}
                  </Typography>
                  <Chip
                    label={`${alert.spreadPercentage.toFixed(2)}%`}
                    color={alert.spreadPercentage > 5 ? 'error' : alert.spreadPercentage > 2 ? 'warning' : 'success'}
                    size="small"
                  />
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" color="text.secondary">
                    {alert.timestamp.toLocaleTimeString()}
                  </Typography>
                  <IconButton
                    onClick={() => handleToggleExpand(alert.id)}
                    size="small"
                  >
                    {expandedAlert === alert.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              </Box>

              <Alert
                severity={alert.severity === 'critical' || alert.severity === 'high' ? 'warning' : 'info'}
                sx={{ mb: 2 }}
              >
                <AlertTitle>
                  Arbitrage Opportunity: {alert.market1.name} vs {alert.market2.name}
                </AlertTitle>
                Price spread of ${alert.spread.toFixed(2)} ({alert.spreadPercentage.toFixed(2)}%) 
                with potential profit of ${alert.profitPotential.toFixed(2)}
              </Alert>

              <Collapse in={expandedAlert === alert.id}>
                <Box sx={{ mt: 2 }}>
                  {/* Market Comparison Table */}
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Market</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell>Region</TableCell>
                          <TableCell>Compliance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>{alert.market1.name}</TableCell>
                          <TableCell align="right">
                            {alert.market1.price.toFixed(2)} {alert.market1.currency}
                          </TableCell>
                          <TableCell>{alert.market1.region}</TableCell>
                          <TableCell>
                            <Chip
                              label={alert.compliance.status}
                              color={
                                alert.compliance.status === 'compliant' ? 'success' :
                                alert.compliance.status === 'warning' ? 'warning' : 'error'
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>{alert.market2.name}</TableCell>
                          <TableCell align="right">
                            {alert.market2.price.toFixed(2)} {alert.market2.currency}
                          </TableCell>
                          <TableCell>{alert.market2.region}</TableCell>
                          <TableCell>
                            <Chip
                              label={alert.compliance.status}
                              color={
                                alert.compliance.status === 'compliant' ? 'success' :
                                alert.compliance.status === 'warning' ? 'warning' : 'error'
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Price Chart */}
                  <Box sx={{ mb: 2 }}>
                    {generatePriceChart(alert)}
                  </Box>

                  <Button
                    variant="outlined"
                    onClick={() => handleViewDetails(alert)}
                    fullWidth={isMobile}
                  >
                    View Full Analysis
                  </Button>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))
      )}

      {/* Detail Dialog */}
      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Arbitrage Alert Details: {selectedAlert?.commodity}
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Market Analysis
              </Typography>
              {generatePriceChart(selectedAlert)}
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Compliance Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Region: {selectedAlert.compliance.region}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {selectedAlert.compliance.status}
              </Typography>
              {selectedAlert.compliance.notes && (
                <Typography variant="body2" color="text.secondary">
                  Notes: {selectedAlert.compliance.notes}
                </Typography>
              )}
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Timing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Alert Time: {selectedAlert.timestamp.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expires: {selectedAlert.expiresAt.toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
          <Button variant="contained" onClick={() => setShowDetailDialog(false)}>
            Execute Trade
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArbitrageAlerts;