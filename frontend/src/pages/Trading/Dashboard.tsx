import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

export const TradingDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Trading Dashboard
      </Typography>
      <Alert severity="info">
        Trading dashboard implementation pending. This will include real-time positions, 
        market data, order management, and portfolio analytics.
      </Alert>
    </Box>
  );
};