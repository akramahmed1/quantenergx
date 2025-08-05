import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Verified,
  Category,
  Security,
  CloudDownload,
  Store,
} from '@mui/icons-material';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  type: string;
  price?: number;
  license: string;
  rating?: number;
  downloads?: number;
  verified: boolean;
}

interface MarketplaceEntry {
  plugin_id: string;
  publisher: string;
  published_date: string;
  marketplace_category: string;
  featured: boolean;
  reviews: Review[];
  screenshots: string[];
  documentation_url: string;
  support_url: string;
  pricing_model: string;
  pricing_details: any;
}

interface Review {
  user_id: string;
  rating: number;
  comment: string;
  date: string;
  verified_purchase: boolean;
}

interface PluginDetails {
  plugin: Plugin;
  marketplace: MarketplaceEntry & {
    review_count: number;
    average_rating: number;
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
      id={`marketplace-tabpanel-${index}`}
      aria-labelledby={`marketplace-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Marketplace: React.FC = () => {
  const [plugins, setPlugins] = useState<MarketplaceEntry[]>([]);
  const [featuredPlugins, setFeaturedPlugins] = useState<MarketplaceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDetails | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [installingPlugin, setInstallingPlugin] = useState<string | null>(null);

  const categories = [
    { id: '', name: 'All Categories' },
    { id: 'Risk Management', name: 'Risk Management' },
    { id: 'ESG & Sustainability', name: 'ESG & Sustainability' },
    { id: 'Trading Algorithms', name: 'Trading Algorithms' },
    { id: 'Compliance & Reporting', name: 'Compliance & Reporting' },
    { id: 'Market Data & Analytics', name: 'Market Data & Analytics' },
    { id: 'Integration & APIs', name: 'Integration & APIs' },
  ];

  const fetchPlugins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/marketplace/plugins');
      const result = await response.json();

      if (result.success) {
        setPlugins(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeaturedPlugins = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/marketplace/featured');
      const result = await response.json();

      if (result.success) {
        setFeaturedPlugins(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch featured plugins:', error);
    }
  }, []);

  const fetchPluginDetails = async (pluginId: string) => {
    try {
      const response = await fetch(`/api/v1/marketplace/plugins/${pluginId}`);
      const result = await response.json();

      if (result.success) {
        setSelectedPlugin(result.data);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch plugin details:', error);
    }
  };

  const installPlugin = async (pluginId: string) => {
    try {
      setInstallingPlugin(pluginId);
      const response = await fetch(`/api/v1/marketplace/plugins/${pluginId}/install`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_permissions: ['plugins:install', 'risk:read', 'analytics:read'],
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Plugin installed successfully!');
        setInstallDialogOpen(false);
      } else {
        alert(`Installation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Installation error:', error);
      alert('Installation failed due to network error');
    } finally {
      setInstallingPlugin(null);
    }
  };

