import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  AlertTitle,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Button,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ShowChart as ShowChartIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Analytics as AnalyticsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import * as Plotly from 'plotly.js';

// Type definitions for analytics data
interface BrentWTIDataPoint {
  timestamp: string;
  brent_price: number;
  wti_price: number;
  spread: number;
  volume_brent?: number;
  volume_wti?: number;
}

interface SpreadPrediction {
  timestamp: string;
  predicted_spread: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  confidence_score: number;
  market_regime: 'normal' | 'contango' | 'backwardation' | 'volatile';
}

interface AnomalyDetection {
  timestamp: string;
  anomaly_score: number;
  is_anomaly: boolean;
  anomaly_type: 'spread_manipulation' | 'volume_spike' | 'correlation_break' | 'regime_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  benchmark_comparison: {
    vitol_deviation: number;
    trafigura_deviation: number;
    market_consensus_deviation: number;
  };
}

interface BenchmarkData {
  timestamp: string;
  vitol_spread: number;
  trafigura_spread: number;
  market_consensus: number;
  participant_count: number;
}

interface AnalyticsDashboard {
  predictions: SpreadPrediction[];
  anomalies: AnomalyDetection[];
  summary: {
    current_spread: number;
    spread_trend: 'increasing' | 'decreasing' | 'stable';
    market_health: 'healthy' | 'concerning' | 'critical';
    benchmark_alignment: number;
  };
  recommendations: string[];
}

interface OilArbitrageChartProps {
  userId?: string;
  height?: number;
  refreshInterval?: number;
  showBenchmarks?: boolean;
  showAnomalies?: boolean;
  compactMode?: boolean;
}

