import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMarketData, fetchAnalytics, fetchSupportedCommodities } from '../store/slices/marketSlice';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
      id={`market-tabpanel-${index}`}
      aria-labelledby={`market-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MarketData: React.FC = () => {
  const dispatch = useAppDispatch();
  const { marketData, analytics, quotes, supportedCommodities, loading, error } = useAppSelector(
    (state) => state.market
  );
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedCommodity, setSelectedCommodity] = useState('crude_oil');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');

  useEffect(() => {
    dispatch(fetchSupportedCommodities());
  }, [dispatch]);

  useEffect(() => {
    if (selectedCommodity) {
      dispatch(fetchMarketData({ 
        commodity: selectedCommodity, 
        timeframe: selectedTimeframe 
      }));
      dispatch(fetchAnalytics({ commodity: selectedCommodity }));
    }
  }, [dispatch, selectedCommodity, selectedTimeframe]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatChartData = (data: any) => {
    if (!data || !data.data) return null;

    return {
      labels: data.data.map((point: any) => 
        new Date(point.timestamp).toLocaleDateString()
      ),
      datasets: [
        {
          label: 'Close Price',
          data: data.data.map((point: any) => point.close),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    };
  };

  const currentData = marketData[`${selectedCommodity}_${supportedCommodities[selectedCommodity]?.symbols[0]}_${selectedTimeframe}`];
  const currentAnalytics = analytics[selectedCommodity];
  const chartData = formatChartData(currentData);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${selectedCommodity.toUpperCase()} Price Chart`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Market Data & Analytics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="market data tabs">
          <Tab label="Live Prices" />
          <Tab label="Analytics" />
          <Tab label="Charts" />
          <Tab label="Market Report" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Commodity</InputLabel>
                <Select
                  value={selectedCommodity}
                  label="Commodity"
                  onChange={(e) => setSelectedCommodity(e.target.value)}
                >
                  {Object.keys(supportedCommodities).map((commodity) => (
                    <MenuItem key={commodity} value={commodity}>
                      {commodity.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={selectedTimeframe}
                  label="Timeframe"
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                >
                  <MenuItem value="1H">1 Hour</MenuItem>
                  <MenuItem value="1D">1 Day</MenuItem>
                  <MenuItem value="1W">1 Week</MenuItem>
                  <MenuItem value="1M">1 Month</MenuItem>
                  <MenuItem value="1Y">1 Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {loading.quotes && (
              <Grid item xs={12} textAlign="center">
                <CircularProgress />
              </Grid>
            )}
            
            {Object.values(quotes).map((quote: any) => (
              <Grid item xs={12} md={6} lg={4} key={quote.symbol}>
                <Card>
                  <CardHeader
                    title={quote.symbol}
                    subheader={quote.commodity}
                  />
                  <CardContent>
                    <Typography variant="h4" color="primary">
                      ${quote.price.toFixed(2)}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color={quote.change >= 0 ? 'success.main' : 'error.main'}
                    >
                      {quote.change >= 0 ? '+' : ''}
                      {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Volume: {quote.volume.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {new Date(quote.timestamp).toLocaleTimeString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {loading.analytics && (
            <Box textAlign="center">
              <CircularProgress />
            </Box>
          )}
          
          {currentAnalytics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Price Analytics" />
                  <CardContent>
                    <Typography variant="body2">
                      Current: ${currentAnalytics.analytics.price.current.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Average: ${currentAnalytics.analytics.price.average.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Range: ${currentAnalytics.analytics.price.min.toFixed(2)} - ${currentAnalytics.analytics.price.max.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Change: {currentAnalytics.analytics.price.changePercent.toFixed(2)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Market Trends" />
                  <CardContent>
                    <Typography variant="body2">
                      Direction: {currentAnalytics.trends.direction}
                    </Typography>
                    <Typography variant="body2">
                      Strength: {currentAnalytics.trends.strength}
                    </Typography>
                    <Typography variant="body2">
                      Volatility: {currentAnalytics.volatilityMetrics.regime}
                    </Typography>
                    <Typography variant="body2">
                      Support: ${currentAnalytics.trends.support.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Resistance: ${currentAnalytics.trends.resistance.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Seasonality Analysis" />
                  <CardContent>
                    <Typography variant="body2">
                      Current Season: {currentAnalytics.seasonality.currentSeason}
                    </Typography>
                    <Typography variant="body2">
                      Seasonal Bias: {currentAnalytics.seasonality.seasonalBias}
                    </Typography>
                    <Typography variant="body2">
                      Historical Return: {currentAnalytics.seasonality.historicalSeasonalReturn.toFixed(2)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {loading.marketData && (
            <Box textAlign="center">
              <CircularProgress />
            </Box>
          )}
          
          {chartData && (
            <Box sx={{ height: '400px' }}>
              <Line data={chartData} options={chartOptions} />
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Market Report"
                  action={
                    <Button variant="contained" color="primary">
                      Generate Report
                    </Button>
                  }
                />
                <CardContent>
                  <Typography variant="body1" paragraph>
                    Market summary and analysis will be displayed here.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This feature allows you to generate comprehensive market reports
                    including price movements, volume analysis, and market trends.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default MarketData;