  const searchPlugins = useCallback(async () => {
    if (!searchQuery.trim()) {
      fetchPlugins();
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/marketplace/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          category: selectedCategory || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPlugins(result.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, fetchPlugins]);

  useEffect(() => {
    fetchPlugins();
    fetchFeaturedPlugins();
  }, [fetchPlugins, fetchFeaturedPlugins]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery) {
        searchPlugins();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, selectedCategory, searchPlugins]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
  };

  const getPriceDisplay = (marketplace: MarketplaceEntry) => {
    if (marketplace.pricing_model === 'free') {
      return 'Free';
    }

    if (marketplace.pricing_details) {
      if (marketplace.pricing_model === 'subscription') {
        return `$${marketplace.pricing_details.monthly}/month`;
      }
      if (marketplace.pricing_model === 'one_time') {
        return `$${marketplace.pricing_details.price}`;
      }
      if (marketplace.pricing_model === 'usage_based') {
        return `$${marketplace.pricing_details.per_calculation}/use`;
      }
    }

    return 'Contact for pricing';
  };

  const PluginCard: React.FC<{ entry: MarketplaceEntry }> = ({ entry }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="h2" noWrap>
            {entry.plugin_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Typography>
          {entry.featured && <Chip label="Featured" color="primary" size="small" />}
        </Box>

        <Typography variant="body2" color="text.secondary" mb={1}>
          by {entry.publisher}
        </Typography>

        <Typography
          variant="body2"
          mb={2}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          Advanced plugin for {entry.marketplace_category.toLowerCase()}
        </Typography>

        <Box display="flex" alignItems="center" mb={1}>
          <Rating value={4.5} precision={0.1} size="small" readOnly />
          <Typography variant="body2" color="text.secondary" ml={1}>
            (125 reviews)
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip label={entry.marketplace_category} variant="outlined" size="small" />
          <Typography variant="h6" color="primary">
            {getPriceDisplay(entry)}
          </Typography>
        </Box>
      </CardContent>

      <CardActions>
        <Button size="small" onClick={() => fetchPluginDetails(entry.plugin_id)}>
          View Details
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<CloudDownload />}
          onClick={() => {
            setSelectedPlugin({
              plugin: {
                id: entry.plugin_id,
                name: entry.plugin_id,
                version: '1.0.0',
                description: 'Plugin',
                author: entry.publisher,
                category: entry.marketplace_category,
                type: 'third_party',
                license: 'paid',
                verified: true,
              },
              marketplace: { ...entry, review_count: 0, average_rating: 0 },
            });
            setInstallDialogOpen(true);
          }}
        >
          Install
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Plugin Marketplace
        </Typography>
        <Chip
          icon={<Store />}
          label={`${plugins.length} plugins available`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      ×
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={handleCategoryChange}
                startAdornment={<Category sx={{ mr: 1 }} />}
              >
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button fullWidth variant="outlined" startIcon={<FilterList />}>
              More Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="All Plugins" />
            <Tab label="Featured" />
            <Tab label="Categories" />
          </Tabs>
        </Box>

        {/* All Plugins Tab */}
        <TabPanel value={activeTab} index={0}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {plugins.map(entry => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={entry.plugin_id}>
                  <PluginCard entry={entry} />
                </Grid>
              ))}
              {plugins.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">No plugins found matching your criteria.</Alert>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>

        {/* Featured Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {featuredPlugins.map(entry => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={entry.plugin_id}>
                <PluginCard entry={entry} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Categories Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            {categories.slice(1).map(category => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Discover plugins in this category
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Available plugins</Typography>
                      <Chip label="5" color="primary" size="small" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setActiveTab(0);
                      }}
                    >
                      Browse
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Plugin Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedPlugin && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">{selectedPlugin.plugin.name}</Typography>
                {selectedPlugin.plugin.verified && (
                  <Chip icon={<Verified />} label="Verified" color="success" size="small" />
                )}
              </Box>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="body1" paragraph>
                    {selectedPlugin.plugin.description}
                  </Typography>

                  <Typography variant="h6" gutterBottom>
                    Features
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Advanced analytics and reporting" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Real-time data processing" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="API integration support" />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Plugin Info
                    </Typography>

                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Publisher
                      </Typography>
                      <Typography variant="body1">
                        {selectedPlugin.marketplace.publisher}
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Version
                      </Typography>
                      <Typography variant="body1">{selectedPlugin.plugin.version}</Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Category
                      </Typography>
                      <Typography variant="body1">
                        {selectedPlugin.marketplace.marketplace_category}
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Downloads
                      </Typography>
                      <Typography variant="body1">
                        {selectedPlugin.plugin.downloads || 0}
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Rating
                      </Typography>
                      <Box display="flex" alignItems="center">
                        <Rating
                          value={selectedPlugin.marketplace.average_rating || 0}
                          precision={0.1}
                          size="small"
                          readOnly
                        />
                        <Typography variant="body2" ml={1}>
                          ({selectedPlugin.marketplace.review_count})
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<CloudDownload />}
                onClick={() => {
                  setDetailDialogOpen(false);
                  setInstallDialogOpen(true);
                }}
              >
                Install Plugin
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Installation Confirmation Dialog */}
      <Dialog
        open={installDialogOpen}
        onClose={() => setInstallDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Install Plugin</DialogTitle>
        <DialogContent>
          {selectedPlugin && (
            <Box>
              <Typography variant="body1" paragraph>
                Are you sure you want to install "{selectedPlugin.plugin.name}"?
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                This plugin will have access to the following permissions:
              </Alert>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText primary="Read market data" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText primary="Generate analytics reports" />
                </ListItem>
              </List>

              <Typography variant="h6" color="primary">
                Price: {getPriceDisplay(selectedPlugin.marketplace)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => selectedPlugin && installPlugin(selectedPlugin.plugin.id)}
            disabled={!!installingPlugin}
            startIcon={installingPlugin ? <CircularProgress size={16} /> : <Download />}
          >
            {installingPlugin ? 'Installing...' : 'Install'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Marketplace;