const OilArbitrageChart: React.FC<OilArbitrageChartProps> = ({
  userId = 'demo-user',
  height = 600,
  refreshInterval = 30000, // 30 seconds
  showBenchmarks = true,
  showAnomalies = true,
  compactMode = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [historicalData, setHistoricalData] = useState<BrentWTIDataPoint[]>([]);
  const [predictions, setPredictions] = useState<SpreadPrediction[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData[]>([]);
  const [analyticsDashboard, setAnalyticsDashboard] = useState<AnalyticsDashboard | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);
  const [showBenchmarksState, setShowBenchmarksState] = useState(showBenchmarks);
  const [showAnomaliesState, setShowAnomaliesState] = useState(showAnomalies);
  const [showVitol, setShowVitol] = useState(true);
  const [showTrafigura, setShowTrafigura] = useState(true);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>('summary');

  // API endpoints - TODO: Replace with actual backend endpoints
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  /**
   * Fetch analytics data from backend
   * TODO: Replace with actual API calls to backend analytics service
   */
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API calls
      // const [historicalResponse, predictionsResponse, benchmarkResponse] = await Promise.all([
      //   fetch(`${API_BASE_URL}/api/analytics/brent-wti/historical`),
      //   fetch(`${API_BASE_URL}/api/analytics/brent-wti/predictions`),
      //   fetch(`${API_BASE_URL}/api/analytics/brent-wti/benchmarks`),
      // ]);

      // For now, generate mock data
      const mockHistoricalData = generateMockHistoricalData();
      const mockPredictions = generateMockPredictions();
      const mockBenchmarks = generateMockBenchmarks();
      const mockAnomalies = generateMockAnomalies();
      const mockDashboard = generateMockDashboard(mockHistoricalData, mockPredictions, mockAnomalies);

      setHistoricalData(mockHistoricalData);
      setPredictions(mockPredictions);
      setBenchmarkData(mockBenchmarks);
      setAnomalies(mockAnomalies);
      setAnalyticsDashboard(mockDashboard);

    } catch (err: any) {
      setError(`Failed to fetch analytics data: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAnalyticsData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAnalyticsData]);

  /**
   * Generate the main spread chart with predictions and benchmarks
   */
  const generateSpreadChart = useMemo(() => {
    if (historicalData.length === 0) return null;

    const traces: Plotly.Data[] = [];

    // Historical spread data
    traces.push({
      x: historicalData.map(d => d.timestamp),
      y: historicalData.map(d => d.spread),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Brent-WTI Spread',
      line: {
        color: theme.palette.primary.main,
        width: 2,
      },
      marker: {
        size: 4,
      },
    });

    // Predictions (if enabled)
    if (showPredictions && predictions.length > 0) {
      traces.push({
        x: predictions.map(p => p.timestamp),
        y: predictions.map(p => p.predicted_spread),
        type: 'scatter',
        mode: 'lines',
        name: 'AI Prediction',
        line: {
          color: theme.palette.secondary.main,
          width: 2,
          dash: 'dash',
        },
      });

      // Confidence bands
      traces.push({
        x: [...predictions.map(p => p.timestamp), ...predictions.map(p => p.timestamp).reverse()],
        y: [
          ...predictions.map(p => p.confidence_interval.upper),
          ...predictions.map(p => p.confidence_interval.lower).reverse(),
        ],
        fill: 'toself',
        fillcolor: `rgba(${theme.palette.secondary.main.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(',')}, 0.2)`,
        line: { color: 'transparent' },
        name: 'Confidence Interval',
        hoverinfo: 'skip',
      });
    }

    // Benchmark overlays
    if (showBenchmarksState && benchmarkData.length > 0) {
      if (showVitol) {
        traces.push({
          x: benchmarkData.map(b => b.timestamp),
          y: benchmarkData.map(b => b.vitol_spread),
          type: 'scatter',
          mode: 'lines',
          name: 'Vitol Benchmark',
          line: {
            color: '#FF6B35',
            width: 1,
            dash: 'dot',
          },
        });
      }

      if (showTrafigura) {
        traces.push({
          x: benchmarkData.map(b => b.timestamp),
          y: benchmarkData.map(b => b.trafigura_spread),
          type: 'scatter',
          mode: 'lines',
          name: 'Trafigura Benchmark',
          line: {
            color: '#4ECDC4',
            width: 1,
            dash: 'dot',
          },
        });
      }
    }

    // Anomaly markers
    if (showAnomaliesState && anomalies.length > 0) {
      const anomalyMarkers = anomalies.map(anomaly => {
        const dataPoint = historicalData.find(d => d.timestamp === anomaly.timestamp);
        return dataPoint ? {
          x: anomaly.timestamp,
          y: dataPoint.spread,
          severity: anomaly.severity,
        } : null;
      }).filter(Boolean);

      if (anomalyMarkers.length > 0) {
        traces.push({
          x: anomalyMarkers.map(a => a?.x).filter(x => x !== undefined),
          y: anomalyMarkers.map(a => a?.y).filter(y => y !== undefined),
          type: 'scatter',
          mode: 'markers',
          name: 'Anomalies',
          marker: {
            size: 12,
            color: anomalyMarkers.map(a => {
              switch (a?.severity) {
                case 'critical': return '#F44336';
                case 'high': return '#FF9800';
                case 'medium': return '#FFC107';
                default: return '#4CAF50';
              }
            }),
            symbol: 'triangle-up',
            line: {
              width: 2,
              color: '#FFF',
            },
          },
          hovertemplate: '%{x}<br>Spread: $%{y:.2f}<br>Anomaly Detected<extra></extra>',
        });
      }
    }

    const layout: Partial<Plotly.Layout> = {
      title: {
        text: compactMode ? 'Brent-WTI Spread' : 'Brent-WTI Spread Analysis with AI Predictions & Benchmarks',
      },
      xaxis: {
        title: { text: 'Time' },
        type: 'date' as const,
        gridcolor: theme.palette.divider,
      },
      yaxis: {
        title: { text: 'Spread ($/barrel)' },
        gridcolor: theme.palette.divider,
      },
      height: compactMode ? 300 : height,
      margin: { l: 60, r: 30, t: 60, b: 60 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: theme.palette.text.primary },
      legend: {
        orientation: isMobile ? 'h' : 'v',
        x: isMobile ? 0 : 1.02,
        y: isMobile ? -0.2 : 1,
      },
      hovermode: 'x unified',
    };

    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: !compactMode,
      toImageButtonOptions: {
        format: 'png',
        filename: `brent_wti_analysis_${new Date().toISOString().split('T')[0]}`,
        height: height,
        width: 1200,
        scale: 1,
      },
    };

    return (
      <Plot
        data={traces}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
      />
    );
  }, [
    historicalData,
    predictions,
    benchmarkData,
    anomalies,
    showPredictions,
    showBenchmarksState,
    showVitol,
    showTrafigura,
    showAnomaliesState,
    theme,
    isMobile,
    compactMode,
    height,
  ]);

  /**
   * Generate volume analysis chart
   */
  const generateVolumeChart = useMemo(() => {
    if (historicalData.length === 0) return null;

    const traces: Plotly.Data[] = [
      {
        x: historicalData.map(d => d.timestamp),
        y: historicalData.map(d => d.volume_brent || 0),
        type: 'bar',
        name: 'Brent Volume',
        marker: { color: theme.palette.primary.main, opacity: 0.7 },
      },
      {
        x: historicalData.map(d => d.timestamp),
        y: historicalData.map(d => -(d.volume_wti || 0)),
        type: 'bar',
        name: 'WTI Volume',
        marker: { color: theme.palette.secondary.main, opacity: 0.7 },
      },
    ];

    const layout: Partial<Plotly.Layout> = {
      title: { text: 'Trading Volume Comparison' },
      xaxis: { title: { text: 'Time' }, type: 'date' as const },
      yaxis: { title: { text: 'Volume (contracts)' } },
      height: 300,
      margin: { l: 60, r: 30, t: 60, b: 60 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: theme.palette.text.primary },
      barmode: 'relative',
    };

    return (
      <Plot
        data={traces}
        layout={layout}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
      />
    );
  }, [historicalData, theme]);

  /**
   * Handle tab changes
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  /**
   * Handle accordion expansion
   */
  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedAccordion(isExpanded ? panel : null);
  };

  /**
   * Get health status icon and color
   */
  const getHealthStatusDisplay = (health: string) => {
    switch (health) {
      case 'healthy':
        return { icon: <CheckCircleIcon />, color: 'success' as const };
      case 'concerning':
        return { icon: <WarningIcon />, color: 'warning' as const };
      case 'critical':
        return { icon: <ErrorIcon />, color: 'error' as const };
      default:
        return { icon: <InfoIcon />, color: 'info' as const };
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading AI Analytics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Analytics Error</AlertTitle>
        {error}
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchAnalyticsData}
          sx={{ mt: 1 }}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  if (compactMode) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h6" component="h2">
              <ShowChartIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
              Oil Spread Analysis
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {analyticsDashboard && (
                <Chip
                  {...getHealthStatusDisplay(analyticsDashboard.summary.market_health)}
                  label={analyticsDashboard.summary.market_health}
                  size="small"
                />
              )}
              <Tooltip title={`Current spread: $${analyticsDashboard?.summary.current_spread.toFixed(2)}`}>
                <Chip
                  label={`$${analyticsDashboard?.summary.current_spread.toFixed(2)}`}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            </Box>
          </Box>
          {generateSpreadChart}
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" component="h1">
          <AnalyticsIcon sx={{ mr: 2, verticalAlign: 'bottom' }} />
          Oil Arbitrage Analytics
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      {analyticsDashboard && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Current Spread
                </Typography>
                <Typography variant="h5">
                  ${analyticsDashboard.summary.current_spread.toFixed(2)}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  {analyticsDashboard.summary.spread_trend === 'increasing' ? (
                    <TrendingUpIcon color="success" />
                  ) : analyticsDashboard.summary.spread_trend === 'decreasing' ? (
                    <TrendingDownIcon color="error" />
                  ) : (
                    <TimelineIcon color="primary" />
                  )}
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {analyticsDashboard.summary.spread_trend}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Market Health
                </Typography>
                <Box display="flex" alignItems="center">
                  <Chip
                    {...getHealthStatusDisplay(analyticsDashboard.summary.market_health)}
                    label={analyticsDashboard.summary.market_health}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Anomalies
                </Typography>
                <Typography variant="h5">
                  {anomalies.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length} high severity
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Benchmark Alignment
                </Typography>
                <Typography variant="h5">
                  {Math.round(analyticsDashboard.summary.benchmark_alignment * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Market consensus
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Chart Controls */}
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <FormControlLabel
          control={
            <Switch
              checked={showPredictions}
              onChange={(e) => setShowPredictions(e.target.checked)}
            />
          }
          label="AI Predictions"
        />
        <FormControlLabel
          control={
            <Switch
              checked={showBenchmarksState}
              onChange={(e) => setShowBenchmarksState(e.target.checked)}
            />
          }
          label="Benchmarks"
        />
        {showBenchmarksState && (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={showVitol}
                  onChange={(e) => setShowVitol(e.target.checked)}
                />
              }
              label="Vitol"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showTrafigura}
                  onChange={(e) => setShowTrafigura(e.target.checked)}
                />
              }
              label="Trafigura"
            />
          </>
        )}
        <FormControlLabel
          control={
            <Switch
              checked={showAnomaliesState}
              onChange={(e) => setShowAnomaliesState(e.target.checked)}
            />
          }
          label="Anomalies"
        />
      </Box>

      {/* Main Chart Tabs */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Spread Analysis" />
            <Tab label="Volume Analysis" />
          </Tabs>
        </Box>
        <CardContent>
          {activeTab === 0 && generateSpreadChart}
          {activeTab === 1 && generateVolumeChart}
        </CardContent>
      </Card>

      {/* Analytics Panels */}
      {analyticsDashboard && (
        <>
          {/* Summary Accordion */}
          <Accordion
            expanded={expandedAccordion === 'summary'}
            onChange={handleAccordionChange('summary')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">AI Analytics Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Model Predictions
                  </Typography>
                  <List dense>
                    {predictions.slice(0, 5).map((pred, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TimelineIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`$${pred.predicted_spread.toFixed(2)}`}
                          secondary={`${new Date(pred.timestamp).toLocaleTimeString()} - ${pred.market_regime} (${Math.round(pred.confidence_score * 100)}% confidence)`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Recommendations
                  </Typography>
                  <List dense>
                    {analyticsDashboard.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <InfoIcon />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Anomalies Accordion */}
          <Accordion
            expanded={expandedAccordion === 'anomalies'}
            onChange={handleAccordionChange('anomalies')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Anomaly Detection</Typography>
              <Chip
                label={anomalies.length}
                size="small"
                sx={{ ml: 2 }}
                color={anomalies.some(a => a.severity === 'critical') ? 'error' : 'default'}
              />
            </AccordionSummary>
            <AccordionDetails>
              {anomalies.length === 0 ? (
                <Typography color="text.secondary">
                  No anomalies detected in the current timeframe.
                </Typography>
              ) : (
                <List>
                  {anomalies.map((anomaly, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        {anomaly.severity === 'critical' ? (
                          <ErrorIcon color="error" />
                        ) : anomaly.severity === 'high' ? (
                          <WarningIcon color="warning" />
                        ) : (
                          <InfoIcon color="info" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${anomaly.anomaly_type.replace('_', ' ').toUpperCase()} - ${anomaly.severity} severity`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(anomaly.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Anomaly Score: {(anomaly.anomaly_score * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Vitol deviation: ${anomaly.benchmark_comparison.vitol_deviation.toFixed(2)} |
                              Trafigura deviation: ${anomaly.benchmark_comparison.trafigura_deviation.toFixed(2)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        </>
      )}
    </Box>
  );

  // Mock data generators for development
  // TODO: Remove these when real API integration is complete

  function generateMockHistoricalData(): BrentWTIDataPoint[] {
    const data: BrentWTIDataPoint[] = [];
    const baseDate = new Date();
    
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(baseDate.getTime() - (50 - i) * 60 * 60 * 1000);
      const brentBase = 75 + Math.sin(i * 0.2) * 5 + (Math.random() - 0.5) * 3;
      const wtiBase = brentBase - 3 + Math.sin(i * 0.15) * 2 + (Math.random() - 0.5) * 2;
      
      data.push({
        timestamp: timestamp.toISOString(),
        brent_price: brentBase,
        wti_price: wtiBase,
        spread: brentBase - wtiBase,
        volume_brent: 1000000 + Math.random() * 500000,
        volume_wti: 800000 + Math.random() * 400000,
      });
    }
    
    return data;
  }

  function generateMockPredictions(): SpreadPrediction[] {
    const predictions: SpreadPrediction[] = [];
    const baseDate = new Date();
    
    for (let i = 1; i <= 24; i++) {
      const timestamp = new Date(baseDate.getTime() + i * 60 * 60 * 1000);
      const baseSpread = 3 + Math.sin(i * 0.1) * 1.5;
      
      predictions.push({
        timestamp: timestamp.toISOString(),
        predicted_spread: baseSpread,
        confidence_interval: {
          lower: baseSpread - 1,
          upper: baseSpread + 1,
        },
        confidence_score: 0.7 + Math.random() * 0.25,
        market_regime: i % 5 === 0 ? 'volatile' : 'normal',
      });
    }
    
    return predictions;
  }

  function generateMockBenchmarks(): BenchmarkData[] {
    const benchmarks: BenchmarkData[] = [];
    const baseDate = new Date();
    
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(baseDate.getTime() - (50 - i) * 60 * 60 * 1000);
      const baseSpread = 3.2 + Math.sin(i * 0.18) * 0.8;
      
      benchmarks.push({
        timestamp: timestamp.toISOString(),
        vitol_spread: baseSpread + 0.1 + Math.random() * 0.2,
        trafigura_spread: baseSpread - 0.05 + Math.random() * 0.15,
        market_consensus: baseSpread + Math.random() * 0.1,
        participant_count: 15 + Math.floor(Math.random() * 10),
      });
    }
    
    return benchmarks;
  }

  function generateMockAnomalies(): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    const baseDate = new Date();
    
    // Generate a few random anomalies
    for (let i = 0; i < 3; i++) {
      const timestamp = new Date(baseDate.getTime() - Math.random() * 48 * 60 * 60 * 1000);
      
      anomalies.push({
        timestamp: timestamp.toISOString(),
        anomaly_score: 0.2 + Math.random() * 0.3,
        is_anomaly: true,
        anomaly_type: ['spread_manipulation', 'volume_spike', 'correlation_break', 'regime_change'][
          Math.floor(Math.random() * 4)
        ] as any,
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        benchmark_comparison: {
          vitol_deviation: Math.random() * 2,
          trafigura_deviation: Math.random() * 1.5,
          market_consensus_deviation: Math.random() * 1.8,
        },
      });
    }
    
    return anomalies;
  }

  function generateMockDashboard(
    historical: BrentWTIDataPoint[],
    predictions: SpreadPrediction[],
    anomalies: AnomalyDetection[]
  ): AnalyticsDashboard {
    const current = historical[historical.length - 1];
    
    return {
      predictions,
      anomalies,
      summary: {
        current_spread: current.spread,
        spread_trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
        market_health: anomalies.some(a => a.severity === 'critical') ? 'critical' : 'healthy',
        benchmark_alignment: 0.7 + Math.random() * 0.25,
      },
      recommendations: [
        'Consider WTI long / Brent short positions for spread convergence',
        'Monitor benchmark deviations for arbitrage opportunities',
        'Implement volatility-adjusted position sizing',
      ],
    };
  }
};

export default OilArbitrageChart;