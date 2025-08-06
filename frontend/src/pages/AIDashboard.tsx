import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  Refresh,
  Timeline,
  SmartToy,
  Analytics,
  Security,
  Insights,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface AIDashboardData {
  sentiment: {
    alerts: any[];
    alert_count: number;
  };
  anomalies: {
    recent: any[];
    total_count: number;
    by_severity: {
      severe: number;
      moderate: number;
      mild: number;
    };
  };
  recommendations: {
    total_active: number;
    performance_summary: {
      success_rate: number;
      avg_return: number;
    };
  };
  system_status: {
    llm_service: string;
    sentiment_service: string;
    anomaly_service: string;
    last_updated: string;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AIDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<AIDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_URL}/api/v1/ai/dashboard?timeframe=24h`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return <ErrorIcon color="error" />;
      case 'moderate':
        return <Warning color="warning" />;
      case 'mild':
        return <CheckCircle color="success" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return 'error';
      case 'moderate':
        return 'warning';
      case 'mild':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={fetchDashboardData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return <Alert severity="warning">No dashboard data available</Alert>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI/ML Analytics Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
          onClick={fetchDashboardData}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* System Status Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SmartToy sx={{ mr: 1 }} />
                <Typography variant="h6">LLM Service</Typography>
              </Box>
              <Chip
                label={dashboardData.system_status.llm_service}
                color={getStatusColor(dashboardData.system_status.llm_service) as any}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Analytics sx={{ mr: 1 }} />
                <Typography variant="h6">Sentiment Analysis</Typography>
              </Box>
              <Chip
                label={dashboardData.system_status.sentiment_service}
                color={getStatusColor(dashboardData.system_status.sentiment_service) as any}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Security sx={{ mr: 1 }} />
                <Typography variant="h6">Anomaly Detection</Typography>
              </Box>
              <Chip
                label={dashboardData.system_status.anomaly_service}
                color={getStatusColor(dashboardData.system_status.anomaly_service) as any}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Timeline sx={{ mr: 1 }} />
                <Typography variant="h6">Recommendations</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {dashboardData.recommendations.total_active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="AI dashboard tabs">
            <Tab label="Overview" />
            <Tab label="Sentiment Analysis" />
            <Tab label="Anomaly Detection" />
            <Tab label="Recommendations" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Performance Summary */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Summary
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <LinearProgress
                        variant="determinate"
                        value={dashboardData.recommendations.performance_summary.success_rate * 100}
                        sx={{ flexGrow: 1, mr: 1 }}
                      />
                      <Typography variant="body2">
                        {(
                          dashboardData.recommendations.performance_summary.success_rate * 100
                        ).toFixed(1)}
                        %
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Average Return
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {(dashboardData.recommendations.performance_summary.avg_return * 100).toFixed(
                        1
                      )}
                      %
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Anomaly Summary */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Anomaly Summary (24h)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h5" color="error">
                          {dashboardData.anomalies.by_severity.severe}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Severe
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h5" color="warning.main">
                          {dashboardData.anomalies.by_severity.moderate}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Moderate
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h5" color="success.main">
                          {dashboardData.anomalies.by_severity.mild}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mild
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Alerts */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Alerts
                  </Typography>
                  {dashboardData.sentiment.alerts.length > 0 ? (
                    <List>
                      {dashboardData.sentiment.alerts.slice(0, 5).map((alert, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {alert.type === 'POSITIVE_NEWS' ? (
                              <TrendingUp color="success" />
                            ) : (
                              <TrendingDown color="error" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={alert.article_title}
                            secondary={`${alert.source} • Score: ${alert.sentiment_score.toFixed(2)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No recent alerts
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Sentiment Analysis Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sentiment Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Real-time news sentiment analysis for energy markets
                  </Typography>

                  {dashboardData.sentiment.alerts.length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Article</TableCell>
                            <TableCell>Source</TableCell>
                            <TableCell>Score</TableCell>
                            <TableCell>Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dashboardData.sentiment.alerts.map((alert, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Chip
                                  label={alert.type.replace('_', ' ')}
                                  color={alert.type === 'POSITIVE_NEWS' ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{alert.article_title}</TableCell>
                              <TableCell>{alert.source}</TableCell>
                              <TableCell>{alert.sentiment_score.toFixed(2)}</TableCell>
                              <TableCell>
                                {new Date(alert.published_at).toLocaleTimeString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">No sentiment alerts in the last 24 hours</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Anomaly Detection Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Anomalies
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Unusual patterns detected in trading data
                  </Typography>

                  {dashboardData.anomalies.recent.length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Severity</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Commodity</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dashboardData.anomalies.recent.slice(0, 10).map((anomaly, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  {getSeverityIcon(anomaly.severity)}
                                  <Chip
                                    label={anomaly.severity}
                                    color={getSeverityColor(anomaly.severity) as any}
                                    size="small"
                                    sx={{ ml: 1 }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell>{anomaly.type?.replace(/_/g, ' ')}</TableCell>
                              <TableCell>{anomaly.commodity}</TableCell>
                              <TableCell>
                                {anomaly.value ? anomaly.value.toFixed(2) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {new Date(
                                  anomaly.timestamp || anomaly.detected_at
                                ).toLocaleTimeString()}
                              </TableCell>
                              <TableCell>
                                <Tooltip title="View Details">
                                  <IconButton size="small">
                                    <Insights />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="success">No anomalies detected in the last 24 hours</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Recommendations Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI Trade Recommendations
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    LLM-powered trading insights and recommendations
                  </Typography>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    Currently showing {dashboardData.recommendations.total_active} active
                    recommendations. Success rate:{' '}
                    {(dashboardData.recommendations.performance_summary.success_rate * 100).toFixed(
                      1
                    )}
                    %
                  </Alert>

                  <Button variant="contained" color="primary">
                    Generate New Recommendations
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Footer Info */}
      <Box mt={3}>
        <Typography variant="body2" color="text.secondary" align="center">
          Last updated: {new Date(dashboardData.system_status.last_updated).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default AIDashboard;
