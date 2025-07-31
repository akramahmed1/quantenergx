import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  CloudQueue,
  Storage,
  Speed,
  Security
} from '@mui/icons-material';

interface RegionStatus {
  region: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  latency: number;
  uptime: number;
  lastCheck: Date;
  services: {
    frontend: boolean;
    backend: boolean;
    database: boolean;
    cache: boolean;
  };
}

interface DisasterRecoveryStatusProps {
  onInitiateFailover?: (region: string) => void;
  onRunHealthCheck?: () => void;
  onViewLogs?: () => void;
}

export const DisasterRecoveryStatus: React.FC<DisasterRecoveryStatusProps> = ({
  onInitiateFailover,
  onRunHealthCheck,
  onViewLogs
}) => {
  const [regions, setRegions] = useState<RegionStatus[]>([
    {
      region: 'us-east-1',
      name: 'US East (Primary)',
      status: 'healthy',
      latency: 45,
      uptime: 99.95,
      lastCheck: new Date(),
      services: { frontend: true, backend: true, database: true, cache: true }
    },
    {
      region: 'eu-west-1',
      name: 'EU West (Secondary)',
      status: 'healthy',
      latency: 120,
      uptime: 99.91,
      lastCheck: new Date(),
      services: { frontend: true, backend: true, database: true, cache: true }
    },
    {
      region: 'ap-southeast-1',
      name: 'Asia Pacific (Tertiary)',
      status: 'healthy',
      latency: 180,
      uptime: 99.89,
      lastCheck: new Date(),
      services: { frontend: true, backend: true, database: true, cache: true }
    }
  ]);

  const [isFailoverDialogOpen, setIsFailoverDialogOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);
  const [lastBackup, setLastBackup] = useState(new Date(Date.now() - 2 * 60 * 60 * 1000)); // 2 hours ago

  useEffect(() => {
    // Simulate real-time status updates
    const interval = setInterval(() => {
      setRegions(prev => prev.map(region => ({
        ...region,
        latency: region.latency + (Math.random() - 0.5) * 20,
        lastCheck: new Date(),
        // Occasionally simulate issues
        status: Math.random() > 0.95 ? 'warning' : region.status
      })));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: RegionStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'critical':
        return <Error color="error" />;
      case 'offline':
        return <Error color="disabled" />;
    }
  };

  const getStatusColor = (status: RegionStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      case 'offline':
        return 'default';
    }
  };

  const handleFailoverClick = (region: string) => {
    setSelectedRegion(region);
    setIsFailoverDialogOpen(true);
  };

  const handleConfirmFailover = () => {
    if (onInitiateFailover) {
      onInitiateFailover(selectedRegion);
    }
    setIsFailoverDialogOpen(false);
    
    // Simulate failover process
    setRegions(prev => prev.map(region => 
      region.region === selectedRegion 
        ? { ...region, status: 'healthy' as const, name: region.name.replace('Secondary', 'Primary').replace('Tertiary', 'Primary') }
        : { ...region, status: 'offline' as const }
    ));
  };

  const handleHealthCheck = async () => {
    if (onRunHealthCheck) {
      onRunHealthCheck();
    }
    
    setIsRunningHealthCheck(true);
    
    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setRegions(prev => prev.map(region => ({
      ...region,
      lastCheck: new Date(),
      status: Math.random() > 0.8 ? 'warning' : 'healthy' as const
    })));
    
    setIsRunningHealthCheck(false);
  };

  const overallHealth = regions.every(r => r.status === 'healthy') ? 'healthy' : 
                      regions.some(r => r.status === 'critical') ? 'critical' : 'warning';

  const activeRegions = regions.filter(r => r.status !== 'offline').length;
  const avgLatency = regions.reduce((sum, r) => sum + r.latency, 0) / regions.length;
  const avgUptime = regions.reduce((sum, r) => sum + r.uptime, 0) / regions.length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom display="flex" alignItems="center" gap={1}>
        <CloudQueue />
        Disaster Recovery Status
      </Typography>

      {/* Overall Status Alert */}
      <Alert 
        severity={overallHealth === 'healthy' ? 'success' : overallHealth === 'warning' ? 'warning' : 'error'}
        sx={{ mb: 3 }}
      >
        System Status: {overallHealth.toUpperCase()} | 
        Active Regions: {activeRegions}/{regions.length} | 
        Avg Latency: {avgLatency.toFixed(0)}ms | 
        Avg Uptime: {avgUptime.toFixed(2)}%
      </Alert>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle color="success" />
                <Typography variant="h6">
                  {activeRegions}/{regions.length}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Active Regions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Speed color="info" />
                <Typography variant="h6">
                  {avgLatency.toFixed(0)}ms
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Average Latency
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <CloudQueue color="primary" />
                <Typography variant="h6">
                  {avgUptime.toFixed(2)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Average Uptime
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Storage color="secondary" />
                <Typography variant="h6">
                  {Math.round((Date.now() - lastBackup.getTime()) / (1000 * 60 * 60))}h
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Last Backup
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Region Status Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Region Status
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Region</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Latency</TableCell>
                  <TableCell>Uptime</TableCell>
                  <TableCell>Services</TableCell>
                  <TableCell>Last Check</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {regions.map((region) => (
                  <TableRow key={region.region}>
                    <TableCell>
                      <Typography variant="subtitle2">{region.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {region.region}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(region.status)}
                        label={region.status.toUpperCase()}
                        color={getStatusColor(region.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{region.latency.toFixed(0)}ms</TableCell>
                    <TableCell>{region.uptime.toFixed(2)}%</TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Chip label="FE" color={region.services.frontend ? 'success' : 'error'} size="small" />
                        <Chip label="BE" color={region.services.backend ? 'success' : 'error'} size="small" />
                        <Chip label="DB" color={region.services.database ? 'success' : 'error'} size="small" />
                        <Chip label="Cache" color={region.services.cache ? 'success' : 'error'} size="small" />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {region.lastCheck.toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {region.status !== 'offline' && !region.name.includes('Primary') && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => handleFailoverClick(region.region)}
                        >
                          Failover
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Control Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Disaster Recovery Controls
          </Typography>
          
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              onClick={handleHealthCheck}
              disabled={isRunningHealthCheck}
              startIcon={isRunningHealthCheck ? <LinearProgress /> : <Security />}
            >
              {isRunningHealthCheck ? 'Running Health Check...' : 'Run Health Check'}
            </Button>
            
            <Button
              variant="outlined"
              color="info"
              onClick={onViewLogs}
              startIcon={<Storage />}
            >
              View Logs
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setLastBackup(new Date())}
              startIcon={<CloudQueue />}
            >
              Trigger Backup
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Failover Confirmation Dialog */}
      <Dialog
        open={isFailoverDialogOpen}
        onClose={() => setIsFailoverDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Disaster Recovery Failover
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will initiate a failover to the selected region. This process is irreversible and will cause temporary service disruption.
          </Alert>
          <Typography>
            Are you sure you want to failover to region: <strong>{selectedRegion}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFailoverDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmFailover} color="warning" variant="contained">
            Confirm Failover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DisasterRecoveryStatus;